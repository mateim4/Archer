use axum::{
    extract::{Path, State, Query},
    http::StatusCode,
    Json,
    response::Result as AxumResult,
    routing::{get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use crate::database::{Database, AppState};
use chrono::Utc;

// use crate::migration_models::*; // TODO: Fix module path

pub struct MigrationApi;

#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListProjectsQuery {
    pub project_type: Option<MigrationProjectType>,
    pub status: Option<ProjectStatus>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

#[derive(Debug, Deserialize)]
pub struct ListTasksQuery {
    pub status: Option<MigrationTaskStatus>,
    pub task_type: Option<MigrationTaskType>,
    pub assigned_to: Option<String>,
    pub overdue_only: Option<bool>,
}

impl MigrationApi {
    /// Create a new migration project
    pub async fn create_migration_project(
        State(db): State<AppState>,
        Json(request): Json<CreateMigrationProjectRequest>,
    ) -> AxumResult<Json<ApiResponse<MigrationProjectResponse>>> {
        let project = MigrationProject {
            id: None,
            name: request.name,
            description: request.description,
            project_type: request.project_type,
            owner_id: request.team_members.first().cloned().unwrap_or_else(|| {
                // Create a default user ID - in real implementation, get from auth
                surrealdb::sql::Thing::from(("user", "default"))
            }),
            team_members: request.team_members,
            status: ProjectStatus::Planning,
            start_date: request.start_date,
            target_end_date: request.target_end_date,
            actual_end_date: None,
            budget: request.budget,
            priority: request.priority,
            source_environment: request.source_environment,
            target_environment: request.target_environment,
            rvtools_data_id: None,
            tags: request.tags,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            total_tasks: 0,
            completed_tasks: 0,
            overdue_tasks: 0,
            risk_level: RiskLevel::Low,
        };

        let created: Vec<MigrationProject> = db
            .create("migration_project")
            .content(&project)
            .await
            .map_err(|e| {
                eprintln!("Database error creating project: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        let created_project = created.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let response = MigrationProjectResponse {
            id: created_project.id.map(|id| id.to_string()).unwrap_or_default(),
            name: created_project.name,
            description: created_project.description,
            project_type: created_project.project_type,
            status: created_project.status,
            progress_percentage: 0.0,
            source_environment: created_project.source_environment,
            target_environment: created_project.target_environment,
            start_date: created_project.start_date,
            target_end_date: created_project.target_end_date,
            risk_level: created_project.risk_level,
            total_tasks: created_project.total_tasks,
            completed_tasks: created_project.completed_tasks,
            overdue_tasks: created_project.overdue_tasks,
            team_members: vec![], // TODO: Resolve user IDs to names
            tags: created_project.tags,
            created_at: created_project.created_at,
            updated_at: created_project.updated_at,
        };

        Ok(Json(ApiResponse {
            success: true,
            data: Some(response),
            message: Some("Migration project created successfully".to_string()),
        }))
    }

    /// List migration projects with filtering
    pub async fn list_migration_projects(
        State(db): State<AppState>,
        Query(params): Query<ListProjectsQuery>,
    ) -> AxumResult<Json<ApiResponse<Vec<MigrationProjectResponse>>>> {
        let mut query = "SELECT * FROM migration_project".to_string();
        let mut conditions = Vec::new();

        if let Some(project_type) = params.project_type {
            conditions.push(format!("project_type = '{:?}'", project_type));
        }

        if let Some(status) = params.status {
            conditions.push(format!("status = '{:?}'", status));
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
        }

        query.push_str(" ORDER BY created_at DESC");

        if let Some(limit) = params.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = params.offset {
            query.push_str(&format!(" START {}", offset));
        }

        let projects: Vec<MigrationProject> = db
            .query(&query)
            .await
            .map_err(|e| {
                eprintln!("Database error listing projects: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .take(0)
            .map_err(|e| {
                eprintln!("Error parsing projects: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        let responses: Vec<MigrationProjectResponse> = projects
            .into_iter()
            .map(|project| {
                let progress = if project.total_tasks > 0 {
                    (project.completed_tasks as f32 / project.total_tasks as f32) * 100.0
                } else {
                    0.0
                };

                MigrationProjectResponse {
                    id: project.id.map(|id| id.to_string()).unwrap_or_default(),
                    name: project.name,
                    description: project.description,
                    project_type: project.project_type,
                    status: project.status,
                    progress_percentage: progress,
                    source_environment: project.source_environment,
                    target_environment: project.target_environment,
                    start_date: project.start_date,
                    target_end_date: project.target_end_date,
                    risk_level: project.risk_level,
                    total_tasks: project.total_tasks,
                    completed_tasks: project.completed_tasks,
                    overdue_tasks: project.overdue_tasks,
                    team_members: vec![], // TODO: Resolve user IDs
                    tags: project.tags,
                    created_at: project.created_at,
                    updated_at: project.updated_at,
                }
            })
            .collect();

        Ok(Json(ApiResponse {
            success: true,
            data: Some(responses),
            message: None,
        }))
    }

    /// Get a specific migration project by ID
    pub async fn get_migration_project(
        State(db): State<AppState>,
        Path(project_id): Path<String>,
    ) -> AxumResult<Json<ApiResponse<MigrationProjectResponse>>> {
        let project: Option<MigrationProject> = db
            .select(("migration_project", &project_id))
            .await
            .map_err(|e| {
                eprintln!("Database error getting project: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        let project = project.ok_or(StatusCode::NOT_FOUND)?;

        let progress = if project.total_tasks > 0 {
            (project.completed_tasks as f32 / project.total_tasks as f32) * 100.0
        } else {
            0.0
        };

        let response = MigrationProjectResponse {
            id: project.id.map(|id| id.to_string()).unwrap_or_default(),
            name: project.name,
            description: project.description,
            project_type: project.project_type,
            status: project.status,
            progress_percentage: progress,
            source_environment: project.source_environment,
            target_environment: project.target_environment,
            start_date: project.start_date,
            target_end_date: project.target_end_date,
            risk_level: project.risk_level,
            total_tasks: project.total_tasks,
            completed_tasks: project.completed_tasks,
            overdue_tasks: project.overdue_tasks,
            team_members: vec![], // TODO: Resolve user IDs
            tags: project.tags,
            created_at: project.created_at,
            updated_at: project.updated_at,
        };

        Ok(Json(ApiResponse {
            success: true,
            data: Some(response),
            message: None,
        }))
    }

    /// Create a migration task
    pub async fn create_migration_task(
        State(db): State<AppState>,
        Json(request): Json<CreateMigrationTaskRequest>,
    ) -> AxumResult<Json<ApiResponse<MigrationTask>>> {
        let task = MigrationTask {
            id: None,
            project_id: request.project_id.clone(),
            workflow_id: request.workflow_id,
            name: request.name,
            description: request.description,
            task_type: request.task_type,
            status: MigrationTaskStatus::NotStarted,
            priority: request.priority,
            assigned_to: request.assigned_to,
            estimated_hours: request.estimated_hours,
            actual_hours: None,
            start_date: request.start_date,
            end_date: request.end_date,
            dependencies: request.dependencies,
            tags: request.tags,
            notes: None,
            resources: vec![],
            completion_percentage: 0,
            hardware_requirements: request.hardware_requirements,
            network_requirements: request.network_requirements,
            validation_criteria: request.validation_criteria,
            risk_level: request.risk_level,
            rollback_plan: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let created: Vec<MigrationTask> = db
            .create("migration_task")
            .content(&task)
            .await
            .map_err(|e| {
                eprintln!("Database error creating task: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        let created_task = created.into_iter().next().ok_or(StatusCode::INTERNAL_SERVER_ERROR)?;

        // Update project task count
        let _: Option<MigrationProject> = db
            .query("UPDATE $project SET total_tasks += 1")
            .bind(("project", request.project_id))
            .await
            .map_err(|e| {
                eprintln!("Error updating project task count: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .take(0)
            .unwrap_or_default();

        Ok(Json(ApiResponse {
            success: true,
            data: Some(created_task),
            message: Some("Migration task created successfully".to_string()),
        }))
    }

    /// List tasks for a migration project
    pub async fn list_migration_tasks(
        State(db): State<AppState>,
        Path(project_id): Path<String>,
        Query(params): Query<ListTasksQuery>,
    ) -> AxumResult<Json<ApiResponse<Vec<MigrationTask>>>> {
        let mut query = format!("SELECT * FROM migration_task WHERE project_id = migration_project:{}", project_id);
        let mut conditions = Vec::new();

        if let Some(status) = params.status {
            conditions.push(format!("status = '{:?}'", status));
        }

        if let Some(task_type) = params.task_type {
            conditions.push(format!("task_type = '{:?}'", task_type));
        }

        if params.overdue_only.unwrap_or(false) {
            conditions.push("end_date < time::now() AND status != 'Completed'".to_string());
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" AND {}", conditions.join(" AND ")));
        }

        query.push_str(" ORDER BY start_date ASC");

        let tasks: Vec<MigrationTask> = db
            .query(&query)
            .await
            .map_err(|e| {
                eprintln!("Database error listing tasks: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .take(0)
            .map_err(|e| {
                eprintln!("Error parsing tasks: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        Ok(Json(ApiResponse {
            success: true,
            data: Some(tasks),
            message: None,
        }))
    }

    /// Update task status and recalculate project metrics
    pub async fn update_task_status(
        State(db): State<AppState>,
        Path(task_id): Path<String>,
        Json(status): Json<MigrationTaskStatus>,
    ) -> AxumResult<Json<ApiResponse<MigrationTask>>> {
        let updated: Option<MigrationTask> = db
            .update(("migration_task", &task_id))
            .merge(&serde_json::json!({
                "status": status,
                "updated_at": Utc::now(),
                "completion_percentage": match status {
                    MigrationTaskStatus::Completed => 100,
                    MigrationTaskStatus::InProgress => 50,
                    _ => 0,
                }
            }))
            .await
            .map_err(|e| {
                eprintln!("Database error updating task: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        let task = updated.ok_or(StatusCode::NOT_FOUND)?;

        // Recalculate project metrics
        Self::recalculate_project_metrics(&db, &task.project_id).await?;

        Ok(Json(ApiResponse {
            success: true,
            data: Some(task),
            message: Some("Task status updated successfully".to_string()),
        }))
    }

    /// Apply a project template to create tasks
    pub async fn apply_project_template(
        State(db): State<AppState>,
        Path(project_id): Path<String>,
        Json(template_id): Json<String>,
    ) -> AxumResult<Json<ApiResponse<Vec<MigrationTask>>>> {
        // In a real implementation, you'd load the template from a predefined set
        // or from the database. For now, we'll use the built-in templates.
        
        let template_tasks = match template_id.as_str() {
            "vmware-to-hyperv-complete" => get_vmware_to_hyperv_template_tasks(),
            "vmware-to-azure-local" => get_vmware_to_azure_local_template_tasks(),
            _ => return Err(StatusCode::BAD_REQUEST.into()),
        };

        let mut created_tasks = Vec::new();

        for template_task in template_tasks {
            let task = MigrationTask {
                id: None,
                project_id: surrealdb::sql::Thing::from(("migration_project", project_id.as_str())),
                workflow_id: surrealdb::sql::Thing::from(("workflow", "default")),
                name: template_task.name,
                description: template_task.description,
                task_type: template_task.task_type,
                status: MigrationTaskStatus::NotStarted,
                priority: template_task.priority,
                assigned_to: vec![],
                estimated_hours: template_task.estimated_hours,
                actual_hours: None,
                start_date: Utc::now(),
                end_date: Utc::now() + chrono::Duration::hours(template_task.estimated_hours as i64),
                dependencies: vec![],
                tags: template_task.tags,
                notes: None,
                resources: template_task.resources.unwrap_or_default(),
                completion_percentage: 0,
                hardware_requirements: vec![],
                network_requirements: vec![],
                validation_criteria: vec![],
                risk_level: RiskLevel::Medium,
                rollback_plan: None,
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            let created: Vec<MigrationTask> = db
                .create("migration_task")
                .content(&task)
                .await
                .map_err(|e| {
                    eprintln!("Database error creating template task: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;

            if let Some(created_task) = created.into_iter().next() {
                created_tasks.push(created_task);
            }
        }

        // Update project task count
        let task_count = created_tasks.len() as u32;
        let _: Option<MigrationProject> = db
            .query("UPDATE $project SET total_tasks += $count")
            .bind(("project", format!("migration_project:{}", project_id)))
            .bind(("count", task_count))
            .await
            .map_err(|e| {
                eprintln!("Error updating project task count: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .take(0)
            .unwrap_or_default();

        Ok(Json(ApiResponse {
            success: true,
            data: Some(created_tasks),
            message: Some(format!("Applied template and created {} tasks", task_count)),
        }))
    }

    /// Helper function to recalculate project metrics
    async fn recalculate_project_metrics(
        db: &Database,
        project_id: &surrealdb::sql::Thing,
    ) -> Result<(), StatusCode> {
        let metrics: Vec<serde_json::Value> = db
            .query("SELECT 
                count() AS total_tasks,
                count(status = 'Completed') AS completed_tasks,
                count(end_date < time::now() AND status != 'Completed') AS overdue_tasks
                FROM migration_task WHERE project_id = $project")
            .bind(("project", project_id))
            .await
            .map_err(|e| {
                eprintln!("Error calculating project metrics: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?
            .take(0)
            .map_err(|e| {
                eprintln!("Error parsing metrics: {}", e);
                StatusCode::INTERNAL_SERVER_ERROR
            })?;

        if let Some(metrics) = metrics.first() {
            let _: Option<MigrationProject> = db
                .update(("migration_project", project_id.to_string()))
                .merge(&serde_json::json!({
                    "total_tasks": metrics["total_tasks"],
                    "completed_tasks": metrics["completed_tasks"],
                    "overdue_tasks": metrics["overdue_tasks"],
                    "updated_at": Utc::now(),
                }))
                .await
                .map_err(|e| {
                    eprintln!("Error updating project metrics: {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                })?;
        }

        Ok(())
    }
}

// Template task definitions (simplified for now)
struct TemplateTask {
    name: String,
    description: String,
    task_type: MigrationTaskType,
    priority: TaskPriority,
    estimated_hours: f32,
    tags: Vec<String>,
    resources: Option<Vec<String>>,
}

fn get_vmware_to_hyperv_template_tasks() -> Vec<TemplateTask> {
    vec![
        TemplateTask {
            name: "Infrastructure Assessment".to_string(),
            description: "Complete assessment of current VMware environment".to_string(),
            task_type: MigrationTaskType::Assessment,
            priority: TaskPriority::High,
            estimated_hours: 40.0,
            tags: vec!["assessment".to_string(), "discovery".to_string()],
            resources: Some(vec!["SME".to_string(), "Assessment Tools".to_string()]),
        },
        TemplateTask {
            name: "RVTools Data Collection".to_string(),
            description: "Gather RVTools reports from all vCenter instances".to_string(),
            task_type: MigrationTaskType::Assessment,
            priority: TaskPriority::High,
            estimated_hours: 16.0,
            tags: vec!["rvtools".to_string(), "data-collection".to_string()],
            resources: Some(vec!["VMware Admin".to_string()]),
        },
        TemplateTask {
            name: "Target Architecture Design".to_string(),
            description: "Design Hyper-V cluster architecture and networking".to_string(),
            task_type: MigrationTaskType::Planning,
            priority: TaskPriority::High,
            estimated_hours: 80.0,
            tags: vec!["architecture".to_string(), "design".to_string()],
            resources: Some(vec!["Architect".to_string(), "Network Engineer".to_string()]),
        },
    ]
}

fn get_vmware_to_azure_local_template_tasks() -> Vec<TemplateTask> {
    vec![
        TemplateTask {
            name: "Azure Local Readiness Assessment".to_string(),
            description: "Assess readiness for Azure Local deployment".to_string(),
            task_type: MigrationTaskType::Assessment,
            priority: TaskPriority::Critical,
            estimated_hours: 60.0,
            tags: vec!["azure-local".to_string(), "readiness".to_string()],
            resources: Some(vec!["Azure Architect".to_string()]),
        },
        TemplateTask {
            name: "Hardware Requirements Validation".to_string(),
            description: "Validate hardware meets Azure Local requirements (RDMA, JBOD, etc.)".to_string(),
            task_type: MigrationTaskType::Assessment,
            priority: TaskPriority::Critical,
            estimated_hours: 40.0,
            tags: vec!["hardware".to_string(), "validation".to_string(), "rdma".to_string()],
            resources: Some(vec!["Hardware Engineer".to_string()]),
        },
        TemplateTask {
            name: "Storage Spaces Direct Design".to_string(),
            description: "Design S2D configuration and storage layout".to_string(),
            task_type: MigrationTaskType::Planning,
            priority: TaskPriority::High,
            estimated_hours: 48.0,
            tags: vec!["s2d".to_string(), "storage".to_string(), "design".to_string()],
            resources: Some(vec!["Storage Architect".to_string()]),
        },
    ]
}

// Migration API routes
pub fn routes() -> Router<AppState> {
    Router::new()
        // Project management routes
        .route("/migration/projects", get(MigrationApi::list_migration_projects).post(MigrationApi::create_migration_project))
        .route("/migration/projects/:id", get(MigrationApi::get_migration_project))
        .route("/migration/projects/:id/template", post(MigrationApi::apply_project_template))
        .route("/migration/projects/:id/tasks", get(MigrationApi::list_migration_tasks))
        // Task management routes  
        .route("/migration/tasks", post(MigrationApi::create_migration_task))
        .route("/migration/tasks/:id/status", put(MigrationApi::update_task_status))
}
