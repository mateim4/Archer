/**
 * Mock Data for Monitoring Module
 * 
 * Contains mock alerts and metrics data for development and testing.
 * In production, this would be replaced by actual API calls.
 */

// Alert interface for monitoring
export interface MonitoringAlert {
  id: string;
  assetId: string;
  assetName: string;
  assetType?: 'CLUSTER' | 'HOST' | 'VM' | 'SWITCH';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  metricName?: string;
  metricValue?: string;
  threshold?: string;
  acknowledged?: boolean;
  incidentCreated?: boolean;
}

/**
 * Mock alerts for the monitoring dashboard
 * These simulate real-time alerts from infrastructure monitoring
 */
export const getMockAlerts = (): MonitoringAlert[] => [
  {
    id: 'alert-1',
    assetId: 'nx-cluster-01',
    assetName: 'NX-Cluster-Production',
    assetType: 'CLUSTER',
    severity: 'critical',
    message: 'CPU usage exceeded 95% for 15 minutes',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    metricName: 'CPU Usage',
    metricValue: '97%',
    threshold: '90%',
  },
  {
    id: 'alert-2',
    assetId: 'host-web-01',
    assetName: 'prod-web-server-01',
    assetType: 'HOST',
    severity: 'warning',
    message: 'Memory usage at 85%',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    metricName: 'Memory Usage',
    metricValue: '85%',
    threshold: '80%',
  },
  {
    id: 'alert-3',
    assetId: 'vm-app-01',
    assetName: 'app-server-vm-01',
    assetType: 'VM',
    severity: 'info',
    message: 'VM migrated to new host',
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
];

/**
 * Generate time-series mock metrics data
 */
export const generateMockMetrics = (hours: number = 24, interval: number = 5) => {
  const now = Date.now();
  const points = Math.floor((hours * 60) / interval);
  const data = [];
  
  for (let i = points; i >= 0; i--) {
    const timestamp = new Date(now - i * interval * 60000).toISOString();
    data.push({
      timestamp,
      cpu: Math.random() * 40 + 40, // 40-80%
      memory: Math.random() * 30 + 50, // 50-80%
      network: Math.random() * 500 + 100, // 100-600 Mbps
      storage: Math.random() * 20 + 60, // 60-80%
    });
  }
  
  return data;
};
