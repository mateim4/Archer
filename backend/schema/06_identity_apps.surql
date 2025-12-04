-- ============================================================================
-- LCMDesigner - Identity & Applications Infrastructure Schema
-- Active Directory + IBM WebSphere + Red Hat OpenShift
-- ============================================================================

-- ============================================================================
-- ACTIVE DIRECTORY - FOREST
-- ============================================================================

DEFINE TABLE ad_forest SCHEMAFULL;

DEFINE FIELD name ON ad_forest TYPE string;
DEFINE FIELD forest_root_domain ON ad_forest TYPE string;
DEFINE FIELD forest_functional_level ON ad_forest TYPE string; -- Windows2012R2Forest, Windows2016Forest, etc.
DEFINE FIELD schema_master ON ad_forest TYPE option<string>;
DEFINE FIELD domain_naming_master ON ad_forest TYPE option<string>;
DEFINE FIELD global_catalog_servers ON ad_forest TYPE array<string> DEFAULT [];
DEFINE FIELD sites ON ad_forest TYPE array<string> DEFAULT [];
DEFINE FIELD trusts ON ad_forest TYPE array<object> DEFAULT []; -- Trust relationships to other forests

-- CMDB Reference
DEFINE FIELD cmdb_service ON ad_forest TYPE option<record<cmdb_service>>;

-- Audit
DEFINE FIELD status ON ad_forest TYPE string DEFAULT "active";
DEFINE FIELD created_at ON ad_forest TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_forest TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_forest_name ON ad_forest FIELDS name;
DEFINE INDEX idx_ad_forest_root ON ad_forest FIELDS forest_root_domain UNIQUE;

-- ============================================================================
-- ACTIVE DIRECTORY - DOMAIN
-- ============================================================================

DEFINE TABLE ad_domain SCHEMAFULL;

DEFINE FIELD forest ON ad_domain TYPE record<ad_forest>;
DEFINE FIELD name ON ad_domain TYPE string;
DEFINE FIELD dns_name ON ad_domain TYPE string; -- corp.example.com
DEFINE FIELD netbios_name ON ad_domain TYPE string; -- CORP
DEFINE FIELD domain_functional_level ON ad_domain TYPE string;
DEFINE FIELD parent_domain ON ad_domain TYPE option<record<ad_domain>>;
DEFINE FIELD is_forest_root ON ad_domain TYPE bool DEFAULT false;

-- FSMO Roles
DEFINE FIELD pdc_emulator ON ad_domain TYPE option<string>;
DEFINE FIELD rid_master ON ad_domain TYPE option<string>;
DEFINE FIELD infrastructure_master ON ad_domain TYPE option<string>;

-- Statistics
DEFINE FIELD user_count ON ad_domain TYPE int DEFAULT 0;
DEFINE FIELD computer_count ON ad_domain TYPE int DEFAULT 0;
DEFINE FIELD group_count ON ad_domain TYPE int DEFAULT 0;
DEFINE FIELD ou_count ON ad_domain TYPE int DEFAULT 0;
DEFINE FIELD gpo_count ON ad_domain TYPE int DEFAULT 0;

-- Audit
DEFINE FIELD status ON ad_domain TYPE string DEFAULT "active";
DEFINE FIELD created_at ON ad_domain TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_domain TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_domain_name ON ad_domain FIELDS name;
DEFINE INDEX idx_ad_domain_dns ON ad_domain FIELDS dns_name UNIQUE;
DEFINE INDEX idx_ad_domain_forest ON ad_domain FIELDS forest;

-- ============================================================================
-- ACTIVE DIRECTORY - DOMAIN CONTROLLER
-- ============================================================================

DEFINE TABLE ad_domain_controller SCHEMAFULL;

DEFINE FIELD domain ON ad_domain_controller TYPE record<ad_domain>;
DEFINE FIELD name ON ad_domain_controller TYPE string;
DEFINE FIELD hostname ON ad_domain_controller TYPE string;
DEFINE FIELD ip_address ON ad_domain_controller TYPE string;
DEFINE FIELD os_version ON ad_domain_controller TYPE string;
DEFINE FIELD site ON ad_domain_controller TYPE string;
DEFINE FIELD is_global_catalog ON ad_domain_controller TYPE bool DEFAULT false;
DEFINE FIELD is_read_only ON ad_domain_controller TYPE bool DEFAULT false; -- RODC

-- FSMO Roles held
DEFINE FIELD holds_schema_master ON ad_domain_controller TYPE bool DEFAULT false;
DEFINE FIELD holds_domain_naming_master ON ad_domain_controller TYPE bool DEFAULT false;
DEFINE FIELD holds_pdc_emulator ON ad_domain_controller TYPE bool DEFAULT false;
DEFINE FIELD holds_rid_master ON ad_domain_controller TYPE bool DEFAULT false;
DEFINE FIELD holds_infrastructure_master ON ad_domain_controller TYPE bool DEFAULT false;

-- Replication
DEFINE FIELD replication_partners ON ad_domain_controller TYPE array<string> DEFAULT [];
DEFINE FIELD last_replication ON ad_domain_controller TYPE option<datetime>;

