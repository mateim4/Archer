use crate::models::*;
use crate::Result;

/// Analysis engine for "as-is" environment assessment
pub struct AnalysisEngine;

impl AnalysisEngine {
    /// Perform comprehensive analysis of the vSphere environment
    pub fn analyze_environment(environment: &VsphereEnvironment) -> Result<AnalysisReport> {
        let capacity_analysis = Self::analyze_capacity(environment);
        let performance_analysis = Self::analyze_performance(environment);
        let health_analysis = Self::analyze_health(environment);
        let optimization_recommendations = Self::generate_optimization_recommendations(environment);

        Ok(AnalysisReport {
            environment_id: environment.id,
            capacity_analysis,
            performance_analysis,
            health_analysis,
            optimization_recommendations,
            generated_at: chrono::Utc::now(),
        })
    }

    /// Analyze capacity utilization and trends
    fn analyze_capacity(environment: &VsphereEnvironment) -> CapacityAnalysis {
        let mut cluster_utilization = Vec::new();

        for cluster in &environment.clusters {
            let cpu_utilization = Self::calculate_cpu_utilization(cluster);
            let memory_utilization = Self::calculate_memory_utilization(cluster);
            let storage_utilization = Self::calculate_storage_utilization(cluster);

            cluster_utilization.push(ClusterUtilization {
                cluster_name: cluster.name.clone(),
                cpu_utilization_percent: cpu_utilization,
                memory_utilization_percent: memory_utilization,
                storage_utilization_percent: storage_utilization,
                vcpu_pcpu_ratio: cluster.metrics.current_vcpu_pcpu_ratio,
                memory_overcommit_ratio: cluster.metrics.memory_overcommit_ratio,
                host_count: cluster.hosts.len(),
                vm_count: cluster.vms.len(),
            });
        }

        let overall_utilization = Self::calculate_overall_utilization(&cluster_utilization);

        CapacityAnalysis {
            overall_utilization,
            cluster_utilization: cluster_utilization.clone(),
            capacity_warnings: Self::identify_capacity_warnings(&cluster_utilization),
            growth_potential: Self::assess_growth_potential(&cluster_utilization),
        }
    }

    /// Calculate CPU utilization for a cluster
    fn calculate_cpu_utilization(cluster: &Cluster) -> f32 {
        if cluster.metrics.total_pcpu_cores == 0 {
            return 0.0;
        }

        // Simplified calculation - in reality would need actual performance data
        let theoretical_max_vcpus = cluster.metrics.total_pcpu_cores * 8; // Assume max 8:1 ratio
        (cluster.metrics.total_vcpus as f32 / theoretical_max_vcpus as f32) * 100.0
    }

    /// Calculate memory utilization for a cluster
    fn calculate_memory_utilization(cluster: &Cluster) -> f32 {
        if cluster.metrics.total_memory_gb == 0 {
            return 0.0;
        }

        (cluster.metrics.provisioned_memory_gb / cluster.metrics.total_memory_gb as f64 * 100.0) as f32
    }

    /// Calculate storage utilization for a cluster
    fn calculate_storage_utilization(cluster: &Cluster) -> f32 {
        if cluster.metrics.total_storage_gb == 0.0 {
            return 0.0;
        }

        (cluster.metrics.consumed_storage_gb / cluster.metrics.total_storage_gb * 100.0) as f32
    }

    /// Calculate overall environment utilization
    fn calculate_overall_utilization(cluster_utilization: &[ClusterUtilization]) -> OverallUtilization {
        if cluster_utilization.is_empty() {
            return OverallUtilization {
                avg_cpu_utilization: 0.0,
                avg_memory_utilization: 0.0,
                avg_storage_utilization: 0.0,
                avg_vcpu_pcpu_ratio: 0.0,
                total_clusters: 0,
                total_hosts: 0,
                total_vms: 0,
            };
        }

        let avg_cpu = cluster_utilization.iter().map(|c| c.cpu_utilization_percent).sum::<f32>() / cluster_utilization.len() as f32;
        let avg_memory = cluster_utilization.iter().map(|c| c.memory_utilization_percent).sum::<f32>() / cluster_utilization.len() as f32;
        let avg_storage = cluster_utilization.iter().map(|c| c.storage_utilization_percent).sum::<f32>() / cluster_utilization.len() as f32;
        let avg_vcpu_pcpu = cluster_utilization.iter().map(|c| c.vcpu_pcpu_ratio).sum::<f32>() / cluster_utilization.len() as f32;

        OverallUtilization {
            avg_cpu_utilization: avg_cpu,
            avg_memory_utilization: avg_memory,
            avg_storage_utilization: avg_storage,
            avg_vcpu_pcpu_ratio: avg_vcpu_pcpu,
            total_clusters: cluster_utilization.len(),
            total_hosts: cluster_utilization.iter().map(|c| c.host_count).sum(),
            total_vms: cluster_utilization.iter().map(|c| c.vm_count).sum(),
        }
    }

