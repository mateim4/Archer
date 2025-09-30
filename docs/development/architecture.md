# Architecture Documentation

This document provides a comprehensive overview of the LCM Designer architecture, design patterns, and system organization.

## System Overview

LCM Designer is a comprehensive infrastructure lifecycle management application built with a modern, multi-backend architecture that prioritizes performance, scalability, and developer experience.

### Core Principles

1. **Type Safety**: Full TypeScript on frontend, Rust on backend
2. **Performance**: Rust for compute-intensive operations, React for responsive UI
3. **Scalability**: Microservice-ready architecture with clear separation of concerns
4. **Developer Experience**: Hot reloading, comprehensive tooling, extensive documentation
5. **Design Consistency**: Unified glassmorphic design system across all components

## Technology Stack

### Frontend Architecture
```
React 18 + TypeScript + Vite
├── UI Framework: Fluent UI v9 + Custom Design System
├── State Management: Zustand (with persistence)
├── Styling: Custom CSS + Glassmorphic theme
├── Build Tool: Vite (fast HMR, optimized builds)
├── Testing: Playwright + Jest + React Testing Library
└── Desktop: Tauri integration for native features
```

### Backend Architecture
```
Multi-Backend System
├── Primary: Rust (Axum + SurrealDB)
│   ├── Hardware basket parsing (calamine crate)
│   ├── High-performance data processing
│   ├── Dynamic Excel header detection
│   └── RESTful API with proper error handling
├── Legacy: Express.js + SurrealDB
│   ├── File processing fallback
│   ├── Security hardened after vulnerability fixes
│   └── Backward compatibility
└── Database: SurrealDB
    ├── Thing objects for proper relationships
    ├── In-memory for development
    └── Persistent storage for production
```

## Architectural Patterns

### Frontend Patterns

#### Component Architecture
```typescript
// Hierarchical component structure
App
├── Views (Main application screens)
│   ├── DashboardView
│   ├── ProjectDetailView
│   ├── CapacityVisualizerView
│   └── HardwareBasketView
├── Components (Reusable UI components)
│   ├── Design System (CustomSlider, ConsistentCard)
│   ├── Business Logic (CapacityCanvas, MigrationPanel)
│   └── Utilities (EnhancedFileUpload, ProjectCard)
└── Store (Zustand state management)
    ├── AppStore (global application state)
    ├── ProjectStore (project-specific state)
    └── UIStore (UI preferences and settings)
```

#### State Management Pattern
```typescript
// Zustand with TypeScript for type-safe state
interface AppState {
  // Data state
  currentProject: Project | null;
  hardwareBaskets: HardwareBasket[];
  
  // UI state
  activeView: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setCurrentProject: (project: Project) => void;
  loadHardwareBaskets: () => Promise<void>;
}

// Automatic persistence for user preferences
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Implementation
    }),
    { name: 'lcm-designer-state' }
  )
);
```

#### Design System Pattern
```typescript
// Consistent styling through CSS classes
const DesignSystemClasses = {
  card: 'lcm-card',           // Glassmorphic cards
  input: 'lcm-input',         // Styled inputs
  dropdown: 'lcm-dropdown',   // Custom dropdowns
  button: 'lcm-button',       // Consistent buttons
  slider: CustomSlider,       // Rainbow track slider
} as const;

// CSS custom properties for theming
:root {
  --lcm-primary: #8b5cf6;
  --lcm-bg-card: rgba(255,255,255,0.85);
  --lcm-backdrop-filter: blur(18px) saturate(180%);
  --lcm-shadow: 0 8px 32px rgba(139, 92, 246, 0.15);
}
```

### Backend Patterns

#### Rust API Architecture
```rust
// Modular API structure
api/
├── mod.rs                  // Main router and health check
├── hardware_baskets.rs     // Hardware catalog management
├── project_lifecycle.rs    // Project management
├── rvtools.rs             // VMware data processing
└── enhanced_rvtools.rs    // Advanced analysis

// Clean separation of concerns
pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/hardware-baskets", get(list_baskets).post(create_basket))
        .route("/hardware-baskets/:id", delete(delete_basket))
        .route("/hardware-baskets/:id/models", get(get_models))
        .with_state(state)
}
```

