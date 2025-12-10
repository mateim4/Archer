use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// CORE TICKET MODEL (Phase 1 Enhanced)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Ticket {
    pub id: Option<Thing>,
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub ticket_type: TicketType,
    pub priority: TicketPriority,
    pub status: TicketStatus,
    pub related_asset: Option<Thing>,
    pub related_project: Option<Thing>,
    pub assignee: Option<String>,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    
    // Phase 1 Enhancements
    /// SLA policy applied to this ticket
    #[serde(default)]
    pub sla_policy_id: Option<Thing>,
    /// When the SLA will breach (if not resolved)
    #[serde(default)]
    pub sla_breach_at: Option<DateTime<Utc>>,
    /// When response is due (first response SLA)
    #[serde(default)]
    pub response_due: Option<DateTime<Utc>>,
    /// When resolution is due
    #[serde(default)]
    pub resolution_due: Option<DateTime<Utc>>,
    /// Whether response SLA has been met
    #[serde(default)]
    pub response_sla_met: Option<bool>,
    /// Whether resolution SLA has been met
    #[serde(default)]
    pub resolution_sla_met: Option<bool>,
    /// First response timestamp
    #[serde(default)]
    pub first_response_at: Option<DateTime<Utc>>,
    /// Resolution timestamp
    #[serde(default)]
    pub resolved_at: Option<DateTime<Utc>>,
    /// Closure timestamp
    #[serde(default)]
    pub closed_at: Option<DateTime<Utc>>,
    /// Users watching this ticket
    #[serde(default)]
    pub watchers: Vec<String>,
    /// Tags for categorization
    #[serde(default)]
    pub tags: Vec<String>,
    /// Custom fields (for extensibility)
    #[serde(default)]
    pub custom_fields: Option<serde_json::Value>,
    /// Impact assessment
    #[serde(default)]
    pub impact: Option<TicketImpact>,
    /// Urgency assessment  
    #[serde(default)]
    pub urgency: Option<TicketUrgency>,
    /// Source of ticket (email, portal, phone, etc.)
    #[serde(default)]
    pub source: Option<TicketSource>,
    /// Category for classification
    #[serde(default)]
    pub category: Option<String>,
    /// Subcategory for detailed classification
    #[serde(default)]
    pub subcategory: Option<String>,
    /// Team/group assignment (legacy string-based)
    #[serde(default)]
    pub assigned_group: Option<String>,
    /// Team assignment (proper reference to teams table)
    #[serde(default)]
    pub assignment_team_id: Option<Thing>,
    /// Tenant ID for multi-tenant isolation
    #[serde(default)]
    pub tenant_id: Option<Thing>,
    /// Parent ticket ID (for parent/child relationships)
    #[serde(default)]
    pub parent_ticket_id: Option<Thing>,
}

