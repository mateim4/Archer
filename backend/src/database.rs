use surrealdb::{Surreal, engine::local::Mem};
use anyhow::Result;

pub type Database = Surreal<surrealdb::engine::local::Db>;

pub async fn init_database() -> Result<Database> {
    // Initialize in-memory database for development
    let db = Surreal::new::<Mem>(()).await?;
    
    // Use namespace and database
    db.use_ns("infraaid").use_db("main").await?;
    
    // Initialize schema and sample data
    init_schema(&db).await?;
    
    Ok(db)
}

async fn init_schema(db: &Database) -> Result<()> {
    // Create sample user
    let _user: Vec<crate::models::User> = db.create("user")
        .content(crate::models::User {
            id: None,
            username: "admin".to_string(),
            email: "admin@company.com".to_string(),
            ad_guid: "sample-guid-123".to_string(),
            role: "admin".to_string(),
        })
        .await?;
    
    // Create sample project
    let _project: Vec<crate::models::Project> = db.create("project")
        .content(crate::models::Project {
            id: None,
            name: "Sample Infrastructure Project".to_string(),
            description: "A demo project for InfraAID system".to_string(),
            owner_id: surrealdb::sql::Thing::from(("user", "admin")),
            created_at: chrono::Utc::now().into(),
            updated_at: chrono::Utc::now().into(),
        })
        .await?;
    
    println!("✅ Database schema initialized with sample data");
    Ok(())
}
