// Archer ITSM - Tiering Service
// Hot/Cold data tiering for high-performance ticket management

use anyhow::{anyhow, Result};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use surrealdb::sql::Thing;
use tracing::{info, warn, error};

use crate::database::Database;

// ============================================================================
// TIER CONFIGURATION
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TierConfig {
    /// Days before moving HOT → WARM (closed tickets only)
    pub hot_to_warm_days: u32,
    /// Days before moving WARM → COLD (archived)
    pub warm_to_cold_days: u32,
    /// Years to retain cold tier data
    pub cold_retention_years: u32,
    /// Statuses that keep tickets in hot tier
    pub hot_statuses: Vec<String>,
    /// Whether to auto-reheat on direct access
    pub auto_reheat_enabled: bool,
    /// Whether to reheat on viewing ticket details
    pub reheat_on_view: bool,
    /// Whether to reheat when ticket appears in search results
    pub reheat_on_search: bool,
    /// Hours before same ticket can be reheated again
    pub reheat_cooldown_hours: u32,
    /// Batch size for archival operations
    pub batch_size: u32,
    /// Hour of day to run archival (0-23)
    pub archive_hour: u32,
}

impl Default for TierConfig {
    fn default() -> Self {
        Self {
            hot_to_warm_days: 7,
            warm_to_cold_days: 90,
            cold_retention_years: 7,
            hot_statuses: vec![
                "NEW".to_string(),
                "ASSIGNED".to_string(),
                "IN_PROGRESS".to_string(),
                "ON_HOLD".to_string(),
                "PENDING_CUSTOMER".to_string(),
                "PENDING_VENDOR".to_string(),
            ],
            auto_reheat_enabled: true,
            reheat_on_view: true,
            reheat_on_search: false,
            reheat_cooldown_hours: 24,
            batch_size: 500,
            archive_hour: 3,
        }
    }
}

// ============================================================================
// TIER ENUM
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum TicketTier {
    #[serde(rename = "hot")]
    Hot,
    #[serde(rename = "warm")]
    Warm,
    #[serde(rename = "cold")]
    Cold,
}

impl std::fmt::Display for TicketTier {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TicketTier::Hot => write!(f, "hot"),
            TicketTier::Warm => write!(f, "warm"),
            TicketTier::Cold => write!(f, "cold"),
        }
    }
}

impl From<String> for TicketTier {
    fn from(s: String) -> Self {
        match s.to_lowercase().as_str() {
            "hot" => TicketTier::Hot,
            "warm" => TicketTier::Warm,
            "cold" => TicketTier::Cold,
            _ => TicketTier::Hot,
        }
    }
}

// ============================================================================
// ARCHIVED TICKET MODEL
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketArchive {
    pub id: Option<Thing>,
    pub original_id: String,
    pub namespace: Option<String>,
    pub number: Option<i32>,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub ticket_type: String,
    pub status: String,
    pub priority: String,
    pub urgency: Option<String>,
    pub impact: Option<String>,
    pub assignee: Option<String>,
    pub assigned_group: Option<String>,
    pub created_by: String,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub source: Option<String>,
    pub tags: Vec<String>,
    pub custom_fields: Option<serde_json::Value>,
    
    // Original timestamps
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub closed_at: Option<DateTime<Utc>>,
    
    // Archive metadata
    pub archived_at: DateTime<Utc>,
    pub archive_reason: String,
    pub original_tier: String,
    pub total_access_count: i32,
    pub last_accessed_before_archive: DateTime<Utc>,
    
    // Denormalized summary
    pub comment_count: i32,
    pub attachment_count: i32,
    pub history_snapshot: Vec<serde_json::Value>,
    
    // Reheat tracking
    pub reheated_count: i32,
    pub last_reheated_at: Option<DateTime<Utc>>,
}

