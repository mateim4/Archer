use core_engine::models::*;
use core_engine::sizing::HardwareBasket;
use core_engine::forecasting::ForecastParameters;
use core_engine::translation::TranslationRules;
use parking_lot::RwLock;
use std::sync::Arc;
use std::collections::HashMap;
use uuid::Uuid;

/// Application state shared across all Tauri commands
#[derive(Debug)]
pub struct AppState {
    /// Currently loaded vSphere environment
    pub current_environment: Arc<RwLock<Option<VsphereEnvironment>>>,
    
    /// Hardware basket with server profiles
    pub _hardware_basket: Arc<RwLock<HardwareBasket>>,
    
    /// Translation rules for VMware to Microsoft mapping
    pub _translation_rules: Arc<RwLock<TranslationRules>>,
    
    /// TCO parameters for cost analysis
    pub _tco_parameters: Arc<RwLock<TcoParameters>>,
    
    /// Application settings
    pub _app_settings: Arc<RwLock<AppSettings>>,
    
    /// Document templates
    pub _document_templates: Arc<RwLock<HashMap<String, DocumentTemplate>>>,
    
    /// Analysis results cache
    pub analysis_cache: Arc<RwLock<HashMap<Uuid, AnalysisResult>>>,
    
    /// Sizing results cache
    pub sizing_cache: Arc<RwLock<HashMap<String, SizingResultCache>>>,
}

/// TCO calculation parameters
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TcoParameters {
    pub current_environment: CurrentEnvironmentCosts,
    pub target_environment: TargetEnvironmentCosts,
    pub analysis_period_years: u32,
    pub discount_rate_percent: f64,
    pub currency: String,
}

/// Current environment cost parameters
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CurrentEnvironmentCosts {
    pub hardware_annual_cost: f64,
    pub vmware_licensing_annual_cost: f64,
    pub datacenter_space_annual_cost: f64,
    pub power_cooling_annual_cost: f64,
    pub storage_annual_cost: f64,
    pub network_annual_cost: f64,
    pub it_personnel_annual_cost: f64,
    pub maintenance_annual_cost: f64,
}

/// Target environment cost parameters
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TargetEnvironmentCosts {
    pub windows_server_licensing_annual_cost: f64,
    pub azure_local_licensing_annual_cost: f64,
    pub system_center_licensing_annual_cost: f64,
    pub implementation_services_cost: f64,
    pub training_cost: f64,
    pub migration_tools_cost: f64,
}

/// Application settings
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AppSettings {
    pub default_sizing_parameters: SizingParameters,
    pub default_forecast_parameters: ForecastParameters,
    pub ui_preferences: UiPreferences,
    pub file_locations: FileLocations,
    pub export_settings: ExportSettings,
}

/// UI preferences
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct UiPreferences {
    pub theme: String,
    pub default_view: String,
    pub chart_preferences: ChartPreferences,
    pub table_preferences: TablePreferences,
}

/// Chart display preferences
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ChartPreferences {
    pub default_chart_type: String,
    pub color_scheme: String,
    pub show_data_labels: bool,
    pub animation_enabled: bool,
}

/// Table display preferences
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TablePreferences {
    pub rows_per_page: u32,
    pub default_sort_column: String,
    pub default_sort_direction: String,
    pub show_row_numbers: bool,
}

/// File location settings
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileLocations {
    pub default_export_directory: String,
    pub template_directory: String,
    pub hardware_basket_file: String,
    pub config_directory: String,
}

/// Export settings
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ExportSettings {
    pub include_charts_in_documents: bool,
    pub document_format: String,
    pub excel_template_path: Option<String>,
    pub pdf_generation_enabled: bool,
}

/// Document template information
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DocumentTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub template_type: DocumentType,
    pub file_path: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub is_default: bool,
}

/// Document types
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum DocumentType {
    HighLevelDesign,
    LowLevelDesign,
    MigrationPlan,
    TcoReport,
}

/// Analysis result with metadata
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AnalysisResult {
    pub environment_id: Uuid,
    pub analysis_report: core_engine::analysis::AnalysisReport,
    pub generated_at: chrono::DateTime<chrono::Utc>,
    pub parameters_used: AnalysisParameters,
}

/// Analysis parameters
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AnalysisParameters {
    pub include_powered_off_vms: bool,
    pub include_templates: bool,
    pub health_check_enabled: bool,
    pub optimization_recommendations_enabled: bool,
}

/// Sizing result cache entry
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SizingResultCache {
    pub hardware_profile_id: Uuid,
    pub sizing_parameters: SizingParameters,
    pub sizing_result: SizingResult,
    pub generated_at: chrono::DateTime<chrono::Utc>,
    pub environment_hash: String, // Hash of the source environment for cache invalidation
}

