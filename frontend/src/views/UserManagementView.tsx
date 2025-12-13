// Archer ITSM - User Management View
// Admin interface for managing users, roles, and permissions

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Text,
  Badge,
  Spinner,
  Tab,
  TabList,
  tokens,
  makeStyles,
  shorthands,
} from '@fluentui/react-components';
import {
  PersonRegular,
  PersonAddRegular,
  ShieldPersonRegular,
  LockClosedRegular,
  LockOpenRegular,
  EditRegular,
  DeleteRegular,
  SearchRegular,
  FilterRegular,
  ArrowSyncRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  WarningRegular,
  KeyRegular,
  PeopleTeamRegular,
} from '@fluentui/react-icons';
import {
  PurpleGlassCard,
  PurpleGlassButton,
  PurpleGlassInput,
  PurpleGlassDropdown,
  PurpleGlassModal,
  PurpleGlassBreadcrumb,
  PurpleGlassDataTable,
  PageHeader,
  type TableColumn,
} from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import {
  apiClient,
  type AdminUser,
  type AdminRole,
  type AdminPermission,
  type AdminUserStatus,
  type CreateAdminUserRequest,
  type UpdateAdminUserRequest,
} from '../utils/apiClient';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXL,
    maxWidth: '1600px',
    margin: '0 auto',
    padding: tokens.spacingHorizontalL,
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
    marginTop: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalM,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  searchBar: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flex: 1,
    minWidth: '300px',
    maxWidth: '500px',
  },
  filters: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalL,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    backgroundColor: 'var(--card-bg-subtle)',
    border: '1px solid var(--card-border-subtle)',
    boxShadow: 'none',
  },
  statIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: tokens.colorBrandForeground1,
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  statValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  tableContainer: {
    ...shorthands.padding(tokens.spacingVerticalM),
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
  },
  userName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  userEmail: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  roleBadges: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalM, '0'),
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: tokens.spacingHorizontalL,
  },
  formField: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  formFieldFull: {
    gridColumn: 'span 2',
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
  tabList: {
    marginTop: tokens.spacingVerticalL,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  }
});

// Status badge component
const StatusBadge: React.FC<{ status: AdminUserStatus }> = ({ status }) => {
  const styles = useStyles();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'ACTIVE':
        return { color: 'success' as const, icon: <CheckmarkCircleRegular />, label: 'Active' };
      case 'INACTIVE':
        return { color: 'warning' as const, icon: <DismissCircleRegular />, label: 'Inactive' };
      case 'LOCKED':
        return { color: 'danger' as const, icon: <LockClosedRegular />, label: 'Locked' };
      case 'PENDING_VERIFICATION':
        return { color: 'warning' as const, icon: <WarningRegular />, label: 'Pending' };
      default:
        return { color: 'subtle' as const, icon: null, label: status };
    }
  };
  
  const config = getStatusConfig();
  
  return (
    <Badge color={config.color} appearance="tint" className={styles.statusBadge}>
      {config.icon} {config.label}
    </Badge>
  );
};

