-- ============================================================================
-- ARCHER INFRASTRUCTURE SCHEMA - CISCO
-- ============================================================================
-- Version: 2.0
-- Date: December 4, 2025
-- Description: Cisco network infrastructure objects
-- 
-- Includes:
--   - Catalyst Center (DNA Center)
--   - Switches and Interfaces
--   - VLANs and Port-Channels
--   - Firepower Management Center (FMC)
--   - Firepower Threat Defense (FTD)
--   - Identity Services Engine (ISE)
-- ============================================================================

USE NS archer;
USE DB infrastructure;

-- ============================================================================
-- CISCO NETWORK MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cisco_catalyst_center: DNA Center management platform
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_catalyst_center SCHEMAFULL;

DEFINE FIELD hostname ON cisco_catalyst_center TYPE string ASSERT $value != NONE;
DEFINE FIELD ip_address ON cisco_catalyst_center TYPE option<string>;
DEFINE FIELD version ON cisco_catalyst_center TYPE option<string>;

-- Capacity
DEFINE FIELD device_count ON cisco_catalyst_center TYPE option<int>;
DEFINE FIELD site_count ON cisco_catalyst_center TYPE option<int>;

-- Cluster
DEFINE FIELD cluster_mode ON cisco_catalyst_center TYPE option<bool>;
DEFINE FIELD cluster_nodes ON cisco_catalyst_center TYPE array DEFAULT [];

-- Status
DEFINE FIELD status ON cisco_catalyst_center TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'unknown'];

-- Timestamps
DEFINE FIELD created_at ON cisco_catalyst_center TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_catalyst_center TYPE datetime DEFAULT time::now();
DEFINE FIELD last_sync ON cisco_catalyst_center TYPE option<datetime>;

-- Indexes
DEFINE INDEX idx_dnac_hostname ON cisco_catalyst_center FIELDS hostname UNIQUE;

-- ----------------------------------------------------------------------------
-- cisco_site: Site hierarchy (Area > Building > Floor)
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_site SCHEMAFULL;

DEFINE FIELD site_id ON cisco_site TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON cisco_site TYPE string;
DEFINE FIELD site_type ON cisco_site TYPE string 
    ASSERT $value IN ['area', 'building', 'floor'];

-- Location
DEFINE FIELD address ON cisco_site TYPE option<string>;
DEFINE FIELD latitude ON cisco_site TYPE option<float>;
DEFINE FIELD longitude ON cisco_site TYPE option<float>;
DEFINE FIELD country ON cisco_site TYPE option<string>;

-- Floor-specific
DEFINE FIELD floor_number ON cisco_site TYPE option<int>;
DEFINE FIELD rf_model ON cisco_site TYPE option<string>;

-- Hierarchy
DEFINE FIELD parent_site ON cisco_site TYPE option<record<cisco_site>>;

-- Relationships
DEFINE FIELD catalyst_center ON cisco_site TYPE option<record<cisco_catalyst_center>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_site TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_site TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_site_id ON cisco_site FIELDS site_id UNIQUE;
DEFINE INDEX idx_site_type ON cisco_site FIELDS site_type;

-- ============================================================================
-- CISCO SWITCHES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cisco_switch: Network switch
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_switch SCHEMAFULL;

-- Identifiers
DEFINE FIELD hostname ON cisco_switch TYPE string ASSERT $value != NONE;
DEFINE FIELD ip_address ON cisco_switch TYPE option<string>;
DEFINE FIELD serial_number ON cisco_switch TYPE option<string>;
DEFINE FIELD mac_address ON cisco_switch TYPE option<string>;

-- Hardware
DEFINE FIELD model ON cisco_switch TYPE option<string>;
DEFINE FIELD platform_id ON cisco_switch TYPE option<string>;
DEFINE FIELD software_type ON cisco_switch TYPE option<string>; -- IOS, IOS-XE, NX-OS
DEFINE FIELD software_version ON cisco_switch TYPE option<string>;

-- Role and location
DEFINE FIELD role ON cisco_switch TYPE option<string>
    ASSERT $value IN [NONE, 'access', 'distribution', 'core', 'border', 'spine', 'leaf'];
DEFINE FIELD site ON cisco_switch TYPE option<record<cisco_site>>;
DEFINE FIELD location ON cisco_switch TYPE option<string>;

-- Stack info
DEFINE FIELD is_stack ON cisco_switch TYPE option<bool>;
DEFINE FIELD stack_number ON cisco_switch TYPE option<int>;
DEFINE FIELD stack_role ON cisco_switch TYPE option<string>; -- master, member

