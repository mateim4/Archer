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

    // AI schema migrations (RAG, vector search, audit logging)
    if let Err(e) = run_ai_schema_migrations(db).await {
        warn!("AI schema migrations failed: {}", e);
    } else {
        info!("✅ AI schema migrations completed");
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

/// AI schema specific migrations (RAG, vector search, audit logging)
async fn run_ai_schema_migrations(db: &Database) -> Result<(), DatabaseError> {
    info!("Running AI schema migrations...");

    // Load the AI schema file (relative to backend directory)
    let schema_path = std::path::Path::new("schema/08_ai_schema.surql");
    
    if schema_path.exists() {
        info!("Loading AI schema from file: {:?}", schema_path);
        let schema_content = std::fs::read_to_string(schema_path)
            .map_err(|e| DatabaseError::MigrationFailed(format!("Failed to read AI schema file: {}", e)))?;
        
        db.query(&schema_content)
            .await
            .map_err(|e| DatabaseError::MigrationFailed(format!("AI schema execution failed: {}", e)))?;
        
        info!("✅ AI schema loaded from file successfully");
    } else {
        warn!("AI schema file not found at {:?}, using inline definitions", schema_path);
        
        // Fallback: Define AI tables inline
        let ai_schema = r#"
            -- Document source tracking
            DEFINE TABLE document SCHEMAFULL;
            DEFINE FIELD source ON TABLE document TYPE string;
            DEFINE FIELD path ON TABLE document TYPE string;
            DEFINE FIELD filename ON TABLE document TYPE string;
            DEFINE FIELD mime_type ON TABLE document TYPE string;
            DEFINE FIELD content_hash ON TABLE document TYPE string;
            DEFINE FIELD file_size ON TABLE document TYPE int;
            DEFINE FIELD last_indexed ON TABLE document TYPE datetime;
            DEFINE FIELD status ON TABLE document TYPE string;
            DEFINE FIELD permissions ON TABLE document TYPE array;
            DEFINE FIELD metadata ON TABLE document TYPE object;
            DEFINE FIELD created_at ON TABLE document TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE document TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_document_hash ON TABLE document COLUMNS content_hash UNIQUE;
            DEFINE INDEX idx_document_status ON TABLE document COLUMNS status;
            DEFINE INDEX idx_document_source ON TABLE document COLUMNS source;
            
            -- Document chunks with embeddings
            DEFINE TABLE chunk SCHEMAFULL;
            DEFINE FIELD document ON TABLE chunk TYPE record<document>;
            DEFINE FIELD content ON TABLE chunk TYPE string;
            DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;
            DEFINE FIELD chunk_index ON TABLE chunk TYPE int;
            DEFINE FIELD start_char ON TABLE chunk TYPE int;
            DEFINE FIELD end_char ON TABLE chunk TYPE int;
            DEFINE FIELD token_count ON TABLE chunk TYPE int;
            DEFINE FIELD created_at ON TABLE chunk TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_chunk_embedding ON TABLE chunk COLUMNS embedding MTREE DIMENSION 1536;
            DEFINE INDEX idx_chunk_document ON TABLE chunk COLUMNS document;
            
            -- AI thought log for transparency
            DEFINE TABLE ai_thought_log SCHEMAFULL;
            DEFINE FIELD session_id ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD agent ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD user ON TABLE ai_thought_log TYPE option<record<user>>;
            DEFINE FIELD input ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD chain_of_thought ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD output ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD model ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD tokens_input ON TABLE ai_thought_log TYPE int;
            DEFINE FIELD tokens_output ON TABLE ai_thought_log TYPE int;
            DEFINE FIELD latency_ms ON TABLE ai_thought_log TYPE int;
            DEFINE FIELD context_chunks ON TABLE ai_thought_log TYPE array;
            DEFINE FIELD feedback ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD created_at ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_thought_session ON TABLE ai_thought_log COLUMNS session_id;
            DEFINE INDEX idx_thought_agent ON TABLE ai_thought_log COLUMNS agent;
            DEFINE INDEX idx_thought_user ON TABLE ai_thought_log COLUMNS user;
            DEFINE INDEX idx_thought_created ON TABLE ai_thought_log COLUMNS created_at;
            
            -- Autonomous action tracking
            DEFINE TABLE agent_action SCHEMAFULL;
            DEFINE FIELD agent ON TABLE agent_action TYPE string;
            DEFINE FIELD action_type ON TABLE agent_action TYPE string;
            DEFINE FIELD target ON TABLE agent_action TYPE string;
            DEFINE FIELD parameters ON TABLE agent_action TYPE object;
            DEFINE FIELD risk_score ON TABLE agent_action TYPE int;
            DEFINE FIELD risk_factors ON TABLE agent_action TYPE array;
            DEFINE FIELD status ON TABLE agent_action TYPE string;
            DEFINE FIELD requires_approval ON TABLE agent_action TYPE bool;
            DEFINE FIELD approver ON TABLE agent_action TYPE option<record<user>>;
            DEFINE FIELD approved_at ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD executed_at ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD result ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD error ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD related_ticket ON TABLE agent_action TYPE option<record<itsm_ticket>>;
            DEFINE FIELD created_at ON TABLE agent_action TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_action_status ON TABLE agent_action COLUMNS status;
            DEFINE INDEX idx_action_agent ON TABLE agent_action COLUMNS agent;
            DEFINE INDEX idx_action_risk ON TABLE agent_action COLUMNS risk_score;
            DEFINE INDEX idx_action_created ON TABLE agent_action COLUMNS created_at;
            
            -- Knowledge Base articles (optional)
            DEFINE TABLE kb_article SCHEMAFULL;
            DEFINE FIELD title ON TABLE kb_article TYPE string;
            DEFINE FIELD content ON TABLE kb_article TYPE string;
            DEFINE FIELD embedding ON TABLE kb_article TYPE array<float>;
            DEFINE FIELD category ON TABLE kb_article TYPE string;
            DEFINE FIELD tags ON TABLE kb_article TYPE array;
            DEFINE FIELD author ON TABLE kb_article TYPE option<record<user>>;
            DEFINE FIELD views ON TABLE kb_article TYPE int DEFAULT 0;
            DEFINE FIELD helpful_count ON TABLE kb_article TYPE int DEFAULT 0;
            DEFINE FIELD status ON TABLE kb_article TYPE string;
            DEFINE FIELD created_at ON TABLE kb_article TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE kb_article TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_kb_embedding ON TABLE kb_article COLUMNS embedding MTREE DIMENSION 1536;
            DEFINE INDEX idx_kb_category ON TABLE kb_article COLUMNS category;
            DEFINE INDEX idx_kb_status ON TABLE kb_article COLUMNS status;
        "#;
        
        db.query(ai_schema)
            .await
            .map_err(|e| DatabaseError::MigrationFailed(format!("AI schema (inline) execution failed: {}", e)))?;
        
        info!("✅ AI schema loaded inline successfully");
    }

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