    /// Identify capacity warnings
    fn identify_capacity_warnings(cluster_utilization: &[ClusterUtilization]) -> Vec<CapacityWarning> {
        let mut warnings = Vec::new();

        for cluster in cluster_utilization {
            // High CPU utilization
            if cluster.cpu_utilization_percent > 80.0 {
                warnings.push(CapacityWarning {
                    severity: if cluster.cpu_utilization_percent > 90.0 { Severity::Critical } else { Severity::Warning },
                    cluster_name: cluster.cluster_name.clone(),
                    resource_type: "CPU".to_string(),
                    current_utilization: cluster.cpu_utilization_percent,
                    threshold: 80.0,
                    recommendation: "Consider adding CPU capacity or optimizing workloads".to_string(),
                });
            }

            // High memory utilization
            if cluster.memory_utilization_percent > 85.0 {
                warnings.push(CapacityWarning {
                    severity: if cluster.memory_utilization_percent > 95.0 { Severity::Critical } else { Severity::Warning },
                    cluster_name: cluster.cluster_name.clone(),
                    resource_type: "Memory".to_string(),
                    current_utilization: cluster.memory_utilization_percent,
                    threshold: 85.0,
                    recommendation: "Consider adding memory or reducing memory allocation".to_string(),
                });
            }

            // High vCPU:pCPU ratio
            if cluster.vcpu_pcpu_ratio > 6.0 {
                warnings.push(CapacityWarning {
                    severity: if cluster.vcpu_pcpu_ratio > 8.0 { Severity::Critical } else { Severity::Warning },
                    cluster_name: cluster.cluster_name.clone(),
                    resource_type: "vCPU:pCPU Ratio".to_string(),
                    current_utilization: cluster.vcpu_pcpu_ratio * 100.0 / 8.0, // Normalize to percentage
                    threshold: 75.0,
                    recommendation: "High overcommitment ratio may impact performance".to_string(),
                });
            }
        }

        warnings
    }

    /// Assess growth potential
    fn assess_growth_potential(cluster_utilization: &[ClusterUtilization]) -> GrowthPotential {
        let avg_cpu_headroom = cluster_utilization.iter()
            .map(|c| 100.0 - c.cpu_utilization_percent)
            .sum::<f32>() / cluster_utilization.len() as f32;

        let avg_memory_headroom = cluster_utilization.iter()
            .map(|c| 100.0 - c.memory_utilization_percent)
            .sum::<f32>() / cluster_utilization.len() as f32;

        let growth_runway_months = if avg_cpu_headroom < avg_memory_headroom {
            avg_cpu_headroom / 2.0 // Assume 2% growth per month
        } else {
            avg_memory_headroom / 2.0
        };

        GrowthPotential {
            cpu_headroom_percent: avg_cpu_headroom,
            memory_headroom_percent: avg_memory_headroom,
            estimated_growth_runway_months: growth_runway_months as u32,
            constraints: Self::identify_growth_constraints(cluster_utilization),
        }
    }

    /// Identify growth constraints
    fn identify_growth_constraints(cluster_utilization: &[ClusterUtilization]) -> Vec<String> {
        let mut constraints = Vec::new();

        for cluster in cluster_utilization {
            if cluster.cpu_utilization_percent > 70.0 {
                constraints.push(format!("Cluster '{}' is CPU constrained", cluster.cluster_name));
            }
            if cluster.memory_utilization_percent > 75.0 {
                constraints.push(format!("Cluster '{}' is memory constrained", cluster.cluster_name));
            }
            if cluster.vcpu_pcpu_ratio > 5.0 {
                constraints.push(format!("Cluster '{}' has high CPU overcommitment", cluster.cluster_name));
            }
        }

        constraints
    }

