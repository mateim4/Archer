-- ============================================================================
-- Archer - Monitoring Infrastructure Schema
-- Splunk + Nagios
-- ============================================================================

-- ============================================================================
-- SPLUNK - DEPLOYMENT SERVER
-- ============================================================================

DEFINE TABLE splunk_deployment_server SCHEMAFULL;

DEFINE FIELD name ON splunk_deployment_server TYPE string;
DEFINE FIELD hostname ON splunk_deployment_server TYPE string;
DEFINE FIELD ip_address ON splunk_deployment_server TYPE string;
DEFINE FIELD version ON splunk_deployment_server TYPE string;
DEFINE FIELD license_type ON splunk_deployment_server TYPE string; -- enterprise, free
DEFINE FIELD role ON splunk_deployment_server TYPE string DEFAULT "deployment-server"; -- search-head, indexer, deployment-server, cluster-master
DEFINE FIELD mgmt_port ON splunk_deployment_server TYPE int DEFAULT 8089;
DEFINE FIELD web_port ON splunk_deployment_server TYPE int DEFAULT 8000;
DEFINE FIELD client_count ON splunk_deployment_server TYPE int DEFAULT 0;
DEFINE FIELD server_classes ON splunk_deployment_server TYPE array<string> DEFAULT [];

-- CMDB Reference
DEFINE FIELD cmdb_asset ON splunk_deployment_server TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON splunk_deployment_server TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_deployment_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_deployment_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_ds_name ON splunk_deployment_server FIELDS name;
DEFINE INDEX idx_splunk_ds_hostname ON splunk_deployment_server FIELDS hostname;

-- ============================================================================
-- SPLUNK - SEARCH HEAD
-- ============================================================================

DEFINE TABLE splunk_search_head SCHEMAFULL;

DEFINE FIELD name ON splunk_search_head TYPE string;
DEFINE FIELD hostname ON splunk_search_head TYPE string;
DEFINE FIELD ip_address ON splunk_search_head TYPE string;
DEFINE FIELD version ON splunk_search_head TYPE string;
DEFINE FIELD cluster ON splunk_search_head TYPE option<record<splunk_shc>>;
DEFINE FIELD is_captain ON splunk_search_head TYPE bool DEFAULT false;
DEFINE FIELD mgmt_port ON splunk_search_head TYPE int DEFAULT 8089;
DEFINE FIELD web_port ON splunk_search_head TYPE int DEFAULT 8000;

-- Connected Indexers
DEFINE FIELD indexer_cluster ON splunk_search_head TYPE option<record<splunk_indexer_cluster>>;
DEFINE FIELD connected_indexers ON splunk_search_head TYPE array<record<splunk_indexer>> DEFAULT [];

-- Resources
DEFINE FIELD cpu_cores ON splunk_search_head TYPE option<int>;
DEFINE FIELD memory_gb ON splunk_search_head TYPE option<int>;
DEFINE FIELD concurrent_searches_limit ON splunk_search_head TYPE int DEFAULT 10;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON splunk_search_head TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON splunk_search_head TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_search_head TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_search_head TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_sh_name ON splunk_search_head FIELDS name;
DEFINE INDEX idx_splunk_sh_hostname ON splunk_search_head FIELDS hostname;
DEFINE INDEX idx_splunk_sh_cluster ON splunk_search_head FIELDS cluster;

-- ============================================================================
-- SPLUNK - SEARCH HEAD CLUSTER
-- ============================================================================

DEFINE TABLE splunk_shc SCHEMAFULL;

DEFINE FIELD name ON splunk_shc TYPE string;
DEFINE FIELD label ON splunk_shc TYPE string;
DEFINE FIELD replication_factor ON splunk_shc TYPE int DEFAULT 3;
DEFINE FIELD conf_deploy_fetch_url ON splunk_shc TYPE option<string>;
DEFINE FIELD captain ON splunk_shc TYPE option<record<splunk_search_head>>;
DEFINE FIELD member_count ON splunk_shc TYPE int DEFAULT 0;
DEFINE FIELD deployer ON splunk_shc TYPE option<record<splunk_deployment_server>>;

-- Audit
DEFINE FIELD status ON splunk_shc TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_shc TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_shc TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_shc_name ON splunk_shc FIELDS name;

-- ============================================================================
-- SPLUNK - INDEXER
-- ============================================================================

