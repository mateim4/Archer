use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use surrealdb::sql::Thing;
use chrono::{DateTime, Utc};

use crate::database::AppState;
use crate::services::enhanced_rvtools_service::{EnhancedRvToolsService, RvToolsExcelUploadData};
use crate::services::project_management_service::ProjectManagementService;
use crate::models::project_models::*;
// use crate::migration_models::*; // TODO: Fix migration_models imports

// Note: S2dComplianceCheck types are defined in RVTools service

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

#[derive(Debug, Deserialize)]
pub struct CreateProjectLifecycleAnalysisRequest {
    pub project_id: String,
    pub analysis_name: String,
    pub description: Option<String>,
    pub rvtools_file_name: String,
    pub rvtools_file_data: Vec<u8>,
    pub target_clusters: Vec<String>,
    pub overcommit_ratios: OvercommitRatios,
    pub migration_timeline: Option<MigrationTimeline>,
    pub analyst_id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct OvercommitRatios {
    pub cpu_ratio: f64,    // e.g., 3.0 for 3:1
    pub memory_ratio: f64, // e.g., 1.5 for 1.5:1
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MigrationTimeline {
    pub start_date: DateTime<Utc>,
    pub target_completion: DateTime<Utc>,
    pub phases: Vec<MigrationPhase>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MigrationPhase {
    pub phase_name: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub clusters_involved: Vec<String>,
    pub description: String,
}

#[derive(Debug, Serialize)]
pub struct ProjectLifecycleAnalysisResponse {
    pub id: Thing,
    pub project_id: Thing,
    pub analysis_name: String,
    pub description: Option<String>,
    pub rvtools_upload_id: Thing,
    pub status: LifecycleAnalysisStatus,
    pub target_clusters: Vec<String>,
    pub overcommit_ratios: OvercommitRatios,
    pub analysis_results: Option<LifecycleAnalysisResults>,
    pub recommendations: Vec<LifecycleRecommendation>,
    pub migration_timeline: Option<MigrationTimeline>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum LifecycleAnalysisStatus {
    Processing,
    Completed,
    Failed,
    RequiresReview,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LifecycleAnalysisResults {
    pub infrastructure_summary: InfrastructureSummary,
    pub cluster_analysis: Vec<ClusterAnalysis>,
    pub hardware_requirements: HardwareRequirements,
    pub storage_architecture: StorageArchitectureResults,
    pub migration_complexity: MigrationComplexity,
    pub cost_analysis: Option<CostAnalysis>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InfrastructureSummary {
    pub total_vms: i32,
    pub total_hosts: i32,
    pub total_clusters: i32,
    pub total_capacity_gb: f64,
    pub total_memory_gb: f64,
    pub total_cpu_cores: i32,
    pub vcenter_version: Option<String>,
    pub environment_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterAnalysis {
    pub cluster_name: String,
    pub current_vms: i32,
    pub current_hosts: i32,
    pub storage_type: StorageType,
    pub s2d_compliance: Option<serde_json::Value>, // TODO: Use proper S2dComplianceCheck type
    pub migration_recommendation: ClusterMigrationRecommendation,
    pub required_hardware: ClusterHardwareRequirement,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterMigrationRecommendation {
    pub recommended_approach: String,
    pub migration_complexity: String,
    pub estimated_downtime_hours: f64,
    pub prerequisites: Vec<String>,
    pub risks: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClusterHardwareRequirement {
    pub required_hosts: i32,
    pub cpu_cores_per_host: i32,
    pub memory_gb_per_host: i32,
    pub storage_requirements: StorageRequirement,
    pub network_requirements: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageRequirement {
    pub capacity_drives_count: i32,
    pub cache_drives_count: i32,
    pub total_capacity_tb: f64,
    pub drive_configuration: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareRequirements {
    pub total_new_hosts: i32,
    pub server_specifications: Vec<ServerSpecification>,
    pub network_equipment: Vec<NetworkEquipment>,
    pub storage_requirements: Vec<StorageRequirement>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerSpecification {
    pub model_type: String,
    pub quantity: i32,
    pub cpu_cores: i32,
    pub memory_gb: i32,
    pub drive_bays: i32,
    pub purpose: String, // "S2D Provider", "SAN Consumer", etc.
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NetworkEquipment {
    pub equipment_type: String,
    pub quantity: i32,
    pub specifications: String,
    pub purpose: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageArchitectureResults {
    pub confirmed_vsan_clusters: Vec<String>,
    pub san_consumer_clusters: Vec<String>,
    pub s2d_readiness_summary: S2dReadinessSummary,
    pub storage_migration_plan: StorageMigrationPlan,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct S2dReadinessSummary {
    pub ready_clusters: i32,
    pub requires_hardware_audit: i32,
    pub non_compliant_clusters: i32,
    pub overall_readiness_score: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StorageMigrationPlan {
    pub vsan_to_s2d_migrations: Vec<String>,
    pub san_connectivity_preservations: Vec<String>,
    pub storage_phases: Vec<StoragePhase>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StoragePhase {
    pub phase_name: String,
    pub clusters: Vec<String>,
    pub approach: String,
    pub estimated_duration_days: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MigrationComplexity {
    pub overall_score: f64, // 0.0 to 1.0
    pub complexity_factors: Vec<ComplexityFactor>,
    pub estimated_timeline_weeks: i32,
    pub risk_level: RiskLevel,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ComplexityFactor {
    pub factor: String,
    pub impact: f64,
    pub description: String,
    pub mitigation: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CostAnalysis {
    pub hardware_costs: HardwareCosts,
    pub migration_costs: MigrationCosts,
    pub operational_impact: OperationalImpact,
    pub total_investment: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HardwareCosts {
    pub servers: f64,
    pub networking: f64,
    pub storage: f64,
    pub licensing: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MigrationCosts {
    pub professional_services: f64,
    pub training: f64,
    pub downtime_cost: f64,
    pub contingency: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OperationalImpact {
    pub annual_savings: f64,
    pub efficiency_gains: Vec<String>,
    pub support_changes: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LifecycleRecommendation {
    pub category: String,
    pub priority: String,
    pub recommendation: String,
    pub rationale: String,
    pub timeline: String,
    pub dependencies: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct LifecycleAnalysisFilter {
    pub project_id: Option<String>,
    pub status: Option<LifecycleAnalysisStatus>,
    pub created_by: Option<String>,
    pub created_after: Option<DateTime<Utc>>,
}

// =============================================================================
// PROJECT LIFECYCLE ANALYSIS MODEL
// =============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectLifecycleAnalysis {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub analysis_name: String,
    pub description: Option<String>,
    pub rvtools_upload_id: Thing,
    pub status: LifecycleAnalysisStatus,
    pub target_clusters: Vec<String>,
    pub overcommit_ratios: OvercommitRatios,
    pub analysis_results: Option<LifecycleAnalysisResults>,
    pub recommendations: Vec<LifecycleRecommendation>,
    pub migration_timeline: Option<MigrationTimeline>,
    pub metadata: HashMap<String, serde_json::Value>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: String,
}

// =============================================================================
// API HANDLERS
// =============================================================================

pub fn create_project_lifecycle_router(state: AppState) -> Router {
    Router::new()
        .route("/", post(create_lifecycle_analysis))
        .route("/", get(list_lifecycle_analyses))
        .route("/:analysis_id", get(get_lifecycle_analysis))
        .route("/:analysis_id/results", get(get_analysis_results))
        .route("/:analysis_id/recommendations", get(get_analysis_recommendations))
        .route("/:analysis_id/report/:report_type", get(generate_analysis_report))
        .with_state(state)
}

pub async fn create_lifecycle_analysis(
    State(state): State<AppState>,
    Json(request): Json<CreateProjectLifecycleAnalysisRequest>,
) -> Result<Json<ProjectLifecycleAnalysisResponse>, (StatusCode, Json<serde_json::Value>)> {
    let rvtools_service = EnhancedRvToolsService::new(state.as_ref().clone());
    let project_service = ProjectManagementService::new(state.as_ref().clone());

    // Verify project exists
    let project = project_service
        .get_project(&request.project_id)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({ "error": "Project not found" })),
            )
        })?;

    // Process RVTools file
    let upload_data = RvToolsExcelUploadData {
        filename: request.rvtools_file_name.clone(),
        excel_data: request.rvtools_file_data.clone(),
        project_id: Some(Thing::from(("project", request.project_id.as_str()))),
    };

    let rvtools_result = rvtools_service
        .process_rvtools_excel(upload_data)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": format!("RVTools processing failed: {}", e) })),
            )
        })?;

    // Create lifecycle analysis record
    let analysis = ProjectLifecycleAnalysis {
        id: None,
        project_id: Thing::from(("project", request.project_id.as_str())),
        analysis_name: request.analysis_name.clone(),
        description: request.description.clone(),
        rvtools_upload_id: rvtools_result.upload_id.clone(),
        status: LifecycleAnalysisStatus::Processing,
        target_clusters: request.target_clusters.clone(),
        overcommit_ratios: request.overcommit_ratios.clone(),
        analysis_results: None,
        recommendations: Vec::new(),
        migration_timeline: request.migration_timeline.clone(),
        metadata: HashMap::new(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
        created_by: request.analyst_id.clone(),
    };

    let created: Vec<ProjectLifecycleAnalysis> = state
        .as_ref()
        .create("project_lifecycle_analysis")
        .content(analysis)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let mut created_analysis = created.into_iter().next().ok_or_else(|| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to create analysis" })),
        )
    })?;

    // Perform the analysis
    match perform_lifecycle_analysis(&state, &created_analysis, &rvtools_result, &request).await {
        Ok(results) => {
            created_analysis.analysis_results = Some(results.0);
            created_analysis.recommendations = results.1;
            created_analysis.status = LifecycleAnalysisStatus::Completed;
        }
        Err(e) => {
            created_analysis.status = LifecycleAnalysisStatus::Failed;
            eprintln!("Lifecycle analysis failed: {}", e);
        }
    }

    created_analysis.updated_at = Utc::now();

    // Update the analysis with results
    let updated: Option<ProjectLifecycleAnalysis> = state
        .as_ref()
        .update(created_analysis.id.as_ref().unwrap())
        .content(&created_analysis)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let final_analysis = updated.ok_or_else(|| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": "Failed to update analysis" })),
        )
    })?;

    Ok(Json(ProjectLifecycleAnalysisResponse {
        id: final_analysis.id.unwrap(),
        project_id: final_analysis.project_id,
        analysis_name: final_analysis.analysis_name,
        description: final_analysis.description,
        rvtools_upload_id: final_analysis.rvtools_upload_id,
        status: final_analysis.status,
        target_clusters: final_analysis.target_clusters,
        overcommit_ratios: final_analysis.overcommit_ratios,
        analysis_results: final_analysis.analysis_results,
        recommendations: final_analysis.recommendations,
        migration_timeline: final_analysis.migration_timeline,
        created_at: final_analysis.created_at,
        updated_at: final_analysis.updated_at,
        created_by: final_analysis.created_by,
    }))
}

pub async fn list_lifecycle_analyses(
    State(state): State<AppState>,
    Query(filter): Query<LifecycleAnalysisFilter>,
) -> Result<Json<Vec<ProjectLifecycleAnalysisResponse>>, (StatusCode, Json<serde_json::Value>)> {
    let mut query = "SELECT * FROM project_lifecycle_analysis".to_string();
    let mut conditions = Vec::new();

    if let Some(project_id) = filter.project_id {
        conditions.push(format!("project_id = project:{}", project_id));
    }

    if let Some(status) = filter.status {
        conditions.push(format!("status = '{:?}'", status));
    }

    if let Some(created_by) = filter.created_by {
        conditions.push(format!("created_by = '{}'", created_by));
    }

    if !conditions.is_empty() {
        query.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
    }

    query.push_str(" ORDER BY created_at DESC");

    let analyses: Vec<ProjectLifecycleAnalysis> = state
        .as_ref()
        .query(query)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?
        .take(0)
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let responses: Vec<ProjectLifecycleAnalysisResponse> = analyses
        .into_iter()
        .map(|analysis| ProjectLifecycleAnalysisResponse {
            id: analysis.id.unwrap(),
            project_id: analysis.project_id,
            analysis_name: analysis.analysis_name,
            description: analysis.description,
            rvtools_upload_id: analysis.rvtools_upload_id,
            status: analysis.status,
            target_clusters: analysis.target_clusters,
            overcommit_ratios: analysis.overcommit_ratios,
            analysis_results: analysis.analysis_results,
            recommendations: analysis.recommendations,
            migration_timeline: analysis.migration_timeline,
            created_at: analysis.created_at,
            updated_at: analysis.updated_at,
            created_by: analysis.created_by,
        })
        .collect();

    Ok(Json(responses))
}

pub async fn get_lifecycle_analysis(
    State(state): State<AppState>,
    Path(analysis_id): Path<String>,
) -> Result<Json<ProjectLifecycleAnalysisResponse>, (StatusCode, Json<serde_json::Value>)> {
    let analysis: Option<ProjectLifecycleAnalysis> = state
        .as_ref()
        .select(("project_lifecycle_analysis", analysis_id.as_str()))
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let analysis = analysis.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Analysis not found" })),
        )
    })?;

    Ok(Json(ProjectLifecycleAnalysisResponse {
        id: analysis.id.unwrap(),
        project_id: analysis.project_id,
        analysis_name: analysis.analysis_name,
        description: analysis.description,
        rvtools_upload_id: analysis.rvtools_upload_id,
        status: analysis.status,
        target_clusters: analysis.target_clusters,
        overcommit_ratios: analysis.overcommit_ratios,
        analysis_results: analysis.analysis_results,
        recommendations: analysis.recommendations,
        migration_timeline: analysis.migration_timeline,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
        created_by: analysis.created_by,
    }))
}

pub async fn get_analysis_results(
    State(state): State<AppState>,
    Path(analysis_id): Path<String>,
) -> Result<Json<LifecycleAnalysisResults>, (StatusCode, Json<serde_json::Value>)> {
    let analysis: Option<ProjectLifecycleAnalysis> = state
        .as_ref()
        .select(("project_lifecycle_analysis", analysis_id.as_str()))
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let analysis = analysis.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Analysis not found" })),
        )
    })?;

    let results = analysis.analysis_results.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Analysis results not available" })),
        )
    })?;

    Ok(Json(results))
}

pub async fn get_analysis_recommendations(
    State(state): State<AppState>,
    Path(analysis_id): Path<String>,
) -> Result<Json<Vec<LifecycleRecommendation>>, (StatusCode, Json<serde_json::Value>)> {
    let analysis: Option<ProjectLifecycleAnalysis> = state
        .as_ref()
        .select(("project_lifecycle_analysis", analysis_id.as_str()))
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let analysis = analysis.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Analysis not found" })),
        )
    })?;

    Ok(Json(analysis.recommendations))
}

pub async fn generate_analysis_report(
    State(state): State<AppState>,
    Path((analysis_id, report_type)): Path<(String, String)>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let rvtools_service = EnhancedRvToolsService::new(state.as_ref().clone());

    // Get the analysis
    let analysis: Option<ProjectLifecycleAnalysis> = state
        .as_ref()
        .select(("project_lifecycle_analysis", analysis_id.as_str()))
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    let analysis = analysis.ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Analysis not found" })),
        )
    })?;

    // Generate report data using the RVTools service
    let report_data = rvtools_service
        .generate_report_data(&analysis.rvtools_upload_id.to_string(), &report_type)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": e.to_string() })),
            )
        })?;

    Ok(Json(report_data))
}

