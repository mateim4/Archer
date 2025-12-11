use anyhow::{Context, Result};
use std::collections::HashMap;
use std::path::PathBuf;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use uuid::Uuid;
use std::fs;
use std::process::Command;

use crate::database::Database;
use crate::models::project_models::*;
use crate::utils::{EnhancedRvToolsError, EnhancedRvToolsResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportRequest {
    pub upload_id: String,
    pub template_id: String,
    pub export_format: ExportFormat,
    pub branding: Option<BrandingConfig>,
    pub custom_filename: Option<String>,
    pub include_source_data: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExportedReport {
    pub export_id: String,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub export_url: String,
    pub format: ExportFormat,
    pub expires_at: DateTime<Utc>,
    pub generated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BrandingConfig {
    pub company_name: Option<String>,
    pub logo_url: Option<String>,
    pub primary_color: Option<String>,
    pub secondary_color: Option<String>,
    pub font_family: Option<String>,
    pub header_text: Option<String>,
    pub footer_text: Option<String>,
}

pub struct ReportExportService {
    db: Database,
    export_dir: PathBuf,
    base_url: String,
}

impl ReportExportService {
    pub fn new(db: Database) -> Result<Self> {
        let export_dir = std::env::var("EXPORT_DIR")
            .unwrap_or_else(|_| "/tmp/lcm-exports".to_string())
            .into();
        
        let base_url = std::env::var("BASE_URL")
            .unwrap_or_else(|_| "http://localhost:3001".to_string());

        // Ensure export directory exists
        fs::create_dir_all(&export_dir)
            .context("Failed to create export directory")?;

        Ok(Self {
            db,
            export_dir,
            base_url,
        })
    }

    /// Export a report in the specified format
    pub async fn export_report(&self, request: ExportRequest) -> EnhancedRvToolsResult<ExportedReport> {
        let export_id = Uuid::new_v4().to_string();
        
        // Generate the report data first
        let report_data = self.get_report_data(&request.upload_id, &request.template_id).await?;
        let template = self.get_report_template(&request.template_id).await?;
        
        let exported_report = match request.export_format {
            ExportFormat::Html => self.export_html(export_id, &request, &report_data, &template).await?,
            ExportFormat::Pdf => self.export_pdf(export_id, &request, &report_data, &template).await?,
        };

        // Store export record in database
        self.store_export_record(&exported_report).await?;

        Ok(exported_report)
    }

    /// Export report as HTML
    async fn export_html(
        &self,
        export_id: String,
        request: &ExportRequest,
        report_data: &Value,
        template: &ReportTemplate,
    ) -> EnhancedRvToolsResult<ExportedReport> {
        let filename = request.custom_filename
            .as_ref()
            .map(|f| format!("{}.html", f.trim_end_matches(".html")))
            .unwrap_or_else(|| format!("rvtools-report-{}.html", export_id));

        let file_path = self.export_dir.join(&filename);
        
        let html_content = self.generate_html_content(request, report_data, template)?;
        
        fs::write(&file_path, html_content)
            .map_err(|e| EnhancedRvToolsError::ReportExportError {
                format: "HTML".to_string(),
                error: e.to_string(),
            })?;

        let file_size_bytes = fs::metadata(&file_path)
            .map_err(|e| EnhancedRvToolsError::ReportExportError {
                format: "HTML".to_string(),
                error: e.to_string(),
            })?
            .len();

        Ok(ExportedReport {
            export_id,
            file_path: file_path.to_string_lossy().to_string(),
            file_size_bytes,
            export_url: format!("{}/api/exports/{}", self.base_url, filename),
            format: ExportFormat::Html,
            expires_at: Utc::now() + chrono::Duration::hours(24), // 24 hour expiry
            generated_at: Utc::now(),
        })
    }

    /// Export report as PDF
    async fn export_pdf(
        &self,
        export_id: String,
        request: &ExportRequest,
        report_data: &Value,
        template: &ReportTemplate,
    ) -> EnhancedRvToolsResult<ExportedReport> {
        // First generate HTML content
        let html_content = self.generate_html_content(request, report_data, template)?;
        
        // Create temporary HTML file
        let temp_html_path = self.export_dir.join(format!("temp-{}.html", export_id));
        fs::write(&temp_html_path, html_content)
            .map_err(|e| EnhancedRvToolsError::ReportExportError {
                format: "PDF".to_string(),
                error: format!("Failed to write temporary HTML: {}", e),
            })?;

        // Generate PDF filename
        let filename = request.custom_filename
            .as_ref()
            .map(|f| format!("{}.pdf", f.trim_end_matches(".pdf")))
            .unwrap_or_else(|| format!("rvtools-report-{}.pdf", export_id));

        let pdf_path = self.export_dir.join(&filename);

        // Convert HTML to PDF using wkhtmltopdf
        let pdf_result = self.convert_html_to_pdf(&temp_html_path, &pdf_path).await;

        // Clean up temporary HTML file
        let _ = fs::remove_file(&temp_html_path);

        pdf_result?;

        let file_size_bytes = fs::metadata(&pdf_path)
            .map_err(|e| EnhancedRvToolsError::ReportExportError {
                format: "PDF".to_string(),
                error: e.to_string(),
            })?
            .len();

        Ok(ExportedReport {
            export_id,
            file_path: pdf_path.to_string_lossy().to_string(),
            file_size_bytes,
            export_url: format!("{}/api/exports/{}", self.base_url, filename),
            format: ExportFormat::Pdf,
            expires_at: Utc::now() + chrono::Duration::hours(24),
            generated_at: Utc::now(),
        })
    }

    /// Convert HTML to PDF using wkhtmltopdf
    async fn convert_html_to_pdf(&self, html_path: &PathBuf, pdf_path: &PathBuf) -> EnhancedRvToolsResult<()> {
        let output = Command::new("wkhtmltopdf")
            .args(&[
                "--page-size", "A4",
                "--margin-top", "20mm",
                "--margin-bottom", "20mm", 
                "--margin-left", "20mm",
                "--margin-right", "20mm",
                "--enable-local-file-access",
                "--print-media-type",
                "--disable-smart-shrinking",
                html_path.to_str().unwrap(),
                pdf_path.to_str().unwrap(),
            ])
            .output()
            .map_err(|e| EnhancedRvToolsError::ReportExportError {
                format: "PDF".to_string(),
                error: format!("Failed to execute wkhtmltopdf: {}. Make sure wkhtmltopdf is installed.", e),
            })?;

        if !output.status.success() {
            let error_msg = String::from_utf8_lossy(&output.stderr);
            return Err(EnhancedRvToolsError::ReportExportError {
                format: "PDF".to_string(),
                error: format!("wkhtmltopdf failed: {}", error_msg),
            });
        }

        Ok(())
    }

    /// Generate HTML content for the report
    fn generate_html_content(
        &self,
        request: &ExportRequest,
        report_data: &Value,
        template: &ReportTemplate,
    ) -> EnhancedRvToolsResult<String> {
        let branding = request.branding.as_ref().unwrap_or(&BrandingConfig {
            company_name: Some("Archer".to_string()),
            logo_url: None,
            primary_color: Some("#8b5cf6".to_string()),
            secondary_color: Some("#6366f1".to_string()),
            font_family: Some("'Inter', system-ui, sans-serif".to_string()),
            header_text: None,
            footer_text: Some("Generated by Archer Enhanced RVTools".to_string()),
        });

        let html = format!(
            r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{}</title>
    <style>
        {}
    </style>
</head>
<body>
    <div class="report-container">
        {}
        {}
        {}
    </div>
</body>
</html>"#,
            template.name,
            self.generate_css_styles(branding),
            self.generate_header(branding, &template.name),
            self.generate_report_content(report_data, template)?,
            self.generate_footer(branding)
        );

        Ok(html)
    }

    /// Generate CSS styles for the report
    fn generate_css_styles(&self, branding: &BrandingConfig) -> String {
        let primary_color = branding.primary_color.as_deref().unwrap_or("#8b5cf6");
        let secondary_color = branding.secondary_color.as_deref().unwrap_or("#6366f1");
        let font_family = branding.font_family.as_deref().unwrap_or("'Inter', system-ui, sans-serif");

        format!(r#"
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: {font_family};
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }}
        
        .report-container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        
        .report-header {{
            background: linear-gradient(135deg, {primary_color}, {secondary_color});
            color: white;
            padding: 2rem;
            text-align: center;
        }}
        
        .report-header h1 {{
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }}
        
        .report-header p {{
            font-size: 1.1rem;
            opacity: 0.9;
        }}
        
        .report-content {{
            padding: 2rem;
        }}
        
        .section {{
            margin-bottom: 3rem;
        }}
        
        .section-title {{
            font-size: 1.8rem;
            font-weight: 600;
            color: {primary_color};
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
        }}
        
        .section-description {{
            color: #6b7280;
            margin-bottom: 1.5rem;
        }}
        
        .cards-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }}
        
        .metric-card {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
        }}
        
        .metric-card h3 {{
            color: {primary_color};
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }}
        
        .metric-card .value {{
            font-size: 2rem;
            font-weight: 700;
            color: #1f2937;
        }}
        
        .summary-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
        }}
        
        .summary-table th,
        .summary-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }}
        
        .summary-table th {{
            background: #f1f5f9;
            font-weight: 600;
            color: {primary_color};
        }}
        
        .data-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            font-size: 0.9rem;
        }}
        
        .data-table th,
        .data-table td {{
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #e2e8f0;
        }}
        
        .data-table th {{
            background: {primary_color};
            color: white;
            font-weight: 600;
        }}
        
        .data-table tr:nth-child(even) {{
            background: #f8fafc;
        }}
        
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }}
        
        .badge-success {{
            background: #d1fae5;
            color: #065f46;
        }}
        
        .badge-warning {{
            background: #fef3c7;
            color: #92400e;
        }}
        
        .badge-danger {{
            background: #fee2e2;
            color: #991b1b;
        }}
        
        .report-footer {{
            background: #f1f5f9;
            padding: 1.5rem 2rem;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e2e8f0;
        }}
        
        .metadata {{
            background: #fafbfc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 2rem;
        }}
        
        .metadata-title {{
            font-weight: 600;
            color: {primary_color};
            margin-bottom: 0.5rem;
        }}
        
        .metadata-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
        }}
        
        .metadata-item {{
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
        }}
        
        @media print {{
            .report-container {{
                box-shadow: none;
            }}
            
            .section {{
                break-inside: avoid;
            }}
        }}
        "#, 
        font_family = font_family,
        primary_color = primary_color,
        secondary_color = secondary_color)
    }

    /// Generate report header HTML
    fn generate_header(&self, branding: &BrandingConfig, title: &str) -> String {
        let company_name = branding.company_name.as_deref().unwrap_or("Archer");
        let header_text = branding.header_text.as_deref().unwrap_or(
            &format!("{} - Infrastructure Analysis Report", company_name)
        );

        format!(r#"
        <div class="report-header">
            <h1>{}</h1>
            <p>{}</p>
            <p style="font-size: 0.9rem; opacity: 0.8; margin-top: 1rem;">
                Generated on {}
            </p>
        </div>
        "#, title, header_text, Utc::now().format("%B %d, %Y at %H:%M UTC"))
    }

    /// Generate report content HTML
    fn generate_report_content(&self, report_data: &Value, template: &ReportTemplate) -> EnhancedRvToolsResult<String> {
        let mut content = String::new();
        
        // Add metadata section
        if let Some(metadata) = report_data.get("metadata") {
            content.push_str(&self.generate_metadata_section(metadata));
        }

        // Add each section
        for section in &template.sections {
            content.push_str(&self.generate_section_html(section, report_data)?);
        }

        Ok(format!(r#"<div class="report-content">{}</div>"#, content))
    }

    /// Generate metadata section HTML
    fn generate_metadata_section(&self, metadata: &Value) -> String {
        let mut items = String::new();
        
        if let Some(obj) = metadata.as_object() {
            for (key, value) in obj {
                let display_key = key.replace('_', " ")
                    .split(' ')
                    .map(|s| s.chars().next().unwrap().to_uppercase().collect::<String>() + &s[1..])
                    .collect::<Vec<_>>()
                    .join(" ");
                
                let display_value = match value {
                    Value::String(s) => s.clone(),
                    Value::Number(n) => n.to_string(),
                    Value::Bool(b) => b.to_string(),
                    _ => "N/A".to_string(),
                };
                
                items.push_str(&format!(
                    r#"<div class="metadata-item"><span>{}</span><span>{}</span></div>"#,
                    display_key, display_value
                ));
            }
        }

        format!(r#"
        <div class="metadata">
            <div class="metadata-title">Report Information</div>
            <div class="metadata-grid">{}</div>
        </div>
        "#, items)
    }

    /// Generate section HTML based on display format
    fn generate_section_html(&self, section: &ReportSection, report_data: &Value) -> EnhancedRvToolsResult<String> {
        let variables = report_data.get("variables").unwrap_or(&json!({}));
        
        // Extract data for this section
        let mut section_data = HashMap::new();
        for var in &section.data_variables {
            if let Some(value) = variables.get(var) {
                section_data.insert(var.clone(), value.clone());
            }
        }

        let content = match section.display_format.as_str() {
            "cards" => self.generate_cards_html(&section_data),
            "table" => self.generate_table_html(&section_data),
            "summary" => self.generate_summary_html(&section_data),
            "chart" => self.generate_chart_placeholder_html(&section_data),
            _ => self.generate_summary_html(&section_data),
        };

        Ok(format!(r#"
        <div class="section">
            <h2 class="section-title">{}</h2>
            <p class="section-description">{}</p>
            {}
        </div>
        "#, section.title, section.description, content))
    }

    /// Generate cards HTML
    fn generate_cards_html(&self, data: &HashMap<String, Value>) -> String {
        let mut cards = String::new();
        
        for (key, value) in data {
            let display_key = key.replace('_', " ")
                .split(' ')
                .map(|s| s.chars().next().unwrap().to_uppercase().collect::<String>() + &s[1..])
                .collect::<Vec<_>>()
                .join(" ");
            
            let display_value = self.format_value(value);
            
            cards.push_str(&format!(r#"
            <div class="metric-card">
                <h3>{}</h3>
                <div class="value">{}</div>
            </div>
            "#, display_key, display_value));
        }

        format!(r#"<div class="cards-grid">{}</div>"#, cards)
    }

    /// Generate table HTML
    fn generate_table_html(&self, data: &HashMap<String, Value>) -> String {
        let mut rows = String::new();
        
        for (key, value) in data {
            let display_key = key.replace('_', " ")
                .split(' ')
                .map(|s| s.chars().next().unwrap().to_uppercase().collect::<String>() + &s[1..])
                .collect::<Vec<_>>()
                .join(" ");
            
            let display_value = self.format_value(value);
            
            rows.push_str(&format!(r#"
            <tr>
                <td>{}</td>
                <td>{}</td>
            </tr>
            "#, display_key, display_value));
        }

        format!(r#"
        <table class="data-table">
            <thead>
                <tr>
                    <th>Property</th>
                    <th>Value</th>
                </tr>
            </thead>
            <tbody>{}</tbody>
        </table>
        "#, rows)
    }

    /// Generate summary HTML
    fn generate_summary_html(&self, data: &HashMap<String, Value>) -> String {
        let mut rows = String::new();
        
        for (key, value) in data {
            let display_key = key.replace('_', " ")
                .split(' ')
                .map(|s| s.chars().next().unwrap().to_uppercase().collect::<String>() + &s[1..])
                .collect::<Vec<_>>()
                .join(" ");
            
            let display_value = self.format_value(value);
            
            rows.push_str(&format!(r#"
            <tr>
                <th>{}</th>
                <td>{}</td>
            </tr>
            "#, display_key, display_value));
        }

        format!(r#"
        <table class="summary-table">{}</table>
        "#, rows)
    }

    /// Generate chart placeholder HTML
    fn generate_chart_placeholder_html(&self, data: &HashMap<String, Value>) -> String {
        format!(r#"
        <div style="background: #f8fafc; border: 2px dashed #d1d5db; border-radius: 12px; padding: 3rem; text-align: center; color: #6b7280;">
            <h3 style="margin-bottom: 1rem;">📊 Chart Visualization</h3>
            <p>Interactive charts available in web version</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">Data points: {}</p>
        </div>
        "#, data.len())
    }

    /// Generate footer HTML
    fn generate_footer(&self, branding: &BrandingConfig) -> String {
        let footer_text = branding.footer_text.as_deref().unwrap_or(
            "Generated by Archer Enhanced RVTools"
        );

        format!(r#"
        <div class="report-footer">
            <p>{}</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem; opacity: 0.7;">
                Report ID: {} | Generated: {}
            </p>
        </div>
        "#, footer_text, Uuid::new_v4(), Utc::now().format("%Y-%m-%d %H:%M:%S UTC"))
    }

    /// Format a JSON value for display
    fn format_value(&self, value: &Value) -> String {
        match value {
            Value::String(s) => s.clone(),
            Value::Number(n) => {
                if let Some(int_val) = n.as_i64() {
                    int_val.to_string()
                } else if let Some(float_val) = n.as_f64() {
                    format!("{:.2}", float_val)
                } else {
                    n.to_string()
                }
            }
            Value::Bool(b) => if *b { "Yes" } else { "No" }.to_string(),
            Value::Array(arr) => {
                if arr.is_empty() {
                    "None".to_string()
                } else {
                    arr.iter()
                        .map(|v| self.format_value(v))
                        .collect::<Vec<_>>()
                        .join(", ")
                }
            }
            Value::Object(_) => "Complex Data".to_string(),
            Value::Null => "N/A".to_string(),
        }
    }

    /// Get report data from database
    async fn get_report_data(&self, upload_id: &str, template_id: &str) -> EnhancedRvToolsResult<Value> {
        // In a real implementation, this would query the database for the report data
        // For now, return mock data structure
        Ok(json!({
            "variables": {
                "total_vms": 150,
                "total_hosts": 12,
                "total_clusters": 3,
                "migration_complexity_score": 3.2,
                "vcenter_version": "7.0.3",
                "environment_name": "Production Environment",
                "vsan_clusters": ["ASNCLUBA0001", "ASNCLUHRK001", "PLBYDCL03"]
            },
            "metadata": {
                "generated_at": Utc::now().to_rfc3339(),
                "data_source": format!("RVTools Upload {}", upload_id),
                "total_records": 1250,
                "confidence_level": 0.87
            }
        }))
    }

    /// Get report template from database
    async fn get_report_template(&self, template_id: &str) -> EnhancedRvToolsResult<ReportTemplate> {
        // In a real implementation, this would query the database
        // For now, return a default template
        Ok(ReportTemplate {
            id: template_id.to_string(),
            name: "RVTools Migration Analysis Report".to_string(),
            description: "Comprehensive VMware to Hyper-V migration planning report".to_string(),
            sections: vec![
                ReportSection {
                    id: "executive-summary".to_string(),
                    title: "Executive Summary".to_string(),
                    description: "High-level overview of the migration assessment".to_string(),
                    data_variables: vec!["total_vms".to_string(), "total_hosts".to_string(), "total_clusters".to_string(), "migration_complexity_score".to_string()],
                    display_format: "cards".to_string(),
                    order: 1,
                    is_required: true,
                    subsections: None,
                },
                ReportSection {
                    id: "infrastructure-overview".to_string(),
                    title: "Infrastructure Overview".to_string(),
                    description: "Current VMware infrastructure configuration".to_string(),
                    data_variables: vec!["vcenter_version".to_string(), "environment_name".to_string()],
                    display_format: "summary".to_string(),
                    order: 2,
                    is_required: true,
                    subsections: None,
                },
            ],
            brand_config: BrandingConfig {
                company_name: Some("Archer".to_string()),
                primary_color: Some("#8b5cf6".to_string()),
                logo_url: None,
                secondary_color: Some("#6366f1".to_string()),
                font_family: None,
                header_text: None,
                footer_text: None,
            },
        })
    }

    /// Store export record in database
    async fn store_export_record(&self, exported_report: &ExportedReport) -> EnhancedRvToolsResult<()> {
        // In a real implementation, this would store the export record
        // For now, just log it
        tracing::info!(
            export_id = exported_report.export_id,
            format = ?exported_report.format,
            file_size = exported_report.file_size_bytes,
            "Export record stored"
        );
        Ok(())
    }
}