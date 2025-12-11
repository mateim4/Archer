import React, { useState, useEffect, useMemo } from 'react';
import {
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Badge,
  Divider,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Label,
  Select,
  Spinner
} from '@fluentui/react-components';
import { DESIGN_TOKENS } from '../components/DesignSystem';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import { DesignTokens } from '../styles/designSystem';
import {
  DocumentRegular,
  ArrowDownloadRegular,
  EditRegular,
  ShareRegular,
  AddRegular,
  FilterRegular,
  EyeRegular,
  SaveRegular,
  DismissRegular,
  SearchRegular,
  CheckmarkCircleRegular,
  TaskListAddRegular,
  WarningRegular,
  ErrorCircleRegular,
  ArrowUploadRegular
} from '@fluentui/react-icons';
import { PurpleGlassInput, PurpleGlassTextarea } from '@/components/ui';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'hld' | 'lld' | 'bom' | 'proposal' | 'assessment' | 'other';
  format: 'docx' | 'pdf' | 'xlsx' | 'pptx';
  size: string;
  lastModified: string;
  author: string;
  downloads: number;
  isOfficial: boolean;
  content?: string; // Template content for editing
  variables?: string[]; // Available template variables
  sections?: any[]; // Template sections from backend
}

type TemplateTabKey = 'all' | DocumentTemplate['category'];

const TEMPLATE_TABS: Array<{ id: TemplateTabKey; label: string }> = [
  { id: 'all', label: 'All Templates' },
  { id: 'hld', label: 'HLD' },
  { id: 'lld', label: 'LLD' },
  { id: 'bom', label: 'BOM' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'assessment', label: 'Assessment' },
  { id: 'other', label: 'Other' }
];

