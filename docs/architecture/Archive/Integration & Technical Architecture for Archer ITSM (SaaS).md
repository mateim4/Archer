# Integration & Technical Architecture for Archer ITSM (SaaS)

# Technical Architecture for Archer ITSM

## Modern SaaS Stack (Recommended)

### Frontend

* React + TypeScript
* Vite (fast builds)
* Fluent UI 2 (Microsoft design system)
* TanStack Query (server state)
* Purple Glass design system

### Backend

* Rust (performance, safety)
* Axum (web framework)
* GraphQL or tRPC (type-safe APIs)
* WebSockets (real-time)

### Database

* SurrealDB (multi-model)
* Advantages: Graph-native (CMDB topology), time-series (monitoring), flexible schema

### Real-Time

* WebSockets for live updates
* Server-Sent Events for notifications
* Optimistic UI updates

## Integration Architecture

### Patterns

* Webhook-based event streaming
* Bi-directional sync (not just one-way like Device42)
* OAuth/SAML for auth
* Rate limiting built-in
* Marketplace model (Slack/Shopify style)

### Multi-Tenancy

* Database-per-tenant (isolation) or Schema-per-tenant (cost optimization)
* Data residency compliance
* White-labeling support

## Module Integration (Native)

### ITSM + CMDB

* Shared data model
* Tickets auto-linked to CIs
* Change impact analysis automatic

### ITSM + Monitoring

* Alerts auto-create tickets
* Context preserved (topology, metrics)
* RCA in ticket UI
* Proactive incident creation

### CMDB + Monitoring

* Same assets in both
* Metrics linked to CIs
* Dependency map from CMDB used for RCA

Full details: [archer-competitive-analysis.md](http://archer-competitive-analysis.md)

## Comments

