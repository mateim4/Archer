use crate::database::Database;
use anyhow::Result;
use serde_json::json;

/// Knowledge Base migrations
pub struct KnowledgeBaseMigrations;

impl KnowledgeBaseMigrations {
    /// Run all Knowledge Base migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_knowledge_base_tables(db).await?;
        Self::create_knowledge_base_indexes(db).await?;
        Self::seed_default_categories(db).await?;
        Ok(())
    }

    /// Create Knowledge Base tables
    async fn create_knowledge_base_tables(db: &Database) -> Result<()> {
        // Knowledge Article table
        db.query(
            r#"
            DEFINE TABLE knowledge_article SCHEMAFULL;
            DEFINE FIELD title ON knowledge_article TYPE string;
            DEFINE FIELD content ON knowledge_article TYPE string;
            DEFINE FIELD summary ON knowledge_article TYPE option<string>;
            DEFINE FIELD category_id ON knowledge_article TYPE option<record(knowledge_category)>;
            DEFINE FIELD status ON knowledge_article TYPE string;
            DEFINE FIELD author_id ON knowledge_article TYPE string;
            DEFINE FIELD tags ON knowledge_article TYPE array<string> DEFAULT [];
            DEFINE FIELD view_count ON knowledge_article TYPE int DEFAULT 0;
            DEFINE FIELD helpful_count ON knowledge_article TYPE int DEFAULT 0;
            DEFINE FIELD not_helpful_count ON knowledge_article TYPE int DEFAULT 0;
            DEFINE FIELD version_number ON knowledge_article TYPE int DEFAULT 1;
            DEFINE FIELD is_featured ON knowledge_article TYPE bool DEFAULT false;
            DEFINE FIELD is_archived ON knowledge_article TYPE bool DEFAULT false;
            DEFINE FIELD created_at ON knowledge_article TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON knowledge_article TYPE datetime DEFAULT time::now();
            DEFINE FIELD published_at ON knowledge_article TYPE option<datetime>;
        "#,
        )
        .await?;

        // Knowledge Category table
        db.query(
            r#"
            DEFINE TABLE knowledge_category SCHEMAFULL;
            DEFINE FIELD name ON knowledge_category TYPE string;
            DEFINE FIELD description ON knowledge_category TYPE option<string>;
            DEFINE FIELD parent_id ON knowledge_category TYPE option<record(knowledge_category)>;
            DEFINE FIELD icon ON knowledge_category TYPE option<string>;
            DEFINE FIELD order ON knowledge_category TYPE int DEFAULT 0;
            DEFINE FIELD article_count ON knowledge_category TYPE int DEFAULT 0;
            DEFINE FIELD is_visible ON knowledge_category TYPE bool DEFAULT true;
            DEFINE FIELD created_at ON knowledge_category TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON knowledge_category TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        // Article Version table
        db.query(
            r#"
            DEFINE TABLE article_version SCHEMAFULL;
            DEFINE FIELD article_id ON article_version TYPE record(knowledge_article);
            DEFINE FIELD version_number ON article_version TYPE int;
            DEFINE FIELD title ON article_version TYPE string;
            DEFINE FIELD content ON article_version TYPE string;
            DEFINE FIELD summary ON article_version TYPE option<string>;
            DEFINE FIELD changed_by ON article_version TYPE string;
            DEFINE FIELD change_note ON article_version TYPE option<string>;
            DEFINE FIELD created_at ON article_version TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        // Article Feedback table
        db.query(
            r#"
            DEFINE TABLE article_feedback SCHEMAFULL;
            DEFINE FIELD article_id ON article_feedback TYPE record(knowledge_article);
            DEFINE FIELD user_id ON article_feedback TYPE string;
            DEFINE FIELD is_helpful ON article_feedback TYPE bool;
            DEFINE FIELD comment ON article_feedback TYPE option<string>;
            DEFINE FIELD created_at ON article_feedback TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        // Article Attachment table
        db.query(
            r#"
            DEFINE TABLE article_attachment SCHEMAFULL;
            DEFINE FIELD article_id ON article_attachment TYPE record(knowledge_article);
            DEFINE FIELD filename ON article_attachment TYPE string;
            DEFINE FIELD file_path ON article_attachment TYPE string;
            DEFINE FIELD file_size ON article_attachment TYPE int;
            DEFINE FIELD mime_type ON article_attachment TYPE string;
            DEFINE FIELD uploaded_by ON article_attachment TYPE string;
            DEFINE FIELD created_at ON article_attachment TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        // Related Article relation table
        db.query(
            r#"
            DEFINE TABLE related_article TYPE RELATION IN knowledge_article OUT knowledge_article;
            DEFINE FIELD relation_type ON related_article TYPE string;
            DEFINE FIELD created_at ON related_article TYPE datetime DEFAULT time::now();
        "#,
        )
        .await?;

        println!("✅ Knowledge Base tables created successfully");
        Ok(())
    }

    /// Create indexes for Knowledge Base
    async fn create_knowledge_base_indexes(db: &Database) -> Result<()> {
        // Article indexes
        db.query("DEFINE INDEX idx_article_title ON knowledge_article FIELDS title SEARCH ANALYZER ascii BM25;")
            .await?;
        db.query("DEFINE INDEX idx_article_content ON knowledge_article FIELDS content SEARCH ANALYZER ascii BM25;")
            .await?;
        db.query("DEFINE INDEX idx_article_category ON knowledge_article FIELDS category_id;")
            .await?;
        db.query("DEFINE INDEX idx_article_status ON knowledge_article FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_article_author ON knowledge_article FIELDS author_id;")
            .await?;
        db.query("DEFINE INDEX idx_article_tags ON knowledge_article FIELDS tags;")
            .await?;

        // Category indexes
        db.query("DEFINE INDEX idx_category_name ON knowledge_category FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_category_parent ON knowledge_category FIELDS parent_id;")
            .await?;

        // Version indexes
        db.query("DEFINE INDEX idx_version_article ON article_version FIELDS article_id;")
            .await?;

        // Feedback indexes
        db.query("DEFINE INDEX idx_feedback_article ON article_feedback FIELDS article_id;")
            .await?;

        println!("✅ Knowledge Base indexes created successfully");
        Ok(())
    }

    /// Seed default categories
    async fn seed_default_categories(db: &Database) -> Result<()> {
        let categories = vec![
            ("Getting Started", "Introduction and basic guides", "📚", 1),
            ("Troubleshooting", "Common issues and solutions", "🔧", 2),
            ("Best Practices", "Recommended workflows and tips", "⭐", 3),
            ("System Administration", "Admin guides and configuration", "⚙️", 4),
            ("API Documentation", "API references and integration guides", "📡", 5),
            ("Release Notes", "What's new in each release", "📝", 6),
        ];

        for (name, desc, icon, order) in categories {
            let _: Vec<serde_json::Value> = db
                .query(
                    "CREATE knowledge_category SET name = $name, description = $desc, icon = $icon, order = $order;"
                )
                .bind(("name", name))
                .bind(("desc", desc))
                .bind(("icon", icon))
                .bind(("order", order))
                .await?
                .take(0)?;
        }

        println!("✅ Default Knowledge Base categories seeded");
        Ok(())
    }
}

// Original migrations below...

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
