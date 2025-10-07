# Issue 3: Add Activity Modal Implementation

## 🎯 Overview
Fix the broken Add Activity modal and implement a complete activity creation form following our design system and Fluent UI 2 standards.

## 📍 Context
**URL Example**: `http://localhost:1420/app/projects/proj-2`
**Trigger**: Click "Add Activity" button in project view
**Files**: 
- `frontend/src/views/ProjectWorkspaceView.tsx`
- Potentially: `frontend/src/components/AddActivityModal.tsx` (may need to be created)

## 🔍 Current State vs. Desired State

### Current Issues:
1. ❌ Modal opens but is completely transparent
2. ❌ No content visible inside the modal
3. ❌ No form fields for activity creation
4. ❌ Non-functional - cannot create activities

### Desired State:
1. ✅ Modal has proper glassmorphic background with backdrop blur
2. ✅ Complete form with all required fields:
   - Activity Name (text input)
   - Activity Class (dropdown with predefined values)
   - Start Date (date picker)
   - End Date (date picker)
   - Assignee (dropdown or searchable select)
   - Description (optional textarea)
   - Initial Status (dropdown: pending, in_progress, completed, blocked)
3. ✅ Form validation with error messages
4. ✅ Functional Create and Cancel buttons
5. ✅ Modal follows our design system aesthetic

## 📋 Acceptance Criteria

### Modal Structure:
- [ ] Modal backdrop: `rgba(0, 0, 0, 0.5)` with blur effect
- [ ] Modal card: Glassmorphic styling matching `.lcm-card`
- [ ] Modal width: 600px (responsive on mobile)
- [ ] Modal padding: 24px
- [ ] Close button (X) in top-right corner

### Form Fields (Required):
- [ ] **Activity Name**: 
  - Text input with `.lcm-input` class
  - Placeholder: "Enter activity name"
  - Validation: Required, min 3 characters
  
- [ ] **Activity Class**: 
  - Dropdown with `.lcm-dropdown` class
  - Options (refer to documentation for accurate values):
    - `design` - Design Phase
    - `development` - Development Phase
    - `testing` - Testing & QA
    - `deployment` - Deployment Phase
    - `review` - Review & Approval
    - `research` - Research & Planning
    - `documentation` - Documentation
    - `maintenance` - Maintenance & Support
  - Validation: Required
  
- [ ] **Start Date**: 
  - Date picker component
  - Default: Today's date
  - Validation: Required, cannot be in the past
  
- [ ] **End Date**: 
  - Date picker component
  - Validation: Required, must be after start date
  
- [ ] **Assignee**: 
  - Dropdown or searchable select
  - Options: List of team members (fetch from backend or use existing assignees)
  - Allow creating new assignee
  - Validation: Required

### Form Fields (Optional):
- [ ] **Description**: Textarea, max 500 characters
- [ ] **Initial Status**: Dropdown (default: "pending")
- [ ] **Priority**: Dropdown (Low, Medium, High)
- [ ] **Tags**: Multi-select or tag input

### Form Actions:
- [ ] **Create Button**: 
  - Purple gradient button (`.lcm-button`)
  - Disabled until form is valid
  - Shows loading state on submit
  - On success: Close modal, refresh activity list, show success toast
  
- [ ] **Cancel Button**: 
  - Secondary button style
  - Closes modal without saving
  - Asks for confirmation if form has unsaved changes

### Form Validation:
- [ ] Real-time validation on field blur
- [ ] Error messages appear below invalid fields
- [ ] Red border on invalid inputs
- [ ] Submit button disabled when form is invalid
- [ ] Display validation summary at top if submission fails

## 🎨 Design System Constraints

### MUST USE:
```tsx
// Modal Container
<Dialog 
  open={isModalOpen} 
  onOpenChange={setIsModalOpen}
  className="add-activity-modal"
>
  <DialogSurface className="lcm-card" style={{ width: '600px', padding: '24px' }}>
    <DialogTitle>Add New Activity</DialogTitle>
    <DialogBody>
      {/* Form fields here */}
    </DialogBody>
    <DialogActions>
      <Button className="lcm-button" onClick={handleCreate}>Create Activity</Button>
      <Button appearance="secondary" onClick={handleCancel}>Cancel</Button>
    </DialogActions>
  </DialogSurface>
</Dialog>

// Input styling
<input 
  className="lcm-input" 
  type="text" 
  placeholder="Enter activity name"
  value={activityName}
  onChange={(e) => setActivityName(e.target.value)}
/>

// Dropdown styling
<select className="lcm-dropdown" value={activityClass} onChange={(e) => setActivityClass(e.target.value)}>
  <option value="">Select class...</option>
  <option value="design">Design Phase</option>
  <option value="development">Development Phase</option>
  {/* ... */}
</select>
```

