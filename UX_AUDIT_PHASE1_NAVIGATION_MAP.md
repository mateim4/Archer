# UX Audit Phase 1: Complete Navigation & Flow Map

**Date**: November 10, 2025  
**Auditor**: AI UX Designer  
**App**: LCMDesigner - Infrastructure Migration Planning Tool

## Executive Summary

This document maps all user-accessible views, navigation paths, and intended user flows based on code analysis and documentation review.

---

## 1. Navigation Structure

### Primary Menu (Sidebar)
Located in: `frontend/src/components/NavigationSidebar.tsx`

| Menu Item | Path | Badge | Purpose |
|-----------|------|-------|---------|
| **Projects** | `/app/projects` | Primary | Main workspace for migration projects |
| **Hardware Pool** | `/app/hardware-pool` | - | Manage discovered hardware inventory |
| **Hardware Basket** | `/app/hardware-basket` | - | Vendor hardware catalogs (Dell, Lenovo) |
| **RVTools** | `/app/enhanced-rvtools` | New | VMware RVTools data analysis |
| **Guides** | `/app/guides` | - | User documentation |
| **Document Templates** | `/app/document-templates` | - | Export templates |
| **Infrastructure Visualizer** | `/app/tools/infra-visualizer` | New | Network topology visualization |
| **Settings** | `/app/settings` | - | App configuration |

### Hidden/Non-Menu Routes
| Route | Access Method | Purpose |
|-------|---------------|---------|
| `/` | Direct URL | Landing page (no sidebar) |
| `/app/projects/:projectId` | Click project card | Project workspace with tabs |
| `/app/projects/:projectId/activities/:activityId/cluster-strategies` | Activity wizard | Cluster strategy manager |
| `/app/projects/:projectId/workflows/:workflowId/migration-wizard` | Embedded | Migration wizard (legacy?) |
| `/app/projects/:projectId/workflows/:workflowId/lifecycle-wizard` | Embedded | Lifecycle wizard (legacy?) |
| `/app/capacity-visualizer` | ? | Capacity planning visualization |
| `/app/data-collection` | ? | Vendor data collection |
| `/zoom-test` | Direct URL | Development test page |

---

## 2. Primary User Flows (Intended)

### Flow 1: New Migration Project Creation
**Entry Point**: Projects view  
**Steps**:
1. User clicks "Create New Project" button
2. Modal/form opens to input project details
3. User fills: Name, Description, Timeline, Team
4. User clicks "Create"
5. Project card appears in project list
6. User clicks project card → Opens `/app/projects/:projectId`

**Expected Components**:
- ProjectsView with "Create" button ✓
- ProjectWorkspaceView for individual project ✓
- Project creation modal/form (?)

### Flow 2: Add Activity to Project
**Entry Point**: Project workspace (`/app/projects/:projectId`)  
**Steps**:
1. User opens project
2. User sees tabs: Timeline | Overview | Capacity | Infrastructure
3. User clicks "Add Activity" button (on Timeline tab?)
4. Activity Wizard modal opens
5. User completes 7 steps:
   - Step 1: Activity Type (Discovery, Migration, Lifecycle, Custom)
   - Step 2: Scope Definition
   - Step 3: Cluster Strategy (if Migration)
   - Step 4: Capacity Planning
   - Step 5: Timeline
   - Step 6: Resource Allocation
   - Step 7: Review & Create
6. Activity appears on timeline
7. User can click activity → Edit or view details

**Expected Components**:
- Activity Wizard Modal ✓ (`Step1_Type.tsx` through `Step7_Review.tsx`)
- "Add Activity" button in ProjectWorkspaceView
- Timeline visualization
- Activity cards/items

### Flow 3: Hardware Pool Management
**Entry Point**: Hardware Pool menu  
**Steps**:
1. User navigates to Hardware Pool
2. User sees list of discovered hardware
3. User can:
   - Import from RVTools
   - Add manual entries
   - View/edit hardware details
   - Allocate to projects
4. User clicks "Visualize Hardware Pool" → Opens Infra Visualizer

**Expected Components**:
- HardwarePoolView ✓
- Import/Add buttons
- Hardware table/grid
- "Visualize" button ✓ (added in Infra-Visualizer integration)

