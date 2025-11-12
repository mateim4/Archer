# Jules Agent Instructions - LCMDesigner

## Your Tasks

Implement UX improvements by completing these GitHub issues **in order**:

1. **Issue #86** - Short-Term UX Fixes (HIGH priority, start here)
2. **Issue #87** - Medium-Term Structural Enhancements  
3. **Issue #88** - Long-Term Strategic Improvements

**Each issue contains:** Complete implementation instructions, code templates, acceptance criteria, and testing checklists.

---

## Essential Context

**LCMDesigner** = React 18 + TypeScript infrastructure management platform with custom "Purple Glass" glassmorphic design system.

**Tech:** React 18.3, TypeScript 5.6, Vite 5.4, Zustand, Rust backend

---

## Critical Rules

### Purple Glass Components (MUST USE)
**Location:** `frontend/src/components/ui/`  
**Import:** `import { PurpleGlassButton, PurpleGlassInput, ... } from '@/components/ui'`

**Available:** Button, Card, Input, Textarea, Dropdown, Checkbox, Radio, RadioGroup, Switch, Breadcrumb

### Design Tokens (MUST USE)
**Location:** `frontend/src/styles/designSystem.ts`  
**Import:** `import { DesignTokens } from '../styles/designSystem'`  
**Use for:** ALL spacing, colors, typography, shadows, borders

### ✅ ALWAYS:
- Use Purple Glass components for ALL UI
- Use DesignTokens for ALL styling
- Maintain TypeScript strict mode
- Read `COMPONENT_LIBRARY_GUIDE.md` before coding

### ❌ NEVER:
- Use native HTML (`<button>`, `<input>`, `<select>`, `<textarea>`)
- Import Fluent UI components directly (except icons)
- Hardcode colors/spacing/typography
- Use makeStyles or inline CSS
- Break TypeScript compilation

---

## Quick Migration Reference

```typescript
// Fluent → Purple Glass
<Button appearance="primary"> → <PurpleGlassButton variant="primary" glass>
<Card> → <PurpleGlassCard variant="interactive" glass="medium">
<Input> → <PurpleGlassInput glass="light">
tokens.spacingVerticalL → DesignTokens.spacing.lg
```

---

## Documentation

- **Component APIs:** `COMPONENT_LIBRARY_GUIDE.md` (1,083 lines)
- **Migration patterns:** `FORM_COMPONENTS_MIGRATION.md` (846 lines)  
- **Code templates:** In GitHub issues #86, #87, #88
- **Project rules:** `.github/instructions/LCMDesigner_Code_Instructions_Generic.instructions.md`

---

## Workflow

