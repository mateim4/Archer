import React, { useState } from 'react';
import { PurpleGlassCard, PurpleGlassCheckbox, PurpleGlassButton } from '@/components/ui';
import { Badge, Spinner, Tooltip } from '@fluentui/react-components';
import { 
  ReOrderRegular,
  InfoRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
} from '@fluentui/react-icons';
import { HLDSection } from '@/hooks/useHLDSections';

// ============================================================================
// Section Manager Component
// ============================================================================
// Purpose: Manage HLD document sections (enable/disable, reorder)
// Features: Drag-and-drop reordering, toggle sections, dependency indicators
// ============================================================================

interface SectionManagerProps {
  sections: HLDSection[];
  onToggle: (sectionId: string, enabled: boolean) => Promise<void>;
  onReorder: (sectionIds: string[]) => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
}

export function SectionManager({ 
  sections, 
  onToggle, 
  onReorder, 
  loading, 
  disabled 
}: SectionManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Reorder sections array
    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(dropIndex, 0, draggedSection);

    setSaving(true);
    try {
      await onReorder(newSections.map(s => s.section_id));
    } catch (error) {
      console.error('Failed to reorder sections:', error);
    } finally {
      setSaving(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle toggle with error handling
  const handleToggle = async (sectionId: string, enabled: boolean, section: HLDSection) => {
    // Check if section is required
    if (section.required && !enabled) {
      alert('This section is required and cannot be disabled.');
      return;
    }

    // Check dependencies
    if (enabled && section.depends_on.length > 0) {
      const missingDeps = section.depends_on.filter(depId => {
        const depSection = sections.find(s => s.section_id === depId);
        return !depSection || !depSection.enabled;
      });
      
      if (missingDeps.length > 0) {
        const depNames = missingDeps
          .map(depId => sections.find(s => s.section_id === depId)?.display_name || depId)
          .join(', ');
        alert(`This section depends on: ${depNames}. Please enable those sections first.`);
        return;
      }
    }

    try {
      await onToggle(sectionId, enabled);
    } catch (error) {
      console.error('Failed to toggle section:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spinner label="Loading sections..." />
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <PurpleGlassCard glass variant="subtle">
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h3 style={{ marginBottom: '8px' }}>No Sections Configured</h3>
          <p style={{ color: 'var(--colorNeutralForeground3)' }}>
            Please ensure section definitions are loaded in the database.
          </p>
        </div>
      </PurpleGlassCard>
    );
  }

  const enabledCount = sections.filter(s => s.enabled).length;
  const totalCount = sections.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Summary */}
      <PurpleGlassCard glass variant="elevated">
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ marginBottom: '8px' }}>Document Sections</h3>
              <p style={{ color: 'var(--colorNeutralForeground3)', marginBottom: '0' }}>
                {enabledCount} of {totalCount} sections enabled
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <ReOrderRegular style={{ fontSize: '20px', color: 'var(--colorNeutralForeground3)' }} />
              <span style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)' }}>
                Drag to reorder
              </span>
            </div>
          </div>
        </div>
      </PurpleGlassCard>

      {/* Sections List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sections.map((section, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <PurpleGlassCard
              key={section.section_id}
              variant={section.enabled ? 'elevated' : 'outlined'}
              draggable={!disabled && !section.required}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                opacity: isDragging ? 0.5 : 1,
                cursor: disabled || section.required ? 'default' : 'grab',
                borderTop: isDragOver ? '3px solid var(--colorBrandBackground)' : undefined,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {/* Drag Handle */}
                <div style={{ paddingTop: '4px', color: 'var(--colorNeutralForeground3)', cursor: 'grab' }}>
                  <ReOrderRegular />
                </div>

                {/* Checkbox */}
                <div style={{ paddingTop: '2px' }}>
                  <PurpleGlassCheckbox
                    checked={section.enabled}
                    onChange={(e) => handleToggle(section.section_id, e.target.checked, section)}
                    disabled={disabled || saving}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong>{section.display_name}</strong>
                    
                    {section.required && (
                      <Badge appearance="filled" color="danger">
                        Required
                      </Badge>
                    )}
                    
                    {section.enabled ? (
                      <CheckmarkCircleRegular style={{ color: 'var(--colorPaletteGreenForeground1)' }} />
                    ) : (
                      <DismissCircleRegular style={{ color: 'var(--colorNeutralForeground3)' }} />
                    )}
                  </div>

                  <p style={{ 
                    fontSize: '13px', 
                    color: 'var(--colorNeutralForeground3)', 
                    margin: '4px 0 8px 0' 
                  }}>
                    {section.description}
                  </p>

                  {/* Dependencies */}
                  {section.depends_on.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Tooltip 
                        content={`Depends on: ${section.depends_on.map(depId => {
                          const depSection = sections.find(s => s.section_id === depId);
                          return depSection?.display_name || depId;
                        }).join(', ')}`}
                        relationship="description"
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          fontSize: '12px',
                          color: 'var(--colorNeutralForeground3)',
                          cursor: 'help'
                        }}>
                          <InfoRegular />
                          <span>Dependencies: {section.depends_on.length}</span>
                        </div>
                      </Tooltip>
                    </div>
                  )}

                  {/* Order Index (for debugging) */}
                  <div style={{ 
                    fontSize: '11px', 
                    color: 'var(--colorNeutralForeground4)', 
                    marginTop: '4px' 
                  }}>
                    Order: {section.order_index + 1}
                  </div>
                </div>
              </div>
            </PurpleGlassCard>
          );
        })}
      </div>

      {/* Info Card */}
      <PurpleGlassCard glass variant="subtle">
        <div style={{ padding: '16px' }}>
          <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <InfoRegular />
            Section Management
          </h4>
          <ul style={{ 
            margin: '8px 0 0 0', 
            paddingLeft: '20px', 
            fontSize: '13px', 
            color: 'var(--colorNeutralForeground3)' 
          }}>
            <li>Toggle checkboxes to enable/disable sections in the final document</li>
            <li>Drag sections to reorder them (required sections cannot be moved)</li>
            <li>Required sections are always enabled</li>
            <li>Some sections have dependencies and require other sections to be enabled first</li>
            <li>Changes are saved automatically</li>
          </ul>
        </div>
      </PurpleGlassCard>
    </div>
  );
}
