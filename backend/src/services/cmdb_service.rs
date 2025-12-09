// Archer ITSM - CMDB Service
// Configuration Management Database operations with graph traversal

use crate::models::cmdb::*;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use std::sync::Arc;
use surrealdb::engine::local::Db;
use surrealdb::sql::Thing;
use surrealdb::Surreal;

pub struct CMDBService;

impl CMDBService {
    // ========================================================================
    // CONFIGURATION ITEM OPERATIONS
    // ========================================================================

    /// Create a new Configuration Item
    pub async fn create_ci(
        db: Arc<Surreal<Db>>,
        request: CreateCIRequest,
        user_id: &str,
        user_name: &str,
        tenant_id: Option<&str>,
    ) -> Result<ConfigurationItem, String> {
        // Generate CI ID if not provided
        let ci_id = match &request.ci_id {
            Some(id) => id.clone(),
            None => Self::generate_ci_id(db.clone(), &request.ci_class).await?,
        };

        // Check for duplicate CI ID
        let existing: Option<ConfigurationItem> = db
            .query("SELECT * FROM configuration_items WHERE ci_id = $ci_id LIMIT 1")
            .bind(("ci_id", &ci_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        if existing.is_some() {
            return Err(format!("CI with ID '{}' already exists", ci_id));
        }

        let now = Utc::now();
        let tenant_thing = tenant_id.map(|t| Thing::from(("tenants", t)));

        let ci = ConfigurationItem {
            id: None,
            ci_id,
            name: request.name,
            description: request.description,
            ci_class: request.ci_class,
            ci_type: request.ci_type,
            status: request.status,
            criticality: request.criticality,
            environment: request.environment,
            location: request.location,
            owner_id: request.owner_id.clone(),
            owner_name: None, // TODO: Lookup from user service
            support_group: request.support_group,
            vendor: request.vendor,
            model: request.model,
            serial_number: request.serial_number,
            version: request.version,
            ip_address: request.ip_address,
            fqdn: request.fqdn,
            attributes: request.attributes,
            discovery_source: DiscoverySource::Manual,
            discovery_id: None,
            last_discovered: None,
            install_date: request.install_date,
            warranty_expiry: request.warranty_expiry,
            end_of_life: request.end_of_life,
            decommission_date: None,
            tags: request.tags,
            created_at: now,
            updated_at: now,
            created_by: user_id.to_string(),
            updated_by: user_id.to_string(),
            tenant_id: tenant_thing,
        };

        let created: Vec<ConfigurationItem> = db
            .create("configuration_items")
            .content(&ci)
            .await
            .map_err(|e| e.to_string())?;

        let created_ci = created.into_iter().next()
            .ok_or_else(|| "Failed to create CI".to_string())?;

        // Record history
        let new_value_json = serde_json::to_string(&created_ci).unwrap_or_default();
        Self::record_history(
            db,
            created_ci.id.as_ref().unwrap().clone(),
            CIChangeType::Create,
            None,
            None,
            Some(&new_value_json),
            None,
            user_id,
            user_name,
        ).await?;

        Ok(created_ci)
    }

    /// Generate sequential CI ID based on class
    async fn generate_ci_id(
        db: Arc<Surreal<Db>>,
        ci_class: &CIClass,
    ) -> Result<String, String> {
        let prefix = match ci_class {
            CIClass::Hardware => "HW",
            CIClass::Software => "SW",
            CIClass::Service => "SVC",
            CIClass::Document => "DOC",
            CIClass::Network => "NET",
            CIClass::Cloud => "CLD",
            CIClass::Container => "CTR",
            CIClass::Database => "DB",
            CIClass::Virtual => "VM",
        };

        // Get count of existing CIs with this prefix
        let count_result: Vec<JsonValue> = db
            .query("SELECT count() FROM configuration_items WHERE ci_id CONTAINS $prefix GROUP ALL")
            .bind(("prefix", prefix))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let count = count_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) + 1;

        Ok(format!("{}-{:05}", prefix, count))
    }

    /// Get CI by database ID
    pub async fn get_ci(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<Option<ConfigurationItem>, String> {
        let ci: Option<ConfigurationItem> = db
            .select(("configuration_items", id))
            .await
            .map_err(|e| e.to_string())?;

        Ok(ci)
    }

    /// Get CI by CI ID (e.g., "SRV-00001")
    pub async fn get_ci_by_ci_id(
        db: Arc<Surreal<Db>>,
        ci_id: &str,
    ) -> Result<Option<ConfigurationItem>, String> {
        let ci: Option<ConfigurationItem> = db
            .query("SELECT * FROM configuration_items WHERE ci_id = $ci_id LIMIT 1")
            .bind(("ci_id", ci_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(ci)
    }

    /// Get CI with all relationships and history
    pub async fn get_ci_detail(
        db: Arc<Surreal<Db>>,
        id: &str,
    ) -> Result<Option<CIDetailResponse>, String> {
        let ci = match Self::get_ci(db.clone(), id).await? {
            Some(c) => c,
            None => return Ok(None),
        };

        let ci_thing = Thing::from(("configuration_items", id));

        // Get relationships with related CIs
        let relationships = Self::get_ci_relationships_expanded(db.clone(), &ci_thing).await?;

        // Get history
        let history: Vec<CIHistory> = db
            .query("SELECT * FROM ci_history WHERE ci_id = $ci_id ORDER BY created_at DESC LIMIT 50")
            .bind(("ci_id", &ci_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Get linked tickets
        let linked_tickets: Vec<Thing> = db
            .query("SELECT id FROM tickets WHERE affected_ci = $ci_id")
            .bind(("ci_id", &ci_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(Some(CIDetailResponse {
            ci,
            relationships,
            history,
            linked_tickets,
        }))
    }

    /// Update a Configuration Item
    pub async fn update_ci(
        db: Arc<Surreal<Db>>,
        id: &str,
        request: UpdateCIRequest,
        user_id: &str,
        user_name: &str,
    ) -> Result<ConfigurationItem, String> {
        let existing = Self::get_ci(db.clone(), id).await?
            .ok_or_else(|| "CI not found".to_string())?;

        let now = Utc::now();
        let mut changes: Vec<(String, String, String)> = Vec::new();

        // Track changes for history
        macro_rules! track_change {
            ($field:ident, $name:expr) => {
                if let Some(ref new_val) = request.$field {
                    let old_val = serde_json::to_string(&existing.$field).unwrap_or_default();
                    let new_str = serde_json::to_string(new_val).unwrap_or_default();
                    if old_val != new_str {
                        changes.push(($name.to_string(), old_val, new_str));
                    }
                }
            };
        }

        track_change!(name, "name");
        track_change!(description, "description");
        track_change!(status, "status");
        track_change!(criticality, "criticality");
        track_change!(environment, "environment");
        track_change!(location, "location");
        track_change!(owner_id, "owner_id");
        track_change!(support_group, "support_group");
        track_change!(ip_address, "ip_address");

        // Build update query
        let updated: Option<ConfigurationItem> = db
            .query(r#"
                UPDATE configuration_items SET
                    name = $name,
                    description = $description,
                    ci_type = $ci_type,
                    status = $status,
                    criticality = $criticality,
                    environment = $environment,
                    location = $location,
                    owner_id = $owner_id,
                    support_group = $support_group,
                    vendor = $vendor,
                    model = $model,
                    serial_number = $serial_number,
                    version = $version,
                    ip_address = $ip_address,
                    fqdn = $fqdn,
                    attributes = $attributes,
                    tags = $tags,
                    install_date = $install_date,
                    warranty_expiry = $warranty_expiry,
                    end_of_life = $end_of_life,
                    updated_at = $updated_at,
                    updated_by = $updated_by
                WHERE id = $id
                RETURN AFTER
            "#)
            .bind(("id", Thing::from(("configuration_items", id))))
            .bind(("name", request.name.unwrap_or(existing.name)))
            .bind(("description", request.description.or(existing.description)))
            .bind(("ci_type", request.ci_type.unwrap_or(existing.ci_type)))
            .bind(("status", request.status.unwrap_or(existing.status)))
            .bind(("criticality", request.criticality.unwrap_or(existing.criticality)))
            .bind(("environment", request.environment.or(existing.environment)))
            .bind(("location", request.location.or(existing.location)))
            .bind(("owner_id", request.owner_id.or(existing.owner_id)))
            .bind(("support_group", request.support_group.or(existing.support_group)))
            .bind(("vendor", request.vendor.or(existing.vendor)))
            .bind(("model", request.model.or(existing.model)))
            .bind(("serial_number", request.serial_number.or(existing.serial_number)))
            .bind(("version", request.version.or(existing.version)))
            .bind(("ip_address", request.ip_address.or(existing.ip_address)))
            .bind(("fqdn", request.fqdn.or(existing.fqdn)))
            .bind(("attributes", request.attributes.unwrap_or(existing.attributes)))
            .bind(("tags", request.tags.unwrap_or(existing.tags)))
            .bind(("install_date", request.install_date.or(existing.install_date)))
            .bind(("warranty_expiry", request.warranty_expiry.or(existing.warranty_expiry)))
            .bind(("end_of_life", request.end_of_life.or(existing.end_of_life)))
            .bind(("updated_at", now))
            .bind(("updated_by", user_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let updated_ci = updated.ok_or_else(|| "Failed to update CI".to_string())?;

        // Record history for each change
        for (field, old_val, new_val) in changes {
            Self::record_history(
                db.clone(),
                updated_ci.id.as_ref().unwrap().clone(),
                CIChangeType::Update,
                Some(&field),
                Some(&old_val),
                Some(&new_val),
                request.change_reason.as_deref(),
                user_id,
                user_name,
            ).await?;
        }

        Ok(updated_ci)
    }

    /// Delete a Configuration Item (soft delete via status change)
    pub async fn delete_ci(
        db: Arc<Surreal<Db>>,
        id: &str,
        user_id: &str,
        user_name: &str,
    ) -> Result<(), String> {
        let ci_thing = Thing::from(("configuration_items", id));

        // Set status to Disposed
        let _: Option<ConfigurationItem> = db
            .query("UPDATE configuration_items SET status = $status, decommission_date = $date, updated_at = $date, updated_by = $user WHERE id = $id")
            .bind(("id", &ci_thing))
            .bind(("status", CIStatus::Disposed))
            .bind(("date", Utc::now()))
            .bind(("user", user_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Deactivate all relationships
        let _: Vec<CIRelationship> = db
            .query("UPDATE ci_relationships SET is_active = false WHERE source_id = $id OR target_id = $id")
            .bind(("id", &ci_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Record history
        Self::record_history(
            db,
            ci_thing,
            CIChangeType::Delete,
            Some("status"),
            Some("Active"),
            Some("Disposed"),
            Some("CI deleted/decommissioned"),
            user_id,
            user_name,
        ).await?;

        Ok(())
    }

    /// Search Configuration Items
    pub async fn search_cis(
        db: Arc<Surreal<Db>>,
        request: CISearchRequest,
    ) -> Result<CIListResponse, String> {
        let page = request.page.unwrap_or(1).max(1);
        let page_size = request.page_size.unwrap_or(20).min(100);
        let offset = (page - 1) * page_size;

        let mut conditions = vec!["status != 'DISPOSED'".to_string()];
        let mut bind_values: HashMap<String, JsonValue> = HashMap::new();

        // Full-text search on name/description
        if let Some(ref query) = request.query {
            conditions.push("(name CONTAINS $query OR description CONTAINS $query OR ci_id CONTAINS $query)".to_string());
            bind_values.insert("query".to_string(), JsonValue::String(query.clone()));
        }

        if let Some(ref ci_class) = request.ci_class {
            conditions.push("ci_class = $ci_class".to_string());
            bind_values.insert("ci_class".to_string(), serde_json::to_value(ci_class).unwrap());
        }

        if let Some(ref ci_type) = request.ci_type {
            conditions.push("ci_type = $ci_type".to_string());
            bind_values.insert("ci_type".to_string(), JsonValue::String(ci_type.clone()));
        }

        if let Some(ref statuses) = request.status {
            let status_list: Vec<String> = statuses.iter()
                .map(|s| format!("'{}'", serde_json::to_string(s).unwrap().trim_matches('"')))
                .collect();
            conditions.push(format!("status IN [{}]", status_list.join(",")));
        }

        if let Some(ref criticalities) = request.criticality {
            let crit_list: Vec<String> = criticalities.iter()
                .map(|c| format!("'{}'", serde_json::to_string(c).unwrap().trim_matches('"')))
                .collect();
            conditions.push(format!("criticality IN [{}]", crit_list.join(",")));
        }

        if let Some(ref env) = request.environment {
            conditions.push("environment = $environment".to_string());
            bind_values.insert("environment".to_string(), JsonValue::String(env.clone()));
        }

        if let Some(ref loc) = request.location {
            conditions.push("location = $location".to_string());
            bind_values.insert("location".to_string(), JsonValue::String(loc.clone()));
        }

        if let Some(ref owner) = request.owner_id {
            conditions.push("owner_id = $owner_id".to_string());
            bind_values.insert("owner_id".to_string(), JsonValue::String(owner.clone()));
        }

        if let Some(ref group) = request.support_group {
            conditions.push("support_group = $support_group".to_string());
            bind_values.insert("support_group".to_string(), JsonValue::String(group.clone()));
        }

        if let Some(ref tags) = request.tags {
            for (i, tag) in tags.iter().enumerate() {
                let key = format!("tag_{}", i);
                conditions.push(format!("${} IN tags", key));
                bind_values.insert(key, JsonValue::String(tag.clone()));
            }
        }

        let where_clause = conditions.join(" AND ");

        // Get total count
        let count_query = format!(
            "SELECT count() FROM configuration_items WHERE {} GROUP ALL",
            where_clause
        );

        let mut count_stmt = db.query(&count_query);
        for (key, val) in &bind_values {
            count_stmt = count_stmt.bind((key.as_str(), val.clone()));
        }

        let count_result: Vec<JsonValue> = count_stmt
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total = count_result
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        // Get items
        let items_query = format!(
            "SELECT * FROM configuration_items WHERE {} ORDER BY ci_id ASC LIMIT {} START {}",
            where_clause, page_size, offset
        );

        let mut items_stmt = db.query(&items_query);
        for (key, val) in &bind_values {
            items_stmt = items_stmt.bind((key.as_str(), val.clone()));
        }

        let items: Vec<ConfigurationItem> = items_stmt
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(CIListResponse {
            items,
            total,
            page,
            page_size,
        })
    }

    // ========================================================================
    // RELATIONSHIP OPERATIONS
    // ========================================================================

    /// Create a relationship between two CIs
    pub async fn create_relationship(
        db: Arc<Surreal<Db>>,
        request: CreateRelationshipRequest,
        user_id: &str,
        user_name: &str,
    ) -> Result<CIRelationship, String> {
        let source = Thing::from(("configuration_items", request.source_id.as_str()));
        let target = Thing::from(("configuration_items", request.target_id.as_str()));

        // Verify both CIs exist
        let source_ci = Self::get_ci(db.clone(), &request.source_id).await?
            .ok_or_else(|| format!("Source CI '{}' not found", request.source_id))?;
        let target_ci = Self::get_ci(db.clone(), &request.target_id).await?
            .ok_or_else(|| format!("Target CI '{}' not found", request.target_id))?;

        // Check for duplicate relationship
        let existing: Option<CIRelationship> = db
            .query("SELECT * FROM ci_relationships WHERE source_id = $source AND target_id = $target AND relationship_type = $type AND is_active = true LIMIT 1")
            .bind(("source", &source))
            .bind(("target", &target))
            .bind(("type", &request.relationship_type))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        if existing.is_some() {
            return Err("This relationship already exists".to_string());
        }

        let now = Utc::now();
        let relationship = CIRelationship {
            id: None,
            source_id: source.clone(),
            target_id: target.clone(),
            relationship_type: request.relationship_type,
            direction: request.direction,
            description: request.description,
            is_active: true,
            discovery_source: DiscoverySource::Manual,
            created_at: now,
            updated_at: now,
            created_by: user_id.to_string(),
        };

        let created: Vec<CIRelationship> = db
            .create("ci_relationships")
            .content(&relationship)
            .await
            .map_err(|e| e.to_string())?;

        let created_rel = created.into_iter().next()
            .ok_or_else(|| "Failed to create relationship".to_string())?;

        // Record history for both CIs
        Self::record_history(
            db.clone(),
            source,
            CIChangeType::RelationshipAdd,
            Some("relationship"),
            None,
            Some(&format!("{} -> {}", source_ci.ci_id, target_ci.ci_id)),
            None,
            user_id,
            user_name,
        ).await?;

        Ok(created_rel)
    }

    /// Delete a relationship
    pub async fn delete_relationship(
        db: Arc<Surreal<Db>>,
        id: &str,
        user_id: &str,
        user_name: &str,
    ) -> Result<(), String> {
        let rel_thing = Thing::from(("ci_relationships", id));

        // Get the relationship first
        let rel: Option<CIRelationship> = db
            .select(&rel_thing)
            .await
            .map_err(|e| e.to_string())?;

        let relationship = rel.ok_or_else(|| "Relationship not found".to_string())?;

        // Soft delete by marking inactive
        let _: Option<CIRelationship> = db
            .query("UPDATE ci_relationships SET is_active = false, updated_at = $now WHERE id = $id")
            .bind(("id", &rel_thing))
            .bind(("now", Utc::now()))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Record history
        Self::record_history(
            db,
            relationship.source_id,
            CIChangeType::RelationshipRemove,
            Some("relationship"),
            Some(&id.to_string()),
            None,
            None,
            user_id,
            user_name,
        ).await?;

        Ok(())
    }

    /// Get all relationships for a CI
    pub async fn get_ci_relationships(
        db: Arc<Surreal<Db>>,
        ci_id: &Thing,
    ) -> Result<Vec<CIRelationship>, String> {
        let relationships: Vec<CIRelationship> = db
            .query("SELECT * FROM ci_relationships WHERE (source_id = $ci OR target_id = $ci) AND is_active = true")
            .bind(("ci", ci_id))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(relationships)
    }

    /// Get relationships with expanded CI details
    async fn get_ci_relationships_expanded(
        db: Arc<Surreal<Db>>,
        ci_id: &Thing,
    ) -> Result<Vec<CIRelationshipExpanded>, String> {
        let relationships = Self::get_ci_relationships(db.clone(), ci_id).await?;
        let mut expanded = Vec::new();

        for rel in relationships {
            // Get the related CI (the one that's not the current CI)
            let related_id = if rel.source_id == *ci_id {
                &rel.target_id
            } else {
                &rel.source_id
            };

            let related_ci: Option<ConfigurationItem> = db
                .select(related_id)
                .await
                .map_err(|e| e.to_string())?;

            if let Some(ci) = related_ci {
                expanded.push(CIRelationshipExpanded {
                    relationship: rel,
                    related_ci: ci,
                });
            }
        }

        Ok(expanded)
    }

    // ========================================================================
    // IMPACT ANALYSIS (Graph Traversal)
    // ========================================================================

    /// Analyze impact of a CI - find all dependent CIs
    pub async fn analyze_impact(
        db: Arc<Surreal<Db>>,
        request: ImpactAnalysisRequest,
    ) -> Result<ImpactAnalysisResponse, String> {
        let source_ci = Self::get_ci_by_ci_id(db.clone(), &request.ci_id).await?
            .ok_or_else(|| format!("CI '{}' not found", request.ci_id))?;

        let max_depth = request.depth.unwrap_or(3).min(10);
        let ci_thing = source_ci.id.as_ref().unwrap().clone();

        // Use SurrealDB graph traversal for impact analysis
        // Find all CIs that depend on this one (following dependency relationships)
        let dependency_types = request.relationship_types.unwrap_or_else(|| vec![
            RelationshipType::DependsOn,
            RelationshipType::RequiredBy,
            RelationshipType::RunsOn,
            RelationshipType::Uses,
        ]);

        let type_list: Vec<String> = dependency_types.iter()
            .map(|t| format!("'{}'", serde_json::to_string(t).unwrap().trim_matches('"')))
            .collect();

        // Recursive query to find impacted CIs up to max_depth
        let impacted_query = format!(r#"
            SELECT DISTINCT ci.*, 
                   1 as distance,
                   rel.relationship_type
            FROM ci_relationships rel
            JOIN configuration_items ci ON ci.id = rel.source_id
            WHERE rel.target_id = $ci_id 
              AND rel.is_active = true
              AND rel.relationship_type IN [{}]
              AND ci.status != 'DISPOSED'
        "#, type_list.join(","));

        let impacted: Vec<JsonValue> = db
            .query(&impacted_query)
            .bind(("ci_id", &ci_thing))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        // Convert to ImpactedCI
        let mut impacted_cis: Vec<ImpactedCI> = Vec::new();
        for val in impacted {
            if let Ok(ci) = serde_json::from_value::<ConfigurationItem>(val.clone()) {
                let rel_type: RelationshipType = val.get("relationship_type")
                    .and_then(|v| serde_json::from_value(v.clone()).ok())
                    .unwrap_or(RelationshipType::DependsOn);

                impacted_cis.push(ImpactedCI {
                    ci,
                    distance: 1,
                    path: vec![source_ci.ci_id.clone()],
                    relationship_type: rel_type,
                });
            }
        }

        // TODO: Implement recursive depth traversal for depths > 1

        Ok(ImpactAnalysisResponse {
            source_ci,
            total_impact_count: impacted_cis.len() as u32,
            impacted_cis,
        })
    }

    // ========================================================================
    // HISTORY TRACKING
    // ========================================================================

    /// Record a change in CI history
    async fn record_history(
        db: Arc<Surreal<Db>>,
        ci_id: Thing,
        change_type: CIChangeType,
        field_name: Option<&str>,
        old_value: Option<&str>,
        new_value: Option<&str>,
        change_reason: Option<&str>,
        user_id: &str,
        user_name: &str,
    ) -> Result<CIHistory, String> {
        let history = CIHistory {
            id: None,
            ci_id,
            change_type,
            field_name: field_name.map(|s| s.to_string()),
            old_value: old_value.map(|s| s.to_string()),
            new_value: new_value.map(|s| s.to_string()),
            change_reason: change_reason.map(|s| s.to_string()),
            changed_by: user_id.to_string(),
            changed_by_name: user_name.to_string(),
            created_at: Utc::now(),
        };

        let created: Vec<CIHistory> = db
            .create("ci_history")
            .content(&history)
            .await
            .map_err(|e| e.to_string())?;

        created.into_iter().next()
            .ok_or_else(|| "Failed to record history".to_string())
    }

    /// Get CI history
    pub async fn get_ci_history(
        db: Arc<Surreal<Db>>,
        ci_id: &str,
        limit: Option<u32>,
    ) -> Result<Vec<CIHistory>, String> {
        let ci_thing = Thing::from(("configuration_items", ci_id));
        let limit = limit.unwrap_or(50);

        let history: Vec<CIHistory> = db
            .query("SELECT * FROM ci_history WHERE ci_id = $ci_id ORDER BY created_at DESC LIMIT $limit")
            .bind(("ci_id", &ci_thing))
            .bind(("limit", limit))
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        Ok(history)
    }

    // ========================================================================
    // STATISTICS & REPORTING
    // ========================================================================

    /// Get CMDB statistics
    pub async fn get_statistics(
        db: Arc<Surreal<Db>>,
    ) -> Result<CMDBStatistics, String> {
        // Total CIs by class
        let class_counts: Vec<JsonValue> = db
            .query("SELECT ci_class, count() as count FROM configuration_items WHERE status != 'DISPOSED' GROUP BY ci_class")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let mut by_class: HashMap<String, u64> = HashMap::new();
        for row in class_counts {
            if let (Some(class), Some(count)) = (row.get("ci_class"), row.get("count")) {
                by_class.insert(
                    class.as_str().unwrap_or("unknown").to_string(),
                    count.as_u64().unwrap_or(0),
                );
            }
        }

        // Total CIs by status
        let status_counts: Vec<JsonValue> = db
            .query("SELECT status, count() as count FROM configuration_items GROUP BY status")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let mut by_status: HashMap<String, u64> = HashMap::new();
        for row in status_counts {
            if let (Some(status), Some(count)) = (row.get("status"), row.get("count")) {
                by_status.insert(
                    status.as_str().unwrap_or("unknown").to_string(),
                    count.as_u64().unwrap_or(0),
                );
            }
        }

        // Total relationships
        let rel_count: Vec<JsonValue> = db
            .query("SELECT count() FROM ci_relationships WHERE is_active = true GROUP ALL")
            .await
            .map_err(|e| e.to_string())?
            .take(0)
            .map_err(|e| e.to_string())?;

        let total_relationships = rel_count
            .first()
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);

        let total_cis: u64 = by_status.values().sum();

        Ok(CMDBStatistics {
            total_cis,
            total_relationships,
            by_class,
            by_status,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CMDBStatistics {
    pub total_cis: u64,
    pub total_relationships: u64,
    pub by_class: HashMap<String, u64>,
    pub by_status: HashMap<String, u64>,
}
