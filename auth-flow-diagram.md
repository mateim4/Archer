# Frontend Authentication Flow Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         App (Root)                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AuthProvider                           │  │
│  │  • JWT Token Management                                   │  │
│  │  • LocalStorage Persistence                               │  │
│  │  • Auto Refresh (60s before expiry)                       │  │
│  │  • Login/Logout Functions                                 │  │
│  │  • Permission Checking                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│              ┌───────────────┴───────────────┐                  │
│              ▼                               ▼                   │
│  ┌─────────────────────┐        ┌──────────────────────┐       │
│  │   Public Routes     │        │  Protected Routes    │       │
│  │                     │        │                      │       │
│  │  • LoginView        │        │  • ProtectedRoute    │       │
│  │  • UnauthorizedView │        │    - Auth Check      │       │
│  │  • LandingView      │        │    - Permission Check│       │
│  └─────────────────────┘        │  • DashboardView     │       │
│                                  │  • ProjectsView      │       │
│                                  │  • ServiceDeskView   │       │
│                                  │  • etc.              │       │
│                                  └──────────────────────┘       │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  TopNavigationBar                         │  │
│  │  • User Profile Display                                   │  │
│  │  • Logout Button                                          │  │
│  │  • useAuth() Hook                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌────────────┐
│   User     │
└─────┬──────┘
      │
      │ 1. Navigate to /login
      ▼
┌────────────────────────┐
│     LoginView          │
│  ┌──────────────────┐  │
│  │  Email Input     │  │
│  │  Password Input  │  │
│  │  [Sign In]       │  │
│  └──────────────────┘  │
└───────────┬────────────┘
            │ 2. Submit credentials
            ▼
┌────────────────────────┐
│   AuthContext          │
│   login(email, pwd)    │
└───────────┬────────────┘
            │ 3. POST /api/v1/auth/login
            ▼
┌────────────────────────┐
│   Backend API          │
│  • Validate credentials│
│  • Generate JWT tokens │
│  • Return user profile │
└───────────┬────────────┘
            │ 4. Response: { access_token, refresh_token, user }
            ▼
┌────────────────────────┐
│   AuthContext          │
│  • Store in localStorage│
│  • Update state        │
│  • Schedule refresh    │
└───────────┬────────────┘
            │ 5. Redirect to /app/dashboard
            ▼
┌────────────────────────┐
│  ProtectedRoute        │
│  • Check isAuthenticated│
│  • Allow access        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   DashboardView        │
│   (Rendered)           │
└────────────────────────┘
```

## API Request Flow with JWT

```
┌────────────────────────┐
│  Component makes       │
│  API call              │
│  apiClient.getTickets()│
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│   ApiClient            │
│  • Get token from      │
│    tokenProvider       │
│  • Add Authorization   │
│    header              │
└───────────┬────────────┘
            │ Authorization: Bearer <jwt>
            ▼
┌────────────────────────┐
│   Backend API          │
│  • Validate JWT        │
│  • Check permissions   │
│  • Process request     │
└───────────┬────────────┘
            │
            ├──────── Success (200)
            │         │
            │         ▼
            │    ┌────────────────┐
            │    │  Return data   │
            │    └────────────────┘
            │
            └──────── Unauthorized (401)
                      │
                      ▼
            ┌────────────────────────┐
            │  ApiClient             │
            │  • Emit                │
            │   'auth:unauthorized'  │
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │  AuthContext           │
            │  • Logout user         │
            │  • Clear tokens        │
            │  • Navigate to /login  │
            └────────────────────────┘
```

## Token Refresh Flow

```
┌────────────────────────┐
│  AuthContext           │
│  • Scheduled refresh   │
│    (1 min before       │
│     expiry)            │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  POST /api/v1/auth/    │
│       refresh          │
│  { refresh_token }     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Backend               │
│  • Validate refresh    │
│    token               │
│  • Generate new        │
│    access token        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  Response:             │
│  { access_token,       │
│    expires_in }        │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  AuthContext           │
│  • Update access_token │
│    in localStorage     │
│  • Update state        │
│  • Schedule next       │
│    refresh             │
└────────────────────────┘
```

## Logout Flow

```
┌────────────────────────┐
│  User clicks           │
│  "Sign Out" in         │
│  TopNavigationBar      │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  AuthContext.logout()  │
└───────────┬────────────┘
            │
            ├──────── 1. Cancel refresh timer
            │
            ├──────── 2. POST /api/v1/auth/logout
            │         │  { refresh_token }
            │         │
            │         ▼
            │    ┌────────────────┐
            │    │ Backend revokes│
            │    │ refresh token  │
            │    └────────────────┘
            │
            ├──────── 3. Clear localStorage
            │         │  • access_token
            │         │  • refresh_token
            │         │  • user_profile
            │         │
            │
            ├──────── 4. Reset state
            │         │  • isAuthenticated = false
            │         │  • user = null
            │         │  • tokens = null
            │         │
            │
            └──────── 5. Navigate to /login
```

## Permission Check Flow

```
┌────────────────────────┐
│  User navigates to     │
│  /app/service-desk     │
└───────────┬────────────┘
            │
            ▼
┌────────────────────────┐
│  ProtectedRoute        │
│  requiredPermission=   │
│  "tickets:read"        │
└───────────┬────────────┘
            │
            ├──────── 1. Check isAuthenticated
            │         │
            │         ├── false ──► Navigate to /login
            │         │
            │         └── true
            │                │
            │                ▼
            │         2. Check hasPermission("tickets:read")
            │                │
            │                ├── false ──► Navigate to /unauthorized
            │                │
            │                └── true
            │                       │
            │                       ▼
            └───────────────► Render ServiceDeskView
```

## Data Flow Summary

```
┌─────────────────┐
│  LoginView      │ ─────► POST /api/v1/auth/login
└────────┬────────┘        │
         │                 ▼
         │        ┌─────────────────┐
         │        │  Backend API    │
         │        └────────┬────────┘
         │                 │
         │                 ▼
         │        ┌─────────────────┐
         └───────►│  AuthContext    │◄─────┐
                  │  (Global State) │      │
                  └────────┬────────┘      │
                           │               │
      ┌────────────────────┼───────────────┼─────────┐
      │                    │               │         │
      ▼                    ▼               │         ▼
┌──────────┐      ┌────────────────┐      │  ┌─────────────┐
│Protected │      │  ApiClient     │      │  │TopNavigation│
│  Route   │      │  (JWT headers) │──────┘  │    Bar      │
└──────────┘      └────────────────┘         └─────────────┘
```
