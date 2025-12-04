-- ============================================================================
-- LCMDesigner - Backup & KVM Infrastructure Schema
-- Veeam Backup + Avocent KVM
-- ============================================================================

-- ============================================================================
-- VEEAM - BACKUP SERVER
-- ============================================================================

DEFINE TABLE veeam_server SCHEMAFULL;

DEFINE FIELD name ON veeam_server TYPE string;
DEFINE FIELD hostname ON veeam_server TYPE string;
DEFINE FIELD ip_address ON veeam_server TYPE string;
DEFINE FIELD version ON veeam_server TYPE string; -- 11, 12
DEFINE FIELD build ON veeam_server TYPE option<string>;
DEFINE FIELD edition ON veeam_server TYPE string; -- Community, Standard, Enterprise, Enterprise Plus
DEFINE FIELD database_server ON veeam_server TYPE option<string>;
DEFINE FIELD database_name ON veeam_server TYPE string DEFAULT "VeeamBackup";

-- Licensing
DEFINE FIELD license_type ON veeam_server TYPE string; -- Socket, Instance, VUL
DEFINE FIELD license_expiry ON veeam_server TYPE option<datetime>;
DEFINE FIELD licensed_sockets ON veeam_server TYPE option<int>;
DEFINE FIELD licensed_instances ON veeam_server TYPE option<int>;
DEFINE FIELD used_sockets ON veeam_server TYPE int DEFAULT 0;
DEFINE FIELD used_instances ON veeam_server TYPE int DEFAULT 0;

-- Statistics
DEFINE FIELD managed_server_count ON veeam_server TYPE int DEFAULT 0;
DEFINE FIELD repository_count ON veeam_server TYPE int DEFAULT 0;
DEFINE FIELD job_count ON veeam_server TYPE int DEFAULT 0;
DEFINE FIELD protected_vm_count ON veeam_server TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON veeam_server TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON veeam_server TYPE string DEFAULT "active";
DEFINE FIELD created_at ON veeam_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_srv_name ON veeam_server FIELDS name;
DEFINE INDEX idx_veeam_srv_hostname ON veeam_server FIELDS hostname;

-- ============================================================================
-- VEEAM - PROXY SERVER
-- ============================================================================

DEFINE TABLE veeam_proxy SCHEMAFULL;

DEFINE FIELD veeam_server ON veeam_proxy TYPE record<veeam_server>;
DEFINE FIELD name ON veeam_proxy TYPE string;
DEFINE FIELD hostname ON veeam_proxy TYPE string;
DEFINE FIELD ip_address ON veeam_proxy TYPE string;
DEFINE FIELD proxy_type ON veeam_proxy TYPE string; -- VMware, HyperV, Off-host, NAS
DEFINE FIELD transport_mode ON veeam_proxy TYPE string DEFAULT "Auto"; -- Auto, DirectStorageAccess, VirtualAppliance, Network
DEFINE FIELD max_concurrent_tasks ON veeam_proxy TYPE int DEFAULT 2;
DEFINE FIELD connected_datastore ON veeam_proxy TYPE option<string>;

-- Resources
DEFINE FIELD cpu_cores ON veeam_proxy TYPE option<int>;
DEFINE FIELD memory_gb ON veeam_proxy TYPE option<int>;

-- CMDB Reference
DEFINE FIELD cmdb_server ON veeam_proxy TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON veeam_proxy TYPE string DEFAULT "available";
DEFINE FIELD created_at ON veeam_proxy TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_proxy TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_proxy_srv ON veeam_proxy FIELDS veeam_server;
DEFINE INDEX idx_veeam_proxy_name ON veeam_proxy FIELDS name;

-- ============================================================================
-- VEEAM - REPOSITORY
-- ============================================================================

DEFINE TABLE veeam_repository SCHEMAFULL;

