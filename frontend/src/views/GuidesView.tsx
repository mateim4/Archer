import React from 'react';
import {
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
import GlassmorphicLayout from '../components/GlassmorphicLayout';

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
          📚 Guides & Documentation
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#64748b',
          margin: 0,
          fontFamily: 'Montserrat, sans-serif'
        }}>
          Comprehensive guides and tutorials to help you get the most out of LCMDesigner
        </p>
      </div>

      {/* Guides Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', 
        gap: '24px',
        marginBottom: '32px'
      }}>
        {guides.map((guide) => (
          <div key={guide.id} style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(18px) saturate(180%)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px' }}>
                {getTypeIcon(guide.type)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  margin: '0 0 8px 0',
                  fontFamily: 'Montserrat, sans-serif'
                }}>
                  {guide.title}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: '#4f46e5',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {guide.category}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    {guide.difficulty}
                  </span>
                  {guide.duration && (
                    <span style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: 'rgba(107, 114, 128, 0.1)',
                      color: '#374151',
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                      {guide.duration}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              margin: 0,
              lineHeight: '1.6',
              fontFamily: 'Montserrat, sans-serif'
            }}>
              {guide.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(18px) saturate(180%)',
        borderRadius: '20px',
        padding: '32px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1f2937',
          margin: '0 0 24px 0',
          fontFamily: 'Montserrat, sans-serif'
        }}>
          📖 Additional Resources
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { name: 'API Documentation', icon: '📋' },
            { name: 'Video Library', icon: '🎥' },
            { name: 'Community Forum', icon: '💬' },
            { name: 'Release Notes', icon: '📝' }
          ].map((resource, index) => (
            <button
              key={index}
              style={{
                background: 'transparent',
                color: '#6366f1',
                border: '2px solid rgba(99, 102, 241, 0.3)',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>{resource.icon}</span>
              {resource.name}
            </button>
          ))}
        </div>
      </div>
    </GlassmorphicLayout>
  );
};

export default GuidesView;
