use crate::database::Database;
use anyhow::Result;
use serde_json::json;

// ============================================================================
// PHASE 1: TICKET SYSTEM MIGRATIONS
// ============================================================================

/// Database migrations for enhanced ticket system (Phase 1)
pub struct TicketMigrations;

impl TicketMigrations {
    /// Run all ticket system migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_ticket_tables(db).await?;
        Self::create_ticket_indexes(db).await?;
        Ok(())
    }

    /// Create tables for enhanced ticket functionality
    async fn create_ticket_tables(db: &Database) -> Result<()> {
        // Enhanced Ticket table
        db.query(
            r#"
            DEFINE TABLE ticket SCHEMAFULL;
            DEFINE FIELD title ON ticket TYPE string;
            DEFINE FIELD description ON ticket TYPE option<string>;
            DEFINE FIELD type ON ticket TYPE string;
            DEFINE FIELD priority ON ticket TYPE string;
            DEFINE FIELD status ON ticket TYPE string DEFAULT 'NEW';
            DEFINE FIELD related_asset ON ticket TYPE option<record>;
            DEFINE FIELD related_project ON ticket TYPE option<record>;
            DEFINE FIELD assignee ON ticket TYPE option<string>;
            DEFINE FIELD created_by ON ticket TYPE string;
            DEFINE FIELD created_at ON ticket TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON ticket TYPE datetime DEFAULT time::now();
            -- Phase 1: SLA fields
            DEFINE FIELD sla_policy_id ON ticket TYPE option<record(sla_policies)>;
            DEFINE FIELD sla_breach_at ON ticket TYPE option<datetime>;
            DEFINE FIELD response_due ON ticket TYPE option<datetime>;
            DEFINE FIELD resolution_due ON ticket TYPE option<datetime>;
            DEFINE FIELD response_sla_met ON ticket TYPE option<bool>;
            DEFINE FIELD resolution_sla_met ON ticket TYPE option<bool>;
            DEFINE FIELD first_response_at ON ticket TYPE option<datetime>;
            DEFINE FIELD resolved_at ON ticket TYPE option<datetime>;
            DEFINE FIELD closed_at ON ticket TYPE option<datetime>;
            -- Phase 1: Enhanced fields
            DEFINE FIELD watchers ON ticket TYPE array DEFAULT [];
            DEFINE FIELD tags ON ticket TYPE array DEFAULT [];
            DEFINE FIELD custom_fields ON ticket TYPE option<object>;
            DEFINE FIELD impact ON ticket TYPE option<string>;
            DEFINE FIELD urgency ON ticket TYPE option<string>;
            DEFINE FIELD source ON ticket TYPE option<string>;
            DEFINE FIELD category ON ticket TYPE option<string>;
            DEFINE FIELD subcategory ON ticket TYPE option<string>;
            DEFINE FIELD assigned_group ON ticket TYPE option<string>;
            DEFINE FIELD tenant_id ON ticket TYPE option<record(tenants)>;
            "#,
        )
        .await?;

        // Ticket Comments table
        db.query(
            r#"
            DEFINE TABLE ticket_comments SCHEMAFULL;
            DEFINE FIELD ticket_id ON ticket_comments TYPE record(ticket);
            DEFINE FIELD content ON ticket_comments TYPE string;
            DEFINE FIELD author_id ON ticket_comments TYPE string;
            DEFINE FIELD author_name ON ticket_comments TYPE string;
            DEFINE FIELD is_internal ON ticket_comments TYPE bool DEFAULT false;
            DEFINE FIELD comment_type ON ticket_comments TYPE string DEFAULT 'NOTE';
            DEFINE FIELD attachments ON ticket_comments TYPE array DEFAULT [];
            DEFINE FIELD created_at ON ticket_comments TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON ticket_comments TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Ticket Attachments table
        db.query(
            r#"
            DEFINE TABLE ticket_attachments SCHEMAFULL;
            DEFINE FIELD ticket_id ON ticket_attachments TYPE record(ticket);
            DEFINE FIELD filename ON ticket_attachments TYPE string;
            DEFINE FIELD original_filename ON ticket_attachments TYPE string;
            DEFINE FIELD mime_type ON ticket_attachments TYPE string;
            DEFINE FIELD size_bytes ON ticket_attachments TYPE int;
            DEFINE FIELD storage_path ON ticket_attachments TYPE string;
            DEFINE FIELD uploaded_by ON ticket_attachments TYPE string;
            DEFINE FIELD uploaded_at ON ticket_attachments TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Ticket History table
        db.query(
            r#"
            DEFINE TABLE ticket_history SCHEMAFULL;
            DEFINE FIELD ticket_id ON ticket_history TYPE record(ticket);
            DEFINE FIELD field_name ON ticket_history TYPE string;
            DEFINE FIELD old_value ON ticket_history TYPE option<string>;
            DEFINE FIELD new_value ON ticket_history TYPE option<string>;
            DEFINE FIELD changed_by ON ticket_history TYPE string;
            DEFINE FIELD changed_by_name ON ticket_history TYPE string;
            DEFINE FIELD change_type ON ticket_history TYPE string;
            DEFINE FIELD created_at ON ticket_history TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // SLA Policies table
        db.query(
            r#"
            DEFINE TABLE sla_policies SCHEMAFULL;
            DEFINE FIELD name ON sla_policies TYPE string;
            DEFINE FIELD description ON sla_policies TYPE option<string>;
            DEFINE FIELD response_target_minutes ON sla_policies TYPE int;
            DEFINE FIELD resolution_target_minutes ON sla_policies TYPE int;
            DEFINE FIELD applies_to_priorities ON sla_policies TYPE array DEFAULT [];
            DEFINE FIELD applies_to_types ON sla_policies TYPE array DEFAULT [];
            DEFINE FIELD business_hours_id ON sla_policies TYPE option<record(business_hours)>;
            DEFINE FIELD is_active ON sla_policies TYPE bool DEFAULT true;
            DEFINE FIELD escalation_rules ON sla_policies TYPE array DEFAULT [];
            DEFINE FIELD created_at ON sla_policies TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON sla_policies TYPE datetime DEFAULT time::now();
            DEFINE FIELD tenant_id ON sla_policies TYPE option<record(tenants)>;
            "#,
        )
        .await?;

        // Business Hours table
        db.query(
            r#"
            DEFINE TABLE business_hours SCHEMAFULL;
            DEFINE FIELD name ON business_hours TYPE string;
            DEFINE FIELD timezone ON business_hours TYPE string;
            DEFINE FIELD schedule ON business_hours TYPE array DEFAULT [];
            DEFINE FIELD holidays ON business_hours TYPE array DEFAULT [];
            DEFINE FIELD is_default ON business_hours TYPE bool DEFAULT false;
            DEFINE FIELD tenant_id ON business_hours TYPE option<record(tenants)>;
            "#,
        )
        .await?;

        println!("✅ Enhanced ticket tables created successfully");
        Ok(())
    }

    /// Create indexes for ticket tables
    async fn create_ticket_indexes(db: &Database) -> Result<()> {
        // Ticket indexes
        db.query("DEFINE INDEX idx_ticket_status ON ticket FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_priority ON ticket FIELDS priority;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_type ON ticket FIELDS type;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_assignee ON ticket FIELDS assignee;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_created_by ON ticket FIELDS created_by;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_category ON ticket FIELDS category;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_tenant ON ticket FIELDS tenant_id;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_sla_breach ON ticket FIELDS sla_breach_at;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_response_due ON ticket FIELDS response_due;")
            .await?;
        db.query("DEFINE INDEX idx_ticket_resolution_due ON ticket FIELDS resolution_due;")
            .await?;

        // Comment indexes
        db.query("DEFINE INDEX idx_comments_ticket ON ticket_comments FIELDS ticket_id;")
            .await?;
        db.query("DEFINE INDEX idx_comments_author ON ticket_comments FIELDS author_id;")
            .await?;

        // Attachment indexes
        db.query("DEFINE INDEX idx_attachments_ticket ON ticket_attachments FIELDS ticket_id;")
            .await?;
        db.query("DEFINE INDEX idx_attachments_uploaded_by ON ticket_attachments FIELDS uploaded_by;")
            .await?;

        // History indexes
        db.query("DEFINE INDEX idx_history_ticket ON ticket_history FIELDS ticket_id;")
            .await?;
        db.query("DEFINE INDEX idx_history_created ON ticket_history FIELDS created_at;")
            .await?;

        // SLA indexes
        db.query("DEFINE INDEX idx_sla_name ON sla_policies FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_sla_active ON sla_policies FIELDS is_active;")
            .await?;
        db.query("DEFINE INDEX idx_sla_tenant ON sla_policies FIELDS tenant_id;")
            .await?;

        println!("✅ Ticket indexes created successfully");
        Ok(())
    }
}

// ============================================================================
// EXISTING MIGRATIONS
// ============================================================================

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

// ============================================================================
// AUTHENTICATION & RBAC MIGRATIONS (Phase 0)
// ============================================================================

/// Authentication and RBAC database migrations
pub struct AuthMigrations;

impl AuthMigrations {
    /// Run all authentication migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_auth_tables(db).await?;
        Self::create_auth_indexes(db).await?;
        Self::seed_system_roles_and_permissions(db).await?;
        Self::seed_admin_user(db).await?;
        Ok(())
    }

    /// Create authentication tables (users, roles, permissions, tokens, audit)
    async fn create_auth_tables(db: &Database) -> Result<()> {
        // Users table
        db.query(
            r#"
            DEFINE TABLE users SCHEMAFULL;
            DEFINE FIELD email ON users TYPE string;
            DEFINE FIELD username ON users TYPE string;
            DEFINE FIELD password_hash ON users TYPE string;
            DEFINE FIELD display_name ON users TYPE string;
            DEFINE FIELD status ON users TYPE string DEFAULT 'ACTIVE';
            DEFINE FIELD roles ON users TYPE array;
            DEFINE FIELD tenant_id ON users TYPE option<record(tenants)>;
            DEFINE FIELD last_login ON users TYPE option<datetime>;
            DEFINE FIELD failed_login_attempts ON users TYPE int DEFAULT 0;
            DEFINE FIELD locked_until ON users TYPE option<datetime>;
            DEFINE FIELD created_at ON users TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON users TYPE datetime DEFAULT time::now();
            DEFINE FIELD created_by ON users TYPE option<string>;
            "#,
        )
        .await?;

        // Roles table
        db.query(
            r#"
            DEFINE TABLE roles SCHEMAFULL;
            DEFINE FIELD name ON roles TYPE string;
            DEFINE FIELD display_name ON roles TYPE string;
            DEFINE FIELD description ON roles TYPE option<string>;
            DEFINE FIELD permissions ON roles TYPE array;
            DEFINE FIELD is_system ON roles TYPE bool DEFAULT false;
            DEFINE FIELD tenant_id ON roles TYPE option<record(tenants)>;
            DEFINE FIELD created_at ON roles TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON roles TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Permissions table
        db.query(
            r#"
            DEFINE TABLE permissions SCHEMAFULL;
            DEFINE FIELD name ON permissions TYPE string;
            DEFINE FIELD display_name ON permissions TYPE string;
            DEFINE FIELD description ON permissions TYPE option<string>;
            DEFINE FIELD resource ON permissions TYPE string;
            DEFINE FIELD action ON permissions TYPE string;
            DEFINE FIELD is_system ON permissions TYPE bool DEFAULT true;
            DEFINE FIELD created_at ON permissions TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Refresh tokens table
        db.query(
            r#"
            DEFINE TABLE refresh_tokens SCHEMAFULL;
            DEFINE FIELD token_hash ON refresh_tokens TYPE string;
            DEFINE FIELD user_id ON refresh_tokens TYPE record(users);
            DEFINE FIELD expires_at ON refresh_tokens TYPE datetime;
            DEFINE FIELD revoked ON refresh_tokens TYPE bool DEFAULT false;
            DEFINE FIELD revoked_at ON refresh_tokens TYPE option<datetime>;
            DEFINE FIELD created_at ON refresh_tokens TYPE datetime DEFAULT time::now();
            DEFINE FIELD user_agent ON refresh_tokens TYPE option<string>;
            DEFINE FIELD ip_address ON refresh_tokens TYPE option<string>;
            "#,
        )
        .await?;

        // Audit logs table
        db.query(
            r#"
            DEFINE TABLE audit_logs SCHEMAFULL;
            DEFINE FIELD event_type ON audit_logs TYPE string;
            DEFINE FIELD user_id ON audit_logs TYPE option<record(users)>;
            DEFINE FIELD username ON audit_logs TYPE option<string>;
            DEFINE FIELD resource_type ON audit_logs TYPE option<string>;
            DEFINE FIELD resource_id ON audit_logs TYPE option<string>;
            DEFINE FIELD action ON audit_logs TYPE string;
            DEFINE FIELD details ON audit_logs TYPE option<object>;
            DEFINE FIELD ip_address ON audit_logs TYPE option<string>;
            DEFINE FIELD user_agent ON audit_logs TYPE option<string>;
            DEFINE FIELD success ON audit_logs TYPE bool DEFAULT true;
            DEFINE FIELD error_message ON audit_logs TYPE option<string>;
            DEFINE FIELD tenant_id ON audit_logs TYPE option<record(tenants)>;
            DEFINE FIELD created_at ON audit_logs TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Tenants table (for multi-tenant isolation)
        db.query(
            r#"
            DEFINE TABLE tenants SCHEMAFULL;
            DEFINE FIELD name ON tenants TYPE string;
            DEFINE FIELD display_name ON tenants TYPE string;
            DEFINE FIELD status ON tenants TYPE string DEFAULT 'ACTIVE';
            DEFINE FIELD settings ON tenants TYPE option<object>;
            DEFINE FIELD created_at ON tenants TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON tenants TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        println!("✅ Authentication tables created successfully");
        Ok(())
    }

    /// Create indexes for authentication tables
    async fn create_auth_indexes(db: &Database) -> Result<()> {
        // User indexes - unique constraints
        db.query("DEFINE INDEX idx_users_email ON users FIELDS email UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_users_username ON users FIELDS username UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_users_status ON users FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_users_tenant ON users FIELDS tenant_id;")
            .await?;

        // Role indexes
        db.query("DEFINE INDEX idx_roles_name ON roles FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_roles_tenant ON roles FIELDS tenant_id;")
            .await?;
        db.query("DEFINE INDEX idx_roles_is_system ON roles FIELDS is_system;")
            .await?;

        // Permission indexes
        db.query("DEFINE INDEX idx_permissions_name ON permissions FIELDS name UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_permissions_resource ON permissions FIELDS resource;")
            .await?;

        // Refresh token indexes
        db.query("DEFINE INDEX idx_refresh_tokens_hash ON refresh_tokens FIELDS token_hash UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_refresh_tokens_user ON refresh_tokens FIELDS user_id;")
            .await?;
        db.query("DEFINE INDEX idx_refresh_tokens_expires ON refresh_tokens FIELDS expires_at;")
            .await?;

        // Audit log indexes
        db.query("DEFINE INDEX idx_audit_logs_user ON audit_logs FIELDS user_id;")
            .await?;
        db.query("DEFINE INDEX idx_audit_logs_event ON audit_logs FIELDS event_type;")
            .await?;
        db.query("DEFINE INDEX idx_audit_logs_resource ON audit_logs FIELDS resource_type, resource_id;")
            .await?;
        db.query("DEFINE INDEX idx_audit_logs_created ON audit_logs FIELDS created_at;")
            .await?;
        db.query("DEFINE INDEX idx_audit_logs_tenant ON audit_logs FIELDS tenant_id;")
            .await?;

        // Tenant indexes
        db.query("DEFINE INDEX idx_tenants_name ON tenants FIELDS name UNIQUE;")
            .await?;

        println!("✅ Authentication indexes created successfully");
        Ok(())
    }

    /// Seed system roles and permissions
    pub async fn seed_system_roles_and_permissions(db: &Database) -> Result<()> {
        // Define all system permissions
        let permissions = vec![
            // Ticket permissions
            ("tickets:create", "Create Tickets", "tickets", "create"),
            ("tickets:read", "Read Tickets", "tickets", "read"),
            ("tickets:update", "Update Tickets", "tickets", "update"),
            ("tickets:delete", "Delete Tickets", "tickets", "delete"),
            ("tickets:manage", "Manage Tickets", "tickets", "manage"),
            // Asset permissions
            ("assets:create", "Create Assets", "assets", "create"),
            ("assets:read", "Read Assets", "assets", "read"),
            ("assets:update", "Update Assets", "assets", "update"),
            ("assets:delete", "Delete Assets", "assets", "delete"),
            ("assets:manage", "Manage Assets", "assets", "manage"),
            // User permissions
            ("users:create", "Create Users", "users", "create"),
            ("users:read", "Read Users", "users", "read"),
            ("users:update", "Update Users", "users", "update"),
            ("users:delete", "Delete Users", "users", "delete"),
            ("users:manage", "Manage Users", "users", "manage"),
            // Role permissions
            ("roles:create", "Create Roles", "roles", "create"),
            ("roles:read", "Read Roles", "roles", "read"),
            ("roles:update", "Update Roles", "roles", "update"),
            ("roles:delete", "Delete Roles", "roles", "delete"),
            ("roles:manage", "Manage Roles", "roles", "manage"),
            // Knowledge base permissions
            ("knowledge:create", "Create KB Articles", "knowledge", "create"),
            ("knowledge:read", "Read KB Articles", "knowledge", "read"),
            ("knowledge:update", "Update KB Articles", "knowledge", "update"),
            ("knowledge:delete", "Delete KB Articles", "knowledge", "delete"),
            // Monitoring permissions
            ("monitoring:read", "View Monitoring", "monitoring", "read"),
            ("monitoring:manage", "Manage Monitoring", "monitoring", "manage"),
            // Reports permissions
            ("reports:read", "View Reports", "reports", "read"),
            ("reports:create", "Create Reports", "reports", "create"),
            ("reports:export", "Export Reports", "reports", "execute"),
            // Settings permissions
            ("settings:read", "View Settings", "settings", "read"),
            ("settings:manage", "Manage Settings", "settings", "manage"),
            // System permissions
            ("system:admin", "System Administration", "system", "manage"),
            ("audit:read", "View Audit Logs", "audit", "read"),
        ];

        // Create permissions
        for (name, display_name, resource, action) in &permissions {
            let query = format!(
                r#"
                CREATE permissions:{} SET
                    name = '{}',
                    display_name = '{}',
                    resource = '{}',
                    action = '{}',
                    is_system = true
                "#,
                name.replace(":", "_"),
                name,
                display_name,
                resource,
                action
            );
            match db.query(&query).await {
                Ok(_) => {}
                Err(e) => println!("⚠️ Permission {} creation: {}", name, e),
            }
        }

        // Define system roles with their permissions
        let roles = vec![
            (
                "super_admin",
                "Super Administrator",
                "Full system access across all tenants",
                vec!["system:admin"], // Super admin gets all permissions implicitly
            ),
            (
                "admin",
                "Administrator",
                "Tenant administrator with full access",
                vec![
                    "tickets:manage",
                    "assets:manage",
                    "users:manage",
                    "roles:manage",
                    "knowledge:manage",
                    "monitoring:manage",
                    "reports:create",
                    "reports:export",
                    "settings:manage",
                    "audit:read",
                ],
            ),
            (
                "service_manager",
                "Service Manager",
                "Service desk manager with team oversight",
                vec![
                    "tickets:manage",
                    "assets:read",
                    "users:read",
                    "knowledge:manage",
                    "monitoring:read",
                    "reports:read",
                    "reports:create",
                ],
            ),
            (
                "agent",
                "Service Desk Agent",
                "Service desk agent with ticket handling",
                vec![
                    "tickets:create",
                    "tickets:read",
                    "tickets:update",
                    "assets:read",
                    "knowledge:read",
                    "knowledge:create",
                ],
            ),
            (
                "viewer",
                "Viewer",
                "Read-only access to the system",
                vec![
                    "tickets:read",
                    "assets:read",
                    "knowledge:read",
                    "monitoring:read",
                    "reports:read",
                ],
            ),
        ];

        // Create roles
        for (name, display_name, description, perms) in roles {
            let permission_refs: Vec<String> = perms
                .iter()
                .map(|p| format!("permissions:{}", p.replace(":", "_")))
                .collect();
            let permissions_str = permission_refs.join(", ");

            let query = format!(
                r#"
                CREATE roles:{} SET
                    name = '{}',
                    display_name = '{}',
                    description = '{}',
                    permissions = [{}],
                    is_system = true
                "#,
                name, name, display_name, description, permissions_str
            );
            match db.query(&query).await {
                Ok(_) => println!("✅ Role {} created", name),
                Err(e) => println!("⚠️ Role {} creation: {}", name, e),
            }
        }

        println!("✅ System roles and permissions seeded successfully");
        Ok(())
    }

    /// Seed default admin user for testing
    /// 
    /// Creates an admin user with predefined credentials:
    /// - Email: admin@archer.local
    /// - Username: admin
    /// - Password: ArcherAdmin123!
    /// 
    /// This user is assigned the super_admin role for full system access.
    /// **IMPORTANT: Change credentials in production!**
    pub async fn seed_admin_user(db: &Database) -> Result<()> {
        use argon2::{
            password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
            Argon2,
        };

        // Check if admin user already exists
        let existing: Vec<serde_json::Value> = db
            .query("SELECT * FROM users WHERE email = 'admin@archer.local'")
            .await?
            .take(0)?;

        if !existing.is_empty() {
            println!("ℹ️ Admin user already exists, skipping seed");
            return Ok(());
        }

        // Hash the default password
        let password = "ArcherAdmin123!";
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| anyhow::anyhow!("Password hashing failed: {}", e))?
            .to_string();

        // Create the admin user with super_admin role
        let query = format!(
            r#"
            CREATE users:admin SET
                email = 'admin@archer.local',
                username = 'admin',
                password_hash = '{}',
                display_name = 'System Administrator',
                status = 'ACTIVE',
                roles = ['super_admin'],
                tenant_id = NONE,
                failed_login_attempts = 0
            "#,
            password_hash
        );

        match db.query(&query).await {
            Ok(_) => {
                println!("✅ Default admin user created:");
                println!("   📧 Email: admin@archer.local");
                println!("   👤 Username: admin");
                println!("   🔑 Password: ArcherAdmin123!");
                println!("   ⚠️  CHANGE THESE CREDENTIALS IN PRODUCTION!");
            }
            Err(e) => println!("⚠️ Admin user creation: {}", e),
        }

        // Create audit log entry for admin creation
        let audit_query = r#"
            CREATE audit_logs SET
                event_type = 'SYSTEM_SEED',
                action = 'CREATE_ADMIN_USER',
                details = { message: 'Default admin user seeded during initialization' },
                success = true
        "#;
        let _ = db.query(audit_query).await;

        Ok(())
    }
}

// ============================================================================
// PHASE 1.5: KNOWLEDGE BASE MIGRATIONS
// ============================================================================

/// Database migrations for Knowledge Base (Phase 1.5)
pub struct KnowledgeBaseMigrations;

impl KnowledgeBaseMigrations {
    /// Run all Knowledge Base migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_kb_tables(db).await?;
        Self::create_kb_indexes(db).await?;
        Self::seed_default_categories(db).await?;
        Ok(())
    }

    /// Create tables for Knowledge Base
    async fn create_kb_tables(db: &Database) -> Result<()> {
        // KB Categories table
        db.query(
            r#"
            DEFINE TABLE kb_categories SCHEMAFULL;
            DEFINE FIELD name ON kb_categories TYPE string;
            DEFINE FIELD slug ON kb_categories TYPE string;
            DEFINE FIELD description ON kb_categories TYPE option<string>;
            DEFINE FIELD parent_id ON kb_categories TYPE option<record(kb_categories)>;
            DEFINE FIELD icon ON kb_categories TYPE option<string>;
            DEFINE FIELD display_order ON kb_categories TYPE int DEFAULT 0;
            DEFINE FIELD is_active ON kb_categories TYPE bool DEFAULT true;
            DEFINE FIELD article_count ON kb_categories TYPE int DEFAULT 0;
            DEFINE FIELD tenant_id ON kb_categories TYPE option<record(tenants)>;
            DEFINE FIELD created_at ON kb_categories TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON kb_categories TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // KB Articles table
        db.query(
            r#"
            DEFINE TABLE kb_articles SCHEMAFULL;
            DEFINE FIELD title ON kb_articles TYPE string;
            DEFINE FIELD slug ON kb_articles TYPE string;
            DEFINE FIELD content ON kb_articles TYPE string;
            DEFINE FIELD summary ON kb_articles TYPE option<string>;
            DEFINE FIELD category_id ON kb_articles TYPE option<record(kb_categories)>;
            DEFINE FIELD tags ON kb_articles TYPE array DEFAULT [];
            DEFINE FIELD visibility ON kb_articles TYPE string DEFAULT 'INTERNAL';
            DEFINE FIELD status ON kb_articles TYPE string DEFAULT 'DRAFT';
            DEFINE FIELD author_id ON kb_articles TYPE string;
            DEFINE FIELD author_name ON kb_articles TYPE string;
            DEFINE FIELD reviewers ON kb_articles TYPE array DEFAULT [];
            DEFINE FIELD approved_by ON kb_articles TYPE option<string>;
            DEFINE FIELD approved_at ON kb_articles TYPE option<datetime>;
            DEFINE FIELD view_count ON kb_articles TYPE int DEFAULT 0;
            DEFINE FIELD helpful_count ON kb_articles TYPE int DEFAULT 0;
            DEFINE FIELD not_helpful_count ON kb_articles TYPE int DEFAULT 0;
            DEFINE FIELD version ON kb_articles TYPE int DEFAULT 1;
            DEFINE FIELD linked_articles ON kb_articles TYPE array DEFAULT [];
            DEFINE FIELD attachments ON kb_articles TYPE array DEFAULT [];
            DEFINE FIELD seo_title ON kb_articles TYPE option<string>;
            DEFINE FIELD seo_description ON kb_articles TYPE option<string>;
            DEFINE FIELD tenant_id ON kb_articles TYPE option<record(tenants)>;
            DEFINE FIELD created_at ON kb_articles TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON kb_articles TYPE datetime DEFAULT time::now();
            DEFINE FIELD published_at ON kb_articles TYPE option<datetime>;
            DEFINE FIELD expires_at ON kb_articles TYPE option<datetime>;
            "#,
        )
        .await?;

        // KB Article Versions table
        db.query(
            r#"
            DEFINE TABLE kb_article_versions SCHEMAFULL;
            DEFINE FIELD article_id ON kb_article_versions TYPE record(kb_articles);
            DEFINE FIELD version ON kb_article_versions TYPE int;
            DEFINE FIELD title ON kb_article_versions TYPE string;
            DEFINE FIELD content ON kb_article_versions TYPE string;
            DEFINE FIELD change_summary ON kb_article_versions TYPE option<string>;
            DEFINE FIELD created_by ON kb_article_versions TYPE string;
            DEFINE FIELD created_by_name ON kb_article_versions TYPE string;
            DEFINE FIELD created_at ON kb_article_versions TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // KB Article Ratings table
        db.query(
            r#"
            DEFINE TABLE kb_article_ratings SCHEMAFULL;
            DEFINE FIELD article_id ON kb_article_ratings TYPE record(kb_articles);
            DEFINE FIELD user_id ON kb_article_ratings TYPE string;
            DEFINE FIELD is_helpful ON kb_article_ratings TYPE bool;
            DEFINE FIELD feedback ON kb_article_ratings TYPE option<string>;
            DEFINE FIELD created_at ON kb_article_ratings TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        println!("✅ Knowledge Base tables created successfully");
        Ok(())
    }

    /// Create indexes for Knowledge Base tables
    async fn create_kb_indexes(db: &Database) -> Result<()> {
        // Category indexes
        db.query("DEFINE INDEX idx_kb_cat_slug ON kb_categories FIELDS slug UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_kb_cat_parent ON kb_categories FIELDS parent_id;")
            .await?;
        db.query("DEFINE INDEX idx_kb_cat_active ON kb_categories FIELDS is_active;")
            .await?;

        // Article indexes
        db.query("DEFINE INDEX idx_kb_art_slug ON kb_articles FIELDS slug UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_kb_art_status ON kb_articles FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_kb_art_visibility ON kb_articles FIELDS visibility;")
            .await?;
        db.query("DEFINE INDEX idx_kb_art_category ON kb_articles FIELDS category_id;")
            .await?;
        db.query("DEFINE INDEX idx_kb_art_author ON kb_articles FIELDS author_id;")
            .await?;
        db.query("DEFINE INDEX idx_kb_art_tenant ON kb_articles FIELDS tenant_id;")
            .await?;

        // Version indexes
        db.query("DEFINE INDEX idx_kb_ver_article ON kb_article_versions FIELDS article_id;")
            .await?;

        // Rating indexes
        db.query("DEFINE INDEX idx_kb_rating_article ON kb_article_ratings FIELDS article_id;")
            .await?;
        db.query("DEFINE INDEX idx_kb_rating_user ON kb_article_ratings FIELDS user_id;")
            .await?;

        println!("✅ Knowledge Base indexes created successfully");
        Ok(())
    }

    /// Seed default categories
    async fn seed_default_categories(db: &Database) -> Result<()> {
        let categories = vec![
            ("getting-started", "Getting Started", "Onboarding and initial setup guides", 1),
            ("how-to", "How-To Guides", "Step-by-step instructions for common tasks", 2),
            ("troubleshooting", "Troubleshooting", "Solutions to common problems", 3),
            ("faq", "FAQ", "Frequently Asked Questions", 4),
            ("release-notes", "Release Notes", "Product updates and changes", 5),
            ("policies", "Policies & Procedures", "Company policies and SOPs", 6),
        ];

        for (slug, name, description, order) in categories {
            let query = format!(
                r#"
                CREATE kb_categories:{} SET
                    name = '{}',
                    slug = '{}',
                    description = '{}',
                    display_order = {},
                    is_active = true
                "#,
                slug, name, slug, description, order
            );
            let _ = db.query(&query).await;
        }

        println!("✅ Default KB categories seeded");
        Ok(())
    }
}

// ============================================================================
// PHASE 2: CMDB MIGRATIONS
// ============================================================================

/// Database migrations for CMDB (Phase 2)
pub struct CMDBMigrations;

impl CMDBMigrations {
    /// Run all CMDB migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_cmdb_tables(db).await?;
        Self::create_cmdb_indexes(db).await?;
        Ok(())
    }

    /// Create tables for CMDB
    async fn create_cmdb_tables(db: &Database) -> Result<()> {
        // Configuration Items table
        db.query(
            r#"
            DEFINE TABLE configuration_items SCHEMAFULL;
            DEFINE FIELD ci_id ON configuration_items TYPE string;
            DEFINE FIELD name ON configuration_items TYPE string;
            DEFINE FIELD description ON configuration_items TYPE option<string>;
            DEFINE FIELD ci_class ON configuration_items TYPE string;
            DEFINE FIELD ci_type ON configuration_items TYPE string;
            DEFINE FIELD status ON configuration_items TYPE string DEFAULT 'ACTIVE';
            DEFINE FIELD criticality ON configuration_items TYPE string DEFAULT 'MEDIUM';
            DEFINE FIELD environment ON configuration_items TYPE option<string>;
            DEFINE FIELD location ON configuration_items TYPE option<string>;
            DEFINE FIELD owner_id ON configuration_items TYPE option<string>;
            DEFINE FIELD owner_name ON configuration_items TYPE option<string>;
            DEFINE FIELD support_group ON configuration_items TYPE option<string>;
            DEFINE FIELD vendor ON configuration_items TYPE option<string>;
            DEFINE FIELD model ON configuration_items TYPE option<string>;
            DEFINE FIELD serial_number ON configuration_items TYPE option<string>;
            DEFINE FIELD version ON configuration_items TYPE option<string>;
            DEFINE FIELD ip_address ON configuration_items TYPE option<string>;
            DEFINE FIELD fqdn ON configuration_items TYPE option<string>;
            DEFINE FIELD attributes ON configuration_items TYPE option<object>;
            DEFINE FIELD discovery_source ON configuration_items TYPE string DEFAULT 'MANUAL';
            DEFINE FIELD discovery_id ON configuration_items TYPE option<string>;
            DEFINE FIELD last_discovered ON configuration_items TYPE option<datetime>;
            DEFINE FIELD install_date ON configuration_items TYPE option<datetime>;
            DEFINE FIELD warranty_expiry ON configuration_items TYPE option<datetime>;
            DEFINE FIELD end_of_life ON configuration_items TYPE option<datetime>;
            DEFINE FIELD decommission_date ON configuration_items TYPE option<datetime>;
            DEFINE FIELD tags ON configuration_items TYPE array DEFAULT [];
            DEFINE FIELD tenant_id ON configuration_items TYPE option<record(tenants)>;
            DEFINE FIELD created_at ON configuration_items TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON configuration_items TYPE datetime DEFAULT time::now();
            DEFINE FIELD created_by ON configuration_items TYPE string;
            DEFINE FIELD updated_by ON configuration_items TYPE string;
            "#,
        )
        .await?;

        // CI Relationships table (graph edges)
        db.query(
            r#"
            DEFINE TABLE ci_relationships SCHEMAFULL;
            DEFINE FIELD source_id ON ci_relationships TYPE record(configuration_items);
            DEFINE FIELD target_id ON ci_relationships TYPE record(configuration_items);
            DEFINE FIELD relationship_type ON ci_relationships TYPE string;
            DEFINE FIELD direction ON ci_relationships TYPE string DEFAULT 'OUTBOUND';
            DEFINE FIELD description ON ci_relationships TYPE option<string>;
            DEFINE FIELD is_active ON ci_relationships TYPE bool DEFAULT true;
            DEFINE FIELD discovery_source ON ci_relationships TYPE string DEFAULT 'MANUAL';
            DEFINE FIELD created_at ON ci_relationships TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON ci_relationships TYPE datetime DEFAULT time::now();
            DEFINE FIELD created_by ON ci_relationships TYPE string;
            "#,
        )
        .await?;

        // CI History table
        db.query(
            r#"
            DEFINE TABLE ci_history SCHEMAFULL;
            DEFINE FIELD ci_id ON ci_history TYPE record(configuration_items);
            DEFINE FIELD change_type ON ci_history TYPE string;
            DEFINE FIELD field_name ON ci_history TYPE option<string>;
            DEFINE FIELD old_value ON ci_history TYPE option<string>;
            DEFINE FIELD new_value ON ci_history TYPE option<string>;
            DEFINE FIELD change_reason ON ci_history TYPE option<string>;
            DEFINE FIELD changed_by ON ci_history TYPE string;
            DEFINE FIELD changed_by_name ON ci_history TYPE string;
            DEFINE FIELD created_at ON ci_history TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        println!("✅ CMDB tables created successfully");
        Ok(())
    }

    /// Create indexes for CMDB tables
    async fn create_cmdb_indexes(db: &Database) -> Result<()> {
        // CI indexes
        db.query("DEFINE INDEX idx_ci_id ON configuration_items FIELDS ci_id UNIQUE;")
            .await?;
        db.query("DEFINE INDEX idx_ci_name ON configuration_items FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_ci_class ON configuration_items FIELDS ci_class;")
            .await?;
        db.query("DEFINE INDEX idx_ci_type ON configuration_items FIELDS ci_type;")
            .await?;
        db.query("DEFINE INDEX idx_ci_status ON configuration_items FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_ci_criticality ON configuration_items FIELDS criticality;")
            .await?;
        db.query("DEFINE INDEX idx_ci_environment ON configuration_items FIELDS environment;")
            .await?;
        db.query("DEFINE INDEX idx_ci_owner ON configuration_items FIELDS owner_id;")
            .await?;
        db.query("DEFINE INDEX idx_ci_support_group ON configuration_items FIELDS support_group;")
            .await?;
        db.query("DEFINE INDEX idx_ci_tenant ON configuration_items FIELDS tenant_id;")
            .await?;
        db.query("DEFINE INDEX idx_ci_ip ON configuration_items FIELDS ip_address;")
            .await?;
        db.query("DEFINE INDEX idx_ci_serial ON configuration_items FIELDS serial_number;")
            .await?;

        // Relationship indexes
        db.query("DEFINE INDEX idx_rel_source ON ci_relationships FIELDS source_id;")
            .await?;
        db.query("DEFINE INDEX idx_rel_target ON ci_relationships FIELDS target_id;")
            .await?;
        db.query("DEFINE INDEX idx_rel_type ON ci_relationships FIELDS relationship_type;")
            .await?;
        db.query("DEFINE INDEX idx_rel_active ON ci_relationships FIELDS is_active;")
            .await?;

        // History indexes
        db.query("DEFINE INDEX idx_ci_hist_ci ON ci_history FIELDS ci_id;")
            .await?;
        db.query("DEFINE INDEX idx_ci_hist_created ON ci_history FIELDS created_at;")
            .await?;

        println!("✅ CMDB indexes created successfully");
        Ok(())
    }
}

// ============================================================================
// SERVICE CATALOG MIGRATIONS (Phase 5)
// ============================================================================

/// Service Catalog database migrations
pub struct ServiceCatalogMigrations;

impl ServiceCatalogMigrations {
    /// Run all service catalog migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_service_catalog_tables(db).await?;
        Self::create_service_catalog_indexes(db).await?;
        Self::seed_sample_categories_and_items(db).await?;
        Ok(())
    }

    /// Create tables for service catalog
    async fn create_service_catalog_tables(db: &Database) -> Result<()> {
        // Catalog Categories table
        db.query(
            r#"
            DEFINE TABLE catalog_category SCHEMAFULL;
            DEFINE FIELD name ON catalog_category TYPE string;
            DEFINE FIELD description ON catalog_category TYPE option<string>;
            DEFINE FIELD icon ON catalog_category TYPE option<string>;
            DEFINE FIELD parent_id ON catalog_category TYPE option<record(catalog_category)>;
            DEFINE FIELD sort_order ON catalog_category TYPE int DEFAULT 0;
            DEFINE FIELD is_active ON catalog_category TYPE bool DEFAULT true;
            DEFINE FIELD created_at ON catalog_category TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON catalog_category TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Catalog Items table
        db.query(
            r#"
            DEFINE TABLE catalog_item SCHEMAFULL;
            DEFINE FIELD name ON catalog_item TYPE string;
            DEFINE FIELD description ON catalog_item TYPE string;
            DEFINE FIELD category_id ON catalog_item TYPE record(catalog_category);
            DEFINE FIELD icon ON catalog_item TYPE option<string>;
            DEFINE FIELD short_description ON catalog_item TYPE string;
            DEFINE FIELD delivery_time_days ON catalog_item TYPE option<int>;
            DEFINE FIELD cost ON catalog_item TYPE option<float>;
            DEFINE FIELD is_active ON catalog_item TYPE bool DEFAULT true;
            DEFINE FIELD form_schema ON catalog_item TYPE object;
            DEFINE FIELD approval_required ON catalog_item TYPE bool DEFAULT false;
            DEFINE FIELD approval_group ON catalog_item TYPE option<string>;
            DEFINE FIELD fulfillment_group ON catalog_item TYPE option<string>;
            DEFINE FIELD created_at ON catalog_item TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON catalog_item TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Service Requests table
        db.query(
            r#"
            DEFINE TABLE service_request SCHEMAFULL;
            DEFINE FIELD catalog_item_id ON service_request TYPE record(catalog_item);
            DEFINE FIELD requester_id ON service_request TYPE string;
            DEFINE FIELD form_data ON service_request TYPE object;
            DEFINE FIELD status ON service_request TYPE string DEFAULT 'DRAFT';
            DEFINE FIELD approval_status ON service_request TYPE option<string>;
            DEFINE FIELD approved_by ON service_request TYPE option<string>;
            DEFINE FIELD approved_at ON service_request TYPE option<datetime>;
            DEFINE FIELD assigned_to ON service_request TYPE option<string>;
            DEFINE FIELD created_at ON service_request TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON service_request TYPE datetime DEFAULT time::now();
            DEFINE FIELD completed_at ON service_request TYPE option<datetime>;
            DEFINE FIELD rejection_reason ON service_request TYPE option<string>;
            "#,
        )
        .await?;

        println!("✅ Service catalog tables created successfully");
        Ok(())
    }

    /// Create indexes for service catalog
    async fn create_service_catalog_indexes(db: &Database) -> Result<()> {
        // Category indexes
        db.query("DEFINE INDEX idx_category_name ON catalog_category FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_category_parent ON catalog_category FIELDS parent_id;")
            .await?;
        db.query("DEFINE INDEX idx_category_active ON catalog_category FIELDS is_active;")
            .await?;
        db.query("DEFINE INDEX idx_category_sort ON catalog_category FIELDS sort_order;")
            .await?;

        // Catalog item indexes
        db.query("DEFINE INDEX idx_item_name ON catalog_item FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_item_category ON catalog_item FIELDS category_id;")
            .await?;
        db.query("DEFINE INDEX idx_item_active ON catalog_item FIELDS is_active;")
            .await?;

        // Service request indexes
        db.query("DEFINE INDEX idx_request_catalog_item ON service_request FIELDS catalog_item_id;")
            .await?;
        db.query("DEFINE INDEX idx_request_requester ON service_request FIELDS requester_id;")
            .await?;
        db.query("DEFINE INDEX idx_request_status ON service_request FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_request_approval ON service_request FIELDS approval_status;")
            .await?;
        db.query("DEFINE INDEX idx_request_assigned ON service_request FIELDS assigned_to;")
            .await?;

        println!("✅ Service catalog indexes created successfully");
        Ok(())
    }

    /// Seed sample categories and catalog items
    async fn seed_sample_categories_and_items(db: &Database) -> Result<()> {
        // Create sample categories
        let hardware_category: Vec<serde_json::Value> = db
            .create("catalog_category")
            .content(json!({
                "name": "Hardware",
                "description": "Hardware equipment requests",
                "icon": "Laptop",
                "sort_order": 1,
                "is_active": true
            }))
            .await?;

        let software_category: Vec<serde_json::Value> = db
            .create("catalog_category")
            .content(json!({
                "name": "Software",
                "description": "Software licenses and applications",
                "icon": "Apps",
                "sort_order": 2,
                "is_active": true
            }))
            .await?;

        let access_category: Vec<serde_json::Value> = db
            .create("catalog_category")
            .content(json!({
                "name": "Access & Permissions",
                "description": "Request access to systems and resources",
                "icon": "LockClosed",
                "sort_order": 3,
                "is_active": true
            }))
            .await?;

        // Extract IDs from created categories
        let hardware_id = hardware_category.first().and_then(|c| c.get("id"));
        let software_id = software_category.first().and_then(|c| c.get("id"));
        let access_id = access_category.first().and_then(|c| c.get("id"));

        // Create sample catalog items if categories were created
        if let Some(hw_id) = hardware_id {
            let _: Vec<serde_json::Value> = db
                .create("catalog_item")
                .content(json!({
                    "name": "New Laptop",
                    "short_description": "Request a new laptop for work",
                    "description": "Standard company laptop with pre-installed software and security configurations",
                    "category_id": hw_id,
                    "icon": "Laptop",
                    "delivery_time_days": 5,
                    "cost": 1200.00,
                    "is_active": true,
                    "approval_required": true,
                    "approval_group": "IT_MANAGERS",
                    "fulfillment_group": "IT_SUPPORT",
                    "form_schema": {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "type": "object",
                        "properties": {
                            "laptop_type": {
                                "type": "string",
                                "title": "Laptop Type",
                                "enum": ["Standard", "Developer", "Designer"],
                                "default": "Standard"
                            },
                            "operating_system": {
                                "type": "string",
                                "title": "Operating System",
                                "enum": ["Windows 11", "macOS", "Ubuntu Linux"]
                            },
                            "justification": {
                                "type": "string",
                                "title": "Business Justification",
                                "minLength": 20
                            }
                        },
                        "required": ["laptop_type", "operating_system", "justification"]
                    }
                }))
                .await?;
        }

        if let Some(sw_id) = software_id {
            let _: Vec<serde_json::Value> = db
                .create("catalog_item")
                .content(json!({
                    "name": "Software License",
                    "short_description": "Request a software license",
                    "description": "Request access to commercial software applications",
                    "category_id": sw_id,
                    "icon": "Certificate",
                    "delivery_time_days": 2,
                    "cost": 299.00,
                    "is_active": true,
                    "approval_required": true,
                    "approval_group": "IT_MANAGERS",
                    "fulfillment_group": "IT_SUPPORT",
                    "form_schema": {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "type": "object",
                        "properties": {
                            "software_name": {
                                "type": "string",
                                "title": "Software Name"
                            },
                            "license_type": {
                                "type": "string",
                                "title": "License Type",
                                "enum": ["Standard", "Professional", "Enterprise"]
                            },
                            "business_need": {
                                "type": "string",
                                "title": "Business Need",
                                "minLength": 20
                            }
                        },
                        "required": ["software_name", "license_type", "business_need"]
                    }
                }))
                .await?;
        }

        if let Some(acc_id) = access_id {
            let _: Vec<serde_json::Value> = db
                .create("catalog_item")
                .content(json!({
                    "name": "VPN Access",
                    "short_description": "Request VPN access for remote work",
                    "description": "Secure VPN access to company network for remote workers",
                    "category_id": acc_id,
                    "icon": "Shield",
                    "delivery_time_days": 1,
                    "is_active": true,
                    "approval_required": true,
                    "approval_group": "SECURITY_TEAM",
                    "fulfillment_group": "IT_SUPPORT",
                    "form_schema": {
                        "$schema": "http://json-schema.org/draft-07/schema#",
                        "type": "object",
                        "properties": {
                            "access_duration": {
                                "type": "string",
                                "title": "Access Duration",
                                "enum": ["Temporary (30 days)", "Permanent"]
                            },
                            "remote_location": {
                                "type": "string",
                                "title": "Primary Remote Location"
                            },
                            "manager_approval": {
                                "type": "string",
                                "title": "Manager's Email"
                            }
                        },
                        "required": ["access_duration", "remote_location", "manager_approval"]
                    }
                }))
                .await?;
        }

        println!("✅ Sample service catalog data seeded");
        Ok(())
    }
}

// ============================================================================
// PHASE 3: WORKFLOW ENGINE MIGRATIONS
// ============================================================================

/// Database migrations for workflow engine (Phase 3)
pub struct WorkflowMigrations;

impl WorkflowMigrations {
    /// Run all workflow system migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_workflow_tables(db).await?;
        Self::create_workflow_indexes(db).await?;
        Ok(())
    }

    /// Create tables for workflow functionality
    async fn create_workflow_tables(db: &Database) -> Result<()> {
        // Workflow Definition table
        db.query(
            r#"
            DEFINE TABLE workflow_definition SCHEMAFULL;
            DEFINE FIELD name ON workflow_definition TYPE string;
            DEFINE FIELD description ON workflow_definition TYPE option<string>;
            DEFINE FIELD trigger_type ON workflow_definition TYPE string;
            DEFINE FIELD trigger_conditions ON workflow_definition TYPE object;
            DEFINE FIELD steps ON workflow_definition TYPE array;
            DEFINE FIELD is_active ON workflow_definition TYPE bool DEFAULT true;
            DEFINE FIELD created_by ON workflow_definition TYPE string;
            DEFINE FIELD created_at ON workflow_definition TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON workflow_definition TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        // Workflow Instance table
        db.query(
            r#"
            DEFINE TABLE workflow_instance SCHEMAFULL;
            DEFINE FIELD workflow_id ON workflow_instance TYPE record(workflow_definition);
            DEFINE FIELD trigger_record_type ON workflow_instance TYPE string;
            DEFINE FIELD trigger_record_id ON workflow_instance TYPE record;
            DEFINE FIELD status ON workflow_instance TYPE string DEFAULT 'RUNNING';
            DEFINE FIELD current_step_id ON workflow_instance TYPE option<string>;
            DEFINE FIELD step_history ON workflow_instance TYPE array DEFAULT [];
            DEFINE FIELD started_at ON workflow_instance TYPE datetime DEFAULT time::now();
            DEFINE FIELD completed_at ON workflow_instance TYPE option<datetime>;
            DEFINE FIELD context ON workflow_instance TYPE object DEFAULT {};
            "#,
        )
        .await?;

        // Approval table
        db.query(
            r#"
            DEFINE TABLE approval SCHEMAFULL;
            DEFINE FIELD workflow_instance_id ON approval TYPE record(workflow_instance);
            DEFINE FIELD step_id ON approval TYPE string;
            DEFINE FIELD approver_id ON approval TYPE record;
            DEFINE FIELD approver_type ON approval TYPE string DEFAULT 'USER';
            DEFINE FIELD status ON approval TYPE string DEFAULT 'PENDING';
            DEFINE FIELD requested_at ON approval TYPE datetime DEFAULT time::now();
            DEFINE FIELD responded_at ON approval TYPE option<datetime>;
            DEFINE FIELD comments ON approval TYPE option<string>;
            "#,
        )
        .await?;

        println!("✅ Workflow tables created successfully");
        Ok(())
    }

    /// Create indexes for workflow performance
    async fn create_workflow_indexes(db: &Database) -> Result<()> {
        // Workflow definition indexes
        db.query("DEFINE INDEX idx_workflow_name ON workflow_definition FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_workflow_active ON workflow_definition FIELDS is_active;")
            .await?;
        db.query("DEFINE INDEX idx_workflow_trigger ON workflow_definition FIELDS trigger_type;")
            .await?;

        // Workflow instance indexes
        db.query("DEFINE INDEX idx_instance_workflow ON workflow_instance FIELDS workflow_id;")
            .await?;
        db.query("DEFINE INDEX idx_instance_status ON workflow_instance FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_instance_trigger ON workflow_instance FIELDS trigger_record_id;")
            .await?;
        db.query("DEFINE INDEX idx_instance_started ON workflow_instance FIELDS started_at;")
            .await?;

        // Approval indexes
        db.query("DEFINE INDEX idx_approval_instance ON approval FIELDS workflow_instance_id;")
            .await?;
        db.query("DEFINE INDEX idx_approval_approver ON approval FIELDS approver_id;")
            .await?;
        db.query("DEFINE INDEX idx_approval_status ON approval FIELDS status;")
            .await?;
        db.query("DEFINE INDEX idx_approval_requested ON approval FIELDS requested_at;")
            .await?;

        println!("✅ Workflow indexes created successfully");
        Ok(())
    }
}

// ============================================================================
// TEAM MANAGEMENT MIGRATIONS
// ============================================================================

/// Database migrations for team management
pub struct TeamMigrations;

impl TeamMigrations {
    /// Run all team management migrations
    pub async fn run_all(db: &Database) -> Result<()> {
        Self::create_team_tables(db).await?;
        Self::create_team_indexes(db).await?;
        Ok(())
    }

    /// Create tables for team management
    async fn create_team_tables(db: &Database) -> Result<()> {
        println!("📁 Creating team management tables...");

        // Teams table
        db.query(
            r#"
            DEFINE TABLE teams SCHEMAFULL;
            DEFINE FIELD name ON teams TYPE string;
            DEFINE FIELD description ON teams TYPE option<string>;
            DEFINE FIELD team_lead_id ON teams TYPE option<record(users)>;
            DEFINE FIELD parent_team_id ON teams TYPE option<record(teams)>;
            DEFINE FIELD email_alias ON teams TYPE option<string>;
            DEFINE FIELD is_active ON teams TYPE bool DEFAULT true;
            DEFINE FIELD created_at ON teams TYPE datetime DEFAULT time::now();
            DEFINE FIELD updated_at ON teams TYPE datetime DEFAULT time::now();
            DEFINE FIELD created_by ON teams TYPE option<string>;
            DEFINE FIELD tenant_id ON teams TYPE option<record(tenants)>;
            "#,
        )
        .await?;

        // Team Memberships table (many-to-many relationship)
        db.query(
            r#"
            DEFINE TABLE team_memberships SCHEMAFULL;
            DEFINE FIELD team_id ON team_memberships TYPE record(teams);
            DEFINE FIELD user_id ON team_memberships TYPE record(users);
            DEFINE FIELD role ON team_memberships TYPE string;
            DEFINE FIELD joined_at ON team_memberships TYPE datetime DEFAULT time::now();
            "#,
        )
        .await?;

        println!("✅ Team management tables created successfully");
        Ok(())
    }

    /// Create indexes for team management
    async fn create_team_indexes(db: &Database) -> Result<()> {
        println!("🔍 Creating team management indexes...");

        // Team indexes
        db.query("DEFINE INDEX idx_teams_name ON teams FIELDS name;")
            .await?;
        db.query("DEFINE INDEX idx_teams_lead ON teams FIELDS team_lead_id;")
            .await?;
        db.query("DEFINE INDEX idx_teams_parent ON teams FIELDS parent_team_id;")
            .await?;
        db.query("DEFINE INDEX idx_teams_active ON teams FIELDS is_active;")
            .await?;
        db.query("DEFINE INDEX idx_teams_tenant ON teams FIELDS tenant_id;")
            .await?;

        // Team membership indexes
        db.query("DEFINE INDEX idx_membership_team ON team_memberships FIELDS team_id;")
            .await?;
        db.query("DEFINE INDEX idx_membership_user ON team_memberships FIELDS user_id;")
            .await?;
        db.query("DEFINE INDEX idx_membership_role ON team_memberships FIELDS role;")
            .await?;

        // Unique constraint: user can only have one membership per team
        db.query("DEFINE INDEX idx_membership_unique ON team_memberships FIELDS team_id, user_id UNIQUE;")
            .await?;

        println!("✅ Team management indexes created successfully");
        Ok(())
    }
}