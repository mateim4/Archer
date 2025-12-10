use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::{IntoResponse, Response},
    routing::{get, post, put, delete},
    Json, Router,
};
use chrono::Utc;
use serde::Deserialize;
use std::sync::Arc;
use surrealdb::sql::Thing;

use crate::{
    database::Database,
    models::reporting::{
        ReportDefinition, Dashboard, DashboardWidget, WidgetData,
        CreateReportRequest, UpdateReportRequest, RunReportRequest,
        CreateDashboardRequest, UpdateDashboardRequest,
        CreateWidgetRequest, UpdateWidgetRequest,
        ReportListResponse, DashboardListResponse, DashboardDetailResponse,
    },
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
    },
    services::reporting_service,
};

/// Create Reporting API router with authentication
pub fn create_reporting_router(db: Arc<Database>) -> Router {
    let auth_state = AuthState::new();

    Router::new()
        // Report endpoints
        .route("/reports", get(list_reports))
        .route("/reports", post(create_report))
        .route("/reports/:id", get(get_report))
        .route("/reports/:id", put(update_report))
        .route("/reports/:id", delete(delete_report))
        .route("/reports/:id/run", get(run_report))
        .route("/reports/:id/export", get(export_report))
        
        // Dashboard endpoints
        .route("/dashboards", get(list_dashboards))
        .route("/dashboards", post(create_dashboard))
        .route("/dashboards/:id", get(get_dashboard))
        .route("/dashboards/:id", put(update_dashboard))
        .route("/dashboards/:id", delete(delete_dashboard))
        
        // Widget endpoints
        .route("/widgets", post(create_widget))
        .route("/widgets/:id", get(get_widget))
        .route("/widgets/:id", put(update_widget))
        .route("/widgets/:id", delete(delete_widget))
        .route("/widgets/:id/data", get(get_widget_data))
        
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
        .with_state(db)
}

// ============================================================================
// REPORT HANDLERS
// ============================================================================

