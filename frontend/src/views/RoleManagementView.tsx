// Archer ITSM - Role Management View
// Admin interface for managing roles and permissions

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  Badge,
  Spinner,
  tokens,
  makeStyles,
  shorthands,
  Checkbox,
} from '@fluentui/react-components';
import {
  ShieldPersonRegular,
  AddRegular,
  EditRegular,
  DeleteRegular,
  SearchRegular,
  ArrowSyncRegular,
  LockClosedRegular,
  InfoRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassModal,
  PurpleGlassBreadcrumb,
  PurpleGlassTextarea,
  PageHeader,
  EnhancedPurpleGlassSearchBar,
} from '../components/ui';
import {
  apiClient,
  type AdminRole,
  type AdminPermission,
  type CreateRoleRequest,
  type UpdateRoleRequest,
} from '../utils/apiClient';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalM,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  title: {
    fontSize: tokens.fontSizeHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground3,
  },
  headerRight: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingVerticalM,
  },
  searchBar: {
    maxWidth: '400px',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  roleCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  roleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  roleName: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  roleDescription: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  roleActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  permissionCount: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  permissionList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  permissionBadge: {
    fontSize: tokens.fontSizeBase100,
  },
  systemBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  formLabel: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  formHint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  permissionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: tokens.spacingVerticalM,
    maxHeight: '300px',
    overflowY: 'auto',
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  permissionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
  },
  permissionGroupTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    textTransform: 'uppercase',
    marginBottom: tokens.spacingVerticalXS,
  },
  permissionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  permissionLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  errorMessage: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding(tokens.spacingVerticalXXXL),
    gap: tokens.spacingVerticalL,
  },
  emptyIcon: {
    fontSize: '64px',
    color: tokens.colorNeutralForeground4,
  },
  emptyText: {
    color: tokens.colorNeutralForeground3,
    textAlign: 'center',
  },
});

// Role Form Modal
interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRoleRequest | UpdateRoleRequest) => Promise<void>;
  role?: AdminRole;
  permissions: AdminPermission[];
  isLoading?: boolean;
  error?: string | null;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  permissions,
  isLoading = false,
  error,
}) => {
  const styles = useStyles();
  const isEditing = !!role;
  
  const [formData, setFormData] = useState({
    name: role?.name || '',
    display_name: role?.display_name || '',
    description: role?.description || '',
    permissions: role?.permissions || [],
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description || '',
        permissions: role.permissions,
      });
    } else {
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: [],
      });
    }
    setValidationError(null);
  }, [role, isOpen]);
  
  // Group permissions by resource
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, AdminPermission[]> = {};
    permissions.forEach(perm => {
      const resource = perm.resource || 'other';
      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(perm);
    });
    return groups;
  }, [permissions]);
  
  const handleTogglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };
  
  const handleSubmit = async () => {
    setValidationError(null);
    
    // Validation
    if (!formData.name || !formData.display_name) {
      setValidationError('Name and display name are required');
      return;
    }
    
    if (!/^[a-z_]+$/.test(formData.name)) {
      setValidationError('Name must be lowercase letters and underscores only');
      return;
    }
    
    if (isEditing) {
      const updateData: UpdateRoleRequest = {
        display_name: formData.display_name,
        description: formData.description || undefined,
        permissions: formData.permissions,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateRoleRequest = {
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description || undefined,
        permissions: formData.permissions,
      };
      await onSubmit(createData);
    }
  };
  
  return (
    <PurpleGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Role' : 'Create New Role'}
      size="large"
      footer={
        <>
          <PurpleGlassButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner size="tiny" /> : isEditing ? 'Save Changes' : 'Create Role'}
          </PurpleGlassButton>
        </>
      }
    >
      <div className={styles.modalContent}>
        {(error || validationError) && (
          <div className={styles.errorMessage}>
            {error || validationError}
          </div>
        )}
        
        <div className={styles.formField}>
          <Text className={styles.formLabel}>Role Name *</Text>
          <PurpleGlassInput
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="service_manager"
            disabled={isEditing || isLoading}
            glass="light"
          />
          <Text className={styles.formHint}>Lowercase letters and underscores only. Cannot be changed after creation.</Text>
        </div>
        
        <div className={styles.formField}>
          <Text className={styles.formLabel}>Display Name *</Text>
          <PurpleGlassInput
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="Service Manager"
            disabled={isLoading}
            glass="light"
          />
        </div>
        
        <div className={styles.formField}>
          <Text className={styles.formLabel}>Description</Text>
          <PurpleGlassTextarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the role's responsibilities and access level..."
            disabled={isLoading}
            glass="light"
            rows={3}
          />
        </div>
        
        <div className={styles.formField}>
          <Text className={styles.formLabel}>Permissions</Text>
          <Text className={styles.formHint}>
            Select the permissions this role should have. Users with this role will be granted all selected permissions.
          </Text>
          
          <div className={styles.permissionsGrid}>
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div key={resource} className={styles.permissionGroup}>
                <Text className={styles.permissionGroupTitle}>{resource}</Text>
                {perms.map(perm => (
                  <div key={perm.id} className={styles.permissionItem}>
                    <Checkbox
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => handleTogglePermission(perm.id)}
                      disabled={isLoading}
                    />
                    <Text className={styles.permissionLabel}>
                      {perm.display_name}
                    </Text>
                  </div>
                ))}
              </div>
            ))}
            
            {permissions.length === 0 && (
              <Text className={styles.formHint}>
                No permissions available. Permissions are created automatically when modules are enabled.
              </Text>
            )}
          </div>
        </div>
      </div>
    </PurpleGlassModal>
  );
};

