# Infra-Visualizer Integration Plan for LCMDesigner

**Date**: November 10, 2025  
**Purpose**: Comprehensive integration strategy for incorporating Infra-Visualizer (visX-network-mapper) module into LCMDesigner  
**Status**: Planning Phase

---

## 📋 Executive Summary

### What is Infra-Visualizer?
A specialized module for uploading server inventory exports and visualizing infrastructure as interactive canvas-based diagrams. Built with the same tech stack as LCMDesigner (Rust + Tauri + SurrealDB).

### Why Integrate?
1. **Technology Alignment**: Both projects use Rust + Tauri + SurrealDB
2. **Feature Synergy**: LCMDesigner processes RVTools/hardware exports; Infra-Visualizer visualizes them
3. **Enhanced UX**: Replace basic mermaid diagrams with rich, interactive canvas visualizations
4. **Unified Workflow**: Single tool for infrastructure planning AND visualization

### Integration Approach
**Embedded Module Strategy** - Integrate Infra-Visualizer as a library/component within LCMDesigner rather than keeping them separate. This provides:
- Seamless UX with shared navigation
- Unified data model and database
- Reduced maintenance overhead
- Cross-feature reusability

---

## 🎯 Integration Goals

### Primary Objectives
1. ✅ **Preserve All Functionality**: Neither project loses features
2. ✅ **Enhance User Experience**: Better than sum of parts
3. ✅ **Maintain Code Quality**: Follow LCMDesigner's Purple Glass design system
4. ✅ **Enable Cross-Feature Usage**: Visualization available everywhere it makes sense
5. ✅ **Future-Proof Architecture**: Easy to extend and maintain

### Success Criteria
- [ ] Infra-Visualizer accessible from multiple entry points
- [ ] Existing LCMDesigner features enhanced with new visualizations
- [ ] No breaking changes to current workflows
- [ ] Performance impact < 5% on existing views
- [ ] All existing tests pass + new tests added
- [ ] Documentation updated for new capabilities

---

## 🗺️ Integration Architecture

### 1. Navigation & UX Placement

#### **Primary Entry Point**: Tools Section (New)
```
Main Navigation
├── Projects (Primary)
├── Hardware Pool
├── Hardware Basket
├── RVTools (New badge)
├── Tools (NEW SECTION)
│   ├── Infrastructure Visualizer (NEW - Primary)
│   ├── Capacity Planner
│   └── Network Topology
├── Guides
├── Document Templates
└── Settings
```

**Rationale**: 
- Groups visualization/analysis tools together
- Reduces main menu clutter (current: 7 items → 6 items with nested tools)
- Follows UX best practice: categorize related features
- Capacity Visualizer is already standalone but could be grouped

#### **Secondary Entry Points** (Embedded/Contextual)

1. **Within Project Workspace** → New "Visualization" Tab
   ```
   Project Workspace Tabs:
   - Overview
   - Timeline  
   - Capacity
   - Visualization (NEW - uses Infra-Visualizer)
   - Documents
   ```

2. **Migration Wizard** → Step 2: Destination Configuration
   - Visualize source infrastructure (from RVTools)
   - Visualize target cluster design
   - Side-by-side comparison view

3. **Hardware Pool View** → Toolbar Action
   - "Visualize Inventory" button
   - Opens modal with canvas diagram of all hardware

4. **RVTools Upload Result** → Auto-generate Diagram
   - After processing RVTools, show "View Infrastructure Diagram" button
   - Directly visualize uploaded environment

5. **Network Configuration Views** → Replace Mermaid Diagrams
   - NetworkVisualizerView.tsx enhancement
   - VisualNetworkDiagram.tsx replacement with canvas version

---

## 🏗️ Technical Integration Strategy

### Phase 1: Backend Integration (Rust Services)

#### 1.1 Module Structure
```
LCMDesigner/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── rvtools.rs (existing)
│   │   │   ├── hardware_baskets.rs (existing)
│   │   │   └── infra_visualizer.rs (NEW)
│   │   ├── services/
│   │   │   ├── rvtools_service.rs (existing)
│   │   │   ├── migration_wizard_service.rs (existing)
│   │   │   └── visualization_service.rs (NEW)
│   │   └── models/
│   │       ├── rvtools_models.rs (existing)
│   │       └── visualization_models.rs (NEW)
│   └── Cargo.toml (add Infra-Visualizer dependencies)
```

