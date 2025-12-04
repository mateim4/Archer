-- ============================================================================
-- ARCHER INFRASTRUCTURE SCHEMA - NUTANIX
-- ============================================================================
-- Version: 2.0
-- Date: December 4, 2025
-- Description: Nutanix Hyperconverged Infrastructure objects
-- 
-- Hierarchy:
--   Prism Central -> Clusters -> Hosts -> VMs
--                             -> Storage Pools -> Containers -> vDisks
--                             -> Networks
-- ============================================================================

USE NS archer;
USE DB infrastructure;

-- ============================================================================
-- NUTANIX MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_prism_central: Multi-cluster management platform
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_prism_central SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_prism_central TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_prism_central TYPE string;
DEFINE FIELD version ON nutanix_prism_central TYPE option<string>;
DEFINE FIELD ip_address ON nutanix_prism_central TYPE option<string>;
DEFINE FIELD fqdn ON nutanix_prism_central TYPE option<string>;
DEFINE FIELD management_vip ON nutanix_prism_central TYPE option<string>;

-- Status
DEFINE FIELD status ON nutanix_prism_central TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'unknown'];
DEFINE FIELD cluster_count ON nutanix_prism_central TYPE option<int>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_prism_central TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_prism_central TYPE datetime DEFAULT time::now();
DEFINE FIELD last_sync ON nutanix_prism_central TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_pc_uuid ON nutanix_prism_central FIELDS uuid UNIQUE;
DEFINE INDEX idx_pc_ip ON nutanix_prism_central FIELDS ip_address;

-- ============================================================================
-- NUTANIX COMPUTE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_cluster: HCI Cluster
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_cluster SCHEMAFULL;

-- Identifiers
DEFINE FIELD uuid ON nutanix_cluster TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_cluster TYPE string;
DEFINE FIELD cluster_external_subnet ON nutanix_cluster TYPE option<string>;

-- Configuration
DEFINE FIELD cluster_architecture ON nutanix_cluster TYPE option<string>; -- X86, ARM
DEFINE FIELD hypervisor_type ON nutanix_cluster TYPE option<string>; -- AHV, ESXi, Hyper-V
DEFINE FIELD storage_type ON nutanix_cluster TYPE option<string>;
DEFINE FIELD timezone ON nutanix_cluster TYPE option<string>;
DEFINE FIELD version ON nutanix_cluster TYPE option<string>;
DEFINE FIELD ncc_version ON nutanix_cluster TYPE option<string>;

-- Data protection
DEFINE FIELD redundancy_factor ON nutanix_cluster TYPE option<int>; -- RF2 or RF3
DEFINE FIELD desired_redundancy_factor ON nutanix_cluster TYPE option<int>;
DEFINE FIELD fault_tolerance_domain ON nutanix_cluster TYPE option<string>;

-- Features
DEFINE FIELD compression_enabled ON nutanix_cluster TYPE option<bool>;
DEFINE FIELD deduplication_enabled ON nutanix_cluster TYPE option<bool>;
DEFINE FIELD erasure_coding_enabled ON nutanix_cluster TYPE option<bool>;

-- Networking
DEFINE FIELD cluster_vip ON nutanix_cluster TYPE option<string>;
DEFINE FIELD cluster_data_services_ip ON nutanix_cluster TYPE option<string>;
DEFINE FIELD external_subnet ON nutanix_cluster TYPE option<string>;
DEFINE FIELD internal_subnet ON nutanix_cluster TYPE option<string>;
DEFINE FIELD nfs_subnet_whitelist ON nutanix_cluster TYPE array DEFAULT [];