1. Open Issue #86 → Read all tasks
2. Review `COMPONENT_LIBRARY_GUIDE.md`
3. Implement tasks sequentially (don't skip)
4. Test each change before moving forward
5. Use atomic commits: `git commit -m "refactor(view): replace Fluent with Purple Glass"`
6. When #86 complete → Move to #87 → Then #88

**All detailed instructions are in the issues. Read them carefully.**

**Objective:** Replace ALL Fluent UI components with Purple Glass equivalents.

**Files to Modify:**
1. `frontend/src/views/DashboardView.tsx` (877 lines)
2. `frontend/src/views/ProjectsView.tsx` (617 lines)
3. `frontend/src/views/ProjectDetailView.tsx` (658 lines)

**Step-by-Step Instructions:**

#### 1.1 Dashboard Table Migration (`DashboardView.tsx`)

**Current Issues (Lines 45-150):**
- Custom `SelectableTableRow` component instead of Purple Glass
- Custom `ResizableTableHeader` component
- Hardcoded checkbox styles: `className="rounded border-purple-500/30 text-purple-600"`
- Custom input: `className="lcm-input"` instead of `PurpleGlassInput`
- Custom buttons: `className="lcm-button fluent-button-secondary"`

**What to do:**
1. **Replace custom checkboxes:**
   ```typescript
   // ❌ REMOVE:
   <input type="checkbox" className="rounded border-purple-500/30 text-purple-600" />
   
   // ✅ REPLACE WITH:
   <PurpleGlassCheckbox 
     checked={isSelected}
     onChange={(e) => onToggleSelection(rowId)}
     glass="light"
   />
   ```

2. **Replace custom inputs:**
   ```typescript
   // ❌ REMOVE:
   <input className="lcm-input" placeholder="Filter VMs..." />
   
   // ✅ REPLACE WITH:
   <PurpleGlassInput
     placeholder="Filter VMs..."
     value={filter}
     onChange={(e) => setFilter(e.target.value)}
     prefixIcon={<FilterRegular />}
     glass="light"
   />
   ```

3. **Replace custom buttons:**
   ```typescript
   // ❌ REMOVE:
   <button className="lcm-button fluent-button-secondary">Action</button>
   
   // ✅ REPLACE WITH:
   <PurpleGlassButton variant="secondary" size="medium" glass>
     Action
   </PurpleGlassButton>
   ```

4. **Update imports:**
   ```typescript
   // Add at top of file:
   import { 
     PurpleGlassButton, 
     PurpleGlassInput, 
     PurpleGlassCheckbox,
     PurpleGlassCard
   } from '@/components/ui';
   ```

#### 1.2 Projects View Component Cleanup (`ProjectsView.tsx`)

**Current Issues (Lines 1-30, throughout file):**
- Heavy Fluent UI usage: `Title1`, `Title2`, `Button`, `Card`, `Badge`, `Dialog`
- `makeStyles` usage instead of design tokens
- Mixed Purple Glass and Fluent components

**What to do:**

1. **Remove ALL Fluent UI imports:**
   ```typescript
   // ❌ REMOVE THESE IMPORTS:
   import {
     Title1, Title2, Title3, Body1, Body2, Caption1,
     Button, Card, CardHeader, Badge, Avatar,
     Dialog, DialogSurface, DialogTitle, DialogContent, DialogBody, DialogActions,
     makeStyles, shorthands, tokens
   } from '@fluentui/react-components';
   
   // ✅ KEEP ONLY ICONS:
   import { AddRegular, SearchRegular, ... } from '@fluentui/react-icons';
   
   // ✅ ADD Purple Glass imports:
   import { 
     PurpleGlassButton, 
     PurpleGlassInput, 
     PurpleGlassTextarea,
     PurpleGlassCard,
     PurpleGlassCheckbox
   } from '@/components/ui';
   import { DesignTokens } from '../styles/designSystem';
   ```

2. **Replace Fluent Buttons with PurpleGlassButton:**
   ```typescript
   // ❌ REMOVE:
   <Button appearance="primary" icon={<AddRegular />}>Add New Project</Button>
   
   // ✅ REPLACE WITH:
   <PurpleGlassButton variant="primary" size="large" icon={<AddRegular />} glass>
     Add New Project
   </PurpleGlassButton>
   ```

3. **Replace Fluent Cards with PurpleGlassCard:**
   ```typescript
   // ❌ REMOVE:
   <Card className={styles.projectCard} onClick={handleClick}>
     {/* content */}
   </Card>
   
   // ✅ REPLACE WITH:
   <PurpleGlassCard variant="interactive" glass="medium" onClick={handleClick}>
     {/* content */}
   </PurpleGlassCard>
   ```

4. **Replace Typography components with styled divs:**
   ```typescript
   // ❌ REMOVE:
   <Title1 className={styles.headerTitle}>Projects</Title1>
   <Body2 className={styles.description}>{description}</Body2>
   
   // ✅ REPLACE WITH:
   <h1 style={DesignTokens.components.pageTitle}>Projects</h1>
   <p style={DesignTokens.components.cardDescription}>{description}</p>
   ```

5. **Replace Fluent Dialog with Purple Glass modal pattern:**
   ```typescript
   // ❌ REMOVE:
   <Dialog open={showCreateDialog}>
     <DialogSurface>
       <DialogBody>
         <DialogTitle>Create Project</DialogTitle>
         <DialogContent>{/* form */}</DialogContent>
         <DialogActions>
           <Button>Cancel</Button>
           <Button appearance="primary">Create</Button>
         </DialogActions>
       </DialogBody>
     </DialogSurface>
   </Dialog>
   
   // ✅ REPLACE WITH:
   <PurpleGlassCard 
     header="Create Project"
     glass="heavy"
     style={{ 
       position: 'fixed', 
       top: '50%', 
       left: '50%', 
       transform: 'translate(-50%, -50%)',
       zIndex: 1000,
       minWidth: '500px'
     }}
   >
     {/* form content */}
     <div style={{ display: 'flex', gap: DesignTokens.spacing.md, justifyContent: 'flex-end' }}>
       <PurpleGlassButton variant="secondary" onClick={onClose}>Cancel</PurpleGlassButton>
       <PurpleGlassButton variant="primary" onClick={handleSubmit}>Create</PurpleGlassButton>
     </div>
   </PurpleGlassCard>
   ```

6. **Remove makeStyles, use design tokens:**
   ```typescript
   // ❌ REMOVE:
   const useStyles = makeStyles({
     projectGrid: {
       display: 'grid',
       gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
       gap: tokens.spacingHorizontalXL
     }
   });
   
   // ✅ REPLACE WITH:
   const projectGridStyle = {
     display: 'grid',
     gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
     gap: DesignTokens.spacing.xl
   };
   ```

#### 1.3 Project Detail Standardization (`ProjectDetailView.tsx`)

**Current Issues:**
- Uses Fluent `<TabList>`, `<ProgressBar>`, `<Badge>`
- Mixes Fluent tokens (`tokens.spacingVerticalXL`) with DesignTokens

**What to do:**

1. **Replace Fluent TabList with custom tab navigation:**
   ```typescript
   // ❌ REMOVE:
   <TabList selectedValue={activeTab} onTabSelect={handleTabChange}>
     <Tab value="timeline">Timeline</Tab>
     <Tab value="activities">Activities</Tab>
   </TabList>
   
   // ✅ REPLACE WITH:
   <div style={{ 
     display: 'flex', 
     gap: DesignTokens.spacing.md,
     borderBottom: `1px solid ${DesignTokens.colors.gray200}`
   }}>
     {['timeline', 'activities', 'overview'].map(tab => (
       <button
         key={tab}
         onClick={() => setActiveTab(tab)}
         style={{
           padding: `${DesignTokens.spacing.md} ${DesignTokens.spacing.lg}`,
           background: activeTab === tab ? DesignTokens.colors.primary : 'transparent',
           color: activeTab === tab ? '#fff' : DesignTokens.colors.textPrimary,
           border: 'none',
           borderRadius: `${DesignTokens.borderRadius.md} ${DesignTokens.borderRadius.md} 0 0`,
           cursor: 'pointer',
           fontFamily: DesignTokens.typography.fontFamily,
           fontSize: DesignTokens.typography.base,
           fontWeight: activeTab === tab ? 600 : 400
         }}
       >
         {tab.charAt(0).toUpperCase() + tab.slice(1)}
       </button>
     ))}
   </div>
   ```

2. **Replace Fluent ProgressBar:**
   ```typescript
   // ❌ REMOVE:
   <ProgressBar value={progress / 100} />
   
   // ✅ REPLACE WITH:
   <div style={{ 
     width: '100%', 
     height: '8px', 
     background: DesignTokens.colors.gray200,
     borderRadius: DesignTokens.borderRadius.md,
     overflow: 'hidden'
   }}>
     <div style={{
       width: `${progress}%`,
       height: '100%',
       background: DesignTokens.colors.primary,
       transition: 'width 0.3s ease'
     }} />
   </div>
   ```

3. **Standardize spacing to use DesignTokens only:**
   ```typescript
   // ❌ REMOVE:
   padding: tokens.spacingVerticalXL
   
   // ✅ REPLACE WITH:
   padding: DesignTokens.spacing.xl
   ```

---

### Task 2: Form Validation Improvements

**Objective:** Implement real-time validation with field-level error display.

**Files to Create:**
1. `frontend/src/hooks/useFormValidation.ts` (NEW)

**Files to Modify:**
1. `frontend/src/components/ui/PurpleGlassInput.tsx`
2. `frontend/src/components/ui/PurpleGlassTextarea.tsx`
3. `frontend/src/views/ProjectsView.tsx`

**Step-by-Step Instructions:**

#### 2.1 Create useFormValidation Hook

**Create file:** `frontend/src/hooks/useFormValidation.ts`

```typescript
import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface FieldError {
  message: string;
}

export interface FormErrors {
  [field: string]: FieldError | null;
}

export interface TouchedFields {
  [field: string]: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    if (rules.required && (!value || value.toString().trim() === '')) {
      return `${fieldName} is required`;
    }

    if (rules.minLength && value.toString().length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.toString().length > rules.maxLength) {
      return `${fieldName} must be less than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value.toString())) {
      return `${fieldName} is invalid`;
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, [validationRules]);

  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Debounced validation (300ms)
    setTimeout(() => {
      if (touched[fieldName]) {
        const error = validateField(fieldName, value);
        setErrors(prev => ({ ...prev, [fieldName]: error ? { message: error } : null }));
      }
    }, 300);
  }, [touched, validateField]);

  const handleBlur = useCallback((fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, values[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error ? { message: error } : null }));
  }, [values, validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = { message: error };
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField, validationRules]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues
  };
}
```

#### 2.2 Update PurpleGlassInput to support validation

**Modify:** `frontend/src/components/ui/PurpleGlassInput.tsx`

Add these props to the component interface (they may already exist, verify first):
```typescript
export interface PurpleGlassInputProps {
  // ... existing props
  validationState?: 'default' | 'error' | 'warning' | 'success';
  helperText?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}