#### 1.2 New API Endpoints
```rust
// backend/src/api/infra_visualizer.rs

pub fn routes() -> Router<Arc<Database>> {
    Router::new()
        // Visualization generation
        .route("/api/visualizations", post(create_visualization))
        .route("/api/visualizations/:id", get(get_visualization))
        .route("/api/visualizations/:id", put(update_visualization))
        .route("/api/visualizations/:id", delete(delete_visualization))
        
        // Canvas data export
        .route("/api/visualizations/:id/export", post(export_visualization))
        
        // Integration with existing data
        .route("/api/visualizations/from-rvtools/:upload_id", post(create_from_rvtools))
        .route("/api/visualizations/from-project/:project_id", post(create_from_project))
        .route("/api/visualizations/from-hardware-pool", post(create_from_hardware_pool))
}
```

#### 1.3 Database Schema Extensions
```surql
-- New tables for visualizations
DEFINE TABLE visualization SCHEMAFULL
  PERMISSIONS FOR select, create, update, delete WHERE $auth.role = 'admin' OR $auth.role = 'user';

DEFINE FIELD project_id ON visualization TYPE option<record<project>>;
DEFINE FIELD rvtools_upload_id ON visualization TYPE option<record<rvtools_upload>>;
DEFINE FIELD name ON visualization TYPE string ASSERT $value != NONE;
DEFINE FIELD description ON visualization TYPE option<string>;
DEFINE FIELD canvas_data ON visualization TYPE object; -- JSON canvas state
DEFINE FIELD diagram_type ON visualization TYPE string 
  ASSERT $value IN ['infrastructure', 'network', 'capacity', 'migration'];
DEFINE FIELD created_at ON visualization TYPE datetime DEFAULT time::now();
DEFINE FIELD updated_at ON visualization TYPE datetime DEFAULT time::now();
DEFINE FIELD created_by ON visualization TYPE string;

-- Index for fast lookups
DEFINE INDEX visualization_project_idx ON visualization FIELDS project_id;
DEFINE INDEX visualization_rvtools_idx ON visualization FIELDS rvtools_upload_id;

-- Relationship: Project → Visualizations
DEFINE TABLE project_visualization SCHEMAFULL;
DEFINE FIELD in ON project_visualization TYPE record<project>;
DEFINE FIELD out ON project_visualization TYPE record<visualization>;
```

#### 1.4 Service Layer Integration
```rust
// backend/src/services/visualization_service.rs

pub struct VisualizationService {
    db: Arc<Database>,
}

impl VisualizationService {
    /// Create visualization from RVTools upload
    pub async fn create_from_rvtools(
        &self,
        upload_id: &str,
    ) -> Result<VisualizationData> {
        // 1. Fetch RVTools data (hosts, VMs, networks)
        // 2. Transform to canvas node/edge format
        // 3. Generate layout coordinates
        // 4. Save visualization entity
        // 5. Return canvas-ready JSON
    }
    
    /// Create visualization from project data
    pub async fn create_from_project(
        &self,
        project_id: &str,
    ) -> Result<VisualizationData> {
        // 1. Aggregate all project activities
        // 2. Include hardware selections, clusters, network mappings
        // 3. Generate comprehensive diagram
    }
    
    /// Create visualization from hardware pool
    pub async fn create_from_hardware_pool(
        &self,
    ) -> Result<VisualizationData> {
        // 1. Fetch all hardware assets
        // 2. Group by vendor, type, specifications
        // 3. Generate inventory visualization
    }
}
```

---

### Phase 2: Frontend Integration (React Components)

