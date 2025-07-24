use crate::models::*;
use crate::{Result, CoreEngineError};
use docx_rs::*;
use std::collections::HashMap;

/// Document generation engine for HLD and LLD documents
pub struct DocumentGenerator;

impl DocumentGenerator {
    /// Generate High-Level Design document
    pub fn generate_hld(
        environment: &VsphereEnvironment,
        sizing_result: &SizingResult,
        translation_result: &TranslationResult,
        tco_analysis: Option<&TcoAnalysis>,
        _template_data: Option<&DocumentTemplate>,
    ) -> Result<Vec<u8>> {
        let mut doc = Docx::new();

        // Add title page
        doc = Self::add_hld_title_page(doc, &translation_result.source_cluster)?;

        // Add executive summary
        doc = Self::add_hld_executive_summary(doc, environment, sizing_result, translation_result)?;

        // Add source environment summary
        doc = Self::add_hld_source_summary(doc, environment)?;

        // Add target architecture overview
        doc = Self::add_hld_target_architecture(doc, sizing_result, translation_result)?;

        // Add compute design
        doc = Self::add_hld_compute_design(doc, sizing_result)?;

        // Add storage design
        doc = Self::add_hld_storage_design(doc, &translation_result.target_cluster_config.storage_config)?;

        // Add network design
        doc = Self::add_hld_network_design(doc, &translation_result.target_cluster_config.network_config)?;

        // Add TCO analysis if provided
        if let Some(tco) = tco_analysis {
            doc = Self::add_hld_tco_analysis(doc, tco)?;
        }

        // Add migration approach
        doc = Self::add_hld_migration_approach(doc, &translation_result.manual_intervention_required)?;

        // Generate document bytes
        let mut buf = std::io::Cursor::new(Vec::new());
        doc.build().pack(&mut buf).map_err(|e| CoreEngineError::Io(format!("Failed to pack document: {}", e)))?;
        Ok(buf.into_inner())
    }

    /// Generate Low-Level Design document
    pub fn generate_lld(
        _environment: &VsphereEnvironment,
        _sizing_result: &SizingResult,
        translation_result: &TranslationResult,
        _template_data: Option<&DocumentTemplate>,
    ) -> Result<Vec<u8>> {
        let mut doc = Docx::new();

        // Add title page
        doc = Self::add_lld_title_page(doc, &translation_result.source_cluster)?;

        // Add detailed host configuration
        doc = Self::add_lld_host_configuration(doc, &translation_result.target_cluster_config.hosts)?;

        // Add cluster configuration
        doc = Self::add_lld_cluster_configuration(doc, &translation_result.target_cluster_config)?;

        // Add detailed storage configuration
        doc = Self::add_lld_storage_configuration(doc, &translation_result.target_cluster_config.storage_config)?;

        // Add detailed network configuration
        doc = Self::add_lld_network_configuration(doc, &translation_result.target_cluster_config.network_config, &translation_result.network_translations)?;

        // Add VM placement and configuration
        doc = Self::add_lld_vm_configuration(doc, &translation_result.vm_translations)?;

        // Add PowerShell configuration scripts
        doc = Self::add_lld_configuration_scripts(doc, translation_result)?;

        // Add migration checklist
        doc = Self::add_lld_migration_checklist(doc, &translation_result.manual_intervention_required)?;

        // Generate document bytes
        let mut buf = std::io::Cursor::new(Vec::new());
        doc.build().pack(&mut buf).map_err(|e| CoreEngineError::Io(format!("Failed to pack document: {}", e)))?;
        Ok(buf.into_inner())
    }