DEFINE FIELD veeam_server ON veeam_repository TYPE record<veeam_server>;
DEFINE FIELD name ON veeam_repository TYPE string;
DEFINE FIELD description ON veeam_repository TYPE option<string>;
DEFINE FIELD repository_type ON veeam_repository TYPE string; -- Windows, Linux, SMB, NFS, Dedup, Object, SOBR
DEFINE FIELD path ON veeam_repository TYPE string;
DEFINE FIELD host ON veeam_repository TYPE option<string>;

-- Capacity
DEFINE FIELD capacity_gb ON veeam_repository TYPE float;
DEFINE FIELD free_space_gb ON veeam_repository TYPE float;
DEFINE FIELD used_space_gb ON veeam_repository TYPE float DEFAULT 0;

-- Settings
DEFINE FIELD max_concurrent_tasks ON veeam_repository TYPE int DEFAULT 4;
DEFINE FIELD decompress_before_storing ON veeam_repository TYPE bool DEFAULT true;
DEFINE FIELD align_data_blocks ON veeam_repository TYPE bool DEFAULT true;
DEFINE FIELD use_per_vm_backup_files ON veeam_repository TYPE bool DEFAULT true;
DEFINE FIELD immutability_enabled ON veeam_repository TYPE bool DEFAULT false;
DEFINE FIELD immutability_days ON veeam_repository TYPE option<int>;

-- Encryption
DEFINE FIELD encryption_enabled ON veeam_repository TYPE bool DEFAULT false;

-- SOBR (Scale-Out Backup Repository) Settings
DEFINE FIELD is_sobr ON veeam_repository TYPE bool DEFAULT false;
DEFINE FIELD sobr_performance_tier ON veeam_repository TYPE array<record<veeam_repository>> DEFAULT [];
DEFINE FIELD sobr_capacity_tier ON veeam_repository TYPE option<record<veeam_repository>>;
DEFINE FIELD sobr_archive_tier ON veeam_repository TYPE option<record<veeam_repository>>;

-- Audit
DEFINE FIELD status ON veeam_repository TYPE string DEFAULT "available";
DEFINE FIELD created_at ON veeam_repository TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_repository TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_repo_srv ON veeam_repository FIELDS veeam_server;
DEFINE INDEX idx_veeam_repo_name ON veeam_repository FIELDS name;
DEFINE INDEX idx_veeam_repo_type ON veeam_repository FIELDS repository_type;

-- ============================================================================
-- VEEAM - MANAGED SERVER (Virtualization Platform)
-- ============================================================================

DEFINE TABLE veeam_managed_server SCHEMAFULL;

DEFINE FIELD veeam_server ON veeam_managed_server TYPE record<veeam_server>;
DEFINE FIELD name ON veeam_managed_server TYPE string;
DEFINE FIELD hostname ON veeam_managed_server TYPE string;
DEFINE FIELD server_type ON veeam_managed_server TYPE string; -- vCenter, ESXi, HyperVHost, HyperVCluster, SCVMM, Nutanix
DEFINE FIELD api_version ON veeam_managed_server TYPE option<string>;
DEFINE FIELD protected_vm_count ON veeam_managed_server TYPE int DEFAULT 0;

-- Connection
DEFINE FIELD port ON veeam_managed_server TYPE int DEFAULT 443;
DEFINE FIELD credential ON veeam_managed_server TYPE option<string>;

-- Reference to source platform
DEFINE FIELD nutanix_prism ON veeam_managed_server TYPE option<record<nutanix_prism_central>>;

-- Audit
DEFINE FIELD status ON veeam_managed_server TYPE string DEFAULT "connected";
DEFINE FIELD last_sync ON veeam_managed_server TYPE option<datetime>;
DEFINE FIELD created_at ON veeam_managed_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_managed_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_ms_srv ON veeam_managed_server FIELDS veeam_server;
DEFINE INDEX idx_veeam_ms_name ON veeam_managed_server FIELDS name;

-- ============================================================================
-- VEEAM - BACKUP JOB
-- ============================================================================

DEFINE TABLE veeam_job SCHEMAFULL;

