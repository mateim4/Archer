# Interactive Capacity Visualizer

A comprehensive VM workload migration simulation and capacity planning tool built with React, TypeScript, and D3.js.

## Features Implemented

### Core Visualization
- ✅ **Infinite Canvas**: Zoomable and pannable treemap visualization using D3.js
- ✅ **Hierarchical Treemap**: Three-level hierarchy (Clusters → Hosts → VMs/Free Space)
- ✅ **Four Capacity Views**: CPU, Memory, Storage, and Bottleneck analysis
- ✅ **Real-time Updates**: Dynamic rectangle sizing based on selected capacity view

### Interactive Features
- ✅ **Drag & Drop VM Migration**: Drag VMs between hosts with visual feedback
- ✅ **Real-time Fit Feedback**: Green/red glow indicating capacity constraints
- ✅ **Multi-select Support**: 
  - Shift+drag marquee selection
  - Ctrl/Cmd+click for multi-select
  - Bulk operations on selected VMs
- ✅ **VM Locking**: Lock VMs to prevent migration (with visual indicators)

### Advanced Functionality
- ✅ **Overcommitment Ratios**: Live adjustment of CPU and Memory OC ratios
- ✅ **Cluster Management**: Toggle cluster visibility, add new clusters
- ✅ **Undo/Redo System**: Full state management with action history
- ✅ **Tooltip System**: Detailed resource information on hover
- ✅ **Capacity Constraints**: Prevents invalid VM migrations

### UI Components
- ✅ **Side Panel Controls**: Complete control interface with live statistics
- ✅ **Selection Management**: Bulk actions panel for selected VMs
- ✅ **Interactive Instructions**: Context-sensitive help and keyboard shortcuts

## Component Architecture

```
CapacityVisualizer/
├── CapacityCanvas.tsx          # Main D3.js visualization component
├── CapacityControlPanel.tsx    # Side panel with controls and stats
├── CapacityTooltip.tsx        # Hover tooltip component
└── README.md                  # This documentation
```

## Types

All TypeScript types are defined in `types/capacityVisualizer.ts`:
- `VMData`, `HostData`, `ClusterData` - Infrastructure models
- `VisualizerState`, `VisualizerAction` - State management
- `TreeMapNode`, `TooltipData` - Visualization data structures

## Integration

The feature is integrated into the LCM Designer as a new tab in `ProjectDetailView.tsx`:

1. **Tab Integration**: Added "Capacity Visualizer" tab with ServerRegular icon
2. **Route Handling**: Handles 'capacity' tab state
3. **Project Context**: Works within existing project management system

## Usage Instructions

### Basic Navigation
- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Click and drag to pan around canvas
- **Select VM**: Click individual VMs to select

### VM Migration
- **Drag to Migrate**: Drag VM rectangles to new host locations
- **Fit Feedback**: Green glow = can fit, Red glow = capacity exceeded
- **Constraint Checking**: Prevents migrations that exceed CPU, Memory, or Storage limits

### Multi-Selection
- **Marquee Select**: Hold Shift + drag to select multiple VMs
- **Multi-click**: Ctrl/Cmd + click to add/remove VMs from selection
- **Bulk Actions**: Lock/unlock multiple VMs simultaneously

### Capacity Analysis
- **View Switching**: Toggle between CPU, Memory, Storage, and Bottleneck views
- **OC Ratios**: Adjust overcommitment ratios to see effective capacity
- **Live Updates**: All calculations update in real-time

### Cluster Management
- **Visibility Toggle**: Show/hide clusters from visualization
- **Add Clusters**: Create new empty clusters for planning
- **Statistics**: Live summary of total VMs, hosts, and utilization

## Technical Implementation

### D3.js Integration
- Uses D3 v7 with React functional components
- Custom treemap layout with padding and rounded corners
- Drag behavior with visual feedback and constraint validation
- Zoom/pan with marquee selection support

### State Management
- Redux-style action/reducer pattern with undo/redo
- Immutable state updates with proper TypeScript typing
- Action history for full undo/redo functionality

### Performance Optimization
- Efficient D3 data joins with proper enter/update/exit patterns
- Memoized calculations for capacity metrics
- Optimized re-renders using React.useCallback and useMemo

### Design System Integration
- Follows LCM Designer's glassmorphic purple theme
- Uses Fluent UI v9 components for consistency
- Custom CSS following project design tokens

## Future Enhancements (V2 Features)

The following features were specified but not implemented in this initial version:
- **Scenario Management**: Save/load different migration scenarios
- **Affinity Rules**: VM grouping with placement constraints
- **Advanced Locking**: Group-based locking mechanisms
- **Performance Metrics**: Real-time utilization data integration
- **Export Capabilities**: Export migration plans and capacity reports

## Browser Support

- Modern browsers with ES2020+ support
- SVG and HTML5 Canvas support required
- Mouse and touch interaction support