    /// Add HLD title page
    fn add_hld_title_page(mut doc: Docx, cluster_name: &str) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("High-Level Design"))
                        .size(28)
                        .bold()
                )
                .align(AlignmentType::Center)
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("VMware to Microsoft Migration"))
                        .size(20)
                        .bold()
                )
                .align(AlignmentType::Center)
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("Source Cluster: {}", cluster_name))
                        .size(16)
                )
                .align(AlignmentType::Center)
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("Generated: {}", chrono::Utc::now().format("%Y-%m-%d")))
                        .size(12)
                )
                .align(AlignmentType::Center)
        );

        // Add page break
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        Ok(doc)
    }

    /// Add HLD executive summary
    fn add_hld_executive_summary(
        mut doc: Docx,
        environment: &VsphereEnvironment,
        sizing_result: &SizingResult,
        translation_result: &TranslationResult,
    ) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("1. Executive Summary").size(18).bold())
        );

        let summary_text = format!(
            "This document outlines the migration plan for the '{}' VMware vSphere cluster to a Microsoft {} platform. \
            The analysis indicates that {} physical hosts using {} hardware will be required to accommodate the workload. \
            The migration involves {} virtual machines with a total of {} vCPUs and {:.0} GB of memory.",
            translation_result.source_cluster,
            match translation_result.target_platform {
                TargetPlatform::HyperVCluster => "Hyper-V Failover Cluster",
                TargetPlatform::AzureLocal => "Azure Local",
            },
            sizing_result.required_hosts,
            sizing_result.hardware_profile.name,
            translation_result.vm_translations.len(),
            translation_result.vm_translations.iter().map(|t| t.target_vcpu).sum::<u32>(),
            translation_result.vm_translations.iter().map(|t| t.target_memory_gb).sum::<u32>() as f64
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&summary_text))
        );

        // Add key metrics table
        doc = Self::add_summary_metrics_table(doc, environment, sizing_result)?;

        Ok(doc)
    }

    /// Add summary metrics table
    fn add_summary_metrics_table(
        mut doc: Docx,
        environment: &VsphereEnvironment,
        sizing_result: &SizingResult,
    ) -> Result<Docx> {
        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Metric").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Current").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Target").bold())),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Physical Hosts"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&environment.total_hosts.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&sizing_result.required_hosts.to_string()))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Total vCPUs"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&environment.summary_metrics.total_vcpus.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&environment.summary_metrics.total_vcpus.to_string()))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Total Memory (GB)"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("{:.0}", environment.summary_metrics.total_provisioned_memory_gb)))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("{:.0}", environment.summary_metrics.total_provisioned_memory_gb)))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("CPU Utilization"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("{:.1}%", environment.summary_metrics.overall_vcpu_pcpu_ratio * 25.0)))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("{:.1}%", sizing_result.utilization_metrics.cpu_utilization_percent)))),
            ]),
        ]);

        doc = doc.add_table(table);
        Ok(doc)
    }

    /// Add source environment summary
    fn add_hld_source_summary(mut doc: Docx, environment: &VsphereEnvironment) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("2. Source Environment Summary").size(18).bold())
        );

        let summary_text = format!(
            "The source VMware vSphere environment consists of {} clusters with a total of {} hosts and {} virtual machines. \
            The environment has {} total physical CPU cores and {:.0} GB of total memory capacity. \
            Current vCPU to pCPU ratio is {:.1}:1.",
            environment.clusters.len(),
            environment.total_hosts,
            environment.total_vms,
            environment.summary_metrics.total_pcores,
            environment.summary_metrics.total_provisioned_memory_gb,
            environment.summary_metrics.overall_vcpu_pcpu_ratio
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&summary_text))
        );

        // Add cluster breakdown
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("2.1. Cluster Breakdown").size(14).bold())
        );

        for cluster in &environment.clusters {
            let cluster_text = format!(
                "• Cluster '{}': {} hosts, {} VMs, {} cores, {:.0} GB memory",
                cluster.name,
                cluster.hosts.len(),
                cluster.vms.len(),
                cluster.metrics.total_pcpu_cores,
                cluster.metrics.provisioned_memory_gb
            );

            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&cluster_text))
            );
        }

        Ok(doc)
    }

    /// Add target architecture overview
    fn add_hld_target_architecture(
        mut doc: Docx,
        sizing_result: &SizingResult,
        translation_result: &TranslationResult,
    ) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("3. Target Architecture Overview").size(18).bold())
        );

        let platform_description = match translation_result.target_platform {
            TargetPlatform::HyperVCluster => {
                "The target solution is a Microsoft Hyper-V Failover Cluster providing high availability \
                for virtualized workloads. The cluster will utilize Windows Server with Hyper-V role and \
                Failover Clustering feature."
            }
            TargetPlatform::AzureLocal => {
                "The target solution is a Microsoft Azure Local (Azure Stack HCI) cluster providing \
                hyperconverged infrastructure with integrated compute, storage, and networking. \
                Azure Local delivers cloud services on-premises with Azure Arc integration."
            }
        };

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(platform_description))
        );

        let architecture_text = format!(
            "The proposed architecture consists of {} {} servers configured in a failover cluster. \
            Each server provides {} CPU cores and {} GB of memory. The cluster will use {} \
            for storage and Switch Embedded Teaming (SET) for network redundancy.",
            sizing_result.required_hosts,
            sizing_result.hardware_profile.name,
            sizing_result.hardware_profile.total_cores,
            sizing_result.hardware_profile.max_memory_gb,
            match translation_result.target_cluster_config.storage_config.storage_type {
                StorageType::StorageSpacesDirect => "Storage Spaces Direct",
                StorageType::ExternalSan => "External SAN",
                StorageType::DirectAttached => "Direct Attached Storage",
            }
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&architecture_text))
        );

        Ok(doc)
    }

    /// Add compute design section
    fn add_hld_compute_design(mut doc: Docx, sizing_result: &SizingResult) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("4. Compute Design").size(18).bold())
        );

        let compute_text = format!(
            "The compute design is based on {} {} servers. Each server is equipped with {} CPU sockets, \
            {} cores per socket, for a total of {} cores per server. Memory capacity is {} GB per server. \
            \n\nThe sizing calculation results in:\n\
            • Total cluster CPU cores: {} cores\n\
            • Total cluster memory: {} GB\n\
            • CPU utilization: {:.1}%\n\
            • Memory utilization: {:.1}%\n\
            • HA compliance: {}",
            sizing_result.required_hosts,
            sizing_result.hardware_profile.name,
            sizing_result.hardware_profile.cpu_sockets,
            sizing_result.hardware_profile.cores_per_socket,
            sizing_result.hardware_profile.total_cores,
            sizing_result.hardware_profile.max_memory_gb,
            sizing_result.hardware_profile.total_cores * sizing_result.required_hosts,
            sizing_result.hardware_profile.max_memory_gb * sizing_result.required_hosts,
            sizing_result.utilization_metrics.cpu_utilization_percent,
            sizing_result.utilization_metrics.memory_utilization_percent,
            if sizing_result.utilization_metrics.n_plus_x_compliance { "Yes" } else { "No" }
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&compute_text))
        );

        // Add warnings if any
        if !sizing_result.warnings.is_empty() {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("4.1. Sizing Considerations").size(14).bold())
            );

            for warning in &sizing_result.warnings {
                doc = doc.add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&format!("⚠ {}", warning)))
                );
            }
        }

        Ok(doc)
    }

    /// Add storage design section
    fn add_hld_storage_design(mut doc: Docx, storage_config: &StorageConfig) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("5. Storage Design").size(18).bold())
        );

        let storage_description = match storage_config.storage_type {
            StorageType::StorageSpacesDirect => {
                "The storage design utilizes Storage Spaces Direct (S2D) to create a hyperconverged \
                storage solution. S2D pools locally attached storage devices across cluster nodes \
                to provide high-performance, highly available storage for virtual machines."
            }
            StorageType::ExternalSan => {
                "The storage design utilizes external SAN storage connected to all cluster nodes \
                via Fibre Channel or iSCSI protocols."
            }
            StorageType::DirectAttached => {
                "The storage design utilizes direct attached storage on each node."
            }
        };

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(storage_description))
        );

        let capacity_text = format!(
            "Storage Configuration:\n\
            • Storage Type: {:?}\n\
            • Resiliency: {:?}\n\
            • Total Raw Capacity: {:.1} GB\n\
            • Usable Capacity: {:.1} GB\n\
            • Efficiency: {:.1}%",
            storage_config.storage_type,
            storage_config.resiliency_type,
            storage_config.total_capacity_gb,
            storage_config.usable_capacity_gb,
            (storage_config.usable_capacity_gb / storage_config.total_capacity_gb) * 100.0
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&capacity_text))
        );

        // Add CSV volumes
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("5.1. Cluster Shared Volumes").size(14).bold())
        );

        for csv in &storage_config.csv_volumes {
            let csv_text = format!(
                "• {}: {:.1} GB ({})",
                csv.name,
                csv.size_gb,
                csv.purpose
            );

            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&csv_text))
            );
        }

        Ok(doc)
    }

    /// Add network design section
    fn add_hld_network_design(mut doc: Docx, network_config: &NetworkConfig) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6. Network Design").size(18).bold())
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(
                    "The network design provides converged networking using Hyper-V virtual switches \
                    with Switch Embedded Teaming (SET) for redundancy and performance. \
                    Network traffic is segmented using VLANs for security and performance isolation."
                ))
        );

        // Add virtual switches
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6.1. Virtual Switches").size(14).bold())
        );

        for vswitch in &network_config.virtual_switches {
            let switch_text = format!(
                "• {}: {:?} switch with SET teaming ({})",
                vswitch.name,
                vswitch.switch_type,
                vswitch.physical_adapters.join(", ")
            );

            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&switch_text))
            );
        }

        // Add logical networks
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6.2. Logical Networks").size(14).bold())
        );

        for network in &network_config.logical_networks {
            let network_text = format!(
                "• {} (VLAN {}): {:?}",
                network.name,
                network.vlan_id.map(|v| v.to_string()).unwrap_or_else(|| "Untagged".to_string()),
                network.purpose
            );

            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&network_text))
            );
        }

        Ok(doc)
    }

    /// Add TCO analysis section
    fn add_hld_tco_analysis(mut doc: Docx, tco: &TcoAnalysis) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("7. Total Cost of Ownership Analysis").size(18).bold())
        );

        let tco_text = format!(
            "The TCO analysis compares the current VMware environment costs with the proposed Microsoft solution:\n\n\
            Current Annual Costs:\n\
            • Hardware: ${:.0}\n\
            • Software Licensing: ${:.0}\n\
            • Datacenter: ${:.0}\n\
            • Personnel: ${:.0}\n\
            • Total Annual: ${:.0}\n\n\
            Target Annual Costs:\n\
            • Software Licensing: ${:.0}\n\
            • Ongoing Operational: ${:.0}\n\
            • Total Annual: ${:.0}\n\n\
            Financial Impact:\n\
            • Annual Savings: ${:.0}\n\
            • Payback Period: {:.1} months\n\
            • 3-Year Savings: ${:.0}",
            tco.current_environment_costs.hardware_annual,
            tco.current_environment_costs.software_licensing_annual,
            tco.current_environment_costs.datacenter_annual,
            tco.current_environment_costs.personnel_annual,
            tco.current_environment_costs.total_annual,
            tco.target_environment_costs.software_licensing_annual,
            tco.target_environment_costs.ongoing_operational_annual,
            tco.target_environment_costs.total_annual,
            tco.savings_analysis.annual_savings,
            tco.payback_period_months,
            tco.savings_analysis.three_year_savings
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&tco_text))
        );

        Ok(doc)
    }

    /// Add migration approach section
    fn add_hld_migration_approach(mut doc: Docx, manual_interventions: &[ManualInterventionItem]) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("8. Migration Approach").size(18).bold())
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(
                    "The migration will follow a phased approach with careful planning and validation. \
                    Most virtual machines can be migrated using automated tools, but some require manual intervention."
                ))
        );

        if !manual_interventions.is_empty() {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("8.1. Manual Intervention Required").size(14).bold())
            );

            for item in manual_interventions {
                let priority_text = match item.priority {
                    Priority::Critical => "🔴 CRITICAL",
                    Priority::High => "🟡 HIGH",
                    Priority::Medium => "🟠 MEDIUM",
                    Priority::Low => "🟢 LOW",
                };

                let intervention_text = format!(
                    "• {} - {}: {}\n  Recommendation: {}",
                    priority_text,
                    format!("{:?}", item.category).replace("_", " "),
                    item.description,
                    item.recommendation
                );

                doc = doc.add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&intervention_text))
                );
            }
        }

        Ok(doc)
    }

    /// Add LLD title page
    fn add_lld_title_page(mut doc: Docx, cluster_name: &str) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Low-Level Design")
                        .size(28)
                        .bold()
                )
                .align(AlignmentType::Center)
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("Implementation Guide"))
                        .size(20)
                        .bold()
                )
                .align(AlignmentType::Center)
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&format!("Source Cluster: {}", cluster_name))
                        .size(16)
                )
                .align(AlignmentType::Center)
        );

        // Add page break
        doc = doc.add_paragraph(Paragraph::new().add_run(Run::new().add_break(BreakType::Page)));

        Ok(doc)
    }

    /// Add detailed host configuration
    fn add_lld_host_configuration(mut doc: Docx, hosts: &[TargetHost]) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("1. Host Configuration").size(18).bold())
        );

        // Create host configuration table
        let mut table_rows = vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Host Name").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Hardware Model").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("CPU Cores").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Memory (GB)").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Assigned VMs").bold())),
            ])
        ];

        for host in hosts {
            table_rows.push(TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&host.name))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&host.hardware_profile.model))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&host.hardware_profile.total_cores.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&host.hardware_profile.max_memory_gb.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&host.assigned_vms.len().to_string()))),
            ]));
        }

        doc = doc.add_table(Table::new(table_rows));

        Ok(doc)
    }

    /// Add cluster configuration
    fn add_lld_cluster_configuration(mut doc: Docx, target_config: &TargetClusterConfig) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("2. Failover Cluster Configuration").size(18).bold())
        );

        let cluster_text = format!(
            "Cluster Name: {}\n\
            Quorum Type: {:?}\n\
            HA Policy: {:?}\n\
            Heartbeat Networks: {}",
            target_config.cluster_name,
            target_config.ha_config.quorum_config.quorum_type,
            target_config.ha_config.policy,
            target_config.ha_config.heartbeat_networks.join(", ")
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&cluster_text))
        );

        if let Some(witness) = &target_config.ha_config.quorum_config.witness_config {
            let witness_text = format!(
                "Witness Configuration:\n\
                • Type: {:?}\n\
                • Path/URL: {}",
                witness.witness_type,
                witness.path_or_url
            );

            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(&witness_text))
            );
        }

        Ok(doc)
    }

    /// Add detailed storage configuration
    fn add_lld_storage_configuration(mut doc: Docx, storage_config: &StorageConfig) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("3. Storage Configuration").size(18).bold())
        );

        // Add CSV configuration table
        let mut csv_rows = vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("CSV Name").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Size (GB)").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("File System").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Purpose").bold())),
            ])
        ];

        for csv in &storage_config.csv_volumes {
            csv_rows.push(TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&csv.name))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&format!("{:.0}", csv.size_gb)))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&csv.file_system))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&csv.purpose))),
            ]));
        }

        doc = doc.add_table(Table::new(csv_rows));

        Ok(doc)
    }

    /// Add detailed network configuration
    fn add_lld_network_configuration(
        mut doc: Docx,
        _network_config: &NetworkConfig,
        network_translations: &[NetworkTranslation],
    ) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("4. Network Configuration").size(18).bold())
        );

        // Add network translation table
        let mut network_rows = vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Source Port Group").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Target Network").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("VLAN ID").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Affected VMs").bold())),
            ])
        ];

        for translation in network_translations {
            network_rows.push(TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&translation.source_port_group))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&translation.target_logical_network))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    &translation.target_vlan_id.map(|v| v.to_string()).unwrap_or_else(|| "Untagged".to_string())
                ))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&translation.affected_vms.len().to_string()))),
            ]));
        }

        doc = doc.add_table(Table::new(network_rows));

        Ok(doc)
    }

    /// Add VM configuration details
    fn add_lld_vm_configuration(mut doc: Docx, vm_translations: &[VmTranslation]) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("5. Virtual Machine Configuration").size(18).bold())
        );

        // Create VM placement table
        let mut vm_rows = vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("VM Name").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Target Host").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("vCPU").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Memory (GB)").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Disks").bold())),
            ])
        ];

        for vm in vm_translations {
            vm_rows.push(TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&vm.source_vm_name))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&vm.target_host))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&vm.target_vcpu.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&vm.target_memory_gb.to_string()))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(&vm.disk_translations.len().to_string()))),
            ]));
        }

        doc = doc.add_table(Table::new(vm_rows));

        Ok(doc)
    }

    /// Add PowerShell configuration scripts
    fn add_lld_configuration_scripts(mut doc: Docx, translation_result: &TranslationResult) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6. PowerShell Configuration Scripts").size(18).bold())
        );

        // Generate cluster creation script
        let cluster_script = Self::generate_cluster_creation_script(&translation_result.target_cluster_config);

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6.1. Cluster Creation Script").size(14).bold())
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&cluster_script).size(10))
        );

        // Generate VM network configuration script
        let network_script = Self::generate_vm_network_script(&translation_result.vm_translations);

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("6.2. VM Network Configuration Script").size(14).bold())
        );

        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text(&network_script).size(10))
        );

        Ok(doc)
    }

    /// Generate cluster creation PowerShell script
    fn generate_cluster_creation_script(target_config: &TargetClusterConfig) -> String {
        let node_names: Vec<String> = target_config.hosts.iter().map(|h| h.name.clone()).collect();

        format!(
            "# Create Failover Cluster\n\
            $Nodes = @({})\n\
            $ClusterName = '{}'\n\
            $ClusterIP = '192.168.100.10'  # Update with actual IP\n\n\
            # Test cluster configuration\n\
            Test-Cluster -Node $Nodes -Include 'Storage Spaces Direct'\n\n\
            # Create cluster\n\
            New-Cluster -Name $ClusterName -Node $Nodes -StaticAddress $ClusterIP\n\n\
            # Enable Storage Spaces Direct\n\
            Enable-ClusterStorageSpacesDirect -Confirm:$false\n\n\
            # Create virtual disks and CSVs\n\
            {}",
            node_names.iter().map(|n| format!("'{}'", n)).collect::<Vec<_>>().join(", "),
            target_config.cluster_name,
            target_config.storage_config.csv_volumes.iter()
                .map(|csv| format!(
                    "New-Volume -FriendlyName '{}' -FileSystem ReFS -Size {}GB",
                    csv.name,
                    csv.size_gb as u64
                ))
                .collect::<Vec<_>>()
                .join("\n")
        )
    }

    /// Generate VM network configuration script
    fn generate_vm_network_script(vm_translations: &[VmTranslation]) -> String {
        let mut script = String::from("# Configure VM Network Adapters\n\n");

        for vm in vm_translations {
            for network in &vm.network_translations {
                if let Some(vlan_id) = network.target_vlan_id {
                    script.push_str(&format!(
                        "Set-VMNetworkAdapterVlan -VMName '{}' -VMNetworkAdapterName '{}' -Access -VlanId {}\n",
                        vm.target_vm_name,
                        network.adapter_name,
                        vlan_id
                    ));
                } else {
                    script.push_str(&format!(
                        "Set-VMNetworkAdapterVlan -VMName '{}' -VMNetworkAdapterName '{}' -Untagged\n",
                        vm.target_vm_name,
                        network.adapter_name
                    ));
                }
            }
        }

        script
    }

    /// Add migration checklist
    fn add_lld_migration_checklist(mut doc: Docx, manual_interventions: &[ManualInterventionItem]) -> Result<Docx> {
        doc = doc.add_paragraph(
            Paragraph::new()
                .add_run(Run::new().add_text("7. Migration Checklist").size(18).bold())
        );

        let checklist_items = vec![
            "☐ Verify target hardware is installed and configured",
            "☐ Install Windows Server on all nodes",
            "☐ Configure network adapters and VLANs",
            "☐ Install Hyper-V and Failover Clustering features",
            "☐ Create failover cluster",
            "☐ Configure Storage Spaces Direct (if applicable)",
            "☐ Create Cluster Shared Volumes",
            "☐ Configure virtual switches",
            "☐ Migrate virtual machines",
            "☐ Configure VM network adapters",
            "☐ Install Hyper-V Integration Services",
            "☐ Validate VM functionality",
            "☐ Update documentation",
        ];

        for item in checklist_items {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text(item))
            );
        }

        if !manual_interventions.is_empty() {
            doc = doc.add_paragraph(
                Paragraph::new()
                    .add_run(Run::new().add_text("7.1. Special Attention Required").size(14).bold())
            );

            for item in manual_interventions {
                let checklist_item = format!(
                    "☐ {}: {}",
                    item.description,
                    item.recommendation
                );

                doc = doc.add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(&checklist_item))
                );
            }
        }

        Ok(doc)
    }
}