-- CMDB Reference
DEFINE FIELD cmdb_server ON ad_domain_controller TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON ad_domain_controller TYPE string DEFAULT "active";
DEFINE FIELD created_at ON ad_domain_controller TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_domain_controller TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_dc_domain ON ad_domain_controller FIELDS domain;
DEFINE INDEX idx_ad_dc_name ON ad_domain_controller FIELDS name;
DEFINE INDEX idx_ad_dc_hostname ON ad_domain_controller FIELDS hostname;

-- ============================================================================
-- ACTIVE DIRECTORY - ORGANIZATIONAL UNIT
-- ============================================================================

DEFINE TABLE ad_ou SCHEMAFULL;

DEFINE FIELD domain ON ad_ou TYPE record<ad_domain>;
DEFINE FIELD name ON ad_ou TYPE string;
DEFINE FIELD distinguished_name ON ad_ou TYPE string;
DEFINE FIELD parent_ou ON ad_ou TYPE option<record<ad_ou>>;
DEFINE FIELD description ON ad_ou TYPE option<string>;
DEFINE FIELD protected_from_deletion ON ad_ou TYPE bool DEFAULT false;
DEFINE FIELD linked_gpos ON ad_ou TYPE array<string> DEFAULT [];

-- Object counts
DEFINE FIELD user_count ON ad_ou TYPE int DEFAULT 0;
DEFINE FIELD computer_count ON ad_ou TYPE int DEFAULT 0;
DEFINE FIELD group_count ON ad_ou TYPE int DEFAULT 0;
DEFINE FIELD child_ou_count ON ad_ou TYPE int DEFAULT 0;

DEFINE FIELD created_at ON ad_ou TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_ou TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_ou_domain ON ad_ou FIELDS domain;
DEFINE INDEX idx_ad_ou_dn ON ad_ou FIELDS distinguished_name UNIQUE;

-- ============================================================================
-- ACTIVE DIRECTORY - USER
-- ============================================================================

DEFINE TABLE ad_user SCHEMAFULL;

DEFINE FIELD domain ON ad_user TYPE record<ad_domain>;
DEFINE FIELD ou ON ad_user TYPE option<record<ad_ou>>;
DEFINE FIELD sam_account_name ON ad_user TYPE string;
DEFINE FIELD user_principal_name ON ad_user TYPE string;
DEFINE FIELD distinguished_name ON ad_user TYPE string;
DEFINE FIELD display_name ON ad_user TYPE option<string>;
DEFINE FIELD given_name ON ad_user TYPE option<string>;
DEFINE FIELD surname ON ad_user TYPE option<string>;
DEFINE FIELD email ON ad_user TYPE option<string>;
DEFINE FIELD title ON ad_user TYPE option<string>;
DEFINE FIELD department ON ad_user TYPE option<string>;
DEFINE FIELD manager ON ad_user TYPE option<record<ad_user>>;
DEFINE FIELD member_of ON ad_user TYPE array<string> DEFAULT [];

-- Account State
DEFINE FIELD enabled ON ad_user TYPE bool DEFAULT true;
DEFINE FIELD locked_out ON ad_user TYPE bool DEFAULT false;
DEFINE FIELD password_never_expires ON ad_user TYPE bool DEFAULT false;
DEFINE FIELD password_last_set ON ad_user TYPE option<datetime>;
DEFINE FIELD last_logon ON ad_user TYPE option<datetime>;
DEFINE FIELD account_expires ON ad_user TYPE option<datetime>;
DEFINE FIELD when_created ON ad_user TYPE option<datetime>;
DEFINE FIELD when_changed ON ad_user TYPE option<datetime>;

-- Service Account
DEFINE FIELD is_service_account ON ad_user TYPE bool DEFAULT false;
DEFINE FIELD service_principal_names ON ad_user TYPE array<string> DEFAULT [];

DEFINE FIELD created_at ON ad_user TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_user TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_user_domain ON ad_user FIELDS domain;
DEFINE INDEX idx_ad_user_sam ON ad_user FIELDS domain, sam_account_name UNIQUE;
DEFINE INDEX idx_ad_user_upn ON ad_user FIELDS user_principal_name UNIQUE;
DEFINE INDEX idx_ad_user_email ON ad_user FIELDS email;

-- ============================================================================
-- ACTIVE DIRECTORY - GROUP
-- ============================================================================

DEFINE TABLE ad_group SCHEMAFULL;

DEFINE FIELD domain ON ad_group TYPE record<ad_domain>;
DEFINE FIELD ou ON ad_group TYPE option<record<ad_ou>>;
DEFINE FIELD name ON ad_group TYPE string;
DEFINE FIELD sam_account_name ON ad_group TYPE string;
DEFINE FIELD distinguished_name ON ad_group TYPE string;
DEFINE FIELD description ON ad_group TYPE option<string>;
DEFINE FIELD group_scope ON ad_group TYPE string; -- DomainLocal, Global, Universal
DEFINE FIELD group_category ON ad_group TYPE string; -- Security, Distribution
DEFINE FIELD member_count ON ad_group TYPE int DEFAULT 0;
DEFINE FIELD members ON ad_group TYPE array<string> DEFAULT [];
DEFINE FIELD member_of ON ad_group TYPE array<string> DEFAULT [];
DEFINE FIELD managed_by ON ad_group TYPE option<string>;
DEFINE FIELD when_created ON ad_group TYPE option<datetime>;
DEFINE FIELD when_changed ON ad_group TYPE option<datetime>;

