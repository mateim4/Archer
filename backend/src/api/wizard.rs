//! Activity Wizard API Endpoints
//!
//! Provides RESTful API for wizard-based activity creation:
//! - POST /api/v1/wizard/start - Create new wizard session
//! - PUT /api/v1/wizard/:id/progress - Save wizard progress
//! - GET /api/v1/wizard/:id/draft - Retrieve draft for resumption
//! - POST /api/v1/wizard/:id/complete - Complete wizard and finalize activity
//! - GET /api/v1/wizard/:id/compatibility - Check hardware compatibility
//! - GET /api/v1/wizard/:id/capacity - Validate capacity
//! - GET /api/v1/wizard/:id/timeline - Estimate timeline

use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    database::AppState,
    models::workflow::Activity,
    services::{
        capacity_validation_service::{CapacityValidationRequest, CapacityValidationService},
        hardware_compatibility_service::{CompatibilityCheckRequest, HardwareCompatibilityService},
        timeline_estimation_service::{TimelineEstimationRequest, TimelineEstimationService},
        wizard_service::{
            CompleteWizardRequest, SaveProgressRequest, StartWizardRequest, WizardService,
        },
    },
};

/// Standard API response wrapper
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ApiError>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<serde_json::Value>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: None,
        }
    }

    pub fn success_with_message(data: T, message: String) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            message: Some(message),
        }
    }

    pub fn error(code: String, message: String) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(ApiError {
                code,
                message,
                details: None,
            }),
            message: None,
        }
    }

    pub fn error_with_details(
        code: String,
        message: String,
        details: serde_json::Value,
    ) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            data: None,
            error: Some(ApiError {
                code,
                message,
                details: Some(details),
            }),
            message: None,
        }
    }
}

/// POST /api/v1/wizard/start
///
/// Create a new wizard session and draft activity
async fn start_wizard(
    State(state): State<AppState>,
    Json(request): Json<StartWizardRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match WizardService::create_draft_activity(&state, request).await {
        Ok(response) => Ok(Json(ApiResponse::success(json!({
            "activity_id": response.activity_id,
            "expires_at": response.expires_at.to_rfc3339(),
        })))),
        Err(e) => {
            eprintln!("Failed to start wizard: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// PUT /api/v1/wizard/:id/progress
///
/// Save wizard progress (auto-save functionality)
async fn save_progress(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
    Json(request): Json<SaveProgressRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match WizardService::save_wizard_progress(&state, &activity_id, request).await {
        Ok(_) => Ok(Json(ApiResponse::success_with_message(
            json!({
                "activity_id": activity_id,
                "saved_at": chrono::Utc::now().to_rfc3339(),
            }),
            "Progress saved successfully".to_string(),
        ))),
        Err(e) => {
            let error_msg = e.to_string();
            eprintln!("Failed to save progress: {}", error_msg);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// GET /api/v1/wizard/:id/draft
///
/// Retrieve draft activity for resumption
async fn get_draft(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
) -> Result<Json<ApiResponse<Activity>>, StatusCode> {
    match WizardService::get_wizard_draft(&state, &activity_id).await {
        Ok(activity) => Ok(Json(ApiResponse::success(activity))),
        Err(e) => {
            eprintln!("Failed to get draft: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// POST /api/v1/wizard/:id/complete
///
/// Complete the wizard and finalize the activity
async fn complete_wizard(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
    Json(request): Json<CompleteWizardRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match WizardService::complete_wizard(&state, &activity_id, request).await {
        Ok(response) => Ok(Json(ApiResponse::success_with_message(
            json!({
                "activity_id": response.activity_id,
                "strategy_id": response.strategy_id,
            }),
            "Activity created successfully".to_string(),
        ))),
        Err(e) => {
            eprintln!("Failed to complete wizard: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// GET /api/v1/wizard/:id/compatibility
///
/// Check hardware compatibility in real-time
async fn check_compatibility(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
    Json(request): Json<CompatibilityCheckRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    // Verify activity exists
    let activity: Option<Activity> = match state.select(("activity", activity_id.as_str())).await {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Failed to fetch activity: {}", e);
            return Err(StatusCode::NOT_FOUND);
        }
    };

    if activity.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Perform compatibility check
    match HardwareCompatibilityService::check_hci_compatibility(&state, request).await {
        Ok(result) => Ok(Json(ApiResponse::success(json!(result)))),
        Err(e) => {
            eprintln!("Compatibility check failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// GET /api/v1/wizard/:id/capacity
///
/// Validate capacity in real-time
async fn check_capacity(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
    Json(request): Json<CapacityValidationRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    // Verify activity exists
    let activity: Option<Activity> = match state.select(("activity", activity_id.as_str())).await {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Failed to fetch activity: {}", e);
            return Err(StatusCode::NOT_FOUND);
        }
    };

    if activity.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Perform capacity validation
    match CapacityValidationService::validate_capacity(&state, request).await {
        Ok(result) => Ok(Json(ApiResponse::success(json!(result)))),
        Err(e) => {
            eprintln!("Capacity validation failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// GET /api/v1/wizard/:id/timeline
///
/// Estimate timeline in real-time
async fn estimate_timeline(
    State(state): State<AppState>,
    Path(activity_id): Path<String>,
    Json(request): Json<TimelineEstimationRequest>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    // Verify activity exists
    let activity: Option<Activity> = match state.select(("activity", activity_id.as_str())).await {
        Ok(a) => a,
        Err(e) => {
            eprintln!("Failed to fetch activity: {}", e);
            return Err(StatusCode::NOT_FOUND);
        }
    };

    if activity.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    // Perform timeline estimation
    match TimelineEstimationService::estimate_migration_timeline(&state, request).await {
        Ok(result) => Ok(Json(ApiResponse::success(json!(result)))),
        Err(e) => {
            eprintln!("Timeline estimation failed: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Create wizard API router
pub fn wizard_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/wizard/start", post(start_wizard))
        .route("/api/v1/wizard/:id/progress", put(save_progress))
        .route("/api/v1/wizard/:id/draft", get(get_draft))
        .route("/api/v1/wizard/:id/complete", post(complete_wizard))
        .route(
            "/api/v1/wizard/:id/compatibility",
            post(check_compatibility),
        )
        .route("/api/v1/wizard/:id/capacity", post(check_capacity))
        .route("/api/v1/wizard/:id/timeline", post(estimate_timeline))
}
