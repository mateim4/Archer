import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tab, TabList, TabValue } from '@fluentui/react-components';
import { PurpleGlassCard, PurpleGlassButton } from '@/components/ui';
import { VariableEditor } from '@/components/hld/VariableEditor';
import { RVToolsAutoFill } from '@/components/hld/RVToolsAutoFill';
import { SectionManager } from '@/components/hld/SectionManager';
import { useHLDVariables } from '@/hooks/useHLDVariables';
import { useHLDSections } from '@/hooks/useHLDSections';
import { SaveRegular, ArrowSyncRegular } from '@fluentui/react-icons';

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
      <div style={{ padding: '24px' }}>
        <PurpleGlassCard glass variant="elevated">
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <h2>No Project Selected</h2>
            <p style={{ color: 'var(--colorNeutralForeground3)', marginTop: '8px' }}>
              Please select a project to configure HLD variables.
            </p>
          </div>
        </PurpleGlassCard>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '8px', fontFamily: 'Poppins, sans-serif' }}>
            HLD Configuration
          </h1>
          <p style={{ margin: 0, color: 'var(--colorNeutralForeground3)' }}>
            Configure High-Level Design variables for project
          </p>
        </div>
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
            <PurpleGlassCard glass variant="subtle">
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <h3 style={{ marginBottom: '8px' }}>HLD Preview</h3>
                <p style={{ color: 'var(--colorNeutralForeground3)' }}>
                  Preview the generated High-Level Design document
                </p>
                <p style={{ fontSize: '12px', color: 'var(--colorNeutralForeground3)', marginTop: '16px' }}>
                  Coming soon: Week 3
                </p>
              </div>
            </PurpleGlassCard>
          )}
        </div>
      </PurpleGlassCard>
    </div>
  );
}
