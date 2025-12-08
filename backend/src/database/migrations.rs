use crate::database::Database;
use anyhow::Result;
use serde_json::json;

/// Database migrations for AI-related functionality
pub struct AiMigrations;

impl AiMigrations {
    /// Run all AI migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_ai_tables(db).await?;
        Self::create_ai_indexes(db).await?;
        Self::seed_agent_roles(db).await?;
        Ok(())
    }

    /// Create tables for AI functionality
    async fn create_ai_tables(db: &Database) -> Result<()> {
        // Document table for RAG system
        db.query(
            r#"
            DEFINE TABLE document SCHEMAFULL;
            DEFINE FIELD title ON document TYPE string;
            DEFINE FIELD filename ON document TYPE option<string>;
            DEFINE FIELD mime_type ON document TYPE option<string>;
            DEFINE FIELD source_type ON document TYPE string;
            DEFINE FIELD source_url ON document TYPE option<string>;
            DEFINE FIELD source_id ON document TYPE option<string>;
            DEFINE FIELD content_hash ON document TYPE string;
            DEFINE FIELD version ON document TYPE option<string>;
            DEFINE FIELD size_bytes ON document TYPE option<int>;
            DEFINE FIELD page_count ON document TYPE option<int>;
            DEFINE FIELD chunk_count ON document TYPE int DEFAULT 0;
            DEFINE FIELD status ON document TYPE string;
            DEFINE FIELD error_message ON document TYPE option<string>;
            DEFINE FIELD sensitivity_level ON document TYPE string;
            DEFINE FIELD tags ON document TYPE array DEFAULT [];
            DEFINE FIELD source_created_at ON document TYPE option<datetime>;
            DEFINE FIELD source_modified_at ON document TYPE option<datetime>;
            DEFINE FIELD last_synced_at ON document TYPE option<datetime>;
            DEFINE FIELD indexed_at ON document TYPE option<datetime>;
            DEFINE FIELD created_by ON document TYPE string;
            DEFINE FIELD created_at ON document TYPE datetime;
            DEFINE FIELD updated_at ON document TYPE datetime;
        "#,
        )
        .await?;

        // Document chunk table with embeddings
        db.query(
            r#"
            DEFINE TABLE document_chunk SCHEMAFULL;
            DEFINE FIELD document_id ON document_chunk TYPE record(document);
            DEFINE FIELD content ON document_chunk TYPE string;
            DEFINE FIELD embedding ON document_chunk TYPE array<float>;
            DEFINE FIELD embedding_model ON document_chunk TYPE string;
            DEFINE FIELD embedding_dimension ON document_chunk TYPE int;
            DEFINE FIELD token_count ON document_chunk TYPE int;
            DEFINE FIELD start_char ON document_chunk TYPE int;
            DEFINE FIELD end_char ON document_chunk TYPE int;
            DEFINE FIELD page_number ON document_chunk TYPE option<int>;
            DEFINE FIELD section_path ON document_chunk TYPE array DEFAULT [];
            DEFINE FIELD content_hash ON document_chunk TYPE string;
            DEFINE FIELD chunk_index ON document_chunk TYPE int;
            DEFINE FIELD previous_chunk_id ON document_chunk TYPE option<record(document_chunk)>;
            DEFINE FIELD next_chunk_id ON document_chunk TYPE option<record(document_chunk)>;
            DEFINE FIELD created_at ON document_chunk TYPE datetime;
            DEFINE FIELD updated_at ON document_chunk TYPE datetime;
        "#,
        )
        .await?;

        // AI thought log for chain of thought tracking
        db.query(
            r#"
            DEFINE TABLE ai_thought_log SCHEMAFULL;
            DEFINE FIELD trace_id ON ai_thought_log TYPE string;
            DEFINE FIELD session_id ON ai_thought_log TYPE option<string>;
            DEFINE FIELD agent_type ON ai_thought_log TYPE string;
            DEFINE FIELD user_id ON ai_thought_log TYPE option<string>;
            DEFINE FIELD input_text ON ai_thought_log TYPE string;
            DEFINE FIELD input_context ON ai_thought_log TYPE option<string>;
            DEFINE FIELD system_prompt ON ai_thought_log TYPE option<string>;
            DEFINE FIELD raw_response ON ai_thought_log TYPE string;
            DEFINE FIELD chain_of_thought ON ai_thought_log TYPE option<string>;
            DEFINE FIELD final_output ON ai_thought_log TYPE string;
            DEFINE FIELD risk_score ON ai_thought_log TYPE option<float>;
            DEFINE FIELD confidence_score ON ai_thought_log TYPE option<float>;
            DEFINE FIELD model ON ai_thought_log TYPE string;
            DEFINE FIELD provider ON ai_thought_log TYPE string;
            DEFINE FIELD prompt_tokens ON ai_thought_log TYPE option<int>;
            DEFINE FIELD completion_tokens ON ai_thought_log TYPE option<int>;
            DEFINE FIELD latency_ms ON ai_thought_log TYPE option<int>;
            DEFINE FIELD user_feedback ON ai_thought_log TYPE option<string>;
            DEFINE FIELD feedback_comment ON ai_thought_log TYPE option<string>;
            DEFINE FIELD feedback_at ON ai_thought_log TYPE option<datetime>;
            DEFINE FIELD related_ticket_id ON ai_thought_log TYPE option<record(ticket)>;
            DEFINE FIELD related_asset_id ON ai_thought_log TYPE option<record(asset)>;
            DEFINE FIELD related_document_ids ON ai_thought_log TYPE array DEFAULT [];
            DEFINE FIELD created_at ON ai_thought_log TYPE datetime;
        "#,
        )
        .await?;

        // Agent action for autonomous operations tracking
        db.query(
            r#"
            DEFINE TABLE agent_action SCHEMAFULL;
            DEFINE FIELD thought_log_id ON agent_action TYPE option<record(ai_thought_log)>;
            DEFINE FIELD agent_type ON agent_action TYPE string;
            DEFINE FIELD intent ON agent_action TYPE string;
            DEFINE FIELD action_type ON agent_action TYPE string;
            DEFINE FIELD target_asset_id ON agent_action TYPE option<record(asset)>;
            DEFINE FIELD target_host ON agent_action TYPE option<string>;
            DEFINE FIELD command ON agent_action TYPE string;
            DEFINE FIELD command_args ON agent_action TYPE array DEFAULT [];
            DEFINE FIELD working_directory ON agent_action TYPE option<string>;
            DEFINE FIELD risk_score ON agent_action TYPE int;
            DEFINE FIELD risk_level ON agent_action TYPE string;
            DEFINE FIELD risk_explanation ON agent_action TYPE option<string>;
            DEFINE FIELD status ON agent_action TYPE string;
            DEFINE FIELD rollback_possible ON agent_action TYPE bool;
            DEFINE FIELD rollback_command ON agent_action TYPE option<string>;
            DEFINE FIELD requested_by ON agent_action TYPE option<string>;
            DEFINE FIELD approved_by ON agent_action TYPE option<string>;
            DEFINE FIELD approved_at ON agent_action TYPE option<datetime>;
            DEFINE FIELD rejection_reason ON agent_action TYPE option<string>;
            DEFINE FIELD execution_started_at ON agent_action TYPE option<datetime>;
            DEFINE FIELD execution_completed_at ON agent_action TYPE option<datetime>;
            DEFINE FIELD exit_code ON agent_action TYPE option<int>;
            DEFINE FIELD stdout ON agent_action TYPE option<string>;
            DEFINE FIELD stderr ON agent_action TYPE option<string>;
            DEFINE FIELD error_message ON agent_action TYPE option<string>;
            DEFINE FIELD related_ticket_id ON agent_action TYPE option<record(ticket)>;
            DEFINE FIELD approval_deadline ON agent_action TYPE option<datetime>;
            DEFINE FIELD created_at ON agent_action TYPE datetime;
            DEFINE FIELD updated_at ON agent_action TYPE datetime;
        "#,
        )
        .await?;

        // Agent role for RBAC
        db.query(
            r#"
            DEFINE TABLE agent_role SCHEMAFULL;
            DEFINE FIELD name ON agent_role TYPE string;
            DEFINE FIELD description ON agent_role TYPE string;
            DEFINE FIELD max_sensitivity_level ON agent_role TYPE int;
            DEFINE FIELD can_execute_actions ON agent_role TYPE bool;
            DEFINE FIELD max_auto_approve_risk ON agent_role TYPE option<string>;
            DEFINE FIELD allowed_action_types ON agent_role TYPE array DEFAULT [];
            DEFINE FIELD blocked_action_types ON agent_role TYPE array DEFAULT [];
            DEFINE FIELD allowed_document_ids ON agent_role TYPE array DEFAULT [];
            DEFINE FIELD blocked_document_ids ON agent_role TYPE array DEFAULT [];
            DEFINE FIELD is_active ON agent_role TYPE bool DEFAULT true;
            DEFINE FIELD created_by ON agent_role TYPE string;
            DEFINE FIELD created_at ON agent_role TYPE datetime;
            DEFINE FIELD updated_at ON agent_role TYPE datetime;
        "#,
        )
        .await?;

        // Document permission table for role-document access control
        db.query(
            r#"
            DEFINE TABLE document_permission SCHEMAFULL;
            DEFINE FIELD role_id ON document_permission TYPE record(agent_role);
            DEFINE FIELD document_id ON document_permission TYPE record(document);
            DEFINE FIELD access_level ON document_permission TYPE string;
            DEFINE FIELD granted_by ON document_permission TYPE string;
            DEFINE FIELD granted_at ON document_permission TYPE datetime;
        "#,
        )
        .await?;

        println!("✅ AI tables created successfully");
        Ok(())
    }

    /// Create indexes for AI tables
    async fn create_ai_indexes(db: &Database) -> Result<()> {
        // Document indexes
        db.query("DEFINE INDEX idx_document_status ON document FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_document_source_type ON document FIELDS source_type;")
            .await?;
        db.query("DEFINE INDEX idx_document_content_hash ON document FIELDS content_hash;")
            .await?;
        db.query("DEFINE INDEX idx_document_created_by ON document FIELDS created_by;")
            .await?;

        // Document chunk indexes
        db.query("DEFINE INDEX idx_chunk_document ON document_chunk FIELDS document_id;")
            .await?;
        db.query("DEFINE INDEX idx_chunk_index ON document_chunk FIELDS chunk_index;")
            .await?;
        
        // Vector index for semantic search (384 dimensions for all-MiniLM-L6-v2 model)
        db.query("DEFINE INDEX idx_chunk_embedding ON document_chunk FIELDS embedding MTREE DIMENSION 384 DIST COSINE;")
            .await?;

        // AI thought log indexes
        db.query("DEFINE INDEX idx_thought_trace ON ai_thought_log FIELDS trace_id;")
            .await?;
        db.query("DEFINE INDEX idx_thought_session ON ai_thought_log FIELDS session_id;")
            .await?;
        db.query("DEFINE INDEX idx_thought_agent_type ON ai_thought_log FIELDS agent_type;")
            .await?;
        db.query("DEFINE INDEX idx_thought_user ON ai_thought_log FIELDS user_id;")
            .await?;

        // Agent action indexes
        db.query("DEFINE INDEX idx_action_status ON agent_action FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_action_agent_type ON agent_action FIELDS agent_type;")
            .await?;
        db.query("DEFINE INDEX idx_action_risk_level ON agent_action FIELDS risk_level;")
            .await?;
        db.query("DEFINE INDEX idx_action_requested_by ON agent_action FIELDS requested_by;")
            .await?;

        // Agent role indexes
        db.query("DEFINE INDEX idx_role_name ON agent_role FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_role_active ON agent_role FIELDS is_active;")
            .await?;

        println!("✅ AI indexes created successfully");
        Ok(())
    }

    /// Seed default agent roles
    async fn seed_agent_roles(db: &Database) -> Result<()> {
        // Use INSERT queries instead of content() to let database handle datetime defaults
        let role_queries = vec![
            r#"
            INSERT INTO agent_role {
                name: 'librarian',
                description: 'Knowledge management agent - reads docs, no execution',
                max_sensitivity_level: 3,
                can_execute_actions: false,
                allowed_action_types: [],
                blocked_action_types: [],
                allowed_document_ids: [],
                blocked_document_ids: [],
                is_active: true,
                created_by: 'system',
                created_at: time::now(),
                updated_at: time::now()
            };
            "#,
            r#"
            INSERT INTO agent_role {
                name: 'ticket_assistant',
                description: 'Ticket workflow assistant - reads docs, no execution',
                max_sensitivity_level: 2,
                can_execute_actions: false,
                allowed_action_types: [],
                blocked_action_types: [],
                allowed_document_ids: [],
                blocked_document_ids: [],
                is_active: true,
                created_by: 'system',
                created_at: time::now(),
                updated_at: time::now()
            };
            "#,
            r#"
            INSERT INTO agent_role {
                name: 'monitoring_analyst',
                description: 'Monitoring and alerting analyst - reads all, no execution',
                max_sensitivity_level: 4,
                can_execute_actions: false,
                allowed_action_types: [],
                blocked_action_types: [],
                allowed_document_ids: [],
                blocked_document_ids: [],
                is_active: true,
                created_by: 'system',
                created_at: time::now(),
                updated_at: time::now()
            };
            "#,
            r#"
            INSERT INTO agent_role {
                name: 'operations_agent',
                description: 'Infrastructure operations agent - full access with approval',
                max_sensitivity_level: 5,
                can_execute_actions: true,
                max_auto_approve_risk: 'low',
                allowed_action_types: ['ssh_command', 'powershell_command', 'kubernetes_exec', 'service_restart'],
                blocked_action_types: [],
                allowed_document_ids: [],
                blocked_document_ids: [],
                is_active: true,
                created_by: 'system',
                created_at: time::now(),
                updated_at: time::now()
            };
            "#,
        ];

        for query in role_queries {
            db.query(query).await?;
        }

        println!("✅ Default agent roles seeded");
        Ok(())
    }
}

