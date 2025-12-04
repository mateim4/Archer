-- ============================================================================
-- LCMDesigner - Security Infrastructure Schema
-- Fortinet (FortiManager, FortiGate, FortiAnalyzer) + Broadcom SWG
-- ============================================================================

-- ============================================================================
-- FORTINET - FORTIMANAGER (Centralized Management)
-- ============================================================================

DEFINE TABLE fortinet_fortimanager SCHEMAFULL;

DEFINE FIELD name ON fortinet_fortimanager TYPE string;
DEFINE FIELD hostname ON fortinet_fortimanager TYPE string;
DEFINE FIELD ip_address ON fortinet_fortimanager TYPE string;
DEFINE FIELD serial_number ON fortinet_fortimanager TYPE option<string>;
DEFINE FIELD firmware_version ON fortinet_fortimanager TYPE string;
DEFINE FIELD adoms ON fortinet_fortimanager TYPE array<string> DEFAULT [];
DEFINE FIELD managed_device_count ON fortinet_fortimanager TYPE int DEFAULT 0;
DEFINE FIELD ha_mode ON fortinet_fortimanager TYPE string DEFAULT "standalone"; -- standalone, cluster
DEFINE FIELD ha_peer ON fortinet_fortimanager TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD license_type ON fortinet_fortimanager TYPE string;
DEFINE FIELD license_expiry ON fortinet_fortimanager TYPE option<datetime>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON fortinet_fortimanager TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON fortinet_fortimanager TYPE string DEFAULT "active";
DEFINE FIELD last_sync ON fortinet_fortimanager TYPE option<datetime>;
DEFINE FIELD created_at ON fortinet_fortimanager TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_fortimanager TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_fmg_name ON fortinet_fortimanager FIELDS name;
DEFINE INDEX idx_fortinet_fmg_hostname ON fortinet_fortimanager FIELDS hostname;

-- ============================================================================
-- FORTINET - FORTIGATE (Next-Gen Firewall)
-- ============================================================================

DEFINE TABLE fortinet_fortigate SCHEMAFULL;

DEFINE FIELD name ON fortinet_fortigate TYPE string;
DEFINE FIELD hostname ON fortinet_fortigate TYPE string;
DEFINE FIELD model ON fortinet_fortigate TYPE string; -- FG-100F, FG-400E, FG-VM64
DEFINE FIELD serial_number ON fortinet_fortigate TYPE string;
DEFINE FIELD firmware_version ON fortinet_fortigate TYPE string;
DEFINE FIELD vdom_mode ON fortinet_fortigate TYPE string DEFAULT "no-vdom"; -- no-vdom, multi-vdom
DEFINE FIELD vdoms ON fortinet_fortigate TYPE array<string> DEFAULT ["root"];

-- Clustering / HA
DEFINE FIELD ha_mode ON fortinet_fortigate TYPE string DEFAULT "standalone"; -- standalone, a-a, a-p
DEFINE FIELD ha_group_name ON fortinet_fortigate TYPE option<string>;
DEFINE FIELD ha_priority ON fortinet_fortigate TYPE int DEFAULT 128;
DEFINE FIELD ha_peer ON fortinet_fortigate TYPE option<record<fortinet_fortigate>>;

-- Management
DEFINE FIELD mgmt_ip ON fortinet_fortigate TYPE string;
DEFINE FIELD mgmt_interface ON fortinet_fortigate TYPE string DEFAULT "mgmt";
DEFINE FIELD fortimanager ON fortinet_fortigate TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD fortianalyzer ON fortinet_fortigate TYPE option<record<fortinet_fortianalyzer>>;
DEFINE FIELD adom ON fortinet_fortigate TYPE option<string>;

-- Licensing
DEFINE FIELD license_type ON fortinet_fortigate TYPE string; -- hardware, vm-subscription, vm-perpetual
DEFINE FIELD fortiguard_license ON fortinet_fortigate TYPE bool DEFAULT false;
DEFINE FIELD utm_bundle ON fortinet_fortigate TYPE option<string>; -- FC, UTP, ENT

