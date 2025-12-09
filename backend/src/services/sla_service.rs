// Archer ITSM - SLA Service (Phase 1)
// Service Level Agreement calculation and monitoring

use anyhow::Result;
use chrono::{DateTime, Duration, Utc};
use std::sync::Arc;

use crate::database::Database;
use crate::models::ticket::{
    BusinessHours, EscalationRule, SlaPolicy, SlaStatus, Ticket, TicketPriority, TicketType,
};

// ============================================================================
// SLA SERVICE
// ============================================================================

pub struct SlaService {
    db: Arc<Database>,
}

impl SlaService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    // ========================================================================
    // SLA POLICY MANAGEMENT
    // ========================================================================

    /// Create a new SLA policy
    pub async fn create_sla_policy(&self, policy: SlaPolicy) -> Result<SlaPolicy> {
        let created: Vec<SlaPolicy> = self.db.create("sla_policies").content(policy).await?;
        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("Failed to create SLA policy"))
    }

    /// Get an SLA policy by ID
    pub async fn get_sla_policy(&self, id: &str) -> Result<Option<SlaPolicy>> {
        let policy: Option<SlaPolicy> = self
            .db
            .query(&format!("SELECT * FROM sla_policies:{}", id))
            .await?
            .take(0)?;
        Ok(policy)
    }

    /// Find applicable SLA policy for a ticket
    pub async fn find_applicable_policy(
        &self,
        ticket_type: &TicketType,
        priority: &TicketPriority,
        tenant_id: Option<&str>,
    ) -> Result<Option<SlaPolicy>> {
        // Build query to find matching SLA policy
        let mut conditions = vec!["is_active = true".to_string()];
        
        // Add tenant filter if provided
        if let Some(tid) = tenant_id {
            conditions.push(format!("(tenant_id = tenants:{} OR tenant_id = NONE)", tid));
        }

        let query = format!(
            "SELECT * FROM sla_policies WHERE {} ORDER BY created_at ASC LIMIT 1",
            conditions.join(" AND ")
        );

        let policies: Vec<SlaPolicy> = self.db.query(&query).await?.take(0)?;

        // Filter in-memory by priority and type (SurrealDB array matching is tricky)
        for policy in policies {
            let type_matches = policy.applies_to_types.is_empty()
                || policy.applies_to_types.contains(ticket_type);
            let priority_matches = policy.applies_to_priorities.is_empty()
                || policy.applies_to_priorities.contains(priority);

            if type_matches && priority_matches {
                return Ok(Some(policy));
            }
        }

        Ok(None)
    }

    /// List all SLA policies
    pub async fn list_sla_policies(&self, tenant_id: Option<&str>) -> Result<Vec<SlaPolicy>> {
        let query = if let Some(tid) = tenant_id {
            format!(
                "SELECT * FROM sla_policies WHERE tenant_id = tenants:{} OR tenant_id = NONE ORDER BY name",
                tid
            )
        } else {
            "SELECT * FROM sla_policies ORDER BY name".to_string()
        };

        let policies: Vec<SlaPolicy> = self.db.query(&query).await?.take(0)?;
        Ok(policies)
    }

    // ========================================================================
    // SLA CALCULATION
    // ========================================================================

    /// Calculate SLA due times for a ticket based on applicable policy
    pub async fn calculate_sla_times(
        &self,
        ticket: &Ticket,
    ) -> Result<Option<(DateTime<Utc>, DateTime<Utc>)>> {
        // Find applicable policy - extract tenant ID as string
        let tenant_id_str = ticket.tenant_id.as_ref().map(|t| t.to_string());
        let policy = self
            .find_applicable_policy(
                &ticket.ticket_type,
                &ticket.priority,
                tenant_id_str.as_deref(),
            )
            .await?;

        match policy {
            Some(p) => {
                let now = Utc::now();
                
                // For now, use simple calculation (not accounting for business hours)
                // TODO: Implement business hours calculation
                let response_due = now + Duration::minutes(p.response_target_minutes);
                let resolution_due = now + Duration::minutes(p.resolution_target_minutes);

                Ok(Some((response_due, resolution_due)))
            }
            None => Ok(None),
        }
    }

    /// Calculate SLA times with business hours consideration
    pub async fn calculate_sla_times_with_business_hours(
        &self,
        start_time: DateTime<Utc>,
        target_minutes: i64,
        business_hours: &BusinessHours,
    ) -> Result<DateTime<Utc>> {
        // Simplified implementation - in production, this would properly calculate
        // business hours by iterating through working days and times
        
        let mut remaining_minutes = target_minutes;
        let mut current_time = start_time;

        // For MVP, just add the minutes directly
        // TODO: Implement proper business hours calculation
        let due_time = current_time + Duration::minutes(remaining_minutes);

        Ok(due_time)
    }

    /// Get current SLA status for a ticket
    pub fn get_sla_status(&self, ticket: &Ticket) -> SlaStatus {
        let now = Utc::now();

        let response_breached = match (ticket.response_due, ticket.first_response_at) {
            (Some(due), None) => now > due,
            (Some(due), Some(responded)) => responded > due,
            _ => false,
        };

        let resolution_breached = match (ticket.resolution_due, ticket.resolved_at) {
            (Some(due), None) if !ticket.status.is_terminal() => now > due,
            (Some(due), Some(resolved)) => resolved > due,
            _ => false,
        };

        let response_time_remaining = ticket.response_due.map(|due| {
            if ticket.first_response_at.is_some() {
                0
            } else {
                (due - now).num_minutes()
            }
        });

        let resolution_time_remaining = ticket.resolution_due.map(|due| {
            if ticket.status.is_terminal() {
                0
            } else {
                (due - now).num_minutes()
            }
        });

        SlaStatus {
            response_due: ticket.response_due,
            resolution_due: ticket.resolution_due,
            response_breached,
            resolution_breached,
            response_time_remaining_minutes: response_time_remaining,
            resolution_time_remaining_minutes: resolution_time_remaining,
        }
    }

    // ========================================================================
    // SLA BREACH HANDLING
    // ========================================================================

    /// Check and process SLA breaches for all active tickets
    pub async fn check_all_sla_breaches(&self) -> Result<Vec<BreachNotification>> {
        let now = Utc::now();
        let mut notifications = Vec::new();

        // Query tickets that are close to or past SLA breach
        let query = r#"
            SELECT * FROM ticket 
            WHERE status NOT IN ['CLOSED', 'CANCELLED', 'RESOLVED']
            AND (
                (response_due IS NOT NONE AND first_response_at IS NONE)
                OR (resolution_due IS NOT NONE)
            )
            ORDER BY resolution_due ASC
        "#;

        let tickets: Vec<Ticket> = self.db.query(query).await?.take(0)?;

        for ticket in tickets {
            // Check response SLA
            if let Some(response_due) = ticket.response_due {
                if ticket.first_response_at.is_none() {
                    let time_remaining = (response_due - now).num_minutes();
                    
                    if time_remaining <= 0 {
                        notifications.push(BreachNotification {
                            ticket_id: ticket.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                            breach_type: BreachType::ResponseBreached,
                            minutes_overdue: -time_remaining,
                        });
                    } else if time_remaining <= 30 {
                        notifications.push(BreachNotification {
                            ticket_id: ticket.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                            breach_type: BreachType::ResponseWarning,
                            minutes_overdue: time_remaining,
                        });
                    }
                }
            }

            // Check resolution SLA
            if let Some(resolution_due) = ticket.resolution_due {
                let time_remaining = (resolution_due - now).num_minutes();
                
                if time_remaining <= 0 {
                    notifications.push(BreachNotification {
                        ticket_id: ticket.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                        breach_type: BreachType::ResolutionBreached,
                        minutes_overdue: -time_remaining,
                    });
                } else if time_remaining <= 60 {
                    notifications.push(BreachNotification {
                        ticket_id: ticket.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                        breach_type: BreachType::ResolutionWarning,
                        minutes_overdue: time_remaining,
                    });
                }
            }
        }

        Ok(notifications)
    }

    /// Process escalations for an SLA policy
    pub async fn process_escalations(
        &self,
        ticket: &Ticket,
        policy: &SlaPolicy,
    ) -> Result<Vec<EscalationAction>> {
        let now = Utc::now();
        let mut actions = Vec::new();

        // Get SLA status
        let status = self.get_sla_status(ticket);

        // Check each escalation rule
        for rule in &policy.escalation_rules {
            let should_escalate = if let Some(resolution_remaining) = status.resolution_time_remaining_minutes {
                let total_minutes = policy.resolution_target_minutes;
                let elapsed_percent = ((total_minutes - resolution_remaining) * 100 / total_minutes) as u8;
                elapsed_percent >= rule.trigger_at_percent
            } else {
                false
            };

            if should_escalate {
                // Create notification actions
                for user_id in &rule.notify_users {
                    actions.push(EscalationAction::NotifyUser {
                        user_id: user_id.clone(),
                        message: format!(
                            "SLA escalation for ticket {}: {}% of SLA time elapsed",
                            ticket.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                            rule.trigger_at_percent
                        ),
                    });
                }

                // Reassignment action
                if let Some(reassign_to) = &rule.reassign_to {
                    actions.push(EscalationAction::Reassign {
                        new_assignee: reassign_to.clone(),
                    });
                }
            }
        }

        Ok(actions)
    }

    // ========================================================================
    // BUSINESS HOURS MANAGEMENT
    // ========================================================================

    /// Create business hours configuration
    pub async fn create_business_hours(&self, hours: BusinessHours) -> Result<BusinessHours> {
        let created: Vec<BusinessHours> = self.db.create("business_hours").content(hours).await?;
        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("Failed to create business hours"))
    }

    /// Get business hours by ID
    pub async fn get_business_hours(&self, id: &str) -> Result<Option<BusinessHours>> {
        let hours: Option<BusinessHours> = self
            .db
            .query(&format!("SELECT * FROM business_hours:{}", id))
            .await?
            .take(0)?;
        Ok(hours)
    }

    /// Get default business hours
    pub async fn get_default_business_hours(&self) -> Result<Option<BusinessHours>> {
        let hours: Vec<BusinessHours> = self
            .db
            .query("SELECT * FROM business_hours WHERE is_default = true LIMIT 1")
            .await?
            .take(0)?;
        Ok(hours.into_iter().next())
    }

    // ========================================================================
    // SEED DEFAULT SLA POLICIES
    // ========================================================================

    /// Seed default SLA policies (for initial setup)
    pub async fn seed_default_policies(&self) -> Result<()> {
        // Check if policies already exist
        let existing: Vec<SlaPolicy> = self
            .db
            .query("SELECT * FROM sla_policies WHERE name = 'P1 - Critical' LIMIT 1")
            .await?
            .take(0)?;

        if !existing.is_empty() {
            println!("ℹ️ SLA policies already exist, skipping seed");
            return Ok(());
        }

        let now = Utc::now();

        // P1 - Critical (1 hour response, 4 hour resolution)
        let p1_policy = SlaPolicy {
            id: None,
            name: "P1 - Critical".to_string(),
            description: Some("Critical incidents affecting business operations".to_string()),
            response_target_minutes: 60,
            resolution_target_minutes: 240,
            applies_to_priorities: vec![TicketPriority::P1],
            applies_to_types: vec![TicketType::Incident],
            business_hours_id: None,
            is_active: true,
            escalation_rules: vec![
                EscalationRule {
                    trigger_at_percent: 50,
                    notify_users: vec![],
                    notify_groups: vec!["service_managers".to_string()],
                    reassign_to: None,
                },
                EscalationRule {
                    trigger_at_percent: 80,
                    notify_users: vec![],
                    notify_groups: vec!["management".to_string()],
                    reassign_to: None,
                },
            ],
            created_at: now,
            updated_at: now,
            tenant_id: None,
        };

        // P2 - High (4 hour response, 24 hour resolution)
        let p2_policy = SlaPolicy {
            id: None,
            name: "P2 - High".to_string(),
            description: Some("High priority incidents with significant impact".to_string()),
            response_target_minutes: 240,
            resolution_target_minutes: 1440,
            applies_to_priorities: vec![TicketPriority::P2],
            applies_to_types: vec![TicketType::Incident, TicketType::Problem],
            business_hours_id: None,
            is_active: true,
            escalation_rules: vec![EscalationRule {
                trigger_at_percent: 75,
                notify_users: vec![],
                notify_groups: vec!["service_managers".to_string()],
                reassign_to: None,
            }],
            created_at: now,
            updated_at: now,
            tenant_id: None,
        };

        // P3 - Normal (8 hour response, 72 hour resolution)
        let p3_policy = SlaPolicy {
            id: None,
            name: "P3 - Normal".to_string(),
            description: Some("Normal priority requests".to_string()),
            response_target_minutes: 480,
            resolution_target_minutes: 4320,
            applies_to_priorities: vec![TicketPriority::P3],
            applies_to_types: vec![],
            business_hours_id: None,
            is_active: true,
            escalation_rules: vec![],
            created_at: now,
            updated_at: now,
            tenant_id: None,
        };

        // P4 - Low (24 hour response, 7 day resolution)
        let p4_policy = SlaPolicy {
            id: None,
            name: "P4 - Low".to_string(),
            description: Some("Low priority requests".to_string()),
            response_target_minutes: 1440,
            resolution_target_minutes: 10080,
            applies_to_priorities: vec![TicketPriority::P4],
            applies_to_types: vec![],
            business_hours_id: None,
            is_active: true,
            escalation_rules: vec![],
            created_at: now,
            updated_at: now,
            tenant_id: None,
        };

        // Create policies
        for policy in [p1_policy, p2_policy, p3_policy, p4_policy] {
            match self.create_sla_policy(policy).await {
                Ok(_) => println!("✅ Created SLA policy"),
                Err(e) => println!("⚠️ SLA policy creation failed: {}", e),
            }
        }

        println!("✅ Default SLA policies seeded");
        Ok(())
    }
}

// ============================================================================
// SUPPORT TYPES
// ============================================================================

#[derive(Debug, Clone)]
pub struct BreachNotification {
    pub ticket_id: String,
    pub breach_type: BreachType,
    pub minutes_overdue: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub enum BreachType {
    ResponseWarning,
    ResponseBreached,
    ResolutionWarning,
    ResolutionBreached,
}

#[derive(Debug, Clone)]
pub enum EscalationAction {
    NotifyUser { user_id: String, message: String },
    NotifyGroup { group_id: String, message: String },
    Reassign { new_assignee: String },
}