-- Metrics
DEFINE FIELD cpu_capacity_hz ON nutanix_cluster TYPE option<int>;
DEFINE FIELD cpu_usage_hz ON nutanix_cluster TYPE option<int>;
DEFINE FIELD cpu_utilization_pct ON nutanix_cluster TYPE option<float>;
DEFINE FIELD memory_capacity_bytes ON nutanix_cluster TYPE option<int>;
DEFINE FIELD memory_usage_bytes ON nutanix_cluster TYPE option<int>;
DEFINE FIELD memory_utilization_pct ON nutanix_cluster TYPE option<float>;
DEFINE FIELD storage_capacity_bytes ON nutanix_cluster TYPE option<int>;
DEFINE FIELD storage_usage_bytes ON nutanix_cluster TYPE option<int>;
DEFINE FIELD storage_utilization_pct ON nutanix_cluster TYPE option<float>;

-- Counts
DEFINE FIELD host_count ON nutanix_cluster TYPE option<int>;
DEFINE FIELD vm_count ON nutanix_cluster TYPE option<int>;

-- Relationships
DEFINE FIELD prism_central ON nutanix_cluster TYPE option<record<nutanix_prism_central>>;

-- Status
DEFINE FIELD status ON nutanix_cluster TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'critical', 'unknown'];

-- Timestamps
DEFINE FIELD created_at ON nutanix_cluster TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_cluster TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_cluster_uuid ON nutanix_cluster FIELDS uuid UNIQUE;
DEFINE INDEX idx_cluster_name ON nutanix_cluster FIELDS name;
DEFINE INDEX idx_cluster_pc ON nutanix_cluster FIELDS prism_central;

-- ----------------------------------------------------------------------------
-- nutanix_host: Physical node in cluster
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_host SCHEMAFULL;

-- Identifiers
DEFINE FIELD uuid ON nutanix_host TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_host TYPE string;
DEFINE FIELD serial_number ON nutanix_host TYPE option<string>;
DEFINE FIELD block_serial ON nutanix_host TYPE option<string>;
DEFINE FIELD block_model ON nutanix_host TYPE option<string>;
DEFINE FIELD node_position ON nutanix_host TYPE option<string>;

-- Hardware
DEFINE FIELD model ON nutanix_host TYPE option<string>;
DEFINE FIELD cpu_model ON nutanix_host TYPE option<string>;
DEFINE FIELD cpu_sockets ON nutanix_host TYPE option<int>;
DEFINE FIELD cpu_cores ON nutanix_host TYPE option<int>;
DEFINE FIELD cpu_threads ON nutanix_host TYPE option<int>;
DEFINE FIELD cpu_frequency_hz ON nutanix_host TYPE option<int>;
DEFINE FIELD memory_capacity_bytes ON nutanix_host TYPE option<int>;
DEFINE FIELD bios_version ON nutanix_host TYPE option<string>;
DEFINE FIELD bmc_version ON nutanix_host TYPE option<string>;

-- Hypervisor
DEFINE FIELD hypervisor_type ON nutanix_host TYPE option<string>; -- AHV, ESXi, Hyper-V
DEFINE FIELD hypervisor_version ON nutanix_host TYPE option<string>;
DEFINE FIELD hypervisor_full_name ON nutanix_host TYPE option<string>;

-- Networking
DEFINE FIELD management_ip ON nutanix_host TYPE option<string>;
DEFINE FIELD hypervisor_ip ON nutanix_host TYPE option<string>;
DEFINE FIELD ipmi_ip ON nutanix_host TYPE option<string>;
DEFINE FIELD cvm_ip ON nutanix_host TYPE option<string>;

-- Status
DEFINE FIELD host_status ON nutanix_host TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['normal', 'degraded', 'critical', 'maintenance', 'unknown'];
DEFINE FIELD acropolis_connection_state ON nutanix_host TYPE option<string>;
DEFINE FIELD metadata_store_status ON nutanix_host TYPE option<string>;
DEFINE FIELD is_degraded ON nutanix_host TYPE option<bool>;
DEFINE FIELD is_secure_booted ON nutanix_host TYPE option<bool>;

-- Metrics
DEFINE FIELD cpu_usage_hz ON nutanix_host TYPE option<int>;
DEFINE FIELD cpu_utilization_pct ON nutanix_host TYPE option<float>;
DEFINE FIELD memory_usage_bytes ON nutanix_host TYPE option<int>;
DEFINE FIELD memory_utilization_pct ON nutanix_host TYPE option<float>;
DEFINE FIELD vm_count ON nutanix_host TYPE option<int>;

