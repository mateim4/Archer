-- ============================================================================
-- ARCHER INFRASTRUCTURE SCHEMA - CORE
-- ============================================================================
-- Version: 2.0
-- Date: December 4, 2025
-- Description: Core namespace, database, and generic CMDB abstraction tables
-- 
-- This file defines:
--   1. Namespace and database configuration
--   2. Generic abstraction tables (cmdb_*)
--   3. Monitoring tables (monitoring_*)
--   4. Graph relationship tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- NAMESPACE AND DATABASE SETUP
-- ----------------------------------------------------------------------------

DEFINE NAMESPACE IF NOT EXISTS archer;
USE NS archer;

DEFINE DATABASE IF NOT EXISTS infrastructure;
USE DB infrastructure;

-- ============================================================================
-- GENERIC CMDB ABSTRACTION LAYER
-- ============================================================================
-- These tables provide unified views across all vendors. The UI queries these
-- tables for consolidated views, with vendor_record linking to full details.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cmdb_server: All compute resources (physical, virtual, container)
-- ----------------------------------------------------------------------------
DEFINE TABLE cmdb_server SCHEMAFULL;

-- Primary identifiers
DEFINE FIELD name ON cmdb_server TYPE string ASSERT $value != NONE;
DEFINE FIELD hostname ON cmdb_server TYPE string;
DEFINE FIELD ip_addresses ON cmdb_server TYPE array DEFAULT [];
DEFINE FIELD mac_addresses ON cmdb_server TYPE array DEFAULT [];

-- Classification
DEFINE FIELD server_type ON cmdb_server TYPE string 
    ASSERT $value IN ['physical', 'virtual', 'container'];
DEFINE FIELD os ON cmdb_server TYPE option<string>;
DEFINE FIELD os_version ON cmdb_server TYPE option<string>;

-- Resources
DEFINE FIELD cpu_cores ON cmdb_server TYPE option<int>;
DEFINE FIELD memory_gb ON cmdb_server TYPE option<float>;
DEFINE FIELD storage_gb ON cmdb_server TYPE option<float>;

-- Status and health
DEFINE FIELD status ON cmdb_server TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'maintenance', 'degraded', 'unknown'];
DEFINE FIELD health_score ON cmdb_server TYPE option<int>;

-- Vendor linkage
DEFINE FIELD vendor ON cmdb_server TYPE string;
DEFINE FIELD vendor_record ON cmdb_server TYPE option<record>;

-- Organizational
DEFINE FIELD location ON cmdb_server TYPE option<string>;
DEFINE FIELD environment ON cmdb_server TYPE option<string>
    ASSERT $value IN [NONE, 'production', 'staging', 'development', 'test', 'dr'];
DEFINE FIELD owner ON cmdb_server TYPE option<string>;
DEFINE FIELD cost_center ON cmdb_server TYPE option<string>;
DEFINE FIELD tags ON cmdb_server TYPE array DEFAULT [];
DEFINE FIELD custom_attributes ON cmdb_server TYPE option<object>;

-- Timestamps
DEFINE FIELD created_at ON cmdb_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cmdb_server TYPE datetime DEFAULT time::now();
DEFINE FIELD last_seen ON cmdb_server TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_server_name ON cmdb_server FIELDS name;
DEFINE INDEX idx_server_hostname ON cmdb_server FIELDS hostname;
DEFINE INDEX idx_server_status ON cmdb_server FIELDS status;
DEFINE INDEX idx_server_vendor ON cmdb_server FIELDS vendor;
DEFINE INDEX idx_server_type ON cmdb_server FIELDS server_type;
DEFINE INDEX idx_server_environment ON cmdb_server FIELDS environment;

-- ----------------------------------------------------------------------------
-- cmdb_network_device: Network infrastructure (switches, routers, firewalls)
-- ----------------------------------------------------------------------------
DEFINE TABLE cmdb_network_device SCHEMAFULL;

-- Primary identifiers
DEFINE FIELD name ON cmdb_network_device TYPE string ASSERT $value != NONE;
DEFINE FIELD hostname ON cmdb_network_device TYPE option<string>;
DEFINE FIELD management_ip ON cmdb_network_device TYPE option<string>;

-- Classification
DEFINE FIELD device_type ON cmdb_network_device TYPE string 
    ASSERT $value IN ['switch', 'router', 'firewall', 'load_balancer', 'wlc', 'access_point', 'proxy', 'vpn_concentrator', 'ids_ips', 'other'];