-- Capacity
DEFINE FIELD port_count ON cisco_switch TYPE option<int>;
DEFINE FIELD uplink_count ON cisco_switch TYPE option<int>;
DEFINE FIELD poe_capable ON cisco_switch TYPE option<bool>;

-- Status
DEFINE FIELD reachability_status ON cisco_switch TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['reachable', 'unreachable', 'unknown'];
DEFINE FIELD management_state ON cisco_switch TYPE option<string>;
DEFINE FIELD uptime_seconds ON cisco_switch TYPE option<int>;
DEFINE FIELD last_updated ON cisco_switch TYPE option<datetime>;

-- SDA (Software-Defined Access)
DEFINE FIELD sda_fabric_enabled ON cisco_switch TYPE option<bool>;
DEFINE FIELD sda_role ON cisco_switch TYPE option<string>;

-- Metrics
DEFINE FIELD cpu_utilization_pct ON cisco_switch TYPE option<float>;
DEFINE FIELD memory_utilization_pct ON cisco_switch TYPE option<float>;

-- Relationships
DEFINE FIELD catalyst_center ON cisco_switch TYPE option<record<cisco_catalyst_center>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_switch TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_switch TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_switch_hostname ON cisco_switch FIELDS hostname;
DEFINE INDEX idx_switch_serial ON cisco_switch FIELDS serial_number UNIQUE;
DEFINE INDEX idx_switch_ip ON cisco_switch FIELDS ip_address;
DEFINE INDEX idx_switch_role ON cisco_switch FIELDS role;
DEFINE INDEX idx_switch_site ON cisco_switch FIELDS site;

-- ----------------------------------------------------------------------------
-- cisco_switch_interface: Physical/logical interface
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_switch_interface SCHEMAFULL;

DEFINE FIELD interface_id ON cisco_switch_interface TYPE string ASSERT $value != NONE;

-- SNMP identifiers
DEFINE FIELD if_index ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD if_name ON cisco_switch_interface TYPE string;
DEFINE FIELD if_descr ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD if_alias ON cisco_switch_interface TYPE option<string>;

-- Type
DEFINE FIELD if_type ON cisco_switch_interface TYPE option<string>; -- ethernet, portChannel, vlan, loopback
DEFINE FIELD media_type ON cisco_switch_interface TYPE option<string>; -- RJ45, SFP, SFP+, QSFP

-- Speed and duplex
DEFINE FIELD if_speed ON cisco_switch_interface TYPE option<int>; -- bits per second
DEFINE FIELD speed_gbps ON cisco_switch_interface TYPE option<float>;
DEFINE FIELD duplex ON cisco_switch_interface TYPE option<string>; -- full, half, auto

-- Status
DEFINE FIELD if_oper_status ON cisco_switch_interface TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['up', 'down', 'testing', 'unknown', 'dormant', 'notPresent'];
DEFINE FIELD if_admin_status ON cisco_switch_interface TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['up', 'down', 'testing', 'unknown'];

-- Layer 2
DEFINE FIELD mac_address ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD switchport_mode ON cisco_switch_interface TYPE option<string>; -- access, trunk, hybrid
DEFINE FIELD access_vlan ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD native_vlan ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD allowed_vlans ON cisco_switch_interface TYPE array DEFAULT [];
DEFINE FIELD voice_vlan ON cisco_switch_interface TYPE option<int>;

-- Layer 3
DEFINE FIELD ip_address ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD subnet_mask ON cisco_switch_interface TYPE option<string>;

-- Port-Channel
DEFINE FIELD port_channel ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD lacp_mode ON cisco_switch_interface TYPE option<string>; -- active, passive, on

-- PoE
DEFINE FIELD poe_enabled ON cisco_switch_interface TYPE option<bool>;
DEFINE FIELD poe_power_watts ON cisco_switch_interface TYPE option<float>;

-- CDP/LLDP
DEFINE FIELD connected_device_name ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD connected_device_ip ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD connected_interface ON cisco_switch_interface TYPE option<string>;
DEFINE FIELD connected_platform ON cisco_switch_interface TYPE option<string>;

-- Statistics
DEFINE FIELD in_octets ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD out_octets ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD in_errors ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD out_errors ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD in_discards ON cisco_switch_interface TYPE option<int>;
DEFINE FIELD out_discards ON cisco_switch_interface TYPE option<int>;

