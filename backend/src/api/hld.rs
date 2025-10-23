// ============================================================================
// LCMDesigner - HLD (High-Level Design) Generation System - REST API
// ============================================================================
// Purpose: REST API endpoints for HLD templates, sections, projects, and variables
// Version: 1.0
// Date: October 23, 2025
// ============================================================================

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use surrealdb::sql::Thing;

use crate::models::hld::*;
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
    State(_state): State<AppState>,
    Path(_project_id): Path<String>,
) -> ApiResult<Response> {
    // TODO: Implement in Week 3
    // 1. Get HLD project and variables
    // 2. Get template and sections
    // 3. Render template with variables
    // 4. Generate Word document
    // 5. Return file stream

    Err(HLDApiError::ValidationError(
        "Export functionality not yet implemented (Week 3)".to_string(),
    ))
}

/// POST /api/v1/projects/:project_id/hld/autofill-preview - Preview RVTools auto-fill
pub async fn autofill_preview(
    State(_state): State<AppState>,
    Path(_project_id): Path<String>,
) -> ApiResult<Json<AutoFillPreview>> {
    // TODO: Implement in Week 2
    // 1. Get RVTools data for project
    // 2. Map RVTools to HLD variables
    // 3. Get current variable values
    // 4. Generate diff (what will change)
    // 5. Return preview with confidence levels

    Err(HLDApiError::ValidationError(
        "Auto-fill preview not yet implemented (Week 2)".to_string(),
    ))
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
