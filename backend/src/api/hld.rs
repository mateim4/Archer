// ============================================================================
// LCMDesigner - HLD (High-Level Design) Generation System - REST API
// ============================================================================
// Purpose: REST API endpoints for HLD templates, sections, projects, and variables
// Version: 1.0
// Date: October 23, 2025
// ============================================================================

use axum::{
    extract::{Path, State},
    http::{StatusCode, header},
    response::{IntoResponse, Response},
    Json,
    body::Body,
};
use serde_json::json;
use surrealdb::sql::Thing;
use chrono::Utc;

use crate::models::hld::*;
use crate::services::word_generator::WordGenerator;
use crate::AppState;

// ============================================================================
// ERROR HANDLING
// ============================================================================

#[derive(Debug)]
pub enum HLDApiError {
    DatabaseError(String),
    NotFound(String),
    ValidationError(String),
    Conflict(String),
}

impl IntoResponse for HLDApiError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::DatabaseError(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            Self::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg),
            Self::Conflict(msg) => (StatusCode::CONFLICT, msg),
        };

        (status, Json(json!({ "error": message }))).into_response()
    }
}

type ApiResult<T> = Result<T, HLDApiError>;

// ============================================================================
// TEMPLATE ENDPOINTS (5 endpoints)
// ============================================================================

/// POST /api/v1/hld/templates - Create new HLD template
pub async fn create_template(
    State(state): State<AppState>,
    Json(payload): Json<CreateHLDTemplateRequest>,
) -> ApiResult<Json<HLDTemplate>> {
    let db = &state.db;

    let template = HLDTemplate {
        id: None,
        name: payload.name,
        description: payload.description,
        version: payload.version,
        is_active: true,
        metadata: payload.metadata,
        created_at: None,
        updated_at: None,
    };

    let created: Vec<HLDTemplate> = db
        .create("hld_templates")
        .content(template)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let template = created
        .into_iter()
        .next()
        .ok_or_else(|| HLDApiError::DatabaseError("Failed to create template".to_string()))?;

    Ok(Json(template))
}

/// GET /api/v1/hld/templates - List all HLD templates
pub async fn list_templates(
    State(state): State<AppState>,
) -> ApiResult<Json<Vec<HLDTemplate>>> {
    let db = &state.db;

    let templates: Vec<HLDTemplate> = db
        .query("SELECT * FROM hld_templates WHERE is_active = true ORDER BY created_at DESC")
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    Ok(Json(templates))
}

