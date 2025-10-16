# Activity Wizard Implementation - Phase 2: Frontend Wizard

**Start Date:** TBD (After Phase 1)  
**Phase:** 2 of 5 (Frontend Wizard Components)  
**Estimated Duration:** 2 weeks  
**Status:** 📝 Planning

---

## Phase 2 Objectives

1. ✅ Create wizard component architecture
2. ✅ Implement all 7 wizard steps for Migration flow
3. ✅ Add wizard state management with React Context
4. ✅ Implement draft save/resume functionality
5. ✅ Build reusable sub-components (compatibility checker, capacity validator, etc.)
6. ✅ Apply Fluent UI 2 + glassmorphic design system consistently

---

## Design System Guidelines

### Fluent UI 2 Standards

**Import Pattern:**
```typescript
import {
  makeStyles,
  shorthands,
  tokens,
  // Components...
} from '@fluentui/react-components';
```

**Color System:**
```typescript
// Primary colors from tokens
tokens.colorBrandForeground1      // Primary brand color
tokens.colorBrandBackground       // Brand backgrounds
tokens.colorNeutralForeground1    // Primary text
tokens.colorNeutralForeground2    // Secondary text
tokens.colorNeutralForeground3    // Tertiary text
tokens.colorNeutralBackground1    // Primary backgrounds
```

**Spacing System:**
```typescript
tokens.spacingVerticalXS    // 2px
tokens.spacingVerticalS     // 4px
tokens.spacingVerticalM     // 8px
tokens.spacingVerticalL     // 12px
tokens.spacingVerticalXL    // 16px
tokens.spacingVerticalXXL   // 20px
```

**Border Radius:**
```typescript
tokens.borderRadiusSmall    // 2px
tokens.borderRadiusMedium   // 4px
tokens.borderRadiusLarge    // 8px
tokens.borderRadiusXLarge   // 12px
```

### Glassmorphic Aesthetic

**Card Style Pattern:**
```typescript
const cardStyle = {
  backgroundColor: '#ffffff',
  ...shorthands.borderRadius(tokens.borderRadiusLarge),
  ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  ...shorthands.border('1px', 'solid', '#e5e7eb'),
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  backdropFilter: 'blur(10px)',
};
```

**Section Background:**
```typescript
const sectionStyle = {
  backgroundColor: '#f9fafb',
  ...shorthands.borderRadius(tokens.borderRadiusLarge),
  ...shorthands.padding(tokens.spacingVerticalL),
  ...shorthands.border('1px', 'solid', '#e5e7eb'),
};
```

**Interactive Elements:**
```typescript
const interactiveStyle = {
  ...shorthands.transition('all', '0.2s', 'ease'),
  cursor: 'pointer',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 12px -2px rgba(99, 102, 241, 0.15)',
    ...shorthands.border('1px', 'solid', tokens.colorBrandForeground1),
  },
};
```

### Typography

**Font Stack:**
```css
font-family: 'Poppins', 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

**Heading Styles:**
```typescript
// Page title
style={{ 
  fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
  fontSize: '24px',
  fontWeight: 600,
}}

// Section title
style={{ 
  fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
  fontSize: '18px',
  fontWeight: 600,
}}

