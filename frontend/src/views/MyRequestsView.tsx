import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PurpleGlassCard, 
  PurpleGlassButton, 
  PurpleGlassInput 
} from '../components/ui';
import { 
  SearchRegular,
  FilterRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular,
  DismissRegular,
  InfoRegular,
  CalendarRegular,
  PersonRegular,
  AppsRegular
} from '@fluentui/react-icons';
import { apiClient, ServiceRequest } from '../utils/apiClient';
import { useEnhancedUX } from '../hooks/useEnhancedUX';

const STATUS_COLORS: Record<string, string> = {
  'DRAFT': 'var(--color-neutral)',
  'PENDING_APPROVAL': 'var(--color-warning)',
  'APPROVED': 'var(--color-success)',
  'IN_PROGRESS': 'var(--color-info)',
  'COMPLETED': 'var(--color-success)',
  'CANCELLED': 'var(--color-neutral)',
  'REJECTED': 'var(--color-error)',
};

const STATUS_ICONS: Record<string, React.ReactElement> = {
  'DRAFT': <InfoRegular />,
  'PENDING_APPROVAL': <ClockRegular />,
  'APPROVED': <CheckmarkCircleRegular />,
  'IN_PROGRESS': <ClockRegular />,
  'COMPLETED': <CheckmarkCircleRegular />,
  'CANCELLED': <DismissRegular />,
  'REJECTED': <ErrorCircleRegular />,
};

