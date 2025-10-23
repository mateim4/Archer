// ============================================================================
// LCMDesigner - HLD (High-Level Design) Generation System - Data Models
// ============================================================================
// Purpose: Define Rust data structures for HLD templates, sections, projects, and variables
// Version: 1.0
// Date: October 23, 2025
// ============================================================================

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use std::collections::HashMap;
use surrealdb::sql::Thing;

// ============================================================================
// ENUMS
// ============================================================================

/// Variable data types supported by the HLD system
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VariableType {
    String,
    Integer,
    Float,
    Boolean,
    Date,
    Array,
    Object,
}

impl VariableType {
    /// Convert string to VariableType
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "string" => Some(Self::String),
            "integer" => Some(Self::Integer),
            "float" => Some(Self::Float),
            "boolean" => Some(Self::Boolean),
            "date" => Some(Self::Date),
            "array" => Some(Self::Array),
            "object" => Some(Self::Object),
            _ => None,
        }
    }

    /// Convert VariableType to string
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::String => "string",
            Self::Integer => "integer",
            Self::Float => "float",
            Self::Boolean => "boolean",
            Self::Date => "date",
            Self::Array => "array",
            Self::Object => "object",
        }
    }
}

/// Source of variable value
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VariableSource {
    Manual,
    RVTools,
    Wizard,
    Default,
}

impl VariableSource {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::Manual => "manual",
            Self::RVTools => "rvtools",
            Self::Wizard => "wizard",
            Self::Default => "default",
        }
    }
}

/// Confidence level for auto-populated variables
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum VariableConfidence {
    None,
    Low,
    Medium,
    High,
}

impl VariableConfidence {
    pub fn to_str(&self) -> &'static str {
        match self {
            Self::None => "none",
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
        }
    }
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/// Validation rules for a variable
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationRule {
    /// Is this variable required?
    pub required: bool,

    /// Minimum value (for integer/float)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_value: Option<f64>,

    /// Maximum value (for integer/float)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_value: Option<f64>,

    /// Minimum length (for string/array)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_length: Option<usize>,

    /// Maximum length (for string/array)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_length: Option<usize>,

    /// Regex pattern (for string validation)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pattern: Option<String>,

    /// Allowed enum values
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enum_values: Option<Vec<String>>,

    /// Variables that must exist before this one
    #[serde(default)]
    pub depends_on: Vec<String>,
}

impl Default for ValidationRule {
    fn default() -> Self {
        Self {
            required: false,
            min_value: None,
            max_value: None,
            min_length: None,
            max_length: None,
            pattern: None,
            enum_values: None,
            depends_on: Vec::new(),
        }
    }
}

// ============================================================================
// VARIABLE DEFINITION
// ============================================================================

/// Definition of a variable (metadata, not the value)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableDefinition {
    /// Variable name (e.g., "node_count")
    pub name: String,

    /// Variable type
    pub var_type: VariableType,

    /// Section this variable belongs to
    pub section: String,

    /// Human-readable description
    pub description: String,

    /// Example value
    pub example_value: String,

    /// Validation rules
    pub validation: ValidationRule,

    /// Default value (optional)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<VariableValue>,
}

// ============================================================================
// VARIABLE VALUE
// ============================================================================

/// Dynamic variable value (can be any supported type)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub enum VariableValue {
    String(String),
    Integer(i64),
    Float(f64),
    Boolean(bool),
    Date(DateTime<Utc>),
    Array(Vec<JsonValue>),
    Object(HashMap<String, JsonValue>),
    Null,
}

impl VariableValue {
    /// Get the type of this value
    pub fn get_type(&self) -> VariableType {
        match self {
            Self::String(_) => VariableType::String,
            Self::Integer(_) => VariableType::Integer,
            Self::Float(_) => VariableType::Float,
            Self::Boolean(_) => VariableType::Boolean,
            Self::Date(_) => VariableType::Date,
            Self::Array(_) => VariableType::Array,
            Self::Object(_) => VariableType::Object,
            Self::Null => VariableType::String, // Default to string for null
        }
    }

