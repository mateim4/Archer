import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

/**
 * K6 Performance Test: Network Discovery & Topology Mapping
 * 
 * Tests the performance of RVTools network discovery and topology mapping
 * under various load conditions. Simulates multiple users uploading RVTools
 * files and discovering networks concurrently.
 * 
 * Run with: k6 run networkDiscovery.k6.js
 * 
 * Load Stages:
 * - Warm-up: 0 → 5 VUs over 20s
 * - Baseline: 5 VUs for 60s
 * - Stress: 5 → 25 VUs over 30s
 * - Peak: 25 VUs for 60s
 * - Spike: 25 → 50 VUs over 15s
 * - Spike sustained: 50 VUs for 30s
 * - Ramp-down: 50 → 0 VUs over 20s
 */

// Custom metrics
const discoverySuccess = new Rate('network_discovery_success');
const discoveryLatency = new Trend('network_discovery_latency');
const vlanDeduplicationTime = new Trend('vlan_deduplication_time');
const networksDiscovered = new Gauge('networks_discovered_count');
const vlansDiscovered = new Gauge('vlans_discovered_count');
const topologyMapTime = new Trend('topology_mapping_time');
const apiErrors = new Counter('discovery_api_errors');

// Test configuration
export const options = {
  stages: [
    { duration: '20s', target: 5 },    // Warm-up
    { duration: '60s', target: 5 },    // Baseline
    { duration: '30s', target: 25 },   // Stress
    { duration: '60s', target: 25 },   // Sustained stress
    { duration: '15s', target: 50 },   // Spike
    { duration: '30s', target: 50 },   // Peak load
    { duration: '20s', target: 0 },    // Ramp-down
  ],
  thresholds: {
    // Discovery should succeed 99% of the time
    'network_discovery_success': ['rate>0.99'],
    
    // Discovery latency thresholds
    'network_discovery_latency': [
      'p(95)<2000',   // 95% of discoveries should complete in < 2s
      'p(99)<5000',   // 99% of discoveries should complete in < 5s
      'max<15000',    // No discovery should take more than 15s
    ],
    
    // VLAN deduplication should be fast
    'vlan_deduplication_time': [
      'p(95)<200',    // 95% of deduplications < 200ms
      'p(99)<500',    // 99% of deduplications < 500ms
    ],
    
    // Topology mapping should be efficient
    'topology_mapping_time': [
      'p(95)<1000',   // 95% of mappings < 1s
      'p(99)<3000',   // 99% of mappings < 3s
    ],
    
    // HTTP request thresholds
    'http_req_duration': [
      'p(95)<3000',   // 95% of HTTP requests < 3s
      'p(99)<8000',   // 99% of HTTP requests < 8s
    ],
    
    // Error rate should be < 1%
    'http_req_failed': ['rate<0.01'],
  },
};

// Base URL for API
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';

