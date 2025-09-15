use std::sync::Arc;
use surrealdb::engine::local::{Db, Mem};
use surrealdb::Surreal;

pub mod migrations;

pub type Database = Surreal<Db>;
pub type AppState = Arc<Database>;

pub async fn init_database() -> Result<AppState, surrealdb::Error> {
    let db = Surreal::new::<Mem>(()).await?;
    db.use_ns("lcm_designer").use_db("main_db").await?;
    
    // Run enhanced RVTools migrations
    if let Err(e) = migrations::EnhancedRvToolsMigrations::run_all(&db).await {
        tracing::warn!("Failed to run enhanced RVTools migrations: {}", e);
    } else {
        tracing::info!("📊 Enhanced RVTools migrations completed successfully");
    }
    
    Ok(Arc::new(db))
}

// TODO: Create a wrapper type instead of implementing on external Database type
// impl Database {
//     #[cfg(test)]
//     pub async fn new_test() -> Result<Self, surrealdb::Error> {
//         let db = Surreal::new::<Mem>(()).await?;
//         db.use_ns("test_ns").use_db("test_db").await?;
//         Ok(db)
//     }
// }
