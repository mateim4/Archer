import React, { useState } from 'react';
import {
  Title2,
  Title3,
  Body1,
  Body2,
  Button,
  Badge,
  SearchBox,
  makeStyles
} from '@fluentui/react-components';
import GlassmorphicSearchBar from '../components/GlassmorphicSearchBar';
import { PurpleGlassDropdown } from '../components/ui';
import type { DropdownOption } from '../components/ui';
import {
  BookRegular,
  VideoRegular,
  DocumentRegular,
  ChevronRightRegular,
  SearchRegular,
  FilterRegular,
  BookOpenRegular,
  PlayCircleRegular,
  DocumentTextRegular,
  ClockRegular,
  NavigationRegular
} from '@fluentui/react-icons';
import { DesignTokens } from '../styles/designSystem';
import { tokens } from '@/styles/design-tokens';

interface Guide {
  id: string;
  title: string;
  description: string;
  category: 'migration' | 'lifecycle' | 'hardware' | 'general';
  type: 'documentation' | 'video' | 'tutorial';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const useStyles = makeStyles({
  guidesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl
  },
  statisticsCard: {
    ...DesignTokens.components.borderCard,
    padding: DesignTokens.spacing.xl,
    marginBottom: DesignTokens.spacing.xxl,
    background: 'rgba(255, 255, 255, 0.40)',
    backdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
    border: '1px solid rgba(255, 255, 255, 0.35)',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.lg,
    flexWrap: 'wrap'
  },
  searchContainer: {
    flex: 1,
    minWidth: '280px',
    maxWidth: '400px'
  }
});

