// Archer ITSM - SLA API Module
// REST API endpoints for SLA policy management

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{delete, get, post, put},
    Json, Router,
};
use std::sync::Arc;

use crate::database::AppState;
use crate::middleware::rbac::{check_admin, check_tickets_read};
use crate::models::ticket::{EscalationRule, SlaPolicy, TicketPriority, TicketType};
use crate::services::sla_service::SlaService;
use crate::utils::api_response::{helpers, ApiResponse};

// ============================================================================
// SLA ROUTER
// ============================================================================

pub fn create_sla_router(state: AppState) -> Router {
    let read_router = Router::new()
        .route("/policies", get(list_sla_policies))
        .route("/policies/:id", get(get_sla_policy))
        .route("/tickets/:id/sla-status", get(get_ticket_sla_status))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            check_tickets_read,
        ));

    let write_router = Router::new()
        .route("/policies", post(create_sla_policy))
        .route("/policies/:id", put(update_sla_policy))
        .route("/policies/:id", delete(delete_sla_policy))
        .route_layer(axum::middleware::from_fn_with_state(
            state.clone(),
            check_admin,
        ));

    read_router.merge(write_router).with_state(state)
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct CreateSlaPolicyRequest {
    pub name: String,
    pub description: Option<String>,
    pub response_target_minutes: i64,
    pub resolution_target_minutes: i64,
    pub applies_to_priorities: Vec<TicketPriority>,
    pub applies_to_types: Vec<TicketType>,
    pub business_hours_id: Option<String>,
    pub is_active: bool,
    pub escalation_rules: Vec<EscalationRule>,
}

#[derive(Debug, serde::Deserialize, serde::Serialize)]
pub struct UpdateSlaPolicyRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub response_target_minutes: Option<i64>,
    pub resolution_target_minutes: Option<i64>,
    pub applies_to_priorities: Option<Vec<TicketPriority>>,
    pub applies_to_types: Option<Vec<TicketType>>,
    pub business_hours_id: Option<String>,
    pub is_active: Option<bool>,
    pub escalation_rules: Option<Vec<EscalationRule>>,
}

#[derive(Debug, serde::Serialize)]
pub struct SlaStatusResponse {
    pub response_due: Option<String>,
    pub resolution_due: Option<String>,
    pub response_breached: bool,
    pub resolution_breached: bool,
    pub response_time_remaining_minutes: Option<i64>,
    pub resolution_time_remaining_minutes: Option<i64>,
    pub policy_name: Option<String>,
}

// ============================================================================
// API HANDLERS
// ============================================================================

/// List all SLA policies
async fn list_sla_policies(
    State(state): State<AppState>,
) -> ApiResponse<Vec<SlaPolicy>> {
    let sla_service = SlaService::new(state.db.clone());

    match sla_service.list_sla_policies(None).await {
        Ok(policies) => helpers::ok(policies),
        Err(e) => {
            eprintln!("Failed to list SLA policies: {}", e);
            helpers::internal_error("Failed to list SLA policies")
        }
    }
}

