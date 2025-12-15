// Archer ITSM - SLA Management View
// Admin interface for configuring SLA policies

import React, { useState } from 'react';
import { makeStyles, tokens, shorthands } from '@fluentui/react-components';
import {
  ClockRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  AlertRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassCheckbox,
  PurpleGlassEmptyState,
  PurpleGlassSkeleton,
  PurpleGlassModal,
  PageHeader,
  EnhancedPurpleGlassButton,
} from '../components/ui';
import {
  useSlaPolicies,
  useCreateSlaPolicy,
  useUpdateSlaPolicy,
  useDeleteSlaPolicy,
  type SlaPolicy,
  type EscalationRule,
} from '../hooks/queries/useSLA';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const TICKET_TYPES = ['INCIDENT', 'PROBLEM', 'CHANGE', 'SERVICE_REQUEST'];

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    maxWidth: '1400px',
    margin: '0 auto',
    ...shorthands.padding(tokens.spacingHorizontalL),
  },
  policiesGrid: {
    display: 'grid',
    gap: tokens.spacingVerticalL,
  },
  policyCard: {
    position: 'relative',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacingVerticalM,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  policyTitle: {
    margin: 0,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
  },
  activeStatus: {
    color: tokens.colorPaletteGreenForeground1,
  },
  inactiveStatus: {
    color: tokens.colorNeutralForeground3,
  },
  description: {
    margin: `${tokens.spacingVerticalS} 0 0`,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase300,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  metricLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  metricValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
  badgeList: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  badge: {
    ...shorthands.padding('2px', tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
  },
  badgeSecondary: {
    backgroundColor: tokens.colorPaletteBlueBorder1,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  escalationSection: {
    marginTop: tokens.spacingVerticalM,
  },
  escalationHeader: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    marginBottom: tokens.spacingVerticalS,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  escalationList: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  escalationBadge: {
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground1,
  },
  formGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  checkboxGroupLabel: {
    display: 'block',
    marginBottom: tokens.spacingVerticalS,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeBase300,
  },
  checkboxRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
  },
  modalActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
    marginTop: tokens.spacingVerticalL,
  },
});