#### Database Pattern (SurrealDB)
```rust
// Thing objects for proper relationships
#[derive(Serialize, Deserialize)]
pub struct HardwareBasket {
    pub id: Thing,                    // SurrealDB Thing ID
    pub name: String,
    pub vendor: HardwareVendor,
    pub models: Vec<Thing>,           // References to HardwareModel
    pub created_at: DateTime<Utc>,
}

// Relationship queries
let query = "
    SELECT *, 
           count(->contains->hardware_model) AS total_models,
           count(->contains->hardware_configuration) AS total_configurations
    FROM hardware_basket 
    WHERE vendor = $vendor
";
```

#### Excel Parsing Engine
```rust
// Dynamic header detection and parsing
pub struct HardwareBasketParser {
    header_mappings: HashMap<String, String>,
    model_patterns: Vec<Regex>,
    vendor_config: VendorConfig,
}

impl HardwareBasketParser {
    // Intelligent header detection
    pub fn detect_headers(&mut self, sheet: &Sheet) -> Result<()> {
        // Find column headers automatically
        // Map variations to standard names
        // Validate required columns exist
    }
    
    // Future-proof model recognition
    pub fn parse_model(&self, row: &[String]) -> Option<HardwareModel> {
        // Use regex patterns to identify server models
        // Extract specifications from description
        // Handle vendor-specific naming conventions
    }
}
```

## System Integration

### Frontend-Backend Communication

#### API Client Pattern
```typescript
// Centralized API client with error handling
export class ApiClient {
  private baseUrl: string;
  private timeout: number = 30000;
  
  // Consistent error handling
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(error.message, response.status);
    }
    return response.json();
  }
  
  // Type-safe API methods
  async getHardwareBaskets(vendor?: string): Promise<HardwareBasket[]> {
    const params = vendor ? `?vendor=${vendor}` : '';
    const response = await fetch(`${this.baseUrl}/hardware-baskets${params}`);
    return this.handleResponse(response);
  }
}
```

#### Real-time Updates Pattern
```typescript
// Optimistic updates with error recovery
const updateProject = async (updates: Partial<Project>) => {
  // Optimistic update
  setCurrentProject(prev => ({ ...prev, ...updates }));
  
  try {
    await apiClient.updateProject(currentProject.id, updates);
  } catch (error) {
    // Revert on error
    setCurrentProject(originalProject);
    showErrorToast('Failed to update project');
  }
};
```

### Data Flow Architecture

#### Hardware Basket Processing Flow
```
Excel Upload
    ↓
Frontend File Validation
    ↓
Multipart Upload to Backend
    ↓
Rust Parser (calamine crate)
    ↓
Dynamic Header Detection
    ↓
Model Pattern Recognition
    ↓
SurrealDB Storage (Thing objects)
    ↓
Frontend Refresh & Display
```

#### Project Lifecycle Flow
```
Project Creation
    ↓
RVTools Data Upload
    ↓
Environment Analysis
    ↓
Capacity Planning
    ↓
Hardware Selection
    ↓
Migration Planning
    ↓
Document Generation
    ↓
Project Execution Tracking
```

## Design System Architecture

### Component Hierarchy
```typescript
// Base design system components
abstract class LCMComponent {
  protected readonly baseClasses: string[];
  protected readonly themeVariables: Record<string, string>;
}

// Specialized components
class CustomSlider extends LCMComponent {
  // Rainbow track with frosted glass thumb
  // Click-to-edit functionality
  // Smooth animations
}

class CapacityVisualizer extends LCMComponent {
  // Interactive VM selection
  // Real-time capacity calculations
  // Drag-and-drop migration
}
```

### Styling Architecture
```css
/* CSS Custom Properties for theming */
:root {
  /* Primary colors */
  --lcm-primary: #8b5cf6;
  --lcm-primary-hover: #7c3aed;
  
  /* Glassmorphic effects */
  --lcm-bg-card: rgba(255,255,255,0.85);
  --lcm-backdrop-filter: blur(18px) saturate(180%);
  
  /* Shadows and depth */
  --lcm-shadow-sm: 0 2px 8px rgba(139, 92, 246, 0.1);
  --lcm-shadow-lg: 0 8px 32px rgba(139, 92, 246, 0.15);
}

/* Component-specific styles */
.lcm-card {
  background: var(--lcm-bg-card);
  backdrop-filter: var(--lcm-backdrop-filter);
  box-shadow: var(--lcm-shadow-lg);
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.2);
}
```

## Performance Architecture

