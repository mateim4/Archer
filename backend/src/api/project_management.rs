use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{post},
    Router,
};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

use crate::database::AppState;
use core_engine::models::project::Project;

/// The request payload for creating a new project.
#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: String,
}

/// The response payload for a project.
#[derive(Debug, Serialize)]
pub struct ProjectResponse {
    pub id: String,
    pub name: String,
    pub description: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Handler to create a new project.
pub async fn create_project(
    State(app_state): State<AppState>,
    Json(payload): Json<CreateProjectRequest>,
) -> impl IntoResponse {
    let project = Project::new(payload.name, payload.description);

    let created: Result<Vec<Project>, surrealdb::Error> = app_state
        .create("project")
        .content(&project)
        .await;

    match created {
        Ok(mut created_projects) => {
            if let Some(created_project) = created_projects.pop() {
                let response = ProjectResponse {
                    id: created_project.id.as_ref().unwrap().to_string(),
                    name: created_project.name,
                    description: created_project.description,
                    start_date: created_project.start_date,
                    end_date: created_project.end_date,
                    created_at: created_project.created_at,
                    updated_at: created_project.updated_at,
                };
                (StatusCode::CREATED, Json(response)).into_response()
            } else {
                (StatusCode::INTERNAL_SERVER_ERROR, Json("Failed to create project: No record returned")).into_response()
            }
        }
        Err(e) => {
            (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Failed to create project: {}", e))).into_response()
        }
    }
}

/// Defines the routes for the project management API.
pub fn routes() -> Router<AppState> {
    Router::new().route("/projects", post(create_project))
}
