import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Field,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardPreview,
  Title3,
  Title2,
  Text,
  Caption1,
  Badge,
  Spinner,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { PurpleGlassDropdown } from './ui';
import {
  AddRegular,
  ArrowLeftRegular,
  ArrowRightRegular,
  CheckmarkRegular,
  TimerRegular,
  PersonRegular,
  CalendarRegular,
  SettingsRegular,
  CloudEditRegular,
  ServerRegular,
  DatabaseRegular,
  NetworkAdapter16Regular,
  DocumentRegular,
  HardDriveRegular,
  ErrorCircleRegular,
} from '@fluentui/react-icons';

// =============================================================================
// ACTIVITY PRESETS CONFIGURATION
// =============================================================================

interface ActivityPreset {
  id: string;
  name: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'hardware_refresh' | 'custom';
  icon: React.ReactElement;
  description: string;
  estimatedDuration: number; // in days
  defaultAssignee: string;
  suggestedDependencies: string[];
  category: 'Infrastructure' | 'Migration' | 'Lifecycle' | 'Custom';
  complexity: 'Low' | 'Medium' | 'High';
  requiredSkills: string[];
  deliverables: string[];
}

const ACTIVITY_PRESETS: ActivityPreset[] = [
  // Infrastructure Management
  {
    id: 'hardware-refresh',
    name: 'Hardware Refresh Analysis',
    type: 'hardware_refresh',
    icon: <HardDriveRegular />,
    description: 'Evaluates current hardware performance gaps, capacity needs, and migration readiness to determine what should be refreshed and why',
    estimatedDuration: 14,
    defaultAssignee: 'Infrastructure Team',
    suggestedDependencies: ['infrastructure-audit'],
    category: 'Infrastructure',
    complexity: 'High',
    requiredSkills: ['VMware', 'Hyper-V', 'Storage Spaces Direct', 'RVTools'],
    deliverables: ['Migration Analysis Report', 'Hardware Requirements', 'S2D Readiness Assessment', 'Cost Analysis'],
  },
  {
    id: 'server-commissioning',
    name: 'Server Commissioning',
    type: 'commissioning',
    icon: <ServerRegular />,
    description: 'End-to-end server deployment including hardware setup, OS installation, and configuration management',
    estimatedDuration: 7,
    defaultAssignee: 'Infrastructure Team',
    suggestedDependencies: ['hardware-procurement'],
    category: 'Infrastructure',
    complexity: 'Medium',
    requiredSkills: ['Server Hardware', 'Windows Server', 'Network Configuration'],
    deliverables: ['Server Documentation', 'Configuration Scripts', 'Validation Report'],
  },
  {
    id: 'storage-migration',
    name: 'Storage Architecture Migration',
    type: 'migration',
    icon: <DatabaseRegular />,
    description: 'Migration from traditional SAN to Storage Spaces Direct with data integrity validation',
    estimatedDuration: 21,
    defaultAssignee: 'Storage Team',
    suggestedDependencies: ['hardware-refresh', 'backup-validation'],
    category: 'Migration',
    complexity: 'High',
    requiredSkills: ['Storage Spaces Direct', 'SAN Management', 'Data Migration'],
    deliverables: ['Migration Plan', 'Data Validation Report', 'Performance Benchmarks'],
  },
  {
    id: 'network-upgrade',
    name: 'Network Infrastructure Upgrade',
    type: 'hardware_customization',
    icon: <NetworkAdapter16Regular />,
    description: 'Upgrade network infrastructure to support RDMA and high-speed interconnects for S2D',
    estimatedDuration: 10,
    defaultAssignee: 'Network Team',
    suggestedDependencies: ['hardware-refresh'],
    category: 'Infrastructure',
    complexity: 'Medium',
    requiredSkills: ['Network Design', 'RDMA', 'Switch Configuration'],
    deliverables: ['Network Design Document', 'Configuration Templates', 'Performance Tests'],
  },

  // Migration Activities
  {
    id: 'vm-migration',
    name: 'Virtual Machine Migration',
    type: 'migration',
    icon: <CloudEditRegular />,
    description: 'Systematic migration of VMs from VMware vSphere to Microsoft Hyper-V with minimal downtime',
    estimatedDuration: 30,
    defaultAssignee: 'Migration Team',
    suggestedDependencies: ['hardware-refresh', 'storage-migration'],
    category: 'Migration',
    complexity: 'High',
    requiredSkills: ['VMware vSphere', 'Hyper-V', 'System Center VMM', 'Migration Tools'],
    deliverables: ['Migration Runbook', 'VM Inventory', 'Rollback Procedures', 'Testing Report'],
  },
  {
    id: 'application-migration',
    name: 'Application Migration & Testing',
    type: 'migration',
    icon: <DocumentRegular />,
    description: 'Migrate and validate applications on the new Hyper-V infrastructure with performance testing',
    estimatedDuration: 45,
    defaultAssignee: 'Application Team',
    suggestedDependencies: ['vm-migration'],
    category: 'Migration',
    complexity: 'High',
    requiredSkills: ['Application Architecture', 'Performance Testing', 'User Acceptance Testing'],
    deliverables: ['Application Inventory', 'Test Results', 'Performance Report', 'User Training'],
  },

  // Lifecycle Management
  {
    id: 'capacity-planning',
    name: 'Capacity Planning & Forecasting',
    type: 'lifecycle',
    icon: <TimerRegular />,
    description: '12-month capacity planning with growth projections and resource optimization recommendations',
    estimatedDuration: 5,
    defaultAssignee: 'Planning Team',
    suggestedDependencies: ['infrastructure-audit'],
    category: 'Lifecycle',
    complexity: 'Medium',
    requiredSkills: ['Capacity Planning', 'Performance Monitoring', 'Forecasting'],
    deliverables: ['Capacity Report', 'Growth Projections', 'Optimization Recommendations'],
  },
  {
    id: 'eol-assessment',
    name: 'End-of-Life Hardware Assessment',
    type: 'lifecycle',
    icon: <ErrorCircleRegular />,
    description: 'Identifies hardware reaching vendor end-of-support dates and creates urgent replacement timelines for compliance and risk management',
    estimatedDuration: 7,
    defaultAssignee: 'Infrastructure Team',
    suggestedDependencies: [],
    category: 'Lifecycle',
    complexity: 'Low',
    requiredSkills: ['Hardware Lifecycle', 'Risk Assessment', 'Vendor Management'],
    deliverables: ['EOL Report', 'Risk Assessment', 'Replacement Timeline'],
  },
  {
    id: 'legacy-decommission',
    name: 'Legacy System Decommissioning',
    type: 'decommission',
    icon: <DatabaseRegular />,
    description: 'Safe decommissioning of legacy systems with data archival and security compliance',
    estimatedDuration: 14,
    defaultAssignee: 'Infrastructure Team',
    suggestedDependencies: ['vm-migration', 'application-migration'],
    category: 'Lifecycle',
    complexity: 'Medium',
    requiredSkills: ['Data Archival', 'Security Compliance', 'Asset Management'],
    deliverables: ['Decommission Plan', 'Data Archive', 'Compliance Report'],
  },
];