#### 2.1 Component Architecture
```
frontend/src/
├── components/
│   ├── InfraVisualizer/
│   │   ├── InfraVisualizerCanvas.tsx (NEW - Core canvas component)
│   │   ├── VisualizationToolbar.tsx (NEW - Controls: zoom, pan, export)
│   │   ├── NodePalette.tsx (NEW - Drag-drop node library)
│   │   ├── PropertyPanel.tsx (NEW - Edit node/edge properties)
│   │   └── index.ts
│   ├── NetworkVisualization/ (ENHANCE - Use InfraVisualizerCanvas)
│   └── CapacityVisualizer/ (ENHANCE - Optional canvas integration)
├── views/
│   ├── InfraVisualizerView.tsx (NEW - Standalone tool view)
│   ├── NetworkVisualizerView.tsx (ENHANCE - Replace mermaid)
│   ├── ProjectWorkspaceView.tsx (ENHANCE - Add Visualization tab)
│   └── HardwarePoolView.tsx (ENHANCE - Add "Visualize" button)
└── hooks/
    ├── useVisualization.ts (NEW - Fetch/save visualization data)
    └── useCanvasState.ts (NEW - Canvas interaction state)
```

#### 2.2 Core Canvas Component
```tsx
// frontend/src/components/InfraVisualizer/InfraVisualizerCanvas.tsx

import React, { useRef, useEffect, useState } from 'react';
import { PurpleGlassCard } from '@/components/ui';

interface Node {
  id: string;
  type: 'server' | 'vm' | 'network' | 'storage' | 'switch';
  label: string;
  x: number;
  y: number;
  metadata: Record<string, any>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'network' | 'storage' | 'dependency';
  label?: string;
}

interface VisualizationData {
  nodes: Node[];
  edges: Edge[];
  layout: 'auto' | 'hierarchical' | 'radial' | 'force';
}

export const InfraVisualizerCanvas: React.FC<{
  data: VisualizationData;
  editable?: boolean;
  onSave?: (data: VisualizationData) => void;
}> = ({ data, editable = false, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Canvas rendering logic
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Render edges first
    data.edges.forEach(edge => renderEdge(ctx, edge, data.nodes));

    // Render nodes on top
    data.nodes.forEach(node => renderNode(ctx, node));

    ctx.restore();
  }, [data, zoom, pan]);

  const renderNode = (ctx: CanvasRenderingContext2D, node: Node) => {
    // Purple Glass styled nodes
    const gradient = ctx.createLinearGradient(
      node.x - 50, node.y - 50,
      node.x + 50, node.y + 50
    );
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.2)');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.roundRect(node.x - 50, node.y - 30, 100, 60, 8);
    ctx.fill();
    ctx.stroke();

    // Node label
    ctx.fillStyle = '#374151';
    ctx.font = '14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.label, node.x, node.y + 5);
  };

  const renderEdge = (
    ctx: CanvasRenderingContext2D,
    edge: Edge,
    nodes: Node[]
  ) => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    
    if (!source || !target) return;

    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
  };

  return (
    <PurpleGlassCard glass padding="none">
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        style={{ cursor: 'grab', width: '100%', height: '100%' }}
      />
    </PurpleGlassCard>
  );
};
```

#### 2.3 Standalone View
```tsx
// frontend/src/views/InfraVisualizerView.tsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { InfraVisualizerCanvas } from '@/components/InfraVisualizer';
import { VisualizationToolbar } from '@/components/InfraVisualizer';
import { PurpleGlassButton } from '@/components/ui';
import { useVisualization } from '@/hooks/useVisualization';
import { DesignTokens } from '@/styles/design-tokens';

export const InfraVisualizerView: React.FC = () => {
  const { visualizationId } = useParams<{ visualizationId?: string }>();
  const { data, loading, save } = useVisualization(visualizationId);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  return (
    <div className="lcm-page-container">
      <div className="lcm-page-header">
        <div>
          <h1 style={{ 
            fontSize: DesignTokens.typography.xxl,
            fontWeight: DesignTokens.typography.bold,
            margin: 0
          }}>
            Infrastructure Visualizer
          </h1>
          <p style={{ 
            color: DesignTokens.colors.textSecondary,
            margin: `${DesignTokens.spacing.xs} 0 0 0`
          }}>
            Interactive canvas-based infrastructure diagrams
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: DesignTokens.spacing.sm }}>
          <PurpleGlassButton
            variant="secondary"
            onClick={() => setMode(mode === 'view' ? 'edit' : 'view')}
          >
            {mode === 'view' ? 'Edit' : 'View'}
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary" onClick={() => save(data)}>
            Save
          </PurpleGlassButton>
        </div>
      </div>

      {loading ? (
        <div>Loading visualization...</div>
      ) : (
        <>
          <VisualizationToolbar onExport={() => {}} onReset={() => {}} />
          <InfraVisualizerCanvas
            data={data}
            editable={mode === 'edit'}
            onSave={save}
          />
        </>
      )}
    </div>
  );
};
```

