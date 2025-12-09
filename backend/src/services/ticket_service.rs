// Archer ITSM - Ticket Service (Phase 1)
// Enhanced ticket operations with state machine, history, and comments

use anyhow::{anyhow, Result};
use chrono::Utc;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::database::Database;
use crate::middleware::auth::AuthenticatedUser;
use crate::models::ticket::{
    CommentType, CreateCommentRequest, CreateTicketRequest, HistoryChangeType, SlaStatus,
    Ticket, TicketComment, TicketHistory, TicketResponse, TicketStatus, TransitionTicketRequest,
    UpdateTicketRequest,
};
use crate::services::sla_service::SlaService;

// ============================================================================
// TICKET SERVICE
// ============================================================================

pub struct TicketService {
    db: Arc<Database>,
    sla_service: SlaService,
}

impl TicketService {
    pub fn new(db: Arc<Database>) -> Self {
        let sla_service = SlaService::new(db.clone());
        Self { db, sla_service }
    }

    // ========================================================================
    // TICKET CRUD OPERATIONS
    // ========================================================================

    /// Create a new ticket with SLA assignment
    pub async fn create_ticket(
        &self,
        request: CreateTicketRequest,
        user: &AuthenticatedUser,
    ) -> Result<TicketResponse> {
        let now = Utc::now();

        // Build ticket
        let mut ticket = Ticket {
            id: None,
            title: request.title,
            description: request.description,
            ticket_type: request.ticket_type.clone(),
            priority: request.priority.clone(),
            status: TicketStatus::New,
            related_asset: request.related_asset.and_then(|id| parse_thing(&id)),
            related_project: request.related_project.and_then(|id| parse_thing(&id)),
            assignee: request.assignee,
            created_by: user.user_id.clone(),
            created_at: now,
            updated_at: now,
            sla_policy_id: None,
            sla_breach_at: None,
            response_due: None,
            resolution_due: None,
            response_sla_met: None,
            resolution_sla_met: None,
            first_response_at: None,
            resolved_at: None,
            closed_at: None,
            watchers: request.watchers,
            tags: request.tags,
            custom_fields: request.custom_fields,
            impact: request.impact,
            urgency: request.urgency,
            source: request.source,
            category: request.category,
            subcategory: request.subcategory,
            assigned_group: request.assigned_group,
            tenant_id: user.tenant_id.as_ref().and_then(|t| parse_thing(t)),
        };

        // Calculate SLA times
        if let Ok(Some((response_due, resolution_due))) =
            self.sla_service.calculate_sla_times(&ticket).await
        {
            ticket.response_due = Some(response_due);
            ticket.resolution_due = Some(resolution_due);
            ticket.sla_breach_at = Some(resolution_due);
        }

        // Create the ticket
        let created: Vec<Ticket> = self.db.create("ticket").content(ticket.clone()).await?;
        let created_ticket = created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("Failed to create ticket"))?;

        // Create initial history entry
        self.create_history_entry(
            created_ticket.id.as_ref().unwrap(),
            "ticket",
            None,
            Some(&format!("Ticket created: {}", created_ticket.title)),
            &user.user_id,
            &user.username,
            HistoryChangeType::Create,
        )
        .await?;

