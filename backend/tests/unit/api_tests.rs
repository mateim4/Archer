use axum::http::StatusCode;
use axum_test::TestServer;
use serde_json::{json, Value};
use backend::api::hardware_baskets::*;
use backend::database::DatabaseManager;

mod test_helpers;
use test_helpers::*;

async fn create_test_app() -> axum::Router {
    let db = DatabaseManager::new().await.unwrap();
    
    axum::Router::new()
        .route("/api/v1/hardware-baskets", axum::routing::get(list_baskets).post(create_basket))
        .route("/api/v1/hardware-baskets/:id", axum::routing::get(get_basket).delete(delete_basket))
        .with_state(db)
}

#[tokio::test]
async fn test_create_hardware_basket_endpoint() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server
        .post("/api/v1/hardware-baskets")
        .json(&json!({
            "name": "Test Basket API",
            "vendor": "Dell",
            "description": "Test basket created via API"
        }))
        .await;

    assert_eq!(response.status_code(), StatusCode::CREATED);
    
    let basket: Value = response.json();
    assert_eq!(basket["name"], "Test Basket API");
    assert_eq!(basket["vendor"], "Dell");
}

#[tokio::test]
async fn test_list_hardware_baskets_endpoint() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server
        .get("/api/v1/hardware-baskets")
        .await;

    assert_eq!(response.status_code(), StatusCode::OK);
    
    let baskets: Value = response.json();
    assert!(baskets.is_array());
}

#[tokio::test]
async fn test_get_hardware_basket_endpoint() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    // First create a basket
    let create_response = server
        .post("/api/v1/hardware-baskets")
        .json(&json!({
            "name": "Test Get Basket",
            "vendor": "Lenovo"
        }))
        .await;

    let created_basket: Value = create_response.json();
    let basket_id = created_basket["id"].as_str().unwrap();

    // Then get it
    let get_response = server
        .get(&format!("/api/v1/hardware-baskets/{}", basket_id))
        .await;

    assert_eq!(get_response.status_code(), StatusCode::OK);
    
    let basket: Value = get_response.json();
    assert_eq!(basket["name"], "Test Get Basket");
    assert_eq!(basket["vendor"], "Lenovo");
}

#[tokio::test]
async fn test_delete_hardware_basket_endpoint() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    // First create a basket
    let create_response = server
        .post("/api/v1/hardware-baskets")
        .json(&json!({
            "name": "Test Delete Basket",
            "vendor": "HPE"
        }))
        .await;

    let created_basket: Value = create_response.json();
    let basket_id = created_basket["id"].as_str().unwrap();

    // Then delete it
    let delete_response = server
        .delete(&format!("/api/v1/hardware-baskets/{}", basket_id))
        .await;

    assert_eq!(delete_response.status_code(), StatusCode::NO_CONTENT);

    // Verify it's gone
    let get_response = server
        .get(&format!("/api/v1/hardware-baskets/{}", basket_id))
        .await;

    assert_eq!(get_response.status_code(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_invalid_basket_creation() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    // Try to create basket without required fields
    let response = server
        .post("/api/v1/hardware-baskets")
        .json(&json!({
            "vendor": "Dell"
            // missing required "name" field
        }))
        .await;

    assert_eq!(response.status_code(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_get_nonexistent_basket() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server
        .get("/api/v1/hardware-baskets/nonexistent-id")
        .await;

    assert_eq!(response.status_code(), StatusCode::NOT_FOUND);
}