    /// Analyze performance characteristics
    fn analyze_performance(environment: &VsphereEnvironment) -> PerformanceAnalysis {
        let mut cluster_performance = Vec::new();

        for cluster in &environment.clusters {
            let performance = ClusterPerformance {
                cluster_name: cluster.name.clone(),
                avg_vcpu_per_vm: cluster.metrics.total_vcpus as f32 / cluster.metrics.total_vms as f32,
                avg_memory_per_vm_gb: cluster.metrics.provisioned_memory_gb / cluster.metrics.total_vms as f64,
                vcpu_pcpu_ratio: cluster.metrics.current_vcpu_pcpu_ratio,
                memory_overcommit_ratio: cluster.metrics.memory_overcommit_ratio,
                performance_score: Self::calculate_performance_score(cluster),
                bottlenecks: Self::identify_bottlenecks(cluster),
            };
            cluster_performance.push(performance);
        }

        PerformanceAnalysis {
            cluster_performance: cluster_performance.clone(),
            overall_performance_score: Self::calculate_overall_performance_score(&cluster_performance),
            performance_recommendations: Self::generate_performance_recommendations(&cluster_performance),
        }
    }

    /// Calculate performance score for a cluster
    fn calculate_performance_score(cluster: &Cluster) -> f32 {
        let mut score = 100.0;

        // Penalize high vCPU:pCPU ratios
        if cluster.metrics.current_vcpu_pcpu_ratio > 4.0 {
            score -= (cluster.metrics.current_vcpu_pcpu_ratio - 4.0) * 10.0;
        }

        // Penalize high memory overcommitment
        if cluster.metrics.memory_overcommit_ratio > 1.0 {
            score -= (cluster.metrics.memory_overcommit_ratio - 1.0) * 20.0;
        }

        score.max(0.0).min(100.0)
    }

    /// Calculate overall performance score
    fn calculate_overall_performance_score(cluster_performance: &[ClusterPerformance]) -> f32 {
        if cluster_performance.is_empty() {
            return 0.0;
        }

        cluster_performance.iter().map(|c| c.performance_score).sum::<f32>() / cluster_performance.len() as f32
    }

    /// Identify performance bottlenecks
    fn identify_bottlenecks(cluster: &Cluster) -> Vec<String> {
        let mut bottlenecks = Vec::new();

        if cluster.metrics.current_vcpu_pcpu_ratio > 6.0 {
            bottlenecks.push("High CPU overcommitment may cause CPU contention".to_string());
        }

        if cluster.metrics.memory_overcommit_ratio > 1.2 {
            bottlenecks.push("Memory overcommitment may trigger ballooning or swapping".to_string());
        }

        if cluster.hosts.len() < 3 {
            bottlenecks.push("Small cluster size limits HA capabilities".to_string());
        }

        bottlenecks
    }

    /// Generate performance recommendations
    fn generate_performance_recommendations(cluster_performance: &[ClusterPerformance]) -> Vec<String> {
        let mut recommendations = Vec::new();

        for cluster in cluster_performance {
            if cluster.performance_score < 70.0 {
                recommendations.push(format!(
                    "Cluster '{}' has poor performance score ({}%) - consider resource optimization",
                    cluster.cluster_name, cluster.performance_score as u32
                ));
            }

            if cluster.vcpu_pcpu_ratio > 5.0 {
                recommendations.push(format!(
                    "Reduce vCPU:pCPU ratio in cluster '{}' from {:.1}:1 to improve performance",
                    cluster.cluster_name, cluster.vcpu_pcpu_ratio
                ));
            }
        }

        recommendations
    }

