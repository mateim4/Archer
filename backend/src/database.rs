use crate::utils::api_response::{helpers, ApiResponse};
use std::sync::Arc;
use surrealdb::engine::local::{Db, Mem};
use surrealdb::Surreal;
use tracing::{error, info, warn};

pub mod migrations;

pub type Database = Surreal<Db>;
pub type AppState = Arc<Database>;

/// Database initialization configuration
#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub namespace: String,
    pub database: String,
    pub enable_migrations: bool,
    pub connection_pool_size: usize,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            namespace: "lcm_designer".to_string(),
            database: "main_db".to_string(),
            enable_migrations: true,
            connection_pool_size: 10,
        }
    }
}

/// Database initialization with comprehensive error handling
pub async fn init_database() -> Result<AppState, DatabaseError> {
    let config = DatabaseConfig::default();
    init_database_with_config(config).await
}

/// Initialize database with custom configuration
pub async fn init_database_with_config(config: DatabaseConfig) -> Result<AppState, DatabaseError> {
    info!(
        "🗄️  Initializing SurrealDB with namespace: {} database: {}",
        config.namespace, config.database
    );

    // Initialize SurrealDB connection
    let db = Surreal::new::<Mem>(())
        .await
        .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;

    // Set namespace and database
    db.use_ns(&config.namespace)
        .use_db(&config.database)
        .await
        .map_err(|e| DatabaseError::NamespaceSetupFailed(e.to_string()))?;

    info!("✅ Database connection established");

    // Run migrations if enabled
    if config.enable_migrations {
        if let Err(e) = run_all_migrations(&db).await {
            warn!("Migration warnings occurred: {}", e);
        } else {
            info!("📊 All database migrations completed successfully");
        }
    }

    // Test database connection
    if let Err(e) = test_database_connection(&db).await {
        error!("Database connection test failed: {}", e);
        return Err(e);
    }

    info!("🚀 Database initialization complete");
    Ok(Arc::new(db))
}

/// Create a test database instance (for testing only)
#[cfg(any(test, feature = "test-utils"))]
pub async fn new_test() -> Result<Database, DatabaseError> {
    let db = Surreal::new::<Mem>(())
        .await
        .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;

    db.use_ns("test_namespace")
        .use_db("test_db")
        .await
        .map_err(|e| DatabaseError::NamespaceSetupFailed(e.to_string()))?;

    Ok(db)
}

/// Run all database migrations
async fn run_all_migrations(db: &Database) -> Result<(), DatabaseError> {
    info!("Running database migrations...");

    // Authentication & RBAC migrations (Phase 0 - Foundation)
    if let Err(e) = migrations::AuthMigrations::run_all(db).await {
        warn!("Auth/RBAC migrations failed: {}", e);
    } else {
        info!("✅ Auth/RBAC migrations completed");
    }

    // Enhanced Ticket System migrations (Phase 1)
    if let Err(e) = migrations::TicketMigrations::run_all(db).await {
        warn!("Ticket system migrations failed: {}", e);
    } else {
        info!("✅ Ticket system migrations completed");
    }

    // Knowledge Base migrations (Phase 1.5)
    if let Err(e) = migrations::KnowledgeBaseMigrations::run_all(db).await {
        warn!("Knowledge Base migrations failed: {}", e);
    } else {
        info!("✅ Knowledge Base migrations completed");
    }

    // CMDB migrations (Phase 2)
    if let Err(e) = migrations::CMDBMigrations::run_all(db).await {
        warn!("CMDB migrations failed: {}", e);
    } else {
        info!("✅ CMDB migrations completed");
    }

    // Enhanced RVTools migrations
    if let Err(e) = migrations::EnhancedRvToolsMigrations::run_all(db).await {
        warn!("Enhanced RVTools migrations failed: {}", e);
    } else {
        info!("✅ Enhanced RVTools migrations completed");
    }

    // Hardware basket migrations
    if let Err(e) = run_hardware_basket_migrations(db).await {
        warn!("Hardware basket migrations failed: {}", e);
    } else {
        info!("✅ Hardware basket migrations completed");
    }

    // Project management migrations
    if let Err(e) = run_project_management_migrations(db).await {
        warn!("Project management migrations failed: {}", e);
    } else {
        info!("✅ Project management migrations completed");
    }

    // Migration planning migrations (new)
    if let Err(e) = migrations::MigrationPlanningMigrations::run_all(db).await {
        warn!("Migration planning migrations failed: {}", e);
    } else {
        info!("✅ Migration planning migrations completed");
    }

    Ok(())
}