-- Relationships
DEFINE FIELD switch ON cisco_switch_interface TYPE record<cisco_switch>;

-- Timestamps
DEFINE FIELD created_at ON cisco_switch_interface TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_switch_interface TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_swif_id ON cisco_switch_interface FIELDS interface_id UNIQUE;
DEFINE INDEX idx_swif_switch ON cisco_switch_interface FIELDS switch;
DEFINE INDEX idx_swif_status ON cisco_switch_interface FIELDS if_oper_status;
DEFINE INDEX idx_swif_vlan ON cisco_switch_interface FIELDS access_vlan;

-- ----------------------------------------------------------------------------
-- cisco_vlan: VLAN definition
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_vlan SCHEMAFULL;

DEFINE FIELD vlan_id ON cisco_vlan TYPE int ASSERT $value != NONE;
DEFINE FIELD name ON cisco_vlan TYPE option<string>;

-- Status
DEFINE FIELD status ON cisco_vlan TYPE string DEFAULT 'active'
    ASSERT $value IN ['active', 'suspended', 'unknown'];
DEFINE FIELD vlan_type ON cisco_vlan TYPE option<string>; -- ethernet, fddi, token-ring

-- Configuration
DEFINE FIELD mtu ON cisco_vlan TYPE option<int>;
DEFINE FIELD said ON cisco_vlan TYPE option<int>;

-- Spanning Tree
DEFINE FIELD stp_state ON cisco_vlan TYPE option<string>;

-- L3 (SVI)
DEFINE FIELD svi_ip_address ON cisco_vlan TYPE option<string>;
DEFINE FIELD svi_subnet ON cisco_vlan TYPE option<string>;
DEFINE FIELD svi_status ON cisco_vlan TYPE option<string>;
DEFINE FIELD hsrp_vip ON cisco_vlan TYPE option<string>;

-- Relationships
DEFINE FIELD switch ON cisco_vlan TYPE record<cisco_switch>;

-- Timestamps
DEFINE FIELD created_at ON cisco_vlan TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_vlan TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_vlan_composite ON cisco_vlan FIELDS switch, vlan_id UNIQUE;

-- ----------------------------------------------------------------------------
-- cisco_port_channel: Port-channel / LAG
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_port_channel SCHEMAFULL;

DEFINE FIELD port_channel_id ON cisco_port_channel TYPE int ASSERT $value != NONE;
DEFINE FIELD name ON cisco_port_channel TYPE option<string>;

-- Protocol
DEFINE FIELD protocol ON cisco_port_channel TYPE option<string>; -- LACP, PAgP, ON
DEFINE FIELD lacp_mode ON cisco_port_channel TYPE option<string>; -- active, passive

-- Members
DEFINE FIELD member_interfaces ON cisco_port_channel TYPE array DEFAULT [];
DEFINE FIELD active_member_count ON cisco_port_channel TYPE option<int>;

-- Status
DEFINE FIELD status ON cisco_port_channel TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['up', 'down', 'partial', 'unknown'];

-- Layer
DEFINE FIELD layer ON cisco_port_channel TYPE option<string>; -- L2, L3

-- Relationships
DEFINE FIELD switch ON cisco_port_channel TYPE record<cisco_switch>;

-- Timestamps
DEFINE FIELD created_at ON cisco_port_channel TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_port_channel TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_po_composite ON cisco_port_channel FIELDS switch, port_channel_id UNIQUE;

-- ============================================================================
-- CISCO FIREPOWER (FMC/FTD)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cisco_fmc: Firepower Management Center
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_fmc SCHEMAFULL;

DEFINE FIELD hostname ON cisco_fmc TYPE string ASSERT $value != NONE;
DEFINE FIELD ip_address ON cisco_fmc TYPE option<string>;
DEFINE FIELD version ON cisco_fmc TYPE option<string>;

-- Capacity
DEFINE FIELD device_count ON cisco_fmc TYPE option<int>;
DEFINE FIELD policy_count ON cisco_fmc TYPE option<int>;

-- High availability
DEFINE FIELD ha_enabled ON cisco_fmc TYPE option<bool>;
DEFINE FIELD ha_role ON cisco_fmc TYPE option<string>;
DEFINE FIELD ha_peer ON cisco_fmc TYPE option<record<cisco_fmc>>;

-- Status
DEFINE FIELD status ON cisco_fmc TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'unknown'];

-- Timestamps
DEFINE FIELD created_at ON cisco_fmc TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_fmc TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_fmc_hostname ON cisco_fmc FIELDS hostname UNIQUE;