/// Get a single SLA policy by ID
async fn get_sla_policy(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResponse<SlaPolicy> {
    let sla_service = SlaService::new(state.db.clone());

    match sla_service.get_sla_policy(&id).await {
        Ok(Some(policy)) => helpers::ok(policy),
        Ok(None) => helpers::not_found(&format!("SLA policy {} not found", id)),
        Err(e) => {
            eprintln!("Failed to get SLA policy: {}", e);
            helpers::internal_error("Failed to get SLA policy")
        }
    }
}

/// Create a new SLA policy
async fn create_sla_policy(
    State(state): State<AppState>,
    Json(req): Json<CreateSlaPolicyRequest>,
) -> ApiResponse<SlaPolicy> {
    let sla_service = SlaService::new(state.db.clone());

    let now = chrono::Utc::now();
    let policy = SlaPolicy {
        id: None,
        name: req.name,
        description: req.description,
        response_target_minutes: req.response_target_minutes,
        resolution_target_minutes: req.resolution_target_minutes,
        applies_to_priorities: req.applies_to_priorities,
        applies_to_types: req.applies_to_types,
        business_hours_id: req.business_hours_id.and_then(|id| {
            if id.is_empty() {
                None
            } else {
                Some(surrealdb::sql::Thing::from(("business_hours".to_string(), id)))
            }
        }),
        is_active: req.is_active,
        escalation_rules: req.escalation_rules,
        created_at: now,
        updated_at: now,
        tenant_id: None, // TODO: Extract from auth context
    };

    match sla_service.create_sla_policy(policy).await {
        Ok(created) => helpers::created(created),
        Err(e) => {
            eprintln!("Failed to create SLA policy: {}", e);
            helpers::internal_error("Failed to create SLA policy")
        }
    }
}

/// Update an existing SLA policy
async fn update_sla_policy(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateSlaPolicyRequest>,
) -> ApiResponse<SlaPolicy> {
    let sla_service = SlaService::new(state.db.clone());

    // Get existing policy
    let existing = match sla_service.get_sla_policy(&id).await {
        Ok(Some(policy)) => policy,
        Ok(None) => return helpers::not_found(&format!("SLA policy {} not found", id)),
        Err(e) => {
            eprintln!("Failed to get SLA policy: {}", e);
            return helpers::internal_error("Failed to get SLA policy");
        }
    };

    // Apply updates
    let updated = SlaPolicy {
        id: existing.id,
        name: req.name.unwrap_or(existing.name),
        description: req.description.or(existing.description),
        response_target_minutes: req
            .response_target_minutes
            .unwrap_or(existing.response_target_minutes),
        resolution_target_minutes: req
            .resolution_target_minutes
            .unwrap_or(existing.resolution_target_minutes),
        applies_to_priorities: req
            .applies_to_priorities
            .unwrap_or(existing.applies_to_priorities),
        applies_to_types: req.applies_to_types.unwrap_or(existing.applies_to_types),
        business_hours_id: req
            .business_hours_id
            .map(|id| {
                if id.is_empty() {
                    None
                } else {
                    Some(surrealdb::sql::Thing::from(("business_hours".to_string(), id)))
                }
            })
            .unwrap_or(existing.business_hours_id),
        is_active: req.is_active.unwrap_or(existing.is_active),
        escalation_rules: req.escalation_rules.unwrap_or(existing.escalation_rules),
        created_at: existing.created_at,
        updated_at: chrono::Utc::now(),
        tenant_id: existing.tenant_id,
    };

    // Update in database
    let query = format!(
        "UPDATE sla_policies:{} CONTENT $policy",
        id
    );
    match state.db.query(query).bind(("policy", &updated)).await {
        Ok(mut response) => {
            let result: Option<SlaPolicy> = response.take(0).ok().flatten();
            match result {
                Some(policy) => helpers::ok(policy),
                None => helpers::internal_error("Failed to update SLA policy"),
            }
        }
        Err(e) => {
            eprintln!("Failed to update SLA policy: {}", e);
            helpers::internal_error("Failed to update SLA policy")
        }
    }
}

/// Delete an SLA policy
async fn delete_sla_policy(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResponse<()> {
    let query = format!("DELETE sla_policies:{}", id);

    match state.db.query(query).await {
        Ok(_) => helpers::no_content(),
        Err(e) => {
            eprintln!("Failed to delete SLA policy: {}", e);
            helpers::internal_error("Failed to delete SLA policy")
        }
    }
}

/// Get SLA status for a specific ticket
async fn get_ticket_sla_status(
    State(state): State<AppState>,
    Path(ticket_id): Path<String>,
) -> ApiResponse<SlaStatusResponse> {
    use crate::models::ticket::Ticket;

    // Fetch ticket
    let query = format!("SELECT * FROM ticket:{}", ticket_id);
    let mut response = match state.db.query(query).await {
        Ok(r) => r,
        Err(e) => {
            eprintln!("Failed to query ticket: {}", e);
            return helpers::internal_error("Failed to query ticket");
        }
    };

    let ticket: Option<Ticket> = match response.take(0) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("Failed to parse ticket: {}", e);
            return helpers::internal_error("Failed to parse ticket");
        }
    };

    let ticket = match ticket {
        Some(t) => t,
        None => return helpers::not_found(&format!("Ticket {} not found", ticket_id)),
    };

    // Calculate SLA status
    let sla_service = SlaService::new(state.db.clone());
    let status = sla_service.get_sla_status(&ticket);

    // Get policy name if applicable
    let policy_name = if let Some(policy_id) = &ticket.sla_policy_id {
        let policy_id_str = policy_id.to_string().replace("sla_policies:", "");
        match sla_service.get_sla_policy(&policy_id_str).await {
            Ok(Some(policy)) => Some(policy.name),
            _ => None,
        }
    } else {
        None
    };

    let response = SlaStatusResponse {
        response_due: status.response_due.map(|d| d.to_rfc3339()),
        resolution_due: status.resolution_due.map(|d| d.to_rfc3339()),
        response_breached: status.response_breached,
        resolution_breached: status.resolution_breached,
        response_time_remaining_minutes: status.response_time_remaining_minutes,
        resolution_time_remaining_minutes: status.resolution_time_remaining_minutes,
        policy_name,
    };

    helpers::ok(response)
}
