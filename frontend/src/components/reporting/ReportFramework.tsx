import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Text,
  Title1,
  Title2,
  Title3,
  Divider,
  Spinner,
  Badge,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  createTableColumn,
  TableColumnDefinition,
} from '@fluentui/react-components';
import { standardCardStyle, standardButtonStyle, DESIGN_TOKENS } from '../DesignSystem';

// =============================================================================
// REPORT FRAMEWORK TYPES
// =============================================================================

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  data_variables: string[];
  display_format: 'table' | 'chart' | 'cards' | 'summary';
  order: number;
  is_required: boolean;
  subsections?: ReportSection[];
}

// Extended type used by the customizer for drag-and-drop
export interface DragDropSection extends ReportSection {
  dragId: string;
}

export interface ReportData {
  variables: { [key: string]: any };
  metadata: {
    generated_at: string;
    data_source: string;
    total_records: number;
    confidence_level: number;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  brand_config: {
    primary_color?: string;
    logo_url?: string;
    company_name?: string;
  };
}

interface ReportFrameworkProps {
  template: ReportTemplate;
  data: ReportData;
  onExport?: (format: 'html' | 'pdf') => void;
  onCustomize?: () => void;
  className?: string;
}

// =============================================================================
// MAIN REPORT FRAMEWORK COMPONENT
// =============================================================================

export const ReportFramework: React.FC<ReportFrameworkProps> = ({
  template,
  data,
  onExport,
  onCustomize,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleExport = async (format: 'html' | 'pdf') => {
    setIsLoading(true);
    try {
      if (onExport) {
        await onExport(format);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`lcm-report-framework ${className}`}>
      {/* Report Header */}
      <Card style={standardCardStyle}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          marginBottom: '24px' 
        }}>
          <div>
            <Title1 style={{ 
              color: DESIGN_TOKENS.colors.primary,
              marginBottom: '8px' 
            }}>
              {template.name}
            </Title1>
            <Text style={{ 
              color: DESIGN_TOKENS.colors.text.secondary,
              marginBottom: '16px' 
            }}>
              {template.description}
            </Text>
            <ReportMetadata metadata={data.metadata} />
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {onCustomize && (
              <Button
                appearance="secondary"
                onClick={onCustomize}
                style={{
                  ...standardButtonStyle,
                  background: 'transparent',
                  border: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
                  color: DESIGN_TOKENS.colors.text.primary,
                }}
              >
                Customize Report
              </Button>
            )}
            <Button
              appearance="primary"
              onClick={() => handleExport('html')}
              disabled={isLoading}
              style={standardButtonStyle}
            >
              {isLoading ? <Spinner size="tiny" /> : 'Export HTML'}
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleExport('pdf')}
              disabled={isLoading}
              style={standardButtonStyle}
            >
              {isLoading ? <Spinner size="tiny" /> : 'Export PDF'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Report Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
        {template.sections
          .sort((a, b) => a.order - b.order)
          .map(section => (
            <ReportSectionComponent
              key={section.id}
              section={section}
              data={data}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
      </div>
    </div>
  );
};

// =============================================================================
// REPORT SECTION COMPONENT
// =============================================================================

interface ReportSectionProps {
  section: ReportSection;
  data: ReportData;
  isExpanded: boolean;
  onToggle: () => void;
  level?: number;
}

const ReportSectionComponent: React.FC<ReportSectionProps> = ({
  section,
  data,
  isExpanded,
  onToggle,
  level = 0
}) => {
  const sectionData = section.data_variables.reduce((acc, variable) => {
    acc[variable] = data.variables[variable];
    return acc;
  }, {} as { [key: string]: any });

  const hasData = Object.values(sectionData).some(value => 
    value !== undefined && value !== null && value !== ''
  );

  const TitleComponent = level === 0 ? Title2 : Title3;

  return (
    <Card style={{
      ...standardCardStyle,
      marginLeft: `${level * 24}px`,
      opacity: hasData ? 1 : 0.7,
    }}>
      {/* Section Header */}
      <div 
        onClick={onToggle}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          padding: '8px 0',
        }}
      >
        <div>
          <TitleComponent style={{ 
            color: DESIGN_TOKENS.colors.primary,
            marginBottom: '4px' 
          }}>
            {section.title}
            {section.is_required && (
              <Badge 
                appearance="filled" 
                color="danger" 
                style={{ marginLeft: '8px' }}
              >
                Required
              </Badge>
            )}
          </TitleComponent>
          <Text style={{ color: DESIGN_TOKENS.colors.text.secondary }}>
            {section.description}
          </Text>
        </div>
        
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease',
          color: DESIGN_TOKENS.colors.primary,
          fontSize: '18px',
        }}>
          ▼
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <>
          <Divider style={{ margin: '16px 0' }} />
          
          {hasData ? (
            <ReportSectionContent 
              section={section} 
              sectionData={sectionData} 
            />
          ) : (
            <div style={{
              padding: '32px',
              textAlign: 'center',
              color: DESIGN_TOKENS.colors.text.muted,
            }}>
              <Text>No data available for this section</Text>
            </div>
          )}

          {/* Render Subsections */}
          {section.subsections && section.subsections.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              {section.subsections.map(subsection => (
                <ReportSectionComponent
                  key={subsection.id}
                  section={subsection}
                  data={data}
                  isExpanded={true} // Auto-expand subsections
                  onToggle={() => {}} // No toggle for subsections
                  level={level + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
};

// =============================================================================
// REPORT SECTION CONTENT RENDERERS
// =============================================================================

interface ReportSectionContentProps {
  section: ReportSection;
  sectionData: { [key: string]: any };
}

const ReportSectionContent: React.FC<ReportSectionContentProps> = ({
  section,
  sectionData
}) => {
  switch (section.display_format) {
    case 'table':
      return <TableRenderer data={sectionData} />;
    case 'cards':
      return <CardsRenderer data={sectionData} />;
    case 'summary':
      return <SummaryRenderer data={sectionData} />;
    case 'chart':
      return <ChartRenderer data={sectionData} />;
    default:
      return <SummaryRenderer data={sectionData} />;
  }
};

// Table Renderer
const TableRenderer: React.FC<{ data: { [key: string]: any } }> = ({ data }) => {
  const columns: TableColumnDefinition<any>[] = [
    createTableColumn({
      columnId: "property",
      compare: (a, b) => a.property.localeCompare(b.property),
      renderHeaderCell: () => "Property",
      renderCell: (item) => item.property,
    }),
    createTableColumn({
      columnId: "value", 
      compare: (a, b) => String(a.value).localeCompare(String(b.value)),
      renderHeaderCell: () => "Value",
      renderCell: (item) => String(item.value || 'N/A'),
    }),
  ];

  const items = Object.entries(data).map(([key, value]) => ({
    property: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value: value,
  }));

  return (
    <Table
      style={{
        border: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
        borderRadius: DESIGN_TOKENS.borderRadius.md,
      }}
    >
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Property</TableHeaderCell>
          <TableHeaderCell>Value</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item, index) => (
          <TableRow key={index}>
            <TableCell>{item.property}</TableCell>
            <TableCell>{String(item.value ?? 'N/A')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

// Cards Renderer
const CardsRenderer: React.FC<{ data: { [key: string]: any } }> = ({ data }) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
    }}>
      {Object.entries(data).map(([key, value]) => (
        <Card key={key} style={{
          ...standardCardStyle,
          padding: '16px',
          textAlign: 'center',
        }}>
          <Title3 style={{ 
            color: DESIGN_TOKENS.colors.primary,
            marginBottom: '8px' 
          }}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Title3>
          <Text style={{ 
            fontSize: DESIGN_TOKENS.typography.fontSize.lg,
            fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold 
          }}>
            {String(value || 'N/A')}
          </Text>
        </Card>
      ))}
    </div>
  );
};

// Summary Renderer
const SummaryRenderer: React.FC<{ data: { [key: string]: any } }> = ({ data }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.entries(data).map(([key, value]) => (
        <div key={key} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: `1px solid ${DESIGN_TOKENS.colors.primaryBorder}`,
        }}>
          <Text style={{ fontWeight: DESIGN_TOKENS.typography.fontWeight.medium }}>
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
          </Text>
          <Text style={{ color: DESIGN_TOKENS.colors.text.secondary }}>
            {String(value || 'N/A')}
          </Text>
        </div>
      ))}
    </div>
  );
};

// Chart Renderer (Placeholder)
const ChartRenderer: React.FC<{ data: { [key: string]: any } }> = ({ data }) => {
  return (
    <div style={{
      padding: '48px',
      textAlign: 'center',
      background: DESIGN_TOKENS.colors.primaryLight,
      borderRadius: DESIGN_TOKENS.borderRadius.md,
    }}>
      <Text style={{ color: DESIGN_TOKENS.colors.text.muted }}>
        Chart visualization coming soon
      </Text>
      <div style={{ marginTop: '16px' }}>
        <Text style={{ fontSize: DESIGN_TOKENS.typography.fontSize.sm }}>
          Data points: {Object.keys(data).length}
        </Text>
      </div>
    </div>
  );
};

// =============================================================================
// REPORT METADATA COMPONENT
// =============================================================================

interface ReportMetadataProps {
  metadata: {
    generated_at: string;
    data_source: string;
    total_records: number;
    confidence_level: number;
  };
}

const ReportMetadata: React.FC<ReportMetadataProps> = ({ metadata }) => {
  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      flexWrap: 'wrap',
      padding: '12px',
      background: DESIGN_TOKENS.colors.primaryLight,
      borderRadius: DESIGN_TOKENS.borderRadius.sm,
    }}>
      <Badge appearance="outline">
        Generated: {new Date(metadata.generated_at).toLocaleDateString()}
      </Badge>
      <Badge appearance="outline">
        Source: {metadata.data_source}
      </Badge>
      <Badge appearance="outline">
        Records: {metadata.total_records.toLocaleString()}
      </Badge>
      <Badge 
        appearance={metadata.confidence_level >= 0.8 ? "filled" : "outline"}
        color={metadata.confidence_level >= 0.8 ? "success" : "warning"}
      >
        Confidence: {(metadata.confidence_level * 100).toFixed(0)}%
      </Badge>
    </div>
  );
};