```

Ensure the component uses these props to show error styling and helper text.

#### 2.3 Update PurpleGlassTextarea for character count

**Modify:** `frontend/src/components/ui/PurpleGlassTextarea.tsx`

Add character counter functionality (it may already exist - verify in COMPONENT_LIBRARY_GUIDE.md):
```typescript
export interface PurpleGlassTextareaProps {
  // ... existing props
  showCharacterCount?: boolean;
  maxLength?: number;
}

// In component render:
{showCharacterCount && maxLength && (
  <div style={{
    fontSize: '12px',
    color: value.length >= maxLength * 0.9 
      ? DesignTokens.colors.warning 
      : DesignTokens.colors.textSecondary,
    marginTop: '4px'
  }}>
    {value.length}/{maxLength}
  </div>
)}
```

#### 2.4 Refactor Project Creation Form

**Modify:** `frontend/src/views/ProjectsView.tsx`

Replace the current validation approach:

```typescript
// ❌ REMOVE old validation:
const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault();
  const errors: string[] = [];
  if (!newProject.name.trim()) errors.push('Project name is required');
  // ... etc
};

// ✅ REPLACE WITH:
import { useFormValidation } from '../hooks/useFormValidation';

// Inside component:
const { values, errors, touched, handleChange, handleBlur, validateForm } = useFormValidation(
  { name: '', description: '', project_types: [] },
  {
    name: { 
      required: true, 
      minLength: 3, 
      maxLength: 100,
      custom: (value) => {
        const exists = projects.find(p => 
          p.name.toLowerCase() === value.trim().toLowerCase()
        );
        return exists ? 'A project with this name already exists' : null;
      }
    },
    description: { maxLength: 500 }
  }
);