-- ----------------------------------------------------------------------------
-- cisco_ftd: Firepower Threat Defense device
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_ftd SCHEMAFULL;

DEFINE FIELD device_id ON cisco_ftd TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON cisco_ftd TYPE string;
DEFINE FIELD hostname ON cisco_ftd TYPE option<string>;

-- Hardware
DEFINE FIELD model ON cisco_ftd TYPE option<string>;
DEFINE FIELD serial_number ON cisco_ftd TYPE option<string>;
DEFINE FIELD software_version ON cisco_ftd TYPE option<string>;

-- Networking
DEFINE FIELD management_ip ON cisco_ftd TYPE option<string>;

-- High availability
DEFINE FIELD ha_status ON cisco_ftd TYPE option<string>;
DEFINE FIELD ha_role ON cisco_ftd TYPE option<string>;
DEFINE FIELD ha_peer ON cisco_ftd TYPE option<record<cisco_ftd>>;

-- Status
DEFINE FIELD health_status ON cisco_ftd TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['green', 'yellow', 'red', 'unknown'];
DEFINE FIELD registration_status ON cisco_ftd TYPE option<string>;

-- Policies
DEFINE FIELD access_policy ON cisco_ftd TYPE option<string>;
DEFINE FIELD platform_policy ON cisco_ftd TYPE option<string>;

-- Relationships
DEFINE FIELD fmc ON cisco_ftd TYPE option<record<cisco_fmc>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_ftd TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_ftd TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_ftd_id ON cisco_ftd FIELDS device_id UNIQUE;
DEFINE INDEX idx_ftd_fmc ON cisco_ftd FIELDS fmc;

-- ============================================================================
-- CISCO ISE (Identity Services Engine)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cisco_ise: ISE node
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_ise SCHEMAFULL;

DEFINE FIELD hostname ON cisco_ise TYPE string ASSERT $value != NONE;
DEFINE FIELD ip_address ON cisco_ise TYPE option<string>;
DEFINE FIELD fqdn ON cisco_ise TYPE option<string>;

-- Role
DEFINE FIELD persona ON cisco_ise TYPE option<string>; -- PAN, PSN, MNT, pxGrid
DEFINE FIELD role ON cisco_ise TYPE option<string>; -- Primary, Secondary
DEFINE FIELD version ON cisco_ise TYPE option<string>;

-- Status
DEFINE FIELD status ON cisco_ise TYPE string DEFAULT 'unknown'
    ASSERT $value IN ['online', 'offline', 'degraded', 'unknown'];

-- Services
DEFINE FIELD services_enabled ON cisco_ise TYPE array DEFAULT [];

-- Timestamps
DEFINE FIELD created_at ON cisco_ise TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_ise TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_ise_hostname ON cisco_ise FIELDS hostname UNIQUE;

-- ----------------------------------------------------------------------------
-- cisco_ise_nad: Network Access Device
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_ise_nad SCHEMAFULL;

DEFINE FIELD nad_id ON cisco_ise_nad TYPE string ASSERT $value != NONE;
DEFINE FIELD name ON cisco_ise_nad TYPE string;
DEFINE FIELD ip_address ON cisco_ise_nad TYPE option<string>;

-- Classification
DEFINE FIELD device_type ON cisco_ise_nad TYPE option<string>;
DEFINE FIELD vendor ON cisco_ise_nad TYPE option<string>;
DEFINE FIELD model ON cisco_ise_nad TYPE option<string>;
DEFINE FIELD software_version ON cisco_ise_nad TYPE option<string>;

-- Location
DEFINE FIELD location ON cisco_ise_nad TYPE option<string>;
DEFINE FIELD network_device_group ON cisco_ise_nad TYPE option<string>;

-- Authentication
DEFINE FIELD authentication_protocol ON cisco_ise_nad TYPE option<string>;
DEFINE FIELD tacacs_enabled ON cisco_ise_nad TYPE option<bool>;

-- Status
DEFINE FIELD status ON cisco_ise_nad TYPE option<string>;

-- Relationships
DEFINE FIELD ise ON cisco_ise_nad TYPE option<record<cisco_ise>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_ise_nad TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_ise_nad TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_nad_id ON cisco_ise_nad FIELDS nad_id UNIQUE;
DEFINE INDEX idx_nad_ip ON cisco_ise_nad FIELDS ip_address;