DEFINE FIELD veeam_server ON veeam_job TYPE record<veeam_server>;
DEFINE FIELD name ON veeam_job TYPE string;
DEFINE FIELD description ON veeam_job TYPE option<string>;
DEFINE FIELD job_type ON veeam_job TYPE string; -- Backup, Replication, Copy, Tape, SureBackup, Agent
DEFINE FIELD target_repository ON veeam_job TYPE option<record<veeam_repository>>;

-- Schedule
DEFINE FIELD schedule_enabled ON veeam_job TYPE bool DEFAULT true;
DEFINE FIELD schedule_type ON veeam_job TYPE string DEFAULT "Daily"; -- Daily, Monthly, Periodically, Continuous, AfterJob
DEFINE FIELD schedule_time ON veeam_job TYPE option<string>;
DEFINE FIELD schedule_days ON veeam_job TYPE array<string> DEFAULT [];
DEFINE FIELD retry_enabled ON veeam_job TYPE bool DEFAULT true;
DEFINE FIELD retry_count ON veeam_job TYPE int DEFAULT 3;
DEFINE FIELD retry_wait_minutes ON veeam_job TYPE int DEFAULT 10;

-- Backup Options
DEFINE FIELD backup_mode ON veeam_job TYPE string DEFAULT "Incremental"; -- Full, Incremental, ReverseIncremental
DEFINE FIELD synthetic_full_enabled ON veeam_job TYPE bool DEFAULT false;
DEFINE FIELD active_full_enabled ON veeam_job TYPE bool DEFAULT false;
DEFINE FIELD active_full_schedule ON veeam_job TYPE option<string>;

-- Retention
DEFINE FIELD retention_type ON veeam_job TYPE string DEFAULT "Days"; -- Days, RestorePoints
DEFINE FIELD retention_value ON veeam_job TYPE int DEFAULT 14;
DEFINE FIELD gfs_enabled ON veeam_job TYPE bool DEFAULT false;
DEFINE FIELD gfs_weekly ON veeam_job TYPE option<int>;
DEFINE FIELD gfs_monthly ON veeam_job TYPE option<int>;
DEFINE FIELD gfs_yearly ON veeam_job TYPE option<int>;

-- Objects
DEFINE FIELD vm_objects ON veeam_job TYPE array<string> DEFAULT [];
DEFINE FIELD exclusions ON veeam_job TYPE array<string> DEFAULT [];

-- Status
DEFINE FIELD last_run ON veeam_job TYPE option<datetime>;
DEFINE FIELD last_result ON veeam_job TYPE option<string>; -- Success, Warning, Failed, None
DEFINE FIELD next_run ON veeam_job TYPE option<datetime>;
DEFINE FIELD is_running ON veeam_job TYPE bool DEFAULT false;

-- Audit
DEFINE FIELD enabled ON veeam_job TYPE bool DEFAULT true;
DEFINE FIELD created_at ON veeam_job TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_job TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_job_srv ON veeam_job FIELDS veeam_server;
DEFINE INDEX idx_veeam_job_name ON veeam_job FIELDS name;
DEFINE INDEX idx_veeam_job_type ON veeam_job FIELDS job_type;
DEFINE INDEX idx_veeam_job_repo ON veeam_job FIELDS target_repository;

-- ============================================================================
-- VEEAM - BACKUP SESSION (Job Run)
-- ============================================================================

DEFINE TABLE veeam_session SCHEMAFULL;

DEFINE FIELD job ON veeam_session TYPE record<veeam_job>;
DEFINE FIELD session_id ON veeam_session TYPE string;
DEFINE FIELD session_type ON veeam_session TYPE string; -- Full, Incremental, Retry
DEFINE FIELD start_time ON veeam_session TYPE datetime;
DEFINE FIELD end_time ON veeam_session TYPE option<datetime>;
DEFINE FIELD progress ON veeam_session TYPE int DEFAULT 0;
DEFINE FIELD result ON veeam_session TYPE string DEFAULT "Running"; -- Success, Warning, Failed, Running
DEFINE FIELD reason ON veeam_session TYPE option<string>;