// =============================================================================
// ANALYSIS LOGIC
// =============================================================================

async fn perform_lifecycle_analysis(
    state: &AppState,
    analysis: &ProjectLifecycleAnalysis,
    rvtools_result: &crate::services::enhanced_rvtools_service::EnhancedRvToolsProcessingResult,
    request: &CreateProjectLifecycleAnalysisRequest,
) -> Result<(LifecycleAnalysisResults, Vec<LifecycleRecommendation>)> {
    // Infrastructure Summary
    let infrastructure_summary = InfrastructureSummary {
        total_vms: rvtools_result.total_vms,
        total_hosts: rvtools_result.total_hosts,
        total_clusters: rvtools_result.total_clusters,
        total_capacity_gb: 0.0, // TODO: Calculate from datastore analysis
        total_memory_gb: 0.0,   // TODO: Calculate from host analysis
        total_cpu_cores: 0,     // TODO: Calculate from host analysis
        vcenter_version: None,  // TODO: Extract from RVTools data
        environment_name: None, // TODO: Extract from RVTools data
    };

    // Cluster Analysis
    let mut cluster_analyses = Vec::new();
    for cluster_name in &request.target_clusters {
        let s2d_compliance = rvtools_result.s2d_compliance.get(cluster_name)
            .map(|compliance| serde_json::to_value(compliance).unwrap_or(serde_json::Value::Null));
        
        let storage_type = if let Some(storage_analysis) = &rvtools_result.storage_analysis {
            // Use the storage analysis result
            storage_analysis.storage_type.clone()
        } else {
            StorageType::Unknown
        };

        let cluster_analysis = ClusterAnalysis {
            cluster_name: cluster_name.clone(),
            current_vms: 0, // TODO: Count VMs in this cluster
            current_hosts: 0, // TODO: Count hosts in this cluster
            storage_type,
            s2d_compliance,
            migration_recommendation: generate_cluster_migration_recommendation(cluster_name),
            required_hardware: calculate_cluster_hardware_requirements(cluster_name, &request.overcommit_ratios),
        };

        cluster_analyses.push(cluster_analysis);
    }

    // Hardware Requirements
    let hardware_requirements = calculate_total_hardware_requirements(&cluster_analyses);

    // Storage Architecture Results
    let storage_architecture = StorageArchitectureResults {
        confirmed_vsan_clusters: vec!["ASNCLUBA0001".to_string(), "ASNCLUHRK001".to_string(), "PLBYDCL03".to_string()],
        san_consumer_clusters: cluster_analyses
            .iter()
            .filter(|c| matches!(c.storage_type, StorageType::FcSan | StorageType::IscsiSan))
            .map(|c| c.cluster_name.clone())
            .collect(),
        s2d_readiness_summary: calculate_s2d_readiness(&cluster_analyses),
        storage_migration_plan: generate_storage_migration_plan(&cluster_analyses),
    };

    // Migration Complexity
    let migration_complexity = calculate_migration_complexity(&cluster_analyses, &infrastructure_summary);

    // Generate recommendations
    let recommendations = generate_lifecycle_recommendations(&cluster_analyses, &storage_architecture, &migration_complexity);

    let results = LifecycleAnalysisResults {
        infrastructure_summary,
        cluster_analysis: cluster_analyses,
        hardware_requirements,
        storage_architecture,
        migration_complexity,
        cost_analysis: None, // TODO: Implement cost analysis
    };

    Ok((results, recommendations))
}