// ============================================================================
// TIERING OPERATION LOG
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TieringOperation {
    pub id: Option<Thing>,
    pub operation_type: String,  // "archive", "reheat", "transition"
    pub ticket_id: String,
    pub ticket_number: Option<i32>,
    pub from_tier: String,
    pub to_tier: String,
    pub reason: String,
    pub triggered_by: String,  // "scheduler", "user:xxx", "access_pattern"
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

// ============================================================================
// TIERING STATISTICS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TieringStats {
    pub hot_count: i64,
    pub warm_count: i64,
    pub cold_count: i64,
    pub total_count: i64,
    
    pub archival_rate_daily: i64,
    pub reheat_rate_daily: i64,
    
    pub last_archival_run: Option<DateTime<Utc>>,
    pub next_archival_run: Option<DateTime<Utc>>,
}

// ============================================================================
// ARCHIVAL REPORT
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchivalReport {
    pub processed: usize,
    pub archived: usize,
    pub transitioned_to_warm: usize,
    pub errors: Vec<(String, String)>,
    pub timestamp: DateTime<Utc>,
    pub duration_ms: u64,
}

// ============================================================================
// TIERING SERVICE
// ============================================================================

pub struct TieringService {
    db: Arc<Database>,
    config: TierConfig,
}

impl TieringService {
    pub fn new(db: Arc<Database>) -> Self {
        Self {
            db,
            config: TierConfig::default(),
        }
    }

    pub fn with_config(db: Arc<Database>, config: TierConfig) -> Self {
        Self { db, config }
    }

    // ========================================================================
    // TIER TRANSITION: HOT → WARM
    // ========================================================================

    /// Transition closed tickets from hot to warm tier
    pub async fn transition_hot_to_warm(&self) -> Result<usize> {
        let cutoff_date = Utc::now() - Duration::days(self.config.hot_to_warm_days as i64);
        
        // Find tickets that should move to warm tier
        // Criteria: closed/cancelled/resolved AND last_accessed > cutoff
        let query = r#"
            UPDATE ticket SET 
                tier = 'warm',
                updated_at = time::now()
            WHERE tier = 'hot'
              AND status IN ['CLOSED', 'CANCELLED', 'RESOLVED']
              AND last_accessed_at < $cutoff
            RETURN BEFORE
        "#;
        
        let result: Vec<serde_json::Value> = self.db
            .query(query)
            .bind(("cutoff", cutoff_date))
            .await?
            .take(0)?;
        
        let count = result.len();
        
        if count > 0 {
            info!("Transitioned {} tickets from hot to warm tier", count);
            
            // Log operations
            for ticket in &result {
                if let Some(id) = ticket.get("id").and_then(|v| v.as_str()) {
                    let _ = self.log_operation(
                        "transition",
                        id,
                        None,
                        "hot",
                        "warm",
                        "age_policy",
                        "scheduler",
                    ).await;
                }
            }
        }
        
        Ok(count)
    }

    // ========================================================================
    // ARCHIVAL: WARM → COLD
    // ========================================================================