-- Performance
DEFINE FIELD cpu_count ON fortinet_fortigate TYPE option<int>;
DEFINE FIELD memory_gb ON fortinet_fortigate TYPE option<int>;
DEFINE FIELD session_capacity ON fortinet_fortigate TYPE option<int>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON fortinet_fortigate TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON fortinet_fortigate TYPE string DEFAULT "active";
DEFINE FIELD config_revision ON fortinet_fortigate TYPE int DEFAULT 0;
DEFINE FIELD last_sync ON fortinet_fortigate TYPE option<datetime>;
DEFINE FIELD created_at ON fortinet_fortigate TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_fortigate TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_fg_name ON fortinet_fortigate FIELDS name;
DEFINE INDEX idx_fortinet_fg_serial ON fortinet_fortigate FIELDS serial_number UNIQUE;
DEFINE INDEX idx_fortinet_fg_fmg ON fortinet_fortigate FIELDS fortimanager;

-- ============================================================================
-- FORTINET - FORTIGATE INTERFACE
-- ============================================================================

DEFINE TABLE fortinet_fortigate_interface SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_fortigate_interface TYPE record<fortinet_fortigate>;
DEFINE FIELD name ON fortinet_fortigate_interface TYPE string; -- port1, wan1, internal
DEFINE FIELD alias ON fortinet_fortigate_interface TYPE option<string>;
DEFINE FIELD vdom ON fortinet_fortigate_interface TYPE string DEFAULT "root";
DEFINE FIELD type ON fortinet_fortigate_interface TYPE string; -- physical, vlan, aggregate, loopback, tunnel
DEFINE FIELD mode ON fortinet_fortigate_interface TYPE string DEFAULT "static"; -- static, dhcp, pppoe
DEFINE FIELD ip_address ON fortinet_fortigate_interface TYPE option<string>;
DEFINE FIELD subnet_mask ON fortinet_fortigate_interface TYPE option<string>;
DEFINE FIELD vlanid ON fortinet_fortigate_interface TYPE option<int>;
DEFINE FIELD parent_interface ON fortinet_fortigate_interface TYPE option<string>;
DEFINE FIELD zone ON fortinet_fortigate_interface TYPE option<string>;
DEFINE FIELD role ON fortinet_fortigate_interface TYPE string DEFAULT "undefined"; -- lan, wan, dmz, undefined
DEFINE FIELD speed ON fortinet_fortigate_interface TYPE string DEFAULT "auto";
DEFINE FIELD status ON fortinet_fortigate_interface TYPE string DEFAULT "up";
DEFINE FIELD allowaccess ON fortinet_fortigate_interface TYPE array<string> DEFAULT []; -- ping, https, ssh, snmp
DEFINE FIELD created_at ON fortinet_fortigate_interface TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_fortigate_interface TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_fgi_fg ON fortinet_fortigate_interface FIELDS fortigate;
DEFINE INDEX idx_fortinet_fgi_name ON fortinet_fortigate_interface FIELDS fortigate, name UNIQUE;

-- ============================================================================
-- FORTINET - ADDRESS OBJECTS
-- ============================================================================

DEFINE TABLE fortinet_address_object SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_address_object TYPE option<record<fortinet_fortigate>>;
DEFINE FIELD fortimanager ON fortinet_address_object TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD adom ON fortinet_address_object TYPE option<string>;
DEFINE FIELD name ON fortinet_address_object TYPE string;
DEFINE FIELD type ON fortinet_address_object TYPE string; -- ipmask, iprange, fqdn, geography, wildcard
DEFINE FIELD subnet ON fortinet_address_object TYPE option<string>;
DEFINE FIELD start_ip ON fortinet_address_object TYPE option<string>;
DEFINE FIELD end_ip ON fortinet_address_object TYPE option<string>;
DEFINE FIELD fqdn ON fortinet_address_object TYPE option<string>;
DEFINE FIELD country ON fortinet_address_object TYPE option<string>;
DEFINE FIELD interface ON fortinet_address_object TYPE option<string>;
DEFINE FIELD comment ON fortinet_address_object TYPE option<string>;
DEFINE FIELD color ON fortinet_address_object TYPE int DEFAULT 0;
DEFINE FIELD created_at ON fortinet_address_object TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_address_object TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_addr_name ON fortinet_address_object FIELDS name;
DEFINE INDEX idx_fortinet_addr_fg ON fortinet_address_object FIELDS fortigate;

