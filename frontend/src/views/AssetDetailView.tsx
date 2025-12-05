/**
 * AssetDetailView Component
 * 
 * Full-page asset/CMDB item detail view with tabbed layout.
 * Header: Asset name, type badge, status indicator, quick actions
 * Tabs: Overview, Metrics, Dependencies, Tickets, History
 * 
 * Part of Phase 3: Page Redesigns - Asset Detail View
 * Spec Reference: UI UX Specification Sheet - Section 6.4 Asset Detail
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRegular,
  EditRegular,
  MoreHorizontalRegular,
  ServerRegular,
  DesktopRegular,
  CubeRegular,
  RouterRegular,
  DatabaseRegular,
  CloudRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  ErrorCircleRegular,
  InfoRegular,
  LinkRegular,
  HistoryRegular,
  DocumentRegular,
  TagRegular,
  CalendarRegular,
  PersonRegular,
  ArrowTrendingRegular,
  ShieldCheckmarkRegular,
  AlertRegular,
  OpenRegular,
  CopyRegular,
  DeleteRegular,
  SettingsRegular,
  PowerRegular,
  ArrowSyncRegular,
  ChartMultipleRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  LinkedAssetBadge,
  SLAIndicator,
} from '../components/ui';
import type { AssetType, AssetStatus } from '../components/ui';
import { DesignTokens } from '../styles/designSystem';

// Asset detail interface
interface AssetDetail {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  description?: string;
  ipAddress?: string;
  fqdn?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  location?: string;
  datacenter?: string;
  rack?: string;
  owner?: string;
  team?: string;
  environment?: 'production' | 'staging' | 'development' | 'test';
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  lastDiscoveredAt?: string;
  // Resource utilization
  metrics?: {
    cpu?: { current: number; average: number; peak: number };
    memory?: { current: number; average: number; peak: number; total: number };
    storage?: { used: number; total: number; iops?: number };
    network?: { inbound: number; outbound: number };
  };
  // Dependencies
  dependencies?: {
    upstream: Array<{ id: string; name: string; type: AssetType; status: AssetStatus; relationship: string }>;
    downstream: Array<{ id: string; name: string; type: AssetType; status: AssetStatus; relationship: string }>;
  };
  // Related tickets
  relatedTickets?: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  // Configuration history
  history?: Array<{
    id: string;
    type: 'change' | 'discovery' | 'alert' | 'maintenance';
    description: string;
    user?: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
  // Software/services
  software?: Array<{
    name: string;
    version: string;
    vendor?: string;
    status: 'compliant' | 'non-compliant' | 'unknown';
  }>;
}

// Mock data for demonstration
const mockAssetDetail: AssetDetail = {
  id: 'nx-cluster-prod-01',
  name: 'NX-Cluster-Prod-01',
  type: 'CLUSTER',
  status: 'warning',
  description: 'Primary production Nutanix cluster hosting critical workloads including databases, application servers, and file services.',
  ipAddress: '10.0.1.100',
  fqdn: 'nx-cluster-prod-01.company.local',
  manufacturer: 'Nutanix',
  model: 'NX-8035-G7',
  serialNumber: 'NX8035G7-2024-001',
  location: 'Building A, Floor 2',
  datacenter: 'DC-EAST-01',
  rack: 'R-A2-15',
  owner: 'John Smith',
  team: 'Infrastructure Operations',
  environment: 'production',
  criticality: 'critical',
  tags: ['production', 'nutanix', 'hyperconverged', 'tier-1'],
  createdAt: '2023-01-15T09:00:00Z',
  updatedAt: '2024-12-04T11:30:00Z',
  lastDiscoveredAt: '2024-12-04T06:00:00Z',
  metrics: {
    cpu: { current: 72, average: 65, peak: 95 },
    memory: { current: 78, average: 70, peak: 88, total: 512 },
    storage: { used: 85, total: 100, iops: 15000 },
    network: { inbound: 2.4, outbound: 1.8 },
  },
  dependencies: {
    upstream: [
      { id: 'switch-core-01', name: 'Core-Switch-01', type: 'SWITCH', status: 'healthy', relationship: 'network_connection' },
      { id: 'switch-core-02', name: 'Core-Switch-02', type: 'SWITCH', status: 'healthy', relationship: 'network_connection' },
    ],
    downstream: [
      { id: 'vm-db-prod-01', name: 'DB-Prod-Primary', type: 'VM', status: 'healthy', relationship: 'hosts' },
      { id: 'vm-db-prod-02', name: 'DB-Prod-Replica', type: 'VM', status: 'healthy', relationship: 'hosts' },
      { id: 'vm-app-prod-01', name: 'App-Server-01', type: 'VM', status: 'warning', relationship: 'hosts' },
      { id: 'vm-app-prod-02', name: 'App-Server-02', type: 'VM', status: 'healthy', relationship: 'hosts' },
      { id: 'vm-file-prod-01', name: 'File-Server-01', type: 'VM', status: 'healthy', relationship: 'hosts' },
    ],
  },
  relatedTickets: [
    { id: 'INC-2024-001', title: 'Production Database Connection Pool Exhaustion', type: 'INCIDENT', status: 'IN_PROGRESS', priority: 'P1', createdAt: '2024-12-04T08:30:00Z' },
    { id: 'CHG-2024-015', title: 'Scheduled firmware update for NX cluster', type: 'CHANGE', status: 'APPROVED', priority: 'P3', createdAt: '2024-12-01T10:00:00Z' },
    { id: 'INC-2024-003', title: 'High memory utilization alert', type: 'INCIDENT', status: 'RESOLVED', priority: 'P2', createdAt: '2024-11-28T14:00:00Z' },
  ],
  history: [
    { id: 'hist-1', type: 'alert', description: 'Memory utilization exceeded 75% threshold', timestamp: '2024-12-04T11:30:00Z' },
    { id: 'hist-2', type: 'discovery', description: 'Asset rediscovered with updated configuration', user: 'System', timestamp: '2024-12-04T06:00:00Z' },
    { id: 'hist-3', type: 'change', description: 'Updated firmware to version 6.5.2', user: 'John Smith', timestamp: '2024-12-01T22:00:00Z' },
    { id: 'hist-4', type: 'maintenance', description: 'Scheduled maintenance window completed', user: 'Jane Doe', timestamp: '2024-11-30T04:00:00Z' },
    { id: 'hist-5', type: 'alert', description: 'Storage IOPS spike detected', timestamp: '2024-11-28T15:30:00Z' },
  ],
  software: [
    { name: 'Nutanix AOS', version: '6.5.2', vendor: 'Nutanix', status: 'compliant' },
    { name: 'Nutanix Prism', version: '2023.3', vendor: 'Nutanix', status: 'compliant' },
    { name: 'AHV Hypervisor', version: '20230302.100041', vendor: 'Nutanix', status: 'compliant' },
  ],
};

type TabId = 'overview' | 'metrics' | 'dependencies' | 'tickets' | 'history';

const AssetDetailView: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Load asset data
  useEffect(() => {
    const loadAsset = async () => {
      setIsLoading(true);
      try {
        // In production, this would fetch from API
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
        setAsset(mockAssetDetail);
      } catch (error) {
        console.error('Failed to load asset:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadAsset();
  }, [assetId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getAssetIcon = (type: AssetType) => {
    const iconStyle = { fontSize: '24px' };
    switch (type) {
      case 'CLUSTER': return <CubeRegular style={iconStyle} />;
      case 'HOST': return <ServerRegular style={iconStyle} />;
      case 'VM': return <DesktopRegular style={iconStyle} />;
      case 'SWITCH': return <RouterRegular style={iconStyle} />;
      case 'NETWORK': return <RouterRegular style={iconStyle} />;
      default: return <ServerRegular style={iconStyle} />;
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusIcon = (status: AssetStatus) => {
    switch (status) {
      case 'healthy': return <CheckmarkCircleRegular />;
      case 'warning': return <WarningRegular />;
      case 'critical': return <ErrorCircleRegular />;
      default: return <InfoRegular />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return '#ef4444';
      case 'P2': return '#f59e0b';
      case 'P3': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const getEnvironmentColor = (env?: string) => {
    switch (env) {
      case 'production': return '#ef4444';
      case 'staging': return '#f59e0b';
      case 'development': return '#3b82f6';
      case 'test': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const getCriticalityColor = (crit?: string) => {
    switch (crit) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return 'var(--text-secondary)';
    }
  };

  const getHistoryIcon = (type: string) => {
    switch (type) {
      case 'change': return <EditRegular />;
      case 'discovery': return <ArrowSyncRegular />;
      case 'alert': return <AlertRegular />;
      case 'maintenance': return <SettingsRegular />;
      default: return <HistoryRegular />;
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        ...DesignTokens.components.pageContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ marginBottom: '16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ 
        ...DesignTokens.components.pageContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <PurpleGlassCard style={{ padding: '48px', textAlign: 'center' }}>
          <ErrorCircleRegular style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Asset Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            The asset you're looking for doesn't exist or has been removed.
          </p>
          <PurpleGlassButton onClick={() => navigate('/app/inventory')}>
            <ArrowLeftRegular style={{ marginRight: '8px' }} />
            Back to Inventory
          </PurpleGlassButton>
        </PurpleGlassCard>
      </div>
    );
  }

  // Styles
  const containerStyle: React.CSSProperties = {
    ...DesignTokens.components.pageContainer,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  };

  const metricCardStyle: React.CSSProperties = {
    padding: '20px',
    background: 'var(--card-bg)',
    borderRadius: '12px',
    textAlign: 'center',
  };

  const metricLabelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 500,
    textTransform: 'uppercase',
    marginBottom: '8px',
  };

  const metricValueStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontSize: '28px',
    fontWeight: 700,
  };

  const infoRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid var(--divider-color)',
  };

  const infoLabelStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const infoValueStyle: React.CSSProperties = {
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 500,
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
    color: 'var(--text-primary)',
    fontSize: '16px',
    fontWeight: 600,
  };

  return (
    <div data-testid="asset-detail-view" style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <PurpleGlassButton 
          variant="ghost" 
          onClick={() => navigate('/app/inventory')}
          style={{ padding: '8px', marginTop: '4px' }}
        >
          <ArrowLeftRegular style={{ fontSize: '20px' }} />
        </PurpleGlassButton>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${getStatusColor(asset.status)}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: getStatusColor(asset.status),
            }}>
              {getAssetIcon(asset.type)}
            </div>
            <div>
              <h1 style={{ 
                fontSize: '24px', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {asset.name}
              </h1>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginTop: '4px',
              }}>
                <span style={{
                  padding: '2px 8px',
                  background: 'var(--btn-secondary-bg)',
                  color: '#6B4CE6',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}>
                  {asset.type}
                </span>
                <span style={{
                  padding: '2px 8px',
                  background: `${getStatusColor(asset.status)}20`,
                  color: getStatusColor(asset.status),
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  {getStatusIcon(asset.status)}
                  {asset.status.toUpperCase()}
                </span>
                {asset.environment && (
                  <span style={{
                    padding: '2px 8px',
                    background: `${getEnvironmentColor(asset.environment)}20`,
                    color: getEnvironmentColor(asset.environment),
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {asset.environment.toUpperCase()}
                  </span>
                )}
                {asset.criticality && (
                  <span style={{
                    padding: '2px 8px',
                    background: `${getCriticalityColor(asset.criticality)}20`,
                    color: getCriticalityColor(asset.criticality),
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {asset.criticality.toUpperCase()} CRITICALITY
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <PurpleGlassButton variant="ghost" title="Remote Console">
            <OpenRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" title="Copy ID">
            <CopyRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" title="Settings">
            <SettingsRegular />
          </PurpleGlassButton>
          <PurpleGlassButton variant="ghost" title="More actions">
            <MoreHorizontalRegular />
          </PurpleGlassButton>
        </div>
      </div>

      {/* Tabs */}
      <PurpleGlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid var(--divider-color)',
        }}>
          <button 
            className="btn-tab" 
            data-active={activeTab === 'overview' || undefined}
            onClick={() => setActiveTab('overview')}
          >
            <InfoRegular style={{ marginRight: '8px' }} />
            Overview
          </button>
          <button 
            className="btn-tab" 
            data-active={activeTab === 'metrics' || undefined}
            onClick={() => setActiveTab('metrics')}
          >
            <ChartMultipleRegular style={{ marginRight: '8px' }} />
            Metrics
          </button>
          <button 
            className="btn-tab" 
            data-active={activeTab === 'dependencies' || undefined}
            onClick={() => setActiveTab('dependencies')}
          >
            <LinkRegular style={{ marginRight: '8px' }} />
            Dependencies ({(asset.dependencies?.upstream.length || 0) + (asset.dependencies?.downstream.length || 0)})
          </button>
          <button 
            className="btn-tab" 
            data-active={activeTab === 'tickets' || undefined}
            onClick={() => setActiveTab('tickets')}
          >
            <DocumentRegular style={{ marginRight: '8px' }} />
            Tickets ({asset.relatedTickets?.length || 0})
          </button>
          <button 
            className="btn-tab" 
            data-active={activeTab === 'history' || undefined}
            onClick={() => setActiveTab('history')}
          >
            <HistoryRegular style={{ marginRight: '8px' }} />
            History
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Left Column - Details */}
              <div>
                <div style={sectionHeaderStyle}>
                  <ServerRegular />
                  Asset Information
                </div>
                {asset.description && (
                  <p style={{ 
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    lineHeight: 1.6,
                    marginBottom: '20px',
                  }}>
                    {asset.description}
                  </p>
                )}
                <div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>IP Address</span>
                    <span style={{ ...infoValueStyle, fontFamily: 'monospace' }}>{asset.ipAddress}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>FQDN</span>
                    <span style={{ ...infoValueStyle, fontFamily: 'monospace' }}>{asset.fqdn}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>Manufacturer</span>
                    <span style={infoValueStyle}>{asset.manufacturer}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>Model</span>
                    <span style={infoValueStyle}>{asset.model}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>Serial Number</span>
                    <span style={{ ...infoValueStyle, fontFamily: 'monospace' }}>{asset.serialNumber}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>Location</span>
                    <span style={infoValueStyle}>{asset.location}</span>
                  </div>
                  <div style={infoRowStyle}>
                    <span style={infoLabelStyle}>Datacenter / Rack</span>
                    <span style={infoValueStyle}>{asset.datacenter} / {asset.rack}</span>
                  </div>
                  <div style={{ ...infoRowStyle, borderBottom: 'none' }}>
                    <span style={infoLabelStyle}>
                      <PersonRegular /> Owner / Team
                    </span>
                    <span style={infoValueStyle}>{asset.owner} / {asset.team}</span>
                  </div>
                </div>

                {/* Tags */}
                {asset.tags && asset.tags.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={sectionHeaderStyle}>
                      <TagRegular />
                      Tags
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {asset.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '4px 12px',
                            background: 'var(--btn-secondary-bg)',
                            color: '#6B4CE6',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 500,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Quick Metrics & Software */}
              <div>
                {/* Quick Metrics */}
                {asset.metrics && (
                  <div style={{ marginBottom: '24px' }}>
                    <div style={sectionHeaderStyle}>
                      <ChartMultipleRegular />
                      Current Utilization
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      {asset.metrics.cpu && (
                        <div style={metricCardStyle}>
                          <div style={metricLabelStyle}>CPU</div>
                          <div style={{ 
                            ...metricValueStyle, 
                            color: asset.metrics.cpu.current > 80 ? '#ef4444' : 
                                   asset.metrics.cpu.current > 60 ? '#f59e0b' : '#10b981'
                          }}>
                            {asset.metrics.cpu.current}%
                          </div>
                        </div>
                      )}
                      {asset.metrics.memory && (
                        <div style={metricCardStyle}>
                          <div style={metricLabelStyle}>Memory</div>
                          <div style={{ 
                            ...metricValueStyle,
                            color: asset.metrics.memory.current > 80 ? '#ef4444' : 
                                   asset.metrics.memory.current > 60 ? '#f59e0b' : '#10b981'
                          }}>
                            {asset.metrics.memory.current}%
                          </div>
                        </div>
                      )}
                      {asset.metrics.storage && (
                        <div style={metricCardStyle}>
                          <div style={metricLabelStyle}>Storage</div>
                          <div style={{ 
                            ...metricValueStyle,
                            color: asset.metrics.storage.used > 80 ? '#ef4444' : 
                                   asset.metrics.storage.used > 60 ? '#f59e0b' : '#10b981'
                          }}>
                            {asset.metrics.storage.used}%
                          </div>
                        </div>
                      )}
                      {asset.metrics.network && (
                        <div style={metricCardStyle}>
                          <div style={metricLabelStyle}>Network I/O</div>
                          <div style={metricValueStyle}>
                            {asset.metrics.network.inbound}G
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Software */}
                {asset.software && asset.software.length > 0 && (
                  <div>
                    <div style={sectionHeaderStyle}>
                      <ShieldCheckmarkRegular />
                      Software & Services
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {asset.software.map((sw, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px 16px',
                            background: 'var(--card-bg)',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                              {sw.name}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              {sw.vendor} • v{sw.version}
                            </div>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            background: sw.status === 'compliant' ? '#10b98120' : 
                                       sw.status === 'non-compliant' ? '#ef444420' : '#6b728020',
                            color: sw.status === 'compliant' ? '#10b981' : 
                                  sw.status === 'non-compliant' ? '#ef4444' : 'var(--text-secondary)',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            {sw.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && asset.metrics && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {asset.metrics.cpu && (
                  <PurpleGlassCard style={{ padding: '20px' }}>
                    <div style={metricLabelStyle}>CPU Utilization</div>
                    <div style={{ ...metricValueStyle, marginBottom: '12px' }}>{asset.metrics.cpu.current}%</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>Avg: {asset.metrics.cpu.average}%</span>
                      <span>Peak: {asset.metrics.cpu.peak}%</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--divider-color-subtle)',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${asset.metrics.cpu.current}%`,
                        background: asset.metrics.cpu.current > 80 ? '#ef4444' : 
                                   asset.metrics.cpu.current > 60 ? '#f59e0b' : '#10b981',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </PurpleGlassCard>
                )}
                {asset.metrics.memory && (
                  <PurpleGlassCard style={{ padding: '20px' }}>
                    <div style={metricLabelStyle}>Memory Utilization</div>
                    <div style={{ ...metricValueStyle, marginBottom: '12px' }}>{asset.metrics.memory.current}%</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{Math.round(asset.metrics.memory.total * asset.metrics.memory.current / 100)} / {asset.metrics.memory.total} GB</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--divider-color-subtle)',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${asset.metrics.memory.current}%`,
                        background: asset.metrics.memory.current > 80 ? '#ef4444' : 
                                   asset.metrics.memory.current > 60 ? '#f59e0b' : '#10b981',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </PurpleGlassCard>
                )}
                {asset.metrics.storage && (
                  <PurpleGlassCard style={{ padding: '20px' }}>
                    <div style={metricLabelStyle}>Storage Usage</div>
                    <div style={{ ...metricValueStyle, marginBottom: '12px' }}>{asset.metrics.storage.used}%</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{asset.metrics.storage.used} / {asset.metrics.storage.total} TB</span>
                    </div>
                    <div style={{
                      height: '8px',
                      background: 'var(--divider-color-subtle)',
                      borderRadius: '4px',
                      marginTop: '8px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${asset.metrics.storage.used}%`,
                        background: asset.metrics.storage.used > 80 ? '#ef4444' : 
                                   asset.metrics.storage.used > 60 ? '#f59e0b' : '#10b981',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </PurpleGlassCard>
                )}
                {asset.metrics.network && (
                  <PurpleGlassCard style={{ padding: '20px' }}>
                    <div style={metricLabelStyle}>Network I/O</div>
                    <div style={{ ...metricValueStyle, marginBottom: '12px' }}>{asset.metrics.network.inbound}Gbps</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>↓ In: {asset.metrics.network.inbound}G</span>
                      <span>↑ Out: {asset.metrics.network.outbound}G</span>
                    </div>
                  </PurpleGlassCard>
                )}
              </div>
              
              {/* Placeholder for charts */}
              <PurpleGlassCard style={{ padding: '40px', textAlign: 'center' }}>
                <ChartMultipleRegular style={{ fontSize: '48px', color: 'var(--text-muted)', marginBottom: '16px' }} />
                <p style={{ color: 'var(--text-muted)' }}>
                  Historical metrics charts would be displayed here.<br />
                  Integration with monitoring backend required.
                </p>
              </PurpleGlassCard>
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'dependencies' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Upstream */}
              <div>
                <div style={sectionHeaderStyle}>
                  <ArrowTrendingRegular style={{ transform: 'rotate(180deg)' }} />
                  Upstream Dependencies ({asset.dependencies?.upstream.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {asset.dependencies?.upstream.map(dep => (
                    <div
                      key={dep.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/app/inventory/asset/${dep.id}`)}
                    >
                      <LinkedAssetBadge
                        assetId={dep.id}
                        assetName={dep.name}
                        assetType={dep.type}
                        status={dep.status}
                      />
                      <div style={{ 
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        Relationship: {dep.relationship.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                  {(!asset.dependencies?.upstream || asset.dependencies.upstream.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      No upstream dependencies
                    </p>
                  )}
                </div>
              </div>

              {/* Downstream */}
              <div>
                <div style={sectionHeaderStyle}>
                  <ArrowTrendingRegular />
                  Downstream Dependencies ({asset.dependencies?.downstream.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {asset.dependencies?.downstream.map(dep => (
                    <div
                      key={dep.id}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--card-bg)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/app/inventory/asset/${dep.id}`)}
                    >
                      <LinkedAssetBadge
                        assetId={dep.id}
                        assetName={dep.name}
                        assetType={dep.type}
                        status={dep.status}
                      />
                      <div style={{ 
                        marginTop: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}>
                        Relationship: {dep.relationship.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                  {(!asset.dependencies?.downstream || asset.dependencies.downstream.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                      No downstream dependencies
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {asset.relatedTickets?.map(ticket => (
                <div
                  key={ticket.id}
                  style={{
                    padding: '16px',
                    background: 'var(--card-bg)',
                    borderRadius: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/app/service-desk/ticket/${ticket.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px',
                      }}>
                        <span style={{ 
                          fontSize: '12px', 
                          fontFamily: 'monospace',
                          color: 'var(--text-muted)',
                        }}>
                          {ticket.id}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          background: 'var(--btn-secondary-bg)',
                          color: '#6B4CE6',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}>
                          {ticket.type}
                        </span>
                        <span style={{
                          padding: '2px 6px',
                          background: `${getPriorityColor(ticket.priority)}20`,
                          color: getPriorityColor(ticket.priority),
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600,
                        }}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 style={{ 
                        margin: 0,
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}>
                        {ticket.title}
                      </h4>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      background: ticket.status === 'IN_PROGRESS' ? '#8b5cf620' :
                                 ticket.status === 'RESOLVED' ? '#10b98120' :
                                 ticket.status === 'APPROVED' ? '#10b98120' : '#3b82f620',
                      color: ticket.status === 'IN_PROGRESS' ? '#8b5cf6' :
                            ticket.status === 'RESOLVED' ? '#10b981' :
                            ticket.status === 'APPROVED' ? '#10b981' : '#3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ 
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}>
                    Created {formatRelativeTime(ticket.createdAt)}
                  </div>
                </div>
              ))}
              {(!asset.relatedTickets || asset.relatedTickets.length === 0) && (
                <div style={{ 
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <DocumentRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>No related tickets found for this asset.</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {asset.history?.map((entry, i) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px 0',
                    borderBottom: i < (asset.history?.length || 0) - 1 
                      ? '1px solid var(--divider-color-subtle)' 
                      : 'none',
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: entry.type === 'alert' ? '#ef444420' :
                               entry.type === 'change' ? '#3b82f620' :
                               entry.type === 'maintenance' ? '#f59e0b20' : '#6B4CE620',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: entry.type === 'alert' ? '#ef4444' :
                          entry.type === 'change' ? '#3b82f6' :
                          entry.type === 'maintenance' ? '#f59e0b' : '#6B4CE6',
                    flexShrink: 0,
                  }}>
                    {getHistoryIcon(entry.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}>
                      {entry.description}
                    </div>
                    <div style={{ 
                      display: 'flex',
                      gap: '12px',
                      marginTop: '4px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}>
                      {entry.user && <span>{entry.user}</span>}
                      <span>{formatDate(entry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {(!asset.history || asset.history.length === 0) && (
                <div style={{ 
                  padding: '40px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}>
                  <HistoryRegular style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>No history available for this asset.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </PurpleGlassCard>
    </div>
  );
};

export default AssetDetailView;
