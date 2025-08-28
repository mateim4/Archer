import React from 'react';
import {
  Title1,
  Title2,
  Body1,
  Card,
  CardHeader,
  CardPreview,
  Button,
  Badge,
  Divider
} from '@fluentui/react-components';
import {
  BookRegular,
  VideoRegular,
  DocumentRegular,
  ChevronRightRegular
} from '@fluentui/react-icons';

interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'migration' | 'lifecycle' | 'hardware' | 'general';
  type: 'documentation' | 'video' | 'tutorial';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const GuidesView: React.FC = () => {
  const guides: Guide[] = [
    {
      id: 'getting-started',
      title: 'Getting Started with LCMDesigner',
      description: 'Learn the basics of project creation and navigation in LCMDesigner',
      category: 'general',
      type: 'documentation',
      duration: '10 min',
      difficulty: 'beginner'
    },
    {
      id: 'migration-planning',
      title: 'Migration Planning Best Practices',
      description: 'Complete guide to planning and executing infrastructure migrations',
      category: 'migration',
      type: 'tutorial',
      duration: '30 min',
      difficulty: 'intermediate'
    },
    {
      id: 'hardware-lifecycle',
      title: 'Hardware Lifecycle Management',
      description: 'Managing hardware refresh cycles and asset tracking',
      category: 'lifecycle',
      type: 'documentation',
      duration: '20 min',
      difficulty: 'intermediate'
    },
    {
      id: 'rvtools-import',
      title: 'RVTools Data Import',
      description: 'Step-by-step guide to importing and processing RVTools data',
      category: 'migration',
      type: 'video',
      duration: '15 min',
      difficulty: 'beginner'
    },
    {
      id: 'hardware-basket',
      title: 'Using the Hardware Basket',
      description: 'Managing hardware selections and configurations',
      category: 'hardware',
      type: 'tutorial',
      duration: '25 min',
      difficulty: 'beginner'
    },
    {
      id: 'document-generation',
      title: 'Document Generation & Templates',
      description: 'Creating HLD, LLD, and BoM documents from your projects',
      category: 'general',
      type: 'documentation',
      duration: '20 min',
      difficulty: 'intermediate'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'migration': return 'brand';
      case 'lifecycle': return 'success';
      case 'hardware': return 'warning';
      case 'general': return 'subtle';
      default: return 'subtle';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'danger';
      default: return 'subtle';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoRegular />;
      case 'tutorial': return <BookRegular />;
      case 'documentation': return <DocumentRegular />;
      default: return <DocumentRegular />;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <Title1>Guides & Documentation</Title1>
        <Body1 style={{ marginTop: '8px', color: '#6b7280' }}>
          Comprehensive guides and tutorials to help you get the most out of LCMDesigner
        </Body1>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', 
        gap: '24px' 
      }}>
        {guides.map((guide) => (
          <Card key={guide.id} style={{ cursor: 'pointer' }}>
            <CardHeader
              image={getTypeIcon(guide.type)}
              header={
                <div>
                  <Title2 style={{ fontSize: '16px', marginBottom: '4px' }}>
                    {guide.title}
                  </Title2>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <Badge color={getCategoryColor(guide.category)} size="small">
                      {guide.category}
                    </Badge>
                    <Badge color={getDifficultyColor(guide.difficulty)} size="small">
                      {guide.difficulty}
                    </Badge>
                    {guide.duration && (
                      <Badge color="subtle" size="small">
                        {guide.duration}
                      </Badge>
                    )}
                  </div>
                </div>
              }
              action={
                <Button
                  appearance="subtle"
                  icon={<ChevronRightRegular />}
                  size="small"
                />
              }
            />
            <CardPreview>
              <Body1 style={{ padding: '16px', paddingTop: '0' }}>
                {guide.description}
              </Body1>
            </CardPreview>
          </Card>
        ))}
      </div>

      <Divider style={{ margin: '40px 0' }} />
      
      <div>
        <Title2 style={{ marginBottom: '16px' }}>Additional Resources</Title2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button appearance="primary">
            API Documentation
          </Button>
          <Button appearance="secondary">
            Video Library
          </Button>
          <Button appearance="secondary">
            Community Forum
          </Button>
          <Button appearance="secondary">
            Release Notes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidesView;