// =============================================================================
// WIZARD STYLES
// =============================================================================

const useWizardStyles = makeStyles({
  wizardContainer: {
    width: '1200px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    overflow: 'hidden',
  },
  wizardContent: {
    padding: tokens.spacingVerticalL,
    minHeight: '500px',
    overflowY: 'auto',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  stepDot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    transition: 'all 0.2s ease',
  },
  stepDotActive: {
    background: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorBrandBackground}`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  stepDotCompleted: {
    background: tokens.colorPaletteGreenBackground3,
    border: `2px solid ${tokens.colorPaletteGreenBackground3}`,
    color: tokens.colorNeutralForegroundOnBrand,
  },
  stepConnector: {
    width: '40px',
    height: '2px',
    background: tokens.colorNeutralStroke2,
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
  },
  presetCard: {
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
      border: `1px solid ${tokens.colorBrandStroke1}`,
    },
  },
  presetCardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    boxShadow: tokens.shadow4,
    background: tokens.colorBrandBackground2,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  fullWidth: {
    gridColumn: '1 / -1',
  },
  complexityBadge: {
    marginTop: tokens.spacingVerticalXS,
  },
  deliverablesList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS,
    marginTop: tokens.spacingVerticalS,
  },
  skillTag: {
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
    background: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground2,
  },
  wizardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalL,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    background: tokens.colorNeutralBackground2,
  },
  summary: {
    background: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalM,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: tokens.spacingHorizontalL,
    marginTop: tokens.spacingVerticalM,
  },
});

// =============================================================================
// WIZARD INTERFACES
// =============================================================================

interface ActivityFormData {
  name: string;
  description: string;
  type: 'migration' | 'lifecycle' | 'decommission' | 'hardware_customization' | 'commissioning' | 'hardware_refresh' | 'custom';
  assignee: string;
  start_date: Date;
  end_date: Date;
  estimatedDuration: number;
  complexity?: string;
  skillLevel?: string;
  deliverables?: string[];
  dependencies?: string[];
  preset?: ActivityPreset;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (activityData: ActivityFormData) => void;
  availableAssignees?: string[];
}

const WIZARD_STEPS = [
  { id: 1, title: 'Choose Type', description: 'Select activity type' },
  { id: 2, title: 'Configure', description: 'Set details' },
  { id: 3, title: 'Review', description: 'Confirm & create' },
];

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

export const ActivityCreationWizard: React.FC<WizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableAssignees = ['Infrastructure Team', 'Migration Team', 'Storage Team', 'Network Team', 'Planning Team', 'Application Team'],
}) => {
  const styles = useWizardStyles();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<ActivityPreset | null>(null);
  const [isCustomActivity, setIsCustomActivity] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ActivityFormData>({
    name: '',
    description: '',
    type: 'custom',
    assignee: '',
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    estimatedDuration: 1,
  });

  const resetWizard = useCallback(() => {
    setCurrentStep(1);
    setSelectedPreset(null);
    setIsCustomActivity(false);
    setIsSubmitting(false);
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      assignee: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedDuration: 1,
    });
  }, []);

  const handleClose = useCallback(() => {
    resetWizard();
    onClose();
  }, [resetWizard, onClose]);

  const handlePresetSelect = useCallback((preset: ActivityPreset) => {
    setSelectedPreset(preset);
    setIsCustomActivity(false);
    setFormData({
      name: preset.name,
      description: preset.description,
      type: preset.type,
      assignee: preset.defaultAssignee,
      start_date: new Date(),
      end_date: new Date(Date.now() + preset.estimatedDuration * 24 * 60 * 60 * 1000),
      estimatedDuration: preset.estimatedDuration,
      complexity: preset.complexity,
      skillLevel: preset.requiredSkills.join(', '),
      deliverables: preset.deliverables,
      preset,
    });
  }, []);

  const handleCustomActivity = useCallback(() => {
    setSelectedPreset(null);
    setIsCustomActivity(true);
    setFormData({
      name: '',
      description: '',
      type: 'custom',
      assignee: '',
      start_date: new Date(),
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      estimatedDuration: 7,
    });
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create activity:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, handleClose]);

  const canProceed = useCallback(() => {
    if (currentStep === 1) {
      return selectedPreset !== null || isCustomActivity;
    }
    if (currentStep === 2) {
      return formData.name.trim() !== '' && formData.assignee !== '' && formData.start_date !== null && formData.end_date !== null;
    }
    return true;
  }, [currentStep, selectedPreset, isCustomActivity, formData]);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'danger';
      default: return 'brand';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Infrastructure': return 'brand';
      case 'Migration': return 'important';
      case 'Lifecycle': return 'success';
      case 'Custom': return 'subtle';
      default: return 'brand';
    }
  };

  // =============================================================================
  // STEP RENDERERS
  // =============================================================================

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      {WIZARD_STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div style={{ textAlign: 'center' }}>
            <div
              className={`${styles.stepDot} ${
                currentStep === step.id ? styles.stepDotActive :
                currentStep > step.id ? styles.stepDotCompleted : ''
              }`}
            >
              {currentStep > step.id ? <CheckmarkRegular /> : step.id}
            </div>
            <Caption1 style={{ marginTop: tokens.spacingVerticalXXS }}>
              {step.title}
            </Caption1>
          </div>
          {index < WIZARD_STEPS.length - 1 && (
            <div className={styles.stepConnector} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <div style={{ textAlign: 'center', marginBottom: tokens.spacingVerticalXL }}>
        <Title2 style={{ 
          marginBottom: tokens.spacingVerticalS,
          color: '#8b5cf6',
          fontWeight: '700',
          fontSize: '28px'
        }}>
          Choose Activity Type
        </Title2>
        <Text style={{ 
          color: tokens.colorNeutralForeground2,
          fontSize: '16px',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.5'
        }}>
          Select from our pre-configured activity templates organized by category, or create a custom activity from scratch.
        </Text>
      </div>

      {/* Category Columns Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: tokens.spacingVerticalXL,
        marginBottom: tokens.spacingVerticalXL
      }}>
        {/* Custom Activity Column */}
        <div style={{
          background: 'rgba(139, 92, 246, 0.03)',
          borderRadius: '16px',
          padding: tokens.spacingVerticalL,
          border: '2px solid rgba(139, 92, 246, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: tokens.spacingVerticalL
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
            }}>
              <SettingsRegular style={{ fontSize: '24px', color: 'white' }} />
            </div>
            <Title3 style={{ 
              color: '#8b5cf6',
              fontWeight: '600',
              marginBottom: tokens.spacingVerticalXS
            }}>
              Custom Activity
            </Title3>
            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              Create your own activity
            </Caption1>
          </div>
          
          <Card
            style={{
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              border: isCustomActivity ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)',
              background: isCustomActivity ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              boxShadow: isCustomActivity ? '0 8px 32px rgba(139, 92, 246, 0.2)' : 'none',
              borderRadius: '12px'
            }}
            onClick={handleCustomActivity}
          >
            <div style={{ padding: tokens.spacingVerticalL }}>
              <Text style={{ 
                color: tokens.colorNeutralForeground1,
                lineHeight: '1.5',
                textAlign: 'center'
              }}>
                Define your own activity type, timeline, and requirements for unique project needs that don't fit our standard templates.
              </Text>
            </div>
          </Card>
        </div>

        {/* Activity Category Columns */}
        {[
          { name: 'Infrastructure', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
          { name: 'Migration', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
          { name: 'Lifecycle', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' }
        ].map(category => (
          <div key={category.name} style={{
            background: `rgba(${category.name === 'Infrastructure' ? '16, 185, 129' : category.name === 'Migration' ? '59, 130, 246' : '245, 158, 11'}, 0.03)`,
            borderRadius: '16px',
            padding: tokens.spacingVerticalL,
            border: `2px solid rgba(${category.name === 'Infrastructure' ? '16, 185, 129' : category.name === 'Migration' ? '59, 130, 246' : '245, 158, 11'}, 0.1)`,
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: tokens.spacingVerticalL
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: category.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: `0 8px 32px ${category.color}40`
              }}>
                {category.name === 'Infrastructure' && <ServerRegular style={{ fontSize: '24px', color: 'white' }} />}
                {category.name === 'Migration' && <CloudEditRegular style={{ fontSize: '24px', color: 'white' }} />}
                {category.name === 'Lifecycle' && <DocumentRegular style={{ fontSize: '24px', color: 'white' }} />}
              </div>
              <Title3 style={{ 
                color: category.color,
                fontWeight: '600',
                marginBottom: tokens.spacingVerticalXS
              }}>
                {category.name} Activities
              </Title3>
              <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                {ACTIVITY_PRESETS.filter(preset => preset.category === category.name).length} templates available
              </Caption1>
            </div>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacingVerticalM
            }}>
              {ACTIVITY_PRESETS.filter(preset => preset.category === category.name).map(preset => (
                <Card
                  key={preset.id}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: selectedPreset?.id === preset.id ? `2px solid ${category.color}` : `1px solid ${category.color}40`,
                    background: selectedPreset?.id === preset.id ? `${category.color}10` : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: selectedPreset?.id === preset.id ? `0 8px 32px ${category.color}30` : 'none',
                    borderRadius: '12px',
                    transform: selectedPreset?.id === preset.id ? 'translateY(-2px)' : 'none'
                  }}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <div style={{ padding: tokens.spacingVerticalM }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: tokens.spacingHorizontalS,
                      marginBottom: tokens.spacingVerticalS
                    }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: `${category.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: category.color
                      }}>
                        {React.cloneElement(preset.icon, { style: { fontSize: '16px' } })}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text style={{ 
                          fontWeight: '600',
                          fontSize: '14px',
                          color: tokens.colorNeutralForeground1,
                          marginBottom: '2px',
                          display: 'block'
                        }}>
                          {preset.name}
                        </Text>
                        <div style={{ display: 'flex', gap: tokens.spacingHorizontalXXS }}>
                          <Badge 
                            appearance="outline" 
                            size="small"
                            style={{
                              border: `1px solid ${category.color}60`,
                              color: category.color,
                              background: 'transparent',
                              fontSize: '10px'
                            }}
                          >
                            {preset.complexity}
                          </Badge>
                          <Caption1 style={{ 
                            color: tokens.colorNeutralForeground3,
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}>
                            <TimerRegular style={{ fontSize: '10px' }} />
                            {preset.estimatedDuration}d
                          </Caption1>
                        </div>
                      </div>
                    </div>
                    <Text style={{ 
                      fontSize: '12px',
                      color: tokens.colorNeutralForeground2,
                      lineHeight: '1.4'
                    }}>
                      {preset.description}
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Title2 style={{ marginBottom: tokens.spacingVerticalM }}>
        Configure Activity Details
      </Title2>
      <Text style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorNeutralForeground2 }}>
        {selectedPreset 
          ? `Configure the details for your ${selectedPreset.name} activity.`
          : 'Set up your custom activity with specific details and timeline.'
        }
      </Text>

      <div className={styles.formGrid}>
        <Field label="Activity Name" required className={styles.fullWidth}>
          <Input
            value={formData.name}
            onChange={(_, data) => setFormData(prev => ({ ...prev, name: data.value }))}
            placeholder="Enter activity name..."
          />
        </Field>

        <Field label="Description" className={styles.fullWidth}>
          <Textarea
            value={formData.description}
            onChange={(_, data) => setFormData(prev => ({ ...prev, description: data.value }))}
            placeholder="Describe the activity objectives and scope..."
            rows={3}
          />
        </Field>

        {isCustomActivity && (
          <PurpleGlassDropdown
            label="Activity Type"
            required
            options={[
              { value: 'migration', label: 'Migration' },
              { value: 'lifecycle', label: 'Lifecycle Planning' },
              { value: 'decommission', label: 'Decommissioning' },
              { value: 'hardware_customization', label: 'Hardware Customization' },
              { value: 'hardware_refresh', label: 'Hardware Refresh' },
              { value: 'commissioning', label: 'Commissioning' },
              { value: 'custom', label: 'Custom' }
            ]}
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
            glass="light"
          />
        )}

        <PurpleGlassDropdown
          label="Assignee"
          required
          placeholder="Select assignee..."
          options={availableAssignees.map(assignee => ({
            value: assignee,
            label: assignee
          }))}
          value={formData.assignee}
          onChange={(value) => setFormData(prev => ({ ...prev, assignee: value as string }))}
          glass="light"
        />

        <Field label="Start Date" required>
          <Input
            type="date"
            value={formData.start_date.toISOString().split('T')[0]}
            onChange={(_, data) => setFormData(prev => ({ ...prev, start_date: new Date(data.value) }))}
          />
        </Field>

        <Field label="End Date" required>
          <Input
            type="date"
            value={formData.end_date.toISOString().split('T')[0]}
            onChange={(_, data) => setFormData(prev => ({ ...prev, end_date: new Date(data.value) }))}
          />
        </Field>
      </div>

      {selectedPreset && (
        <div className={styles.summary}>
          <Title3 style={{ marginBottom: tokens.spacingVerticalM }}>
            Preset Information
          </Title3>
          <div className={styles.summaryGrid}>
            <div>
              <Caption1 style={{ fontWeight: tokens.fontWeightSemibold }}>Required Skills</Caption1>
              <div className={styles.deliverablesList}>
                {selectedPreset.requiredSkills.map((skill, i) => (
                  <span key={i} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <Caption1 style={{ fontWeight: tokens.fontWeightSemibold }}>Expected Deliverables</Caption1>
              <div className={styles.deliverablesList}>
                {selectedPreset.deliverables.map((deliverable, i) => (
                  <span key={i} className={styles.skillTag}>
                    {deliverable}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <Title2 style={{ marginBottom: tokens.spacingVerticalM }}>
        Review & Create Activity
      </Title2>
      <Text style={{ marginBottom: tokens.spacingVerticalL, color: tokens.colorNeutralForeground2 }}>
        Review the activity details before creating it in your project timeline.
      </Text>

      <div className={styles.summary}>
        <div className={styles.summaryGrid}>
          <div>
            <Caption1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalXS }}>
              Activity Details
            </Caption1>
            <Text style={{ marginBottom: tokens.spacingVerticalS }}>
              <strong>Name:</strong> {formData.name}
            </Text>
            <Text style={{ marginBottom: tokens.spacingVerticalS }}>
              <strong>Type:</strong> {formData.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Text>
            <Text style={{ marginBottom: tokens.spacingVerticalS }}>
              <strong>Assignee:</strong> {formData.assignee}
            </Text>
            {formData.description && (
              <Text style={{ marginBottom: tokens.spacingVerticalS }}>
                <strong>Description:</strong> {formData.description}
              </Text>
            )}
          </div>
          <div>
            <Caption1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalXS }}>
              Timeline
            </Caption1>
            <Text style={{ marginBottom: tokens.spacingVerticalS, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <CalendarRegular style={{ fontSize: '14px' }} />
              <strong>Start:</strong> {formData.start_date.toLocaleDateString()}
            </Text>
            <Text style={{ marginBottom: tokens.spacingVerticalS, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <CalendarRegular style={{ fontSize: '14px' }} />
              <strong>End:</strong> {formData.end_date.toLocaleDateString()}
            </Text>
            <Text style={{ marginBottom: tokens.spacingVerticalS, display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalXXS }}>
              <TimerRegular style={{ fontSize: '14px' }} />
              <strong>Duration:</strong> {Math.ceil((formData.end_date.getTime() - formData.start_date.getTime()) / (1000 * 60 * 60 * 24))} days
            </Text>
          </div>
        </div>

        {selectedPreset && (
          <div style={{ marginTop: tokens.spacingVerticalL }}>
            <Caption1 style={{ fontWeight: tokens.fontWeightSemibold, marginBottom: tokens.spacingVerticalS }}>
              Preset Configuration
            </Caption1>
            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS, marginBottom: tokens.spacingVerticalS }}>
              <Badge appearance="outline" color={getCategoryColor(selectedPreset.category)}>
                {selectedPreset.category}
              </Badge>
              <Badge appearance="filled" color={getComplexityColor(selectedPreset.complexity)}>
                {selectedPreset.complexity} Complexity
              </Badge>
            </div>
            <Text style={{ marginBottom: tokens.spacingVerticalS }}>
              This preset includes predefined requirements, deliverables, and best practices for {selectedPreset.name.toLowerCase()}.
            </Text>
          </div>
        )}
      </div>

      {isSubmitting && (
        <MessageBar style={{ marginTop: tokens.spacingVerticalM }}>
          <MessageBarBody>
            <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS }}>
              <Spinner size="tiny" />
              Creating activity...
            </div>
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && handleClose()}>
      <DialogSurface className={styles.wizardContainer}>
        <DialogBody>
          <DialogTitle>Create New Activity</DialogTitle>
          <DialogContent>
            <div className={styles.wizardContent}>
              {renderStepIndicator()}
              
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
            </div>
          </DialogContent>
          <DialogActions className={styles.wizardActions}>
            <div>
              {currentStep > 1 && (
                <Button
                  appearance="secondary"
                  icon={<ArrowLeftRegular />}
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', gap: tokens.spacingHorizontalS }}>
              <Button
                appearance="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              
              {currentStep < 3 ? (
                <Button
                  appearance="primary"
                  icon={<ArrowRightRegular />}
                  iconPosition="after"
                  onClick={handleNext}
                  disabled={!canProceed()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  icon={isSubmitting ? <Spinner size="tiny" /> : <AddRegular />}
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Activity'}
                </Button>
              )}
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ActivityCreationWizard;