//! Global Settings API
//!
//! Manages application-wide configuration and default values.
//! Settings are stored as a singleton record in the database.

use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, patch},
    Json, Router,
};
use chrono::Utc;
use serde::Serialize;
use std::sync::Arc;

use crate::{
    database::Database,
    models::settings::*,
};

/// API Error type (placeholder - should use shared error type)
#[derive(Debug)]
pub enum ApiError {
    NotFound(String),
    InternalError(String),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            ApiError::InternalError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        (status, Json(serde_json::json!({ "error": message }))).into_response()
    }
}

/// Create Settings API router
pub fn create_settings_router(db: Arc<Database>) -> Router {
    Router::new()
        .route("/", get(get_settings))
        .route("/", patch(update_settings))
        .with_state(db)
}

// =============================================================================
// SETTINGS OPERATIONS
// =============================================================================

/// Get global settings (or return defaults if none exist)
async fn get_settings(
    State(db): State<Arc<Database>>,
) -> Result<impl IntoResponse, ApiError> {
    // Settings are stored as a singleton record with ID "global_settings:default"
    let settings: Result<Option<GlobalSettings>, _> = db
        .select(("global_settings", "default"))
        .await;

    match settings {
        Ok(Some(settings)) => Ok(Json(settings)),
        Ok(None) => {
            // No settings exist yet - create and return defaults
            let default_settings = GlobalSettings::default();
            
            let created: Result<Option<GlobalSettings>, _> = db
                .create(("global_settings", "default"))
                .content(default_settings.clone())
                .await;

            match created {
                Ok(Some(settings)) => Ok(Json(settings)),
                _ => Err(ApiError::InternalError(
                    "Failed to create default settings".to_string(),
                )),
            }
        }
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}

/// Update global settings
async fn update_settings(
    State(db): State<Arc<Database>>,
    Json(request): Json<UpdateSettingsRequest>,
) -> Result<impl IntoResponse, ApiError> {
    // Get current settings (or defaults if none exist)
    let current: Result<Option<GlobalSettings>, _> = db
        .select(("global_settings", "default"))
        .await;

    let mut settings = match current {
        Ok(Some(s)) => s,
        Ok(None) => GlobalSettings::default(),
        Err(e) => return Err(ApiError::InternalError(e.to_string())),
    };

    // Update fields (only if provided in request)
    if let Some(ratios) = request.default_overcommit_ratios {
        settings.default_overcommit_ratios = ratios;
    }
    if let Some(factors) = request.timeline_factors {
        settings.timeline_factors = factors;
    }
    if let Some(name) = request.organization_name {
        settings.organization_name = Some(name);
    }
    if let Some(id) = request.organization_id {
        settings.organization_id = Some(id);
    }
    if let Some(features) = request.features {
        settings.features = features;
    }

    settings.updated_by = request.updated_by;
    settings.updated_at = Utc::now();

    // Save updated settings
    let updated: Result<Option<GlobalSettings>, _> = db
        .update(("global_settings", "default"))
        .content(settings)
        .await;

    match updated {
        Ok(Some(settings)) => Ok(Json(settings)),
        Ok(None) => Err(ApiError::NotFound("Settings not found".to_string())),
        Err(e) => Err(ApiError::InternalError(e.to_string())),
    }
}