    /// Convert to string representation
    pub fn to_string(&self) -> String {
        match self {
            Self::String(s) => s.clone(),
            Self::Integer(i) => i.to_string(),
            Self::Float(f) => f.to_string(),
            Self::Boolean(b) => b.to_string(),
            Self::Date(d) => d.to_rfc3339(),
            Self::Array(a) => serde_json::to_string(a).unwrap_or_default(),
            Self::Object(o) => serde_json::to_string(o).unwrap_or_default(),
            Self::Null => String::new(),
        }
    }

    /// Check if value is null/empty
    pub fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }
}

impl From<String> for VariableValue {
    fn from(s: String) -> Self {
        Self::String(s)
    }
}

impl From<i64> for VariableValue {
    fn from(i: i64) -> Self {
        Self::Integer(i)
    }
}

impl From<f64> for VariableValue {
    fn from(f: f64) -> Self {
        Self::Float(f)
    }
}

impl From<bool> for VariableValue {
    fn from(b: bool) -> Self {
        Self::Boolean(b)
    }
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

/// HLD Template (corresponds to hld_templates table)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDTemplate {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub name: String,
    pub description: String,
    pub version: String,

    #[serde(default = "default_true")]
    pub is_active: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<JsonValue>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_true() -> bool {
    true
}

/// HLD Section (corresponds to hld_sections table)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDSection {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub template_id: Thing,
    pub section_id: String,
    pub name: String,
    pub description: String,
    pub order: i32,
    pub content_template: String,

    #[serde(default)]
    pub required: bool,

    #[serde(default)]
    pub depends_on: Vec<String>,

    #[serde(default)]
    pub repeatable: bool,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<JsonValue>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,
}

/// HLD Project (corresponds to hld_projects table)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDProject {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub project_id: Thing,
    pub template_id: Thing,
    pub template_version: String,

    #[serde(default)]
    pub enabled_sections: Vec<String>,

    #[serde(default)]
    pub section_order: Vec<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<JsonValue>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<DateTime<Utc>>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

/// HLD Variable (corresponds to hld_variables table)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HLDVariable {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub hld_project_id: Thing,
    pub variable_name: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub variable_value: Option<VariableValue>,

    pub variable_type: String, // Stored as string in DB
    pub section: String,

    #[serde(default = "default_source")]
    pub source: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_message: Option<String>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<DateTime<Utc>>,
}

fn default_source() -> String {
    "manual".to_string()
}

impl HLDVariable {
    /// Create a new variable
    pub fn new(
        hld_project_id: Thing,
        variable_name: String,
        variable_value: Option<VariableValue>,
        variable_type: VariableType,
        section: String,
    ) -> Self {
        Self {
            id: None,
            hld_project_id,
            variable_name,
            variable_value,
            variable_type: variable_type.to_str().to_string(),
            section,
            source: "manual".to_string(),
            confidence: None,
            error_message: None,
            updated_at: None,
        }
    }

    /// Set source
    pub fn with_source(mut self, source: VariableSource) -> Self {
        self.source = source.to_str().to_string();
        self
    }

    /// Set confidence
    pub fn with_confidence(mut self, confidence: VariableConfidence) -> Self {
        self.confidence = Some(confidence.to_str().to_string());
        self
    }

    /// Set error message
    pub fn with_error(mut self, error: String) -> Self {
        self.error_message = Some(error);
        self
    }
}

// ============================================================================
// REQUEST/RESPONSE MODELS (for API)
// ============================================================================

/// Request to create HLD template
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHLDTemplateRequest {
    pub name: String,
    pub description: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<JsonValue>,
}

/// Request to create HLD section
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHLDSectionRequest {
    pub section_id: String,
    pub name: String,
    pub description: String,
    pub order: i32,
    pub content_template: String,
    #[serde(default)]
    pub required: bool,
    #[serde(default)]
    pub depends_on: Vec<String>,
    #[serde(default)]
    pub repeatable: bool,
}