-- GPU
DEFINE FIELD gpu_list ON nutanix_host TYPE array DEFAULT [];
DEFINE FIELD gpu_driver_version ON nutanix_host TYPE option<string>;

-- Relationships
DEFINE FIELD cluster ON nutanix_host TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_host TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_host TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_host_uuid ON nutanix_host FIELDS uuid UNIQUE;
DEFINE INDEX idx_host_serial ON nutanix_host FIELDS serial_number;
DEFINE INDEX idx_host_cluster ON nutanix_host FIELDS cluster;
DEFINE INDEX idx_host_mgmt_ip ON nutanix_host FIELDS management_ip;

-- ----------------------------------------------------------------------------
-- nutanix_cvm: Controller Virtual Machine
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_cvm SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_cvm TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_cvm TYPE option<string>;
DEFINE FIELD ip_address ON nutanix_cvm TYPE option<string>;
DEFINE FIELD external_ip ON nutanix_cvm TYPE option<string>;

-- Configuration
DEFINE FIELD version ON nutanix_cvm TYPE option<string>;
DEFINE FIELD memory_capacity_bytes ON nutanix_cvm TYPE option<int>;
DEFINE FIELD vcpu_count ON nutanix_cvm TYPE option<int>;

-- Status
DEFINE FIELD cvm_state ON nutanix_cvm TYPE option<string>;
DEFINE FIELD maintenance_mode ON nutanix_cvm TYPE option<bool>;

-- Services
DEFINE FIELD services_running ON nutanix_cvm TYPE array DEFAULT [];

-- Relationships
DEFINE FIELD host ON nutanix_cvm TYPE option<record<nutanix_host>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_cvm TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_cvm TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_cvm_uuid ON nutanix_cvm FIELDS uuid UNIQUE;
DEFINE INDEX idx_cvm_ip ON nutanix_cvm FIELDS ip_address;
DEFINE INDEX idx_cvm_host ON nutanix_cvm FIELDS host;

-- ----------------------------------------------------------------------------
-- nutanix_vm: Virtual Machine
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_vm SCHEMAFULL;

-- Identifiers
DEFINE FIELD uuid ON nutanix_vm TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_vm TYPE string;
DEFINE FIELD description ON nutanix_vm TYPE option<string>;

-- Power state
DEFINE FIELD power_state ON nutanix_vm TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['on', 'off', 'paused', 'suspended', 'unknown'];

-- Compute resources
DEFINE FIELD vcpu_count ON nutanix_vm TYPE option<int>;
DEFINE FIELD cores_per_vcpu ON nutanix_vm TYPE option<int>;
DEFINE FIELD memory_capacity_bytes ON nutanix_vm TYPE option<int>;
DEFINE FIELD memory_capacity_gb ON nutanix_vm TYPE option<float>;

-- CPU configuration
DEFINE FIELD cpu_model ON nutanix_vm TYPE option<string>;
DEFINE FIELD cpu_passthrough ON nutanix_vm TYPE option<bool>;
DEFINE FIELD hardware_virtualization ON nutanix_vm TYPE option<bool>;

-- Networking
DEFINE FIELD ip_addresses ON nutanix_vm TYPE array DEFAULT [];
DEFINE FIELD mac_addresses ON nutanix_vm TYPE array DEFAULT [];
DEFINE FIELD nic_count ON nutanix_vm TYPE option<int>;

-- Storage
DEFINE FIELD disk_count ON nutanix_vm TYPE option<int>;
DEFINE FIELD disk_capacity_bytes ON nutanix_vm TYPE option<int>;

-- Guest OS
DEFINE FIELD guest_os ON nutanix_vm TYPE option<string>;
DEFINE FIELD guest_os_version ON nutanix_vm TYPE option<string>;
DEFINE FIELD nutanix_guest_tools_version ON nutanix_vm TYPE option<string>;
DEFINE FIELD nutanix_guest_tools_enabled ON nutanix_vm TYPE option<bool>;
DEFINE FIELD nutanix_guest_tools_mount ON nutanix_vm TYPE option<bool>;