// =============================================================================
// DEFAULT RVTOOLS REPORT TEMPLATES
// =============================================================================

export const DEFAULT_RVTOOLS_TEMPLATES: ReportTemplate[] = [
  {
    id: 'rvtools-migration-analysis',
    name: 'RVTools Migration Analysis Report',
    description: 'Comprehensive VMware to Hyper-V migration planning report',
    sections: [
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        description: 'High-level overview of the migration assessment',
        data_variables: ['total_vms', 'total_hosts', 'total_clusters', 'migration_complexity_score'],
        display_format: 'cards',
        order: 1,
        is_required: true,
      },
      {
        id: 'infrastructure-overview',
        title: 'Infrastructure Overview',
        description: 'Current VMware infrastructure configuration',
        data_variables: ['vcenter_version', 'environment_name', 'cluster_count', 'host_count'],
        display_format: 'summary',
        order: 2,
        is_required: true,
      },
      {
        id: 'storage-analysis',
        title: 'Storage Architecture Analysis',
        description: 'Storage configuration and S2D compliance assessment',
        data_variables: ['storage_types', 'vsan_clusters', 's2d_compliance_results'],
        display_format: 'table',
        order: 3,
        is_required: true,
        subsections: [
          {
            id: 'vsan-clusters',
            title: 'vSAN Provider Clusters',
            description: 'Clusters suitable for S2D deployment',
            data_variables: ['confirmed_vsan_clusters', 's2d_readiness_scores'],
            display_format: 'cards',
            order: 1,
            is_required: false,
          },
          {
            id: 'san-clusters',
            title: 'SAN Consumer Clusters',
            description: 'Clusters requiring traditional storage connectivity',
            data_variables: ['san_clusters', 'san_connectivity_requirements'],
            display_format: 'table',
            order: 2,
            is_required: false,
          }
        ]
      },
      {
        id: 'migration-recommendations',
        title: 'Migration Recommendations',
        description: 'Strategic recommendations for the migration process',
        data_variables: ['migration_phases', 'risk_assessments', 'timeline_estimates'],
        display_format: 'summary',
        order: 4,
        is_required: true,
      },
    ],
    brand_config: {
      primary_color: DESIGN_TOKENS.colors.primary,
      company_name: 'Archer',
    }
  }
];