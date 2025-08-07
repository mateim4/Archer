import React, { useState, useEffect } from 'react';
import { Calculator, Cpu, HardDrive, Network, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient, HardwareItem } from '../utils/apiClient';
import GlassmorphicLayout from '../components/GlassmorphicLayout';

interface ClusterSpec {
  workloadType: string;
  expectedVMs: number;
  avgCpuPerVM: number;
  avgMemoryPerVM: number; // GB
  avgStoragePerVM: number; // GB
  redundancyFactor: number;
  oversubscriptionRatio: number;
}

interface SizingResult {
  requiredHosts: number;
  totalCpu: number;
  totalMemory: number;
  totalStorage: number;
  recommendedHardware: HardwareItem[];
  utilizationPercentage: number;
}

const ClusterSizingView: React.FC = () => {
  const [availableHardware, setAvailableHardware] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterSpec, setClusterSpec] = useState<ClusterSpec>({
    workloadType: 'general',
    expectedVMs: 50,
    avgCpuPerVM: 2,
    avgMemoryPerVM: 4,
    avgStoragePerVM: 100,
    redundancyFactor: 1.2,
    oversubscriptionRatio: 1.5
  });
  const [sizingResult, setSizingResult] = useState<SizingResult | null>(null);

  // For demo purposes, using hardcoded project ID
  const currentProjectId = 'project:demo';

  const loadHardware = async () => {
    try {
      setLoading(true);
      const hardwareData = await apiClient.getHardware(currentProjectId);
      setAvailableHardware(hardwareData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hardware');
    } finally {
      setLoading(false);
    }
  };

  const calculateSizing = () => {
    // Calculate total resource requirements
    const totalCpuNeeded = clusterSpec.expectedVMs * clusterSpec.avgCpuPerVM * clusterSpec.redundancyFactor;
    const totalMemoryNeeded = clusterSpec.expectedVMs * clusterSpec.avgMemoryPerVM * clusterSpec.redundancyFactor;
    const totalStorageNeeded = clusterSpec.expectedVMs * clusterSpec.avgStoragePerVM;

    // Simple sizing algorithm - in a real app this would be more sophisticated
    let selectedHardware: HardwareItem[] = [];
    let totalCpuAvailable = 0;
    let totalMemoryAvailable = 0;
    let hostCount = 0;

    // Sort hardware by best performance/price ratio (simplified)
    const sortedHardware = [...availableHardware].sort((a, b) => {
      const aScore = parseInt(a.specs.cpu?.split(' ')[0] || '0') + parseInt(a.specs.memory?.replace('GB', '') || '0');
      const bScore = parseInt(b.specs.cpu?.split(' ')[0] || '0') + parseInt(b.specs.memory?.replace('GB', '') || '0');
      return bScore - aScore;
    });

    // Select hardware until requirements are met
    for (const hardware of sortedHardware) {
      const cpuCores = parseInt(hardware.specs.cpu?.split(' ')[0] || '8') * clusterSpec.oversubscriptionRatio;
      const memoryGB = parseInt(hardware.specs.memory?.replace('GB', '') || '32');
      
      selectedHardware.push(hardware);
      totalCpuAvailable += cpuCores;
      totalMemoryAvailable += memoryGB;
      hostCount++;

      if (totalCpuAvailable >= totalCpuNeeded && totalMemoryAvailable >= totalMemoryNeeded) {
        break;
      }
    }

    const utilizationPercentage = Math.min(
      (totalCpuNeeded / totalCpuAvailable) * 100,
      (totalMemoryNeeded / totalMemoryAvailable) * 100
    );

    setSizingResult({
      requiredHosts: hostCount,
      totalCpu: Math.ceil(totalCpuNeeded),
      totalMemory: Math.ceil(totalMemoryNeeded),
      totalStorage: Math.ceil(totalStorageNeeded),
      recommendedHardware: selectedHardware,
      utilizationPercentage: utilizationPercentage || 0
    });
  };

  useEffect(() => {
    loadHardware();
  }, []);

  useEffect(() => {
    if (availableHardware.length > 0) {
      calculateSizing();
    }
  }, [clusterSpec, availableHardware]);

  const getWorkloadIcon = (workloadType: string) => {
    switch (workloadType) {
      case 'compute':
        return <Cpu className="w-5 h-5" />;
      case 'storage':
        return <HardDrive className="w-5 h-5" />;
      case 'network':
        return <Network className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <GlassmorphicLayout>
        <div className="fluent-page-container">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </div>
      </GlassmorphicLayout>
    );
  }

  return (
    <GlassmorphicLayout>
      <div className="fluent-page-container">

        {error && (
          <div className="fluent-alert fluent-alert-error mb-6">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="lcm-card">
            <h2 className="fluent-card-title flex items-center mb-4">
              <Calculator className="w-5 h-5 mr-2" />
              Workload Requirements
            </h2>
            <div className="space-y-4">
              <div className="fluent-form-group">
                <label className="fluent-label">Workload Type</label>
                <select
                  value={clusterSpec.workloadType}
                  onChange={(e) => setClusterSpec({ ...clusterSpec, workloadType: e.target.value })}
                  className="lcm-dropdown"
                >
                  <option value="general">General Purpose</option>
                  <option value="compute">Compute Intensive</option>
                  <option value="storage">Storage Intensive</option>
                  <option value="network">Network Intensive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="fluent-form-group">
                  <label className="fluent-label">Expected VMs</label>
                  <input
                    type="number"
                    value={clusterSpec.expectedVMs}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, expectedVMs: parseInt(e.target.value) || 0 })}
                    className="lcm-input"
                  />
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">CPU per VM</label>
                  <input
                    type="number"
                    value={clusterSpec.avgCpuPerVM}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, avgCpuPerVM: parseInt(e.target.value) || 0 })}
                    className="lcm-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="fluent-form-group">
                  <label className="fluent-label">Memory per VM (GB)</label>
                  <input
                    type="number"
                    value={clusterSpec.avgMemoryPerVM}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, avgMemoryPerVM: parseInt(e.target.value) || 0 })}
                    className="lcm-input"
                  />
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">Storage per VM (GB)</label>
                  <input
                    type="number"
                    value={clusterSpec.avgStoragePerVM}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, avgStoragePerVM: parseInt(e.target.value) || 0 })}
                    className="lcm-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="fluent-form-group">
                  <label className="fluent-label">Redundancy Factor</label>
                  <input
                    type="number"
                    step="0.1"
                    value={clusterSpec.redundancyFactor}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, redundancyFactor: parseFloat(e.target.value) || 1 })}
                    className="lcm-input"
                  />
                </div>
                <div className="fluent-form-group">
                  <label className="fluent-label">Oversubscription Ratio</label>
                  <input
                    type="number"
                    step="0.1"
                    value={clusterSpec.oversubscriptionRatio}
                    onChange={(e) => setClusterSpec({ ...clusterSpec, oversubscriptionRatio: parseFloat(e.target.value) || 1 })}
                    className="lcm-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {sizingResult && (
            <>
              <div className="p-4 rounded-lg border border-purple-500/20">
                <h2 className="fluent-card-title flex items-center mb-4">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Sizing Results
                </h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600">{sizingResult.requiredHosts}</div>
                    <div className="text-sm text-gray-600">Required Hosts</div>
                  </div>
                  <div className="text-center p-4 rounded-lg border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600">{sizingResult.utilizationPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Utilization</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-sm text-gray-600">
                      <Cpu className="w-4 h-4 mr-2" />
                      Total CPU Cores
                    </span>
                    <span className="font-medium">{sizingResult.totalCpu}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-sm text-gray-600">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Total Memory
                    </span>
                    <span className="font-medium">{sizingResult.totalMemory} GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center text-sm text-gray-600">
                      <HardDrive className="w-4 h-4 mr-2" />
                      Total Storage
                    </span>
                    <span className="font-medium">{sizingResult.totalStorage} GB</span>
                  </div>
                </div>

                {sizingResult.utilizationPercentage > 90 && (
                  <div className="mt-4 p-3 border border-amber-200 rounded-lg">
                    <div className="flex items-center text-amber-800">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm">High utilization detected. Consider adding more hosts for better performance.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg border border-purple-500/20">
                <h3 className="fluent-card-title mb-4">Recommended Hardware</h3>
                <div className="space-y-3">
                  {sizingResult.recommendedHardware.map((hardware, index) => (
                    <div key={hardware.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-500/20">
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg mr-3 border border-purple-500/20">
                          {getWorkloadIcon(clusterSpec.workloadType)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{hardware.name}</div>
                          <div className="text-sm text-gray-600">{hardware.vendor} {hardware.model}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Host {index + 1}</div>
                        <div className="text-xs text-gray-600">{hardware.specs.cpu} | {hardware.specs.memory}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {availableHardware.length === 0 && (
            <div className="fluent-empty-state">
              <div className="fluent-empty-state-icon">
                <AlertCircle className="w-12 h-12" />
              </div>
              <h3 className="fluent-empty-state-title">No Hardware Available</h3>
              <p className="fluent-empty-state-description">Add hardware items to the hardware pool to enable cluster sizing calculations.</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </GlassmorphicLayout>
  );
};

export default ClusterSizingView;
