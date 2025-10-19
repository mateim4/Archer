import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Server, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  PieChart,
  LineChart,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Settings,
  Eye,
  Users,
  Database
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { PurpleGlassDropdown } from '@/components/ui';

// Types for analytics data
interface AnalyticsMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface SystemHealth {
  overall_health_score: number;
  database_performance: {
    query_response_time_avg: number;
    active_connections: number;
    cpu_utilization: number;
    memory_usage: number;
  };
  api_performance: {
    response_time_p50: number;
    response_time_p95: number;
    requests_per_second: number;
    error_rate: number;
  };
  resource_utilization: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_io: number;
  };
}

interface DashboardAlert {
  alert_id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  created_at: string;
  source: string;
  action_required: boolean;
}

interface DashboardData {
  overview: {
    total_servers: number;
    active_projects: number;
    average_utilization: number;
    system_health_score: number;
    capacity_remaining: number;
    cost_trend: number;
  };
  key_metrics: AnalyticsMetric[];
  alerts: DashboardAlert[];
  charts: any[];
}

// API service for analytics
class AnalyticsService {
  private baseUrl = 'http://127.0.0.1:3002/api';

  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/dashboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      // Return mock data for development
      return this.getMockDashboardData();
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const response = await fetch(`${this.baseUrl}/analytics/system/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return this.getMockSystemHealth();
    }
  }

  async getHardwareAnalytics(params: any = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`${this.baseUrl}/analytics/hardware/utilization?${queryParams}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch hardware analytics:', error);
      return this.getMockHardwareAnalytics();
    }
  }

  // Mock data for development/demo
  private getMockDashboardData(): DashboardData {
    return {
      overview: {
        total_servers: 156,
        active_projects: 23,
        average_utilization: 74.2,
        system_health_score: 94.8,
        capacity_remaining: 31.5,
        cost_trend: -2.3
      },
      key_metrics: [
        {
          name: "CPU Utilization",
          value: 74.2,
          unit: "%",
          change: 2.1,
          trend: "up",
          status: "good"
        },
        {
          name: "Memory Usage",
          value: 68.7,
          unit: "%",
          change: -1.5,
          trend: "down",
          status: "good"
        },
        {
          name: "Storage Usage",
          value: 45.3,
          unit: "%",
          change: 3.2,
          trend: "up",
          status: "excellent"
        },
        {
          name: "Active Projects",
          value: 23,
          unit: "projects",
          change: 5,
          trend: "up",
          status: "good"
        }
      ],
      alerts: [
        {
          alert_id: "alert_001",
          severity: "medium",
          title: "High CPU Utilization",
          description: "Server cluster-01 experiencing sustained high CPU usage",
          created_at: new Date().toISOString(),
          source: "monitoring_system",
          action_required: true
        },
        {
          alert_id: "alert_002",
          severity: "info",
          title: "Maintenance Window Scheduled",
          description: "Scheduled maintenance for database cluster on Sunday",
          created_at: new Date().toISOString(),
          source: "maintenance_scheduler",
          action_required: false
        }
      ],
      charts: []
    };
  }

  private getMockSystemHealth(): SystemHealth {
    return {
      overall_health_score: 94.8,
      database_performance: {
        query_response_time_avg: 45.2,
        active_connections: 24,
        cpu_utilization: 32.1,
        memory_usage: 58.7
      },
      api_performance: {
        response_time_p50: 120.5,
        response_time_p95: 245.8,
        requests_per_second: 847.2,
        error_rate: 0.08
      },
      resource_utilization: {
        cpu_usage: 45.2,
        memory_usage: 67.8,
        disk_usage: 34.5,
        network_io: 1250.7
      }
    };
  }

  private getMockHardwareAnalytics() {
    return {
      summary: {
        total_servers: 156,
        total_cpu_cores: 3584,
        total_memory: 51200,
        average_utilization: 74.2
      },
      trends: {
        utilization_trend: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          cpu: 70 + Math.random() * 20,
          memory: 60 + Math.random() * 25,
          storage: 40 + Math.random() * 20
        }))
      }
    };
  }
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [hardwareAnalytics, setHardwareAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const analyticsService = new AnalyticsService();

  // Memoized time range options for dropdown
  const timeRangeOptions = useMemo(() => [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ], []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboard, health, hardware] = await Promise.all([
        analyticsService.getDashboardData(),
        analyticsService.getSystemHealth(),
        analyticsService.getHardwareAnalytics({ time_range: selectedTimeRange })
      ]);

      setDashboardData(dashboard);
      setSystemHealth(health);
      setHardwareAnalytics(hardware);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  if (loading) {
    return (
      <div>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <AlertTriangle size={48} className="mx-auto mb-4 text-orange-500" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadDashboardData}
              className="lcm-button-primary"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="text-green-500" size={16} />;
      case 'good': return <CheckCircle className="text-blue-500" size={16} />;
      case 'warning': return <AlertTriangle className="text-orange-500" size={16} />;
      case 'critical': return <AlertTriangle className="text-red-500" size={16} />;
      default: return <Activity className="text-gray-500" size={16} />;
    }
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') {
      return <TrendingUp className={`${change > 0 ? 'text-green-500' : 'text-red-500'}`} size={16} />;
    } else if (trend === 'down') {
      return <TrendingUp className={`transform rotate-180 ${change < 0 ? 'text-red-500' : 'text-green-500'}`} size={16} />;
    }
    return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      case 'info': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  // Chart configurations
  const utilizationTrendOption = {
    title: {
      text: 'Resource Utilization Trends',
      left: 'left',
      textStyle: { fontSize: 16, fontWeight: 600 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['CPU', 'Memory', 'Storage'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hardwareAnalytics?.trends?.utilization_trend?.map((item: any) => item.date) || []
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [
      {
        name: 'CPU',
        type: 'line',
        smooth: true,
        data: hardwareAnalytics?.trends?.utilization_trend?.map((item: any) => item.cpu.toFixed(1)) || [],
        itemStyle: { color: '#0f6cbd' }
      },
      {
        name: 'Memory',
        type: 'line',
        smooth: true,
        data: hardwareAnalytics?.trends?.utilization_trend?.map((item: any) => item.memory.toFixed(1)) || [],
        itemStyle: { color: '#107c10' }
      },
      {
        name: 'Storage',
        type: 'line',
        smooth: true,
        data: hardwareAnalytics?.trends?.utilization_trend?.map((item: any) => item.storage.toFixed(1)) || [],
        itemStyle: { color: '#ff8c00' }
      }
    ]
  };

  const systemHealthGaugeOption = {
    title: {
      text: 'System Health Score',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 600 }
    },
    series: [
      {
        name: 'Health Score',
        type: 'gauge',
        detail: { formatter: '{value}%', fontSize: 20 },
        data: [{ value: systemHealth?.overall_health_score || 0, name: 'Health Score' }],
        min: 0,
        max: 100,
        axisLine: {
          lineStyle: {
            width: 8,
            color: [
              [0.6, '#ff4757'],
              [0.8, '#ffa502'],
              [1, '#2ed573']
            ]
          }
        }
      }
    ]
  };

  return (
    <div>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Advanced Analytics Dashboard</h1>
            <p className="text-gray-600">Real-time insights and system analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <PurpleGlassDropdown
              options={timeRangeOptions}
              value={selectedTimeRange}
              onChange={(value) => setSelectedTimeRange(value as string)}
              placeholder="Select time range..."
              glass="light"
            />
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="lcm-button-secondary flex items-center gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dashboardData.key_metrics.map((metric, index) => (
              <div key={index} className="lcm-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(metric.status)}
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  {getTrendIcon(metric.trend, metric.change)}
                </div>
                <div className="text-2xl font-bold mb-1">
                  {metric.value.toFixed(1)} {metric.unit}
                </div>
                <div className={`text-sm ${metric.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Utilization Trends */}
          <div className="lcm-card p-6">
            <ReactECharts 
              option={utilizationTrendOption}
              style={{ height: '350px' }}
            />
          </div>

          {/* System Health Gauge */}
          <div className="lcm-card p-6">
            <ReactECharts 
              option={systemHealthGaugeOption}
              style={{ height: '350px' }}
            />
          </div>
        </div>

        {/* System Details */}
        {systemHealth && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Database Performance */}
            <div className="lcm-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Database size={20} className="text-blue-500" />
                <h3 className="font-semibold">Database Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Avg Response Time</span>
                  <span className="font-medium">{systemHealth.database_performance.query_response_time_avg}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Connections</span>
                  <span className="font-medium">{systemHealth.database_performance.active_connections}</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage</span>
                  <span className="font-medium">{systemHealth.database_performance.cpu_utilization.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage</span>
                  <span className="font-medium">{systemHealth.database_performance.memory_usage.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* API Performance */}
            <div className="lcm-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap size={20} className="text-green-500" />
                <h3 className="font-semibold">API Performance</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Response Time (P50)</span>
                  <span className="font-medium">{systemHealth.api_performance.response_time_p50}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Response Time (P95)</span>
                  <span className="font-medium">{systemHealth.api_performance.response_time_p95}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Requests/sec</span>
                  <span className="font-medium">{systemHealth.api_performance.requests_per_second.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Rate</span>
                  <span className="font-medium">{systemHealth.api_performance.error_rate.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            {/* Resource Utilization */}
            <div className="lcm-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server size={20} className="text-purple-500" />
                <h3 className="font-semibold">Resource Utilization</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>CPU Usage</span>
                  <span className="font-medium">{systemHealth.resource_utilization.cpu_usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory Usage</span>
                  <span className="font-medium">{systemHealth.resource_utilization.memory_usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Disk Usage</span>
                  <span className="font-medium">{systemHealth.resource_utilization.disk_usage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Network I/O</span>
                  <span className="font-medium">{systemHealth.resource_utilization.network_io.toFixed(1)} MB/s</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {dashboardData && dashboardData.alerts.length > 0 && (
          <div className="lcm-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-orange-500" />
              <h3 className="font-semibold">Active Alerts</h3>
              <span className="ml-auto bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                {dashboardData.alerts.length}
              </span>
            </div>
            <div className="space-y-3">
              {dashboardData.alerts.map((alert) => (
                <div key={alert.alert_id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{alert.title}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                          alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                          alert.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                          alert.severity === 'low' ? 'bg-blue-200 text-blue-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">{alert.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Source: {alert.source}</span>
                        <span>Time: {new Date(alert.created_at).toLocaleTimeString()}</span>
                        {alert.action_required && (
                          <span className="text-red-600 font-medium">Action Required</span>
                        )}
                      </div>
                    </div>
                    {alert.action_required && (
                      <button className="lcm-button-primary text-xs px-3 py-1">
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
