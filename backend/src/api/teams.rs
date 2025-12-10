// Archer ITSM - Team Management API
// REST endpoints for team CRUD, member management, and workload tracking

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    middleware,
    response::IntoResponse,
    routing::{delete, get, post, put},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::{
    database::Database,
    middleware::{
        auth::{require_auth, AuthState, AuthenticatedUser},
        rbac::{
            check_permissions, // Generic permission checker
        },
    },
    models::team::{
        AddTeamMemberRequest, CreateTeamRequest, Team, TeamHierarchyNode, TeamListResponse,
        TeamRole, TeamWithMembers, TeamWorkload, UpdateTeamMemberRequest, UpdateTeamRequest,
    },
    services::team_service::{TeamError, TeamService},
};

/// Create Teams API router with RBAC protection
pub fn create_teams_router(db: Arc<Database>) -> Router {
    let team_service = Arc::new(TeamService::new((*db).clone()));
    let auth_state = AuthState::new();

    Router::new()
        // Team CRUD endpoints
        .route("/", get(list_teams).post(create_team))
        .route("/:id", get(get_team).put(update_team).delete(delete_team))
        .route("/:id/details", get(get_team_details))
        .route("/hierarchy", get(get_hierarchy))
        // Member management endpoints
        .route("/:id/members", post(add_member).get(list_members))
        .route("/:id/members/:user_id", delete(remove_member).put(update_member_role))
        // Team workload and tickets
        .route("/:id/workload", get(get_team_workload))
        .route("/:id/tickets", get(get_team_tickets))
        // User's teams
        .route("/user/:user_id/teams", get(get_user_teams))
        // Apply authentication middleware to all routes
        .layer(middleware::from_fn_with_state(auth_state, require_auth))
        .with_state(team_service)
}

// ============================================================================
// QUERY PARAMETERS
// ============================================================================

#[derive(Debug, Deserialize)]
struct TeamListQuery {
    #[serde(default)]
    active_only: bool,
    parent_id: Option<String>,
}

// ============================================================================
// TEAM CRUD ENDPOINTS
// ============================================================================

