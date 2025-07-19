import React, { useState } from 'react';
import { ChevronRight, CheckCircle } from 'lucide-react';
import { InfoTooltip } from '../components/Tooltip';

const LifecyclePlannerView: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Mock cluster data for scope selection
  const mockClusterData = [
    { 
      name: 'Production Cluster 1', 
      hosts: 8, 
      vms: 234,
      description: 'Primary production workloads'
    },
    { 
      name: 'Production Cluster 2', 
      hosts: 6, 
      vms: 189,
      description: 'Secondary production workloads'
    },
    { 
      name: 'Dev/Test Cluster', 
      hosts: 4, 
      vms: 156,
      description: 'Development and testing environment'
    },
    { 
      name: 'DR Cluster', 
      hosts: 8, 
      vms: 268,
      description: 'Disaster recovery site'
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
    { num: 1, title: 'Scope Selection', description: 'Choose target cluster for lifecycle planning' },
    { num: 2, title: 'Growth Forecasting', description: 'Configure growth parameters and timeline' },
    { num: 3, title: 'Define Policies', description: 'Set sizing policies and constraints' },
    { num: 4, title: 'Select Hardware', description: 'Choose target hardware profiles' },
    { num: 5, title: 'Review & Generate', description: 'Review recommendations and generate plan' }
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
                Select Target vSphere Cluster
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Cluster Selection Algorithm
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Select the cluster you want to plan for lifecycle management. The system will:
                        <ul className="mt-2 space-y-1">
                          <li>• Analyze current resource consumption patterns</li>
                          <li>• Calculate historical growth trends</li>
                          <li>• Identify capacity constraints and bottlenecks</li>
                          <li>• Generate optimized hardware recommendations</li>
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
                  <input type="radio" name="cluster" className="mr-4 accent-blue-600" />
                  <div className="flex-1">
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
                Growth Forecasting Parameters
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Time-Series Forecasting Algorithm
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Uses linear regression and compound growth models to predict:
                        <ul className="mt-2 space-y-1">
                          <li>• CPU utilization trends</li>
                          <li>• Memory consumption growth</li>
                          <li>• Storage expansion patterns</li>
                          <li>• VM density changes</li>
                        </ul>
                        Confidence intervals indicate prediction accuracy.
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label 
                  className="block mb-2 font-medium"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Planning Horizon (Years)
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  step="1" 
                  defaultValue="3" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div 
                  className="mt-1 text-sm"
                  style={{ 
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Current: 3 years
                </div>
              </div>
              <div>
                <label 
                  className="block mb-2 font-medium"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Expected Growth Rate (%)
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  step="5" 
                  defaultValue="15" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div 
                  className="mt-1 text-sm"
                  style={{ 
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Current: 15% annually
                </div>
              </div>
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
                Define Sizing Policies
              </h3>
              <div className="ml-2">
                <InfoTooltip 
                  content={
                    <div>
                      <div className="font-medium mb-2" style={{ color: 'white' }}>
                        Multi-Dimensional Bin Packing Algorithm
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        Sizing policies control the bin-packing algorithm parameters:
                        <ul className="mt-2 space-y-1">
                          <li>• vCPU:pCore ratio affects CPU density calculations</li>
                          <li>• Memory overcommit impacts memory sizing</li>
                          <li>• HA policy reserves N+1 capacity for failover</li>
                          <li>• Growth buffer provides headroom for expansion</li>
                        </ul>
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label 
                  className="block mb-2 font-medium"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Target vCPU:pCore Ratio
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="8" 
                  step="0.1" 
                  defaultValue="3" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div 
                  className="mt-1 text-sm"
                  style={{ 
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Current: 3.0:1 (Conservative)
                </div>
              </div>
              <div>
                <label 
                  className="block mb-2 font-medium"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Target Memory Overcommitment
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="3" 
                  step="0.1" 
                  defaultValue="1.5" 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div 
                  className="mt-1 text-sm"
                  style={{ 
                    fontSize: 'var(--font-size-caption)',
                    color: 'var(--color-neutral-foreground-secondary)'
                  }}
                >
                  Current: 1.5:1 (Balanced)
                </div>
              </div>
            </div>
            <div className="mt-6">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3 accent-blue-600" defaultChecked />
                <span 
                  className="font-medium"
                  style={{ 
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--color-neutral-foreground)'
                  }}
                >
                  Enable HA (N+1) Policy
                </span>
                <div className="ml-2">
                  <InfoTooltip content="Reserves capacity for one host failure, ensuring workload availability during maintenance or hardware issues." />
                </div>
              </label>
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
              VMware Lifecycle Planner
            </h2>
            <div className="ml-2">
              <InfoTooltip 
                content={
                  <div>
                    <div className="font-medium mb-2" style={{ color: 'white' }}>
                      Lifecycle Planning Methodology
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                      Comprehensive capacity planning workflow that combines:
                      <ul className="mt-2 space-y-1">
                        <li>• Historical performance analysis</li>
                        <li>• Time-series growth forecasting</li>
                        <li>• Multi-dimensional bin packing optimization</li>
                        <li>• Hardware vendor best practices</li>
                        <li>• TCO and ROI calculations</li>
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

export default LifecyclePlannerView;
