# TASK-004: Enable Analytics API Backend

**Task ID:** TASK-004  
**Priority:** P1 - High  
**Estimate:** 2-3 hours  
**Dependencies:** None (Layer 0 - Can start immediately)  
**Phase:** 1 - Core ITSM

---

## Objective

Enable and fix the backend analytics API routes to provide real-time dashboard statistics. The analytics service exists but may not be properly registered or may have compilation issues.

---

## Context

The frontend Dashboard requires statistics from the backend, but the analytics endpoints may be commented out or not registered in the API router. This task ensures the backend can serve dashboard data.

### Files to Review/Modify
- `backend/src/api/analytics.rs` - Analytics API handlers
- `backend/src/api/mod.rs` - Route registration
- `backend/src/services/analytics_service.rs` - Analytics service

### Reference Files
- `backend/src/api/tickets.rs` - Example of working API module
- `backend/src/services/ticket_service.rs` - Example of working service

---

## Current State Assessment

First, check if analytics routes are registered:

```bash
# Check if analytics is imported in mod.rs
grep -n "analytics" backend/src/api/mod.rs

# Check for compilation errors
cd backend && cargo check 2>&1 | grep -i analytics
```

---

## Required Implementation

### Step 1: Review Analytics Service

Check `backend/src/services/analytics_service.rs` for existing implementation. If it exists, verify it compiles and has the needed methods.

Expected service interface:
```rust
pub struct AnalyticsService {
    db: Arc<Database>,
}

impl AnalyticsService {
    pub fn new(db: Arc<Database>) -> Self;
    
    pub async fn get_dashboard_stats(&self, tenant_id: Option<&str>) -> Result<DashboardStats>;
    pub async fn get_ticket_stats(&self, tenant_id: Option<&str>) -> Result<TicketStats>;
    pub async fn get_recent_activity(&self, limit: usize) -> Result<Vec<ActivityEntry>>;
}
```

### Step 2: Define Response Types

Add to `backend/src/api/analytics.rs` or a new models file:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStatsResponse {
    pub total_open_tickets: i64,
    pub tickets_by_status: std::collections::HashMap<String, i64>,
    pub tickets_by_priority: std::collections::HashMap<String, i64>,
    pub sla_compliance: f64,
    pub average_resolution_hours: f64,
    pub tickets_trend: TicketsTrend,
    pub recent_tickets: Vec<RecentTicket>,
    pub active_alerts: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TicketsTrend {
    pub period: String,
    pub current: i64,
    pub previous: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RecentTicket {
    pub id: String,
    pub title: String,
    pub priority: String,
    pub status: String,
    pub created_at: String,
}
```

### Step 3: Implement API Handler

```rust
// backend/src/api/analytics.rs

use axum::{extract::State, routing::get, Json, Router};
use std::sync::Arc;

use crate::database::Database;
use crate::middleware::auth::AuthenticatedUser;
use crate::services::analytics_service::AnalyticsService;

pub fn router() -> Router<Arc<Database>> {
    Router::new()
        .route("/dashboard", get(get_dashboard_stats))
        .route("/tickets", get(get_ticket_stats))
        .route("/activity", get(get_recent_activity))
}

async fn get_dashboard_stats(
    State(db): State<Arc<Database>>,
    user: AuthenticatedUser,
) -> Result<Json<DashboardStatsResponse>, (axum::http::StatusCode, String)> {
    let service = AnalyticsService::new(db);
    
    match service.get_dashboard_stats(user.tenant_id.as_deref()).await {
        Ok(stats) => Ok(Json(stats)),
        Err(e) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to get dashboard stats: {}", e),
        )),
    }
}

async fn get_ticket_stats(
    State(db): State<Arc<Database>>,
    user: AuthenticatedUser,
) -> Result<Json<TicketStatsResponse>, (axum::http::StatusCode, String)> {
    let service = AnalyticsService::new(db);
    
    match service.get_ticket_stats(user.tenant_id.as_deref()).await {
        Ok(stats) => Ok(Json(stats)),
        Err(e) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to get ticket stats: {}", e),
        )),
    }
}

async fn get_recent_activity(
    State(db): State<Arc<Database>>,
    _user: AuthenticatedUser,
) -> Result<Json<Vec<ActivityEntry>>, (axum::http::StatusCode, String)> {
    let service = AnalyticsService::new(db);
    
    match service.get_recent_activity(10).await {
        Ok(activity) => Ok(Json(activity)),
        Err(e) => Err((
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to get activity: {}", e),
        )),
    }
}
```

### Step 4: Implement Analytics Service

If service doesn't exist or is incomplete:

```rust
// backend/src/services/analytics_service.rs

use anyhow::Result;
use chrono::{Duration, Utc};
use std::collections::HashMap;
use std::sync::Arc;

use crate::database::Database;
use crate::models::ticket::{Ticket, TicketStatus, TicketPriority};

pub struct AnalyticsService {
    db: Arc<Database>,
}