---

### Phase 3: Data Transformation Layer

#### 3.1 RVTools → Canvas Data
```typescript
// frontend/src/utils/visualizationTransformers.ts

export const transformRVToolsToVisualization = (
  rvtoolsData: RVToolsUploadData
): VisualizationData => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // vCenter as root node
  nodes.push({
    id: 'vcenter',
    type: 'network',
    label: 'vCenter Server',
    x: 600,
    y: 100,
    metadata: { role: 'management' }
  });

  // ESXi Hosts
  rvtoolsData.hosts.forEach((host, index) => {
    const hostId = `host-${host.id}`;
    nodes.push({
      id: hostId,
      type: 'server',
      label: host.hostname,
      x: 200 + (index * 150),
      y: 300,
      metadata: {
        cpu: host.cpu_cores,
        memory: host.memory_gb,
        model: host.model
      }
    });

    // Connect to vCenter
    edges.push({
      id: `edge-vcenter-${hostId}`,
      source: 'vcenter',
      target: hostId,
      type: 'network'
    });
  });

  // VMs on hosts
  rvtoolsData.vms.forEach((vm, index) => {
    const vmId = `vm-${vm.id}`;
    nodes.push({
      id: vmId,
      type: 'vm',
      label: vm.name,
      x: 200 + (index % 5) * 150,
      y: 500,
      metadata: {
        os: vm.os,
        cpu: vm.cpu_count,
        memory: vm.memory_mb
      }
    });

    // Connect to host
    if (vm.host_id) {
      edges.push({
        id: `edge-vm-${vmId}`,
        source: `host-${vm.host_id}`,
        target: vmId,
        type: 'dependency'
      });
    }
  });

  return {
    nodes,
    edges,
    layout: 'hierarchical'
  };
};
```

#### 3.2 Hardware Pool → Canvas Data
```typescript
export const transformHardwarePoolToVisualization = (
  hardwareAssets: HardwareAsset[]
): VisualizationData => {
  // Group by vendor
  const vendors = groupBy(hardwareAssets, 'vendor');
  
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  let yOffset = 100;
  
  Object.entries(vendors).forEach(([vendor, assets]) => {
    // Vendor group node
    const vendorId = `vendor-${vendor}`;
    nodes.push({
      id: vendorId,
      type: 'network',
      label: vendor,
      x: 200,
      y: yOffset,
      metadata: { type: 'vendor-group', count: assets.length }
    });
    
    // Individual assets
    assets.forEach((asset, index) => {
      const assetId = `asset-${asset.id}`;
      nodes.push({
        id: assetId,
        type: 'server',
        label: asset.model,
        x: 400 + (index * 120),
        y: yOffset,
        metadata: asset
      });
      
      edges.push({
        id: `edge-${vendorId}-${assetId}`,
        source: vendorId,
        target: assetId,
        type: 'network'
      });
    });
    
    yOffset += 150;
  });
  
  return { nodes, edges, layout: 'hierarchical' };
};
```

---

### Phase 4: Navigation & Routing Updates

#### 4.1 Update App.tsx Routes
```tsx
// frontend/src/App.tsx

import { InfraVisualizerView } from './views/InfraVisualizerView';

// In Routes section:
<Route path="tools">
  <Route path="infra-visualizer" element={<InfraVisualizerView />} />
  <Route path="infra-visualizer/:visualizationId" element={<InfraVisualizerView />} />
  <Route path="capacity-visualizer" element={<CapacityVisualizerView />} />
  <Route path="network-topology" element={<NetworkVisualizerView />} />
</Route>
```