DEFINE TABLE splunk_indexer SCHEMAFULL;

DEFINE FIELD name ON splunk_indexer TYPE string;
DEFINE FIELD hostname ON splunk_indexer TYPE string;
DEFINE FIELD ip_address ON splunk_indexer TYPE string;
DEFINE FIELD version ON splunk_indexer TYPE string;
DEFINE FIELD cluster ON splunk_indexer TYPE option<record<splunk_indexer_cluster>>;
DEFINE FIELD site ON splunk_indexer TYPE string DEFAULT "site1"; -- For multisite clustering
DEFINE FIELD receiving_port ON splunk_indexer TYPE int DEFAULT 9997;
DEFINE FIELD mgmt_port ON splunk_indexer TYPE int DEFAULT 8089;

-- Storage
DEFINE FIELD hot_path ON splunk_indexer TYPE option<string>;
DEFINE FIELD cold_path ON splunk_indexer TYPE option<string>;
DEFINE FIELD frozen_path ON splunk_indexer TYPE option<string>;
DEFINE FIELD storage_used_gb ON splunk_indexer TYPE option<float>;
DEFINE FIELD storage_total_gb ON splunk_indexer TYPE option<float>;
DEFINE FIELD daily_ingest_gb ON splunk_indexer TYPE option<float>;

-- Resources
DEFINE FIELD cpu_cores ON splunk_indexer TYPE option<int>;
DEFINE FIELD memory_gb ON splunk_indexer TYPE option<int>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON splunk_indexer TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON splunk_indexer TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_indexer TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_indexer TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_idx_name ON splunk_indexer FIELDS name;
DEFINE INDEX idx_splunk_idx_hostname ON splunk_indexer FIELDS hostname;
DEFINE INDEX idx_splunk_idx_cluster ON splunk_indexer FIELDS cluster;

-- ============================================================================
-- SPLUNK - INDEXER CLUSTER
-- ============================================================================

DEFINE TABLE splunk_indexer_cluster SCHEMAFULL;

DEFINE FIELD name ON splunk_indexer_cluster TYPE string;
DEFINE FIELD label ON splunk_indexer_cluster TYPE string;
DEFINE FIELD cluster_master ON splunk_indexer_cluster TYPE option<record<splunk_cluster_master>>;
DEFINE FIELD replication_factor ON splunk_indexer_cluster TYPE int DEFAULT 3;
DEFINE FIELD search_factor ON splunk_indexer_cluster TYPE int DEFAULT 2;
DEFINE FIELD multisite ON splunk_indexer_cluster TYPE bool DEFAULT false;
DEFINE FIELD sites ON splunk_indexer_cluster TYPE array<string> DEFAULT ["site1"];
DEFINE FIELD site_replication_factor ON splunk_indexer_cluster TYPE option<string>; -- e.g., "origin:2,total:3"
DEFINE FIELD site_search_factor ON splunk_indexer_cluster TYPE option<string>;
DEFINE FIELD indexer_count ON splunk_indexer_cluster TYPE int DEFAULT 0;

-- Audit
DEFINE FIELD status ON splunk_indexer_cluster TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_indexer_cluster TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_indexer_cluster TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_ic_name ON splunk_indexer_cluster FIELDS name;

-- ============================================================================
-- SPLUNK - CLUSTER MASTER (Manager)
-- ============================================================================

DEFINE TABLE splunk_cluster_master SCHEMAFULL;

DEFINE FIELD name ON splunk_cluster_master TYPE string;
DEFINE FIELD hostname ON splunk_cluster_master TYPE string;
DEFINE FIELD ip_address ON splunk_cluster_master TYPE string;
DEFINE FIELD version ON splunk_cluster_master TYPE string;
DEFINE FIELD mgmt_port ON splunk_cluster_master TYPE int DEFAULT 8089;
DEFINE FIELD web_port ON splunk_cluster_master TYPE int DEFAULT 8000;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON splunk_cluster_master TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON splunk_cluster_master TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_cluster_master TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_cluster_master TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_cm_name ON splunk_cluster_master FIELDS name;
DEFINE INDEX idx_splunk_cm_hostname ON splunk_cluster_master FIELDS hostname;

-- ============================================================================
-- SPLUNK - FORWARDER
-- ============================================================================

DEFINE TABLE splunk_forwarder SCHEMAFULL;

