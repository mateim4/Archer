//! Analytics API Module (Axum Implementation)
//!
//! This module provides real-time analytics endpoints for the Archer ITSM platform.
//! It replaces the legacy actix_web-based analytics module with axum-compatible handlers.
//!
//! ## Endpoints
//!
//! - `GET /api/v1/analytics/dashboard` - Retrieves dashboard statistics including:
//!   - Total open tickets
//!   - Ticket counts by status
//!   - Ticket counts by priority
//!   - SLA compliance percentage
//!   - Average resolution time
//!   - Recent tickets (24h)
//!   - Open incidents count
//!
//! ## Authentication
//!
//! All analytics endpoints require JWT authentication via the `require_auth` middleware.
//!
//! ## Example Response
//!
//! ```json
//! {
//!   "total_open_tickets": 12,
//!   "tickets_by_status": {
//!     "NEW": 5,
//!     "IN_PROGRESS": 4,
//!     "ASSIGNED": 3
//!   },
//!   "tickets_by_priority": {
//!     "P1": 2,
//!     "P2": 5,
//!     "P3": 3,
//!     "P4": 2
//!   },
//!   "sla_compliance": 94.5,
//!   "average_resolution_hours": 4.2,
//!   "recent_tickets_24h": 3,
//!   "open_incidents": 5
//! }
//! ```

use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

use crate::{
    database::Database,
    middleware::auth::AuthenticatedUser,
    models::ticket::{Ticket, TicketPriority, TicketStatus},
};

/// Dashboard statistics response
#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStatsResponse {
    pub total_open_tickets: i64,
    pub tickets_by_status: HashMap<String, i64>,
    pub tickets_by_priority: HashMap<String, i64>,
    pub sla_compliance: f64,
    pub average_resolution_hours: f64,
    pub recent_tickets_24h: i64,
    pub open_incidents: i64,
}

/// Create Analytics API router
pub fn create_analytics_router(db: Arc<Database>) -> Router {
    use crate::middleware::auth::{require_auth, AuthState};
    
    let auth_state = AuthState::new();
    
    Router::new()
        .route("/dashboard", get(get_dashboard_stats))
        .layer(axum::middleware::from_fn_with_state(auth_state, require_auth))
        .with_state(db)
}

/// GET /api/v1/analytics/dashboard
/// Returns real-time dashboard statistics from ticket data
async fn get_dashboard_stats(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> Result<Json<DashboardStatsResponse>, (axum::http::StatusCode, String)> {
    match fetch_dashboard_stats(&db).await {
        Ok(stats) => Ok(Json(stats)),
        Err(e) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to fetch dashboard stats: {}", e),
        )),
    }
}

/// Fetch dashboard statistics from the database
async fn fetch_dashboard_stats(db: &Database) -> Result<DashboardStatsResponse, String> {
    // Fetch all tickets
    let tickets: Vec<Ticket> = db
        .query("SELECT * FROM ticket")
        .await
        .map_err(|e| format!("Database query failed: {}", e))?
        .take(0)
        .map_err(|e| format!("Failed to deserialize tickets: {}", e))?;

    // Count open tickets (all statuses except RESOLVED and CLOSED)
    let total_open_tickets = tickets
        .iter()
        .filter(|t| !matches!(t.status, TicketStatus::Resolved | TicketStatus::Closed))
        .count() as i64;

    // Count tickets by status
    let mut tickets_by_status: HashMap<String, i64> = HashMap::new();
    for ticket in &tickets {
        let status_str = format!("{:?}", ticket.status).to_uppercase();
        *tickets_by_status.entry(status_str).or_insert(0) += 1;
    }

    // Count tickets by priority
    let mut tickets_by_priority: HashMap<String, i64> = HashMap::new();
    for ticket in &tickets {
        let priority_str = format!("{:?}", ticket.priority).to_uppercase();
        *tickets_by_priority.entry(priority_str).or_insert(0) += 1;
    }

    // Calculate SLA compliance
    let resolved_or_closed: Vec<&Ticket> = tickets
        .iter()
        .filter(|t| matches!(t.status, TicketStatus::Resolved | TicketStatus::Closed))
        .collect();

    let sla_met_count = resolved_or_closed
        .iter()
        .filter(|t| t.resolution_sla_met.unwrap_or(false))
        .count();

    let sla_compliance = if resolved_or_closed.is_empty() {
        100.0
    } else {
        (sla_met_count as f64 / resolved_or_closed.len() as f64) * 100.0
    };

    // Calculate average resolution hours for resolved tickets
    let mut total_resolution_hours = 0.0;
    let mut resolution_count = 0;

    for ticket in &resolved_or_closed {
        if let Some(resolved_at) = ticket.resolved_at {
            let duration = resolved_at.signed_duration_since(ticket.created_at);
            total_resolution_hours += duration.num_minutes() as f64 / 60.0;
            resolution_count += 1;
        }
    }

    let average_resolution_hours = if resolution_count > 0 {
        total_resolution_hours / resolution_count as f64
    } else {
        0.0
    };

    // Count tickets created in the last 24 hours
    let now = Utc::now();
    let twenty_four_hours_ago = now - Duration::hours(24);
    let recent_tickets_24h = tickets
        .iter()
        .filter(|t| t.created_at >= twenty_four_hours_ago)
        .count() as i64;

    // Count open incidents specifically
    let open_incidents = tickets
        .iter()
        .filter(|t| {
            matches!(t.ticket_type, crate::models::ticket::TicketType::Incident)
                && !matches!(t.status, TicketStatus::Resolved | TicketStatus::Closed)
        })
        .count() as i64;

    Ok(DashboardStatsResponse {
        total_open_tickets,
        tickets_by_status,
        tickets_by_priority,
        sla_compliance,
        average_resolution_hours,
        recent_tickets_24h,
        open_incidents,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_dashboard_stats_response_serialization() {
        let mut by_status = HashMap::new();
        by_status.insert("NEW".to_string(), 5);
        by_status.insert("IN_PROGRESS".to_string(), 3);

        let mut by_priority = HashMap::new();
        by_priority.insert("P1".to_string(), 2);
        by_priority.insert("P2".to_string(), 6);

        let stats = DashboardStatsResponse {
            total_open_tickets: 8,
            tickets_by_status: by_status,
            tickets_by_priority: by_priority,
            sla_compliance: 95.5,
            average_resolution_hours: 4.2,
            recent_tickets_24h: 3,
            open_incidents: 5,
        };

        let json = serde_json::to_string(&stats).unwrap();
        assert!(json.contains("total_open_tickets"));
        assert!(json.contains("sla_compliance"));
    }
}