/// Database migrations for enhanced RVTools functionality
pub struct EnhancedRvToolsMigrations;

impl EnhancedRvToolsMigrations {
    /// Run all enhanced RVTools migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_enhanced_rvtools_tables(db).await?;
        Self::create_indexes(db).await?;
        Self::seed_validation_rules(db).await?;
        Ok(())
    }

    /// Create tables for enhanced RVTools functionality
    async fn create_enhanced_rvtools_tables(db: &Database) -> Result<()> {
        // Enhanced RVTools Excel Data table
        db.query(
            r#"
            DEFINE TABLE rvtools_excel_data SCHEMAFULL;
            DEFINE FIELD upload_id ON rvtools_excel_data TYPE record(rvtools_upload);
            DEFINE FIELD sheet_name ON rvtools_excel_data TYPE string;
            DEFINE FIELD row_number ON rvtools_excel_data TYPE int;
            DEFINE FIELD column_name ON rvtools_excel_data TYPE string;
            DEFINE FIELD column_index ON rvtools_excel_data TYPE int;
            DEFINE FIELD raw_value ON rvtools_excel_data TYPE string;
            DEFINE FIELD parsed_value ON rvtools_excel_data TYPE any;
            DEFINE FIELD data_type ON rvtools_excel_data TYPE string;
            DEFINE FIELD metric_category ON rvtools_excel_data TYPE string;
            DEFINE FIELD confidence_score ON rvtools_excel_data TYPE float;
            DEFINE FIELD validation_status ON rvtools_excel_data TYPE string;
            DEFINE FIELD validation_errors ON rvtools_excel_data TYPE array<string>;
            DEFINE FIELD metadata ON rvtools_excel_data TYPE object;
            DEFINE FIELD created_at ON rvtools_excel_data TYPE datetime;
        "#,
        )
        .await?;

        // Storage Architecture Analysis table
        db.query(
            r#"
            DEFINE TABLE storage_architecture_analysis SCHEMAFULL;
            DEFINE FIELD upload_id ON storage_architecture_analysis TYPE record(rvtools_upload);
            DEFINE FIELD cluster_name ON storage_architecture_analysis TYPE string;
            DEFINE FIELD storage_type ON storage_architecture_analysis TYPE string;
            DEFINE FIELD evidence_chain ON storage_architecture_analysis TYPE array;
            DEFINE FIELD confidence_level ON storage_architecture_analysis TYPE float;
            DEFINE FIELD analysis_method ON storage_architecture_analysis TYPE string;
            DEFINE FIELD recommendations ON storage_architecture_analysis TYPE array<string>;
            DEFINE FIELD s2d_compliance ON storage_architecture_analysis TYPE object;
            DEFINE FIELD metadata ON storage_architecture_analysis TYPE object;
            DEFINE FIELD analyzed_at ON storage_architecture_analysis TYPE datetime;
        "#,
        )
        .await?;

        // Report Generation table
        db.query(
            r#"
            DEFINE TABLE report_generation SCHEMAFULL;
            DEFINE FIELD upload_id ON report_generation TYPE record(rvtools_upload);
            DEFINE FIELD template_id ON report_generation TYPE string;
            DEFINE FIELD report_type ON report_generation TYPE string;
            DEFINE FIELD generated_data ON report_generation TYPE object;
            DEFINE FIELD sections ON report_generation TYPE array;
            DEFINE FIELD branding_config ON report_generation TYPE object;
            DEFINE FIELD export_formats ON report_generation TYPE array<string>;
            DEFINE FIELD generation_status ON report_generation TYPE string;
            DEFINE FIELD generated_at ON report_generation TYPE datetime;
            DEFINE FIELD generated_by ON report_generation TYPE string;
        "#,
        )
        .await?;

        // Report Template table
        db.query(
            r#"
            DEFINE TABLE report_template SCHEMAFULL;
            DEFINE FIELD name ON report_template TYPE string;
            DEFINE FIELD description ON report_template TYPE string;
            DEFINE FIELD report_type ON report_template TYPE string;
            DEFINE FIELD sections ON report_template TYPE array;
            DEFINE FIELD data_variables ON report_template TYPE array<string>;
            DEFINE FIELD default_config ON report_template TYPE object;
            DEFINE FIELD required_data_categories ON report_template TYPE array;
            DEFINE FIELD is_standard ON report_template TYPE bool;
            DEFINE FIELD is_public ON report_template TYPE bool;
            DEFINE FIELD is_customizable ON report_template TYPE bool;
            DEFINE FIELD branding_config ON report_template TYPE object;
            DEFINE FIELD created_at ON report_template TYPE datetime DEFAULT time::now();
            DEFINE FIELD created_by ON report_template TYPE string;
            DEFINE FIELD updated_at ON report_template TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        // Report Section table
        db.query(
            r#"
            DEFINE TABLE report_section SCHEMAFULL;
            DEFINE FIELD title ON report_section TYPE string;
            DEFINE FIELD description ON report_section TYPE string;
            DEFINE FIELD data_variables ON report_section TYPE array<string>;
            DEFINE FIELD display_format ON report_section TYPE string;
            DEFINE FIELD order ON report_section TYPE int;
            DEFINE FIELD is_required ON report_section TYPE bool;
            DEFINE FIELD layout_config ON report_section TYPE object;
            DEFINE FIELD subsections ON report_section TYPE array;
        "#,
        )
        .await?;

        // Data Variable Schema table
        db.query(
            r#"
            DEFINE TABLE data_variable_schema SCHEMAFULL;
            DEFINE FIELD variable_name ON data_variable_schema TYPE string;
            DEFINE FIELD display_name ON data_variable_schema TYPE string;
            DEFINE FIELD data_type ON data_variable_schema TYPE string;
            DEFINE FIELD description ON data_variable_schema TYPE string;
            DEFINE FIELD source_sheets ON data_variable_schema TYPE array<string>;
            DEFINE FIELD source_columns ON data_variable_schema TYPE array<string>;
            DEFINE FIELD aggregation_method ON data_variable_schema TYPE string;
            DEFINE FIELD formatting_rules ON data_variable_schema TYPE object;
            DEFINE FIELD validation_rules ON data_variable_schema TYPE array;
            DEFINE FIELD category ON data_variable_schema TYPE string;
        "#,
        )
        .await?;

        println!("✅ Enhanced RVTools tables created successfully");
        Ok(())
    }

    /// Create indexes for performance
    async fn create_indexes(db: &Database) -> Result<()> {
        // Indexes for rvtools_excel_data
        db.query("DEFINE INDEX idx_excel_data_upload ON rvtools_excel_data FIELDS upload_id;")
            .await?;
        db.query("DEFINE INDEX idx_excel_data_sheet ON rvtools_excel_data FIELDS sheet_name;")
            .await?;
        db.query("DEFINE INDEX idx_excel_data_column ON rvtools_excel_data FIELDS column_name;")
            .await?;
        db.query(
            "DEFINE INDEX idx_excel_data_confidence ON rvtools_excel_data FIELDS confidence_score;",
        )
        .await?;
        db.query("DEFINE INDEX idx_excel_data_validation ON rvtools_excel_data FIELDS validation_status;").await?;

        // Indexes for storage_architecture_analysis
        db.query("DEFINE INDEX idx_storage_analysis_upload ON storage_architecture_analysis FIELDS upload_id;").await?;
        db.query("DEFINE INDEX idx_storage_analysis_cluster ON storage_architecture_analysis FIELDS cluster_name;").await?;
        db.query("DEFINE INDEX idx_storage_analysis_type ON storage_architecture_analysis FIELDS storage_type;").await?;

        // Indexes for report_generation
        db.query("DEFINE INDEX idx_report_gen_upload ON report_generation FIELDS upload_id;")
            .await?;
        db.query("DEFINE INDEX idx_report_gen_template ON report_generation FIELDS template_id;")
            .await?;
        db.query(
            "DEFINE INDEX idx_report_gen_status ON report_generation FIELDS generation_status;",
        )
        .await?;

        // Indexes for report_template
        db.query("DEFINE INDEX idx_report_template_type ON report_template FIELDS report_type;")
            .await?;
        db.query(
            "DEFINE INDEX idx_report_template_standard ON report_template FIELDS is_standard;",
        )
        .await?;

        // Indexes for data_variable_schema
        db.query(
            "DEFINE INDEX idx_data_variable_name ON data_variable_schema FIELDS variable_name;",
        )
        .await?;
        db.query(
            "DEFINE INDEX idx_data_variable_category ON data_variable_schema FIELDS category;",
        )
        .await?;

        println!("✅ Enhanced RVTools indexes created successfully");
        Ok(())
    }

    /// Seed default validation rules and templates
    async fn seed_validation_rules(db: &Database) -> Result<()> {
        // Create real templates using simple SurrealDB queries
        let template_queries = vec![
            r#"
            CREATE report_template:migration_hld SET
                name = 'RVTools Migration Analysis Report',
                description = 'Comprehensive VMware to Hyper-V migration planning report',
                report_type = 'migration_hld',
                is_standard = true,
                is_public = true,
                is_customizable = true,
                sections = [],
                data_variables = ['total_vms', 'total_hosts', 'total_clusters', 'vsan_clusters'],
                default_config = {},
                required_data_categories = ['infrastructure', 'storage'],
                created_by = 'system',
                branding_config = {}
            "#,
            r#"
            CREATE report_template:storage_analysis SET
                name = 'Storage Architecture Analysis',
                description = 'Detailed analysis of storage requirements and S2D compliance',
                report_type = 'storage_architecture',
                is_standard = true,
                is_public = true,
                is_customizable = true,
                sections = [],
                data_variables = ['storage_capacity', 'iops_requirements'],
                default_config = {},
                required_data_categories = ['storage'],
                created_by = 'system',
                branding_config = {}
            "#,
            r#"
            CREATE report_template:cluster_analysis SET
                name = 'Cluster Analysis Report',
                description = 'VMware cluster configuration and migration readiness assessment',
                report_type = 'cluster_analysis',
                is_standard = true,
                is_public = true,
                is_customizable = true,
                sections = [],
                data_variables = ['cluster_count', 'host_distribution'],
                default_config = {},
                required_data_categories = ['infrastructure'],
                created_by = 'system',
                branding_config = {}
            "#,
        ];

        for query in template_queries {
            match db.query(query).await {
                Ok(_) => println!("✅ Template created successfully"),
                Err(e) => println!("⚠️ Template creation error: {}", e),
            }
        }

        println!("✅ Real report templates seeded successfully");

        // Seed data variable schemas
        let data_variables = vec![
            json!({
                "variable_name": "total_vms",
                "display_name": "Total Virtual Machines",
                "data_type": "integer",
                "description": "Total number of virtual machines in the environment",
                "source_sheets": ["vInfo", "vVM"],
                "source_columns": ["VM", "Name"],
                "aggregation_method": "count",
                "formatting_rules": {"format": "number", "thousand_separator": true},
                "category": "infrastructure"
            }),
            json!({
                "variable_name": "total_hosts",
                "display_name": "Total ESXi Hosts",
                "data_type": "integer",
                "description": "Total number of ESXi hosts in the environment",
                "source_sheets": ["vHost"],
                "source_columns": ["Host", "Name"],
                "aggregation_method": "count",
                "formatting_rules": {"format": "number", "thousand_separator": true},
                "category": "infrastructure"
            }),
            json!({
                "variable_name": "total_clusters",
                "display_name": "Total Clusters",
                "data_type": "integer",
                "description": "Total number of clusters in the environment",
                "source_sheets": ["vCluster"],
                "source_columns": ["Cluster", "Name"],
                "aggregation_method": "count",
                "formatting_rules": {"format": "number"},
                "category": "infrastructure"
            }),
            json!({
                "variable_name": "vsan_clusters",
                "display_name": "vSAN Provider Clusters",
                "data_type": "array",
                "description": "List of confirmed vSAN provider clusters suitable for S2D",
                "source_sheets": ["vCluster"],
                "source_columns": ["Cluster"],
                "aggregation_method": "filter_confirmed_vsan",
                "formatting_rules": {"format": "list", "separator": ", "},
                "category": "storage"
            }),
            json!({
                "variable_name": "s2d_compliance_results",
                "display_name": "S2D Compliance Assessment",
                "data_type": "object",
                "description": "Storage Spaces Direct compliance results by cluster",
                "source_sheets": ["vHost", "vCluster"],
                "source_columns": ["TotalHosts", "Memory", "NetworkAdapters"],
                "aggregation_method": "s2d_compliance_analysis",
                "formatting_rules": {"format": "compliance_summary"},
                "category": "compliance"
            }),
        ];

        for variable in data_variables {
            let _: Vec<serde_json::Value> =
                db.create("data_variable_schema").content(variable).await?;
        }

        println!("✅ Enhanced RVTools validation rules and templates seeded successfully");
        Ok(())
    }

    /// Update existing RVTools upload table to be compatible
    pub async fn update_existing_rvtools_table(db: &Database) -> Result<()> {
        // Add new fields to existing rvtools_upload table if they don't exist
        db.query(
            r#"
            DEFINE FIELD processing_results ON rvtools_upload TYPE object;
            DEFINE FIELD total_vms ON rvtools_upload TYPE int;
            DEFINE FIELD total_hosts ON rvtools_upload TYPE int;  
            DEFINE FIELD total_clusters ON rvtools_upload TYPE int;
            DEFINE FIELD vcenter_version ON rvtools_upload TYPE string;
            DEFINE FIELD environment_name ON rvtools_upload TYPE string;
            DEFINE FIELD metadata ON rvtools_upload TYPE object;
        "#,
        )
        .await?;

        println!("✅ Existing RVTools upload table updated for compatibility");
        Ok(())
    }

    /// Rollback enhanced RVTools migrations (for development/testing)
    #[cfg(test)]
    pub async fn rollback(db: &Database) -> Result<()> {
        let tables_to_drop = vec![
            "rvtools_excel_data",
            "storage_architecture_analysis",
            "report_generation",
            "report_template",
            "report_section",
            "data_variable_schema",
        ];

        for table in tables_to_drop {
            db.query(&format!("REMOVE TABLE {};", table)).await?;
        }

        println!("✅ Enhanced RVTools migrations rolled back successfully");
        Ok(())
    }
}