-- ----------------------------------------------------------------------------
-- cisco_ise_endpoint: Authenticated endpoint
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_ise_endpoint SCHEMAFULL;

DEFINE FIELD mac_address ON cisco_ise_endpoint TYPE string ASSERT $value != NONE;
DEFINE FIELD ip_address ON cisco_ise_endpoint TYPE option<string>;

-- Profile
DEFINE FIELD endpoint_profile ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD identity_group ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD device_type ON cisco_ise_endpoint TYPE option<string>;

-- User
DEFINE FIELD username ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD ad_user_dn ON cisco_ise_endpoint TYPE option<string>;

-- TrustSec
DEFINE FIELD sgt_number ON cisco_ise_endpoint TYPE option<int>;
DEFINE FIELD sgt_name ON cisco_ise_endpoint TYPE option<string>;

-- Posture
DEFINE FIELD posture_status ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD posture_timestamp ON cisco_ise_endpoint TYPE option<datetime>;

-- Network access
DEFINE FIELD nas_ip ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD nas_port ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD vlan ON cisco_ise_endpoint TYPE option<int>;
DEFINE FIELD auth_method ON cisco_ise_endpoint TYPE option<string>; -- 802.1X, MAB, WebAuth

-- Status
DEFINE FIELD status ON cisco_ise_endpoint TYPE option<string>;
DEFINE FIELD last_seen ON cisco_ise_endpoint TYPE option<datetime>;

-- Custom attributes
DEFINE FIELD custom_attributes ON cisco_ise_endpoint TYPE option<object>;

-- Relationships
DEFINE FIELD ise ON cisco_ise_endpoint TYPE option<record<cisco_ise>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_ise_endpoint TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_ise_endpoint TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_endpoint_mac ON cisco_ise_endpoint FIELDS mac_address UNIQUE;
DEFINE INDEX idx_endpoint_ip ON cisco_ise_endpoint FIELDS ip_address;
DEFINE INDEX idx_endpoint_profile ON cisco_ise_endpoint FIELDS endpoint_profile;
DEFINE INDEX idx_endpoint_sgt ON cisco_ise_endpoint FIELDS sgt_number;

-- ----------------------------------------------------------------------------
-- cisco_ise_sgt: Security Group Tag
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_ise_sgt SCHEMAFULL;

DEFINE FIELD sgt_id ON cisco_ise_sgt TYPE int ASSERT $value != NONE;
DEFINE FIELD name ON cisco_ise_sgt TYPE string;
DEFINE FIELD description ON cisco_ise_sgt TYPE option<string>;

-- Classification
DEFINE FIELD generation_id ON cisco_ise_sgt TYPE option<string>;
DEFINE FIELD propagate_to_aci ON cisco_ise_sgt TYPE option<bool>;

-- Relationships
DEFINE FIELD ise ON cisco_ise_sgt TYPE option<record<cisco_ise>>;

-- Timestamps
DEFINE FIELD created_at ON cisco_ise_sgt TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON cisco_ise_sgt TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_sgt_id ON cisco_ise_sgt FIELDS sgt_id UNIQUE;
DEFINE INDEX idx_sgt_name ON cisco_ise_sgt FIELDS name;

-- ============================================================================
-- CISCO ROUTING
-- ============================================================================

-- ----------------------------------------------------------------------------
-- cisco_static_route: Static route
-- ----------------------------------------------------------------------------
DEFINE TABLE cisco_static_route SCHEMAFULL;

DEFINE FIELD route_id ON cisco_static_route TYPE string ASSERT $value != NONE;
DEFINE FIELD destination ON cisco_static_route TYPE string;
DEFINE FIELD prefix_length ON cisco_static_route TYPE int;
DEFINE FIELD next_hop ON cisco_static_route TYPE option<string>;
DEFINE FIELD interface ON cisco_static_route TYPE option<string>;
DEFINE FIELD distance ON cisco_static_route TYPE option<int>;
DEFINE FIELD metric ON cisco_static_route TYPE option<int>;
DEFINE FIELD vrf ON cisco_static_route TYPE option<string>;

-- Relationships
DEFINE FIELD switch ON cisco_static_route TYPE record<cisco_switch>;

-- Timestamps
DEFINE FIELD created_at ON cisco_static_route TYPE datetime DEFAULT time::now();

-- Indexes
DEFINE INDEX idx_route_id ON cisco_static_route FIELDS route_id UNIQUE;

-- ============================================================================
-- END OF CISCO SCHEMA
-- ============================================================================