-- Protection
DEFINE FIELD protection_type ON nutanix_vm TYPE option<string>;
DEFINE FIELD protection_domain ON nutanix_vm TYPE option<string>;
DEFINE FIELD snapshot_count ON nutanix_vm TYPE option<int>;

-- Categories (Prism Central)
DEFINE FIELD categories ON nutanix_vm TYPE array DEFAULT [];

-- Machine type
DEFINE FIELD machine_type ON nutanix_vm TYPE option<string>; -- PC, Q35
DEFINE FIELD boot_config ON nutanix_vm TYPE option<object>;
DEFINE FIELD is_agent_vm ON nutanix_vm TYPE option<bool>;

-- vGPU
DEFINE FIELD gpu_list ON nutanix_vm TYPE array DEFAULT [];

-- Metrics
DEFINE FIELD cpu_usage_pct ON nutanix_vm TYPE option<float>;
DEFINE FIELD memory_usage_pct ON nutanix_vm TYPE option<float>;
DEFINE FIELD iops ON nutanix_vm TYPE option<int>;
DEFINE FIELD throughput_kbps ON nutanix_vm TYPE option<int>;

-- Relationships
DEFINE FIELD host ON nutanix_vm TYPE option<record<nutanix_host>>;
DEFINE FIELD cluster ON nutanix_vm TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_vm TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_vm TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_vm_uuid ON nutanix_vm FIELDS uuid UNIQUE;
DEFINE INDEX idx_vm_name ON nutanix_vm FIELDS name;
DEFINE INDEX idx_vm_power ON nutanix_vm FIELDS power_state;
DEFINE INDEX idx_vm_host ON nutanix_vm FIELDS host;
DEFINE INDEX idx_vm_cluster ON nutanix_vm FIELDS cluster;

-- ============================================================================
-- NUTANIX STORAGE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_storage_pool: Physical disk pool
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_storage_pool SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_storage_pool TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_storage_pool TYPE string;

-- Capacity
DEFINE FIELD capacity_bytes ON nutanix_storage_pool TYPE option<int>;
DEFINE FIELD usage_bytes ON nutanix_storage_pool TYPE option<int>;
DEFINE FIELD free_bytes ON nutanix_storage_pool TYPE option<int>;

-- Configuration
DEFINE FIELD disk_type ON nutanix_storage_pool TYPE option<string>; -- SSD, HDD, NVMe
DEFINE FIELD tier_name ON nutanix_storage_pool TYPE option<string>;

-- Features
DEFINE FIELD compression_enabled ON nutanix_storage_pool TYPE option<bool>;
DEFINE FIELD deduplication_enabled ON nutanix_storage_pool TYPE option<bool>;

-- Status
DEFINE FIELD status ON nutanix_storage_pool TYPE option<string>;

-- Relationships
DEFINE FIELD cluster ON nutanix_storage_pool TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_storage_pool TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_storage_pool TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_pool_uuid ON nutanix_storage_pool FIELDS uuid UNIQUE;
DEFINE INDEX idx_pool_cluster ON nutanix_storage_pool FIELDS cluster;

-- ----------------------------------------------------------------------------
-- nutanix_storage_container: Logical storage container
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_storage_container SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_storage_container TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_storage_container TYPE string;

-- Capacity
DEFINE FIELD max_capacity_bytes ON nutanix_storage_container TYPE option<int>;
DEFINE FIELD advertised_capacity_bytes ON nutanix_storage_container TYPE option<int>;
DEFINE FIELD usage_bytes ON nutanix_storage_container TYPE option<int>;
DEFINE FIELD free_bytes ON nutanix_storage_container TYPE option<int>;