-- Statistics
DEFINE FIELD processed_objects ON veeam_session TYPE int DEFAULT 0;
DEFINE FIELD total_objects ON veeam_session TYPE int DEFAULT 0;
DEFINE FIELD read_gb ON veeam_session TYPE float DEFAULT 0;
DEFINE FIELD transferred_gb ON veeam_session TYPE float DEFAULT 0;
DEFINE FIELD bottleneck ON veeam_session TYPE option<string>; -- Source, Proxy, Network, Target

DEFINE FIELD created_at ON veeam_session TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_session TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_sess_job ON veeam_session FIELDS job;
DEFINE INDEX idx_veeam_sess_start ON veeam_session FIELDS start_time;
DEFINE INDEX idx_veeam_sess_result ON veeam_session FIELDS result;

-- ============================================================================
-- VEEAM - RESTORE POINT
-- ============================================================================

DEFINE TABLE veeam_restore_point SCHEMAFULL;

DEFINE FIELD job ON veeam_restore_point TYPE record<veeam_job>;
DEFINE FIELD repository ON veeam_restore_point TYPE record<veeam_repository>;
DEFINE FIELD vm_name ON veeam_restore_point TYPE string;
DEFINE FIELD restore_point_id ON veeam_restore_point TYPE string;
DEFINE FIELD creation_time ON veeam_restore_point TYPE datetime;
DEFINE FIELD backup_type ON veeam_restore_point TYPE string; -- Full, Increment
DEFINE FIELD is_consistent ON veeam_restore_point TYPE bool DEFAULT true;
DEFINE FIELD is_corrupted ON veeam_restore_point TYPE bool DEFAULT false;
DEFINE FIELD backup_size_gb ON veeam_restore_point TYPE float;
DEFINE FIELD data_size_gb ON veeam_restore_point TYPE float;
DEFINE FIELD dedup_ratio ON veeam_restore_point TYPE option<float>;
DEFINE FIELD compression_ratio ON veeam_restore_point TYPE option<float>;

-- GFS
DEFINE FIELD is_gfs_full ON veeam_restore_point TYPE bool DEFAULT false;
DEFINE FIELD gfs_period ON veeam_restore_point TYPE option<string>; -- Weekly, Monthly, Yearly

DEFINE FIELD created_at ON veeam_restore_point TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_rp_job ON veeam_restore_point FIELDS job;
DEFINE INDEX idx_veeam_rp_repo ON veeam_restore_point FIELDS repository;
DEFINE INDEX idx_veeam_rp_vm ON veeam_restore_point FIELDS vm_name;
DEFINE INDEX idx_veeam_rp_time ON veeam_restore_point FIELDS creation_time;

-- ============================================================================
-- VEEAM - PROTECTED VM
-- ============================================================================

DEFINE TABLE veeam_protected_vm SCHEMAFULL;

DEFINE FIELD veeam_server ON veeam_protected_vm TYPE record<veeam_server>;
DEFINE FIELD vm_name ON veeam_protected_vm TYPE string;
DEFINE FIELD vm_id ON veeam_protected_vm TYPE option<string>;
DEFINE FIELD platform ON veeam_protected_vm TYPE string; -- VMware, HyperV, Nutanix
DEFINE FIELD managed_server ON veeam_protected_vm TYPE option<record<veeam_managed_server>>;
DEFINE FIELD protection_jobs ON veeam_protected_vm TYPE array<record<veeam_job>> DEFAULT [];

-- Status
DEFINE FIELD last_backup ON veeam_protected_vm TYPE option<datetime>;
DEFINE FIELD last_backup_result ON veeam_protected_vm TYPE option<string>;
DEFINE FIELD restore_points_count ON veeam_protected_vm TYPE int DEFAULT 0;
DEFINE FIELD oldest_restore_point ON veeam_protected_vm TYPE option<datetime>;
DEFINE FIELD newest_restore_point ON veeam_protected_vm TYPE option<datetime>;
DEFINE FIELD total_backup_size_gb ON veeam_protected_vm TYPE float DEFAULT 0;

-- Reference to source VM
DEFINE FIELD nutanix_vm ON veeam_protected_vm TYPE option<record<nutanix_vm>>;

