# Component Documentation Guide

This guide provides comprehensive documentation for LCM Designer's React components, including usage examples, props documentation, and integration patterns.

## Design System Components

### CustomSlider

**Location**: `frontend/src/components/CustomSlider.tsx`

The CustomSlider is a specialized slider component that follows the LCM Designer design system with rainbow gradient track and frosted glass thumb.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `min` | `number` | ✅ | - | Minimum value for the slider |
| `max` | `number` | ✅ | - | Maximum value for the slider |
| `value` | `number` | ✅ | - | Current value of the slider |
| `onChange` | `(value: number) => void` | ✅ | - | Callback function called when slider value changes |
| `className` | `string` | ❌ | `''` | Additional CSS class names to apply |
| `style` | `React.CSSProperties` | ❌ | `{}` | Inline styles to apply to the slider container |
| `unit` | `string` | ❌ | `'mo'` | Unit to display next to the value |

#### Usage Examples

```tsx
// Basic usage for capacity planning
<CustomSlider
  min={0}
  max={100}
  value={overcommitRatio}
  onChange={(value) => setOvercommitRatio(value)}
  unit="%"
/>

// Advanced usage with custom styling
<CustomSlider
  min={1}
  max={24}
  value={timelineMonths}
  onChange={handleTimelineChange}
  className="timeline-slider"
  style={{ width: '300px' }}
  unit="months"
/>
```

#### Features

- **Interactive**: Click to edit value directly
- **Visual Feedback**: Smooth animations and hover effects
- **Accessibility**: Keyboard navigation support
- **Design System**: Matches glassmorphic purple theme

---

### CapacityVisualizerView

**Location**: `frontend/src/views/CapacityVisualizerView.tsx`

Interactive visualization component for infrastructure capacity planning with multiple visualization modes and migration capabilities.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `clusters` | `ClusterData[]` | ✅ | - | Array of cluster data with hosts and VMs |
| `selectedVMs` | `Set<string>` | ✅ | - | Set of currently selected VM IDs |
| `onVMSelect` | `(vmId: string, selected: boolean) => void` | ✅ | - | Callback for VM selection changes |
| `visualizationMode` | `'cpu' \| 'memory' \| 'storage'` | ✅ | - | Current visualization mode |
| `isMigrationView` | `boolean` | ❌ | `false` | Whether to show migration-specific UI |

#### Usage Examples

```tsx
// Basic capacity visualization
<CapacityVisualizerView
  clusters={clusterData}
  selectedVMs={selectedVMs}
  onVMSelect={handleVMSelection}
  visualizationMode="cpu"
/>

// Migration planning mode
<CapacityVisualizerView
  clusters={clusterData}
  selectedVMs={migratingVMs}
  onVMSelect={handleMigrationVMSelection}
  visualizationMode="memory"
  isMigrationView={true}
/>
```

#### Features

- **Multiple Modes**: CPU, Memory, and Storage visualization
- **Interactive Selection**: Click to select VMs for migration
- **Drag & Drop**: Move VMs between hosts
- **Real-time Calculations**: Dynamic capacity utilization
- **Overcommit Support**: Configurable overcommitment ratios

---

### ConsistentCard

**Location**: `frontend/src/components/ConsistentCard.tsx`

Standard card component following the glassmorphic design system.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | ✅ | - | Content to display inside the card |
| `className` | `string` | ❌ | `''` | Additional CSS classes |
| `style` | `React.CSSProperties` | ❌ | `{}` | Inline styles |
| `padding` | `'none' \| 'small' \| 'medium' \| 'large'` | ❌ | `'medium'` | Internal padding size |

#### Usage Examples

```tsx
// Basic card
<ConsistentCard>
  <h3>Hardware Summary</h3>
  <p>Server count: 24</p>
</ConsistentCard>

// Card with custom styling
<ConsistentCard 
  className="stats-card"
  padding="large"
  style={{ minHeight: '200px' }}
>
  <StatisticsComponent />
</ConsistentCard>
```

---

### ConsistentButton

**Location**: `frontend/src/components/ConsistentButton.tsx`

Standard button component with consistent styling across the application.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | ✅ | - | Button content |
| `onClick` | `() => void` | ❌ | - | Click handler |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | ❌ | `'primary'` | Button style variant |
| `disabled` | `boolean` | ❌ | `false` | Whether button is disabled |
| `loading` | `boolean` | ❌ | `false` | Whether to show loading state |
| `icon` | `React.ReactNode` | ❌ | - | Optional icon to display |

#### Usage Examples