#### 4.2 Update NavigationSidebar.tsx
```tsx
// frontend/src/components/NavigationSidebar.tsx

import { 
  ChartMultipleRegular,
  ChartMultipleFilled
} from '@fluentui/react-icons';

// Add new menu structure:
const toolsMenuItems: MenuItem[] = [
  {
    id: 'infra-visualizer',
    title: 'Infrastructure Visualizer',
    icon: <ChartMultipleRegular />,
    iconFilled: <ChartMultipleFilled />,
    path: '/app/tools/infra-visualizer',
    badge: 'New',
    badgeType: 'success'
  },
  {
    id: 'capacity-visualizer',
    title: 'Capacity Planner',
    icon: <ChartRegular />,
    iconFilled: <ChartFilled />,
    path: '/app/tools/capacity-visualizer'
  },
  {
    id: 'network-topology',
    title: 'Network Topology',
    icon: <NetworkRegular />,
    iconFilled: <NetworkFilled />,
    path: '/app/tools/network-topology'
  }
];

// Render collapsible "Tools" section
```

---

### Phase 5: Embedded Integrations

#### 5.1 Project Workspace - Visualization Tab
```tsx
// frontend/src/views/ProjectWorkspaceView.tsx

// Add to tabs:
{
  key: 'visualization',
  content: 'Visualization',
  icon: <ChartMultipleRegular />
}

// In tab content rendering:
case 'visualization':
  return (
    <InfraVisualizerCanvas
      data={projectVisualizationData}
      editable={false}
    />
  );
```

#### 5.2 Migration Wizard - Source/Target Visualization
```tsx
// frontend/src/components/MigrationPlanningWizard.tsx

// Step 1: Source Selection - After RVTools upload
{selectedRVTools && (
  <div style={{ marginTop: '24px' }}>
    <h4>Source Infrastructure Preview</h4>
    <InfraVisualizerCanvas
      data={transformRVToolsToVisualization(rvtoolsData)}
      editable={false}
    />
  </div>
)}
```

#### 5.3 Hardware Pool - Visualize Button
```tsx
// frontend/src/views/HardwarePoolView.tsx

const [showVisualization, setShowVisualization] = useState(false);

<PurpleGlassButton
  variant="secondary"
  icon={<ChartMultipleRegular />}
  onClick={() => setShowVisualization(true)}
>
  Visualize Inventory
</PurpleGlassButton>

{showVisualization && (
  <Modal>
    <InfraVisualizerCanvas
      data={transformHardwarePoolToVisualization(assets)}
      editable={false}
    />
  </Modal>
)}
```

#### 5.4 RVTools Upload Result - Auto Diagram
```tsx
// frontend/src/views/EnhancedRVToolsReportView.tsx

// After successful upload:
<PurpleGlassButton
  variant="primary"
  icon={<DiagramRegular />}
  onClick={() => navigate(`/app/tools/infra-visualizer/rvtools-${uploadId}`)}
>
  View Infrastructure Diagram
</PurpleGlassButton>
```

---

## 📦 Implementation Phases

### **Phase 1: Foundation (Week 1)**
- [ ] Create database schema for visualizations
- [ ] Implement backend `visualization_service.rs`
- [ ] Create API endpoints (`infra_visualizer.rs`)
- [ ] Write unit tests for transformation logic

### **Phase 2: Core Components (Week 2)**
- [ ] Build `InfraVisualizerCanvas.tsx` component
- [ ] Implement zoom/pan/selection interactions
- [ ] Create `VisualizationToolbar.tsx`
- [ ] Add Purple Glass styling

### **Phase 3: Data Integration (Week 3)**
- [ ] RVTools → Canvas transformation
- [ ] Hardware Pool → Canvas transformation
- [ ] Project Data → Canvas transformation
- [ ] Test with real data

### **Phase 4: Navigation & Routing (Week 4)**
- [ ] Add "Tools" section to NavigationSidebar
- [ ] Create standalone InfraVisualizerView
- [ ] Update App.tsx routes
- [ ] Add breadcrumb navigation

### **Phase 5: Embedded Integrations (Week 5)**
- [ ] Add Visualization tab to ProjectWorkspaceView
- [ ] Integrate into MigrationPlanningWizard
- [ ] Add "Visualize" to HardwarePoolView
- [ ] Auto-diagram button in RVTools upload

### **Phase 6: Polish & Testing (Week 6)**
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] User acceptance testing