DEFINE FIELD model ON cmdb_network_device TYPE option<string>;
DEFINE FIELD serial_number ON cmdb_network_device TYPE option<string>;
DEFINE FIELD software_version ON cmdb_network_device TYPE option<string>;

-- Capabilities
DEFINE FIELD port_count ON cmdb_network_device TYPE option<int>;
DEFINE FIELD throughput_gbps ON cmdb_network_device TYPE option<float>;
DEFINE FIELD supports_poe ON cmdb_network_device TYPE option<bool>;
DEFINE FIELD layer ON cmdb_network_device TYPE option<int>; -- L2, L3, L7

-- Status
DEFINE FIELD status ON cmdb_network_device TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'maintenance', 'unknown'];
DEFINE FIELD uptime_seconds ON cmdb_network_device TYPE option<int>;

-- High availability
DEFINE FIELD ha_enabled ON cmdb_network_device TYPE option<bool>;
DEFINE FIELD ha_role ON cmdb_network_device TYPE option<string>
    ASSERT $value IN [NONE, 'primary', 'secondary', 'standalone', 'active', 'standby'];
DEFINE FIELD ha_peer ON cmdb_network_device TYPE option<record<cmdb_network_device>>;

-- Vendor linkage
DEFINE FIELD vendor ON cmdb_network_device TYPE string;
DEFINE FIELD vendor_record ON cmdb_network_device TYPE option<record>;

-- Organizational
DEFINE FIELD location ON cmdb_network_device TYPE option<string>;
DEFINE FIELD rack_position ON cmdb_network_device TYPE option<string>;
DEFINE FIELD owner ON cmdb_network_device TYPE option<string>;
DEFINE FIELD tags ON cmdb_network_device TYPE array DEFAULT [];
DEFINE FIELD custom_attributes ON cmdb_network_device TYPE option<object>;

-- Timestamps
DEFINE FIELD created_at ON cmdb_network_device TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cmdb_network_device TYPE datetime DEFAULT time::now();
DEFINE FIELD last_seen ON cmdb_network_device TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_netdev_name ON cmdb_network_device FIELDS name;
DEFINE INDEX idx_netdev_type ON cmdb_network_device FIELDS device_type;
DEFINE INDEX idx_netdev_status ON cmdb_network_device FIELDS status;
DEFINE INDEX idx_netdev_vendor ON cmdb_network_device FIELDS vendor;
DEFINE INDEX idx_netdev_serial ON cmdb_network_device FIELDS serial_number;
DEFINE INDEX idx_netdev_mgmt_ip ON cmdb_network_device FIELDS management_ip;

-- ----------------------------------------------------------------------------
-- cmdb_application: Deployed applications and services
-- ----------------------------------------------------------------------------
DEFINE TABLE cmdb_application SCHEMAFULL;

-- Primary identifiers
DEFINE FIELD name ON cmdb_application TYPE string ASSERT $value != NONE;
DEFINE FIELD display_name ON cmdb_application TYPE option<string>;
DEFINE FIELD description ON cmdb_application TYPE option<string>;

-- Classification
DEFINE FIELD app_type ON cmdb_application TYPE string 
    ASSERT $value IN ['web', 'api', 'database', 'middleware', 'messaging', 'cache', 'batch', 'service', 'other'];
DEFINE FIELD technology_stack ON cmdb_application TYPE array DEFAULT [];
DEFINE FIELD version ON cmdb_application TYPE option<string>;

-- Connectivity
DEFINE FIELD url ON cmdb_application TYPE option<string>;
DEFINE FIELD port ON cmdb_application TYPE option<int>;
DEFINE FIELD protocol ON cmdb_application TYPE option<string>;

-- Status
DEFINE FIELD status ON cmdb_application TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['running', 'stopped', 'failed', 'deploying', 'unknown'];
DEFINE FIELD health_endpoint ON cmdb_application TYPE option<string>;

-- Environment
DEFINE FIELD environment ON cmdb_application TYPE option<string>
    ASSERT $value IN [NONE, 'production', 'staging', 'development', 'test', 'dr'];

-- Vendor linkage
DEFINE FIELD vendor ON cmdb_application TYPE string;
DEFINE FIELD vendor_record ON cmdb_application TYPE option<record>;

