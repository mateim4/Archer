// Migration Planning Wizard Data Models
// Complete type definitions for migration project management

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// =============================================================================
// PROJECT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardProject {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub status: ProjectStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // RVTools data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_filename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_upload_date: Option<DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rvtools_file_path: Option<String>,
    
    // Metadata
    pub total_vms: i32,
    pub total_clusters: i32,
    pub wizard_step: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProjectStatus {
    Draft,
    InProgress,
    Completed,
    Archived,
}

// =============================================================================
// VM MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardVM {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub powerstate: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<bool>,
    
    // Resources
    pub cpus: i32,
    pub memory_mb: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provisioned_mb: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub in_use_mb: Option<i32>,
    
    // Network
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primary_ip_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns_name: Option<String>,
    
    // Cluster info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cluster: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub datacenter: Option<String>,
    
    // OS info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub os: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    
    // Storage
    pub num_disks: i32,
    pub num_nics: i32,
    
    // Annotations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotation: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub folder: Option<String>,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// CLUSTER MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardCluster {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    
    // Hardware specs
    pub cpu_ghz: f64,
    pub total_cores: i32,
    pub memory_gb: i32,
    pub storage_tb: f64,
    
    // Network specs
    pub network_bandwidth_gbps: f64,
    
    // Oversubscription
    pub cpu_oversubscription_ratio: f64,
    pub memory_oversubscription_ratio: f64,
    
    // Strategy
    pub strategy: String,
    
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// =============================================================================
// PLACEMENT MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardPlacement {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub vm_id: Thing,
    pub cluster_id: Thing,
    
    // Strategy
    pub strategy: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence_score: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings: Option<Vec<String>>,
    
    // Resource allocation
    pub allocated_cpu: i32,
    pub allocated_memory_mb: i32,
    pub allocated_storage_gb: f64,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// NETWORK MAPPING MODELS
// =============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MigrationWizardNetworkMapping {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,
    pub project_id: Thing,
    
    // Source network
    pub source_vlan_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_vlan_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_subnet: Option<String>,
    
    // Destination network
    pub destination_vlan_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_vlan_id: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_subnet: Option<String>,
    
    // Gateway and DNS
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_gateway: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub destination_dns: Option<Vec<String>>,
    
    // Validation
    pub is_valid: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub validation_errors: Option<Vec<String>>,
    
    pub created_at: DateTime<Utc>,
}

// =============================================================================
// REQUEST/RESPONSE MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateProjectRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreateProjectResponse {
    pub id: String,
    pub name: String,
    pub status: ProjectStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UploadRVToolsRequest {
    pub filename: String,
    // File data will come from multipart form data
}

#[derive(Debug, Serialize)]
pub struct UploadRVToolsResponse {
    pub project_id: String,
    pub filename: String,
    pub total_vms: i32,
    pub upload_date: DateTime<Utc>,
    pub processing_status: String,
}

#[derive(Debug, Serialize)]
pub struct ListProjectsResponse {
    pub projects: Vec<MigrationWizardProject>,
    pub total: usize,
}

#[derive(Debug, Serialize)]
pub struct ProjectDetailsResponse {
    pub project: MigrationWizardProject,
    pub vms: Vec<MigrationWizardVM>,
    pub clusters: Vec<MigrationWizardCluster>,
}

#[derive(Debug, Serialize)]
pub struct ListVMsResponse {
    pub vms: Vec<MigrationWizardVM>,
    pub total: usize,
}

// =============================================================================
// FILTER MODELS
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct ProjectFilter {
    pub status: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct VMFilter {
    pub cluster: Option<String>,
    pub powerstate: Option<String>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}
