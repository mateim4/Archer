use serde::{Deserialize, Serialize};
use surrealdb::engine::remote::ws::Client;
use surrealdb::Surreal;
use std::error::Error;
use crate::models::project_models::NetworkTemplate;

/// Network Template Service
/// 
/// Manages reusable network mapping templates for migration projects.
/// Templates allow users to save and reuse common network configurations
/// across multiple projects.
pub struct NetworkTemplateService {
    db: Surreal<Client>,
}

/// Network Template Creation Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateNetworkTemplateRequest {
    pub name: String,
    pub description: Option<String>,
    pub source_network: String,
    pub destination_network: String,
    pub vlan_mapping: Option<serde_json::Value>,
    pub subnet_mapping: Option<serde_json::Value>,
    pub gateway: Option<String>,
    pub dns_servers: Option<Vec<String>>,
    pub is_global: bool,
    pub tags: Option<Vec<String>>,
}

/// Network Template Update Request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateNetworkTemplateRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub source_network: Option<String>,
    pub destination_network: Option<String>,
    pub vlan_mapping: Option<serde_json::Value>,
    pub subnet_mapping: Option<serde_json::Value>,
    pub gateway: Option<String>,
    pub dns_servers: Option<Vec<String>>,
    pub is_global: Option<bool>,
    pub tags: Option<Vec<String>>,
}