DEFINE FIELD created_at ON ad_group TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_group TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_group_domain ON ad_group FIELDS domain;
DEFINE INDEX idx_ad_group_sam ON ad_group FIELDS domain, sam_account_name UNIQUE;
DEFINE INDEX idx_ad_group_dn ON ad_group FIELDS distinguished_name UNIQUE;

-- ============================================================================
-- ACTIVE DIRECTORY - COMPUTER
-- ============================================================================

DEFINE TABLE ad_computer SCHEMAFULL;

DEFINE FIELD domain ON ad_computer TYPE record<ad_domain>;
DEFINE FIELD ou ON ad_computer TYPE option<record<ad_ou>>;
DEFINE FIELD name ON ad_computer TYPE string;
DEFINE FIELD sam_account_name ON ad_computer TYPE string;
DEFINE FIELD dns_hostname ON ad_computer TYPE option<string>;
DEFINE FIELD distinguished_name ON ad_computer TYPE string;
DEFINE FIELD operating_system ON ad_computer TYPE option<string>;
DEFINE FIELD operating_system_version ON ad_computer TYPE option<string>;
DEFINE FIELD operating_system_service_pack ON ad_computer TYPE option<string>;
DEFINE FIELD member_of ON ad_computer TYPE array<string> DEFAULT [];
DEFINE FIELD enabled ON ad_computer TYPE bool DEFAULT true;
DEFINE FIELD last_logon ON ad_computer TYPE option<datetime>;
DEFINE FIELD when_created ON ad_computer TYPE option<datetime>;
DEFINE FIELD when_changed ON ad_computer TYPE option<datetime>;

-- CMDB Reference
DEFINE FIELD cmdb_server ON ad_computer TYPE option<record<cmdb_server>>;

DEFINE FIELD created_at ON ad_computer TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_computer TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_computer_domain ON ad_computer FIELDS domain;
DEFINE INDEX idx_ad_computer_name ON ad_computer FIELDS name;
DEFINE INDEX idx_ad_computer_sam ON ad_computer FIELDS domain, sam_account_name UNIQUE;

-- ============================================================================
-- ACTIVE DIRECTORY - GROUP POLICY OBJECT
-- ============================================================================

DEFINE TABLE ad_gpo SCHEMAFULL;

DEFINE FIELD domain ON ad_gpo TYPE record<ad_domain>;
DEFINE FIELD name ON ad_gpo TYPE string;
DEFINE FIELD display_name ON ad_gpo TYPE string;
DEFINE FIELD guid ON ad_gpo TYPE string;
DEFINE FIELD description ON ad_gpo TYPE option<string>;
DEFINE FIELD gpo_status ON ad_gpo TYPE string DEFAULT "AllSettingsEnabled"; -- AllSettingsEnabled, UserSettingsDisabled, ComputerSettingsDisabled, AllSettingsDisabled
DEFINE FIELD wmi_filter ON ad_gpo TYPE option<string>;
DEFINE FIELD linked_ous ON ad_gpo TYPE array<string> DEFAULT [];
DEFINE FIELD link_enabled ON ad_gpo TYPE bool DEFAULT true;
DEFINE FIELD enforced ON ad_gpo TYPE bool DEFAULT false;
DEFINE FIELD user_version ON ad_gpo TYPE int DEFAULT 0;
DEFINE FIELD computer_version ON ad_gpo TYPE int DEFAULT 0;
DEFINE FIELD when_created ON ad_gpo TYPE option<datetime>;
DEFINE FIELD when_changed ON ad_gpo TYPE option<datetime>;

DEFINE FIELD created_at ON ad_gpo TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON ad_gpo TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ad_gpo_domain ON ad_gpo FIELDS domain;
DEFINE INDEX idx_ad_gpo_guid ON ad_gpo FIELDS guid UNIQUE;
DEFINE INDEX idx_ad_gpo_name ON ad_gpo FIELDS domain, display_name;

-- ============================================================================
-- IBM WEBSPHERE - CELL
-- ============================================================================

DEFINE TABLE websphere_cell SCHEMAFULL;

DEFINE FIELD name ON websphere_cell TYPE string;
DEFINE FIELD version ON websphere_cell TYPE string; -- 8.5, 9.0
DEFINE FIELD deployment_manager ON websphere_cell TYPE option<record<websphere_dmgr>>;
DEFINE FIELD profile_path ON websphere_cell TYPE option<string>;
DEFINE FIELD security_enabled ON websphere_cell TYPE bool DEFAULT true;