-- ============================================================================
-- FORTINET - ADDRESS GROUPS
-- ============================================================================

DEFINE TABLE fortinet_address_group SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_address_group TYPE option<record<fortinet_fortigate>>;
DEFINE FIELD fortimanager ON fortinet_address_group TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD adom ON fortinet_address_group TYPE option<string>;
DEFINE FIELD name ON fortinet_address_group TYPE string;
DEFINE FIELD members ON fortinet_address_group TYPE array<string> DEFAULT [];
DEFINE FIELD comment ON fortinet_address_group TYPE option<string>;
DEFINE FIELD color ON fortinet_address_group TYPE int DEFAULT 0;
DEFINE FIELD created_at ON fortinet_address_group TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_address_group TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_addrgrp_name ON fortinet_address_group FIELDS name;

-- ============================================================================
-- FORTINET - SERVICE OBJECTS
-- ============================================================================

DEFINE TABLE fortinet_service_object SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_service_object TYPE option<record<fortinet_fortigate>>;
DEFINE FIELD fortimanager ON fortinet_service_object TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD name ON fortinet_service_object TYPE string;
DEFINE FIELD category ON fortinet_service_object TYPE string DEFAULT "General";
DEFINE FIELD protocol ON fortinet_service_object TYPE string; -- TCP/UDP/SCTP, ICMP, IP
DEFINE FIELD tcp_portrange ON fortinet_service_object TYPE option<string>;
DEFINE FIELD udp_portrange ON fortinet_service_object TYPE option<string>;
DEFINE FIELD protocol_number ON fortinet_service_object TYPE option<int>;
DEFINE FIELD comment ON fortinet_service_object TYPE option<string>;
DEFINE FIELD color ON fortinet_service_object TYPE int DEFAULT 0;
DEFINE FIELD created_at ON fortinet_service_object TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_service_object TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_svc_name ON fortinet_service_object FIELDS name;

-- ============================================================================
-- FORTINET - FIREWALL POLICY
-- ============================================================================

DEFINE TABLE fortinet_firewall_policy SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_firewall_policy TYPE option<record<fortinet_fortigate>>;
DEFINE FIELD fortimanager ON fortinet_firewall_policy TYPE option<record<fortinet_fortimanager>>;
DEFINE FIELD adom ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD policy_package ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD policyid ON fortinet_firewall_policy TYPE int;
DEFINE FIELD name ON fortinet_firewall_policy TYPE string;
DEFINE FIELD uuid ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD vdom ON fortinet_firewall_policy TYPE string DEFAULT "root";

-- Source/Destination
DEFINE FIELD srcintf ON fortinet_firewall_policy TYPE array<string>;
DEFINE FIELD dstintf ON fortinet_firewall_policy TYPE array<string>;
DEFINE FIELD srcaddr ON fortinet_firewall_policy TYPE array<string>;
DEFINE FIELD dstaddr ON fortinet_firewall_policy TYPE array<string>;
DEFINE FIELD service ON fortinet_firewall_policy TYPE array<string>;

-- Action and Security Profiles
DEFINE FIELD action ON fortinet_firewall_policy TYPE string; -- accept, deny, ipsec
DEFINE FIELD nat ON fortinet_firewall_policy TYPE bool DEFAULT false;
DEFINE FIELD schedule ON fortinet_firewall_policy TYPE string DEFAULT "always";
DEFINE FIELD av_profile ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD webfilter_profile ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD ips_sensor ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD application_list ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD ssl_ssh_profile ON fortinet_firewall_policy TYPE option<string>;

-- Logging
DEFINE FIELD logtraffic ON fortinet_firewall_policy TYPE string DEFAULT "utm"; -- all, utm, disable
DEFINE FIELD logtraffic_start ON fortinet_firewall_policy TYPE bool DEFAULT false;