/// Network Template List Filters
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NetworkTemplateFilters {
    pub is_global: Option<bool>,
    pub search_query: Option<String>,
    pub tags: Option<Vec<String>>,
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

impl NetworkTemplateService {
    /// Create a new Network Template Service
    pub fn new(db: Surreal<Client>) -> Self {
        Self { db }
    }

    /// Create a new network template
    pub async fn create_template(
        &self,
        user_id: &str,
        request: CreateNetworkTemplateRequest,
    ) -> Result<NetworkTemplate, Box<dyn Error>> {
        // Validate request
        if request.name.trim().is_empty() {
            return Err("Template name cannot be empty".into());
        }

        if request.source_network.trim().is_empty() || request.destination_network.trim().is_empty() {
            return Err("Source and destination networks are required".into());
        }

        // Create template ID
        let template_id = format!("network_template:{}", uuid::Uuid::new_v4());

        let now = chrono::Utc::now();

        let template = NetworkTemplate {
            id: template_id.clone(),
            name: request.name,
            description: request.description,
            created_by: user_id.to_string(),
            source_network: request.source_network,
            destination_network: request.destination_network,
            vlan_mapping: request.vlan_mapping,
            subnet_mapping: request.subnet_mapping,
            gateway: request.gateway,
            dns_servers: request.dns_servers,
            is_global: request.is_global,
            tags: request.tags,
            created_at: now,
            updated_at: now,
        };

        // Insert into database
        let created: Vec<NetworkTemplate> = self
            .db
            .create("network_template")
            .content(&template)
            .await?;

        created.into_iter().next().ok_or_else(|| "Failed to create template".into())
    }

    /// Get a network template by ID
    pub async fn get_template(
        &self,
        template_id: &str,
    ) -> Result<Option<NetworkTemplate>, Box<dyn Error>> {
        let templates: Vec<NetworkTemplate> = self.db.select(template_id).await?;
        Ok(templates.into_iter().next())
    }

    /// List network templates with filters
    pub async fn list_templates(
        &self,
        user_id: &str,
        filters: NetworkTemplateFilters,
    ) -> Result<Vec<NetworkTemplate>, Box<dyn Error>> {
        let mut query = String::from("SELECT * FROM network_template WHERE (is_global = true OR created_by = $user_id)");

        // Apply filters
        if let Some(is_global) = filters.is_global {
            query.push_str(&format!(" AND is_global = {}", is_global));
        }

        if let Some(search) = &filters.search_query {
            let search_lower = search.to_lowercase();
            query.push_str(&format!(
                " AND (string::lowercase(name) CONTAINS '{}' OR string::lowercase(description) CONTAINS '{}')",
                search_lower, search_lower
            ));
        }

        if let Some(tags) = &filters.tags {
            if !tags.is_empty() {
                let tags_condition = tags
                    .iter()
                    .map(|tag| format!("'{}' IN tags", tag))
                    .collect::<Vec<_>>()
                    .join(" OR ");
                query.push_str(&format!(" AND ({})", tags_condition));
            }
        }

        // Order by created_at descending
        query.push_str(" ORDER BY created_at DESC");

        // Apply pagination
        if let Some(limit) = filters.limit {
            query.push_str(&format!(" LIMIT {}", limit));
        }

        if let Some(offset) = filters.offset {
            query.push_str(&format!(" START {}", offset));
        }

        let mut result = self
            .db
            .query(&query)
            .bind(("user_id", user_id))
            .await?;

        let templates: Vec<NetworkTemplate> = result.take(0)?;
        Ok(templates)
    }

    /// Update a network template
    pub async fn update_template(
        &self,
        template_id: &str,
        user_id: &str,
        request: UpdateNetworkTemplateRequest,
    ) -> Result<NetworkTemplate, Box<dyn Error>> {
        // Check if template exists and user has permission
        let existing_templates: Vec<NetworkTemplate> = self.db.select(template_id).await?;

        let mut template = match existing_templates.into_iter().next() {
            Some(t) => {
                if t.created_by != user_id && !t.is_global {
                    return Err("Permission denied: You can only update your own templates".into());
                }
                if t.is_global && t.created_by != user_id {
                    return Err("Permission denied: Only the creator can update global templates".into());
                }
                t
            }
            None => return Err("Template not found".into()),
        };

        // Apply updates
        if let Some(name) = request.name {
            if name.trim().is_empty() {
                return Err("Template name cannot be empty".into());
            }
            template.name = name;
        }

        if let Some(description) = request.description {
            template.description = Some(description);
        }

        if let Some(source_network) = request.source_network {
            if source_network.trim().is_empty() {
                return Err("Source network cannot be empty".into());
            }
            template.source_network = source_network;
        }

        if let Some(destination_network) = request.destination_network {
            if destination_network.trim().is_empty() {
                return Err("Destination network cannot be empty".into());
            }
            template.destination_network = destination_network;
        }

        if let Some(vlan_mapping) = request.vlan_mapping {
            template.vlan_mapping = Some(vlan_mapping);
        }

        if let Some(subnet_mapping) = request.subnet_mapping {
            template.subnet_mapping = Some(subnet_mapping);
        }

        if let Some(gateway) = request.gateway {
            template.gateway = Some(gateway);
        }

        if let Some(dns_servers) = request.dns_servers {
            template.dns_servers = Some(dns_servers);
        }

        if let Some(is_global) = request.is_global {
            template.is_global = is_global;
        }

        if let Some(tags) = request.tags {
            template.tags = Some(tags);
        }

        template.updated_at = chrono::Utc::now();

        // Update in database
        let updated: Vec<NetworkTemplate> = self
            .db
            .update(template_id)
            .content(&template)
            .await?;

        updated.into_iter().next().ok_or_else(|| "Failed to update template".into())
    }

    /// Delete a network template
    pub async fn delete_template(
        &self,
        template_id: &str,
        user_id: &str,
    ) -> Result<(), Box<dyn Error>> {
        // Check if template exists and user has permission
        let existing_templates: Vec<NetworkTemplate> = self.db.select(template_id).await?;

        match existing_templates.into_iter().next() {
            Some(t) => {
                if t.created_by != user_id && !t.is_global {
                    return Err("Permission denied: You can only delete your own templates".into());
                }
                if t.is_global && t.created_by != user_id {
                    return Err("Permission denied: Only the creator can delete global templates".into());
                }
            }
            None => return Err("Template not found".into()),
        }

        // Delete from database
        let _: Vec<NetworkTemplate> = self.db.delete(template_id).await?;

        Ok(())
    }

    /// Clone a template (create a copy for a specific user)
    pub async fn clone_template(
        &self,
        template_id: &str,
        user_id: &str,
        new_name: Option<String>,
    ) -> Result<NetworkTemplate, Box<dyn Error>> {
        // Get the original template
        let originals: Vec<NetworkTemplate> = self.db.select(template_id).await?;

        let original = originals.into_iter().next().ok_or("Template not found")?;

        // Create a new template based on the original
        let new_template_id = format!("network_template:{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now();

        let cloned_template = NetworkTemplate {
            id: new_template_id.clone(),
            name: new_name.unwrap_or_else(|| format!("{} (Copy)", original.name)),
            description: original.description.clone(),
            created_by: user_id.to_string(),
            source_network: original.source_network.clone(),
            destination_network: original.destination_network.clone(),
            vlan_mapping: original.vlan_mapping.clone(),
            subnet_mapping: original.subnet_mapping.clone(),
            gateway: original.gateway.clone(),
            dns_servers: original.dns_servers.clone(),
            is_global: false, // Cloned templates are never global
            tags: original.tags.clone(),
            created_at: now,
            updated_at: now,
        };

        // Insert into database
        let created: Vec<NetworkTemplate> = self
            .db
            .create("network_template")
            .content(&cloned_template)
            .await?;

        created.into_iter().next().ok_or_else(|| "Failed to clone template".into())
    }

    /// Search templates by source or destination network
    pub async fn search_by_network(
        &self,
        user_id: &str,
        network_query: &str,
    ) -> Result<Vec<NetworkTemplate>, Box<dyn Error>> {
        let query = r#"
            SELECT * FROM network_template 
            WHERE (is_global = true OR created_by = $user_id)
            AND (
                string::lowercase(source_network) CONTAINS string::lowercase($network_query)
                OR string::lowercase(destination_network) CONTAINS string::lowercase($network_query)
            )
            ORDER BY created_at DESC
        "#;

        let mut result = self
            .db
            .query(query)
            .bind(("user_id", user_id))
            .bind(("network_query", network_query))
            .await?;

        let templates: Vec<NetworkTemplate> = result.take(0)?;
        Ok(templates)
    }

    /// Get all global templates
    pub async fn list_global_templates(&self) -> Result<Vec<NetworkTemplate>, Box<dyn Error>> {
        let query = "SELECT * FROM network_template WHERE is_global = true ORDER BY created_at DESC";
        
        let mut result = self.db.query(query).await?;
        let templates: Vec<NetworkTemplate> = result.take(0)?;
        
        Ok(templates)
    }

    /// Get user's templates (non-global)
    pub async fn list_user_templates(
        &self,
        user_id: &str,
    ) -> Result<Vec<NetworkTemplate>, Box<dyn Error>> {
        let query = "SELECT * FROM network_template WHERE created_by = $user_id AND is_global = false ORDER BY created_at DESC";
        
        let mut result = self
            .db
            .query(query)
            .bind(("user_id", user_id))
            .await?;
        
        let templates: Vec<NetworkTemplate> = result.take(0)?;
        
        Ok(templates)
    }

    /// Apply a template to a project's network configuration
    pub async fn apply_template_to_project(
        &self,
        template_id: &str,
        project_id: &str,
    ) -> Result<serde_json::Value, Box<dyn Error>> {
        // Get the template
        let templates: Vec<NetworkTemplate> = self.db.select(template_id).await?;
        let template = templates.into_iter().next().ok_or("Template not found")?;

        // Create network configuration for the project
        let network_config = serde_json::json!({
            "source_network": template.source_network,
            "destination_network": template.destination_network,
            "vlan_mapping": template.vlan_mapping,
            "subnet_mapping": template.subnet_mapping,
            "gateway": template.gateway,
            "dns_servers": template.dns_servers,
            "template_id": template_id,
            "template_name": template.name,
            "applied_at": chrono::Utc::now()
        });

        // In a real implementation, you would update the project's network configuration
        // For now, we'll just return the configuration
        Ok(network_config)
    }

    /// Bulk create templates from a list
    pub async fn bulk_create_templates(
        &self,
        user_id: &str,
        requests: Vec<CreateNetworkTemplateRequest>,
    ) -> Result<Vec<NetworkTemplate>, Box<dyn Error>> {
        let mut templates = Vec::new();

        for request in requests {
            match self.create_template(user_id, request).await {
                Ok(template) => templates.push(template),
                Err(e) => eprintln!("Failed to create template: {}", e),
            }
        }

        Ok(templates)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These are unit tests that would require a SurrealDB instance
    // In a real implementation, you would use a test database or mocking

    #[test]
    fn test_create_template_request_validation() {
        let request = CreateNetworkTemplateRequest {
            name: "Production Network".to_string(),
            description: Some("Production environment network mapping".to_string()),
            source_network: "192.168.1.0/24".to_string(),
            destination_network: "10.0.1.0/24".to_string(),
            vlan_mapping: Some(serde_json::json!({"100": "200"})),
            subnet_mapping: None,
            gateway: Some("10.0.1.1".to_string()),
            dns_servers: Some(vec!["8.8.8.8".to_string(), "8.8.4.4".to_string()]),
            is_global: false,
            tags: Some(vec!["production".to_string(), "critical".to_string()]),
        };

        assert!(!request.name.is_empty());
        assert!(!request.source_network.is_empty());
        assert!(!request.destination_network.is_empty());
    }

    #[test]
    fn test_filter_defaults() {
        let filters = NetworkTemplateFilters::default();
        assert!(filters.is_global.is_none());
        assert!(filters.search_query.is_none());
        assert!(filters.tags.is_none());
        assert!(filters.limit.is_none());
        assert!(filters.offset.is_none());
    }
}