// ============================================================================
// TICKET ENUMS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketType {
    #[serde(rename = "INCIDENT")]
    Incident,
    #[serde(rename = "PROBLEM")]
    Problem,
    #[serde(rename = "CHANGE")]
    Change,
    #[serde(rename = "SERVICE_REQUEST")]
    ServiceRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketPriority {
    P1,
    P2,
    P3,
    P4,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketStatus {
    #[serde(rename = "NEW")]
    New,
    #[serde(rename = "ASSIGNED")]
    Assigned,
    #[serde(rename = "IN_PROGRESS")]
    InProgress,
    #[serde(rename = "ON_HOLD")]
    OnHold,
    #[serde(rename = "PENDING_CUSTOMER")]
    PendingCustomer,
    #[serde(rename = "PENDING_VENDOR")]
    PendingVendor,
    #[serde(rename = "RESOLVED")]
    Resolved,
    #[serde(rename = "CLOSED")]
    Closed,
    #[serde(rename = "CANCELLED")]
    Cancelled,
}

impl TicketStatus {
    /// Get valid transitions from the current status
    pub fn valid_transitions(&self) -> Vec<TicketStatus> {
        match self {
            TicketStatus::New => vec![
                TicketStatus::Assigned,
                TicketStatus::Cancelled,
            ],
            TicketStatus::Assigned => vec![
                TicketStatus::InProgress,
                TicketStatus::OnHold,
                TicketStatus::Cancelled,
            ],
            TicketStatus::InProgress => vec![
                TicketStatus::OnHold,
                TicketStatus::PendingCustomer,
                TicketStatus::PendingVendor,
                TicketStatus::Resolved,
            ],
            TicketStatus::OnHold => vec![
                TicketStatus::InProgress,
                TicketStatus::Cancelled,
            ],
            TicketStatus::PendingCustomer => vec![
                TicketStatus::InProgress,
                TicketStatus::Resolved,
                TicketStatus::Cancelled,
            ],
            TicketStatus::PendingVendor => vec![
                TicketStatus::InProgress,
                TicketStatus::Resolved,
            ],
            TicketStatus::Resolved => vec![
                TicketStatus::Closed,
                TicketStatus::InProgress, // Reopen
            ],
            TicketStatus::Closed => vec![], // Terminal state
            TicketStatus::Cancelled => vec![], // Terminal state
        }
    }

    /// Check if transition to target status is valid
    pub fn can_transition_to(&self, target: &TicketStatus) -> bool {
        self.valid_transitions().contains(target)
    }

    /// Check if this is a terminal status
    pub fn is_terminal(&self) -> bool {
        matches!(self, TicketStatus::Closed | TicketStatus::Cancelled)
    }

    /// Check if SLA clock should be stopped
    pub fn stops_sla_clock(&self) -> bool {
        matches!(
            self,
            TicketStatus::OnHold
                | TicketStatus::PendingCustomer
                | TicketStatus::PendingVendor
                | TicketStatus::Resolved
                | TicketStatus::Closed
                | TicketStatus::Cancelled
        )
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketImpact {
    #[serde(rename = "HIGH")]
    High,      // Affects many users or critical business function
    #[serde(rename = "MEDIUM")]
    Medium,    // Affects a department or important function
    #[serde(rename = "LOW")]
    Low,       // Affects a few users or minor function
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketUrgency {
    #[serde(rename = "HIGH")]
    High,      // Immediate attention required
    #[serde(rename = "MEDIUM")]
    Medium,    // Should be addressed soon
    #[serde(rename = "LOW")]
    Low,       // Can wait for scheduled handling
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketSource {
    #[serde(rename = "PORTAL")]
    Portal,
    #[serde(rename = "EMAIL")]
    Email,
    #[serde(rename = "PHONE")]
    Phone,
    #[serde(rename = "CHAT")]
    Chat,
    #[serde(rename = "MONITORING")]
    Monitoring, // Auto-generated from monitoring alert
    #[serde(rename = "API")]
    Api,
}

// ============================================================================
// TICKET COMMENTS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketComment {
    pub id: Option<Thing>,
    pub ticket_id: Thing,
    pub content: String,
    pub author_id: String,
    pub author_name: String,
    /// Whether this is an internal note (not visible to customers)
    pub is_internal: bool,
    /// Type of comment
    pub comment_type: CommentType,
    /// Attachments associated with this comment
    #[serde(default)]
    pub attachments: Vec<CommentAttachment>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CommentType {
    #[serde(rename = "NOTE")]
    Note,           // General note
    #[serde(rename = "WORKAROUND")]
    Workaround,     // Workaround provided
    #[serde(rename = "SOLUTION")]
    Solution,       // Solution provided
    #[serde(rename = "CUSTOMER_RESPONSE")]
    CustomerResponse,
    #[serde(rename = "STATUS_UPDATE")]
    StatusUpdate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentAttachment {
    pub filename: String,
    pub file_path: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub uploaded_at: DateTime<Utc>,
}

// ============================================================================
// TICKET HISTORY
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketHistory {
    pub id: Option<Thing>,
    pub ticket_id: Thing,
    pub field_name: String,
    pub old_value: Option<String>,
    pub new_value: Option<String>,
    pub changed_by: String,
    pub changed_by_name: String,
    pub change_type: HistoryChangeType,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum HistoryChangeType {
    #[serde(rename = "CREATE")]
    Create,
    #[serde(rename = "UPDATE")]
    Update,
    #[serde(rename = "STATUS_CHANGE")]
    StatusChange,
    #[serde(rename = "ASSIGNMENT")]
    Assignment,
    #[serde(rename = "COMMENT")]
    Comment,
    #[serde(rename = "ATTACHMENT")]
    Attachment,
    #[serde(rename = "SLA_UPDATE")]
    SlaUpdate,
}

// ============================================================================
// TICKET ATTACHMENTS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketAttachment {
    pub id: Option<Thing>,
    pub ticket_id: Thing,
    pub filename: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub storage_path: String,
    pub uploaded_by: String,
    pub uploaded_at: DateTime<Utc>,
}

// ============================================================================
// SLA MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaPolicy {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    /// Response time target in minutes
    pub response_target_minutes: i64,
    /// Resolution time target in minutes  
    pub resolution_target_minutes: i64,
    /// Priorities this SLA applies to
    pub applies_to_priorities: Vec<TicketPriority>,
    /// Ticket types this SLA applies to
    pub applies_to_types: Vec<TicketType>,
    /// Business hours definition ID (for time calculation)
    pub business_hours_id: Option<Thing>,
    /// Whether SLA is active
    pub is_active: bool,
    /// Escalation rules
    #[serde(default)]
    pub escalation_rules: Vec<EscalationRule>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscalationRule {
    /// Percentage of SLA time remaining when escalation triggers
    pub trigger_at_percent: u8,
    /// Users to notify
    pub notify_users: Vec<String>,
    /// Groups to notify
    pub notify_groups: Vec<String>,
    /// Whether to reassign ticket
    pub reassign_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BusinessHours {
    pub id: Option<Thing>,
    pub name: String,
    pub timezone: String,
    /// Schedule for each day of the week (0=Sunday, 6=Saturday)
    pub schedule: Vec<DaySchedule>,
    /// Holiday dates (SLA clock paused)
    pub holidays: Vec<String>, // ISO date strings
    pub is_default: bool,
    pub tenant_id: Option<Thing>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DaySchedule {
    pub day: u8,         // 0-6 (Sunday-Saturday)
    pub is_working_day: bool,
    pub start_time: Option<String>, // "09:00"
    pub end_time: Option<String>,   // "17:00"
}

// ============================================================================
// REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTicketRequest {
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "type")]
    pub ticket_type: TicketType,
    pub priority: TicketPriority,
    pub related_asset: Option<String>,
    pub related_project: Option<String>,
    pub assignee: Option<String>,
    pub created_by: String,
    // Phase 1 additions
    #[serde(default)]
    pub impact: Option<TicketImpact>,
    #[serde(default)]
    pub urgency: Option<TicketUrgency>,
    #[serde(default)]
    pub source: Option<TicketSource>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub subcategory: Option<String>,
    #[serde(default)]
    pub assigned_group: Option<String>,
    #[serde(default)]
    pub assignment_team_id: Option<String>,  // Team ID as string
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub watchers: Vec<String>,
    #[serde(default)]
    pub custom_fields: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTicketRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub status: Option<TicketStatus>,
    pub priority: Option<TicketPriority>,
    pub assignee: Option<String>,
    // Phase 1 additions
    pub impact: Option<TicketImpact>,
    pub urgency: Option<TicketUrgency>,
    pub category: Option<String>,
    pub subcategory: Option<String>,
    pub assigned_group: Option<String>,
    pub assignment_team_id: Option<String>,  // Team ID as string
    pub tags: Option<Vec<String>>,
    pub custom_fields: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddWatcherRequest {
    pub user_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub is_internal: bool,
    #[serde(default)]
    pub comment_type: Option<CommentType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransitionTicketRequest {
    pub target_status: TicketStatus,
    pub comment: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketResponse {
    #[serde(flatten)]
    pub ticket: Ticket,
    /// Comments on the ticket
    #[serde(default)]
    pub comments: Vec<TicketComment>,
    /// History of changes
    #[serde(default)]
    pub history: Vec<TicketHistory>,
    /// SLA status
    #[serde(default)]
    pub sla_status: Option<SlaStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlaStatus {
    pub response_due: Option<DateTime<Utc>>,
    pub resolution_due: Option<DateTime<Utc>>,
    pub response_breached: bool,
    pub resolution_breached: bool,
    pub response_time_remaining_minutes: Option<i64>,
    pub resolution_time_remaining_minutes: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketListResponse {
    pub tickets: Vec<Ticket>,
    pub total: u64,
    pub page: u32,
    pub page_size: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketFilterParams {
    pub status: Option<Vec<TicketStatus>>,
    pub priority: Option<Vec<TicketPriority>>,
    pub ticket_type: Option<Vec<TicketType>>,
    pub assignee: Option<String>,
    pub assigned_group: Option<String>,
    pub created_by: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub search: Option<String>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
}

// ============================================================================
// TICKET RELATIONSHIPS
// ============================================================================

/// Represents a relationship between two tickets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketRelationship {
    pub id: Option<Thing>,
    /// Source ticket ID (the ticket from which the relationship originates)
    pub source_ticket_id: Thing,
    /// Target ticket ID (the ticket being related to)
    pub target_ticket_id: Thing,
    /// Type of relationship
    pub relationship_type: TicketRelationType,
    /// User who created this relationship
    pub created_by: String,
    /// When the relationship was created
    pub created_at: DateTime<Utc>,
    /// Optional notes about the relationship
    pub notes: Option<String>,
}

/// Types of relationships between tickets
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TicketRelationType {
    /// Source ticket is parent of target ticket
    #[serde(rename = "PARENT_OF")]
    ParentOf,
    /// Source ticket is child of target ticket
    #[serde(rename = "CHILD_OF")]
    ChildOf,
    /// Source ticket duplicates target (source should be closed)
    #[serde(rename = "DUPLICATE_OF")]
    DuplicateOf,
    /// General relationship between tickets
    #[serde(rename = "RELATED_TO")]
    RelatedTo,
    /// Source ticket is blocked by target ticket
    #[serde(rename = "BLOCKED_BY")]
    BlockedBy,
    /// Source ticket blocks target ticket
    #[serde(rename = "BLOCKS")]
    Blocks,
    /// Source ticket was caused by target (for incident→problem linking)
    #[serde(rename = "CAUSED_BY")]
    CausedBy,
}

impl TicketRelationType {
    /// Get the inverse relationship type
    pub fn inverse(&self) -> Option<TicketRelationType> {
        match self {
            TicketRelationType::ParentOf => Some(TicketRelationType::ChildOf),
            TicketRelationType::ChildOf => Some(TicketRelationType::ParentOf),
            TicketRelationType::BlockedBy => Some(TicketRelationType::Blocks),
            TicketRelationType::Blocks => Some(TicketRelationType::BlockedBy),
            TicketRelationType::CausedBy => None, // Asymmetric
            TicketRelationType::DuplicateOf => None, // One-way
            TicketRelationType::RelatedTo => Some(TicketRelationType::RelatedTo), // Symmetric
        }
    }

    /// Check if this relationship type is symmetric (creates bidirectional link)
    pub fn is_symmetric(&self) -> bool {
        matches!(self, TicketRelationType::RelatedTo)
    }
}

// ============================================================================
// RELATIONSHIP REQUEST/RESPONSE MODELS
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateRelationshipRequest {
    pub target_ticket_id: String,
    pub relationship_type: TicketRelationType,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketRelationshipResponse {
    pub id: String,
    pub source_ticket_id: String,
    pub target_ticket_id: String,
    pub relationship_type: TicketRelationType,
    pub created_by: String,
    pub created_at: DateTime<Utc>,
    pub notes: Option<String>,
    /// Details about the target ticket
    pub target_ticket: Option<TicketSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketSummary {
    pub id: String,
    pub title: String,
    pub status: TicketStatus,
    pub priority: TicketPriority,
    #[serde(rename = "type")]
    pub ticket_type: TicketType,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketHierarchyNode {
    #[serde(flatten)]
    pub ticket: TicketSummary,
    pub children: Vec<TicketHierarchyNode>,
    pub relationship_type: Option<TicketRelationType>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkDuplicateRequest {
    pub notes: Option<String>,
    pub transfer_watchers: bool,
}
