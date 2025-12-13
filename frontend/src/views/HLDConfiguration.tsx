import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab, TabList, TabValue } from '@fluentui/react-components';
import { PurpleGlassCard, PurpleGlassButton, PageHeader, PurpleGlassEmptyState } from '@/components/ui';
import { VariableEditor } from '@/components/hld/VariableEditor';
import { RVToolsAutoFill } from '@/components/hld/RVToolsAutoFill';
import { SectionManager } from '@/components/hld/SectionManager';
import { HLDPreview } from '@/components/hld/HLDPreview';
import { useHLDVariables } from '@/hooks/useHLDVariables';
import { useHLDSections } from '@/hooks/useHLDSections';
import { SaveRegular, ArrowSyncRegular, DocumentRegular, ErrorCircleRegular } from '@fluentui/react-icons';

// ============================================================================
// HLD Configuration View
// ============================================================================
// Purpose: Main view for configuring HLD variables and settings
// Features: Variable editor, RVTools auto-fill, section management, preview
// ============================================================================

export function HLDConfiguration() {
  const { projectId } = useParams<{ projectId: string }>();
  const {
    variables,
    loading,
    error,
    updateVariable,
    refreshVariables,
    hasChanges,
  } = useHLDVariables(projectId || '');
  
  const {
    sections,
    loading: sectionsLoading,
    toggleSection,
    reorderSections,
  } = useHLDSections(projectId || '');

  const [selectedTab, setSelectedTab] = useState<TabValue>('variables');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Variables are already saved on change, this is just for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      alert('All changes have been saved!');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await refreshVariables();
  };

  if (!projectId) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PurpleGlassCard glass>
          <PurpleGlassEmptyState
            icon={<ErrorCircleRegular />}
            title="No Project Selected"
            description="Please select a project to configure HLD variables."
          />
        </PurpleGlassCard>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        icon={<DocumentRegular />}
        title="HLD Configuration"
        subtitle="Configure High-Level Design variables for project"
        actions={
          <div style={{ display: 'flex', gap: '12px' }}>
          <PurpleGlassButton
            variant="secondary"
            icon={<ArrowSyncRegular />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </PurpleGlassButton>
          {hasChanges && (
            <PurpleGlassButton
              variant="primary"
              icon={<SaveRegular />}
              onClick={handleSave}
              loading={saving}
            >
              Save All
            </PurpleGlassButton>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <PurpleGlassCard variant="outlined" style={{ marginBottom: '24px', borderColor: 'var(--colorPaletteRedBorder1)' }}>
          <div style={{ padding: '16px', color: 'var(--colorPaletteRedForeground1)' }}>
            <strong>Error:</strong> {error}
          </div>
        </PurpleGlassCard>
      )}

      {/* Main Content Card */}
      <PurpleGlassCard glass variant="elevated">
        {/* Tabs */}
        <TabList
          selectedValue={selectedTab}
          onTabSelect={(_, data) => setSelectedTab(data.value)}
          style={{ padding: '16px 16px 0 16px', borderBottom: '1px solid var(--colorNeutralStroke2)' }}
        >
          <Tab value="variables">Variables</Tab>
          <Tab value="rvtools">RVTools Auto-Fill</Tab>
          <Tab value="sections">Section Management</Tab>
          <Tab value="preview">Preview</Tab>
        </TabList>

        {/* Tab Content */}
        <div style={{ padding: '24px' }}>
          {selectedTab === 'variables' && (
            <VariableEditor
              variables={variables}
              onUpdate={updateVariable}
              loading={loading}
            />
          )}

          {selectedTab === 'rvtools' && (
            <RVToolsAutoFill 
              projectId={projectId}
              onApply={refreshVariables}
            />
          )}

          {selectedTab === 'sections' && (
            <SectionManager
              sections={sections}
              onToggle={toggleSection}
              onReorder={reorderSections}
              loading={sectionsLoading}
            />
          )}

          {selectedTab === 'preview' && (
            <HLDPreview
              projectId={projectId}
              variables={Object.values(variables)
                .flat()
                .map(({ definition, value }) => ({
                  variable_name: definition.variable_name,
                  display_name: definition.display_name,
                  variable_value: value?.variable_value || null,
                  variable_type: definition.variable_type,
                  section: definition.section_id,
                  is_required: definition.validation.required,
                }))}
              hldProject={{
                id: '',
                project_id: projectId,
                project_name: `Project ${projectId}`,
                section_order: sections.map(s => s.section_id),
              }}
            />
          )}
        </div>
      </PurpleGlassCard>
    </div>
  );
}