DEFINE FIELD name ON splunk_forwarder TYPE string;
DEFINE FIELD hostname ON splunk_forwarder TYPE string;
DEFINE FIELD ip_address ON splunk_forwarder TYPE string;
DEFINE FIELD version ON splunk_forwarder TYPE string;
DEFINE FIELD forwarder_type ON splunk_forwarder TYPE string; -- universal, heavy
DEFINE FIELD deployment_server ON splunk_forwarder TYPE option<record<splunk_deployment_server>>;
DEFINE FIELD server_classes ON splunk_forwarder TYPE array<string> DEFAULT [];

-- Data Sources
DEFINE FIELD inputs ON splunk_forwarder TYPE array<object> DEFAULT [];
DEFINE FIELD outputs ON splunk_forwarder TYPE array<string> DEFAULT []; -- Indexer targets

-- The host/asset this forwarder runs on
DEFINE FIELD installed_on ON splunk_forwarder TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON splunk_forwarder TYPE string DEFAULT "active";
DEFINE FIELD last_phone_home ON splunk_forwarder TYPE option<datetime>;
DEFINE FIELD created_at ON splunk_forwarder TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_forwarder TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_fwd_name ON splunk_forwarder FIELDS name;
DEFINE INDEX idx_splunk_fwd_hostname ON splunk_forwarder FIELDS hostname;
DEFINE INDEX idx_splunk_fwd_ds ON splunk_forwarder FIELDS deployment_server;

-- ============================================================================
-- SPLUNK - INDEX
-- ============================================================================

DEFINE TABLE splunk_index SCHEMAFULL;

DEFINE FIELD name ON splunk_index TYPE string;
DEFINE FIELD datatype ON splunk_index TYPE string DEFAULT "event"; -- event, metric
DEFINE FIELD indexer_cluster ON splunk_index TYPE option<record<splunk_indexer_cluster>>;
DEFINE FIELD max_data_size ON splunk_index TYPE string DEFAULT "auto_high_volume";
DEFINE FIELD retention_days ON splunk_index TYPE int DEFAULT 90;
DEFINE FIELD frozen_time_period_in_secs ON splunk_index TYPE int DEFAULT 7776000; -- 90 days
DEFINE FIELD current_size_gb ON splunk_index TYPE option<float>;
DEFINE FIELD event_count ON splunk_index TYPE option<int>;
DEFINE FIELD description ON splunk_index TYPE option<string>;

-- Audit
DEFINE FIELD status ON splunk_index TYPE string DEFAULT "active";
DEFINE FIELD created_at ON splunk_index TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON splunk_index TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_splunk_index_name ON splunk_index FIELDS name UNIQUE;

-- ============================================================================
-- NAGIOS - CORE SERVER
-- ============================================================================

DEFINE TABLE nagios_server SCHEMAFULL;

DEFINE FIELD name ON nagios_server TYPE string;
DEFINE FIELD hostname ON nagios_server TYPE string;
DEFINE FIELD ip_address ON nagios_server TYPE string;
DEFINE FIELD version ON nagios_server TYPE string;
DEFINE FIELD edition ON nagios_server TYPE string DEFAULT "core"; -- core, xi
DEFINE FIELD web_url ON nagios_server TYPE option<string>;
DEFINE FIELD config_dir ON nagios_server TYPE string DEFAULT "/etc/nagios";
DEFINE FIELD plugin_dir ON nagios_server TYPE string DEFAULT "/usr/lib64/nagios/plugins";

-- Statistics
DEFINE FIELD host_count ON nagios_server TYPE int DEFAULT 0;
DEFINE FIELD service_count ON nagios_server TYPE int DEFAULT 0;
DEFINE FIELD host_groups_count ON nagios_server TYPE int DEFAULT 0;
DEFINE FIELD contact_count ON nagios_server TYPE int DEFAULT 0;

-- Performance
DEFINE FIELD check_result_reaper_frequency ON nagios_server TYPE int DEFAULT 10;
DEFINE FIELD max_concurrent_checks ON nagios_server TYPE int DEFAULT 0;
DEFINE FIELD check_interval ON nagios_server TYPE int DEFAULT 5;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON nagios_server TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON nagios_server TYPE string DEFAULT "active";
DEFINE FIELD last_config_check ON nagios_server TYPE option<datetime>;
DEFINE FIELD created_at ON nagios_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_srv_name ON nagios_server FIELDS name;
DEFINE INDEX idx_nagios_srv_hostname ON nagios_server FIELDS hostname;

