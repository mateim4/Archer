import React, { useState, useMemo } from 'react';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  PurpleGlassModal
} from '@/components/ui';
import { 
  AddRegular, 
  EditRegular, 
  DeleteRegular, 
  CopyRegular,
  PlayRegular,
  DocumentRegular,
  SaveRegular
} from '@fluentui/react-icons';
import type { DropdownOption } from './PurpleGlassDropdown';
import './WorkflowTemplateManager.css';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'assessment' | 'planning' | 'migration' | 'validation' | 'custom';
  description: string;
  estimatedDays: number;
  dependencies: string[]; // IDs of prerequisite steps
  assignee?: string;
  automated?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'migration' | 'lifecycle' | 'assessment' | 'custom';
  steps: WorkflowStep[];
  estimatedDuration: number; // Total days
  createdAt: Date;
  updatedAt: Date;
  isBuiltIn: boolean; // Cannot be deleted
  version: string;
}

export interface WorkflowTemplateManagerProps {
  /** Available templates */
  templates: WorkflowTemplate[];
  /** Callback when template is selected for use */
  onUseTemplate?: (template: WorkflowTemplate) => void;
  /** Callback when template is created */
  onCreate?: (template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  /** Callback when template is updated */
  onUpdate?: (id: string, template: Partial<WorkflowTemplate>) => void;
  /** Callback when template is deleted */
  onDelete?: (id: string) => void;
  /** Callback when template is duplicated */
  onDuplicate?: (template: WorkflowTemplate) => void;
  /** Glass effect intensity */
  glass?: 'none' | 'light' | 'medium' | 'heavy';
}

const BUILT_IN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'lift-shift-migration',
    name: 'Lift & Shift Migration',
    description: 'Standard lift-and-shift migration workflow for moving workloads as-is to cloud',
    category: 'migration',
    version: '1.0.0',
    isBuiltIn: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    estimatedDuration: 45,
    steps: [
      {
        id: 'discovery',
        name: 'Discovery & Assessment',
        type: 'assessment',
        description: 'Collect inventory, assess dependencies, identify constraints',
        estimatedDays: 10,
        dependencies: [],
        automated: true
      },
      {
        id: 'planning',
        name: 'Migration Planning',
        type: 'planning',
        description: 'Create migration waves, select target infrastructure, plan timeline',
        estimatedDays: 10,
        dependencies: ['discovery']
      },
      {
        id: 'pilot',
        name: 'Pilot Migration',
        type: 'migration',
        description: 'Migrate small test group to validate approach',
        estimatedDays: 7,
        dependencies: ['planning']
      },
      {
        id: 'validation',
        name: 'Pilot Validation',
        type: 'validation',
        description: 'Test migrated workloads, validate performance',
        estimatedDays: 3,
        dependencies: ['pilot']
      },
      {
        id: 'production',
        name: 'Production Migration',
        type: 'migration',
        description: 'Execute full migration in planned waves',
        estimatedDays: 10,
        dependencies: ['validation']
      },
      {
        id: 'final-validation',
        name: 'Final Validation & Cutover',
        type: 'validation',
        description: 'Final testing, DNS cutover, decommission old infrastructure',
        estimatedDays: 5,
        dependencies: ['production']
      }
    ]
  },
  {
    id: 'replatform-migration',
    name: 'Replatform Migration',
    description: 'Optimize workloads for cloud with minimal refactoring',
    category: 'migration',
    version: '1.0.0',
    isBuiltIn: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    estimatedDuration: 60,
    steps: [
      {
        id: 'discovery',
        name: 'Discovery & Assessment',
        type: 'assessment',
        description: 'Inventory workloads, identify optimization opportunities',
        estimatedDays: 12,
        dependencies: [],
        automated: true
      },
      {
        id: 'architecture',
        name: 'Architecture Design',
        type: 'planning',
        description: 'Design optimized cloud architecture',
        estimatedDays: 10,
        dependencies: ['discovery']
      },
      {
        id: 'optimization',
        name: 'Application Optimization',
        type: 'custom',
        description: 'Modify apps for cloud services (managed databases, containers, etc)',
        estimatedDays: 15,
        dependencies: ['architecture']
      },
      {
        id: 'pilot',
        name: 'Pilot Migration',
        type: 'migration',
        description: 'Migrate and test optimized pilot group',
        estimatedDays: 8,
        dependencies: ['optimization']
      },
      {
        id: 'validation',
        name: 'Performance Validation',
        type: 'validation',
        description: 'Validate performance improvements, cost optimization',
        estimatedDays: 5,
        dependencies: ['pilot']
      },
      {
        id: 'production',
        name: 'Production Migration',
        type: 'migration',
        description: 'Roll out optimized workloads to production',
        estimatedDays: 10,
        dependencies: ['validation']
      }
    ]
  }
];