-- Statistics
DEFINE FIELD node_count ON websphere_cell TYPE int DEFAULT 0;
DEFINE FIELD cluster_count ON websphere_cell TYPE int DEFAULT 0;
DEFINE FIELD application_count ON websphere_cell TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_service ON websphere_cell TYPE option<record<cmdb_service>>;

-- Audit
DEFINE FIELD status ON websphere_cell TYPE string DEFAULT "active";
DEFINE FIELD created_at ON websphere_cell TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_cell TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_cell_name ON websphere_cell FIELDS name UNIQUE;

-- ============================================================================
-- IBM WEBSPHERE - DEPLOYMENT MANAGER
-- ============================================================================

DEFINE TABLE websphere_dmgr SCHEMAFULL;

DEFINE FIELD cell ON websphere_dmgr TYPE record<websphere_cell>;
DEFINE FIELD name ON websphere_dmgr TYPE string;
DEFINE FIELD hostname ON websphere_dmgr TYPE string;
DEFINE FIELD ip_address ON websphere_dmgr TYPE string;
DEFINE FIELD profile_name ON websphere_dmgr TYPE string;
DEFINE FIELD profile_path ON websphere_dmgr TYPE string;
DEFINE FIELD soap_port ON websphere_dmgr TYPE int DEFAULT 8879;
DEFINE FIELD admin_console_port ON websphere_dmgr TYPE int DEFAULT 9060;
DEFINE FIELD admin_console_secure_port ON websphere_dmgr TYPE int DEFAULT 9043;

-- CMDB Reference
DEFINE FIELD cmdb_server ON websphere_dmgr TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON websphere_dmgr TYPE string DEFAULT "running"; -- running, stopped
DEFINE FIELD created_at ON websphere_dmgr TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_dmgr TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_dmgr_cell ON websphere_dmgr FIELDS cell;
DEFINE INDEX idx_ws_dmgr_name ON websphere_dmgr FIELDS name;

-- ============================================================================
-- IBM WEBSPHERE - NODE
-- ============================================================================

DEFINE TABLE websphere_node SCHEMAFULL;

DEFINE FIELD cell ON websphere_node TYPE record<websphere_cell>;
DEFINE FIELD name ON websphere_node TYPE string;
DEFINE FIELD hostname ON websphere_node TYPE string;
DEFINE FIELD ip_address ON websphere_node TYPE string;
DEFINE FIELD profile_name ON websphere_node TYPE string;
DEFINE FIELD node_agent_port ON websphere_node TYPE int DEFAULT 8878;
DEFINE FIELD is_managed ON websphere_node TYPE bool DEFAULT true;
DEFINE FIELD server_count ON websphere_node TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_server ON websphere_node TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON websphere_node TYPE string DEFAULT "running";
DEFINE FIELD created_at ON websphere_node TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_node TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_node_cell ON websphere_node FIELDS cell;
DEFINE INDEX idx_ws_node_name ON websphere_node FIELDS cell, name UNIQUE;

-- ============================================================================
-- IBM WEBSPHERE - CLUSTER
-- ============================================================================

DEFINE TABLE websphere_cluster SCHEMAFULL;

DEFINE FIELD cell ON websphere_cluster TYPE record<websphere_cell>;
DEFINE FIELD name ON websphere_cluster TYPE string;
DEFINE FIELD cluster_type ON websphere_cluster TYPE string DEFAULT "application"; -- application, proxy
DEFINE FIELD prefer_local ON websphere_cluster TYPE bool DEFAULT true;
DEFINE FIELD member_count ON websphere_cluster TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_service ON websphere_cluster TYPE option<record<cmdb_service>>;

-- Audit
DEFINE FIELD status ON websphere_cluster TYPE string DEFAULT "started"; -- started, partial, stopped
DEFINE FIELD created_at ON websphere_cluster TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_cluster TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_cluster_cell ON websphere_cluster FIELDS cell;
DEFINE INDEX idx_ws_cluster_name ON websphere_cluster FIELDS cell, name UNIQUE;

-- ============================================================================
-- IBM WEBSPHERE - APPLICATION SERVER
-- ============================================================================

DEFINE TABLE websphere_server SCHEMAFULL;

DEFINE FIELD cell ON websphere_server TYPE record<websphere_cell>;
DEFINE FIELD node ON websphere_server TYPE record<websphere_node>;
DEFINE FIELD cluster ON websphere_server TYPE option<record<websphere_cluster>>;
DEFINE FIELD name ON websphere_server TYPE string;
DEFINE FIELD server_type ON websphere_server TYPE string DEFAULT "APPLICATION_SERVER"; -- APPLICATION_SERVER, WEB_SERVER, PROXY_SERVER

-- Ports
DEFINE FIELD http_port ON websphere_server TYPE option<int>;
DEFINE FIELD https_port ON websphere_server TYPE option<int>;
DEFINE FIELD bootstrap_port ON websphere_server TYPE option<int>;
DEFINE FIELD soap_port ON websphere_server TYPE option<int>;

