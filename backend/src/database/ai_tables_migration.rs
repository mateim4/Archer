use crate::database::Database;
use anyhow::Result;
use tracing::{info, warn};

pub struct AiTablesMigration;

impl AiTablesMigration {
    pub async fn run_all(db: &Database) -> Result<()> {
        info!("Running AI tables migrations...");
        
        Self::create_document_table(db).await?;
        Self::create_chunk_table(db).await?;
        Self::create_ai_thought_log_table(db).await?;
        Self::create_agent_action_table(db).await?;
        Self::create_agent_role_table(db).await?;
        Self::create_document_permission_table(db).await?;
        Self::create_indexes(db).await?;
        Self::seed_default_roles(db).await?;
        
        info!("✅ AI tables migrations completed");
        Ok(())
    }
    
    async fn create_document_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE document SCHEMAFULL;
            
            DEFINE FIELD title ON TABLE document TYPE string;
            DEFINE FIELD filename ON TABLE document TYPE option<string>;
            DEFINE FIELD mime_type ON TABLE document TYPE option<string>;
            DEFINE FIELD source_type ON TABLE document TYPE string;
            DEFINE FIELD source_url ON TABLE document TYPE option<string>;
            DEFINE FIELD source_id ON TABLE document TYPE option<string>;
            DEFINE FIELD content_hash ON TABLE document TYPE string;
            DEFINE FIELD version ON TABLE document TYPE option<string>;
            DEFINE FIELD size_bytes ON TABLE document TYPE option<int>;
            DEFINE FIELD page_count ON TABLE document TYPE option<int>;
            DEFINE FIELD chunk_count ON TABLE document TYPE int DEFAULT 0;
            DEFINE FIELD status ON TABLE document TYPE string DEFAULT 'pending';
            DEFINE FIELD error_message ON TABLE document TYPE option<string>;
            DEFINE FIELD sensitivity_level ON TABLE document TYPE string DEFAULT 'internal';
            DEFINE FIELD tags ON TABLE document TYPE array DEFAULT [];
            DEFINE FIELD source_created_at ON TABLE document TYPE option<datetime>;
            DEFINE FIELD source_modified_at ON TABLE document TYPE option<datetime>;
            DEFINE FIELD last_synced_at ON TABLE document TYPE option<datetime>;
            DEFINE FIELD indexed_at ON TABLE document TYPE option<datetime>;
            DEFINE FIELD created_by ON TABLE document TYPE string;
            DEFINE FIELD created_at ON TABLE document TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE document TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_document_hash ON TABLE document COLUMNS content_hash;
            DEFINE INDEX idx_document_status ON TABLE document COLUMNS status;
            DEFINE INDEX idx_document_source ON TABLE document COLUMNS source_type;
        "#;
        