-- Organizational
DEFINE FIELD owner ON cmdb_application TYPE option<string>;
DEFINE FIELD team ON cmdb_application TYPE option<string>;
DEFINE FIELD business_unit ON cmdb_application TYPE option<string>;
DEFINE FIELD criticality ON cmdb_application TYPE option<string>
    ASSERT $value IN [NONE, 'critical', 'high', 'medium', 'low'];
DEFINE FIELD tags ON cmdb_application TYPE array DEFAULT [];
DEFINE FIELD custom_attributes ON cmdb_application TYPE option<object>;

-- Timestamps
DEFINE FIELD created_at ON cmdb_application TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cmdb_application TYPE datetime DEFAULT time::now();
DEFINE FIELD last_seen ON cmdb_application TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_app_name ON cmdb_application FIELDS name;
DEFINE INDEX idx_app_type ON cmdb_application FIELDS app_type;
DEFINE INDEX idx_app_status ON cmdb_application FIELDS status;
DEFINE INDEX idx_app_vendor ON cmdb_application FIELDS vendor;
DEFINE INDEX idx_app_environment ON cmdb_application FIELDS environment;
DEFINE INDEX idx_app_criticality ON cmdb_application FIELDS criticality;

-- ----------------------------------------------------------------------------
-- cmdb_storage: Storage systems and volumes
-- ----------------------------------------------------------------------------
DEFINE TABLE cmdb_storage SCHEMAFULL;

-- Primary identifiers
DEFINE FIELD name ON cmdb_storage TYPE string ASSERT $value != NONE;

-- Classification
DEFINE FIELD storage_type ON cmdb_storage TYPE string 
    ASSERT $value IN ['san', 'nas', 'das', 'object', 'block', 'file', 'hci', 'cloud'];
DEFINE FIELD tier ON cmdb_storage TYPE option<string>
    ASSERT $value IN [NONE, 'flash', 'ssd', 'hdd', 'hybrid', 'archive', 'cold'];

-- Capacity (in GB)
DEFINE FIELD capacity_total_gb ON cmdb_storage TYPE option<float>;
DEFINE FIELD capacity_used_gb ON cmdb_storage TYPE option<float>;
DEFINE FIELD capacity_free_gb ON cmdb_storage TYPE option<float>;

-- Features
DEFINE FIELD compression_enabled ON cmdb_storage TYPE option<bool>;
DEFINE FIELD deduplication_enabled ON cmdb_storage TYPE option<bool>;
DEFINE FIELD encryption_enabled ON cmdb_storage TYPE option<bool>;
DEFINE FIELD replication_enabled ON cmdb_storage TYPE option<bool>;

-- Status
DEFINE FIELD status ON cmdb_storage TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'rebuilding', 'unknown'];

-- Vendor linkage
DEFINE FIELD vendor ON cmdb_storage TYPE string;
DEFINE FIELD vendor_record ON cmdb_storage TYPE option<record>;

-- Organizational
DEFINE FIELD location ON cmdb_storage TYPE option<string>;
DEFINE FIELD tags ON cmdb_storage TYPE array DEFAULT [];
DEFINE FIELD custom_attributes ON cmdb_storage TYPE option<object>;

-- Timestamps
DEFINE FIELD created_at ON cmdb_storage TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cmdb_storage TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_storage_name ON cmdb_storage FIELDS name;
DEFINE INDEX idx_storage_type ON cmdb_storage FIELDS storage_type;
DEFINE INDEX idx_storage_status ON cmdb_storage FIELDS status;
DEFINE INDEX idx_storage_vendor ON cmdb_storage FIELDS vendor;

-- ============================================================================
-- MONITORING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- monitoring_alert: Unified alerts from any monitoring system
-- ----------------------------------------------------------------------------
DEFINE TABLE monitoring_alert SCHEMAFULL;

-- Alert content
DEFINE FIELD title ON monitoring_alert TYPE string ASSERT $value != NONE;
DEFINE FIELD message ON monitoring_alert TYPE option<string>;
DEFINE FIELD severity ON monitoring_alert TYPE string 
    ASSERT $value IN ['critical', 'high', 'medium', 'low', 'info'];

-- Status tracking
DEFINE FIELD status ON monitoring_alert TYPE string DEFAULT 'active'
    ASSERT $value IN ['active', 'acknowledged', 'resolved', 'suppressed'];

-- Source information
DEFINE FIELD source_system ON monitoring_alert TYPE string; -- nagios, splunk, nutanix, etc.
DEFINE FIELD source_host ON monitoring_alert TYPE option<string>;
DEFINE FIELD source_service ON monitoring_alert TYPE option<string>;
DEFINE FIELD source_alert_id ON monitoring_alert TYPE option<string>;