/// Document template configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentTemplate {
    pub company_name: Option<String>,
    pub company_logo: Option<Vec<u8>>,
    pub document_header: Option<String>,
    pub document_footer: Option<String>,
    pub custom_styles: HashMap<String, DocumentStyle>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentStyle {
    pub font_name: String,
    pub font_size: u32,
    pub color: String,
    pub bold: bool,
    pub italic: bool,
}

impl Default for DocumentTemplate {
    fn default() -> Self {
        Self {
            company_name: None,
            company_logo: None,
            document_header: None,
            document_footer: None,
            custom_styles: HashMap::new(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_document_template_default() {
        let template = DocumentTemplate::default();
        assert!(template.company_name.is_none());
        assert!(template.custom_styles.is_empty());
    }
}

/// Convenience function for generating HLD documents
pub async fn generate_hld_document(
    environment: &VsphereEnvironment,
    sizing_result: &SizingResult,
    translation_result: &TranslationResult,
    output_path: &str,
) -> Result<()> {
    let document_data = DocumentGenerator::generate_hld(
        environment,
        sizing_result,
        translation_result,
        None,
        None,
    )?;
    
    tokio::fs::write(output_path, document_data).await
        .map_err(|e| CoreEngineError::io(format!("Failed to write HLD document: {}", e)))?;
    
    Ok(())
}

/// Convenience function for generating LLD documents
pub async fn generate_lld_document(
    environment: &VsphereEnvironment,
    sizing_result: &SizingResult,
    translation_result: &TranslationResult,
    output_path: &str,
) -> Result<()> {
    let document_data = DocumentGenerator::generate_lld(
        environment,
        sizing_result,
        translation_result,
        None,
    )?;
    
    tokio::fs::write(output_path, document_data).await
        .map_err(|e| CoreEngineError::io(format!("Failed to write LLD document: {}", e)))?;
    
    Ok(())
}
