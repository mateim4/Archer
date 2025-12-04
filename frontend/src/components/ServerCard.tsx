import React, { useState } from 'react';
import { 
  ServerRegular,
  LocationRegular,
  CalendarRegular,
  EditRegular,
  DeleteRegular,
  MoreHorizontalRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  SettingsRegular,
  ErrorCircleRegular,
  InfoRegular
} from '@fluentui/react-icons';
import { tokens, colors } from '@/styles/design-tokens';

interface HardwareSpecifications {
  processor: {
    model: string;
    cores: number;
    threads?: number;
    speed_ghz?: number;
  };
  memory: {
    total_gb: number;
    type?: string;
    speed?: string;
  };
  storage: {
    total_capacity: string;
    type?: string;
    drives?: number;
  };
  network: {
    ports?: number;
    speed?: string;
    type?: string;
  };
  form_factor: string;
}

interface ServerInventory {
  id: string;
  model_name: string;
  vendor: string;
  specifications: HardwareSpecifications;
  status: 'available' | 'in_use' | 'maintenance' | 'decommissioned';
  location: string;
  assigned_project?: string;
  assigned_activity?: string;
  source: 'rvtools' | 'manual' | 'hardware_basket';
  purchase_date?: Date;
  warranty_end?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface ServerCardProps {
  server: ServerInventory;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showActions?: boolean;
  isSelected?: boolean;
  onSelect?: (serverId: string) => void;
}

const ServerCard: React.FC<ServerCardProps> = ({ 
  server, 
  onClick, 
  onEdit, 
  onDelete, 
  showActions = true,
  isSelected = false,
  onSelect
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': 
        return <CheckmarkCircleRegular style={{ color: tokens.componentSemantics.icon.success, fontSize: '16px' }} />;
      case 'in_use': 
        return <ClockRegular style={{ color: tokens.componentSemantics.icon.info, fontSize: '16px' }} />;
      case 'maintenance': 
        return <SettingsRegular style={{ color: tokens.componentSemantics.icon.warning, fontSize: '16px' }} />;
      case 'decommissioned': 
        return <ErrorCircleRegular style={{ color: tokens.componentSemantics.icon.error, fontSize: '16px' }} />;
      default: 
        return <InfoRegular style={{ color: tokens.componentSemantics.icon.neutral, fontSize: '16px' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return tokens.semanticColors.success.foreground;
      case 'in_use': return tokens.semanticColors.info.foreground;
      case 'maintenance': return tokens.semanticColors.warning.foreground;
      case 'decommissioned': return tokens.semanticColors.error.foreground;
      default: return tokens.semanticColors.neutral.foreground;
    }
  };

  const getVendorColor = (vendor: string) => {
    switch (vendor.toLowerCase()) {
      case 'dell': return '#007DB8';
      case 'hp':
      case 'hpe': return '#01A982';
      case 'lenovo': return '#E31837';
      default: return colors.purple600;
    }
  };

  const formatSpecs = (specs: HardwareSpecifications) => {
    const cpu = specs.processor ? 
      `${specs.processor.cores}C${specs.processor.threads ? `/${specs.processor.threads}T` : ''} ${specs.processor.model}` : 
      'N/A';
    const memory = specs.memory ? `${specs.memory.total_gb}GB ${specs.memory.type || ''}`.trim() : 'N/A';
    const storage = specs.storage ? specs.storage.total_capacity : 'N/A';
    const network = specs.network ? 
      `${specs.network.ports || 1}x ${specs.network.speed || 'GbE'}` : 
      'N/A';
    return { cpu, memory, storage, network };
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      rvtools: { label: 'RVTools', color: tokens.semanticColors.info.foreground },
      manual: { label: 'Manual', color: tokens.colorBrandPrimary },
      hardware_basket: { label: 'Purchased', color: tokens.semanticColors.success.foreground }
    };
    return badges[source as keyof typeof badges] || { label: source, color: tokens.semanticColors.neutral.foreground };
  };

  const isWarrantyExpiring = () => {
    if (!server.warranty_end) return false;
    const today = new Date();
    const warrantyEnd = new Date(server.warranty_end);
    const diffTime = warrantyEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90 && diffDays > 0; // Expiring within 90 days
  };

  const isWarrantyExpired = () => {
    if (!server.warranty_end) return false;
    const today = new Date();
    const warrantyEnd = new Date(server.warranty_end);
    return today > warrantyEnd;
  };

  const specs = formatSpecs(server.specifications);
  const sourceBadge = getSourceBadge(server.source);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.action-button')) {
      return;
    }
    if (onSelect) {
      onSelect(server.id);
    } else {
      onClick();
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      className="lcm-card server-card"
      style={{
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: isSelected 
          ? `2px solid ${colors.purple600}` 
          : '1px solid rgba(139, 92, 246, 0.2)',
        background: isSelected 
          ? 'rgba(139, 92, 246, 0.05)' 
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(18px) saturate(180%)',
        position: 'relative',
        minHeight: '240px',
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(139, 92, 246, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.2)';
        }
      }}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          width: '6px',
          height: '6px',
          background: colors.purple600,
          borderRadius: '50%',
          boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.2)'
        }} />
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '16px' 
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h3 style={{ 
              margin: '0', 
              fontSize: '16px', 
              fontWeight: '600', 
              color: colors.gray900,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {server.model_name}
            </h3>
            {/* Vendor Badge */}
            <span style={{
              padding: '2px 6px',
              background: `${getVendorColor(server.vendor)}15`,
              color: getVendorColor(server.vendor),
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              {server.vendor}
            </span>
          </div>
          
          <div style={{ 
            fontSize: '12px', 
            color: tokens.semanticColors.neutral.foregroundSubtle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{server.specifications.form_factor}</span>
            <span>•</span>
            <span style={{ 
              color: sourceBadge.color,
              fontWeight: '600'
            }}>
              {sourceBadge.label}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Status Badge */}
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            background: `${getStatusColor(server.status)}15`,
            border: `1px solid ${getStatusColor(server.status)}30`
          }}>
            {getStatusIcon(server.status)}
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '600',
              color: getStatusColor(server.status),
              textTransform: 'capitalize'
            }}>
              {server.status.replace('_', ' ')}
            </span>
          </div>

          {/* Menu Button */}
          {showActions && (
            <div style={{ position: 'relative' }}>
              <button
                className="action-button"
                onClick={handleMenuClick}
                style={{
                  background: 'rgba(107, 114, 128, 0.1)',
                  border: '1px solid rgba(107, 114, 128, 0.2)',
                  borderRadius: '4px',
                  padding: '4px',
                  cursor: 'pointer',
                  color: tokens.semanticColors.neutral.foregroundSubtle,
                  transition: 'all 0.2s ease'
                }}
              >
                <MoreHorizontalRegular style={{ fontSize: '14px' }} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  marginTop: '4px',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  zIndex: 10,
                  minWidth: '120px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <EditRegular style={{ fontSize: '12px', marginRight: '6px' }} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: 'none',
                      background: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: tokens.semanticColors.error.foreground
                    }}
                  >
                    <DeleteRegular style={{ fontSize: '12px', marginRight: '6px' }} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Specifications Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px', 
        marginBottom: '16px',
        flex: 1
      }}>
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: tokens.semanticColors.neutral.foregroundSubtle, 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Processor
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: colors.gray900, 
            fontWeight: '500',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {specs.cpu}
          </div>
        </div>
        
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: tokens.semanticColors.neutral.foregroundSubtle, 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Memory
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: colors.gray900, 
            fontWeight: '500'
          }}>
            {specs.memory}
          </div>
        </div>
        
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: tokens.semanticColors.neutral.foregroundSubtle, 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Storage
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: colors.gray900, 
            fontWeight: '500'
          }}>
            {specs.storage}
          </div>
        </div>
        
        <div>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: tokens.semanticColors.neutral.foregroundSubtle, 
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            Network
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: colors.gray900, 
            fontWeight: '500'
          }}>
            {specs.network}
          </div>
        </div>
      </div>

      {/* Assignment Info */}
      {(server.assigned_project || server.assigned_activity) && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(59, 130, 246, 0.1)',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: tokens.semanticColors.info.foreground, 
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            Currently Assigned
          </div>
          <div style={{ fontSize: '12px', color: tokens.semanticColors.info.foregroundSubtle }}>
            {server.assigned_project && `Project: ${server.assigned_project}`}
            {server.assigned_activity && ` • Activity: ${server.assigned_activity}`}
          </div>
        </div>
      )}

      {/* Warranty Warning */}
      {(isWarrantyExpiring() || isWarrantyExpired()) && (
        <div style={{
          padding: '8px 12px',
          background: isWarrantyExpired() ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: isWarrantyExpired() ? tokens.semanticColors.error.foreground : tokens.semanticColors.warning.foreground, 
            textTransform: 'uppercase',
            marginBottom: '2px'
          }}>
            ⚠️ Warranty {isWarrantyExpired() ? 'Expired' : 'Expiring Soon'}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: isWarrantyExpired() ? tokens.semanticColors.error.foregroundSubtle : tokens.semanticColors.warning.foregroundSubtle 
          }}>
            {server.warranty_end?.toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        fontSize: '11px', 
        color: '#9ca3af',
        paddingTop: '12px',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LocationRegular style={{ fontSize: '10px' }} />
          <span>{server.location || 'Unknown Location'}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <CalendarRegular style={{ fontSize: '10px' }} />
          <span>
            Added {new Date(server.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      </div>

      {/* Notes Preview */}
      {server.notes && (
        <div style={{
          marginTop: '8px',
          padding: '6px 8px',
          background: 'rgba(139, 92, 246, 0.05)',
          borderRadius: '4px',
          fontSize: '11px',
          color: tokens.semanticColors.neutral.foregroundSubtle,
          fontStyle: 'italic',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          📝 {server.notes}
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 5
          }}
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ServerCard;