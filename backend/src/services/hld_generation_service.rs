use serde::{Deserialize, Serialize};
use std::error::Error;
use std::path::PathBuf;
use crate::models::project_models::{GeneratedDocument, MigrationProject, MigrationCluster, VMPlacement};
use crate::database::Database;
use docx_rs::*;

/// HLD Generation Service
/// 
/// Generates High-Level Design documents for migration projects.
/// Creates comprehensive Word documents including:
/// - Executive Summary
/// - Current State Inventory
/// - Target State Architecture
/// - Capacity Planning
/// - Network Design
/// - Migration Approach & Runbook
pub struct HLDGenerationService {
    db: Database,
    output_dir: PathBuf,
}

/// HLD Generation Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDGenerationRequest {
    pub project_id: String,
    pub include_executive_summary: bool,
    pub include_inventory: bool,
    pub include_architecture: bool,
    pub include_capacity_planning: bool,
    pub include_network_design: bool,
    pub include_migration_runbook: bool,
    pub include_appendices: bool,
}

impl Default for HLDGenerationRequest {
    fn default() -> Self {
        Self {
            project_id: String::new(),
            include_executive_summary: true,
            include_inventory: true,
            include_architecture: true,
            include_capacity_planning: true,
            include_network_design: true,
            include_migration_runbook: true,
            include_appendices: true,
        }
    }
}

/// HLD Generation Result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDGenerationResult {
    pub document: GeneratedDocument,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub generation_time_ms: u128,
    pub sections_included: Vec<String>,
}

/// HLD Section Content
#[derive(Debug, Clone)]
struct HLDSection {
    title: String,
    content: Vec<String>,
}

impl HLDGenerationService {
    /// Create a new HLD Generation Service
    pub fn new(db: Database, output_dir: PathBuf) -> Self {
        Self { db, output_dir }
    }

