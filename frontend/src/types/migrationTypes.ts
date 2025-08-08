// Migration Project Types and Interfaces
// Extending the existing backend models with frontend-specific migration types

export type TaskStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ProjectType = 'vmware_to_hyperv' | 'vmware_to_azure_local' | 'general_migration' | 'hardware_refresh';

// Maps to backend StageStatus but with more granular migration statuses
export type MigrationStageStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'cancelled' | 'waiting_approval';

export interface TaskDependency {
  id: string;
  dependsOn: string; // Task ID that this task depends on
  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag?: number; // Days of lag/lead time
}

// Enhanced migration task that extends the backend Stage model
export interface MigrationTask {
  id: string;
  projectId: string;
  workflowId: string; // Maps to backend Workflow.id
  name: string;
  description: string;
  taskType: string;
  status: MigrationStageStatus;
  priority: TaskPriority;
  assignedTo?: string[];
  estimatedHours: number;
  actualHours?: number;
  startDate: string;
  endDate: string;
  dependencies: TaskDependency[];
  tags: string[];
  notes?: string;
  resources?: string[]; // Hardware, software, or human resources needed
  completionPercentage: number;
  
  // Migration-specific fields
  hardwareRequirements?: HardwareRequirement[];
  networkRequirements?: NetworkRequirement[];
  validationCriteria?: ValidationCriteria[];
  riskLevel?: 'low' | 'medium' | 'high';
  rollbackPlan?: string;
  
  // Extends backend Stage
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// Hardware compatibility and requirements tracking
export interface HardwareRequirement {
  id: string;
  type: 'server' | 'network_card' | 'storage_controller' | 'jbod' | 'other';
  specification: string;
  isCompatible: boolean;
  currentHardware?: HardwareItem;
  recommendedHardware?: VendorHardwareItem[];
  reason?: string; // Why replacement is needed
}

// Basic hardware item type that extends backend Server model
export interface HardwareItem {
  id: string;
  name: string;
  vendor: string;
  model: string;
  specifications: Record<string, any>;
  status: 'available' | 'allocated' | 'maintenance' | 'retired';
  location?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
}

// Vendor hardware database item
export interface VendorHardwareItem {
  id: string;
  vendor: string;
  model: string;
  category: string;
  specifications: Record<string, any>;
  price?: number;
  availability: 'available' | 'discontinued' | 'coming_soon';
  supportedFeatures: string[];
}

export interface NetworkRequirement {
  id: string;
  type: 'rdma' | 'roce' | 'vlan' | 'bandwidth' | 'latency';
  specification: string;
  currentConfig?: string;
  targetConfig: string;
  isCompliant: boolean;
  remediationSteps?: string[];
}

export interface ValidationCriteria {
  id: string;
  category: 'performance' | 'functionality' | 'security' | 'compliance';
  description: string;
  testProcedure: string;
  acceptanceCriteria: string;
  status: 'pending' | 'passed' | 'failed' | 'skipped';
}

export interface Comment {
  id: string;
  user: string;
  content: string;
  createdAt: string;
}

export interface MigrationProject {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  ownerId: string;
  teamMembers: string[];
  status: 'planning' | 'active' | 'paused' | 'completed' | 'cancelled';
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;
  budget?: number;
  priority: TaskPriority;
  
  // Migration-specific fields
  sourceEnvironment: {
    type: 'vmware' | 'hyperv' | 'physical';
    version?: string;
    clusterCount?: number;
    vmCount?: number;
    hostCount?: number;
  };
  
  targetEnvironment: {
    type: 'hyperv' | 'azure_local' | 'physical';
    version?: string;
    deploymentModel?: 'new_hardware' | 'existing_hardware' | 'hybrid';
  };
  
  // Project metadata
  tags: string[];
  createdAt: string;
  updatedAt: string;
  