-- Data efficiency
DEFINE FIELD compression_enabled ON nutanix_storage_container TYPE option<bool>;
DEFINE FIELD compression_delay_secs ON nutanix_storage_container TYPE option<int>;
DEFINE FIELD on_disk_dedup_enabled ON nutanix_storage_container TYPE option<bool>;
DEFINE FIELD erasure_coding_enabled ON nutanix_storage_container TYPE option<bool>;
DEFINE FIELD cache_dedup_enabled ON nutanix_storage_container TYPE option<bool>;

-- Protection
DEFINE FIELD redundancy_factor ON nutanix_storage_container TYPE option<int>;
DEFINE FIELD oplog_replication_factor ON nutanix_storage_container TYPE option<int>;

-- NFS
DEFINE FIELD nfs_whitelist ON nutanix_storage_container TYPE array DEFAULT [];
DEFINE FIELD nfs_whitelist_inherited ON nutanix_storage_container TYPE option<bool>;

-- Relationships
DEFINE FIELD storage_pool ON nutanix_storage_container TYPE option<record<nutanix_storage_pool>>;
DEFINE FIELD cluster ON nutanix_storage_container TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_storage_container TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_storage_container TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_container_uuid ON nutanix_storage_container FIELDS uuid UNIQUE;
DEFINE INDEX idx_container_name ON nutanix_storage_container FIELDS name;
DEFINE INDEX idx_container_cluster ON nutanix_storage_container FIELDS cluster;

-- ----------------------------------------------------------------------------
-- nutanix_vdisk: Virtual disk
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_vdisk SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_vdisk TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_vdisk TYPE option<string>;
DEFINE FIELD disk_label ON nutanix_vdisk TYPE option<string>;

-- Size
DEFINE FIELD disk_size_bytes ON nutanix_vdisk TYPE option<int>;
DEFINE FIELD disk_size_gb ON nutanix_vdisk TYPE option<float>;

-- Configuration
DEFINE FIELD device_type ON nutanix_vdisk TYPE option<string>; -- DISK, CDROM
DEFINE FIELD device_bus ON nutanix_vdisk TYPE option<string>; -- SCSI, IDE, SATA, PCI
DEFINE FIELD device_index ON nutanix_vdisk TYPE option<int>;
DEFINE FIELD flash_mode_enabled ON nutanix_vdisk TYPE option<bool>;

-- Source
DEFINE FIELD source_image ON nutanix_vdisk TYPE option<record>;
DEFINE FIELD is_cdrom ON nutanix_vdisk TYPE option<bool>;
DEFINE FIELD is_empty ON nutanix_vdisk TYPE option<bool>;

-- Relationships
DEFINE FIELD storage_container ON nutanix_vdisk TYPE option<record<nutanix_storage_container>>;
DEFINE FIELD vm ON nutanix_vdisk TYPE option<record<nutanix_vm>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_vdisk TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_vdisk TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_vdisk_uuid ON nutanix_vdisk FIELDS uuid UNIQUE;
DEFINE INDEX idx_vdisk_vm ON nutanix_vdisk FIELDS vm;
DEFINE INDEX idx_vdisk_container ON nutanix_vdisk FIELDS storage_container;

-- ----------------------------------------------------------------------------
-- nutanix_volume_group: iSCSI/NVMe-oF volume group
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_volume_group SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_volume_group TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_volume_group TYPE string;
DEFINE FIELD description ON nutanix_volume_group TYPE option<string>;

-- Configuration
DEFINE FIELD iscsi_target_name ON nutanix_volume_group TYPE option<string>;
DEFINE FIELD iscsi_target_prefix ON nutanix_volume_group TYPE option<string>;
DEFINE FIELD load_balance_vm_attachments ON nutanix_volume_group TYPE option<bool>;
DEFINE FIELD flash_mode_enabled ON nutanix_volume_group TYPE option<bool>;
DEFINE FIELD enabled_authentications ON nutanix_volume_group TYPE array DEFAULT [];

-- Status
DEFINE FIELD attachment_count ON nutanix_volume_group TYPE option<int>;

-- Relationships
DEFINE FIELD cluster ON nutanix_volume_group TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_volume_group TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_volume_group TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_vg_uuid ON nutanix_volume_group FIELDS uuid UNIQUE;