// Main component
export function RoleManagementView() {
  const styles = useStyles();
  
  // State
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<AdminRole | null>(null);
  
  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [rolesData, permissionsData] = await Promise.all([
        apiClient.getAllRoles(),
        apiClient.getAllPermissions(),
      ]);
      
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Failed to load role management data:', err);
      setError('Failed to load data. Please try again.');
      
      // Use mock data for development
      setRoles([
        {
          id: 'roles:super_admin',
          name: 'super_admin',
          display_name: 'Super Administrator',
          description: 'Full system access across all tenants',
          permissions: ['*'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:admin',
          name: 'admin',
          display_name: 'Administrator',
          description: 'Full access within tenant',
          permissions: ['users:*', 'tickets:*', 'knowledge:*', 'cmdb:*', 'settings:*'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:service_manager',
          name: 'service_manager',
          display_name: 'Service Manager',
          description: 'Can manage service desk operations and reports',
          permissions: ['tickets:*', 'knowledge:*', 'reports:read'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:agent',
          name: 'agent',
          display_name: 'Service Desk Agent',
          description: 'Can manage tickets and knowledge base articles',
          permissions: ['tickets:create', 'tickets:read', 'tickets:update', 'knowledge:read', 'knowledge:create'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:viewer',
          name: 'viewer',
          display_name: 'Viewer',
          description: 'Read-only access to the system',
          permissions: ['tickets:read', 'knowledge:read', 'cmdb:read'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      
      setPermissions([
        { id: 'perm:tickets:create', name: 'tickets:create', display_name: 'Create Tickets', resource: 'tickets', action: 'create', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:tickets:read', name: 'tickets:read', display_name: 'View Tickets', resource: 'tickets', action: 'read', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:tickets:update', name: 'tickets:update', display_name: 'Update Tickets', resource: 'tickets', action: 'update', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:tickets:delete', name: 'tickets:delete', display_name: 'Delete Tickets', resource: 'tickets', action: 'delete', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:knowledge:create', name: 'knowledge:create', display_name: 'Create Articles', resource: 'knowledge', action: 'create', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:knowledge:read', name: 'knowledge:read', display_name: 'View Articles', resource: 'knowledge', action: 'read', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:knowledge:update', name: 'knowledge:update', display_name: 'Update Articles', resource: 'knowledge', action: 'update', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:cmdb:read', name: 'cmdb:read', display_name: 'View CMDB', resource: 'cmdb', action: 'read', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:cmdb:manage', name: 'cmdb:manage', display_name: 'Manage CMDB', resource: 'cmdb', action: 'manage', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:users:manage', name: 'users:manage', display_name: 'Manage Users', resource: 'users', action: 'manage', is_system: true, created_at: new Date().toISOString() },
        { id: 'perm:settings:manage', name: 'settings:manage', display_name: 'Manage Settings', resource: 'settings', action: 'manage', is_system: true, created_at: new Date().toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter roles
  const filteredRoles = useMemo(() => {
    return roles.filter(role => {
      const matchesSearch = !searchQuery || 
        role.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [roles, searchQuery]);
  
  // Handlers
  const handleCreateRole = () => {
    setSelectedRole(undefined);
    setSubmitError(null);
    setIsRoleModalOpen(true);
  };
  
  const handleEditRole = (role: AdminRole) => {
    setSelectedRole(role);
    setSubmitError(null);
    setIsRoleModalOpen(true);
  };
  
  const handleDeleteRole = (role: AdminRole) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  };
  
  const handleSubmitRole = async (data: CreateRoleRequest | UpdateRoleRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (selectedRole) {
        await apiClient.updateRole(selectedRole.id, data as UpdateRoleRequest);
      } else {
        await apiClient.createRole(data as CreateRoleRequest);
      }
      
      await loadData();
      setIsRoleModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save role:', err);
      setSubmitError(err.message || 'Failed to save role');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.deleteRole(roleToDelete.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      setSubmitError(err.message || 'Failed to delete role');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Settings', href: '/app/settings' },
    { label: 'Role Management' },
  ];
  
  return (
    <div className={styles.container}>
      <PurpleGlassBreadcrumb items={breadcrumbItems} />
      
      {/* Header */}
      <PageHeader
        icon={<ShieldPersonRegular />}
        title="Role Management"
        subtitle="Define roles and assign permissions to control access"
        actions={
          <div className={styles.headerRight}>
            <PurpleGlassButton
              variant="secondary"
              icon={<ArrowSyncRegular />}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="primary"
              icon={<AddRegular />}
              onClick={handleCreateRole}
            >
              Create Role
            </PurpleGlassButton>
          </div>
        }
      />
      
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <EnhancedPurpleGlassSearchBar
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            placeholder="Search roles..."
            showClearButton
          />
        </div>
        
        <Text style={{ color: tokens.colorNeutralForeground3 }}>
          {filteredRoles.length} of {roles.length} roles
        </Text>
      </div>
      
      {/* Role Grid */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
          <Spinner size="large" label="Loading roles..." />
        </div>
      ) : error && roles.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldPersonRegular className={styles.emptyIcon} />
          <Text className={styles.emptyText}>
            {error}<br />
            <PurpleGlassButton variant="link" onClick={loadData}>Try again</PurpleGlassButton>
          </Text>
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className={styles.emptyState}>
          <ShieldPersonRegular className={styles.emptyIcon} />
          <Text className={styles.emptyText}>
            No roles found matching your search
          </Text>
        </div>
      ) : (
        <div className={styles.roleGrid}>
          {filteredRoles.map(role => (
            <PurpleGlassCard key={role.id} className={styles.roleCard}>
              <div className={styles.roleHeader}>
                <div className={styles.roleInfo}>
                  <Text className={styles.roleName}>
                    {role.display_name}
                    {role.is_system && (
                      <Badge color="informative" appearance="tint" className={styles.systemBadge}>
                        <LockClosedRegular /> System
                      </Badge>
                    )}
                  </Text>
                  <Text className={styles.roleDescription}>
                    {role.description || 'No description'}
                  </Text>
                </div>
                
                <div className={styles.roleActions}>
                  <PurpleGlassButton
                    variant="ghost"
                    size="small"
                    icon={<EditRegular />}
                    onClick={() => handleEditRole(role)}
                    aria-label="Edit role"
                  />
                  <PurpleGlassButton
                    variant="ghost"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => handleDeleteRole(role)}
                    disabled={role.is_system}
                    aria-label="Delete role"
                  />
                </div>
              </div>
              
              <div className={styles.permissionCount}>
                <InfoRegular />
                <span>{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
              </div>
              
              <div className={styles.permissionList}>
                {role.permissions.slice(0, 5).map(perm => (
                  <Badge key={perm} appearance="outline" className={styles.permissionBadge}>
                    {perm}
                  </Badge>
                ))}
                {role.permissions.length > 5 && (
                  <Badge appearance="outline" className={styles.permissionBadge}>
                    +{role.permissions.length - 5} more
                  </Badge>
                )}
              </div>
            </PurpleGlassCard>
          ))}
        </div>
      )}
      
      {/* Role Form Modal */}
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSubmit={handleSubmitRole}
        role={selectedRole}
        permissions={permissions}
        isLoading={isSubmitting}
        error={submitError}
      />
      
      {/* Delete Confirmation Modal */}
      <PurpleGlassModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Role"
        size="small"
        footer={
          <>
            <PurpleGlassButton variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </PurpleGlassButton>
            <PurpleGlassButton
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner size="tiny" /> : 'Delete'}
            </PurpleGlassButton>
          </>
        }
      >
        <Text>
          Are you sure you want to delete the <strong>{roleToDelete?.display_name}</strong> role? 
          Users with this role will lose its associated permissions.
        </Text>
      </PurpleGlassModal>
    </div>
  );
}

export default RoleManagementView;
