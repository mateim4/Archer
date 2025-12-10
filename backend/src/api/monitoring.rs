use axum::{
    extract::{Path, Query, State},
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::database::Database;
use crate::middleware::auth::{require_auth, AuthState, AuthenticatedUser};
use crate::models::monitoring::*;
use crate::services::monitoring_service::MonitoringService;
use chrono::{DateTime, Utc, Duration};
use rand::Rng;

// Legacy mock data structures (kept for compatibility)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetricPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetMetrics {
    pub asset_id: String,
    pub cpu_usage: Vec<MetricPoint>,
    pub memory_usage: Vec<MetricPoint>,
    pub storage_usage: Vec<MetricPoint>,
    pub network_throughput: Vec<MetricPoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardSummary {
    pub total_alerts: i32,
    pub critical_alerts: i32,
    pub warning_alerts: i32,
    pub avg_cluster_health: f64,
    pub active_incidents: i32,
}

pub fn routes(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    Router::new()
        // Dashboard (mock data for now)
        .route("/dashboard", get(get_dashboard_summary))
        // Assets metrics (mock data for now)
        .route("/assets/:asset_id", get(get_asset_metrics))
        // Alert endpoints (real data)
        .route("/alerts", get(list_alerts).post(create_alert))
        .route("/alerts/:id", get(get_alert))
        .route("/alerts/:id/acknowledge", post(acknowledge_alert))
        .route("/alerts/:id/resolve", post(resolve_alert))
        .route("/alerts/:id/create-ticket", post(create_ticket_from_alert))
        // Alert rules endpoints
        .route("/rules", get(list_alert_rules).post(create_alert_rule))
        .route("/rules/:id", get(get_alert_rule).put(update_alert_rule).delete(delete_alert_rule))
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
        .with_state(db)
}

// ============================================================================
// DASHBOARD & METRICS (Mock Data - TODO: Real implementation)
// ============================================================================

async fn get_dashboard_summary(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    // Get real alert counts
    let (alerts, _) = service
        .list_alerts(None, None, None, None, None, None, 0, 1000)
        .await
        .unwrap_or((vec![], 0));
    
    let critical_count = alerts.iter().filter(|a| matches!(a.severity, AlertSeverity::Critical) && matches!(a.status, AlertStatus::Active)).count() as i32;
    let warning_count = alerts.iter().filter(|a| matches!(a.severity, AlertSeverity::High) && matches!(a.status, AlertStatus::Active)).count() as i32;
    let total_count = alerts.iter().filter(|a| matches!(a.status, AlertStatus::Active)).count() as i32;
    
    let summary = DashboardSummary {
        total_alerts: total_count,
        critical_alerts: critical_count,
        warning_alerts: warning_count,
        avg_cluster_health: 94.5, // TODO: Calculate from real metrics
        active_incidents: 3, // TODO: Query from tickets
    };
    
    Json(summary)
}

async fn get_asset_metrics(
    State(_db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Path(asset_id): Path<String>,
) -> impl IntoResponse {
    // Generate realistic mock data for the last 24 hours
    let mut rng = rand::thread_rng();
    let now = Utc::now();
    let points = 24; // One point per hour

    let mut cpu_usage = Vec::new();
    let mut memory_usage = Vec::new();
    let mut storage_usage = Vec::new();
    let mut network_throughput = Vec::new();

    let base_cpu = rng.gen_range(20.0..60.0);
    let base_mem = rng.gen_range(40.0..80.0);

    for i in 0..points {
        let time = now - Duration::hours((points - 1 - i) as i64);
        
        // Add some noise and trends
        let cpu_noise: f64 = rng.gen_range(-10.0..15.0);
        let mem_noise: f64 = rng.gen_range(-5.0..5.0);
        
        let cpu_val = (base_cpu + cpu_noise).clamp(0.0, 100.0);
        let mem_val = (base_mem + mem_noise).clamp(0.0, 100.0);
        let storage_val = 65.0 + (i as f64 * 0.1); // Slow growth
        let net_val = rng.gen_range(100.0..1000.0); // Mbps

        cpu_usage.push(MetricPoint { timestamp: time, value: cpu_val });
        memory_usage.push(MetricPoint { timestamp: time, value: mem_val });
        storage_usage.push(MetricPoint { timestamp: time, value: storage_val });
        network_throughput.push(MetricPoint { timestamp: time, value: net_val });
    }

    Json(AssetMetrics {
        asset_id,
        cpu_usage,
        memory_usage,
        storage_usage,
        network_throughput,
    })
}

// ============================================================================
// ALERT ENDPOINTS
// ============================================================================

async fn create_alert(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<CreateAlertRequest>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.create_alert(request, &user).await {
        Ok(alert) => Json(alert),
        Err(e) => {
            tracing::error!("Failed to create alert: {}", e);
            Json(Alert {
                id: None,
                title: "Error".to_string(),
                description: format!("Failed to create alert: {}", e),
                severity: AlertSeverity::Info,
                status: AlertStatus::Active,
                source: "error".to_string(),
                source_alert_id: None,
                affected_ci_id: None,
                metric_name: None,
                metric_value: None,
                threshold: None,
                created_at: Utc::now(),
                acknowledged_at: None,
                acknowledged_by: None,
                resolved_at: None,
                resolved_by: None,
                auto_ticket_id: None,
                tags: vec![],
            })
        }
    }
}

async fn list_alerts(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Query(params): Query<AlertFilterParams>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    let page = params.page.unwrap_or(0);
    let page_size = params.page_size.unwrap_or(30);
    
    match service
        .list_alerts(
            params.severity,
            params.status,
            params.source,
            params.affected_ci_id,
            params.tags,
            params.search,
            page,
            page_size,
        )
        .await
    {
        Ok((alerts, total)) => Json(AlertListResponse {
            alerts,
            total,
            page,
            page_size,
        }),
        Err(e) => {
            tracing::error!("Failed to list alerts: {}", e);
            Json(AlertListResponse {
                alerts: vec![],
                total: 0,
                page,
                page_size,
            })
        }
    }
}

async fn get_alert(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.get_alert(&id).await {
        Ok(alert) => Json(Some(alert)),
        Err(e) => {
            tracing::error!("Failed to get alert: {}", e);
            Json(None)
        }
    }
}

async fn acknowledge_alert(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    let request = AcknowledgeAlertRequest {
        acknowledged_by: user.user_id.clone(),
    };
    
    match service.acknowledge_alert(&id, request).await {
        Ok(alert) => Json(Some(alert)),
        Err(e) => {
            tracing::error!("Failed to acknowledge alert: {}", e);
            Json(None)
        }
    }
}

async fn resolve_alert(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(mut request): Json<ResolveAlertRequest>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    request.resolved_by = user.user_id.clone();
    
    match service.resolve_alert(&id, request).await {
        Ok(alert) => Json(Some(alert)),
        Err(e) => {
            tracing::error!("Failed to resolve alert: {}", e);
            Json(None)
        }
    }
}

async fn create_ticket_from_alert(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<CreateTicketFromAlertRequest>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.create_ticket_from_alert(&id, request, &user).await {
        Ok(ticket_id) => Json(serde_json::json!({
            "ticket_id": ticket_id.to_string(),
            "message": "Ticket created successfully"
        })),
        Err(e) => {
            tracing::error!("Failed to create ticket from alert: {}", e);
            Json(serde_json::json!({
                "error": format!("Failed to create ticket: {}", e)
            }))
        }
    }
}

// ============================================================================
// ALERT RULE ENDPOINTS
// ============================================================================

async fn create_alert_rule(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<CreateAlertRuleRequest>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service
        .create_alert_rule(
            request.name,
            request.description,
            request.metric_query,
            request.condition,
            request.threshold,
            request.severity,
            request.auto_create_ticket,
            request.ticket_template,
            request.cooldown_minutes,
        )
        .await
    {
        Ok(rule) => Json(Some(rule)),
        Err(e) => {
            tracing::error!("Failed to create alert rule: {}", e);
            Json(None)
        }
    }
}

async fn list_alert_rules(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.list_alert_rules().await {
        Ok(rules) => {
            let total = rules.len() as u64;
            Json(AlertRuleListResponse { rules, total })
        }
        Err(e) => {
            tracing::error!("Failed to list alert rules: {}", e);
            Json(AlertRuleListResponse { rules: vec![], total: 0 })
        }
    }
}

async fn get_alert_rule(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.get_alert_rule(&id).await {
        Ok(rule) => Json(Some(rule)),
        Err(e) => {
            tracing::error!("Failed to get alert rule: {}", e);
            Json(None)
        }
    }
}

async fn update_alert_rule(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
    Json(request): Json<UpdateAlertRuleRequest>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service
        .update_alert_rule(
            &id,
            request.name,
            request.description,
            request.metric_query,
            request.condition,
            request.threshold,
            request.severity,
            request.auto_create_ticket,
            request.ticket_template,
            request.is_active,
            request.cooldown_minutes,
        )
        .await
    {
        Ok(rule) => Json(Some(rule)),
        Err(e) => {
            tracing::error!("Failed to update alert rule: {}", e);
            Json(None)
        }
    }
}

async fn delete_alert_rule(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let service = MonitoringService::new(db);
    
    match service.delete_alert_rule(&id).await {
        Ok(()) => Json(serde_json::json!({
            "message": "Alert rule deleted successfully"
        })),
        Err(e) => {
            tracing::error!("Failed to delete alert rule: {}", e);
            Json(serde_json::json!({
                "error": format!("Failed to delete alert rule: {}", e)
            }))
        }
    }
}
