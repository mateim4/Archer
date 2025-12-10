// Archer ITSM - Team Management Models
// Implements Team, TeamMembership models for team-based operations

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use surrealdb::sql::Thing;

// ============================================================================
// TEAM MODELS
// ============================================================================

/// Team entity for grouping users and managing workload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Team {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub team_lead_id: Option<Thing>,    // User ID of team lead
    pub parent_team_id: Option<Thing>,  // For hierarchical teams
    pub email_alias: Option<String>,    // Team email (e.g., support@company.com)
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<String>,
    pub tenant_id: Option<Thing>,       // Multi-tenant isolation
}

/// Team membership association
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMembership {
    pub id: Option<Thing>,
    pub team_id: Thing,
    pub user_id: Thing,
    pub role: TeamRole,
    pub joined_at: DateTime<Utc>,
}

/// Role within a team
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum TeamRole {
    Lead,       // Can manage team, assign work, update team settings
    Member,     // Normal team member, can work on assigned tickets
    Observer,   // Read-only access to team's tickets, cannot modify
}

impl TeamRole {
    pub fn can_manage_team(&self) -> bool {
        matches!(self, TeamRole::Lead)
    }

    pub fn can_work_on_tickets(&self) -> bool {
        matches!(self, TeamRole::Lead | TeamRole::Member)
    }

    pub fn can_view_tickets(&self) -> bool {
        true // All roles can view team tickets
    }
}

// ============================================================================
// TEAM STATISTICS
// ============================================================================

/// Team workload statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamWorkload {
    pub team_id: String,
    pub team_name: String,
    pub member_count: usize,
    pub total_tickets: usize,
    pub open_tickets: usize,
    pub in_progress_tickets: usize,
    pub resolved_tickets: usize,
    pub average_tickets_per_member: f64,
    pub tickets_by_priority: TicketsByPriority,
    pub sla_breach_count: usize,
    pub workload_status: WorkloadStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicketsByPriority {
    pub p1: usize,
    pub p2: usize,
    pub p3: usize,
    pub p4: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum WorkloadStatus {
    Green,   // Under 80% capacity
    Yellow,  // 80-95% capacity
    Red,     // Over 95% capacity
}

// ============================================================================
// TEAM WITH MEMBERS (JOIN RESPONSE)
// ============================================================================

/// Team with member details (for detailed views)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamWithMembers {
    #[serde(flatten)]
    pub team: Team,
    pub members: Vec<TeamMemberInfo>,
    pub member_count: usize,
    pub workload: Option<TeamWorkload>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamMemberInfo {
    pub membership_id: String,
    pub user_id: String,
    pub username: String,
    pub display_name: String,
    pub email: String,
    pub role: TeamRole,
    pub joined_at: DateTime<Utc>,
    pub active_tickets: usize,
}

// ============================================================================
// API REQUEST/RESPONSE MODELS
// ============================================================================

/// Create team request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
    pub team_lead_id: Option<String>,   // User ID as string
    pub parent_team_id: Option<String>, // Team ID as string
    pub email_alias: Option<String>,
}

/// Update team request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTeamRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub team_lead_id: Option<String>,
    pub parent_team_id: Option<String>,
    pub email_alias: Option<String>,
    pub is_active: Option<bool>,
}

/// Add team member request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddTeamMemberRequest {
    pub user_id: String,
    pub role: TeamRole,
}

/// Update team member role request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateTeamMemberRequest {
    pub role: TeamRole,
}

/// Team list response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamListResponse {
    pub teams: Vec<Team>,
    pub total: usize,
}

/// Team hierarchy node (for tree visualization)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TeamHierarchyNode {
    pub team: Team,
    pub children: Vec<TeamHierarchyNode>,
    pub member_count: usize,
}

// ============================================================================
// HELPER IMPLEMENTATIONS
// ============================================================================

impl Team {
    /// Create a new team
    pub fn new(
        name: String,
        description: Option<String>,
        team_lead_id: Option<Thing>,
        created_by: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: None,
            name,
            description,
            team_lead_id,
            parent_team_id: None,
            email_alias: None,
            is_active: true,
            created_at: now,
            updated_at: now,
            created_by,
            tenant_id: None,
        }
    }

    /// Check if team is a root team (no parent)
    pub fn is_root(&self) -> bool {
        self.parent_team_id.is_none()
    }
}

impl TeamMembership {
    /// Create a new team membership
    pub fn new(team_id: Thing, user_id: Thing, role: TeamRole) -> Self {
        Self {
            id: None,
            team_id,
            user_id,
            role,
            joined_at: Utc::now(),
        }
    }
}

impl TeamWorkload {
    /// Calculate workload status based on metrics
    pub fn calculate_status(&mut self) {
        if self.member_count == 0 {
            self.workload_status = WorkloadStatus::Red;
            return;
        }

        let avg_load = self.average_tickets_per_member;
        
        // Simple heuristic: >10 tickets/member = red, >7 = yellow, else green
        self.workload_status = if avg_load > 10.0 {
            WorkloadStatus::Red
        } else if avg_load > 7.0 {
            WorkloadStatus::Yellow
        } else {
            WorkloadStatus::Green
        };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_team_role_permissions() {
        assert!(TeamRole::Lead.can_manage_team());
        assert!(!TeamRole::Member.can_manage_team());
        assert!(!TeamRole::Observer.can_manage_team());

        assert!(TeamRole::Lead.can_work_on_tickets());
        assert!(TeamRole::Member.can_work_on_tickets());
        assert!(!TeamRole::Observer.can_work_on_tickets());

        assert!(TeamRole::Lead.can_view_tickets());
        assert!(TeamRole::Member.can_view_tickets());
        assert!(TeamRole::Observer.can_view_tickets());
    }

    #[test]
    fn test_workload_status_calculation() {
        let mut workload = TeamWorkload {
            team_id: "team:1".to_string(),
            team_name: "Test Team".to_string(),
            member_count: 5,
            total_tickets: 25,
            open_tickets: 15,
            in_progress_tickets: 10,
            resolved_tickets: 0,
            average_tickets_per_member: 5.0,
            tickets_by_priority: TicketsByPriority {
                p1: 2,
                p2: 8,
                p3: 10,
                p4: 5,
            },
            sla_breach_count: 1,
            workload_status: WorkloadStatus::Green,
        };

        workload.calculate_status();
        assert_eq!(workload.workload_status, WorkloadStatus::Green);

        // High load
        workload.average_tickets_per_member = 12.0;
        workload.calculate_status();
        assert_eq!(workload.workload_status, WorkloadStatus::Red);

        // Medium load
        workload.average_tickets_per_member = 8.0;
        workload.calculate_status();
        assert_eq!(workload.workload_status, WorkloadStatus::Yellow);
    }

    #[test]
    fn test_team_is_root() {
        let root_team = Team::new(
            "Root Team".to_string(),
            None,
            None,
            None,
        );
        assert!(root_team.is_root());

        let mut child_team = Team::new(
            "Child Team".to_string(),
            None,
            None,
            None,
        );
        child_team.parent_team_id = Some(Thing::from(("teams", "parent-1")));
        assert!(!child_team.is_root());
    }
}
