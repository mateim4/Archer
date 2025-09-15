import React from 'react';
import { useNavigate } from 'react-router-dom';
import GlassmorphicLayout from '../components/GlassmorphicLayout';

const LandingView: React.FC = () => {
  const navigate = useNavigate();

  const navigationCards = [
    {
      title: 'Projects',
      description: 'Manage your infrastructure migration projects',
      icon: '📊',
      path: '/app/projects',
      color: '#6366f1'
    },
    {
      title: 'Hardware Pool',
      description: 'Track and allocate hardware assets',
      icon: '🔧',
      path: '/app/hardware-pool',
      color: '#10b981'
    },
    {
      title: 'Hardware Baskets',
      description: 'Vendor quotations and hardware catalogs',
      icon: '📦',
      path: '/app/hardware-basket',
      color: '#8b5cf6'
    },
    {
      title: 'Enhanced RVTools',
      description: 'VMware environment analysis and reporting',
      icon: '⚡',
      path: '/app/enhanced-rvtools',
      color: '#f59e0b'
    },
    {
      title: 'Document Templates',
      description: 'Technical documentation and templates',
      icon: '📄',
      path: '/app/document-templates',
      color: '#06b6d4'
    },
    {
      title: 'Guides & Resources',
      description: 'Migration guides and best practices',
      icon: '📚',
      path: '/app/guides',
      color: '#ef4444'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 25%, #f8fafc 50%, #f0f9ff 75%, #fafbff 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '1200px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Hero Section */}
        <div style={{
          marginBottom: '80px',
          maxWidth: '800px',
          margin: '0 auto 80px auto'
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
              🏗️
            </div>
            
            {/* Title */}
            <div>
              <h1 style={{
                fontSize: '52px',
                fontWeight: '800',
                color: '#1f2937',
                margin: 0,
                fontFamily: 'Montserrat, sans-serif',
                lineHeight: '1.1',
                letterSpacing: '-0.02em'
              }}>
                LCM<span style={{ color: '#6366f1' }}>Designer</span>
              </h1>
              <div style={{
                height: '4px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                borderRadius: '2px',
                marginTop: '8px',
                width: '60%'
              }} />
            </div>
          </div>

          {/* Subtitle */}
          <h2 style={{
            fontSize: '28px',
            color: '#374151',
            marginBottom: '20px',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: '600',
            lineHeight: '1.3',
            textAlign: 'center'
          }}>
            Lifecycle management sizing, planning and design tool
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '20px',
            color: '#6b7280',
            maxWidth: '640px',
            margin: '0 auto 40px auto',
            fontFamily: 'Montserrat, sans-serif',
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
            <button
              onClick={() => handleNavigate('/app/projects')}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
              }}
            >
              Start Planning
            </button>
            
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
                fontFamily: 'Montserrat, sans-serif'
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
          background: 'rgba(255, 255, 255, 0.85)',
          borderRadius: '24px',
          padding: '40px',
          marginBottom: '60px',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px) saturate(180%)',
          maxWidth: '1000px',
          margin: '0 auto 60px auto'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#1f2937',
            marginBottom: '32px',
            fontFamily: 'Montserrat, sans-serif',
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
              <div
                key={index}
                onClick={() => handleNavigate(card.path)}
                style={{
                  background: 'transparent',
                  borderRadius: '16px',
                  padding: '24px',
                  border: `2px solid ${card.color}40`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = `${card.color}`;
                  e.currentTarget.style.boxShadow = `0 8px 25px ${card.color}20`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = `${card.color}40`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Card Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '28px',
                    marginRight: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    border: `2px solid ${card.color}40`,
                    color: card.color
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#1f2937',
                      margin: 0,
                      fontFamily: 'Montserrat, sans-serif'
                    }}>
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Card Description */}
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0,
                  fontFamily: 'Montserrat, sans-serif',
                  lineHeight: '1.5'
                }}>
                  {card.description}
                </p>

                {/* Arrow Indicator */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginTop: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: card.color,
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Montserrat, sans-serif'
                  }}>
                    <span style={{ marginRight: '8px' }}>Explore</span>
                    <span style={{ fontSize: '16px' }}>→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '60px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            fontFamily: 'Montserrat, sans-serif',
            margin: 0
          }}>
            Designed for enterprise infrastructure teams • Built with modern web technologies
          </p>
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