import React, { useState, useEffect } from 'react';
import { PurpleGlassCard, PurpleGlassButton, PageHeader } from '../components/ui';
import {
  DataBarHorizontalRegular,
  DataPieRegular,
  TableRegular,
  GaugeRegular,
  AddRegular,
  ArrowClockwiseRegular,
  CalendarMonthRegular,
  ChartMultipleRegular
} from '@fluentui/react-icons';
import { apiClient } from '../utils/apiClient';
import { tokens } from '@fluentui/react-components';
import { 
  VisxBarChart, 
  VisxPieChart, 
  VisxLineChart 
} from '../components/charts';
import { ParentSize } from '@visx/responsive';

interface DashboardWidgetProps {
  widgetId: string;
  name: string;
  type: string;
  onRefresh?: () => void;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ widgetId, name, type, onRefresh }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // For demo, use mock data since backend might not be running
      const mockData = getMockWidgetData(type);
      setData(mockData);
    } catch (err) {
      console.error('Error fetching widget data:', err);
      setError('Failed to load widget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [widgetId]);

  const handleRefresh = () => {
    fetchData();
    onRefresh?.();
  };

  return (
    <PurpleGlassCard
      glass
      style={{
        padding: tokens.spacingVerticalL,
        height: '350px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: tokens.spacingVerticalM,
        flexShrink: 0,
      }}>
        <h3 style={{
          margin: 0,
          fontSize: tokens.fontSizeBase400,
          fontWeight: tokens.fontWeightSemibold,
          color: tokens.colorNeutralForeground1,
        }}>
          {name}
        </h3>
        <PurpleGlassButton
          icon={<ArrowClockwiseRegular />}
          onClick={handleRefresh}
          size="small"
        />
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {loading && <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>Loading...</div>}
        {error && <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL, color: tokens.colorPaletteRedForeground1 }}>{error}</div>}
        {data && renderWidget(type, data)}
      </div>
    </PurpleGlassCard>
  );
};