### Flow 4: Vendor Hardware Basket
**Entry Point**: Hardware Basket menu  
**Steps**:
1. User navigates to Hardware Basket
2. User uploads Dell/Lenovo catalog Excel file
3. System parses and extracts server models
4. User views parsed models in table
5. User can:
   - Select models for comparison
   - Export selected models
   - Add to project quote

**Expected Components**:
- HardwareBasketView ✓
- File upload component
- Basket selection dropdown
- Model table with filters

### Flow 5: RVTools Analysis
**Entry Point**: RVTools menu  
**Steps**:
1. User navigates to RVTools
2. User uploads RVTools export (Excel)
3. System parses VMware environment data
4. User views:
   - VM inventory
   - Host information
   - Storage usage
   - Network configuration
5. User can export data to Hardware Pool

**Expected Components**:
- EnhancedRVToolsReportView ✓
- File upload
- Data tables/visualizations
- Export to Hardware Pool button

### Flow 6: Infrastructure Visualization
**Entry Point**: Infrastructure Visualizer menu OR Hardware Pool "Visualize" button  
**Steps**:
1. User navigates to visualizer
2. System loads data from:
   - Hardware Pool (`?source=hardware-pool`)
   - RVTools (`?source=rvtools`)
   - Migration context (`?source=migration`)
3. User sees network topology diagram
4. User can:
   - Change layout (ELK Layered/Tree/Force/Radial)
   - Toggle minimap, legend, stats
   - Export to PNG/SVG/PDF
5. User navigates back to source view

**Expected Components**:
- InfraVisualizerView ✓
- InfraVisualizerCanvas ✓
- Export menu ✓
- URL parameter handling ✓

---

## 3. Secondary User Flows

### Flow 7: Cluster Strategy Configuration
**Entry Point**: Activity Wizard Step 3 (if Migration activity)  
**Steps**:
1. User in Activity Wizard selects "Migration" type
2. Reaches Step 3: Cluster Strategy
3. User defines cluster strategy:
   - Lift & Shift
   - Replatform
   - Refactor
   - Custom
4. User clicks "Configure Strategy" → Opens `/app/projects/:projectId/activities/:activityId/cluster-strategies`
5. User configures detailed cluster mapping
6. Returns to wizard

**Expected Components**:
- ClusterStrategyManagerView ✓
- Strategy selection UI
- Cluster mapping interface

### Flow 8: Capacity Planning
**Entry Point**: Project workspace "Capacity" tab OR Activity Wizard Step 4  
**Steps**:
1. User navigates to Capacity tab or reaches Step 4 in wizard
2. User sees capacity visualization
3. User inputs:
   - Current utilization
   - Growth projections
   - Target environment specs
4. System calculates:
   - Required capacity
   - Over/under provisioning
   - Recommendations
5. User accepts or adjusts recommendations

**Expected Components**:
- CapacityVisualizerView ✓
- Capacity calculation engine
- Visualization charts

### Flow 9: Document Generation
**Entry Point**: Document Templates menu  
**Steps**:
1. User navigates to Document Templates
2. User sees available templates:
   - HLD (High-Level Design)
   - LLD (Low-Level Design)
   - Migration Plan
   - Runbook
3. User selects template
4. User fills template fields
5. User generates document (PDF/Word)
6. User downloads document

**Expected Components**:
- DocumentTemplatesView ✓
- Template selection
- Form builder
- Document export

---

## 4. Navigation Patterns Observed

### Pattern 1: Modal-Based Workflows
- Activity Wizard (7-step modal)
- Project creation (assumed modal)
- Strategy configuration

### Pattern 2: Tab-Based Views
- Project Workspace: Timeline | Overview | Capacity | Infrastructure
- Consistent tab navigation with pill-style buttons

### Pattern 3: Context-Aware Navigation
- "Visualize" button in Hardware Pool → Opens visualizer with `?source=hardware-pool`
- Activity wizard navigation → Opens strategy manager with activity context
- Breadcrumb navigation (?)

### Pattern 4: Sidebar Persistent Navigation
- Always visible (except landing page)
- Collapsible to icon-only mode
- Active state highlighting

---

## 5. Data Flow & Integration Points