### CSS Classes:
```css
.add-activity-modal .lcm-card {
  background: var(--lcm-bg-card);
  backdrop-filter: var(--lcm-backdrop-filter);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(139, 92, 246, 0.2);
}

.form-field {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  font-family: 'Poppins', sans-serif;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}
```

### DO NOT:
- ❌ Use Fluent UI v8 components (use v9 only)
- ❌ Use `any` type in TypeScript
- ❌ Skip form validation
- ❌ Hardcode activity class options (document source of truth)

## 🔧 Implementation Guidance

### Files to Modify/Create:
1. **Create**: `frontend/src/components/AddActivityModal.tsx`
   - Export `AddActivityModal` component
   - Props: `isOpen: boolean`, `onClose: () => void`, `onActivityCreated: (activity: Activity) => void`, `projectId: string`
   
2. **Modify**: `frontend/src/views/ProjectWorkspaceView.tsx`
   - Import and render `AddActivityModal`
   - Add state: `const [isAddModalOpen, setIsAddModalOpen] = useState(false)`
   - Wire up Add Activity button: `onClick={() => setIsAddModalOpen(true)}`
   - Handle activity creation callback

3. **Backend Integration**:
   - POST to `/api/projects/:projectId/activities`
   - Payload: `{ name, class, startDate, endDate, assignee, description, status, priority }`
   - On success: Add new activity to state and close modal

### State Management:
```tsx
interface ActivityFormData {
  name: string;
  class: string;
  startDate: Date;
  endDate: Date;
  assignee: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
}

const [formData, setFormData] = useState<ActivityFormData>({
  name: '',
  class: '',
  startDate: new Date(),
  endDate: new Date(),
  assignee: '',
  status: 'pending'
});

const [errors, setErrors] = useState<Partial<Record<keyof ActivityFormData, string>>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
```

### Validation Logic:
```tsx
const validateForm = (): boolean => {
  const newErrors: Partial<Record<keyof ActivityFormData, string>> = {};
  
  if (!formData.name || formData.name.length < 3) {
    newErrors.name = 'Activity name must be at least 3 characters';
  }
  
  if (!formData.class) {
    newErrors.class = 'Activity class is required';
  }
  
  if (formData.endDate <= formData.startDate) {
    newErrors.endDate = 'End date must be after start date';
  }
  
  if (!formData.assignee) {
    newErrors.assignee = 'Assignee is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

## ✅ Testing Requirements

### Functional Testing:
1. Click "Add Activity" button
2. Verify modal opens with visible content
3. Fill out all required fields
4. Test validation:
   - Leave name empty → Error message
   - Set end date before start date → Error message
   - Select activity class → No error
5. Click "Create Activity"
6. Verify new activity appears in Activities tab
7. Verify modal closes after successful creation
8. Test "Cancel" button closes modal without saving

### Visual Testing:
1. Modal has glassmorphic background
2. All inputs use `.lcm-input` styling
3. Dropdown uses `.lcm-dropdown` styling
4. Create button has purple gradient
5. Error messages are red and visible below fields
6. Modal is responsive on mobile (< 768px width)

### Edge Cases:
- [ ] Test with very long activity names (>100 chars)
- [ ] Test with special characters in name
- [ ] Test date picker on different locales
- [ ] Test with network errors (API fails)
- [ ] Test closing modal with unsaved changes

## 📚 References
- **Activity Class Documentation**: Check backend schema or existing activity data for canonical list
- Fluent UI v9 Dialog: https://react.fluentui.dev/?path=/docs/components-dialog--default
- Date picker component: Check if one exists in `frontend/src/components/` or use Fluent UI DatePicker
- Form validation patterns: Review other forms in the app
- Design system: `frontend/src/fluent-enhancements.css`

---

**Assignee**: @copilot-async
**Priority**: Critical
**Labels**: `modal`, `forms`, `bug-fix`, `feature`, `design-system`