/// List all teams
async fn list_teams(
    State(service): State<Arc<TeamService>>,
    Query(params): Query<TeamListQuery>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service
        .list_teams(params.active_only, params.parent_id.as_deref())
        .await
    {
        Ok(teams) => {
            let response = TeamListResponse {
                total: teams.len(),
                teams,
            };
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => team_error_response(e),
    }
}

/// Get a specific team
async fn get_team(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.get_team(&id).await {
        Ok(team) => (StatusCode::OK, Json(team)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Get team with members and workload details
async fn get_team_details(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.get_team_with_details(&id).await {
        Ok(team_details) => (StatusCode::OK, Json(team_details)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Create a new team
async fn create_team(
    State(service): State<Arc<TeamService>>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<CreateTeamRequest>,
) -> impl IntoResponse {
    match service.create_team(request, user.user_id.clone()).await {
        Ok(team) => (StatusCode::CREATED, Json(team)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Update a team
async fn update_team(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<UpdateTeamRequest>,
) -> impl IntoResponse {
    match service.update_team(&id, request).await {
        Ok(team) => (StatusCode::OK, Json(team)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Delete (deactivate) a team
async fn delete_team(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.delete_team(&id).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Get team hierarchy (tree structure)
async fn get_hierarchy(
    State(service): State<Arc<TeamService>>,
    Query(params): Query<HierarchyQuery>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service
        .get_team_hierarchy(params.root_id.as_deref())
        .await
    {
        Ok(hierarchy) => (StatusCode::OK, Json(hierarchy)).into_response(),
        Err(e) => team_error_response(e),
    }
}

#[derive(Debug, Deserialize)]
struct HierarchyQuery {
    root_id: Option<String>,
}

// ============================================================================
// MEMBER MANAGEMENT ENDPOINTS
// ============================================================================

/// List team members
async fn list_members(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.get_team_members(&id).await {
        Ok(members) => {
            let response = serde_json::json!({
                "team_id": id,
                "members": members,
                "count": members.len()
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => team_error_response(e),
    }
}

/// Add a member to a team
async fn add_member(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<AddTeamMemberRequest>,
) -> impl IntoResponse {
    match service
        .add_member(&id, &request.user_id, request.role)
        .await
    {
        Ok(membership) => (StatusCode::CREATED, Json(membership)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Remove a member from a team
async fn remove_member(
    State(service): State<Arc<TeamService>>,
    Path((team_id, user_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.remove_member(&team_id, &user_id).await {
        Ok(_) => (StatusCode::NO_CONTENT, ()).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Update a member's role
async fn update_member_role(
    State(service): State<Arc<TeamService>>,
    Path((team_id, user_id)): Path<(String, String)>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
    Json(request): Json<UpdateTeamMemberRequest>,
) -> impl IntoResponse {
    match service
        .update_member_role(&team_id, &user_id, request.role)
        .await
    {
        Ok(membership) => (StatusCode::OK, Json(membership)).into_response(),
        Err(e) => team_error_response(e),
    }
}

// ============================================================================
// WORKLOAD & TICKET ENDPOINTS
// ============================================================================

/// Get team workload statistics
async fn get_team_workload(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.calculate_team_workload(&id).await {
        Ok(workload) => (StatusCode::OK, Json(workload)).into_response(),
        Err(e) => team_error_response(e),
    }
}

/// Get tickets assigned to a team
async fn get_team_tickets(
    State(service): State<Arc<TeamService>>,
    Path(id): Path<String>,
    Query(params): Query<TicketQuery>,
    axum::Extension(user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    // This endpoint will query tickets where assignment_team_id = team_id
    // For now, we'll delegate to the ticket service logic
    // TODO: Implement ticket filtering by team
    let response = serde_json::json!({
        "message": "Ticket filtering by team not yet implemented",
        "team_id": id,
        "status": params.status
    });
    (StatusCode::OK, Json(response)).into_response()
}

#[derive(Debug, Deserialize)]
struct TicketQuery {
    status: Option<String>,
    page: Option<u32>,
    page_size: Option<u32>,
}

/// Get teams a user is member of
async fn get_user_teams(
    State(service): State<Arc<TeamService>>,
    Path(user_id): Path<String>,
    axum::Extension(auth_user): axum::Extension<AuthenticatedUser>,
) -> impl IntoResponse {
    match service.get_user_teams(&user_id).await {
        Ok(teams) => {
            let response = serde_json::json!({
                "user_id": user_id,
                "teams": teams,
                "count": teams.len()
            });
            (StatusCode::OK, Json(response)).into_response()
        }
        Err(e) => team_error_response(e),
    }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/// Convert TeamError to HTTP response
fn team_error_response(error: TeamError) -> impl IntoResponse {
    let (status, message) = match &error {
        TeamError::TeamNotFound => (StatusCode::NOT_FOUND, "Team not found"),
        TeamError::UserNotFound => (StatusCode::NOT_FOUND, "User not found"),
        TeamError::TeamNameExists => (StatusCode::CONFLICT, "Team name already exists"),
        TeamError::UserAlreadyMember => (StatusCode::CONFLICT, "User is already a member"),
        TeamError::UserNotMember => (StatusCode::BAD_REQUEST, "User is not a member of this team"),
        TeamError::TeamHasMembers => {
            (StatusCode::BAD_REQUEST, "Cannot delete team with active members")
        }
        TeamError::CircularHierarchy => (StatusCode::BAD_REQUEST, "Circular hierarchy detected"),
        TeamError::InvalidParentTeam => (StatusCode::BAD_REQUEST, "Invalid parent team"),
        TeamError::PermissionDenied => (StatusCode::FORBIDDEN, "Permission denied"),
        TeamError::DatabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Database error"),
        TeamError::InternalError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Internal error"),
    };

    let body = serde_json::json!({
        "error": message,
        "code": status.as_u16(),
        "details": error.to_string()
    });

    (status, Json(body))
}