-- ============================================================================
-- NAGIOS - MONITORED HOST
-- ============================================================================

DEFINE TABLE nagios_host SCHEMAFULL;

DEFINE FIELD nagios_server ON nagios_host TYPE record<nagios_server>;
DEFINE FIELD name ON nagios_host TYPE string;
DEFINE FIELD alias ON nagios_host TYPE option<string>;
DEFINE FIELD address ON nagios_host TYPE string;
DEFINE FIELD display_name ON nagios_host TYPE option<string>;

-- Templates and Groups
DEFINE FIELD use_template ON nagios_host TYPE option<string>;
DEFINE FIELD hostgroups ON nagios_host TYPE array<string> DEFAULT [];
DEFINE FIELD contacts ON nagios_host TYPE array<string> DEFAULT [];
DEFINE FIELD contact_groups ON nagios_host TYPE array<string> DEFAULT [];

-- Check Configuration
DEFINE FIELD check_command ON nagios_host TYPE string DEFAULT "check-host-alive";
DEFINE FIELD check_interval ON nagios_host TYPE int DEFAULT 5;
DEFINE FIELD retry_interval ON nagios_host TYPE int DEFAULT 1;
DEFINE FIELD max_check_attempts ON nagios_host TYPE int DEFAULT 4;
DEFINE FIELD check_period ON nagios_host TYPE string DEFAULT "24x7";
DEFINE FIELD notification_interval ON nagios_host TYPE int DEFAULT 30;
DEFINE FIELD notification_period ON nagios_host TYPE string DEFAULT "24x7";
DEFINE FIELD notification_options ON nagios_host TYPE array<string> DEFAULT ["d", "u", "r"]; -- d=down, u=unreachable, r=recovery

-- Parent/Dependencies
DEFINE FIELD parents ON nagios_host TYPE array<string> DEFAULT [];

-- Current State
DEFINE FIELD current_state ON nagios_host TYPE string DEFAULT "pending"; -- up, down, unreachable, pending
DEFINE FIELD last_check ON nagios_host TYPE option<datetime>;
DEFINE FIELD last_state_change ON nagios_host TYPE option<datetime>;
DEFINE FIELD output ON nagios_host TYPE option<string>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON nagios_host TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD active ON nagios_host TYPE bool DEFAULT true;
DEFINE FIELD created_at ON nagios_host TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_host TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_host_srv ON nagios_host FIELDS nagios_server;
DEFINE INDEX idx_nagios_host_name ON nagios_host FIELDS nagios_server, name UNIQUE;

-- ============================================================================
-- NAGIOS - SERVICE
-- ============================================================================

DEFINE TABLE nagios_service SCHEMAFULL;

DEFINE FIELD nagios_server ON nagios_service TYPE record<nagios_server>;
DEFINE FIELD host ON nagios_service TYPE record<nagios_host>;
DEFINE FIELD service_description ON nagios_service TYPE string;
DEFINE FIELD display_name ON nagios_service TYPE option<string>;

-- Check Configuration
DEFINE FIELD check_command ON nagios_service TYPE string;
DEFINE FIELD check_interval ON nagios_service TYPE int DEFAULT 5;
DEFINE FIELD retry_interval ON nagios_service TYPE int DEFAULT 1;
DEFINE FIELD max_check_attempts ON nagios_service TYPE int DEFAULT 4;
DEFINE FIELD check_period ON nagios_service TYPE string DEFAULT "24x7";

-- Notifications
DEFINE FIELD contacts ON nagios_service TYPE array<string> DEFAULT [];
DEFINE FIELD contact_groups ON nagios_service TYPE array<string> DEFAULT [];
DEFINE FIELD notification_interval ON nagios_service TYPE int DEFAULT 30;
DEFINE FIELD notification_period ON nagios_service TYPE string DEFAULT "24x7";
DEFINE FIELD notification_options ON nagios_service TYPE array<string> DEFAULT ["w", "u", "c", "r"]; -- w=warning, u=unknown, c=critical, r=recovery

-- Thresholds
DEFINE FIELD warning_threshold ON nagios_service TYPE option<string>;
DEFINE FIELD critical_threshold ON nagios_service TYPE option<string>;