const handleCreateProject = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return; // Errors shown inline
  }
  
  // Proceed with API call
};

// In JSX:
<PurpleGlassInput
  label="Project Name"
  value={values.name}
  onChange={(e) => handleChange('name', e.target.value)}
  onBlur={() => handleBlur('name')}
  validationState={errors.name ? 'error' : 'default'}
  helperText={touched.name && errors.name ? errors.name.message : ''}
  required
  glass="light"
/>

<PurpleGlassTextarea
  label="Description"
  value={values.description}
  onChange={(e) => handleChange('description', e.target.value)}
  onBlur={() => handleBlur('description')}
  validationState={errors.description ? 'error' : 'default'}
  helperText={touched.description && errors.description ? errors.description.message : ''}
  showCharacterCount
  maxLength={500}
  glass="light"
/>
```

---

### Task 3: Error Messaging Standardization

**Objective:** Create unified error toast system.

**Files to Create:**
1. `frontend/src/components/ui/PurpleGlassToast.tsx` (NEW)
2. `frontend/src/hooks/useErrorHandler.ts` (NEW)
3. `frontend/src/constants/errorMessages.ts` (NEW)

**Step-by-Step Instructions:**

#### 3.1 Create PurpleGlassToast Component

**Create file:** `frontend/src/components/ui/PurpleGlassToast.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { DismissRegular, CheckmarkCircleRegular, ErrorCircleRegular, WarningRegular, InfoRegular } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassToastProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onDismiss: () => void;
}