-- Affected asset linkage
DEFINE FIELD affected_asset ON monitoring_alert TYPE option<record>;
DEFINE FIELD affected_asset_type ON monitoring_alert TYPE option<string>;

-- Timestamps
DEFINE FIELD triggered_at ON monitoring_alert TYPE datetime DEFAULT time::now();
DEFINE FIELD acknowledged_at ON monitoring_alert TYPE option<datetime>;
DEFINE FIELD acknowledged_by ON monitoring_alert TYPE option<string>;
DEFINE FIELD resolved_at ON monitoring_alert TYPE option<datetime>;
DEFINE FIELD resolved_by ON monitoring_alert TYPE option<string>;

-- ITSM integration
DEFINE FIELD ticket_id ON monitoring_alert TYPE option<record>;
DEFINE FIELD ticket_number ON monitoring_alert TYPE option<string>;

-- Vendor linkage
DEFINE FIELD vendor_record ON monitoring_alert TYPE option<record>;

-- Metadata
DEFINE FIELD tags ON monitoring_alert TYPE array DEFAULT [];
DEFINE FIELD custom_attributes ON monitoring_alert TYPE option<object>;
DEFINE FIELD created_at ON monitoring_alert TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_alert_severity ON monitoring_alert FIELDS severity;
DEFINE INDEX idx_alert_status ON monitoring_alert FIELDS status;
DEFINE INDEX idx_alert_source ON monitoring_alert FIELDS source_system;
DEFINE INDEX idx_alert_triggered ON monitoring_alert FIELDS triggered_at;
DEFINE INDEX idx_alert_asset ON monitoring_alert FIELDS affected_asset;

-- ----------------------------------------------------------------------------
-- monitoring_metric: Time-series metric data
-- ----------------------------------------------------------------------------
DEFINE TABLE monitoring_metric SCHEMAFULL;

-- Metric identification
DEFINE FIELD asset ON monitoring_metric TYPE record;
DEFINE FIELD metric_name ON monitoring_metric TYPE string ASSERT $value != NONE;

-- Metric value
DEFINE FIELD value ON monitoring_metric TYPE float;
DEFINE FIELD unit ON monitoring_metric TYPE option<string>;
DEFINE FIELD min_value ON monitoring_metric TYPE option<float>;
DEFINE FIELD max_value ON monitoring_metric TYPE option<float>;
DEFINE FIELD avg_value ON monitoring_metric TYPE option<float>;

-- Timestamp
DEFINE FIELD timestamp ON monitoring_metric TYPE datetime DEFAULT time::now();

-- Source
DEFINE FIELD source_system ON monitoring_metric TYPE string;

-- Dimensions (for multi-dimensional metrics)
DEFINE FIELD dimensions ON monitoring_metric TYPE option<object>;

-- Indexes (optimized for time-series queries)
DEFINE INDEX idx_metric_asset ON monitoring_metric FIELDS asset;
DEFINE INDEX idx_metric_name ON monitoring_metric FIELDS metric_name;
DEFINE INDEX idx_metric_time ON monitoring_metric FIELDS timestamp;
DEFINE INDEX idx_metric_composite ON monitoring_metric FIELDS asset, metric_name, timestamp;