-- Status
DEFINE FIELD status ON fortinet_firewall_policy TYPE string DEFAULT "enable"; -- enable, disable
DEFINE FIELD comments ON fortinet_firewall_policy TYPE option<string>;
DEFINE FIELD created_at ON fortinet_firewall_policy TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_firewall_policy TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_pol_fg ON fortinet_firewall_policy FIELDS fortigate;
DEFINE INDEX idx_fortinet_pol_id ON fortinet_firewall_policy FIELDS fortigate, policyid UNIQUE;

-- ============================================================================
-- FORTINET - IPSEC VPN TUNNELS
-- ============================================================================

DEFINE TABLE fortinet_vpn_ipsec SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_vpn_ipsec TYPE record<fortinet_fortigate>;
DEFINE FIELD name ON fortinet_vpn_ipsec TYPE string;
DEFINE FIELD type ON fortinet_vpn_ipsec TYPE string; -- static, dialup, ddns
DEFINE FIELD interface ON fortinet_vpn_ipsec TYPE string;
DEFINE FIELD remote_gw ON fortinet_vpn_ipsec TYPE option<string>;
DEFINE FIELD remote_gw_type ON fortinet_vpn_ipsec TYPE string DEFAULT "static"; -- static, ddns, dialup

-- IKE Phase 1
DEFINE FIELD ike_version ON fortinet_vpn_ipsec TYPE int DEFAULT 2; -- 1 or 2
DEFINE FIELD proposal ON fortinet_vpn_ipsec TYPE array<string> DEFAULT ["aes256-sha256"];
DEFINE FIELD dhgrp ON fortinet_vpn_ipsec TYPE array<int> DEFAULT [14];
DEFINE FIELD authmethod ON fortinet_vpn_ipsec TYPE string DEFAULT "psk"; -- psk, signature
DEFINE FIELD keylife ON fortinet_vpn_ipsec TYPE int DEFAULT 86400;

-- IKE Phase 2
DEFINE FIELD phase2_name ON fortinet_vpn_ipsec TYPE option<string>;
DEFINE FIELD phase2_proposal ON fortinet_vpn_ipsec TYPE array<string> DEFAULT ["aes256-sha256"];
DEFINE FIELD pfs ON fortinet_vpn_ipsec TYPE bool DEFAULT true;
DEFINE FIELD src_subnet ON fortinet_vpn_ipsec TYPE option<string>;
DEFINE FIELD dst_subnet ON fortinet_vpn_ipsec TYPE option<string>;

-- Status
DEFINE FIELD status ON fortinet_vpn_ipsec TYPE string DEFAULT "active";
DEFINE FIELD tunnel_status ON fortinet_vpn_ipsec TYPE string DEFAULT "down"; -- up, down
DEFINE FIELD created_at ON fortinet_vpn_ipsec TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_vpn_ipsec TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_vpn_fg ON fortinet_vpn_ipsec FIELDS fortigate;
DEFINE INDEX idx_fortinet_vpn_name ON fortinet_vpn_ipsec FIELDS fortigate, name UNIQUE;

-- ============================================================================
-- FORTINET - SSL VPN
-- ============================================================================

DEFINE TABLE fortinet_vpn_ssl SCHEMAFULL;

DEFINE FIELD fortigate ON fortinet_vpn_ssl TYPE record<fortinet_fortigate>;
DEFINE FIELD name ON fortinet_vpn_ssl TYPE string DEFAULT "ssl-vpn";
DEFINE FIELD interface ON fortinet_vpn_ssl TYPE string;
DEFINE FIELD port ON fortinet_vpn_ssl TYPE int DEFAULT 443;
DEFINE FIELD tunnel_ip_pools ON fortinet_vpn_ssl TYPE array<string> DEFAULT [];
DEFINE FIELD source_interface ON fortinet_vpn_ssl TYPE array<string> DEFAULT [];
DEFINE FIELD source_address ON fortinet_vpn_ssl TYPE array<string> DEFAULT ["all"];
DEFINE FIELD authentication ON fortinet_vpn_ssl TYPE string DEFAULT "local"; -- local, radius, ldap
DEFINE FIELD auth_portal ON fortinet_vpn_ssl TYPE option<string>;
DEFINE FIELD user_groups ON fortinet_vpn_ssl TYPE array<string> DEFAULT [];
DEFINE FIELD split_tunneling ON fortinet_vpn_ssl TYPE bool DEFAULT true;
DEFINE FIELD split_tunneling_networks ON fortinet_vpn_ssl TYPE array<string> DEFAULT [];
DEFINE FIELD status ON fortinet_vpn_ssl TYPE string DEFAULT "enable";
DEFINE FIELD max_sessions ON fortinet_vpn_ssl TYPE option<int>;
DEFINE FIELD active_sessions ON fortinet_vpn_ssl TYPE int DEFAULT 0;
DEFINE FIELD created_at ON fortinet_vpn_ssl TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_vpn_ssl TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_sslvpn_fg ON fortinet_vpn_ssl FIELDS fortigate;