export const PurpleGlassToast: React.FC<PurpleGlassToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onDismiss
}) => {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (duration > 0 && !isHovered) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, isHovered, onDismiss]);

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckmarkCircleRegular />;
      case 'error': return <ErrorCircleRegular />;
      case 'warning': return <WarningRegular />;
      case 'info': return <InfoRegular />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { 
        bg: 'rgba(16, 185, 129, 0.1)', 
        border: DesignTokens.colors.success, 
        icon: DesignTokens.colors.success 
      };
      case 'error': return { 
        bg: 'rgba(239, 68, 68, 0.1)', 
        border: DesignTokens.colors.error, 
        icon: DesignTokens.colors.error 
      };
      case 'warning': return { 
        bg: 'rgba(245, 158, 11, 0.1)', 
        border: DesignTokens.colors.warning, 
        icon: DesignTokens.colors.warning 
      };
      case 'info': return { 
        bg: 'rgba(59, 130, 246, 0.1)', 
        border: DesignTokens.colors.primary, 
        icon: DesignTokens.colors.primary 
      };
    }
  };

  const colors = getColors();

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        minWidth: '320px',
        maxWidth: '400px',
        padding: DesignTokens.spacing.lg,
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.90))',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: `1px solid ${colors.border}`,
        borderRadius: DesignTokens.borderRadius.lg,
        boxShadow: DesignTokens.shadows.xl,
        display: 'flex',
        alignItems: 'flex-start',
        gap: DesignTokens.spacing.md,
        fontFamily: DesignTokens.typography.fontFamily,
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div style={{ fontSize: '20px', color: colors.icon, marginTop: '2px' }}>
        {getIcon()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: DesignTokens.typography.base,
          fontWeight: 600,
          color: DesignTokens.colors.textPrimary,
          marginBottom: message ? '4px' : 0
        }}>
          {title}
        </div>
        {message && (
          <div style={{
            fontSize: DesignTokens.typography.sm,
            color: DesignTokens.colors.textSecondary,
            lineHeight: '1.4'
          }}>
            {message}
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: DesignTokens.colors.textMuted,
          fontSize: '16px',
          lineHeight: 1
        }}
      >
        <DismissRegular />
      </button>
    </div>
  );
};

// Toast Container Component
export interface ToastItem {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message?: string;
  duration?: number;
}

export const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({ 
  toasts, 
  onDismiss 
}) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: DesignTokens.spacing.xl,
      right: DesignTokens.spacing.xl,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: DesignTokens.spacing.md
    }}>
      {toasts.map(toast => (
        <PurpleGlassToast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};
```

Add animation to your global CSS:
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

#### 3.2 Create useErrorHandler Hook

**Create file:** `frontend/src/hooks/useErrorHandler.ts`

```typescript
import { useState, useCallback } from 'react';
import { ToastItem } from '../components/ui/PurpleGlassToast';
import { ERROR_MESSAGES } from '../constants/errorMessages';

let toastIdCounter = 0;

export function useErrorHandler() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++toastIdCounter}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`[${context || 'Error'}]:`, error);

    const message = ERROR_MESSAGES[error.message] || error.message || 'An unexpected error occurred';
    
    showToast({
      type: 'error',
      title: 'Error',
      message,
      duration: 5000
    });
  }, [showToast]);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message, duration: 3000 });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message, duration: 5000 });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message, duration: 4000 });
  }, [showToast]);

  return {
    toasts,
    dismissToast,
    handleError,
    showSuccess,
    showWarning,
    showInfo
  };
}
```

#### 3.3 Create Error Messages Dictionary

**Create file:** `frontend/src/constants/errorMessages.ts`

```typescript
export const ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  'Failed to fetch': 'Unable to connect to the server. Please check your internet connection and try again.',
  'Network request failed': 'Network error. Please check your connection and retry.',
  
  // API errors
  'Failed to load projects': 'Unable to load projects. Please refresh the page or try again later.',
  'Failed to create project': 'Project creation failed. Please check your input and try again.',
  'Failed to update project': 'Could not save changes. Please try again.',
  'Failed to delete project': 'Unable to delete project. Please try again.',
  
  // File upload errors
  'Failed to process VMware file': 'Could not process the VMware file. Please ensure it\'s a valid RVTools export.',
  'File too large': 'File size exceeds 50MB limit. Please use a smaller file.',
  'Invalid file format': 'File format not supported. Please upload a valid .xlsx or .csv file.',
  
  // Validation errors
  'Project name already exists': 'A project with this name already exists. Please choose a different name.',
  'Invalid input': 'Please check your input and try again.',
  
  // Authorization errors
  'Unauthorized': 'Session expired. Please log in again.',
  'Forbidden': 'You don\'t have permission to perform this action.',
  
  // Default
  'default': 'An unexpected error occurred. Please try again or contact support if the problem persists.'
};
```

#### 3.4 Update Views to Use Error Handler

**Modify:** `frontend/src/views/DashboardView.tsx`

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ToastContainer } from '../components/ui/PurpleGlassToast';

// Inside component:
const { toasts, dismissToast, handleError, showSuccess } = useErrorHandler();

// Replace console.error with handleError:
onError={(error: string) => {
  handleError(new Error(error), 'File Upload');
}}

// Add ToastContainer at end of component JSX:
return (
  <div>
    {/* existing content */}
    <ToastContainer toasts={toasts} onDismiss={dismissToast} />
  </div>
);
```