-- ============================================================================
-- NUTANIX NETWORKING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_network: Virtual network (VLAN/subnet)
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_network SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_network TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_network TYPE string;
DEFINE FIELD description ON nutanix_network TYPE option<string>;

-- VLAN
DEFINE FIELD vlan_id ON nutanix_network TYPE option<int>;
DEFINE FIELD network_type ON nutanix_network TYPE option<string>; -- VLAN, overlay

-- IP Configuration
DEFINE FIELD ip_config_mode ON nutanix_network TYPE option<string>; -- DHCP, static
DEFINE FIELD subnet ON nutanix_network TYPE option<string>;
DEFINE FIELD prefix_length ON nutanix_network TYPE option<int>;
DEFINE FIELD gateway ON nutanix_network TYPE option<string>;
DEFINE FIELD dns_servers ON nutanix_network TYPE array DEFAULT [];
DEFINE FIELD dhcp_server_address ON nutanix_network TYPE option<string>;
DEFINE FIELD domain_name ON nutanix_network TYPE option<string>;

-- IP Pools
DEFINE FIELD ip_pools ON nutanix_network TYPE array DEFAULT [];

-- VPC (Flow)
DEFINE FIELD vpc_uuid ON nutanix_network TYPE option<string>;
DEFINE FIELD vpc_name ON nutanix_network TYPE option<string>;

-- Status
DEFINE FIELD is_external ON nutanix_network TYPE option<bool>;

-- Relationships
DEFINE FIELD cluster ON nutanix_network TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_network TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_network TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_network_uuid ON nutanix_network FIELDS uuid UNIQUE;
DEFINE INDEX idx_network_name ON nutanix_network FIELDS name;
DEFINE INDEX idx_network_vlan ON nutanix_network FIELDS vlan_id;
DEFINE INDEX idx_network_cluster ON nutanix_network FIELDS cluster;

-- ============================================================================
-- NUTANIX IMAGES AND TEMPLATES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_image: VM templates and ISOs
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_image SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_image TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_image TYPE string;
DEFINE FIELD description ON nutanix_image TYPE option<string>;

-- Type and format
DEFINE FIELD image_type ON nutanix_image TYPE option<string>; -- DISK_IMAGE, ISO_IMAGE
DEFINE FIELD source_uri ON nutanix_image TYPE option<string>;

-- Size
DEFINE FIELD size_bytes ON nutanix_image TYPE option<int>;
DEFINE FIELD checksum ON nutanix_image TYPE option<string>;
DEFINE FIELD checksum_type ON nutanix_image TYPE option<string>;

-- Status
DEFINE FIELD state ON nutanix_image TYPE option<string>; -- COMPLETE, ACTIVE, INACTIVE

-- Relationships
DEFINE FIELD storage_container ON nutanix_image TYPE option<record<nutanix_storage_container>>;
DEFINE FIELD cluster ON nutanix_image TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_image TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_image TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_image_uuid ON nutanix_image FIELDS uuid UNIQUE;
DEFINE INDEX idx_image_name ON nutanix_image FIELDS name;
DEFINE INDEX idx_image_type ON nutanix_image FIELDS image_type;

-- ============================================================================
-- NUTANIX DATA PROTECTION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_protection_domain: DR protection group
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_protection_domain SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_protection_domain TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_protection_domain TYPE string;

-- Status
DEFINE FIELD active ON nutanix_protection_domain TYPE option<bool>;
DEFINE FIELD pending_replication_count ON nutanix_protection_domain TYPE option<int>;
DEFINE FIELD ongoing_replication_count ON nutanix_protection_domain TYPE option<int>;
DEFINE FIELD written_bytes ON nutanix_protection_domain TYPE option<int>;

-- Schedule
DEFINE FIELD schedules ON nutanix_protection_domain TYPE array DEFAULT [];
DEFINE FIELD remote_site_names ON nutanix_protection_domain TYPE array DEFAULT [];

