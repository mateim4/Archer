# TASK-003: Create SLA Management View

**Task ID:** TASK-003  
**Priority:** P1 - High  
**Estimate:** 6 hours  
**Dependencies:** None (Layer 0 - Can start immediately)  
**Phase:** 1 - Core ITSM

---

## Objective

Create a new `SLAManagementView.tsx` that allows administrators to create, view, edit, and delete SLA policies. The backend service already exists - this task is frontend-only.

---

## Context

SLA (Service Level Agreement) management is critical for ITSM. The backend has full SLA policy CRUD operations implemented. This task creates the admin UI for managing these policies.

### Files to Create
- `frontend/src/views/SLAManagementView.tsx` (new view)
- `frontend/src/hooks/queries/useSLA.ts` (new query hooks)

### Files to Modify
- `frontend/src/App.tsx` (add route)
- `frontend/src/hooks/queries/index.ts` (export new hooks)
- `frontend/src/hooks/queries/queryKeys.ts` (add SLA keys)

### Reference Files (Read-Only)
- `backend/src/models/ticket.rs` - SlaPolicy, BusinessHours, EscalationRule models
- `backend/src/services/sla_service.rs` - SLA service operations
- `frontend/src/views/UserManagementView.tsx` - Similar admin view pattern
- `frontend/src/views/RoleManagementView.tsx` - Similar admin view pattern

---

## Backend API Reference

The SLA service provides these operations (from `sla_service.rs`):

```rust
// Available methods:
pub async fn create_sla_policy(&self, policy: SlaPolicy) -> Result<SlaPolicy>
pub async fn get_sla_policy(&self, id: &str) -> Result<Option<SlaPolicy>>
pub async fn list_sla_policies(&self, tenant_id: Option<&str>) -> Result<Vec<SlaPolicy>>
pub async fn update_sla_policy(&self, id: &str, policy: SlaPolicy) -> Result<SlaPolicy>
pub async fn delete_sla_policy(&self, id: &str) -> Result<()>
```

### SlaPolicy Model (from ticket.rs)

```rust
pub struct SlaPolicy {
    pub id: Option<Thing>,
    pub name: String,
    pub description: Option<String>,
    pub response_target_minutes: i64,      // First response time
    pub resolution_target_minutes: i64,    // Resolution time
    pub applies_to_priorities: Vec<TicketPriority>, // [P1, P2, P3, P4]
    pub applies_to_types: Vec<TicketType>,  // [Incident, Problem, etc.]
    pub business_hours_id: Option<Thing>,
    pub is_active: bool,
    pub escalation_rules: Vec<EscalationRule>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tenant_id: Option<Thing>,
}

pub struct EscalationRule {
    pub trigger_at_percent: u8,      // 50, 75, 100 (% of SLA time)
    pub notify_users: Vec<String>,
    pub notify_groups: Vec<String>,
    pub reassign_to: Option<String>,
}
```

---

## Required Implementation

### Step 1: Create Query Hooks

Create `frontend/src/hooks/queries/useSLA.ts`:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../utils/apiClient';
import { queryKeys } from './queryKeys';

// Types matching backend models
export interface EscalationRule {
  trigger_at_percent: number;
  notify_users: string[];
  notify_groups: string[];
  reassign_to?: string;
}

export interface SlaPolicy {
  id?: string;
  name: string;
  description?: string;
  response_target_minutes: number;
  resolution_target_minutes: number;
  applies_to_priorities: string[];
  applies_to_types: string[];
  business_hours_id?: string;
  is_active: boolean;
  escalation_rules: EscalationRule[];
  created_at?: string;
  updated_at?: string;
}