-- ============================================================================
-- FORTINET - FORTIANALYZER (Logging & Analytics)
-- ============================================================================

DEFINE TABLE fortinet_fortianalyzer SCHEMAFULL;

DEFINE FIELD name ON fortinet_fortianalyzer TYPE string;
DEFINE FIELD hostname ON fortinet_fortianalyzer TYPE string;
DEFINE FIELD ip_address ON fortinet_fortianalyzer TYPE string;
DEFINE FIELD serial_number ON fortinet_fortianalyzer TYPE option<string>;
DEFINE FIELD firmware_version ON fortinet_fortianalyzer TYPE string;
DEFINE FIELD adoms ON fortinet_fortianalyzer TYPE array<string> DEFAULT [];
DEFINE FIELD device_count ON fortinet_fortianalyzer TYPE int DEFAULT 0;
DEFINE FIELD log_rate_per_sec ON fortinet_fortianalyzer TYPE option<int>;
DEFINE FIELD storage_used_gb ON fortinet_fortianalyzer TYPE option<float>;
DEFINE FIELD storage_total_gb ON fortinet_fortianalyzer TYPE option<float>;
DEFINE FIELD retention_days ON fortinet_fortianalyzer TYPE int DEFAULT 365;

-- HA Configuration
DEFINE FIELD ha_mode ON fortinet_fortianalyzer TYPE string DEFAULT "standalone";
DEFINE FIELD ha_peer ON fortinet_fortianalyzer TYPE option<record<fortinet_fortianalyzer>>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON fortinet_fortianalyzer TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON fortinet_fortianalyzer TYPE string DEFAULT "active";
DEFINE FIELD last_sync ON fortinet_fortianalyzer TYPE option<datetime>;
DEFINE FIELD created_at ON fortinet_fortianalyzer TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON fortinet_fortianalyzer TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_fortinet_faz_name ON fortinet_fortianalyzer FIELDS name;
DEFINE INDEX idx_fortinet_faz_hostname ON fortinet_fortianalyzer FIELDS hostname;

-- ============================================================================
-- BROADCOM - SECURE WEB GATEWAY (formerly Symantec/Blue Coat)
-- ============================================================================

DEFINE TABLE broadcom_swg SCHEMAFULL;

DEFINE FIELD name ON broadcom_swg TYPE string;
DEFINE FIELD hostname ON broadcom_swg TYPE string;
DEFINE FIELD ip_address ON broadcom_swg TYPE string;
DEFINE FIELD model ON broadcom_swg TYPE string; -- S200, S400, S500, Virtual
DEFINE FIELD serial_number ON broadcom_swg TYPE option<string>;
DEFINE FIELD firmware_version ON broadcom_swg TYPE string;
DEFINE FIELD mode ON broadcom_swg TYPE string; -- explicit, transparent, reverse
DEFINE FIELD deployment ON broadcom_swg TYPE string; -- inline, tap, cloud

-- Capacity
DEFINE FIELD max_users ON broadcom_swg TYPE option<int>;
DEFINE FIELD active_users ON broadcom_swg TYPE int DEFAULT 0;
DEFINE FIELD throughput_mbps ON broadcom_swg TYPE option<int>;

