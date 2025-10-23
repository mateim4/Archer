use crate::models::hld::{HLDProject, HLDVariable, VariableValue, SectionDefinition};
use anyhow::{Result, Context};
use docx_rs::*;
use std::collections::HashMap;

// ============================================================================
// HLD Word Document Generator Service
// ============================================================================
// Purpose: Generate High-Level Design documents in Microsoft Word format
// Features: Variable substitution, section assembly, formatting
// Version: 1.0 (Week 3)
// ============================================================================

pub struct WordGenerator {
    /// Document builder
    document: Document,
}

impl WordGenerator {
    /// Create a new Word document generator
    pub fn new() -> Self {
        Self {
            document: Document::new(),
        }
    }

    /// Generate complete HLD document
    pub fn generate_hld(
        &mut self,
        project: &HLDProject,
        variables: &[HLDVariable],
        sections: &[SectionDefinition],
    ) -> Result<Vec<u8>> {
        // Convert variables to lookup map
        let var_map: HashMap<String, String> = variables
            .iter()
            .filter_map(|v| {
                v.variable_value.as_ref().map(|val| {
                    (v.variable_name.clone(), Self::format_variable_value(val))
                })
            })
            .collect();

        // Add title page
        self.add_title_page(project, &var_map)?;

        // Add table of contents placeholder
        self.add_table_of_contents()?;

        // Add each enabled section
        for section in sections {
            if section.enabled {
                self.add_section(section, &var_map)?;
            }
        }

        // Build document to bytes
        let buf = self.document.json()
            .as_bytes()
            .to_vec();

        Ok(buf)
    }

    /// Add title page
    fn add_title_page(
        &mut self,
        project: &HLDProject,
        variables: &HashMap<String, String>,
    ) -> Result<()> {
        // Title
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("High-Level Design")
                        .size(56)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .align(AlignmentType::Center)
                .style("Title"),
        );