**Modify:** `frontend/src/views/ProjectsView.tsx`

Replace Fluent MessageBar with toast:
```typescript
// ❌ REMOVE:
{error && (
  <MessageBar intent="error">
    <MessageBarTitle>Error</MessageBarTitle>
    {error}
  </MessageBar>
)}

// ✅ REPLACE WITH:
const { toasts, dismissToast, handleError, showSuccess } = useErrorHandler();

// In catch blocks:
catch (error) {
  handleError(error, 'Create Project');
}

// On success:
showSuccess('Project created', 'Your project has been created successfully.');

// Add ToastContainer at end
```

---

### Task 4: Loading State Consistency

**Files to Create:**
1. `frontend/src/components/ui/PurpleGlassSpinner.tsx` (NEW)
2. `frontend/src/components/ui/PurpleGlassSkeleton.tsx` (NEW)

**Step-by-Step Instructions:**

#### 4.1 Create PurpleGlassSpinner

**Create file:** `frontend/src/components/ui/PurpleGlassSpinner.tsx`

```typescript
import React from 'react';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  fullPage?: boolean;
}

export const PurpleGlassSpinner: React.FC<PurpleGlassSpinnerProps> = ({
  size = 'medium',
  message,
  fullPage = false
}) => {
  const dimensions = {
    small: '24px',
    medium: '40px',
    large: '64px'
  };

  const spinnerSize = dimensions[size];

  const spinner = (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(139, 92, 246, 0.2)',
          borderTop: `3px solid ${DesignTokens.colors.primary}`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: message ? '0 auto 12px' : '0 auto'
        }}
        role="status"
        aria-label={message || 'Loading'}
      />
      {message && (
        <div style={{
          fontSize: DesignTokens.typography.sm,
          color: DesignTokens.colors.textSecondary,
          fontFamily: DesignTokens.typography.fontFamily
        }}>
          {message}
        </div>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 9998
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
};
```

Add spin animation to global CSS:
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

#### 4.2 Create PurpleGlassSkeleton

**Create file:** `frontend/src/components/ui/PurpleGlassSkeleton.tsx`

```typescript
import React from 'react';
import { DesignTokens } from '../../styles/designSystem';

export interface PurpleGlassSkeletonProps {
  variant: 'text' | 'card' | 'table-row' | 'avatar';
  width?: string;
  height?: string;
  count?: number;
}

export const PurpleGlassSkeleton: React.FC<PurpleGlassSkeletonProps> = ({
  variant,
  width,
  height,
  count = 1
}) => {
  const getSkeletonStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(139, 92, 246, 0.05) 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: DesignTokens.borderRadius.md
    };

    switch (variant) {
      case 'text':
        return { ...baseStyle, height: '16px', width: width || '100%' };
      case 'card':
        return { ...baseStyle, height: height || '200px', width: width || '100%' };
      case 'table-row':
        return { ...baseStyle, height: '48px', width: width || '100%' };
      case 'avatar':
        return { ...baseStyle, height: '40px', width: '40px', borderRadius: '50%' };
    }
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} style={getSkeletonStyle()} />
  ));

  if (count === 1) {
    return skeletons[0];
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: DesignTokens.spacing.md }}>
      {skeletons}
    </div>
  );
};
```

Add shimmer animation to global CSS:
```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### 4.3 Replace All Loading States

**ProjectsView.tsx:**
```typescript
// ❌ REMOVE:
if (loading) {
  return (
    <div>
      <Spinner size="large" label="Loading projects..." />
    </div>
  );
}

// ✅ REPLACE WITH:
if (loading) {
  return (
    <div style={DesignTokens.components.pageContainer}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: DesignTokens.spacing.xl }}>
        <PurpleGlassSkeleton variant="card" count={6} />
      </div>
    </div>
  );
}
```

**DashboardView.tsx:**
```typescript
// ❌ REMOVE:
<LoadingSpinner message="Loading dashboard..." />