// Subsection title
style={{ 
  fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
  fontSize: '14px',
  fontWeight: 500,
}}
```

---

## Component Architecture

```
frontend/src/components/Activity/
├── ActivityWizard/
│   ├── ActivityWizard.tsx                 # Main wizard container
│   ├── ActivityWizard.styles.ts           # Fluent UI makeStyles
│   │
│   ├── WizardNavigation/
│   │   ├── WizardProgress.tsx             # Progress indicator (1 of 7)
│   │   ├── WizardNavigation.tsx           # Back/Next/Save Draft buttons
│   │   └── WizardProgress.styles.ts       # Styles
│   │
│   ├── Steps/
│   │   ├── Step1_Basics.tsx               # Activity name + type
│   │   ├── Step2_SourceDestination.tsx    # Source cluster + hardware strategy
│   │   ├── Step3_Infrastructure.tsx       # Cluster type + compatibility
│   │   ├── Step4_HardwareSelection.tsx    # Select hardware
│   │   ├── Step5_CapacityValidation.tsx   # Capacity check
│   │   ├── Step6_Timeline.tsx             # Timeline + assignments
│   │   ├── Step7_Review.tsx               # Final review
│   │   └── steps.styles.ts                # Shared step styles
│   │
│   ├── Shared/
│   │   ├── CompatibilityChecker.tsx       # Real-time compatibility UI
│   │   ├── CompatibilityChecker.styles.ts
│   │   ├── CapacityValidator.tsx          # Capacity validation UI
│   │   ├── CapacityValidator.styles.ts
│   │   ├── HardwareSelector.tsx           # Hardware selection widget
│   │   ├── HardwareSelector.styles.ts
│   │   ├── TimelineCalculator.tsx         # Timeline estimation UI
│   │   ├── TimelineCalculator.styles.ts
│   │   └── WizardCard.tsx                 # Reusable card component
│   │
│   ├── Context/
│   │   ├── WizardContext.tsx              # React Context for state
│   │   └── WizardProvider.tsx             # Context provider
│   │
│   └── types/
│       ├── WizardTypes.ts                 # TypeScript interfaces
│       └── StepData.ts                    # Step-specific data types
│
└── StrategySwimlane/
    ├── StrategySwimlane.tsx               # Swimlane container
    ├── StrategySwimlane.styles.ts
    ├── StrategyCard.tsx                   # Individual strategy card
    ├── StrategyCard.styles.ts
    └── StrategyCardModal.tsx              # View/edit strategy details