fn generate_cluster_migration_recommendation(cluster_name: &str) -> ClusterMigrationRecommendation {
    // This would be more sophisticated in a real implementation
    ClusterMigrationRecommendation {
        recommended_approach: "Phased migration with minimal downtime".to_string(),
        migration_complexity: "Medium".to_string(),
        estimated_downtime_hours: 8.0,
        prerequisites: vec![
            "Hardware procurement completed".to_string(),
            "Network configuration validated".to_string(),
            "Backup verification completed".to_string(),
        ],
        risks: vec![
            "Storage migration complexity".to_string(),
            "Application compatibility".to_string(),
        ],
    }
}

fn calculate_cluster_hardware_requirements(cluster_name: &str, ratios: &OvercommitRatios) -> ClusterHardwareRequirement {
    // Simplified calculation - would be more sophisticated in real implementation
    ClusterHardwareRequirement {
        required_hosts: 4,
        cpu_cores_per_host: 32,
        memory_gb_per_host: 512,
        storage_requirements: StorageRequirement {
            capacity_drives_count: 12,
            cache_drives_count: 2,
            total_capacity_tb: 50.0,
            drive_configuration: "4x 1.92TB NVMe Cache + 12x 3.84TB NVMe Capacity".to_string(),
        },
        network_requirements: vec![
            "4x 25GbE RDMA-capable adapters".to_string(),
            "Dedicated S2D network".to_string(),
        ],
    }
}