        db.query(query).await?;
        info!("Created document table");
        Ok(())
    }
    
    async fn create_chunk_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE chunk SCHEMAFULL;
            
            DEFINE FIELD document_id ON TABLE chunk TYPE record<document>;
            DEFINE FIELD content ON TABLE chunk TYPE string;
            DEFINE FIELD embedding ON TABLE chunk TYPE array<float>;
            DEFINE FIELD embedding_model ON TABLE chunk TYPE string;
            DEFINE FIELD embedding_dimension ON TABLE chunk TYPE int;
            DEFINE FIELD token_count ON TABLE chunk TYPE int;
            DEFINE FIELD start_char ON TABLE chunk TYPE int;
            DEFINE FIELD end_char ON TABLE chunk TYPE int;
            DEFINE FIELD page_number ON TABLE chunk TYPE option<int>;
            DEFINE FIELD section_path ON TABLE chunk TYPE array DEFAULT [];
            DEFINE FIELD content_hash ON TABLE chunk TYPE string;
            DEFINE FIELD chunk_index ON TABLE chunk TYPE int;
            DEFINE FIELD previous_chunk_id ON TABLE chunk TYPE option<record<chunk>>;
            DEFINE FIELD next_chunk_id ON TABLE chunk TYPE option<record<chunk>>;
            DEFINE FIELD created_at ON TABLE chunk TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE chunk TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_chunk_document ON TABLE chunk COLUMNS document_id;
            DEFINE INDEX idx_chunk_hash ON TABLE chunk COLUMNS content_hash;
        "#;
        
        db.query(query).await?;
        
        // Vector index for semantic search (M-TREE with cosine distance)
        // Note: Dimension should match embedding model (384 for MiniLM, 1536 for OpenAI)
        let vector_index = r#"
            DEFINE INDEX idx_chunk_embedding ON TABLE chunk 
            COLUMNS embedding MTREE DIMENSION 384 DIST COSINE;
        "#;
        
        if let Err(e) = db.query(vector_index).await {
            warn!("Vector index creation note: {}", e);
        }
        
        info!("Created chunk table with vector index");
        Ok(())
    }
    
    async fn create_ai_thought_log_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE ai_thought_log SCHEMAFULL;
            
            DEFINE FIELD trace_id ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD session_id ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD agent_type ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD user_id ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD input_text ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD input_context ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD system_prompt ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD raw_response ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD chain_of_thought ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD final_output ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD risk_score ON TABLE ai_thought_log TYPE option<float>;
            DEFINE FIELD confidence_score ON TABLE ai_thought_log TYPE option<float>;
            DEFINE FIELD model ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD provider ON TABLE ai_thought_log TYPE string;
            DEFINE FIELD prompt_tokens ON TABLE ai_thought_log TYPE option<int>;
            DEFINE FIELD completion_tokens ON TABLE ai_thought_log TYPE option<int>;
            DEFINE FIELD latency_ms ON TABLE ai_thought_log TYPE option<int>;
            DEFINE FIELD user_feedback ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD feedback_comment ON TABLE ai_thought_log TYPE option<string>;
            DEFINE FIELD feedback_at ON TABLE ai_thought_log TYPE option<datetime>;
            DEFINE FIELD related_ticket_id ON TABLE ai_thought_log TYPE option<record<ticket>>;
            DEFINE FIELD related_asset_id ON TABLE ai_thought_log TYPE option<record<asset>>;
            DEFINE FIELD related_document_ids ON TABLE ai_thought_log TYPE array DEFAULT [];
            DEFINE FIELD created_at ON TABLE ai_thought_log TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_thought_trace ON TABLE ai_thought_log COLUMNS trace_id;
            DEFINE INDEX idx_thought_session ON TABLE ai_thought_log COLUMNS session_id;
            DEFINE INDEX idx_thought_agent ON TABLE ai_thought_log COLUMNS agent_type;
            DEFINE INDEX idx_thought_user ON TABLE ai_thought_log COLUMNS user_id;
            DEFINE INDEX idx_thought_created ON TABLE ai_thought_log COLUMNS created_at;
        "#;
        
        db.query(query).await?;
        info!("Created ai_thought_log table");
        Ok(())
    }
    
    async fn create_agent_action_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE agent_action SCHEMAFULL;
            
            DEFINE FIELD thought_log_id ON TABLE agent_action TYPE option<record<ai_thought_log>>;
            DEFINE FIELD agent_type ON TABLE agent_action TYPE string;
            DEFINE FIELD intent ON TABLE agent_action TYPE string;
            DEFINE FIELD action_type ON TABLE agent_action TYPE string;
            DEFINE FIELD target_asset_id ON TABLE agent_action TYPE option<record<asset>>;
            DEFINE FIELD target_host ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD command ON TABLE agent_action TYPE string;
            DEFINE FIELD command_args ON TABLE agent_action TYPE array DEFAULT [];
            DEFINE FIELD working_directory ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD risk_score ON TABLE agent_action TYPE int;
            DEFINE FIELD risk_level ON TABLE agent_action TYPE string;
            DEFINE FIELD risk_explanation ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD status ON TABLE agent_action TYPE string DEFAULT 'pending_approval';
            DEFINE FIELD rollback_possible ON TABLE agent_action TYPE bool DEFAULT false;
            DEFINE FIELD rollback_command ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD requested_by ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD approved_by ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD approved_at ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD rejection_reason ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD execution_started_at ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD execution_completed_at ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD exit_code ON TABLE agent_action TYPE option<int>;
            DEFINE FIELD stdout ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD stderr ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD error_message ON TABLE agent_action TYPE option<string>;
            DEFINE FIELD related_ticket_id ON TABLE agent_action TYPE option<record<ticket>>;
            DEFINE FIELD approval_deadline ON TABLE agent_action TYPE option<datetime>;
            DEFINE FIELD created_at ON TABLE agent_action TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE agent_action TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_action_status ON TABLE agent_action COLUMNS status;
            DEFINE INDEX idx_action_risk ON TABLE agent_action COLUMNS risk_level;
            DEFINE INDEX idx_action_agent ON TABLE agent_action COLUMNS agent_type;
            DEFINE INDEX idx_action_created ON TABLE agent_action COLUMNS created_at;
        "#;
        
        db.query(query).await?;
        info!("Created agent_action table");
        Ok(())
    }
    
    async fn create_agent_role_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE agent_role SCHEMAFULL;
            
            DEFINE FIELD name ON TABLE agent_role TYPE string;
            DEFINE FIELD description ON TABLE agent_role TYPE string;
            DEFINE FIELD max_sensitivity_level ON TABLE agent_role TYPE int DEFAULT 2;
            DEFINE FIELD can_execute_actions ON TABLE agent_role TYPE bool DEFAULT false;
            DEFINE FIELD max_auto_approve_risk ON TABLE agent_role TYPE option<string>;
            DEFINE FIELD allowed_action_types ON TABLE agent_role TYPE array DEFAULT [];
            DEFINE FIELD blocked_action_types ON TABLE agent_role TYPE array DEFAULT [];
            DEFINE FIELD allowed_document_ids ON TABLE agent_role TYPE array DEFAULT [];
            DEFINE FIELD blocked_document_ids ON TABLE agent_role TYPE array DEFAULT [];
            DEFINE FIELD is_active ON TABLE agent_role TYPE bool DEFAULT true;
            DEFINE FIELD created_by ON TABLE agent_role TYPE string;
            DEFINE FIELD created_at ON TABLE agent_role TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON TABLE agent_role TYPE datetime DEFAULT time::now();
            
            DEFINE INDEX idx_role_name ON TABLE agent_role COLUMNS name UNIQUE;
        "#;
        
        db.query(query).await?;
        info!("Created agent_role table");
        Ok(())
    }
    
    async fn create_document_permission_table(db: &Database) -> Result<()> {
        let query = r#"
            DEFINE TABLE document_permission SCHEMAFULL;
            
            DEFINE FIELD agent_role_id ON TABLE document_permission TYPE record<agent_role>;
            DEFINE FIELD document_id ON TABLE document_permission TYPE record<document>;
            DEFINE FIELD permission_level ON TABLE document_permission TYPE string;
            DEFINE FIELD granted_by ON TABLE document_permission TYPE string;
            DEFINE FIELD granted_at ON TABLE document_permission TYPE datetime DEFAULT time::now();
            DEFINE FIELD expires_at ON TABLE document_permission TYPE option<datetime>;
            
            DEFINE INDEX idx_perm_role ON TABLE document_permission COLUMNS agent_role_id;
            DEFINE INDEX idx_perm_doc ON TABLE document_permission COLUMNS document_id;
        "#;
        
        db.query(query).await?;
        info!("Created document_permission table");
        Ok(())
    }
    
    async fn create_indexes(db: &Database) -> Result<()> {
        // Additional composite indexes for common queries
        let query = r#"
            DEFINE INDEX idx_action_pending ON TABLE agent_action 
            COLUMNS status, approval_deadline 
            WHERE status = 'pending_approval';
            
            DEFINE INDEX idx_thought_agent_time ON TABLE ai_thought_log 
            COLUMNS agent_type, created_at;
        "#;
        
        if let Err(e) = db.query(query).await {
            warn!("Some indexes may not have been created: {}", e);
        }
        
        Ok(())
    }
    
    async fn seed_default_roles(db: &Database) -> Result<()> {
        let query = r#"
            -- Librarian Agent Role (read-only on docs, no execution)
            INSERT INTO agent_role {
                name: 'librarian',
                description: 'Knowledge management agent - indexes and searches documents',
                max_sensitivity_level: 3,
                can_execute_actions: false,
                is_active: true,
                created_by: 'system'
            } ON DUPLICATE KEY UPDATE updated_at = time::now();
            
            -- Ticket Assistant Role (read docs, no execution)
            INSERT INTO agent_role {
                name: 'ticket_assistant',
                description: 'Ticket workflow assistant - suggests and auto-fills',
                max_sensitivity_level: 2,
                can_execute_actions: false,
                is_active: true,
                created_by: 'system'
            } ON DUPLICATE KEY UPDATE updated_at = time::now();
            
            -- Monitoring Analyst Role (read all, limited execution)
            INSERT INTO agent_role {
                name: 'monitoring_analyst',
                description: 'Monitoring and alerting analyst - detects anomalies',
                max_sensitivity_level: 4,
                can_execute_actions: false,
                is_active: true,
                created_by: 'system'
            } ON DUPLICATE KEY UPDATE updated_at = time::now();
            
            -- Operations Agent Role (full access with approval)
            INSERT INTO agent_role {
                name: 'operations_agent',
                description: 'Infrastructure operations agent - executes actions with approval',
                max_sensitivity_level: 5,
                can_execute_actions: true,
                max_auto_approve_risk: 'low',
                allowed_action_types: ['ssh_command', 'powershell_command', 'kubernetes_exec', 'script_execution', 'service_restart'],
                is_active: true,
                created_by: 'system'
            } ON DUPLICATE KEY UPDATE updated_at = time::now();
        "#;
        
        db.query(query).await?;
        info!("Seeded default agent roles");
        Ok(())
    }
}
