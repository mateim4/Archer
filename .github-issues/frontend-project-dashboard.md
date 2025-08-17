# Frontend: Project Management Dashboard

## Issue Description
Create the main project management dashboard view that serves as the central hub for managing infrastructure projects, displaying project status, and providing access to project timeline and activities.

## Background
The project management system needs a main dashboard that lists all projects, allows creation of new projects, and provides navigation to detailed project views. This will become the primary landing page for the application.

## Technical Specifications

### Component Structure
```
ProjectManagementView.tsx (main view)
├── ProjectList.tsx (project grid/list)
├── ProjectCard.tsx (individual project cards) 
├── CreateProjectModal.tsx (new project creation)
└── ProjectStatusIndicator.tsx (status badges)
```

### Main Dashboard Component

```typescript
// frontend/src/views/ProjectManagementView.tsx
import React, { useState, useEffect } from 'react';
import { 
  FolderPlusRegular,
  CalendarRegular,
  PersonRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  PauseRegular
} from '@fluentui/react-icons';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import ConsistentCard from '../components/ConsistentCard';
import ConsistentButton from '../components/ConsistentButton';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  activities_count: number;
  completed_activities: number;
  assignees: string[];
  start_date: Date;
  end_date: Date;
  created_at: Date;
}

const ProjectManagementView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Implementation details...
};
```

### Project Card Component

```typescript
// frontend/src/components/ProjectCard.tsx
interface ProjectCardProps {
  project: Project;
  onClick: (projectId: string) => void;
  onEdit: (projectId: string) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, onEdit, onDelete }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckmarkCircleRegular style={{ color: '#10b981' }} />;
      case 'in_progress': return <ClockRegular style={{ color: '#3b82f6' }} />;
      case 'on_hold': return <PauseRegular style={{ color: '#f59e0b' }} />;
      default: return <CalendarRegular style={{ color: '#6b7280' }} />;
    }
  };

  const getProgressPercentage = () => {
    if (project.activities_count === 0) return 0;
    return (project.completed_activities / project.activities_count) * 100;
  };

  return (
    <div className="lcm-card project-card" style={{ 
      padding: '24px', 
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(18px) saturate(180%)'
    }}
    onClick={() => onClick(project.id)}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            {project.name}
          </h3>
          <p style={{ margin: '0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5 }}>
            {project.description}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getStatusIcon(project.status)}
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '500',
            padding: '4px 8px',
            borderRadius: '4px',
            background: 'rgba(139, 92, 246, 0.1)',
            color: '#8b5cf6',
            textTransform: 'capitalize'
          }}>
            {project.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Progress</span>
          <span style={{ fontSize: '12px', color: '#111827', fontWeight: '500' }}>
            {project.completed_activities}/{project.activities_count} activities
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '6px', 
          background: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: '3px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${getProgressPercentage()}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
            borderRadius: '3px',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PersonRegular style={{ fontSize: '14px', color: '#6b7280' }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {project.assignees.length > 0 ? project.assignees.slice(0, 2).join(', ') : 'Unassigned'}
            {project.assignees.length > 2 && ` +${project.assignees.length - 2}`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarRegular style={{ fontSize: '14px', color: '#6b7280' }} />
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {new Date(project.end_date).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};
```

### Create Project Modal

```typescript
// frontend/src/components/CreateProjectModal.tsx
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: CreateProjectRequest) => void;
}

interface CreateProjectRequest {
  name: string;
  description: string;
  assignees: string[];
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    assignees: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
    onClose();
    setFormData({ name: '', description: '', assignees: [] });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="lcm-card" style={{
        width: '100%',
        maxWidth: '500px',
        margin: '20px',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <h2 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
          Create New Project
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Project Name *
            </label>
            <input
              type="text"
              className="lcm-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter project name"
              style={{ width: '100%' }}
            />
            {errors.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Description *
            </label>
            <textarea
              className="lcm-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the project objectives and scope"
              rows={3}
              style={{ width: '100%', resize: 'vertical' }}
            />
            {errors.description && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>{errors.description}</span>}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <ConsistentButton variant="outline" onClick={onClose}>
              Cancel
            </ConsistentButton>
            <ConsistentButton variant="primary" type="submit">
              Create Project
            </ConsistentButton>
          </div>
        </form>
      </div>
    </div>
  );
};
```

## Implementation Tasks

### Phase 1: Basic Dashboard
- [ ] Create ProjectManagementView main component
- [ ] Implement project listing with grid/list views
- [ ] Add project status indicators and progress bars
- [ ] Create responsive layout with glassmorphic design

### Phase 2: Project Management
- [ ] Implement CreateProjectModal with validation
- [ ] Add project editing and deletion functionality
- [ ] Implement project filtering and search
- [ ] Add project sorting by date, status, progress

### Phase 3: Navigation Integration
- [ ] Integrate with main navigation (replace current structure)
- [ ] Add project detail view navigation
- [ ] Implement breadcrumb navigation
- [ ] Add keyboard shortcuts for common actions

### Phase 4: Data Integration
- [ ] Connect to backend project APIs
- [ ] Implement real-time project updates
- [ ] Add loading states and error handling
- [ ] Implement optimistic updates

## Design System Compliance

### Required CSS Classes
- `.lcm-card` for all card containers
- `.lcm-input` for all input fields
- `.lcm-button` for all buttons
- Follow existing glassmorphic styling patterns
- Use purple accent color (#8b5cf6) throughout

### Typography
- Font family: Montserrat
- Consistent heading hierarchy
- Proper color contrast ratios

### Interactive States
- Hover animations with transform and shadow
- Loading states with skeleton screens
- Error states with appropriate messaging
- Focus states for accessibility

## Files to Create
- `frontend/src/views/ProjectManagementView.tsx`
- `frontend/src/components/ProjectCard.tsx`
- `frontend/src/components/CreateProjectModal.tsx`
- `frontend/src/components/ProjectStatusIndicator.tsx`
- `frontend/src/types/projectTypes.ts`

## Files to Modify
- `frontend/src/App.tsx` (add new route)
- `frontend/src/components/NavigationSidebar.tsx` (update navigation)

## API Integration Requirements
```typescript
// API calls needed
const projectApi = {
  getProjects: () => fetch('/api/projects'),
  createProject: (project: CreateProjectRequest) => fetch('/api/projects', { method: 'POST', body: JSON.stringify(project) }),
  updateProject: (id: string, updates: Partial<Project>) => fetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteProject: (id: string) => fetch(`/api/projects/${id}`, { method: 'DELETE' })
};
```

## Acceptance Criteria
- [ ] Dashboard displays all projects in grid or list view
- [ ] Project cards show status, progress, and key information
- [ ] Create project modal validates input and creates projects
- [ ] Projects can be edited and deleted with confirmation
- [ ] Responsive design works on desktop and tablet
- [ ] Loading states and error handling implemented
- [ ] Navigation integrates properly with main app
- [ ] Design system compliance maintained throughout

## Related Components
- Reference: `frontend/src/views/VendorDataCollectionView.tsx` for layout patterns
- Reference: `frontend/src/components/ConsistentCard.tsx` for card styling  
- Reference: `frontend/src/components/ConsistentButton.tsx` for button styling