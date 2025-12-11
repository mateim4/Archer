// Archer ITSM - Monitoring Service (Phase 4)
// Alert processing, auto-ticket creation, and alert lifecycle management

use anyhow::{anyhow, Result};
use chrono::Utc;
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::database::Database;
use crate::middleware::auth::AuthenticatedUser;
use crate::models::monitoring::{
    Alert, AlertRule, AlertSeverity, AlertStatus, AcknowledgeAlertRequest, CreateAlertRequest,
    CreateTicketFromAlertRequest, ResolveAlertRequest,
};
use crate::models::ticket::{
    CreateTicketRequest, TicketImpact, TicketSource, TicketType, TicketUrgency,
};
use crate::services::ticket_service::TicketService;

// ============================================================================
// MONITORING SERVICE
// ============================================================================

pub struct MonitoringService {
    db: Arc<Database>,
    ticket_service: TicketService,
}

impl MonitoringService {
    pub fn new(db: Arc<Database>) -> Self {
        let ticket_service = TicketService::new(db.clone());
        Self { db, ticket_service }
    }

    // ========================================================================
    // ALERT OPERATIONS
    // ========================================================================

    /// Create a new alert
    pub async fn create_alert(
        &self,
        request: CreateAlertRequest,
        user: &AuthenticatedUser,
    ) -> Result<Alert> {
        let now = Utc::now();

        // Parse affected CI if provided
        let affected_ci_id = request
            .affected_ci_id
            .and_then(|id| parse_thing(&id));

        let alert = Alert {
            id: None,
            title: request.title,
            description: request.description,
            severity: request.severity.clone(),
            status: AlertStatus::Active,
            source: request.source,
            source_alert_id: request.source_alert_id,
            affected_ci_id,
            metric_name: request.metric_name,
            metric_value: request.metric_value,
            threshold: request.threshold,
            created_at: now,
            acknowledged_at: None,
            acknowledged_by: None,
            resolved_at: None,
            resolved_by: None,
            auto_ticket_id: None,
            tags: request.tags,
        };

        // Check for duplicate alerts
        if let Some(existing) = self.check_duplicate_alert(&alert).await? {
            return Ok(existing);
        }

        // Create the alert
        let created: Vec<Alert> = self.db.create("alert").content(alert).await?;
        let mut created_alert = created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("Failed to create alert"))?;

        // Check if auto-ticket creation is enabled for this severity/source
        if let Some(ticket_id) = self.auto_create_ticket(&created_alert, user).await? {
            created_alert.auto_ticket_id = Some(ticket_id);
            self.update_alert_ticket_link(&created_alert).await?;
        }