        // Project name
        let project_name = variables
            .get("project_name")
            .cloned()
            .unwrap_or_else(|| project.project_id.to_string());
        
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&project_name)
                        .size(32)
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .align(AlignmentType::Center),
        );

        // Customer name
        if let Some(customer) = variables.get("customer_name") {
            self.document = self.document.clone().add_paragraph(
                Paragraph::new()
                    .add_run(
                        Run::new()
                            .add_text(customer)
                            .size(24)
                            .fonts(RunFonts::new().ascii("Poppins"))
                    )
                    .align(AlignmentType::Center),
            );
        }

        // Date
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&chrono::Utc::now().format("%B %d, %Y").to_string())
                        .size(20)
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .align(AlignmentType::Center),
        );

        // Page break
        self.document = self.document.clone().add_paragraph(
            Paragraph::new().add_run(Run::new().add_break(BreakType::Page)),
        );

        Ok(())
    }

    /// Add table of contents placeholder
    fn add_table_of_contents(&mut self) -> Result<()> {
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Table of Contents")
                        .size(32)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .style("Heading1"),
        );

        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("(Update table of contents in Microsoft Word: Right-click > Update Field)")
                        .size(18)
                        .italic()
                        .color("808080")
                )
        );

        // Page break
        self.document = self.document.clone().add_paragraph(
            Paragraph::new().add_run(Run::new().add_break(BreakType::Page)),
        );

        Ok(())
    }

    /// Add a section to the document
    fn add_section(
        &mut self,
        section: &SectionDefinition,
        variables: &HashMap<String, String>,
    ) -> Result<()> {
        // Section heading
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text(&section.display_name)
                        .size(28)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .style("Heading1"),
        );

        // Section description
        if !section.description.is_empty() {
            let description = Self::substitute_variables(&section.description, variables);
            self.document = self.document.clone().add_paragraph(
                Paragraph::new()
                    .add_run(
                        Run::new()
                            .add_text(&description)
                            .size(22)
                            .fonts(RunFonts::new().ascii("Poppins"))
                    )
            );
        }

        // Add section content based on section_id
        match section.section_id.as_str() {
            "executive_summary" => self.add_executive_summary(variables)?,
            "infrastructure_overview" => self.add_infrastructure_overview(variables)?,
            "compute_design" => self.add_compute_design(variables)?,
            "storage_design" => self.add_storage_design(variables)?,
            "network_design" => self.add_network_design(variables)?,
            "migration_strategy" => self.add_migration_strategy(variables)?,
            _ => {
                // Generic section - just add placeholder
                self.document = self.document.clone().add_paragraph(
                    Paragraph::new()
                        .add_run(
                            Run::new()
                                .add_text(&format!("[Content for {} section]", section.display_name))
                                .italic()
                        )
                );
            }
        }

        Ok(())
    }

    /// Add executive summary section
    fn add_executive_summary(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        let content = format!(
            "This document describes the high-level design for {} migration to Microsoft Azure Stack HCI. \
            The solution will provide a modern, hyperconverged infrastructure platform with {} nodes.",
            variables.get("project_name").unwrap_or(&"the".to_string()),
            variables.get("node_count").unwrap_or(&"N".to_string()),
        );

        self.document = self.document.clone().add_paragraph(
            Paragraph::new().add_run(
                Run::new()
                    .add_text(&content)
                    .size(22)
                    .fonts(RunFonts::new().ascii("Poppins"))
            )
        );

        Ok(())
    }

    /// Add infrastructure overview section
    fn add_infrastructure_overview(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        // Subsection: Hardware Configuration
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("Hardware Configuration")
                        .size(24)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .style("Heading2"),
        );

        // Create hardware table
        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Component").bold())
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Specification").bold())
                ),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Cluster Name"))
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(
                        variables.get("cluster_name").unwrap_or(&"TBD".to_string())
                    ))
                ),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("Node Count"))
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(
                        variables.get("node_count").unwrap_or(&"TBD".to_string())
                    ))
                ),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("CPU Model"))
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(
                        variables.get("cpu_model").unwrap_or(&"TBD".to_string())
                    ))
                ),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text("RAM per Node"))
                ),
                TableCell::new().add_paragraph(
                    Paragraph::new().add_run(Run::new().add_text(
                        &format!("{} GB", variables.get("ram_gb_per_host").unwrap_or(&"TBD".to_string()))
                    ))
                ),
            ]),
        ]);

        self.document = self.document.clone().add_table(table);

        Ok(())
    }

    /// Add compute design section
    fn add_compute_design(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("VM Templates")
                        .size(24)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .style("Heading2"),
        );

        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Template").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("vCPUs").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("RAM (GB)").bold())),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Small"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_small_vcpus").unwrap_or(&"2".to_string())
                ))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_small_ram_gb").unwrap_or(&"4".to_string())
                ))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Medium"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_medium_vcpus").unwrap_or(&"4".to_string())
                ))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_medium_ram_gb").unwrap_or(&"8".to_string())
                ))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Large"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_large_vcpus").unwrap_or(&"8".to_string())
                ))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("template_large_ram_gb").unwrap_or(&"16".to_string())
                ))),
            ]),
        ]);

        self.document = self.document.clone().add_table(table);

        Ok(())
    }

    /// Add storage design section
    fn add_storage_design(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        let content = format!(
            "The storage configuration will provide approximately {} TB of usable capacity using Storage Spaces Direct (S2D).",
            variables.get("total_storage_tb_usable").unwrap_or(&"TBD".to_string())
        );

        self.document = self.document.clone().add_paragraph(
            Paragraph::new().add_run(Run::new().add_text(&content).size(22))
        );

        Ok(())
    }

    /// Add network design section
    fn add_network_design(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        self.document = self.document.clone().add_paragraph(
            Paragraph::new()
                .add_run(
                    Run::new()
                        .add_text("VLAN Configuration")
                        .size(24)
                        .bold()
                        .fonts(RunFonts::new().ascii("Poppins"))
                )
                .style("Heading2"),
        );

        let table = Table::new(vec![
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Purpose").bold())),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("VLAN ID").bold())),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Management"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("mgmt_vlan_id").unwrap_or(&"TBD".to_string())
                ))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Cluster Communication"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("cluster_vlan_id").unwrap_or(&"TBD".to_string())
                ))),
            ]),
            TableRow::new(vec![
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text("Live Migration"))),
                TableCell::new().add_paragraph(Paragraph::new().add_run(Run::new().add_text(
                    variables.get("lm_vlan_id").unwrap_or(&"TBD".to_string())
                ))),
            ]),
        ]);

        self.document = self.document.clone().add_table(table);

        Ok(())
    }

    /// Add migration strategy section
    fn add_migration_strategy(&mut self, variables: &HashMap<String, String>) -> Result<()> {
        let content = format!(
            "The migration will follow a {} approach, leveraging {} for management and {} for backup operations.",
            variables.get("migration_approach").unwrap_or(&"phased".to_string()),
            variables.get("management_framework").unwrap_or(&"Windows Admin Center".to_string()),
            variables.get("backup_software").unwrap_or(&"Azure Backup".to_string()),
        );

        self.document = self.document.clone().add_paragraph(
            Paragraph::new().add_run(Run::new().add_text(&content).size(22))
        );

        Ok(())
    }

    /// Format a variable value for display
    fn format_variable_value(value: &VariableValue) -> String {
        match value {
            VariableValue::String(s) => s.clone(),
            VariableValue::Integer(i) => i.to_string(),
            VariableValue::Float(f) => format!("{:.2}", f),
            VariableValue::Boolean(b) => if *b { "Yes" } else { "No" }.to_string(),
            VariableValue::Date(d) => d.format("%Y-%m-%d").to_string(),
            VariableValue::Array(a) => serde_json::to_string(a).unwrap_or_default(),
            VariableValue::Object(o) => serde_json::to_string(o).unwrap_or_default(),
            VariableValue::Null => "N/A".to_string(),
        }
    }

    /// Substitute variable placeholders in text
    fn substitute_variables(text: &str, variables: &HashMap<String, String>) -> String {
        let mut result = text.to_string();
        for (name, value) in variables {
            let placeholder = format!("{{{{{}}}}}", name);
            result = result.replace(&placeholder, value);
        }
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::hld::*;
    use chrono::Utc;
    use surrealdb::sql::Thing;

    fn create_test_project() -> HLDProject {
        HLDProject {
            id: Some(Thing::from(("hld_projects", "test-id"))),
            project_id: Thing::from(("projects", "test-project")),
            template_id: Thing::from(("templates", "default")),
            template_version: "1.0".to_string(),
            enabled_sections: vec!["executive_summary".to_string(), "infrastructure_overview".to_string()],
            section_order: vec![],
            metadata: None,
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
        }
    }

    fn create_test_variables() -> Vec<HLDVariable> {
        vec![
            HLDVariable {
                id: None,
                hld_project_id: Thing::from(("hld_projects", "test-id")),
                variable_name: "project_name".to_string(),
                variable_value: Some(VariableValue::String("Test Project".to_string())),
                variable_type: "string".to_string(),
                section: "general".to_string(),
                source: "manual".to_string(),
                confidence: None,
                error_message: None,
                updated_at: Some(Utc::now()),
            },
            HLDVariable {
                id: None,
                hld_project_id: Thing::from(("hld_projects", "test-id")),
                variable_name: "node_count".to_string(),
                variable_value: Some(VariableValue::Integer(4)),
                variable_type: "integer".to_string(),
                section: "infrastructure".to_string(),
                source: "rvtools".to_string(),
                confidence: Some("high".to_string()),
                error_message: None,
                updated_at: Some(Utc::now()),
            },
        ]
    }

    fn create_test_sections() -> Vec<SectionDefinition> {
        vec![
            SectionDefinition {
                id: None,
                section_id: "executive_summary".to_string(),
                section_name: "executive_summary".to_string(),
                display_name: "Executive Summary".to_string(),
                description: "Overview of the solution".to_string(),
                required: true,
                enabled: true,
                order_index: 0,
                depends_on: vec![],
                created_at: Utc::now(),
            },
        ]
    }

    #[test]
    fn test_format_variable_value() {
        assert_eq!(
            WordGenerator::format_variable_value(&VariableValue::String("test".to_string())),
            "test"
        );
        assert_eq!(
            WordGenerator::format_variable_value(&VariableValue::Integer(42)),
            "42"
        );
        assert_eq!(
            WordGenerator::format_variable_value(&VariableValue::Boolean(true)),
            "Yes"
        );
    }

    #[test]
    fn test_substitute_variables() {
        let mut vars = HashMap::new();
        vars.insert("name".to_string(), "Alice".to_string());
        vars.insert("count".to_string(), "5".to_string());

        let result = WordGenerator::substitute_variables(
            "Hello {{name}}, you have {{count}} items.",
            &vars
        );
        assert_eq!(result, "Hello Alice, you have 5 items.");
    }

    #[test]
    fn test_generate_hld_document() {
        let mut generator = WordGenerator::new();
        let project = create_test_project();
        let variables = create_test_variables();
        let sections = create_test_sections();

        let result = generator.generate_hld(&project, &variables, &sections);
        assert!(result.is_ok());
        
        let bytes = result.unwrap();
        assert!(!bytes.is_empty());
    }
}