const DocumentTemplatesView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<TemplateTabKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal states
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);
  const [editTemplate, setEditTemplate] = useState<DocumentTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    category: 'hld' as DocumentTemplate['category'],
    content: ''
  });

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const templateTabCounts = useMemo<Record<TemplateTabKey, number>>(() => {
    const counts: Record<TemplateTabKey, number> = {
      all: 0,
      hld: 0,
      lld: 0,
      bom: 0,
      proposal: 0,
      assessment: 0,
      other: 0
    };

    templates.forEach((template) => {
      counts[template.category] += 1;
    });

    counts.all = templates.length;
    return counts;
  }, [templates]);
  
  useEffect(() => {
    loadRealTemplates();
  }, []);

  const loadRealTemplates = async () => {
    try {
      setLoading(true);
      console.log('Attempting to load templates from:', 'http://localhost:3002/api/enhanced-rvtools/reports/templates');
      
      const response = await fetch('http://localhost:3002/api/enhanced-rvtools/reports/templates');
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const backendResponse = await response.json();
        const backendTemplates = backendResponse.templates || backendResponse;
        console.log('Backend templates loaded:', backendTemplates.length, 'templates');
        console.log('Template data:', backendTemplates);
        
        // If backend returns empty templates, show empty state (no fallbacks)
        if (!backendTemplates || backendTemplates.length === 0) {
          console.log('Backend returned empty templates');
          setTemplates([]);
          return;
        }
        
        // Transform backend data to frontend format
        const transformedTemplates: DocumentTemplate[] = backendTemplates.map((template: any) => ({
          id: template.id?.id?.String || template.id || Math.random().toString(),
          name: template.name,
          description: template.description,
          category: mapReportTypeToCategory(template.report_type),
          format: 'docx', // Default format
          size: '2.1 MB', // Estimated size
          lastModified: template.updated_at || template.created_at,
          author: template.created_by || 'Archer',
          downloads: 0, // Not tracked yet
          isOfficial: template.is_standard,
          content: generateTemplateContent(template),
          variables: template.data_variables || [],
          sections: template.sections || []
        }));
        
        console.log('🔄 Transformed templates:', transformedTemplates.length, 'templates');
        setTemplates(transformedTemplates);
      } else {
        console.warn('Backend responded with error:', response.status);
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const mapReportTypeToCategory = (reportType: string): 'hld' | 'lld' | 'bom' | 'proposal' | 'assessment' | 'other' => {
    switch (reportType) {
      case 'migration_hld': return 'hld';
      case 'cluster_analysis': return 'assessment';
      case 'hardware_analysis': return 'lld';
      case 'storage_architecture': return 'bom';
      case 'migration_timeline': return 'proposal';
      case 'network_architecture': return 'other';
      default: return 'other';
    }
  };

  const generateTemplateContent = (template: any): string => {
    if (!template.sections) return '';
    
    let content = `# ${template.name}\n\n${template.description}\n\n`;
    
    template.sections.forEach((section: any, index: number) => {
      content += `## ${section.title}\n\n${section.description}\n\n`;
      
      if (section.data_variables && section.data_variables.length > 0) {
        content += 'Variables used:\n';
        section.data_variables.forEach((variable: string) => {
          content += `- {{${variable}}}\n`;
        });
        content += '\n';
      }
    });
    
    return content;
  };

  const getFallbackTemplates = (): DocumentTemplate[] => [
    {
      id: 'fallback-migration-template',
      name: 'Migration Analysis Report (Demo)',
      description: 'Demo template - Backend connection failed',
      category: 'hld',
      format: 'docx',
      size: '2.3 MB',
      lastModified: new Date().toISOString(),
      author: 'Archer Team',
      downloads: 0,
      isOfficial: true,
      content: '# Demo Template\n\nThis is a fallback template shown when the backend is unavailable.',
      variables: ['SOURCE_ENVIRONMENT', 'TARGET_ENVIRONMENT']
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hld': return 'brand';
      case 'lld': return 'success';
      case 'bom': return 'warning';
      case 'proposal': return 'danger';
      case 'assessment': return 'subtle';
      case 'other': return 'subtle';
      default: return 'subtle';
    }
  };

  const getFormatColor = (format: string) => {
    switch (format) {
      case 'docx': return 'brand';
      case 'xlsx': return 'success';
      case 'pptx': return 'warning';
      case 'pdf': return 'danger';
      default: return 'subtle';
    }
  };

  // Handler functions
  const handlePreviewTemplate = async (template: DocumentTemplate) => {
    setIsLoading(true);
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
    setIsLoading(false);
  };

  const handleEditTemplate = async (template: DocumentTemplate) => {
    setIsLoading(true);
    setEditTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content || ''
    });
    setIsEditOpen(true);
    setIsLoading(false);
  };

  const handleSaveTemplate = async () => {
    // Validate form
    if (!editForm.name.trim()) {
      console.error('Template name is required');
      return;
    }

    try {
      setIsLoading(true);
      
      if (!editTemplate) {
        console.error('No template selected for editing');
        return;
      }

      // Prepare update payload for backend
      const updatePayload = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        report_type: categoryToReportType(editForm.category),
        // Convert content back to sections if needed
        sections: editTemplate.sections || [],
        data_variables: extractVariablesFromContent(editForm.content),
        is_customizable: true,
        updated_at: new Date().toISOString()
      };

      // Try to save to backend
      try {
        const response = await fetch(`/api/enhanced-rvtools/reports/templates/${editTemplate.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });

        if (response.ok) {
          // Backend update successful, refresh templates
          await loadRealTemplates();
          console.log('Template updated successfully');
        } else {
          // Backend failed, update local state only
          console.warn('Backend update failed, updating locally');
          updateLocalTemplate();
        }
      } catch (backendError) {
        console.warn('Backend unavailable, updating locally');
        updateLocalTemplate();
      }
      
      // Close the edit dialog
      setIsEditOpen(false);
      setEditTemplate(null);
      setEditForm({ name: '', description: '', category: 'hld', content: '' });
    } catch (error) {
      console.error('Failed to save template:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const categoryToReportType = (category: string): string => {
    switch (category) {
      case 'hld': return 'migration_hld';
      case 'assessment': return 'cluster_analysis';
      case 'lld': return 'hardware_analysis';
      case 'bom': return 'storage_architecture';
      case 'proposal': return 'migration_timeline';
      default: return 'custom';
    }
  };

  const extractVariablesFromContent = (content: string): string[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1].trim())) {
        variables.push(match[1].trim());
      }
    }
    
    return variables;
  };

  const updateLocalTemplate = () => {
    const templateIndex = templates.findIndex(t => t.id === editTemplate?.id);
    if (templateIndex === -1) return;

    const updatedTemplates = [...templates];
    updatedTemplates[templateIndex] = {
      ...updatedTemplates[templateIndex],
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      content: editForm.content,
      variables: extractVariablesFromContent(editForm.content),
      lastModified: new Date().toISOString()
    };

    setTemplates(updatedTemplates);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedTab === 'all' || template.category === selectedTab;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div style={DesignTokens.components.pageContainer}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <Spinner size="large" />
          <div style={{
            fontSize: DesignTokens.typography.lg,
            color: DesignTokens.colors.primary,
            fontFamily: DesignTokens.typography.fontFamily
          }}>
            Loading document templates...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={DesignTokens.components.pageContainer}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
        paddingBottom: DesignTokens.spacing.lg
      }}>
        <h1 style={{
          fontSize: DesignTokens.typography.xxxl,
          fontWeight: DesignTokens.typography.semibold,
          color: 'var(--text-primary)',
          margin: '0',
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <DocumentRegular style={{ fontSize: '32px', color: 'var(--text-primary)' }} />
          Document Templates
        </h1>
        <p style={{
          fontSize: DesignTokens.typography.lg,
          color: 'var(--text-secondary)',
          margin: 0,
          fontFamily: DesignTokens.typography.fontFamily
        }}>
          Pre-built templates for HLD, LLD, BoM, and other project documents
        </p>
      </div>

      {/* Controls */}
      <div style={{
        ...DesignTokens.components.standardCard,
        padding: '24px',
        marginBottom: '32px',
        cursor: 'default'
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div className="lcm-pill-tabs" role="tablist" aria-label="Template categories" style={{ margin: 0 }}>
            {TEMPLATE_TABS.map((tab) => {
              const isActive = selectedTab === tab.id;
              const count = templateTabCounts[tab.id];
              const label = count > 0 ? `${tab.label} (${count})` : tab.label;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`lcm-pill-tab ${isActive ? 'lcm-pill-tab-active' : 'lcm-pill-tab-inactive'}`}
                  aria-selected={isActive}
                  role="tab"
                >
                  <span className="lcm-pill-tab-label">{label}</span>
                </button>
              );
            })}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ width: '300px' }}>
              <GlassmorphicSearchBar
                value={searchQuery}
                onChange={(value) => setSearchQuery(value)}
                placeholder="Search templates..."
                width="100%"
              />
            </div>
            <button className="btn btn-primary">
              <ArrowUploadRegular style={{ marginRight: '8px' }} />Upload Template
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {filteredTemplates.map((template) => (
          <div key={template.id} 
            style={DesignTokens.components.standardCard}
            onMouseEnter={(e) => {
              const target = e.currentTarget as HTMLElement;
              Object.assign(target.style, DesignTokens.components.standardCardHover);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget as HTMLElement;
              Object.assign(target.style, DesignTokens.components.standardCard);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px' }}>
                <DocumentRegular />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0,
                    fontFamily: DesignTokens.typography.fontFamily
                  }}>
                    {template.name}
                  </h3>
                  {template.isOfficial && (
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#4f46e5',
                      fontFamily: DesignTokens.typography.fontFamily,
                      fontWeight: '500'
                    }}>
                      OFFICIAL
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                    fontFamily: DesignTokens.typography.fontFamily
                  }}>
                    {template.category.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    fontFamily: DesignTokens.typography.fontFamily
                  }}>
                    {template.format.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: 'var(--text-secondary)',
                    fontFamily: DesignTokens.typography.fontFamily
                  }}>
                    {template.size}
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5',
                  fontFamily: DesignTokens.typography.fontFamily
                }}>
                  {template.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#94a3b8', marginBottom: '16px' }}>
                  <span>By {template.author}</span>
                  <span>{template.downloads} downloads</span>
                  <span>{template.lastModified}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handlePreviewTemplate(template)}
                className="btn btn-outline btn-sm"
                title="Preview Template"
              >
                <EyeRegular style={{ marginRight: '4px' }} />Preview
              </button>
              <button
                onClick={() => handleEditTemplate(template)}
                className="btn btn-outline btn-sm"
                title="Edit Template"
              >
                <EditRegular style={{ marginRight: '4px' }} />Edit
              </button>
              <button
                className="btn btn-success btn-sm"
                title="Download"
              >
                <ArrowDownloadRegular style={{ marginRight: '4px' }} />Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{
          ...DESIGN_TOKENS.components.standardContentCard,
          padding: '60px 20px',
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}><DocumentRegular /></div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            margin: '0 0 8px 0',
            fontFamily: DesignTokens.typography.fontFamily
          }}>No templates found</h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0,
            fontFamily: DesignTokens.typography.fontFamily
          }}>
            Try adjusting your search or filter criteria. Loading from: /api/enhanced-rvtools/reports/templates
          </p>
        </div>
      )}

      {/* Template Preview Modal */}
      <Dialog open={isPreviewOpen} onOpenChange={(_, data) => setIsPreviewOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '900px', maxHeight: '80vh' }}>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <DocumentRegular style={{ fontSize: '24px', color: '#8b5cf6' }} />
              Template Preview: {previewTemplate?.name}
            </div>
          </DialogTitle>
          <DialogContent>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Badge appearance="outline" color={getCategoryColor(previewTemplate?.category || 'other')} size="small">
                  {previewTemplate?.category?.toUpperCase()}
                </Badge>
                <Badge appearance="outline" color={getFormatColor(previewTemplate?.format || 'docx')} size="small">
                  {previewTemplate?.format?.toUpperCase()}
                </Badge>
                {previewTemplate?.isOfficial && (
                  <Badge appearance="outline" color="brand" size="small">Official</Badge>
                )}
              </div>
              <Body1 style={{ color: 'var(--text-secondary)' }}>
                {previewTemplate?.description}
              </Body1>
            </div>
            
            {previewTemplate?.content ? (
              <div style={{ 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '20px',
                maxHeight: '400px',
                overflow: 'auto',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap'
              }}>
                {previewTemplate.content}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                color: 'var(--text-secondary)'
              }}>
                <DocumentRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                <Body1>No content preview available</Body1>
                <Body1>This template can be downloaded for viewing</Body1>
              </div>
            )}

            {previewTemplate?.variables && previewTemplate.variables.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <Title3 style={{ marginBottom: '12px' }}>Template Variables</Title3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {previewTemplate.variables.map((variable, index) => (
                    <Badge key={index} appearance="outline" color="subtle" size="small">
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              icon={<ArrowDownloadRegular />}
            >
              Download
            </Button>
            <Button
              appearance="primary"
              icon={<EditRegular />}
              onClick={() => {
                setIsPreviewOpen(false);
                if (previewTemplate) {
                  handleEditTemplate(previewTemplate);
                }
              }}
            >
              Edit Template
            </Button>
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Template Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={(_, data) => setIsEditOpen(data.open)}>
        <DialogSurface style={{ maxWidth: '1000px', maxHeight: '90vh' }}>
          <DialogTitle>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <EditRegular style={{ fontSize: '24px', color: '#8b5cf6' }} />
              Edit Template: {editTemplate?.name}
            </div>
          </DialogTitle>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <PurpleGlassInput
                    id="template-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    glass="light"
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: (e.target as HTMLSelectElement).value as any })}
                    style={{ marginTop: '4px' }}
                  >
                    <option value="hld">High-Level Design</option>
                    <option value="lld">Low-Level Design</option>
                    <option value="bom">Bill of Materials</option>
                    <option value="proposal">Proposal</option>
                    <option value="assessment">Assessment</option>
                    <option value="other">Other</option>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template-description">Description</Label>
                <PurpleGlassTextarea
                  id="template-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  glass="light"
                />
              </div>
              
              <div>
                <Label htmlFor="template-content">Template Content</Label>
                <PurpleGlassTextarea
                  id="template-content"
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  glass="light"
                  style={{ 
                    fontFamily: 'monospace',
                    fontSize: '13px'
                  }}
                  placeholder="Enter your template content here. Use {{VARIABLE_NAME}} for template variables..."
                />
              </div>

              {editTemplate?.variables && editTemplate.variables.length > 0 && (
                <div>
                  <Label>Available Variables</Label>
                  <div style={{ 
                    marginTop: '8px',
                    padding: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px'
                  }}>
                    {editTemplate.variables.map((variable, index) => (
                      <Badge key={index} appearance="outline" color="subtle" size="small">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            {isLoading ? (
              <Button appearance="primary" disabled>
                <Spinner size="tiny" style={{ marginRight: '8px' }} />
                Saving...
              </Button>
            ) : (
              <Button
                appearance="primary"
                icon={<SaveRegular />}
                onClick={handleSaveTemplate}
              >
                Save Template
              </Button>
            )}
            <Button
              appearance="subtle"
              icon={<DismissRegular />}
              onClick={() => {
                setIsEditOpen(false);
                setEditTemplate(null);
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default DocumentTemplatesView;