/// Hardware basket specific migrations
async fn run_hardware_basket_migrations(db: &Database) -> Result<(), DatabaseError> {
    info!("Running hardware basket migrations...");

    // Create hardware basket table with proper relationships
    let basket_schema = r#"
        DEFINE TABLE hardware_basket SCHEMAFULL;
        DEFINE FIELD name ON TABLE hardware_basket TYPE string;
        DEFINE FIELD vendor ON TABLE hardware_basket TYPE string;
        DEFINE FIELD quarter ON TABLE hardware_basket TYPE string;
        DEFINE FIELD year ON TABLE hardware_basket TYPE int;
        DEFINE FIELD filename ON TABLE hardware_basket TYPE string;
        DEFINE FIELD quotation_date ON TABLE hardware_basket TYPE datetime;
        DEFINE FIELD created_at ON TABLE hardware_basket TYPE datetime DEFAULT time::now();
        DEFINE FIELD updated_at ON TABLE hardware_basket TYPE datetime DEFAULT time::now();
        DEFINE FIELD total_models ON TABLE hardware_basket TYPE int DEFAULT 0;
        DEFINE FIELD status ON TABLE hardware_basket TYPE string DEFAULT 'active';
        
        DEFINE INDEX hardware_basket_vendor_idx ON TABLE hardware_basket COLUMNS vendor;
        DEFINE INDEX hardware_basket_year_idx ON TABLE hardware_basket COLUMNS year;
        DEFINE INDEX hardware_basket_status_idx ON TABLE hardware_basket COLUMNS status;
    "#;

    db.query(basket_schema)
        .await
        .map_err(|e| DatabaseError::MigrationFailed(format!("Hardware basket schema: {}", e)))?;

    // Create hardware model table
    let model_schema = r#"
        DEFINE TABLE hardware_model SCHEMAFULL;
        DEFINE FIELD basket_id ON TABLE hardware_model TYPE record(hardware_basket);
        DEFINE FIELD model_name ON TABLE hardware_model TYPE string;
        DEFINE FIELD sku ON TABLE hardware_model TYPE string;
        DEFINE FIELD form_factor ON TABLE hardware_model TYPE string;
        DEFINE FIELD cpu_specs ON TABLE hardware_model TYPE object;
        DEFINE FIELD memory_specs ON TABLE hardware_model TYPE object;
        DEFINE FIELD storage_specs ON TABLE hardware_model TYPE object;
        DEFINE FIELD network_specs ON TABLE hardware_model TYPE object;
        DEFINE FIELD created_at ON TABLE hardware_model TYPE datetime DEFAULT time::now();
        
        DEFINE INDEX hardware_model_basket_idx ON TABLE hardware_model COLUMNS basket_id;
        DEFINE INDEX hardware_model_sku_idx ON TABLE hardware_model COLUMNS sku;
    "#;

    db.query(model_schema)
        .await
        .map_err(|e| DatabaseError::MigrationFailed(format!("Hardware model schema: {}", e)))?;

    // Create pricing table
    let pricing_schema = r#"
        DEFINE TABLE hardware_pricing SCHEMAFULL;
        DEFINE FIELD model_id ON TABLE hardware_pricing TYPE record(hardware_model);
        DEFINE FIELD list_price ON TABLE hardware_pricing TYPE decimal;
        DEFINE FIELD discount_price ON TABLE hardware_pricing TYPE decimal;
        DEFINE FIELD currency ON TABLE hardware_pricing TYPE string DEFAULT 'USD';
        DEFINE FIELD valid_from ON TABLE hardware_pricing TYPE datetime;
        DEFINE FIELD valid_until ON TABLE hardware_pricing TYPE datetime;
        DEFINE FIELD created_at ON TABLE hardware_pricing TYPE datetime DEFAULT time::now();
        
        DEFINE INDEX hardware_pricing_model_idx ON TABLE hardware_pricing COLUMNS model_id;
        DEFINE INDEX hardware_pricing_valid_idx ON TABLE hardware_pricing COLUMNS valid_from, valid_until;
    "#;

    db.query(pricing_schema)
        .await
        .map_err(|e| DatabaseError::MigrationFailed(format!("Hardware pricing schema: {}", e)))?;

    Ok(())
}