-- Audit
DEFINE FIELD created_at ON veeam_protected_vm TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON veeam_protected_vm TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_veeam_pvm_srv ON veeam_protected_vm FIELDS veeam_server;
DEFINE INDEX idx_veeam_pvm_name ON veeam_protected_vm FIELDS vm_name;

-- ============================================================================
-- AVOCENT - KVM SWITCH
-- ============================================================================

DEFINE TABLE avocent_kvm SCHEMAFULL;

DEFINE FIELD name ON avocent_kvm TYPE string;
DEFINE FIELD hostname ON avocent_kvm TYPE string;
DEFINE FIELD ip_address ON avocent_kvm TYPE string;
DEFINE FIELD model ON avocent_kvm TYPE string; -- MergePoint Unity, DSR, etc.
DEFINE FIELD serial_number ON avocent_kvm TYPE option<string>;
DEFINE FIELD firmware_version ON avocent_kvm TYPE string;
DEFINE FIELD total_ports ON avocent_kvm TYPE int;
DEFINE FIELD used_ports ON avocent_kvm TYPE int DEFAULT 0;

-- Networking
DEFINE FIELD management_vlan ON avocent_kvm TYPE option<int>;
DEFINE FIELD secondary_ip ON avocent_kvm TYPE option<string>;

-- Features
DEFINE FIELD is_digital ON avocent_kvm TYPE bool DEFAULT true;
DEFINE FIELD supports_virtual_media ON avocent_kvm TYPE bool DEFAULT true;
DEFINE FIELD supports_power_control ON avocent_kvm TYPE bool DEFAULT false;
DEFINE FIELD max_users ON avocent_kvm TYPE int DEFAULT 4;

-- Location
DEFINE FIELD location ON avocent_kvm TYPE option<string>;
DEFINE FIELD rack ON avocent_kvm TYPE option<string>;
DEFINE FIELD rack_position ON avocent_kvm TYPE option<int>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON avocent_kvm TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON avocent_kvm TYPE string DEFAULT "active";
DEFINE FIELD created_at ON avocent_kvm TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_kvm TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_kvm_name ON avocent_kvm FIELDS name;
DEFINE INDEX idx_avocent_kvm_hostname ON avocent_kvm FIELDS hostname;

-- ============================================================================
-- AVOCENT - KVM TARGET (Connected Server)
-- ============================================================================

DEFINE TABLE avocent_kvm_target SCHEMAFULL;

DEFINE FIELD kvm ON avocent_kvm_target TYPE record<avocent_kvm>;
DEFINE FIELD name ON avocent_kvm_target TYPE string;
DEFINE FIELD port ON avocent_kvm_target TYPE int;
DEFINE FIELD target_type ON avocent_kvm_target TYPE string DEFAULT "server"; -- server, pdu, console
DEFINE FIELD connection_path ON avocent_kvm_target TYPE option<string>; -- For cascaded switches
DEFINE FIELD is_cascaded ON avocent_kvm_target TYPE bool DEFAULT false;
DEFINE FIELD cascade_switch ON avocent_kvm_target TYPE option<record<avocent_kvm>>;

-- Virtual Media
DEFINE FIELD virtual_media_enabled ON avocent_kvm_target TYPE bool DEFAULT false;
DEFINE FIELD iso_mounted ON avocent_kvm_target TYPE option<string>;

-- Power Control
DEFINE FIELD power_control_enabled ON avocent_kvm_target TYPE bool DEFAULT false;
DEFINE FIELD pdu ON avocent_kvm_target TYPE option<record<avocent_pdu>>;
DEFINE FIELD pdu_outlet ON avocent_kvm_target TYPE option<int>;