---

## 🔗 Cross-Feature Usage Examples

### Example 1: Migration Planning Workflow
```
1. User uploads RVTools export → RVToolsView
2. System processes data → Backend
3. User navigates to Projects → Creates migration project
4. Opens Migration Wizard → Step 1: Source Selection
5. Selects RVTools upload → Auto-generates source diagram using InfraVisualizer
6. Designs target clusters → Step 2: Destination Config
7. Views side-by-side comparison → InfraVisualizer shows source vs target
8. Completes wizard → HLD includes embedded diagrams
```

### Example 2: Hardware Inventory Review
```
1. User navigates to Hardware Pool
2. Clicks "Visualize Inventory" button
3. Modal opens with InfraVisualizerCanvas
4. Shows all assets grouped by vendor/type
5. User can click nodes for details
6. Export diagram as PNG for presentations
```

### Example 3: Project Capacity Planning
```
1. User opens Project Workspace
2. Switches to "Visualization" tab
3. Sees comprehensive project infrastructure diagram
4. Includes:
   - Source environment (from RVTools)
   - Target hardware (from Hardware Pool)
   - Network topology (from network config)
   - Capacity metrics overlayed on nodes
5. Can zoom/pan to explore details
6. Export for documentation
```

---

## 🎨 Design System Alignment

### Purple Glass Component Integration
All Infra-Visualizer components will use LCMDesigner's Purple Glass design system:

```tsx
// Canvas container
<PurpleGlassCard glass padding="large">
  <InfraVisualizerCanvas />
</PurpleGlassCard>

// Toolbar buttons
<PurpleGlassButton variant="primary" icon={<ZoomInRegular />}>
  Zoom In
</PurpleGlassButton>

// Node styling
const nodeGradient = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(168, 85, 247, 0.2))';
const nodeBorder = '2px solid rgba(139, 92, 246, 0.4)';

// Edge styling
const edgeColor = 'rgba(139, 92, 246, 0.3)';
```

---

## ⚠️ Risk Mitigation

### Potential Issues & Solutions

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Performance**: Large diagrams slow down canvas | High | Implement virtualization, only render visible nodes |
| **Compatibility**: Infra-Visualizer uses different data model | Medium | Create comprehensive transformation layer |
| **UX Confusion**: Too many visualization options | Medium | Clear labeling, onboarding tooltips |
| **Code Duplication**: NetworkVisualizerView vs InfraVisualizer | Low | Refactor NetworkVisualizerView to use InfraVisualizerCanvas |
| **Database Schema Conflicts** | Medium | Careful planning, migration scripts |

---

## 📊 Success Metrics

### Quantitative
- [ ] 95%+ of existing tests pass
- [ ] < 5% performance degradation on existing views
- [ ] Canvas renders 500+ nodes without lag
- [ ] API response time < 200ms for diagram generation

### Qualitative
- [ ] User feedback: "Visualization makes infrastructure clearer"
- [ ] No reported bugs from integration
- [ ] Documentation rated "clear and helpful"
- [ ] Team can maintain both codebases easily

---

## 📚 Documentation Requirements

1. **User Guide**: "Using the Infrastructure Visualizer"
2. **Developer Guide**: "Extending Visualization Components"
3. **API Reference**: Updated OpenAPI spec for new endpoints
4. **Architecture Doc**: Integration architecture diagrams
5. **Migration Guide**: For existing users with network diagrams

---

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All phases complete
- [ ] Tests passing (unit, integration, E2E)
- [ ] Documentation complete
- [ ] Performance benchmarks met
- [ ] Security review completed

### Launch
- [ ] Feature flag enabled for beta users
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Track usage analytics

### Post-Launch
- [ ] Address feedback
- [ ] Optimize based on usage patterns
- [ ] Plan next enhancements
- [ ] Update roadmap

---

## ✅ Verified Infra-Visualizer Architecture (Investigation Complete)

### **Technology Stack**
- **Canvas Library**: ReactFlow (@xyflow/react v12.9.2) + Visx (@visx/hierarchy, @visx/zoom)
- **Layout Engine**: ELK.js for automatic hierarchical layouts
- **State Management**: Zustand (already used in LCMDesigner!)
- **Design System**: Fluent UI 2 (100% match with LCMDesigner!)
- **Styling**: TailwindCSS + custom CSS