    /// Generate a complete HLD document
    pub async fn generate_hld(
        &self,
        request: HLDGenerationRequest,
    ) -> Result<HLDGenerationResult, Box<dyn Error>> {
        let start_time = std::time::Instant::now();

        // Fetch project data
        let project: Option<MigrationProject> = self
            .db
            .select(("migration_project", request.project_id.as_str()))
            .await?;

        let project = project.ok_or("Project not found")?;

        // Fetch related data
        let clusters = self.fetch_project_clusters(&request.project_id).await?;
        let placements = self.fetch_vm_placements(&request.project_id).await?;

        // Build HLD sections
        let mut sections_included = Vec::new();
        let mut docx = Docx::new();

        // Add title page
        docx = self.add_title_page(docx, &project);

        // Add table of contents placeholder
        docx = self.add_table_of_contents(docx);

        // 1. Executive Summary
        if request.include_executive_summary {
            docx = self.add_executive_summary(docx, &project, &clusters, &placements);
            sections_included.push("Executive Summary".to_string());
        }

        // 2. Current State Inventory
        if request.include_inventory {
            docx = self.add_inventory_section(docx, &project, &placements);
            sections_included.push("Current State Inventory".to_string());
        }

        // 3. Target State Architecture
        if request.include_architecture {
            docx = self.add_architecture_section(docx, &project, &clusters);
            sections_included.push("Target State Architecture".to_string());
        }

        // 4. Capacity Planning
        if request.include_capacity_planning {
            docx = self.add_capacity_section(docx, &project, &clusters, &placements);
            sections_included.push("Capacity Planning".to_string());
        }

        // 5. Network Design
        if request.include_network_design {
            docx = self.add_network_section(docx, &project);
            sections_included.push("Network Design".to_string());
        }

        // 6. Migration Approach & Runbook
        if request.include_migration_runbook {
            docx = self.add_runbook_section(docx, &project, &placements);
            sections_included.push("Migration Runbook".to_string());
        }

        // 7. Appendices
        if request.include_appendices {
            docx = self.add_appendices_section(docx, &project);
            sections_included.push("Appendices".to_string());
        }

        // Save document to file
        let file_name = format!("HLD_{}_{}.docx", 
            project.project_name.replace(' ', "_"),
            chrono::Utc::now().format("%Y%m%d_%H%M%S")
        );
        
        let file_path = self.output_dir.join(&file_name);
        
        // Ensure output directory exists
        std::fs::create_dir_all(&self.output_dir)?;
        
        // Write document
        let file = std::fs::File::create(&file_path)?;
        docx.build().pack(file)?;

        // Get file size
        let file_size_bytes = std::fs::metadata(&file_path)?.len();

        // Create database record
        let document_id = format!("generated_document:{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now();

        // Parse project_id as Thing for SurrealDB
        let project_thing: surrealdb::sql::Thing = surrealdb::sql::thing(&request.project_id)?;
        
        // For activity_id and template_id, we'll use placeholder Things for now
        // In production, these would come from actual activity and template records
        let activity_thing: surrealdb::sql::Thing = surrealdb::sql::thing("activity:hld_generation")?;
        let template_thing: surrealdb::sql::Thing = surrealdb::sql::thing("document_template:hld_default")?;

        let document = GeneratedDocument {
            id: None, // Will be set by SurrealDB
            project_id: project_thing,
            activity_id: activity_thing,
            template_id: template_thing,
            document_name: format!("{} - High Level Design", project.project_name),
            document_type: crate::models::project_models::DocumentType::Hld,
            file_path: file_path.to_string_lossy().to_string(),
            file_size_bytes: file_size_bytes as i64,
            file_format: crate::models::project_models::DocumentFormat::Docx,
            variables_snapshot: std::collections::HashMap::new(),
            data_sources: Vec::new(),
            generation_status: crate::models::project_models::DocumentGenerationStatus::Completed,
            error_message: None,
            metadata: {
                let mut map = std::collections::HashMap::new();
                map.insert("sections".to_string(), serde_json::json!(sections_included));
                map.insert("generation_time_ms".to_string(), serde_json::json!(start_time.elapsed().as_millis()));
                map.insert("project_name".to_string(), serde_json::json!(project.project_name));
                map.insert("cluster_count".to_string(), serde_json::json!(clusters.len()));
                map.insert("vm_count".to_string(), serde_json::json!(placements.len()));
                map
            },
            generated_at: now,
            generated_by: "system".to_string(), // TODO: Get from auth context
            expires_at: None,
        };

        // Save to database
        let created: Vec<GeneratedDocument> = self
            .db
            .create("generated_document")
            .content(&document)
            .await?;

        let saved_document = created.into_iter().next().ok_or("Failed to save document")?;

        let generation_time_ms = start_time.elapsed().as_millis();

        Ok(HLDGenerationResult {
            document: saved_document,
            file_path: file_path.to_string_lossy().to_string(),
            file_size_bytes,
            generation_time_ms,
            sections_included,
        })
    }

    // ==================== Helper Methods ====================

    /// Fetch clusters for a project
    async fn fetch_project_clusters(
        &self,
        project_id: &str,
    ) -> Result<Vec<MigrationCluster>, Box<dyn Error>> {
        let query = "SELECT * FROM migration_cluster WHERE project_id = $project_id";
        let mut result = self
            .db
            .query(query)
            .bind(("project_id", project_id))
            .await?;

        let clusters: Vec<MigrationCluster> = result.take(0)?;
        Ok(clusters)
    }

    /// Fetch VM placements for a project
    async fn fetch_vm_placements(
        &self,
        project_id: &str,
    ) -> Result<Vec<VMPlacement>, Box<dyn Error>> {
        let query = "SELECT * FROM vm_placement WHERE project_id = $project_id";
        let mut result = self
            .db
            .query(query)
            .bind(("project_id", project_id))
            .await?;

        let placements: Vec<VMPlacement> = result.take(0)?;
        Ok(placements)
    }

    /// Add title page
    fn add_title_page(&self, mut docx: Docx, project: &MigrationProject) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&project.project_name).size(72).bold())
                    .align(AlignmentType::Center)
            )
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("High Level Design Document").size(48))
                    .align(AlignmentType::Center)
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&format!("Generated: {}", chrono::Utc::now().format("%B %d, %Y"))).size(28))
                    .align(AlignmentType::Center)
            );

        if let Some(desc) = &project.description {
            docx = docx.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(desc).size(24))
                    .align(AlignmentType::Center)
            );
        }

        // Add page break
        docx.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)))
    }

    /// Add table of contents placeholder
    fn add_table_of_contents(&self, docx: Docx) -> Docx {
        docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Table of Contents").size(32).bold())
            )
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("(To be generated in Word)")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)))
    }

    /// Add executive summary section
    fn add_executive_summary(
        &self,
        mut docx: Docx,
        project: &MigrationProject,
        clusters: &[MigrationCluster],
        placements: &[VMPlacement],
    ) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("1. Executive Summary").size(40).bold())
            )
            .add_paragraph(Paragraph::new());

        // Project overview
        docx = docx.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("Project Overview").size(28).bold())
        );

        let overview_text = format!(
            "This document describes the high-level design for migrating {} workloads \
            from {} to {}. The migration will utilize a {} strategy.",
            placements.len(),
            project.source_environment.as_deref().unwrap_or("on-premises environment"),
            project.target_platform.as_deref().unwrap_or("cloud platform"),
            project.migration_strategy.as_deref().unwrap_or("standard")
        );

        docx = docx
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&overview_text)))
            .add_paragraph(Paragraph::new());

        // Key statistics
        docx = docx.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("Key Statistics").size(28).bold())
        );

        let total_cpu: f64 = placements.iter().map(|p| p.assigned_cpu).sum();
        let total_memory: f64 = placements.iter().map(|p| p.assigned_memory_gb).sum();
        let total_storage: f64 = placements.iter().map(|p| p.assigned_storage_gb).sum();

        docx = docx
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Total VMs: {}", placements.len()))))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Target Clusters: {}", clusters.len()))))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Total CPU Cores: {:.1}", total_cpu))))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Total Memory: {:.1} GB", total_memory))))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Total Storage: {:.1} GB", total_storage))))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        docx
    }

    /// Add inventory section
    fn add_inventory_section(
        &self,
        mut docx: Docx,
        project: &MigrationProject,
        placements: &[VMPlacement],
    ) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("2. Current State Inventory").size(40).bold())
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Workload Inventory").size(28).bold())
            )
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&format!("This section lists all {} virtual machines identified for migration.", placements.len())))
            )
            .add_paragraph(Paragraph::new());

        // Add VM table (simplified - in real implementation, use proper tables)
        docx = docx
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("VM Name | CPU | Memory (GB) | Storage (GB)").bold()))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("---------|-----|-------------|-------------")));

        for placement in placements.iter().take(50) {
            // Limit to first 50 for brevity
            docx = docx.add_paragraph(
                Paragraph::new().add_run(
                    Run::new().add_text(&format!(
                        "{} | {:.1} | {:.1} | {:.1}",
                        placement.vm_name,
                        placement.assigned_cpu,
                        placement.assigned_memory_gb,
                        placement.assigned_storage_gb
                    ))
                )
            );
        }

        if placements.len() > 50 {
            docx = docx.add_paragraph(
                Paragraph::new().add_run(Run::new().add_text(&format!("... and {} more VMs (see appendix)", placements.len() - 50)))
            );
        }

        docx.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)))
    }

    /// Add architecture section
    fn add_architecture_section(
        &self,
        mut docx: Docx,
        project: &MigrationProject,
        clusters: &[MigrationCluster],
    ) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("3. Target State Architecture").size(40).bold())
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Destination Clusters").size(28).bold())
            );

        for cluster in clusters {
            docx = docx
                .add_paragraph(Paragraph::new())
                .add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&format!("Cluster: {}", cluster.cluster_name)).size(24).bold())
                )
                .add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(&format!("• Hypervisor: {}", cluster.hypervisor)))
                )
                .add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(&format!("• Storage: {}", cluster.storage_type)))
                )
                .add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(&format!("• Location: {}", cluster.location.as_deref().unwrap_or("N/A"))))
                );
        }

        docx.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)))
    }

    /// Add capacity planning section
    fn add_capacity_section(
        &self,
        mut docx: Docx,
        _project: &MigrationProject,
        clusters: &[MigrationCluster],
        placements: &[VMPlacement],
    ) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("4. Capacity Planning").size(40).bold())
            )
            .add_paragraph(Paragraph::new());

        for cluster in clusters {
            let cluster_placements: Vec<_> = placements
                .iter()
                .filter(|p| p.cluster_id == cluster.id)
                .collect();

            let used_cpu: f64 = cluster_placements.iter().map(|p| p.assigned_cpu).sum();
            let used_memory: f64 = cluster_placements.iter().map(|p| p.assigned_memory_gb).sum();
            let used_storage: f64 = cluster_placements.iter().map(|p| p.assigned_storage_gb).sum();

            docx = docx
                .add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&format!("{} Capacity", cluster.cluster_name)).size(28).bold())
                )
                .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• VMs Assigned: {}", cluster_placements.len()))))
                .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• CPU Used: {:.1} cores", used_cpu))))
                .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Memory Used: {:.1} GB", used_memory))))
                .add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("• Storage Used: {:.1} GB", used_storage))))
                .add_paragraph(Paragraph::new());
        }

        docx.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)))
    }

    /// Add network design section
    fn add_network_section(&self, mut docx: Docx, project: &MigrationProject) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("5. Network Design").size(40).bold())
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Network Architecture").size(28).bold())
            )
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("The network design ensures seamless connectivity between source and destination environments during and after migration."))
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Key Network Components:").bold())
            )
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• VLAN configuration and mapping")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Subnet allocation and IP addressing")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Gateway and routing configuration")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• DNS and name resolution")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Security groups and firewalls")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        docx
    }

    /// Add migration runbook section
    fn add_runbook_section(
        &self,
        mut docx: Docx,
        project: &MigrationProject,
        placements: &[VMPlacement],
    ) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("6. Migration Runbook").size(40).bold())
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Migration Approach").size(28).bold())
            )
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&format!(
                        "This migration will follow a {} approach, migrating {} workloads in planned waves.",
                        project.migration_strategy.as_deref().unwrap_or("phased"),
                        placements.len()
                    )))
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Migration Phases:").bold())
            )
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("1. Pre-Migration Preparation")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Infrastructure provisioning")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Network configuration")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Backup and validation")))
            .add_paragraph(Paragraph::new())
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("2. Migration Execution")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • VM replication")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Cutover scheduling")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Validation testing")))
            .add_paragraph(Paragraph::new())
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("3. Post-Migration Activities")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Performance monitoring")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Issue resolution")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("   • Decommissioning")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        docx
    }

    /// Add appendices section
    fn add_appendices_section(&self, mut docx: Docx, _project: &MigrationProject) -> Docx {
        docx = docx
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("7. Appendices").size(40).bold())
            )
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Appendix A: Assumptions and Constraints").size(28).bold())
            )
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Network connectivity available during migration")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Sufficient bandwidth for data transfer")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Access credentials provided")))
            .add_paragraph(Paragraph::new())
            .add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("Appendix B: Risks and Mitigations").size(28).bold())
            )
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Risk: Extended downtime")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("  Mitigation: Scheduled maintenance windows")))
            .add_paragraph(Paragraph::new())
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("• Risk: Data loss during transfer")))
            .add_paragraph(Paragraph::new().add_run(Run::new().add_text("  Mitigation: Backup and validation procedures")));

        docx
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hld_generation_request_default() {
        let request = HLDGenerationRequest::default();
        assert!(request.include_executive_summary);
        assert!(request.include_inventory);
        assert!(request.include_architecture);
        assert!(request.include_capacity_planning);
        assert!(request.include_network_design);
        assert!(request.include_migration_runbook);
        assert!(request.include_appendices);
    }

    #[test]
    fn test_hld_generation_request_custom() {
        let request = HLDGenerationRequest {
            project_id: "test-project".to_string(),
            include_executive_summary: true,
            include_inventory: false,
            include_architecture: true,
            include_capacity_planning: false,
            include_network_design: true,
            include_migration_runbook: false,
            include_appendices: true,
        };

        assert!(request.include_executive_summary);
        assert!(!request.include_inventory);
        assert!(request.include_architecture);
    }
}