export function WorkflowTemplateManager({
  templates: providedTemplates,
  onUseTemplate,
  onCreate,
  onUpdate,
  onDelete,
  onDuplicate,
  glass = 'medium'
}: WorkflowTemplateManagerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);

  // Combine built-in and user templates
  const allTemplates = useMemo(() => {
    return [...BUILT_IN_TEMPLATES, ...providedTemplates];
  }, [providedTemplates]);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allTemplates, selectedCategory, searchQuery]);

  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'migration', label: 'Migration' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsCreateModalOpen(true);
  };

  const handleEditTemplate = (template: WorkflowTemplate) => {
    if (template.isBuiltIn) {
      // Cannot edit built-in, duplicate instead
      onDuplicate?.(template);
      return;
    }
    setEditingTemplate(template);
    setIsCreateModalOpen(true);
  };

  const handleDeleteTemplate = (template: WorkflowTemplate) => {
    if (template.isBuiltIn) return; // Cannot delete built-in
    if (confirm(`Are you sure you want to delete "${template.name}"?`)) {
      onDelete?.(template.id);
    }
  };

  return (
    <div className="workflow-template-manager">
      {/* Header */}
      <div className="workflow-template-manager__header">
        <div>
          <h2>Workflow Templates</h2>
          <p>Pre-built and custom workflow templates for migration projects</p>
        </div>
        <PurpleGlassButton
          variant="primary"
          icon={<AddRegular />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </PurpleGlassButton>
      </div>

      {/* Filters */}
      <div className="workflow-template-manager__filters">
        <PurpleGlassInput
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          glass={glass}
          style={{ flex: 1 }}
        />
        <PurpleGlassDropdown
          options={categoryOptions}
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value as string)}
          glass={glass}
        />
      </div>

      {/* Template Grid */}
      <div className="workflow-template-manager__grid">
        {filteredTemplates.map(template => (
          <PurpleGlassCard
            key={template.id}
            variant="interactive"
            glass={glass !== 'none'}
            className="workflow-template-card"
          >
            <div className="workflow-template-card__header">
              <div>
                <h3>{template.name}</h3>
                {template.isBuiltIn && (
                  <span className="workflow-template-card__badge">Built-in</span>
                )}
              </div>
              <div className="workflow-template-card__actions">
                <PurpleGlassButton
                  variant="ghost"
                  size="small"
                  icon={<PlayRegular />}
                  onClick={() => onUseTemplate?.(template)}
                  title="Use this template"
                />
                <PurpleGlassButton
                  variant="ghost"
                  size="small"
                  icon={<CopyRegular />}
                  onClick={() => onDuplicate?.(template)}
                  title="Duplicate template"
                />
                {!template.isBuiltIn && (
                  <>
                    <PurpleGlassButton
                      variant="ghost"
                      size="small"
                      icon={<EditRegular />}
                      onClick={() => handleEditTemplate(template)}
                      title="Edit template"
                    />
                    <PurpleGlassButton
                      variant="ghost"
                      size="small"
                      icon={<DeleteRegular />}
                      onClick={() => handleDeleteTemplate(template)}
                      title="Delete template"
                    />
                  </>
                )}
              </div>
            </div>

            <p className="workflow-template-card__description">
              {template.description}
            </p>

            <div className="workflow-template-card__meta">
              <div className="workflow-template-card__stat">
                <DocumentRegular fontSize={16} />
                <span>{template.steps.length} steps</span>
              </div>
              <div className="workflow-template-card__stat">
                <span>{template.estimatedDuration} days</span>
              </div>
              <div className="workflow-template-card__category">
                {template.category}
              </div>
            </div>

            {/* Steps Preview */}
            <div className="workflow-template-card__steps">
              {template.steps.slice(0, 3).map((step, index) => (
                <div key={step.id} className="workflow-step-preview">
                  <span className="workflow-step-preview__number">{index + 1}</span>
                  <span className="workflow-step-preview__name">{step.name}</span>
                  <span className="workflow-step-preview__duration">{step.estimatedDays}d</span>
                </div>
              ))}
              {template.steps.length > 3 && (
                <div className="workflow-step-preview workflow-step-preview--more">
                  +{template.steps.length - 3} more steps
                </div>
              )}
            </div>
          </PurpleGlassCard>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="workflow-template-manager__empty">
          <p>No templates found matching your criteria</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isCreateModalOpen && (
        <TemplateEditorModal
          template={editingTemplate}
          onSave={(template) => {
            if (editingTemplate) {
              onUpdate?.(editingTemplate.id, template);
            } else {
              onCreate?.(template);
            }
            setIsCreateModalOpen(false);
          }}
          onCancel={() => setIsCreateModalOpen(false)}
          glass={glass}
        />
      )}
    </div>
  );
}

interface TemplateEditorModalProps {
  template: WorkflowTemplate | null;
  onSave: (template: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  glass?: 'none' | 'light' | 'medium' | 'heavy';
}

function TemplateEditorModal({ template, onSave, onCancel, glass = 'medium' }: TemplateEditorModalProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [category, setCategory] = useState<string>(template?.category || 'custom');

  const categoryOptions: DropdownOption[] = [
    { value: 'migration', label: 'Migration' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'custom', label: 'Custom' }
  ];

  const handleSave = () => {
    if (!name || !description) return;

    onSave({
      name,
      description,
      category: category as WorkflowTemplate['category'],
      steps: template?.steps || [],
      estimatedDuration: template?.estimatedDuration || 0,
      isBuiltIn: false,
      version: '1.0.0'
    });
  };

  return (
    <PurpleGlassModal
      isOpen
      onClose={onCancel}
      title={template ? 'Edit Template' : 'Create Template'}
      size="large"
      glass={glass}
      footer={
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <PurpleGlassButton variant="secondary" onClick={onCancel}>
            Cancel
          </PurpleGlassButton>
          <PurpleGlassButton
            variant="primary"
            icon={<SaveRegular />}
            onClick={handleSave}
            disabled={!name || !description}
          >
            Save Template
          </PurpleGlassButton>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <PurpleGlassInput
          label="Template Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          glass={glass}
        />
        <PurpleGlassTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          glass={glass}
          rows={3}
        />
        <PurpleGlassDropdown
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={(value) => setCategory(value as string)}
          glass={glass}
        />
        <p style={{ fontSize: '14px', color: 'var(--colorNeutralForeground2)' }}>
          Note: Step configuration will be available in the next version
        </p>
      </div>
    </PurpleGlassModal>
  );
}

export default WorkflowTemplateManager;
