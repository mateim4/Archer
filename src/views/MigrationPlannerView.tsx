import React, { useState } from 'react';
import { ChevronRight, CheckCircle, Server, Target } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

const MigrationPlannerView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  // Mock cluster data for scope selection
  const mockClusterData = [
    { 
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234,
      description: 'Primary production workloads',
      compatibility: 95
    },
    { 
      name: 'Production Cluster 2', 
      hosts: 6, 
      vms: 189,
      description: 'Secondary production workloads',
      compatibility: 98
    },
    { 
      name: 'Dev/Test Cluster', 
      hosts: 4, 
      vms: 156,
      description: 'Development and testing environment',
      compatibility: 100
    }
  ];

  // Wizard Step Component
  const WizardStep = ({ stepNumber, title, isActive, isCompleted }: any) => (
    <div className="flex items-center transition-all duration-200">
      <div 
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-all duration-200 ${
          isActive ? 'border-blue-600 bg-blue-50 text-blue-600' : 
          isCompleted ? 'border-green-600 bg-green-50 text-green-600' : 'border-gray-300 text-gray-400'
        }`}
        style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-caption)',
          fontWeight: 'var(--font-weight-medium)'
        }}
      >
        {isCompleted ? <CheckCircle size={16} /> : stepNumber}
      </div>
      <span 
        className={`ml-3 font-medium transition-colors duration-200 ${
          isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
        }`}
        style={{
          fontFamily: 'var(--font-family)',
          fontSize: 'var(--font-size-body)',
          fontWeight: 'var(--font-weight-medium)'
        }}
      >
        {title}
      </span>
    </div>
  );

  const wizardSteps = [
    { num: 1, title: 'Scope Selection', description: 'Choose clusters and VMs for migration' },
    { num: 2, title: 'Target Platform', description: 'Select destination platform' },
    { num: 3, title: 'Translation Rules', description: 'Configure migration mapping rules' },
    { num: 4, title: 'Hardware Sizing', description: 'Size target infrastructure' },
    { num: 5, title: 'Migration Plan', description: 'Generate migration plan and documentation' }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <div className="flex items-center mb-4">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: 'var(--font-size-subtitle1)',
                  color: 'var(--color-neutral-foreground)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Select Migration Scope
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Migration Compatibility Analysis
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        The system analyzes each cluster for migration compatibility:
                        <ul className="mt-2 space-y-1">
                          <li>• Guest OS compatibility with Hyper-V</li>
                          <li>• VMware Tools to Integration Services mapping</li>
                          <li>• Hardware acceleration features</li>
                          <li>• Network and storage dependencies</li>
                          <li>• Application-specific requirements</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              {mockClusterData.map((cluster, index) => (
                <label 
                  key={index} 
                  className="flex items-center p-4 border rounded-lg hover:bg-gray-50/50 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: 'var(--color-neutral-stroke)',
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  <input type="checkbox" className="mr-4 accent-blue-600" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div 
                          className="font-medium"
                          style={{ 
                            fontSize: 'var(--font-size-body)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-neutral-foreground)'
                          }}
                        >
                          {cluster.name}
                        </div>
                        <div 
                          style={{ 
                            fontSize: 'var(--font-size-body)',
                            color: 'var(--color-neutral-foreground-secondary)'
                          }}
                        >
                          {cluster.hosts} hosts, {cluster.vms} VMs - {cluster.description}
                        </div>
                      </div>
                      <div className="text-right">
                        <div 
                          className={`text-sm font-medium ${
                            cluster.compatibility > 95 ? 'text-green-600' :
                            cluster.compatibility > 90 ? 'text-yellow-600' : 'text-red-600'
                          }`}
                        >
                          {cluster.compatibility}% Compatible
                        </div>
                        <div 
                          className="text-xs"
                          style={{ color: 'var(--color-neutral-foreground-tertiary)' }}
                        >
                          Migration Ready
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: 'var(--font-size-subtitle1)',
                  color: 'var(--color-neutral-foreground)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Select Target Platform
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Platform Translation Engine
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Each platform has different capabilities and requirements:
                        <br /><br />
                        <strong>Hyper-V:</strong> Traditional on-premises virtualization with Windows Admin Center management
                        <br /><br />
                        <strong>Azure Local:</strong> Hybrid cloud infrastructure with Azure Arc integration and cloud services
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <label 
                className={`flex flex-col items-center p-8 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                  selectedPlatform === 'hyperv' ? 'border-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  borderColor: selectedPlatform === 'hyperv' ? 'var(--color-brand-primary)' : 'var(--color-neutral-stroke-secondary)',
                  borderRadius: 'var(--border-radius-xl)',
                  background: selectedPlatform === 'hyperv' ? 'var(--color-brand-background)' : 'var(--color-neutral-background-tertiary)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)'
                }}
                onMouseEnter={(e) => {
                  if (selectedPlatform !== 'hyperv') {
                    e.currentTarget.style.borderColor = 'rgba(15, 108, 189, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlatform !== 'hyperv') {
                    e.currentTarget.style.borderColor = 'var(--color-neutral-stroke-secondary)';
                    e.currentTarget.style.background = 'var(--color-neutral-background-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <input 
                  type="radio" 
                  name="platform" 
                  value="hyperv"
                  className="mb-4 accent-blue-600" 
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                />
                <div 
                  className="p-3 rounded-lg mb-4 group-hover:scale-105 transition-transform duration-200"
                  style={{
                    background: 'rgba(15, 108, 189, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid rgba(15, 108, 189, 0.2)`,
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  <Server size={32} color="var(--color-brand-primary)" />
                </div>
                <span 
                  className="font-medium mb-2"
                  style={{ 
                    fontSize: 'var(--font-size-subtitle2)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  On-Premises Hyper-V
                </span>
                <span 
                  className="text-center"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Traditional Hyper-V cluster deployment with failover clustering
                </span>
              </label>
              
              <label 
                className={`flex flex-col items-center p-8 border-2 rounded-xl cursor-pointer transition-all duration-200 group ${
                  selectedPlatform === 'azurelocal' ? 'border-blue-500 bg-blue-50' : ''
                }`}
                style={{
                  borderColor: selectedPlatform === 'azurelocal' ? 'var(--color-brand-primary)' : 'var(--color-neutral-stroke-secondary)',
                  borderRadius: 'var(--border-radius-xl)',
                  background: selectedPlatform === 'azurelocal' ? 'var(--color-brand-background)' : 'var(--color-neutral-background-tertiary)',
                  backdropFilter: 'blur(20px) saturate(120%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(120%)'
                }}
                onMouseEnter={(e) => {
                  if (selectedPlatform !== 'azurelocal') {
                    e.currentTarget.style.borderColor = 'rgba(15, 108, 189, 0.4)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlatform !== 'azurelocal') {
                    e.currentTarget.style.borderColor = 'var(--color-neutral-stroke-secondary)';
                    e.currentTarget.style.background = 'var(--color-neutral-background-tertiary)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <input 
                  type="radio" 
                  name="platform" 
                  value="azurelocal"
                  className="mb-4 accent-blue-600" 
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                />
                <div 
                  className="p-3 rounded-lg mb-4 group-hover:scale-105 transition-transform duration-200"
                  style={{
                    background: 'rgba(15, 108, 189, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid rgba(15, 108, 189, 0.2)`,
                    borderRadius: 'var(--border-radius-lg)'
                  }}
                >
                  <Target size={32} color="var(--color-brand-primary)" />
                </div>
                <span 
                  className="font-medium mb-2"
                  style={{ 
                    fontSize: 'var(--font-size-subtitle2)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Azure Local
                </span>
                <span 
                  className="text-center"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Hybrid cloud infrastructure with Azure Arc integration
                </span>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <div className="flex items-center mb-6">
              <h3 
                className="font-medium"
                style={{ 
                  fontSize: 'var(--font-size-subtitle1)',
                  color: 'var(--color-neutral-foreground)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Configure Translation Rules
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        VMware to Microsoft Translation Matrix
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Translation rules map VMware constructs to Microsoft equivalents:
                        <ul className="mt-2 space-y-1">
                          <li>• vSphere VLANs → Hyper-V Virtual Switches</li>
                          <li>• VMFS Datastores → Cluster Shared Volumes</li>
                          <li>• DRS Rules → VM Placement Policies</li>
                          <li>• VMware Tools → Integration Services</li>
                          <li>• vCenter → System Center or Windows Admin Center</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="space-y-6">
              <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-neutral-stroke)', borderRadius: 'var(--border-radius-lg)' }}>
                <h4 className="font-medium mb-3">Network Translation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">VMware Port Groups</label>
                    <select className="fluent-input w-full">
                      <option>Auto-detect from environment</option>
                      <option>Manual mapping</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Virtual Switches</label>
                    <select className="fluent-input w-full">
                      <option>Create new switches</option>
                      <option>Map to existing</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg" style={{ borderColor: 'var(--color-neutral-stroke)', borderRadius: 'var(--border-radius-lg)' }}>
                <h4 className="font-medium mb-3">Storage Translation</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">VMFS Datastores</label>
                    <select className="fluent-input w-full">
                      <option>Map to CSV volumes</option>
                      <option>Create new storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Disk Format</label>
                    <select className="fluent-input w-full">
                      <option>VHDX (Dynamic)</option>
                      <option>VHDX (Fixed)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p style={{ color: 'var(--color-neutral-foreground-secondary)' }}>
              Step {currentStep} content coming soon...
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-6" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="fluent-card">
        <div className="p-6 border-b" style={{ borderColor: 'var(--color-neutral-stroke)' }}>
          <div className="flex items-center mb-6">
            <h2 
              className="font-semibold"
              style={{ 
                fontSize: 'var(--font-size-title2)',
                color: 'var(--color-neutral-foreground)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
            >
              Migration Planner
            </h2>
            <div className="ml-2">
              <InfoTooltip 
                content={
                  <div>
                    <div className="font-medium mb-2" style={{ color: 'white' }}>
                      Migration Planning Methodology
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Comprehensive migration planning that includes:
                      <ul className="mt-2 space-y-1">
                        <li>• Compatibility assessment and risk analysis</li>
                        <li>• Automated VMware to Microsoft translation</li>
                        <li>• Hardware sizing and capacity planning</li>
                        <li>• TCO comparison and business case</li>
                        <li>• Step-by-step migration runbook generation</li>
                      </ul>
                    </div>
                  </div>
                }
              />
            </div>
          </div>
          <div className="flex justify-between">
            {wizardSteps.map((step) => (
              <WizardStep
                key={step.num}
                stepNumber={step.num}
                title={step.title}
                isActive={currentStep === step.num}
                isCompleted={currentStep > step.num}
              />
            ))}
          </div>
        </div>
        <div className="p-6">
          {renderStepContent()}
          
          <div className="flex justify-between mt-8">
            <button 
              disabled={currentStep === 1}
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="fluent-button fluent-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="fluent-button fluent-button-primary flex items-center"
            >
              {currentStep === 5 ? 'Generate Plan' : 'Next'}
              <ChevronRight className="ml-2" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigrationPlannerView;
