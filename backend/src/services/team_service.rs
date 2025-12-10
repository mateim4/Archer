// Archer ITSM - Team Management Service
// Handles team CRUD, membership management, hierarchy, and workload tracking

use crate::database::Database;
use crate::models::team::{
    CreateTeamRequest, Team, TeamHierarchyNode, TeamMembership, TeamMemberInfo, TeamRole,
    TeamWithMembers, TeamWorkload, TicketsByPriority, UpdateTeamMemberRequest, UpdateTeamRequest,
    WorkloadStatus,
};
use crate::models::ticket::{Ticket, TicketStatus};
use crate::models::auth::User;
use chrono::Utc;
use surrealdb::sql::Thing;
use thiserror::Error;

// ============================================================================
// ERROR TYPES
// ============================================================================

#[derive(Debug, Error)]
pub enum TeamError {
    #[error("Team not found")]
    TeamNotFound,

    #[error("User not found")]
    UserNotFound,

    #[error("Team name already exists")]
    TeamNameExists,

    #[error("User is already a member of this team")]
    UserAlreadyMember,

    #[error("User is not a member of this team")]
    UserNotMember,

    #[error("Cannot delete team with active members")]
    TeamHasMembers,

    #[error("Circular hierarchy detected")]
    CircularHierarchy,

    #[error("Invalid parent team")]
    InvalidParentTeam,

    #[error("Permission denied")]
    PermissionDenied,

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Internal error: {0}")]
    InternalError(String),
}

impl From<surrealdb::Error> for TeamError {
    fn from(e: surrealdb::Error) -> Self {
        TeamError::DatabaseError(e.to_string())
    }
}

// ============================================================================
// TEAM SERVICE
// ============================================================================

pub struct TeamService {
    db: Database,
}

impl TeamService {
    pub fn new(db: Database) -> Self {
        Self { db }
    }

    // ========================================================================
    // TEAM CRUD OPERATIONS
    // ========================================================================

    /// Create a new team
    pub async fn create_team(
        &self,
        request: CreateTeamRequest,
        created_by: String,
    ) -> Result<Team, TeamError> {
        // Check if team name already exists
        let existing: Vec<Team> = self
            .db
            .query("SELECT * FROM teams WHERE name = $name LIMIT 1")
            .bind(("name", &request.name))
            .await?
            .take(0)?;

        if !existing.is_empty() {
            return Err(TeamError::TeamNameExists);
        }

        // Validate team lead exists if provided
        let team_lead_id = if let Some(lead_id) = &request.team_lead_id {
            let thing = parse_thing("users", lead_id)?;
            let user: Option<User> = self.db.select(thing.clone()).await?;
            if user.is_none() {
                return Err(TeamError::UserNotFound);
            }
            Some(thing)
        } else {
            None
        };

        // Validate parent team exists if provided
        let parent_team_id = if let Some(parent_id) = &request.parent_team_id {
            let thing = parse_thing("teams", parent_id)?;
            let parent: Option<Team> = self.db.select(thing.clone()).await?;
            if parent.is_none() {
                return Err(TeamError::InvalidParentTeam);
            }
            Some(thing)
        } else {
            None
        };

        let mut team = Team::new(
            request.name,
            request.description,
            team_lead_id,
            Some(created_by),
        );
        team.parent_team_id = parent_team_id;
        team.email_alias = request.email_alias;

        let created: Vec<Team> = self.db.create("teams").content(&team).await?;
        created
            .into_iter()
            .next()
            .ok_or_else(|| TeamError::InternalError("Failed to create team".to_string()))
    }

    /// Get a team by ID
    pub async fn get_team(&self, team_id: &str) -> Result<Team, TeamError> {
        let thing = parse_thing("teams", team_id)?;
        let team: Option<Team> = self.db.select(thing).await?;
        team.ok_or(TeamError::TeamNotFound)
    }

