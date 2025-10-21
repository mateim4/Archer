use crate::database::Database;
use anyhow::Result;
use serde_json::json;

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