/// Migrations for Migration Planning and Capacity features
pub struct MigrationPlanningMigrations;

impl MigrationPlanningMigrations {
    /// Run all migration planning migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_destination_cluster_tables(db).await?;
        Self::create_placement_tables(db).await?;
        Self::create_capacity_tables(db).await?;
        Self::create_network_profile_tables(db).await?;
        Self::create_document_template_tables(db).await?;
        Self::create_indexes(db).await?;
        Self::seed_network_templates(db).await?;
        Ok(())
    }

    /// Create destination cluster tables
    async fn create_destination_cluster_tables(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE TABLE destination_cluster SCHEMAFULL;
            DEFINE FIELD project_id ON destination_cluster TYPE record(project);
            DEFINE FIELD activity_id ON destination_cluster TYPE option<record(activity)>;
            DEFINE FIELD name ON destination_cluster TYPE string;
            DEFINE FIELD description ON destination_cluster TYPE option<string>;
            DEFINE FIELD hypervisor ON destination_cluster TYPE string;
            DEFINE FIELD storage_type ON destination_cluster TYPE string;
            DEFINE FIELD nodes ON destination_cluster TYPE array<record(hardware_pool)>;
            DEFINE FIELD node_count ON destination_cluster TYPE int;
            DEFINE FIELD overcommit_ratios ON destination_cluster TYPE object;
            DEFINE FIELD ha_policy ON destination_cluster TYPE string;
            DEFINE FIELD capacity_totals ON destination_cluster TYPE object;
            DEFINE FIELD capacity_available ON destination_cluster TYPE object;
            DEFINE FIELD capacity_reserved ON destination_cluster TYPE object;
            DEFINE FIELD network_profile_id ON destination_cluster TYPE option<record(network_profile_instance)>;
            DEFINE FIELD management_network ON destination_cluster TYPE object;
            DEFINE FIELD workload_network ON destination_cluster TYPE object;
            DEFINE FIELD storage_network ON destination_cluster TYPE option<object>;
            DEFINE FIELD migration_network ON destination_cluster TYPE option<object>;
            DEFINE FIELD status ON destination_cluster TYPE string;
            DEFINE FIELD build_status ON destination_cluster TYPE string;
            DEFINE FIELD validation_results ON destination_cluster TYPE array;
            DEFINE FIELD metadata ON destination_cluster TYPE object;
            DEFINE FIELD created_at ON destination_cluster TYPE datetime;
            DEFINE FIELD updated_at ON destination_cluster TYPE datetime;
            DEFINE FIELD created_by ON destination_cluster TYPE string;
        "#,
        )
        .await?;

        println!("✅ Destination cluster tables created");
        Ok(())
    }

    /// Create VM placement tables
    async fn create_placement_tables(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE TABLE vm_placement_plan SCHEMAFULL;
            DEFINE FIELD project_id ON vm_placement_plan TYPE record(project);
            DEFINE FIELD activity_id ON vm_placement_plan TYPE record(activity);
            DEFINE FIELD rvtools_upload_id ON vm_placement_plan TYPE record(rvtools_upload);
            DEFINE FIELD source_cluster_names ON vm_placement_plan TYPE array<string>;
            DEFINE FIELD source_vm_filter ON vm_placement_plan TYPE option<object>;
            DEFINE FIELD total_vms_selected ON vm_placement_plan TYPE int;
            DEFINE FIELD placements ON vm_placement_plan TYPE array;
            DEFINE FIELD spillover_vms ON vm_placement_plan TYPE array;
            DEFINE FIELD unplaced_vms ON vm_placement_plan TYPE array;
            DEFINE FIELD strategy ON vm_placement_plan TYPE string;
            DEFINE FIELD constraints ON vm_placement_plan TYPE object;
            DEFINE FIELD status ON vm_placement_plan TYPE string;
            DEFINE FIELD warnings ON vm_placement_plan TYPE array<string>;
            DEFINE FIELD metadata ON vm_placement_plan TYPE object;
            DEFINE FIELD created_at ON vm_placement_plan TYPE datetime;
            DEFINE FIELD updated_at ON vm_placement_plan TYPE datetime;
        "#,
        )
        .await?;

        println!("✅ VM placement tables created");
        Ok(())
    }

    /// Create capacity snapshot tables
    async fn create_capacity_tables(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE TABLE capacity_snapshot SCHEMAFULL;
            DEFINE FIELD project_id ON capacity_snapshot TYPE record(project);
            DEFINE FIELD activity_id ON capacity_snapshot TYPE record(activity);
            DEFINE FIELD name ON capacity_snapshot TYPE string;
            DEFINE FIELD description ON capacity_snapshot TYPE option<string>;
            DEFINE FIELD source_upload_id ON capacity_snapshot TYPE record(rvtools_upload);
            DEFINE FIELD source_summary ON capacity_snapshot TYPE object;
            DEFINE FIELD target_clusters ON capacity_snapshot TYPE array<record(destination_cluster)>;
            DEFINE FIELD overcommit_ratios ON capacity_snapshot TYPE object;
            DEFINE FIELD ha_policy ON capacity_snapshot TYPE string;
            DEFINE FIELD headroom_percentage ON capacity_snapshot TYPE float;
            DEFINE FIELD total_capacity ON capacity_snapshot TYPE object;
            DEFINE FIELD used_capacity ON capacity_snapshot TYPE object;
            DEFINE FIELD available_capacity ON capacity_snapshot TYPE object;
            DEFINE FIELD reserved_capacity ON capacity_snapshot TYPE object;
            DEFINE FIELD bottlenecks ON capacity_snapshot TYPE array;
            DEFINE FIELD recommendations ON capacity_snapshot TYPE array<string>;
            DEFINE FIELD risk_assessment ON capacity_snapshot TYPE object;
            DEFINE FIELD is_valid ON capacity_snapshot TYPE bool;
            DEFINE FIELD validation_errors ON capacity_snapshot TYPE array<string>;
            DEFINE FIELD metadata ON capacity_snapshot TYPE object;
            DEFINE FIELD created_at ON capacity_snapshot TYPE datetime;
        "#,
        )
        .await?;

        println!("✅ Capacity snapshot tables created");
        Ok(())
    }

    /// Create network profile tables
    async fn create_network_profile_tables(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE TABLE network_profile_template SCHEMAFULL;
            DEFINE FIELD name ON network_profile_template TYPE string;
            DEFINE FIELD description ON network_profile_template TYPE string;
            DEFINE FIELD hypervisor ON network_profile_template TYPE string;
            DEFINE FIELD storage_type ON network_profile_template TYPE string;
            DEFINE FIELD required_nics ON network_profile_template TYPE int;
            DEFINE FIELD recommended_nics ON network_profile_template TYPE int;
            DEFINE FIELD requires_rdma ON network_profile_template TYPE bool;
            DEFINE FIELD requires_teaming ON network_profile_template TYPE bool;
            DEFINE FIELD min_bandwidth_gbps ON network_profile_template TYPE float;
            DEFINE FIELD network_topology ON network_profile_template TYPE string;
            DEFINE FIELD vlan_requirements ON network_profile_template TYPE array;
            DEFINE FIELD validation_rules ON network_profile_template TYPE array;
            DEFINE FIELD example_configuration ON network_profile_template TYPE option<string>;
            DEFINE FIELD documentation_url ON network_profile_template TYPE option<string>;
            DEFINE FIELD is_standard ON network_profile_template TYPE bool;
            DEFINE FIELD is_active ON network_profile_template TYPE bool;
            DEFINE FIELD metadata ON network_profile_template TYPE object;
            DEFINE FIELD created_at ON network_profile_template TYPE datetime;
            DEFINE FIELD updated_at ON network_profile_template TYPE datetime;

            DEFINE TABLE network_profile_instance SCHEMAFULL;
            DEFINE FIELD project_id ON network_profile_instance TYPE record(project);
            DEFINE FIELD activity_id ON network_profile_instance TYPE record(activity);
            DEFINE FIELD template_id ON network_profile_instance TYPE record(network_profile_template);
            DEFINE FIELD vlan_mappings ON network_profile_instance TYPE object;
            DEFINE FIELD nic_assignments ON network_profile_instance TYPE object;
            DEFINE FIELD custom_settings ON network_profile_instance TYPE object;
            DEFINE FIELD is_valid ON network_profile_instance TYPE bool;
            DEFINE FIELD validation_results ON network_profile_instance TYPE array;
            DEFINE FIELD warnings ON network_profile_instance TYPE array<string>;
            DEFINE FIELD metadata ON network_profile_instance TYPE object;
            DEFINE FIELD created_at ON network_profile_instance TYPE datetime;
            DEFINE FIELD updated_at ON network_profile_instance TYPE datetime;
        "#,
        )
        .await?;

        println!("✅ Network profile tables created");
        Ok(())
    }

    /// Create document template tables
    async fn create_document_template_tables(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE TABLE document_template SCHEMAFULL;
            DEFINE FIELD name ON document_template TYPE string;
            DEFINE FIELD description ON document_template TYPE string;
            DEFINE FIELD document_type ON document_template TYPE string;
            DEFINE FIELD hypervisor ON document_template TYPE option<string>;
            DEFINE FIELD storage_type ON document_template TYPE option<string>;
            DEFINE FIELD file_path ON document_template TYPE string;
            DEFINE FIELD file_size_bytes ON document_template TYPE int;
            DEFINE FIELD file_hash ON document_template TYPE string;
            DEFINE FIELD variables_schema ON document_template TYPE array;
            DEFINE FIELD sections ON document_template TYPE array;
            DEFINE FIELD version ON document_template TYPE string;
            DEFINE FIELD is_standard ON document_template TYPE bool;
            DEFINE FIELD is_active ON document_template TYPE bool;
            DEFINE FIELD author ON document_template TYPE string;
            DEFINE FIELD tags ON document_template TYPE array<string>;
            DEFINE FIELD created_at ON document_template TYPE datetime;
            DEFINE FIELD updated_at ON document_template TYPE datetime;

            DEFINE TABLE generated_document SCHEMAFULL;
            DEFINE FIELD project_id ON generated_document TYPE record(project);
            DEFINE FIELD activity_id ON generated_document TYPE record(activity);
            DEFINE FIELD template_id ON generated_document TYPE record(document_template);
            DEFINE FIELD document_name ON generated_document TYPE string;
            DEFINE FIELD document_type ON generated_document TYPE string;
            DEFINE FIELD file_path ON generated_document TYPE string;
            DEFINE FIELD file_size_bytes ON generated_document TYPE int;
            DEFINE FIELD file_format ON generated_document TYPE string;
            DEFINE FIELD variables_snapshot ON generated_document TYPE object;
            DEFINE FIELD data_sources ON generated_document TYPE array<record>;
            DEFINE FIELD generation_status ON generated_document TYPE string;
            DEFINE FIELD error_message ON generated_document TYPE option<string>;
            DEFINE FIELD metadata ON generated_document TYPE object;
            DEFINE FIELD generated_at ON generated_document TYPE datetime;
            DEFINE FIELD generated_by ON generated_document TYPE string;
            DEFINE FIELD expires_at ON generated_document TYPE option<datetime>;
        "#,
        )
        .await?;

        println!("✅ Document template tables created");
        Ok(())
    }

    /// Create indexes for performance
    async fn create_indexes(db: &Database) -> Result<()> {
        db.query(
            r#"
            DEFINE INDEX destination_cluster_project_idx ON destination_cluster FIELDS project_id;
            DEFINE INDEX destination_cluster_activity_idx ON destination_cluster FIELDS activity_id;
            DEFINE INDEX vm_placement_activity_idx ON vm_placement_plan FIELDS activity_id;
            DEFINE INDEX capacity_snapshot_activity_idx ON capacity_snapshot FIELDS activity_id;
            DEFINE INDEX network_instance_activity_idx ON network_profile_instance FIELDS activity_id;
            DEFINE INDEX generated_doc_activity_idx ON generated_document FIELDS activity_id;
        "#,
        )
        .await?;

        println!("✅ Migration planning indexes created");
        Ok(())
    }

    /// Seed standard network profile templates
    async fn seed_network_templates(db: &Database) -> Result<()> {
        let templates = vec![
            json!({
                "name": "Hyper-V S2D Converged",
                "description": "Converged network for Hyper-V with Storage Spaces Direct",
                "hypervisor": "hyper-v",
                "storage_type": "s2d",
                "required_nics": 4,
                "recommended_nics": 6,
                "requires_rdma": true,
                "requires_teaming": true,
                "min_bandwidth_gbps": 10.0,
                "network_topology": "converged",
                "vlan_requirements": [
                    {
                        "purpose": "management",
                        "vlan_id_range": {"min": 100, "max": 199},
                        "is_required": true,
                        "description": "Management network for cluster communication"
                    },
                    {
                        "purpose": "workload",
                        "vlan_id_range": {"min": 200, "max": 299},
                        "is_required": true,
                        "description": "VM workload network"
                    },
                    {
                        "purpose": "storage",
                        "vlan_id_range": {"min": 300, "max": 399},
                        "is_required": true,
                        "description": "Storage network for S2D"
                    }
                ],
                "validation_rules": [],
                "is_standard": true,
                "is_active": true,
                "metadata": {}
            }),
            json!({
                "name": "Hyper-V Traditional Storage",
                "description": "Separated network for Hyper-V with traditional SAN storage",
                "hypervisor": "hyper-v",
                "storage_type": "traditional",
                "required_nics": 4,
                "recommended_nics": 4,
                "requires_rdma": false,
                "requires_teaming": true,
                "min_bandwidth_gbps": 1.0,
                "network_topology": "separated",
                "vlan_requirements": [
                    {
                        "purpose": "management",
                        "vlan_id_range": {"min": 100, "max": 199},
                        "is_required": true,
                        "description": "Management network"
                    },
                    {
                        "purpose": "workload",
                        "vlan_id_range": {"min": 200, "max": 299},
                        "is_required": true,
                        "description": "VM workload network"
                    }
                ],
                "validation_rules": [],
                "is_standard": true,
                "is_active": true,
                "metadata": {}
            }),
            json!({
                "name": "Azure Local (HCI)",
                "description": "Network profile for Azure Local (Azure Stack HCI)",
                "hypervisor": "azure-local",
                "storage_type": "azure_local",
                "required_nics": 6,
                "recommended_nics": 8,
                "requires_rdma": true,
                "requires_teaming": false,
                "min_bandwidth_gbps": 25.0,
                "network_topology": "fully_converged",
                "vlan_requirements": [
                    {
                        "purpose": "management",
                        "vlan_id_range": {"min": 100, "max": 199},
                        "is_required": true,
                        "description": "Management and cluster communication"
                    },
                    {
                        "purpose": "workload",
                        "vlan_id_range": {"min": 200, "max": 299},
                        "is_required": true,
                        "description": "VM workload network"
                    },
                    {
                        "purpose": "storage",
                        "vlan_id_range": {"min": 300, "max": 399},
                        "is_required": true,
                        "description": "RDMA storage network"
                    }
                ],
                "validation_rules": [],
                "is_standard": true,
                "is_active": true,
                "metadata": {}
            })
        ];

        for template in templates {
            let _: Vec<serde_json::Value> = db
                .create("network_profile_template")
                .content(template)
                .await?;
        }

        println!("✅ Standard network templates seeded");
        Ok(())
    }
}
