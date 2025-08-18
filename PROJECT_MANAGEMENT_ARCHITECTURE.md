# Project Management System Architecture - Implementation Plan

## Overview
This document captures the complete architectural plan for implementing a project management system in LCM Designer that orchestrates infrastructure lifecycle activities through a timeline-based interface.

## Project Context & Goals

### Current State
- Standalone Migration Planner and Lifecycle Planner tools
- Hardware Basket system for vendor pricing catalogs
- Dynamic Excel parsing with vendor data integration
- Design system with glassmorphic purple theme (.lcm-* CSS classes)

### Target State
- **Project-centric workflow** where Migration/Lifecycle planners become embedded activity wizards
- **Gantt chart timeline** with proportional bar sizing and dependency management
- **Server inventory management** separate from vendor catalogs
- **Free hardware pool** tracking available servers with release dates
- **Intelligent capacity sizing** with overcommit ratio calculations
- **Hardware procurement workflow** from basket to inventory

## Key Architectural Decisions

### 1. Project Structure
```
Project (container)
├── Activity 1: Migration Wave 1
├── Activity 2: Hardware Procurement  
├── Activity 3: Lifecycle Planning
├── Activity 4: Commissioning
└── Activity 5: Decommissioning
```

### 2. Data Flow
```
Hardware Basket (vendor pricing) 
    ↓ procurement
Server Inventory (managed hardware)
    ↓ assignment  
Projects & Activities (orchestration)
    ↓ completion
Free Hardware Pool (available resources)
```

### 3. Navigation Restructure
**From:**
- Projects (new)
- Migration Planner (standalone)
- Lifecycle Planner (standalone) 
- Vendor Data Collection
- Network Visualizer
- Design Documents

**To:**
- **Projects** (primary focus)
- **Hardware Pool** (server inventory)
- **Hardware Basket** (renamed)
- **Network Visualizer** (unchanged)
- **Design Documents** (unchanged)

## Implementation Architecture

### Frontend Components
1. **ProjectManagementView** - Main project dashboard
2. **GanttChart** - Interactive timeline with proportional sizing
3. **ActivityWizard** - Embedded Migration/Lifecycle planners
4. **HardwarePoolView** - Server inventory management
5. **ServerCard** - Individual server display components
6. **ProjectCard** - Project overview cards

### Backend Data Models
1. **Project** - Container for activities with timeline
2. **Activity** - Individual tasks with dependencies and wizards
3. **ServerInventory** - Physical server tracking
4. **FreeHardwarePool** - Available server pool with dates
5. **WizardConfiguration** - Saved wizard state per activity

### Key Features
- **Proportional Gantt Bars** - Activities auto-size based on duration relative to total project timeline
- **Dependency Visualization** - Curved arrows showing task dependencies
- **Capacity Sizing Engine** - Calculate hardware requirements with overcommit ratios (CPU: 3:1, Memory: 1.5:1, HA: N+1)
- **Hardware Source Selection** - Choose between existing inventory, new purchases, or mixed approach
- **Real-time Updates** - Timeline recalculation when activity dates change

## Implementation Issues Created

### Phase 1: Core Infrastructure
1. **backend-project-data-models.md** - SurrealDB schemas and Rust API endpoints
2. **frontend-project-dashboard.md** - Main project management interface
3. **navigation-restructure.md** - Update navigation to focus on projects

### Phase 2: Timeline & Activities  
4. **frontend-gantt-chart.md** - Interactive timeline with proportional sizing
5. **integration-capacity-sizing.md** - Enhanced wizards with capacity calculations

### Phase 3: Hardware Management
6. **frontend-hardware-pool.md** - Server inventory and free pool management
7. **api-specifications.md** - Comprehensive REST API documentation

## Technical Specifications

### Gantt Chart Requirements
- Activities auto-size proportionally (1 activity = 100% width, 2 activities = 50% each)
- Handle overlapping activities by stacking vertically
- Timeline scale shows months/weeks with proper positioning
- Dependency arrows with SVG rendering
- No drag-and-drop - editing done via date changes

### Capacity Sizing Algorithm
```typescript
const calculateRequirements = (workload, overcommitConfig) => {
  const cpuRatio = parseRatio(overcommitConfig.cpu_ratio); // 3:1 → 3.0
  const memoryRatio = parseRatio(overcommitConfig.memory_ratio); // 1.5:1 → 1.5
  const haMultiplier = getHAMultiplier(overcommitConfig.ha_policy); // n+1 → 1.33
  
  const physicalCPU = Math.ceil(workload.vcpu / cpuRatio) * haMultiplier;
  const physicalMemory = Math.ceil(workload.vmemory / memoryRatio) * haMultiplier;
  
  return { physicalCPU, physicalMemory, requiredNodes };
};
```

### Hardware Pool Logic
- Servers become available when activities complete with "add_to_free_pool" flag
- Availability dates track when servers are freed from previous activities
- Reservation system for temporarily holding servers for upcoming activities
- Integration with RVTools for automated server discovery

## Design System Compliance

### Required CSS Classes
- `.lcm-card` - All card containers
- `.lcm-input` - All input fields  
- `.lcm-button` - All buttons
- `.lcm-dropdown` - All select elements

### Color Scheme
- Primary: `#8b5cf6` (purple)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (orange)
- Error: `#ef4444` (red)
- Background: `rgba(255, 255, 255, 0.85)` with `blur(18px) saturate(180%)`

### Typography
- Font: Montserrat
- Headers: 600 weight
- Body: 500 weight  
- Small text: 12px with 600 weight for labels

## Development Sequence

### Week 1-2: Backend Foundation
- Implement SurrealDB project/activity models
- Create REST API endpoints with validation
- Add server inventory CRUD operations

### Week 3-4: Project Dashboard
- Build project management view with cards
- Implement project creation and editing
- Add basic activity management

### Week 5-6: Gantt Timeline
- Create interactive Gantt chart component
- Implement proportional sizing algorithm
- Add dependency visualization with SVG

### Week 7-8: Enhanced Wizards
- Integrate Migration/Lifecycle planners as embedded wizards
- Build capacity sizing engine with overcommit calculations
- Add hardware source selection interface

### Week 9-10: Hardware Management
- Create server inventory management
- Build free hardware pool interface
- Add RVTools import functionality

### Week 11-12: Integration & Polish
- Update navigation structure
- Add real-time updates and caching
- Comprehensive testing and documentation

## API Integration Points

### Existing Systems
- Hardware Basket API - `/api/hardware-baskets`
- Hardware Models API - `/api/hardware-baskets/:id/models`
- Upload API - `/api/hardware-baskets/upload`

### New Endpoints
- Projects API - `/api/projects`
- Activities API - `/api/projects/:id/activities`
- Server Inventory API - `/api/servers`
- Hardware Pool API - `/api/hardware-pool`
- Capacity Sizing API - `/api/activities/:id/capacity-sizing`

## Success Metrics

### User Experience
- Projects become primary landing page
- Migration/Lifecycle tools accessible within project context
- Hardware procurement integrated into project workflow
- Timeline provides clear visual project overview

### Technical Performance
- Timeline renders smoothly with 50+ activities
- Capacity calculations complete in <2 seconds
- Real-time updates don't cause UI lag
- Dependency validation prevents circular references

### Business Value
- Reduced time to plan infrastructure projects
- Better hardware utilization through free pool tracking
- Improved project visibility and coordination
- Streamlined procurement workflow

This architecture maintains existing strengths while adding sophisticated project orchestration capabilities that transform LCM Designer into a comprehensive infrastructure lifecycle management platform.