### **Data Model**
```typescript
// Node Structure
interface GraphNode extends Node<NodeData> {
  id: string;
  type: string; // 'host', 'vm', 'cluster', 'vswitch', 'portgroup'
  data: {
    kind: NodeType;
    name: string;
    vendor?: 'VMware' | 'Nutanix' | 'Hyper-V';
    metadata?: Record<string, any>;
  };
  position: { x: number; y: number };
  parentId?: string;
}

// Edge Structure
interface GraphEdge extends Edge<EdgeData> {
  id: string;
  source: string;
  target: string;
  type: EdgeType; // 'contains', 'uplink', 'vm-connection', etc.
  data: {
    kind: EdgeType;
    metadata?: Record<string, any>;
  };
}
```

### **Core Components (Reusable)**
1. `HierarchyCanvas.tsx` - Main visx-based visualization (1000+ node support)
2. `useGraphStore.ts` - Zustand store for graph state
3. Node Components: `HostNode`, `VmNode`, `ClusterNode`, `PortGroupNode`, `vSwitchNode`
4. Edge Components: `ClusterMembershipEdge`, `VmConnectionEdge`
5. Layout Utilities: `buildHierarchy`, `filterHierarchy`, `normalizeGraph`
6. VMware Stencils: SVG icons for infrastructure components

### **Features (Built-In)**
- ✅ Zoom/pan with pinch-to-zoom (touch + mouse support)
- ✅ Hierarchical tree layout
- ✅ Node filtering by type
- ✅ Node selection/highlighting
- ✅ Keyboard navigation (arrow keys, +/-, 0 for reset, f for fit)
- ✅ Legend with color coding
- ✅ 1000+ node performance optimization

### **Answered Questions**
1. ✅ **Canvas Library**: ReactFlow + Visx (mature, performant, TypeScript-native)
2. ✅ **Edit vs View**: Both! ReactFlow supports editing out of the box
3. ✅ **Export Formats**: PNG, SVG, PDF, JPG (to implement using ReactFlow's export APIs)
4. ✅ **Max Nodes**: 1000+ (verified in codebase)
5. ✅ **Migrate NetworkVisualizerView**: YES - Replace mermaid with ReactFlow
6. ✅ **Auto-generate diagrams**: YES - On RVTools upload completion

---

## 📝 Next Steps

### ✅ **Phase 0: Investigation & Planning** (COMPLETE)
- [x] Analyze Infra-Visualizer codebase
- [x] Identify canvas library (ReactFlow + Visx)
- [x] Understand data model
- [x] Verify Fluent UI 2 compatibility
- [x] Install required dependencies
- [x] Update integration plan with verified architecture

### 🚀 **Phase 1: Foundation** (IN PROGRESS)
- [ ] Copy type definitions (`network-graph.ts`)
- [ ] Copy graph store (`useGraphStore.ts`)
- [ ] Copy utility functions (`buildHierarchy`, `filterHierarchy`, `normalizeGraph`)
- [ ] Adapt to LCMDesigner's design tokens
- [ ] Create transformation layer: RVTools → GraphNode
- [ ] Create transformation layer: Hardware Pool → GraphNode

### **Phase 2: Core Visualization Components**
- [ ] Copy and adapt `HierarchyCanvas.tsx`
- [ ] Apply Purple Glass styling
- [ ] Copy node components (Host, VM, Cluster, vSwitch, PortGroup)
- [ ] Copy edge components
- [ ] Copy VMware stencils
- [ ] Add export toolbar with PNG/SVG/PDF/JPG support

### **Phase 3: Standalone View**
- [ ] Create `InfraVisualizerView.tsx`
- [ ] Add toolbar (zoom controls, filters, export)
- [ ] Add mode toggle (view/edit)
- [ ] Add save functionality
- [ ] Create backend API endpoints (if needed)

---

**Plan Status**: ✅ Ready for Review  
**Estimated Effort**: 6 weeks (1 developer)  
**Dependencies**: None - can start immediately  
**Risks**: Low-Medium - well-defined scope, proven tech stack