/// GET /api/v1/hld/templates/:id - Get single HLD template
pub async fn get_template(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<HLDTemplate>> {
    let db = &state.db;

    let template: Option<HLDTemplate> = db
        .select(("hld_templates", id.as_str()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    template
        .map(Json)
        .ok_or_else(|| HLDApiError::NotFound(format!("Template {} not found", id)))
}

/// PUT /api/v1/hld/templates/:id - Update HLD template
pub async fn update_template(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<CreateHLDTemplateRequest>,
) -> ApiResult<Json<HLDTemplate>> {
    let db = &state.db;

    // Check if template exists
    let existing: Option<HLDTemplate> = db
        .select(("hld_templates", id.as_str()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    if existing.is_none() {
        return Err(HLDApiError::NotFound(format!("Template {} not found", id)));
    }

    let updated_template = HLDTemplate {
        id: Some(Thing::from(("hld_templates", id.as_str()))),
        name: payload.name,
        description: payload.description,
        version: payload.version,
        is_active: true,
        metadata: payload.metadata,
        created_at: existing.and_then(|t| t.created_at),
        updated_at: None, // DB will set this
    };

    let updated: Option<HLDTemplate> = db
        .update(("hld_templates", id.as_str()))
        .content(updated_template)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    updated
        .map(Json)
        .ok_or_else(|| HLDApiError::DatabaseError("Failed to update template".to_string()))
}

/// DELETE /api/v1/hld/templates/:id - Delete HLD template (soft delete)
pub async fn delete_template(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<StatusCode> {
    let db = &state.db;

    // Soft delete by setting is_active = false
    let _updated: Option<HLDTemplate> = db
        .query("UPDATE $template SET is_active = false")
        .bind(("template", Thing::from(("hld_templates", id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

/// GET /api/v1/hld/templates/:id/sections - Get all sections for a template
pub async fn get_template_sections(
    State(state): State<AppState>,
    Path(template_id): Path<String>,
) -> ApiResult<Json<Vec<HLDSection>>> {
    let db = &state.db;

    let sections: Vec<HLDSection> = db
        .query("SELECT * FROM hld_sections WHERE template_id = $template ORDER BY order ASC")
        .bind(("template", Thing::from(("hld_templates", template_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    Ok(Json(sections))
}

// ============================================================================
// PROJECT ENDPOINTS (3 endpoints)
// ============================================================================

/// POST /api/v1/projects/:project_id/hld - Create HLD project for a project
pub async fn create_hld_project(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(payload): Json<CreateHLDProjectRequest>,
) -> ApiResult<Json<HLDProject>> {
    let db = &state.db;

    // Check if HLD project already exists for this project
    let existing: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    if !existing.is_empty() {
        return Err(HLDApiError::Conflict(format!(
            "HLD project already exists for project {}",
            project_id
        )));
    }

    // Get template to retrieve version
    let template: Option<HLDTemplate> = db
        .select(("hld_templates", payload.template_id.as_str()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let template = template.ok_or_else(|| {
        HLDApiError::NotFound(format!("Template {} not found", payload.template_id))
    })?;

    // Get all sections for the template
    let sections: Vec<HLDSection> = db
        .query("SELECT * FROM hld_sections WHERE template_id = $template")
        .bind((
            "template",
            Thing::from(("hld_templates", payload.template_id.as_str())),
        ))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    // Enable all required sections by default, or use provided list
    let enabled_sections = payload.enabled_sections.unwrap_or_else(|| {
        sections
            .iter()
            .filter(|s| s.required)
            .map(|s| s.section_id.clone())
            .collect()
    });

    let hld_project = HLDProject {
        id: None,
        project_id: Thing::from(("projects", project_id.as_str())),
        template_id: Thing::from(("hld_templates", payload.template_id.as_str())),
        template_version: template.version,
        enabled_sections,
        section_order: sections.iter().map(|s| s.section_id.clone()).collect(),
        metadata: None,
        created_at: None,
        updated_at: None,
    };

    let created: Vec<HLDProject> = db
        .create("hld_projects")
        .content(hld_project)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let project = created
        .into_iter()
        .next()
        .ok_or_else(|| HLDApiError::DatabaseError("Failed to create HLD project".to_string()))?;

    Ok(Json(project))
}

/// GET /api/v1/projects/:project_id/hld - Get HLD project for a project
pub async fn get_hld_project(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> ApiResult<Json<HLDProject>> {
    let db = &state.db;

    let projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    projects
        .into_iter()
        .next()
        .map(Json)
        .ok_or_else(|| {
            HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
        })
}

/// PUT /api/v1/projects/:project_id/hld/sections - Update enabled sections
pub async fn update_enabled_sections(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(payload): Json<UpdateEnabledSectionsRequest>,
) -> ApiResult<Json<HLDProject>> {
    let db = &state.db;

    // Get existing HLD project
    let mut projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let mut hld_project = projects
        .pop()
        .ok_or_else(|| {
            HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
        })?;

    // Update sections
    hld_project.enabled_sections = payload.enabled_sections;
    if let Some(order) = payload.section_order {
        hld_project.section_order = order;
    }

    let hld_project_id = hld_project.id.clone().ok_or_else(|| {
        HLDApiError::DatabaseError("HLD project ID not found".to_string())
    })?;

    let updated: Option<HLDProject> = db
        .update((hld_project_id.tb.as_str(), hld_project_id.id.to_string().as_str()))
        .content(hld_project)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    updated
        .map(Json)
        .ok_or_else(|| HLDApiError::DatabaseError("Failed to update sections".to_string()))
}

// ============================================================================
// VARIABLE ENDPOINTS (4 endpoints)
// ============================================================================

/// GET /api/v1/projects/:project_id/hld/variables - Get all variables for HLD project
pub async fn get_variables(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> ApiResult<Json<Vec<HLDVariable>>> {
    let db = &state.db;

    // First get HLD project
    let hld_projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let hld_project = hld_projects.into_iter().next().ok_or_else(|| {
        HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
    })?;

    let hld_project_id = hld_project.id.ok_or_else(|| {
        HLDApiError::DatabaseError("HLD project ID not found".to_string())
    })?;

    // Get all variables
    let variables: Vec<HLDVariable> = db
        .query("SELECT * FROM hld_variables WHERE hld_project_id = $hld_project ORDER BY section, variable_name")
        .bind(("hld_project", hld_project_id))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    Ok(Json(variables))
}

/// PUT /api/v1/projects/:project_id/hld/variables - Bulk update variables
pub async fn bulk_update_variables(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
    Json(payload): Json<BulkUpdateVariablesRequest>,
) -> ApiResult<Json<Vec<HLDVariable>>> {
    let db = &state.db;

    // Get HLD project
    let hld_projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let hld_project = hld_projects.into_iter().next().ok_or_else(|| {
        HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
    })?;

    let hld_project_id = hld_project.id.ok_or_else(|| {
        HLDApiError::DatabaseError("HLD project ID not found".to_string())
    })?;

    let mut updated_variables = Vec::new();

    for var_update in payload.variables {
        // Check if variable exists
        let existing: Vec<HLDVariable> = db
            .query("SELECT * FROM hld_variables WHERE hld_project_id = $hld_project AND variable_name = $name")
            .bind(("hld_project", hld_project_id.clone()))
            .bind(("name", var_update.name.as_str()))
            .await
            .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
            .take(0)
            .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

        if let Some(mut existing_var) = existing.into_iter().next() {
            // Update existing
            existing_var.variable_value = Some(var_update.value);
            if let Some(source) = var_update.source {
                existing_var.source = source;
            }

            let var_id = existing_var.id.clone().ok_or_else(|| {
                HLDApiError::DatabaseError("Variable ID not found".to_string())
            })?;

            let updated: Option<HLDVariable> = db
                .update((var_id.tb.as_str(), var_id.id.to_string().as_str()))
                .content(existing_var)
                .await
                .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

            if let Some(var) = updated {
                updated_variables.push(var);
            }
        }
    }

    Ok(Json(updated_variables))
}

/// GET /api/v1/projects/:project_id/hld/variables/:name - Get single variable
pub async fn get_variable(
    State(state): State<AppState>,
    Path((project_id, variable_name)): Path<(String, String)>,
) -> ApiResult<Json<HLDVariable>> {
    let db = &state.db;

    // Get HLD project
    let hld_projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let hld_project = hld_projects.into_iter().next().ok_or_else(|| {
        HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
    })?;

    let hld_project_id = hld_project.id.ok_or_else(|| {
        HLDApiError::DatabaseError("HLD project ID not found".to_string())
    })?;

    // Get variable
    let variables: Vec<HLDVariable> = db
        .query("SELECT * FROM hld_variables WHERE hld_project_id = $hld_project AND variable_name = $name")
        .bind(("hld_project", hld_project_id))
        .bind(("name", variable_name.as_str()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    variables
        .into_iter()
        .next()
        .map(Json)
        .ok_or_else(|| {
            HLDApiError::NotFound(format!(
                "Variable {} not found for project {}",
                variable_name, project_id
            ))
        })
}

/// PUT /api/v1/projects/:project_id/hld/variables/:name - Update single variable
pub async fn update_variable(
    State(state): State<AppState>,
    Path((project_id, variable_name)): Path<(String, String)>,
    Json(payload): Json<UpdateVariableRequest>,
) -> ApiResult<Json<HLDVariable>> {
    let db = &state.db;

    // Get HLD project
    let hld_projects: Vec<HLDProject> = db
        .query("SELECT * FROM hld_projects WHERE project_id = $project")
        .bind(("project", Thing::from(("projects", project_id.as_str()))))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let hld_project = hld_projects.into_iter().next().ok_or_else(|| {
        HLDApiError::NotFound(format!("HLD project not found for project {}", project_id))
    })?;

    let hld_project_id = hld_project.id.ok_or_else(|| {
        HLDApiError::DatabaseError("HLD project ID not found".to_string())
    })?;

    // Get existing variable
    let existing: Vec<HLDVariable> = db
        .query("SELECT * FROM hld_variables WHERE hld_project_id = $hld_project AND variable_name = $name")
        .bind(("hld_project", hld_project_id))
        .bind(("name", variable_name.as_str()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    let mut variable = existing.into_iter().next().ok_or_else(|| {
        HLDApiError::NotFound(format!(
            "Variable {} not found for project {}",
            variable_name, project_id
        ))
    })?;

    // Update variable
    variable.variable_value = Some(payload.value);
    if let Some(source) = payload.source {
        variable.source = source;
    }

    let var_id = variable.id.clone().ok_or_else(|| {
        HLDApiError::DatabaseError("Variable ID not found".to_string())
    })?;

    let updated: Option<HLDVariable> = db
        .update((var_id.tb.as_str(), var_id.id.to_string().as_str()))
        .content(variable)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;

    updated
        .map(Json)
        .ok_or_else(|| HLDApiError::DatabaseError("Failed to update variable".to_string()))
}

// ============================================================================
// EXPORT ENDPOINTS (2 endpoints - placeholders for Week 3)
// ============================================================================

/// POST /api/v1/projects/:project_id/hld/export - Export HLD to Word document
pub async fn export_hld(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> ApiResult<Response> {
    let db = &state.db;
    
    // 1. Get HLD project
    let hld_project_query = format!(
        "SELECT * FROM hld_projects WHERE project_id = type::thing('projects', '{}')",
        project_id
    );
    let mut hld_result = db
        .query(&hld_project_query)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let hld_projects: Vec<HLDProject> = hld_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    if hld_projects.is_empty() {
        return Err(HLDApiError::NotFound(
            "HLD project not found - create one first".to_string(),
        ));
    }
    
    let hld_project = &hld_projects[0];
    
    // 2. Get HLD variables
    let vars_query = format!(
        "SELECT * FROM hld_variables WHERE hld_project_id = $hld_project_id ORDER BY variable_name"
    );
    let mut vars_result = db
        .query(&vars_query)
        .bind(("hld_project_id", hld_project.id.clone()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let variables: Vec<HLDVariable> = vars_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    // 3. Get section definitions (enabled sections only)
    // For now, use the enabled sections from the project
    let section_order = hld_project.section_order.clone().unwrap_or_default();
    
    // Create section definitions from enabled sections
    let mut sections = Vec::new();
    for (index, section_id) in section_order.iter().enumerate() {
        sections.push(SectionDefinition {
            id: None,
            section_id: section_id.clone(),
            section_name: section_id.clone(),
            display_name: section_id.replace('_', " ").to_uppercase(),
            description: String::new(),
            required: false,
            enabled: true,
            order_index: index as i32,
            depends_on: Vec::new(),
            created_at: Utc::now(),
        });
    }
    
    // If no sections defined, use default sections
    if sections.is_empty() {
        sections = vec![
            SectionDefinition {
                id: None,
                section_id: "executive_summary".to_string(),
                section_name: "executive_summary".to_string(),
                display_name: "Executive Summary".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 0,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
            SectionDefinition {
                id: None,
                section_id: "infrastructure_overview".to_string(),
                section_name: "infrastructure_overview".to_string(),
                display_name: "Infrastructure Overview".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 1,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
            SectionDefinition {
                id: None,
                section_id: "compute_design".to_string(),
                section_name: "compute_design".to_string(),
                display_name: "Compute Design".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 2,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
            SectionDefinition {
                id: None,
                section_id: "storage_design".to_string(),
                section_name: "storage_design".to_string(),
                display_name: "Storage Design".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 3,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
            SectionDefinition {
                id: None,
                section_id: "network_design".to_string(),
                section_name: "network_design".to_string(),
                display_name: "Network Design".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 4,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
            SectionDefinition {
                id: None,
                section_id: "migration_strategy".to_string(),
                section_name: "migration_strategy".to_string(),
                display_name: "Migration Strategy".to_string(),
                description: String::new(),
                required: true,
                enabled: true,
                order_index: 5,
                depends_on: Vec::new(),
                created_at: Utc::now(),
            },
        ];
    }
    
    // 4. Generate Word document
    let mut generator = WordGenerator::new();
    let docx_bytes = generator
        .generate_hld(hld_project, &variables, &sections)
        .map_err(|e| HLDApiError::DatabaseError(format!("Word generation failed: {}", e)))?;
    
    // 5. Return as downloadable file
    let filename = format!(
        "{}-HLD-{}.docx",
        hld_project.project_name.replace(' ', "-"),
        Utc::now().format("%Y%m%d")
    );
    
    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        .header(header::CONTENT_DISPOSITION, format!("attachment; filename=\"{}\"", filename))
        .body(Body::from(docx_bytes))
        .map_err(|e| HLDApiError::DatabaseError(format!("Failed to build response: {}", e)))?;
    
    Ok(response)
}

/// POST /api/v1/projects/:project_id/hld/autofill-preview - Preview RVTools auto-fill
pub async fn autofill_preview(
    State(state): State<AppState>,
    Path(project_id): Path<String>,
) -> ApiResult<Json<AutoFillPreview>> {
    use crate::services::rvtools_hld_mapper::{RVToolsHLDMapper, MappedVariable};
    use crate::models::project_models::{RvToolsUpload, RvToolsData};
    
    let db = &state.db;
    
    // 1. Get HLD project
    let hld_project_query = format!(
        "SELECT * FROM hld_projects WHERE project_id = type::thing('projects', '{}')",
        project_id
    );
    let mut hld_result = db
        .query(&hld_project_query)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let hld_projects: Vec<HLDProject> = hld_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    if hld_projects.is_empty() {
        return Err(HLDApiError::NotFound(
            "HLD project not found - create one first".to_string(),
        ));
    }
    
    let hld_project = &hld_projects[0];
    
    // 2. Get latest RVTools upload for this project
    let rvtools_query = format!(
        "SELECT * FROM rvtools_uploads WHERE project_id = type::thing('projects', '{}') ORDER BY uploaded_at DESC LIMIT 1",
        project_id
    );
    let mut rvtools_result = db
        .query(&rvtools_query)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let rvtools_uploads: Vec<RvToolsUpload> = rvtools_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    if rvtools_uploads.is_empty() {
        return Err(HLDApiError::NotFound(
            "No RVTools data found for project - upload RVTools Excel first".to_string(),
        ));
    }
    
    let rvtools_upload = &rvtools_uploads[0];
    
    // 3. Get RVTools data
    let rvtools_data_query = format!("SELECT * FROM rvtools_data WHERE upload_id = $upload_id");
    let mut data_result = db
        .query(&rvtools_data_query)
        .bind(("upload_id", rvtools_upload.id.clone()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let rvtools_data_list: Vec<RvToolsData> = data_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    if rvtools_data_list.is_empty() {
        return Err(HLDApiError::NotFound(
            "RVTools data not found".to_string(),
        ));
    }
    
    // 4. Map RVTools data to HLD variables
    let mapper = RVToolsHLDMapper::new(&rvtools_data_list);
    let mapped_variables = mapper.map_to_hld_variables();
    let overall_confidence = mapper.calculate_overall_confidence(&mapped_variables);
    
    // 5. Get current HLD variables
    let current_vars_query = format!(
        "SELECT * FROM hld_variables WHERE hld_project_id = $hld_project_id"
    );
    let mut vars_result = db
        .query(&current_vars_query)
        .bind(("hld_project_id", hld_project.id.clone()))
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let current_variables: Vec<HLDVariable> = vars_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    // 6. Get variable definitions for display names
    let var_defs_query = "SELECT * FROM variable_definitions";
    let mut var_defs_result = db
        .query(var_defs_query)
        .await
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    let var_definitions: Vec<VariableDefinition> = var_defs_result
        .take(0)
        .map_err(|e| HLDApiError::DatabaseError(e.to_string()))?;
    
    // 7. Generate change preview
    let mut changes = Vec::new();
    let mut high_confidence = 0;
    let mut medium_confidence = 0;
    let mut low_confidence = 0;
    let mut errors = 0;
    
    for (var_name, mapped) in &mapped_variables {
        let current_value = current_variables
            .iter()
            .find(|v| &v.variable_name == var_name)
            .and_then(|v| v.variable_value.clone());
        
        let display_name = var_definitions
            .iter()
            .find(|v| &v.variable_name == var_name)
            .map(|v| v.display_name.clone())
            .unwrap_or_else(|| var_name.clone());
        
        let confidence_str = match mapped.confidence {
            VariableConfidence::High => {
                high_confidence += 1;
                "high"
            }
            VariableConfidence::Medium => {
                medium_confidence += 1;
                "medium"
            }
            VariableConfidence::Low => {
                low_confidence += 1;
                "low"
            }
            VariableConfidence::None => "none",
        };
        
        if mapped.error_message.is_some() {
            errors += 1;
        }
        
        changes.push(VariableChange {
            name: var_name.clone(),
            display_name,
            current_value: current_value.clone(),
            proposed_value: mapped.value.clone(),
            confidence: confidence_str.to_string(),
            error: mapped.error_message.clone(),
        });
    }
    
    // Sort: high confidence first, then medium, then low
    changes.sort_by(|a, b| {
        let a_conf = match a.confidence.as_str() {
            "high" => 3,
            "medium" => 2,
            "low" => 1,
            _ => 0,
        };
        let b_conf = match b.confidence.as_str() {
            "high" => 3,
            "medium" => 2,
            "low" => 1,
            _ => 0,
        };
        b_conf.cmp(&a_conf)
    });
    
    let total_changes = changes.iter().filter(|c| c.current_value != c.proposed_value).count();
    
    let preview = AutoFillPreview {
        changes,
        total_changes,
        high_confidence,
        medium_confidence,
        low_confidence,
        errors,
    };
    
    Ok(Json(preview))
}

// ============================================================================
// ROUTER SETUP
// ============================================================================

use axum::routing::{delete, get, post, put};
use axum::Router;

/// Create HLD router (main export for router setup)
pub fn create_hld_router(state: AppState) -> Router {
    Router::new()
        // Template routes
        .route("/templates", post(create_template))
        .route("/templates", get(list_templates))
        .route("/templates/:id", get(get_template))
        .route("/templates/:id", put(update_template))
        .route("/templates/:id", delete(delete_template))
        .route("/templates/:id/sections", get(get_template_sections))
        // Project routes (these will be at /api/v1/hld/projects/:project_id/...)
        .route("/projects/:project_id", post(create_hld_project))
        .route("/projects/:project_id", get(get_hld_project))
        .route("/projects/:project_id/sections", put(update_enabled_sections))
        // Variable routes
        .route("/projects/:project_id/variables", get(get_variables))
        .route("/projects/:project_id/variables", put(bulk_update_variables))
        .route("/projects/:project_id/variables/:name", get(get_variable))
        .route("/projects/:project_id/variables/:name", put(update_variable))
        // Export routes
        .route("/projects/:project_id/export", post(export_hld))
        .route("/projects/:project_id/autofill-preview", post(autofill_preview))
        .with_state(state)
}

/// Alternative function name for compatibility
pub fn hld_routes() -> Router<AppState> {
    Router::new()
        // Template routes
        .route("/api/v1/hld/templates", post(create_template))
        .route("/api/v1/hld/templates", get(list_templates))
        .route("/api/v1/hld/templates/:id", get(get_template))
        .route("/api/v1/hld/templates/:id", put(update_template))
        .route("/api/v1/hld/templates/:id", delete(delete_template))
        .route(
            "/api/v1/hld/templates/:id/sections",
            get(get_template_sections),
        )
        // Project routes
        .route(
            "/api/v1/projects/:project_id/hld",
            post(create_hld_project),
        )
        .route("/api/v1/projects/:project_id/hld", get(get_hld_project))
        .route(
            "/api/v1/projects/:project_id/hld/sections",
            put(update_enabled_sections),
        )
        // Variable routes
        .route(
            "/api/v1/projects/:project_id/hld/variables",
            get(get_variables),
        )
        .route(
            "/api/v1/projects/:project_id/hld/variables",
            put(bulk_update_variables),
        )
        .route(
            "/api/v1/projects/:project_id/hld/variables/:name",
            get(get_variable),
        )
        .route(
            "/api/v1/projects/:project_id/hld/variables/:name",
            put(update_variable),
        )
        // Export routes
        .route("/api/v1/projects/:project_id/hld/export", post(export_hld))
        .route(
            "/api/v1/projects/:project_id/hld/autofill-preview",
            post(autofill_preview),
        )
}