const renderWidget = (type: string, data: any) => {
  switch (type) {
    case 'COUNTER':
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
          <div style={{
            fontSize: '3rem',
            fontWeight: tokens.fontWeightBold,
            color: tokens.colorBrandForeground1,
          }}>
            {data.value}
          </div>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            color: tokens.colorNeutralForeground2,
            marginTop: tokens.spacingVerticalS,
          }}>
            {data.label}
          </div>
          {data.change && (
            <div style={{
              fontSize: tokens.fontSizeBase200,
              color: data.change.direction === 'UP' 
                ? tokens.colorPaletteGreenForeground1 
                : tokens.colorPaletteRedForeground1,
              marginTop: tokens.spacingVerticalXS,
            }}>
              {data.change.direction === 'UP' ? '↑' : '↓'} {data.change.percentage}% {data.change.comparison_period}
            </div>
          )}
        </div>
      );

    case 'PIE_CHART':
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ParentSize debounceTime={10}>
            {({ width, height }) => (
              <VisxPieChart
                data={data}
                width={width}
                height={height || 250}
                donut
                donutThickness={40}
                showLegend
                showPercentages
              />
            )}
          </ParentSize>
        </div>
      );

    case 'BAR_CHART':
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ParentSize debounceTime={10}>
            {({ width, height }) => (
              <VisxBarChart
                data={data}
                width={width}
                height={height || 250}
                showGrid
                showTooltip
              />
            )}
          </ParentSize>
        </div>
      );

    case 'LINE_CHART':
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <ParentSize debounceTime={10}>
            {({ width, height }) => (
              <VisxLineChart
                data={data.map((d: any) => ({
                  ...d,
                  timestamp: new Date(Date.now() - (30 - parseInt(d.timestamp.replace('Day ', ''))) * 24 * 60 * 60 * 1000)
                }))}
                width={width}
                height={height || 250}
                showGrid
                showArea
                showDots={false}
              />
            )}
          </ParentSize>
        </div>
      );

    case 'GAUGE':
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
          <div style={{
            fontSize: '2.5rem',
            fontWeight: tokens.fontWeightBold,
            color: data.current >= data.target 
              ? tokens.colorPaletteGreenForeground1 
              : tokens.colorPaletteYellowForeground1,
          }}>
            {data.current.toFixed(1)}{data.unit}
          </div>
          <div style={{
            fontSize: tokens.fontSizeBase300,
            color: tokens.colorNeutralForeground2,
            marginTop: tokens.spacingVerticalS,
          }}>
            Target: {data.target}{data.unit}
          </div>
          <div style={{
            width: '80%',
            height: '20px',
            backgroundColor: tokens.colorNeutralBackground3,
            borderRadius: tokens.borderRadiusMedium,
            marginTop: tokens.spacingVerticalM,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${(data.current / data.max) * 100}%`,
              height: '100%',
              backgroundColor: data.current >= data.target 
                ? tokens.colorPaletteGreenBackground2 
                : tokens.colorPaletteYellowBackground2,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>
      );

    case 'TABLE':
      return (
        <div style={{ overflowY: 'auto', height: '100%' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: tokens.fontSizeBase300,
          }}>
            <thead>
              <tr>
                {data.headers?.map((header: any, index: number) => (
                  <th key={index} style={{
                    padding: tokens.spacingVerticalS,
                    textAlign: 'left',
                    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
                    fontWeight: tokens.fontWeightSemibold,
                  }}>
                    {header.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows?.slice(0, 10).map((row: any, rowIndex: number) => (
                <tr key={rowIndex}>
                  {data.headers?.map((header: any, colIndex: number) => (
                    <td key={colIndex} style={{
                      padding: tokens.spacingVerticalS,
                      borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
                    }}>
                      {row[header.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return <div>Widget type not supported</div>;
  }
};

const getMockWidgetData = (type: string) => {
  switch (type) {
    case 'COUNTER':
      return {
        value: 142,
        label: 'Open Tickets',
        change: {
          percentage: 12.5,
          direction: 'UP',
          comparison_period: 'vs last week',
        },
      };

    case 'PIE_CHART':
      return [
        { label: 'NEW', value: 45 },
        { label: 'IN_PROGRESS', value: 67 },
        { label: 'RESOLVED', value: 89 },
        { label: 'CLOSED', value: 123 },
      ];

    case 'BAR_CHART':
      return [
        { label: 'P1', value: 12 },
        { label: 'P2', value: 45 },
        { label: 'P3', value: 67 },
        { label: 'P4', value: 89 },
      ];

    case 'LINE_CHART':
      return Array.from({ length: 30 }, (_, i) => ({
        timestamp: `Day ${i + 1}`,
        value: Math.floor(Math.random() * 50) + 20,
      }));

    case 'GAUGE':
      return {
        current: 92.5,
        target: 95.0,
        max: 100.0,
        label: 'SLA Compliance',
        unit: '%',
      };

    case 'TABLE':
      return {
        headers: [
          { key: 'id', label: 'ID', sortable: true },
          { key: 'title', label: 'Title', sortable: true },
          { key: 'status', label: 'Status', sortable: true },
        ],
        rows: [
          { id: 'TKT-001', title: 'Server down', status: 'IN_PROGRESS' },
          { id: 'TKT-002', title: 'Password reset', status: 'RESOLVED' },
          { id: 'TKT-003', title: 'Network issue', status: 'NEW' },
        ],
        total_rows: 3,
      };

    default:
      return null;
  }
};

export const ReportingDashboardView: React.FC = () => {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [currentDashboard, setCurrentDashboard] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const defaultWidgets = [
    { id: 'w1', name: 'Open Tickets', type: 'COUNTER' },
    { id: 'w2', name: 'Tickets by Status', type: 'PIE_CHART' },
    { id: 'w3', name: 'Tickets by Priority', type: 'BAR_CHART' },
    { id: 'w4', name: 'SLA Compliance', type: 'GAUGE' },
    { id: 'w5', name: 'Ticket Trend (30 days)', type: 'LINE_CHART' },
    { id: 'w6', name: 'Recent Tickets', type: 'TABLE' },
  ];

  return (
    <div style={{
      padding: tokens.spacingVerticalXXL,
      maxWidth: '1600px',
      margin: '0 auto',
    }}>
      {/* Header */}
      <PageHeader
        icon={<ChartMultipleRegular />}
        title="Reporting Dashboard"
        subtitle="Monitor key metrics and performance indicators"
        actions={
          <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
            <PurpleGlassButton
              icon={<CalendarMonthRegular />}
              glass
            >
              Date Range
            </PurpleGlassButton>
            <PurpleGlassButton
              icon={<ArrowClockwiseRegular />}
              glass
            >
              Refresh All
            </PurpleGlassButton>
            <PurpleGlassButton
              icon={<AddRegular />}
              variant="primary"
            >
              Add Widget
            </PurpleGlassButton>
          </div>
        }
      />

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: tokens.spacingVerticalXL,
      }}>
        {defaultWidgets.map((widget) => (
          <DashboardWidget
            key={widget.id}
            widgetId={widget.id}
            name={widget.name}
            type={widget.type}
          />
        ))}
      </div>
    </div>
  );
};

export default ReportingDashboardView;
