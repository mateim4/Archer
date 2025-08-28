use crate::database::Database;
use crate::models::project_models::*;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use serde_json::json;
use std::collections::HashMap;
use surrealdb::sql::Thing;

pub struct RvToolsService {
    db: Database,
}

impl RvToolsService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // =============================================================================
    // RVTOOLS DATA PROCESSING
    // =============================================================================

    pub async fn process_rvtools_upload(&self, upload_data: RvToolsUploadData) -> Result<RvToolsProcessingResult> {
        // Create upload record
        let upload = RvToolsUpload {
            id: None,
            project_id: upload_data.project_id.clone().unwrap_or_else(|| Thing::from(("project", "default"))),
            workflow_id: None,
            file_name: upload_data.filename.clone(),
            file_path: format!("/tmp/{}", upload_data.filename), // Simplified path
            file_size_bytes: upload_data.csv_content.len() as i64,
            file_hash: format!("{:x}", md5::compute(&upload_data.csv_content)),
            upload_status: RvToolsStatus::Processing,
            processing_results: None,
            total_vms: None,
            total_hosts: None,
            total_clusters: None,
            vcenter_version: None,
            environment_name: None,
            metadata: HashMap::new(),
            uploaded_at: Utc::now(),
            processed_at: None,
            uploaded_by: "system".to_string(),
        };

        let created_upload: Vec<RvToolsUpload> = self.db
            .create("rvtools_upload")
            .content(&upload)
            .await
            .context("Failed to create RVTools upload record")?;

        let upload_id = created_upload[0].id.as_ref().unwrap().clone();

        // Process the CSV data
        match self.parse_and_store_rvtools_data(&upload_data, &upload_id).await {
            Ok(result) => {
                // Update upload record as completed
                let _: Option<RvToolsUpload> = self.db
                    .update(&upload_id)
                    .merge(json!({
                        "upload_status": "processed",
                        "total_vms": result.servers_processed,
                        "processed_at": Utc::now(),
                        "processing_results": json!({
                            "servers_processed": result.servers_processed,
                            "servers_added_to_pool": result.servers_added_to_pool,
                            "errors": result.processing_errors.len()
                        })
                    }))
                    .await?;

                Ok(result)
            }
            Err(e) => {
                // Update upload record with error
                let _: Option<RvToolsUpload> = self.db
                    .update(&upload_id)
                    .merge(json!({
                        "upload_status": "failed",
                        "processed_at": Utc::now(),
                        "processing_results": json!({
                            "error": e.to_string()
                        })
                    }))
                    .await?;

                Err(e)
            }
        }
    }

    async fn parse_and_store_rvtools_data(&self, upload_data: &RvToolsUploadData, upload_id: &surrealdb::sql::Thing) -> Result<RvToolsProcessingResult> {
        let mut servers_processed = 0;
        let mut servers_added_to_pool = 0;
        let mut processing_errors = Vec::new();

        // Parse CSV data (simplified - in real implementation, use proper CSV parser)
        let lines: Vec<&str> = upload_data.csv_content.lines().collect();
        
        if lines.is_empty() {
            return Err(anyhow::anyhow!("Empty RVTools CSV file"));
        }

        // Skip header row, process data rows
        for (line_num, line) in lines.iter().skip(1).enumerate() {
            match self.process_rvtools_line(line, upload_id, line_num + 2).await {
                Ok(added_to_pool) => {
                    servers_processed += 1;
                    if added_to_pool {
                        servers_added_to_pool += 1;
                    }
                }
                Err(e) => {
                    processing_errors.push(RvToolsProcessingError {
                        line_number: line_num + 2,
                        server_name: self.extract_server_name(line).unwrap_or_else(|| format!("Line {}", line_num + 2)),
                        error: e.to_string(),
                    });
                }
            }
        }

        Ok(RvToolsProcessingResult {
            upload_id: upload_id.clone(),
            servers_processed,
            servers_added_to_pool,
            processing_errors,
            summary: RvToolsProcessingSummary {
                total_cpu_cores: self.calculate_total_cpu_cores(upload_id).await?,
                total_memory_gb: self.calculate_total_memory_gb(upload_id).await?,
                unique_vendors: self.get_unique_vendors(upload_id).await?,
                deployment_recommendations: self.generate_deployment_recommendations(upload_id).await?,
            },
        })
    }

    async fn process_rvtools_line(&self, line: &str, upload_id: &surrealdb::sql::Thing, line_number: usize) -> Result<bool> {
        // Parse RVTools CSV line (simplified parsing)
        let fields: Vec<&str> = line.split(',').collect();
        
        if fields.len() < 10 {
            return Err(anyhow::anyhow!("Insufficient fields in RVTools data"));
        }

        // Extract server information from RVTools format
        let server_info = RvToolsServerInfo {
            vm_name: fields.get(0).unwrap_or(&"").trim_matches('"').to_string(),
            host_name: fields.get(1).unwrap_or(&"").trim_matches('"').to_string(),
            cpu_cores: fields.get(2).unwrap_or(&"0").parse().unwrap_or(0),
            memory_gb: fields.get(3).unwrap_or(&"0").parse::<f64>().unwrap_or(0.0) / 1024.0, // Convert MB to GB
            disk_gb: fields.get(4).unwrap_or(&"0").parse::<f64>().unwrap_or(0.0) / 1024.0, // Convert MB to GB
            operating_system: fields.get(5).unwrap_or(&"").trim_matches('"').to_string(),
            power_state: fields.get(6).unwrap_or(&"").trim_matches('"').to_string(),
            cluster: fields.get(7).unwrap_or(&"").trim_matches('"').to_string(),
            datacenter: fields.get(8).unwrap_or(&"").trim_matches('"').to_string(),
            network_adapters: fields.get(9).unwrap_or(&"1").parse().unwrap_or(1),
        };

        // Store raw RVTools data
        let rvtools_data = RvToolsData {
            id: None,
            upload_id: upload_id.id.to_string(),
            line_number,
            vm_name: server_info.vm_name.clone(),
            host_name: server_info.host_name.clone(),
            cpu_cores: server_info.cpu_cores,
            memory_gb: server_info.memory_gb as i32,
            disk_gb: server_info.disk_gb as i32,
            operating_system: Some(server_info.operating_system.clone()),
            power_state: Some(server_info.power_state.clone()),
            cluster: Some(server_info.cluster.clone()),
            datacenter: Some(server_info.datacenter.clone()),
            network_adapters: Some(server_info.network_adapters),
            processed_to_pool: false,
            metadata: HashMap::new(),
            created_at: Utc::now(),
        };

        let _: Vec<RvToolsData> = self.db
            .create("rvtools_data")
            .content(rvtools_data)
            .await?;

        // Determine if this should be added to hardware pool
        let should_add_to_pool = self.should_add_to_hardware_pool(&server_info).await;

        if should_add_to_pool {
            self.create_hardware_pool_entry(&server_info, &upload_id.id.to_string()).await?;
            return Ok(true);
        }

        Ok(false)
    }

    async fn should_add_to_hardware_pool(&self, server_info: &RvToolsServerInfo) -> bool {
        // Business logic to determine if a server should be added to hardware pool
        // For example, only add powered-off servers with sufficient resources
        
        server_info.power_state.to_lowercase() == "poweredoff" &&
        server_info.cpu_cores >= 4 &&
        server_info.memory_gb >= 8.0 &&
        !server_info.vm_name.is_empty()
    }

    async fn create_hardware_pool_entry(&self, server_info: &RvToolsServerInfo, upload_id: &str) -> Result<()> {
        let hardware_pool_entry = HardwarePool {
            id: None,
            asset_tag: format!("RV-{}", server_info.vm_name),
            serial_number: None,
            hardware_lot_id: None,
            vendor: "VMware".to_string(), // Detected from RVTools
            model: server_info.host_name.clone(),
            form_factor: Some("Virtual".to_string()),
            
            cpu_sockets: Some(1), // Default for VMs
            cpu_cores_total: Some(server_info.cpu_cores),
            memory_gb: Some(server_info.memory_gb as i32),
            storage_type: Some("Virtual Disk".to_string()),
            storage_capacity_gb: Some(server_info.disk_gb as i32),
            network_ports: Some(server_info.network_adapters),
            power_consumption_watts: None,
            rack_units: 0, // Virtual servers don't take rack space
            
            availability_status: AvailabilityStatus::Available,
            location: Some(server_info.cluster.clone()),
            datacenter: Some(server_info.datacenter.clone()),
            rack_position: None,
            available_from_date: Utc::now(),
            available_until_date: None,
            maintenance_schedule: Vec::new(),
            
            acquisition_cost: None,
            monthly_cost: None,
            warranty_expires: None,
            support_level: Some("Standard".to_string()),
            
            metadata: {
                let mut map = HashMap::new();
                map.insert("source".to_string(), json!("rvtools"));
                map.insert("upload_id".to_string(), json!(upload_id));
                map.insert("original_vm_name".to_string(), json!(server_info.vm_name));
                map.insert("original_host".to_string(), json!(server_info.host_name));
                map.insert("operating_system".to_string(), json!(server_info.operating_system));
                map
            },
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let _: Vec<HardwarePool> = self.db
            .create("hardware_pool")
            .content(hardware_pool_entry)
            .await?;

        Ok(())
    }

    fn extract_server_name(&self, line: &str) -> Option<String> {
        let fields: Vec<&str> = line.split(',').collect();
        fields.get(0).map(|s| s.trim_matches('"').to_string())
    }

    // =============================================================================
    // ANALYTICS AND REPORTING
    // =============================================================================

    async fn calculate_total_cpu_cores(&self, upload_id: &surrealdb::sql::Thing) -> Result<i32> {
        let result: Vec<serde_json::Value> = self.db
            .query("SELECT SUM(cpu_cores) as total FROM rvtools_data WHERE upload_id = $upload_id")
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        Ok(result.first()
            .and_then(|v| v.get("total"))
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as i32)
    }

    async fn calculate_total_memory_gb(&self, upload_id: &surrealdb::sql::Thing) -> Result<i32> {
        let result: Vec<serde_json::Value> = self.db
            .query("SELECT SUM(memory_gb) as total FROM rvtools_data WHERE upload_id = $upload_id")
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        Ok(result.first()
            .and_then(|v| v.get("total"))
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as i32)
    }

    async fn get_unique_vendors(&self, upload_id: &surrealdb::sql::Thing) -> Result<Vec<String>> {
        let result: Vec<serde_json::Value> = self.db
            .query("SELECT array::distinct(cluster) as vendors FROM rvtools_data WHERE upload_id = $upload_id GROUP ALL")
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        Ok(result.first()
            .and_then(|v| v.get("vendors"))
            .and_then(|v| v.as_array())
            .map(|arr| arr.iter()
                .filter_map(|v| v.as_str())
                .map(|s| s.to_string())
                .collect())
            .unwrap_or_default())
    }

    async fn generate_deployment_recommendations(&self, upload_id: &surrealdb::sql::Thing) -> Result<Vec<String>> {
        let mut recommendations = Vec::new();

        // Get server statistics
        let stats: Vec<serde_json::Value> = self.db
            .query("SELECT 
                COUNT() as total_servers,
                AVG(cpu_cores) as avg_cpu_cores,
                AVG(memory_gb) as avg_memory_gb,
                SUM(case when power_state = 'poweredOff' then 1 else 0 end) as powered_off_servers
                FROM rvtools_data WHERE upload_id = $upload_id")
            .bind(("upload_id", upload_id))
            .await?
            .take(0)?;

        if let Some(stats) = stats.first() {
            let total = stats.get("total_servers").and_then(|v| v.as_u64()).unwrap_or(0);
            let powered_off = stats.get("powered_off_servers").and_then(|v| v.as_u64()).unwrap_or(0);
            let avg_cpu = stats.get("avg_cpu_cores").and_then(|v| v.as_f64()).unwrap_or(0.0);
            let avg_memory = stats.get("avg_memory_gb").and_then(|v| v.as_f64()).unwrap_or(0.0);

            if powered_off > 0 {
                recommendations.push(format!(
                    "Consider decommissioning {} powered-off servers to reduce costs", 
                    powered_off
                ));
            }

            if avg_cpu < 2.0 {
                recommendations.push("Many VMs are under-utilizing CPU resources. Consider consolidation.".to_string());
            }

            if avg_memory < 4.0 {
                recommendations.push("VMs have low memory allocation. Review memory requirements.".to_string());
            }

            if total > 100 {
                recommendations.push("Large VM environment detected. Consider implementing automated lifecycle management.".to_string());
            }
        }

        if recommendations.is_empty() {
            recommendations.push("Environment appears well-optimized. Continue monitoring.".to_string());
        }

        Ok(recommendations)
    }

    // =============================================================================
    // HARDWARE POOL INTEGRATION
    // =============================================================================

    pub async fn sync_rvtools_to_hardware_pool(&self, upload_id: String, sync_options: RvToolsSyncOptions) -> Result<RvToolsSyncResult> {
        let upload_thing = surrealdb::sql::Thing::from(("rvtools_upload", upload_id.as_str()));

        // Get all RVTools data for this upload
        let rvtools_data: Vec<RvToolsData> = self.db
            .query("SELECT * FROM rvtools_data WHERE upload_id = $upload_id AND processed_to_pool = false")
            .bind(("upload_id", &upload_thing))
            .await?
            .take(0)?;

        let mut synced_servers = Vec::new();
        let mut sync_errors = Vec::new();

        for data in rvtools_data {
            // Check if server meets sync criteria
            if self.meets_sync_criteria(&data, &sync_options) {
                match self.sync_server_to_pool(&data).await {
                    Ok(server_id) => {
                        synced_servers.push(server_id);
                        
                        // Mark as processed
                        let _: Option<RvToolsData> = self.db
                            .update(&data.id.unwrap())
                            .merge(json!({
                                "processed_to_pool": true
                            }))
                            .await?;
                    }
                    Err(e) => {
                        sync_errors.push(RvToolsSyncError {
                            vm_name: data.vm_name.clone(),
                            error: e.to_string(),
                        });
                    }
                }
            }
        }

        Ok(RvToolsSyncResult {
            upload_id: upload_thing,
            servers_synced: synced_servers.len(),
            synced_server_ids: synced_servers,
            sync_errors,
            sync_timestamp: Utc::now(),
        })
    }

    fn meets_sync_criteria(&self, data: &RvToolsData, options: &RvToolsSyncOptions) -> bool {
        if let Some(min_cpu) = options.min_cpu_cores {
            if data.cpu_cores < min_cpu {
                return false;
            }
        }

        if let Some(min_memory) = options.min_memory_gb {
            if data.memory_gb < min_memory {
                return false;
            }
        }

        if options.powered_off_only {
            if let Some(power_state) = &data.power_state {
                if power_state.to_lowercase() != "poweredoff" {
                    return false;
                }
            } else {
                return false; // No power state information
            }
        }

        true
    }

    async fn sync_server_to_pool(&self, data: &RvToolsData) -> Result<surrealdb::sql::Thing> {
        // Check if already exists in hardware pool
        let existing: Vec<HardwarePool> = self.db
            .query("SELECT * FROM hardware_pool WHERE metadata.original_vm_name = $vm_name")
            .bind(("vm_name", &data.vm_name))
            .await?
            .take(0)?;

        if !existing.is_empty() {
            return Err(anyhow::anyhow!("Server already exists in hardware pool"));
        }

        // Create new hardware pool entry
        let server_info = RvToolsServerInfo {
            vm_name: data.vm_name.clone(),
            host_name: data.host_name.clone(),
            cpu_cores: data.cpu_cores,
            memory_gb: data.memory_gb as f64,
            disk_gb: data.disk_gb as f64,
            operating_system: data.operating_system.clone().unwrap_or_default(),
            power_state: data.power_state.clone().unwrap_or_default(),
            cluster: data.cluster.clone().unwrap_or_default(),
            datacenter: data.datacenter.clone().unwrap_or_default(),
            network_adapters: data.network_adapters.unwrap_or(1),
        };

        self.create_hardware_pool_entry(&server_info, &data.upload_id).await?;

        // Get the created server ID (simplified - in real implementation, return the actual ID)
        Ok(surrealdb::sql::Thing::from(("hardware_pool", format!("rv-{}", data.vm_name).as_str())))
    }

    pub async fn get_rvtools_analytics(&self, project_id: Option<String>) -> Result<RvToolsAnalytics> {
        let mut conditions = Vec::new();
        
        if let Some(project_id) = project_id {
            conditions.push(format!("project_id = project:{}", project_id));
        }

        let condition_str = if conditions.is_empty() {
            "".to_string()
        } else {
            format!("WHERE {}", conditions.join(" AND "))
        };

        // Get upload statistics
        let upload_stats: Vec<serde_json::Value> = self.db
            .query(format!("SELECT 
                COUNT() as total_uploads,
                SUM(total_servers) as total_servers_processed,
                AVG(total_servers) as avg_servers_per_upload
                FROM rvtools_upload {}", condition_str))
            .await?
            .take(0)?;

        // Get processing trends
        let processing_trends: Vec<serde_json::Value> = self.db
            .query(format!("SELECT 
                time::group(upload_timestamp, '1d') as date,
                COUNT() as uploads,
                SUM(total_servers) as servers_processed
                FROM rvtools_upload {} 
                WHERE upload_timestamp >= (time::now() - 30d)
                GROUP BY date
                ORDER BY date", condition_str))
            .await?
            .take(0)?;

        // Get resource distribution
        let resource_stats: Vec<serde_json::Value> = self.db
            .query(format!("SELECT 
                SUM(cpu_cores) as total_cpu_cores,
                SUM(memory_gb) as total_memory_gb,
                SUM(disk_gb) as total_storage_gb,
                COUNT() as total_vms,
                array::group(datacenter) as datacenters
                FROM rvtools_data 
                JOIN rvtools_upload ON rvtools_data.upload_id = rvtools_upload.id {}", 
                &condition_str))
            .await?
            .take(0)?;

        Ok(RvToolsAnalytics {
            upload_statistics: upload_stats.into_iter().next().unwrap_or_default(),
            processing_trends,
            resource_distribution: resource_stats.into_iter().next().unwrap_or_default(),
            recommendations: self.generate_analytics_recommendations().await?,
        })
    }

    async fn generate_analytics_recommendations(&self) -> Result<Vec<String>> {
        let mut recommendations = Vec::new();

        // Check for recent uploads
        let recent_uploads: Vec<serde_json::Value> = self.db
            .query("SELECT COUNT() as count FROM rvtools_upload WHERE upload_timestamp >= (time::now() - 7d)")
            .await?
            .take(0)?;

        let recent_count = recent_uploads.first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        if recent_count == 0 {
            recommendations.push("No recent RVTools uploads detected. Consider scheduling regular uploads for better visibility.".to_string());
        }

        if recent_count > 10 {
            recommendations.push("High frequency of RVTools uploads detected. Consider automating the process.".to_string());
        }

        recommendations.push("Regular RVTools analysis helps maintain optimal resource allocation.".to_string());

        Ok(recommendations)
    }
}

// Supporting types for RVTools service
#[derive(Debug, serde::Deserialize)]
pub struct RvToolsUploadData {
    pub filename: String,
    pub csv_content: String,
    pub project_id: Option<surrealdb::sql::Thing>,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsProcessingResult {
    pub upload_id: surrealdb::sql::Thing,
    pub servers_processed: usize,
    pub servers_added_to_pool: usize,
    pub processing_errors: Vec<RvToolsProcessingError>,
    pub summary: RvToolsProcessingSummary,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsProcessingError {
    pub line_number: usize,
    pub server_name: String,
    pub error: String,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsProcessingSummary {
    pub total_cpu_cores: i32,
    pub total_memory_gb: i32,
    pub unique_vendors: Vec<String>,
    pub deployment_recommendations: Vec<String>,
}

struct RvToolsServerInfo {
    vm_name: String,
    host_name: String,
    cpu_cores: i32,
    memory_gb: f64,
    disk_gb: f64,
    operating_system: String,
    power_state: String,
    cluster: String,
    datacenter: String,
    network_adapters: i32,
}

#[derive(Debug, serde::Deserialize)]
pub struct RvToolsSyncOptions {
    pub min_cpu_cores: Option<i32>,
    pub min_memory_gb: Option<i32>,
    pub powered_off_only: bool,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsSyncResult {
    pub upload_id: surrealdb::sql::Thing,
    pub servers_synced: usize,
    pub synced_server_ids: Vec<surrealdb::sql::Thing>,
    pub sync_errors: Vec<RvToolsSyncError>,
    pub sync_timestamp: DateTime<Utc>,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsSyncError {
    pub vm_name: String,
    pub error: String,
}

#[derive(Debug, serde::Serialize)]
pub struct RvToolsAnalytics {
    pub upload_statistics: serde_json::Value,
    pub processing_trends: Vec<serde_json::Value>,
    pub resource_distribution: serde_json::Value,
    pub recommendations: Vec<String>,
}