// Realistic RVTools network data samples
const rvtoolsNetworkSamples = new SharedArray('rvtools_samples', function () {
  return [
    {
      name: 'small-network',
      networks: [
        { vlan: '100', name: 'Production', subnet: '10.0.100.0/24', gateway: '10.0.100.1', vmCount: 25 },
        { vlan: '200', name: 'Development', subnet: '10.0.200.0/24', gateway: '10.0.200.1', vmCount: 15 },
        { vlan: '300', name: 'Management', subnet: '10.0.300.0/24', gateway: '10.0.300.1', vmCount: 5 },
      ],
      portGroups: [
        { name: 'PG-VLAN100', vlan: '100', vSwitch: 'vSwitch0', type: 'standard' },
        { name: 'PG-VLAN200', vlan: '200', vSwitch: 'vSwitch0', type: 'standard' },
        { name: 'PG-VLAN300', vlan: '300', vSwitch: 'vSwitch1', type: 'distributed' },
      ],
    },
    {
      name: 'medium-network',
      networks: [
        { vlan: '10', name: 'DMZ', subnet: '172.16.10.0/24', gateway: '172.16.10.1', vmCount: 35 },
        { vlan: '20', name: 'App-Tier', subnet: '172.16.20.0/24', gateway: '172.16.20.1', vmCount: 50 },
        { vlan: '30', name: 'DB-Tier', subnet: '172.16.30.0/24', gateway: '172.16.30.1', vmCount: 20 },
        { vlan: '40', name: 'Web-Tier', subnet: '172.16.40.0/24', gateway: '172.16.40.1', vmCount: 40 },
        { vlan: '50', name: 'Storage', subnet: '172.16.50.0/24', gateway: '172.16.50.1', vmCount: 10 },
        { vlan: '100', name: 'vMotion', subnet: '172.16.100.0/24', gateway: '172.16.100.1', vmCount: 0 },
      ],
      portGroups: [
        { name: 'PG-DMZ', vlan: '10', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-App', vlan: '20', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-DB', vlan: '30', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-Web-01', vlan: '40', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-Web-02', vlan: '40', vSwitch: 'dvSwitch1', type: 'distributed' },
        { name: 'PG-Storage', vlan: '50', vSwitch: 'vSwitch0', type: 'standard' },
        { name: 'PG-vMotion', vlan: '100', vSwitch: 'vSwitch1', type: 'standard' },
      ],
    },
    {
      name: 'large-network',
      networks: generateLargeNetworkList(50), // 50 VLANs
      portGroups: generateLargePortGroupList(50, 3), // 50 VLANs, avg 3 port groups per VLAN
    },
    {
      name: 'complex-network-with-duplicates',
      networks: [
        { vlan: '100', name: 'Prod-Segment-1', subnet: '10.100.0.0/24', gateway: '10.100.0.1', vmCount: 20 },
        { vlan: '100', name: 'Prod-Segment-2', subnet: '10.100.1.0/24', gateway: '10.100.1.1', vmCount: 25 },
        { vlan: '100', name: 'Prod-Segment-3', subnet: '10.100.2.0/24', gateway: '10.100.2.1', vmCount: 15 },
        { vlan: '200', name: 'Dev-Zone-A', subnet: '10.200.0.0/24', gateway: '10.200.0.1', vmCount: 30 },
        { vlan: '200', name: 'Dev-Zone-B', subnet: '10.200.1.0/24', gateway: '10.200.1.1', vmCount: 35 },
      ],
      portGroups: [
        { name: 'PG-Prod-1', vlan: '100', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-Prod-2', vlan: '100', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-Prod-3', vlan: '100', vSwitch: 'dvSwitch1', type: 'distributed' },
        { name: 'PG-Prod-Backup', vlan: '100', vSwitch: 'vSwitch0', type: 'standard' },
        { name: 'PG-Dev-A', vlan: '200', vSwitch: 'dvSwitch0', type: 'distributed' },
        { name: 'PG-Dev-B', vlan: '200', vSwitch: 'dvSwitch1', type: 'distributed' },
      ],
    },
  ];
});

// Helper: Generate large network list
function generateLargeNetworkList(vlanCount) {
  const networks = [];
  for (let i = 0; i < vlanCount; i++) {
    const vlanId = 100 + i;
    networks.push({
      vlan: vlanId.toString(),
      name: `VLAN-${vlanId}-Auto`,
      subnet: `10.${Math.floor(vlanId / 256)}.${vlanId % 256}.0/24`,
      gateway: `10.${Math.floor(vlanId / 256)}.${vlanId % 256}.1`,
      vmCount: Math.floor(Math.random() * 50),
    });
  }
  return networks;
}