-- Current State
DEFINE FIELD current_state ON nagios_service TYPE string DEFAULT "pending"; -- ok, warning, critical, unknown, pending
DEFINE FIELD last_check ON nagios_service TYPE option<datetime>;
DEFINE FIELD last_state_change ON nagios_service TYPE option<datetime>;
DEFINE FIELD output ON nagios_service TYPE option<string>;
DEFINE FIELD performance_data ON nagios_service TYPE option<string>;

-- Audit
DEFINE FIELD active ON nagios_service TYPE bool DEFAULT true;
DEFINE FIELD created_at ON nagios_service TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_service TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_svc_srv ON nagios_service FIELDS nagios_server;
DEFINE INDEX idx_nagios_svc_host ON nagios_service FIELDS host;
DEFINE INDEX idx_nagios_svc_desc ON nagios_service FIELDS host, service_description UNIQUE;

-- ============================================================================
-- NAGIOS - HOST GROUP
-- ============================================================================

DEFINE TABLE nagios_hostgroup SCHEMAFULL;

DEFINE FIELD nagios_server ON nagios_hostgroup TYPE record<nagios_server>;
DEFINE FIELD hostgroup_name ON nagios_hostgroup TYPE string;
DEFINE FIELD alias ON nagios_hostgroup TYPE option<string>;
DEFINE FIELD members ON nagios_hostgroup TYPE array<string> DEFAULT [];
DEFINE FIELD hostgroup_members ON nagios_hostgroup TYPE array<string> DEFAULT []; -- Nested hostgroups
DEFINE FIELD notes ON nagios_hostgroup TYPE option<string>;
DEFINE FIELD notes_url ON nagios_hostgroup TYPE option<string>;
DEFINE FIELD action_url ON nagios_hostgroup TYPE option<string>;
DEFINE FIELD created_at ON nagios_hostgroup TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_hostgroup TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_hg_srv ON nagios_hostgroup FIELDS nagios_server;
DEFINE INDEX idx_nagios_hg_name ON nagios_hostgroup FIELDS nagios_server, hostgroup_name UNIQUE;

-- ============================================================================
-- NAGIOS - CONTACT
-- ============================================================================

DEFINE TABLE nagios_contact SCHEMAFULL;

DEFINE FIELD nagios_server ON nagios_contact TYPE record<nagios_server>;
DEFINE FIELD contact_name ON nagios_contact TYPE string;
DEFINE FIELD alias ON nagios_contact TYPE option<string>;
DEFINE FIELD email ON nagios_contact TYPE option<string>;
DEFINE FIELD pager ON nagios_contact TYPE option<string>;
DEFINE FIELD host_notification_period ON nagios_contact TYPE string DEFAULT "24x7";
DEFINE FIELD service_notification_period ON nagios_contact TYPE string DEFAULT "24x7";
DEFINE FIELD host_notification_options ON nagios_contact TYPE array<string> DEFAULT ["d", "u", "r"];
DEFINE FIELD service_notification_options ON nagios_contact TYPE array<string> DEFAULT ["w", "u", "c", "r"];
DEFINE FIELD host_notification_commands ON nagios_contact TYPE array<string> DEFAULT [];
DEFINE FIELD service_notification_commands ON nagios_contact TYPE array<string> DEFAULT [];
DEFINE FIELD contact_groups ON nagios_contact TYPE array<string> DEFAULT [];
DEFINE FIELD created_at ON nagios_contact TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_contact TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_contact_srv ON nagios_contact FIELDS nagios_server;
DEFINE INDEX idx_nagios_contact_name ON nagios_contact FIELDS nagios_server, contact_name UNIQUE;

-- ============================================================================
-- NAGIOS - COMMAND
-- ============================================================================

DEFINE TABLE nagios_command SCHEMAFULL;

DEFINE FIELD nagios_server ON nagios_command TYPE record<nagios_server>;
DEFINE FIELD command_name ON nagios_command TYPE string;
DEFINE FIELD command_line ON nagios_command TYPE string;
DEFINE FIELD command_type ON nagios_command TYPE string DEFAULT "check"; -- check, notification, event_handler
DEFINE FIELD description ON nagios_command TYPE option<string>;
DEFINE FIELD created_at ON nagios_command TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nagios_command TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_nagios_cmd_srv ON nagios_command FIELDS nagios_server;
DEFINE INDEX idx_nagios_cmd_name ON nagios_command FIELDS nagios_server, command_name UNIQUE;
