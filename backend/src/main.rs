use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

mod api;
mod models;
mod database;
mod migration_models;
mod migration_api;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize database
    let db = database::init_database().await?;
    
    // build our application with the API router
    let app = api::api_router(db)
        .layer(CorsLayer::permissive()); // Add CORS for frontend

    // run it with hyper on localhost:3000
    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    println!("🚀 InfraAID backend listening on {}", listener.local_addr()?);
    println!("📊 Database initialized and ready");
    
    axum::serve(listener, app)
        .await?;
        
    Ok(())
}