```

---

## Wizard State Management

### WizardContext

**File:** `frontend/src/components/Activity/ActivityWizard/Context/WizardContext.tsx`

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  WizardState, 
  WizardFormData, 
  ActivityType,
  HardwareCompatibilityResult,
  CapacityValidationResult 
} from '../types/WizardTypes';

interface WizardContextValue {
  // Core state
  activityId: string | null;
  projectId: string;
  currentStep: number;
  wizardData: WizardFormData;
  
  // UI state
  isDirty: boolean;
  isSaving: boolean;
  isValidating: boolean;
  validationErrors: Record<string, string>;
  
  // Navigation
  goToStep: (step: number) => void;
  goNext: () => Promise<boolean>;
  goBack: () => void;
  canGoNext: () => boolean;
  canGoBack: () => boolean;
  
  // Data management
  updateStepData: (step: number, data: any) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  
  // Persistence
  saveDraft: () => Promise<void>;
  loadDraft: (activityId: string) => Promise<void>;
  completeWizard: () => Promise<void>;
  
  // Step validation
  validateCurrentStep: () => Promise<boolean>;
  
  // Fetched data
  projectClusters: string[];
  hardwareBaskets: any[];
  compatibilityResult: HardwareCompatibilityResult | null;
  capacityValidation: CapacityValidationResult | null;
  
  // Loading states
  loadingClusters: boolean;
  loadingBaskets: boolean;
  loadingCompatibility: boolean;
  loadingCapacity: boolean;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
};

export const WizardProvider: React.FC<WizardProviderProps> = ({
  projectId,
  existingActivityId,
  children,
}) => {
  const [activityId, setActivityId] = useState<string | null>(existingActivityId || null);
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardFormData>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Auto-save functionality
  useEffect(() => {
    if (isDirty && activityId) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity
      
      return () => clearTimeout(timer);
    }
  }, [isDirty, activityId, wizardData]);
  
  const saveDraft = useCallback(async () => {
    if (!activityId) return;
    
    setIsSaving(true);
    try {
      await fetch(`/api/v1/wizard/${activityId}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_step: currentStep,
          wizard_data: wizardData,
        }),
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [activityId, currentStep, wizardData]);
  
  const updateStepData = useCallback((step: number, data: any) => {
    setWizardData(prev => ({
      ...prev,
      [`step${step}`]: { ...prev[`step${step}`], ...data },
    }));
    setIsDirty(true);
  }, []);
  
  const goNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return false;
    
    // If Step 1 and no activity ID, create draft
    if (currentStep === 1 && !activityId && wizardData.step1) {
      try {
        const response = await fetch(`/api/v1/wizard/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            name: wizardData.step1.activityName,
            activity_type: wizardData.step1.activityType,
          }),
        });
        const { activity_id } = await response.json();
        setActivityId(activity_id);
      } catch (error) {
        console.error('Failed to create draft:', error);
        return false;
      }
    }
    
    setCurrentStep(prev => Math.min(prev + 1, 7));
    return true;
  }, [currentStep, activityId, wizardData, projectId]);
  
  const goBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);
  
  const canGoNext = useCallback(() => {
    return currentStep < 7;
  }, [currentStep]);
  
  const canGoBack = useCallback(() => {
    return currentStep > 1;
  }, [currentStep]);
  
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    // Step-specific validation logic
    const errors: Record<string, string> = {};
    
    switch (currentStep) {
      case 1:
        if (!wizardData.step1?.activityName?.trim()) {
          errors.activityName = 'Activity name is required';
        }
        if (!wizardData.step1?.activityType) {
          errors.activityType = 'Activity type is required';
        }
        break;
      
      case 2:
        if (!wizardData.step2?.sourceCluster) {
          errors.sourceCluster = 'Source cluster is required';
        }
        if (!wizardData.step2?.targetClusterName?.trim()) {
          errors.targetClusterName = 'Target cluster name is required';
        }
        if (!wizardData.step2?.hardwareStrategy) {
          errors.hardwareStrategy = 'Hardware strategy is required';
        }
        break;
      
      case 3:
        if (!wizardData.step3?.infrastructureType) {
          errors.infrastructureType = 'Infrastructure type is required';
        }
        break;
      
      case 4:
        if (wizardData.step2?.hardwareStrategy === 'new' && !wizardData.step4?.selectedModels?.length) {
          errors.hardware = 'Please select at least one hardware model';
        }
        break;
      
      case 5:
        if (!wizardData.step5?.capacityConfirmed) {
          errors.capacity = 'Please review and confirm capacity validation';
        }
        break;
      
      case 6:
        if (!wizardData.step6?.startDate) {
          errors.startDate = 'Start date is required';
        }
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, wizardData]);
  
  const completeWizard = useCallback(async () => {
    if (!activityId) return;
    
    try {
      await fetch(`/api/v1/wizard/${activityId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wizard_data: wizardData,
        }),
      });
      // Success - wizard completed
    } catch (error) {
      console.error('Failed to complete wizard:', error);
      throw error;
    }
  }, [activityId, wizardData]);
  
  const value: WizardContextValue = {
    activityId,
    projectId,
    currentStep,
    wizardData,
    isDirty,
    isSaving,
    isValidating: false,
    validationErrors,
    goToStep: setCurrentStep,
    goNext,
    goBack,
    canGoNext,
    canGoBack,
    updateStepData,
    setValidationErrors,
    clearErrors: () => setValidationErrors({}),
    saveDraft,
    loadDraft: async () => {}, // TODO: Implement
    completeWizard,
    validateCurrentStep,
    projectClusters: [], // TODO: Fetch
    hardwareBaskets: [], // TODO: Fetch
    compatibilityResult: null, // TODO: Fetch
    capacityValidation: null, // TODO: Fetch
    loadingClusters: false,
    loadingBaskets: false,
    loadingCompatibility: false,
    loadingCapacity: false,
  };
  
  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};
```

---

## Main Wizard Component

**File:** `frontend/src/components/Activity/ActivityWizard/ActivityWizard.tsx`

```typescript
import React from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { WizardProvider, useWizard } from './Context/WizardContext';
import { WizardProgress } from './WizardNavigation/WizardProgress';
import { WizardNavigation } from './WizardNavigation/WizardNavigation';

