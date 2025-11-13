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
