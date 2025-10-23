use crate::models::hld::{VariableDefinition, VariableValue, VariableType};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a validation error with field name and message
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ValidationError {
    pub field: String,
    pub message: String,
}

impl ValidationError {
    pub fn new(field: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            field: field.into(),
            message: message.into(),
        }
    }
}

/// Result type for validation operations
pub type ValidationResult<T> = Result<T, Vec<ValidationError>>;

/// Main validation service for HLD variables
pub struct VariableValidator;

impl VariableValidator {
    /// Validate a single variable against its definition
    /// 
    /// # Arguments
    /// * `definition` - The variable definition with validation rules
    /// * `value` - The actual value to validate
    /// * `all_variables` - Map of all variables for dependency checking
    /// 
    /// # Returns
    /// * `Ok(())` if validation passes
    /// * `Err(Vec<ValidationError>)` if validation fails with one or more errors
    pub fn validate_variable(
        definition: &VariableDefinition,
        value: &Option<VariableValue>,
        all_variables: &HashMap<String, VariableValue>,
    ) -> ValidationResult<()> {
        let mut errors = Vec::new();

        // Check required field
        if definition.validation.required {
            if let Some(val) = value {
                if val.is_null() {
                    errors.push(ValidationError::new(
                        &definition.name,
                        format!("Field '{}' is required", definition.name),
                    ));
                }
            } else {
                errors.push(ValidationError::new(
                    &definition.name,
                    format!("Field '{}' is required", definition.name),
                ));
            }
        }

        // If value is None or Null, skip further validation (unless required check already failed)
        let val = match value {
            Some(v) if !v.is_null() => v,
            _ => {
                return if errors.is_empty() {
                    Ok(())
                } else {
                    Err(errors)
                };
            }
        };

        // Type validation
        let actual_type = val.get_type();
        let expected_type = &definition.var_type;
        if &actual_type != expected_type {
            errors.push(ValidationError::new(
                &definition.name,
                format!(
                    "Type mismatch: expected '{}', got '{}'",
                    expected_type.to_str(),
                    actual_type.to_str()
                ),
            ));
        }

        // Numeric range validation (for Integer and Float)
        if matches!(definition.var_type, VariableType::Integer | VariableType::Float) {
            if let Some(min_val) = definition.validation.min_value {
                let num_value = match val {
                    VariableValue::Integer(n) => *n as f64,
                    VariableValue::Float(f) => *f,
                    _ => 0.0,
                };
                if num_value < min_val {
                    errors.push(ValidationError::new(
                        &definition.name,
                        format!(
                            "Value {} is below minimum {}",
                            num_value, min_val
                        ),
                    ));
                }
            }
            if let Some(max_val) = definition.validation.max_value {
                let num_value = match val {
                    VariableValue::Integer(n) => *n as f64,
                    VariableValue::Float(f) => *f,
                    _ => 0.0,
                };
                if num_value > max_val {
                    errors.push(ValidationError::new(
                        &definition.name,
                        format!(
                            "Value {} exceeds maximum {}",
                            num_value, max_val
                        ),
                    ));
                }
            }
        }

        // String length validation
        if definition.var_type == VariableType::String {
            if let VariableValue::String(s) = val {
                if let Some(min_len) = definition.validation.min_length {
                    if s.len() < min_len {
                        errors.push(ValidationError::new(
                            &definition.name,
                            format!(
                                "String length {} is below minimum {}",
                                s.len(),
                                min_len
                            ),
                        ));
                    }
                }
                if let Some(max_len) = definition.validation.max_length {
                    if s.len() > max_len {
                        errors.push(ValidationError::new(
                            &definition.name,
                            format!(
                                "String length {} exceeds maximum {}",
                                s.len(),
                                max_len
                            ),
                        ));
                    }
                }
            }
        }

        // Pattern validation (regex)
        if let Some(pattern) = &definition.validation.pattern {
            if let VariableValue::String(s) = val {
                match Regex::new(pattern) {
                    Ok(re) => {
                        if !re.is_match(s) {
                            errors.push(ValidationError::new(
                                &definition.name,
                                format!(
                                    "Value '{}' does not match required pattern '{}'",
                                    s, pattern
                                ),
                            ));
                        }
                    }
                    Err(e) => {
                        errors.push(ValidationError::new(
                            &definition.name,
                            format!("Invalid regex pattern '{}': {}", pattern, e),
                        ));
                    }
                }
            }
        }

        // Enum validation
        if let Some(enum_values) = &definition.validation.enum_values {
            if !enum_values.is_empty() {
                let value_str = val.to_string();
                if !enum_values.contains(&value_str) {
                    errors.push(ValidationError::new(
                        &definition.name,
                        format!(
                            "Value '{}' is not in allowed values: [{}]",
                            value_str,
                            enum_values.join(", ")
                        ),
                    ));
                }
            }
        }

        // Dependency validation
        for dep in &definition.validation.depends_on {
            if !all_variables.contains_key(dep) {
                errors.push(ValidationError::new(
                    &definition.name,
                    format!(
                        "Dependency '{}' is missing for field '{}'",
                        dep, definition.name
                    ),
                ));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    /// Validate multiple variables at once
    /// 
    /// # Arguments
    /// * `definitions` - Map of variable definitions (name -> definition)
    /// * `values` - Map of variable values (name -> value)
    /// 
    /// # Returns
    /// * `Ok(())` if all validations pass
    /// * `Err(Vec<ValidationError>)` with all validation errors
    pub fn validate_all(
        definitions: &HashMap<String, VariableDefinition>,
        values: &HashMap<String, VariableValue>,
    ) -> ValidationResult<()> {
        let mut all_errors = Vec::new();

        for (name, definition) in definitions {
            let value = values.get(name).cloned();
            match Self::validate_variable(definition, &value, values) {
                Ok(_) => {}
                Err(mut errors) => {
                    all_errors.append(&mut errors);
                }
            }
        }

        if all_errors.is_empty() {
            Ok(())
        } else {
            Err(all_errors)
        }
    }

    /// Validate only required fields are present
    /// Quick check for form submission
    pub fn validate_required_only(
        definitions: &HashMap<String, VariableDefinition>,
        values: &HashMap<String, VariableValue>,
    ) -> ValidationResult<()> {
        let mut errors = Vec::new();

        for (name, definition) in definitions {
            if definition.validation.required {
                match values.get(name) {
                    Some(val) if !val.is_null() => {}
                    _ => {
                        errors.push(ValidationError::new(
                            name,
                            format!("Required field '{}' is missing", name),
                        ));
                    }
                }
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    /// Check if all dependencies for a variable are satisfied
    pub fn check_dependencies(
        definition: &VariableDefinition,
        all_variables: &HashMap<String, VariableValue>,
    ) -> ValidationResult<()> {
        let mut errors = Vec::new();

        for dep in &definition.validation.depends_on {
            if !all_variables.contains_key(dep) {
                errors.push(ValidationError::new(
                    &definition.name,
                    format!("Missing dependency: {}", dep),
                ));
            }
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::hld::ValidationRule;

    fn create_test_definition(name: &str, var_type: VariableType) -> VariableDefinition {
        VariableDefinition {
            name: name.to_string(),
            var_type,
            section: "test".to_string(),
            description: "Test variable".to_string(),
            example_value: "test".to_string(),
            validation: ValidationRule::default(),
            default_value: None,
        }
    }

    #[test]
    fn test_required_field_validation() {
        let mut def = create_test_definition("test_field", VariableType::String);
        def.validation.required = true;

        let vars = HashMap::new();

        // Test missing value
        let result = VariableValidator::validate_variable(&def, &None, &vars);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert_eq!(errors.len(), 1);
        assert!(errors[0].message.contains("required"));

        // Test null value
        let result = VariableValidator::validate_variable(&def, &Some(VariableValue::Null), &vars);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert_eq!(errors.len(), 1);
        assert!(errors[0].message.contains("required"));

        // Test valid value
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("test".to_string())),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_type_validation() {
        let def = create_test_definition("test_field", VariableType::Integer);
        let vars = HashMap::new();

        // Test wrong type
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("not_an_integer".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert_eq!(errors.len(), 1);
        assert!(errors[0].message.contains("Type mismatch"));

        // Test correct type
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Integer(42)),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_numeric_range_validation() {
        let mut def = create_test_definition("test_field", VariableType::Integer);
        def.validation.min_value = Some(10.0);
        def.validation.max_value = Some(100.0);
        let vars = HashMap::new();

        // Test below minimum
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Integer(5)),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("below minimum"));

        // Test above maximum
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Integer(150)),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("exceeds maximum"));

        // Test in range
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Integer(50)),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_string_length_validation() {
        let mut def = create_test_definition("test_field", VariableType::String);
        def.validation.min_length = Some(3);
        def.validation.max_length = Some(10);
        let vars = HashMap::new();

        // Test too short
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("ab".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("below minimum"));

        // Test too long
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("this_is_too_long".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("exceeds maximum"));

        // Test valid length
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("valid".to_string())),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_pattern_validation() {
        let mut def = create_test_definition("ip_address", VariableType::String);
        // Simple IP address pattern (not production-grade)
        def.validation.pattern = Some(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$".to_string());
        let vars = HashMap::new();

        // Test invalid IP
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("not_an_ip".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("does not match"));

        // Test valid IP
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("192.168.1.1".to_string())),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_enum_validation() {
        let mut def = create_test_definition("os_type", VariableType::String);
        def.validation.enum_values = Some(vec![
            "Windows".to_string(),
            "Linux".to_string(),
            "macOS".to_string(),
        ]);
        let vars = HashMap::new();

        // Test invalid value
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("FreeBSD".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("not in allowed values"));

        // Test valid value
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("Linux".to_string())),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_dependency_validation() {
        let mut def = create_test_definition("dependent_field", VariableType::String);
        def.validation.depends_on = vec!["required_field".to_string()];

        // Test missing dependency
        let vars = HashMap::new();
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("test".to_string())),
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors[0].message.contains("Dependency"));

        // Test with dependency present
        let mut vars = HashMap::new();
        vars.insert("required_field".to_string(), VariableValue::String("value".to_string()));
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("test".to_string())),
            &vars,
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_multiple_validation_errors() {
        let mut def = create_test_definition("complex_field", VariableType::String);
        def.validation.required = true;
        def.validation.min_length = Some(5);
        def.validation.max_length = Some(10);
        def.validation.pattern = Some(r"^[A-Z]".to_string()); // Must start with uppercase
        def.validation.enum_values = Some(vec!["VALID1".to_string(), "VALID2".to_string()]);

        let vars = HashMap::new();

        // Test value with multiple errors
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("abc".to_string())), // too short, wrong pattern, not in enum
            &vars,
        );
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors.len() >= 2); // At least length and enum errors
    }

    #[test]
    fn test_validate_all() {
        let mut definitions = HashMap::new();
        
        let mut def1 = create_test_definition("field1", VariableType::String);
        def1.validation.required = true;
        definitions.insert("field1".to_string(), def1);

        let mut def2 = create_test_definition("field2", VariableType::Integer);
        def2.validation.min_value = Some(0.0);
        definitions.insert("field2".to_string(), def2);

        // Test with invalid values
        let mut values = HashMap::new();
        values.insert("field2".to_string(), VariableValue::Integer(-5)); // Below minimum

        let result = VariableValidator::validate_all(&definitions, &values);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert!(errors.len() >= 2); // Missing field1 + field2 below minimum

        // Test with valid values
        let mut values = HashMap::new();
        values.insert("field1".to_string(), VariableValue::String("test".to_string()));
        values.insert("field2".to_string(), VariableValue::Integer(10));

        let result = VariableValidator::validate_all(&definitions, &values);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_required_only() {
        let mut definitions = HashMap::new();
        
        let mut def1 = create_test_definition("required_field", VariableType::String);
        def1.validation.required = true;
        definitions.insert("required_field".to_string(), def1);

        let mut def2 = create_test_definition("optional_field", VariableType::String);
        def2.validation.required = false;
        definitions.insert("optional_field".to_string(), def2);

        // Test with missing required field
        let values = HashMap::new();
        let result = VariableValidator::validate_required_only(&definitions, &values);
        assert!(result.is_err());

        // Test with required field present
        let mut values = HashMap::new();
        values.insert("required_field".to_string(), VariableValue::String("test".to_string()));
        let result = VariableValidator::validate_required_only(&definitions, &values);
        assert!(result.is_ok());
    }

    #[test]
    fn test_check_dependencies() {
        let mut def = create_test_definition("dependent", VariableType::String);
        def.validation.depends_on = vec!["dep1".to_string(), "dep2".to_string()];

        // Test with missing dependencies
        let vars = HashMap::new();
        let result = VariableValidator::check_dependencies(&def, &vars);
        assert!(result.is_err());
        let errors = result.unwrap_err();
        assert_eq!(errors.len(), 2);

        // Test with partial dependencies
        let mut vars = HashMap::new();
        vars.insert("dep1".to_string(), VariableValue::String("value".to_string()));
        let result = VariableValidator::check_dependencies(&def, &vars);
        assert!(result.is_err());

        // Test with all dependencies
        let mut vars = HashMap::new();
        vars.insert("dep1".to_string(), VariableValue::String("value1".to_string()));
        vars.insert("dep2".to_string(), VariableValue::String("value2".to_string()));
        let result = VariableValidator::check_dependencies(&def, &vars);
        assert!(result.is_ok());
    }

    #[test]
    fn test_optional_field_skips_validation() {
        let mut def = create_test_definition("optional_field", VariableType::String);
        def.validation.required = false;
        def.validation.min_length = Some(5);

        let vars = HashMap::new();

        // Test None value - should pass (optional)
        let result = VariableValidator::validate_variable(&def, &None, &vars);
        assert!(result.is_ok());

        // Test Null value - should pass (optional)
        let result = VariableValidator::validate_variable(&def, &Some(VariableValue::Null), &vars);
        assert!(result.is_ok());

        // Test invalid value - should fail validation
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::String("abc".to_string())), // Too short
            &vars,
        );
        assert!(result.is_err());
    }

    #[test]
    fn test_float_range_validation() {
        let mut def = create_test_definition("percentage", VariableType::Float);
        def.validation.min_value = Some(0.0);
        def.validation.max_value = Some(100.0);
        let vars = HashMap::new();

        // Test valid float
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Float(45.5)),
            &vars,
        );
        assert!(result.is_ok());

        // Test below minimum
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Float(-1.0)),
            &vars,
        );
        assert!(result.is_err());

        // Test above maximum
        let result = VariableValidator::validate_variable(
            &def,
            &Some(VariableValue::Float(101.0)),
            &vars,
        );
        assert!(result.is_err());
    }
}
