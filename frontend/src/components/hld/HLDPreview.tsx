// ============================================================================
// LCMDesigner - HLD Preview Component
// ============================================================================
// Purpose: Preview HLD document structure and export to Word
// Features: Section list, variable summary, export button, loading states
// Version: 1.0
// Date: October 24, 2025
// ============================================================================

import React, { useState } from 'react';
import {
  PurpleGlassCard,
  PurpleGlassButton,
} from '@/components/ui';
import {
  DocumentRegular,
  DocumentCheckmarkRegular,
  WarningRegular,
  ArrowDownloadRegular,
} from '@fluentui/react-icons';

// ============================================================================
// TYPES
// ============================================================================

interface HLDVariable {
  variable_name: string;
  display_name: string;
  variable_value: any;
  variable_type: string;
  section: string;
  is_required: boolean;
}

interface HLDProject {
  id: string;
  project_id: string;
  project_name: string;
  template_id?: string;
  section_order?: string[];
  metadata?: Record<string, any>;
}

interface HLDPreviewProps {
  projectId: string;
  variables: HLDVariable[];
  hldProject?: HLDProject;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const HLDPreview: React.FC<HLDPreviewProps> = ({
  projectId,
  variables,
  hldProject,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  // Calculate statistics
  const totalVariables = variables.length;
  const filledVariables = variables.filter(
    (v) => v.variable_value !== null && v.variable_value !== undefined && v.variable_value !== ''
  ).length;
  const requiredVariables = variables.filter((v) => v.is_required).length;
  const requiredFilled = variables.filter(
    (v) => v.is_required && v.variable_value !== null && v.variable_value !== undefined && v.variable_value !== ''
  ).length;

  const percentComplete = totalVariables > 0 ? Math.round((filledVariables / totalVariables) * 100) : 0;
  const allRequiredFilled = requiredFilled === requiredVariables;

  // Get sections from section_order or use defaults
  const sections = hldProject?.section_order || [
    'executive_summary',
    'infrastructure_overview',
    'compute_design',
    'storage_design',
    'network_design',
    'migration_strategy',
  ];

  // Group variables by section
  const variablesBySection = sections.map((sectionId) => {
    const sectionVars = variables.filter((v) => v.section === sectionId);
    const sectionFilled = sectionVars.filter(
      (v) => v.variable_value !== null && v.variable_value !== undefined && v.variable_value !== ''
    ).length;
    
    return {
      id: sectionId,
      name: formatSectionName(sectionId),
      totalVariables: sectionVars.length,
      filledVariables: sectionFilled,
      percentComplete: sectionVars.length > 0 ? Math.round((sectionFilled / sectionVars.length) * 100) : 0,
    };
  });

  // Handle export to Word
  const handleExport = async () => {
    if (!allRequiredFilled) {
      alert(`Please fill in all required variables before exporting (${requiredFilled}/${requiredVariables} complete)`);
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/v1/hld/projects/${projectId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${hldProject?.project_name || 'HLD'}-${new Date().toISOString().split('T')[0]}.docx`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`HLD document exported as ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert(error instanceof Error ? error.message : 'Failed to export HLD document');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Card */}
      <PurpleGlassCard
        header="Document Preview"
        variant="elevated"
        glass
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Overall Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {allRequiredFilled ? (
              <DocumentCheckmarkRegular style={{ fontSize: 24, color: 'var(--colorPaletteGreenForeground1)' }} />
            ) : (
              <WarningRegular style={{ fontSize: 24, color: 'var(--colorPaletteYellowForeground1)' }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: '16px', 
                fontWeight: 600,
                marginBottom: '4px',
              }}>
                {allRequiredFilled ? 'Ready to Export' : 'Missing Required Fields'}
              </div>
              <div style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontSize: '14px', 
                color: 'var(--colorNeutralForeground2)',
              }}>
                {filledVariables} of {totalVariables} variables filled ({percentComplete}%)
              </div>
              {!allRequiredFilled && (
                <div style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontSize: '14px', 
                  color: 'var(--colorPaletteYellowForeground1)',
                  marginTop: '4px',
                }}>
                  Required: {requiredFilled} of {requiredVariables} complete
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: 'var(--colorNeutralBackground3)',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${percentComplete}%`,
              height: '100%',
              backgroundColor: allRequiredFilled 
                ? 'var(--colorPaletteGreenBackground3)' 
                : 'var(--colorPaletteYellowBackground3)',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {/* Export Button */}
          <div style={{ marginTop: '8px' }}>
            <PurpleGlassButton
              variant="primary"
              size="large"
              glass
              icon={<ArrowDownloadRegular />}
              onClick={handleExport}
              loading={isExporting}
              disabled={!allRequiredFilled}
              style={{ width: '100%' }}
            >
              {isExporting ? 'Exporting...' : 'Export to Word'}
            </PurpleGlassButton>
          </div>
        </div>
      </PurpleGlassCard>

      {/* Sections List */}
      <PurpleGlassCard
        header="Document Sections"
        variant="default"
        glass
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {variablesBySection.map((section, index) => (
            <div
              key={section.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                backgroundColor: 'var(--colorNeutralBackground1)',
                borderRadius: '8px',
                border: '1px solid var(--colorNeutralStroke2)',
              }}
            >
              {/* Section Number */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--colorBrandBackground)',
                color: 'var(--colorNeutralForegroundOnBrand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {index + 1}
              </div>

              {/* Section Info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginBottom: '4px',
                }}>
                  {section.name}
                </div>
                <div style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontSize: '12px',
                  color: 'var(--colorNeutralForeground2)',
                }}>
                  {section.filledVariables} of {section.totalVariables} variables ({section.percentComplete}%)
                </div>
              </div>

              {/* Section Progress Indicator */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: `3px solid ${section.percentComplete === 100 ? 'var(--colorPaletteGreenForeground1)' : 'var(--colorNeutralStroke2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Poppins, sans-serif',
                fontSize: '12px',
                fontWeight: 600,
                color: section.percentComplete === 100 ? 'var(--colorPaletteGreenForeground1)' : 'var(--colorNeutralForeground2)',
                flexShrink: 0,
              }}>
                {section.percentComplete}%
              </div>
            </div>
          ))}
        </div>
      </PurpleGlassCard>

      {/* Export Info */}
      <PurpleGlassCard
        variant="subtle"
        glass
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <DocumentRegular style={{ fontSize: 20, color: 'var(--colorNeutralForeground2)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '4px',
            }}>
              About the Export
            </div>
            <div style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: '13px',
              color: 'var(--colorNeutralForeground2)',
              lineHeight: '1.5',
            }}>
              The exported Word document will include a title page, table of contents, and all enabled sections with your configured variables. 
              You can further customize the document in Microsoft Word after downloading.
            </div>
          </div>
        </div>
      </PurpleGlassCard>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatSectionName(sectionId: string): string {
  return sectionId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