    /// Get team with members and workload
    pub async fn get_team_with_details(&self, team_id: &str) -> Result<TeamWithMembers, TeamError> {
        let team = self.get_team(team_id).await?;
        let members = self.get_team_members(team_id).await?;
        let workload = self.calculate_team_workload(team_id).await.ok();

        Ok(TeamWithMembers {
            member_count: members.len(),
            team,
            members,
            workload,
        })
    }

    /// List all teams (with optional filtering)
    pub async fn list_teams(
        &self,
        active_only: bool,
        parent_id: Option<&str>,
    ) -> Result<Vec<Team>, TeamError> {
        let query = if let Some(parent) = parent_id {
            if active_only {
                "SELECT * FROM teams WHERE is_active = true AND parent_team_id = $parent ORDER BY name"
            } else {
                "SELECT * FROM teams WHERE parent_team_id = $parent ORDER BY name"
            }
        } else if active_only {
            "SELECT * FROM teams WHERE is_active = true ORDER BY name"
        } else {
            "SELECT * FROM teams ORDER BY name"
        };

        let mut query = self.db.query(query);
        if let Some(parent) = parent_id {
            let parent_thing = parse_thing("teams", parent)?;
            query = query.bind(("parent", parent_thing));
        }

        let teams: Vec<Team> = query.await?.take(0)?;
        Ok(teams)
    }

    /// Update a team
    pub async fn update_team(
        &self,
        team_id: &str,
        request: UpdateTeamRequest,
    ) -> Result<Team, TeamError> {
        let thing = parse_thing("teams", team_id)?;
        let mut team: Team = self
            .db
            .select(thing.clone())
            .await?
            .ok_or(TeamError::TeamNotFound)?;

        // Apply updates
        if let Some(name) = request.name {
            // Check name uniqueness
            let existing: Vec<Team> = self
                .db
                .query("SELECT * FROM teams WHERE name = $name AND id != $id LIMIT 1")
                .bind(("name", &name))
                .bind(("id", team.id.as_ref().unwrap()))
                .await?
                .take(0)?;

            if !existing.is_empty() {
                return Err(TeamError::TeamNameExists);
            }
            team.name = name;
        }

        if let Some(description) = request.description {
            team.description = Some(description);
        }

        if let Some(lead_id) = request.team_lead_id {
            let lead_thing = parse_thing("users", &lead_id)?;
            let user: Option<User> = self.db.select(lead_thing.clone()).await?;
            if user.is_none() {
                return Err(TeamError::UserNotFound);
            }
            team.team_lead_id = Some(lead_thing);
        }

        if let Some(parent_id) = request.parent_team_id {
            let parent_thing = parse_thing("teams", &parent_id)?;
            // Check for circular hierarchy
            if self.would_create_cycle(team_id, &parent_id).await? {
                return Err(TeamError::CircularHierarchy);
            }
            team.parent_team_id = Some(parent_thing);
        }

        if let Some(email) = request.email_alias {
            team.email_alias = Some(email);
        }

        if let Some(active) = request.is_active {
            team.is_active = active;
        }

        team.updated_at = Utc::now();

        let updated: Option<Team> = self.db.update(thing).content(&team).await?;
        updated.ok_or(TeamError::TeamNotFound)
    }

    /// Soft delete a team (deactivate)
    pub async fn delete_team(&self, team_id: &str) -> Result<(), TeamError> {
        // Check if team has active members
        let members = self.get_team_members(team_id).await?;
        if !members.is_empty() {
            return Err(TeamError::TeamHasMembers);
        }

        let thing = parse_thing("teams", team_id)?;
        let mut team: Team = self
            .db
            .select(thing.clone())
            .await?
            .ok_or(TeamError::TeamNotFound)?;

        team.is_active = false;
        team.updated_at = Utc::now();

        let updated: Option<Team> = self.db.update(thing).content(&team).await?;
        updated.ok_or(TeamError::TeamNotFound)
    }

