# API Specifications: Project Management System

## Issue Description
Document comprehensive API specifications for the project management system, including request/response schemas, validation rules, error handling, and integration patterns with existing hardware basket APIs.

## Background
The project management system requires a robust API layer that integrates with existing hardware basket functionality while adding new capabilities for projects, activities, server inventory, and capacity planning.

## API Endpoint Specifications

### Projects API

#### GET /api/projects
**Description**: Retrieve all projects for the current user
**Response**: Array of Project objects

```typescript
interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  activities_count: number;
  completed_activities: number;
  assignees: string[];
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  budget?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

// Example Response
{
  "projects": [
    {
      "id": "project:abc123",
      "name": "Data Center Migration 2025",
      "description": "Migrate production workloads to new infrastructure",
      "status": "in_progress",
      "activities_count": 5,
      "completed_activities": 2,
      "assignees": ["john.doe", "jane.smith"],
      "start_date": "2025-01-15T00:00:00Z",
      "end_date": "2025-06-30T00:00:00Z",
      "created_at": "2025-01-10T10:30:00Z",
      "updated_at": "2025-01-20T14:22:00Z",
      "budget": 150000,
      "priority": "high"
    }
  ]
}
```

#### POST /api/projects
**Description**: Create a new project
**Request Body**: CreateProjectRequest
**Response**: Created project with generated ID

```typescript
interface CreateProjectRequest {
  name: string; // Required, 1-100 characters
  description: string; // Required, 1-500 characters
  assignees?: string[]; // Optional, array of user IDs
  start_date?: string; // Optional, ISO 8601, defaults to today
  end_date?: string; // Optional, ISO 8601, defaults to start_date + 6 months
  budget?: number; // Optional, positive number
  priority?: 'low' | 'medium' | 'high' | 'critical'; // Optional, defaults to 'medium'
}

// Validation Rules
{
  "name": {
    "required": true,
    "minLength": 1,
    "maxLength": 100,
    "pattern": "^[a-zA-Z0-9\\s\\-_\\.]+$"
  },
  "description": {
    "required": true,
    "minLength": 1,
    "maxLength": 500
  },
  "budget": {
    "type": "number",
    "minimum": 0,
    "maximum": 10000000
  },
  "start_date": {
    "type": "string",
    "format": "date-time"
  },
  "end_date": {
    "type": "string",
    "format": "date-time",
    "mustBeAfter": "start_date"
  }
}
```

#### GET /api/projects/:id
**Description**: Retrieve a specific project with activities
**Response**: Detailed project with embedded activities

```typescript
interface DetailedProjectResponse extends ProjectResponse {
  activities: ActivityResponse[];
  timeline_data: {
    total_duration_days: number;
    critical_path: string[]; // Activity IDs
    dependencies_graph: Record<string, string[]>;
  };
}
```

#### PUT /api/projects/:id
**Description**: Update an existing project
**Request Body**: Partial<CreateProjectRequest>
**Response**: Updated project

#### DELETE /api/projects/:id
**Description**: Delete a project and all associated activities
**Response**: 204 No Content

### Activities API

#### GET /api/projects/:project_id/activities
**Description**: Get all activities for a project
**Response**: Array of Activity objects

```typescript
interface ActivityResponse {
  id: string;
  project_id: string;
  activity_type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  name: string;
  description?: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  start_date: string; // ISO 8601
  end_date: string; // ISO 8601
  progress: number; // 0-100
  dependencies: string[]; // Activity IDs
  wizard_config?: WizardConfiguration;
  servers_involved: string[]; // Server IDs
  add_to_free_pool: boolean;
  created_at: string;
  updated_at: string;
}

interface WizardConfiguration {
  activity_type: string;
  overcommit_ratios: {
    cpu_ratio: string;
    memory_ratio: string;
    ha_policy: string;
    custom_cpu_ratio?: number;
    custom_memory_ratio?: number;
  };
  capacity_requirements: {
    current_workload: {
      total_vcpu: number;
      total_vmemory_gb: number;
      vm_count: number;
    };
    target_capacity: {
      required_physical_cpu: number;
      required_physical_memory_gb: number;
      required_nodes: number;
    };
    growth_factor: number;
  };
  hardware_selection: {
    source: 'existing' | 'purchase' | 'mixed';
    existing_servers: string[];
    new_hardware: HardwareRecommendation[];
    commissioning_required: boolean;
  };
}
```

#### POST /api/projects/:project_id/activities
**Description**: Create a new activity within a project
**Request Body**: CreateActivityRequest

