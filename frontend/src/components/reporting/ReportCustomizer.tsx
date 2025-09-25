import React, { useState, useCallback, useRef } from 'react';
import {
  Card,
  Button,
  Text,
  Title2,
  Title3,
  Input,
  Textarea,
  Checkbox,
  Dropdown,
  Option,
  Divider,
  Badge,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { standardCardStyle, standardButtonStyle, StandardDropdown, DESIGN_TOKENS } from '../DesignSystem';
import { ReportSection, ReportTemplate, DragDropSection } from './ReportFramework';

// =============================================================================
// REPORT CUSTOMIZER COMPONENT
// =============================================================================

interface ReportCustomizerProps {
  template: ReportTemplate;
  onSave: (customizedTemplate: ReportTemplate) => void;
  onCancel: () => void;
  className?: string;
}

// Using DragDropSection from ReportFramework

export const ReportCustomizer: React.FC<ReportCustomizerProps> = ({
  template,
  onSave,
  onCancel,
  className = ""
}) => {
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate & { sections: DragDropSection[] }>({
    ...template,
    sections: template.sections.map((section, index) => ({
      ...section,
      dragId: `section-${index}`,
    })) as DragDropSection[]
  });
  
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Handle drag and drop reordering
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

  const items: DragDropSection[] = Array.from(editingTemplate.sections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order values
  const reorderedSections: DragDropSection[] = items.map((section, index) => ({
      ...section,
      order: index + 1,
    }));

    setEditingTemplate(prev => ({
      ...prev,
      sections: reorderedSections
    }));
    setIsDirty(true);
  }, [editingTemplate.sections]);

  // Update template metadata
  const updateTemplateMetadata = (field: string, value: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      [field]: value
    }));
    setIsDirty(true);
  };

  // Update section properties
  const updateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    setEditingTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId
          ? ({ ...section, ...updates } as DragDropSection)
          : section
      ) as DragDropSection[]
    }));
    setIsDirty(true);
  };

  // Remove section
  const removeSection = (sectionId: string) => {
    setEditingTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId) as DragDropSection[]
    }));
    setIsDirty(true);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  // Add new section
  const addNewSection = () => {
    const newSection: DragDropSection = {
      id: `custom-section-${Date.now()}`,
      dragId: `section-${Date.now()}`,
      title: 'New Section',
      description: 'Custom section description',
      data_variables: [],
      display_format: 'summary',
      order: editingTemplate.sections.length + 1,
      is_required: false,
    };

    setEditingTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    setSelectedSectionId(newSection.id);
    setIsDirty(true);
  };

  // Validate template before saving
  const validateTemplate = (): boolean => {
    const errors: string[] = [];

    if (!editingTemplate.name.trim()) {
      errors.push('Template name is required');
    }

    if (!editingTemplate.description.trim()) {
      errors.push('Template description is required');
    }

    if (editingTemplate.sections.length === 0) {
      errors.push('At least one section is required');
    }

    const requiredSections = editingTemplate.sections.filter(s => s.is_required);
    if (requiredSections.length === 0) {
      errors.push('At least one required section must be present');
    }

    // Check for duplicate section IDs
    const sectionIds = editingTemplate.sections.map(s => s.id);
    const duplicateIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      errors.push(`Duplicate section IDs found: ${duplicateIds.join(', ')}`);
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Save customized template
  const handleSave = () => {
    if (validateTemplate()) {
      const cleanedTemplate: ReportTemplate = {
        ...editingTemplate,
        sections: (editingTemplate.sections as DragDropSection[]).map(({ dragId, ...section }) => ({ ...section }))
      };
      onSave(cleanedTemplate);
    }
  };

  const getSelectedSection = (): DragDropSection | null => {
    return (editingTemplate.sections.find(s => s.id === selectedSectionId) as DragDropSection) || null;
  };

  const getDisplayFormatOptions = () => [
    { value: 'table', label: 'Table' },
    { value: 'cards', label: 'Cards' },
    { value: 'summary', label: 'Summary' },
    { value: 'chart', label: 'Chart' },
  ];

  return (
    <div className={`lcm-report-customizer ${className}`} style={{
      display: 'grid',
      gridTemplateColumns: '1fr 400px',
      gap: '24px',
      padding: '24px',
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* Main Editing Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Template Metadata */}
        <Card style={standardCardStyle}>
          <Title2 style={{ 
            color: DESIGN_TOKENS.colors.primary,
            marginBottom: '16px' 
          }}>
            Template Settings
          </Title2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            marginBottom: '16px' 
          }}>
            <div>
              <Text style={{ 
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                marginBottom: '8px',
                display: 'block' 
              }}>
                Template Name
              </Text>
              <Input
                value={editingTemplate.name}
                onChange={(e, data) => updateTemplateMetadata('name', data.value)}
                className="lcm-input"
              />
            </div>
            
            <div>
              <Text style={{ 
                fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
                marginBottom: '8px',
                display: 'block' 
              }}>
                Template ID
              </Text>
              <Input
                value={editingTemplate.id}
                onChange={(e, data) => updateTemplateMetadata('id', data.value)}
                className="lcm-input"
              />
            </div>
          </div>
          
          <div>
            <Text style={{ 
              fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
              marginBottom: '8px',
              display: 'block' 
            }}>
              Description
            </Text>
            <Textarea
              value={editingTemplate.description}
              onChange={(e, data) => updateTemplateMetadata('description', data.value)}
              rows={3}
              className="lcm-input"
            />
          </div>
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <MessageBar intent="error">
            <MessageBarBody>
              <strong>Validation Errors:</strong>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Sections List with Drag and Drop */}
        <Card style={standardCardStyle}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px' 
          }}>
            <Title2 style={{ color: DESIGN_TOKENS.colors.primary }}>
              Report Sections
            </Title2>
            <Button
              appearance="primary"
              onClick={addNewSection}
              style={{
                ...standardButtonStyle,
                fontSize: DESIGN_TOKENS.typography.fontSize.sm,
              }}
            >
              Add Section
            </Button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  {(editingTemplate.sections as DragDropSection[]).map((section, index) => (
                    <Draggable
                      key={section.dragId}
                      draggableId={section.dragId}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                        >
                          <SectionCard
                            section={section}
                            isSelected={selectedSectionId === section.id}
                            onSelect={() => setSelectedSectionId(section.id)}
                            onRemove={() => removeSection(section.id)}
                            dragHandleProps={provided.dragHandleProps}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>
      </div>

      {/* Section Properties Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section Editor */}
        {getSelectedSection() ? (
          <SectionEditor
            section={getSelectedSection()!}
            onUpdate={(updates) => updateSection(selectedSectionId!, updates)}
            displayFormatOptions={getDisplayFormatOptions()}
          />
        ) : (
          <Card style={{
            ...standardCardStyle,
            padding: '48px 24px',
            textAlign: 'center',
          }}>
            <Text style={{ color: DESIGN_TOKENS.colors.text.muted }}>
              Select a section to edit its properties
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <Card style={standardCardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={!isDirty}
              style={standardButtonStyle}
            >
              Save Template
            </Button>
            <Button
              appearance="secondary"
              onClick={onCancel}
              style={{
                ...standardButtonStyle,
                background: 'transparent',
                border: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
                color: DESIGN_TOKENS.colors.text.primary,
              }}
            >
              Cancel Changes
            </Button>
            {isDirty && (
              <Text style={{ 
                fontSize: DESIGN_TOKENS.typography.fontSize.xs,
                color: DESIGN_TOKENS.colors.text.muted,
                textAlign: 'center' 
              }}>
                * You have unsaved changes
              </Text>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

// =============================================================================
// SECTION CARD COMPONENT
// =============================================================================

interface SectionCardProps {
  section: DragDropSection;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  dragHandleProps?: any;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isSelected,
  onSelect,
  onRemove,
  dragHandleProps
}) => {
  return (
    <Card
      style={{
        ...standardCardStyle,
        border: isSelected 
          ? `2px solid ${DESIGN_TOKENS.colors.primary}` 
          : `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={onSelect}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        gap: '12px' 
      }}>
        {/* Drag Handle */}
        <div
          {...dragHandleProps}
          style={{
            cursor: 'grab',
            padding: '8px',
            color: DESIGN_TOKENS.colors.text.muted,
            fontSize: '16px',
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          ⋮⋮
        </div>

        {/* Section Info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Title3 style={{ 
              color: DESIGN_TOKENS.colors.primary,
              fontSize: DESIGN_TOKENS.typography.fontSize.base 
            }}>
              {section.title}
            </Title3>
            {section.is_required && (
              <Badge appearance="filled" color="danger" size="small">
                Required
              </Badge>
            )}
            <Badge appearance="outline" size="small">
              {section.display_format}
            </Badge>
          </div>
          <Text style={{ 
            color: DESIGN_TOKENS.colors.text.secondary,
            fontSize: DESIGN_TOKENS.typography.fontSize.sm 
          }}>
            {section.description}
          </Text>
          <Text style={{ 
            color: DESIGN_TOKENS.colors.text.muted,
            fontSize: DESIGN_TOKENS.typography.fontSize.xs,
            marginTop: '4px' 
          }}>
            {section.data_variables.length} variables • Order: {section.order}
          </Text>
        </div>

        {/* Remove Button */}
        <Button
          appearance="subtle"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            minWidth: 'auto',
            padding: '8px',
            color: DESIGN_TOKENS.colors.text.muted,
          }}
        >
          ✕
        </Button>
      </div>
    </Card>
  );
};

// =============================================================================
// SECTION EDITOR COMPONENT
// =============================================================================

interface SectionEditorProps {
  section: DragDropSection;
  onUpdate: (updates: Partial<ReportSection>) => void;
  displayFormatOptions: { value: string; label: string }[];
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  onUpdate,
  displayFormatOptions
}) => {
  const [dataVariablesText, setDataVariablesText] = useState(
    section.data_variables.join(', ')
  );

  const handleDataVariablesChange = (value: string) => {
    setDataVariablesText(value);
    const variables = value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    onUpdate({ data_variables: variables });
  };

  return (
    <Card style={standardCardStyle}>
      <Title2 style={{ 
        color: DESIGN_TOKENS.colors.primary,
        marginBottom: '16px' 
      }}>
        Section Properties
      </Title2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Basic Properties */}
        <div>
          <Text style={{ 
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            marginBottom: '8px',
            display: 'block' 
          }}>
            Section Title
          </Text>
          <Input
            value={section.title}
            onChange={(e, data) => onUpdate({ title: data.value })}
            className="lcm-input"
          />
        </div>

        <div>
          <Text style={{ 
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            marginBottom: '8px',
            display: 'block' 
          }}>
            Description
          </Text>
          <Textarea
            value={section.description}
            onChange={(e, data) => onUpdate({ description: data.value })}
            rows={2}
            className="lcm-input"
          />
        </div>

        {/* Display Format */}
        <div>
          <Text style={{ 
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            marginBottom: '8px',
            display: 'block' 
          }}>
            Display Format
          </Text>
          <StandardDropdown
            value={section.display_format}
            onChange={(value) => onUpdate({ display_format: value as any })}
            options={displayFormatOptions}
          />
        </div>

        {/* Data Variables */}
        <div>
          <Text style={{ 
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            marginBottom: '8px',
            display: 'block' 
          }}>
            Data Variables (comma-separated)
          </Text>
          <Textarea
            value={dataVariablesText}
            onChange={(e, data) => handleDataVariablesChange(data.value)}
            placeholder="total_vms, total_hosts, cluster_count"
            rows={3}
            className="lcm-input"
          />
        </div>

        {/* Order */}
        <div>
          <Text style={{ 
            fontWeight: DESIGN_TOKENS.typography.fontWeight.medium,
            marginBottom: '8px',
            display: 'block' 
          }}>
            Order
          </Text>
          <Input
            type="number"
            value={section.order.toString()}
            onChange={(e, data) => onUpdate({ order: parseInt(data.value) || 1 })}
            className="lcm-input"
          />
        </div>

        {/* Checkboxes */}
        <div>
          <Checkbox
            checked={section.is_required}
            onChange={(e, data) => onUpdate({ is_required: !!data.checked })}
            label="Required Section"
          />
        </div>

        <Divider />

        {/* Section Preview Info */}
        <div style={{
          padding: '12px',
          background: DESIGN_TOKENS.colors.primaryLight,
          borderRadius: DESIGN_TOKENS.borderRadius.sm,
        }}>
          <Text style={{ 
            fontSize: DESIGN_TOKENS.typography.fontSize.xs,
            color: DESIGN_TOKENS.colors.text.secondary 
          }}>
            <strong>Preview:</strong> This section will display {section.data_variables.length} data variables 
            in {section.display_format} format. {section.is_required ? 'Required section.' : 'Optional section.'}
          </Text>
        </div>
      </div>
    </Card>
  );
};