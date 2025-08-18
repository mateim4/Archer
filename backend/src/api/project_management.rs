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
#[derive(Debug, Serialize, Deserialize)]
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

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{
        body::Body,
        http::{Request, StatusCode},
    };
    use serde_json::json;
    use surrealdb::engine::local::Mem;
    use surrealdb::Surreal;
    use tower::util::ServiceExt; // for `oneshot`

    /// Helper function to set up an AppState with an in-memory database.
    async fn setup_app_state() -> AppState {
        let db = Surreal::new::<Mem>(()).await.expect("Failed to create in-memory db");
        db.use_ns("test").use_db("test").await.expect("Failed to use test ns/db");
        AppState::new(db)
    }

    #[tokio::test]
    async fn test_create_project_happy_path() {
        // Arrange
        let app_state = setup_app_state().await;
        let app = routes().with_state(app_state);

        let payload = json!({
            "name": "Test Project",
            "description": "A description for our test project."
        });

        // Act
        let request = Request::builder()
            .method("POST")
            .uri("/projects")
            .header("Content-Type", "application/json")
            .body(Body::from(serde_json::to_string(&payload).unwrap()))
            .unwrap();

        let response = app.oneshot(request).await.unwrap();

        // Assert
        assert_eq!(response.status(), StatusCode::CREATED);

        let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
        let project_response: ProjectResponse = serde_json::from_slice(&body).unwrap();

        assert_eq!(project_response.name, "Test Project");
        assert_eq!(project_response.description, "A description for our test project.");
        assert!(project_response.id.starts_with("project:"));
    }
}