-- JVM Configuration
DEFINE FIELD jvm_initial_heap ON websphere_server TYPE int DEFAULT 256;
DEFINE FIELD jvm_max_heap ON websphere_server TYPE int DEFAULT 512;
DEFINE FIELD jvm_generic_args ON websphere_server TYPE option<string>;

-- Applications
DEFINE FIELD deployed_applications ON websphere_server TYPE array<string> DEFAULT [];

-- Audit
DEFINE FIELD status ON websphere_server TYPE string DEFAULT "started"; -- started, stopped
DEFINE FIELD created_at ON websphere_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_server_cell ON websphere_server FIELDS cell;
DEFINE INDEX idx_ws_server_node ON websphere_server FIELDS node;
DEFINE INDEX idx_ws_server_cluster ON websphere_server FIELDS cluster;
DEFINE INDEX idx_ws_server_name ON websphere_server FIELDS node, name UNIQUE;

-- ============================================================================
-- IBM WEBSPHERE - APPLICATION
-- ============================================================================

DEFINE TABLE websphere_application SCHEMAFULL;

DEFINE FIELD cell ON websphere_application TYPE record<websphere_cell>;
DEFINE FIELD name ON websphere_application TYPE string;
DEFINE FIELD display_name ON websphere_application TYPE option<string>;
DEFINE FIELD application_type ON websphere_application TYPE string DEFAULT "ear"; -- ear, war
DEFINE FIELD context_root ON websphere_application TYPE option<string>;
DEFINE FIELD version ON websphere_application TYPE option<string>;

-- Deployment
DEFINE FIELD deployed_on_clusters ON websphere_application TYPE array<record<websphere_cluster>> DEFAULT [];
DEFINE FIELD deployed_on_servers ON websphere_application TYPE array<record<websphere_server>> DEFAULT [];
DEFINE FIELD starting_weight ON websphere_application TYPE int DEFAULT 1;

-- Resources
DEFINE FIELD data_sources ON websphere_application TYPE array<string> DEFAULT [];
DEFINE FIELD jms_resources ON websphere_application TYPE array<string> DEFAULT [];

-- CMDB Reference
DEFINE FIELD cmdb_application ON websphere_application TYPE option<record<cmdb_application>>;

-- Audit
DEFINE FIELD status ON websphere_application TYPE string DEFAULT "started"; -- started, stopped
DEFINE FIELD deployed_at ON websphere_application TYPE option<datetime>;
DEFINE FIELD created_at ON websphere_application TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON websphere_application TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ws_app_cell ON websphere_application FIELDS cell;
DEFINE INDEX idx_ws_app_name ON websphere_application FIELDS cell, name UNIQUE;

-- ============================================================================
-- RED HAT OPENSHIFT - CLUSTER
-- ============================================================================

DEFINE TABLE openshift_cluster SCHEMAFULL;

DEFINE FIELD name ON openshift_cluster TYPE string;
DEFINE FIELD api_url ON openshift_cluster TYPE string;
DEFINE FIELD console_url ON openshift_cluster TYPE option<string>;
DEFINE FIELD version ON openshift_cluster TYPE string; -- 4.12, 4.13, etc.
DEFINE FIELD platform ON openshift_cluster TYPE string; -- AWS, Azure, GCP, vSphere, BareMetal
DEFINE FIELD installation_type ON openshift_cluster TYPE string DEFAULT "IPI"; -- IPI, UPI

-- Networking
DEFINE FIELD cluster_network_cidr ON openshift_cluster TYPE string;
DEFINE FIELD service_network_cidr ON openshift_cluster TYPE string;
DEFINE FIELD sdn_type ON openshift_cluster TYPE string DEFAULT "OVNKubernetes"; -- OpenShiftSDN, OVNKubernetes

-- Authentication
DEFINE FIELD identity_providers ON openshift_cluster TYPE array<string> DEFAULT [];

-- Statistics
DEFINE FIELD master_count ON openshift_cluster TYPE int DEFAULT 3;
DEFINE FIELD worker_count ON openshift_cluster TYPE int DEFAULT 0;
DEFINE FIELD infra_count ON openshift_cluster TYPE int DEFAULT 0;
DEFINE FIELD namespace_count ON openshift_cluster TYPE int DEFAULT 0;
DEFINE FIELD pod_count ON openshift_cluster TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_service ON openshift_cluster TYPE option<record<cmdb_service>>;

-- Audit
DEFINE FIELD status ON openshift_cluster TYPE string DEFAULT "Ready"; -- Ready, Degraded, Progressing
DEFINE FIELD created_at ON openshift_cluster TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_cluster TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_cluster_name ON openshift_cluster FIELDS name UNIQUE;
DEFINE INDEX idx_ocp_cluster_api ON openshift_cluster FIELDS api_url;

-- ============================================================================
-- RED HAT OPENSHIFT - NODE (Master/Worker/Infra)
-- ============================================================================

DEFINE TABLE openshift_node SCHEMAFULL;

