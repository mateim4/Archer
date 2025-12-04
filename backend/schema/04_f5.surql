-- ============================================================================
-- LCMDesigner - F5 BIG-IP Load Balancer Schema
-- ============================================================================

-- ============================================================================
-- F5 - BIG-IP DEVICE
-- ============================================================================

DEFINE TABLE f5_bigip SCHEMAFULL;

DEFINE FIELD name ON f5_bigip TYPE string;
DEFINE FIELD hostname ON f5_bigip TYPE string;
DEFINE FIELD mgmt_ip ON f5_bigip TYPE string;
DEFINE FIELD model ON f5_bigip TYPE string; -- i2600, i4600, r5600, VE
DEFINE FIELD serial_number ON f5_bigip TYPE option<string>;
DEFINE FIELD version ON f5_bigip TYPE string; -- BIG-IP version
DEFINE FIELD build ON f5_bigip TYPE option<string>;
DEFINE FIELD edition ON f5_bigip TYPE string; -- Final, Point Release

-- Licensing
DEFINE FIELD license_type ON f5_bigip TYPE string; -- LTM, GTM, ASM, APM, AFM
DEFINE FIELD modules ON f5_bigip TYPE array<string> DEFAULT []; -- ltm, gtm, asm, apm, afm
DEFINE FIELD licensed_throughput ON f5_bigip TYPE option<string>;
DEFINE FIELD license_expiry ON f5_bigip TYPE option<datetime>;

-- Hardware/Virtual Resources
DEFINE FIELD platform ON f5_bigip TYPE string; -- hardware, virtual, cloud
DEFINE FIELD cpu_cores ON f5_bigip TYPE option<int>;
DEFINE FIELD memory_gb ON f5_bigip TYPE option<int>;
DEFINE FIELD is_vcmp ON f5_bigip TYPE bool DEFAULT false;
DEFINE FIELD vcmp_host ON f5_bigip TYPE option<record<f5_bigip>>;

-- High Availability
DEFINE FIELD ha_mode ON f5_bigip TYPE string DEFAULT "standalone"; -- standalone, active-standby, active-active
DEFINE FIELD failover_state ON f5_bigip TYPE string DEFAULT "active"; -- active, standby, offline
DEFINE FIELD device_group ON f5_bigip TYPE option<string>;
DEFINE FIELD sync_group ON f5_bigip TYPE option<string>;
DEFINE FIELD ha_peer ON f5_bigip TYPE option<record<f5_bigip>>;
DEFINE FIELD config_sync_ip ON f5_bigip TYPE option<string>;
DEFINE FIELD mirroring_ip ON f5_bigip TYPE option<string>;

-- Partitions
DEFINE FIELD partitions ON f5_bigip TYPE array<string> DEFAULT ["Common"];

-- CMDB Reference
DEFINE FIELD cmdb_asset ON f5_bigip TYPE option<record<cmdb_asset>>;

-- Audit
DEFINE FIELD status ON f5_bigip TYPE string DEFAULT "active";
DEFINE FIELD last_config_sync ON f5_bigip TYPE option<datetime>;
DEFINE FIELD created_at ON f5_bigip TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_bigip TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_bigip_name ON f5_bigip FIELDS name;
DEFINE INDEX idx_f5_bigip_hostname ON f5_bigip FIELDS hostname;
DEFINE INDEX idx_f5_bigip_serial ON f5_bigip FIELDS serial_number;

-- ============================================================================
-- F5 - VLAN
-- ============================================================================

DEFINE TABLE f5_vlan SCHEMAFULL;

DEFINE FIELD bigip ON f5_vlan TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_vlan TYPE string;
DEFINE FIELD partition ON f5_vlan TYPE string DEFAULT "Common";
DEFINE FIELD tag ON f5_vlan TYPE int;
DEFINE FIELD interfaces ON f5_vlan TYPE array<string> DEFAULT [];
DEFINE FIELD failsafe ON f5_vlan TYPE bool DEFAULT false;
DEFINE FIELD failsafe_timeout ON f5_vlan TYPE int DEFAULT 90;
DEFINE FIELD mtu ON f5_vlan TYPE int DEFAULT 1500;
DEFINE FIELD description ON f5_vlan TYPE option<string>;
DEFINE FIELD created_at ON f5_vlan TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_vlan TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_vlan_bigip ON f5_vlan FIELDS bigip;
DEFINE INDEX idx_f5_vlan_name ON f5_vlan FIELDS bigip, name UNIQUE;

-- ============================================================================
-- F5 - SELF IP
-- ============================================================================

DEFINE TABLE f5_self_ip SCHEMAFULL;