-- RPO/RTO
DEFINE FIELD min_snapshot_to_retain ON nutanix_protection_domain TYPE option<int>;
DEFINE FIELD replication_links ON nutanix_protection_domain TYPE array DEFAULT [];

-- Counts
DEFINE FIELD vm_count ON nutanix_protection_domain TYPE option<int>;
DEFINE FIELD vg_count ON nutanix_protection_domain TYPE option<int>;

-- Relationships
DEFINE FIELD cluster ON nutanix_protection_domain TYPE option<record<nutanix_cluster>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_protection_domain TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_protection_domain TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_pd_uuid ON nutanix_protection_domain FIELDS uuid UNIQUE;
DEFINE INDEX idx_pd_name ON nutanix_protection_domain FIELDS name;
DEFINE INDEX idx_pd_cluster ON nutanix_protection_domain FIELDS cluster;

-- ----------------------------------------------------------------------------
-- nutanix_snapshot: VM/Volume Group snapshot
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_snapshot SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_snapshot TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON nutanix_snapshot TYPE option<string>;
DEFINE FIELD description ON nutanix_snapshot TYPE option<string>;

-- Type
DEFINE FIELD snapshot_type ON nutanix_snapshot TYPE option<string>; -- VM, VG, CRASH_CONSISTENT, APP_CONSISTENT

-- Source
DEFINE FIELD vm ON nutanix_snapshot TYPE option<record<nutanix_vm>>;
DEFINE FIELD volume_group ON nutanix_snapshot TYPE option<record<nutanix_volume_group>>;

-- Timestamps
DEFINE FIELD snapshot_time ON nutanix_snapshot TYPE option<datetime>;
DEFINE FIELD expiration_time ON nutanix_snapshot TYPE option<datetime>;
DEFINE FIELD created_at ON nutanix_snapshot TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_snap_uuid ON nutanix_snapshot FIELDS uuid UNIQUE;
DEFINE INDEX idx_snap_vm ON nutanix_snapshot FIELDS vm;

-- ============================================================================
-- NUTANIX PHYSICAL DISKS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- nutanix_disk: Physical disk in host
-- ----------------------------------------------------------------------------
DEFINE TABLE nutanix_disk SCHEMAFULL;

DEFINE FIELD uuid ON nutanix_disk TYPE string ASSERT $value != NONE;
DEFINE FIELD disk_id ON nutanix_disk TYPE option<string>;
DEFINE FIELD serial_number ON nutanix_disk TYPE option<string>;

-- Hardware
DEFINE FIELD model ON nutanix_disk TYPE option<string>;
DEFINE FIELD vendor ON nutanix_disk TYPE option<string>;
DEFINE FIELD firmware_version ON nutanix_disk TYPE option<string>;

-- Type and tier
DEFINE FIELD disk_type ON nutanix_disk TYPE option<string>; -- SSD, HDD, NVMe
DEFINE FIELD storage_tier ON nutanix_disk TYPE option<string>;

-- Size
DEFINE FIELD disk_size_bytes ON nutanix_disk TYPE option<int>;

-- Location
DEFINE FIELD location ON nutanix_disk TYPE option<int>; -- Slot number
DEFINE FIELD mount_path ON nutanix_disk TYPE option<string>;

-- Status
DEFINE FIELD disk_status ON nutanix_disk TYPE option<string>;
DEFINE FIELD online ON nutanix_disk TYPE option<bool>;

-- Relationships
DEFINE FIELD host ON nutanix_disk TYPE option<record<nutanix_host>>;
DEFINE FIELD storage_pool ON nutanix_disk TYPE option<record<nutanix_storage_pool>>;

-- Timestamps
DEFINE FIELD created_at ON nutanix_disk TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON nutanix_disk TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_disk_uuid ON nutanix_disk FIELDS uuid UNIQUE;
DEFINE INDEX idx_disk_serial ON nutanix_disk FIELDS serial_number;
DEFINE INDEX idx_disk_host ON nutanix_disk FIELDS host;

-- ============================================================================
-- END OF NUTANIX SCHEMA
-- ============================================================================