DEFINE FIELD cluster ON openshift_node TYPE record<openshift_cluster>;
DEFINE FIELD name ON openshift_node TYPE string;
DEFINE FIELD hostname ON openshift_node TYPE option<string>;
DEFINE FIELD internal_ip ON openshift_node TYPE option<string>;
DEFINE FIELD external_ip ON openshift_node TYPE option<string>;
DEFINE FIELD role ON openshift_node TYPE string; -- master, worker, infra
DEFINE FIELD labels ON openshift_node TYPE object DEFAULT {};
DEFINE FIELD taints ON openshift_node TYPE array<object> DEFAULT [];

-- OS/Runtime
DEFINE FIELD os_image ON openshift_node TYPE option<string>;
DEFINE FIELD kernel_version ON openshift_node TYPE option<string>;
DEFINE FIELD container_runtime ON openshift_node TYPE string DEFAULT "cri-o";
DEFINE FIELD kubelet_version ON openshift_node TYPE option<string>;

-- Resources
DEFINE FIELD cpu_capacity ON openshift_node TYPE option<string>;
DEFINE FIELD memory_capacity ON openshift_node TYPE option<string>;
DEFINE FIELD pods_capacity ON openshift_node TYPE int DEFAULT 250;
DEFINE FIELD cpu_allocatable ON openshift_node TYPE option<string>;
DEFINE FIELD memory_allocatable ON openshift_node TYPE option<string>;

-- Conditions
DEFINE FIELD ready ON openshift_node TYPE bool DEFAULT true;
DEFINE FIELD disk_pressure ON openshift_node TYPE bool DEFAULT false;
DEFINE FIELD memory_pressure ON openshift_node TYPE bool DEFAULT false;
DEFINE FIELD pid_pressure ON openshift_node TYPE bool DEFAULT false;
DEFINE FIELD network_unavailable ON openshift_node TYPE bool DEFAULT false;

-- CMDB Reference (underlying VM/Server)
DEFINE FIELD cmdb_server ON openshift_node TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON openshift_node TYPE string DEFAULT "Ready";
DEFINE FIELD created_at ON openshift_node TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_node TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_node_cluster ON openshift_node FIELDS cluster;
DEFINE INDEX idx_ocp_node_name ON openshift_node FIELDS cluster, name UNIQUE;
DEFINE INDEX idx_ocp_node_role ON openshift_node FIELDS role;

-- ============================================================================
-- RED HAT OPENSHIFT - NAMESPACE (Project)
-- ============================================================================

DEFINE TABLE openshift_namespace SCHEMAFULL;

DEFINE FIELD cluster ON openshift_namespace TYPE record<openshift_cluster>;
DEFINE FIELD name ON openshift_namespace TYPE string;
DEFINE FIELD display_name ON openshift_namespace TYPE option<string>;
DEFINE FIELD description ON openshift_namespace TYPE option<string>;
DEFINE FIELD labels ON openshift_namespace TYPE object DEFAULT {};
DEFINE FIELD annotations ON openshift_namespace TYPE object DEFAULT {};

-- Resource Quotas
DEFINE FIELD resource_quota ON openshift_namespace TYPE option<object>;
DEFINE FIELD limit_range ON openshift_namespace TYPE option<object>;

-- Network Policies
DEFINE FIELD network_policies ON openshift_namespace TYPE array<string> DEFAULT [];

-- Statistics
DEFINE FIELD pod_count ON openshift_namespace TYPE int DEFAULT 0;
DEFINE FIELD deployment_count ON openshift_namespace TYPE int DEFAULT 0;
DEFINE FIELD service_count ON openshift_namespace TYPE int DEFAULT 0;
DEFINE FIELD route_count ON openshift_namespace TYPE int DEFAULT 0;

-- Audit
DEFINE FIELD phase ON openshift_namespace TYPE string DEFAULT "Active"; -- Active, Terminating
DEFINE FIELD created_at ON openshift_namespace TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_namespace TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_ns_cluster ON openshift_namespace FIELDS cluster;
DEFINE INDEX idx_ocp_ns_name ON openshift_namespace FIELDS cluster, name UNIQUE;

-- ============================================================================
-- RED HAT OPENSHIFT - DEPLOYMENT
-- ============================================================================

DEFINE TABLE openshift_deployment SCHEMAFULL;

DEFINE FIELD cluster ON openshift_deployment TYPE record<openshift_cluster>;
DEFINE FIELD namespace ON openshift_deployment TYPE record<openshift_namespace>;
DEFINE FIELD name ON openshift_deployment TYPE string;
DEFINE FIELD labels ON openshift_deployment TYPE object DEFAULT {};
DEFINE FIELD annotations ON openshift_deployment TYPE object DEFAULT {};

-- Replicas
DEFINE FIELD replicas ON openshift_deployment TYPE int DEFAULT 1;
DEFINE FIELD ready_replicas ON openshift_deployment TYPE int DEFAULT 0;
DEFINE FIELD available_replicas ON openshift_deployment TYPE int DEFAULT 0;
DEFINE FIELD updated_replicas ON openshift_deployment TYPE int DEFAULT 0;