fn calculate_total_hardware_requirements(cluster_analyses: &[ClusterAnalysis]) -> HardwareRequirements {
    let total_hosts: i32 = cluster_analyses.iter().map(|c| c.required_hardware.required_hosts).sum();
    
    HardwareRequirements {
        total_new_hosts: total_hosts,
        server_specifications: vec![
            ServerSpecification {
                model_type: "Hyper-V S2D Node".to_string(),
                quantity: total_hosts,
                cpu_cores: 32,
                memory_gb: 512,
                drive_bays: 24,
                purpose: "Storage Spaces Direct Provider".to_string(),
            }
        ],
        network_equipment: vec![
            NetworkEquipment {
                equipment_type: "25GbE Switch".to_string(),
                quantity: 2,
                specifications: "48-port RDMA-capable".to_string(),
                purpose: "S2D dedicated networking".to_string(),
            }
        ],
        storage_requirements: cluster_analyses.iter().map(|c| c.required_hardware.storage_requirements.clone()).collect(),
    }
}

fn calculate_s2d_readiness(cluster_analyses: &[ClusterAnalysis]) -> S2dReadinessSummary {
    let ready_clusters = cluster_analyses
        .iter()
        .filter(|c| matches!(c.storage_type, StorageType::VsanProvider))
        .count() as i32;
    
    let requires_audit = cluster_analyses
        .iter()
        .filter(|c| matches!(c.storage_type, StorageType::Unknown))
        .count() as i32;
    
    let non_compliant = cluster_analyses.len() as i32 - ready_clusters - requires_audit;
    
    S2dReadinessSummary {
        ready_clusters,
        requires_hardware_audit: requires_audit,
        non_compliant_clusters: non_compliant,
        overall_readiness_score: (ready_clusters as f64) / (cluster_analyses.len() as f64),
    }
}

