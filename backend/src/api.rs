use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use crate::database::Database;
use crate::models::*;
use crate::migration_api::MigrationApi;
use crate::hardware_basket_api;
use anyhow::Result;
use std::sync::Arc;

pub type AppState = Arc<Database>;

pub fn api_router(db: Database) -> Router {
    let state = Arc::new(db);
    
    Router::new()
        .route("/health", get(health_check))
        .nest("/api",
            Router::new()
                .nest("/auth", auth_routes())
                .nest("/projects", projects_routes())
                .nest("/users", users_routes())
                .nest("/migration", migration_routes())
                .merge(hardware_basket_api::hardware_basket_routes())
        )
        .with_state(state)
}

async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "status": "OK",
        "message": "InfraAID backend is running",
        "version": "1.0.0"
    }))
}

fn auth_routes() -> Router<AppState> {
    Router::new()
        .route("/login", post(auth_login))
        .route("/logout", post(auth_logout))
        .route("/me", get(auth_me))
}

fn projects_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_projects).post(create_project))
        .route("/:id", get(get_project).put(update_project).delete(delete_project))
        .route("/:projectId/hardware", get(list_hardware).post(add_hardware))
        .route("/:projectId/hardware/:id", get(get_hardware).put(update_hardware).delete(delete_hardware))
        .nest("/:projectId/design-docs", design_docs_routes())
}

fn users_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_users).post(create_user))
}

fn hardware_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_hardware).post(add_hardware))
        .route("/:id", get(get_hardware).put(update_hardware).delete(delete_hardware))
}

fn design_docs_routes() -> Router<AppState> {
    Router::new()
        .route("/", get(list_design_docs).post(create_design_doc))
        .route("/:id", get(get_design_doc).put(update_design_doc).delete(delete_design_doc))
}

// Auth handlers
async fn auth_login() -> Result<Json<serde_json::Value>, StatusCode> {
    // TODO: Implement real authentication
    Ok(Json(serde_json::json!({
        "message": "Login successful",
        "token": "mock-jwt-token"
    })))
}

async fn auth_logout() -> Result<Json<serde_json::Value>, StatusCode> {
    Ok(Json(serde_json::json!({
        "message": "Logout successful"
    })))
}

async fn auth_me() -> Result<Json<serde_json::Value>, StatusCode> {
    // TODO: Get current user from token
    Ok(Json(serde_json::json!({
        "id": "user:admin",
        "username": "admin",
        "email": "admin@company.com",
        "role": "admin"
    })))
}

// Project handlers
async fn list_projects(State(db): State<AppState>) -> Result<Json<Vec<ProjectResponse>>, StatusCode> {
    let projects: Vec<Project> = db.select("project").await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let response: Vec<ProjectResponse> = projects.into_iter().map(ProjectResponse::from).collect();
    Ok(Json(response))
}

