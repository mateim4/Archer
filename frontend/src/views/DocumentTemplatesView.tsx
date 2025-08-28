import React, { useState } from 'react';
import {
  Title1,
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
  SearchBox
} from '@fluentui/react-components';
import {
  DocumentRegular,
  ArrowDownloadRegular,
  EditRegular,
  ShareRegular,
  AddRegular,
  FilterRegular
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
}

const DocumentTemplatesView: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const templates: DocumentTemplate[] = [
    {
      id: 'hld-migration-template',
      name: 'Migration High-Level Design Template',
      description: 'Comprehensive HLD template for infrastructure migration projects',
      category: 'hld',
      format: 'docx',
      size: '2.3 MB',
      lastModified: '2025-08-15',
      author: 'LCMDesigner Team',
      downloads: 1247,
      isOfficial: true
    },
    {
      id: 'lld-vmware-azure',
      name: 'VMware to Azure LLD Template',
      description: 'Detailed technical design for VMware to Azure migrations',
      category: 'lld',
      format: 'docx',
      size: '3.1 MB',
      lastModified: '2025-08-12',
      author: 'Microsoft Consulting',
      downloads: 892,
      isOfficial: true
    },
    {
      id: 'bom-hardware-refresh',
      name: 'Hardware Refresh Bill of Materials',
      description: 'Standard BoM template for hardware lifecycle projects',
      category: 'bom',
      format: 'xlsx',
      size: '1.8 MB',
      lastModified: '2025-08-10',
      author: 'LCMDesigner Team',
      downloads: 634,
      isOfficial: true
    },
    {
      id: 'proposal-cloud-migration',
      name: 'Cloud Migration Proposal Template',
      description: 'Executive proposal template for cloud migration initiatives',
      category: 'proposal',
      format: 'pptx',
      size: '4.2 MB',
      lastModified: '2025-08-08',
      author: 'Sales Engineering',
      downloads: 445,
      isOfficial: true
    },
    {
      id: 'assessment-infrastructure',
      name: 'Infrastructure Assessment Report',
      description: 'Current state assessment template with standardized metrics',
      category: 'assessment',
      format: 'docx',
      size: '2.7 MB',
      lastModified: '2025-08-05',
      author: 'Technical Architects',
      downloads: 578,
      isOfficial: true
    },
    {
      id: 'custom-project-charter',
      name: 'Project Charter Template',
      description: 'Standard project charter template for infrastructure projects',
      category: 'other',
      format: 'docx',
      size: '1.2 MB',
      lastModified: '2025-08-01',
      author: 'Project Management',
      downloads: 323,
      isOfficial: false
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

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedTab === 'all' || template.category === selectedTab;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title1>Document Templates</Title1>
        <Body1 style={{ marginTop: '8px', color: '#6b7280' }}>
          Pre-built templates for HLD, LLD, BoM, and other project documents
        </Body1>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <TabList selectedValue={selectedTab} onTabSelect={handleTabChange}>
          <Tab value="all">All Templates</Tab>
          <Tab value="hld">HLD</Tab>
          <Tab value="lld">LLD</Tab>
          <Tab value="bom">BoM</Tab>
          <Tab value="proposal">Proposals</Tab>
          <Tab value="assessment">Assessments</Tab>
          <Tab value="other">Other</Tab>
        </TabList>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SearchBox
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(_, data) => setSearchQuery(data.value)}
            style={{ minWidth: '300px' }}
          />
          <Button
            appearance="primary"
            icon={<AddRegular />}
          >
            Upload Template
          </Button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', 
        gap: '20px' 
      }}>
        {filteredTemplates.map((template) => (
          <Card key={template.id} style={{ cursor: 'pointer' }}>
            <CardHeader
              image={<DocumentRegular style={{ fontSize: '24px' }} />}
              header={
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Title3 style={{ fontSize: '16px', margin: 0 }}>
                      {template.name}
                    </Title3>
                    {template.isOfficial && (
                      <Badge color="brand" size="small">Official</Badge>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Badge color={getCategoryColor(template.category)} size="small">
                      {template.category.toUpperCase()}
                    </Badge>
                    <Badge color={getFormatColor(template.format)} size="small">
                      {template.format.toUpperCase()}
                    </Badge>
                    <Badge color="subtle" size="small">
                      {template.size}
                    </Badge>
                  </div>
                </div>
              }
              action={
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Button
                    appearance="subtle"
                    icon={<ArrowDownloadRegular />}
                    size="small"
                    title="Download"
                  />
                  <Button
                    appearance="subtle"
                    icon={<EditRegular />}
                    size="small"
                    title="Customize"
                  />
                  <Button
                    appearance="subtle"
                    icon={<ShareRegular />}
                    size="small"
                    title="Share"
                  />
                </div>
              }
            />
            <CardPreview>
              <div style={{ padding: '16px', paddingTop: '0' }}>
                <Body1 style={{ marginBottom: '12px' }}>
                  {template.description}
                </Body1>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#6b7280' }}>
                  <span>By {template.author}</span>
                  <span>{template.downloads} downloads</span>
                  <span>Updated {template.lastModified}</span>
                </div>
              </div>
            </CardPreview>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <DocumentRegular style={{ fontSize: '48px', color: '#6b7280', marginBottom: '16px' }} />
          <Title2>No templates found</Title2>
          <Body1 style={{ color: '#6b7280' }}>
            Try adjusting your search or filter criteria
          </Body1>
        </div>
      )}

      <Divider style={{ margin: '40px 0' }} />
      
      <div>
        <Title2 style={{ marginBottom: '16px' }}>Template Categories</Title2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <Card>
            <CardPreview>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Title3>High-Level Design</Title3>
                <Body1 style={{ color: '#6b7280', marginTop: '8px' }}>
                  Architectural overview and design principles
                </Body1>
              </div>
            </CardPreview>
          </Card>
          <Card>
            <CardPreview>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Title3>Low-Level Design</Title3>
                <Body1 style={{ color: '#6b7280', marginTop: '8px' }}>
                  Detailed technical implementation guides
                </Body1>
              </div>
            </CardPreview>
          </Card>
          <Card>
            <CardPreview>
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <Title3>Bill of Materials</Title3>
                <Body1 style={{ color: '#6b7280', marginTop: '8px' }}>
                  Hardware and software component lists
                </Body1>
              </div>
            </CardPreview>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentTemplatesView;