impl AppState {
    pub fn new() -> Self {
        Self {
            current_environment: Arc::new(RwLock::new(None)),
            _hardware_basket: Arc::new(RwLock::new(HardwareBasket::new())),
            _translation_rules: Arc::new(RwLock::new(TranslationRules::default())),
            _tco_parameters: Arc::new(RwLock::new(TcoParameters::default())),
            _app_settings: Arc::new(RwLock::new(AppSettings::default())),
            _document_templates: Arc::new(RwLock::new(HashMap::new())),
            analysis_cache: Arc::new(RwLock::new(HashMap::new())),
            sizing_cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get the current environment if loaded
    pub fn get_current_environment(&self) -> Option<VsphereEnvironment> {
        self.current_environment.read().clone()
    }

    /// Set the current environment
    pub fn set_current_environment(&self, environment: VsphereEnvironment) {
        let mut env = self.current_environment.write();
        *env = Some(environment);
        
        // Clear caches when environment changes
        self.analysis_cache.write().clear();
        self.sizing_cache.write().clear();
    }

    /// Clear the current environment
    pub fn clear_current_environment(&self) {
        let mut env = self.current_environment.write();
        *env = None;
        
        // Clear caches
        self.analysis_cache.write().clear();
        self.sizing_cache.write().clear();
    }

    /// Generate a hash for the current environment for cache validation
    pub fn _get_environment_hash(&self) -> Option<String> {
        if let Some(env) = self.get_current_environment() {
            // Simple hash based on environment ID and parse timestamp
            Some(format!("{}-{}", env.id, env.parsed_at.timestamp()))
        } else {
            None
        }
    }

    /// Check if analysis cache is valid for current environment
    pub fn _is_analysis_cache_valid(&self, environment_id: &Uuid) -> bool {
        if let Some(env) = self.get_current_environment() {
            env.id == *environment_id
        } else {
            false
        }
    }

    /// Check if sizing cache is valid for current environment and parameters
    pub fn _is_sizing_cache_valid(&self, cache_key: &str, environment_hash: &str) -> bool {
        if let Some(current_hash) = self._get_environment_hash() {
            if let Some(cached) = self.sizing_cache.read().get(cache_key) {
                return cached.environment_hash == current_hash && cached.environment_hash == environment_hash;
            }
        }
        false
    }
}

impl Default for TcoParameters {
    fn default() -> Self {
        Self {
            current_environment: CurrentEnvironmentCosts {
                hardware_annual_cost: 0.0,
                vmware_licensing_annual_cost: 0.0,
                datacenter_space_annual_cost: 0.0,
                power_cooling_annual_cost: 0.0,
                storage_annual_cost: 0.0,
                network_annual_cost: 0.0,
                it_personnel_annual_cost: 0.0,
                maintenance_annual_cost: 0.0,
            },
            target_environment: TargetEnvironmentCosts {
                windows_server_licensing_annual_cost: 0.0,
                azure_local_licensing_annual_cost: 0.0,
                system_center_licensing_annual_cost: 0.0,
                implementation_services_cost: 0.0,
                training_cost: 0.0,
                migration_tools_cost: 0.0,
            },
            analysis_period_years: 5,
            discount_rate_percent: 5.0,
            currency: "USD".to_string(),
        }
    }
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            default_sizing_parameters: SizingParameters::default(),
            default_forecast_parameters: core_engine::forecasting::ForecastParameters::default(),
            ui_preferences: UiPreferences::default(),
            file_locations: FileLocations::default(),
            export_settings: ExportSettings::default(),
        }
    }
}

impl Default for UiPreferences {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            default_view: "dashboard".to_string(),
            chart_preferences: ChartPreferences::default(),
            table_preferences: TablePreferences::default(),
        }
    }
}

impl Default for ChartPreferences {
    fn default() -> Self {
        Self {
            default_chart_type: "bar".to_string(),
            color_scheme: "blue".to_string(),
            show_data_labels: true,
            animation_enabled: true,
        }
    }
}

impl Default for TablePreferences {
    fn default() -> Self {
        Self {
            rows_per_page: 25,
            default_sort_column: "name".to_string(),
            default_sort_direction: "asc".to_string(),
            show_row_numbers: true,
        }
    }
}

impl Default for FileLocations {
    fn default() -> Self {
        Self {
            default_export_directory: "".to_string(),
            template_directory: "".to_string(),
            hardware_basket_file: "hardware_basket.json".to_string(),
            config_directory: "".to_string(),
        }
    }
}

impl Default for ExportSettings {
    fn default() -> Self {
        Self {
            include_charts_in_documents: true,
            document_format: "docx".to_string(),
            excel_template_path: None,
            pdf_generation_enabled: false,
        }
    }
}

impl Default for AnalysisParameters {
    fn default() -> Self {
        Self {
            include_powered_off_vms: false,
            include_templates: false,
            health_check_enabled: true,
            optimization_recommendations_enabled: true,
        }
    }
}