// Helper: Generate large port group list
function generateLargePortGroupList(vlanCount, avgPortGroupsPerVlan) {
  const portGroups = [];
  for (let i = 0; i < vlanCount; i++) {
    const vlanId = 100 + i;
    const pgCount = Math.floor(avgPortGroupsPerVlan * (0.5 + Math.random()));
    
    for (let j = 0; j < pgCount; j++) {
      portGroups.push({
        name: `PG-VLAN${vlanId}-${j + 1}`,
        vlan: vlanId.toString(),
        vSwitch: j % 2 === 0 ? `dvSwitch${j % 3}` : `vSwitch${j % 2}`,
        type: j % 2 === 0 ? 'distributed' : 'standard',
      });
    }
  }
  return portGroups;
}

// Setup function
export function setup() {
  console.log('Setting up network discovery performance test...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total RVTools samples: ${rvtoolsNetworkSamples.length}`);
  
  return {
    startTime: new Date().toISOString(),
  };
}

// Main test function
export default function (data) {
  const userId = __VU;
  const iteration = __ITER;
  
  // Select RVTools sample (rotate through samples)
  const sampleIndex = iteration % rvtoolsNetworkSamples.length;
  const rvtoolsSample = rvtoolsNetworkSamples[sampleIndex];
  
  // Create unique project for this test iteration
  const projectId = `perf-test-${userId}-${iteration}`;
  
  // Step 1: Create project
  const createProjectRes = http.post(
    `${BASE_URL}/api/v1/projects`,
    JSON.stringify({
      id: projectId,
      name: `Network Discovery Perf Test ${userId}-${iteration}`,
      description: `Testing with ${rvtoolsSample.name} sample`,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'create_project' },
    }
  );
  
  check(createProjectRes, {
    'project created': (r) => r.status === 201 || r.status === 200,
  });
  
  if (createProjectRes.status !== 200 && createProjectRes.status !== 201) {
    apiErrors.add(1);
    console.error(`Failed to create project: ${createProjectRes.status}`);
    return;
  }
  
  // Step 2: Upload RVTools data (simulate)
  const uploadRes = http.post(
    `${BASE_URL}/api/v1/projects/${projectId}/rvtools`,
    JSON.stringify({
      vNetworks: rvtoolsSample.networks,
      vPorts: rvtoolsSample.portGroups,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'upload_rvtools', sample: rvtoolsSample.name },
    }
  );
  
  check(uploadRes, {
    'rvtools uploaded': (r) => r.status === 201 || r.status === 200,
  });
  
  // Step 3: Trigger network discovery
  const discoveryStartTime = Date.now();
  
  const discoveryRes = http.post(
    `${BASE_URL}/api/v1/migration-wizard/projects/${projectId}/discover-networks`,
    null,
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { 
        name: 'network_discovery',
        sample: rvtoolsSample.name,
        network_count: rvtoolsSample.networks.length.toString(),
      },
    }
  );
  
  const discoveryDuration = Date.now() - discoveryStartTime;
  discoveryLatency.add(discoveryDuration);
  
  // Check discovery response
  const discoveryOk = check(discoveryRes, {
    'discovery succeeded': (r) => r.status === 200,
    'discovery has response body': (r) => r.body && r.body.length > 0,
    'discovery returned JSON': (r) => {
      try {
        JSON.parse(r.body);
        return true;
      } catch {
        return false;
      }
    },
    'discovery completed in reasonable time': () => discoveryDuration < 10000,
  });
  
  discoverySuccess.add(discoveryOk);
  
  if (!discoveryOk) {
    apiErrors.add(1);
    console.error(`Network discovery failed: ${discoveryRes.status}, duration: ${discoveryDuration}ms`);
    return;
  }
  
  // Parse discovery results
  let discoveredData;
  try {
    discoveredData = JSON.parse(discoveryRes.body);
  } catch (e) {
    console.error(`Failed to parse discovery response: ${e}`);
    return;
  }
  
  // Step 4: Verify VLAN deduplication
  const deduplicationStartTime = Date.now();
  
  const deduplicationRes = http.get(
    `${BASE_URL}/api/v1/migration-wizard/projects/${projectId}/networks/vlans`,
    {
      tags: { name: 'vlan_deduplication' },
    }
  );
  
  const deduplicationDuration = Date.now() - deduplicationStartTime;
  vlanDeduplicationTime.add(deduplicationDuration);
  
  check(deduplicationRes, {
    'deduplication succeeded': (r) => r.status === 200,
    'vlans returned': (r) => {
      try {
        const vlans = JSON.parse(r.body);
        return Array.isArray(vlans) && vlans.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  // Count discovered networks and VLANs
  if (discoveredData.networks) {
    networksDiscovered.add(discoveredData.networks.length);
  }
  if (discoveredData.uniqueVlans) {
    vlansDiscovered.add(discoveredData.uniqueVlans.length);
  }
  
  // Step 5: Test topology mapping
  const topologyStartTime = Date.now();
  
  const topologyRes = http.get(
    `${BASE_URL}/api/v1/migration-wizard/projects/${projectId}/networks/topology`,
    {
      tags: { name: 'topology_mapping' },
    }
  );
  
  const topologyDuration = Date.now() - topologyStartTime;
  topologyMapTime.add(topologyDuration);
  
  check(topologyRes, {
    'topology mapping succeeded': (r) => r.status === 200,
    'topology has vSwitches': (r) => {
      try {
        const topology = JSON.parse(r.body);
        return topology.vSwitches && topology.vSwitches.length > 0;
      } catch {
        return false;
      }
    },
    'topology has port groups': (r) => {
      try {
        const topology = JSON.parse(r.body);
        return topology.portGroups && topology.portGroups.length > 0;
      } catch {
        return false;
      }
    },
  });
  
  // Step 6: Test retrieval of specific VLAN details
  if (deduplicationRes.status === 200) {
    try {
      const vlans = JSON.parse(deduplicationRes.body);
      if (vlans.length > 0) {
        const randomVlan = vlans[Math.floor(Math.random() * vlans.length)];
        
        const vlanDetailRes = http.get(
          `${BASE_URL}/api/v1/migration-wizard/projects/${projectId}/networks/vlans/${randomVlan}`,
          {
            tags: { name: 'vlan_detail' },
          }
        );
        
        check(vlanDetailRes, {
          'vlan detail retrieved': (r) => r.status === 200,
          'vlan has port groups': (r) => {
            try {
              const detail = JSON.parse(r.body);
              return detail.portGroups && detail.portGroups.length > 0;
            } catch {
              return false;
            }
          },
        });
      }
    } catch (e) {
      console.error(`Failed to test VLAN details: ${e}`);
    }
  }
  
  // Clean up: Delete test project (20% of the time to reduce load)
  if (Math.random() < 0.2) {
    http.del(`${BASE_URL}/api/v1/projects/${projectId}`, {
      tags: { name: 'cleanup' },
    });
  }
  
  // Realistic think time (2-8 seconds)
  sleep(2 + Math.random() * 6);
}

// Teardown function
export function teardown(data) {
  console.log('Network discovery performance test completed');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test ended at: ${new Date().toISOString()}`);
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
 *    k6 run networkDiscovery.k6.js
 * 
 * 4. Run with custom parameters:
 *    k6 run --vus 10 --duration 120s networkDiscovery.k6.js
 * 
 * 5. Run with custom base URL:
 *    k6 run -e BASE_URL=http://production.example.com networkDiscovery.k6.js
 * 
 * 6. Generate detailed report:
 *    k6 run --out json=network-discovery-results.json networkDiscovery.k6.js
 * 
 * Expected Results:
 * - Network discovery success rate: > 99%
 * - P95 discovery latency: < 2s
 * - P99 discovery latency: < 5s
 * - VLAN deduplication P95: < 200ms
 * - Topology mapping P95: < 1s
 * - API errors: < 1% of total requests
 */
