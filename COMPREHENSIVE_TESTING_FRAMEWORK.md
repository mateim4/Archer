# Comprehensive Testing Framework Documentation

## Overview
This document outlines the comprehensive testing and quality assurance framework implemented for LCMDesigner, providing full coverage from unit tests to end-to-end testing with automated CI/CD integration.

## 🏗️ Testing Architecture

### 1. Unit Testing (Frontend)
**Framework**: Vitest + React Testing Library + MSW
**Location**: `frontend/tests/unit/`
**Coverage Target**: 80% minimum

**Test Categories**:
- **Component Tests**: UI component behavior and rendering
- **Hook Tests**: Custom React hooks functionality  
- **Utility Tests**: Helper functions and business logic
- **Service Tests**: API client and data transformation

**Key Features**:
- JSdom environment for browser simulation
- MSW for API mocking without network calls
- Custom test utilities with FluentUI providers
- Coverage reporting with detailed metrics
- Custom matchers for domain-specific assertions

### 2. Integration Testing (Backend)
**Framework**: Rust built-in testing + Axum-test
**Location**: `backend/tests/unit/`
**Coverage Target**: 90% for API endpoints

**Test Categories**:
- **API Endpoint Tests**: HTTP request/response validation
- **Database Tests**: CRUD operations with SurrealDB
- **Service Layer Tests**: Business logic integration
- **File Processing Tests**: Excel parsing workflows

### 3. End-to-End Testing
**Framework**: Playwright with multi-browser support
**Location**: `frontend/tests/e2e/`

**Test Categories**:
- **User Journey Tests**: Complete workflows
- **Cross-browser Tests**: Chrome, Firefox, Safari, Mobile
- **Accessibility Tests**: WCAG compliance automation
- **Performance Tests**: Load time and responsiveness
- **Visual Regression Tests**: UI consistency

## 📊 Test Coverage Standards

### Frontend Coverage Thresholds
```typescript
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Critical Components (90%+ coverage required)
- CapacityVisualizer components
- VendorDataCollectionView
- ProjectManagementView
- Navigation and routing
- Custom hooks (useAppStore, etc.)

### Backend Coverage Requirements
- API endpoints: 100%
- Business logic: 90%
- Database operations: 85%
- Error handling: 100%

## 🧪 Testing Tools & Setup

### Frontend Stack
```json
{
  "vitest": "^1.6.1",
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.1.4",
  "@testing-library/user-event": "^14.5.1",
  "msw": "^2.0.11",
  "@playwright/test": "^1.55.0",
  "jsdom": "^23.0.1"
}
```

### Backend Stack
```toml
[dev-dependencies]
axum-test = "14.0.0"
serial_test = "3.0.0"
http-body-util = "0.1.0"
```

## 🎯 Test Examples

### Component Test Example
```typescript
describe('CapacityVisualizer', () => {
  const mockProps = {
    clusters: mockClusterData,
    selectedVMs: new Set(['vm-1']),
    onVMSelect: vi.fn(),
    visualizationMode: 'cpu' as const
  };

  it('renders cluster data correctly', () => {
    render(<CapacityVisualizer {...mockProps} />);
    expect(screen.getByText('Production Cluster')).toBeInTheDocument();
  });

  it('handles VM selection', async () => {
    render(<CapacityVisualizer {...mockProps} />);
    fireEvent.click(screen.getByTestId('vm-checkbox-vm-2'));
    expect(mockProps.onVMSelect).toHaveBeenCalledWith('vm-2', true);
  });
});
```

### API Integration Test Example
```rust
#[tokio::test]
async fn test_create_hardware_basket_endpoint() {
    let app = create_test_app().await;
    let server = TestServer::new(app).unwrap();

    let response = server
        .post("/api/v1/hardware-baskets")
        .json(&json!({
            "name": "Test Basket API",
            "vendor": "Dell"
        }))
        .await;

    assert_eq!(response.status_code(), StatusCode::CREATED);
    let basket: Value = response.json();
    assert_eq!(basket["name"], "Test Basket API");
}
```

### E2E Test Example
```typescript
test('complete capacity analysis workflow', async ({ page }) => {
  await page.goto('/capacity-visualizer');
  
  // Upload test file
  await page.setInputFiles('[data-testid="file-upload"]', 'test-data.xlsx');
  await page.click('[data-testid="analyze-button"]');
  
  // Verify results
  await expect(page.locator('[data-testid="results-table"]')).toBeVisible();
  
  // Test visualization modes
  await page.click('[data-testid="memory-mode"]');
  await expect(page.locator('[data-testid="memory-chart"]')).toBeVisible();
});
```

## 🚀 Running Tests

### Local Development
```bash
# Frontend unit tests
cd frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:ui            # Interactive UI