async fn create_project(
    State(db): State<AppState>,
    Json(req): Json<CreateProjectRequest>
) -> Result<Json<ProjectResponse>, StatusCode> {
    use surrealdb::sql::Thing;
    let project = Project {
        id: None,
        name: req.name,
        description: req.description,
        owner_id: Thing::from(("user", "admin")),
        created_at: chrono::Utc::now(),
        updated_at: chrono::Utc::now(),
    };
    
    let created: Vec<Project> = db.create("project")
        .content(project)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match created.into_iter().next() {
        Some(project) => Ok(Json(ProjectResponse::from(project))),
        None => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_project(
    State(db): State<AppState>,
    Path(id): Path<String>
) -> Result<Json<ProjectResponse>, StatusCode> {
    let project: Option<Project> = db.select(("project", &id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match project {
        Some(project) => Ok(Json(ProjectResponse::from(project))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_project(
    State(db): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateProjectRequest>
) -> Result<Json<ProjectResponse>, StatusCode> {
    // Get existing project
    let mut project: Option<Project> = db.select(("project", &id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let mut project = project.ok_or(StatusCode::NOT_FOUND)?;
    
    // Update fields
    if let Some(name) = req.name {
        project.name = name;
    }
    if let Some(description) = req.description {
        project.description = description;
    }
    project.updated_at = chrono::Utc::now();
    
    // Save updated project
    let updated: Option<Project> = db.update(("project", &id))
        .content(project)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match updated {
        Some(project) => Ok(Json(ProjectResponse::from(project))),
        None => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn delete_project(
    State(db): State<AppState>,
    Path(id): Path<String>
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _deleted: Option<Project> = db.delete(("project", &id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(serde_json::json!({
        "message": "Project deleted successfully"
    })))
}

// User handlers
async fn list_users(State(db): State<AppState>) -> Result<Json<Vec<User>>, StatusCode> {
    let users: Vec<User> = db.select("user")
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(users))
}

async fn create_user() -> Result<Json<serde_json::Value>, StatusCode> {
    // TODO: Implement user creation
    Ok(Json(serde_json::json!({"message": "User creation not implemented yet"})))
}

// Hardware handlers
async fn list_hardware(
    State(db): State<AppState>,
    Path(project_id): Path<String>
) -> Result<Json<Vec<HardwareResponse>>, StatusCode> {
    use surrealdb::sql::Thing;
    let project_thing = Thing::from(("project", project_id.as_str()));
    let mut result = db.query("SELECT * FROM hardware WHERE project_id = $project_id")
        .bind(("project_id", project_thing))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let hardware_items: Vec<HardwareItem> = result.take(0).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let response: Vec<HardwareResponse> = hardware_items.into_iter().map(HardwareResponse::from).collect();
    Ok(Json(response))
}

async fn add_hardware(
    State(db): State<AppState>,
    Path(project_id): Path<String>,
    Json(req): Json<CreateHardwareRequest>
) -> Result<Json<HardwareResponse>, StatusCode> {
    use surrealdb::sql::Thing;
    
    let hardware = HardwareItem {
        id: None,
        project_id: Thing::from(("project", project_id.as_str())),
        name: req.name,
        vendor: req.vendor,
        model: req.model,
        specs: req.specs,
    };
    
    let created: Vec<HardwareItem> = db.create("hardware")
        .content(hardware)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match created.into_iter().next() {
        Some(hardware) => Ok(Json(HardwareResponse::from(hardware))),
        None => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_hardware(
    State(db): State<AppState>,
    Path((project_id, hardware_id)): Path<(String, String)>
) -> Result<Json<HardwareResponse>, StatusCode> {
    let hardware: Option<HardwareItem> = db.select(("hardware", &hardware_id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match hardware {
        Some(hardware) => Ok(Json(HardwareResponse::from(hardware))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn update_hardware(
    State(db): State<AppState>,
    Path((project_id, hardware_id)): Path<(String, String)>,
    Json(req): Json<UpdateHardwareRequest>
) -> Result<Json<HardwareResponse>, StatusCode> {
    // Get existing hardware
    let mut hardware: Option<HardwareItem> = db.select(("hardware", &hardware_id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let mut hardware = hardware.ok_or(StatusCode::NOT_FOUND)?;
    
    // Update fields
    if let Some(name) = req.name {
        hardware.name = name;
    }
    if let Some(vendor) = req.vendor {
        hardware.vendor = vendor;
    }
    if let Some(model) = req.model {
        hardware.model = model;
    }
    if let Some(specs) = req.specs {
        hardware.specs = specs;
    }
    
    // Save updated hardware
    let updated: Option<HardwareItem> = db.update(("hardware", &hardware_id))
        .content(hardware)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match updated {
        Some(hardware) => Ok(Json(HardwareResponse::from(hardware))),
        None => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn delete_hardware(
    State(db): State<AppState>,
    Path((project_id, hardware_id)): Path<(String, String)>
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _deleted: Option<HardwareItem> = db.delete(("hardware", &hardware_id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(serde_json::json!({
        "message": "Hardware item deleted successfully"
    })))
}

// Design Document endpoints
pub async fn list_design_docs(
    State(db): State<AppState>,
    Path(project_id): Path<String>
) -> Result<Json<Vec<DesignDocResponse>>, StatusCode> {
    let mut result = db.query("SELECT * FROM design_documents WHERE project_id = $project_id")
        .bind(("project_id", format!("projects:{}", project_id)))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let docs: Vec<DesignDocument> = result.take(0).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let responses: Vec<DesignDocResponse> = docs.into_iter().map(DesignDocResponse::from).collect();
    Ok(Json(responses))
}

pub async fn create_design_doc(
    State(db): State<AppState>,
    Path(project_id): Path<String>,
    Json(payload): Json<CreateDesignDocRequest>
) -> Result<Json<DesignDocResponse>, StatusCode> {
    let doc = DesignDocument {
        id: None,
        project_id: format!("projects:{}", project_id).parse().unwrap(),
        name: payload.name,
        doc_type: payload.doc_type,
        content: payload.content,
    };
    
    let created: Vec<DesignDocument> = db.create("design_documents")
        .content(doc)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let doc = created.first().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
    Ok(Json(DesignDocResponse::from(doc.clone())))
}

pub async fn get_design_doc(
    State(db): State<AppState>,
    Path((_project_id, doc_id)): Path<(String, String)>
) -> Result<Json<DesignDocResponse>, StatusCode> {
    let doc: Option<DesignDocument> = db.select(("design_documents", &doc_id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match doc {
        Some(doc) => Ok(Json(DesignDocResponse::from(doc))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn update_design_doc(
    State(db): State<AppState>,
    Path((_project_id, doc_id)): Path<(String, String)>,
    Json(payload): Json<UpdateDesignDocRequest>
) -> Result<Json<DesignDocResponse>, StatusCode> {
    let mut updates = serde_json::Map::new();
    if let Some(name) = payload.name {
        updates.insert("name".to_string(), serde_json::Value::String(name));
    }
    if let Some(doc_type) = payload.doc_type {
        updates.insert("doc_type".to_string(), serde_json::Value::String(doc_type));
    }
    if let Some(content) = payload.content {
        updates.insert("content".to_string(), serde_json::Value::String(content));
    }
    
    let updated: Option<DesignDocument> = db.update(("design_documents", &doc_id))
        .merge(serde_json::Value::Object(updates))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    match updated {
        Some(doc) => Ok(Json(DesignDocResponse::from(doc))),
        None => Err(StatusCode::NOT_FOUND),
    }
}

pub async fn delete_design_doc(
    State(db): State<AppState>,
    Path((_project_id, doc_id)): Path<(String, String)>
) -> Result<Json<serde_json::Value>, StatusCode> {
    let _deleted: Option<DesignDocument> = db.delete(("design_documents", &doc_id))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(serde_json::json!({
        "message": "Design document deleted successfully"
    })))
}

fn migration_routes() -> Router<AppState> {
    Router::new()
        .route("/projects", get(MigrationApi::list_migration_projects).post(MigrationApi::create_migration_project))
        .route("/projects/:id", get(MigrationApi::get_migration_project))
        .route("/projects/:id/tasks", get(MigrationApi::list_migration_tasks).post(MigrationApi::create_migration_task))
        .route("/projects/:id/template/:template_id", post(MigrationApi::apply_project_template))
        .route("/tasks/:id/status", put(MigrationApi::update_task_status))
}
