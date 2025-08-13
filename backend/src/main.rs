use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

mod api;
mod models;
mod database;
mod hardware_basket_api;
mod parser;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize database
    let db_state = database::init_database().await?;
    
    // build our application with the API router
    let app = api::api_router(db_state)
        .layer(CorsLayer::permissive()); // Add CORS for frontend

    // run it with hyper on localhost:3000 (Axum 0.6 style)
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 InfraAID backend listening on {}", addr);
    println!("📊 Database initialized and ready");
    
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await?;
        
    Ok(())
}
