import { describe, it, expect } from 'vitest';

// Mock activity form data and error state for testing
interface ActivityForm {
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  assignees: string[];
}

/**
 * validateActivityForm - Validates the create/edit activity form
 * Returns true if valid, false if there are errors
 * Mutates formErrors record with validation messages
 */
function validateActivityForm(
  activityForm: ActivityForm,
  setFormErrors: (errors: Record<string, string>) => void
): boolean {
  const errors: Record<string, string> = {};

  if (!activityForm.name || activityForm.name.trim().length < 3) {
    errors.name = 'Activity name must be at least 3 characters';
  }

  if (!activityForm.type) {
    errors.type = 'Activity type is required';
  }

  if (!activityForm.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!activityForm.endDate) {
    errors.endDate = 'End date is required';
  } else if (new Date(activityForm.endDate) <= new Date(activityForm.startDate)) {
    errors.endDate = 'End date must be after start date';
  }

  if (!activityForm.assignees || activityForm.assignees.length === 0) {
    errors.assignee = 'At least one assignee is required';
  }

  setFormErrors(errors);
  return Object.keys(errors).length === 0;
}

describe('validateActivityForm', () => {
  it('should return true for a valid activity form', () => {
    const validForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(validForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(true);
    expect(Object.keys(capturedErrors)).toHaveLength(0);
  });

  it('should return false and set error when activity name is too short', () => {
    const invalidForm: ActivityForm = {
      name: 'AB', // Only 2 characters
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.name).toBe('Activity name must be at least 3 characters');
  });

  it('should return false and set error when activity name is missing', () => {
    const invalidForm: ActivityForm = {
      name: '',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.name).toBe('Activity name must be at least 3 characters');
  });

  it('should return false and set error when activity type is missing', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: '',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.type).toBe('Activity type is required');
  });

  it('should return false and set error when start date is missing', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.startDate).toBe('Start date is required');
  });

  it('should return false and set error when end date is missing', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.endDate).toBe('End date is required');
  });

  it('should return false and set error when end date is before or equal to start date', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-02-01',
      endDate: '2024-01-15', // Before start date
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.endDate).toBe('End date must be after start date');
  });

  it('should return false and set error when end date equals start date', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-01-15', // Same as start date
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.endDate).toBe('End date must be after start date');
  });

  it('should return false and set error when assignees array is empty', () => {
    const invalidForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: []
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.assignee).toBe('At least one assignee is required');
  });

  it('should accumulate multiple errors when multiple fields are invalid', () => {
    const invalidForm: ActivityForm = {
      name: 'AB', // Too short
      type: '',   // Missing
      startDate: '2024-02-01',
      endDate: '2024-01-15', // Before start date
      assignees: [] // Empty
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(invalidForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(Object.keys(capturedErrors).length).toBeGreaterThan(1);
    expect(capturedErrors.name).toBeDefined();
    expect(capturedErrors.type).toBeDefined();
    expect(capturedErrors.endDate).toBeDefined();
    expect(capturedErrors.assignee).toBeDefined();
  });

  it('should accept multiple assignees as valid', () => {
    const validForm: ActivityForm = {
      name: 'Infrastructure Assessment',
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com', 'jane.smith@company.com', 'bob.wilson@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(validForm, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(true);
    expect(Object.keys(capturedErrors)).toHaveLength(0);
  });

  it('should trim whitespace from activity name before validation', () => {
    const formWithWhitespace: ActivityForm = {
      name: '   ', // Only whitespace
      type: 'migration',
      startDate: '2024-01-15',
      endDate: '2024-02-01',
      assignees: ['john.doe@company.com']
    };

    let capturedErrors: Record<string, string> = {};
    const result = validateActivityForm(formWithWhitespace, (errors) => {
      capturedErrors = errors;
    });

    expect(result).toBe(false);
    expect(capturedErrors.name).toBe('Activity name must be at least 3 characters');
  });
});