// Step imports
import { Step1_Basics } from './Steps/Step1_Basics';
import { Step2_SourceDestination } from './Steps/Step2_SourceDestination';
import { Step3_Infrastructure } from './Steps/Step3_Infrastructure';
import { Step4_HardwareSelection } from './Steps/Step4_HardwareSelection';
import { Step5_CapacityValidation } from './Steps/Step5_CapacityValidation';
import { Step6_Timeline } from './Steps/Step6_Timeline';
import { Step7_Review } from './Steps/Step7_Review';

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: '1000px',
    width: '90vw',
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusXLarge),
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  
  dialogBody: {
    ...shorthands.padding(0),
    display: 'flex',
    flexDirection: 'column',
    height: '85vh',
  },
  
  header: {
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    ...shorthands.borderBottom('1px', 'solid', '#e5e7eb'),
    backgroundColor: '#f9fafb',
  },
  
  title: {
    fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
    fontSize: '24px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalM,
  },
  
  content: {
    flex: 1,
    ...shorthands.padding(tokens.spacingVerticalXXL, tokens.spacingHorizontalXXL),
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  
  footer: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalXXL),
    ...shorthands.borderTop('1px', 'solid', '#e5e7eb'),
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

interface ActivityWizardProps {
  projectId: string;
  existingActivityId?: string;
  onComplete: (activityId: string) => void;
  onCancel: () => void;
}

const WizardContent: React.FC = () => {
  const styles = useStyles();
  const { currentStep, wizardData } = useWizard();
  
  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_Basics />;
      case 2: return <Step2_SourceDestination />;
      case 3: return <Step3_Infrastructure />;
      case 4: return <Step4_HardwareSelection />;
      case 5: return <Step5_CapacityValidation />;
      case 6: return <Step6_Timeline />;
      case 7: return <Step7_Review />;
      default: return null;
    }
  };
  
  const getStepTitle = () => {
    const titles = [
      'Activity Basics',
      'Source & Destination',
      'Infrastructure Configuration',
      'Hardware Selection',
      'Capacity Validation',
      'Timeline & Resources',
      'Review & Confirm',
    ];
    return titles[currentStep - 1] || '';
  };
  
  return (
    <>
      <div className={styles.header}>
        <div className={styles.title}>Create New Activity</div>
        <WizardProgress />
      </div>
      
      <div className={styles.content}>
        <h2 style={{
          fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          marginBottom: tokens.spacingVerticalL,
          color: tokens.colorNeutralForeground1,
        }}>
          {getStepTitle()}
        </h2>
        {renderStep()}
      </div>
      
      <div className={styles.footer}>
        <WizardNavigation />
      </div>
    </>
  );
};

export const ActivityWizard: React.FC<ActivityWizardProps> = ({
  projectId,
  existingActivityId,
  onComplete,
  onCancel,
}) => {
  const styles = useStyles();
  
  return (
    <WizardProvider projectId={projectId} existingActivityId={existingActivityId}>
      <Dialog open onOpenChange={(_, data) => !data.open && onCancel()}>
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody className={styles.dialogBody}>
            <WizardContent />
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </WizardProvider>
  );
};
```

---

## Progress Indicator

**File:** `frontend/src/components/Activity/ActivityWizard/WizardNavigation/WizardProgress.tsx`

```typescript
import React from 'react';
import { makeStyles, shorthands, tokens } from '@fluentui/react-components';
import { Checkmark20Regular } from '@fluentui/react-icons';
import { useWizard } from '../Context/WizardContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap(tokens.spacingHorizontalS),
  },
  
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingVerticalXS),
    flex: 1,
  },
  
  stepCircle: {
    width: '40px',
    height: '40px',
    ...shorthands.borderRadius('50%'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    fontWeight: 600,
    ...shorthands.transition('all', '0.2s', 'ease'),
  },
  
  stepCircleInactive: {
    backgroundColor: '#f3f4f6',
    color: '#9ca3af',
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
  },
  
  stepCircleActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: '#ffffff',
    ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
    boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.1)',
  },
  
  stepCircleCompleted: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    ...shorthands.border('2px', 'solid', '#059669'),
  },
  
  stepLabel: {
    fontSize: '12px',
    fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
    textAlign: 'center',
    maxWidth: '100px',
  },
  
  stepLabelInactive: {
    color: '#9ca3af',
  },
  
  stepLabelActive: {
    color: tokens.colorNeutralForeground1,
    fontWeight: 600,
  },
  
  stepLabelCompleted: {
    color: '#059669',
    fontWeight: 500,
  },
  
  connector: {
    flex: 1,
    height: '2px',
    marginBottom: '30px',
  },
  
  connectorInactive: {
    backgroundColor: '#e5e7eb',
  },
  
  connectorActive: {
    backgroundColor: tokens.colorBrandForeground1,
  },
  
  connectorCompleted: {
    backgroundColor: '#10b981',
  },
});

