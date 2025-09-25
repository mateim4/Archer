import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title1,
  Title3,
  Body1,
  Body2,
  Caption1,
  Badge,
  ProgressBar,
  Tab,
  TabList,
  SelectTabData,
  SelectTabEvent,
  DataGrid,
  DataGridHeader,
  DataGridRow,
  DataGridHeaderCell,
  DataGridBody,
  DataGridCell,
  TableCellLayout,
  TableColumnDefinition,
  createTableColumn,
  Tooltip,
  Spinner,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Input,
  Dropdown,
  Option,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowUpload24Regular,
  ArrowDownload24Regular,
  ChartMultiple24Regular,
  Warning24Regular,
  CheckmarkCircle24Regular,
  ErrorCircle24Regular,
  Clock24Regular,
  Database24Regular,
  Settings24Regular,
  DocumentText24Regular,
} from '@fluentui/react-icons';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Group } from '@visx/group';
import { Bar as VisxBar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalXL,
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground2} 0%, ${tokens.colorBrandBackground} 100%)`,
    minHeight: '100vh',
  },
  header: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    ...shorthands.padding(tokens.spacingVerticalXL, tokens.spacingHorizontalXXL),
    boxShadow: tokens.shadow16,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalL,
  },
  statCard: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    transition: 'all 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  statValue: {
    fontSize: tokens.fontSizeHero900,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  contentCard: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow8,
    overflow: 'hidden',
  },
  chartContainer: {
    padding: tokens.spacingHorizontalXL,
    minHeight: '400px',
  },
  uploadArea: {
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    background: tokens.colorNeutralBackground2,
    transition: 'all 0.2s',
    cursor: 'pointer',
    ':hover': {
      background: tokens.colorNeutralBackground3,
      borderColor: tokens.colorBrandStroke1,
    },
  },
  eolBadge: {
    background: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground1,
  },
  nearEolBadge: {
    background: tokens.colorPaletteYellowBackground3,
    color: tokens.colorPaletteYellowForeground2,
  },
  currentBadge: {
    background: tokens.colorPaletteGreenBackground3,
    color: tokens.colorPaletteGreenForeground1,
  },
  actionButtons: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    marginTop: tokens.spacingVerticalL,
  },
  reportTemplate: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalM,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

interface EOLHost {
  hostname: string;
  cluster: string;
  model: string;
  cpuCores: number;
  memoryGB: number;
  eolStatus: 'EOL' | 'Near EOL' | 'Current';
  eolDate?: string;
  replacementModel?: string;
}

interface ClusterMetrics {
  name: string;
  hostCount: number;
  vmCount: number;
  totalCores: number;
  totalMemoryTB: number;
  utilizationCPU: number;
  utilizationMemory: number;
  eolHostCount: number;
}

export const HardwareLifecycleView: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  const [rvToolsFile, setRvToolsFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [eolHosts, setEolHosts] = useState<EOLHost[]>([]);
  const [clusterMetrics, setClusterMetrics] = useState<ClusterMetrics[]>([]);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedReportTemplate, setSelectedReportTemplate] = useState('default');

  const reportTemplates = [
    { id: 'default', name: 'Default Lifecycle Report', description: 'Comprehensive hardware lifecycle analysis' },
    { id: 'executive', name: 'Executive Summary', description: 'High-level overview for management' },
    { id: 'technical', name: 'Technical Deep Dive', description: 'Detailed technical specifications and metrics' },
    { id: 'migration', name: 'Migration Roadmap', description: 'Phased migration plan with timelines' },
  ];

  const handleTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRvToolsFile(file);
      processRvToolsFile(file);
    }
  };

  const processRvToolsFile = async (file: File) => {
    setIsProcessing(true);
    
    // Simulate processing (in real implementation, this would call your backend API)
    setTimeout(() => {
      // Sample data for demonstration
      const sampleEolHosts: EOLHost[] = [
        {
          hostname: 'plbylesx1.plbyd.pl.int',
          cluster: 'PLBYDCL01',
          model: 'ProLiant DL380 Gen9',
          cpuCores: 40,
          memoryGB: 512,
          eolStatus: 'Near EOL',
          eolDate: '2025-03-31',
          replacementModel: 'ProLiant DL380 Gen11',
        },
        {
          hostname: 'plbylesx2.plbyd.pl.int',
          cluster: 'PLBYDCL01',
          model: 'ProLiant DL380 Gen9',
          cpuCores: 40,
          memoryGB: 512,
          eolStatus: 'Near EOL',
          eolDate: '2025-03-31',
          replacementModel: 'ProLiant DL380 Gen11',
        },
        {
          hostname: 'asnhost01.asn.int',
          cluster: 'ASNCLUBA0001',
          model: 'ProLiant BL460c Gen9',
          cpuCores: 32,
          memoryGB: 256,
          eolStatus: 'Near EOL',
          eolDate: '2025-03-31',
          replacementModel: 'ProLiant BL460c Gen11',
        },
      ];

      const sampleClusterMetrics: ClusterMetrics[] = [
        {
          name: 'PLBYDCL01',
          hostCount: 3,
          vmCount: 97,
          totalCores: 120,
          totalMemoryTB: 1.5,
          utilizationCPU: 65,
          utilizationMemory: 72,
          eolHostCount: 2,
        },
        {
          name: 'PLBYDCL02',
          hostCount: 3,
          vmCount: 13,
          totalCores: 48,
          totalMemoryTB: 0.75,
          utilizationCPU: 45,
          utilizationMemory: 58,
          eolHostCount: 0,
        },
        {
          name: 'ASNCLUBA0001',
          hostCount: 4,
          vmCount: 43,
          totalCores: 96,
          totalMemoryTB: 1.0,
          utilizationCPU: 78,
          utilizationMemory: 82,
          eolHostCount: 1,
        },
      ];

      setEolHosts(sampleEolHosts);
      setClusterMetrics(sampleClusterMetrics);
      setAnalysisData({
        totalHosts: 74,
        eolCount: 12,
        nearEolCount: 18,
        totalVMs: 789,
        totalClusters: 13,
      });

      setIsProcessing(false);
    }, 2000);
  };

  const generateReport = () => {
    // In real implementation, this would call your report generation API
    console.log(`Generating ${selectedReportTemplate} report...`);
    setReportDialogOpen(false);
    
    // Open the generated HTML report in a new tab
    window.open('/api/reports/generate?template=' + selectedReportTemplate, '_blank');
  };

  const eolColumns: TableColumnDefinition<EOLHost>[] = [
    createTableColumn<EOLHost>({
      columnId: 'hostname',
      renderHeaderCell: () => 'Hostname',
      renderCell: (item) => (
        <TableCellLayout>
          <Text weight="semibold">{item.hostname}</Text>
        </TableCellLayout>
      ),
    }),
    createTableColumn<EOLHost>({
      columnId: 'cluster',
      renderHeaderCell: () => 'Cluster',
      renderCell: (item) => item.cluster,
    }),
    createTableColumn<EOLHost>({
      columnId: 'model',
      renderHeaderCell: () => 'Model',
      renderCell: (item) => item.model,
    }),
    createTableColumn<EOLHost>({
      columnId: 'cores',
      renderHeaderCell: () => 'CPU Cores',
      renderCell: (item) => item.cpuCores,
    }),
    createTableColumn<EOLHost>({
      columnId: 'memory',
      renderHeaderCell: () => 'Memory (GB)',
      renderCell: (item) => item.memoryGB,
    }),
    createTableColumn<EOLHost>({
      columnId: 'status',
      renderHeaderCell: () => 'EOL Status',
      renderCell: (item) => (
        <Badge
          appearance="filled"
          className={
            item.eolStatus === 'EOL'
              ? styles.eolBadge
              : item.eolStatus === 'Near EOL'
              ? styles.nearEolBadge
              : styles.currentBadge
          }
        >
          {item.eolStatus}
        </Badge>
      ),
    }),
    createTableColumn<EOLHost>({
      columnId: 'eolDate',
      renderHeaderCell: () => 'EOL Date',
      renderCell: (item) => item.eolDate || '-',
    }),
    createTableColumn<EOLHost>({
      columnId: 'replacement',
      renderHeaderCell: () => 'Replacement',
      renderCell: (item) => (
        <Text weight="medium" style={{ color: tokens.colorBrandForeground1 }}>
          {item.replacementModel || '-'}
        </Text>
      ),
    }),
  ];

  const capacityData = clusterMetrics.map(cluster => ({
    name: cluster.name,
    cpu: cluster.utilizationCPU,
    memory: cluster.utilizationMemory,
    eolHosts: (cluster.eolHostCount / cluster.hostCount) * 100,
  }));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Title1>Hardware Lifecycle Management</Title1>
        <Body1>Analyze infrastructure lifecycle, identify EOL hardware, and plan replacements</Body1>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Caption1>Total Hosts</Caption1>
            <div className={styles.statValue}>{analysisData?.totalHosts || '-'}</div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Across {analysisData?.totalClusters || '-'} clusters
            </Caption1>
          </div>
          <div className={styles.statCard}>
            <Caption1>EOL Hardware</Caption1>
            <div className={styles.statValue} style={{ color: tokens.colorPaletteRedForeground1 }}>
              {analysisData?.eolCount || '-'}
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Immediate replacement needed
            </Caption1>
          </div>
          <div className={styles.statCard}>
            <Caption1>Near EOL (12 months)</Caption1>
            <div className={styles.statValue} style={{ color: tokens.colorPaletteYellowForeground2 }}>
              {analysisData?.nearEolCount || '-'}
            </div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Plan replacement soon
            </Caption1>
          </div>
          <div className={styles.statCard}>
            <Caption1>Total VMs</Caption1>
            <div className={styles.statValue}>{analysisData?.totalVMs || '-'}</div>
            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
              Running workloads
            </Caption1>
          </div>
        </div>
      </div>

      <Card className={styles.contentCard}>
        <CardHeader
          header={
            <TabList selectedValue={selectedTab} onTabSelect={handleTabSelect}>
              <Tab value="overview" icon={<ChartMultiple24Regular />}>
                Overview
              </Tab>
              <Tab value="eol-hardware" icon={<Warning24Regular />}>
                EOL Hardware
              </Tab>
              <Tab value="clusters" icon={<Database24Regular />}>
                Cluster Analysis
              </Tab>
              <Tab value="reports" icon={<DocumentText24Regular />}>
                Reports
              </Tab>
              <Tab value="settings" icon={<Settings24Regular />}>
                Settings
              </Tab>
            </TabList>
          }
        />
        <CardPreview>
          {selectedTab === 'overview' && (
            <div>
              {!rvToolsFile ? (
                <label htmlFor="file-upload">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <div className={styles.uploadArea}>
                    <ArrowUpload24Regular style={{ fontSize: '48px', color: tokens.colorBrandForeground1 }} />
                    <Title3>Upload RVTools Export</Title3>
                    <Body2>Drag and drop or click to select your RVTools Excel file</Body2>
                    <Caption1>Supports .xlsx and .xls formats</Caption1>
                  </div>
                </label>
              ) : (
                <div>
                  {isProcessing ? (
                    <div style={{ textAlign: 'center', padding: tokens.spacingVerticalXXL }}>
                      <Spinner size="large" />
                      <Body1 style={{ marginTop: tokens.spacingVerticalL }}>
                        Processing RVTools data...
                      </Body1>
                    </div>
                  ) : (
                    <div className={styles.chartContainer}>
                      <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>
                        Capacity Utilization by Cluster
                      </Title3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={capacityData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="cpu" fill={tokens.colorBrandBackground} name="CPU %" />
                          <Bar dataKey="memory" fill={tokens.colorBrandBackground2} name="Memory %" />
                          <Bar dataKey="eolHosts" fill={tokens.colorPaletteRedBackground3} name="EOL Hosts %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedTab === 'eol-hardware' && (
            <div>
              <div style={{ padding: tokens.spacingHorizontalXL }}>
                <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>
                  End-of-Life Hardware Inventory
                </Title3>
                <DataGrid
                  items={eolHosts}
                  columns={eolColumns}
                  sortable
                  selectionMode="multiselect"
                  getRowId={(item) => item.hostname}
                >
                  <DataGridHeader>
                    <DataGridRow>
                      {({ renderHeaderCell }) => (
                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                      )}
                    </DataGridRow>
                  </DataGridHeader>
                  <DataGridBody<EOLHost>>
                    {({ item, rowId }) => (
                      <DataGridRow<EOLHost> key={rowId}>
                        {({ renderCell }) => (
                          <DataGridCell>{renderCell(item)}</DataGridCell>
                        )}
                      </DataGridRow>
                    )}
                  </DataGridBody>
                </DataGrid>

                <div className={styles.actionButtons}>
                  <Button appearance="primary" icon={<ArrowDownload24Regular />}>
                    Export to Excel
                  </Button>
                  <Button appearance="secondary" onClick={() => setReportDialogOpen(true)}>
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'clusters' && (
            <div className={styles.chartContainer}>
              <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>
                Cluster Resource Distribution
              </Title3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={clusterMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="utilizationCPU" 
                    stroke={tokens.colorBrandBackground}
                    strokeWidth={2}
                    name="CPU Utilization %"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="utilizationMemory" 
                    stroke={tokens.colorBrandBackground2}
                    strokeWidth={2}
                    name="Memory Utilization %"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div style={{ marginTop: tokens.spacingVerticalXL }}>
                <Title3>Cluster Summary</Title3>
                {clusterMetrics.map(cluster => (
                  <Card key={cluster.name} style={{ marginTop: tokens.spacingVerticalM }}>
                    <CardHeader
                      header={<Text weight="semibold">{cluster.name}</Text>}
                      description={`${cluster.hostCount} hosts, ${cluster.vmCount} VMs`}
                      action={
                        cluster.eolHostCount > 0 && (
                          <Badge appearance="filled" className={styles.nearEolBadge}>
                            {cluster.eolHostCount} EOL hosts
                          </Badge>
                        )
                      }
                    />
                    <CardPreview>
                      <div style={{ display: 'flex', gap: tokens.spacingHorizontalXL }}>
                        <div>
                          <Caption1>CPU Cores</Caption1>
                          <Text weight="semibold">{cluster.totalCores}</Text>
                        </div>
                        <div>
                          <Caption1>Memory</Caption1>
                          <Text weight="semibold">{cluster.totalMemoryTB} TB</Text>
                        </div>
                        <div>
                          <Caption1>CPU Utilization</Caption1>
                          <ProgressBar value={cluster.utilizationCPU / 100} />
                        </div>
                        <div>
                          <Caption1>Memory Utilization</Caption1>
                          <ProgressBar value={cluster.utilizationMemory / 100} />
                        </div>
                      </div>
                    </CardPreview>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'reports' && (
            <div style={{ padding: tokens.spacingHorizontalXL }}>
              <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>
                Report Templates
              </Title3>
              <Body1 style={{ marginBottom: tokens.spacingVerticalXL }}>
                Select a report template to generate comprehensive lifecycle analysis
              </Body1>

              {reportTemplates.map(template => (
                <div key={template.id} className={styles.reportTemplate}>
                  <div>
                    <Text weight="semibold">{template.name}</Text>
                    <Caption1 style={{ display: 'block' }}>{template.description}</Caption1>
                  </div>
                  <Button 
                    appearance="primary" 
                    onClick={() => {
                      setSelectedReportTemplate(template.id);
                      setReportDialogOpen(true);
                    }}
                  >
                    Generate
                  </Button>
                </div>
              ))}

              <div style={{ marginTop: tokens.spacingVerticalXL }}>
                <Title3>Recent Reports</Title3>
                <Caption1>No recent reports available</Caption1>
              </div>
            </div>
          )}

          {selectedTab === 'settings' && (
            <div style={{ padding: tokens.spacingHorizontalXL }}>
              <Title3 style={{ marginBottom: tokens.spacingVerticalL }}>
                Lifecycle Settings
              </Title3>
              
              <div style={{ marginBottom: tokens.spacingVerticalL }}>
                <label>
                  <Text weight="semibold">EOL Threshold (months)</Text>
                  <Input type="number" defaultValue="12" style={{ marginTop: tokens.spacingVerticalS }} />
                  <Caption1>Hardware within this threshold will be marked as "Near EOL"</Caption1>
                </label>
              </div>

              <div style={{ marginBottom: tokens.spacingVerticalL }}>
                <label>
                  <Text weight="semibold">Default Report Template</Text>
                  <Dropdown 
                    defaultSelectedOptions={['default']}
                    style={{ marginTop: tokens.spacingVerticalS, minWidth: '200px' }}
                  >
                    {reportTemplates.map(template => (
                      <Option key={template.id} value={template.id}>
                        {template.name}
                      </Option>
                    ))}
                  </Dropdown>
                </label>
              </div>

              <div style={{ marginBottom: tokens.spacingVerticalL }}>
                <Text weight="semibold">Hardware EOL Database</Text>
                <Caption1 style={{ display: 'block', marginTop: tokens.spacingVerticalS }}>
                  Last updated: 2025-09-22
                </Caption1>
                <Button appearance="secondary" style={{ marginTop: tokens.spacingVerticalM }}>
                  Update EOL Database
                </Button>
              </div>

              <Button appearance="primary">Save Settings</Button>
            </div>
          )}
        </CardPreview>
      </Card>

      {/* Report Generation Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={(event, data) => setReportDialogOpen(data.open)}>
        <DialogSurface>
          <DialogTitle>Generate Lifecycle Report</DialogTitle>
          <DialogContent>
            <DialogBody>
              <Text>
                Generate a comprehensive hardware lifecycle report using the{' '}
                <Text weight="semibold">{selectedReportTemplate}</Text> template?
              </Text>
              <div style={{ marginTop: tokens.spacingVerticalL }}>
                <Caption1>This report will include:</Caption1>
                <ul style={{ marginTop: tokens.spacingVerticalS, paddingLeft: '20px' }}>
                  <li>EOL hardware inventory</li>
                  <li>Cluster resource analysis</li>
                  <li>Capacity planning projections</li>
                  <li>Migration recommendations</li>
                  <li>Hardware replacement roadmap</li>
                </ul>
              </div>
            </DialogBody>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={generateReport}>
                Generate Report
              </Button>
            </DialogActions>
          </DialogContent>
        </DialogSurface>
      </Dialog>
    </div>
  );
};