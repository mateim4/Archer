use crate::database::Database;
use crate::models::project_models::*;
use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use surrealdb::sql::Thing;
use std::collections::HashMap;
use serde_json::{json, Value};

pub struct HardwarePoolService {
    db: Database,
}

impl HardwarePoolService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // =============================================================================
    // HARDWARE INVENTORY MANAGEMENT
    // =============================================================================

    pub async fn add_server_to_pool(&self, server: CreateHardwarePoolRequest) -> Result<HardwarePool> {
        let hardware = HardwarePool {
            id: None,
            asset_tag: server.asset_tag,
            serial_number: server.serial_number,
            hardware_lot_id: server.hardware_lot_id,
            vendor: server.vendor,
            model: server.model,
            form_factor: server.form_factor,
            cpu_sockets: server.cpu_sockets,
            cpu_cores_total: server.cpu_cores_total,
            memory_gb: server.memory_gb,
            storage_type: server.storage_type,
            storage_capacity_gb: server.storage_capacity_gb,
            network_ports: server.network_ports,
            power_consumption_watts: server.power_consumption_watts,
            rack_units: server.rack_units.unwrap_or(1),
            
            availability_status: AvailabilityStatus::Available,
            location: server.location,
            datacenter: server.datacenter,
            rack_position: server.rack_position,
            available_from_date: Utc::now(),
            available_until_date: server.available_until_date,
            maintenance_schedule: Vec::new(),
            
            acquisition_cost: server.acquisition_cost,
            monthly_cost: server.monthly_cost,
            warranty_expires: server.warranty_expires,
            support_level: server.support_level,
            
            metadata: HashMap::new(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
        };

        let created: Vec<HardwarePool> = self.db
            .create("hardware_pool")
            .content(hardware)
            .await
            .context("Failed to add server to pool")?;

        created.into_iter().next()
            .ok_or_else(|| anyhow::anyhow!("No server returned from database"))
    }

    pub async fn update_server_specifications(&self, server_id: &str, updates: UpdateHardwareRequest) -> Result<HardwarePool> {
        let mut update_fields = HashMap::new();

        if let Some(cpu_cores) = updates.cpu_cores_total {
            update_fields.insert("cpu_cores_total", json!(cpu_cores));
        }
        if let Some(memory_gb) = updates.memory_gb {
            update_fields.insert("memory_gb", json!(memory_gb));
        }
        if let Some(storage_capacity) = updates.storage_capacity_gb {
            update_fields.insert("storage_capacity_gb", json!(storage_capacity));
        }
        if let Some(location) = updates.location {
            update_fields.insert("location", json!(location));
        }
        if let Some(rack_position) = updates.rack_position {
            update_fields.insert("rack_position", json!(rack_position));
        }

        update_fields.insert("updated_at", json!(Utc::now()));

        let updated: Option<HardwarePool> = self.db
            .update(("hardware_pool", server_id))
            .merge(update_fields)
            .await
            .context("Failed to update server specifications")?;

        updated.ok_or_else(|| anyhow::anyhow!("Server not found"))
    }

    pub async fn get_server_availability(&self, server_id: &str, start_date: DateTime<Utc>, end_date: DateTime<Utc>) -> Result<AvailabilityInfo> {
        // Check if server exists and get its details
        let server: Option<HardwarePool> = self.db
            .select(("hardware_pool", server_id))
            .await?;

        let server = server.ok_or_else(|| anyhow::anyhow!("Server not found"))?;

        // Check for existing allocations in the requested time period
        let conflicting_allocations: Vec<HardwareAllocation> = self.db
            .query("SELECT * FROM hardware_allocation 
                   WHERE server_id = $server_id 
                   AND allocation_start < $end_date 
                   AND (allocation_end IS NONE OR allocation_end > $start_date)")
            .bind(("server_id", Thing::from(("hardware_pool", server_id))))
            .bind(("start_date", start_date))
            .bind(("end_date", end_date))
            .await?
            .take(0)?;

        // Check maintenance windows
        let maintenance_conflicts: Vec<MaintenanceWindow> = server.maintenance_schedule
            .into_iter()
            .filter(|m| m.start_time < end_date && m.end_time > start_date)
            .collect();

        let is_available = conflicting_allocations.is_empty() && 
                          maintenance_conflicts.is_empty() && 
                          server.availability_status == AvailabilityStatus::Available;

        Ok(AvailabilityInfo {
            server_id: server.id.unwrap(),
            is_available,
            current_status: server.availability_status,
            conflicting_allocations,
            maintenance_conflicts,
            available_from: server.available_from_date,
            available_until: server.available_until_date,
        })
    }

    pub async fn schedule_maintenance(&self, server_id: &str, maintenance: MaintenanceWindow) -> Result<()> {
        // Get current server
        let server: Option<HardwarePool> = self.db
            .select(("hardware_pool", server_id))
            .await?;

        let mut server = server.ok_or_else(|| anyhow::anyhow!("Server not found"))?;

        // Add maintenance window to schedule
        server.maintenance_schedule.push(maintenance);

        // Update server in database
        let _: Option<HardwarePool> = self.db
            .update(("hardware_pool", server_id))
            .merge(json!({
                "maintenance_schedule": server.maintenance_schedule,
                "updated_at": Utc::now()
            }))
            .await?;

        Ok(())
    }

    // =============================================================================
    // INTELLIGENT HARDWARE ALLOCATION
    // =============================================================================

    pub async fn find_optimal_servers(&self, requirements: HardwareRequirements) -> Result<Vec<ServerRecommendation>> {
        let mut query = "SELECT * FROM hardware_pool WHERE availability_status = 'available'".to_string();
        let mut conditions = Vec::new();

        // Add requirement filters
        if let Some(min_cores) = requirements.min_cpu_cores {
            conditions.push(format!("cpu_cores_total >= {}", min_cores));
        }
        if let Some(min_memory) = requirements.min_memory_gb {
            conditions.push(format!("memory_gb >= {}", min_memory));
        }
        if let Some(ref datacenter) = requirements.preferred_datacenter {
            conditions.push(format!("datacenter = '{}'", datacenter));
        }
        if let Some(ref form_factor) = requirements.form_factor {
            conditions.push(format!("form_factor = '{}'", form_factor));
        }

        if !conditions.is_empty() {
            query.push_str(&format!(" AND {}", conditions.join(" AND ")));
        }

        let servers: Vec<HardwarePool> = self.db
            .query(query)
            .await?
            .take(0)?;

        let mut recommendations = Vec::new();

        for server in servers {
            let score = self.calculate_suitability_score(&server, &requirements).await;
            
            recommendations.push(ServerRecommendation {
                server_id: server.id.clone().unwrap(),
                asset_tag: server.asset_tag.clone(),
                vendor: server.vendor.clone(),
                model: server.model.clone(),
                specifications: ServerSpecifications {
                    cpu_cores: server.cpu_cores_total.unwrap_or(0),
                    memory_gb: server.memory_gb.unwrap_or(0),
                    storage_gb: server.storage_capacity_gb.unwrap_or(0),
                    network_ports: server.network_ports.unwrap_or(0),
                },
                suitability_score: score,
                estimated_monthly_cost: server.monthly_cost,
                location: server.location.clone(),
                datacenter: server.datacenter.clone(),
                available_from: server.available_from_date,
                available_until: server.available_until_date,
            });
        }

        // Sort by suitability score (highest first)
        recommendations.sort_by(|a, b| b.suitability_score.partial_cmp(&a.suitability_score).unwrap());

        // Return top recommendations
        Ok(recommendations.into_iter().take(requirements.max_results.unwrap_or(10)).collect())
    }

    async fn calculate_suitability_score(&self, server: &HardwarePool, requirements: &HardwareRequirements) -> f64 {
        let mut score = 0.0;

        // Base score for meeting requirements
        if let (Some(min_cores), Some(server_cores)) = (requirements.min_cpu_cores, server.cpu_cores_total) {
            if server_cores >= min_cores {
                score += 20.0;
                // Bonus for having exactly what's needed (not over-provisioned)
                if server_cores <= min_cores + 4 {
                    score += 10.0;
                }
            }
        }

        if let (Some(min_memory), Some(server_memory)) = (requirements.min_memory_gb, server.memory_gb) {
            if server_memory >= min_memory {
                score += 20.0;
                // Bonus for efficient memory allocation
                if server_memory <= min_memory + 32 {
                    score += 10.0;
                }
            }
        }

        // Datacenter preference bonus
        if let (Some(ref preferred_dc), Some(server_dc)) = (&requirements.preferred_datacenter, &server.datacenter) {
            if preferred_dc == server_dc {
                score += 15.0;
            }
        }

        // Cost efficiency bonus
        if let Some(monthly_cost) = server.monthly_cost {
            // Lower cost is better (inverse relationship)
            score += (1000.0 - monthly_cost.min(1000.0)) / 50.0;
        }

        // Age and condition factors
        if server.warranty_expires.is_some() {
            score += 5.0; // Has warranty
        }

        score
    }

    pub async fn create_allocation_with_approval(&self, request: AllocationRequest, requested_by: String) -> Result<AllocationResult> {
        // Check if servers are available
        let mut allocation_conflicts = Vec::new();
        
        for server_id in &request.server_ids {
            let availability = self.get_server_availability(
                server_id,
                request.allocation_start,
                request.allocation_end.unwrap_or_else(|| Utc::now() + chrono::Duration::days(30))
            ).await?;

            if !availability.is_available {
                allocation_conflicts.push(AllocationConflict {
                    server_id: server_id.clone(),
                    conflicts: availability.conflicting_allocations,
                    maintenance_windows: availability.maintenance_conflicts,
                });
            }
        }

        if !allocation_conflicts.is_empty() {
            return Ok(AllocationResult::Conflicts(allocation_conflicts));
        }

        // Check if approval is required (high-value servers or long duration)
        let requires_approval = self.allocation_requires_approval(&request).await?;

        if requires_approval && request.approved_by.is_none() {
            // Create pending allocation request
            let pending_request = PendingAllocation {
                id: None,
                project_id: Thing::from(("project", request.project_id.as_str())),
                server_ids: request.server_ids.iter().map(|id| Thing::from(("hardware_pool", id.as_str()))).collect(),
                allocation_start: request.allocation_start,
                allocation_end: request.allocation_end,
                purpose: request.purpose,
                justification: request.justification,
                requested_by,
                requested_at: Utc::now(),
                status: "pending_approval".to_string(),
            };

            let created: Vec<PendingAllocation> = self.db
                .create("pending_allocation")
                .content(pending_request)
                .await?;

            return Ok(AllocationResult::PendingApproval(created.into_iter().next().unwrap()));
        }

        // Proceed with immediate allocation
        let mut allocations = Vec::new();

        for server_id in request.server_ids {
            let allocation = HardwareAllocation {
                id: None,
                project_id: Thing::from(("project", request.project_id.as_str())),
                workflow_id: request.workflow_id.as_ref().map(|id| Thing::from(("project_workflow", id.as_str()))),
                server_id: Thing::from(("hardware_pool", server_id.as_str())),
                allocation_type: AllocationType::Allocated,
                allocation_start: request.allocation_start,
                allocation_end: request.allocation_end,
                purpose: request.purpose.clone(),
                configuration_notes: request.configuration_notes.clone(),
                allocated_by: requested_by.clone(),
                approved_by: request.approved_by.clone(),
                metadata: HashMap::new(),
                created_at: Utc::now(),
            };

            let created: Vec<HardwareAllocation> = self.db
                .create("hardware_allocation")
                .content(allocation)
                .await?;

            if let Some(allocation) = created.into_iter().next() {
                // Update server status
                let _: Option<HardwarePool> = self.db
                    .update(("hardware_pool", &server_id))
                    .merge(json!({
                        "availability_status": "allocated",
                        "updated_at": Utc::now()
                    }))
                    .await?;

                allocations.push(allocation);
            }
        }

        Ok(AllocationResult::Success(allocations))
    }

    async fn allocation_requires_approval(&self, request: &AllocationRequest) -> Result<bool> {
        // Check if any server has high value or if duration is long
        for server_id in &request.server_ids {
            let server: Option<HardwarePool> = self.db
                .select(("hardware_pool", server_id.as_str()))
                .await?;

            if let Some(server) = server {
                // Require approval for expensive servers
                if let Some(cost) = server.acquisition_cost {
                    if cost > 50000.0 { // $50k threshold
                        return Ok(true);
                    }
                }
                
                // Require approval for monthly cost over $5k
                if let Some(monthly_cost) = server.monthly_cost {
                    if monthly_cost > 5000.0 {
                        return Ok(true);
                    }
                }
            }
        }

        // Require approval for allocations longer than 6 months
        if let Some(end_date) = request.allocation_end {
            let duration = end_date.signed_duration_since(request.allocation_start);
            if duration.num_days() > 180 {
                return Ok(true);
            }
        }

        Ok(false)
    }

    // =============================================================================
    // PROCUREMENT PIPELINE INTEGRATION
    // =============================================================================

    pub async fn track_procurement_to_pool(&self, procurement_id: &str) -> Result<ProcurementStatus> {
        let procurement: Option<ProcurementPipeline> = self.db
            .select(("procurement_pipeline", procurement_id))
            .await?;

        let procurement = procurement.ok_or_else(|| anyhow::anyhow!("Procurement record not found"))?;

        match procurement.procurement_status {
            ProcurementStatus::Available => {
                // Move servers from procurement to hardware pool
                self.move_to_hardware_pool(procurement_id).await?;
            },
            _ => {
                // Still in procurement pipeline
            }
        }

        Ok(procurement.procurement_status)
    }

    async fn move_to_hardware_pool(&self, procurement_id: &str) -> Result<Vec<HardwarePool>> {
        let procurement: Option<ProcurementPipeline> = self.db
            .select(("procurement_pipeline", procurement_id))
            .await?;

        let procurement = procurement.ok_or_else(|| anyhow::anyhow!("Procurement record not found"))?;

        // Get hardware lot details
        let hardware_lot: Option<serde_json::Value> = self.db
            .select(&procurement.hardware_lot_id)
            .await?;

        let hardware_lot = hardware_lot.ok_or_else(|| anyhow::anyhow!("Hardware lot not found"))?;

        let mut servers = Vec::new();

        // Create individual servers in the pool
        for i in 0..procurement.quantity {
            let server = HardwarePool {
                id: None,
                asset_tag: format!("{}-{:03}", hardware_lot.get("lot_code").and_then(|v| v.as_str()).unwrap_or("SRV"), i + 1),
                serial_number: None, // Will be updated when physically received
                hardware_lot_id: Some(procurement.hardware_lot_id.clone()),
                vendor: procurement.vendor.clone(),
                model: hardware_lot.get("lot_description").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
                form_factor: hardware_lot.get("form_factor").and_then(|v| v.as_str()).map(|s| s.to_string()),
                
                // Default specs - will be updated from hardware lot data
                cpu_sockets: None,
                cpu_cores_total: None,
                memory_gb: None,
                storage_type: None,
                storage_capacity_gb: None,
                network_ports: None,
                power_consumption_watts: None,
                rack_units: 1,
                
                availability_status: AvailabilityStatus::Available,
                location: procurement.delivery_location.clone(),
                datacenter: None,
                rack_position: None,
                available_from_date: procurement.actual_delivery.unwrap_or_else(|| Utc::now()),
                available_until_date: None,
                maintenance_schedule: Vec::new(),
                
                acquisition_cost: procurement.total_cost.map(|c| c / procurement.quantity as f64),
                monthly_cost: None,
                warranty_expires: None,
                support_level: None,
                
                metadata: {
                    let mut map = HashMap::new();
                    map.insert("procurement_id".to_string(), json!(procurement_id));
                    map.insert("procurement_order".to_string(), json!(procurement.order_number));
                    map
                },
                created_at: Utc::now(),
                updated_at: Utc::now(),
            };

            let created: Vec<HardwarePool> = self.db
                .create("hardware_pool")
                .content(server)
                .await?;

            if let Some(server) = created.into_iter().next() {
                servers.push(server);
            }
        }

        // Update procurement status to completed
        let _: Option<ProcurementPipeline> = self.db
            .update(("procurement_pipeline", procurement_id))
            .merge(json!({
                "procurement_status": "completed",
                "updated_at": Utc::now()
            }))
            .await?;

        Ok(servers)
    }

    // =============================================================================
    // ANALYTICS AND REPORTING
    // =============================================================================

    pub async fn get_pool_analytics(&self) -> Result<HardwarePoolAnalytics> {
        // Get overall pool statistics
        let pool_stats: Vec<serde_json::Value> = self.db
            .query("SELECT 
                availability_status, 
                COUNT() as count,
                AVG(monthly_cost) as avg_monthly_cost,
                SUM(monthly_cost) as total_monthly_cost
                FROM hardware_pool 
                GROUP BY availability_status")
            .await?
            .take(0)?;

        // Get utilization by vendor
        let vendor_stats: Vec<serde_json::Value> = self.db
            .query("SELECT 
                vendor,
                COUNT() as total_servers,
                (SELECT COUNT() FROM hardware_pool WHERE vendor = $parent.vendor AND availability_status = 'allocated') as allocated_servers
                FROM hardware_pool
                GROUP BY vendor")
            .await?
            .take(0)?;

        // Get capacity utilization
        let capacity_stats: Vec<serde_json::Value> = self.db
            .query("SELECT 
                SUM(cpu_cores_total) as total_cpu_cores,
                SUM(memory_gb) as total_memory_gb,
                SUM(storage_capacity_gb) as total_storage_gb,
                (SELECT SUM(cpu_cores_total) FROM hardware_pool WHERE availability_status = 'allocated') as allocated_cpu_cores,
                (SELECT SUM(memory_gb) FROM hardware_pool WHERE availability_status = 'allocated') as allocated_memory_gb,
                (SELECT SUM(storage_capacity_gb) FROM hardware_pool WHERE availability_status = 'allocated') as allocated_storage_gb
                FROM hardware_pool")
            .await?
            .take(0)?;

        Ok(HardwarePoolAnalytics {
            pool_status_breakdown: pool_stats,
            vendor_utilization: vendor_stats,
            capacity_utilization: capacity_stats.into_iter().next().unwrap_or_default(),
            cost_analysis: self.calculate_cost_analysis().await?,
            forecast: self.generate_capacity_forecast().await?,
        })
    }

    async fn calculate_cost_analysis(&self) -> Result<CostAnalysis> {
        let cost_data: Vec<serde_json::Value> = self.db
            .query("SELECT 
                SUM(acquisition_cost) as total_acquisition_cost,
                SUM(monthly_cost) as total_monthly_cost,
                AVG(monthly_cost) as avg_monthly_cost_per_server,
                (SELECT SUM(monthly_cost) FROM hardware_pool WHERE availability_status = 'allocated') as allocated_monthly_cost,
                (SELECT SUM(monthly_cost) FROM hardware_pool WHERE availability_status = 'available') as available_monthly_cost
                FROM hardware_pool")
            .await?
            .take(0)?;

        let data = cost_data.into_iter().next().unwrap_or_default();

        Ok(CostAnalysis {
            total_acquisition_cost: data.get("total_acquisition_cost").and_then(|v| v.as_f64()).unwrap_or(0.0),
            total_monthly_cost: data.get("total_monthly_cost").and_then(|v| v.as_f64()).unwrap_or(0.0),
            allocated_monthly_cost: data.get("allocated_monthly_cost").and_then(|v| v.as_f64()).unwrap_or(0.0),
            available_monthly_cost: data.get("available_monthly_cost").and_then(|v| v.as_f64()).unwrap_or(0.0),
            cost_efficiency_ratio: 0.0, // Calculate based on utilization
        })
    }

    async fn generate_capacity_forecast(&self) -> Result<CapacityForecast> {
        // Get historical allocation patterns
        let allocation_trends: Vec<serde_json::Value> = self.db
            .query("SELECT 
                allocation_start,
                allocation_end,
                COUNT() as servers_allocated
                FROM hardware_allocation 
                WHERE allocation_start >= (time::now() - 90d)
                GROUP BY time::group(allocation_start, '1w')
                ORDER BY allocation_start")
            .await?
            .take(0)?;

        // Simple forecast based on trends
        Ok(CapacityForecast {
            projected_demand: allocation_trends,
            capacity_gaps: Vec::new(),
            recommendations: vec![
                "Monitor allocation trends weekly".to_string(),
                "Consider procurement if utilization > 85%".to_string(),
            ],
        })
    }
}

// Supporting types for the hardware pool service
#[derive(Debug, serde::Deserialize)]
pub struct CreateHardwarePoolRequest {
    pub asset_tag: String,
    pub serial_number: Option<String>,
    pub hardware_lot_id: Option<Thing>,
    pub vendor: String,
    pub model: String,
    pub form_factor: Option<String>,
    pub cpu_sockets: Option<i32>,
    pub cpu_cores_total: Option<i32>,
    pub memory_gb: Option<i32>,
    pub storage_type: Option<String>,
    pub storage_capacity_gb: Option<i32>,
    pub network_ports: Option<i32>,
    pub power_consumption_watts: Option<i32>,
    pub rack_units: Option<i32>,
    pub location: Option<String>,
    pub datacenter: Option<String>,
    pub rack_position: Option<String>,
    pub available_until_date: Option<DateTime<Utc>>,
    pub acquisition_cost: Option<f64>,
    pub monthly_cost: Option<f64>,
    pub warranty_expires: Option<DateTime<Utc>>,
    pub support_level: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
pub struct UpdateHardwareRequest {
    pub cpu_cores_total: Option<i32>,
    pub memory_gb: Option<i32>,
    pub storage_capacity_gb: Option<i32>,
    pub location: Option<String>,
    pub rack_position: Option<String>,
}

#[derive(Debug, serde::Serialize)]
pub struct AvailabilityInfo {
    pub server_id: Thing,
    pub is_available: bool,
    pub current_status: AvailabilityStatus,
    pub conflicting_allocations: Vec<HardwareAllocation>,
    pub maintenance_conflicts: Vec<MaintenanceWindow>,
    pub available_from: DateTime<Utc>,
    pub available_until: Option<DateTime<Utc>>,
}

#[derive(Debug, serde::Deserialize)]
pub struct HardwareRequirements {
    pub min_cpu_cores: Option<i32>,
    pub min_memory_gb: Option<i32>,
    pub preferred_datacenter: Option<String>,
    pub form_factor: Option<String>,
    pub max_results: Option<usize>,
}

#[derive(Debug, serde::Serialize)]
pub struct ServerRecommendation {
    pub server_id: Thing,
    pub asset_tag: String,
    pub vendor: String,
    pub model: String,
    pub specifications: ServerSpecifications,
    pub suitability_score: f64,
    pub estimated_monthly_cost: Option<f64>,
    pub location: Option<String>,
    pub datacenter: Option<String>,
    pub available_from: DateTime<Utc>,
    pub available_until: Option<DateTime<Utc>>,
}

#[derive(Debug, serde::Serialize)]
pub struct ServerSpecifications {
    pub cpu_cores: i32,
    pub memory_gb: i32,
    pub storage_gb: i32,
    pub network_ports: i32,
}

#[derive(Debug, serde::Deserialize)]
pub struct AllocationRequest {
    pub project_id: String,
    pub workflow_id: Option<String>,
    pub server_ids: Vec<String>,
    pub allocation_start: DateTime<Utc>,
    pub allocation_end: Option<DateTime<Utc>>,
    pub purpose: String,
    pub configuration_notes: Option<String>,
    pub justification: Option<String>,
    pub approved_by: Option<String>,
}

#[derive(Debug, serde::Serialize)]
pub enum AllocationResult {
    Success(Vec<HardwareAllocation>),
    PendingApproval(PendingAllocation),
    Conflicts(Vec<AllocationConflict>),
}

#[derive(Debug, serde::Serialize)]
pub struct AllocationConflict {
    pub server_id: String,
    pub conflicts: Vec<HardwareAllocation>,
    pub maintenance_windows: Vec<MaintenanceWindow>,
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct PendingAllocation {
    pub id: Option<Thing>,
    pub project_id: Thing,
    pub server_ids: Vec<Thing>,
    pub allocation_start: DateTime<Utc>,
    pub allocation_end: Option<DateTime<Utc>>,
    pub purpose: String,
    pub justification: Option<String>,
    pub requested_by: String,
    pub requested_at: DateTime<Utc>,
    pub status: String,
}

#[derive(Debug, serde::Serialize)]
pub struct HardwarePoolAnalytics {
    pub pool_status_breakdown: Vec<serde_json::Value>,
    pub vendor_utilization: Vec<serde_json::Value>,
    pub capacity_utilization: serde_json::Value,
    pub cost_analysis: CostAnalysis,
    pub forecast: CapacityForecast,
}

#[derive(Debug, serde::Serialize)]
pub struct CostAnalysis {
    pub total_acquisition_cost: f64,
    pub total_monthly_cost: f64,
    pub allocated_monthly_cost: f64,
    pub available_monthly_cost: f64,
    pub cost_efficiency_ratio: f64,
}

#[derive(Debug, serde::Serialize)]
pub struct CapacityForecast {
    pub projected_demand: Vec<serde_json::Value>,
    pub capacity_gaps: Vec<String>,
    pub recommendations: Vec<String>,
}
