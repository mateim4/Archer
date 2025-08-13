use axum::{
    routing::{get, post},
    Router,
};

pub fn routes() -> Router {
    Router::new()
        .route("/hardware-baskets", get(get_hardware_baskets).post(create_hardware_basket))
        .route("/hardware-baskets/:id", get(get_hardware_basket))
        .route("/hardware-baskets/:id/upload", post(upload_hardware_basket))
        .route("/hardware-baskets/:id/models", get(get_hardware_basket_models))
}

async fn get_hardware_baskets() -> &'static str {
    "Hello, World!"
}

async fn create_hardware_basket() -> &'static str {
    "Hello, World!"
}

async fn get_hardware_basket() -> &'static str {
    "Hello, World!"
}

async fn upload_hardware_basket() -> &'static str {
    "Hello, World!"
}

async fn get_hardware_basket_models() -> &'static str {
    "Hello, World!"
}
