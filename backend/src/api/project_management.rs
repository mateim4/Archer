use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{Json, IntoResponse},
    routing::{get, post, put, delete},
    Router,
};
use crate::database::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        // Projects
        .route("/projects", get(get_projects).post(create_project))
        .route("/projects/:id", get(get_project).put(update_project).delete(delete_project))

        // Activities
        .route("/projects/:project_id/activities", get(get_activities).post(create_activity))
        .route("/activities/:id", get(get_activity).put(update_activity).delete(delete_activity))
        .route("/activities/:id/dependencies", get(get_dependencies).put(update_dependencies))

        // Server Inventory
        .route("/servers", get(get_servers).post(create_server))
        .route("/servers/:id", get(get_server).put(update_server).delete(delete_server))
        .route("/servers/import-rvtools", post(import_rvtools))

        // Free Hardware Pool
        .route("/hardware-pool", get(get_free_hardware))
        .route("/hardware-pool/:server_id", post(add_to_pool).delete(remove_from_pool))

        // Capacity Calculations
        .route("/activities/:id/sizing", get(calculate_capacity_sizing))
        .route("/activities/:id/recommendations", get(get_hardware_recommendations))
}

// Projects
async fn get_projects(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_projects") }
async fn create_project(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "create_project") }
async fn get_project(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_project") }
async fn update_project(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "update_project") }
async fn delete_project(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "delete_project") }

// Activities
async fn get_activities(Path(_project_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_activities") }
async fn create_activity(Path(_project_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "create_activity") }
async fn get_activity(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_activity") }
async fn update_activity(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "update_activity") }
async fn delete_activity(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "delete_activity") }
async fn get_dependencies(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_dependencies") }
async fn update_dependencies(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "update_dependencies") }

// Server Inventory
async fn get_servers(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_servers") }
async fn create_server(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "create_server") }
async fn get_server(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_server") }
async fn update_server(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "update_server") }
async fn delete_server(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "delete_server") }
async fn import_rvtools(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "import_rvtools") }

// Free Hardware Pool
async fn get_free_hardware(State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_free_hardware") }
async fn add_to_pool(Path(_server_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "add_to_pool") }
async fn remove_from_pool(Path(_server_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "remove_from_pool") }

// Capacity Calculations
async fn calculate_capacity_sizing(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "calculate_capacity_sizing") }
async fn get_hardware_recommendations(Path(_id): Path<String>, State(_db): State<AppState>) -> impl IntoResponse { (StatusCode::NOT_IMPLEMENTED, "get_hardware_recommendations") }