-- ============================================================================
-- GRAPH RELATIONSHIP TABLES
-- ============================================================================
-- These tables define edges in the infrastructure graph, enabling topology
-- traversal and dependency mapping.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- manages: Management/control relationships
-- Example: Prism Central manages Cluster, FortiManager manages FortiGate
-- ----------------------------------------------------------------------------
DEFINE TABLE manages SCHEMAFULL;
DEFINE FIELD in ON manages TYPE record;
DEFINE FIELD out ON manages TYPE record;
DEFINE FIELD relationship_type ON manages TYPE option<string>;
DEFINE FIELD management_ip ON manages TYPE option<string>;
DEFINE FIELD created_at ON manages TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- contains: Containment/hierarchy relationships  
-- Example: Cluster contains Hosts, Host contains VMs
-- ----------------------------------------------------------------------------
DEFINE TABLE contains SCHEMAFULL;
DEFINE FIELD in ON contains TYPE record;
DEFINE FIELD out ON contains TYPE record;
DEFINE FIELD relationship_type ON contains TYPE option<string>;
DEFINE FIELD created_at ON contains TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- runs_on: Execution location relationships
-- Example: VM runs_on Host, Pod runs_on Node, App runs_on Server
-- ----------------------------------------------------------------------------
DEFINE TABLE runs_on SCHEMAFULL;
DEFINE FIELD in ON runs_on TYPE record;  -- The workload
DEFINE FIELD out ON runs_on TYPE record; -- The host
DEFINE FIELD relationship_type ON runs_on TYPE option<string>;
DEFINE FIELD created_at ON runs_on TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- connects_to: Network connectivity relationships
-- Example: Switch connects_to Switch, Server connects_to Switch
-- ----------------------------------------------------------------------------
DEFINE TABLE connects_to SCHEMAFULL;
DEFINE FIELD in ON connects_to TYPE record;
DEFINE FIELD out ON connects_to TYPE record;
DEFINE FIELD interface_a ON connects_to TYPE option<string>; -- Source interface
DEFINE FIELD interface_b ON connects_to TYPE option<string>; -- Destination interface
DEFINE FIELD link_type ON connects_to TYPE option<string>;   -- fiber, copper, virtual
DEFINE FIELD speed ON connects_to TYPE option<string>;       -- 1G, 10G, 25G, 100G
DEFINE FIELD vlan_id ON connects_to TYPE option<int>;
DEFINE FIELD created_at ON connects_to TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- depends_on: Service/application dependencies
-- Example: WebApp depends_on Database, API depends_on Cache
-- ----------------------------------------------------------------------------
DEFINE TABLE depends_on SCHEMAFULL;
DEFINE FIELD in ON depends_on TYPE record;  -- The dependent
DEFINE FIELD out ON depends_on TYPE record; -- The dependency
DEFINE FIELD dependency_type ON depends_on TYPE option<string>; -- hard, soft, optional
DEFINE FIELD port ON depends_on TYPE option<int>;
DEFINE FIELD protocol ON depends_on TYPE option<string>;
DEFINE FIELD created_at ON depends_on TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- monitors: Monitoring relationships
-- Example: Nagios Service monitors Server, Splunk Index monitors Host
-- ----------------------------------------------------------------------------
DEFINE TABLE monitors SCHEMAFULL;
DEFINE FIELD in ON monitors TYPE record;  -- The monitor
DEFINE FIELD out ON monitors TYPE record; -- The monitored asset
DEFINE FIELD monitor_type ON monitors TYPE option<string>; -- health, performance, logs
DEFINE FIELD check_interval_sec ON monitors TYPE option<int>;
DEFINE FIELD created_at ON monitors TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- backs_up: Backup coverage relationships
-- Example: Veeam Job backs_up VM, Backup Repository backs_up Server
-- ----------------------------------------------------------------------------
DEFINE TABLE backs_up SCHEMAFULL;
DEFINE FIELD in ON backs_up TYPE record;  -- The backup job/entity
DEFINE FIELD out ON backs_up TYPE record; -- The protected asset
DEFINE FIELD backup_type ON backs_up TYPE option<string>; -- full, incremental, differential
DEFINE FIELD schedule ON backs_up TYPE option<string>;
DEFINE FIELD retention_days ON backs_up TYPE option<int>;
DEFINE FIELD last_backup ON backs_up TYPE option<datetime>;
DEFINE FIELD created_at ON backs_up TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- member_of: Group membership relationships
-- Example: Host member_of Cluster, User member_of Group, Server member_of Pool
-- ----------------------------------------------------------------------------
DEFINE TABLE member_of SCHEMAFULL;
DEFINE FIELD in ON member_of TYPE record;  -- The member
DEFINE FIELD out ON member_of TYPE record; -- The group
DEFINE FIELD role ON member_of TYPE option<string>;
DEFINE FIELD priority ON member_of TYPE option<int>;
DEFINE FIELD created_at ON member_of TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- authenticates: Authentication relationships
-- Example: ISE authenticates Endpoint, AD authenticates User
-- ----------------------------------------------------------------------------
DEFINE TABLE authenticates SCHEMAFULL;
DEFINE FIELD in ON authenticates TYPE record;  -- The authenticator
DEFINE FIELD out ON authenticates TYPE record; -- The authenticated entity
DEFINE FIELD auth_method ON authenticates TYPE option<string>; -- 802.1x, radius, ldap, kerberos
DEFINE FIELD last_auth ON authenticates TYPE option<datetime>;
DEFINE FIELD created_at ON authenticates TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- load_balances: Load balancing relationships
-- Example: F5 VIP load_balances Pool, Pool load_balances Members
-- ----------------------------------------------------------------------------
DEFINE TABLE load_balances SCHEMAFULL;
DEFINE FIELD in ON load_balances TYPE record;  -- The load balancer entity
DEFINE FIELD out ON load_balances TYPE record; -- The balanced target
DEFINE FIELD lb_method ON load_balances TYPE option<string>; -- round_robin, least_conn, ip_hash
DEFINE FIELD weight ON load_balances TYPE option<int>;
DEFINE FIELD health_check ON load_balances TYPE option<string>;
DEFINE FIELD created_at ON load_balances TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- replicates_to: Replication relationships
-- Example: Protection Domain replicates_to Remote Site, DB replicates_to Replica
-- ----------------------------------------------------------------------------
DEFINE TABLE replicates_to SCHEMAFULL;
DEFINE FIELD in ON replicates_to TYPE record;  -- Source
DEFINE FIELD out ON replicates_to TYPE record; -- Target
DEFINE FIELD replication_type ON replicates_to TYPE option<string>; -- sync, async, snapshot
DEFINE FIELD rpo_minutes ON replicates_to TYPE option<int>;
DEFINE FIELD created_at ON replicates_to TYPE datetime DEFAULT time::now();