impl AnalyticsService {
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    pub async fn get_dashboard_stats(&self, tenant_id: Option<&str>) -> Result<DashboardStats> {
        // Count open tickets
        let open_statuses = vec!["NEW", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "PENDING_CUSTOMER", "PENDING_VENDOR"];
        let open_filter = open_statuses.iter()
            .map(|s| format!("status = '{}'", s))
            .collect::<Vec<_>>()
            .join(" OR ");
        
        let open_count: i64 = self.db
            .query(&format!("SELECT count() FROM ticket WHERE {} GROUP ALL", open_filter))
            .await?
            .take::<Option<i64>>(0)?
            .unwrap_or(0);

        // Count by status
        let tickets: Vec<Ticket> = self.db
            .query("SELECT * FROM ticket")
            .await?
            .take(0)?;
        
        let mut by_status: HashMap<String, i64> = HashMap::new();
        let mut by_priority: HashMap<String, i64> = HashMap::new();
        
        for ticket in &tickets {
            *by_status.entry(format!("{:?}", ticket.status)).or_insert(0) += 1;
            *by_priority.entry(format!("{:?}", ticket.priority)).or_insert(0) += 1;
        }

        // Calculate SLA compliance
        let resolved_tickets: Vec<Ticket> = self.db
            .query("SELECT * FROM ticket WHERE status = 'RESOLVED' OR status = 'CLOSED'")
            .await?
            .take(0)?;
        
        let sla_met_count = resolved_tickets.iter()
            .filter(|t| t.resolution_sla_met.unwrap_or(true))
            .count();
        
        let sla_compliance = if resolved_tickets.is_empty() {
            100.0
        } else {
            (sla_met_count as f64 / resolved_tickets.len() as f64) * 100.0
        };

        // Get recent tickets
        let recent: Vec<Ticket> = self.db
            .query("SELECT * FROM ticket ORDER BY created_at DESC LIMIT 5")
            .await?
            .take(0)?;
        
        let recent_tickets: Vec<RecentTicket> = recent.iter().map(|t| RecentTicket {
            id: t.id.as_ref().map(|id| id.to_string()).unwrap_or_default(),
            title: t.title.clone(),
            priority: format!("{:?}", t.priority),
            status: format!("{:?}", t.status),
            created_at: t.created_at.to_rfc3339(),
        }).collect();

        // Ticket trend (this week vs last week)
        let now = Utc::now();
        let week_ago = now - Duration::days(7);
        let two_weeks_ago = now - Duration::days(14);
        
        let current_week: i64 = self.db
            .query(&format!(
                "SELECT count() FROM ticket WHERE created_at >= '{}' GROUP ALL",
                week_ago.to_rfc3339()
            ))
            .await?
            .take::<Option<i64>>(0)?
            .unwrap_or(0);
        
        let previous_week: i64 = self.db
            .query(&format!(
                "SELECT count() FROM ticket WHERE created_at >= '{}' AND created_at < '{}' GROUP ALL",
                two_weeks_ago.to_rfc3339(),
                week_ago.to_rfc3339()
            ))
            .await?
            .take::<Option<i64>>(0)?
            .unwrap_or(0);

        // Active alerts (from monitoring)
        let active_alerts: i64 = self.db
            .query("SELECT count() FROM alerts WHERE status = 'ACTIVE' GROUP ALL")
            .await?
            .take::<Option<i64>>(0)?
            .unwrap_or(0);

        Ok(DashboardStats {
            total_open_tickets: open_count,
            tickets_by_status: by_status,
            tickets_by_priority: by_priority,
            sla_compliance,
            average_resolution_hours: 4.5, // TODO: Calculate from resolved tickets
            tickets_trend: TicketsTrend {
                period: "week".to_string(),
                current: current_week,
                previous: previous_week,
            },
            recent_tickets,
            active_alerts,
        })
    }

    pub async fn get_ticket_stats(&self, _tenant_id: Option<&str>) -> Result<TicketStats> {
        // Simplified implementation
        Ok(TicketStats {
            total: 0,
            by_type: HashMap::new(),
            resolution_time_avg: 0.0,
        })
    }

    pub async fn get_recent_activity(&self, limit: usize) -> Result<Vec<ActivityEntry>> {
        // Query audit log or ticket history
        let entries: Vec<ActivityEntry> = self.db
            .query(&format!(
                "SELECT * FROM audit_log ORDER BY created_at DESC LIMIT {}",
                limit
            ))
            .await?
            .take(0)
            .unwrap_or_default();
        
        Ok(entries)
    }
}
```

### Step 5: Register Routes

Update `backend/src/api/mod.rs`:

```rust
// Add import
pub mod analytics;

// In create_routes() or similar function:
pub fn create_routes(db: Arc<Database>) -> Router {
    Router::new()
        .nest("/api/v1/tickets", tickets::router())
        .nest("/api/v1/analytics", analytics::router())  // Add this line
        // ... other routes
        .with_state(db)
}
```

---

## Testing

### Manual Testing

```bash
# Start the backend
cd backend && cargo run

# Test the endpoint (requires valid JWT)
curl -X GET http://localhost:3001/api/v1/analytics/dashboard \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "total_open_tickets": 12,
  "tickets_by_status": {
    "NEW": 5,
    "IN_PROGRESS": 4,
    "ON_HOLD": 3
  },
  "tickets_by_priority": {
    "P1": 2,
    "P2": 5,
    "P3": 3,
    "P4": 2
  },
  "sla_compliance": 94.5,
  "average_resolution_hours": 4.2,
  "tickets_trend": {
    "period": "week",
    "current": 12,
    "previous": 10
  },
  "recent_tickets": [...],
  "active_alerts": 3
}
```

---

## Acceptance Criteria

- [ ] `cargo build` completes without errors
- [ ] `cargo test` passes for analytics module
- [ ] `GET /api/v1/analytics/dashboard` returns valid JSON
- [ ] Response includes all required fields
- [ ] Ticket counts match actual database counts
- [ ] SLA compliance percentage is calculated correctly
- [ ] Recent tickets list contains actual tickets
- [ ] Error handling returns proper HTTP status codes
- [ ] Route is registered in main API router

---

## Notes for Agent

- The SurrealDB query syntax may differ from SQL - check existing queries in ticket_service.rs
- The `alerts` table may not exist - handle gracefully with 0 count
- Consider adding caching for expensive aggregation queries
- Ensure CORS headers are set if frontend is on different port
- The JWT middleware must be applied to protect the endpoint
- If queries fail, check SurrealDB connection on port 8001
