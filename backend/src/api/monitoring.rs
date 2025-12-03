use axum::{
    extract::{Path, State},
    Json, Router, routing::get,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use crate::database::Database;
use chrono::{DateTime, Utc, Duration};
use rand::Rng;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MetricPoint {
    pub timestamp: DateTime<Utc>,
    pub value: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AssetMetrics {
    pub asset_id: String,
    pub cpu_usage: Vec<MetricPoint>,
    pub memory_usage: Vec<MetricPoint>,
    pub storage_usage: Vec<MetricPoint>,
    pub network_throughput: Vec<MetricPoint>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DashboardSummary {
    pub total_alerts: i32,
    pub critical_alerts: i32,
    pub warning_alerts: i32,
    pub avg_cluster_health: f64,
    pub active_incidents: i32,
}

pub fn routes(db: Arc<Database>) -> Router {
    Router::new()
        .route("/dashboard", get(get_dashboard_summary))
        .route("/assets/:asset_id", get(get_asset_metrics))
        .with_state(db)
}

async fn get_dashboard_summary(
    State(_db): State<Arc<Database>>,
) -> Json<DashboardSummary> {
    // Mock data for the dashboard summary
    // In a real app, this would aggregate alerts from the database
    let summary = DashboardSummary {
        total_alerts: 12,
        critical_alerts: 2,
        warning_alerts: 10,
        avg_cluster_health: 94.5,
        active_incidents: 3,
    };
    Json(summary)
}

async fn get_asset_metrics(
    State(_db): State<Arc<Database>>,
    Path(asset_id): Path<String>,
) -> Json<AssetMetrics> {
    // Generate realistic mock data for the last 24 hours
    let mut rng = rand::thread_rng();
    let now = Utc::now();
    let points = 24; // One point per hour

    let mut cpu_usage = Vec::new();
    let mut memory_usage = Vec::new();
    let mut storage_usage = Vec::new();
    let mut network_throughput = Vec::new();

    let base_cpu = rng.gen_range(20.0..60.0);
    let base_mem = rng.gen_range(40.0..80.0);

    for i in 0..points {
        let time = now - Duration::hours((points - 1 - i) as i64);
        
        // Add some noise and trends
        let cpu_noise: f64 = rng.gen_range(-10.0..15.0);
        let mem_noise: f64 = rng.gen_range(-5.0..5.0);
        
        let cpu_val = (base_cpu + cpu_noise).clamp(0.0, 100.0);
        let mem_val = (base_mem + mem_noise).clamp(0.0, 100.0);
        let storage_val = 65.0 + (i as f64 * 0.1); // Slow growth
        let net_val = rng.gen_range(100.0..1000.0); // Mbps

        cpu_usage.push(MetricPoint { timestamp: time, value: cpu_val });
        memory_usage.push(MetricPoint { timestamp: time, value: mem_val });
        storage_usage.push(MetricPoint { timestamp: time, value: storage_val });
        network_throughput.push(MetricPoint { timestamp: time, value: net_val });
    }

    Json(AssetMetrics {
        asset_id,
        cpu_usage,
        memory_usage,
        storage_usage,
        network_throughput,
    })
}
