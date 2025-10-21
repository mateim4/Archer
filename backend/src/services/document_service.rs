use crate::database::AppState;
use crate::models::workflow::*;
use chrono::Utc;
use docx_rs::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use surrealdb::sql::Thing;
use uuid::Uuid;

/// Document generation service for project workflow system
pub struct DocumentService;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentGenerationRequest {
    pub document_type: DocumentType,
    pub document_name: String,
    pub template_name: Option<String>,
    pub workflow_id: Option<Thing>,
    pub config: DocumentGenerationConfig,
    pub source_data: Option<DocumentSourceData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentSourceData {
    pub rvtools_data: Option<String>, // Path to RVTools analysis
    pub hardware_selection: Option<Vec<HardwareSelection>>,
    pub capacity_analysis: Option<CapacityAnalysisData>,
    pub network_config: Option<NetworkConfigData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareSelection {
    pub hardware_lot_id: String,
    pub quantity: u32,
    pub allocated_to: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapacityAnalysisData {
    pub total_vcpus: u32,
    pub total_memory_gb: u32,
    pub total_storage_gb: u32,
    pub vm_count: u32,
    pub host_count: u32,
    pub cluster_count: u32,
    pub overcommit_ratios: HashMap<String, f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkConfigData {
    pub vlans: Vec<VlanConfig>,
    pub subnets: Vec<SubnetConfig>,
    pub routing_config: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VlanConfig {
    pub vlan_id: u16,
    pub name: String,
    pub description: String,
    pub subnet: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetConfig {
    pub network: String,
    pub mask: String,
    pub gateway: String,
    pub dns_servers: Vec<String>,
}

impl DocumentService {
    /// Initialize document storage directories
    pub fn init_storage() -> anyhow::Result<()> {
        let base_path = Self::get_documents_base_path();
        fs::create_dir_all(&base_path)?;
        fs::create_dir_all(base_path.join("templates"))?;
        fs::create_dir_all(base_path.join("generated"))?;
        Ok(())
    }

    /// Get the base path for document storage
    pub fn get_documents_base_path() -> PathBuf {
        PathBuf::from("./documents")
    }

    /// Generate a document based on the request
    pub async fn generate_document(
        app_state: &AppState,
        project_id: &str,
        request: DocumentGenerationRequest,
    ) -> anyhow::Result<ProjectDocument> {
        // Create unique filename
        let file_id = Uuid::new_v4().to_string();
        let file_name = format!(
            "{}-{}.docx",
            request.document_name.replace(' ', "_").to_lowercase(),
            file_id
        );

        let documents_path = Self::get_documents_base_path().join("generated");
        let file_path = documents_path.join(&file_name);

        // Generate document content based on type
        let document_bytes = match request.document_type {
            DocumentType::Hld => Self::generate_hld_document(&request).await?,
            DocumentType::Lld => Self::generate_lld_document(&request).await?,
            DocumentType::HardwareBoM => Self::generate_bom_document(&request).await?,
            DocumentType::MigrationPlan => Self::generate_migration_plan(&request).await?,
            DocumentType::NetworkDiagram => Self::generate_network_diagram(&request).await?,
            DocumentType::DeploymentPlan => Self::generate_deployment_plan(&request).await?,
            DocumentType::Custom => Self::generate_custom_document(&request).await?,
        };

        // Write document to file
        fs::write(&file_path, &document_bytes)?;

        // Create document record
        let document = ProjectDocument {
            id: None,
            project_id: Thing::from(("project_workflow", project_id)),
            workflow_id: request.workflow_id,
            document_type: request.document_type,
            document_name: request.document_name,
            file_path: file_path.to_string_lossy().to_string(),
            file_size: document_bytes.len() as u64,
            version: "1.0".to_string(),
            status: DocumentStatus::Draft,
            generated_from_template: request.template_name,
            generation_config: Some(request.config),
            generated_at: Some(Utc::now()),
            generated_by: Some("system".to_string()),
            approved_by: None,
            approval_date: None,
            metadata: HashMap::new(),
            created_at: Utc::now(),
        };

        // Save to database
        let created_document: ProjectDocument = app_state
            .as_ref()
            .create("project_document")
            .content(&document)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to create document record: {}", e))?
            .into_iter()
            .next()
            .ok_or_else(|| anyhow::anyhow!("No document created"))?;

        Ok(created_document)
    }

    /// Generate HLD document
    async fn generate_hld_document(request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        // For now, create a simple HLD template
        // In a real implementation, this would parse RVTools data and generate using the core engine

        if let Some(source_data) = &request.source_data {
            // If we have real data, try to use core engine (would need data conversion)
            // For now, generate a basic document
            Self::generate_basic_hld(request, source_data).await
        } else {
            // Generate template HLD
            Self::generate_template_hld(request).await
        }
    }

    /// Generate LLD document
    async fn generate_lld_document(request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        // For now, create a simple LLD template
        if let Some(source_data) = &request.source_data {
            Self::generate_basic_lld(request, source_data).await
        } else {
            Self::generate_template_lld(request).await
        }
    }

    /// Generate Bill of Materials document
    async fn generate_bom_document(request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        Self::generate_bom_from_hardware_selection(request).await
    }

    /// Generate Migration Plan document
    async fn generate_migration_plan(
        request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Self::generate_migration_plan_document(request).await
    }

    /// Generate Network Diagram
    async fn generate_network_diagram(
        request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Self::generate_network_diagram_document(request).await
    }

    /// Generate Deployment Plan
    async fn generate_deployment_plan(
        request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Self::generate_deployment_plan_document(request).await
    }

    /// Generate Custom document
    async fn generate_custom_document(
        request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Self::generate_custom_template(request).await
    }

    /// List documents for a project
    pub async fn list_project_documents(
        app_state: &AppState,
        project_id: &str,
    ) -> anyhow::Result<Vec<ProjectDocument>> {
        let documents: Vec<ProjectDocument> = app_state
            .as_ref()
            .select("project_document")
            .await
            .map_err(|e| anyhow::anyhow!("Failed to query documents: {}", e))?
            .into_iter()
            .filter(|doc: &ProjectDocument| match &doc.project_id {
                Thing { tb: _, id } => id.to_string() == project_id,
            })
            .collect();

        Ok(documents)
    }

    /// Get document by ID
    pub async fn get_document(
        app_state: &AppState,
        document_id: &str,
    ) -> anyhow::Result<Option<ProjectDocument>> {
        let document: Option<ProjectDocument> = app_state
            .as_ref()
            .select(("project_document", document_id))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to get document: {}", e))?;

        Ok(document)
    }

    /// Delete document
    pub async fn delete_document(app_state: &AppState, document_id: &str) -> anyhow::Result<()> {
        // Get document to get file path
        if let Some(document) = Self::get_document(app_state, document_id).await? {
            // Delete file
            if Path::new(&document.file_path).exists() {
                fs::remove_file(&document.file_path)?;
            }
        }

        // Delete from database
        let _: Option<ProjectDocument> = app_state
            .as_ref()
            .delete(("project_document", document_id))
            .await
            .map_err(|e| anyhow::anyhow!("Failed to delete document: {}", e))?;

        Ok(())
    }

    // Helper methods for generating specific document types

    async fn generate_basic_hld(
        request: &DocumentGenerationRequest,
        source_data: &DocumentSourceData,
    ) -> anyhow::Result<Vec<u8>> {
        if let Some(capacity_data) = &source_data.capacity_analysis {
            Self::generate_professional_hld_with_data(request, capacity_data).await
        } else {
            Self::generate_sample_hld(request).await
        }
    }

    async fn generate_template_hld(request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        Self::generate_sample_hld(request).await
    }

    /// Generate a professional HLD document using docx-rs
    async fn generate_professional_hld_with_data(
        request: &DocumentGenerationRequest,
        capacity_data: &CapacityAnalysisData,
    ) -> anyhow::Result<Vec<u8>> {
        let mut doc = Docx::new();

        // Add title page
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("High-Level Design")
                        .size(36)
                        .bold()
                        .color("2E86C1"),
                )
                .align(AlignmentType::Center),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Infrastructure Migration Project")
                        .size(24)
                        .bold(),
                )
                .align(AlignmentType::Center),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!(
                            "Generated: {}",
                            chrono::Utc::now().format("%B %d, %Y")
                        ))
                        .size(14)
                        .italic(),
                )
                .align(AlignmentType::Center),
        );

        // Add page break
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        // Add executive summary
        doc = doc.add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text("Executive Summary")
                    .size(20)
                    .bold()
                    .color("2E86C1"),
            ),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!(
                            "This document outlines the high-level design for migrating {} virtual machines \
                            across {} hosts with a total capacity of {} vCPUs and {} GB memory. The target \
                            architecture has been designed to accommodate current workloads with {} GB storage \
                            and provision for future growth.",
                            capacity_data.vm_count,
                            capacity_data.host_count,
                            capacity_data.total_vcpus,
                            capacity_data.total_memory_gb,
                            capacity_data.total_storage_gb
                        ))
                )
        );

        // Add capacity summary table
        doc = Self::add_capacity_summary_table(doc, capacity_data)?;

        // Add architecture overview
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        doc = doc.add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text("Target Architecture Overview")
                    .size(20)
                    .bold()
                    .color("2E86C1"),
            ),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("The target infrastructure consists of modern hyperconverged infrastructure \
                        designed for optimal performance, scalability, and resilience. Key architectural \
                        components include:")
                )
        );

        // Add architecture components list
        let architecture_components = vec![
            "Compute: High-performance servers with latest generation processors",
            "Storage: NVMe-based storage subsystem with built-in redundancy",
            "Network: 25GbE connectivity with redundant switching infrastructure",
            "Management: Centralized management platform with automation capabilities",
            "Security: Comprehensive security framework with micro-segmentation",
        ];

        for component in architecture_components {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&format!("• {}", component)))
                    .indent(Some(720), None, None, None),
            );
        }

        // Generate document bytes
        let mut buf = std::io::Cursor::new(Vec::new());
        doc.build().pack(&mut buf)?;
        Ok(buf.into_inner())
    }

    /// Generate a sample HLD with mock data
    async fn generate_sample_hld(_request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        let sample_capacity = CapacityAnalysisData {
            total_vcpus: 256,
            total_memory_gb: 1024,
            total_storage_gb: 10240,
            vm_count: 50,
            host_count: 4,
            cluster_count: 1,
            overcommit_ratios: {
                let mut ratios = HashMap::new();
                ratios.insert("cpu".to_string(), 2.0);
                ratios.insert("memory".to_string(), 1.5);
                ratios
            },
        };

        Self::generate_professional_hld_with_data(_request, &sample_capacity).await
    }

    /// Add a professional capacity summary table
    fn add_capacity_summary_table(
        mut doc: Docx,
        capacity_data: &CapacityAnalysisData,
    ) -> anyhow::Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text("Current Environment Summary")
                    .size(16)
                    .bold(),
            ),
        );

        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Resource").bold()),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Current Capacity").bold()),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Target Capacity").bold()),
                ),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Virtual Machines")),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.vm_count.to_string())),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.vm_count.to_string())),
                ),
            ]),
            TableRow::new(vec![
                TableCell::new()
                    .add_paragraph(Paragraph::new().add_run(Run::new().add_text("Physical Hosts"))),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.host_count.to_string())),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&(capacity_data.host_count + 1).to_string())),
                ),
            ]),
            TableRow::new(vec![
                TableCell::new()
                    .add_paragraph(Paragraph::new().add_run(Run::new().add_text("vCPU Cores"))),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.total_vcpus.to_string())),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(
                        Run::new().add_text(&(capacity_data.total_vcpus + 64).to_string()),
                    ),
                ),
            ]),
            TableRow::new(vec![
                TableCell::new()
                    .add_paragraph(Paragraph::new().add_run(Run::new().add_text("Memory (GB)"))),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.total_memory_gb.to_string())),
                ),
                TableCell::new().add_paragraph(Paragraph::new().add_run(
                    Run::new().add_text(&(capacity_data.total_memory_gb + 512).to_string()),
                )),
            ]),
            TableRow::new(vec![
                TableCell::new()
                    .add_paragraph(Paragraph::new().add_run(Run::new().add_text("Storage (GB)"))),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.total_storage_gb.to_string())),
                ),
                TableCell::new().add_paragraph(Paragraph::new().add_run(
                    Run::new().add_text(&(capacity_data.total_storage_gb + 2048).to_string()),
                )),
            ]),
        ]);

        doc = doc.add_table(table);
        Ok(doc)
    }

    async fn generate_basic_lld(
        request: &DocumentGenerationRequest,
        source_data: &DocumentSourceData,
    ) -> anyhow::Result<Vec<u8>> {
        if let Some(capacity_data) = &source_data.capacity_analysis {
            Self::generate_professional_lld_with_data(request, capacity_data).await
        } else {
            Self::generate_sample_lld(request).await
        }
    }

    async fn generate_template_lld(request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        Self::generate_sample_lld(request).await
    }

    /// Generate a professional LLD document using docx-rs
    async fn generate_professional_lld_with_data(
        request: &DocumentGenerationRequest,
        capacity_data: &CapacityAnalysisData,
    ) -> anyhow::Result<Vec<u8>> {
        let mut doc = Docx::new();

        // Add title page
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Low-Level Design")
                        .size(36)
                        .bold()
                        .color("E74C3C"),
                )
                .align(AlignmentType::Center),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Technical Implementation Details")
                        .size(24)
                        .bold(),
                )
                .align(AlignmentType::Center),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!(
                            "Generated: {}",
                            chrono::Utc::now().format("%B %d, %Y")
                        ))
                        .size(14)
                        .italic(),
                )
                .align(AlignmentType::Center),
        );

        // Add page break
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        // Add detailed configuration sections
        doc = doc.add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text("Server Configuration Details")
                    .size(20)
                    .bold()
                    .color("E74C3C"),
            ),
        );

        // Add server configuration table
        doc = Self::add_server_configuration_table(doc, capacity_data)?;

        // Add network configuration section
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        doc = doc.add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text("Network Configuration")
                    .size(20)
                    .bold()
                    .color("E74C3C"),
            ),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("The network infrastructure supports high-performance connectivity with redundancy \
                        and security. Configuration includes management networks, VM networks, and storage networks \
                        with appropriate VLAN segmentation.")
                )
        );

        // Generate document bytes
        let mut buf = std::io::Cursor::new(Vec::new());
        doc.build().pack(&mut buf)?;
        Ok(buf.into_inner())
    }

    /// Generate a sample LLD with mock data
    async fn generate_sample_lld(_request: &DocumentGenerationRequest) -> anyhow::Result<Vec<u8>> {
        let sample_capacity = CapacityAnalysisData {
            total_vcpus: 256,
            total_memory_gb: 1024,
            total_storage_gb: 10240,
            vm_count: 50,
            host_count: 4,
            cluster_count: 1,
            overcommit_ratios: {
                let mut ratios = HashMap::new();
                ratios.insert("cpu".to_string(), 2.0);
                ratios.insert("memory".to_string(), 1.5);
                ratios
            },
        };

        Self::generate_professional_lld_with_data(_request, &sample_capacity).await
    }

    /// Add a server configuration table
    fn add_server_configuration_table(
        mut doc: Docx,
        capacity_data: &CapacityAnalysisData,
    ) -> anyhow::Result<Docx> {
        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Server Role").bold()),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Quantity").bold()),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("vCPU per Host").bold()),
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Memory per Host (GB)").bold()),
                ),
            ]),
            TableRow::new(vec![
                TableCell::new()
                    .add_paragraph(Paragraph::new().add_run(Run::new().add_text("Compute Hosts"))),
                TableCell::new().add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&capacity_data.host_count.to_string())),
                ),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    &(capacity_data.total_vcpus / capacity_data.host_count).to_string(),
                ))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    &(capacity_data.total_memory_gb / capacity_data.host_count).to_string(),
                ))),
            ]),
        ]);

        doc = doc.add_table(table);
        Ok(doc)
    }

    async fn generate_bom_from_hardware_selection(
        _request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Ok(b"BoM Document Placeholder - Hardware selection integration needed".to_vec())
    }

    async fn generate_migration_plan_document(
        _request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Ok(b"Migration Plan Placeholder - Workflow integration needed".to_vec())
    }

    async fn generate_network_diagram_document(
        _request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Ok(b"Network Diagram Placeholder - Network config integration needed".to_vec())
    }

    async fn generate_deployment_plan_document(
        _request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        Ok(b"Deployment Plan Placeholder - Workflow integration needed".to_vec())
    }

    async fn generate_custom_template(
        _request: &DocumentGenerationRequest,
    ) -> anyhow::Result<Vec<u8>> {
        let mut doc = Docx::new();

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("Custom Document").size(24).bold())
                .align(AlignmentType::Center),
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("This is a custom document template that can be extended based on specific requirements.")
                )
        );

        let mut buf = std::io::Cursor::new(Vec::new());
        doc.build().pack(&mut buf)?;
        Ok(buf.into_inner())
    }
}