-- Strategy
DEFINE FIELD strategy ON openshift_deployment TYPE string DEFAULT "RollingUpdate"; -- RollingUpdate, Recreate
DEFINE FIELD max_surge ON openshift_deployment TYPE option<string>;
DEFINE FIELD max_unavailable ON openshift_deployment TYPE option<string>;

-- Container Spec
DEFINE FIELD containers ON openshift_deployment TYPE array<object> DEFAULT []; -- [{name, image, ports, resources, etc.}]
DEFINE FIELD init_containers ON openshift_deployment TYPE array<object> DEFAULT [];
DEFINE FIELD service_account ON openshift_deployment TYPE option<string>;

-- CMDB Reference
DEFINE FIELD cmdb_application ON openshift_deployment TYPE option<record<cmdb_application>>;

-- Audit
DEFINE FIELD conditions ON openshift_deployment TYPE array<object> DEFAULT [];
DEFINE FIELD created_at ON openshift_deployment TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_deployment TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_deploy_cluster ON openshift_deployment FIELDS cluster;
DEFINE INDEX idx_ocp_deploy_ns ON openshift_deployment FIELDS namespace;
DEFINE INDEX idx_ocp_deploy_name ON openshift_deployment FIELDS namespace, name UNIQUE;

-- ============================================================================
-- RED HAT OPENSHIFT - POD
-- ============================================================================

DEFINE TABLE openshift_pod SCHEMAFULL;

DEFINE FIELD cluster ON openshift_pod TYPE record<openshift_cluster>;
DEFINE FIELD namespace ON openshift_pod TYPE record<openshift_namespace>;
DEFINE FIELD name ON openshift_pod TYPE string;
DEFINE FIELD node ON openshift_pod TYPE option<record<openshift_node>>;
DEFINE FIELD labels ON openshift_pod TYPE object DEFAULT {};
DEFINE FIELD owner_kind ON openshift_pod TYPE option<string>; -- ReplicaSet, DaemonSet, StatefulSet, Job
DEFINE FIELD owner_name ON openshift_pod TYPE option<string>;

-- Networking
DEFINE FIELD pod_ip ON openshift_pod TYPE option<string>;
DEFINE FIELD host_ip ON openshift_pod TYPE option<string>;

-- Containers
DEFINE FIELD containers ON openshift_pod TYPE array<object> DEFAULT [];
DEFINE FIELD init_container_statuses ON openshift_pod TYPE array<object> DEFAULT [];
DEFINE FIELD container_statuses ON openshift_pod TYPE array<object> DEFAULT [];

-- Status
DEFINE FIELD phase ON openshift_pod TYPE string DEFAULT "Pending"; -- Pending, Running, Succeeded, Failed, Unknown
DEFINE FIELD qos_class ON openshift_pod TYPE string DEFAULT "BestEffort"; -- BestEffort, Burstable, Guaranteed
DEFINE FIELD restart_count ON openshift_pod TYPE int DEFAULT 0;
DEFINE FIELD conditions ON openshift_pod TYPE array<object> DEFAULT [];

-- Timing
DEFINE FIELD start_time ON openshift_pod TYPE option<datetime>;
DEFINE FIELD created_at ON openshift_pod TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_pod TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_pod_cluster ON openshift_pod FIELDS cluster;
DEFINE INDEX idx_ocp_pod_ns ON openshift_pod FIELDS namespace;
DEFINE INDEX idx_ocp_pod_node ON openshift_pod FIELDS node;
DEFINE INDEX idx_ocp_pod_name ON openshift_pod FIELDS namespace, name UNIQUE;

-- ============================================================================
-- RED HAT OPENSHIFT - SERVICE
-- ============================================================================

DEFINE TABLE openshift_service SCHEMAFULL;

DEFINE FIELD cluster ON openshift_service TYPE record<openshift_cluster>;
DEFINE FIELD namespace ON openshift_service TYPE record<openshift_namespace>;
DEFINE FIELD name ON openshift_service TYPE string;
DEFINE FIELD labels ON openshift_service TYPE object DEFAULT {};
DEFINE FIELD selector ON openshift_service TYPE object DEFAULT {};
DEFINE FIELD service_type ON openshift_service TYPE string DEFAULT "ClusterIP"; -- ClusterIP, NodePort, LoadBalancer, ExternalName
DEFINE FIELD cluster_ip ON openshift_service TYPE option<string>;
DEFINE FIELD external_ips ON openshift_service TYPE array<string> DEFAULT [];
DEFINE FIELD ports ON openshift_service TYPE array<object> DEFAULT []; -- [{name, port, targetPort, protocol}]
DEFINE FIELD session_affinity ON openshift_service TYPE string DEFAULT "None";

-- CMDB Reference
DEFINE FIELD cmdb_service ON openshift_service TYPE option<record<cmdb_service>>;

DEFINE FIELD created_at ON openshift_service TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_service TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_svc_cluster ON openshift_service FIELDS cluster;
DEFINE INDEX idx_ocp_svc_ns ON openshift_service FIELDS namespace;
DEFINE INDEX idx_ocp_svc_name ON openshift_service FIELDS namespace, name UNIQUE;