const MyRequestsView: React.FC = () => {
  const navigate = useNavigate();
  const { showToast, showError, showSuccess } = useEnhancedUX();

  // State
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Load requests on mount
  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getServiceRequests({ 
        status: statusFilter !== 'all' ? statusFilter : undefined 
      });
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      showError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return req.id?.toLowerCase().includes(query) || 
           req.catalog_item_id.toLowerCase().includes(query);
  });

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractId = (fullId: string): string => {
    return fullId.includes(':') ? fullId.split(':')[1] : fullId;
  };

  const getStatusBadge = (status: string) => {
    const color = STATUS_COLORS[status] || 'var(--color-neutral)';
    const icon = STATUS_ICONS[status] || <InfoRegular />;

    return (
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        padding: 'var(--spacing-2) var(--spacing-3)',
        borderRadius: 'var(--border-radius-medium)',
        background: `${color}20`,
        color: color,
        fontSize: 'var(--font-size-200)',
        fontWeight: 600
      }}>
        {icon}
        <span>{status.replace(/_/g, ' ')}</span>
      </div>
    );
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
  };

  const closeDetailDrawer = () => {
    setSelectedRequest(null);
  };

  return (
    <div style={{ 
      padding: 'var(--spacing-6)', 
      maxWidth: '1400px', 
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-900)', 
          fontWeight: 700,
          marginBottom: 'var(--spacing-2)',
          color: 'var(--color-text-primary)'
        }}>
          My Service Requests
        </h1>
        <p style={{ 
          fontSize: 'var(--font-size-400)', 
          color: 'var(--color-text-secondary)'
        }}>
          Track the status of your service requests
        </p>
      </div>

      {/* Filters */}
      <PurpleGlassCard style={{ marginBottom: 'var(--spacing-5)' }}>
        <div style={{ padding: 'var(--spacing-5)' }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <PurpleGlassInput
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<SearchRegular />}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
              {['all', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-4)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-medium)',
                    background: statusFilter === status 
                      ? 'var(--color-primary-alpha-10)' 
                      : 'var(--color-neutral-alpha-5)',
                    color: statusFilter === status 
                      ? 'var(--color-primary)' 
                      : 'var(--color-text-primary)',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-300)',
                    fontWeight: statusFilter === status ? 600 : 400,
                    transition: 'all var(--duration-fast)'
                  }}
                >
                  {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <PurpleGlassButton onClick={() => navigate('/app/service-catalog')}>
              <AppsRegular style={{ marginRight: 'var(--spacing-2)' }} />
              Browse Catalog
            </PurpleGlassButton>
          </div>
        </div>
      </PurpleGlassCard>

      {/* Requests List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-10)' }}>
          <div className="spinner" />
          <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>
            Loading your requests...
          </p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <PurpleGlassCard>
          <div style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
            <InfoRegular style={{ fontSize: '48px', color: 'var(--color-text-secondary)' }} />
            <h3 style={{ 
              marginTop: 'var(--spacing-4)', 
              fontSize: 'var(--font-size-600)',
              color: 'var(--color-text-primary)'
            }}>
              No requests found
            </h3>
            <p style={{ 
              marginTop: 'var(--spacing-2)', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-4)'
            }}>
              {searchQuery 
                ? `No requests match your search "${searchQuery}"`
                : statusFilter !== 'all'
                  ? `You have no ${statusFilter.replace(/_/g, ' ').toLowerCase()} requests`
                  : "You haven't submitted any service requests yet"}
            </p>
            <PurpleGlassButton onClick={() => navigate('/app/service-catalog')}>
              Browse Service Catalog
            </PurpleGlassButton>
          </div>
        </PurpleGlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
          {filteredRequests.map(request => (
            <PurpleGlassCard key={request.id}>
              <div style={{ 
                padding: 'var(--spacing-5)',
                display: 'flex',
                gap: 'var(--spacing-5)',
                alignItems: 'flex-start'
              }}>
                {/* Request Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-3)',
                    marginBottom: 'var(--spacing-3)'
                  }}>
                    <h3 style={{ 
                      fontSize: 'var(--font-size-500)', 
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      margin: 0
                    }}>
                      Request #{extractId(request.id || '')}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-4)',
                    marginTop: 'var(--spacing-3)'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-200)', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Catalog Item
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-300)', 
                        color: 'var(--color-text-primary)',
                        fontWeight: 500
                      }}>
                        {extractId(request.catalog_item_id)}
                      </div>
                    </div>

                    <div>
                      <div style={{ 
                        fontSize: 'var(--font-size-200)', 
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--spacing-1)'
                      }}>
                        Submitted
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-300)', 
                        color: 'var(--color-text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2)'
                      }}>
                        <CalendarRegular />
                        {formatDate(request.created_at)}
                      </div>
                    </div>

                    {request.approved_by && (
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-200)', 
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--spacing-1)'
                        }}>
                          Reviewed By
                        </div>
                        <div style={{ 
                          fontSize: 'var(--font-size-300)', 
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)'
                        }}>
                          <PersonRegular />
                          {request.approved_by}
                        </div>
                      </div>
                    )}

                    {request.completed_at && (
                      <div>
                        <div style={{ 
                          fontSize: 'var(--font-size-200)', 
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--spacing-1)'
                        }}>
                          Completed
                        </div>
                        <div style={{ 
                          fontSize: 'var(--font-size-300)', 
                          color: 'var(--color-text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--spacing-2)'
                        }}>
                          <CheckmarkCircleRegular />
                          {formatDate(request.completed_at)}
                        </div>
                      </div>
                    )}
                  </div>

                  {request.rejection_reason && (
                    <div style={{
                      marginTop: 'var(--spacing-4)',
                      padding: 'var(--spacing-3)',
                      borderRadius: 'var(--border-radius-medium)',
                      background: 'var(--color-error-alpha-10)',
                      borderLeft: '3px solid var(--color-error)'
                    }}>
                      <div style={{ 
                        fontSize: 'var(--font-size-200)', 
                        fontWeight: 600,
                        color: 'var(--color-error)',
                        marginBottom: 'var(--spacing-2)'
                      }}>
                        Rejection Reason
                      </div>
                      <div style={{ 
                        fontSize: 'var(--font-size-300)', 
                        color: 'var(--color-text-primary)'
                      }}>
                        {request.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <PurpleGlassButton 
                    appearance="subtle"
                    onClick={() => handleViewDetails(request)}
                  >
                    View Details
                  </PurpleGlassButton>
                </div>
              </div>
            </PurpleGlassCard>
          ))}
        </div>
      )}

      {/* Detail Drawer (Simple Modal) */}
      {selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--spacing-5)'
        }}>
          <PurpleGlassCard style={{ 
            maxWidth: '800px', 
            width: '100%', 
            maxHeight: '90vh', 
            overflow: 'auto' 
          }}>
            <div style={{ padding: 'var(--spacing-6)' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-5)'
              }}>
                <h2 style={{ 
                  fontSize: 'var(--font-size-700)', 
                  fontWeight: 700,
                  color: 'var(--color-text-primary)'
                }}>
                  Request Details
                </h2>
                <button
                  onClick={closeDetailDrawer}
                  style={{
                    padding: 'var(--spacing-2)',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                    fontSize: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <DismissRegular />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                <div>
                  <div style={{ 
                    fontSize: 'var(--font-size-300)', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    Request ID
                  </div>
                  <div style={{ 
                    fontSize: 'var(--font-size-400)', 
                    color: 'var(--color-text-primary)',
                    fontWeight: 600
                  }}>
                    {extractId(selectedRequest.id || '')}
                  </div>
                </div>

                <div>
                  <div style={{ 
                    fontSize: 'var(--font-size-300)', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    Status
                  </div>
                  {getStatusBadge(selectedRequest.status)}
                </div>

                <div>
                  <div style={{ 
                    fontSize: 'var(--font-size-300)', 
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--spacing-2)'
                  }}>
                    Form Data
                  </div>
                  <pre style={{
                    background: 'var(--color-neutral-alpha-5)',
                    padding: 'var(--spacing-4)',
                    borderRadius: 'var(--border-radius-medium)',
                    overflow: 'auto',
                    fontSize: 'var(--font-size-300)',
                    color: 'var(--color-text-primary)'
                  }}>
                    {JSON.stringify(selectedRequest.form_data, null, 2)}
                  </pre>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: 'var(--spacing-3)',
                  justifyContent: 'flex-end'
                }}>
                  <PurpleGlassButton appearance="subtle" onClick={closeDetailDrawer}>
                    Close
                  </PurpleGlassButton>
                </div>
              </div>
            </div>
          </PurpleGlassCard>
        </div>
      )}
    </div>
  );
};

export default MyRequestsView;