```typescript
interface CreateActivityRequest {
  activity_type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'custom';
  name: string; // Required, 1-100 characters
  description?: string; // Optional, max 500 characters
  assignee: string; // Required, user ID
  start_date: string; // Required, ISO 8601
  end_date: string; // Required, ISO 8601, must be after start_date
  dependencies?: string[]; // Optional, array of activity IDs
  wizard_config?: WizardConfiguration; // Optional, saved wizard state
}

// Validation Rules
{
  "name": {
    "required": true,
    "minLength": 1,
    "maxLength": 100
  },
  "assignee": {
    "required": true,
    "pattern": "^[a-zA-Z0-9\\.\\-_]+$"
  },
  "start_date": {
    "required": true,
    "type": "string",
    "format": "date-time"
  },
  "end_date": {
    "required": true,
    "type": "string",
    "format": "date-time",
    "mustBeAfter": "start_date"
  },
  "dependencies": {
    "type": "array",
    "items": {
      "type": "string",
      "pattern": "^activity:[a-zA-Z0-9]+$"
    },
    "maxItems": 10
  }
}
```

#### PUT /api/activities/:id
**Description**: Update an activity
**Request Body**: Partial<CreateActivityRequest>
**Response**: Updated activity

#### DELETE /api/activities/:id
**Description**: Delete an activity
**Response**: 204 No Content

#### POST /api/activities/:id/wizard-config
**Description**: Save wizard configuration for an activity
**Request Body**: WizardConfiguration
**Response**: Updated activity with saved config

#### GET /api/activities/:id/capacity-sizing
**Description**: Calculate capacity requirements for an activity
**Response**: Capacity sizing analysis

```typescript
interface CapacitySizingResponse {
  current_capacity: {
    total_cpu_cores: number;
    total_memory_gb: number;
    available_cpu_cores: number;
    available_memory_gb: number;
    node_count: number;
  };
  requirements: {
    target_cpu_cores: number;
    target_memory_gb: number;
    target_nodes: number;
    with_overcommit: {
      effective_cpu_ratio: number;
      effective_memory_ratio: number;
      ha_multiplier: number;
    };
  };
  gap_analysis: {
    cpu_cores_needed: number;
    memory_gb_needed: number;
    nodes_needed: number;
    can_use_existing: boolean;
  };
  recommendations: {
    existing_servers: ServerRecommendation[];
    new_hardware: HardwareRecommendation[];
    total_cost_estimate: number;
    timeline_impact_weeks: number;
  };
}

interface ServerRecommendation {
  server_id: string;
  model_name: string;
  cpu_cores: number;
  memory_gb: number;
  current_status: string;
  assignment_feasible: boolean;
}

interface HardwareRecommendation {
  basket_item_id: string;
  model_name: string;
  vendor: string;
  quantity: number;
  total_cpu_cores: number;
  total_memory_gb: number;
  unit_price: number;
  total_cost: number;
  availability_weeks: number;
}
```

### Server Inventory API

#### GET /api/servers
**Description**: Get all servers in inventory
**Query Parameters**:
- `status`: Filter by status (available, in_use, maintenance, decommissioned)
- `vendor`: Filter by vendor
- `form_factor`: Filter by form factor
- `source`: Filter by source (rvtools, manual, hardware_basket)
- `search`: Search in model name, location, notes
- `limit`: Max results (default: 100)
- `offset`: Pagination offset (default: 0)

**Response**: Paginated server list

```typescript
interface ServerInventoryResponse {
  id: string;
  model_name: string;
  vendor: string;
  specifications: {
    processor: {
      model: string;
      cores: number;
      threads?: number;
      speed_ghz?: number;
    };
    memory: {
      total_gb: number;
      type?: string; // DDR4, DDR5
      speed?: string; // 3200MHz
    };
    storage: {
      total_capacity: string; // "2TB", "480GB SSD"
      type?: string; // SSD, HDD, NVMe
      drives?: number;
    };
    network: {
      ports?: number;
      speed?: string; // 1GbE, 10GbE
      type?: string; // Ethernet, InfiniBand
    };
    form_factor: string; // 1U, 2U, Tower, Blade
  };
  status: 'available' | 'in_use' | 'maintenance' | 'decommissioned';
  location: string;
  assigned_project?: string;
  assigned_activity?: string;
  source: 'rvtools' | 'manual' | 'hardware_basket';
  purchase_date?: string;
  warranty_end?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PaginatedServerResponse {
  servers: ServerInventoryResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  filters_applied: {
    status?: string;
    vendor?: string;
    form_factor?: string;
    source?: string;
    search?: string;
  };
}
```