export function SLAManagementView() {
  const styles = useStyles();
  const [showModal, setShowModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SlaPolicy | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: policies, isLoading, isError } = useSlaPolicies();
  const createPolicy = useCreateSlaPolicy();
  const updatePolicy = useUpdateSlaPolicy();
  const deletePolicy = useDeleteSlaPolicy();

  const handleCreateNew = () => {
    setEditingPolicy(null);
    setShowModal(true);
  };

  const handleEdit = (policy: SlaPolicy) => {
    setEditingPolicy(policy);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePolicy.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete policy:', error);
    }
  };

  const handleSave = async (formData: Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPolicy?.id) {
        await updatePolicy.mutateAsync({ id: editingPolicy.id, ...formData });
      } else {
        await createPolicy.mutateAsync(formData);
      }
      setShowModal(false);
      setEditingPolicy(null);
    } catch (error) {
      console.error('Failed to save policy:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <PageHeader title="SLA Management" icon={<ClockRegular />} />
        <PurpleGlassSkeleton lines={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.container}>
        <PageHeader title="SLA Management" icon={<ClockRegular />} />
        <PurpleGlassEmptyState
          icon={<AlertRegular />}
          title="Error Loading SLA Policies"
          description="Failed to load SLA policies. Please try refreshing the page."
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader 
        title="SLA Management" 
        icon={<ClockRegular />}
        subtitle="Configure Service Level Agreement policies for ticket resolution"
        actions={
          <EnhancedPurpleGlassButton 
            variant="primary" 
            icon={<AddRegular />}
            onClick={handleCreateNew}
          >
            Create Policy
          </EnhancedPurpleGlassButton>
        }
      />

      {policies?.length === 0 ? (
        <PurpleGlassEmptyState
          icon={<ClockRegular />}
          title="No SLA Policies"
          description="Create your first SLA policy to start tracking response and resolution times."
          action={
            <EnhancedPurpleGlassButton 
              variant="primary" 
              icon={<AddRegular />}
              onClick={handleCreateNew}
            >
              Create First Policy
            </EnhancedPurpleGlassButton>
          }
        />
      ) : (
        <div className={styles.policiesGrid}>
          {policies?.map(policy => (
            <SLAPolicyCard
              key={policy.id}
              policy={policy}
              onEdit={() => handleEdit(policy)}
              onDelete={() => setDeleteConfirm(policy.id!)}
              styles={styles}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <SLAPolicyModal
          policy={editingPolicy}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingPolicy(null);
          }}
          isLoading={createPolicy.isPending || updatePolicy.isPending}
          styles={styles}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <PurpleGlassModal
          title="Delete SLA Policy?"
          onClose={() => setDeleteConfirm(null)}
        >
          <p>Are you sure you want to delete this SLA policy? This action cannot be undone.</p>
          <div className={styles.modalActions}>
            <EnhancedPurpleGlassButton 
              variant="secondary" 
              onClick={() => setDeleteConfirm(null)}
            >
              Cancel
            </EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton 
              variant="danger" 
              onClick={() => handleDelete(deleteConfirm)}
              loading={deletePolicy.isPending}
            >
              Delete Policy
            </EnhancedPurpleGlassButton>
          </div>
        </PurpleGlassModal>
      )}
    </div>
  );
}

// ============================================================================
// SUBCOMPONENT: Policy Card
// ============================================================================

interface SLAPolicyCardProps {
  policy: SlaPolicy;
  onEdit: () => void;
  onDelete: () => void;
  styles: ReturnType<typeof useStyles>;
}

function SLAPolicyCard({ policy, onEdit, onDelete, styles }: SLAPolicyCardProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <PurpleGlassCard className={styles.policyCard}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.titleRow}>
            <h3 className={styles.policyTitle}>{policy.name}</h3>
            {policy.is_active ? (
              <span className={`${styles.statusBadge} ${styles.activeStatus}`}>
                <CheckmarkCircleRegular /> Active
              </span>
            ) : (
              <span className={`${styles.statusBadge} ${styles.inactiveStatus}`}>
                <DismissCircleRegular /> Inactive
              </span>
            )}
          </div>
          {policy.description && (
            <p className={styles.description}>
              {policy.description}
            </p>
          )}
        </div>
        <div className={styles.actions}>
          <EnhancedPurpleGlassButton 
            variant="ghost" 
            icon={<EditRegular />}
            onClick={onEdit}
            aria-label="Edit policy"
          />
          <EnhancedPurpleGlassButton 
            variant="ghost" 
            icon={<DeleteRegular />}
            onClick={onDelete}
            aria-label="Delete policy"
          />
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Response Time</div>
          <div className={styles.metricValue}>
            {formatTime(policy.response_target_minutes)}
          </div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Resolution Time</div>
          <div className={styles.metricValue}>
            {formatTime(policy.resolution_target_minutes)}
          </div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Priorities</div>
          <div className={styles.badgeList}>
            {policy.applies_to_priorities.length === 0 ? (
              <span className={styles.badge}>All</span>
            ) : (
              policy.applies_to_priorities.map(p => (
                <span key={p} className={styles.badge}>
                  {p}
                </span>
              ))
            )}
          </div>
        </div>
        <div className={styles.metricItem}>
          <div className={styles.metricLabel}>Ticket Types</div>
          <div className={styles.badgeList}>
            {policy.applies_to_types.length === 0 ? (
              <span className={`${styles.badge} ${styles.badgeSecondary}`}>All</span>
            ) : (
              policy.applies_to_types.map(t => (
                <span key={t} className={`${styles.badge} ${styles.badgeSecondary}`}>
                  {t.replace('_', ' ')}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {policy.escalation_rules && policy.escalation_rules.length > 0 && (
        <div className={styles.escalationSection}>
          <div className={styles.escalationHeader}>
            <AlertRegular /> Escalation Rules
          </div>
          <div className={styles.escalationList}>
            {policy.escalation_rules.map((rule, idx) => (
              <span key={idx} className={styles.escalationBadge}>
                At {rule.trigger_at_percent}%: Notify {rule.notify_users.length + rule.notify_groups.length} recipients
                {rule.reassign_to && ` → Reassign to ${rule.reassign_to}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </PurpleGlassCard>
  );
}

// ============================================================================
// SUBCOMPONENT: Create/Edit Modal
// ============================================================================

interface SLAPolicyModalProps {
  policy: SlaPolicy | null;
  onSave: (data: Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  isLoading: boolean;
  styles: ReturnType<typeof useStyles>;
}

function SLAPolicyModal({ policy, onSave, onClose, isLoading, styles }: SLAPolicyModalProps) {
  const [formData, setFormData] = useState<Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>>({
    name: policy?.name || '',
    description: policy?.description || '',
    response_target_minutes: policy?.response_target_minutes || 60,
    resolution_target_minutes: policy?.resolution_target_minutes || 480,
    applies_to_priorities: policy?.applies_to_priorities || [],
    applies_to_types: policy?.applies_to_types || [],
    is_active: policy?.is_active ?? true,
    escalation_rules: policy?.escalation_rules || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const togglePriority = (priority: string) => {
    setFormData(prev => ({
      ...prev,
      applies_to_priorities: prev.applies_to_priorities.includes(priority)
        ? prev.applies_to_priorities.filter(p => p !== priority)
        : [...prev.applies_to_priorities, priority]
    }));
  };

  const toggleType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      applies_to_types: prev.applies_to_types.includes(type)
        ? prev.applies_to_types.filter(t => t !== type)
        : [...prev.applies_to_types, type]
    }));
  };

  return (
    <PurpleGlassModal
      title={policy ? 'Edit SLA Policy' : 'Create SLA Policy'}
      onClose={onClose}
      size="large"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <PurpleGlassInput
            label="Policy Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Critical Incident SLA"
          />

          <PurpleGlassTextarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe when this policy applies"
            rows={3}
          />

          <div className={styles.formRow}>
            <PurpleGlassInput
              label="Response Time (minutes)"
              type="number"
              value={formData.response_target_minutes.toString()}
              onChange={(e) => setFormData({ ...formData, response_target_minutes: parseInt(e.target.value) || 0 })}
              required
              min={1}
            />
            <PurpleGlassInput
              label="Resolution Time (minutes)"
              type="number"
              value={formData.resolution_target_minutes.toString()}
              onChange={(e) => setFormData({ ...formData, resolution_target_minutes: parseInt(e.target.value) || 0 })}
              required
              min={1}
            />
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxGroupLabel}>
              Applies to Priorities (empty = all)
            </label>
            <div className={styles.checkboxRow}>
              {PRIORITIES.map(p => (
                <PurpleGlassCheckbox
                  key={p}
                  label={p}
                  checked={formData.applies_to_priorities.includes(p)}
                  onChange={() => togglePriority(p)}
                />
              ))}
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxGroupLabel}>
              Applies to Ticket Types (empty = all)
            </label>
            <div className={styles.checkboxRow}>
              {TICKET_TYPES.map(t => (
                <PurpleGlassCheckbox
                  key={t}
                  label={t.replace('_', ' ')}
                  checked={formData.applies_to_types.includes(t)}
                  onChange={() => toggleType(t)}
                />
              ))}
            </div>
          </div>

          <PurpleGlassCheckbox
            label="Policy is Active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />

          <div className={styles.modalActions}>
            <EnhancedPurpleGlassButton variant="secondary" onClick={onClose} type="button">
              Cancel
            </EnhancedPurpleGlassButton>
            <EnhancedPurpleGlassButton 
              variant="primary" 
              type="submit"
              loading={isLoading}
            >
              {policy ? 'Save Changes' : 'Create Policy'}
            </EnhancedPurpleGlassButton>
          </div>
        </div>
      </form>
    </PurpleGlassModal>
  );
}

export default SLAManagementView;