-- ----------------------------------------------------------------------------
-- uses: Resource usage relationships
-- Example: VM uses Storage Container, App uses Database
-- ----------------------------------------------------------------------------
DEFINE TABLE uses SCHEMAFULL;
DEFINE FIELD in ON uses TYPE record;  -- The consumer
DEFINE FIELD out ON uses TYPE record; -- The resource
DEFINE FIELD usage_type ON uses TYPE option<string>; -- storage, compute, network
DEFINE FIELD created_at ON uses TYPE datetime DEFAULT time::now();

-- ============================================================================
-- ITSM INTEGRATION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- itsm_ticket: IT Service Management tickets
-- Links alerts and assets to service desk tickets
-- ----------------------------------------------------------------------------
DEFINE TABLE itsm_ticket SCHEMAFULL;

DEFINE FIELD ticket_number ON itsm_ticket TYPE string ASSERT $value != NONE;
DEFINE FIELD title ON itsm_ticket TYPE string;
DEFINE FIELD description ON itsm_ticket TYPE option<string>;
DEFINE FIELD ticket_type ON itsm_ticket TYPE string 
    ASSERT $value IN ['incident', 'problem', 'change', 'request', 'task'];
DEFINE FIELD status ON itsm_ticket TYPE string 
    ASSERT $value IN ['new', 'open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];
DEFINE FIELD priority ON itsm_ticket TYPE string 
    ASSERT $value IN ['P1', 'P2', 'P3', 'P4'];
DEFINE FIELD severity ON itsm_ticket TYPE option<string>
    ASSERT $value IN [NONE, 'critical', 'high', 'medium', 'low'];

-- Assignment
DEFINE FIELD assignee ON itsm_ticket TYPE option<string>;
DEFINE FIELD assignment_group ON itsm_ticket TYPE option<string>;
DEFINE FIELD reporter ON itsm_ticket TYPE option<string>;

-- SLA tracking
DEFINE FIELD sla_due ON itsm_ticket TYPE option<datetime>;
DEFINE FIELD sla_status ON itsm_ticket TYPE option<string>
    ASSERT $value IN [NONE, 'on_track', 'at_risk', 'breached'];

-- Related assets
DEFINE FIELD affected_assets ON itsm_ticket TYPE array DEFAULT [];
DEFINE FIELD related_alerts ON itsm_ticket TYPE array DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON itsm_ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON itsm_ticket TYPE datetime DEFAULT time::now();
DEFINE FIELD resolved_at ON itsm_ticket TYPE option<datetime>;
DEFINE FIELD closed_at ON itsm_ticket TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_ticket_number ON itsm_ticket FIELDS ticket_number UNIQUE;
DEFINE INDEX idx_ticket_status ON itsm_ticket FIELDS status;
DEFINE INDEX idx_ticket_priority ON itsm_ticket FIELDS priority;
DEFINE INDEX idx_ticket_assignee ON itsm_ticket FIELDS assignee;
DEFINE INDEX idx_ticket_sla ON itsm_ticket FIELDS sla_due, sla_status;

-- ============================================================================
-- END OF CORE SCHEMA
-- ============================================================================