#### POST /api/servers
**Description**: Add a server to inventory
**Request Body**: CreateServerRequest

```typescript
interface CreateServerRequest {
  model_name: string; // Required
  vendor: string; // Required
  specifications: {
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
    network?: {
      ports?: number;
      speed?: string;
      type?: string;
    };
    form_factor: string;
  };
  location: string; // Required
  source: 'manual' | 'hardware_basket'; // rvtools is import-only
  purchase_date?: string;
  warranty_end?: string;
  notes?: string;
}
```

#### PUT /api/servers/:id
**Description**: Update server information
**Request Body**: Partial<CreateServerRequest>
**Response**: Updated server

#### DELETE /api/servers/:id
**Description**: Remove server from inventory
**Response**: 204 No Content

#### POST /api/servers/import-rvtools
**Description**: Import servers from RVTools CSV/Excel file
**Request Body**: Multipart form with file upload
**Response**: Import summary

```typescript
interface RVToolsImportResponse {
  success: boolean;
  imported_count: number;
  updated_count: number;
  skipped_count: number;
  errors: string[];
  imported_servers: ServerInventoryResponse[];
}
```

### Hardware Pool API

#### GET /api/hardware-pool
**Description**: Get servers in the free hardware pool
**Response**: Array of free pool entries

```typescript
interface FreeHardwareEntry {
  id: string;
  server: ServerInventoryResponse;
  available_from: string; // ISO 8601
  released_from_activity?: string;
  reserved_until?: string; // ISO 8601
  reserved_by?: string; // User ID
  notes?: string;
  created_at: string;
}
```

#### POST /api/hardware-pool/:server_id
**Description**: Add a server to the free hardware pool
**Request Body**: AddToPoolRequest

```typescript
interface AddToPoolRequest {
  available_from: string; // ISO 8601, defaults to now
  released_from_activity?: string; // Activity ID that freed this server
  notes?: string;
}
```

#### DELETE /api/hardware-pool/:server_id
**Description**: Remove server from free hardware pool
**Response**: 204 No Content

#### POST /api/hardware-pool/:server_id/reserve
**Description**: Reserve a server from the pool
**Request Body**: ReserveServerRequest

```typescript
interface ReserveServerRequest {
  reserved_until: string; // ISO 8601
  reserved_by: string; // User ID
  purpose: string; // Description of reservation purpose
}
```

### Integration with Existing Hardware Baskets API

#### GET /api/hardware-baskets/:id/procurement-options
**Description**: Get procurement options for converting basket items to server inventory
**Response**: Procurement analysis

```typescript
interface ProcurementOptionsResponse {
  basket_id: string;
  total_items: number;
  procurement_ready: number;
  estimated_delivery_weeks: number;
  cost_breakdown: {
    hardware_cost: number;
    shipping_cost: number;
    installation_cost: number;
    total_cost: number;
  };
  procurement_groups: ProcurementGroup[];
}

interface ProcurementGroup {
  vendor: string;
  items: {
    model_id: string;
    model_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    lead_time_weeks: number;
  }[];
  group_total: number;
  preferred_vendor_contact?: string;
}
```

#### POST /api/hardware-baskets/:id/procure
**Description**: Convert basket items to server inventory entries
**Request Body**: ProcurementRequest

```typescript
interface ProcurementRequest {
  items: {
    model_id: string;
    quantity: number;
    location: string; // Where servers will be installed
    purchase_date: string; // ISO 8601
    warranty_months: number; // Warranty duration
    notes?: string;
  }[];
  create_commissioning_activity?: boolean; // Auto-create commissioning activity
  project_id?: string; // Associate with project
}

interface ProcurementResponse {
  success: boolean;
  servers_created: ServerInventoryResponse[];
  commissioning_activity_id?: string;
  total_cost: number;
  estimated_delivery: string; // ISO 8601
}
```

## Error Handling

