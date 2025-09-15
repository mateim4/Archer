import React, { useState, useEffect } from 'react';
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
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  Input,
  SearchBox,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Textarea,
  Label,
  Select,
  Spinner
} from '@fluentui/react-components';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import {
  DocumentRegular,
  ArrowDownloadRegular,
  EditRegular,
  ShareRegular,
  AddRegular,
  FilterRegular,
  EyeRegular,
  SaveRegular,
  DismissRegular
} from '@fluentui/react-icons';

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

const DocumentTemplatesView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('all');
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
    category: 'hld' as const,
    content: ''
  });

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadRealTemplates();
  }, []);

  const loadRealTemplates = async () => {
    try {
      setLoading(true);
      console.log('🔍 Attempting to load templates from:', 'http://localhost:3002/api/enhanced-rvtools/reports/templates');
      
      const response = await fetch('http://localhost:3002/api/enhanced-rvtools/reports/templates');
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const backendResponse = await response.json();
        const backendTemplates = backendResponse.templates || backendResponse;
        console.log('✅ Backend templates loaded:', backendTemplates.length, 'templates');
        console.log('📋 Template data:', backendTemplates);
        
        // If backend returns empty templates, show empty state (no fallbacks)
        if (!backendTemplates || backendTemplates.length === 0) {
          console.log('📋 Backend returned empty templates');
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
          author: template.created_by || 'LCMDesigner',
          downloads: 0, // Not tracked yet
          isOfficial: template.is_standard,
          content: generateTemplateContent(template),
          variables: template.data_variables || [],
          sections: template.sections || []
        }));
        
        console.log('🔄 Transformed templates:', transformedTemplates.length, 'templates');
        setTemplates(transformedTemplates);
      } else {
        console.warn('⚠️ Backend responded with error:', response.status);
        setTemplates([]);
      }
    } catch (error) {
      console.error('❌ Error loading templates:', error);
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
      author: 'LCMDesigner Team',
      downloads: 0,
      isOfficial: true,
      content: '# Demo Template\n\nThis is a fallback template shown when the backend is unavailable.',
      variables: ['SOURCE_ENVIRONMENT', 'TARGET_ENVIRONMENT']
    }
  ];

  const handleTabChange = (_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

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
      <GlassmorphicLayout>
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
            fontSize: '18px',
            color: '#6366f1',
            fontFamily: 'Montserrat, sans-serif'
          }}>
            Loading document templates...
          </div>
        </div>
      </GlassmorphicLayout>
    );
  }

  return (
    <GlassmorphicLayout>
      {/* Header Card */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(18px) saturate(180%)',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          color: '#1f2937',
          margin: '0 0 8px 0',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          📄 Document Templates
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif'
        }}>
          Pre-built templates for HLD, LLD, BoM, and other project documents
        </p>
      </div>

      {/* Controls */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(18px) saturate(180%)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['all', 'hld', 'lld', 'bom', 'proposal', 'assessment', 'other'].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: selectedTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  background: selectedTab === tab ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: selectedTab === tab ? '#6366f1' : '#64748b',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                onMouseOver={(e) => {
                  if (selectedTab !== tab) {
                    e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedTab !== tab) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {tab === 'all' ? 'All Templates' : tab.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'Montserrat, sans-serif',
                background: 'rgba(255, 255, 255, 0.8)',
                minWidth: '200px'
              }}
            />
            <button
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              ➕ Upload Template
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
          <div key={template.id} style={{
            border: '2px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: 'transparent'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.background = 'transparent';
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '32px' }}>
                📄
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1f2937',
                    margin: 0,
                    fontFamily: 'Montserrat, sans-serif'
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
                      fontFamily: 'Montserrat, sans-serif',
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
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {template.category.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {template.format.toUpperCase()}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: '#374151',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {template.size}
                  </span>
                </div>
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: '0 0 12px 0',
                  lineHeight: '1.5',
                  fontFamily: 'Montserrat, sans-serif'
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
                style={{
                  padding: '6px 12px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'transparent',
                  color: '#6366f1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                title="Preview Template"
              >
                👁️ Preview
              </button>
              <button
                onClick={() => handleEditTemplate(template)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  background: 'transparent',
                  color: '#6366f1',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                title="Edit Template"
              >
                ✏️ Edit
              </button>
              <button
                style={{
                  padding: '6px 12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'transparent',
                  color: '#10b981',
                  borderRadius: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: 'Montserrat, sans-serif'
                }}
                title="Download"
              >
                📥 Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          border: '2px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '12px',
          marginBottom: '32px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#1f2937',
            margin: '0 0 8px 0',
            fontFamily: 'Montserrat, sans-serif'
          }}>No templates found</h2>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            margin: 0,
            fontFamily: 'Montserrat, sans-serif'
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
              <Body1 style={{ color: '#6b7280' }}>
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
                color: '#6b7280'
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
                  <Input
                    id="template-name"
                    value={editForm.name}
                    onChange={(_, data) => setEditForm({ ...editForm, name: data.value })}
                    style={{ marginTop: '4px' }}
                  />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select
                    value={editForm.category}
                    onSelectionChange={(_, data) => setEditForm({ ...editForm, category: data.selectedOptions[0] as any })}
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
                <Textarea
                  id="template-description"
                  value={editForm.description}
                  onChange={(_, data) => setEditForm({ ...editForm, description: data.value })}
                  rows={3}
                  style={{ marginTop: '4px' }}
                />
              </div>
              
              <div>
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea
                  id="template-content"
                  value={editForm.content}
                  onChange={(_, data) => setEditForm({ ...editForm, content: data.value })}
                  rows={15}
                  style={{ 
                    marginTop: '4px',
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
    </GlassmorphicLayout>
  );
};

export default DocumentTemplatesView;
