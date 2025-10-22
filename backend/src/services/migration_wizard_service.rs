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

    // =========================================================================
    // NETWORK CONFIGURATION METHODS
    // =========================================================================

    /// Create a network mapping
    pub async fn create_network_mapping(
        &self,
        project_id: &str,
        request: crate::models::migration_wizard_models::CreateNetworkMappingRequest,
    ) -> Result<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> {
        use crate::models::migration_wizard_models::MigrationWizardNetworkMapping;
        
        // Build project Thing reference
        let project_thing = surrealdb::sql::Thing {
            tb: "migration_wizard_project".to_string(),
            id: surrealdb::sql::Id::String(project_id.to_string()),
        };

        // Validate the mapping
        let (is_valid, validation_errors) = self.validate_single_mapping(&request).await;

        let mapping = MigrationWizardNetworkMapping {
            id: None,
            project_id: project_thing,
            source_vlan_name: request.source_vlan_name,
            source_vlan_id: request.source_vlan_id,
            source_subnet: request.source_subnet,
            destination_vlan_name: request.destination_vlan_name,
            destination_vlan_id: request.destination_vlan_id,
            destination_subnet: request.destination_subnet,
            destination_gateway: request.destination_gateway,
            destination_dns: request.destination_dns,
            is_valid,
            validation_errors: if validation_errors.is_empty() {
                None
            } else {
                Some(validation_errors)
            },
            created_at: Utc::now(),
        };

        let created: Vec<MigrationWizardNetworkMapping> = self
            .db
            .create("migration_wizard_network_mapping")
            .content(mapping)
            .await
            .context("Failed to create network mapping")?;

        created
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No network mapping returned after creation"))
    }

    /// Get all network mappings for a project
    pub async fn get_project_network_mappings(
        &self,
        project_id: &str,
    ) -> Result<Vec<crate::models::migration_wizard_models::MigrationWizardNetworkMapping>> {
        let query = format!(
            "SELECT * FROM migration_wizard_network_mapping WHERE project_id = migration_wizard_project:{} ORDER BY created_at ASC",
            project_id
        );

        let mappings: Vec<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> = self
            .db
            .query(&query)
            .await
            .context("Failed to query network mappings")?
            .take(0)
            .context("Failed to parse network mappings")?;

        Ok(mappings)
    }

    /// Update a network mapping
    pub async fn update_network_mapping(
        &self,
        mapping_id: &str,
        updates: serde_json::Value,
    ) -> Result<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> {
        // First get the existing mapping to ensure it exists
        let query = format!(
            "SELECT * FROM migration_wizard_network_mapping WHERE id = migration_wizard_network_mapping:{}",
            mapping_id
        );

        let mut existing: Vec<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> = self
            .db
            .query(&query)
            .await
            .context("Failed to query existing network mapping")?
            .take(0)
            .context("Failed to parse existing network mapping")?;

        let mapping = existing
            .pop()
            .ok_or_else(|| anyhow::anyhow!("Network mapping not found"))?;

        // Now update with merge
        let mapping_thing = surrealdb::sql::Thing {
            tb: "migration_wizard_network_mapping".to_string(),
            id: surrealdb::sql::Id::String(mapping_id.to_string()),
        };

        let updated: Option<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> = self
            .db
            .update(mapping_thing)
            .merge(updates)
            .await
            .context("Failed to update network mapping")?;

        updated.ok_or_else(|| anyhow::anyhow!("Network mapping update failed"))
    }

    /// Delete a network mapping
    pub async fn delete_network_mapping(&self, mapping_id: &str) -> Result<()> {
        let mapping_thing = surrealdb::sql::Thing {
            tb: "migration_wizard_network_mapping".to_string(),
            id: surrealdb::sql::Id::String(mapping_id.to_string()),
        };

        let _deleted: Option<crate::models::migration_wizard_models::MigrationWizardNetworkMapping> = self
            .db
            .delete(mapping_thing)
            .await
            .context("Failed to delete network mapping")?;

        Ok(())
    }

    /// Validate all network mappings for a project
    pub async fn validate_network_mappings(
        &self,
        project_id: &str,
    ) -> Result<crate::models::migration_wizard_models::NetworkValidationResult> {
        use crate::models::migration_wizard_models::{NetworkValidationResult, NetworkValidationError, NetworkErrorType};
        
        let mappings = self.get_project_network_mappings(project_id).await?;
        
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        let mut valid_count = 0;

        // Check for duplicate source VLANs
        let mut seen_vlans = std::collections::HashMap::new();
        for mapping in &mappings {
            if let Some(vlan_id) = mapping.source_vlan_id {
                if let Some(first_id) = seen_vlans.get(&vlan_id) {
                    let mapping_id = mapping.id.as_ref()
                        .and_then(|t| match &t.id {
                            surrealdb::sql::Id::String(s) => Some(s.clone()),
                            surrealdb::sql::Id::Number(n) => Some(n.to_string()),
                            _ => None
                        })
                        .unwrap_or_else(|| "unknown".to_string());
                    
                    errors.push(NetworkValidationError {
                        mapping_id: mapping_id.clone(),
                        error_type: NetworkErrorType::VlanConflict,
                        message: format!("VLAN {} is mapped multiple times", vlan_id),
                        affected_field: "source_vlan_id".to_string(),
                    });
                } else {
                    seen_vlans.insert(vlan_id, mapping.source_vlan_name.clone());
                }
            }
        }

        // Check for subnet overlaps
        for (i, mapping1) in mappings.iter().enumerate() {
            if let Some(ref subnet1) = mapping1.destination_subnet {
                for mapping2 in mappings.iter().skip(i + 1) {
                    if let Some(ref subnet2) = mapping2.destination_subnet {
                        if self.subnets_overlap(subnet1, subnet2) {
                            let mapping_id = mapping1.id.as_ref()
                                .and_then(|t| match &t.id {
                                    surrealdb::sql::Id::String(s) => Some(s.clone()),
                                    surrealdb::sql::Id::Number(n) => Some(n.to_string()),
                                    _ => None
                                })
                                .unwrap_or_else(|| "unknown".to_string());
                            
                            errors.push(NetworkValidationError {
                                mapping_id,
                                error_type: NetworkErrorType::SubnetOverlap,
                                message: format!("Subnet overlap detected: {} and {}", subnet1, subnet2),
                                affected_field: "destination_subnet".to_string(),
                            });
                        }
                    }
                }
            }
        }

        // Check individual mapping validity
        for mapping in &mappings {
            if mapping.is_valid {
                valid_count += 1;
            } else {
                if let Some(ref errs) = mapping.validation_errors {
                    warnings.extend(errs.iter().map(|e| format!("{}: {}", mapping.source_vlan_name, e)));
                }
            }
        }

        let total = mappings.len();
        let invalid_count = total - valid_count;

        Ok(NetworkValidationResult {
            is_valid: errors.is_empty(),
            total_mappings: total,
            valid_mappings: valid_count,
            invalid_mappings: invalid_count,
            errors,
            warnings,
        })
    }

    /// Validate a single network mapping (internal helper)
    async fn validate_single_mapping(
        &self,
        request: &crate::models::migration_wizard_models::CreateNetworkMappingRequest,
    ) -> (bool, Vec<String>) {
        let mut errors = Vec::new();

        // Validate source subnet if provided
        if let Some(ref subnet) = request.source_subnet {
            if !self.is_valid_cidr(subnet) {
                errors.push(format!("Invalid source subnet CIDR notation: {}", subnet));
            }
        }

        // Validate destination subnet if provided
        if let Some(ref subnet) = request.destination_subnet {
            if !self.is_valid_cidr(subnet) {
                errors.push(format!("Invalid destination subnet CIDR notation: {}", subnet));
            }
        }

        // Validate destination gateway if provided
        if let Some(ref gateway) = request.destination_gateway {
            if !self.is_valid_ip(gateway) {
                errors.push(format!("Invalid destination gateway IP: {}", gateway));
            }
        }

        // Validate DNS servers if provided
        if let Some(ref dns_servers) = request.destination_dns {
            for dns in dns_servers {
                if !self.is_valid_ip(dns) {
                    errors.push(format!("Invalid DNS server IP: {}", dns));
                }
            }
        }

        (errors.is_empty(), errors)
    }

    /// Check if two subnets overlap
    fn subnets_overlap(&self, subnet1: &str, subnet2: &str) -> bool {
        // Simple overlap check (for production, use ipnetwork crate)
        // This is a simplified version
        if let (Some(net1), Some(net2)) = (self.parse_cidr(subnet1), self.parse_cidr(subnet2)) {
            // Check if network addresses match (simplified check)
            net1.0 == net2.0 && net1.1 == net2.1
        } else {
            false
        }
    }

    /// Parse CIDR notation (simplified)
    fn parse_cidr(&self, cidr: &str) -> Option<(String, u8)> {
        let parts: Vec<&str> = cidr.split('/').collect();
        if parts.len() == 2 {
            if let Ok(prefix) = parts[1].parse::<u8>() {
                return Some((parts[0].to_string(), prefix));
            }
        }
        None
    }

    /// Validate CIDR notation
    fn is_valid_cidr(&self, cidr: &str) -> bool {
        self.parse_cidr(cidr).is_some()
    }

    /// Validate IP address (simplified)
    fn is_valid_ip(&self, ip: &str) -> bool {
        ip.split('.').count() == 4 && ip.split('.').all(|part| {
            part.parse::<u8>().is_ok()
        })
    }

    /// Get network topology for visualization
    pub async fn get_network_topology(
        &self,
        project_id: &str,
    ) -> Result<crate::models::migration_wizard_models::NetworkTopology> {
        use crate::models::migration_wizard_models::{NetworkTopology, NetworkStatistics, NetworkVendor};
        
        // For now, return a basic topology structure
        // In production, this would parse RVTools vSwitch, vNic, vPort, vHost tabs
        
        Ok(NetworkTopology {
            project_id: project_id.to_string(),
            vendor: NetworkVendor::Vmware, // Default, should detect from RVTools
            vswitches: Vec::new(),
            port_groups: Vec::new(),
            physical_nics: Vec::new(),
            vmkernel_ports: Vec::new(),
            vm_adapters: Vec::new(),
            nutanix_bonds: None,
            nutanix_bridges: None,
            nutanix_flow_networks: None,
            nutanix_ipam_pools: None,
            statistics: NetworkStatistics {
                total_vswitches: 0,
                total_port_groups: 0,
                total_vlans: 0,
                total_physical_nics: 0,
                total_vmkernel_ports: 0,
                total_vm_adapters: 0,
                total_unique_ips: 0,
                total_nutanix_bonds: None,
                total_nutanix_bridges: None,
                total_nutanix_flow_networks: None,
                total_nutanix_ipam_pools: None,
            },
            generated_at: Utc::now(),
        })
    }

    /// Generate network visualization data for visx
    pub async fn generate_network_visualization(
        &self,
        project_id: &str,
    ) -> Result<crate::models::migration_wizard_models::NetworkVisualizationData> {
        use crate::models::migration_wizard_models::{
            NetworkVisualizationData, NetworkNode, NetworkLink, VisualizationMetadata,
            NodeType, NetworkNodeData, NodePosition, LinkType
        };
        
        let topology = self.get_network_topology(project_id).await?;
        
        let mut nodes = Vec::new();
        let mut links = Vec::new();

        // Convert topology to visualization nodes/links
        // This is a placeholder - real implementation would build from topology data
        
        let metadata = VisualizationMetadata {
            source_vendor: "VMware".to_string(),
            dest_vendor: Some("Hyper-V".to_string()),
            total_vlans: topology.statistics.total_vlans,
            total_ips: topology.statistics.total_unique_ips,
            total_nodes: nodes.len() as i32,
            total_links: links.len() as i32,
        };

        Ok(NetworkVisualizationData {
            nodes,
            links,
            metadata,
        })
    }

    /// Generate Mermaid diagram code
    /// Enhanced to generate simple diagrams from VLAN mappings when topology data is unavailable
    pub async fn generate_mermaid_diagram(
        &self,
        project_id: &str,
    ) -> Result<String> {
        let topology = self.get_network_topology(project_id).await?;
        
        // Check if topology has actual data
        let has_topology_data = !topology.vswitches.is_empty() 
            || !topology.port_groups.is_empty() 
            || !topology.physical_nics.is_empty();
        
        if has_topology_data {
            // Generate full topology diagram
            let mut mermaid = String::from("graph TB\n");
            mermaid.push_str("    %% Network Topology Diagram\n");
            mermaid.push_str("    %% Generated from RVTools data\n\n");

            // Add vSwitches
            for vswitch in &topology.vswitches {
                mermaid.push_str(&format!(
                    "    {}[\"{}\"]\n",
                    Self::sanitize_mermaid_id(&vswitch.name),
                    vswitch.name
                ));
            }

            // Add port groups
            for pg in &topology.port_groups {
                mermaid.push_str(&format!(
                    "    {}[\"VLAN {}: {}<br/>{:?}\"]\n",
                    Self::sanitize_mermaid_id(&pg.name),
                    pg.vlan_id,
                    pg.name,
                    pg.purpose
                ));
            }

            // Add physical NICs
            for nic in &topology.physical_nics {
                mermaid.push_str(&format!(
                    "    {}[\"{}
<br/>{}Mbps\"]\n",
                    Self::sanitize_mermaid_id(&nic.name),
                    nic.name,
                    nic.speed_mbps
                ));
            }

            // Add connections (links)
            // This would connect physical NICs → vSwitches → Port Groups → VMs
            
            mermaid.push_str("\n    %% Style definitions\n");
            mermaid.push_str("    classDef vswitchStyle fill:#e1f5ff,stroke:#01579b,stroke-width:2px\n");
            mermaid.push_str("    classDef portGroupStyle fill:#fff9c4,stroke:#f57f17,stroke-width:2px\n");
            mermaid.push_str("    classDef nicStyle fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px\n");

            Ok(mermaid)
        } else {
            // Fallback: Generate simple diagram from VLAN mappings
            tracing::info!("No topology data available, generating diagram from VLAN mappings");
            
            let mappings = self.get_project_network_mappings(project_id).await?;
            
            if mappings.is_empty() {
                // Return empty placeholder
                return Ok(String::from("graph LR\n    A[\"No Network Data\"] --> B[\"Add VLAN mappings<br/>or upload RVTools\"]"));
            }
            
            // Generate simple VLAN mapping diagram
            let mut mermaid = String::from("graph TB\n");
            mermaid.push_str("    %% Network Mapping Diagram\n");
            mermaid.push_str("    %% Generated from VLAN mappings\n\n");
            
            // Source subgraph
            mermaid.push_str("    subgraph Source[\"Source VMware Networks\"]\n");
            for (idx, mapping) in mappings.iter().enumerate() {
                let source_id = format!("SRC{}", idx);
                let source_label = if let Some(subnet) = &mapping.source_subnet {
                    format!("VLAN {}<br/>{}", mapping.source_vlan, subnet)
                } else {
                    format!("VLAN {}", mapping.source_vlan)
                };
                mermaid.push_str(&format!("        {}[\"{}\"]\n", source_id, source_label));
            }
            mermaid.push_str("    end\n\n");
            
            // Destination subgraph
            mermaid.push_str("    subgraph Dest[\"Destination Hyper-V Networks\"]\n");
            for (idx, mapping) in mappings.iter().enumerate() {
                let dest_id = format!("DST{}", idx);
                let dest_label = if let Some(subnet) = &mapping.dest_subnet {
                    format!("VLAN {}<br/>{}<br/>({})", 
                        mapping.dest_vlan, 
                        subnet,
                        mapping.dest_ip_strategy.as_deref().unwrap_or("DHCP")
                    )
                } else {
                    format!("VLAN {}", mapping.dest_vlan)
                };
                mermaid.push_str(&format!("        {}[\"{}\"]\n", dest_id, dest_label));
            }
            mermaid.push_str("    end\n\n");
            
            // Add mapping connections
            for idx in 0..mappings.len() {
                mermaid.push_str(&format!("    SRC{} -.->|\"Migration\"| DST{}\n", idx, idx));
            }
            
            // Style definitions
            mermaid.push_str("\n    style Source fill:#3b82f620,stroke:#3b82f6,stroke-width:2px\n");
            mermaid.push_str("    style Dest fill:#8b5cf620,stroke:#8b5cf6,stroke-width:2px\n");
            
            Ok(mermaid)
        }
    }
    
    // =========================================================================
    // ICON/STENCIL MAPPING SERVICE
    // =========================================================================
    
    /// Resolve icon URL for network component
    pub fn resolve_icon_url(&self, vendor: &NetworkVendor, node_type: &NodeType) -> String {
        match (vendor, node_type) {
            // VMware vSphere icons
            (NetworkVendor::Vmware, NodeType::VSwitch) => "/icons/vmware/vswitch-standard.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::PortGroup) => "/icons/vmware/port-group.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::PhysicalNic) => "/icons/vmware/pnic.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::VmKernelPort) => "/icons/vmware/vmkernel.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::VmNic) => "/icons/vmware/vnic.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::Host) => "/icons/vmware/esxi-host.svg".to_string(),
            (NetworkVendor::Vmware, NodeType::Vm) => "/icons/vmware/vm.svg".to_string(),
            
            // Hyper-V icons
            (NetworkVendor::HyperV, NodeType::VSwitch) => "/icons/hyperv/vswitch-external.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::PortGroup) => "/icons/hyperv/vlan.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::PhysicalNic) => "/icons/hyperv/pnic.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::VmKernelPort) => "/icons/hyperv/management-vnic.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::VmNic) => "/icons/hyperv/vm-vnic.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::Host) => "/icons/hyperv/hyperv-host.svg".to_string(),
            (NetworkVendor::HyperV, NodeType::Vm) => "/icons/hyperv/vm.svg".to_string(),
            
            // Nutanix AHV icons
            (NetworkVendor::Nutanix, NodeType::VSwitch) => "/icons/nutanix/ovs-bridge.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixBond) => "/icons/nutanix/bond.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixOvsBridge) => "/icons/nutanix/ovs-bridge.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::PortGroup) => "/icons/nutanix/virtual-network.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixFlowNetwork) => "/icons/nutanix/flow.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixIpamPool) => "/icons/nutanix/ipam.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::PhysicalNic) => "/icons/nutanix/pnic.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::VmNic) => "/icons/nutanix/vm-vnic.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::Host) => "/icons/nutanix/ahv-host.svg".to_string(),
            (NetworkVendor::Nutanix, NodeType::Vm) => "/icons/nutanix/vm.svg".to_string(),
            
            // Generic fallback icons
            _ => "/icons/generic/network-component.svg".to_string(),
        }
    }
    
    /// Get stencil reference name for documentation
    pub fn get_stencil_reference(&self, vendor: &NetworkVendor, node_type: &NodeType) -> String {
        match (vendor, node_type) {
            // VMware stencils
            (NetworkVendor::Vmware, NodeType::VSwitch) => "VMware Official - vSphere Standard Switch".to_string(),
            (NetworkVendor::Vmware, NodeType::PortGroup) => "VMware Official - Port Group".to_string(),
            (NetworkVendor::Vmware, NodeType::PhysicalNic) => "VMware Official - Physical NIC".to_string(),
            (NetworkVendor::Vmware, NodeType::VmKernelPort) => "VMware Official - VMkernel Adapter".to_string(),
            (NetworkVendor::Vmware, NodeType::VmNic) => "VMware Official - Virtual NIC".to_string(),
            (NetworkVendor::Vmware, NodeType::Host) => "VMware Official - ESXi Host".to_string(),
            (NetworkVendor::Vmware, NodeType::Vm) => "VMware Official - Virtual Machine".to_string(),
            
            // Hyper-V stencils
            (NetworkVendor::HyperV, NodeType::VSwitch) => "Microsoft - Hyper-V Virtual Switch".to_string(),
            (NetworkVendor::HyperV, NodeType::PortGroup) => "Microsoft - VLAN".to_string(),
            (NetworkVendor::HyperV, NodeType::PhysicalNic) => "Microsoft - Network Adapter".to_string(),
            (NetworkVendor::HyperV, NodeType::VmKernelPort) => "Microsoft - Management vNIC".to_string(),
            (NetworkVendor::HyperV, NodeType::VmNic) => "Microsoft - VM Network Adapter".to_string(),
            (NetworkVendor::HyperV, NodeType::Host) => "Microsoft - Hyper-V Host".to_string(),
            (NetworkVendor::HyperV, NodeType::Vm) => "Microsoft - Virtual Machine".to_string(),
            
            // Nutanix stencils
            (NetworkVendor::Nutanix, NodeType::VSwitch) => "Nutanix Official - OVS Bridge".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixBond) => "Nutanix Official - Network Bond".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixOvsBridge) => "Nutanix Official - OVS Bridge".to_string(),
            (NetworkVendor::Nutanix, NodeType::PortGroup) => "Nutanix Official - Virtual Network".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixFlowNetwork) => "Nutanix Official - Flow Networking".to_string(),
            (NetworkVendor::Nutanix, NodeType::NutanixIpamPool) => "Nutanix Official - IPAM".to_string(),
            (NetworkVendor::Nutanix, NodeType::PhysicalNic) => "Nutanix Official - Physical NIC".to_string(),
            (NetworkVendor::Nutanix, NodeType::VmNic) => "Nutanix Official - VM vNIC".to_string(),
            (NetworkVendor::Nutanix, NodeType::Host) => "Nutanix Official - AHV Host".to_string(),
            (NetworkVendor::Nutanix, NodeType::Vm) => "Nutanix Official - Virtual Machine".to_string(),
            
            // Generic
            _ => "Generic - Network Component".to_string(),
        }
    }
    
    /// Get icon category for organization
    pub fn get_icon_category(&self, node_type: &NodeType) -> String {
        match node_type {
            NodeType::VSwitch | NodeType::NutanixOvsBridge => "network/virtual-switch".to_string(),
            NodeType::NutanixBond => "network/bond".to_string(),
            NodeType::PortGroup | NodeType::NutanixFlowNetwork => "network/virtual-network".to_string(),
            NodeType::NutanixIpamPool => "network/ipam".to_string(),
            NodeType::PhysicalNic => "network/physical-nic".to_string(),
            NodeType::VmKernelPort => "network/vmkernel".to_string(),
            NodeType::VmNic => "network/vm-nic".to_string(),
            NodeType::Host => "infrastructure/host".to_string(),
            NodeType::Vm => "infrastructure/vm".to_string(),
        }
    }
    
    /// Get all icon mappings for documentation
    pub fn get_all_icon_mappings(&self) -> Vec<IconMapping> {
        let mut mappings = Vec::new();
        
        // VMware mappings
        let vmware_types = vec![
            NodeType::VSwitch,
            NodeType::PortGroup,
            NodeType::PhysicalNic,
            NodeType::VmKernelPort,
            NodeType::VmNic,
            NodeType::Host,
            NodeType::Vm,
        ];
        
        for node_type in vmware_types {
            mappings.push(IconMapping {
                vendor: NetworkVendor::Vmware,
                node_type: node_type.clone(),
                icon_url: self.resolve_icon_url(&NetworkVendor::Vmware, &node_type),
                stencil_reference: self.get_stencil_reference(&NetworkVendor::Vmware, &node_type),
                icon_category: self.get_icon_category(&node_type),
                description: Self::get_node_type_description(&NetworkVendor::Vmware, &node_type),
            });
        }
        
        // Hyper-V mappings
        let hyperv_types = vec![
            NodeType::VSwitch,
            NodeType::PortGroup,
            NodeType::PhysicalNic,
            NodeType::VmKernelPort,
            NodeType::VmNic,
            NodeType::Host,
            NodeType::Vm,
        ];
        
        for node_type in hyperv_types {
            mappings.push(IconMapping {
                vendor: NetworkVendor::HyperV,
                node_type: node_type.clone(),
                icon_url: self.resolve_icon_url(&NetworkVendor::HyperV, &node_type),
                stencil_reference: self.get_stencil_reference(&NetworkVendor::HyperV, &node_type),
                icon_category: self.get_icon_category(&node_type),
                description: Self::get_node_type_description(&NetworkVendor::HyperV, &node_type),
            });
        }
        
        // Nutanix mappings (comprehensive)
        let nutanix_types = vec![
            NodeType::VSwitch,
            NodeType::NutanixBond,
            NodeType::NutanixOvsBridge,
            NodeType::PortGroup,
            NodeType::NutanixFlowNetwork,
            NodeType::NutanixIpamPool,
            NodeType::PhysicalNic,
            NodeType::VmNic,
            NodeType::Host,
            NodeType::Vm,
        ];
        
        for node_type in nutanix_types {
            mappings.push(IconMapping {
                vendor: NetworkVendor::Nutanix,
                node_type: node_type.clone(),
                icon_url: self.resolve_icon_url(&NetworkVendor::Nutanix, &node_type),
                stencil_reference: self.get_stencil_reference(&NetworkVendor::Nutanix, &node_type),
                icon_category: self.get_icon_category(&node_type),
                description: Self::get_node_type_description(&NetworkVendor::Nutanix, &node_type),
            });
        }
        
        mappings
    }

    /// Sanitize string for Mermaid ID usage
    fn sanitize_mermaid_id(s: &str) -> String {
        s.replace(" ", "_")
            .replace("-", "_")
            .replace(".", "_")
            .replace("/", "_")
            .chars()
            .filter(|c| c.is_alphanumeric() || *c == '_')
            .collect()
    }

    /// Get description for node type (used in icon mappings)
    pub fn get_node_type_description(vendor: &NetworkVendor, node_type: &NodeType) -> String {
        match (vendor, node_type) {
        // VMware descriptions
        (NetworkVendor::Vmware, NodeType::VSwitch) => "VMware vSphere Standard or Distributed Switch for network virtualization".to_string(),
        (NetworkVendor::Vmware, NodeType::PortGroup) => "VMware Port Group - Virtual network segment on vSwitch".to_string(),
        (NetworkVendor::Vmware, NodeType::PhysicalNic) => "VMware Physical NIC (vmnic) - Physical network adapter in ESXi host".to_string(),
        (NetworkVendor::Vmware, NodeType::VmKernelPort) => "VMware VMkernel Port - ESXi host interface for management and services".to_string(),
        (NetworkVendor::Vmware, NodeType::VmNic) => "VMware Virtual NIC - VM network adapter (vmxnet3, E1000, etc.)".to_string(),
        (NetworkVendor::Vmware, NodeType::Host) => "VMware ESXi Host - Hypervisor server".to_string(),
        (NetworkVendor::Vmware, NodeType::Vm) => "VMware Virtual Machine".to_string(),
        
        // Hyper-V descriptions
        (NetworkVendor::HyperV, NodeType::VSwitch) => "Hyper-V Virtual Switch - External, Internal, or Private switch".to_string(),
        (NetworkVendor::HyperV, NodeType::PortGroup) => "Hyper-V VLAN Configuration on Virtual Switch".to_string(),
        (NetworkVendor::HyperV, NodeType::PhysicalNic) => "Hyper-V Physical Network Adapter bound to virtual switch".to_string(),
        (NetworkVendor::HyperV, NodeType::VmKernelPort) => "Hyper-V Management vNIC - Host virtual adapter for management".to_string(),
        (NetworkVendor::HyperV, NodeType::VmNic) => "Hyper-V VM Network Adapter - Synthetic or Legacy adapter".to_string(),
        (NetworkVendor::HyperV, NodeType::Host) => "Hyper-V Host Server - Microsoft hypervisor".to_string(),
        (NetworkVendor::HyperV, NodeType::Vm) => "Hyper-V Virtual Machine".to_string(),
        
        // Nutanix descriptions
        (NetworkVendor::Nutanix, NodeType::VSwitch) => "Nutanix Open vSwitch (OVS) - Software-based virtual switch".to_string(),
        (NetworkVendor::Nutanix, NodeType::NutanixBond) => "Nutanix Network Bond - Aggregated physical NICs for redundancy and bandwidth (bond0, bond1)".to_string(),
        (NetworkVendor::Nutanix, NodeType::NutanixOvsBridge) => "Nutanix OVS Bridge - Software bridge in Open vSwitch architecture (br0, br1, br0-int)".to_string(),
        (NetworkVendor::Nutanix, NodeType::PortGroup) => "Nutanix Virtual Network - Logical network segment with VLAN configuration".to_string(),
        (NetworkVendor::Nutanix, NodeType::NutanixFlowNetwork) => "Nutanix Flow Virtual Network - Advanced networking with microsegmentation and security policies".to_string(),
        (NetworkVendor::Nutanix, NodeType::NutanixIpamPool) => "Nutanix IPAM Pool - Centralized IP address management for VMs".to_string(),
        (NetworkVendor::Nutanix, NodeType::PhysicalNic) => "Nutanix Physical NIC (eth) - Physical network interface on AHV host".to_string(),
        (NetworkVendor::Nutanix, NodeType::VmNic) => "Nutanix VM vNIC - Virtual network adapter (Virtio, E1000) for VM".to_string(),
        (NetworkVendor::Nutanix, NodeType::Host) => "Nutanix AHV Host - Acropolis Hypervisor node".to_string(),
        (NetworkVendor::Nutanix, NodeType::Vm) => "Nutanix Virtual Machine on AHV".to_string(),
        
        // Generic fallback
        _ => "Network component".to_string(),
    }
}

    // =========================================================================
    // HLD DOCUMENT GENERATION
    // =========================================================================
    
    /// Generate High-Level Design document for migration project
    pub async fn generate_hld_document(
        &self,
        project_id: &str,
        include_network_topology: bool,
        include_vm_placements: bool,
    ) -> Result<String> {
        use crate::models::migration_wizard_models::MigrationWizardProject;
        
        // Fetch project
        let project_thing = Thing::from(("migration_wizard_project", project_id));
        let projects: Vec<MigrationWizardProject> = self
            .db
            .select("migration_wizard_project")
            .await
            .context("Failed to query project")?;
        
        let project = projects.into_iter()
            .find(|p| p.id.as_ref().map(|id| format!("{:?}", id)).unwrap_or_default().contains(project_id))
            .context("Project not found")?;
        
        // Build HLD document in Markdown format
        let mut hld = String::new();
        
        // Title page
        hld.push_str("# High-Level Design Document\n\n");
        hld.push_str(&format!("## {}\n\n", project.name));
        hld.push_str(&format!("**Status:** {:?}\n\n", project.status));
        hld.push_str(&format!("**Created:** {}\n\n", project.created_at.format("%Y-%m-%d")));
        if let Some(desc) = &project.description {
            hld.push_str(&format!("**Description:** {}\n\n", desc));
        }
        hld.push_str("---\n\n");
        
        // Table of Contents
        hld.push_str("## Table of Contents\n\n");
        hld.push_str("1. Executive Summary\n");
        hld.push_str("2. Current State Analysis\n");
        hld.push_str("3. Target Architecture\n");
        if include_vm_placements {
            hld.push_str("4. VM Placement Strategy\n");
        }
        if include_network_topology {
            hld.push_str("5. Network Design\n");
        }
        hld.push_str("6. Migration Approach\n");
        hld.push_str("7. Risks and Mitigation\n\n");
        hld.push_str("---\n\n");
        
        // Executive Summary
        hld.push_str("## 1. Executive Summary\n\n");
        hld.push_str(&format!("This document outlines the high-level design for migrating **{}** virtual machines ", project.total_vms));
        hld.push_str(&format!("across **{}** destination clusters.\n\n", project.total_clusters));
        
        if let Some(filename) = &project.rvtools_filename {
            hld.push_str(&format!("**Source Data:** {}\n\n", filename));
        }
        
        hld.push_str("### Project Scope\n\n");
        hld.push_str(&format!("- **Total VMs:** {}\n", project.total_vms));
        hld.push_str(&format!("- **Destination Clusters:** {}\n", project.total_clusters));
        hld.push_str(&format!("- **Project Status:** {:?}\n\n", project.status));
        
        // Current State Analysis
        hld.push_str("---\n\n");
        hld.push_str("## 2. Current State Analysis\n\n");
        
        if project.total_vms > 0 {
            // Fetch VMs
            let vms = self.get_project_vms(project_id, None).await?;
            
            hld.push_str("### Virtual Machine Inventory\n\n");
            hld.push_str(&format!("Total VMs discovered: **{}**\n\n", vms.len()));
            
            // Calculate totals
            let total_cpu: i32 = vms.iter().map(|vm| vm.cpus).sum();
            let total_memory_gb: f64 = vms.iter().map(|vm| vm.memory_mb as f64 / 1024.0).sum();
            let total_storage_gb: f64 = vms.iter().map(|vm| vm.provisioned_mb.unwrap_or(0) as f64 / 1024.0).sum();
            
            hld.push_str("#### Resource Summary\n\n");
            hld.push_str(&format!("- **Total vCPUs:** {} cores\n", total_cpu));
            hld.push_str(&format!("- **Total Memory:** {:.2} GB\n", total_memory_gb));
            hld.push_str(&format!("- **Total Storage:** {:.2} GB\n\n", total_storage_gb));
            
            // Power state breakdown
            let powered_on = vms.iter().filter(|vm| vm.powerstate.as_deref() == Some("poweredOn")).count();
            let powered_off = vms.iter().filter(|vm| vm.powerstate.as_deref() == Some("poweredOff")).count();
            
            hld.push_str("#### Power State Distribution\n\n");
            hld.push_str(&format!("- **Powered On:** {}\n", powered_on));
            hld.push_str(&format!("- **Powered Off:** {}\n\n", powered_off));
        }
        
        // Target Architecture
        hld.push_str("---\n\n");
        hld.push_str("## 3. Target Architecture\n\n");
        
        if project.total_clusters > 0 {
            // Fetch clusters
            let clusters = self.get_project_clusters(project_id).await?;
            
            hld.push_str("### Destination Clusters\n\n");
            
            for (idx, cluster) in clusters.iter().enumerate() {
                hld.push_str(&format!("#### Cluster {}: {}\n\n", idx + 1, cluster.name));
                
                if let Some(desc) = &cluster.description {
                    hld.push_str(&format!("**Description:** {}\n\n", desc));
                }
                
                hld.push_str(&format!("**Strategy:** {}\n\n", cluster.strategy));
                
                hld.push_str("**Resources:**\n\n");
                hld.push_str(&format!("- CPU: {} GHz, {} cores\n", cluster.cpu_ghz, cluster.total_cores));
                hld.push_str(&format!("- Memory: {} GB\n", cluster.memory_gb));
                hld.push_str(&format!("- Storage: {} TB\n\n", cluster.storage_tb));
                
                hld.push_str("**Oversubscription Ratios:**\n\n");
                hld.push_str(&format!("- CPU: {}:1\n", cluster.cpu_oversubscription_ratio));
                hld.push_str(&format!("- Memory: {}:1\n\n", cluster.memory_oversubscription_ratio));
            }
        }
        
        // VM Placement Strategy
        if include_vm_placements {
            hld.push_str("---\n\n");
            hld.push_str("## 4. VM Placement Strategy\n\n");
            
            let placements = self.get_project_placements(project_id).await?;
            
            if !placements.is_empty() {
                hld.push_str(&format!("Total VM placements: **{}**\n\n", placements.len()));
                
                // Group by cluster
                let mut cluster_placements: std::collections::HashMap<String, Vec<_>> = std::collections::HashMap::new();
                for placement in &placements {
                    let cluster_id = format!("{:?}", placement.cluster_id);
                    cluster_placements.entry(cluster_id).or_default().push(placement);
                }
                
                hld.push_str("### Placements by Cluster\n\n");
                for (cluster_id, cluster_vms) in cluster_placements {
                    hld.push_str(&format!("**Cluster {}:** {} VMs\n", cluster_id, cluster_vms.len()));
                }
                hld.push_str("\n");
            } else {
                hld.push_str("*No VM placements defined yet.*\n\n");
            }
        }
        
        // Network Design
        if include_network_topology {
            hld.push_str("---\n\n");
            hld.push_str("## 5. Network Design\n\n");
            
            // Network mappings
            let mappings = self.get_project_network_mappings(project_id).await?;
            
            if !mappings.is_empty() {
                hld.push_str("### Network Mappings\n\n");
                hld.push_str("| Source VLAN | Source Subnet | Destination VLAN | Destination Subnet | Gateway | Status |\n");
                hld.push_str("|-------------|---------------|------------------|--------------------|---------|--------|\n");
                
                for mapping in &mappings {
                    let source_subnet = mapping.source_subnet.as_deref().unwrap_or("N/A");
                    let dest_subnet = mapping.destination_subnet.as_deref().unwrap_or("N/A");
                    let gateway = mapping.destination_gateway.as_deref().unwrap_or("N/A");
                    let status = if mapping.is_valid { "✅ Valid" } else { "❌ Invalid" };
                    
                    hld.push_str(&format!(
                        "| {} | {} | {} | {} | {} | {} |\n",
                        mapping.source_vlan_name,
                        source_subnet,
                        mapping.destination_vlan_name,
                        dest_subnet,
                        gateway,
                        status
                    ));
                }
                hld.push_str("\n");
                
                // Network topology visualization
                hld.push_str("### Network Topology\n\n");
                let mermaid_diagram = self.generate_mermaid_diagram(project_id).await?;
                hld.push_str("```mermaid\n");
                hld.push_str(&mermaid_diagram);
                hld.push_str("\n```\n\n");
            } else {
                hld.push_str("*No network mappings defined yet.*\n\n");
            }
        }
        
        // Migration Approach
        hld.push_str("---\n\n");
        hld.push_str("## 6. Migration Approach\n\n");
        hld.push_str("### Migration Phases\n\n");
        hld.push_str("1. **Pre-Migration Assessment**\n");
        hld.push_str("   - Validate source VM configurations\n");
        hld.push_str("   - Verify destination cluster capacity\n");
        hld.push_str("   - Test network connectivity\n\n");
        hld.push_str("2. **Pilot Migration**\n");
        hld.push_str("   - Select 5-10 non-critical VMs\n");
        hld.push_str("   - Perform test migrations\n");
        hld.push_str("   - Validate functionality\n\n");
        hld.push_str("3. **Phased Production Migration**\n");
        hld.push_str("   - Migrate in scheduled waves\n");
        hld.push_str("   - Monitor performance\n");
        hld.push_str("   - Rollback plan ready\n\n");
        hld.push_str("4. **Post-Migration Validation**\n");
        hld.push_str("   - Application testing\n");
        hld.push_str("   - Performance benchmarking\n");
        hld.push_str("   - Documentation updates\n\n");
        
        // Risks and Mitigation
        hld.push_str("---\n\n");
        hld.push_str("## 7. Risks and Mitigation\n\n");
        hld.push_str("| Risk | Impact | Likelihood | Mitigation Strategy |\n");
        hld.push_str("|------|--------|------------|---------------------|\n");
        hld.push_str("| Network connectivity issues | High | Medium | Pre-migration network testing and validation |\n");
        hld.push_str("| Capacity constraints | High | Low | Oversubscription ratios and capacity monitoring |\n");
        hld.push_str("| Application compatibility | Medium | Medium | Pilot migration and thorough testing |\n");
        hld.push_str("| Data loss during migration | High | Low | Backup verification and rollback procedures |\n");
        hld.push_str("| Extended downtime | Medium | Medium | Migration windows and phased approach |\n\n");
        
        // Footer
        hld.push_str("---\n\n");
        hld.push_str(&format!("*Document generated: {}*\n", Utc::now().format("%Y-%m-%d %H:%M:%S UTC")));
        
        Ok(hld)
    }
}
