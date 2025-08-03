use axum::{
    routing::get,
    Router,
};

pub fn api_router() -> Router {
    Router::new()
        .nest("/api",
            Router::new()
                .nest("/auth", auth_routes())
                .nest("/projects", projects_routes())
                .nest("/users", users_routes())
        )
}

fn auth_routes() -> Router {
    Router::new()
        .route("/login", get(|| async { "TODO: Implement login" }))
        .route("/logout", get(|| async { "TODO: Implement logout" }))
        .route("/me", get(|| async { "TODO: Implement get current user" }))
}

fn projects_routes() -> Router {
    Router::new()
        .route("/", get(|| async { "TODO: Implement list projects" }).post(|| async { "TODO: Implement create project" }))
        .route("/:id", get(|| async { "TODO: Implement get project" }).put(|| async { "TODO: Implement update project" }).delete(|| async { "TODO: Implement delete project" }))
        .nest("/:projectId/hardware", hardware_routes())
}

fn users_routes() -> Router {
    Router::new()
        .route("/", get(|| async { "TODO: Implement list users" }).post(|| async { "TODO: Implement create user" }))
}

fn hardware_routes() -> Router {
    Router::new()
        .route("/", get(|| async { "TODO: Implement list hardware" }).post(|| async { "TODO: Implement add hardware" }))
}
