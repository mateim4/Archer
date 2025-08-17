# Epic: Project Management System Implementation

## Overview
Implement a comprehensive project management system that orchestrates infrastructure lifecycle activities (migrations, lifecycle planning, hardware procurement) through a timeline-based interface with dependency management and resource allocation.

## Goals
- Transform standalone Migration/Lifecycle planners into orchestrated project activities
- Implement Gantt chart timeline visualization with proportional sizing
- Create server inventory management and free hardware pool
- Integrate capacity sizing with overcommit ratio calculations
- Enable hardware procurement workflows from basket to inventory

## User Stories
1. **As a Project Manager**, I want to create projects containing multiple activities so that I can coordinate complex infrastructure changes
2. **As an Architect**, I want to add migration/lifecycle activities to a timeline so that I can plan resource allocation and dependencies
3. **As an Infrastructure Engineer**, I want to see capacity requirements and hardware recommendations so that I can procure the right equipment
4. **As a Team Lead**, I want to track activity dependencies so that I can ensure proper sequencing of work
5. **As a Resource Manager**, I want to manage free hardware pool so that I can optimize hardware utilization

## Technical Requirements
- Frontend: React + TypeScript with existing design system (.lcm-* classes)
- Backend: Rust (Axum) + SurrealDB for data persistence
- Integration: Existing Migration/Lifecycle planners as embedded wizards
- Visualization: Gantt chart with proportional bar sizing
- Data: Server inventory, project activities, capacity calculations

## Acceptance Criteria
- [ ] Projects can contain multiple ordered activities with dependencies
- [ ] Activities auto-size based on duration relative to project timeline
- [ ] Migration/Lifecycle planners integrated as activity wizards
- [ ] Capacity sizing calculates overcommit ratios and hardware requirements
- [ ] Hardware basket items can be converted to server inventory
- [ ] Free hardware pool tracks available servers with availability dates
- [ ] Navigation restructured to focus on project management

## Related Issues
- #[TBD] - Backend: Project and Activity Data Models
- #[TBD] - Frontend: Project Management Dashboard
- #[TBD] - Frontend: Gantt Chart Timeline Component
- #[TBD] - Frontend: Activity Creation and Management
- #[TBD] - Frontend: Server Inventory and Hardware Pool
- #[TBD] - Integration: Capacity Sizing and Wizard Integration
- #[TBD] - Backend: APIs for Project Management
- #[TBD] - Navigation: Restructure Main Navigation