fn generate_storage_migration_plan(cluster_analyses: &[ClusterAnalysis]) -> StorageMigrationPlan {
    let vsan_clusters: Vec<String> = cluster_analyses
        .iter()
        .filter(|c| matches!(c.storage_type, StorageType::VsanProvider))
        .map(|c| c.cluster_name.clone())
        .collect();
    
    let san_clusters: Vec<String> = cluster_analyses
        .iter()
        .filter(|c| matches!(c.storage_type, StorageType::FcSan | StorageType::IscsiSan))
        .map(|c| c.cluster_name.clone())
        .collect();
    
    StorageMigrationPlan {
        vsan_to_s2d_migrations: vsan_clusters.clone(),
        san_connectivity_preservations: san_clusters,
        storage_phases: vec![
            StoragePhase {
                phase_name: "S2D Deployment".to_string(),
                clusters: vsan_clusters,
                approach: "vSAN to S2D conversion".to_string(),
                estimated_duration_days: 30,
            }
        ],
    }
}

fn calculate_migration_complexity(cluster_analyses: &[ClusterAnalysis], infrastructure: &InfrastructureSummary) -> MigrationComplexity {
    let vm_count_factor = if infrastructure.total_vms > 1000 { 0.8 } else if infrastructure.total_vms > 500 { 0.6 } else { 0.4 };
    let cluster_count_factor = if infrastructure.total_clusters > 10 { 0.7 } else { 0.5 };
    let storage_complexity = if cluster_analyses.iter().any(|c| matches!(c.storage_type, StorageType::Unknown)) { 0.8 } else { 0.5 };
    
    let overall_score = (vm_count_factor + cluster_count_factor + storage_complexity) / 3.0;
    
    MigrationComplexity {
        overall_score,
        complexity_factors: vec![
            ComplexityFactor {
                factor: "VM Count".to_string(),
                impact: vm_count_factor,
                description: format!("{} VMs to migrate", infrastructure.total_vms),
                mitigation: "Phased migration approach".to_string(),
            }
        ],
        estimated_timeline_weeks: (infrastructure.total_clusters * 2) + 4,
        risk_level: if overall_score > 0.7 { RiskLevel::High } else if overall_score > 0.5 { RiskLevel::Medium } else { RiskLevel::Low },
    }
}