/// Project management specific migrations
async fn run_project_management_migrations(db: &Database) -> Result<(), DatabaseError> {
    info!("Running project management migrations...");

    let project_schema = r#"
        DEFINE TABLE project SCHEMAFULL;
        DEFINE FIELD name ON TABLE project TYPE string;
        DEFINE FIELD description ON TABLE project TYPE string;
        DEFINE FIELD owner_id ON TABLE project TYPE string;
        DEFINE FIELD status ON TABLE project TYPE string DEFAULT 'active';
        DEFINE FIELD created_at ON TABLE project TYPE datetime DEFAULT time::now();
        DEFINE FIELD updated_at ON TABLE project TYPE datetime DEFAULT time::now();
        DEFINE FIELD metadata ON TABLE project TYPE object;
        
        DEFINE INDEX project_owner_idx ON TABLE project COLUMNS owner_id;
        DEFINE INDEX project_status_idx ON TABLE project COLUMNS status;
        DEFINE INDEX project_created_idx ON TABLE project COLUMNS created_at;
    "#;

    db.query(project_schema)
        .await
        .map_err(|e| DatabaseError::MigrationFailed(format!("Project schema: {}", e)))?;

    Ok(())
}

/// Test database connection and basic functionality
async fn test_database_connection(db: &Database) -> Result<(), DatabaseError> {
    info!("Testing database connection...");

    // Test basic query
    let _result = db
        .query("SELECT * FROM hardware_basket LIMIT 1")
        .await
        .map_err(|e| DatabaseError::ConnectionTestFailed(e.to_string()))?;

    info!("✅ Database connection test passed");
    Ok(())
}

/// Database-specific error types
#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("Database connection failed: {0}")]
    ConnectionFailed(String),

    #[error("Namespace setup failed: {0}")]
    NamespaceSetupFailed(String),

    #[error("Migration failed: {0}")]
    MigrationFailed(String),

    #[error("Connection test failed: {0}")]
    ConnectionTestFailed(String),

    #[error("Query execution failed: {0}")]
    QueryFailed(String),

    #[error("Transaction failed: {0}")]
    TransactionFailed(String),
}

impl DatabaseError {
    pub fn to_api_response(&self) -> ApiResponse<()> {
        match self {
            DatabaseError::ConnectionFailed(_) => {
                helpers::internal_error("Database connection unavailable")
            }
            DatabaseError::NamespaceSetupFailed(_) => {
                helpers::internal_error("Database configuration error")
            }
            DatabaseError::MigrationFailed(_) => helpers::internal_error("Database schema error"),
            DatabaseError::ConnectionTestFailed(_) => {
                helpers::internal_error("Database health check failed")
            }
            DatabaseError::QueryFailed(_) => helpers::bad_request("Invalid database query"),
            DatabaseError::TransactionFailed(_) => {
                helpers::internal_error("Database transaction failed")
            }
        }
    }
}

/// Database utilities and helper functions
pub mod utils {
    use super::*;
    use surrealdb::sql::{Id, Thing};
    use uuid::Uuid;

    /// Generate a new Thing ID with UUID
    pub fn generate_thing_id(table: &str) -> Thing {
        let id = Uuid::new_v4().to_string();
        Thing {
            tb: table.to_string(),
            id: Id::String(id),
        }
    }

    /// Extract string ID from Thing object
    pub fn extract_id_string(thing: &Thing) -> String {
        thing.id.to_string()
    }

    /// Create a Thing from table and string ID  
    pub fn create_thing(table: &str, id: &str) -> Thing {
        Thing {
            tb: table.to_string(),
            id: Id::String(id.to_string()),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_database_init() {
        let config = DatabaseConfig {
            namespace: "test_ns".to_string(),
            database: "test_db".to_string(),
            enable_migrations: false,
            connection_pool_size: 1,
        };

        let result = init_database_with_config(config).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_thing_utilities() {
        let thing = utils::generate_thing_id("test_table");
        let id_string = utils::extract_id_string(&thing);
        assert!(!id_string.is_empty());

        let recreated = utils::create_thing("test_table", &id_string);
        assert_eq!(thing.tb, recreated.tb);
    }
}