    // ========================================================================
    // MEMBER MANAGEMENT
    // ========================================================================

    /// Add a member to a team
    pub async fn add_member(
        &self,
        team_id: &str,
        user_id: &str,
        role: TeamRole,
    ) -> Result<TeamMembership, TeamError> {
        let team_thing = parse_thing("teams", team_id)?;
        let user_thing = parse_thing("users", user_id)?;

        // Verify team exists
        let _team: Team = self
            .db
            .select(team_thing.clone())
            .await?
            .ok_or(TeamError::TeamNotFound)?;

        // Verify user exists
        let _user: User = self
            .db
            .select(user_thing.clone())
            .await?
            .ok_or(TeamError::UserNotFound)?;

        // Check if already a member
        let existing: Vec<TeamMembership> = self
            .db
            .query(
                "SELECT * FROM team_memberships WHERE team_id = $team AND user_id = $user LIMIT 1",
            )
            .bind(("team", team_thing.clone()))
            .bind(("user", user_thing.clone()))
            .await?
            .take(0)?;

        if !existing.is_empty() {
            return Err(TeamError::UserAlreadyMember);
        }

        let membership = TeamMembership::new(team_thing, user_thing, role);

        let created: Vec<TeamMembership> =
            self.db.create("team_memberships").content(&membership).await?;

        created.into_iter().next().ok_or_else(|| {
            TeamError::InternalError("Failed to create team membership".to_string())
        })
    }

    /// Remove a member from a team
    pub async fn remove_member(&self, team_id: &str, user_id: &str) -> Result<(), TeamError> {
        let team_thing = parse_thing("teams", team_id)?;
        let user_thing = parse_thing("users", user_id)?;

        let memberships: Vec<TeamMembership> = self
            .db
            .query(
                "SELECT * FROM team_memberships WHERE team_id = $team AND user_id = $user LIMIT 1",
            )
            .bind(("team", team_thing))
            .bind(("user", user_thing))
            .await?
            .take(0)?;

        if memberships.is_empty() {
            return Err(TeamError::UserNotMember);
        }

        let membership_id = memberships[0].id.as_ref().unwrap();
        self.db
            .delete::<Option<TeamMembership>>(membership_id.clone())
            .await?;

        Ok(())
    }

    /// Update a member's role
    pub async fn update_member_role(
        &self,
        team_id: &str,
        user_id: &str,
        new_role: TeamRole,
    ) -> Result<TeamMembership, TeamError> {
        let team_thing = parse_thing("teams", team_id)?;
        let user_thing = parse_thing("users", user_id)?;

        let mut memberships: Vec<TeamMembership> = self
            .db
            .query(
                "SELECT * FROM team_memberships WHERE team_id = $team AND user_id = $user LIMIT 1",
            )
            .bind(("team", team_thing))
            .bind(("user", user_thing))
            .await?
            .take(0)?;

        if memberships.is_empty() {
            return Err(TeamError::UserNotMember);
        }

        let mut membership = memberships.remove(0);
        membership.role = new_role;

        let membership_id = membership.id.clone().unwrap();
        let updated: Option<TeamMembership> = self
            .db
            .update(membership_id)
            .content(&membership)
            .await?;

        updated.ok_or(TeamError::UserNotMember)
    }