### Standard Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    field_errors?: Record<string, string[]>;
  };
  request_id: string;
  timestamp: string;
}
```

### Common Error Codes

```typescript
const ERROR_CODES = {
  // Validation Errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INSUFFICIENT_CAPACITY: 'INSUFFICIENT_CAPACITY',
  
  // Authorization Errors (401, 403)
  UNAUTHORIZED: 'UNAUTHORIZED',
  PROJECT_ACCESS_DENIED: 'PROJECT_ACCESS_DENIED',
  
  // Not Found Errors (404)
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  ACTIVITY_NOT_FOUND: 'ACTIVITY_NOT_FOUND',
  SERVER_NOT_FOUND: 'SERVER_NOT_FOUND',
  
  // Conflict Errors (409)
  SERVER_ALREADY_ASSIGNED: 'SERVER_ALREADY_ASSIGNED',
  ACTIVITY_HAS_DEPENDENCIES: 'ACTIVITY_HAS_DEPENDENCIES',
  PROJECT_NOT_EMPTY: 'PROJECT_NOT_EMPTY',
  
  // Business Logic Errors (422)
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  DEPENDENCY_NOT_COMPLETED: 'DEPENDENCY_NOT_COMPLETED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  
  // Server Errors (500)
  DATABASE_ERROR: 'DATABASE_ERROR',
  CAPACITY_CALCULATION_ERROR: 'CAPACITY_CALCULATION_ERROR'
};
```

### Example Error Responses

```typescript
// Validation Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "field_errors": {
      "name": ["Project name is required"],
      "end_date": ["End date must be after start date"]
    }
  },
  "request_id": "req_abc123",
  "timestamp": "2025-01-20T14:30:00Z"
}

// Business Logic Error
{
  "error": {
    "code": "CIRCULAR_DEPENDENCY",
    "message": "Circular dependency detected in activity relationships",
    "details": {
      "cycle": ["activity:123", "activity:456", "activity:123"],
      "suggested_resolution": "Remove dependency from activity:456 to activity:123"
    }
  },
  "request_id": "req_def456",
  "timestamp": "2025-01-20T14:31:00Z"
}
```

## Database Schema Considerations

### SurrealDB Thing ID Patterns
- Projects: `project:{uuid}`
- Activities: `activity:{uuid}`
- Servers: `server:{uuid}`
- Hardware Baskets: `hardware_basket:{uuid}` (existing)
- Hardware Models: `hardware_model:{uuid}` (existing)

### Relationship Patterns
```sql
-- Activity belongs to Project
CREATE activity:abc123 SET 
  project_id = project:xyz789,
  name = "Migration Phase 1",
  dependencies = [activity:def456];

-- Server assignment
CREATE server:server123 SET
  assigned_project = project:xyz789,
  assigned_activity = activity:abc123,
  status = 'in_use';

-- Free pool entry
CREATE free_pool:entry456 SET
  server_id = server:server123,
  available_from = time::now(),
  released_from_activity = activity:completed789;
```

### Indexing Strategy
```sql
-- Performance indexes
DEFINE INDEX project_status ON TABLE project COLUMNS status;
DEFINE INDEX activity_project ON TABLE activity COLUMNS project_id;
DEFINE INDEX activity_status ON TABLE activity COLUMNS status;
DEFINE INDEX server_status ON TABLE server COLUMNS status;
DEFINE INDEX server_location ON TABLE server COLUMNS location;

-- Search indexes
DEFINE INDEX project_search ON TABLE project COLUMNS name, description;
DEFINE INDEX server_search ON TABLE server COLUMNS model_name, location, notes;
```

## Authentication & Authorization

### User Context Headers
```
X-User-ID: user123
X-User-Role: project_manager
X-Organization-ID: org456
```

### Permission Model
```typescript
interface UserPermissions {
  projects: {
    create: boolean;
    read: string[]; // 'all' or specific project IDs
    update: string[];
    delete: string[];
  };
  servers: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    import: boolean; // RVTools import
  };
  hardware_baskets: {
    read: boolean;
    procure: boolean;
  };
}
```

## Rate Limiting

### API Rate Limits
- Standard endpoints: 100 requests/minute per user
- Capacity calculations: 10 requests/minute per user
- File imports: 5 requests/minute per user
- Bulk operations: 2 requests/minute per user

### Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Caching Strategy

### Cache Keys
- `projects:user:{user_id}` - User's projects list (TTL: 5 minutes)
- `project:{id}:details` - Project details (TTL: 10 minutes)
- `servers:filters:{hash}` - Filtered server results (TTL: 2 minutes)
- `capacity:{activity_id}` - Capacity calculations (TTL: 30 minutes)

### Cache Invalidation
- Project updates invalidate `projects:user:*` and `project:{id}:*`
- Server updates invalidate `servers:*` patterns
- Activity updates invalidate parent project cache

This API specification provides a comprehensive foundation for implementing the project management system with proper validation, error handling, and integration with existing components.