    /// Analyze health status
    fn analyze_health(environment: &VsphereEnvironment) -> HealthAnalysis {
        let mut all_issues = environment.summary_metrics.health_issues.clone();

        // Add cluster-specific health issues
        for cluster in &environment.clusters {
            for vm_name in &cluster.health_status.zombie_vms {
                all_issues.push(HealthIssue {
                    severity: Severity::Warning,
                    category: "Resource Optimization".to_string(),
                    description: format!("Zombie VM '{}' consuming resources unnecessarily", vm_name),
                    affected_vm: Some(vm_name.clone()),
                    affected_host: None,
                    recommendation: "Remove or power on if needed".to_string(),
                });
            }
        }

        let critical_count = all_issues.iter().filter(|i| matches!(i.severity, Severity::Critical)).count();
        let warning_count = all_issues.iter().filter(|i| matches!(i.severity, Severity::Warning)).count();

        HealthAnalysis {
            overall_health_score: Self::calculate_health_score(critical_count, warning_count),
            critical_issues: critical_count,
            warning_issues: warning_count,
            info_issues: all_issues.iter().filter(|i| matches!(i.severity, Severity::Info)).count(),
            health_issues: all_issues,
            remediation_plan: Self::generate_remediation_plan(&environment.summary_metrics.health_issues),
        }
    }

    /// Calculate overall health score
    fn calculate_health_score(critical_count: usize, warning_count: usize) -> f32 {
        let mut score = 100.0;
        score -= critical_count as f32 * 20.0; // Each critical issue reduces score by 20
        score -= warning_count as f32 * 5.0;   // Each warning reduces score by 5
        score.max(0.0)
    }

    /// Generate remediation plan
    fn generate_remediation_plan(health_issues: &[HealthIssue]) -> Vec<RemediationStep> {
        let mut steps = Vec::new();
        let mut step_id = 1;

        // Group issues by category and create remediation steps
        let mut rdm_vms = Vec::new();
        let mut zombie_vms = Vec::new();
        let mut tools_issues = Vec::new();

        for issue in health_issues {
            match issue.category.as_str() {
                "Raw Device Mapping" => {
                    if let Some(vm) = &issue.affected_vm {
                        rdm_vms.push(vm.clone());
                    }
                }
                "Zombie VM" => {
                    if let Some(vm) = &issue.affected_vm {
                        zombie_vms.push(vm.clone());
                    }
                }
                "Outdated VMware Tools" => {
                    if let Some(vm) = &issue.affected_vm {
                        tools_issues.push(vm.clone());
                    }
                }
                _ => {}
            }
        }

        // Create remediation steps
        if !rdm_vms.is_empty() {
            let rdm_count = rdm_vms.len();
            steps.push(RemediationStep {
                step_id,
                priority: Priority::High,
                category: "Pre-Migration".to_string(),
                description: format!("Address {} VMs with Raw Device Mappings", rdm_count),
                affected_items: rdm_vms,
                estimated_effort_hours: rdm_count as f32 * 4.0,
                prerequisites: vec!["Storage team involvement".to_string()],
            });
            step_id += 1;
        }

        if !tools_issues.is_empty() {
            let tools_count = tools_issues.len();
            steps.push(RemediationStep {
                step_id,
                priority: Priority::Medium,
                category: "Preparation".to_string(),
                description: format!("Update VMware Tools on {} VMs", tools_count),
                affected_items: tools_issues,
                estimated_effort_hours: tools_count as f32 * 0.5,
                prerequisites: vec!["Maintenance windows".to_string()],
            });
            step_id += 1;
        }

        if !zombie_vms.is_empty() {
            let zombie_count = zombie_vms.len();
            steps.push(RemediationStep {
                step_id,
                priority: Priority::Low,
                category: "Cleanup".to_string(),
                description: format!("Review and remove {} zombie VMs", zombie_count),
                affected_items: zombie_vms,
                estimated_effort_hours: zombie_count as f32 * 0.25,
                prerequisites: vec!["Business approval".to_string()],
            });
        }

        steps
    }

