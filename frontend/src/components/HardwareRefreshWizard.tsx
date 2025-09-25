import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Badge,
  ProgressBar,
  Input,
  Field,
  Slider,
  Checkbox,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
  shorthands,
} from '@fluentui/react-components';
import {
  ArrowUpload24Regular,
  Database24Regular,
  Settings24Regular,
  Play24Regular,
  DocumentText24Regular,
  CheckmarkCircle24Regular,
  Warning24Regular,
  Server24Regular,
  ChevronRight24Regular,
  ChevronLeft24Regular,
} from '@fluentui/react-icons';

// VisX imports for data visualization
import { Group } from '@visx/group';
import { Bar } from '@visx/shape';
import { scaleLinear, scaleBand } from '@visx/scale';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Text as VisxText } from '@visx/text';
import { Pie } from '@visx/shape';
import { ParentSize } from '@visx/responsive';

interface RVToolsFile {
  id: string;
  name: string;
  uploadDate: string;
  totalVMs: number;
  totalHosts: number;
  totalClusters: number;
  status: 'processed' | 'processing' | 'failed';
}

interface ClusterData {
  name: string;
  hostCount: number;
  vmCount: number;
  totalCores: number;
  totalMemoryGB: number;
  utilizationCPU: number;
  utilizationMemory: number;
  eolHostCount: number;
  servers: Array<{
    hostname: string;
    model: string;
    cores: number;
    memoryGB: number;
    eolStatus: 'Current' | 'Near EOL' | 'EOL';
    eolDate?: string;
  }>;
}

interface OvercommitRatios {
  cpu: number;
  memory: number;
}

interface HardwareRefreshWizardProps {
  isOpen: boolean;
  onClose: () => void;
  activityId: string;
  projectId: string;
  onComplete: (results: any) => void;
}

interface LifecycleResults {
  totalHostsAnalyzed: number;
  eolHosts: number;
  nearEolHosts: number;
  recommendedReplacements: Array<{
    cluster: string;
    currentHosts: number;
    eolHosts: number;
    recommendedModel: string;
    estimatedCost: number;
  }>;
  migrationTimeline: Array<{
    phase: string;
    startDate: string;
    endDate: string;
    clusters: string[];
    priority: 'High' | 'Medium' | 'Low';
  }>;
}