export const WizardProgress: React.FC = () => {
  const styles = useStyles();
  const { currentStep } = useWizard();
  
  const steps = [
    { number: 1, label: 'Basics' },
    { number: 2, label: 'Source & Destination' },
    { number: 3, label: 'Infrastructure' },
    { number: 4, label: 'Hardware' },
    { number: 5, label: 'Capacity' },
    { number: 6, label: 'Timeline' },
    { number: 7, label: 'Review' },
  ];
  
  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'inactive';
  };
  
  return (
    <div className={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.number}>
          <div className={styles.step}>
            <div
              className={`
                ${styles.stepCircle}
                ${getStepStatus(step.number) === 'inactive' && styles.stepCircleInactive}
                ${getStepStatus(step.number) === 'active' && styles.stepCircleActive}
                ${getStepStatus(step.number) === 'completed' && styles.stepCircleCompleted}
              `}
            >
              {getStepStatus(step.number) === 'completed' ? (
                <Checkmark20Regular />
              ) : (
                step.number
              )}
            </div>
            <div
              className={`
                ${styles.stepLabel}
                ${getStepStatus(step.number) === 'inactive' && styles.stepLabelInactive}
                ${getStepStatus(step.number) === 'active' && styles.stepLabelActive}
                ${getStepStatus(step.number) === 'completed' && styles.stepLabelCompleted}
              `}
            >
              {step.label}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={`
                ${styles.connector}
                ${step.number < currentStep ? styles.connectorCompleted : ''}
                ${step.number === currentStep ? styles.connectorActive : ''}
                ${step.number > currentStep ? styles.connectorInactive : ''}
              `}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
```

---

## Navigation Buttons

**File:** `frontend/src/components/Activity/ActivityWizard/WizardNavigation/WizardNavigation.tsx`

```typescript
import React from 'react';
import { Button, Spinner, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import {
  ArrowLeft20Regular,
  ArrowRight20Regular,
  Save20Regular,
  Checkmark20Regular,
} from '@fluentui/react-icons';
import { useWizard } from '../Context/WizardContext';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  
  leftSection: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
  },
  
  rightSection: {
    display: 'flex',
    ...shorthands.gap(tokens.spacingHorizontalM),
    alignItems: 'center',
  },
  
  saveIndicator: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap(tokens.spacingHorizontalXS),
  },
});