    /// Generate optimization recommendations
    fn generate_optimization_recommendations(environment: &VsphereEnvironment) -> Vec<OptimizationRecommendation> {
        let mut recommendations = Vec::new();

        for cluster in &environment.clusters {
            // Check for unbalanced clusters
            if cluster.hosts.len() == 2 {
                recommendations.push(OptimizationRecommendation {
                    category: "High Availability".to_string(),
                    priority: Priority::Medium,
                    description: format!("Cluster '{}' has only 2 hosts, limiting HA capabilities", cluster.name),
                    recommendation: "Consider adding a third host for N+1 HA protection".to_string(),
                    estimated_savings: None,
                    implementation_effort: "Medium".to_string(),
                });
            }

            // Check for oversized VMs
            let oversized_vms: Vec<_> = cluster.vms.iter()
                .filter(|vm| vm.num_vcpu > 8 || vm.memory_gb > 64)
                .collect();

            if !oversized_vms.is_empty() {
                recommendations.push(OptimizationRecommendation {
                    category: "Resource Optimization".to_string(),
                    priority: Priority::Low,
                    description: format!("Found {} oversized VMs in cluster '{}'", oversized_vms.len(), cluster.name),
                    recommendation: "Review VM sizing and right-size if possible".to_string(),
                    estimated_savings: Some(oversized_vms.len() as f64 * 500.0), // Estimated cost savings
                    implementation_effort: "Low".to_string(),
                });
            }

            // Check for thin provisioning opportunities
            let thick_disks: usize = cluster.vms.iter()
                .flat_map(|vm| &vm.disks)
                .filter(|disk| matches!(disk.provisioning_type, ProvisioningType::Thick))
                .count();

            if thick_disks > 0 {
                recommendations.push(OptimizationRecommendation {
                    category: "Storage Optimization".to_string(),
                    priority: Priority::Low,
                    description: format!("Found {} thick-provisioned disks in cluster '{}'", thick_disks, cluster.name),
                    recommendation: "Consider converting to thin provisioning to reduce storage usage".to_string(),
                    estimated_savings: Some(thick_disks as f64 * 100.0),
                    implementation_effort: "Medium".to_string(),
                });
            }
        }

        recommendations
    }
}

// Analysis result structures
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AnalysisReport {
    pub environment_id: uuid::Uuid,
    pub capacity_analysis: CapacityAnalysis,
    pub performance_analysis: PerformanceAnalysis,
    pub health_analysis: HealthAnalysis,
    pub optimization_recommendations: Vec<OptimizationRecommendation>,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CapacityAnalysis {
    pub overall_utilization: OverallUtilization,
    pub cluster_utilization: Vec<ClusterUtilization>,
    pub capacity_warnings: Vec<CapacityWarning>,
    pub growth_potential: GrowthPotential,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OverallUtilization {
    pub avg_cpu_utilization: f32,
    pub avg_memory_utilization: f32,
    pub avg_storage_utilization: f32,
    pub avg_vcpu_pcpu_ratio: f32,
    pub total_clusters: usize,
    pub total_hosts: usize,
    pub total_vms: usize,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClusterUtilization {
    pub cluster_name: String,
    pub cpu_utilization_percent: f32,
    pub memory_utilization_percent: f32,
    pub storage_utilization_percent: f32,
    pub vcpu_pcpu_ratio: f32,
    pub memory_overcommit_ratio: f32,
    pub host_count: usize,
    pub vm_count: usize,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CapacityWarning {
    pub severity: Severity,
    pub cluster_name: String,
    pub resource_type: String,
    pub current_utilization: f32,
    pub threshold: f32,
    pub recommendation: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GrowthPotential {
    pub cpu_headroom_percent: f32,
    pub memory_headroom_percent: f32,
    pub estimated_growth_runway_months: u32,
    pub constraints: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PerformanceAnalysis {
    pub cluster_performance: Vec<ClusterPerformance>,
    pub overall_performance_score: f32,
    pub performance_recommendations: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ClusterPerformance {
    pub cluster_name: String,
    pub avg_vcpu_per_vm: f32,
    pub avg_memory_per_vm_gb: f64,
    pub vcpu_pcpu_ratio: f32,
    pub memory_overcommit_ratio: f32,
    pub performance_score: f32,
    pub bottlenecks: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HealthAnalysis {
    pub overall_health_score: f32,
    pub critical_issues: usize,
    pub warning_issues: usize,
    pub info_issues: usize,
    pub health_issues: Vec<HealthIssue>,
    pub remediation_plan: Vec<RemediationStep>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RemediationStep {
    pub step_id: u32,
    pub priority: Priority,
    pub category: String,
    pub description: String,
    pub affected_items: Vec<String>,
    pub estimated_effort_hours: f32,
    pub prerequisites: Vec<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OptimizationRecommendation {
    pub category: String,
    pub priority: Priority,
    pub description: String,
    pub recommendation: String,
    pub estimated_savings: Option<f64>,
    pub implementation_effort: String,
}
