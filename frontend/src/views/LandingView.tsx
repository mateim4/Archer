import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import { PrimaryButton } from '../components/ui/PrimaryButton';
import { DesignTokens } from '../styles/designSystem';
import {
  DataBarHorizontal24Regular,
  WrenchRegular,
  BoxRegular,
  Flash24Regular,
  DocumentRegular,
  BookRegular,
  BuildingRegular,
  ChartMultipleRegular,
  DataUsageRegular
} from '@fluentui/react-icons';

const LandingView: React.FC = () => {
  const navigate = useNavigate();

  const navigationCards = [
    {
      title: 'Projects',
      description: 'Manage your infrastructure migration projects',
      icon: <DataBarHorizontal24Regular />,
      path: '/app/projects',
      color: '#6366f1'
    },
    {
      title: 'Capacity Visualizer',
      description: 'Visualize clusters, hosts and VMs capacity',
      icon: <ChartMultipleRegular />,
      path: '/capacity-visualizer',
      color: '#22c55e'
    },
    {
      title: 'Hardware Pool',
      description: 'Track and allocate hardware assets',
      icon: <WrenchRegular />,
      path: '/app/hardware-pool',
      color: '#10b981'
    },
    {
      title: 'Hardware Baskets',
      description: 'Vendor quotations and hardware catalogs',
      icon: <BoxRegular />,
      path: '/app/hardware-basket',
      color: '#8b5cf6'
    },
    {
      title: 'RVTools',
      description: 'VMware environment analysis and reporting',
      icon: <Flash24Regular />,
      path: '/app/enhanced-rvtools',
      color: '#f59e0b'
    },
    {
      title: 'Data Collection',
      description: 'Upload vendor data and analyze',
      icon: <DataUsageRegular />,
      path: '/app/data-collection',
      color: '#0ea5e9'
    },
    {
      title: 'Document Templates',
      description: 'Technical documentation and templates',
      icon: <DocumentRegular />,
      path: '/app/document-templates',
      color: '#06b6d4'
    },
    {
      title: 'Guides & Resources',
      description: 'Migration guides and best practices',
      icon: <BookRegular />,
      path: '/app/guides',
      color: '#ef4444'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div role="main" aria-label="Landing" style={{
      minHeight: '100vh',
      // Background handled by App.tsx AnimatedBackground
      display: 'flex',
      alignItems: 'flex-start',  // Changed from 'center' to prevent top clipping
      justifyContent: 'center',
      padding: '40px',
      paddingTop: '80px',  // Extra top padding to prevent clipping
      overflowY: 'auto'    // Allow scrolling if content is tall
    }}>
      <h1 style={{position:'absolute', width:0, height:0, overflow:'hidden', clip:'rect(0 0 0 0)'}}>Archer</h1>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Hero Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.40), rgba(255, 255, 255, 0.40))',
          backdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
          WebkitBackdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          padding: '32px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          cursor: 'default',
          marginBottom: '80px',
          maxWidth: '900px',
          margin: '0 auto 80px auto',
          textAlign: 'center'
        }}>
          {/* Logo + Title Integration */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '32px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
              backdropFilter: 'blur(20px)',
              fontSize: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BuildingRegular />
            </div>
            
            {/* Title */}
            <div>
              <h2 style={{
                fontSize: '52px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: 'Oxanium, sans-serif',
                lineHeight: '1.1',
                letterSpacing: '-0.02em'
              }}>
                Archer
              </h2>
              <div style={{
                height: '4px',
                background: 'linear-gradient(135deg, #8b5cf6, #9333ea)',
                borderRadius: '2px',
                marginTop: '8px',
                width: '60%'
              }} />
            </div>
          </div>

          {/* Subtitle */}
          <h2 style={{
            fontSize: '28px',
            color: 'var(--text-primary)',
            marginBottom: '20px',
            fontFamily: 'Oxanium, sans-serif',
            fontWeight: '600',
            lineHeight: '1.3',
            textAlign: 'center'
          }}>
            Lifecycle management sizing, planning and design tool
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '20px',
            color: 'var(--text-primary)',
            maxWidth: '640px',
            margin: '0 auto 40px auto',
            fontFamily: 'Oxanium, sans-serif',
            lineHeight: '1.6',
            textAlign: 'center'
          }}>
            Streamline your infrastructure lifecycle management with comprehensive 
            planning tools, hardware allocation, and migration assistance.
          </p>

          {/* Call-to-Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <PrimaryButton
              onClick={() => handleNavigate('/app/projects')}
              style={{
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '12px',
                fontFamily: 'Oxanium, sans-serif',
                height: 'auto',
                minWidth: '160px'
              }}
            >
              Start Planning
            </PrimaryButton>
            
            <button
              onClick={() => handleNavigate('/app/guides')}
              style={{
                background: 'transparent',
                color: '#6366f1',
                border: '2px solid #6366f1',
                borderRadius: '12px',
                padding: '14px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Oxanium, sans-serif'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#6366f1';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#6366f1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              View Guides
            </button>
          </div>
        </div>

        {/* Platform Features */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.40), rgba(255, 255, 255, 0.40))',
          backdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
          WebkitBackdropFilter: 'blur(30px) saturate(35%) brightness(145%) contrast(85%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.1), 0 0 40px rgba(255, 255, 255, 0.05)',
          borderRadius: '20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          cursor: 'default',
          padding: '40px',
          marginBottom: '60px',
          maxWidth: '1000px',
          margin: '0 auto 60px auto'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '32px',
            fontFamily: 'Oxanium, sans-serif',
            textAlign: 'center'
          }}>
            Platform Features
          </h2>

          {/* Navigation Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {navigationCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                role="link"
                aria-label={card.title}
                data-testid={`nav-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65))',
                  backdropFilter: 'blur(60px) saturate(220%) brightness(145%) contrast(105%)',
                  WebkitBackdropFilter: 'blur(60px) saturate(220%) brightness(145%) contrast(105%)',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  position: 'relative',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.15), 0 0 30px rgba(255, 255, 255, 0.08)',
                  padding: DesignTokens.components.standardCard.padding,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateY(-8px) scale(1.02)';
                  target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0.76))';
                  target.style.backdropFilter = 'blur(70px) saturate(240%) brightness(140%) contrast(110%)';
                  target.style.border = '1px solid rgba(255, 255, 255, 0.6)';
                  target.style.boxShadow = 'inset 0 0 25px rgba(255, 255, 255, 0.2), 0 0 50px rgba(255, 255, 255, 0.12), 0 20px 40px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.transform = 'translateY(0) scale(1)';
                  target.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(255, 255, 255, 0.65))';
                  target.style.backdropFilter = 'blur(60px) saturate(220%) brightness(145%) contrast(105%)';
                  target.style.border = '1px solid rgba(255, 255, 255, 0.4)';
                  target.style.boxShadow = 'inset 0 0 15px rgba(255, 255, 255, 0.15), 0 0 30px rgba(255, 255, 255, 0.08)';
                }}
              >
                {/* Card Header - Projects Page Style */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: DesignTokens.spacing.md,
                  marginBottom: DesignTokens.spacing.lg
                }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: '20px',
                    flexShrink: 0,
                    boxShadow: '0 3px 12px rgba(99, 102, 241, 0.3)'
                  }}>
                    {card.icon}
                  </div>
                  <h2 style={{
                    margin: 0,
                    fontFamily: DesignTokens.typography.fontFamily,
                    color: '#0f172a',
                    fontSize: DesignTokens.typography.lg,
                    fontWeight: DesignTokens.typography.semibold,
                    lineHeight: '1.2',
                    textAlign: 'left'
                  }}>
                    {card.title}
                  </h2>
                </div>

                {/* Card Description */}
                <p style={{
                  color: 'var(--text-primary)',
                  fontSize: DesignTokens.typography.sm,
                  lineHeight: '1.5',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: DesignTokens.spacing.lg,
                  flex: 1,
                  fontFamily: DesignTokens.typography.fontFamily,
                  margin: 0
                }}>
                  {card.description}
                </p>

                {/* Arrow Indicator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  marginTop: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: DesignTokens.colors.primary,
                    fontSize: DesignTokens.typography.xs,
                    fontWeight: DesignTokens.typography.medium,
                    fontFamily: DesignTokens.typography.fontFamily
                  }}>
                    <span style={{ marginRight: '8px' }}>Explore</span>
                    <span style={{ fontSize: '16px' }}>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* CSS for gradient animation */}
      <style>
        {`
          @keyframes gradientShift {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LandingView;