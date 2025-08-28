use crate::database::Database;
use crate::models::project_models::*;
use anyhow::{Context, Result};
use chrono::Utc;
use surrealdb::sql::Thing;
use std::collections::HashMap;

pub struct ProjectManagementService {
    db: Database,
}

impl ProjectManagementService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // =============================================================================
    // PROJECT MANAGEMENT OPERATIONS
    // =============================================================================

    pub async fn create_project(&self, request: CreateProjectRequest, created_by: String) -> Result<Project> {
        let project = Project {
            id: None,
            name: request.name,
            description: request.description,
            project_type: request.project_type,
            status: ProjectStatus::Planning,
            priority: request.priority.unwrap_or(ProjectPriority::Medium),
            start_date: request.start_date,
            target_end_date: request.target_end_date,
            actual_end_date: None,
            progress_percentage: 0,
            budget_allocated: request.budget_allocated,
            budget_spent: 0.0,
            risk_level: RiskLevel::Medium,
            stakeholders: request.stakeholders.unwrap_or_default(),
            tags: request.tags.unwrap_or_default(),
            metadata: HashMap::new(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            created_by,
            assigned_to: request.assigned_to,
        };

        let created: Vec<Project> = self.db
            .create("project")
            .content(project)
            .await
            .context("Failed to create project")?;

        created.into_iter().next()
            .ok_or_else(|| anyhow::anyhow!("No project returned from database"))
    }

    pub async fn get_project(&self, project_id: &str) -> Result<Option<Project>> {
        let project: Option<Project> = self.db
            .select(("project", project_id))
            .await
            .context("Failed to get project")?;

        Ok(project)
    }

    pub async fn list_projects(&self, filter: Option<ProjectFilter>) -> Result<Vec<ProjectResponse>> {
        let mut query = "SELECT *, 
            (SELECT COUNT() FROM project_workflow WHERE project_id = $parent.id AND status != 'completed') AS active_workflows,
            (SELECT COUNT() FROM project_workflow WHERE project_id = $parent.id) AS total_workflows
            FROM project".to_string();

        let mut conditions = Vec::new();

        if let Some(f) = filter {
            if let Some(status) = f.status {
                conditions.push(format!("status = '{:?}'", status));
            }
            if let Some(project_type) = f.project_type {
                conditions.push(format!("project_type = '{:?}'", project_type));
            }
            if let Some(priority) = f.priority {
                conditions.push(format!("priority = '{:?}'", priority));
            }
            if let Some(assigned_to) = f.assigned_to {
                conditions.push(format!("assigned_to = '{}'", assigned_to));
            }
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
        }

        query.push_str(" ORDER BY created_at DESC");

        let projects: Vec<serde_json::Value> = self.db
            .query(query)
            .await
            .context("Failed to list projects")?
            .take(0)
            .context("Failed to extract project results")?;

        let mut responses = Vec::new();
        for project_data in projects {
            let project: Project = serde_json::from_value(project_data.clone())
                .context("Failed to deserialize project")?;
            
            let active_workflows = project_data.get("active_workflows")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as i32;
            let total_workflows = project_data.get("total_workflows")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as i32;

            responses.push(ProjectResponse {
                id: project.id.unwrap(),
                name: project.name,
                description: project.description,
                project_type: project.project_type,
                status: project.status,
                priority: project.priority,
                start_date: project.start_date,
                target_end_date: project.target_end_date,
                progress_percentage: project.progress_percentage,
                budget_allocated: project.budget_allocated,
                budget_spent: project.budget_spent,
                risk_level: project.risk_level,
                stakeholders: project.stakeholders,
                tags: project.tags,
                created_at: project.created_at,
                updated_at: project.updated_at,
                created_by: project.created_by,
                assigned_to: project.assigned_to,
                active_workflows,
                total_workflows,
            });
        }

        Ok(responses)
    }

    pub async fn update_project(&self, project_id: &str, request: UpdateProjectRequest) -> Result<Project> {
        let mut update_fields = HashMap::new();

        if let Some(name) = request.name {
            update_fields.insert("name", serde_json::to_value(name)?);
        }
        if let Some(description) = request.description {
            update_fields.insert("description", serde_json::to_value(description)?);
        }
        if let Some(status) = request.status {
            update_fields.insert("status", serde_json::to_value(status)?);
        }
        if let Some(priority) = request.priority {
            update_fields.insert("priority", serde_json::to_value(priority)?);
        }
        if let Some(start_date) = request.start_date {
            update_fields.insert("start_date", serde_json::to_value(start_date)?);
        }
        if let Some(target_end_date) = request.target_end_date {
            update_fields.insert("target_end_date", serde_json::to_value(target_end_date)?);
        }
        if let Some(actual_end_date) = request.actual_end_date {
            update_fields.insert("actual_end_date", serde_json::to_value(actual_end_date)?);
        }
        if let Some(progress_percentage) = request.progress_percentage {
            update_fields.insert("progress_percentage", serde_json::to_value(progress_percentage)?);
        }
        if let Some(budget_allocated) = request.budget_allocated {
            update_fields.insert("budget_allocated", serde_json::to_value(budget_allocated)?);
        }
        if let Some(risk_level) = request.risk_level {
            update_fields.insert("risk_level", serde_json::to_value(risk_level)?);
        }
        if let Some(stakeholders) = request.stakeholders {
            update_fields.insert("stakeholders", serde_json::to_value(stakeholders)?);
        }
        if let Some(tags) = request.tags {
            update_fields.insert("tags", serde_json::to_value(tags)?);
        }
        if let Some(assigned_to) = request.assigned_to {
            update_fields.insert("assigned_to", serde_json::to_value(assigned_to)?);
        }

        update_fields.insert("updated_at", serde_json::to_value(Utc::now())?);

        let updated: Option<Project> = self.db
            .update(("project", project_id))
            .merge(update_fields)
            .await
            .context("Failed to update project")?;

        updated.ok_or_else(|| anyhow::anyhow!("Project not found"))
    }

    pub async fn delete_project(&self, project_id: &str) -> Result<()> {
        // First check if there are any active workflows
        let active_workflows: Vec<ProjectWorkflow> = self.db
            .query("SELECT * FROM project_workflow WHERE project_id = $project_id AND status != 'completed'")
            .bind(("project_id", Thing::from(("project", project_id))))
            .await?
            .take(0)?;

        if !active_workflows.is_empty() {
            return Err(anyhow::anyhow!("Cannot delete project with active workflows"));
        }

        let _deleted: Option<Project> = self.db
            .delete(("project", project_id))
            .await
            .context("Failed to delete project")?;

        Ok(())
    }

    // =============================================================================
    // WORKFLOW MANAGEMENT OPERATIONS
    // =============================================================================

    pub async fn create_workflow(&self, project_id: &str, request: CreateWorkflowRequest) -> Result<ProjectWorkflow> {
        let project_thing = Thing::from(("project", project_id));
        
        // Verify project exists
        let _project: Option<Project> = self.db
            .select(&project_thing)
            .await?;

        let workflow = ProjectWorkflow {
            id: None,
            project_id: project_thing,
            name: request.name,
            description: request.description,
            workflow_type: request.workflow_type,
            status: WorkflowStatus::NotStarted,
            priority: request.priority.unwrap_or(5),
            estimated_duration_hours: request.estimated_duration_hours,
            actual_duration_hours: None,
            start_date: request.start_date,
            target_end_date: request.target_end_date,
            actual_end_date: None,
            progress_percentage: 0,
            dependencies: request.dependencies.unwrap_or_default().into_iter()
                .map(|id| Thing::from(("project_workflow", id.as_str())))
                .collect(),
            assigned_to: request.assigned_to,
            requires_approval: request.requires_approval.unwrap_or(false),
            approved_by: None,
            approval_date: None,
            metadata: HashMap::new(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let created: Vec<ProjectWorkflow> = self.db
            .create("project_workflow")
            .content(workflow)
            .await
            .context("Failed to create workflow")?;

        created.into_iter().next()
            .ok_or_else(|| anyhow::anyhow!("No workflow returned from database"))
    }

    pub async fn list_project_workflows(&self, project_id: &str) -> Result<Vec<WorkflowResponse>> {
        let project_thing = Thing::from(("project", project_id));
        
        let workflows: Vec<serde_json::Value> = self.db
            .query("SELECT *, 
                (SELECT COUNT() FROM workflow_activity WHERE workflow_id = $parent.id) AS total_activities,
                (SELECT COUNT() FROM workflow_activity WHERE workflow_id = $parent.id AND status = 'completed') AS completed_activities
                FROM project_workflow WHERE project_id = $project_id ORDER BY priority ASC, created_at ASC")
            .bind(("project_id", project_thing))
            .await?
            .take(0)?;

        let mut responses = Vec::new();
        for workflow_data in workflows {
            let workflow: ProjectWorkflow = serde_json::from_value(workflow_data.clone())?;
            
            let total_activities = workflow_data.get("total_activities")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as i32;
            let completed_activities = workflow_data.get("completed_activities")
                .and_then(|v| v.as_i64())
                .unwrap_or(0) as i32;

            responses.push(WorkflowResponse {
                id: workflow.id.unwrap(),
                project_id: workflow.project_id,
                name: workflow.name,
                description: workflow.description,
                workflow_type: workflow.workflow_type,
                status: workflow.status,
                priority: workflow.priority,
                estimated_duration_hours: workflow.estimated_duration_hours,
                actual_duration_hours: workflow.actual_duration_hours,
                start_date: workflow.start_date,
                target_end_date: workflow.target_end_date,
                progress_percentage: workflow.progress_percentage,
                assigned_to: workflow.assigned_to,
                total_activities,
                completed_activities,
            });
        }

        Ok(responses)
    }

    // =============================================================================
    // HARDWARE POOL MANAGEMENT OPERATIONS
    // =============================================================================

    pub async fn list_available_hardware(&self, filter: Option<HardwareFilter>) -> Result<Vec<HardwarePoolResponse>> {
        let mut query = "SELECT * FROM hardware_pool".to_string();
        let mut conditions = Vec::new();

        if let Some(f) = filter {
            if let Some(status) = f.availability_status {
                conditions.push(format!("availability_status = '{:?}'", status));
            } else {
                conditions.push("availability_status = 'available'".to_string());
            }

            if let Some(vendor) = f.vendor {
                conditions.push(format!("vendor = '{}'", vendor));
            }
            if let Some(datacenter) = f.datacenter {
                conditions.push(format!("datacenter = '{}'", datacenter));
            }
            if let Some(min_cores) = f.min_cpu_cores {
                conditions.push(format!("cpu_cores_total >= {}", min_cores));
            }
            if let Some(min_memory) = f.min_memory_gb {
                conditions.push(format!("memory_gb >= {}", min_memory));
            }
        } else {
            conditions.push("availability_status = 'available'".to_string());
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
        }

        query.push_str(" ORDER BY vendor, model, asset_tag");

        let hardware: Vec<HardwarePool> = self.db
            .query(query)
            .await
            .context("Failed to list hardware")?
            .take(0)
            .context("Failed to extract hardware results")?;

        let responses = hardware.into_iter().map(|hw| HardwarePoolResponse {
            id: hw.id.unwrap(),
            asset_tag: hw.asset_tag,
            vendor: hw.vendor,
            model: hw.model,
            cpu_cores_total: hw.cpu_cores_total,
            memory_gb: hw.memory_gb,
            availability_status: hw.availability_status,
            location: hw.location,
            datacenter: hw.datacenter,
            available_from_date: hw.available_from_date,
            available_until_date: hw.available_until_date,
        }).collect();

        Ok(responses)
    }

    pub async fn allocate_hardware(&self, request: HardwareAllocationRequest, allocated_by: String) -> Result<Vec<HardwareAllocation>> {
        let project_thing = Thing::from(("project", request.project_id.as_str()));
        let workflow_thing = request.workflow_id.map(|id| Thing::from(("project_workflow", id.as_str())));

        let mut allocations = Vec::new();

        for server_id in request.server_ids {
            let server_thing = Thing::from(("hardware_pool", server_id.as_str()));

            // Check if server is available
            let server: Option<HardwarePool> = self.db
                .select(&server_thing)
                .await?;

            let server = server.ok_or_else(|| anyhow::anyhow!("Server {} not found", server_id))?;

            if server.availability_status != AvailabilityStatus::Available {
                return Err(anyhow::anyhow!("Server {} is not available", server_id));
            }

            // Create allocation
            let allocation = HardwareAllocation {
                id: None,
                project_id: project_thing.clone(),
                workflow_id: workflow_thing.clone(),
                server_id: server_thing.clone(),
                allocation_type: AllocationType::Allocated,
                allocation_start: request.allocation_start,
                allocation_end: request.allocation_end,
                purpose: "compute".to_string(), // Default purpose
                configuration_notes: request.allocation_notes.clone(),
                allocated_by: allocated_by.clone(),
                approved_by: None,
                metadata: HashMap::new(),
                created_at: Utc::now(),
            };

            let created: Vec<HardwareAllocation> = self.db
                .create("hardware_allocation")
                .content(allocation)
                .await?;

            if let Some(allocation) = created.into_iter().next() {
                // Update server status to allocated
                let _: Option<HardwarePool> = self.db
                    .update(&server_thing)
                    .merge(serde_json::json!({
                        "availability_status": "allocated",
                        "updated_at": Utc::now()
                    }))
                    .await?;

                allocations.push(allocation);
            }
        }

        Ok(allocations)
    }

    pub async fn release_hardware(&self, server_ids: Vec<String>) -> Result<()> {
        for server_id in server_ids {
            let server_thing = Thing::from(("hardware_pool", server_id.as_str()));

            // Update server status back to available
            let _: Option<HardwarePool> = self.db
                .update(&server_thing)
                .merge(serde_json::json!({
                    "availability_status": "available",
                    "updated_at": Utc::now()
                }))
                .await?;

            // Update allocation records
            self.db
                .query("UPDATE hardware_allocation SET allocation_end = $now WHERE server_id = $server_id AND allocation_end IS NONE")
                .bind(("server_id", server_thing))
                .bind(("now", Utc::now()))
                .await?;
        }

        Ok(())
    }

    pub async fn hardware_pool_status(&self) -> Result<serde_json::Value> {
        let status: Vec<serde_json::Value> = self.db
            .query("SELECT availability_status, COUNT() AS count FROM hardware_pool GROUP BY availability_status")
            .await?
            .take(0)?;

        let mut result = serde_json::Map::new();
        for item in status {
            if let (Some(status), Some(count)) = (item.get("availability_status"), item.get("count")) {
                result.insert(status.as_str().unwrap_or("unknown").to_string(), count.clone());
            }
        }

        Ok(serde_json::Value::Object(result))
    }

    // =============================================================================
    // UTILITY METHODS
    // =============================================================================

    pub async fn calculate_project_progress(&self, project_id: &str) -> Result<u8> {
        let project_thing = Thing::from(("project", project_id));
        
        let result: Vec<serde_json::Value> = self.db
            .query("SELECT 
                COUNT() AS total_workflows,
                (SELECT COUNT() FROM project_workflow WHERE project_id = $project_id AND status = 'completed') AS completed_workflows
                FROM project_workflow WHERE project_id = $project_id")
            .bind(("project_id", project_thing))
            .await?
            .take(0)?;

        if let Some(data) = result.first() {
            let total = data.get("total_workflows").and_then(|v| v.as_i64()).unwrap_or(0);
            let completed = data.get("completed_workflows").and_then(|v| v.as_i64()).unwrap_or(0);

            if total == 0 {
                return Ok(0);
            }

            let progress = (completed as f64 / total as f64 * 100.0) as u8;
            Ok(progress)
        } else {
            Ok(0)
        }
    }

    pub async fn get_project_timeline(&self, project_id: &str) -> Result<serde_json::Value> {
        let project_thing = Thing::from(("project", project_id));
        
        let workflows: Vec<ProjectWorkflow> = self.db
            .query("SELECT * FROM project_workflow WHERE project_id = $project_id ORDER BY priority ASC, start_date ASC")
            .bind(("project_id", project_thing))
            .await?
            .take(0)?;

        let timeline = serde_json::json!({
            "workflows": workflows,
            "total_duration_hours": workflows.iter()
                .map(|w| w.estimated_duration_hours.unwrap_or(0.0))
                .sum::<f64>(),
            "critical_path": workflows.iter()
                .filter(|w| w.priority <= 3)
                .collect::<Vec<_>>()
        });

        Ok(timeline)
    }
}