const useWizardStyles = makeStyles({
  dialogContainer: {
    minWidth: '1000px',
    minHeight: '700px',
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stepContent: {
    minHeight: '400px',
    padding: tokens.spacingVerticalL,
  },
  clusterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalL,
  },
  clusterCard: {
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      borderColor: tokens.colorBrandStroke1,
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
    '&.selected': {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  serverList: {
    maxHeight: '200px',
    overflowY: 'auto',
    marginTop: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  ratioControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  chartContainer: {
    background: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.padding(tokens.spacingVerticalL),
    marginBottom: tokens.spacingVerticalL,
  },
  resultsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: tokens.spacingVerticalXL,
  },
});

// VisX Chart Components
const ClusterMetricsChart: React.FC<{ data: ClusterData[] }> = ({ data }) => {
  const width = 400;
  const height = 250;
  const margin = { top: 20, bottom: 50, left: 80, right: 20 };
  
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  
  const xScale = scaleBand({
    range: [0, xMax],
    domain: data.map(d => d.name),
    padding: 0.3,
  });
  
  const yScale = scaleLinear({
    range: [yMax, 0],
    domain: [0, Math.max(...data.map(d => Math.max(d.utilizationCPU, d.utilizationMemory)))],
  });
  
  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        <GridRows scale={yScale} width={xMax} strokeDasharray="3,3" />
        <GridColumns scale={xScale} height={yMax} strokeDasharray="3,3" />
        
        {data.map((d, i) => (
          <Group key={d.name}>
            <Bar
              x={xScale(d.name)! + 2}
              y={yScale(d.utilizationCPU)}
              width={(xScale.bandwidth() - 4) / 2}
              height={yMax - yScale(d.utilizationCPU)}
              fill={tokens.colorBrandBackground}
              opacity={0.8}
            />
            <Bar
              x={xScale(d.name)! + (xScale.bandwidth() / 2) + 2}
              y={yScale(d.utilizationMemory)}
              width={(xScale.bandwidth() - 4) / 2}
              height={yMax - yScale(d.utilizationMemory)}
              fill={tokens.colorBrandBackground2}
              opacity={0.8}
            />
          </Group>
        ))}
        
        <AxisLeft scale={yScale} />
        <AxisBottom scale={xScale} top={yMax} />
        
        <VisxText x={xMax / 2} y={height - 10} textAnchor="middle" fontSize={12}>
          Clusters
        </VisxText>
        <VisxText x={-40} y={yMax / 2} textAnchor="middle" fontSize={12} angle={-90}>
          Utilization %
        </VisxText>
      </Group>
    </svg>
  );
};

const EOLStatusPieChart: React.FC<{ data: { current: number; nearEol: number; eol: number } }> = ({ data }) => {
  const width = 200;
  const height = 200;
  const radius = Math.min(width, height) / 2;
  
  const pieData = [
    { label: 'Current', value: data.current, color: tokens.colorPaletteGreenForeground1 },
    { label: 'Near EOL', value: data.nearEol, color: tokens.colorPaletteYellowForeground2 },
    { label: 'EOL', value: data.eol, color: tokens.colorPaletteRedForeground1 },
  ].filter(d => d.value > 0);
  
  return (
    <svg width={width} height={height}>
      <Group left={width / 2} top={height / 2}>
        <Pie
          data={pieData}
          pieValue={(d) => d.value}
          outerRadius={radius * 0.8}
          innerRadius={radius * 0.4}
        >
          {(pie) => {
            return pie.arcs.map((arc, i) => {
              const { data } = arc;
              return (
                <g key={i}>
                  <path d={pie.path(arc)!} fill={data.color} />
                  <VisxText
                    x={pie.path.centroid(arc)[0]}
                    y={pie.path.centroid(arc)[1]}
                    textAnchor="middle"
                    fontSize={10}
                    fill="white"
                    fontWeight="bold"
                  >
                    {data.value}
                  </VisxText>
                </g>
              );
            });
          }}
        </Pie>
      </Group>
    </svg>
  );
};

export const HardwareRefreshWizard: React.FC<HardwareRefreshWizardProps> = ({
  isOpen,
  onClose,
  activityId,
  projectId,
  onComplete,
}) => {
  const styles = useWizardStyles();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<RVToolsFile | null>(null);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [overcommitRatios, setOvercommitRatios] = useState<OvercommitRatios>({ cpu: 3, memory: 1.5 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<LifecycleResults | null>(null);
  
  // Mock data
  const [availableFiles] = useState<RVToolsFile[]>([
    {
      id: 'rv-001',
      name: 'Merged RVtool report Prod IT & Tooling.xlsx',
      uploadDate: '2025-09-22',
      totalVMs: 789,
      totalHosts: 74,
      totalClusters: 13,
      status: 'processed',
    },
  ]);
  
  const [clusterData] = useState<ClusterData[]>([
    {
      name: 'PLBYDCL01',
      hostCount: 3,
      vmCount: 97,
      totalCores: 120,
      totalMemoryGB: 1536,
      utilizationCPU: 65,
      utilizationMemory: 72,
      eolHostCount: 2,
      servers: [
        { hostname: 'plbylesx1.plbyd.pl.int', model: 'ProLiant DL380 Gen9', cores: 40, memoryGB: 512, eolStatus: 'Near EOL', eolDate: '2025-03-31' },
        { hostname: 'plbylesx2.plbyd.pl.int', model: 'ProLiant DL380 Gen9', cores: 40, memoryGB: 512, eolStatus: 'Near EOL', eolDate: '2025-03-31' },
        { hostname: 'plbylesx3.plbyd.pl.int', model: 'ProLiant DL380 Gen10', cores: 40, memoryGB: 512, eolStatus: 'Current' },
      ],
    },
    {
      name: 'ASNCLUBA0001',
      hostCount: 4,
      vmCount: 43,
      totalCores: 96,
      totalMemoryGB: 1024,
      utilizationCPU: 78,
      utilizationMemory: 82,
      eolHostCount: 1,
      servers: [
        { hostname: 'asnhost01.asn.int', model: 'ProLiant BL460c Gen9', cores: 32, memoryGB: 256, eolStatus: 'Near EOL', eolDate: '2025-03-31' },
        { hostname: 'asnhost02.asn.int', model: 'ProLiant BL460c Gen10', cores: 32, memoryGB: 256, eolStatus: 'Current' },
        { hostname: 'asnhost03.asn.int', model: 'ProLiant BL460c Gen10', cores: 32, memoryGB: 256, eolStatus: 'Current' },
        { hostname: 'asnhost04.asn.int', model: 'ProLiant BL460c Gen10', cores: 32, memoryGB: 256, eolStatus: 'Current' },
      ],
    },
  ]);

  const steps = [
    { number: 1, title: 'Select RVTools Data', icon: <ArrowUpload24Regular /> },
    { number: 2, title: 'Choose Clusters', icon: <Database24Regular /> },
    { number: 3, title: 'Configure Ratios', icon: <Settings24Regular /> },
    { number: 4, title: 'Run Analysis', icon: <Play24Regular /> },
    { number: 5, title: 'Review Results', icon: <DocumentText24Regular /> },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile || selectedClusters.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const mockResults: LifecycleResults = {
        totalHostsAnalyzed: selectedClusters.reduce((sum, clusterName) => {
          const cluster = clusterData.find(c => c.name === clusterName);
          return sum + (cluster?.hostCount || 0);
        }, 0),
        eolHosts: selectedClusters.reduce((sum, clusterName) => {
          const cluster = clusterData.find(c => c.name === clusterName);
          return sum + (cluster?.eolHostCount || 0);
        }, 0),
        nearEolHosts: selectedClusters.reduce((sum, clusterName) => {
          const cluster = clusterData.find(c => c.name === clusterName);
          return sum + (cluster?.servers.filter(s => s.eolStatus === 'Near EOL').length || 0);
        }, 0),
        recommendedReplacements: selectedClusters.map(clusterName => {
          const cluster = clusterData.find(c => c.name === clusterName)!;
          return {
            cluster: clusterName,
            currentHosts: cluster.hostCount,
            eolHosts: cluster.eolHostCount,
            recommendedModel: clusterName.includes('PLBYD') ? 'ProLiant DL380 Gen11' : 'ProLiant BL460c Gen11',
            estimatedCost: cluster.eolHostCount * 15000,
          };
        }),
        migrationTimeline: [
          {
            phase: 'Phase 1: Critical EOL Replacement',
            startDate: '2025-10-01',
            endDate: '2025-12-31',
            clusters: selectedClusters.filter(c => clusterData.find(cd => cd.name === c)?.eolHostCount! > 0),
            priority: 'High',
          },
        ],
      };
      
      setAnalysisResults(mockResults);
      setIsAnalyzing(false);
      setCurrentStep(5);
    }, 3000);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedFile !== null;
      case 2: return selectedClusters.length > 0;
      case 3: return true;
      case 4: return analysisResults !== null;
      case 5: return true;
      default: return false;
    }
  };

  const eolSummary = useMemo(() => {
    const allServers = selectedClusters.flatMap(clusterName => 
      clusterData.find(c => c.name === clusterName)?.servers || []
    );
    
    return {
      current: allServers.filter(s => s.eolStatus === 'Current').length,
      nearEol: allServers.filter(s => s.eolStatus === 'Near EOL').length,
      eol: allServers.filter(s => s.eolStatus === 'EOL').length,
    };
  }, [selectedClusters, clusterData]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // Select RVTools Data
        return (
          <div>
            <Title3>Select RVTools Export File</Title3>
            <Body2 style={{ marginBottom: tokens.spacingVerticalL }}>
              Choose a processed RVTools file to analyze for hardware lifecycle planning.
            </Body2>
            
            {availableFiles.map(file => (
              <Card
                key={file.id}
                className={`${styles.clusterCard} ${selectedFile?.id === file.id ? 'selected' : ''}`}
                onClick={() => setSelectedFile(file)}
                style={{ marginBottom: tokens.spacingVerticalM }}
              >
                <CardHeader
                  header={<Text weight="semibold">{file.name}</Text>}
                  description={`Uploaded: ${file.uploadDate}`}
                  action={
                    <Badge
                      appearance="filled"
                      color={file.status === 'processed' ? 'success' : 'warning'}
                    >
                      {file.status}
                    </Badge>
                  }
                />
                <CardPreview>
                  <div style={{ display: 'flex', gap: tokens.spacingHorizontalL }}>
                    <div>
                      <Caption1>VMs</Caption1>
                      <Text weight="semibold">{file.totalVMs}</Text>
                    </div>
                    <div>
                      <Caption1>Hosts</Caption1>
                      <Text weight="semibold">{file.totalHosts}</Text>
                    </div>
                    <div>
                      <Caption1>Clusters</Caption1>
                      <Text weight="semibold">{file.totalClusters}</Text>
                    </div>
                  </div>
                </CardPreview>
              </Card>
            ))}
          </div>
        );

      case 2: // Choose Clusters
        return (
          <div>
            <Title3>Select Clusters for Analysis</Title3>
            <Body2 style={{ marginBottom: tokens.spacingVerticalL }}>
              Choose which clusters you want to include in the hardware refresh analysis.
            </Body2>
            
            <div className={styles.chartContainer}>
              <Caption1 style={{ marginBottom: tokens.spacingVerticalM }}>Cluster Utilization Overview</Caption1>
              <ClusterMetricsChart data={clusterData} />
            </div>
            
            <div className={styles.clusterGrid}>
              {clusterData.map(cluster => (
                <Card
                  key={cluster.name}
                  className={`${styles.clusterCard} ${selectedClusters.includes(cluster.name) ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedClusters(prev => 
                      prev.includes(cluster.name) 
                        ? prev.filter(c => c !== cluster.name)
                        : [...prev, cluster.name]
                    );
                  }}
                >
                  <CardHeader
                    header={
                      <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                        <Checkbox
                          checked={selectedClusters.includes(cluster.name)}
                          onChange={() => {}}
                        />
                        <Text weight="semibold">{cluster.name}</Text>
                      </div>
                    }
                    action={
                      cluster.eolHostCount > 0 && (
                        <Badge appearance="filled" color="warning">
                          {cluster.eolHostCount} EOL hosts
                        </Badge>
                      )
                    }
                  />
                  <CardPreview>
                    <div style={{ display: 'flex', gap: tokens.spacingHorizontalL, marginBottom: tokens.spacingVerticalM }}>
                      <div>
                        <Caption1>Hosts</Caption1>
                        <Text weight="semibold">{cluster.hostCount}</Text>
                      </div>
                      <div>
                        <Caption1>VMs</Caption1>
                        <Text weight="semibold">{cluster.vmCount}</Text>
                      </div>
                      <div>
                        <Caption1>CPU Usage</Caption1>
                        <Text>{cluster.utilizationCPU}%</Text>
                      </div>
                      <div>
                        <Caption1>Memory Usage</Caption1>
                        <Text>{cluster.utilizationMemory}%</Text>
                      </div>
                    </div>
                    
                    <div className={styles.serverList}>
                      <Caption1 style={{ marginBottom: tokens.spacingVerticalS }}>Servers:</Caption1>
                      {cluster.servers.map(server => (
                        <div key={server.hostname} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: tokens.spacingVerticalXS 
                        }}>
                          <div>
                            <Text style={{ fontSize: '12px' }}>{server.hostname}</Text>
                            <Caption1>{server.model}</Caption1>
                          </div>
                          <Badge
                            size="small"
                            appearance="outline"
                            color={
                              server.eolStatus === 'EOL' ? 'danger' :
                              server.eolStatus === 'Near EOL' ? 'warning' : 'success'
                            }
                          >
                            {server.eolStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardPreview>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3: // Configure Ratios
        return (
          <div>
            <Title3>Configure Overcommit Ratios</Title3>
            <Body2 style={{ marginBottom: tokens.spacingVerticalL }}>
              Set the vCPU to pCPU and vMemory to pMemory ratios for capacity planning.
            </Body2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalXXL }}>
              <div className={styles.ratioControl}>
                <Field label="vCPU to pCPU Ratio">
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                    <Slider
                      value={overcommitRatios.cpu}
                      min={1}
                      max={8}
                      step={0.5}
                      onChange={(_, data) => setOvercommitRatios(prev => ({ ...prev, cpu: data.value }))}
                      style={{ flex: 1 }}
                    />
                    <Text weight="semibold">{overcommitRatios.cpu}:1</Text>
                  </div>
                  <Caption1>Higher ratios allow more VMs per physical core but may impact performance</Caption1>
                </Field>
                
                <Field label="vMemory to pMemory Ratio">
                  <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalM }}>
                    <Slider
                      value={overcommitRatios.memory}
                      min={1}
                      max={4}
                      step={0.1}
                      onChange={(_, data) => setOvercommitRatios(prev => ({ ...prev, memory: data.value }))}
                      style={{ flex: 1 }}
                    />
                    <Text weight="semibold">{overcommitRatios.memory.toFixed(1)}:1</Text>
                  </div>
                  <Caption1>Memory overcommit relies on memory compression and ballooning</Caption1>
                </Field>
              </div>
              
              <div>
                <Caption1>EOL Status Distribution</Caption1>
                <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalL }}>
                  <EOLStatusPieChart data={eolSummary} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalS }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteGreenForeground1, borderRadius: '2px' }} />
                      <Text>Current: {eolSummary.current}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalS }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteYellowForeground2, borderRadius: '2px' }} />
                      <Text>Near EOL: {eolSummary.nearEol}</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: tokens.colorPaletteRedForeground1, borderRadius: '2px' }} />
                      <Text>EOL: {eolSummary.eol}</Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4: // Run Analysis
        return (
          <div style={{ textAlign: 'center' }}>
            <Title3>Execute Hardware Lifecycle Analysis</Title3>
            <Body2 style={{ marginBottom: tokens.spacingVerticalXL }}>
              Ready to analyze {selectedClusters.length} clusters with {overcommitRatios.cpu}:1 CPU and {overcommitRatios.memory.toFixed(1)}:1 memory ratios.
            </Body2>
            
            {isAnalyzing ? (
              <div>
                <Spinner size="extra-large" style={{ marginBottom: tokens.spacingVerticalL }} />
                <Text>Analyzing hardware lifecycle data...</Text>
                <ProgressBar style={{ marginTop: tokens.spacingVerticalM, maxWidth: '400px', margin: '0 auto' }} />
              </div>
            ) : analysisResults ? (
              <div>
                <CheckmarkCircle24Regular style={{ fontSize: '64px', color: tokens.colorPaletteGreenForeground1, marginBottom: tokens.spacingVerticalL }} />
                <Text>Analysis completed successfully!</Text>
                <div style={{ marginTop: tokens.spacingVerticalL }}>
                  <Button appearance="primary" onClick={() => setCurrentStep(5)}>
                    View Results
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Play24Regular style={{ fontSize: '64px', color: tokens.colorBrandForeground1, marginBottom: tokens.spacingVerticalL }} />
                <Button appearance="primary" size="large" onClick={runAnalysis}>
                  Start Analysis
                </Button>
              </div>
            )}
          </div>
        );

      case 5: // Review Results
        return (
          <div>
            <Title3>Hardware Refresh Analysis Results</Title3>
            <Body2 style={{ marginBottom: tokens.spacingVerticalL }}>
              Review the analysis results and recommendations for your hardware refresh project.
            </Body2>
            
            {analysisResults && (
              <div className={styles.resultsGrid}>
                <Card>
                  <CardHeader header={<Text weight="semibold">Analysis Summary</Text>} />
                  <CardPreview>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Caption1>Total Hosts Analyzed:</Caption1>
                        <Text weight="semibold">{analysisResults.totalHostsAnalyzed}</Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Caption1>EOL Hosts:</Caption1>
                        <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground1 }}>
                          {analysisResults.eolHosts}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Caption1>Near EOL Hosts:</Caption1>
                        <Text weight="semibold" style={{ color: tokens.colorPaletteYellowForeground2 }}>
                          {analysisResults.nearEolHosts}
                        </Text>
                      </div>
                    </div>
                  </CardPreview>
                </Card>

                <Card>
                  <CardHeader header={<Text weight="semibold">Replacement Recommendations</Text>} />
                  <CardPreview>
                    {analysisResults.recommendedReplacements.map(rec => (
                      <div key={rec.cluster} style={{ 
                        marginBottom: tokens.spacingVerticalM,
                        paddingBottom: tokens.spacingVerticalM,
                        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
                      }}>
                        <Text weight="semibold">{rec.cluster}</Text>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: tokens.spacingVerticalXS }}>
                          <Caption1>Replace {rec.eolHosts} of {rec.currentHosts} hosts</Caption1>
                          <Caption1>Est. ${rec.estimatedCost.toLocaleString()}</Caption1>
                        </div>
                        <Caption1 style={{ color: tokens.colorBrandForeground1 }}>
                          → {rec.recommendedModel}
                        </Caption1>
                      </div>
                    ))}
                  </CardPreview>
                </Card>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogContainer}>
        <DialogBody>
          <DialogTitle>Hardware Refresh Activity Setup</DialogTitle>
          <DialogContent>
            {/* Step Progress */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: tokens.spacingVerticalXL,
              paddingBottom: tokens.spacingVerticalL,
              borderBottom: `2px solid ${tokens.colorNeutralStroke2}`
            }}>
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: currentStep >= step.number ? 1 : 0.5,
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: currentStep >= step.number ? tokens.colorBrandBackground : tokens.colorNeutralBackground3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: tokens.spacingVerticalS,
                  }}>
                    {currentStep > step.number ? (
                      <CheckmarkCircle24Regular style={{ color: 'white' }} />
                    ) : (
                      React.cloneElement(step.icon, { 
                        style: { color: currentStep >= step.number ? 'white' : tokens.colorNeutralForeground3 } 
                      })
                    )}
                  </div>
                  <Caption1>{step.title}</Caption1>
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className={styles.stepContent}>
              {renderStepContent()}
            </div>
          </DialogContent>
          
          <DialogActions className={styles.actionButtons}>
            <div>
              <Button 
                appearance="secondary" 
                icon={<ChevronLeft24Regular />}
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
            </div>
            
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalM }}>
              <Button appearance="secondary" onClick={onClose}>
                Cancel
              </Button>
              
              {currentStep === 5 ? (
                <Button 
                  appearance="primary" 
                  onClick={() => {
                    onComplete(analysisResults);
                    onClose();
                  }}
                >
                  Complete Setup
                </Button>
              ) : (
                <Button 
                  appearance="primary"
                  icon={<ChevronRight24Regular />}
                  iconPosition="after"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              )}
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};