export const WizardNavigation: React.FC = () => {
  const styles = useStyles();
  const {
    currentStep,
    canGoBack,
    canGoNext,
    goBack,
    goNext,
    saveDraft,
    completeWizard,
    isSaving,
    isDirty,
  } = useWizard();
  
  const handleNext = async () => {
    const success = await goNext();
    if (!success) {
      // Validation failed - errors will be shown in the form
    }
  };
  
  const handleComplete = async () => {
    try {
      await completeWizard();
      // Success handled by parent
    } catch (error) {
      console.error('Failed to complete wizard:', error);
    }
  };
  
  const isLastStep = currentStep === 7;
  
  return (
    <div className={styles.container}>
      <div className={styles.leftSection}>
        <Button
          appearance="secondary"
          icon={<ArrowLeft20Regular />}
          disabled={!canGoBack()}
          onClick={goBack}
        >
          Back
        </Button>
        
        <Button
          appearance="subtle"
          icon={<Save20Regular />}
          onClick={saveDraft}
          disabled={!isDirty || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>
      
      <div className={styles.rightSection}>
        {isSaving && (
          <div className={styles.saveIndicator}>
            <Spinner size="tiny" />
            <span>Saving...</span>
          </div>
        )}
        
        {!isSaving && isDirty && (
          <div className={styles.saveIndicator}>
            <span>Unsaved changes</span>
          </div>
        )}
        
        {!isSaving && !isDirty && (
          <div className={styles.saveIndicator}>
            <Checkmark20Regular />
            <span>All changes saved</span>
          </div>
        )}
        
        {!isLastStep && (
          <Button
            appearance="primary"
            icon={<ArrowRight20Regular />}
            iconPosition="after"
            disabled={!canGoNext()}
            onClick={handleNext}
          >
            Next
          </Button>
        )}
        
        {isLastStep && (
          <Button
            appearance="primary"
            icon={<Checkmark20Regular />}
            onClick={handleComplete}
          >
            Complete & Create Activity
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

## Step 1: Activity Basics

**File:** `frontend/src/components/Activity/ActivityWizard/Steps/Step1_Basics.tsx`

```typescript
import React from 'react';
import {
  Field,
  Input,
  Dropdown,
  Option,
  Text,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components';
import { useWizard } from '../Context/WizardContext';
import { ActivityType } from '../types/WizardTypes';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap(tokens.spacingVerticalXL),
  },
  
  card: {
    ...shorthands.padding(tokens.spacingVerticalXL),
    backgroundColor: '#f9fafb',
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    ...shorthands.border('1px', 'solid', '#e5e7eb'),
  },
  
  description: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
    marginBottom: tokens.spacingVerticalL,
  },
  
  activityTypeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    ...shorthands.gap(tokens.spacingHorizontalL),
    marginTop: tokens.spacingVerticalL,
  },
  
  activityTypeCard: {
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: '#ffffff',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border('2px', 'solid', '#e5e7eb'),
    cursor: 'pointer',
    ...shorthands.transition('all', '0.2s', 'ease'),
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
      ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
    },
  },
  
  activityTypeCardSelected: {
    ...shorthands.border('2px', 'solid', tokens.colorBrandForeground1),
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  
  activityTypeIcon: {
    fontSize: '32px',
    marginBottom: tokens.spacingVerticalS,
  },
  
  activityTypeTitle: {
    fontFamily: 'Poppins, system-ui, -apple-system, sans-serif',
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: tokens.spacingVerticalXS,
  },
  
  activityTypeDescription: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
});

const ACTIVITY_TYPES = [
  {
    type: 'migration' as ActivityType,
    icon: '🔄',
    title: 'Migration',
    description: 'Migrate clusters from VMware to Hyper-V',
  },
  {
    type: 'lifecycle' as ActivityType,
    icon: '📊',
    title: 'Lifecycle Refresh',
    description: 'Analyze and refresh aging infrastructure',
  },
  {
    type: 'decommission' as ActivityType,
    icon: '🗑️',
    title: 'Decommission',
    description: 'Retire and remove infrastructure',
  },
  {
    type: 'expansion' as ActivityType,
    icon: '📈',
    title: 'Expansion',
    description: 'Add capacity to existing clusters',
  },
  {
    type: 'maintenance' as ActivityType,
    icon: '🔧',
    title: 'Maintenance',
    description: 'Patching, firmware, and updates',
  },
];

export const Step1_Basics: React.FC = () => {
  const styles = useStyles();
  const { wizardData, updateStepData, validationErrors } = useWizard();
  
  const stepData = wizardData.step1 || {};
  
  const handleNameChange = (value: string) => {
    updateStepData(1, { activityName: value });
  };
  
  const handleTypeChange = (type: ActivityType) => {
    updateStepData(1, { activityType: type });
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Text className={styles.description}>
          Let's start by giving your activity a name and selecting its type. 
          This will determine the workflow and options available in the following steps.
        </Text>
        
        <Field
          label="Activity Name"
          required
          validationMessage={validationErrors.activityName}
          validationState={validationErrors.activityName ? 'error' : 'none'}
        >
          <Input
            value={stepData.activityName || ''}
            onChange={(e, data) => handleNameChange(data.value)}
            placeholder="e.g., VMware to Hyper-V Migration - Q1 2025"
            size="large"
          />
        </Field>
      </div>
      
      <div className={styles.card}>
        <Field
          label="Activity Type"
          required
          validationMessage={validationErrors.activityType}
          validationState={validationErrors.activityType ? 'error' : 'none'}
        >
          <div className={styles.activityTypeGrid}>
            {ACTIVITY_TYPES.map((actType) => (
              <div
                key={actType.type}
                className={`
                  ${styles.activityTypeCard}
                  ${stepData.activityType === actType.type ? styles.activityTypeCardSelected : ''}
                `}
                onClick={() => handleTypeChange(actType.type)}
              >
                <div className={styles.activityTypeIcon}>{actType.icon}</div>
                <div className={styles.activityTypeTitle}>{actType.title}</div>
                <div className={styles.activityTypeDescription}>{actType.description}</div>
              </div>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
};
```

---

## Remaining Steps Overview

### Step 2: Source & Destination
- Source cluster dropdown (from RVTools)
- Target cluster name input
- Hardware strategy selection (pool/new/domino)
- If domino: Show source cluster to free
- Fluent UI cards with glassmorphic styling

### Step 3: Infrastructure Configuration
- Infrastructure type selection (Traditional/HCI S2D/Azure Local)
- Real-time compatibility checker component
- Warning/error display with expandable details
- Override option for warnings

### Step 4: Hardware Selection
- Conditional based on Step 2 hardware strategy
- If "new": Hardware basket + model selection
- If "pool": Pool hardware selection
- If "domino": Confirm source cluster
- Quantity input with validation

### Step 5: Capacity Validation
- Workload analysis from RVTools
- CPU/Memory/Storage gauges
- Overcommit ratio configuration
- Recommendations display
- Expandable capacity visualizer

### Step 6: Timeline & Resources
- Start date picker
- Auto-calculated duration display
- Task breakdown visualization
- Team member assignment
- Dependency mapping (future)

### Step 7: Review & Confirm
- Summary cards for all steps
- Editable sections (click to go back)
- Validation status indicators
- Final notes textarea
- Create button with confirmation

---

## Shared Components

### CompatibilityChecker Component
- Real-time status display
- Collapsible check details
- Warning/error styling
- Override acknowledgment checkbox
- Fluent UI Progress components for checks

### CapacityValidator Component
- Resource gauge displays
- Color-coded status (green/yellow/red)
- Utilization percentages
- Recommendation list
- Expandable detailed view

### HardwareSelector Component
- Basket dropdown integration
- Model grid/list display
- Quantity selector
- Specifications preview
- Form factor filtering

### TimelineCalculator Component
- Duration estimation display
- Task breakdown list
- Critical path highlighting
- Gantt preview (mini)
- Date picker integration

---

## Type Definitions

**File:** `frontend/src/components/Activity/ActivityWizard/types/WizardTypes.ts`

```typescript
export type ActivityType = 'migration' | 'lifecycle' | 'decommission' | 'expansion' | 'maintenance';
export type HardwareStrategy = 'pool' | 'new' | 'domino';
export type InfrastructureType = 'traditional' | 'hci_s2d' | 'azure_local';

export interface WizardFormData {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
  step7?: Step7Data;
}

export interface Step1Data {
  activityName: string;
  activityType: ActivityType;
}

export interface Step2Data {
  sourceCluster: string;
  targetClusterName: string;
  hardwareStrategy: HardwareStrategy;
  dominoSourceCluster?: string;
}

export interface Step3Data {
  infrastructureType: InfrastructureType;
  compatibilityOverride?: boolean;
}

export interface Step4Data {
  hardwareBasketId?: string;
  selectedModels?: string[];
  hardwareQuantity?: number;
  poolHardware?: string[];
}

export interface Step5Data {
  capacityConfirmed: boolean;
  overcommitRatios?: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

export interface Step6Data {
  startDate: Date;
  estimatedDuration: number;
  taskAssignments?: TaskAssignment[];
}

export interface Step7Data {
  reviewConfirmed: boolean;
  notes?: string;
}

export interface TaskAssignment {
  taskName: string;
  assignee: string;
  duration: number;
}

export interface HardwareCompatibilityResult {
  status: 'passed' | 'warnings' | 'failed';
  checks: {
    rdma_nics: CheckResult;
    jbod_hba: CheckResult;
    network_speed: CheckResult;
    jbod_disks: CheckResult;
  };
  recommendations: string[];
  can_proceed: boolean;
}

export interface CheckResult {
  status: 'passed' | 'warning' | 'failed';
  message: string;
  details?: any;
}

export interface CapacityValidationResult {
  status: 'optimal' | 'acceptable' | 'warning' | 'critical';
  cpu: ResourceValidation;
  memory: ResourceValidation;
  storage: ResourceValidation;
  recommendations: string[];
}

export interface ResourceValidation {
  required: number;
  available: number;
  utilization_percent: number;
  status: 'ok' | 'warning' | 'critical';
  message: string;
}
```

---

## Testing Plan

### Unit Tests
- [ ] WizardContext state management
- [ ] Step validation logic
- [ ] Navigation flow
- [ ] Auto-save functionality
- [ ] Error handling

### Integration Tests
- [ ] Complete wizard flow (all 7 steps)
- [ ] Draft save and resume
- [ ] API integration
- [ ] Validation across steps
- [ ] Browser back/forward handling

### E2E Tests
- [ ] Full migration workflow
- [ ] Different activity types
- [ ] Error recovery
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard navigation)

---

## Implementation Checklist

### Week 1: Core Wizard
- [ ] WizardContext and state management
- [ ] Main ActivityWizard component
- [ ] WizardProgress component
- [ ] WizardNavigation component
- [ ] Step 1: Basics
- [ ] Step 2: Source & Destination
- [ ] Auto-save functionality
- [ ] Draft persistence

### Week 2: Advanced Steps & Polish
- [ ] Step 3: Infrastructure + Compatibility
- [ ] Step 4: Hardware Selection
- [ ] Step 5: Capacity Validation
- [ ] Step 6: Timeline
- [ ] Step 7: Review
- [ ] CompatibilityChecker component
- [ ] CapacityValidator component
- [ ] HardwareSelector component
- [ ] TimelineCalculator component
- [ ] Error handling & validation
- [ ] Loading states
- [ ] Responsive design
- [ ] Accessibility

---

## Design Consistency Notes

✅ **All components MUST follow:**
- Fluent UI 2 component library
- makeStyles for styling (no inline styles except for dynamic values)
- Poppins font family
- Token-based spacing and colors
- Glassmorphic cards with subtle shadows
- Smooth transitions (0.2s ease)
- Hover states with translateY(-2px)
- Consistent border radius and padding

❌ **DO NOT:**
- Use hardcoded colors
- Mix styling approaches
- Create custom components that duplicate Fluent UI
- Use excessive glassmorphic effects
- Break responsive design

---

**Status:** Ready for review  
**Next:** Proceed to Phase 1 implementation after approval
