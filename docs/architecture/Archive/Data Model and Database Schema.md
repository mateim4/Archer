# 🗄️ Archer Data Model and Database Schema

> **Version:** 2.0  
> **Last Updated:** December 4, 2025  
> **Database:** SurrealDB  
> **Related Issue:** [GitHub Issue #12](https://github.com/mateim4/Archer/issues/12)

---

## Table of Contents

1. [[#Executive Summary]]
2. [[#Architecture Overview]]
3. [[#Schema File Organization]]
4. [[#Generic Abstraction Layer]]
5. [[#Vendor-Specific Tables]]
6. [[#Graph Relationships]]
7. [[#Rust Struct Integration]]
8. [[#Query Examples]]
9. [[#API Endpoints]]

---

## Executive Summary

The Archer CMDB (Configuration Management Database) and Monitoring schema provides comprehensive infrastructure management capabilities across **12 major enterprise platforms**. The schema uses a **two-tier architecture**:

1. **Generic Abstraction Layer** - Unified views across all vendors
2. **Vendor-Specific Layer** - Full-detail tables with platform-specific attributes

### Supported Platforms

| Category | Platforms |
|----------|-----------|
| **Hyperconverged/Virtualization** | Nutanix (Prism Central, AHV) |
| **Network Infrastructure** | Cisco (Catalyst Center, ISE, FMC) |
| **Security** | Fortinet (FortiGate, FortiManager), Broadcom SWG |
| **Load Balancing** | F5 BIG-IP |
| **Monitoring & SIEM** | Splunk, Nagios |
| **Application Infrastructure** | IBM WebSphere |
| **Backup & DR** | Veeam |
| **Identity & Access** | Microsoft Active Directory |
| **Container Orchestration** | Red Hat OpenShift |
| **Physical Infrastructure** | Avocent KVM |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│                    (React UI - Inventory View)                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                 │
│                    (Rust Backend - Axum)                            │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ CRUD APIs   │  │ Graph APIs  │  │ Sync APIs   │                │
│  │ /api/cmdb/* │  │ /api/topo/* │  │ /api/sync/* │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA ACCESS LAYER                            │
│                    (Rust Structs + SurrealDB)                       │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              GENERIC ABSTRACTION LAYER                       │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │   │
│  │  │ cmdb_server  │ │cmdb_network_ │ │ cmdb_app     │        │   │
│  │  │              │ │   device     │ │              │        │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘        │   │
│  │  ┌──────────────┐ ┌──────────────┐                          │   │
│  │  │ monitoring_  │ │ monitoring_  │                          │   │
│  │  │    alert     │ │   metric     │                          │   │
│  │  └──────────────┘ └──────────────┘                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                    Links via `vendor_record`                        │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              VENDOR-SPECIFIC LAYER                           │   │
│  │                                                              │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ nutanix_ │ │  cisco_  │ │ forti_   │ │   f5_    │       │   │
│  │  │    *     │ │    *     │ │    *     │ │    *     │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│  │  │ splunk_  │ │ nagios_  │ │websphere_│ │  veeam_  │       │   │
│  │  │    *     │ │    *     │ │    *     │ │    *     │       │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │   │
│  │  │   ad_    │ │openshift_│ │ avocent_ │                    │   │
│  │  │    *     │ │    *     │ │    *     │                    │   │
│  │  └──────────┘ └──────────┘ └──────────┘                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                    Graph Edges (Relations)                          │
│                                ▼                                    │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              GRAPH RELATIONSHIP LAYER                        │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │ manages │ │contains │ │ runs_on │ │connects_│           │   │
│  │  │         │ │         │ │         │ │   to    │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │   │
│  │  │depends_ │ │monitors │ │backs_up │ │member_of│           │   │
│  │  │   on    │ │         │ │         │ │         │           │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Schema File Organization

The schema is split into multiple files for maintainability:

```
backend/
├── schema/
│   ├── 00_core.surql           # Namespace, DB, generic tables
│   ├── 01_nutanix.surql        # Nutanix HCI objects
│   ├── 02_cisco.surql          # Cisco network objects
│   ├── 03_security.surql       # Fortinet, Broadcom SWG
│   ├── 04_loadbalancer.surql   # F5 BIG-IP
│   ├── 05_monitoring.surql     # Splunk, Nagios
│   ├── 06_applications.surql   # IBM WebSphere
│   ├── 07_identity.surql       # Microsoft AD
│   ├── 08_containers.surql     # Red Hat OpenShift
│   ├── 09_backup.surql         # Veeam
│   ├── 10_physical.surql       # Avocent KVM
│   └── 11_relationships.surql  # Graph edges
└── src/
    └── models/
        ├── mod.rs              # Module exports
        ├── cmdb.rs             # Generic CMDB structs
        ├── nutanix.rs          # Nutanix structs
        ├── cisco.rs            # Cisco structs
        ├── security.rs         # Security structs
        ├── loadbalancer.rs     # F5 structs
        ├── monitoring.rs       # Monitoring structs
        ├── applications.rs     # WebSphere structs
        ├── identity.rs         # AD structs
        ├── containers.rs       # OpenShift structs
        ├── backup.rs           # Veeam structs
        ├── physical.rs         # Avocent structs
        └── relationships.rs    # Graph edge structs
```

---

## Generic Abstraction Layer

### Purpose

The generic layer provides **unified querying** across all vendors. When the UI shows "All Servers", it queries `cmdb_server` regardless of whether they're Nutanix VMs, WebSphere nodes, or OpenShift workers.

### Tables

#### `cmdb_server`

Represents any compute resource (physical or virtual).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `record` | SurrealDB record ID |
| `name` | `string` | Display name |
| `hostname` | `string` | DNS hostname |
| `ip_addresses` | `array<string>` | All IP addresses |
| `mac_addresses` | `array<string>` | All MAC addresses |
| `server_type` | `string` | `physical`, `virtual`, `container` |
| `os` | `string` | Operating system |
| `os_version` | `string` | OS version |
| `cpu_cores` | `int` | Total CPU cores |
| `memory_gb` | `float` | Total RAM in GB |
| `storage_gb` | `float` | Total storage in GB |
| `status` | `string` | `online`, `offline`, `maintenance`, `unknown` |
| `vendor` | `string` | Source vendor (`nutanix`, `cisco`, etc.) |
| `vendor_record` | `record` | Link to vendor-specific record |
| `location` | `string` | Physical/logical location |
| `tags` | `array<string>` | User-defined tags |
| `created_at` | `datetime` | Record creation time |
| `updated_at` | `datetime` | Last update time |
| `last_seen` | `datetime` | Last successful poll |

#### `cmdb_network_device`

Represents network infrastructure (switches, routers, firewalls).

| Field | Type | Description |
|-------|------|-------------|
| `id` | `record` | SurrealDB record ID |
| `name` | `string` | Display name |
| `hostname` | `string` | DNS hostname |
| `management_ip` | `string` | Management IP |
| `device_type` | `string` | `switch`, `router`, `firewall`, `load_balancer`, `wlc` |
| `model` | `string` | Hardware model |
| `serial_number` | `string` | Serial number |
| `software_version` | `string` | Firmware/OS version |
| `port_count` | `int` | Number of ports |
| `status` | `string` | `online`, `offline`, `degraded` |
| `vendor` | `string` | Source vendor |
| `vendor_record` | `record` | Link to vendor-specific record |
| `location` | `string` | Physical location |
| `tags` | `array<string>` | User-defined tags |
| `created_at` | `datetime` | Record creation time |
| `updated_at` | `datetime` | Last update time |

#### `cmdb_application`

Represents deployed applications.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `record` | SurrealDB record ID |
| `name` | `string` | Application name |
| `app_type` | `string` | `web`, `api`, `database`, `middleware` |
| `version` | `string` | Application version |
| `environment` | `string` | `production`, `staging`, `development` |
| `url` | `string` | Access URL (if applicable) |
| `port` | `int` | Primary port |
| `status` | `string` | `running`, `stopped`, `failed` |
| `owner` | `string` | Responsible team/person |
| `vendor` | `string` | Source vendor |
| `vendor_record` | `record` | Link to vendor-specific record |
| `tags` | `array<string>` | User-defined tags |
| `created_at` | `datetime` | Record creation time |
| `updated_at` | `datetime` | Last update time |

#### `monitoring_alert`

Unified alert from any monitoring system.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `record` | SurrealDB record ID |
| `title` | `string` | Alert title |
| `message` | `string` | Alert message/description |
| `severity` | `string` | `critical`, `high`, `medium`, `low`, `info` |
| `status` | `string` | `active`, `acknowledged`, `resolved` |
| `source_system` | `string` | `nagios`, `splunk`, `nutanix`, etc. |
| `source_host` | `string` | Host that generated alert |
| `source_service` | `string` | Service name |
| `affected_asset` | `record` | Link to cmdb_server/cmdb_network_device |
| `triggered_at` | `datetime` | When alert fired |
| `acknowledged_at` | `datetime` | When acknowledged |
| `acknowledged_by` | `string` | Who acknowledged |
| `resolved_at` | `datetime` | When resolved |
| `ticket_id` | `record` | Link to ITSM ticket (if created) |
| `vendor_record` | `record` | Link to vendor-specific alert |
| `created_at` | `datetime` | Record creation time |

#### `monitoring_metric`

Time-series metric storage.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `record` | SurrealDB record ID |
| `asset` | `record` | Link to cmdb_server/cmdb_network_device |
| `metric_name` | `string` | e.g., `cpu_usage`, `memory_used`, `disk_io` |
| `value` | `float` | Metric value |
| `unit` | `string` | Unit of measurement |
| `timestamp` | `datetime` | When metric was collected |
| `source_system` | `string` | Monitoring system that collected it |
| `tags` | `object` | Additional dimensions |

---

## Vendor-Specific Tables

### Nutanix Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `nutanix_prism_central` | Multi-cluster management | uuid, version, ip_address, fqdn |
| `nutanix_cluster` | HCI cluster | uuid, name, vip, redundancy_factor, cpu/mem/storage metrics |
| `nutanix_host` | Physical node | uuid, serial, model, hypervisor, cpu/mem specs, mgmt_ip, ipmi_ip |
| `nutanix_cvm` | Controller VM | uuid, ip, version, state, host link |
| `nutanix_storage_pool` | Disk pool | uuid, capacity, disk_type, compression |
| `nutanix_storage_container` | Logical container | uuid, max_capacity, dedup, erasure_coding |
| `nutanix_vm` | Virtual machine | uuid, name, power_state, vcpu, memory, guest_os, ips |
| `nutanix_vdisk` | Virtual disk | uuid, size, container, vm link |
| `nutanix_network` | VLAN/subnet | uuid, name, vlan_id, gateway, dns |
| `nutanix_image` | Template/ISO | uuid, name, type, size |
| `nutanix_protection_domain` | DR protection | uuid, name, schedule, remote_site, rpo |

### Cisco Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `cisco_catalyst_center` | DNA Center | hostname, ip, version, device_count |
| `cisco_switch` | Network switch | hostname, serial, model, role, software_version |
| `cisco_switch_interface` | Switch port | if_index, if_name, speed, status, vlan_id, mac |
| `cisco_vlan` | VLAN definition | vlan_id, name, status |
| `cisco_fmc` | Firepower MC | hostname, version, device_count |
| `cisco_ftd` | Firepower device | name, serial, model, ha_status |
| `cisco_ise` | Identity Services | hostname, persona, version |
| `cisco_ise_endpoint` | Authenticated endpoint | mac, ip, profile, sgt |

### Fortinet Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `fortimanager` | Central management | hostname, version, adom_count |
| `fortigate_device` | Firewall | serial, hostname, model, firmware, ha_status |
| `fortigate_interface` | Network interface | name, type, ip, vlan_id, zone, status |
| `fortigate_address_object` | Address definition | name, type, subnet/range/fqdn |
| `fortigate_firewall_policy` | Security policy | policy_id, action, src/dst, services |
| `fortigate_vpn_tunnel` | IPsec tunnel | name, remote_gw, phase1/2 settings |
| `fortianalyzer` | Log analyzer | hostname, version, storage, log_rate |

### F5 BIG-IP Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `f5_bigip_device` | Load balancer | hostname, mgmt_ip, model, version, ha_status |
| `f5_node` | Backend server | name, ip, status, state |
| `f5_pool` | Server pool | name, lb_method, monitor |
| `f5_pool_member` | Pool member | node, port, status, state, priority |
| `f5_virtual_server` | VIP | name, dest_ip, dest_port, protocol, pool |
| `f5_monitor` | Health check | name, type, interval, timeout, send/receive |
| `f5_irule` | Traffic script | name, script content |
| `f5_ssl_profile` | SSL config | name, cert, cipher_suite, protocols |

### Monitoring Objects (Splunk/Nagios)

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `splunk_search_head` | Search tier | hostname, guid, version |
| `splunk_indexer` | Index tier | hostname, guid, disk_usage, indexing_rate |
| `splunk_forwarder` | Data collector | hostname, type, os, last_checkin |
| `splunk_index` | Data index | name, type, max_size, retention |
| `nagios_host` | Monitored host | host_name, address, check_command, state |
| `nagios_service` | Monitored service | description, host, check_command, state |
| `nagios_contact` | Alert recipient | name, email, notification_options |

### IBM WebSphere Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `websphere_dmgr` | Deployment manager | node_name, hostname, cell_name |
| `websphere_node` | WAS node | node_name, hostname, platform |
| `websphere_app_server` | Application server | server_name, node, ports, jvm_heap, state |
| `websphere_cluster` | Server cluster | name, members, session_replication |
| `websphere_application` | Deployed app | name, ear_path, targets, state |
| `websphere_datasource` | JDBC datasource | jndi_name, jdbc_provider, db_host |

### Active Directory Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `ad_forest` | AD forest | forest_name, functional_level, schema_version |
| `ad_domain` | AD domain | domain_fqdn, netbios_name, sid |
| `ad_domain_controller` | DC | hostname, ip, site, fsmo_roles, global_catalog |
| `ad_site` | AD site | name, subnets, site_links |
| `ad_ou` | Organizational unit | distinguished_name, name, parent_ou |
| `ad_user` | User account | dn, sam_account, upn, email, enabled |
| `ad_computer` | Computer account | dn, hostname, os, last_logon |
| `ad_group` | Security group | dn, sam_account, type, scope |
| `ad_gpo` | Group policy | guid, display_name, links |

### OpenShift Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `openshift_cluster` | OCP cluster | name, id, version, api_url, provider |
| `openshift_node` | Cluster node | name, hostname, ip, role, status, capacity |
| `openshift_project` | Namespace | name, display_name, status |
| `openshift_pod` | Pod | uid, name, namespace, node, ip, status |
| `openshift_deployment` | Deployment | uid, name, replicas_desired/current/available |
| `openshift_service` | K8s service | uid, name, type, cluster_ip, ports |
| `openshift_route` | Ingress route | uid, name, host, path, tls_termination |
| `openshift_pvc` | Storage claim | uid, name, storage_class, size, status |

### Veeam Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `veeam_backup_server` | VBR server | hostname, version, license_type |
| `veeam_backup_proxy` | Data mover | name, hostname, type, transport_mode |
| `veeam_backup_repository` | Storage target | name, type, path, capacity |
| `veeam_scaleout_repository` | SOBR | name, extents, capacity_tier |
| `veeam_backup_job` | Backup job | name, type, repository, schedule, retention |
| `veeam_restore_point` | Recovery point | vm_name, job, timestamp, size |

### Avocent KVM Objects

| Table | Description | Key Attributes |
|-------|-------------|----------------|
| `avocent_dsview` | Management software | version, server_ip, user_count |
| `avocent_kvm_switch` | KVM appliance | serial, model, hostname, port_count |
| `avocent_target_device` | Connected server | name, device_type, port_number |
| `avocent_console_server` | Serial console | serial, model, port_count |
| `avocent_session` | Access session | user, target, start_time, session_type |

---

## Graph Relationships

SurrealDB supports graph traversal via relation tables. Each relation connects two records with optional metadata.

### Relation Tables

| Relation | Description | Example |
|----------|-------------|---------|
| `manages` | Management control | Prism Central → Cluster |
| `contains` | Containment | Cluster → Host → VM |
| `runs_on` | Execution location | VM → Host, Pod → Node |
| `connects_to` | Network connectivity | Switch ↔ Switch (with port info) |
| `depends_on` | Service dependency | App → Database |
| `monitors` | Monitoring relationship | Nagios Service → Server |
| `backs_up` | Backup coverage | Veeam Job → VM |
| `member_of` | Group membership | User → Group, Host → Cluster |
| `authenticates` | Auth relationship | ISE → Endpoint |
| `load_balances` | LB relationship | F5 VIP → Pool → Members |

### Relation Schema

```sql
DEFINE TABLE manages SCHEMAFULL;
DEFINE FIELD in ON manages TYPE record;      -- The manager
DEFINE FIELD out ON manages TYPE record;     -- The managed
DEFINE FIELD relationship_type ON manages TYPE string;
DEFINE FIELD created_at ON manages TYPE datetime DEFAULT time::now();

DEFINE TABLE connects_to SCHEMAFULL;
DEFINE FIELD in ON connects_to TYPE record;
DEFINE FIELD out ON connects_to TYPE record;
DEFINE FIELD interface_a ON connects_to TYPE string;  -- Source interface
DEFINE FIELD interface_b ON connects_to TYPE string;  -- Dest interface
DEFINE FIELD link_type ON connects_to TYPE string;    -- fiber, copper, vlan
DEFINE FIELD speed ON connects_to TYPE string;        -- 1G, 10G, 100G
DEFINE FIELD created_at ON connects_to TYPE datetime DEFAULT time::now();
```

### Graph Query Examples

```sql
-- Find all VMs in a Nutanix cluster (2-hop traversal)
SELECT ->contains->nutanix_host->contains->nutanix_vm AS vms
FROM nutanix_cluster:cluster-uuid-123;

-- Get complete path from VM to storage
SELECT 
  <-contains<-nutanix_host AS host,
  <-contains<-nutanix_cluster AS cluster,
  ->uses->nutanix_storage_container AS storage
FROM nutanix_vm:vm-uuid-456;

-- Find all devices connected to a switch
SELECT <-connects_to->* AS connected_devices
FROM cisco_switch:switch-serial-789;

-- Get backup coverage for a VM
SELECT <-backs_up<-veeam_backup_job AS backup_jobs
FROM nutanix_vm:vm-uuid-456;
```

---

## Rust Struct Integration

### Location

Rust structs are in `backend/src/models/`.

### Pattern

Each table has a corresponding Rust struct with Serde serialization:

```rust
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

/// Generic CMDB server record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CmdbServer {
    pub id: Option<Thing>,
    pub name: String,
    pub hostname: String,
    pub ip_addresses: Vec<String>,
    pub mac_addresses: Vec<String>,
    pub server_type: ServerType,
    pub os: Option<String>,
    pub os_version: Option<String>,
    pub cpu_cores: Option<i32>,
    pub memory_gb: Option<f64>,
    pub storage_gb: Option<f64>,
    pub status: AssetStatus,
    pub vendor: String,
    pub vendor_record: Option<Thing>,
    pub location: Option<String>,
    pub tags: Vec<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
    pub updated_at: Option<chrono::DateTime<chrono::Utc>>,
    pub last_seen: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServerType {
    Physical,
    Virtual,
    Container,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AssetStatus {
    Online,
    Offline,
    Maintenance,
    Unknown,
}
```

### Usage in API

```rust
use crate::models::CmdbServer;

async fn get_servers(db: &Surreal<Client>) -> Result<Vec<CmdbServer>> {
    let servers: Vec<CmdbServer> = db.select("cmdb_server").await?;
    Ok(servers)
}

async fn create_server(db: &Surreal<Client>, server: CmdbServer) -> Result<CmdbServer> {
    let created: CmdbServer = db
        .create("cmdb_server")
        .content(server)
        .await?;
    Ok(created)
}
```

---

## Query Examples

### Basic CRUD

```sql
-- Create a server
CREATE cmdb_server CONTENT {
    name: "web-server-01",
    hostname: "web-server-01.example.com",
    ip_addresses: ["10.1.1.100"],
    server_type: "virtual",
    os: "Ubuntu",
    os_version: "22.04 LTS",
    cpu_cores: 4,
    memory_gb: 16,
    status: "online",
    vendor: "nutanix",
    vendor_record: nutanix_vm:uuid-123
};

-- Read all servers
SELECT * FROM cmdb_server WHERE status = "online";

-- Update server
UPDATE cmdb_server:server-id SET status = "maintenance";

-- Delete server
DELETE cmdb_server:server-id;
```

### Advanced Queries

```sql
-- Servers by vendor with count
SELECT vendor, count() AS total 
FROM cmdb_server 
GROUP BY vendor;

-- Active alerts by severity
SELECT severity, array::group(title) AS alerts
FROM monitoring_alert
WHERE status = "active"
GROUP BY severity;

-- Servers with critical alerts
SELECT 
    cmdb_server.*,
    (SELECT * FROM monitoring_alert 
     WHERE affected_asset = cmdb_server.id 
     AND status = "active" 
     AND severity = "critical") AS critical_alerts
FROM cmdb_server;

-- Full topology for a VM
SELECT 
    *,
    <-runs_on<-nutanix_host AS host,
    <-contains<-nutanix_cluster AS cluster,
    ->uses->nutanix_storage_container AS storage,
    ->connects_to->nutanix_network AS networks,
    <-backs_up<-veeam_backup_job AS backups,
    <-monitors<-nagios_service AS monitoring
FROM nutanix_vm:vm-uuid;
```

---

## API Endpoints

### CMDB APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cmdb/servers` | List all servers |
| `GET` | `/api/cmdb/servers/:id` | Get server by ID |
| `POST` | `/api/cmdb/servers` | Create server |
| `PUT` | `/api/cmdb/servers/:id` | Update server |
| `DELETE` | `/api/cmdb/servers/:id` | Delete server |
| `GET` | `/api/cmdb/servers/:id/relationships` | Get server relationships |

### Topology APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/topology/network` | Full network topology |
| `GET` | `/api/topology/path` | Path between two assets |
| `GET` | `/api/topology/dependencies/:id` | Asset dependencies |

### Monitoring APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/monitoring/alerts` | List alerts |
| `POST` | `/api/monitoring/alerts/:id/acknowledge` | Acknowledge alert |
| `POST` | `/api/monitoring/alerts/:id/resolve` | Resolve alert |
| `GET` | `/api/monitoring/metrics/:asset_id` | Get asset metrics |

### Sync APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/sync/nutanix` | Sync from Nutanix |
| `POST` | `/api/sync/cisco` | Sync from Cisco |
| `POST` | `/api/sync/fortigate` | Sync from Fortinet |
| `GET` | `/api/sync/status` | Get sync status |

---

## Related Links

- [[UI UX Specification Sheet]] - UI requirements
- [[CMO to FMO Migration]] - Issue #7 migration plan
- [GitHub Issue #12](https://github.com/mateim4/Archer/issues/12) - Implementation tracking

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-12-04 | Complete rewrite with 12-vendor support |
| 1.0 | 2025-11-01 | Initial hardware basket schema |