// ✅ REPLACE WITH:
<PurpleGlassSpinner size="large" message="Processing file..." fullPage />
```

---

### Task 5: Table Pagination

**Files to Create:**
1. `frontend/src/components/ui/PurpleGlassPagination.tsx` (NEW)
2. `frontend/src/hooks/useTablePagination.ts` (NEW)

**Step-by-Step Instructions:**

#### 5.1 Create Pagination Component

**Create file:** `frontend/src/components/ui/PurpleGlassPagination.tsx`

```typescript
import React from 'react';
import { ChevronLeftRegular, ChevronRightRegular, ChevronDoubleLeftRegular, ChevronDoubleRightRegular } from '@fluentui/react-icons';
import { DesignTokens } from '../../styles/designSystem';
import { PurpleGlassButton } from './PurpleGlassButton';
import { PurpleGlassDropdown } from './PurpleGlassDropdown';

export interface PurpleGlassPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export const PurpleGlassPagination: React.FC<PurpleGlassPaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [25, 50, 100, 200]
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: DesignTokens.spacing.lg,
      flexWrap: 'wrap',
      gap: DesignTokens.spacing.md,
      fontFamily: DesignTokens.typography.fontFamily
    }}>
      {/* Items per page */}
      <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.sm }}>
        <span style={{ fontSize: DesignTokens.typography.sm, color: DesignTokens.colors.textSecondary }}>
          Items per page:
        </span>
        <PurpleGlassDropdown
          options={itemsPerPageOptions.map(num => ({ value: String(num), label: String(num) }))}
          value={String(itemsPerPage)}
          onChange={(value) => onItemsPerPageChange(Number(value))}
          glass="light"
        />
      </div>

      {/* Page info */}
      <div style={{ fontSize: DesignTokens.typography.sm, color: DesignTokens.colors.textSecondary }}>
        {startItem}-{endItem} of {totalItems} items
      </div>

      {/* Page navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: DesignTokens.spacing.xs }}>
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronDoubleLeftRegular />}
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="First page"
        />
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronLeftRegular />}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        />

        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: DesignTokens.colors.textMuted }}>
              ...
            </span>
          ) : (
            <PurpleGlassButton
              key={page}
              variant={currentPage === page ? 'primary' : 'ghost'}
              size="small"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </PurpleGlassButton>
          )
        ))}

        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronRightRegular />}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        />
        <PurpleGlassButton
          variant="ghost"
          size="small"
          icon={<ChevronDoubleRightRegular />}
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Last page"
        />
      </div>
    </div>
  );
};
```

#### 5.2 Create Pagination Hook

**Create file:** `frontend/src/hooks/useTablePagination.ts`

```typescript
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PaginationResult<T> {
  paginatedData: T[];
  pageInfo: {
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
    totalItems: number;
    startIndex: number;
    endIndex: number;
  };
  goToPage: (page: number) => void;
  setItemsPerPage: (itemsPerPage: number) => void;
}

export function useTablePagination<T>(
  data: T[],
  defaultItemsPerPage: number = 50
): PaginationResult<T> {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });

  const [itemsPerPage, setItemsPerPageState] = useState(() => {
    const limitParam = searchParams.get('limit');
    return limitParam ? parseInt(limitParam, 10) : defaultItemsPerPage;
  });

  // Update URL when page/limit changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(currentPage));
    newParams.set('limit', String(itemsPerPage));
    setSearchParams(newParams, { replace: true });
  }, [currentPage, itemsPerPage]);

  const totalPages = Math.ceil(data.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
  }, [totalPages]);

  const setItemsPerPage = useCallback((newItemsPerPage: number) => {
    setItemsPerPageState(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  }, []);

  return {
    paginatedData,
    pageInfo: {
      currentPage,
      totalPages,
      itemsPerPage,
      totalItems: data.length,
      startIndex: (currentPage - 1) * itemsPerPage,
      endIndex: Math.min(currentPage * itemsPerPage, data.length)
    },
    goToPage,
    setItemsPerPage
  };
}
```

#### 5.3 Update Dashboard Tables

**Modify:** `frontend/src/views/DashboardView.tsx`

```typescript
import { useTablePagination } from '../hooks/useTablePagination';
import { PurpleGlassPagination } from '../components/ui/PurpleGlassPagination';

// For VM Inventory table:
const VMInventoryTable = () => {
  const allVMs = currentEnvironment?.clusters?.flatMap((cluster: any) => 
    (cluster.vms || []).map((vm: any) => ({
      ...vm,
      cluster_name: cluster.name
    }))
  ) || [];

  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredVMs = allVMs.filter((vm: any) => 
    vm.name?.toLowerCase().includes(filter.toLowerCase()) ||
    vm.cluster_name?.toLowerCase().includes(filter.toLowerCase()) ||
    vm.guest_os?.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedVMs = [...filteredVMs].sort((a: any, b: any) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    const comparison = aVal.toString().localeCompare(bVal.toString());
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // ✅ ADD PAGINATION:
  const { paginatedData, pageInfo, goToPage, setItemsPerPage } = useTablePagination(sortedVMs, 50);

  return (
    <div>
      {/* Filter controls */}
      
      {/* Table */}
      <table>
        <thead>{/* headers */}</thead>
        <tbody>
          {/* ❌ REMOVE: {sortedVMs.slice(0, 50).map(...)} */}
          {/* ✅ REPLACE WITH: */}
          {paginatedData.map((vm: any, index: number) => (
            <tr key={index}>{/* row content */}</tr>
          ))}
        </tbody>
      </table>

      {/* ✅ ADD PAGINATION COMPONENT: */}
      {sortedVMs.length > 25 && (
        <PurpleGlassPagination
          currentPage={pageInfo.currentPage}
          totalPages={pageInfo.totalPages}
          itemsPerPage={pageInfo.itemsPerPage}
          totalItems={pageInfo.totalItems}
          onPageChange={goToPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}
    </div>
  );
};
```

Do the same for Host Inventory table.

---

## Verification & Testing

After implementing all tasks, verify the following:

### Design System Migration
- [ ] Zero Fluent UI component imports in view files (except icons)
- [ ] All buttons use `PurpleGlassButton`
- [ ] All inputs use `PurpleGlassInput`
- [ ] All cards use `PurpleGlassCard`
- [ ] No hardcoded colors/spacing (use `DesignTokens`)
- [ ] TypeScript compiles with zero errors

### Form Validation
- [ ] Real-time validation works (300ms debounce)
- [ ] Field-level errors display inline
- [ ] Character counter shows on description field
- [ ] Form cannot be submitted with errors
- [ ] Tab navigation works through form fields

### Error Messaging
- [ ] Toast appears for all errors
- [ ] Toast auto-dismisses after 5 seconds
- [ ] User can manually dismiss toast
- [ ] Multiple toasts stack correctly
- [ ] Error messages are user-friendly

### Loading States
- [ ] Spinner shows during file processing
- [ ] Skeleton loaders show when loading lists
- [ ] All loading states use Purple Glass components
- [ ] Loading states have accessible labels

### Pagination
- [ ] Tables show 25/50/100/200 items per page
- [ ] Page navigation works (first, prev, next, last)
- [ ] Pagination state persists in URL
- [ ] Filtering/sorting maintained across pages
- [ ] Keyboard navigation works (arrow keys)

---

## Commit Strategy

Make frequent, atomic commits with descriptive messages:

```bash
git commit -m "refactor(dashboard): replace custom checkboxes with PurpleGlassCheckbox"
git commit -m "refactor(projects): remove Fluent UI, use Purple Glass components"
git commit -m "feat(forms): add useFormValidation hook with real-time validation"
git commit -m "feat(ui): create PurpleGlassToast component"
git commit -m "feat(ui): create PurpleGlassSpinner and skeleton loaders"
git commit -m "feat(tables): add PurpleGlassPagination component"
git commit -m "refactor(dashboard): implement table pagination with URL state"
```

---

## Important Notes

1. **Read COMPONENT_LIBRARY_GUIDE.md** before implementing - it contains complete API documentation
2. **Test incrementally** - test each component replacement before moving to the next
3. **Maintain TypeScript strict mode** - no `any` types unless absolutely necessary
4. **Follow existing code patterns** - match the coding style you see in other files
5. **Preserve accessibility** - maintain ARIA labels and keyboard navigation
6. **Keep Purple Glass aesthetic** - all new components must match the glassmorphic design

---

## Success Criteria for Issue #86

- ✅ 95%+ of UI uses Purple Glass components (no Fluent UI)
- ✅ All forms have real-time validation with field-level errors
- ✅ All errors shown via toast notifications
- ✅ All loading states use PurpleGlassSpinner or PurpleGlassSkeleton
- ✅ All tables with >25 items have pagination
- ✅ TypeScript compiles without errors
- ✅ No visual regressions (matches Purple Glass aesthetic)
- ✅ All acceptance criteria in Issue #86 met

Good luck! You have all the context and detailed instructions needed to successfully implement these improvements.
