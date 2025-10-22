import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

/**
 * K6 Performance Test: Wizard Auto-Save
 * 
 * Tests the performance and reliability of the wizard state auto-save mechanism
 * under various load conditions. Simulates multiple users editing wizard state
 * concurrently and measures localStorage write latency, API response times,
 * and error rates.
 * 
 * Run with: k6 run autoSave.k6.js
 * 
 * Load Stages:
 * - Ramp-up: 0 → 10 VUs over 30s (warm-up)
 * - Sustained load: 10 VUs for 60s (baseline performance)
 * - Peak load: 10 → 50 VUs over 30s (stress test)
 * - High load: 50 VUs for 60s (sustained stress)
 * - Spike: 50 → 100 VUs over 15s (spike test)
 * - Spike sustained: 100 VUs for 30s (peak capacity)
 * - Ramp-down: 100 → 0 VUs over 30s (graceful degradation)
 */

// Custom metrics
const autoSaveSuccess = new Rate('auto_save_success');
const autoSaveLatency = new Trend('auto_save_latency');
const localStorageWrites = new Counter('local_storage_writes');
const apiErrors = new Counter('api_errors');
const stateConflicts = new Counter('state_conflicts');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp-up to 10 users
    { duration: '60s', target: 10 },   // Stay at 10 users (baseline)
    { duration: '30s', target: 50 },   // Ramp-up to 50 users (stress)
    { duration: '60s', target: 50 },   // Stay at 50 users
    { duration: '15s', target: 100 },  // Spike to 100 users
    { duration: '30s', target: 100 },  // Stay at 100 users (peak)
    { duration: '30s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    // Auto-save should succeed 99.5% of the time
    'auto_save_success': ['rate>0.995'],
    
    // Auto-save latency thresholds
    'auto_save_latency': [
      'p(95)<500',   // 95% of requests should complete in < 500ms
      'p(99)<1000',  // 99% of requests should complete in < 1s
      'max<5000',    // No request should take more than 5s
    ],
    
    // HTTP request duration thresholds
    'http_req_duration': [
      'p(95)<800',   // 95% of HTTP requests < 800ms
      'p(99)<1500',  // 99% of HTTP requests < 1.5s
    ],
    
    // Error rate should be < 0.5%
    'http_req_failed': ['rate<0.005'],
    
    // State conflicts should be rare (< 2%)
    'state_conflicts': ['count<200'],  // With ~10,000 requests, < 2%
  },
};

// Base URL for API (change based on environment)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
const PROJECT_ID = __ENV.PROJECT_ID || 'test-project-perf';

// Generate realistic wizard state data
function generateWizardState(step, userId) {
  const states = {
    1: {
      currentStep: 1,
      sourceSelection: {
        rvtoolsFile: `rvtools-${userId}-${Date.now()}.xlsx`,
        uploadedAt: new Date().toISOString(),
        clusterFilter: ['Production', 'Development'],
      },
    },
    2: {
      currentStep: 2,
      destinationConfig: {
        clusters: [
          {
            name: `Cluster-${userId}-${Math.random().toString(36).substr(2, 9)}`,
            hypervisor: 'Hyper-V',
            storage: 'Storage Spaces Direct',
            nodes: 3 + Math.floor(Math.random() * 5), // 3-7 nodes
            cpuPerNode: 32 + Math.floor(Math.random() * 64), // 32-96 CPUs
            memoryPerNode: 256 + Math.floor(Math.random() * 512), // 256-768 GB
            storagePerNode: 5000 + Math.floor(Math.random() * 10000), // 5-15 TB
          },
        ],
      },
    },
    3: {
      currentStep: 3,
      capacityAnalysis: {
        analysisRun: true,
        results: {
          totalVMs: 150 + Math.floor(Math.random() * 100),
          cpuUtilization: 60 + Math.random() * 30,
          memoryUtilization: 55 + Math.random() * 35,
          storageUtilization: 70 + Math.random() * 20,
          recommendation: 'sufficient',
        },
        timestamp: new Date().toISOString(),
      },
    },
    4: {
      currentStep: 4,
      networkMapping: {
        mappings: [
          {
            source: `VLAN-${100 + Math.floor(Math.random() * 50)}`,
            target: `Azure-Subnet-${Math.floor(Math.random() * 10)}`,
            vmCount: Math.floor(Math.random() * 50),
          },
          {
            source: `VLAN-${200 + Math.floor(Math.random() * 50)}`,
            target: `Azure-Subnet-${10 + Math.floor(Math.random() * 10)}`,
            vmCount: Math.floor(Math.random() * 30),
          },
        ],
      },
    },
    5: {
      currentStep: 5,
      migrationStrategy: {
        approach: ['lift-shift', 'replatform', 'refactor'][Math.floor(Math.random() * 3)],
        timeline: '2025-12-31',
        phasing: 'wave-based',
      },
    },
  };
  
  return states[step] || states[1];
}