const GuidesView: React.FC = () => {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Dropdown options for filters
  const categoryOptions: DropdownOption[] = [
    { value: 'all', label: 'All Categories' },
    { value: 'migration', label: 'Migration' },
    { value: 'lifecycle', label: 'Lifecycle' },
    { value: 'hardware', label: 'Hardware' },
    { value: 'general', label: 'General' }
  ];

  const difficultyOptions: DropdownOption[] = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

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

  // Filter guides based on search and filters
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = searchTerm === '' || 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || guide.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Statistics calculations
  const stats = {
    total: guides.length,
    byCategory: {
      migration: guides.filter(g => g.category === 'migration').length,
      lifecycle: guides.filter(g => g.category === 'lifecycle').length,
      hardware: guides.filter(g => g.category === 'hardware').length,
      general: guides.filter(g => g.category === 'general').length,
    },
    byType: {
      documentation: guides.filter(g => g.type === 'documentation').length,
      video: guides.filter(g => g.type === 'video').length,
      tutorial: guides.filter(g => g.type === 'tutorial').length,
    },
    byDifficulty: {
      beginner: guides.filter(g => g.difficulty === 'beginner').length,
      intermediate: guides.filter(g => g.difficulty === 'intermediate').length,
      advanced: guides.filter(g => g.difficulty === 'advanced').length,
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'migration': return DesignTokens.colorVariants.indigo.base;
      case 'lifecycle': return DesignTokens.colorVariants.emerald.base;
      case 'hardware': return DesignTokens.colorVariants.amber.base;
      case 'general': return 'var(--text-secondary)';
      default: return 'var(--text-secondary)';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return DesignTokens.colorVariants.emerald.base;
      case 'intermediate': return DesignTokens.colorVariants.amber.base;
      case 'advanced': return DesignTokens.colorVariants.red.base;
      default: return 'var(--text-secondary)';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircleRegular />;
      case 'tutorial': return <BookOpenRegular />;
      case 'documentation': return <DocumentTextRegular />;
      default: return <DocumentTextRegular />;
    }
  };

  return (
    <div style={{...DesignTokens.components.pageContainer, overflow: 'visible'}}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: DesignTokens.spacing.xl,
        borderBottom: `2px solid ${DesignTokens.colors.primary}20`,
        paddingBottom: DesignTokens.spacing.lg
      }}>
        <div>
          <h1 style={{
            fontSize: DesignTokens.typography.xxxl,
            fontWeight: DesignTokens.typography.semibold,
            color: 'var(--brand-primary)',
            margin: '0',
            fontFamily: DesignTokens.typography.fontFamily,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <NavigationRegular style={{ fontSize: '32px', color: 'var(--icon-default)' }} />
            Guides & Documentation
          </h1>
          <p style={{
            fontSize: DesignTokens.typography.lg,
            color: 'var(--text-secondary)',
            fontFamily: DesignTokens.typography.fontFamily,
            margin: 0
          }}>
            Comprehensive guides and tutorials to help you get the most out of LCMDesigner
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '32px',
        background: 'var(--lcm-bg-card)',
        backdropFilter: 'var(--lcm-backdrop-filter)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colors.primary,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Total Guides
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.emerald.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.byDifficulty.beginner}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Beginner
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.indigo.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {stats.byType.video}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Video Guides
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: DesignTokens.typography.xxxl,
              fontWeight: DesignTokens.typography.bold,
              color: DesignTokens.colorVariants.amber.base,
              fontFamily: DesignTokens.typography.fontFamily,
              margin: 0,
            }}>
              {filteredGuides.length}
            </div>
            <div style={{
              fontSize: DesignTokens.typography.sm,
              color: 'var(--text-secondary)',
              fontWeight: DesignTokens.typography.medium,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginTop: DesignTokens.spacing.xs,
            }}>
              Showing
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <GlassmorphicSearchBar
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Search guides and documentation..."
            width="100%"
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PurpleGlassDropdown
            placeholder="Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as string)}
            glass="light"
          />

          <PurpleGlassDropdown
            placeholder="Difficulty"
            options={difficultyOptions}
            value={selectedDifficulty}
            onChange={(value) => setSelectedDifficulty(value as string)}
            glass="light"
          />
        </div>
      </div>

      {/* Guides Grid */}
      {filteredGuides.length === 0 ? (
        <div style={{
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          margin: '32px 0'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            color: '#64748b'
          }}>
            <BookRegular />
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px',
            fontFamily: tokens.fontFamilyBody,
            margin: '0 0 12px 0'
          }}>
            No guides found
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            marginBottom: '32px',
            maxWidth: '500px',
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: '1.6',
            fontFamily: tokens.fontFamilyBody
          }}>
            Try adjusting your search terms or filters to find the guides you're looking for.
          </p>
          <button
            style={{
              background: 'transparent',
              color: '#8b5cf6',
              border: '2px solid rgba(139, 92, 246, 0.3)',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: tokens.fontFamilyBody,
              cursor: 'pointer'
            }}
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
            }}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className={styles.guidesGrid}>
          {filteredGuides.map((guide) => (
            <div 
              key={guide.id} 
              style={{
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: 'transparent',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
          >
            <div style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              height: '100%'
            }}>
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  border: `2px solid ${getCategoryColor(guide.category)}40`,
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: getCategoryColor(guide.category),
                  flexShrink: 0
                }}>
                  {getTypeIcon(guide.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '8px',
                    fontFamily: tokens.fontFamilyBody,
                    lineHeight: '1.4',
                    margin: '0 0 8px 0'
                  }}>
                    {guide.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#64748b',
                    fontFamily: tokens.fontFamilyBody,
                    lineHeight: '1.5',
                    margin: 0
                  }}>
                    {guide.description}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginTop: 'auto'
              }}>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5',
                  fontFamily: tokens.fontFamilyBody,
                  textTransform: 'capitalize'
                }}>
                  {guide.category}
                </span>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#047857',
                  fontFamily: tokens.fontFamilyBody,
                  textTransform: 'capitalize'
                }}>
                  {guide.difficulty}
                </span>
                {guide.duration && (
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    background: 'rgba(107, 114, 128, 0.1)',
                    color: 'var(--text-primary)',
                    fontFamily: tokens.fontFamilyBody,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ClockRegular style={{ fontSize: '12px' }} />
                    {guide.duration}
                  </span>
                )}
              </div>
            </div>
            </div>
          ))}
        </div>
      )}

      {/* Additional Resources */}
      <div style={{
        ...DesignTokens.components.borderCard,
        padding: DesignTokens.spacing.xxl,
        marginTop: DesignTokens.spacing.xxl
      }}>
        <Title3 style={{
          fontSize: DesignTokens.typography.xxl,
          fontWeight: DesignTokens.typography.semibold,
          color: 'var(--text-primary)',
          marginBottom: DesignTokens.spacing.xl,
          fontFamily: DesignTokens.typography.fontFamily,
          display: 'flex',
          alignItems: 'center',
          gap: DesignTokens.spacing.md
        }}>
          <BookRegular style={{ fontSize: '24px', color: DesignTokens.colors.primary }} />
          Additional Resources
        </Title3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: DesignTokens.spacing.lg 
        }}>
          {[
            { name: 'API Documentation', icon: <DocumentTextRegular />, color: DesignTokens.colorVariants.indigo.base },
            { name: 'Video Library', icon: <PlayCircleRegular />, color: DesignTokens.colorVariants.emerald.base },
            { name: 'Community Forum', icon: <BookOpenRegular />, color: DesignTokens.colorVariants.amber.base },
            { name: 'Release Notes', icon: <DocumentRegular />, color: 'var(--text-secondary)' }
          ].map((resource, index) => (
            <Button
              key={index}
              appearance="outline"
              style={{
                ...DesignTokens.components.button.secondary,
                borderColor: `${resource.color}40`,
                color: resource.color,
                background: 'transparent',
                height: '64px',
                fontSize: DesignTokens.typography.sm,
                fontWeight: DesignTokens.typography.medium,
                fontFamily: DesignTokens.typography.fontFamily,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: DesignTokens.spacing.sm
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = `${resource.color}10`;
                e.currentTarget.style.borderColor = resource.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 16px ${resource.color}20`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = `${resource.color}40`;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              icon={resource.icon}
            >
              {resource.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuidesView;
