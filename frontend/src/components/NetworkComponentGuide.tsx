import React, { useState } from 'react';
import { 
  NETWORK_ICON_INDEX, 
  ICON_CATEGORIES, 
  TECHNOLOGY_ICON_SETS,
  getIconsByCategory,
  getTechnologyIcons,
  NetworkIcon
} from '../utils/networkIconIndex';
import AzureIcon from './AzureIcon';

const NetworkComponentGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'technologies' | 'complete'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('networking');
  const [selectedTechnology, setSelectedTechnology] = useState<'vmware' | 'hyperv' | 'azure'>('vmware');

  const renderIconCard = (icon: NetworkIcon, iconKey?: string) => (
    <div
      key={iconKey || icon.name}
      style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        border: `2px solid ${icon.borderColor || icon.color}`,
        borderRadius: '12px',
        padding: '16px',
        margin: '8px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        minWidth: '280px',
        maxWidth: '320px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 25px ${icon.color}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
        <div 
          style={{ 
            marginRight: '12px',
            background: icon.backgroundColor || `${icon.color}20`,
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AzureIcon 
            name={icon.azureIconName} 
            size={24} 
            color={icon.color}
          />
        </div>
        <div>
          <h4 style={{ 
            margin: 0, 
            color: icon.color, 
            fontSize: '16px', 
            fontWeight: '600' 
          }}>
            {icon.name}
          </h4>
          <span style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>
            {icon.category}
          </span>
        </div>
      </div>
      
      <p style={{ 
        fontSize: '14px', 
        color: 'var(--text-primary)', 
        marginBottom: '12px',
        lineHeight: '1.4'
      }}>
        {icon.description}
      </p>
      
      <div style={{ marginBottom: '8px' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: 'var(--text-secondary)',
          marginBottom: '4px',
          display: 'block'
        }}>
          Use Cases:
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {icon.useCases.slice(0, 3).map((useCase, index) => (
            <span
              key={index}
              style={{
                fontSize: '11px',
                background: `${icon.color}15`,
                color: icon.color,
                padding: '2px 6px',
                borderRadius: '4px',
                border: `1px solid ${icon.color}30`
              }}
            >
              {useCase}
            </span>
          ))}
          {icon.useCases.length > 3 && (
            <span style={{ fontSize: '11px', color: '#9ca3af' }}>
              +{icon.useCases.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderCategoryView = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {Object.keys(ICON_CATEGORIES).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '8px 16px',
              border: selectedCategory === category ? '2px solid #8b5cf6' : '1px solid #d1d5db',
              borderRadius: '8px',
              background: selectedCategory === category ? 'rgba(139, 92, 246, 0.1)' : 'white',
              color: selectedCategory === category ? '#8b5cf6' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              textTransform: 'capitalize',
              transition: 'all 0.2s ease'
            }}
          >
            {category}
          </button>
        ))}
      </div>
      
      <h3 style={{ 
        color: 'var(--text-primary)', 
        marginBottom: '16px',
        textTransform: 'capitalize',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        {selectedCategory} Components
      </h3>
      
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px',
        justifyContent: 'flex-start'
      }}>
        {getIconsByCategory(selectedCategory).map((icon, index) => 
          renderIconCard(icon, `${selectedCategory}-${index}`)
        )}
      </div>
    </div>
  );

  const renderTechnologyView = () => {
    const techIcons = getTechnologyIcons(selectedTechnology);
    
    return (
      <div>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px'
        }}>
          {(['vmware', 'hyperv', 'azure'] as const).map(tech => (
            <button
              key={tech}
              onClick={() => setSelectedTechnology(tech)}
              style={{
                padding: '12px 20px',
                border: selectedTechnology === tech ? '2px solid #8b5cf6' : '1px solid #d1d5db',
                borderRadius: '10px',
                background: selectedTechnology === tech ? 'rgba(139, 92, 246, 0.1)' : 'white',
                color: selectedTechnology === tech ? '#8b5cf6' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'uppercase',
                transition: 'all 0.2s ease'
              }}
            >
              {tech === 'vmware' ? 'VMware vSphere' : tech === 'hyperv' ? 'Microsoft Hyper-V' : 'Microsoft Azure'}
            </button>
          ))}
        </div>
        
        <h3 style={{ 
          color: 'var(--text-primary)', 
          marginBottom: '16px',
          fontSize: '20px',
          fontWeight: '600'
        }}>
          {selectedTechnology === 'vmware' ? 'VMware vSphere' : 
           selectedTechnology === 'hyperv' ? 'Microsoft Hyper-V' : 
           'Microsoft Azure'} Components
        </h3>
        
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px',
          justifyContent: 'flex-start'
        }}>
          {Object.entries(techIcons).map(([key, icon]) => 
            renderIconCard(icon, `${selectedTechnology}-${key}`)
          )}
        </div>
        
        {/* Technology-specific information */}
        <div style={{
          marginTop: '32px',
          padding: '20px',
          background: 'rgba(139, 92, 246, 0.05)',
          border: '1px solid rgba(139, 92, 246, 0.2)',
          borderRadius: '12px'
        }}>
          <h4 style={{ color: '#8b5cf6', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
            Technology Overview
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            {selectedTechnology === 'vmware' && 
              'VMware vSphere provides enterprise-class virtualization with features like vMotion, DRS, HA, and distributed switching. The diagram includes vCenter management, ESXi hosts, distributed virtual switches, port groups, VMkernel interfaces, and physical NICs.'
            }
            {selectedTechnology === 'hyperv' && 
              'Microsoft Hyper-V delivers Windows Server virtualization with Failover Clustering, Live Migration, and System Center Virtual Machine Manager. The diagram shows SCVMM management, Hyper-V hosts, virtual switches (External, Internal, Private), and Cluster Shared Volumes.'
            }
            {selectedTechnology === 'azure' && 
              'Microsoft Azure provides cloud infrastructure services including Virtual Networks, Virtual Machines, Load Balancers, Application Gateways, and comprehensive security services. The diagram represents Azure networking components and security boundaries.'
            }
          </p>
        </div>
      </div>
    );
  };

  const renderCompleteView = () => (
    <div>
      <h3 style={{ 
        color: 'var(--text-primary)', 
        marginBottom: '24px',
        fontSize: '20px',
        fontWeight: '600'
      }}>
        Complete Network Component Library
      </h3>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(NETWORK_ICON_INDEX).map(([key, icon]) => 
          renderIconCard(icon, key)
        )}
      </div>
      
      <div style={{
        marginTop: '32px',
        padding: '20px',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '12px'
      }}>
        <h4 style={{ color: '#3b82f6', marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
          Icon Library Information
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Total Icons:</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>{Object.keys(NETWORK_ICON_INDEX).length}</span>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Categories:</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>{Object.keys(ICON_CATEGORIES).length}</span>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Technologies:</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>VMware, Hyper-V, Azure</span>
          </div>
          <div>
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>Source:</span>
            <span style={{ marginLeft: '8px', color: 'var(--text-secondary)' }}>Microsoft Azure Stencils</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      margin: '16px 0'
    }}>
      <h2 style={{ 
        color: 'var(--text-primary)', 
        marginBottom: '24px', 
        fontSize: '24px', 
        fontWeight: '700' 
      }}>
        Network Component & Icon Guide
      </h2>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '32px',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        {[
          { id: 'categories', label: 'By Category' },
          { id: 'technologies', label: 'By Technology' },
          { id: 'complete', label: 'Complete Library' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              color: activeTab === tab.id ? '#8b5cf6' : 'var(--text-secondary)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && renderCategoryView()}
      {activeTab === 'technologies' && renderTechnologyView()}
      {activeTab === 'complete' && renderCompleteView()}
    </div>
  );
};

export default NetworkComponentGuide;
