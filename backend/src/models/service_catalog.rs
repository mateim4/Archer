use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// SERVICE CATALOG - CORE MODELS
// ============================================================================

/// Catalog Category - Hierarchical organization of catalog items
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogCategory {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<Thing>,
    pub sort_order: i32,
    pub is_active: bool,
    #[serde(default)]
    pub created_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub updated_at: Option<DateTime<Utc>>,
}

/// Catalog Item - Requestable service with dynamic form
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatalogItem {
    pub id: Option<Thing>,
    pub name: String,
    pub description: String,
    pub category_id: Thing,
    pub icon: Option<String>,
    pub short_description: String,
    pub delivery_time_days: Option<i32>,
    pub cost: Option<f64>,
    pub is_active: bool,
    /// JSON Schema (draft-07) defining the request form
    pub form_schema: serde_json::Value,
    pub approval_required: bool,
    pub approval_group: Option<String>,
    pub fulfillment_group: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Service Request - User's request for a catalog item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceRequest {
    pub id: Option<Thing>,
    pub catalog_item_id: Thing,
    pub requester_id: String,
    /// User-submitted form data matching the catalog item's form_schema
    pub form_data: serde_json::Value,
    pub status: ServiceRequestStatus,
    pub approval_status: Option<ApprovalStatus>,
    pub approved_by: Option<String>,
    pub approved_at: Option<DateTime<Utc>>,
    pub assigned_to: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub rejection_reason: Option<String>,
}

// ============================================================================
// ENUMS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ServiceRequestStatus {
    #[serde(rename = "DRAFT")]
    Draft,
    #[serde(rename = "PENDING_APPROVAL")]
    PendingApproval,
    #[serde(rename = "APPROVED")]
    Approved,
    #[serde(rename = "IN_PROGRESS")]
    InProgress,
    #[serde(rename = "COMPLETED")]
    Completed,
    #[serde(rename = "CANCELLED")]
    Cancelled,
    #[serde(rename = "REJECTED")]
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ApprovalStatus {
    #[serde(rename = "PENDING")]
    Pending,
    #[serde(rename = "APPROVED")]
    Approved,
    #[serde(rename = "REJECTED")]
    Rejected,
}

// ============================================================================
// REQUEST/RESPONSE DTOs
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCategoryRequest {
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<Thing>,
    pub sort_order: i32,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCategoryRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub parent_id: Option<Thing>,
    pub sort_order: Option<i32>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCatalogItemRequest {
    pub name: String,
    pub description: String,
    pub category_id: Thing,
    pub icon: Option<String>,
    pub short_description: String,
    pub delivery_time_days: Option<i32>,
    pub cost: Option<f64>,
    pub is_active: bool,
    pub form_schema: serde_json::Value,
    pub approval_required: bool,
    pub approval_group: Option<String>,
    pub fulfillment_group: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCatalogItemRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<Thing>,
    pub icon: Option<String>,
    pub short_description: Option<String>,
    pub delivery_time_days: Option<i32>,
    pub cost: Option<f64>,
    pub is_active: Option<bool>,
    pub form_schema: Option<serde_json::Value>,
    pub approval_required: Option<bool>,
    pub approval_group: Option<String>,
    pub fulfillment_group: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateServiceRequestRequest {
    pub catalog_item_id: Thing,
    pub form_data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalDecisionRequest {
    pub approved: bool,
    pub reason: Option<String>,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

impl CatalogCategory {
    pub fn new(
        name: String,
        description: Option<String>,
        icon: Option<String>,
        parent_id: Option<Thing>,
        sort_order: i32,
        is_active: bool,
    ) -> Self {
        Self {
            id: None,
            name,
            description,
            icon,
            parent_id,
            sort_order,
            is_active,
            created_at: Some(Utc::now()),
            updated_at: Some(Utc::now()),
        }
    }
}

impl CatalogItem {
    pub fn new(
        name: String,
        description: String,
        category_id: Thing,
        icon: Option<String>,
        short_description: String,
        delivery_time_days: Option<i32>,
        cost: Option<f64>,
        is_active: bool,
        form_schema: serde_json::Value,
        approval_required: bool,
        approval_group: Option<String>,
        fulfillment_group: Option<String>,
    ) -> Self {
        Self {
            id: None,
            name,
            description,
            category_id,
            icon,
            short_description,
            delivery_time_days,
            cost,
            is_active,
            form_schema,
            approval_required,
            approval_group,
            fulfillment_group,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }
}

impl ServiceRequest {
    pub fn new(
        catalog_item_id: Thing,
        requester_id: String,
        form_data: serde_json::Value,
        requires_approval: bool,
    ) -> Self {
        let status = if requires_approval {
            ServiceRequestStatus::PendingApproval
        } else {
            ServiceRequestStatus::Approved
        };

        let approval_status = if requires_approval {
            Some(ApprovalStatus::Pending)
        } else {
            None
        };

        Self {
            id: None,
            catalog_item_id,
            requester_id,
            form_data,
            status,
            approval_status,
            approved_by: None,
            approved_at: None,
            assigned_to: None,
            created_at: Utc::now(),
            updated_at: Utc::now(),
            completed_at: None,
            rejection_reason: None,
        }
    }

    pub fn approve(&mut self, approver_id: String) {
        self.status = ServiceRequestStatus::Approved;
        self.approval_status = Some(ApprovalStatus::Approved);
        self.approved_by = Some(approver_id);
        self.approved_at = Some(Utc::now());
        self.updated_at = Utc::now();
    }

    pub fn reject(&mut self, approver_id: String, reason: Option<String>) {
        self.status = ServiceRequestStatus::Rejected;
        self.approval_status = Some(ApprovalStatus::Rejected);
        self.approved_by = Some(approver_id);
        self.approved_at = Some(Utc::now());
        self.rejection_reason = reason;
        self.updated_at = Utc::now();
    }
}
