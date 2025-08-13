use std::sync::Arc;
use surrealdb::engine::local::{Db, Mem};
use surrealdb::Surreal;

pub type Database = Surreal<Db>;
pub type AppState = Arc<Database>;

pub async fn init_database() -> Result<AppState, surrealdb::Error> {
    let db = Surreal::new::<Mem>(()).await?;
    db.use_ns("lcm_designer").use_db("main_db").await?;
    Ok(Arc::new(db))
}