-- ============================================================================
-- RED HAT OPENSHIFT - ROUTE
-- ============================================================================

DEFINE TABLE openshift_route SCHEMAFULL;

DEFINE FIELD cluster ON openshift_route TYPE record<openshift_cluster>;
DEFINE FIELD namespace ON openshift_route TYPE record<openshift_namespace>;
DEFINE FIELD name ON openshift_route TYPE string;
DEFINE FIELD labels ON openshift_route TYPE object DEFAULT {};
DEFINE FIELD host ON openshift_route TYPE string;
DEFINE FIELD path ON openshift_route TYPE option<string>;
DEFINE FIELD service ON openshift_route TYPE record<openshift_service>;
DEFINE FIELD target_port ON openshift_route TYPE option<string>;
DEFINE FIELD tls_termination ON openshift_route TYPE option<string>; -- edge, passthrough, reencrypt
DEFINE FIELD insecure_edge_termination_policy ON openshift_route TYPE string DEFAULT "Redirect"; -- Allow, Redirect, None
DEFINE FIELD wildcard_policy ON openshift_route TYPE string DEFAULT "None";

-- Status
DEFINE FIELD admitted ON openshift_route TYPE bool DEFAULT false;
DEFINE FIELD ingress ON openshift_route TYPE array<object> DEFAULT [];

DEFINE FIELD created_at ON openshift_route TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_route TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_route_cluster ON openshift_route FIELDS cluster;
DEFINE INDEX idx_ocp_route_ns ON openshift_route FIELDS namespace;
DEFINE INDEX idx_ocp_route_name ON openshift_route FIELDS namespace, name UNIQUE;
DEFINE INDEX idx_ocp_route_host ON openshift_route FIELDS host;

-- ============================================================================
-- RED HAT OPENSHIFT - PERSISTENT VOLUME
-- ============================================================================

DEFINE TABLE openshift_pv SCHEMAFULL;

DEFINE FIELD cluster ON openshift_pv TYPE record<openshift_cluster>;
DEFINE FIELD name ON openshift_pv TYPE string;
DEFINE FIELD labels ON openshift_pv TYPE object DEFAULT {};
DEFINE FIELD capacity ON openshift_pv TYPE string;
DEFINE FIELD access_modes ON openshift_pv TYPE array<string> DEFAULT []; -- ReadWriteOnce, ReadOnlyMany, ReadWriteMany
DEFINE FIELD reclaim_policy ON openshift_pv TYPE string DEFAULT "Retain"; -- Retain, Delete, Recycle
DEFINE FIELD storage_class ON openshift_pv TYPE option<string>;
DEFINE FIELD volume_mode ON openshift_pv TYPE string DEFAULT "Filesystem"; -- Filesystem, Block

-- Volume Source
DEFINE FIELD volume_type ON openshift_pv TYPE string; -- nfs, iscsi, fc, csi, local
DEFINE FIELD volume_source ON openshift_pv TYPE object DEFAULT {};

-- Claim
DEFINE FIELD claim_ref ON openshift_pv TYPE option<object>; -- {namespace, name}
DEFINE FIELD phase ON openshift_pv TYPE string DEFAULT "Available"; -- Available, Bound, Released, Failed

DEFINE FIELD created_at ON openshift_pv TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_pv TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_pv_cluster ON openshift_pv FIELDS cluster;
DEFINE INDEX idx_ocp_pv_name ON openshift_pv FIELDS cluster, name UNIQUE;
DEFINE INDEX idx_ocp_pv_sc ON openshift_pv FIELDS storage_class;

-- ============================================================================
-- RED HAT OPENSHIFT - PERSISTENT VOLUME CLAIM
-- ============================================================================

DEFINE TABLE openshift_pvc SCHEMAFULL;

DEFINE FIELD cluster ON openshift_pvc TYPE record<openshift_cluster>;
DEFINE FIELD namespace ON openshift_pvc TYPE record<openshift_namespace>;
DEFINE FIELD name ON openshift_pvc TYPE string;
DEFINE FIELD labels ON openshift_pvc TYPE object DEFAULT {};
DEFINE FIELD storage_class ON openshift_pvc TYPE option<string>;
DEFINE FIELD access_modes ON openshift_pvc TYPE array<string> DEFAULT [];
DEFINE FIELD requested_storage ON openshift_pvc TYPE string;
DEFINE FIELD volume_mode ON openshift_pvc TYPE string DEFAULT "Filesystem";
DEFINE FIELD volume_name ON openshift_pvc TYPE option<string>; -- Bound PV name
DEFINE FIELD phase ON openshift_pvc TYPE string DEFAULT "Pending"; -- Pending, Bound, Lost

DEFINE FIELD created_at ON openshift_pvc TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON openshift_pvc TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_ocp_pvc_cluster ON openshift_pvc FIELDS cluster;
DEFINE INDEX idx_ocp_pvc_ns ON openshift_pvc FIELDS namespace;
DEFINE INDEX idx_ocp_pvc_name ON openshift_pvc FIELDS namespace, name UNIQUE;
