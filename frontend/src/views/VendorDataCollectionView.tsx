import React, { useState, useEffect } from 'react';
import { 
  CloudArrowUpRegular,
  DocumentDataRegular, 
  ServerRegular,
  SearchRegular,
  DatabaseRegular,
  SettingsRegular,
  CloudSyncRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  InfoRegular
} from '@fluentui/react-icons';
import GlassmorphicLayout from '../components/GlassmorphicLayout';
import ConsistentCard from '../components/ConsistentCard';
import ConsistentButton from '../components/ConsistentButton';
import EnhancedFileUpload from '../components/EnhancedFileUpload';

// Types
interface VendorModel {
  model_id: string;
  vendor: string;
  model_name: string;
  family: string;
  generation: string;
  form_factor: string;
  cpu_sockets: number;
  max_memory_gb: number;
  drive_bays: number;
}

interface MessageState {
  type: 'success' | 'error' | 'info';
  title: string;
  body: string;
}

interface SearchRequirements {
  workload_type: string;
  cpu_cores_minimum?: number;
  memory_gb_minimum?: number;
}

const VendorDataCollectionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'upload' | 'search' | 'basket'>('overview');
  const [selectedVendor, setSelectedVendor] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [serverModels, setServerModels] = useState<VendorModel[]>([]);
  const [searchRequirements, setSearchRequirements] = useState<SearchRequirements>({
    workload_type: 'General'
  });

  const vendors = [
    { value: '', label: 'All Vendors' },
    { value: 'Dell', label: 'Dell Technologies' },
    { value: 'HPE', label: 'Hewlett Packard Enterprise' },
    { value: 'Lenovo', label: 'Lenovo' }
  ];

  // Mock data for demonstration
  useEffect(() => {
    const mockModels: VendorModel[] = [
      {
        model_id: 'dell-r750xs',
        vendor: 'Dell',
        model_name: 'PowerEdge R750xs',
        family: 'PowerEdge',
        generation: '15th Gen',
        form_factor: 'OneU',
        cpu_sockets: 2,
        max_memory_gb: 768,
        drive_bays: 8
      },
      {
        model_id: 'hpe-dl380-gen10',
        vendor: 'HPE',
        model_name: 'ProLiant DL380 Gen10',
        family: 'ProLiant',
        generation: 'Gen10',
        form_factor: 'TwoU',
        cpu_sockets: 2,
        max_memory_gb: 1536,
        drive_bays: 12
      },
      {
        model_id: 'lenovo-sr650-v2',
        vendor: 'Lenovo',
        model_name: 'ThinkSystem SR650 V2',
        family: 'ThinkSystem',
        generation: 'V2',
        form_factor: 'OneU',
        cpu_sockets: 2,
        max_memory_gb: 1024,
        drive_bays: 10
      }
    ];
    setServerModels(mockModels);
  }, []);

  const formatFormFactor = (formFactor: string): string => {
    const mapping: { [key: string]: string } = {
      'OneU': '1U Rack',
      'TwoU': '2U Rack',
      'FourU': '4U Rack',
      'Tower': 'Tower',
      'Blade': 'Blade'
    };
    return mapping[formFactor] || formFactor;
  };

  const getStatsOverview = () => [
    { 
      title: 'Server Models', 
      value: '1,247', 
      icon: <ServerRegular />, 
      change: '+23 this week',
      color: '#0066cc'
    },
    { 
      title: 'Vendors Active', 
      value: '3', 
      icon: <DatabaseRegular />, 
      change: 'Dell, HPE, Lenovo',
      color: '#16a34a'
    },
    { 
      title: 'Configs Processed', 
      value: '89', 
      icon: <DocumentDataRegular />, 
      change: '+12 today',
      color: '#dc2626'
    },
    { 
      title: 'Last Sync', 
      value: '2 hrs ago', 
      icon: <CloudSyncRegular />, 
      change: 'All vendors current',
      color: '#7c3aed'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {getStatsOverview().map((stat, index) => (
              <ConsistentCard
                key={index}
                title={stat.value}
                subtitle={stat.title}
                icon={<div style={{ color: stat.color, fontSize: '24px' }}>{stat.icon}</div>}
                style={{ textAlign: 'center' }}
              >
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#374151'
                }}>
                  {stat.change}
                </div>
              </ConsistentCard>
            ))}
          </div>
        );

      case 'upload':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <ConsistentCard 
              title="Hardware Configuration Upload"
              subtitle="Upload vendor-specific configuration files to populate server data"
              icon={<CloudArrowUpRegular />}
            >
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '24px',
                marginTop: '24px'
              }}>
                {/* Dell Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      D
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>Dell SCP Files</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>System Configuration Profile (XML)</div>
                    </div>
                  </div>
                  <EnhancedFileUpload
                    uploadType="hardware"
                    acceptedTypes={['.xml']}
                    onFileProcessed={(result) => {
                      setMessage({
                        type: 'success',
                        title: 'Dell SCP File Processed',
                        body: `${result.name || 'File'} has been analyzed and server data extracted.`
                      });
                    }}
                    onError={(error) => {
                      setMessage({
                        type: 'error',
                        title: 'Dell SCP Processing Failed',
                        body: error
                      });
                    }}
                  />
                </div>

                {/* HPE Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #00b388 0%, #008766 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      H
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>HPE iQuote Files</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Quote files (CSV, TXT, XLS)</div>
                    </div>
                  </div>
                  <EnhancedFileUpload
                    uploadType="hardware"
                    acceptedTypes={['.csv', '.txt', '.xls', '.xlsx']}
                    onFileProcessed={(result) => {
                      setMessage({
                        type: 'success',
                        title: 'HPE iQuote File Processed',
                        body: `${result.name || 'File'} has been analyzed and server data extracted.`
                      });
                    }}
                    onError={(error) => {
                      setMessage({
                        type: 'error',
                        title: 'HPE iQuote Processing Failed',
                        body: error
                      });
                    }}
                  />
                </div>

                {/* Lenovo Upload */}
                <div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    marginBottom: '16px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #dc382d 0%, #b71c1c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      L
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: '#111827' }}>Lenovo DCSC Files</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Data Center System Configuration (XML)</div>
                    </div>
                  </div>
                  <EnhancedFileUpload
                    uploadType="hardware"
                    acceptedTypes={['.xml']}
                    onFileProcessed={(result) => {
                      setMessage({
                        type: 'success',
                        title: 'Lenovo DCSC File Processed',
                        body: `${result.name || 'File'} has been analyzed and server data extracted.`
                      });
                    }}
                    onError={(error) => {
                      setMessage({
                        type: 'error',
                        title: 'Lenovo DCSC Processing Failed',
                        body: error
                      });
                    }}
                  />
                </div>
              </div>
            </ConsistentCard>

            {/* Vendor Configuration */}
            <ConsistentCard
              title="Vendor API Configuration"
              subtitle="Configure credentials and settings for real-time vendor data access"
              icon={<SettingsRegular />}
              actions={
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ConsistentButton variant="outline" size="small">
                    Configure
                  </ConsistentButton>
                  <ConsistentButton variant="secondary" size="small" loading={loading}>
                    Test Connection
                  </ConsistentButton>
                </div>
              }
            >
              <div style={{ marginTop: '16px', color: '#6b7280', fontSize: '14px' }}>
                Configure API credentials for Dell, HPE, and Lenovo to enable real-time pricing and specification retrieval.
              </div>
            </ConsistentCard>
          </div>
        );

      case 'search':
        return (
          <ConsistentCard
            title="Configuration Search"
            subtitle="Find server configurations based on your workload requirements"
            icon={<SearchRegular />}
          >
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginTop: '24px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Workload Type
                </label>
                <select
                  value={searchRequirements.workload_type}
                  onChange={(e) => setSearchRequirements(prev => ({...prev, workload_type: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <option value="General">General Purpose</option>
                  <option value="WebServer">Web Server</option>
                  <option value="Database">Database</option>
                  <option value="Virtualization">Virtualization</option>
                  <option value="HighPerformanceComputing">HPC</option>
                  <option value="Storage">Storage</option>
                  <option value="AIMLTraining">AI/ML Training</option>
                  <option value="AIMLInference">AI/ML Inference</option>
                </select>
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Minimum CPU Cores
                </label>
                <input
                  type="number"
                  placeholder="e.g. 16"
                  value={searchRequirements.cpu_cores_minimum || ''}
                  onChange={(e) => setSearchRequirements(prev => ({
                    ...prev, 
                    cpu_cores_minimum: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#374151'
                }}>
                  Minimum Memory (GB)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 128"
                  value={searchRequirements.memory_gb_minimum || ''}
                  onChange={(e) => setSearchRequirements(prev => ({
                    ...prev, 
                    memory_gb_minimum: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>
            </div>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <ConsistentButton 
                variant="primary"
                loading={loading}
                onClick={() => {
                  setMessage({
                    type: 'info',
                    title: 'Configuration Search',
                    body: `Searching for ${searchRequirements.workload_type} configurations...`
                  });
                }}
              >
                <SearchRegular style={{ marginRight: '8px' }} />
                Search Configurations
              </ConsistentButton>
            </div>

            {/* Mock search results */}
            {searchRequirements.workload_type !== 'General' && (
              <div style={{ 
                borderTop: '1px solid rgba(0, 0, 0, 0.1)', 
                paddingTop: '24px',
                marginTop: '24px'
              }}>
                <h4 style={{ marginBottom: '16px', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                  Recommended Configurations (3)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {serverModels.slice(0, 3).map((model, index) => (
                    <div 
                      key={model.model_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.5)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ServerRegular style={{ color: '#7c3aed', fontSize: '20px' }} />
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {model.model_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Optimized for {searchRequirements.workload_type} workloads
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: '#059669',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {85 + index * 5}% Match
                        </span>
                        <ConsistentButton variant="outline" size="small">
                          View Details
                        </ConsistentButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ConsistentCard>
        );

      case 'basket':
        return (
          <ConsistentCard
            title="Hardware Basket"
            subtitle="Browse and search through available server models and configurations"
            icon={<DatabaseRegular />}
            actions={
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '6px',
                    fontSize: '12px',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  {vendors.map(vendor => (
                    <option key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </option>
                  ))}
                </select>
                <ConsistentButton variant="outline" size="small" loading={loading}>
                  <CloudSyncRegular style={{ marginRight: '4px' }} />
                  Refresh
                </ConsistentButton>
              </div>
            }
          >
            {/* Search and Filter Bar */}
            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <SearchRegular style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280',
                  fontSize: '16px'
                }} />
                <input
                  type="text"
                  placeholder="Search servers, models, or vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'rgba(255, 255, 255, 0.8)',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Server Models Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                fontSize: '14px'
              }}>
                <thead>
                  <tr style={{ 
                    background: 'rgba(0, 0, 0, 0.02)',
                    borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
                  }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Vendor</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Model</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Form Factor</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>CPU Sockets</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Max Memory</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Drive Bays</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serverModels
                    .filter(model => 
                      !selectedVendor || model.vendor === selectedVendor
                    )
                    .filter(model =>
                      !searchQuery || 
                      model.model_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      model.vendor.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((model) => (
                      <tr 
                        key={model.model_id}
                        style={{
                          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: model.vendor === 'Dell' ? 'rgba(59, 130, 246, 0.1)' :
                                       model.vendor === 'HPE' ? 'rgba(16, 185, 129, 0.1)' :
                                       'rgba(245, 158, 11, 0.1)',
                            color: model.vendor === 'Dell' ? '#2563eb' :
                                   model.vendor === 'HPE' ? '#059669' :
                                   '#d97706'
                          }}>
                            {model.vendor}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ServerRegular style={{ color: '#6b7280' }} />
                            <div>
                              <div style={{ fontWeight: '500', color: '#111827' }}>
                                {model.model_name}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {model.family} • {model.generation}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#6b7280' }}>
                          {formatFormFactor(model.form_factor)}
                        </td>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>
                          {model.cpu_sockets}
                        </td>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>
                          {model.max_memory_gb} GB
                        </td>
                        <td style={{ padding: '12px', color: '#111827', fontWeight: '500' }}>
                          {model.drive_bays}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <ConsistentButton 
                            variant="outline" 
                            size="small"
                            onClick={() => {
                              setMessage({
                                type: 'info',
                                title: 'Specifications Preview',
                                body: `Detailed specs for ${model.model_name} would be loaded from vendor API`
                              });
                            }}
                          >
                            View Specs
                          </ConsistentButton>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </ConsistentCard>
        );

      default:
        return <div>Configuration options coming soon...</div>;
    }
  };

  return (
    <GlassmorphicLayout>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '24px', color: '#7c3aed' }}>
            <CloudArrowUpRegular />
          </div>
          <div>
            <h1 style={{ margin: '0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
              Vendor Data Collection & Server Sizing
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
              Comprehensive vendor hardware management and server configuration tools
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ConsistentButton variant="outline">
            <DocumentDataRegular style={{ marginRight: '8px' }} />
            Import Catalog
          </ConsistentButton>
          <ConsistentButton variant="secondary">
            <CloudArrowUpRegular style={{ marginRight: '8px' }} />
            Export Data
          </ConsistentButton>
        </div>
      </div>
      {/* Status Message */}
      {message && (
        <ConsistentCard
          style={{
            marginBottom: '24px',
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.05)' : 
                       message.type === 'success' ? 'rgba(34, 197, 94, 0.05)' : 
                       'rgba(59, 130, 246, 0.05)',
            border: message.type === 'error' ? '1px solid rgba(239, 68, 68, 0.2)' : 
                   message.type === 'success' ? '1px solid rgba(34, 197, 94, 0.2)' : 
                   '1px solid rgba(59, 130, 246, 0.2)'
          }}
          actions={
            <ConsistentButton
              variant="ghost"
              size="small"
              onClick={() => setMessage(null)}
            >
              ×
            </ConsistentButton>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '20px' }}>
              {message.type === 'success' && <CheckmarkCircleRegular style={{ color: '#059669' }} />}
              {message.type === 'error' && <ErrorCircleRegular style={{ color: '#dc2626' }} />}
              {message.type === 'info' && <InfoRegular style={{ color: '#2563eb' }} />}
            </div>
            <div>
              <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                {message.title}
              </div>
              <div style={{ color: '#6b7280', fontSize: '14px' }}>
                {message.body}
              </div>
            </div>
          </div>
        </ConsistentCard>
      )}

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        padding: '4px',
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <DatabaseRegular /> },
          { id: 'upload', label: 'Upload', icon: <CloudArrowUpRegular /> },
          { id: 'search', label: 'Search', icon: <SearchRegular /> },
          { id: 'basket', label: 'Hardware Basket', icon: <ServerRegular /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
              color: activeTab === tab.id ? '#111827' : '#6b7280',
              boxShadow: activeTab === tab.id ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            <div style={{ fontSize: '16px' }}>{tab.icon}</div>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </GlassmorphicLayout>
  );
};

export default VendorDataCollectionView;