### Frontend Optimization
```typescript
// Code splitting by route
const ProjectDetailView = lazy(() => import('./views/ProjectDetailView'));
const CapacityVisualizerView = lazy(() => import('./views/CapacityVisualizerView'));

// Memoization for expensive calculations
const expensiveComputation = useMemo(() => {
  return processLargeDataset(data);
}, [data]);

// Virtualization for large lists
const VirtualizedTable = ({ items }: { items: any[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={35}
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Backend Optimization
```rust
// Async processing with proper error handling
#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connection pooling
    let db = connect_database().await?;
    
    // Concurrent request handling
    let app = create_app(db).await;
    
    // Graceful shutdown
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .with_graceful_shutdown(shutdown_signal())
        .await?;
}

// Efficient data processing
async fn process_excel_file(file: Vec<u8>) -> Result<ParseResult, ParseError> {
    // Stream processing for large files
    // Parallel model parsing
    // Bulk database operations
}
```

## Security Architecture

### Frontend Security
```typescript
// Input validation and sanitization
const validateInput = (input: string): boolean => {
  // XSS prevention
  // SQL injection prevention (client-side validation)
  // File type validation
  return isValid;
};

// Secure API communication
const apiClient = new ApiClient({
  baseUrl: process.env.VITE_API_BASE_URL,
  timeout: 30000,
  validateCertificate: true,  // Only in production
});
```

### Backend Security
```rust
// Input validation with serde
#[derive(Deserialize, Validate)]
pub struct CreateBasketRequest {
    #[validate(length(min = 1, max = 100))]
    pub name: String,
    
    #[validate(custom = "validate_vendor")]
    pub vendor: String,
}

// CORS configuration
let cors = CorsLayer::new()
    .allow_origin(Any)  // Configure properly for production
    .allow_methods([Method::GET, Method::POST, Method::DELETE])
    .allow_headers(Any);
```

## Testing Architecture

### Frontend Testing Strategy
```typescript
// Unit tests for components
describe('CustomSlider', () => {
  it('updates value on interaction', () => {
    render(<CustomSlider min={0} max={100} value={50} onChange={mockFn} />);
    // Test implementation
  });
});

// Integration tests with API
describe('Hardware Basket Integration', () => {
  it('uploads and displays basket data', async () => {
    // Mock API responses
    // Test complete workflow
  });
});

// E2E tests with Playwright
test('complete project workflow', async ({ page }) => {
  await page.goto('/projects');
  await page.click('[data-testid="create-project"]');
  // Test user journey
});
```

### Backend Testing Strategy
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_hardware_basket_parsing() {
        let parser = HardwareBasketParser::new(VendorConfig::Dell);
        let result = parser.parse_excel_data(test_data).await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_api_endpoints() {
        let app = create_test_app().await;
        let response = app
            .oneshot(Request::builder()
                .uri("/hardware-baskets")
                .body(Body::empty())
                .unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
    }
}
```

## Deployment Architecture

### Development Environment
```yaml
# docker-compose.yml for development
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "1420:1420"
    volumes:
      - ./frontend:/app
    
  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - RUST_LOG=debug
      - DATABASE_URL=memory
    
  database:
    image: surrealdb/surrealdb:latest
    ports:
      - "8000:8000"
    command: start --bind 0.0.0.0:8000 memory
```

### Production Architecture
```yaml
# Production deployment with proper scaling
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lcm-designer-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: lcm-designer-backend
  template:
    spec:
      containers:
      - name: backend
        image: lcm-designer:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-config
              key: url
```

## Future Architecture Considerations

### Scalability Improvements
1. **Microservice Decomposition**: Split API modules into separate services
2. **Event-Driven Architecture**: Use message queues for async processing
3. **Caching Layer**: Redis for frequently accessed data
4. **CDN Integration**: Static asset optimization

### Performance Enhancements
1. **Database Optimization**: Query optimization and indexing
2. **Frontend Optimization**: Bundle splitting and lazy loading
3. **API Optimization**: GraphQL for flexible data fetching
4. **Caching Strategy**: Application-level and database caching

### Developer Experience
1. **Hot Module Replacement**: Faster development feedback
2. **Type Generation**: Automatic API type generation
3. **Documentation**: Interactive API documentation
4. **Monitoring**: Development and production monitoring

This architecture provides a solid foundation for the current needs while being flexible enough to accommodate future growth and requirements.