```tsx
// Primary action button
<ConsistentButton 
  variant="primary"
  onClick={handleSave}
  loading={isSaving}
>
  Save Project
</ConsistentButton>

// Secondary button with icon
<ConsistentButton 
  variant="secondary"
  icon={<DownloadIcon />}
  onClick={handleExport}
>
  Export Data
</ConsistentButton>
```

## View Components

### ProjectDetailView

**Location**: `frontend/src/views/ProjectDetailView.tsx`

Comprehensive project management interface with timeline, resources, and document management.

#### Features

- **Project Timeline**: Gantt chart visualization
- **Resource Management**: Hardware and team allocation
- **Document Templates**: Automated document generation
- **Migration Planning**: Step-by-step migration workflows

#### Usage

```tsx
<ProjectDetailView 
  projectId={selectedProjectId}
  onProjectUpdate={handleProjectUpdate}
  onNavigateBack={() => setActiveView('projects')}
/>
```

---

### HardwareBasketView

**Location**: `frontend/src/views/HardwareBasketView.tsx`

Hardware catalog management with vendor data processing capabilities.

#### Features

- **File Upload**: Excel file processing for Dell/Lenovo catalogs
- **Dynamic Parsing**: Intelligent header detection and model recognition
- **Model Display**: Filterable table with specifications
- **Vendor Integration**: Support for multiple hardware vendors

#### Usage

```tsx
<HardwareBasketView
  selectedVendor={vendor}
  onBasketSelect={handleBasketSelection}
  showUploadDialog={showUploadDialog}
/>
```

## Design System Standards

### Required CSS Classes

All components must use the standard CSS classes for consistency:

- **Cards**: `.lcm-card`
- **Inputs**: `.lcm-input`
- **Dropdowns**: `.lcm-dropdown`
- **Buttons**: `.lcm-button`
- **Sliders**: Use `CustomSlider` component

### Color System

The design system uses CSS custom properties:

```css
--lcm-primary: #8b5cf6;
--lcm-bg-card: rgba(255,255,255,0.85);
--lcm-backdrop-filter: blur(18px) saturate(180%);
--lcm-text-primary: #1a1a1a;
--lcm-text-secondary: #666666;
```

### Typography

- **Font Family**: Poppins (primary), Montserrat (fallback)
- **Headings**: Use Fluent UI Title components
- **Body Text**: Use Fluent UI Text components
- **Captions**: Use Fluent UI Caption components

## State Management

### Zustand Store

Components should integrate with the global Zustand store for state management:

```tsx
import { useAppStore } from '../store/useAppStore';

const MyComponent = () => {
  const { 
    currentProject, 
    setCurrentProject,
    loading,
    setLoading 
  } = useAppStore();

  // Component logic here
};
```

### State Patterns

- **Loading States**: Use `loading` boolean with visual feedback
- **Error Handling**: Use `error` string with user-friendly messages
- **Optimistic Updates**: Update UI immediately, handle errors gracefully

## Testing Components

### Component Testing

Each component should have corresponding tests:

```tsx
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const mockOnClick = jest.fn();
    render(<MyComponent onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

### Integration Testing

Use Playwright for end-to-end testing:

```typescript
// capacity-visualizer.spec.ts
import { test, expect } from '@playwright/test';

test('capacity visualizer loads and displays clusters', async ({ page }) => {
  await page.goto('/capacity-visualizer');
  
  await expect(page.getByText('Cluster Overview')).toBeVisible();
  await expect(page.getByRole('button', { name: 'CPU View' })).toBeVisible();
});
```

## Component Guidelines

### 1. Props Interface

Always define comprehensive TypeScript interfaces:

```tsx
interface ComponentProps {
  /** Required prop with clear description */
  title: string;
  /** Optional prop with default behavior */
  showIcon?: boolean;
  /** Callback with specific signature */
  onAction: (id: string, data: any) => void;
}
```

### 2. Documentation

Include JSDoc comments for complex components:

```tsx
/**
 * ComponentName - Brief description
 * 
 * Longer description with usage context and key features.
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   title="Example"
 *   onAction={handleAction}
 * />
 * ```
 */
```

### 3. Error Boundaries

Wrap complex components in error boundaries:

```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ComplexComponent />
</ErrorBoundary>
```

### 4. Performance

Use React optimization techniques:

```tsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);
```

## Contributing

When adding new components:

1. **Follow Design System**: Use standard CSS classes and patterns
2. **Add Documentation**: Include JSDoc comments and usage examples
3. **Write Tests**: Cover functionality and edge cases
4. **Update This Guide**: Add your component to this documentation

For questions or suggestions, please create an issue in the GitHub repository.