        Ok(created_alert)
    }

    /// Get alert by ID
    pub async fn get_alert(&self, alert_id: &str) -> Result<Alert> {
        let thing = parse_thing(alert_id).ok_or_else(|| anyhow!("Invalid alert ID"))?;
        let alert: Option<Alert> = self.db.select(thing).await?;
        alert.ok_or_else(|| anyhow!("Alert not found"))
    }

    /// List alerts with filters
    pub async fn list_alerts(
        &self,
        severity: Option<Vec<AlertSeverity>>,
        status: Option<Vec<AlertStatus>>,
        source: Option<String>,
        affected_ci_id: Option<String>,
        tags: Option<Vec<String>>,
        search: Option<String>,
        page: u32,
        page_size: u32,
    ) -> Result<(Vec<Alert>, u64)> {
        let mut query = "SELECT * FROM alert WHERE 1=1".to_string();
        let mut params: HashMap<String, serde_json::Value> = HashMap::new();

        // Build query conditions
        if let Some(severities) = severity {
            let severity_strs: Vec<String> = severities
                .iter()
                .map(|s| format!("{:?}", s))
                .collect();
            query.push_str(" AND severity IN $severities");
            params.insert("severities".to_string(), serde_json::json!(severity_strs));
        }

        if let Some(statuses) = status {
            let status_strs: Vec<String> = statuses
                .iter()
                .map(|s| format!("{:?}", s))
                .collect();
            query.push_str(" AND status IN $statuses");
            params.insert("statuses".to_string(), serde_json::json!(status_strs));
        }

        if let Some(src) = source {
            query.push_str(" AND source = $source");
            params.insert("source".to_string(), serde_json::json!(src));
        }

        if let Some(ci_id) = affected_ci_id {
            if let Some(thing) = parse_thing(&ci_id) {
                query.push_str(" AND affected_ci_id = $affected_ci_id");
                params.insert("affected_ci_id".to_string(), serde_json::json!(thing.to_string()));
            }
        }

        if let Some(tag_list) = tags {
            query.push_str(" AND tags CONTAINSANY $tags");
            params.insert("tags".to_string(), serde_json::json!(tag_list));
        }

        if let Some(search_term) = search {
            query.push_str(" AND (title CONTAINS $search OR description CONTAINS $search)");
            params.insert("search".to_string(), serde_json::json!(search_term));
        }

        // Add pagination
        query.push_str(" ORDER BY created_at DESC");
        let offset = page * page_size;
        query.push_str(&format!(" LIMIT {} START {}", page_size, offset));

        // Execute query
        let mut response = self.db.query(&query);
        for (key, value) in params {
            response = response.bind((key, value));
        }
        let mut result = response.await?;
        let alerts: Vec<Alert> = result.take(0)?;

        // Get total count
        let count_query = "SELECT count() FROM alert GROUP ALL".to_string();
        let mut count_response = self.db.query(&count_query).await?;
        let count_result: Option<serde_json::Value> = count_response.take(0)?;
        let total = count_result
            .and_then(|v| v.get("count").and_then(|c| c.as_u64()))
            .unwrap_or(0);

        Ok((alerts, total))
    }

    /// Acknowledge an alert
    pub async fn acknowledge_alert(
        &self,
        alert_id: &str,
        request: AcknowledgeAlertRequest,
    ) -> Result<Alert> {
        let thing = parse_thing(alert_id).ok_or_else(|| anyhow!("Invalid alert ID"))?;
        let now = Utc::now();

        // Update alert status
        let query = "UPDATE $alert_id SET 
            status = $status, 
            acknowledged_at = $acknowledged_at, 
            acknowledged_by = $acknowledged_by";

        let mut response = self
            .db
            .query(query)
            .bind(("alert_id", thing.clone()))
            .bind(("status", format!("{:?}", AlertStatus::Acknowledged)))
            .bind(("acknowledged_at", now))
            .bind(("acknowledged_by", request.acknowledged_by))
            .await?;

        let updated: Option<Alert> = response.take(0)?;
        updated.ok_or_else(|| anyhow!("Failed to acknowledge alert"))
    }

    /// Resolve an alert
    pub async fn resolve_alert(
        &self,
        alert_id: &str,
        request: ResolveAlertRequest,
    ) -> Result<Alert> {
        let thing = parse_thing(alert_id).ok_or_else(|| anyhow!("Invalid alert ID"))?;
        let now = Utc::now();

        // Update alert status
        let query = "UPDATE $alert_id SET 
            status = $status, 
            resolved_at = $resolved_at, 
            resolved_by = $resolved_by";

        let mut response = self
            .db
            .query(query)
            .bind(("alert_id", thing.clone()))
            .bind(("status", format!("{:?}", AlertStatus::Resolved)))
            .bind(("resolved_at", now))
            .bind(("resolved_by", request.resolved_by))
            .await?;

        let updated: Option<Alert> = response.take(0)?;
        updated.ok_or_else(|| anyhow!("Failed to resolve alert"))
    }

    /// Create a ticket from an alert
    pub async fn create_ticket_from_alert(
        &self,
        alert_id: &str,
        request: CreateTicketFromAlertRequest,
        user: &AuthenticatedUser,
    ) -> Result<Thing> {
        let alert = self.get_alert(alert_id).await?;

        // Check if ticket already exists
        if alert.auto_ticket_id.is_some() {
            return Err(anyhow!("Ticket already created for this alert"));
        }

        // Map severity to impact/urgency
        let (impact, urgency) = match alert.severity {
            AlertSeverity::Critical => (Some(TicketImpact::High), Some(TicketUrgency::High)),
            AlertSeverity::High => (Some(TicketImpact::High), Some(TicketUrgency::Medium)),
            AlertSeverity::Medium => (Some(TicketImpact::Medium), Some(TicketUrgency::Medium)),
            AlertSeverity::Low => (Some(TicketImpact::Low), Some(TicketUrgency::Low)),
            AlertSeverity::Info => (Some(TicketImpact::Low), Some(TicketUrgency::Low)),
        };

        // Build ticket description
        let mut description = alert.description.clone();
        if let Some(metric) = &alert.metric_name {
            description.push_str(&format!("\n\nMetric: {}", metric));
            if let Some(value) = alert.metric_value {
                description.push_str(&format!("\nValue: {}", value));
            }
            if let Some(threshold) = alert.threshold {
                description.push_str(&format!("\nThreshold: {}", threshold));
            }
        }
        if let Some(notes) = &request.additional_notes {
            description.push_str(&format!("\n\nAdditional Notes: {}", notes));
        }

        // Create ticket request
        let ticket_request = CreateTicketRequest {
            title: alert.title.clone(),
            description: Some(description),
            ticket_type: TicketType::Incident,
            priority: alert.severity.to_ticket_priority(),
            related_asset: alert.affected_ci_id.as_ref().map(|t| t.to_string()),
            related_project: None,
            assignee: request.assignee,
            created_by: user.user_id.clone(),
            impact,
            urgency,
            source: Some(TicketSource::Monitoring),
            category: Some("Infrastructure".to_string()),
            subcategory: Some("Monitoring Alert".to_string()),
            assigned_group: request.assigned_group,
            tags: alert.tags.clone(),
            watchers: vec![],
            custom_fields: Some(serde_json::json!({
                "alert_id": alert_id,
                "alert_source": alert.source,
                "source_alert_id": alert.source_alert_id,
            })),
            assignment_team_id: None,
        };

        // Create the ticket
        let ticket_response = self.ticket_service.create_ticket(ticket_request, user).await?;
        let ticket_id = ticket_response
            .ticket
            .id
            .ok_or_else(|| anyhow!("Ticket created without ID"))?;

        // Update alert with ticket link
        let alert_thing = parse_thing(alert_id).ok_or_else(|| anyhow!("Invalid alert ID"))?;
        let _: Option<Alert> = self
            .db
            .query("UPDATE $alert_id SET auto_ticket_id = $ticket_id")
            .bind(("alert_id", alert_thing))
            .bind(("ticket_id", ticket_id.clone()))
            .await?
            .take(0)?;

        Ok(ticket_id)
    }

    // ========================================================================
    // ALERT RULE OPERATIONS
    // ========================================================================

    /// Create an alert rule
    pub async fn create_alert_rule(
        &self,
        name: String,
        description: Option<String>,
        metric_query: String,
        condition: crate::models::monitoring::AlertCondition,
        threshold: f64,
        severity: AlertSeverity,
        auto_create_ticket: bool,
        ticket_template: Option<serde_json::Value>,
        cooldown_minutes: i32,
    ) -> Result<AlertRule> {
        let now = Utc::now();

        let rule = AlertRule {
            id: None,
            name,
            description,
            metric_query,
            condition,
            threshold,
            severity,
            auto_create_ticket,
            ticket_template,
            is_active: true,
            cooldown_minutes,
            created_at: now,
            updated_at: now,
        };

        let created: Vec<AlertRule> = self.db.create("alert_rule").content(rule).await?;
        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("Failed to create alert rule"))
    }

    /// Get all alert rules
    pub async fn list_alert_rules(&self) -> Result<Vec<AlertRule>> {
        let rules: Vec<AlertRule> = self.db.select("alert_rule").await?;
        Ok(rules)
    }

    /// Get alert rule by ID
    pub async fn get_alert_rule(&self, rule_id: &str) -> Result<AlertRule> {
        let thing = parse_thing(rule_id).ok_or_else(|| anyhow!("Invalid rule ID"))?;
        let rule: Option<AlertRule> = self.db.select(thing).await?;
        rule.ok_or_else(|| anyhow!("Alert rule not found"))
    }

    /// Update an alert rule
    pub async fn update_alert_rule(
        &self,
        rule_id: &str,
        name: Option<String>,
        description: Option<String>,
        metric_query: Option<String>,
        condition: Option<crate::models::monitoring::AlertCondition>,
        threshold: Option<f64>,
        severity: Option<AlertSeverity>,
        auto_create_ticket: Option<bool>,
        ticket_template: Option<serde_json::Value>,
        is_active: Option<bool>,
        cooldown_minutes: Option<i32>,
    ) -> Result<AlertRule> {
        let thing = parse_thing(rule_id).ok_or_else(|| anyhow!("Invalid rule ID"))?;
        let now = Utc::now();

        let mut updates: HashMap<String, serde_json::Value> = HashMap::new();
        updates.insert("updated_at".to_string(), serde_json::json!(now));

        if let Some(n) = name {
            updates.insert("name".to_string(), serde_json::json!(n));
        }
        if let Some(d) = description {
            updates.insert("description".to_string(), serde_json::json!(d));
        }
        if let Some(q) = metric_query {
            updates.insert("metric_query".to_string(), serde_json::json!(q));
        }
        if let Some(c) = condition {
            updates.insert("condition".to_string(), serde_json::json!(format!("{:?}", c)));
        }
        if let Some(t) = threshold {
            updates.insert("threshold".to_string(), serde_json::json!(t));
        }
        if let Some(s) = severity {
            updates.insert("severity".to_string(), serde_json::json!(format!("{:?}", s)));
        }
        if let Some(a) = auto_create_ticket {
            updates.insert("auto_create_ticket".to_string(), serde_json::json!(a));
        }
        if let Some(tt) = ticket_template {
            updates.insert("ticket_template".to_string(), tt);
        }
        if let Some(ia) = is_active {
            updates.insert("is_active".to_string(), serde_json::json!(ia));
        }
        if let Some(cm) = cooldown_minutes {
            updates.insert("cooldown_minutes".to_string(), serde_json::json!(cm));
        }

        let updated: Option<AlertRule> = self
            .db
            .update(thing)
            .merge(updates)
            .await?;

        updated.ok_or_else(|| anyhow!("Failed to update alert rule"))
    }

    /// Delete an alert rule
    pub async fn delete_alert_rule(&self, rule_id: &str) -> Result<()> {
        let thing = parse_thing(rule_id).ok_or_else(|| anyhow!("Invalid rule ID"))?;
        let _: Option<AlertRule> = self.db.delete(thing).await?;
        Ok(())
    }

    // ========================================================================
    // PRIVATE HELPER METHODS
    // ========================================================================

    /// Check for duplicate alerts (same source + source_alert_id)
    async fn check_duplicate_alert(&self, alert: &Alert) -> Result<Option<Alert>> {
        if let Some(source_alert_id) = &alert.source_alert_id {
            let query = "SELECT * FROM alert WHERE source = $source AND source_alert_id = $source_alert_id AND status != $resolved LIMIT 1";
            let mut response = self
                .db
                .query(query)
                .bind(("source", &alert.source))
                .bind(("source_alert_id", source_alert_id))
                .bind(("resolved", format!("{:?}", AlertStatus::Resolved)))
                .await?;

            let existing: Option<Alert> = response.take(0)?;
            Ok(existing)
        } else {
            Ok(None)
        }
    }

    /// Auto-create ticket if rule is configured
    async fn auto_create_ticket(
        &self,
        alert: &Alert,
        user: &AuthenticatedUser,
    ) -> Result<Option<Thing>> {
        // Check if there's a matching rule with auto_create_ticket enabled
        let query = "SELECT * FROM alert_rule WHERE severity = $severity AND auto_create_ticket = true AND is_active = true LIMIT 1";
        let mut response = self
            .db
            .query(query)
            .bind(("severity", format!("{:?}", alert.severity)))
            .await?;

        let rule: Option<AlertRule> = response.take(0)?;

        if rule.is_some() {
            // Create ticket
            let alert_id = alert.id.as_ref().map(|t| t.to_string())
                .ok_or_else(|| anyhow!("Alert has no ID"))?;
            
            let request = CreateTicketFromAlertRequest {
                assignee: None,
                assigned_group: None,
                additional_notes: Some("Auto-created from alert rule".to_string()),
            };

            match self.create_ticket_from_alert(&alert_id, request, user).await {
                Ok(ticket_id) => Ok(Some(ticket_id)),
                Err(e) => {
                    tracing::warn!("Failed to auto-create ticket from alert: {}", e);
                    Ok(None)
                }
            }
        } else {
            Ok(None)
        }
    }

    /// Update alert with ticket link
    async fn update_alert_ticket_link(&self, alert: &Alert) -> Result<()> {
        if let (Some(alert_id), Some(ticket_id)) = (&alert.id, &alert.auto_ticket_id) {
            let _: Option<Alert> = self
                .db
                .query("UPDATE $alert_id SET auto_ticket_id = $ticket_id")
                .bind(("alert_id", alert_id.clone()))
                .bind(("ticket_id", ticket_id.clone()))
                .await?
                .take(0)?;
        }
        Ok(())
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Parse a string ID into a SurrealDB Thing
fn parse_thing(id: &str) -> Option<Thing> {
    // Handle both "table:id" and just "id" formats
    if id.contains(':') {
        id.parse().ok()
    } else {
        // Try to infer table name or return None
        None
    }
}