  // Analytics
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  estimatedDuration: number; // days
  tasks: Omit<MigrationTask, 'id' | 'projectId' | 'workflowId' | 'createdAt' | 'updatedAt'>[];
  tags: string[];
  isBuiltIn: boolean;
}

export interface TimelineView {
  startDate: string;
  endDate: string;
  zoomLevel: 'day' | 'week' | 'month' | 'quarter';
  showDependencies: boolean;
  showCriticalPath: boolean;
  groupBy?: 'none' | 'assignee' | 'taskType' | 'priority';
}

// Task type definitions for migration projects
export const MIGRATION_TASK_TYPES = {
  ASSESSMENT: {
    id: 'assessment',
    name: 'Assessment',
    color: '#3b82f6',
    icon: 'Search',
    description: 'Analysis and discovery tasks'
  },
  PLANNING: {
    id: 'planning',
    name: 'Planning',
    color: '#8b5cf6',
    icon: 'Map',
    description: 'Design and planning activities'
  },
  HARDWARE_PROCUREMENT: {
    id: 'hardware_procurement',
    name: 'Hardware Procurement',
    color: '#f59e0b',
    icon: 'ShoppingCart',
    description: 'Hardware ordering and delivery'
  },
  HARDWARE_PREPARATION: {
    id: 'hardware_preparation',
    name: 'Hardware Preparation',
    color: '#06b6d4',
    icon: 'Settings',
    description: 'Hardware setup and configuration'
  },
  MIGRATION_EXECUTION: {
    id: 'migration_execution',
    name: 'Migration Execution',
    color: '#10b981',
    icon: 'ArrowRightLeft',
    description: 'Actual migration tasks'
  },
  TESTING_VALIDATION: {
    id: 'testing_validation',
    name: 'Testing & Validation',
    color: '#ec4899',
    icon: 'CheckCircle',
    description: 'Testing and validation activities'
  },
  DECOMMISSION: {
    id: 'decommission',
    name: 'Decommission',
    color: '#ef4444',
    icon: 'Trash2',
    description: 'Cleanup and decommissioning'
  },
  DOCUMENTATION: {
    id: 'documentation',
    name: 'Documentation',
    color: '#6b7280',
    icon: 'FileText',
    description: 'Documentation and knowledge transfer'
  }
} as const;

// Built-in project templates
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'vmware-to-hyperv-complete',
    name: 'VMware to Hyper-V Complete Migration',
    description: 'Comprehensive migration from VMware vSphere to Microsoft Hyper-V',
    projectType: 'vmware_to_hyperv',
    estimatedDuration: 120, // 4 months
    isBuiltIn: true,
    tags: ['vmware', 'hyperv', 'complete-migration'],
    tasks: [
      {
        name: 'Infrastructure Assessment',
        description: 'Complete assessment of current VMware environment',
        taskType: 'assessment',
        status: 'not_started',
        priority: 'high',
        estimatedHours: 40,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['assessment', 'discovery'],
        completionPercentage: 0
      },
      {
        name: 'RVTools Data Collection',
        description: 'Gather RVTools reports from all vCenter instances',
        taskType: 'assessment',
        status: 'not_started',
        priority: 'high',
        estimatedHours: 16,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['rvtools', 'data-collection'],
        completionPercentage: 0
      },
      {
        name: 'Target Architecture Design',
        description: 'Design Hyper-V cluster architecture and networking',
        taskType: 'planning',
        status: 'not_started',
        priority: 'high',
        estimatedHours: 80,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['architecture', 'design'],
        completionPercentage: 0
      },
      {
        name: 'Hardware Compatibility Analysis',
        description: 'Validate existing hardware compatibility with Hyper-V',
        taskType: 'assessment',
        status: 'not_started',
        priority: 'medium',
        estimatedHours: 24,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['compatibility', 'hardware'],
        completionPercentage: 0
      },
      {
        name: 'Procurement Planning',
        description: 'Plan hardware procurement for new Hyper-V infrastructure',
        taskType: 'hardware_procurement',
        status: 'not_started',
        priority: 'high',
        estimatedHours: 32,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['procurement', 'planning'],
        completionPercentage: 0
      }
    ]
  },
  {
    id: 'vmware-to-azure-local',
    name: 'VMware to Azure Local Migration',
    description: 'Migration from VMware vSphere to Microsoft Azure Local (Azure Stack HCI)',
    projectType: 'vmware_to_azure_local',
    estimatedDuration: 150, // 5 months
    isBuiltIn: true,
    tags: ['vmware', 'azure-local', 'hci'],
    tasks: [
      {
        name: 'Azure Local Readiness Assessment',
        description: 'Assess readiness for Azure Local deployment',
        taskType: 'assessment',
        status: 'not_started',
        priority: 'critical',
        estimatedHours: 60,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['azure-local', 'readiness'],
        completionPercentage: 0
      },
      {
        name: 'Hardware Requirements Validation',
        description: 'Validate hardware meets Azure Local requirements (RDMA, JBOD, etc.)',
        taskType: 'assessment',
        status: 'not_started',
        priority: 'critical',
        estimatedHours: 40,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['hardware', 'validation', 'rdma'],
        completionPercentage: 0
      },
      {
        name: 'Storage Spaces Direct Design',
        description: 'Design S2D configuration and storage layout',
        taskType: 'planning',
        status: 'not_started',
        priority: 'high',
        estimatedHours: 48,
        startDate: '',
        endDate: '',
        dependencies: [],
        tags: ['s2d', 'storage', 'design'],
        completionPercentage: 0
      }
    ]
  }
];
