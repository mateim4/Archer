// Migration Wizard Service - RVTools Processing and Project Management
use anyhow::{Result, Context};
use calamine::{Reader, Xlsx, open_workbook, DataType};
use chrono::Utc;
use std::path::Path;
use surrealdb::sql::Thing;

use crate::database::Database;
use crate::models::migration_wizard_models::*;

pub struct MigrationWizardService {
    db: Database,
}

impl MigrationWizardService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // =========================================================================
    // PROJECT MANAGEMENT
    // =========================================================================

    /// Create a new migration wizard project
    pub async fn create_project(
        &self,
        name: String,
        description: Option<String>,
    ) -> Result<MigrationWizardProject> {
        let project = MigrationWizardProject {
            id: None,
            name,
            description,
            status: ProjectStatus::Draft,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            rvtools_filename: None,
            rvtools_upload_date: None,
            rvtools_file_path: None,
            total_vms: 0,
            total_clusters: 0,
            wizard_step: 1,
        };

        let created: Vec<MigrationWizardProject> = self
            .db
            .create("migration_wizard_project")
            .content(project)
            .await
            .context("Failed to create migration wizard project")?;

        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No project returned after creation"))
    }

    /// List all migration wizard projects
    pub async fn list_projects(&self, filter: Option<ProjectFilter>) -> Result<Vec<MigrationWizardProject>> {
        let mut query = "SELECT * FROM migration_wizard_project".to_string();
        let mut conditions = Vec::new();

        if let Some(f) = &filter {
            if let Some(status) = &f.status {
                conditions.push(format!("status = '{}'", status));
            }
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" WHERE {}", conditions.join(" AND ")));
        }

        query.push_str(" ORDER BY created_at DESC");

        if let Some(f) = &filter {
            if let Some(limit) = f.limit {
                query.push_str(&format!(" LIMIT {}", limit));
            }
            if let Some(offset) = f.offset {
                query.push_str(&format!(" START {}", offset));
            }
        }

        let projects: Vec<MigrationWizardProject> = self
            .db
            .query(&query)
            .await
            .context("Failed to list projects")?
            .take(0)
            .context("Failed to parse projects")?;

        Ok(projects)
    }

    /// Get a single project by ID
    pub async fn get_project(&self, project_id: &str) -> Result<MigrationWizardProject> {
        let project: Option<MigrationWizardProject> = self
            .db
            .select(("migration_wizard_project", project_id))
            .await
            .context("Failed to get project")?;

        project.ok_or_else(|| anyhow::anyhow!("Project not found"))
    }

    /// Update project metadata
    pub async fn update_project(
        &self,
        project_id: &str,
        updates: serde_json::Value,
    ) -> Result<MigrationWizardProject> {
        // Get existing project
        let mut project = self.get_project(project_id).await?;
        
        // Update timestamp
        project.updated_at = Utc::now();
        
        // Merge updates
        let mut project_json = serde_json::to_value(&project)?;
        if let serde_json::Value::Object(ref mut map) = project_json {
            if let serde_json::Value::Object(updates_map) = updates {
                for (key, value) in updates_map {
                    map.insert(key, value);
                }
            }
        }
        
        // Save back to database
        let updated: Option<MigrationWizardProject> = self
            .db
            .update(("migration_wizard_project", project_id))
            .content(project_json)
            .await
            .context("Failed to update project")?;

        updated.ok_or_else(|| anyhow::anyhow!("Project not found after update"))
    }

    // =========================================================================
    // RVTOOLS PROCESSING
    // =========================================================================

    /// Process RVTools Excel file and populate VM data
    pub async fn process_rvtools_file(
        &self,
        project_id: &str,
        file_path: &Path,
        filename: String,
    ) -> Result<usize> {
        tracing::info!("Processing RVTools file: {}", filename);

        // Parse Excel file
        let vms = self.parse_rvtools_excel(file_path)?;
        let vm_count = vms.len();

        tracing::info!("Parsed {} VMs from RVTools file", vm_count);

        // Get project Thing ID
        let project_thing = Thing::from(("migration_wizard_project", project_id));

        // Save VMs to database
        for vm in vms {
            let mut vm_data = vm;
            vm_data.project_id = project_thing.clone();
            
            let _: Vec<MigrationWizardVM> = self
                .db
                .create("migration_wizard_vm")
                .content(vm_data)
                .await
                .context("Failed to create VM record")?;
        }

        // Update project with RVTools metadata
        let update_data = serde_json::json!({
            "rvtools_filename": filename,
            "rvtools_upload_date": Utc::now(),
            "rvtools_file_path": file_path.to_string_lossy().to_string(),
            "total_vms": vm_count as i32,
            "updated_at": Utc::now(),
        });

        self.update_project(project_id, update_data).await?;

        Ok(vm_count)
    }

    /// Parse RVTools Excel file using calamine
    fn parse_rvtools_excel(&self, file_path: &Path) -> Result<Vec<MigrationWizardVM>> {
        let mut workbook: Xlsx<_> = open_workbook(file_path)
            .context("Failed to open Excel file")?;

        // RVTools typically has multiple sheets: tabvInfo, tabvCPU, tabvMemory, etc.
        // We'll parse tabvInfo for VM information
        let sheet_name = "tabvInfo";
        
        let range = workbook
            .worksheet_range(sheet_name)
            .context(format!("Sheet '{}' not found", sheet_name))?
            .context("Failed to read sheet")?;

        let mut vms = Vec::new();
        let mut headers: Vec<String> = Vec::new();

        for (row_idx, row) in range.rows().enumerate() {
            if row_idx == 0 {
                // Parse headers
                headers = row
                    .iter()
                    .map(|cell| cell.to_string().trim().to_string())
                    .collect();
                continue;
            }

            // Parse VM data
            let vm = self.parse_vm_row(&headers, row)?;
            vms.push(vm);
        }

        Ok(vms)
    }

    /// Parse a single VM row from Excel
    fn parse_vm_row(&self, headers: &[String], row: &[DataType]) -> Result<MigrationWizardVM> {
        let get_string = |name: &str| -> Option<String> {
            headers
                .iter()
                .position(|h| h.eq_ignore_ascii_case(name))
                .and_then(|idx| row.get(idx))
                .and_then(|cell| {
                    let s = cell.to_string().trim().to_string();
                    if s.is_empty() { None } else { Some(s) }
                })
        };

        let get_int = |name: &str, default: i32| -> i32 {
            get_string(name)
                .and_then(|s| s.parse::<i32>().ok())
                .unwrap_or(default)
        };

        let vm = MigrationWizardVM {
            id: None,
            project_id: Thing::from(("migration_wizard_project", "temp")), // Will be overwritten
            name: get_string("VM").unwrap_or_else(|| format!("Unknown-VM")),
            powerstate: get_string("Powerstate"),
            template: get_string("Template").map(|s| s.eq_ignore_ascii_case("true")),
            
            // Resources
            cpus: get_int("CPUs", 1),
            memory_mb: get_int("Memory", 1024),
            provisioned_mb: get_string("Provisioned MB").and_then(|s| s.parse().ok()),
            in_use_mb: get_string("In Use MB").and_then(|s| s.parse().ok()),
            
            // Network
            primary_ip_address: get_string("Primary IP Address"),
            dns_name: get_string("DNS Name"),
            
            // Cluster info
            cluster: get_string("Cluster"),
            host: get_string("Host"),
            datacenter: get_string("Datacenter"),
            
            // OS info
            os: get_string("OS"),
            version: get_string("Version"),
            
            // Storage
            num_disks: get_int("Disks", 0),
            num_nics: get_int("NICs", 0),
            
            // Annotations
            annotation: get_string("Annotation"),
            folder: get_string("Folder"),
            
            created_at: Utc::now(),
        };

        Ok(vm)
    }

    // =========================================================================
    // VM MANAGEMENT
    // =========================================================================

    /// Get VMs for a project
    pub async fn get_project_vms(
        &self,
        project_id: &str,
        filter: Option<VMFilter>,
    ) -> Result<Vec<MigrationWizardVM>> {
        let mut query = format!(
            "SELECT * FROM migration_wizard_vm WHERE project_id = type::thing('migration_wizard_project', '{}')",
            project_id
        );

        if let Some(f) = &filter {
            if let Some(cluster) = &f.cluster {
                query.push_str(&format!(" AND cluster = '{}'", cluster));
            }
            if let Some(powerstate) = &f.powerstate {
                query.push_str(&format!(" AND powerstate = '{}'", powerstate));
            }
        }

        query.push_str(" ORDER BY name ASC");

        if let Some(f) = &filter {
            if let Some(limit) = f.limit {
                query.push_str(&format!(" LIMIT {}", limit));
            }
            if let Some(offset) = f.offset {
                query.push_str(&format!(" START {}", offset));
            }
        }

        let vms: Vec<MigrationWizardVM> = self
            .db
            .query(&query)
            .await
            .context("Failed to get VMs")?
            .take(0)
            .context("Failed to parse VMs")?;

        Ok(vms)
    }

    /// Delete all VMs for a project (used when re-uploading RVTools)
    pub async fn delete_project_vms(&self, project_id: &str) -> Result<()> {
        let query = format!(
            "DELETE migration_wizard_vm WHERE project_id = type::thing('migration_wizard_project', '{}')",
            project_id
        );

        self.db
            .query(&query)
            .await
            .context("Failed to delete VMs")?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_project() {
        // This would require test database setup
        // Placeholder for now
    }
}