// Setup function - runs once per VU
export function setup() {
  // Create test project (if not exists)
  const createProjectRes = http.post(
    `${BASE_URL}/api/v1/projects`,
    JSON.stringify({
      id: PROJECT_ID,
      name: 'K6 Performance Test Project',
      description: 'Auto-save performance testing',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );
  
  console.log(`Setup: Project creation status ${createProjectRes.status}`);
  
  return { projectId: PROJECT_ID };
}

// Main test function - runs repeatedly for each VU
export default function (data) {
  const userId = __VU; // Virtual User ID
  const iteration = __ITER; // Iteration number
  
  // Simulate realistic user behavior: edit wizard at different steps
  const currentStep = (iteration % 5) + 1; // Cycle through steps 1-5
  const wizardState = generateWizardState(currentStep, userId);
  
  // Add version for conflict detection
  wizardState.version = iteration;
  wizardState.lastModified = new Date().toISOString();
  wizardState.userId = userId;
  
  // Measure auto-save operation
  const startTime = Date.now();
  
  const saveResponse = http.put(
    `${BASE_URL}/api/v1/migration-wizard/projects/${data.projectId}/wizard-state`,
    JSON.stringify(wizardState),
    {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': `user-${userId}`,
      },
      tags: {
        name: 'auto_save',
        step: currentStep.toString(),
      },
    }
  );
  
  const latency = Date.now() - startTime;
  autoSaveLatency.add(latency);
  
  // Check response
  const saveSuccess = check(saveResponse, {
    'status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'response has body': (r) => r.body.length > 0,
    'response is valid JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
    'latency under 1s': () => latency < 1000,
  });
  
  autoSaveSuccess.add(saveSuccess);
  localStorageWrites.add(1);
  
  if (!saveSuccess) {
    apiErrors.add(1);
    console.error(`Auto-save failed for user ${userId}, step ${currentStep}: ${saveResponse.status}`);
  }
  
  // Detect state conflicts (409 Conflict)
  if (saveResponse.status === 409) {
    stateConflicts.add(1);
    console.warn(`State conflict detected for user ${userId}, step ${currentStep}`);
  }
  
  // Simulate reading state back (20% of the time)
  if (Math.random() < 0.2) {
    const readResponse = http.get(
      `${BASE_URL}/api/v1/migration-wizard/projects/${data.projectId}/wizard-state`,
      {
        headers: {
          'X-User-ID': `user-${userId}`,
        },
        tags: {
          name: 'state_retrieval',
        },
      }
    );
    
    check(readResponse, {
      'state retrieval successful': (r) => r.status === 200,
      'state contains version': (r) => {
        try {
          const state = JSON.parse(r.body);
          return state.version !== undefined;
        } catch {
          return false;
        }
      },
    });
  }
  
  // Simulate realistic think time between auto-saves (2-5 seconds)
  sleep(2 + Math.random() * 3);
  
  // Occasionally simulate rapid consecutive saves (no sleep)
  if (Math.random() < 0.1) {
    // Rapid save (debouncing test)
    const rapidState = generateWizardState(currentStep, userId);
    rapidState.version = iteration + 0.5;
    rapidState.lastModified = new Date().toISOString();
    
    http.put(
      `${BASE_URL}/api/v1/migration-wizard/projects/${data.projectId}/wizard-state`,
      JSON.stringify(rapidState),
      {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'rapid_save' },
      }
    );
  }
}

// Teardown function - runs once after all VUs finish
export function teardown(data) {
  // Optional: Clean up test project
  const deleteResponse = http.del(
    `${BASE_URL}/api/v1/projects/${data.projectId}`
  );
  
  console.log(`Teardown: Project deletion status ${deleteResponse.status}`);
}

/**
 * How to run this test:
 * 
 * 1. Install K6: https://k6.io/docs/getting-started/installation/
 * 
 * 2. Start the backend API server:
 *    cd backend && cargo run
 * 
 * 3. Run the test:
 *    k6 run autoSave.k6.js
 * 
 * 4. Run with custom parameters:
 *    k6 run --vus 20 --duration 60s autoSave.k6.js
 * 
 * 5. Run with custom base URL:
 *    k6 run -e BASE_URL=http://production.example.com autoSave.k6.js
 * 
 * 6. Generate HTML report:
 *    k6 run --out json=results.json autoSave.k6.js
 *    k6 report results.json
 * 
 * Expected Results:
 * - Auto-save success rate: > 99.5%
 * - P95 latency: < 500ms
 * - P99 latency: < 1000ms
 * - State conflicts: < 2% of total requests
 * - API errors: < 0.5% of total requests
 */