export function useSlaPolicies() {
  return useQuery({
    queryKey: queryKeys.sla.policies(),
    queryFn: async (): Promise<SlaPolicy[]> => {
      const response = await apiClient.get('/api/v1/sla/policies');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSlaPolicy(id: string) {
  return useQuery({
    queryKey: queryKeys.sla.policy(id),
    queryFn: async (): Promise<SlaPolicy> => {
      const response = await apiClient.get(`/api/v1/sla/policies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (policy: Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>) => {
      const response = await apiClient.post('/api/v1/sla/policies', policy);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
    },
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...policy }: SlaPolicy) => {
      const response = await apiClient.put(`/api/v1/sla/policies/${id}`, policy);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
    },
  });
}

export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/sla/policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sla.all });
    },
  });
}
```

### Step 2: Update Query Keys

Add to `queryKeys.ts`:

```tsx
sla: {
  all: ['sla'] as const,
  policies: () => [...queryKeys.sla.all, 'policies'] as const,
  policy: (id: string) => [...queryKeys.sla.all, 'policy', id] as const,
},
```

### Step 3: Create SLAManagementView

Create `frontend/src/views/SLAManagementView.tsx`:

```tsx
import React, { useState } from 'react';
import {
  PurpleGlassCard,
  PurpleGlassInput,
  PurpleGlassTextarea,
  PurpleGlassDropdown,
  PurpleGlassCheckbox,
  PurpleGlassEmptyState,
  PurpleGlassSkeleton,
  PurpleGlassModal,
  PageHeader,
  EnhancedPurpleGlassButton,
} from '../components/ui';
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
  useSlaPolicies,
  useCreateSlaPolicy,
  useUpdateSlaPolicy,
  useDeleteSlaPolicy,
  SlaPolicy,
  EscalationRule,
} from '../hooks/queries/useSLA';

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'];
const TICKET_TYPES = ['INCIDENT', 'PROBLEM', 'CHANGE', 'SERVICE_REQUEST'];

export const SLAManagementView: React.FC = () => {
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
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <PageHeader title="SLA Management" icon={<ClockRegular />} />
        <PurpleGlassSkeleton lines={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
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
        <div style={{ display: 'grid', gap: '16px' }}>
          {policies?.map(policy => (
            <SLAPolicyCard
              key={policy.id}
              policy={policy}
              onEdit={() => handleEdit(policy)}
              onDelete={() => setDeleteConfirm(policy.id!)}
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
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <PurpleGlassModal
          title="Delete SLA Policy?"
          onClose={() => setDeleteConfirm(null)}
        >
          <p>Are you sure you want to delete this SLA policy? This action cannot be undone.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
};

// Subcomponent: Policy Card
const SLAPolicyCard: React.FC<{
  policy: SlaPolicy;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ policy, onEdit, onDelete }) => {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <PurpleGlassCard>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>{policy.name}</h3>
            {policy.is_active ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                color: 'var(--success)',
                fontSize: '14px'
              }}>
                <CheckmarkCircleRegular /> Active
              </span>
            ) : (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                color: 'var(--text-secondary)',
                fontSize: '14px'
              }}>
                <DismissCircleRegular /> Inactive
              </span>
            )}
          </div>
          {policy.description && (
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>
              {policy.description}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '24px',
        marginTop: '24px',
        padding: '16px',
        background: 'var(--surface-secondary)',
        borderRadius: '8px'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Response Time
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {formatTime(policy.response_target_minutes)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Resolution Time
          </div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>
            {formatTime(policy.resolution_target_minutes)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Priorities
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {policy.applies_to_priorities.length === 0 ? (
              <span>All</span>
            ) : (
              policy.applies_to_priorities.map(p => (
                <span key={p} style={{ 
                  padding: '2px 8px', 
                  background: 'var(--primary)', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {p}
                </span>
              ))
            )}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Ticket Types
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {policy.applies_to_types.length === 0 ? (
              <span>All</span>
            ) : (
              policy.applies_to_types.map(t => (
                <span key={t} style={{ 
                  padding: '2px 8px', 
                  background: 'var(--info)', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {t.replace('_', ' ')}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {policy.escalation_rules.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)', 
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <AlertRegular /> Escalation Rules
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {policy.escalation_rules.map((rule, idx) => (
              <span key={idx} style={{ 
                padding: '4px 12px', 
                background: 'var(--warning-light)', 
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                At {rule.trigger_at_percent}%: Notify {rule.notify_users.length + rule.notify_groups.length} recipients
                {rule.reassign_to && ` → Reassign to ${rule.reassign_to}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </PurpleGlassCard>
  );
};

// Subcomponent: Create/Edit Modal
const SLAPolicyModal: React.FC<{
  policy: SlaPolicy | null;
  onSave: (data: Omit<SlaPolicy, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  isLoading: boolean;
}> = ({ policy, onSave, onClose, isLoading }) => {
  const [formData, setFormData] = useState({
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <PurpleGlassInput
              label="Response Time (minutes)"
              type="number"
              value={formData.response_target_minutes}
              onChange={(e) => setFormData({ ...formData, response_target_minutes: parseInt(e.target.value) })}
              required
              min={1}
            />
            <PurpleGlassInput
              label="Resolution Time (minutes)"
              type="number"
              value={formData.resolution_target_minutes}
              onChange={(e) => setFormData({ ...formData, resolution_target_minutes: parseInt(e.target.value) })}
              required
              min={1}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Applies to Priorities (empty = all)
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
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

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Applies to Ticket Types (empty = all)
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <EnhancedPurpleGlassButton variant="secondary" onClick={onClose}>
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
};

export default SLAManagementView;
```

### Step 4: Add Route

Update `frontend/src/App.tsx`:

```tsx
import { SLAManagementView } from './views/SLAManagementView';

// In routes:
<Route path="sla-management" element={<SLAManagementView />} />
```

---

## Acceptance Criteria

- [ ] View accessible at `/app/sla-management`
- [ ] Lists all existing SLA policies
- [ ] Empty state shown when no policies exist
- [ ] Can create new SLA policy via modal form
- [ ] Can edit existing policy
- [ ] Can delete policy with confirmation dialog
- [ ] Form validates required fields (name, times)
- [ ] Priority checkboxes work correctly
- [ ] Ticket type checkboxes work correctly
- [ ] Active/inactive toggle works
- [ ] Uses EnhancedPurpleGlassButton for all buttons
- [ ] Responsive layout (1400px max-width)
- [ ] No TypeScript errors
- [ ] No console errors

---

## Notes for Agent

- The SLA API routes may need to be added to `backend/src/api/mod.rs` if not already present
- Check `backend/src/services/sla_service.rs` for the exact API contract
- Escalation rules editor is optional for MVP - can be added in a follow-up task
- The view should follow the same patterns as UserManagementView and RoleManagementView
- Make sure all buttons use the new EnhancedPurpleGlassButton component