# Backend tests
cd backend
cargo test                 # All tests
cargo test --lib           # Library tests only
cargo test api_tests       # Specific test module

# E2E tests
cd frontend
npm run test:e2e           # All E2E tests
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:debug     # Debug mode
```

### CI/CD Pipeline
The automated testing pipeline runs on every PR and includes:

1. **Pre-commit Checks**
   - Linting (ESLint, Clippy)
   - Type checking (TypeScript, Rust)
   - Formatting (Prettier, rustfmt)

2. **Test Execution**
   - Unit tests (frontend & backend)
   - Integration tests
   - E2E tests across browsers

3. **Quality Gates**
   - Coverage threshold enforcement
   - Security vulnerability scanning
   - Performance regression detection
   - Accessibility compliance

4. **Reporting**
   - Test results aggregation
   - Coverage reports
   - Performance metrics
   - Accessibility audit results

## 🔍 Test Data Management

### Mock Data Factory
Centralized test data in `frontend/tests/utils/mock-data.ts`:

```typescript
export const mockClusterData = [
  {
    id: 'cluster-1',
    name: 'Production Cluster',
    nodes: [
      {
        id: 'node-1',
        name: 'ESX-01',
        cpu: { total: 24, used: 12 },
        memory: { total: 128, used: 64 }
      }
    ]
  }
];
```

### API Mocking with MSW
Request handlers for realistic API simulation:

```typescript
export const handlers = [
  http.get('/api/hardware-baskets', () => {
    return HttpResponse.json({ baskets: mockHardwareBaskets });
  }),
  
  http.post('/api/hardware-baskets', async ({ request }) => {
    const newBasket = await request.json();
    return HttpResponse.json(createdBasket, { status: 201 });
  })
];
```

## 🛡️ Quality Assurance Process

### Automated Quality Gates
1. **Unit Test Coverage**: Minimum 80% across all code
2. **Integration Tests**: All API endpoints tested
3. **E2E Coverage**: Critical user journeys validated
4. **Security Scans**: Dependency vulnerability checks
5. **Performance Tests**: Load time and bundle size monitoring
6. **Accessibility**: WCAG 2.1 AA compliance

### Manual QA Checklist
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness (iOS/Android)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Error handling and recovery
- [ ] Data validation and sanitization

## 📈 Continuous Improvement

### Metrics Tracking
- Test execution time trends
- Flaky test identification
- Coverage progression
- Bug escape rate analysis

### Regular Reviews
- **Weekly**: Test failure analysis
- **Monthly**: Coverage and performance review
- **Quarterly**: Testing strategy evaluation
- **Annually**: Framework and tooling updates

## 🔧 Debugging & Troubleshooting

### Common Issues

**1. Test Environment Setup**
```bash
# Clear caches
npm run test -- --clearCache
rm -rf node_modules/.vite

# Reset test database
cargo test -- --ignored reset_db
```

**2. Component Test Failures**
```typescript
// Debug component state
screen.debug();

// Wait for async operations
await waitFor(() => {
  expect(screen.getByText('Loading...')).not.toBeInTheDocument();
});
```

**3. E2E Test Stability**
```typescript
// Increase timeouts for slow operations
test.setTimeout(60000);

// Wait for network idle
await page.waitForLoadState('networkidle');

// Retry flaky operations
await expect(async () => {
  await page.click('button');
}).toPass({ timeout: 5000 });
```

## 📋 Testing Checklist for New Features

### Before Development
- [ ] Define acceptance criteria
- [ ] Identify test scenarios
- [ ] Plan test data requirements
- [ ] Consider edge cases and error conditions

### During Development
- [ ] Write unit tests for new components/functions
- [ ] Update integration tests for API changes
- [ ] Add E2E tests for new user flows
- [ ] Maintain or improve coverage metrics

### Before PR Submission
- [ ] All tests pass locally
- [ ] Coverage thresholds met
- [ ] Manual testing completed
- [ ] Accessibility validated
- [ ] Performance impact assessed

### Code Review
- [ ] Test quality reviewed
- [ ] Edge cases covered
- [ ] Mock data realistic
- [ ] Test maintainability considered

---

**Maintained by**: Development Team  
**Last Updated**: November 2024  
**Review Schedule**: Quarterly