-- CMDB Reference (the connected server)
DEFINE FIELD cmdb_server ON avocent_kvm_target TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON avocent_kvm_target TYPE string DEFAULT "online"; -- online, offline, maintenance
DEFINE FIELD last_accessed ON avocent_kvm_target TYPE option<datetime>;
DEFINE FIELD created_at ON avocent_kvm_target TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_kvm_target TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_target_kvm ON avocent_kvm_target FIELDS kvm;
DEFINE INDEX idx_avocent_target_port ON avocent_kvm_target FIELDS kvm, port UNIQUE;
DEFINE INDEX idx_avocent_target_name ON avocent_kvm_target FIELDS name;

-- ============================================================================
-- AVOCENT - PDU (Power Distribution Unit)
-- ============================================================================

DEFINE TABLE avocent_pdu SCHEMAFULL;

DEFINE FIELD name ON avocent_pdu TYPE string;
DEFINE FIELD hostname ON avocent_pdu TYPE string;
DEFINE FIELD ip_address ON avocent_pdu TYPE string;
DEFINE FIELD model ON avocent_pdu TYPE string; -- PM2000, PM3000, etc.
DEFINE FIELD serial_number ON avocent_pdu TYPE option<string>;
DEFINE FIELD firmware_version ON avocent_pdu TYPE string;

-- Power Characteristics
DEFINE FIELD phase_type ON avocent_pdu TYPE string; -- single, three
DEFINE FIELD voltage ON avocent_pdu TYPE int DEFAULT 208;
DEFINE FIELD max_amperage ON avocent_pdu TYPE float;
DEFINE FIELD current_load_amps ON avocent_pdu TYPE float DEFAULT 0;
DEFINE FIELD power_consumption_kw ON avocent_pdu TYPE float DEFAULT 0;

-- Outlets
DEFINE FIELD total_outlets ON avocent_pdu TYPE int;
DEFINE FIELD switched_outlets ON avocent_pdu TYPE int DEFAULT 0;
DEFINE FIELD metered_outlets ON avocent_pdu TYPE int DEFAULT 0;

-- Location
DEFINE FIELD location ON avocent_pdu TYPE option<string>;
DEFINE FIELD rack ON avocent_pdu TYPE option<string>;
DEFINE FIELD rack_position ON avocent_pdu TYPE option<string>; -- left, right

-- Associated KVM
DEFINE FIELD managed_by_kvm ON avocent_pdu TYPE option<record<avocent_kvm>>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON avocent_pdu TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON avocent_pdu TYPE string DEFAULT "active";
DEFINE FIELD created_at ON avocent_pdu TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_pdu TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_pdu_name ON avocent_pdu FIELDS name;
DEFINE INDEX idx_avocent_pdu_hostname ON avocent_pdu FIELDS hostname;

-- ============================================================================
-- AVOCENT - PDU OUTLET
-- ============================================================================

DEFINE TABLE avocent_pdu_outlet SCHEMAFULL;

DEFINE FIELD pdu ON avocent_pdu_outlet TYPE record<avocent_pdu>;
DEFINE FIELD outlet_number ON avocent_pdu_outlet TYPE int;
DEFINE FIELD name ON avocent_pdu_outlet TYPE option<string>;
DEFINE FIELD outlet_type ON avocent_pdu_outlet TYPE string DEFAULT "switched"; -- switched, metered, unswitched
DEFINE FIELD connector_type ON avocent_pdu_outlet TYPE string DEFAULT "C13"; -- C13, C19, 5-15R, etc.

-- Power State
DEFINE FIELD power_state ON avocent_pdu_outlet TYPE string DEFAULT "on"; -- on, off, pending-on, pending-off
DEFINE FIELD current_amps ON avocent_pdu_outlet TYPE float DEFAULT 0;
DEFINE FIELD power_watts ON avocent_pdu_outlet TYPE float DEFAULT 0;
DEFINE FIELD energy_kwh ON avocent_pdu_outlet TYPE float DEFAULT 0;

-- Control
DEFINE FIELD default_state ON avocent_pdu_outlet TYPE string DEFAULT "on"; -- on, off, last
DEFINE FIELD power_on_delay ON avocent_pdu_outlet TYPE int DEFAULT 0;

-- Connected Device
DEFINE FIELD connected_device ON avocent_pdu_outlet TYPE option<string>;
DEFINE FIELD cmdb_server ON avocent_pdu_outlet TYPE option<record<cmdb_server>>;