    /// Run the main archival job - moves warm tickets to cold archive
    pub async fn run_archival_job(&self) -> Result<ArchivalReport> {
        let start = std::time::Instant::now();
        let cutoff_date = Utc::now() - Duration::days(self.config.warm_to_cold_days as i64);
        
        info!("Starting archival job. Cutoff date: {}", cutoff_date);
        
        // Find archival candidates
        let candidates: Vec<serde_json::Value> = self.db
            .query(r#"
                SELECT * FROM ticket 
                WHERE tier = 'warm'
                  AND status IN ['CLOSED', 'CANCELLED', 'RESOLVED']
                  AND last_accessed_at < $cutoff
                LIMIT $batch_size
            "#)
            .bind(("cutoff", cutoff_date))
            .bind(("batch_size", self.config.batch_size))
            .await?
            .take(0)?;
        
        let mut archived_count = 0;
        let mut errors = vec![];
        
        for ticket_json in &candidates {
            let ticket_id = ticket_json
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("unknown")
                .to_string();
            
            match self.archive_single_ticket(&ticket_id).await {
                Ok(_) => archived_count += 1,
                Err(e) => {
                    warn!("Failed to archive ticket {}: {:?}", ticket_id, e);
                    errors.push((ticket_id, e.to_string()));
                }
            }
        }
        
        let duration = start.elapsed();
        let report = ArchivalReport {
            processed: candidates.len(),
            archived: archived_count,
            transitioned_to_warm: 0,
            errors,
            timestamp: Utc::now(),
            duration_ms: duration.as_millis() as u64,
        };
        
        info!(
            "Archival job complete: {} processed, {} archived, {} errors in {}ms",
            report.processed,
            report.archived,
            report.errors.len(),
            report.duration_ms
        );
        
        Ok(report)
    }

    /// Archive a single ticket to cold storage
    async fn archive_single_ticket(&self, ticket_id: &str) -> Result<()> {
        // Get the ticket
        let ticket: Option<serde_json::Value> = self.db
            .query("SELECT * FROM ticket WHERE id = $id")
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        let ticket = ticket.ok_or_else(|| anyhow!("Ticket not found: {}", ticket_id))?;
        
        // Get comment count
        let comment_count: i32 = self.db
            .query(r#"
                SELECT count() as cnt FROM ticket_comments 
                WHERE ticket_id = $id 
                GROUP ALL
            "#)
            .bind(("id", ticket_id))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0) as i32;
        
        // Get attachment count
        let attachment_count: i32 = self.db
            .query(r#"
                SELECT count() as cnt FROM ticket_attachments 
                WHERE ticket_id = $id 
                GROUP ALL
            "#)
            .bind(("id", ticket_id))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0) as i32;
        
        // Get last 10 history entries
        let history_snapshot: Vec<serde_json::Value> = self.db
            .query(r#"
                SELECT * FROM ticket_history 
                WHERE ticket_id = $id 
                ORDER BY created_at DESC 
                LIMIT 10
            "#)
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        // Create archive record
        let archive_record = serde_json::json!({
            "original_id": ticket_id,
            "namespace": ticket.get("namespace"),
            "number": ticket.get("number"),
            "title": ticket.get("title"),
            "description": ticket.get("description"),
            "type": ticket.get("type"),
            "status": ticket.get("status"),
            "priority": ticket.get("priority"),
            "urgency": ticket.get("urgency"),
            "impact": ticket.get("impact"),
            "assignee": ticket.get("assignee"),
            "assigned_group": ticket.get("assigned_group"),
            "created_by": ticket.get("created_by"),
            "category": ticket.get("category"),
            "subcategory": ticket.get("subcategory"),
            "source": ticket.get("source"),
            "tags": ticket.get("tags").cloned().unwrap_or(serde_json::json!([])),
            "custom_fields": ticket.get("custom_fields"),
            "created_at": ticket.get("created_at"),
            "updated_at": ticket.get("updated_at"),
            "resolved_at": ticket.get("resolved_at"),
            "closed_at": ticket.get("closed_at"),
            "archived_at": Utc::now(),
            "archive_reason": "age_policy",
            "original_tier": ticket.get("tier").and_then(|v| v.as_str()).unwrap_or("warm"),
            "total_access_count": ticket.get("access_count").and_then(|v| v.as_i64()).unwrap_or(0),
            "last_accessed_before_archive": ticket.get("last_accessed_at"),
            "comment_count": comment_count,
            "attachment_count": attachment_count,
            "history_snapshot": history_snapshot,
            "reheated_count": ticket.get("reheated_count").and_then(|v| v.as_i64()).unwrap_or(0),
            "last_reheated_at": ticket.get("last_reheated_at"),
        });
        
        // Insert into archive
        let _: Vec<serde_json::Value> = self.db
            .create("ticket_archive")
            .content(archive_record)
            .await?;
        
        // Archive comments
        self.db
            .query(r#"
                INSERT INTO ticket_comments_archive 
                SELECT *, time::now() AS archived_at, id AS original_id 
                FROM ticket_comments 
                WHERE ticket_id = $id
            "#)
            .bind(("id", ticket_id))
            .await?;
        
        // Delete from hot tables
        self.db
            .query("DELETE FROM ticket_comments WHERE ticket_id = $id")
            .bind(("id", ticket_id))
            .await?;
        
        self.db
            .query("DELETE FROM ticket_history WHERE ticket_id = $id")
            .bind(("id", ticket_id))
            .await?;
        
        self.db
            .query("DELETE FROM ticket WHERE id = $id")
            .bind(("id", ticket_id))
            .await?;
        
        // Log the operation
        self.log_operation(
            "archive",
            ticket_id,
            ticket.get("number").and_then(|v| v.as_i64()).map(|n| n as i32),
            "warm",
            "cold",
            "age_policy",
            "scheduler",
        ).await?;
        
        Ok(())
    }

    // ========================================================================
    // REHEAT: COLD → HOT
    // ========================================================================

    /// Reheat a ticket from cold archive back to hot tier
    pub async fn reheat_ticket(&self, ticket_id: &str, triggered_by: &str) -> Result<serde_json::Value> {
        // Check if ticket is in archive
        let archived: Option<serde_json::Value> = self.db
            .query("SELECT * FROM ticket_archive WHERE original_id = $id")
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        let archived = archived.ok_or_else(|| anyhow!("Ticket not found in archive: {}", ticket_id))?;
        
        // Check reheat cooldown
        if let Some(last_reheated) = archived.get("last_reheated_at").and_then(|v| v.as_str()) {
            if let Ok(last_reheated_dt) = last_reheated.parse::<DateTime<Utc>>() {
                let cooldown = Duration::hours(self.config.reheat_cooldown_hours as i64);
                if Utc::now() - last_reheated_dt < cooldown {
                    info!("Ticket {} is in reheat cooldown period", ticket_id);
                    // Return archived data without reheat
                    return Ok(archived);
                }
            }
        }
        
        let now = Utc::now();
        let reheated_count = archived
            .get("reheated_count")
            .and_then(|v| v.as_i64())
            .unwrap_or(0) + 1;
        
        // Restore ticket to hot table
        let restored_ticket = serde_json::json!({
            "id": archived.get("original_id"),
            "namespace": archived.get("namespace"),
            "number": archived.get("number"),
            "title": archived.get("title"),
            "description": archived.get("description"),
            "type": archived.get("type"),
            "status": archived.get("status"),
            "priority": archived.get("priority"),
            "urgency": archived.get("urgency"),
            "impact": archived.get("impact"),
            "assignee": archived.get("assignee"),
            "assigned_group": archived.get("assigned_group"),
            "created_by": archived.get("created_by"),
            "category": archived.get("category"),
            "subcategory": archived.get("subcategory"),
            "source": archived.get("source"),
            "tags": archived.get("tags"),
            "custom_fields": archived.get("custom_fields"),
            "created_at": archived.get("created_at"),
            "updated_at": now,
            "resolved_at": archived.get("resolved_at"),
            "closed_at": archived.get("closed_at"),
            "tier": "hot",
            "last_accessed_at": now,
            "access_count": archived.get("total_access_count").and_then(|v| v.as_i64()).unwrap_or(0) + 1,
            "reheated_count": reheated_count,
            "last_reheated_at": now,
            "archived_at": serde_json::Value::Null,
            "archive_reason": serde_json::Value::Null,
        });
        
        // Insert restored ticket
        let _: Vec<serde_json::Value> = self.db
            .create("ticket")
            .content(restored_ticket.clone())
            .await?;
        
        // Restore comments from archive
        self.db
            .query(r#"
                INSERT INTO ticket_comments 
                SELECT *, 'hot' AS tier 
                FROM ticket_comments_archive 
                WHERE original_ticket_id = $id
            "#)
            .bind(("id", ticket_id))
            .await?;
        
        // Delete from archive tables
        self.db
            .query("DELETE FROM ticket_archive WHERE original_id = $id")
            .bind(("id", ticket_id))
            .await?;
        
        self.db
            .query("DELETE FROM ticket_comments_archive WHERE original_ticket_id = $id")
            .bind(("id", ticket_id))
            .await?;
        
        // Log the operation
        let number = archived.get("number").and_then(|v| v.as_i64()).map(|n| n as i32);
        self.log_operation(
            "reheat",
            ticket_id,
            number,
            "cold",
            "hot",
            "user_access",
            triggered_by,
        ).await?;
        
        info!("Reheated ticket {} from cold to hot tier (reheat #{})", ticket_id, reheated_count);
        
        Ok(restored_ticket)
    }

    // ========================================================================
    // ACCESS TRACKING
    // ========================================================================

    /// Record an access to a ticket (for tiering decisions)
    pub async fn record_access(&self, ticket_id: &str) -> Result<()> {
        self.db
            .query(r#"
                UPDATE ticket SET 
                    last_accessed_at = time::now(),
                    access_count = access_count + 1
                WHERE id = $id
            "#)
            .bind(("id", ticket_id))
            .await?;
        
        Ok(())
    }

    /// Handle status change for tier adjustments
    pub async fn on_status_change(&self, ticket_id: &str, new_status: &str) -> Result<()> {
        let is_hot_status = self.config.hot_statuses.contains(&new_status.to_string());
        let new_tier = if is_hot_status { "hot" } else { "warm" };
        
        // Get current tier
        let current: Option<serde_json::Value> = self.db
            .query("SELECT tier FROM ticket WHERE id = $id")
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        let current_tier = current
            .and_then(|v| v.get("tier").and_then(|t| t.as_str().map(|s| s.to_string())))
            .unwrap_or_else(|| "hot".to_string());
        
        // Only update if tier is changing
        if current_tier != new_tier {
            self.db
                .query(r#"
                    UPDATE ticket SET 
                        tier = $tier,
                        last_accessed_at = time::now()
                    WHERE id = $id
                "#)
                .bind(("id", ticket_id))
                .bind(("tier", new_tier))
                .await?;
            
            self.log_operation(
                "transition",
                ticket_id,
                None,
                &current_tier,
                new_tier,
                "status_change",
                "system",
            ).await?;
            
            info!("Ticket {} transitioned from {} to {} due to status change", ticket_id, current_tier, new_tier);
        }
        
        Ok(())
    }

    // ========================================================================
    // STATISTICS
    // ========================================================================

    /// Get tiering statistics
    pub async fn get_stats(&self, namespace: Option<&str>) -> Result<TieringStats> {
        let namespace_filter = namespace
            .map(|ns| format!("AND namespace = '{}'", ns))
            .unwrap_or_default();
        
        // Count by tier
        let hot_count: i64 = self.db
            .query(&format!(r#"
                SELECT count() as cnt FROM ticket 
                WHERE tier = 'hot' {}
                GROUP ALL
            "#, namespace_filter))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0);
        
        let warm_count: i64 = self.db
            .query(&format!(r#"
                SELECT count() as cnt FROM ticket 
                WHERE tier = 'warm' {}
                GROUP ALL
            "#, namespace_filter))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0);
        
        let cold_count: i64 = self.db
            .query(&format!(r#"
                SELECT count() as cnt FROM ticket_archive {}
                GROUP ALL
            "#, if namespace.is_some() { format!("WHERE namespace = '{}'", namespace.unwrap()) } else { String::new() }))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0);
        
        // Get daily rates from last 24 hours
        let yesterday = Utc::now() - Duration::days(1);
        
        let archival_rate: i64 = self.db
            .query(r#"
                SELECT count() as cnt FROM tiering_operations 
                WHERE operation_type = 'archive' 
                  AND created_at > $since
                GROUP ALL
            "#)
            .bind(("since", yesterday))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0);
        
        let reheat_rate: i64 = self.db
            .query(r#"
                SELECT count() as cnt FROM tiering_operations 
                WHERE operation_type = 'reheat' 
                  AND created_at > $since
                GROUP ALL
            "#)
            .bind(("since", yesterday))
            .await?
            .take::<Option<serde_json::Value>>(0)?
            .and_then(|v| v.get("cnt").and_then(|c| c.as_i64()))
            .unwrap_or(0);
        
        // Get last archival run
        let last_archival_result: Option<serde_json::Value> = self.db
            .query(r#"
                SELECT created_at FROM tiering_operations 
                WHERE operation_type = 'archive' 
                ORDER BY created_at DESC 
                LIMIT 1
            "#)
            .await?
            .take(0)?;
        
        let last_archival: Option<DateTime<Utc>> = last_archival_result
            .and_then(|v| v.get("created_at").and_then(|c| c.as_str()).map(|s| s.to_string()))
            .and_then(|s| s.parse().ok());
        
        // Calculate next archival run (same time tomorrow if last run exists)
        let next_archival = last_archival.map(|last| last + Duration::days(1));
        
        Ok(TieringStats {
            hot_count,
            warm_count,
            cold_count,
            total_count: hot_count + warm_count + cold_count,
            archival_rate_daily: archival_rate,
            reheat_rate_daily: reheat_rate,
            last_archival_run: last_archival,
            next_archival_run: next_archival,
        })
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    /// Log a tiering operation
    async fn log_operation(
        &self,
        operation_type: &str,
        ticket_id: &str,
        ticket_number: Option<i32>,
        from_tier: &str,
        to_tier: &str,
        reason: &str,
        triggered_by: &str,
    ) -> Result<()> {
        let operation = TieringOperation {
            id: None,
            operation_type: operation_type.to_string(),
            ticket_id: ticket_id.to_string(),
            ticket_number,
            from_tier: from_tier.to_string(),
            to_tier: to_tier.to_string(),
            reason: reason.to_string(),
            triggered_by: triggered_by.to_string(),
            metadata: None,
            created_at: Utc::now(),
        };
        
        let _: Vec<TieringOperation> = self.db
            .create("tiering_operations")
            .content(operation)
            .await?;
        
        Ok(())
    }

    /// Check if a ticket exists in the archive
    pub async fn is_archived(&self, ticket_id: &str) -> Result<bool> {
        let result: Option<serde_json::Value> = self.db
            .query("SELECT id FROM ticket_archive WHERE original_id = $id LIMIT 1")
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        Ok(result.is_some())
    }

    /// Get ticket from archive without reheating
    pub async fn get_from_archive(&self, ticket_id: &str) -> Result<Option<TicketArchive>> {
        let archived: Option<TicketArchive> = self.db
            .query("SELECT * FROM ticket_archive WHERE original_id = $id")
            .bind(("id", ticket_id))
            .await?
            .take(0)?;
        
        Ok(archived)
    }

    /// Search across all tiers
    pub async fn search_all_tiers(
        &self,
        query: &str,
        namespace: Option<&str>,
        include_archived: bool,
    ) -> Result<Vec<serde_json::Value>> {
        let mut results = vec![];
        
        let namespace_filter = namespace
            .map(|ns| format!("AND namespace = '{}'", ns))
            .unwrap_or_default();
        
        // Search hot/warm tier
        let hot_results: Vec<serde_json::Value> = self.db
            .query(&format!(r#"
                SELECT *, 'hot' AS served_from_tier FROM ticket 
                WHERE (title CONTAINS $query OR description CONTAINS $query)
                {}
                LIMIT 50
            "#, namespace_filter))
            .bind(("query", query))
            .await?
            .take(0)?;
        
        results.extend(hot_results);
        
        // Search cold tier if requested
        if include_archived {
            let cold_results: Vec<serde_json::Value> = self.db
                .query(&format!(r#"
                    SELECT *, 'cold' AS served_from_tier FROM ticket_archive 
                    WHERE (title CONTAINS $query OR description CONTAINS $query)
                    {}
                    LIMIT 50
                "#, if namespace.is_some() { format!("AND namespace = '{}'", namespace.unwrap()) } else { String::new() }))
                .bind(("query", query))
                .await?
                .take(0)?;
            
            results.extend(cold_results);
        }
        
        Ok(results)
    }
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tier_config_defaults() {
        let config = TierConfig::default();
        assert_eq!(config.hot_to_warm_days, 7);
        assert_eq!(config.warm_to_cold_days, 90);
        assert_eq!(config.cold_retention_years, 7);
        assert!(config.auto_reheat_enabled);
    }

    #[test]
    fn test_ticket_tier_from_string() {
        assert_eq!(TicketTier::from("hot".to_string()), TicketTier::Hot);
        assert_eq!(TicketTier::from("warm".to_string()), TicketTier::Warm);
        assert_eq!(TicketTier::from("cold".to_string()), TicketTier::Cold);
        assert_eq!(TicketTier::from("unknown".to_string()), TicketTier::Hot); // Default
    }

    #[test]
    fn test_ticket_tier_display() {
        assert_eq!(format!("{}", TicketTier::Hot), "hot");
        assert_eq!(format!("{}", TicketTier::Warm), "warm");
        assert_eq!(format!("{}", TicketTier::Cold), "cold");
    }
}