-- Management
DEFINE FIELD management_ip ON broadcom_swg TYPE option<string>;
DEFINE FIELD director ON broadcom_swg TYPE option<record<broadcom_swg_director>>;
DEFINE FIELD cluster ON broadcom_swg TYPE option<string>;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON broadcom_swg TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON broadcom_swg TYPE string DEFAULT "active";
DEFINE FIELD created_at ON broadcom_swg TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON broadcom_swg TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_broadcom_swg_name ON broadcom_swg FIELDS name;
DEFINE INDEX idx_broadcom_swg_hostname ON broadcom_swg FIELDS hostname;

-- ============================================================================
-- BROADCOM - SWG DIRECTOR (Management Appliance)
-- ============================================================================

DEFINE TABLE broadcom_swg_director SCHEMAFULL;

DEFINE FIELD name ON broadcom_swg_director TYPE string;
DEFINE FIELD hostname ON broadcom_swg_director TYPE string;
DEFINE FIELD ip_address ON broadcom_swg_director TYPE string;
DEFINE FIELD firmware_version ON broadcom_swg_director TYPE string;
DEFINE FIELD managed_appliance_count ON broadcom_swg_director TYPE int DEFAULT 0;

-- CMDB Reference
DEFINE FIELD cmdb_asset ON broadcom_swg_director TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON broadcom_swg_director TYPE string DEFAULT "active";
DEFINE FIELD created_at ON broadcom_swg_director TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON broadcom_swg_director TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_broadcom_dir_name ON broadcom_swg_director FIELDS name;

-- ============================================================================
-- BROADCOM - SWG POLICY
-- ============================================================================

DEFINE TABLE broadcom_swg_policy SCHEMAFULL;

DEFINE FIELD swg ON broadcom_swg_policy TYPE option<record<broadcom_swg>>;
DEFINE FIELD director ON broadcom_swg_policy TYPE option<record<broadcom_swg_director>>;
DEFINE FIELD name ON broadcom_swg_policy TYPE string;
DEFINE FIELD layer ON broadcom_swg_policy TYPE string; -- web_access, ssl_intercept, threat_protection
DEFINE FIELD order ON broadcom_swg_policy TYPE int;
DEFINE FIELD source ON broadcom_swg_policy TYPE object; -- user/group/IP conditions
DEFINE FIELD destination ON broadcom_swg_policy TYPE object; -- URL/category/application
DEFINE FIELD action ON broadcom_swg_policy TYPE string; -- allow, deny, coach, authenticate
DEFINE FIELD ssl_inspection ON broadcom_swg_policy TYPE bool DEFAULT false;
DEFINE FIELD threat_protection ON broadcom_swg_policy TYPE bool DEFAULT true;
DEFINE FIELD dlp_enabled ON broadcom_swg_policy TYPE bool DEFAULT false;
DEFINE FIELD logging ON broadcom_swg_policy TYPE bool DEFAULT true;
DEFINE FIELD status ON broadcom_swg_policy TYPE string DEFAULT "enabled";
DEFINE FIELD comment ON broadcom_swg_policy TYPE option<string>;
DEFINE FIELD created_at ON broadcom_swg_policy TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON broadcom_swg_policy TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_broadcom_pol_swg ON broadcom_swg_policy FIELDS swg;
DEFINE INDEX idx_broadcom_pol_layer ON broadcom_swg_policy FIELDS layer;

-- ============================================================================
-- BROADCOM - URL CATEGORY
-- ============================================================================

DEFINE TABLE broadcom_url_category SCHEMAFULL;

DEFINE FIELD name ON broadcom_swg_policy TYPE string;
DEFINE FIELD category_type ON broadcom_url_category TYPE string; -- predefined, custom
DEFINE FIELD parent_category ON broadcom_url_category TYPE option<string>;
DEFINE FIELD risk_level ON broadcom_url_category TYPE string DEFAULT "medium"; -- low, medium, high, critical
DEFINE FIELD urls ON broadcom_url_category TYPE array<string> DEFAULT []; -- For custom categories
DEFINE FIELD description ON broadcom_url_category TYPE option<string>;
DEFINE FIELD created_at ON broadcom_url_category TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON broadcom_url_category TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_broadcom_cat_name ON broadcom_url_category FIELDS name;