### Integration 1: Hardware Pool ↔ Infra Visualizer
- **Trigger**: "Visualize Hardware Pool" button
- **Data Flow**: Hardware Pool inventory → Graph data transformation → ReactFlow visualization
- **Implementation**: `useInfraVisualizerIntegration` hook with `?source=hardware-pool` parameter

### Integration 2: RVTools ↔ Hardware Pool
- **Trigger**: "Export to Hardware Pool" button (assumed)
- **Data Flow**: RVTools parsed data → Hardware Pool inventory

### Integration 3: Project ↔ Activities
- **Trigger**: "Add Activity" button in project
- **Data Flow**: Project context → Activity Wizard → Activity saved to project

### Integration 4: Activity ↔ Cluster Strategy
- **Trigger**: "Configure Strategy" in Activity Wizard Step 3
- **Data Flow**: Activity context → Cluster Strategy Manager → Strategy saved to activity

### Integration 5: Vendor Basket ↔ Projects
- **Trigger**: "Add to Quote" / "Export to Project" (assumed)
- **Data Flow**: Selected hardware models → Project hardware allocation

---

## 6. State Management Observations

Based on code analysis:

### Global State (Zustand Stores)
| Store | Purpose | Location |
|-------|---------|----------|
| `useInfraVisualizerStore` | Infra visualizer graph state | `stores/useInfraVisualizerStore.ts` |
| Project store? | Project management | (TBD - need to verify) |
| Activity store? | Activity management | (TBD - need to verify) |

### Local State (Component-Level)
- Project workspace: `activeTab` state for tab navigation
- Activity wizard: Multi-step form state
- Sidebar: `isSidebarOpen`, `isProjectOpen`

---

## 7. Component Library Usage

### Purple Glass Components (Expected Usage)
Based on COMPONENT_LIBRARY_GUIDE.md and user preferences:

**Currently Used**:
- PurpleGlassButton: "Add Activity", back buttons
- PurpleGlassInput: Search bars, form inputs
- PurpleGlassDropdown: Basket selection, filters
- PurpleGlassCard: Project cards, hardware cards

**Should Be Used (Not Verified)**:
- All form inputs in Activity Wizard
- All buttons throughout app
- All cards for data display
- All dropdowns/selects

**Design Elements User Likes**:
✅ Timeline/List slider (glassmorphic toggle)  
✅ Add Activity button (Purple Glass)  
✅ Back button (Purple Glass)  
✅ Dropdown menus in project page (Purple Glass)  
✅ Search bar (Purple Glass)  
✅ Cards in Hardware Basket (Purple Glass)  
✅ Activity modal design (needs flow improvements)  

---

## 8. Questions & Assumptions for Phase 2-3 (Flow Analysis)

### Questions to Answer Through Code Review:
1. **Q**: Is there a "Create Project" button and modal in ProjectsView?
2. **Q**: How is the "Add Activity" button triggered? Is it in ProjectWorkspaceView?
3. **Q**: Does RVTools view have "Export to Hardware Pool" functionality?
4. **Q**: Is there a breadcrumb component for navigation context?
5. **Q**: How are activities displayed on the timeline? Cards? List items?
6. **Q**: Can users edit activities after creation?
7. **Q**: Is there a "Delete Activity" flow?
8. **Q**: How do users navigate back from ClusterStrategyManagerView to Activity Wizard?
9. **Q**: Is CapacityVisualizerView accessible from anywhere? How?
10. **Q**: Is DataCollectionView accessible? Where?

### Assumptions:
- Users start from landing page → Navigate to Projects → Create project → Add activities
- Activity Wizard is the primary workflow mechanism
- Hardware Pool is populated from RVTools OR manual entry
- Vendor Basket is independent but can export to projects
- Infra Visualizer is a visualization layer over existing data

---

## Next Steps (Phase 2-3)

1. **Code Review**: Examine each view component to answer questions above
2. **Flow Validation**: Verify each intended flow has complete implementation
3. **Broken Flow Identification**: Find:
   - Missing buttons/triggers
   - Dead-end screens
   - Inconsistent navigation
   - Missing back navigation
   - Incomplete wizard steps
   - Missing confirmation dialogs
4. **Create Fix Plan**: Prioritize and plan fixes for Phase 4-5

---

**Status**: Phase 1 Complete - Navigation Map Created  
**Next**: Phase 2 - Detailed Flow Validation Through Code Review