    /// Get all members of a team with user details
    pub async fn get_team_members(&self, team_id: &str) -> Result<Vec<TeamMemberInfo>, TeamError> {
        let team_thing = parse_thing("teams", team_id)?;

        // Query memberships with user details
        let query = r#"
            SELECT 
                id as membership_id,
                user_id,
                role,
                joined_at
            FROM team_memberships
            WHERE team_id = $team
            ORDER BY joined_at
        "#;

        let memberships: Vec<serde_json::Value> = self
            .db
            .query(query)
            .bind(("team", team_thing))
            .await?
            .take(0)?;

        let mut member_infos = Vec::new();

        for membership in memberships {
            let user_id_str = membership["user_id"].as_str().unwrap_or("");
            let user_thing = parse_thing("users", user_id_str)?;
            
            if let Some(user) = self.db.select::<Option<User>>(user_thing).await? {
                // Count active tickets for this user
                let ticket_count: Vec<serde_json::Value> = self
                    .db
                    .query("SELECT count() as count FROM ticket WHERE assignee = $user AND status IN ['NEW', 'ASSIGNED', 'IN_PROGRESS']")
                    .bind(("user", user.username.clone()))
                    .await?
                    .take(0)?;

                let active_tickets = ticket_count
                    .get(0)
                    .and_then(|v| v.get("count"))
                    .and_then(|v| v.as_u64())
                    .unwrap_or(0) as usize;

                member_infos.push(TeamMemberInfo {
                    membership_id: membership["membership_id"]
                        .as_str()
                        .unwrap_or("")
                        .to_string(),
                    user_id: user.id.as_ref().map(|t| t.to_string()).unwrap_or_default(),
                    username: user.username,
                    display_name: user.display_name,
                    email: user.email,
                    role: serde_json::from_value(membership["role"].clone()).unwrap(),
                    joined_at: serde_json::from_value(membership["joined_at"].clone()).unwrap(),
                    active_tickets,
                });
            }
        }

        Ok(member_infos)
    }

    // ========================================================================
    // HIERARCHY OPERATIONS
    // ========================================================================

    /// Get team hierarchy starting from a team (or all if team_id is None)
    pub async fn get_team_hierarchy(
        &self,
        root_team_id: Option<&str>,
    ) -> Result<Vec<TeamHierarchyNode>, TeamError> {
        let teams = if let Some(root_id) = root_team_id {
            vec![self.get_team(root_id).await?]
        } else {
            self.list_teams(true, None).await?
        };

        let mut result = Vec::new();
        for team in teams {
            if team.parent_team_id.is_none() || root_team_id.is_some() {
                let node = self.build_hierarchy_node(team).await?;
                result.push(node);
            }
        }

        Ok(result)
    }

    /// Recursively build hierarchy node
    async fn build_hierarchy_node(&self, team: Team) -> Result<TeamHierarchyNode, TeamError> {
        let team_id_str = team.id.as_ref().map(|t| t.to_string()).unwrap_or_default();
        let children_teams = self.list_teams(true, Some(&team_id_str)).await?;

        let mut children = Vec::new();
        for child in children_teams {
            let child_node = self.build_hierarchy_node(child).await?;
            children.push(child_node);
        }

        let members = self.get_team_members(&team_id_str).await?;

        Ok(TeamHierarchyNode {
            team,
            children,
            member_count: members.len(),
        })
    }

    /// Check if adding parent_id as parent would create a cycle
    async fn would_create_cycle(&self, team_id: &str, parent_id: &str) -> Result<bool, TeamError> {
        if team_id == parent_id {
            return Ok(true);
        }

        let mut current_id = parent_id.to_string();
        let mut visited = std::collections::HashSet::new();

        loop {
            if current_id == team_id {
                return Ok(true);
            }

            if visited.contains(&current_id) {
                return Ok(true);
            }

            visited.insert(current_id.clone());

            let current_team = self.get_team(&current_id).await?;
            match current_team.parent_team_id {
                Some(parent) => {
                    current_id = parent.to_string();
                }
                None => return Ok(false),
            }
        }
    }

    // ========================================================================
    // WORKLOAD TRACKING
    // ========================================================================