// User Form Modal
interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAdminUserRequest | UpdateAdminUserRequest) => Promise<void>;
  user?: AdminUser;
  roles: AdminRole[];
  isLoading?: boolean;
  error?: string | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  roles,
  isLoading = false,
  error,
}) => {
  const styles = useStyles();
  const isEditing = !!user;
  
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    display_name: user?.display_name || '',
    password: '',
    confirmPassword: '',
    status: user?.status || 'ACTIVE' as AdminUserStatus,
    roles: user?.roles.map(r => r.id) || [],
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        password: '',
        confirmPassword: '',
        status: user.status,
        roles: user.roles.map(r => r.id),
      });
    } else {
      setFormData({
        email: '',
        username: '',
        display_name: '',
        password: '',
        confirmPassword: '',
        status: 'ACTIVE',
        roles: [],
      });
    }
    setValidationError(null);
  }, [user, isOpen]);
  
  const handleSubmit = async () => {
    setValidationError(null);
    
    // Validation
    if (!formData.email || !formData.username || !formData.display_name) {
      setValidationError('Please fill in all required fields');
      return;
    }
    
    if (!isEditing && !formData.password) {
      setValidationError('Password is required for new users');
      return;
    }
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    if (formData.password && formData.password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    
    if (isEditing) {
      const updateData: UpdateAdminUserRequest = {
        display_name: formData.display_name,
        status: formData.status,
        roles: formData.roles,
      };
      await onSubmit(updateData);
    } else {
      const createData: CreateAdminUserRequest = {
        email: formData.email,
        username: formData.username,
        display_name: formData.display_name,
        password: formData.password,
        roles: formData.roles,
      };
      await onSubmit(createData);
    }
  };
  
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'LOCKED', label: 'Locked' },
    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
  ];
  
  const roleOptions = roles.map(role => ({
    value: role.id,
    label: role.display_name,
  }));
  
  return (
    <PurpleGlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Create New User'}
      size="medium"
      footer={
        <>
          <PurpleGlassButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </PurpleGlassButton>
          <PurpleGlassButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Spinner size="tiny" /> : isEditing ? 'Save Changes' : 'Create User'}
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
        
        <div className={styles.formGrid}>
          <div className={styles.formField}>
            <Text className={styles.formLabel}>Email *</Text>
            <PurpleGlassInput
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              disabled={isEditing || isLoading}
              glass="light"
            />
          </div>
          
          <div className={styles.formField}>
            <Text className={styles.formLabel}>Username *</Text>
            <PurpleGlassInput
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="johndoe"
              disabled={isEditing || isLoading}
              glass="light"
            />
          </div>
          
          <div className={`${styles.formField} ${styles.formFieldFull}`}>
            <Text className={styles.formLabel}>Display Name *</Text>
            <PurpleGlassInput
              value={formData.display_name}
              onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
              placeholder="John Doe"
              disabled={isLoading}
              glass="light"
            />
          </div>
          
          {!isEditing && (
            <>
              <div className={styles.formField}>
                <Text className={styles.formLabel}>Password *</Text>
                <PurpleGlassInput
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  disabled={isLoading}
                  glass="light"
                />
                <Text className={styles.formHint}>Min. 8 characters, upper/lower/number</Text>
              </div>
              
              <div className={styles.formField}>
                <Text className={styles.formLabel}>Confirm Password *</Text>
                <PurpleGlassInput
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="••••••••"
                  disabled={isLoading}
                  glass="light"
                />
              </div>
            </>
          )}
          
          {isEditing && (
            <div className={styles.formField}>
              <Text className={styles.formLabel}>Status</Text>
              <PurpleGlassDropdown
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as AdminUserStatus }))}
                options={statusOptions}
                disabled={isLoading}
                glass="light"
              />
            </div>
          )}
          
          <div className={`${styles.formField} ${isEditing ? '' : styles.formFieldFull}`}>
            <Text className={styles.formLabel}>Roles</Text>
            <PurpleGlassDropdown
              value={formData.roles[0] || ''}
              onChange={(value) => {
                const roleValue = typeof value === 'string' ? value : '';
                setFormData(prev => ({ ...prev, roles: roleValue ? [roleValue] : [] }));
              }}
              options={roleOptions}
              placeholder="Select a role"
              disabled={isLoading}
              glass="light"
            />
            <Text className={styles.formHint}>User will have all permissions from the assigned role</Text>
          </div>
        </div>
      </div>
    </PurpleGlassModal>
  );
};

