//! Application Platform Infrastructure Models
//!
//! Type definitions for IBM WebSphere and Red Hat OpenShift.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use surrealdb::sql::Thing;

// ============================================================================
// WebSphere - Cell
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereCell {
    pub id: Option<Thing>,
    pub name: String,
    pub version: String,
    pub deployment_manager: Option<Thing>,
    pub profile_path: Option<String>,
    pub security_enabled: bool,
    pub node_count: i32,
    pub cluster_count: i32,
    pub application_count: i32,
    pub cmdb_service: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// WebSphere - Deployment Manager
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereDmgr {
    pub id: Option<Thing>,
    pub cell: Thing,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub profile_name: String,
    pub profile_path: String,
    pub soap_port: i32,
    pub admin_console_port: i32,
    pub admin_console_secure_port: i32,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// WebSphere - Node
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereNode {
    pub id: Option<Thing>,
    pub cell: Thing,
    pub name: String,
    pub hostname: String,
    pub ip_address: String,
    pub profile_name: String,
    pub node_agent_port: i32,
    pub is_managed: bool,
    pub server_count: i32,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// WebSphere - Cluster
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereCluster {
    pub id: Option<Thing>,
    pub cell: Thing,
    pub name: String,
    pub cluster_type: String,
    pub prefer_local: bool,
    pub member_count: i32,
    pub cmdb_service: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// WebSphere - Application Server
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereServer {
    pub id: Option<Thing>,
    pub cell: Thing,
    pub node: Thing,
    pub cluster: Option<Thing>,
    pub name: String,
    pub server_type: String,
    pub http_port: Option<i32>,
    pub https_port: Option<i32>,
    pub bootstrap_port: Option<i32>,
    pub soap_port: Option<i32>,
    pub jvm_initial_heap: i32,
    pub jvm_max_heap: i32,
    pub jvm_generic_args: Option<String>,
    pub deployed_applications: Vec<String>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// WebSphere - Application
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSphereApplication {
    pub id: Option<Thing>,
    pub cell: Thing,
    pub name: String,
    pub display_name: Option<String>,
    pub application_type: String,
    pub context_root: Option<String>,
    pub version: Option<String>,
    pub deployed_on_clusters: Vec<Thing>,
    pub deployed_on_servers: Vec<Thing>,
    pub starting_weight: i32,
    pub data_sources: Vec<String>,
    pub jms_resources: Vec<String>,
    pub cmdb_application: Option<Thing>,
    pub status: String,
    pub deployed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Cluster
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftCluster {
    pub id: Option<Thing>,
    pub name: String,
    pub api_url: String,
    pub console_url: Option<String>,
    pub version: String,
    pub platform: String,
    pub installation_type: String,
    pub cluster_network_cidr: String,
    pub service_network_cidr: String,
    pub sdn_type: String,
    pub identity_providers: Vec<String>,
    pub master_count: i32,
    pub worker_count: i32,
    pub infra_count: i32,
    pub namespace_count: i32,
    pub pod_count: i32,
    pub cmdb_service: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Node
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftNode {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub hostname: Option<String>,
    pub internal_ip: Option<String>,
    pub external_ip: Option<String>,
    pub role: String,
    pub labels: JsonValue,
    pub taints: Vec<JsonValue>,
    pub os_image: Option<String>,
    pub kernel_version: Option<String>,
    pub container_runtime: String,
    pub kubelet_version: Option<String>,
    pub cpu_capacity: Option<String>,
    pub memory_capacity: Option<String>,
    pub pods_capacity: i32,
    pub cpu_allocatable: Option<String>,
    pub memory_allocatable: Option<String>,
    pub ready: bool,
    pub disk_pressure: bool,
    pub memory_pressure: bool,
    pub pid_pressure: bool,
    pub network_unavailable: bool,
    pub cmdb_server: Option<Thing>,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Namespace (Project)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftNamespace {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub labels: JsonValue,
    pub annotations: JsonValue,
    pub resource_quota: Option<JsonValue>,
    pub limit_range: Option<JsonValue>,
    pub network_policies: Vec<String>,
    pub pod_count: i32,
    pub deployment_count: i32,
    pub service_count: i32,
    pub route_count: i32,
    pub phase: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Deployment
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftDeployment {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub namespace: Thing,
    pub name: String,
    pub labels: JsonValue,
    pub annotations: JsonValue,
    pub replicas: i32,
    pub ready_replicas: i32,
    pub available_replicas: i32,
    pub updated_replicas: i32,
    pub strategy: String,
    pub max_surge: Option<String>,
    pub max_unavailable: Option<String>,
    pub containers: Vec<JsonValue>,
    pub init_containers: Vec<JsonValue>,
    pub service_account: Option<String>,
    pub cmdb_application: Option<Thing>,
    pub conditions: Vec<JsonValue>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Pod
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftPod {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub namespace: Thing,
    pub name: String,
    pub node: Option<Thing>,
    pub labels: JsonValue,
    pub owner_kind: Option<String>,
    pub owner_name: Option<String>,
    pub pod_ip: Option<String>,
    pub host_ip: Option<String>,
    pub containers: Vec<JsonValue>,
    pub init_container_statuses: Vec<JsonValue>,
    pub container_statuses: Vec<JsonValue>,
    pub phase: String,
    pub qos_class: String,
    pub restart_count: i32,
    pub conditions: Vec<JsonValue>,
    pub start_time: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Service
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftService {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub namespace: Thing,
    pub name: String,
    pub labels: JsonValue,
    pub selector: JsonValue,
    pub service_type: String,
    pub cluster_ip: Option<String>,
    pub external_ips: Vec<String>,
    pub ports: Vec<JsonValue>,
    pub session_affinity: String,
    pub cmdb_service: Option<Thing>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Route
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftRoute {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub namespace: Thing,
    pub name: String,
    pub labels: JsonValue,
    pub host: String,
    pub path: Option<String>,
    pub service: Thing,
    pub target_port: Option<String>,
    pub tls_termination: Option<String>,
    pub insecure_edge_termination_policy: String,
    pub wildcard_policy: String,
    pub admitted: bool,
    pub ingress: Vec<JsonValue>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Persistent Volume
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftPv {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub name: String,
    pub labels: JsonValue,
    pub capacity: String,
    pub access_modes: Vec<String>,
    pub reclaim_policy: String,
    pub storage_class: Option<String>,
    pub volume_mode: String,
    pub volume_type: String,
    pub volume_source: JsonValue,
    pub claim_ref: Option<JsonValue>,
    pub phase: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// ============================================================================
// OpenShift - Persistent Volume Claim
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenShiftPvc {
    pub id: Option<Thing>,
    pub cluster: Thing,
    pub namespace: Thing,
    pub name: String,
    pub labels: JsonValue,
    pub storage_class: Option<String>,
    pub access_modes: Vec<String>,
    pub requested_storage: String,
    pub volume_mode: String,
    pub volume_name: Option<String>,
    pub phase: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