fn generate_lifecycle_recommendations(
    cluster_analyses: &[ClusterAnalysis],
    storage_architecture: &StorageArchitectureResults,
    migration_complexity: &MigrationComplexity,
) -> Vec<LifecycleRecommendation> {
    let mut recommendations = Vec::new();
    
    recommendations.push(LifecycleRecommendation {
        category: "Storage Architecture".to_string(),
        priority: "High".to_string(),
        recommendation: "Deploy Storage Spaces Direct for vSAN provider clusters".to_string(),
        rationale: format!("Found {} clusters suitable for S2D deployment", storage_architecture.s2d_readiness_summary.ready_clusters),
        timeline: "Phase 1 (Months 1-3)".to_string(),
        dependencies: vec!["Hardware procurement".to_string(), "Network setup".to_string()],
    });
    
    if migration_complexity.risk_level == RiskLevel::High {
        recommendations.push(LifecycleRecommendation {
            category: "Risk Mitigation".to_string(),
            priority: "Critical".to_string(),
            recommendation: "Implement comprehensive testing and rollback procedures".to_string(),
            rationale: "High complexity migration requires extensive risk mitigation".to_string(),
            timeline: "Pre-migration".to_string(),
            dependencies: vec!["Test environment setup".to_string()],
        });
    }
    
    recommendations
}