        // Return full ticket response
        self.get_ticket_response(&created_ticket).await
    }

    /// Get a ticket by ID with full details
    pub async fn get_ticket(&self, id: &str) -> Result<Option<TicketResponse>> {
        let ticket_thing = parse_thing_or_ticket(id)?;

        let ticket: Option<Ticket> = self.db.select(ticket_thing).await?;

        match ticket {
            Some(t) => Ok(Some(self.get_ticket_response(&t).await?)),
            None => Ok(None),
        }
    }

    /// Update a ticket with field tracking
    pub async fn update_ticket(
        &self,
        id: &str,
        request: UpdateTicketRequest,
        user: &AuthenticatedUser,
    ) -> Result<TicketResponse> {
        let ticket_thing = parse_thing_or_ticket(id)?;

        // Get existing ticket
        let existing: Option<Ticket> = self.db.select(ticket_thing.clone()).await?;
        let mut ticket = existing.ok_or_else(|| anyhow!("Ticket not found"))?;

        // Track changes for history
        let mut changes = Vec::new();

        // Apply updates
        if let Some(title) = request.title {
            if title != ticket.title {
                changes.push(("title", ticket.title.clone(), title.clone()));
                ticket.title = title;
            }
        }

        if let Some(description) = request.description {
            if ticket.description.as_ref() != Some(&description) {
                changes.push((
                    "description",
                    ticket.description.clone().unwrap_or_default(),
                    description.clone(),
                ));
                ticket.description = Some(description);
            }
        }

        if let Some(priority) = request.priority {
            if priority != ticket.priority {
                changes.push((
                    "priority",
                    format!("{:?}", ticket.priority),
                    format!("{:?}", priority),
                ));
                ticket.priority = priority;
            }
        }

        if let Some(assignee) = request.assignee {
            let old_assignee = ticket.assignee.clone().unwrap_or_default();
            if old_assignee != assignee {
                changes.push(("assignee", old_assignee, assignee.clone()));
                ticket.assignee = Some(assignee);
            }
        }

        if let Some(impact) = request.impact {
            ticket.impact = Some(impact);
        }

        if let Some(urgency) = request.urgency {
            ticket.urgency = Some(urgency);
        }

        if let Some(category) = request.category {
            ticket.category = Some(category);
        }

        if let Some(subcategory) = request.subcategory {
            ticket.subcategory = Some(subcategory);
        }

        if let Some(assigned_group) = request.assigned_group {
            ticket.assigned_group = Some(assigned_group);
        }

        if let Some(tags) = request.tags {
            ticket.tags = tags;
        }

        if let Some(custom_fields) = request.custom_fields {
            ticket.custom_fields = Some(custom_fields);
        }

        // Handle status change separately (uses state machine)
        if let Some(new_status) = request.status {
            if new_status != ticket.status {
                self.transition_status(&mut ticket, new_status, user, None)
                    .await?;
            }
        }

        ticket.updated_at = Utc::now();

        // Update ticket in database
        let updated: Option<Ticket> = self.db.update(ticket_thing).content(ticket.clone()).await?;
        let updated_ticket = updated.ok_or_else(|| anyhow!("Failed to update ticket"))?;

        // Create history entries for changes
        for (field, old_value, new_value) in changes {
            self.create_history_entry(
                updated_ticket.id.as_ref().unwrap(),
                field,
                Some(&old_value),
                Some(&new_value),
                &user.user_id,
                &user.username,
                HistoryChangeType::Update,
            )
            .await?;
        }

        self.get_ticket_response(&updated_ticket).await
    }

    // ========================================================================
    // STATE MACHINE
    // ========================================================================

    /// Transition a ticket to a new status with validation
    pub async fn transition_ticket(
        &self,
        id: &str,
        request: TransitionTicketRequest,
        user: &AuthenticatedUser,
    ) -> Result<TicketResponse> {
        let ticket_thing = parse_thing_or_ticket(id)?;

        let existing: Option<Ticket> = self.db.select(ticket_thing.clone()).await?;
        let mut ticket = existing.ok_or_else(|| anyhow!("Ticket not found"))?;

        // Perform transition
        self.transition_status(&mut ticket, request.target_status, user, request.comment.as_deref())
            .await?;

        ticket.updated_at = Utc::now();

        // Update ticket
        let updated: Option<Ticket> = self.db.update(ticket_thing).content(ticket.clone()).await?;
        let updated_ticket = updated.ok_or_else(|| anyhow!("Failed to update ticket"))?;

        self.get_ticket_response(&updated_ticket).await
    }

    /// Internal method to transition status with all side effects
    async fn transition_status(
        &self,
        ticket: &mut Ticket,
        target_status: TicketStatus,
        user: &AuthenticatedUser,
        comment: Option<&str>,
    ) -> Result<()> {
        // Validate transition
        if !ticket.status.can_transition_to(&target_status) {
            return Err(anyhow!(
                "Invalid status transition from {:?} to {:?}. Valid transitions: {:?}",
                ticket.status,
                target_status,
                ticket.status.valid_transitions()
            ));
        }

        let old_status = ticket.status.clone();
        let now = Utc::now();

        // Handle special transitions
        match &target_status {
            TicketStatus::Assigned | TicketStatus::InProgress => {
                // Mark first response if not already set
                if ticket.first_response_at.is_none() {
                    ticket.first_response_at = Some(now);
                    ticket.response_sla_met = ticket.response_due.map(|due| now <= due);
                }
            }
            TicketStatus::Resolved => {
                ticket.resolved_at = Some(now);
                ticket.resolution_sla_met = ticket.resolution_due.map(|due| now <= due);
            }
            TicketStatus::Closed => {
                ticket.closed_at = Some(now);
            }
            _ => {}
        }

        ticket.status = target_status.clone();

        // Create history entry
        if let Some(ticket_id) = &ticket.id {
            self.create_history_entry(
                ticket_id,
                "status",
                Some(&format!("{:?}", old_status)),
                Some(&format!("{:?}", target_status)),
                &user.user_id,
                &user.username,
                HistoryChangeType::StatusChange,
            )
            .await?;

            // Add comment if provided
            if let Some(comment_text) = comment {
                self.add_comment(
                    &ticket_id.to_string(),
                    CreateCommentRequest {
                        content: comment_text.to_string(),
                        is_internal: true,
                        comment_type: Some(CommentType::StatusUpdate),
                    },
                    user,
                )
                .await?;
            }
        }

        Ok(())
    }

    // ========================================================================
    // COMMENTS
    // ========================================================================

    /// Add a comment to a ticket
    pub async fn add_comment(
        &self,
        ticket_id: &str,
        request: CreateCommentRequest,
        user: &AuthenticatedUser,
    ) -> Result<TicketComment> {
        let ticket_thing = parse_thing_or_ticket(ticket_id)?;
        let now = Utc::now();

        let comment = TicketComment {
            id: None,
            ticket_id: ticket_thing.clone(),
            content: request.content,
            author_id: user.user_id.clone(),
            author_name: user.username.clone(),
            is_internal: request.is_internal,
            comment_type: request.comment_type.unwrap_or(CommentType::Note),
            attachments: vec![],
            created_at: now,
            updated_at: now,
        };

        let created: Vec<TicketComment> =
            self.db.create("ticket_comments").content(comment).await?;
        let created_comment = created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("Failed to create comment"))?;

        // Create history entry
        self.create_history_entry(
            &ticket_thing,
            "comment",
            None,
            Some(&format!("Comment added by {}", user.username)),
            &user.user_id,
            &user.username,
            HistoryChangeType::Comment,
        )
        .await?;

        Ok(created_comment)
    }

    /// Get comments for a ticket
    pub async fn get_ticket_comments(
        &self,
        ticket_id: &str,
        include_internal: bool,
    ) -> Result<Vec<TicketComment>> {
        let ticket_thing = parse_thing_or_ticket(ticket_id)?;

        let query = if include_internal {
            format!(
                "SELECT * FROM ticket_comments WHERE ticket_id = {} ORDER BY created_at ASC",
                ticket_thing
            )
        } else {
            format!(
                "SELECT * FROM ticket_comments WHERE ticket_id = {} AND is_internal = false ORDER BY created_at ASC",
                ticket_thing
            )
        };

        let comments: Vec<TicketComment> = self.db.query(&query).await?.take(0)?;
        Ok(comments)
    }

    // ========================================================================
    // WATCHERS
    // ========================================================================

    /// Add a watcher to a ticket
    pub async fn add_watcher(&self, ticket_id: &str, user_id: &str) -> Result<Ticket> {
        let ticket_thing = parse_thing_or_ticket(ticket_id)?;

        let existing: Option<Ticket> = self.db.select(ticket_thing.clone()).await?;
        let mut ticket = existing.ok_or_else(|| anyhow!("Ticket not found"))?;

        if !ticket.watchers.contains(&user_id.to_string()) {
            ticket.watchers.push(user_id.to_string());
            ticket.updated_at = Utc::now();

            let updated: Option<Ticket> = self.db.update(ticket_thing).content(ticket).await?;
            return updated.ok_or_else(|| anyhow!("Failed to add watcher"));
        }

        Ok(ticket)
    }

    /// Remove a watcher from a ticket
    pub async fn remove_watcher(&self, ticket_id: &str, user_id: &str) -> Result<Ticket> {
        let ticket_thing = parse_thing_or_ticket(ticket_id)?;

        let existing: Option<Ticket> = self.db.select(ticket_thing.clone()).await?;
        let mut ticket = existing.ok_or_else(|| anyhow!("Ticket not found"))?;

        ticket.watchers.retain(|w| w != user_id);
        ticket.updated_at = Utc::now();

        let updated: Option<Ticket> = self.db.update(ticket_thing).content(ticket).await?;
        updated.ok_or_else(|| anyhow!("Failed to remove watcher"))
    }

    // ========================================================================
    // HISTORY
    // ========================================================================

    /// Get history for a ticket
    pub async fn get_ticket_history(&self, ticket_id: &str) -> Result<Vec<TicketHistory>> {
        let ticket_thing = parse_thing_or_ticket(ticket_id)?;

        let query = format!(
            "SELECT * FROM ticket_history WHERE ticket_id = {} ORDER BY created_at DESC",
            ticket_thing
        );

        let history: Vec<TicketHistory> = self.db.query(&query).await?.take(0)?;
        Ok(history)
    }

    /// Create a history entry
    async fn create_history_entry(
        &self,
        ticket_id: &Thing,
        field_name: &str,
        old_value: Option<&str>,
        new_value: Option<&str>,
        changed_by: &str,
        changed_by_name: &str,
        change_type: HistoryChangeType,
    ) -> Result<TicketHistory> {
        let history = TicketHistory {
            id: None,
            ticket_id: ticket_id.clone(),
            field_name: field_name.to_string(),
            old_value: old_value.map(String::from),
            new_value: new_value.map(String::from),
            changed_by: changed_by.to_string(),
            changed_by_name: changed_by_name.to_string(),
            change_type,
            created_at: Utc::now(),
        };

        let created: Vec<TicketHistory> =
            self.db.create("ticket_history").content(history).await?;
        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow!("Failed to create history entry"))
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /// Build full ticket response with comments, history, and SLA status
    async fn get_ticket_response(&self, ticket: &Ticket) -> Result<TicketResponse> {
        let ticket_id = ticket
            .id
            .as_ref()
            .map(|t| t.to_string())
            .unwrap_or_default();

        let comments = self.get_ticket_comments(&ticket_id, true).await?;
        let history = self.get_ticket_history(&ticket_id).await?;
        let sla_status = self.sla_service.get_sla_status(ticket);

        Ok(TicketResponse {
            ticket: ticket.clone(),
            comments,
            history,
            sla_status: Some(sla_status),
        })
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn parse_thing(id: &str) -> Option<Thing> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Some(Thing::from((parts[0], parts[1])))
    } else {
        None
    }
}

fn parse_thing_or_ticket(id: &str) -> Result<Thing> {
    let parts: Vec<&str> = id.split(':').collect();
    if parts.len() == 2 {
        Ok(Thing::from((parts[0], parts[1])))
    } else {
        Ok(Thing::from(("ticket", id)))
    }
}
