use std::net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener as StdTcpListener};
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use axum::middleware::from_fn;

mod api;
mod models;
mod database;
mod migration_models;
mod services;
mod utils;
mod middleware;
// mod hardware_basket_api; // Disabled - using new api/hardware_baskets.rs
// mod parser; // Disabled - using new parser in core-engine

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "info,tower_http=info,backend=info");
    }
    tracing_subscriber::fmt::init();
    
    // Initialize document storage
    if let Err(e) = services::document_service::DocumentService::init_storage() {
        tracing::warn!("Failed to initialize document storage: {}", e);
    } else {
        tracing::info!("📁 Document storage initialized");
    }
    
    // Initialize database with enhanced error handling
    let db_state = match database::init_database().await {
        Ok(state) => {
            tracing::info!("📊 Database initialized successfully");
            state
        }
        Err(e) => {
            tracing::error!("Failed to initialize database: {}", e);
            return Err(e.into());
        }
    };
    
    // build our application with the API router and middleware
    let app = api::api_router(db_state)
        .layer(from_fn(middleware::error_handler))
        .layer(from_fn(middleware::request_logger))
        .layer(from_fn(middleware::validate_json_content_type))
        .layer(from_fn(middleware::validate_request_size))
        .layer(CorsLayer::permissive()) // Add CORS for frontend
        .layer(TraceLayer::new_for_http());

    // Determine bind host/port from env, prioritize Rust backend on 3001
    let host: IpAddr = std::env::var("RUST_BACKEND_HOST")
        .or_else(|_| std::env::var("BACKEND_HOST"))
        .ok()
        .and_then(|s| s.parse::<IpAddr>().ok())
        .unwrap_or(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)));
    let base_port: u16 = std::env::var("RUST_BACKEND_PORT")
        .or_else(|_| std::env::var("BACKEND_PORT"))
        .ok()
        .and_then(|s| s.parse::<u16>().ok())
        .unwrap_or(3001);

    // Try a small range of ports to avoid failing when 3001 is in use
    let mut bound: Option<(StdTcpListener, u16)> = None;
    for port in base_port..=(base_port + 4) {
        let addr = SocketAddr::new(host, port);
        match StdTcpListener::bind(addr) {
            Ok(listener) => {
                listener.set_nonblocking(true).ok();
                bound = Some((listener, port));
                break;
            }
            Err(e) => {
                eprintln!("⚠️ Port {} unavailable ({}), trying next...", port, e);
            }
        }
    }

    let (std_listener, chosen_port) = bound.ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::AddrInUse, "No available port in range")
    })?;

    let addr = SocketAddr::new(host, chosen_port);
    println!("🚀 LCMDesigner Rust Backend listening on {}", addr);
    println!("📊 Database initialized and ready");
    println!("🔧 API endpoints:");
    println!("   • Health check: http://{}:{}/health", host, chosen_port);
    println!("   • API v1: http://{}:{}/api/v1", host, chosen_port);
    println!("   • Hardware baskets: http://{}:{}/api/v1/hardware-baskets", host, chosen_port);
    println!("   • Projects: http://{}:{}/api/v1/projects", host, chosen_port);

    axum::Server::from_tcp(std_listener)?
        .serve(app.into_make_service())
        .await?;
        
    Ok(())
}