    /// Calculate team workload statistics
    pub async fn calculate_team_workload(
        &self,
        team_id: &str,
    ) -> Result<TeamWorkload, TeamError> {
        let team = self.get_team(team_id).await?;
        let members = self.get_team_members(team_id).await?;

        let team_thing = parse_thing("teams", team_id)?;

        // Count tickets by status
        let ticket_query = r#"
            SELECT 
                status,
                priority,
                COUNT() as count
            FROM ticket
            WHERE assignment_team_id = $team
            GROUP BY status, priority
        "#;

        let ticket_stats: Vec<serde_json::Value> = self
            .db
            .query(ticket_query)
            .bind(("team", team_thing))
            .await?
            .take(0)?;

        let mut total_tickets = 0;
        let mut open_tickets = 0;
        let mut in_progress_tickets = 0;
        let mut resolved_tickets = 0;
        let mut tickets_by_priority = TicketsByPriority {
            p1: 0,
            p2: 0,
            p3: 0,
            p4: 0,
        };

        for stat in ticket_stats {
            let count = stat["count"].as_u64().unwrap_or(0) as usize;
            total_tickets += count;

            if let Some(status) = stat["status"].as_str() {
                match status {
                    "NEW" | "ASSIGNED" => open_tickets += count,
                    "IN_PROGRESS" => in_progress_tickets += count,
                    "RESOLVED" | "CLOSED" => resolved_tickets += count,
                    _ => {}
                }
            }

            if let Some(priority) = stat["priority"].as_str() {
                match priority {
                    "P1" => tickets_by_priority.p1 += count,
                    "P2" => tickets_by_priority.p2 += count,
                    "P3" => tickets_by_priority.p3 += count,
                    "P4" => tickets_by_priority.p4 += count,
                    _ => {}
                }
            }
        }

        // Count SLA breaches
        let sla_query = "SELECT COUNT() as count FROM ticket WHERE assignment_team_id = $team AND sla_breach_at < time::now()";
        let sla_result: Vec<serde_json::Value> = self
            .db
            .query(sla_query)
            .bind(("team", parse_thing("teams", team_id)?))
            .await?
            .take(0)?;

        let sla_breach_count = sla_result
            .get(0)
            .and_then(|v| v.get("count"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as usize;

        let member_count = members.len();
        let average_tickets_per_member = if member_count > 0 {
            total_tickets as f64 / member_count as f64
        } else {
            0.0
        };

        let mut workload = TeamWorkload {
            team_id: team_id.to_string(),
            team_name: team.name,
            member_count,
            total_tickets,
            open_tickets,
            in_progress_tickets,
            resolved_tickets,
            average_tickets_per_member,
            tickets_by_priority,
            sla_breach_count,
            workload_status: WorkloadStatus::Green,
        };

        workload.calculate_status();

        Ok(workload)
    }

    /// Get teams a user is a member of
    pub async fn get_user_teams(&self, user_id: &str) -> Result<Vec<Team>, TeamError> {
        let user_thing = parse_thing("users", user_id)?;

        let query = r#"
            SELECT team_id FROM team_memberships WHERE user_id = $user
        "#;

        let memberships: Vec<serde_json::Value> = self
            .db
            .query(query)
            .bind(("user", user_thing))
            .await?
            .take(0)?;

        let mut teams = Vec::new();
        for membership in memberships {
            if let Some(team_id_str) = membership["team_id"].as_str() {
                if let Ok(team) = self.get_team(team_id_str).await {
                    teams.push(team);
                }
            }
        }

        Ok(teams)
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Parse a string ID into a SurrealDB Thing
fn parse_thing(table: &str, id: &str) -> Result<Thing, TeamError> {
    let parts: Vec<&str> = id.split(':').collect();
    let thing = if parts.len() == 2 {
        Thing::from((parts[0], parts[1]))
    } else {
        Thing::from((table, id))
    };
    Ok(thing)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_thing() {
        let thing = parse_thing("teams", "team-1").unwrap();
        assert_eq!(thing.tb, "teams");
        assert_eq!(thing.id.to_string(), "team-1");

        let thing = parse_thing("teams", "teams:team-2").unwrap();
        assert_eq!(thing.tb, "teams");
        assert_eq!(thing.id.to_string(), "team-2");
    }
}