DEFINE FIELD bigip ON f5_self_ip TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_self_ip TYPE string;
DEFINE FIELD partition ON f5_self_ip TYPE string DEFAULT "Common";
DEFINE FIELD address ON f5_self_ip TYPE string;
DEFINE FIELD netmask ON f5_self_ip TYPE string;
DEFINE FIELD vlan ON f5_self_ip TYPE record<f5_vlan>;
DEFINE FIELD traffic_group ON f5_self_ip TYPE string DEFAULT "traffic-group-local-only";
DEFINE FIELD floating ON f5_self_ip TYPE bool DEFAULT false;
DEFINE FIELD allow_service ON f5_self_ip TYPE array<string> DEFAULT ["default"]; -- default, all, none, specific ports
DEFINE FIELD description ON f5_self_ip TYPE option<string>;
DEFINE FIELD created_at ON f5_self_ip TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_self_ip TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_selfip_bigip ON f5_self_ip FIELDS bigip;
DEFINE INDEX idx_f5_selfip_name ON f5_self_ip FIELDS bigip, name UNIQUE;

-- ============================================================================
-- F5 - NODE (Pool Member Backend Server)
-- ============================================================================

DEFINE TABLE f5_node SCHEMAFULL;

DEFINE FIELD bigip ON f5_node TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_node TYPE string;
DEFINE FIELD partition ON f5_node TYPE string DEFAULT "Common";
DEFINE FIELD address ON f5_node TYPE string;
DEFINE FIELD fqdn ON f5_node TYPE option<string>;
DEFINE FIELD connection_limit ON f5_node TYPE int DEFAULT 0; -- 0 = unlimited
DEFINE FIELD rate_limit ON f5_node TYPE int DEFAULT 0;
DEFINE FIELD ratio ON f5_node TYPE int DEFAULT 1;
DEFINE FIELD state ON f5_node TYPE string DEFAULT "enabled"; -- enabled, disabled, forced-offline
DEFINE FIELD session ON f5_node TYPE string DEFAULT "enabled"; -- enabled, disabled
DEFINE FIELD monitor ON f5_node TYPE option<string>; -- default node monitor
DEFINE FIELD description ON f5_node TYPE option<string>;

-- CMDB Reference (link to actual server)
DEFINE FIELD cmdb_server ON f5_node TYPE option<record<cmdb_server>>;

DEFINE FIELD created_at ON f5_node TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_node TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_node_bigip ON f5_node FIELDS bigip;
DEFINE INDEX idx_f5_node_name ON f5_node FIELDS bigip, name UNIQUE;
DEFINE INDEX idx_f5_node_address ON f5_node FIELDS bigip, address;

-- ============================================================================
-- F5 - POOL
-- ============================================================================

DEFINE TABLE f5_pool SCHEMAFULL;

DEFINE FIELD bigip ON f5_pool TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_pool TYPE string;
DEFINE FIELD partition ON f5_pool TYPE string DEFAULT "Common";
DEFINE FIELD description ON f5_pool TYPE option<string>;

-- Load Balancing
DEFINE FIELD lb_method ON f5_pool TYPE string DEFAULT "round-robin"; -- round-robin, ratio, least-connections, observed, predictive, etc.
DEFINE FIELD slow_ramp_time ON f5_pool TYPE int DEFAULT 10;
DEFINE FIELD reselect_tries ON f5_pool TYPE int DEFAULT 0;

-- Service
DEFINE FIELD service_down_action ON f5_pool TYPE string DEFAULT "none"; -- none, reset, drop, reselect
DEFINE FIELD allow_nat ON f5_pool TYPE bool DEFAULT true;
DEFINE FIELD allow_snat ON f5_pool TYPE bool DEFAULT true;

-- Monitor
DEFINE FIELD monitors ON f5_pool TYPE array<string> DEFAULT [];
DEFINE FIELD min_active_members ON f5_pool TYPE int DEFAULT 1;

-- Queue
DEFINE FIELD queue_on_connection_limit ON f5_pool TYPE bool DEFAULT false;
DEFINE FIELD queue_depth_limit ON f5_pool TYPE int DEFAULT 0;
DEFINE FIELD queue_time_limit ON f5_pool TYPE int DEFAULT 0;

-- Status
DEFINE FIELD availability_state ON f5_pool TYPE string DEFAULT "unknown"; -- available, offline, unknown
DEFINE FIELD enabled_state ON f5_pool TYPE string DEFAULT "enabled";

DEFINE FIELD created_at ON f5_pool TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_pool TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_pool_bigip ON f5_pool FIELDS bigip;
DEFINE INDEX idx_f5_pool_name ON f5_pool FIELDS bigip, name UNIQUE;

-- ============================================================================
-- F5 - POOL MEMBER
-- ============================================================================

DEFINE TABLE f5_pool_member SCHEMAFULL;

