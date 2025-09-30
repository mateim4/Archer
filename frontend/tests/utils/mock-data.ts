// Mock data factories for testing

export const mockClusterData = [
  {
    id: 'cluster-1',
    name: 'Production Cluster',
    nodes: [
      {
        id: 'node-1',
        name: 'ESX-01',
        cpu: { total: 24, used: 12 },
        memory: { total: 128, used: 64 },
        storage: { total: 1000, used: 500 }
      },
      {
        id: 'node-2', 
        name: 'ESX-02',
        cpu: { total: 24, used: 18 },
        memory: { total: 128, used: 96 },
        storage: { total: 1000, used: 750 }
      }
    ],
    vms: [
      {
        id: 'vm-1',
        name: 'Web-Server-01',
        cpu: 4,
        memory: 16,
        storage: 100,
        node: 'node-1'
      },
      {
        id: 'vm-2',
        name: 'DB-Server-01', 
        cpu: 8,
        memory: 32,
        storage: 200,
        node: 'node-2'
      }
    ]
  },
  {
    id: 'cluster-2',
    name: 'Development Cluster',
    nodes: [
      {
        id: 'node-3',
        name: 'ESX-03',
        cpu: { total: 16, used: 8 },
        memory: { total: 64, used: 32 },
        storage: { total: 500, used: 250 }
      }
    ],
    vms: [
      {
        id: 'vm-3',
        name: 'Dev-Server-01',
        cpu: 2,
        memory: 8,
        storage: 50,
        node: 'node-3'
      }
    ]
  }
];

export const mockHardwareBaskets = [
  {
    id: 'basket-1',
    name: 'Q1 2024 Dell Refresh',
    vendor: 'Dell',
    status: 'processed',
    models: [
      {
        id: 'model-1',
        name: 'PowerEdge R650',
        cpu: 'Intel Xeon Silver 4314',
        memory: '64GB DDR4',
        storage: '2x 480GB SSD',
        quantity: 5
      },
      {
        id: 'model-2',
        name: 'PowerEdge R750',
        cpu: 'Intel Xeon Gold 6338',
        memory: '128GB DDR4',
        storage: '4x 960GB SSD',
        quantity: 3
      }
    ],
    uploadDate: '2024-01-15',
    processedDate: '2024-01-15'
  },
  {
    id: 'basket-2',
    name: 'Lenovo Storage Expansion',
    vendor: 'Lenovo',
    status: 'pending',
    models: [],
    uploadDate: '2024-01-20',
    processedDate: null
  }
];

export const mockProjectData = {
  id: 'project-1',
  name: 'Infrastructure Modernization 2024',
  description: 'Complete datacenter refresh and migration to hybrid cloud',
  status: 'active',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  activities: [
    {
      id: 'activity-1',
      name: 'Hardware Assessment',
      status: 'completed',
      startDate: '2024-01-01',
      endDate: '2024-02-28',
      progress: 100
    },
    {
      id: 'activity-2',
      name: 'Migration Planning',
      status: 'in-progress',
      startDate: '2024-02-15',
      endDate: '2024-06-30',
      progress: 65
    }
  ],
  team: [
    { id: 'user-1', name: 'John Doe', role: 'Project Manager' },
    { id: 'user-2', name: 'Jane Smith', role: 'Infrastructure Architect' }
  ]
};

export const mockUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  permissions: ['read', 'write', 'upload', 'delete']
};