async fn list_reports(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    // Query reports that are either public or created by the current user
    let query = "SELECT * FROM report_definition WHERE is_public = true OR created_by = $user ORDER BY created_at DESC";
    
    match db.query(query)
        .bind(("user", user.username.clone()))
        .await
    {
        Ok(mut result) => {
            match result.take::<Vec<ReportDefinition>>(0) {
                Ok(reports) => {
                    let total = reports.len() as u64;
                    (StatusCode::OK, Json(ReportListResponse { reports, total })).into_response()
                },
                Err(e) => {
                    eprintln!("Failed to deserialize reports: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                        "error": "Failed to fetch reports" 
                    }))).into_response()
                }
            }
        },
        Err(e) => {
            eprintln!("Database query failed: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn get_report(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "report_definition") {
        Ok(t) => t,
        Err(e) => return e,
    };

    match db.select(id_thing).await {
        Ok(Some(report)) => {
            let report: ReportDefinition = report;
            (StatusCode::OK, Json(report)).into_response()
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Report not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn create_report(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<CreateReportRequest>,
) -> impl IntoResponse {
    let now = Utc::now();
    let report = ReportDefinition {
        id: None,
        name: req.name,
        description: req.description,
        report_type: req.report_type,
        config: req.config,
        is_public: req.is_public,
        created_by: user.username.clone(),
        created_at: now,
        updated_at: now,
        schedule: req.schedule,
        tenant_id: None,
    };

    match db.create("report_definition").content(report).await {
        Ok(created) => {
            let created: Vec<ReportDefinition> = created;
            if let Some(report) = created.first() {
                (StatusCode::CREATED, Json(report.clone())).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                    "error": "Failed to create report" 
                }))).into_response()
            }
        },
        Err(e) => {
            eprintln!("Failed to create report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn update_report(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<UpdateReportRequest>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "report_definition") {
        Ok(t) => t,
        Err(e) => return e,
    };

    // Build update query dynamically based on provided fields
    let mut updates = Vec::new();
    if let Some(name) = req.name {
        updates.push(format!("name = '{}'", name.replace("'", "''")));
    }
    if let Some(desc) = req.description {
        updates.push(format!("description = '{}'", desc.replace("'", "''")));
    }
    if let Some(config) = req.config {
        updates.push(format!("config = {}", config));
    }
    if let Some(is_public) = req.is_public {
        updates.push(format!("is_public = {}", is_public));
    }
    updates.push(format!("updated_at = '{}'", Utc::now().to_rfc3339()));

    if updates.is_empty() {
        return (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
            "error": "No fields to update" 
        }))).into_response();
    }

    let query = format!("UPDATE {} SET {}", id, updates.join(", "));
    
    match db.query(&query).await {
        Ok(mut result) => {
            match result.take::<Option<ReportDefinition>>(0) {
                Ok(Some(report)) => {
                    (StatusCode::OK, Json(report)).into_response()
                },
                Ok(None) => {
                    (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                        "error": "Report not found" 
                    }))).into_response()
                },
                Err(e) => {
                    eprintln!("Failed to deserialize updated report: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                        "error": "Failed to update report" 
                    }))).into_response()
                }
            }
        },
        Err(e) => {
            eprintln!("Failed to update report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn delete_report(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "report_definition") {
        Ok(t) => t,
        Err(e) => return e,
    };

    match db.delete::<Option<ReportDefinition>>(id_thing).await {
        Ok(Some(_)) => {
            (StatusCode::NO_CONTENT, Json(serde_json::json!({}))).into_response()
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Report not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to delete report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

#[derive(Deserialize)]
struct RunReportQuery {
    #[serde(default)]
    start_date: Option<String>,
    #[serde(default)]
    end_date: Option<String>,
}

async fn run_report(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Query(params): Query<RunReportQuery>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "report_definition") {
        Ok(t) => t,
        Err(e) => return e,
    };

    // Fetch report definition
    let report: ReportDefinition = match db.select(id_thing).await {
        Ok(Some(r)) => r,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Report not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch report: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Execute report based on type and convert to JSON
    let data_result: Result<serde_json::Value, anyhow::Error> = match report.report_type {
        crate::models::reporting::ReportType::TicketMetrics => {
            reporting_service::get_ticket_metrics(&db, params.start_date, params.end_date).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        crate::models::reporting::ReportType::UserPerformance => {
            reporting_service::get_user_performance_metrics(&db).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        crate::models::reporting::ReportType::AssetInventory => {
            reporting_service::get_asset_inventory_metrics(&db).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        crate::models::reporting::ReportType::KbUsage => {
            reporting_service::get_kb_usage_metrics(&db).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        _ => {
            return (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ 
                "error": "Report type not yet implemented" 
            }))).into_response()
        }
    };

    match data_result {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(e) => {
            eprintln!("Failed to run report: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

#[derive(Deserialize)]
struct ExportReportQuery {
    format: String,
    #[serde(default)]
    start_date: Option<String>,
    #[serde(default)]
    end_date: Option<String>,
}

async fn export_report(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    Query(params): Query<ExportReportQuery>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "report_definition") {
        Ok(t) => t,
        Err(e) => return e,
    };

    // Fetch report definition
    let report: ReportDefinition = match db.select(id_thing).await {
        Ok(Some(r)) => r,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Report not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch report: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Run report first to get data and convert to JSON
    let data_result: Result<serde_json::Value, anyhow::Error> = match report.report_type {
        crate::models::reporting::ReportType::TicketMetrics => {
            reporting_service::get_ticket_metrics(&db, params.start_date.clone(), params.end_date.clone()).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        crate::models::reporting::ReportType::AssetInventory => {
            reporting_service::get_asset_inventory_metrics(&db).await
                .and_then(|d| Ok(serde_json::to_value(d)?))
        },
        _ => {
            return (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({ 
                "error": "Export not yet implemented for this report type" 
            }))).into_response()
        }
    };

    let data = match data_result {
        Ok(d) => d,
        Err(e) => {
            eprintln!("Failed to run report for export: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Export based on format
    match params.format.to_lowercase().as_str() {
        "csv" => {
            match reporting_service::export_to_csv(&report.name, data).await {
                Ok(csv_content) => {
                    use axum::response::AppendHeaders;
                    let headers = AppendHeaders([
                        ("Content-Type", "text/csv"),
                        ("Content-Disposition", &format!("attachment; filename=\"{}.csv\"", report.name)),
                    ]);
                    (StatusCode::OK, headers, csv_content).into_response()
                },
                Err(e) => {
                    eprintln!("Failed to export to CSV: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                        "error": e.to_string() 
                    }))).into_response()
                }
            }
        },
        "json" => {
            (StatusCode::OK, Json(data)).into_response()
        },
        _ => {
            (StatusCode::BAD_REQUEST, Json(serde_json::json!({ 
                "error": "Unsupported export format. Supported: csv, json" 
            }))).into_response()
        }
    }
}

// ============================================================================
// DASHBOARD HANDLERS
// ============================================================================

async fn list_dashboards(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let query = "SELECT * FROM dashboard WHERE is_public = true OR created_by = $user ORDER BY created_at DESC";
    
    match db.query(query)
        .bind(("user", user.username.clone()))
        .await
    {
        Ok(mut result) => {
            match result.take::<Vec<Dashboard>>(0) {
                Ok(dashboards) => {
                    let total = dashboards.len() as u64;
                    (StatusCode::OK, Json(DashboardListResponse { dashboards, total })).into_response()
                },
                Err(e) => {
                    eprintln!("Failed to deserialize dashboards: {}", e);
                    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                        "error": "Failed to fetch dashboards" 
                    }))).into_response()
                }
            }
        },
        Err(e) => {
            eprintln!("Database query failed: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn get_dashboard(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard") {
        Ok(t) => t,
        Err(e) => return e,
    };

    let dashboard: Dashboard = match db.select(id_thing).await {
        Ok(Some(d)) => d,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Dashboard not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch dashboard: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Fetch widget details
    let mut widget_details = Vec::new();
    for widget_id in &dashboard.widgets {
        if let Ok(Some(widget)) = db.select::<Option<DashboardWidget>>(widget_id.clone()).await {
            widget_details.push(widget);
        }
    }

    let response = DashboardDetailResponse {
        dashboard,
        widget_details,
    };

    (StatusCode::OK, Json(response)).into_response()
}

async fn create_dashboard(
    State(db): State<Arc<Database>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<CreateDashboardRequest>,
) -> impl IntoResponse {
    let now = Utc::now();
    let dashboard = Dashboard {
        id: None,
        name: req.name,
        description: req.description,
        widgets: Vec::new(),
        layout: serde_json::json!({}),
        is_default: req.is_default,
        is_public: req.is_public,
        created_by: user.username.clone(),
        created_at: now,
        updated_at: now,
        tenant_id: None,
    };

    match db.create("dashboard").content(dashboard).await {
        Ok(created) => {
            let created: Vec<Dashboard> = created;
            if let Some(dashboard) = created.first() {
                (StatusCode::CREATED, Json(dashboard.clone())).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                    "error": "Failed to create dashboard" 
                }))).into_response()
            }
        },
        Err(e) => {
            eprintln!("Failed to create dashboard: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn update_dashboard(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<UpdateDashboardRequest>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard") {
        Ok(t) => t,
        Err(e) => return e,
    };

    // Fetch existing dashboard
    let mut dashboard: Dashboard = match db.select(id_thing.clone()).await {
        Ok(Some(d)) => d,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Dashboard not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch dashboard: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Apply updates
    if let Some(name) = req.name {
        dashboard.name = name;
    }
    if let Some(description) = req.description {
        dashboard.description = Some(description);
    }
    if let Some(layout) = req.layout {
        dashboard.layout = layout;
    }
    if let Some(is_default) = req.is_default {
        dashboard.is_default = is_default;
    }
    if let Some(is_public) = req.is_public {
        dashboard.is_public = is_public;
    }
    dashboard.updated_at = Utc::now();

    match db.update(id_thing).content(dashboard).await {
        Ok(updated) => {
            let updated: Option<Dashboard> = updated;
            if let Some(dashboard) = updated {
                (StatusCode::OK, Json(dashboard)).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                    "error": "Failed to update dashboard" 
                }))).into_response()
            }
        },
        Err(e) => {
            eprintln!("Failed to update dashboard: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn delete_dashboard(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard") {
        Ok(t) => t,
        Err(e) => return e,
    };

    match db.delete::<Option<Dashboard>>(id_thing).await {
        Ok(Some(_)) => {
            (StatusCode::NO_CONTENT, Json(serde_json::json!({}))).into_response()
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Dashboard not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to delete dashboard: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

// ============================================================================
// WIDGET HANDLERS
// ============================================================================

async fn create_widget(
    State(db): State<Arc<Database>>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<CreateWidgetRequest>,
) -> impl IntoResponse {
    let dashboard_id = match parse_thing(&req.dashboard_id, "dashboard") {
        Ok(t) => t,
        Err(e) => return e,
    };

    let now = Utc::now();
    let widget = DashboardWidget {
        id: None,
        dashboard_id: Some(dashboard_id.clone()),
        name: req.name,
        widget_type: req.widget_type,
        config: req.config,
        position: req.position,
        size: req.size,
        refresh_interval_seconds: req.refresh_interval_seconds,
        created_at: now,
        updated_at: now,
    };

    match db.create("dashboard_widget").content(widget).await {
        Ok(created) => {
            let created: Vec<DashboardWidget> = created;
            if let Some(widget) = created.first() {
                // Add widget to dashboard's widget list
                let query = format!("UPDATE {} SET widgets += $widget_id", req.dashboard_id);
                if let Some(widget_id) = &widget.id {
                    let _ = db.query(&query)
                        .bind(("widget_id", widget_id.clone()))
                        .await;
                }
                
                (StatusCode::CREATED, Json(widget.clone())).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                    "error": "Failed to create widget" 
                }))).into_response()
            }
        },
        Err(e) => {
            eprintln!("Failed to create widget: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn get_widget(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard_widget") {
        Ok(t) => t,
        Err(e) => return e,
    };

    match db.select(id_thing).await {
        Ok(Some(widget)) => {
            let widget: DashboardWidget = widget;
            (StatusCode::OK, Json(widget)).into_response()
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Widget not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch widget: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn update_widget(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
    Json(req): Json<UpdateWidgetRequest>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard_widget") {
        Ok(t) => t,
        Err(e) => return e,
    };

    let mut widget: DashboardWidget = match db.select(id_thing.clone()).await {
        Ok(Some(w)) => w,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Widget not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch widget: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    if let Some(name) = req.name {
        widget.name = name;
    }
    if let Some(config) = req.config {
        widget.config = config;
    }
    if let Some(position) = req.position {
        widget.position = position;
    }
    if let Some(size) = req.size {
        widget.size = size;
    }
    if let Some(refresh) = req.refresh_interval_seconds {
        widget.refresh_interval_seconds = Some(refresh);
    }
    widget.updated_at = Utc::now();

    match db.update(id_thing).content(widget).await {
        Ok(updated) => {
            let updated: Option<DashboardWidget> = updated;
            if let Some(widget) = updated {
                (StatusCode::OK, Json(widget)).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                    "error": "Failed to update widget" 
                }))).into_response()
            }
        },
        Err(e) => {
            eprintln!("Failed to update widget: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn delete_widget(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard_widget") {
        Ok(t) => t,
        Err(e) => return e,
    };

    match db.delete::<Option<DashboardWidget>>(id_thing).await {
        Ok(Some(_)) => {
            (StatusCode::NO_CONTENT, Json(serde_json::json!({}))).into_response()
        },
        Ok(None) => {
            (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Widget not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to delete widget: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

async fn get_widget_data(
    State(db): State<Arc<Database>>,
    Path(id): Path<String>,
    axum::Extension(_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    let id_thing = match parse_thing(&id, "dashboard_widget") {
        Ok(t) => t,
        Err(e) => return e,
    };

    let widget: DashboardWidget = match db.select(id_thing).await {
        Ok(Some(w)) => w,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(serde_json::json!({ 
                "error": "Widget not found" 
            }))).into_response()
        },
        Err(e) => {
            eprintln!("Failed to fetch widget: {}", e);
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    };

    // Generate widget data based on widget type and config
    let data = reporting_service::generate_widget_data(&db, &widget).await;

    match data {
        Ok(widget_data) => (StatusCode::OK, Json(widget_data)).into_response(),
        Err(e) => {
            eprintln!("Failed to generate widget data: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ 
                "error": e.to_string() 
            }))).into_response()
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

fn parse_thing(id: &str, table: &str) -> Result<Thing, Response> {
    if id.contains(':') {
        match id.parse::<Thing>() {
            Ok(t) => Ok(t),
            Err(_) => Err((
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid ID format" }))
            ).into_response())
        }
    } else {
        Ok(Thing {
            tb: table.to_string(),
            id: id.into(),
        })
    }
}