DEFINE FIELD pool ON f5_pool_member TYPE record<f5_pool>;
DEFINE FIELD node ON f5_pool_member TYPE record<f5_node>;
DEFINE FIELD port ON f5_pool_member TYPE int;
DEFINE FIELD priority_group ON f5_pool_member TYPE int DEFAULT 0;
DEFINE FIELD ratio ON f5_pool_member TYPE int DEFAULT 1;
DEFINE FIELD connection_limit ON f5_pool_member TYPE int DEFAULT 0;
DEFINE FIELD rate_limit ON f5_pool_member TYPE int DEFAULT 0;
DEFINE FIELD state ON f5_pool_member TYPE string DEFAULT "enabled"; -- enabled, disabled, forced-offline
DEFINE FIELD session ON f5_pool_member TYPE string DEFAULT "enabled";
DEFINE FIELD monitor ON f5_pool_member TYPE option<string>; -- inherit or custom

-- Status
DEFINE FIELD availability_state ON f5_pool_member TYPE string DEFAULT "unknown";
DEFINE FIELD enabled_state ON f5_pool_member TYPE string DEFAULT "enabled";

DEFINE FIELD created_at ON f5_pool_member TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_pool_member TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_member_pool ON f5_pool_member FIELDS pool;
DEFINE INDEX idx_f5_member_node ON f5_pool_member FIELDS node;

-- ============================================================================
-- F5 - VIRTUAL SERVER
-- ============================================================================

DEFINE TABLE f5_virtual_server SCHEMAFULL;

DEFINE FIELD bigip ON f5_virtual_server TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_virtual_server TYPE string;
DEFINE FIELD partition ON f5_virtual_server TYPE string DEFAULT "Common";
DEFINE FIELD description ON f5_virtual_server TYPE option<string>;

-- Destination
DEFINE FIELD destination_address ON f5_virtual_server TYPE string;
DEFINE FIELD destination_port ON f5_virtual_server TYPE int;
DEFINE FIELD destination_mask ON f5_virtual_server TYPE string DEFAULT "255.255.255.255";

-- Pool
DEFINE FIELD default_pool ON f5_virtual_server TYPE option<record<f5_pool>>;
DEFINE FIELD fallback_persistence ON f5_virtual_server TYPE option<string>;

-- Service
DEFINE FIELD ip_protocol ON f5_virtual_server TYPE string DEFAULT "tcp"; -- tcp, udp, sctp
DEFINE FIELD vs_type ON f5_virtual_server TYPE string DEFAULT "standard"; -- standard, forwarding-ip, forwarding-l2, performance-http, performance-l4, reject, dhcp-relay, internal, message-routing, stateless

-- Connection
DEFINE FIELD connection_limit ON f5_virtual_server TYPE int DEFAULT 0;
DEFINE FIELD rate_limit ON f5_virtual_server TYPE int DEFAULT 0;
DEFINE FIELD source_address_translation ON f5_virtual_server TYPE string DEFAULT "automap"; -- none, automap, snat

-- Profiles
DEFINE FIELD profiles ON f5_virtual_server TYPE array<string> DEFAULT [];
DEFINE FIELD http_profile ON f5_virtual_server TYPE option<string>;
DEFINE FIELD ssl_client_profile ON f5_virtual_server TYPE option<string>;
DEFINE FIELD ssl_server_profile ON f5_virtual_server TYPE option<string>;
DEFINE FIELD persistence_profile ON f5_virtual_server TYPE option<string>;
DEFINE FIELD oneconnect_profile ON f5_virtual_server TYPE option<string>;
DEFINE FIELD compression_profile ON f5_virtual_server TYPE option<string>;

-- Security
DEFINE FIELD asm_policy ON f5_virtual_server TYPE option<string>; -- WAF policy
DEFINE FIELD apm_policy ON f5_virtual_server TYPE option<string>; -- Access policy

-- iRules
DEFINE FIELD irules ON f5_virtual_server TYPE array<string> DEFAULT [];

-- Traffic Group (HA)
DEFINE FIELD traffic_group ON f5_virtual_server TYPE string DEFAULT "traffic-group-1";
DEFINE FIELD vlans ON f5_virtual_server TYPE array<string> DEFAULT [];
DEFINE FIELD vlans_enabled ON f5_virtual_server TYPE bool DEFAULT false;

-- Status
DEFINE FIELD state ON f5_virtual_server TYPE string DEFAULT "enabled";
DEFINE FIELD availability_state ON f5_virtual_server TYPE string DEFAULT "unknown";

-- CMDB Reference
DEFINE FIELD cmdb_service ON f5_virtual_server TYPE option<record<cmdb_service>>;