-- Audit
DEFINE FIELD status ON avocent_pdu_outlet TYPE string DEFAULT "normal";
DEFINE FIELD created_at ON avocent_pdu_outlet TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_pdu_outlet TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_outlet_pdu ON avocent_pdu_outlet FIELDS pdu;
DEFINE INDEX idx_avocent_outlet_num ON avocent_pdu_outlet FIELDS pdu, outlet_number UNIQUE;

-- ============================================================================
-- AVOCENT - CONSOLE SERVER (Serial Console)
-- ============================================================================

DEFINE TABLE avocent_console_server SCHEMAFULL;

DEFINE FIELD name ON avocent_console_server TYPE string;
DEFINE FIELD hostname ON avocent_console_server TYPE string;
DEFINE FIELD ip_address ON avocent_console_server TYPE string;
DEFINE FIELD model ON avocent_console_server TYPE string; -- ACS6000, ACS8000, etc.
DEFINE FIELD serial_number ON avocent_console_server TYPE option<string>;
DEFINE FIELD firmware_version ON avocent_console_server TYPE string;
DEFINE FIELD total_ports ON avocent_console_server TYPE int;
DEFINE FIELD used_ports ON avocent_console_server TYPE int DEFAULT 0;

-- Location
DEFINE FIELD location ON avocent_console_server TYPE option<string>;
DEFINE FIELD rack ON avocent_console_server TYPE option<string>;
DEFINE FIELD rack_position ON avocent_console_server TYPE option<int>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON avocent_console_server TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON avocent_console_server TYPE string DEFAULT "active";
DEFINE FIELD created_at ON avocent_console_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_console_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_cs_name ON avocent_console_server FIELDS name;
DEFINE INDEX idx_avocent_cs_hostname ON avocent_console_server FIELDS hostname;

-- ============================================================================
-- AVOCENT - CONSOLE PORT
-- ============================================================================

DEFINE TABLE avocent_console_port SCHEMAFULL;

DEFINE FIELD console_server ON avocent_console_port TYPE record<avocent_console_server>;
DEFINE FIELD port_number ON avocent_console_port TYPE int;
DEFINE FIELD name ON avocent_console_port TYPE option<string>;
DEFINE FIELD baud_rate ON avocent_console_port TYPE int DEFAULT 9600;
DEFINE FIELD data_bits ON avocent_console_port TYPE int DEFAULT 8;
DEFINE FIELD parity ON avocent_console_port TYPE string DEFAULT "none"; -- none, odd, even
DEFINE FIELD stop_bits ON avocent_console_port TYPE int DEFAULT 1;
DEFINE FIELD flow_control ON avocent_console_port TYPE string DEFAULT "none"; -- none, xon_xoff, rts_cts

-- SSH Access
DEFINE FIELD ssh_port ON avocent_console_port TYPE option<int>;
DEFINE FIELD telnet_port ON avocent_console_port TYPE option<int>;

-- Connected Device
DEFINE FIELD connected_device ON avocent_console_port TYPE option<string>;
DEFINE FIELD device_type ON avocent_console_port TYPE option<string>; -- server, switch, router, firewall
DEFINE FIELD cmdb_asset ON avocent_console_port TYPE option<record<cmdb_asset>>;

-- Logging
DEFINE FIELD logging_enabled ON avocent_console_port TYPE bool DEFAULT true;
DEFINE FIELD log_path ON avocent_console_port TYPE option<string>;

-- Audit
DEFINE FIELD status ON avocent_console_port TYPE string DEFAULT "idle"; -- idle, active, disconnected
DEFINE FIELD last_accessed ON avocent_console_port TYPE option<datetime>;
DEFINE FIELD created_at ON avocent_console_port TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON avocent_console_port TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_avocent_cp_cs ON avocent_console_port FIELDS console_server;
DEFINE INDEX idx_avocent_cp_num ON avocent_console_port FIELDS console_server, port_number UNIQUE;
