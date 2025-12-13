import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassSpinner,
  PageHeader,
  PurpleGlassEmptyState,
} from '../components/ui';
import {
  ArrowLeftRegular,
  EditRegular,
  DeleteRegular,
  HistoryRegular,
  LinkRegular,
  AlertRegular,
  DatabaseRegular,
  InfoRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';
import * as cmdbClient from '../api/cmdbClient';
import type {
  ConfigurationItem,
  CIDetailResponse,
  CIHistory,
  CIRelationshipExpanded,
} from '../api/cmdbClient';
import { FluentTokens } from '../design-system/tokens';
import CIRelationshipGraph from '../components/CIRelationshipGraph';
import ImpactAnalysisPanel from '../components/ImpactAnalysisPanel';

type TabValue = 'overview' | 'relationships' | 'history' | 'impact';

const CIDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ciDetail, setCiDetail] = useState<CIDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  useEffect(() => {
    if (id) {
      loadCIDetail();
    }
  }, [id]);

  const loadCIDetail = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await cmdbClient.getCIById(id);
      setCiDetail(data);
    } catch (err) {
      console.error('Failed to load CI:', err);
      setError(err instanceof Error ? err.message : 'Failed to load CI details');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/app/cmdb/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${ciDetail?.ci.name}?`)) return;

    try {
      await cmdbClient.deleteCI(id!);
      navigate('/app/cmdb');
    } catch (err) {
      console.error('Failed to delete CI:', err);
      alert('Failed to delete CI');
    }
  };

  const handleBack = () => {
    navigate('/app/cmdb');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
        <PurpleGlassSpinner size="large" />
      </div>
    );
  }

  if (error || !ciDetail) {
    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <PurpleGlassCard glass>
          <PurpleGlassEmptyState
            icon={<ErrorCircleRegular />}
            title="CI Not Found"
            description={error || 'The configuration item you are looking for does not exist or has been removed.'}
            action={{
              label: 'Back to CMDB',
              onClick: handleBack,
              icon: <ArrowLeftRegular />,
            }}
          />
        </PurpleGlassCard>
      </div>
    );
  }

  const { ci, relationships, history } = ciDetail;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <PageHeader
        icon={cmdbClient.getCIClassIcon(ci.ci_class)}
        title={ci.name}
        subtitle={`CI ID: ${ci.ci_id} • Type: ${ci.ci_type} • Class: ${ci.ci_class}`}
        badge={ci.status}
        badgeVariant={
          ci.status === 'ACTIVE' || ci.status === 'DEPLOYED'
            ? 'success'
            : ci.status === 'MAINTENANCE' || ci.status === 'OFFLINE'
              ? 'warning'
              : ci.status === 'FAILED'
                ? 'danger'
                : 'info'
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <PurpleGlassButton variant="secondary" onClick={handleBack}>
              <ArrowLeftRegular style={{ marginRight: '8px' }} />
              Back
            </PurpleGlassButton>
            <PurpleGlassButton icon={<EditRegular />} onClick={handleEdit}>
              Edit
            </PurpleGlassButton>
            <PurpleGlassButton icon={<DeleteRegular />} onClick={handleDelete} variant="ghost">
              Delete
            </PurpleGlassButton>
          </div>
        }
      >
        {/* CI metadata badges */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <span style={{
            padding: '8px 16px',
            borderRadius: FluentTokens.borderRadius.medium,
            fontSize: FluentTokens.typography.fontSize[300],
            fontWeight: FluentTokens.typography.fontWeight.medium,
            backgroundColor: `${cmdbClient.getCICriticalityColor(ci.criticality)}20`,
            color: cmdbClient.getCICriticalityColor(ci.criticality),
          }}>
            {ci.criticality}
          </span>
          {ci.environment && (
            <span style={{
              padding: '8px 16px',
              borderRadius: FluentTokens.borderRadius.medium,
              fontSize: FluentTokens.typography.fontSize[300],
              fontWeight: FluentTokens.typography.fontWeight.medium,
              backgroundColor: 'var(--colorNeutralBackground3)',
              color: 'var(--colorNeutralForeground1)',
            }}>
              {ci.environment}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Tabs */}
      <PurpleGlassCard style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--colorNeutralStroke1)',
          padding: '0 20px',
        }}>
          {[
            { key: 'overview', label: 'Overview', icon: <EditRegular /> },
            { key: 'relationships', label: 'Relationships', icon: <LinkRegular /> },
            { key: 'history', label: 'History', icon: <HistoryRegular /> },
            { key: 'impact', label: 'Impact Analysis', icon: <AlertRegular /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabValue)}
              style={{
                padding: '16px 24px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: FluentTokens.typography.fontSize[400],
                fontWeight: FluentTokens.typography.fontWeight.medium,
                color: activeTab === tab.key
                  ? 'var(--colorBrandForeground1)'
                  : 'var(--colorNeutralForeground2)',
                borderBottom: activeTab === tab.key
                  ? '2px solid var(--colorBrandForeground1)'
                  : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && <OverviewTab ci={ci} />}
          {activeTab === 'relationships' && <RelationshipsTab ci={ci} relationships={relationships} onRefresh={loadCIDetail} />}
          {activeTab === 'history' && <HistoryTab history={history} />}
          {activeTab === 'impact' && <ImpactTab ci={ci} />}
        </div>
      </PurpleGlassCard>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ ci: ConfigurationItem }> = ({ ci }) => {
  const fields = [
    { label: 'Description', value: ci.description },
    { label: 'Class', value: ci.ci_class },
    { label: 'Type', value: ci.ci_type },
    { label: 'Owner', value: ci.owner_name || ci.owner_id },
    { label: 'Support Group', value: ci.support_group },
    { label: 'Location', value: ci.location },
    { label: 'Vendor', value: ci.vendor },
    { label: 'Model', value: ci.model },
    { label: 'Serial Number', value: ci.serial_number },
    { label: 'Version', value: ci.version },
    { label: 'IP Address', value: ci.ip_address },
    { label: 'FQDN', value: ci.fqdn },
    { label: 'Install Date', value: ci.install_date ? new Date(ci.install_date).toLocaleDateString() : undefined },
    { label: 'Warranty Expiry', value: ci.warranty_expiry ? new Date(ci.warranty_expiry).toLocaleDateString() : undefined },
    { label: 'End of Life', value: ci.end_of_life ? new Date(ci.end_of_life).toLocaleDateString() : undefined },
  ];

  return (
    <div>
      <h3 style={{
        fontSize: FluentTokens.typography.fontSize[600],
        fontWeight: FluentTokens.typography.fontWeight.semibold,
        marginBottom: '16px',
      }}>
        CI Information
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {fields.map((field) => field.value && (
          <div key={field.label}>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[200],
              color: 'var(--colorNeutralForeground3)',
              marginBottom: '4px',
            }}>
              {field.label}
            </div>
            <div style={{
              fontSize: FluentTokens.typography.fontSize[400],
              color: 'var(--colorNeutralForeground1)',
            }}>
              {field.value}
            </div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {ci.tags && ci.tags.length > 0 && (
        <>
          <h3 style={{
            fontSize: FluentTokens.typography.fontSize[600],
            fontWeight: FluentTokens.typography.fontWeight.semibold,
            marginTop: '24px',
            marginBottom: '16px',
          }}>
            Tags
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ci.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  padding: '4px 12px',
                  borderRadius: FluentTokens.borderRadius.medium,
                  fontSize: FluentTokens.typography.fontSize[200],
                  backgroundColor: 'var(--colorBrandBackground2)',
                  color: 'var(--colorBrandForeground2)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </>
      )}

      {/* Custom Attributes */}
      {ci.attributes && Object.keys(ci.attributes).length > 0 && (
        <>
          <h3 style={{
            fontSize: FluentTokens.typography.fontSize[600],
            fontWeight: FluentTokens.typography.fontWeight.semibold,
            marginTop: '24px',
            marginBottom: '16px',
          }}>
            Custom Attributes
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px',
          }}>
            {Object.entries(ci.attributes).map(([key, value]) => (
              <div key={key}>
                <div style={{
                  fontSize: FluentTokens.typography.fontSize[200],
                  color: 'var(--colorNeutralForeground3)',
                  marginBottom: '4px',
                }}>
                  {key}
                </div>
                <div style={{
                  fontSize: FluentTokens.typography.fontSize[400],
                  color: 'var(--colorNeutralForeground1)',
                }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Relationships Tab Component
const RelationshipsTab: React.FC<{
  ci: ConfigurationItem;
  relationships: CIRelationshipExpanded[];
  onRefresh: () => void;
}> = ({ ci, relationships, onRefresh }) => {
  const [showGraph, setShowGraph] = useState(true);

  const upstreamRelationships = relationships.filter(r => r.relationship.target_id === ci.id);
  const downstreamRelationships = relationships.filter(r => r.relationship.source_id === ci.id);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{
          fontSize: FluentTokens.typography.fontSize[600],
          fontWeight: FluentTokens.typography.fontWeight.semibold,
        }}>
          Relationships
        </h3>
        <PurpleGlassButton
          onClick={() => setShowGraph(!showGraph)}
        >
          {showGraph ? 'Show List' : 'Show Graph'}
        </PurpleGlassButton>
      </div>

      {showGraph ? (
        <CIRelationshipGraph ciId={ci.id!} onRefresh={onRefresh} />
      ) : (
        <>
          {/* Upstream Dependencies */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{
              fontSize: FluentTokens.typography.fontSize[500],
              fontWeight: FluentTokens.typography.fontWeight.medium,
              marginBottom: '12px',
            }}>
              Depends On ({upstreamRelationships.length})
            </h4>
            {upstreamRelationships.length === 0 ? (
              <p style={{ color: 'var(--colorNeutralForeground3)' }}>No upstream dependencies</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upstreamRelationships.map((rel) => (
                  <div
                    key={rel.relationship.id}
                    style={{
                      padding: '12px',
                      borderRadius: FluentTokens.borderRadius.medium,
                      backgroundColor: 'var(--colorNeutralBackground2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>
                        {cmdbClient.getCIClassIcon(rel.related_ci.ci_class)}
                      </span>
                      <div>
                        <div style={{ fontWeight: FluentTokens.typography.fontWeight.medium }}>
                          {rel.related_ci.name}
                        </div>
                        <div style={{
                          fontSize: FluentTokens.typography.fontSize[200],
                          color: 'var(--colorNeutralForeground3)',
                        }}>
                          {rel.relationship.relationship_type} • {rel.related_ci.ci_id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Downstream Impact */}
          <div>
            <h4 style={{
              fontSize: FluentTokens.typography.fontSize[500],
              fontWeight: FluentTokens.typography.fontWeight.medium,
              marginBottom: '12px',
            }}>
              Provides To ({downstreamRelationships.length})
            </h4>
            {downstreamRelationships.length === 0 ? (
              <p style={{ color: 'var(--colorNeutralForeground3)' }}>No downstream dependencies</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {downstreamRelationships.map((rel) => (
                  <div
                    key={rel.relationship.id}
                    style={{
                      padding: '12px',
                      borderRadius: FluentTokens.borderRadius.medium,
                      backgroundColor: 'var(--colorNeutralBackground2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '24px' }}>
                        {cmdbClient.getCIClassIcon(rel.related_ci.ci_class)}
                      </span>
                      <div>
                        <div style={{ fontWeight: FluentTokens.typography.fontWeight.medium }}>
                          {rel.related_ci.name}
                        </div>
                        <div style={{
                          fontSize: FluentTokens.typography.fontSize[200],
                          color: 'var(--colorNeutralForeground3)',
                        }}>
                          {rel.relationship.relationship_type} • {rel.related_ci.ci_id}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// History Tab Component
const HistoryTab: React.FC<{ history: CIHistory[] }> = ({ history }) => {
  return (
    <div>
      <h3 style={{
        fontSize: FluentTokens.typography.fontSize[600],
        fontWeight: FluentTokens.typography.fontWeight.semibold,
        marginBottom: '16px',
      }}>
        Change History
      </h3>

      {history.length === 0 ? (
        <p style={{ color: 'var(--colorNeutralForeground3)' }}>No change history available</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {history.map((change) => (
            <div
              key={change.id}
              style={{
                padding: '16px',
                borderRadius: FluentTokens.borderRadius.medium,
                backgroundColor: 'var(--colorNeutralBackground2)',
                borderLeft: '4px solid var(--colorBrandForeground1)',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}>
                <div style={{
                  fontWeight: FluentTokens.typography.fontWeight.semibold,
                  color: 'var(--colorNeutralForeground1)',
                }}>
                  {change.field_name}
                </div>
                <div style={{
                  fontSize: FluentTokens.typography.fontSize[200],
                  color: 'var(--colorNeutralForeground3)',
                }}>
                  {new Date(change.changed_at).toLocaleString()}
                </div>
              </div>
              <div style={{
                fontSize: FluentTokens.typography.fontSize[300],
                color: 'var(--colorNeutralForeground2)',
              }}>
                <span style={{ textDecoration: 'line-through', color: 'var(--colorPaletteRedForeground1)' }}>
                  {change.old_value || '(empty)'}
                </span>
                {' → '}
                <span style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
                  {change.new_value || '(empty)'}
                </span>
              </div>
              {change.change_reason && (
                <div style={{
                  marginTop: '8px',
                  fontSize: FluentTokens.typography.fontSize[200],
                  color: 'var(--colorNeutralForeground3)',
                  fontStyle: 'italic',
                }}>
                  Reason: {change.change_reason}
                </div>
              )}
              <div style={{
                marginTop: '8px',
                fontSize: FluentTokens.typography.fontSize[200],
                color: 'var(--colorNeutralForeground3)',
              }}>
                Changed by: {change.changed_by}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Impact Tab Component
const ImpactTab: React.FC<{ ci: ConfigurationItem }> = ({ ci }) => {
  return (
    <div>
      <h3 style={{
        fontSize: FluentTokens.typography.fontSize[600],
        fontWeight: FluentTokens.typography.fontWeight.semibold,
        marginBottom: '16px',
      }}>
        Impact Analysis
      </h3>
      <ImpactAnalysisPanel ciId={ci.id!} />
    </div>
  );
};

export default CIDetailView;