DEFINE FIELD created_at ON f5_virtual_server TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_virtual_server TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_vs_bigip ON f5_virtual_server FIELDS bigip;
DEFINE INDEX idx_f5_vs_name ON f5_virtual_server FIELDS bigip, name UNIQUE;
DEFINE INDEX idx_f5_vs_dest ON f5_virtual_server FIELDS destination_address, destination_port;

-- ============================================================================
-- F5 - MONITOR
-- ============================================================================

DEFINE TABLE f5_monitor SCHEMAFULL;

DEFINE FIELD bigip ON f5_monitor TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_monitor TYPE string;
DEFINE FIELD partition ON f5_monitor TYPE string DEFAULT "Common";
DEFINE FIELD type ON f5_monitor TYPE string; -- http, https, tcp, udp, icmp, gateway-icmp, inband, ldap, mysql, postgresql, etc.
DEFINE FIELD description ON f5_monitor TYPE option<string>;

-- Timing
DEFINE FIELD interval ON f5_monitor TYPE int DEFAULT 5;
DEFINE FIELD timeout ON f5_monitor TYPE int DEFAULT 16;
DEFINE FIELD time_until_up ON f5_monitor TYPE int DEFAULT 0;
DEFINE FIELD up_interval ON f5_monitor TYPE int DEFAULT 0;

-- HTTP/HTTPS Specific
DEFINE FIELD send_string ON f5_monitor TYPE option<string>;
DEFINE FIELD receive_string ON f5_monitor TYPE option<string>;
DEFINE FIELD receive_disable_string ON f5_monitor TYPE option<string>;
DEFINE FIELD reverse ON f5_monitor TYPE bool DEFAULT false;
DEFINE FIELD transparent ON f5_monitor TYPE bool DEFAULT false;
DEFINE FIELD adaptive ON f5_monitor TYPE bool DEFAULT false;

-- Destination
DEFINE FIELD destination ON f5_monitor TYPE string DEFAULT "*:*"; -- IP:port

-- Status
DEFINE FIELD is_builtin ON f5_monitor TYPE bool DEFAULT false;

DEFINE FIELD created_at ON f5_monitor TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_monitor TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_mon_bigip ON f5_monitor FIELDS bigip;
DEFINE INDEX idx_f5_mon_name ON f5_monitor FIELDS bigip, name UNIQUE;
DEFINE INDEX idx_f5_mon_type ON f5_monitor FIELDS type;

-- ============================================================================
-- F5 - SSL CERTIFICATE
-- ============================================================================

DEFINE TABLE f5_certificate SCHEMAFULL;

DEFINE FIELD bigip ON f5_certificate TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_certificate TYPE string;
DEFINE FIELD partition ON f5_certificate TYPE string DEFAULT "Common";
DEFINE FIELD common_name ON f5_certificate TYPE string;
DEFINE FIELD subject ON f5_certificate TYPE string;
DEFINE FIELD issuer ON f5_certificate TYPE string;
DEFINE FIELD key_type ON f5_certificate TYPE string; -- rsa, ecdsa
DEFINE FIELD key_size ON f5_certificate TYPE int;
DEFINE FIELD serial_number ON f5_certificate TYPE string;
DEFINE FIELD valid_from ON f5_certificate TYPE datetime;
DEFINE FIELD valid_to ON f5_certificate TYPE datetime;
DEFINE FIELD subject_alternative_names ON f5_certificate TYPE array<string> DEFAULT [];
DEFINE FIELD is_self_signed ON f5_certificate TYPE bool DEFAULT false;
DEFINE FIELD fingerprint_sha256 ON f5_certificate TYPE option<string>;
DEFINE FIELD created_at ON f5_certificate TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_certificate TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_cert_bigip ON f5_certificate FIELDS bigip;
DEFINE INDEX idx_f5_cert_name ON f5_certificate FIELDS bigip, name UNIQUE;
DEFINE INDEX idx_f5_cert_cn ON f5_certificate FIELDS common_name;
DEFINE INDEX idx_f5_cert_expiry ON f5_certificate FIELDS valid_to;

-- ============================================================================
-- F5 - IRULE
-- ============================================================================

DEFINE TABLE f5_irule SCHEMAFULL;

DEFINE FIELD bigip ON f5_irule TYPE record<f5_bigip>;
DEFINE FIELD name ON f5_irule TYPE string;
DEFINE FIELD partition ON f5_irule TYPE string DEFAULT "Common";
DEFINE FIELD api_anonymous ON f5_irule TYPE string; -- iRule TCL code
DEFINE FIELD description ON f5_irule TYPE option<string>;
DEFINE FIELD is_builtin ON f5_irule TYPE bool DEFAULT false;
DEFINE FIELD created_at ON f5_irule TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON f5_irule TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_f5_irule_bigip ON f5_irule FIELDS bigip;
DEFINE INDEX idx_f5_irule_name ON f5_irule FIELDS bigip, name UNIQUE;
