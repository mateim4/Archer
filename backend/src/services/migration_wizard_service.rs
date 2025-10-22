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

    // =========================================================================
    // CLUSTER MANAGEMENT
    // =========================================================================

    /// Create a new destination cluster
    pub async fn create_cluster(
        &self,
        project_id: &str,
        cluster: MigrationWizardCluster,
    ) -> Result<MigrationWizardCluster> {
        // Verify project exists
        let _project = self.get_project(project_id).await?;

        let created: Vec<MigrationWizardCluster> = self
            .db
            .create("migration_wizard_cluster")
            .content(cluster)
            .await
            .context("Failed to create cluster")?;

        let created_cluster = created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No cluster returned after creation"))?;

        // Update project cluster count
        // TODO: Fix this - temporarily disabled for testing
        // self.update_cluster_count(project_id).await?;

        Ok(created_cluster)
    }

    /// List clusters for a project
    pub async fn get_project_clusters(
        &self,
        project_id: &str,
    ) -> Result<Vec<MigrationWizardCluster>> {
        let query = format!(
            "SELECT * FROM migration_wizard_cluster WHERE project_id = type::thing('migration_wizard_project', '{}') ORDER BY created_at ASC",
            project_id
        );

        let clusters: Vec<MigrationWizardCluster> = self
            .db
            .query(&query)
            .await
            .context("Failed to get clusters")?
            .take(0)
            .context("Failed to parse clusters")?;

        Ok(clusters)
    }

    /// Get a single cluster by ID
    pub async fn get_cluster(&self, cluster_id: &str) -> Result<MigrationWizardCluster> {
        let cluster: Option<MigrationWizardCluster> = self
            .db
            .select(("migration_wizard_cluster", cluster_id))
            .await
            .context("Failed to get cluster")?;

        cluster.ok_or_else(|| anyhow::anyhow!("Cluster not found"))
    }

    /// Update a cluster
    pub async fn update_cluster(
        &self,
        cluster_id: &str,
        updates: serde_json::Value,
    ) -> Result<MigrationWizardCluster> {
        // Use MERGE to update only the specified fields
        let mut update_data = updates.clone();
        if let serde_json::Value::Object(ref mut map) = update_data {
            map.insert("updated_at".to_string(), serde_json::json!(Utc::now()));
        }
        
        // Use merge instead of content to avoid Thing serialization issues
        let updated: Option<MigrationWizardCluster> = self
            .db
            .update(("migration_wizard_cluster", cluster_id))
            .merge(update_data)
            .await
            .context("Failed to update cluster")?;

        updated.ok_or_else(|| anyhow::anyhow!("Cluster not found after update"))
    }

    /// Delete a cluster
    pub async fn delete_cluster(&self, cluster_id: &str) -> Result<()> {
        // Get cluster to find project_id
        let cluster = self.get_cluster(cluster_id).await?;
        let project_id = cluster.project_id.id.to_string();
        let project_id_str = project_id.split(':').nth(1).unwrap_or(&project_id);

        // Delete the cluster
        let _: Option<MigrationWizardCluster> = self
            .db
            .delete(("migration_wizard_cluster", cluster_id))
            .await
            .context("Failed to delete cluster")?;

        // Update project cluster count
        // TODO: Fix this - temporarily disabled for testing
        // self.update_cluster_count(project_id_str).await?;

        Ok(())
    }

    /// Update project's cluster count
    async fn update_cluster_count(&self, project_id: &str) -> Result<()> {
        let clusters = self.get_project_clusters(project_id).await?;
        let count = clusters.len() as i32;

        let update_data = serde_json::json!({
            "total_clusters": count,
            "updated_at": Utc::now(),
        });

        self.update_project(project_id, update_data).await?;
        Ok(())
    }

    // =========================================================================
    // STRATEGY ANALYSIS
    // =========================================================================

    /// Analyze a single VM and recommend migration strategy
    pub async fn analyze_vm_strategy(&self, vm: &MigrationWizardVM) -> Result<StrategyRecommendation> {
        let mut score = 100.0;
        let mut warnings = Vec::new();
        let mut recommendations = Vec::new();

        // Analyze OS compatibility
        if let Some(os) = &vm.os {
            let os_lower = os.to_lowercase();
            
            // Check for known incompatible or legacy OS
            if os_lower.contains("windows xp") || os_lower.contains("windows 2003") {
                score -= 50.0;
                warnings.push("Legacy OS detected - may require upgrade before migration".to_string());
                recommendations.push("Consider upgrading OS to supported version".to_string());
            } else if os_lower.contains("windows server 2008") {
                score -= 30.0;
                warnings.push("End-of-life OS - upgrade recommended".to_string());
                recommendations.push("Upgrade to Windows Server 2019 or 2022".to_string());
            } else if os_lower.contains("windows server") && (os_lower.contains("2012") || os_lower.contains("2016") || os_lower.contains("2019") || os_lower.contains("2022")) {
                score += 0.0; // Fully compatible
                recommendations.push("OS is compatible with Hyper-V - can proceed with Lift & Shift".to_string());
            } else if os_lower.contains("linux") {
                // Linux VMs - check for Integration Services compatibility
                if os_lower.contains("ubuntu") || os_lower.contains("rhel") || os_lower.contains("centos") {
                    score -= 5.0; // Minimal adjustment needed
                    recommendations.push("Ensure Linux Integration Services are installed post-migration".to_string());
                } else {
                    score -= 15.0;
                    warnings.push("Linux distribution may require manual configuration".to_string());
                    recommendations.push("Verify Hyper-V Integration Services compatibility".to_string());
                }
            }
        } else {
            score -= 20.0;
            warnings.push("OS information not available - manual review required".to_string());
        }

        // Analyze resource configuration
        if vm.cpus > 32 {
            score -= 10.0;
            warnings.push(format!("High CPU count ({}) - verify Hyper-V host capacity", vm.cpus));
        }
        
        if vm.memory_mb > 512_000 { // > 500 GB
            score -= 10.0;
            warnings.push(format!("High memory allocation ({} MB) - verify host capacity", vm.memory_mb));
        }

        // Analyze storage
        if vm.num_disks > 8 {
            score -= 5.0;
            warnings.push(format!("Multiple disks ({}) - may require storage redesign", vm.num_disks));
            recommendations.push("Consider consolidating disks during migration".to_string());
        }

        // Analyze network configuration
        if vm.num_nics > 4 {
            score -= 5.0;
            warnings.push(format!("Multiple NICs ({}) - ensure network mapping is complete", vm.num_nics));
        }

        // Determine strategy based on score
        let strategy = if score >= 85.0 {
            "lift_shift"
        } else if score >= 60.0 {
            "replatform"
        } else {
            "rehost"
        };

        // Add strategy-specific recommendations
        match strategy {
            "lift_shift" => {
                recommendations.push("VM can be migrated as-is with minimal changes".to_string());
                recommendations.push("Install Hyper-V Integration Services post-migration".to_string());
            }
            "replatform" => {
                recommendations.push("Modernize during migration for better compatibility".to_string());
                recommendations.push("Update guest OS and drivers".to_string());
                recommendations.push("Review and optimize VM configuration".to_string());
            }
            "rehost" => {
                recommendations.push("Significant changes required - detailed planning needed".to_string());
                recommendations.push("Consider application-level migration instead of VM lift".to_string());
            }
            _ => {}
        }

        Ok(StrategyRecommendation {
            vm_name: vm.name.clone(),
            strategy: strategy.to_string(),
            confidence_score: score,
            warnings,
            recommendations,
        })
    }

    /// Analyze all VMs in a project and generate strategy recommendations
    pub async fn analyze_project_strategy(&self, project_id: &str) -> Result<Vec<StrategyRecommendation>> {
        let vms = self.get_project_vms(project_id, None).await?;
        
        let mut recommendations = Vec::new();
        for vm in vms {
            let recommendation = self.analyze_vm_strategy(&vm).await?;
            recommendations.push(recommendation);
        }

        Ok(recommendations)
    }

    /// Get strategy statistics for a project
    pub async fn get_project_strategy_stats(&self, project_id: &str) -> Result<StrategyStats> {
        let recommendations = self.analyze_project_strategy(project_id).await?;
        
        let mut lift_shift_count = 0;
        let mut replatform_count = 0;
        let mut rehost_count = 0;
        let mut total_warnings = 0;
        let mut avg_confidence = 0.0;

        for rec in &recommendations {
            match rec.strategy.as_str() {
                "lift_shift" => lift_shift_count += 1,
                "replatform" => replatform_count += 1,
                "rehost" => rehost_count += 1,
                _ => {}
            }
            total_warnings += rec.warnings.len();
            avg_confidence += rec.confidence_score;
        }

        if !recommendations.is_empty() {
            avg_confidence /= recommendations.len() as f64;
        }

        Ok(StrategyStats {
            total_vms: recommendations.len(),
            lift_shift_count,
            replatform_count,
            rehost_count,
            average_confidence_score: avg_confidence,
            total_warnings,
        })
    }

    // =========================================================================
    // VM PLACEMENT
    // =========================================================================

    /// Create or update a manual VM placement
    pub async fn create_manual_placement(
        &self,
        project_id: &str,
        vm_id: &str,
        cluster_id: &str,
        strategy: Option<String>,
    ) -> Result<(MigrationWizardPlacement, Vec<String>)> {
        let mut warnings = Vec::new();

        // Verify VM and cluster exist and belong to the project
        let vm = self.get_vm_by_id(vm_id).await?;
        let cluster = self.get_cluster(cluster_id).await?;
        
        // Verify they belong to the same project
        let vm_project_id = vm.project_id.id.to_string();
        let cluster_project_id = cluster.project_id.id.to_string();
        
        if !vm_project_id.contains(project_id) || !cluster_project_id.contains(project_id) {
            return Err(anyhow::anyhow!("VM and cluster must belong to the same project"));
        }

        // Check if placement already exists and delete it
        let existing_query = format!(
            "SELECT * FROM migration_wizard_placement WHERE project_id = type::thing('migration_wizard_project', '{}') AND vm_id = type::thing('migration_wizard_vm', '{}')",
            project_id, vm_id
        );
        
        let existing: Vec<MigrationWizardPlacement> = self.db.query(&existing_query).await?.take(0)?;
        
        if let Some(old_placement) = existing.first() {
            if let Some(ref old_id) = old_placement.id {
                let id_str = old_id.id.to_string();
                let _: Option<MigrationWizardPlacement> = self.db.delete(("migration_wizard_placement", id_str.as_str())).await?;
            }
        }

        // Validate capacity (check current utilization)
        let (capacity_ok, capacity_warnings) = self.validate_cluster_capacity(cluster_id, &vm).await?;
        warnings.extend(capacity_warnings);

        // Create placement
        let placement = MigrationWizardPlacement {
            id: None,
            project_id: Thing::from(("migration_wizard_project", project_id)),
            vm_id: Thing::from(("migration_wizard_vm", vm_id)),
            cluster_id: Thing::from(("migration_wizard_cluster", cluster_id)),
            strategy: strategy.unwrap_or_else(|| "manual".to_string()),
            confidence_score: Some(if capacity_ok { 100.0 } else { 70.0 }),
            warnings: if warnings.is_empty() { None } else { Some(warnings.clone()) },
            allocated_cpu: vm.cpus,
            allocated_memory_mb: vm.memory_mb,
            allocated_storage_gb: (vm.provisioned_mb.unwrap_or(vm.memory_mb) as f64) / 1024.0,
            created_at: Utc::now(),
        };

        let created: Vec<MigrationWizardPlacement> = self
            .db
            .create("migration_wizard_placement")
            .content(placement)
            .await?;

        let created_placement = created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No placement returned after creation"))?;

        Ok((created_placement, warnings))
    }

    /// Delete a VM placement
    pub async fn delete_placement(&self, placement_id: &str) -> Result<()> {
        let _: Option<MigrationWizardPlacement> = self
            .db
            .delete(("migration_wizard_placement", placement_id))
            .await?;
        Ok(())
    }

    /// Get all placements for a project
    pub async fn get_project_placements(&self, project_id: &str) -> Result<Vec<MigrationWizardPlacement>> {
        let query = format!(
            "SELECT * FROM migration_wizard_placement WHERE project_id = type::thing('migration_wizard_project', '{}')",
            project_id
        );
        let mut result = self.db.query(&query).await?;
        let placements: Vec<MigrationWizardPlacement> = result.take(0)?;
        Ok(placements)
    }

    /// Get a single VM by ID
    async fn get_vm_by_id(&self, vm_id: &str) -> Result<MigrationWizardVM> {
        let vm: Option<MigrationWizardVM> = self
            .db
            .select(("migration_wizard_vm", vm_id))
            .await?;
        vm.ok_or_else(|| anyhow::anyhow!("VM not found"))
    }

    /// Validate if a cluster has capacity for a VM
    async fn validate_cluster_capacity(&self, cluster_id: &str, vm: &MigrationWizardVM) -> Result<(bool, Vec<String>)> {
        let mut warnings = Vec::new();
        let cluster = self.get_cluster(cluster_id).await?;
        
        // Get current placements for this cluster
        let cluster_id_str = cluster.id.as_ref()
            .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
            .unwrap_or_else(|| cluster_id.to_string());
        
        let query = format!(
            "SELECT * FROM migration_wizard_placement WHERE cluster_id = type::thing('migration_wizard_cluster', '{}')",
            cluster_id_str
        );
        
        let mut result = self.db.query(&query).await?;
        let placements: Vec<MigrationWizardPlacement> = result.take(0)?;
        
        // Calculate current utilization
        let mut total_cpu = 0;
        let mut total_memory = 0;
        let mut total_storage = 0.0;
        
        for p in &placements {
            total_cpu += p.allocated_cpu;
            total_memory += p.allocated_memory_mb;
            total_storage += p.allocated_storage_gb;
        }
        
        // Apply oversubscription
        let available_cpu = (cluster.total_cores as f64 * cluster.cpu_oversubscription_ratio) as i32;
        let available_memory = (cluster.memory_gb as f64 * 1024.0 * cluster.memory_oversubscription_ratio) as i32;
        let available_storage = cluster.storage_tb * 1024.0;
        
        // Check capacity
        let mut capacity_ok = true;
        
        if total_cpu + vm.cpus > available_cpu {
            warnings.push(format!(
                "CPU capacity warning: {} + {} > {} (with {}x oversubscription)",
                total_cpu, vm.cpus, available_cpu, cluster.cpu_oversubscription_ratio
            ));
            capacity_ok = false;
        }
        
        if total_memory + vm.memory_mb > available_memory {
            warnings.push(format!(
                "Memory capacity warning: {} MB + {} MB > {} MB (with {}x oversubscription)",
                total_memory, vm.memory_mb, available_memory, cluster.memory_oversubscription_ratio
            ));
            capacity_ok = false;
        }
        
        let vm_storage = (vm.provisioned_mb.unwrap_or(vm.memory_mb) as f64) / 1024.0;
        if total_storage + vm_storage > available_storage {
            warnings.push(format!(
                "Storage capacity warning: {:.2} GB + {:.2} GB > {:.2} GB",
                total_storage, vm_storage, available_storage
            ));
            capacity_ok = false;
        }
        
        Ok((capacity_ok, warnings))
    }

    /// Automatic VM placement using Best Fit Decreasing bin-packing algorithm
    pub async fn auto_place_vms(&self, project_id: &str) -> Result<(Vec<MigrationWizardPlacement>, Vec<String>)> {
        let mut all_warnings = Vec::new();
        let mut placements = Vec::new();

        // Get all VMs and clusters for the project
        let vms = self.get_project_vms(project_id, None).await?;
        let clusters = self.get_project_clusters(project_id).await?;

        if clusters.is_empty() {
            return Err(anyhow::anyhow!("No destination clusters defined for this project"));
        }

        // Sort VMs by resource requirements (descending) - Best Fit Decreasing
        let mut sorted_vms = vms.clone();
        sorted_vms.sort_by(|a, b| {
            let a_score = a.cpus * 1000 + a.memory_mb;
            let b_score = b.cpus * 1000 + b.memory_mb;
            b_score.cmp(&a_score)
        });

        // Track cluster utilization
        let mut cluster_usage: std::collections::HashMap<String, (i32, i32, f64)> = std::collections::HashMap::new();
        for cluster in &clusters {
            let cluster_id = cluster.id.as_ref()
                .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                .unwrap_or_default();
            cluster_usage.insert(cluster_id, (0, 0, 0.0));
        }

        // Load existing placements to track current usage
        let existing_placements = self.get_project_placements(project_id).await?;
        for placement in &existing_placements {
            let cluster_id = placement.cluster_id.id.to_string().split(':').nth(1).unwrap_or("").to_string();
            if let Some(usage) = cluster_usage.get_mut(&cluster_id) {
                usage.0 += placement.allocated_cpu;
                usage.1 += placement.allocated_memory_mb;
                usage.2 += placement.allocated_storage_gb;
            }
        }

        // Place each VM in the best-fit cluster
        for vm in &sorted_vms {
            let vm_id = vm.id.as_ref()
                .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                .unwrap_or_default();

            // Skip if already placed
            if existing_placements.iter().any(|p| {
                p.vm_id.id.to_string().contains(&vm_id)
            }) {
                continue;
            }

            // Find best-fit cluster (cluster with minimum remaining capacity after placing this VM)
            let mut best_cluster: Option<(&MigrationWizardCluster, String)> = None;
            let mut best_score = f64::MAX;

            for cluster in &clusters {
                let cluster_id = cluster.id.as_ref()
                    .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                    .unwrap_or_default();

                let usage = cluster_usage.get(&cluster_id).unwrap_or(&(0, 0, 0.0));
                
                let available_cpu = (cluster.total_cores as f64 * cluster.cpu_oversubscription_ratio) as i32;
                let available_memory = (cluster.memory_gb as f64 * 1024.0 * cluster.memory_oversubscription_ratio) as i32;
                let available_storage = cluster.storage_tb * 1024.0;

                let vm_storage = (vm.provisioned_mb.unwrap_or(vm.memory_mb) as f64) / 1024.0;

                // Check if VM fits
                if usage.0 + vm.cpus <= available_cpu &&
                   usage.1 + vm.memory_mb <= available_memory &&
                   usage.2 + vm_storage <= available_storage {
                    
                    // Calculate fit score (lower is better - tighter fit)
                    let cpu_remaining = available_cpu - (usage.0 + vm.cpus);
                    let memory_remaining = available_memory - (usage.1 + vm.memory_mb);
                    let fit_score = (cpu_remaining as f64 / available_cpu as f64) + 
                                   (memory_remaining as f64 / available_memory as f64);

                    if fit_score < best_score {
                        best_score = fit_score;
                        best_cluster = Some((cluster, cluster_id.clone()));
                    }
                }
            }

            // Place VM in best-fit cluster
            if let Some((cluster, cluster_id)) = best_cluster {
                match self.create_manual_placement(project_id, &vm_id, &cluster_id, Some("auto_placement".to_string())).await {
                    Ok((placement, warnings)) => {
                        // Update usage tracking
                        if let Some(usage) = cluster_usage.get_mut(&cluster_id) {
                            usage.0 += vm.cpus;
                            usage.1 += vm.memory_mb;
                            usage.2 += (vm.provisioned_mb.unwrap_or(vm.memory_mb) as f64) / 1024.0;
                        }
                        
                        placements.push(placement);
                        all_warnings.extend(warnings);
                    }
                    Err(e) => {
                        all_warnings.push(format!("Failed to place VM {}: {}", vm.name, e));
                    }
                }
            } else {
                all_warnings.push(format!("No suitable cluster found for VM: {} (CPU: {}, Memory: {} MB)", 
                    vm.name, vm.cpus, vm.memory_mb));
            }
        }

        Ok((placements, all_warnings))
    }

    /// Get cluster utilization statistics
    pub async fn get_cluster_utilization(&self, project_id: &str) -> Result<Vec<(MigrationWizardCluster, i32, i32, f64, usize)>> {
        let clusters = self.get_project_clusters(project_id).await?;
        let placements = self.get_project_placements(project_id).await?;

        let mut result = Vec::new();

        for cluster in clusters {
            let cluster_id = cluster.id.as_ref()
                .and_then(|thing| thing.id.to_string().split(':').nth(1).map(|s| s.to_string()))
                .unwrap_or_default();

            let cluster_placements: Vec<_> = placements.iter()
                .filter(|p| p.cluster_id.id.to_string().contains(&cluster_id))
                .collect();

            let total_cpu: i32 = cluster_placements.iter().map(|p| p.allocated_cpu).sum();
            let total_memory: i32 = cluster_placements.iter().map(|p| p.allocated_memory_mb).sum();
            let total_storage: f64 = cluster_placements.iter().map(|p| p.allocated_storage_gb).sum();
            let vm_count = cluster_placements.len();

            result.push((cluster, total_cpu, total_memory, total_storage, vm_count));
        }

        Ok(result)
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