/// Request to create HLD project
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHLDProjectRequest {
    pub template_id: String, // Will be converted to Thing
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled_sections: Option<Vec<String>>,
}

/// Request to update enabled sections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateEnabledSectionsRequest {
    pub enabled_sections: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub section_order: Option<Vec<String>>,
}

/// Request to update single variable
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateVariableRequest {
    pub value: VariableValue,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

/// Request to bulk update variables
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BulkUpdateVariablesRequest {
    pub variables: Vec<VariableUpdate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableUpdate {
    pub name: String,
    pub value: VariableValue,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
}

/// Response for variable change preview (RVTools auto-fill)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VariableChange {
    pub name: String,
    pub display_name: String,
    pub current_value: Option<VariableValue>,
    pub proposed_value: Option<VariableValue>,
    pub confidence: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Response for auto-fill preview
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoFillPreview {
    pub changes: Vec<VariableChange>,
    pub total_changes: usize,
    pub high_confidence: usize,
    pub medium_confidence: usize,
    pub low_confidence: usize,
    pub errors: usize,
}

/// Validation error
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationError {
    pub variable: String,
    pub message: String,
    pub severity: String, // "error" or "warning"
}

/// Validation result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationError>,
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_variable_type_conversion() {
        assert_eq!(VariableType::from_str("string"), Some(VariableType::String));
        assert_eq!(VariableType::from_str("integer"), Some(VariableType::Integer));
        assert_eq!(VariableType::from_str("FLOAT"), Some(VariableType::Float));
        assert_eq!(VariableType::from_str("invalid"), None);
    }

    #[test]
    fn test_variable_value_type_detection() {
        let v1 = VariableValue::String("test".to_string());
        assert_eq!(v1.get_type(), VariableType::String);

        let v2 = VariableValue::Integer(42);
        assert_eq!(v2.get_type(), VariableType::Integer);

        let v3 = VariableValue::Boolean(true);
        assert_eq!(v3.get_type(), VariableType::Boolean);
    }

    #[test]
    fn test_variable_value_to_string() {
        let v1 = VariableValue::String("hello".to_string());
        assert_eq!(v1.to_string(), "hello");

        let v2 = VariableValue::Integer(123);
        assert_eq!(v2.to_string(), "123");

        let v3 = VariableValue::Boolean(true);
        assert_eq!(v3.to_string(), "true");
    }

    #[test]
    fn test_variable_value_is_null() {
        assert!(VariableValue::Null.is_null());
        assert!(!VariableValue::String("test".to_string()).is_null());
    }

    #[test]
    fn test_hld_variable_builder() {
        let project_id = Thing::from(("hld_projects", "test-project"));
        let var = HLDVariable::new(
            project_id.clone(),
            "node_count".to_string(),
            Some(VariableValue::Integer(4)),
            VariableType::Integer,
            "infrastructure".to_string(),
        )
        .with_source(VariableSource::RVTools)
        .with_confidence(VariableConfidence::High);

        assert_eq!(var.variable_name, "node_count");
        assert_eq!(var.source, "rvtools");
        assert_eq!(var.confidence, Some("high".to_string()));
    }

    #[test]
    fn test_validation_rule_defaults() {
        let rule = ValidationRule::default();
        assert!(!rule.required);
        assert!(rule.min_value.is_none());
        assert!(rule.depends_on.is_empty());
    }
}

// ============================================================================
// SECTION DEFINITION (for Word Generator)
// ============================================================================

/// Section definition with enabled state for document generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionDefinition {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<Thing>,

    pub section_id: String,
    pub section_name: String,
    pub display_name: String,
    pub description: String,

    #[serde(default)]
    pub required: bool,

    #[serde(default = "default_true")]
    pub enabled: bool,

    #[serde(default)]
    pub order_index: i32,

    #[serde(default)]
    pub depends_on: Vec<String>,

    pub created_at: DateTime<Utc>,
}