// Main component
export function UserManagementView() {
  const styles = useStyles();
  const { user: currentUser, hasPermission } = useAuth();
  
  // State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('users');
  
  // Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Delete confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  
  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [usersData, rolesData, permissionsData] = await Promise.all([
        apiClient.getAllUsers(),
        apiClient.getAllRoles(),
        apiClient.getAllPermissions(),
      ]);
      
      setUsers(usersData);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (err) {
      console.error('Failed to load user management data:', err);
      setError('Failed to load data. Please try again.');
      
      // Use mock data for development
      setUsers([
        {
          id: 'users:admin',
          email: 'admin@archer.local',
          username: 'admin',
          display_name: 'System Administrator',
          status: 'ACTIVE',
          roles: [{ id: 'roles:admin', name: 'admin', display_name: 'Administrator' }],
          permissions: ['*'],
          last_login: new Date().toISOString(),
          failed_login_attempts: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setRoles([
        {
          id: 'roles:admin',
          name: 'admin',
          display_name: 'Administrator',
          description: 'Full system access',
          permissions: ['*'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:agent',
          name: 'agent',
          display_name: 'Service Desk Agent',
          description: 'Can manage tickets and KB articles',
          permissions: ['tickets:*', 'knowledge:*'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'roles:viewer',
          name: 'viewer',
          display_name: 'Viewer',
          description: 'Read-only access',
          permissions: ['*:read'],
          is_system: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || user.status === statusFilter;
      
      const matchesRole = !roleFilter || user.roles.some(r => r.id === roleFilter);
      
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchQuery, statusFilter, roleFilter]);
  
  // Stats
  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'ACTIVE').length,
    inactive: users.filter(u => u.status === 'INACTIVE').length,
    locked: users.filter(u => u.status === 'LOCKED').length,
  }), [users]);
  
  // Handlers
  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setSubmitError(null);
    setIsUserModalOpen(true);
  };
  
  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setSubmitError(null);
    setIsUserModalOpen(true);
  };
  
  const handleDeleteUser = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };
  
  const handleSubmitUser = async (data: CreateAdminUserRequest | UpdateAdminUserRequest) => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (selectedUser) {
        await apiClient.updateAdminUser(selectedUser.id, data as UpdateAdminUserRequest);
      } else {
        await apiClient.createAdminUser(data as CreateAdminUserRequest);
      }
      
      await loadData();
      setIsUserModalOpen(false);
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setSubmitError(err.message || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.deleteAdminUser(userToDelete.id);
      await loadData();
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setSubmitError(err.message || 'Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Table columns
  const columns: TableColumn<AdminUser>[] = [
    {
      id: 'user',
      header: 'User',
      accessor: 'display_name',
      sortable: true,
      cell: (_value, row) => (
        <div className={styles.userInfo}>
          <Text className={styles.userName}>{row.display_name}</Text>
          <Text className={styles.userEmail}>{row.email}</Text>
        </div>
      ),
    },
    {
      id: 'username',
      header: 'Username',
      accessor: 'username',
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      sortable: true,
      cell: (value) => <StatusBadge status={value as AdminUserStatus} />,
    },
    {
      id: 'roles',
      header: 'Roles',
      accessor: 'roles',
      cell: (value) => {
        const roleList = value as AdminUser['roles'];
        return (
          <div className={styles.roleBadges}>
            {roleList.map(role => (
              <Badge key={role.id} color="brand" appearance="tint">
                {role.display_name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: 'last_login',
      header: 'Last Login',
      accessor: 'last_login',
      sortable: true,
      cell: (value) => value ? new Date(value as string).toLocaleDateString() : 'Never',
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: 'id',
      align: 'right',
      cell: (_value, row) => (
        <div className={styles.actions}>
          <PurpleGlassButton
            variant="ghost"
            size="small"
            icon={<EditRegular />}
            onClick={() => handleEditUser(row)}
            aria-label="Edit user"
          />
          <PurpleGlassButton
            variant="ghost"
            size="small"
            icon={<KeyRegular />}
            onClick={() => {/* TODO: Reset password modal */}}
            aria-label="Reset password"
          />
          <PurpleGlassButton
            variant="ghost"
            size="small"
            icon={<DeleteRegular />}
            onClick={() => handleDeleteUser(row)}
            disabled={row.id === currentUser?.id}
            aria-label="Delete user"
          />
        </div>
      ),
    },
  ];
  
  // Render
  const breadcrumbItems = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Settings', href: '/app/settings' },
    { label: 'User Management' },
  ];
  
  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'LOCKED', label: 'Locked' },
    { value: 'PENDING_VERIFICATION', label: 'Pending' },
  ];
  
  const roleOptions = [
    { value: '', label: 'All Roles' },
    ...roles.map(role => ({ value: role.id, label: role.display_name })),
  ];
  
  return (
    <div className={styles.container}>
      {/* Breadcrumb - kept separate as per request/standard */}
      <PurpleGlassBreadcrumb items={breadcrumbItems} />
      
      {/* Unified Page Header Card */}
      <PageHeader
        icon={<PeopleTeamRegular />}
        title="User Management"
        subtitle="Manage users, roles, and permissions for your organization"
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
              icon={<PersonAddRegular />}
              onClick={handleCreateUser}
            >
              Add User
            </PurpleGlassButton>
          </div>
        }
      >
        {/* Content Children of the Page Header */}
        
        {/* 1. Stats Grid */}
        <div className={styles.stats}>
          <PurpleGlassCard className={styles.statCard} variant="subtle" glass={true}>
            <div className={styles.statIcon}>
              <PersonRegular style={{ fontSize: '24px' }} />
            </div>
            <div className={styles.statContent}>
              <Text className={styles.statValue}>{stats.total}</Text>
              <Text className={styles.statLabel}>Total Users</Text>
            </div>
          </PurpleGlassCard>

          <PurpleGlassCard className={styles.statCard} variant="subtle" glass={true}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: tokens.colorPaletteGreenForeground1 }}>
              <CheckmarkCircleRegular style={{ fontSize: '24px' }} />
            </div>
            <div className={styles.statContent}>
              <Text className={styles.statValue}>{stats.active}</Text>
              <Text className={styles.statLabel}>Active</Text>
            </div>
          </PurpleGlassCard>

          <PurpleGlassCard className={styles.statCard} variant="subtle" glass={true}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: tokens.colorPaletteYellowForeground1 }}>
              <DismissCircleRegular style={{ fontSize: '24px' }} />
            </div>
            <div className={styles.statContent}>
              <Text className={styles.statValue}>{stats.inactive}</Text>
              <Text className={styles.statLabel}>Inactive</Text>
            </div>
          </PurpleGlassCard>

          <PurpleGlassCard className={styles.statCard} variant="subtle" glass={true}>
            <div className={styles.statIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: tokens.colorPaletteRedForeground1 }}>
              <LockClosedRegular style={{ fontSize: '24px' }} />
            </div>
            <div className={styles.statContent}>
              <Text className={styles.statValue}>{stats.locked}</Text>
              <Text className={styles.statLabel}>Locked</Text>
            </div>
          </PurpleGlassCard>
        </div>

        {/* 2. Tabs */}
        <div className={styles.tabList}>
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
            appearance="subtle"
          >
            <Tab value="users" icon={<PersonRegular />}>Users</Tab>
            <Tab value="roles" icon={<ShieldPersonRegular />}>Roles</Tab>
          </TabList>
        </div>

        {/* 3. Toolbar (Search & Filters) */}
        <div className={styles.toolbar}>
          <div className={styles.searchBar}>
            <PurpleGlassInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              prefixIcon={<SearchRegular />}
              glass="light"
            />
          </div>

          <div className={styles.filters}>
            <PurpleGlassDropdown
              value={statusFilter}
              onChange={(value) => setStatusFilter(typeof value === 'string' ? value : '')}
              options={statusOptions}
              placeholder="Filter by status"
              glass="light"
            />
            <PurpleGlassDropdown
              value={roleFilter}
              onChange={(value) => setRoleFilter(typeof value === 'string' ? value : '')}
              options={roleOptions}
              placeholder="Filter by role"
              glass="light"
            />
          </div>
        </div>
      </PageHeader>
      
      {/* Table - Kept in its own card as the main content area */}
      <PurpleGlassCard className={styles.tableContainer}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: tokens.spacingVerticalXXL }}>
            <Spinner size="large" label="Loading users..." />
          </div>
        ) : error && users.length === 0 ? (
          <div className={styles.emptyState}>
            <PersonRegular className={styles.emptyIcon} />
            <Text className={styles.emptyText}>
              {error}<br />
              <PurpleGlassButton variant="link" onClick={loadData}>Try again</PurpleGlassButton>
            </Text>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <PersonRegular className={styles.emptyIcon} />
            <Text className={styles.emptyText}>
              No users found matching your criteria
            </Text>
          </div>
        ) : (
          <PurpleGlassDataTable
            data={filteredUsers as unknown as Record<string, unknown>[]}
            columns={columns as unknown as TableColumn<Record<string, unknown>>[]}
            rowKey="id"
            sortable
            searchable={false}
            columnManagement={false}
            exportable
            exportFilename="archer-users"
          />
        )}
      </PurpleGlassCard>
      
      {/* User Form Modal */}
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleSubmitUser}
        user={selectedUser}
        roles={roles}
        isLoading={isSubmitting}
        error={submitError}
      />
      
      {/* Delete Confirmation Modal */}
      <PurpleGlassModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
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
          Are you sure you want to delete <strong>{userToDelete?.display_name}</strong>? 
          This action cannot be undone.
        </Text>
      </PurpleGlassModal>
    </div>
  );
}

export default UserManagementView;
