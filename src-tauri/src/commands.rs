use crate::state::*;
use core_engine::{parser, analysis, sizing, forecasting, translation, document_generation, hardware_parser};
use core_engine::models::*;
use core_engine::error::CoreEngineError;
use serde_json::Value as JsonValue;
use std::path::Path;
use uuid::Uuid;
use chrono::Utc;
use anyhow::{Result, Context};

/// Process RVTools Excel file and load environment data
#[tauri::command]
pub async fn process_rvtools_file(
    file_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    // Parse the RVTools file
    let environment = match parser::RvToolsParser::new(&file_path).and_then(|mut p| p.parse()) {
        Ok(env) => env,
        Err(e) => return Err(format!("Failed to parse RVTools file: {}", e)),
    };

    // Store the environment in application state
    state.set_current_environment(environment.clone());

    // Return environment summary
    Ok(format!(
        "Successfully loaded environment '{}' with {} clusters, {} VMs, {} hosts",
        environment.name,
        environment.clusters.len(),
        environment.get_total_vm_count(),
        environment.get_total_host_count()
    ))
}

/// Get summary of currently loaded environment
#[tauri::command]
pub async fn get_environment_summary(
    state: tauri::State<'_, AppState>,
) -> Result<Option<EnvironmentSummary>, String> {
    if let Some(environment) = state.get_current_environment() {
        let summary = EnvironmentSummary {
            id: environment.id,
            name: environment.name,
            parsed_at: environment.parsed_at,
            cluster_count: environment.clusters.len() as u32,
            total_vms: environment.get_total_vm_count(),
            total_hosts: environment.get_total_host_count(),
            total_cpu_cores: environment.get_total_cpu_cores(),
            total_memory_gb: environment.get_total_memory_gb(),
            total_storage_gb: environment.get_total_storage_gb(),
            power_on_vms: environment.get_powered_on_vm_count(),
            power_off_vms: environment.get_powered_off_vm_count(),
        };
        Ok(Some(summary))
    } else {
        Ok(None)
    }
}

/// Get detailed analysis of the current environment
#[tauri::command]
pub async fn analyze_environment(
    parameters: AnalysisParameters,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    // Check if we have cached analysis results
    let analysis_id = Uuid::new_v4();
    if let Some(cached) = state.analysis_cache.read().get(&environment.id) {
        if state.is_analysis_cache_valid(&environment.id) {
            return Ok(serde_json::to_string(&cached.analysis_report)
                .map_err(|e| format!("Failed to serialize cached analysis: {}", e))?);
        }
    }

    // Perform new analysis
    let analysis_report = match analysis::AnalysisEngine::analyze_environment(&environment) {
        Ok(report) => report,
        Err(e) => return Err(format!("Analysis failed: {}", e)),
    };

    // Cache the results
    let analysis_result = AnalysisResult {
        environment_id: environment.id,
        analysis_report: analysis_report.clone(),
        generated_at: Utc::now(),
        parameters_used: parameters,
    };
    state.analysis_cache.write().insert(environment.id, analysis_result);

    // Return serialized analysis report
    serde_json::to_string(&analysis_report)
        .map_err(|e| format!("Failed to serialize analysis report: {}", e))
}

/// Get hardware basket (available server profiles)
#[tauri::command]
pub async fn get_hardware_basket(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let basket = state.hardware_basket.read();
    serde_json::to_string(&*basket)
        .map_err(|e| format!("Failed to serialize hardware basket: {}", e))
}

/// Add hardware profile to basket
#[tauri::command]
pub async fn add_hardware_profile(
    profile: HardwareProfile,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let mut basket = state.hardware_basket.write();
    basket.add_profile(profile.clone());
    
    Ok(format!("Added hardware profile: {}", profile.name))
}

/// Remove hardware profile from basket
#[tauri::command]
pub async fn remove_hardware_profile(
    profile_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let profile_uuid = Uuid::parse_str(&profile_id)
        .map_err(|e| format!("Invalid profile ID: {}", e))?;
    
    let mut basket = state.hardware_basket.write();
    if basket.remove_profile(&profile_uuid) {
        Ok("Hardware profile removed".to_string())
    } else {
        Err("Hardware profile not found".to_string())
    }
}

/// Perform sizing calculation
#[tauri::command]
pub async fn calculate_sizing(
    hardware_profile_id: String,
    sizing_parameters: SizingParameters,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    let profile_uuid = Uuid::parse_str(&hardware_profile_id)
        .map_err(|e| format!("Invalid hardware profile ID: {}", e))?;

    // Check cache
    let cache_key = format!("{}-{:?}", hardware_profile_id, sizing_parameters);
    if let Some(env_hash) = state.get_environment_hash() {
        if state.is_sizing_cache_valid(&cache_key, &env_hash) {
            if let Some(cached) = state.sizing_cache.read().get(&cache_key) {
                return serde_json::to_string(&cached.sizing_result)
                    .map_err(|e| format!("Failed to serialize cached sizing result: {}", e));
            }
        }
    }

    // Get hardware profile
    let basket = state.hardware_basket.read();
    let hardware_profile = basket.get_profile(&profile_uuid)
        .ok_or_else(|| "Hardware profile not found".to_string())?;

    // Perform sizing calculation
    let sizing_result = match sizing::calculate_sizing(&environment, hardware_profile, &sizing_parameters).await {
        Ok(result) => result,
        Err(e) => return Err(format!("Sizing calculation failed: {}", e)),
    };

    // Cache the result
    if let Some(env_hash) = state.get_environment_hash() {
        let cache_entry = SizingResultCache {
            hardware_profile_id: profile_uuid,
            sizing_parameters: sizing_parameters.clone(),
            sizing_result: sizing_result.clone(),
            generated_at: Utc::now(),
            environment_hash: env_hash,
        };
        state.sizing_cache.write().insert(cache_key, cache_entry);
    }

    // Return serialized result
    serde_json::to_string(&sizing_result)
        .map_err(|e| format!("Failed to serialize sizing result: {}", e))
}

/// Get forecasting data
#[tauri::command]
pub async fn get_forecast(
    forecast_parameters: core_engine::forecasting::ForecastParameters,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    let forecast_result = match forecasting::generate_forecast(&environment, &forecast_parameters).await {
        Ok(result) => result,
        Err(e) => return Err(format!("Forecasting failed: {}", e)),
    };

    serde_json::to_string(&forecast_result)
        .map_err(|e| format!("Failed to serialize forecast result: {}", e))
}

/// Get translation rules
#[tauri::command]
pub async fn get_translation_rules(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let rules = state.translation_rules.read();
    serde_json::to_string(&*rules)
        .map_err(|e| format!("Failed to serialize translation rules: {}", e))
}

/// Update translation rules
#[tauri::command]
pub async fn update_translation_rules(
    rules: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let translation_rules: translation::TranslationRules = serde_json::from_value(rules)
        .map_err(|e| format!("Invalid translation rules format: {}", e))?;

    {
        let mut rules = state.translation_rules.write();
        *rules = translation_rules;
    }

    Ok("Translation rules updated".to_string())
}

/// Perform VMware to Microsoft translation
#[tauri::command]
pub async fn translate_environment(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    let rules = state.translation_rules.read().clone();
    
    let translation_result = match translation::translate_environment(&environment, &rules).await {
        Ok(result) => result,
        Err(e) => return Err(format!("Translation failed: {}", e)),
    };

    serde_json::to_string(&translation_result)
        .map_err(|e| format!("Failed to serialize translation result: {}", e))
}

/// Generate HLD document
#[tauri::command]
pub async fn generate_hld_document(
    output_path: String,
    sizing_result: JsonValue,
    translation_result: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    let sizing: SizingResult = serde_json::from_value(sizing_result)
        .map_err(|e| format!("Invalid sizing result format: {}", e))?;

    let translation: TranslationResult = serde_json::from_value(translation_result)
        .map_err(|e| format!("Invalid translation result format: {}", e))?;

    match document_generation::generate_hld_document(&environment, &sizing, &translation, &output_path).await {
        Ok(_) => Ok(format!("HLD document generated: {}", output_path)),
        Err(e) => Err(format!("Failed to generate HLD document: {}", e)),
    }
}

/// Generate LLD document
#[tauri::command]
pub async fn generate_lld_document(
    output_path: String,
    sizing_result: JsonValue,
    translation_result: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let environment = match state.get_current_environment() {
        Some(env) => env,
        None => return Err("No environment loaded".to_string()),
    };

    let sizing: SizingResult = serde_json::from_value(sizing_result)
        .map_err(|e| format!("Invalid sizing result format: {}", e))?;

    let translation: TranslationResult = serde_json::from_value(translation_result)
        .map_err(|e| format!("Invalid translation result format: {}", e))?;

    match document_generation::generate_lld_document(&environment, &sizing, &translation, &output_path).await {
        Ok(_) => Ok(format!("LLD document generated: {}", output_path)),
        Err(e) => Err(format!("Failed to generate LLD document: {}", e)),
    }
}

/// Calculate TCO
#[tauri::command]
pub async fn calculate_tco(
    sizing_result: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let sizing: SizingResult = serde_json::from_value(sizing_result)
        .map_err(|e| format!("Invalid sizing result format: {}", e))?;

    let tco_params = state.tco_parameters.read().clone();
    
    // Simple TCO calculation (this would be more sophisticated in a real implementation)
    let current_annual_cost = tco_params.current_environment.hardware_annual_cost
        + tco_params.current_environment.vmware_licensing_annual_cost
        + tco_params.current_environment.datacenter_space_annual_cost
        + tco_params.current_environment.power_cooling_annual_cost
        + tco_params.current_environment.storage_annual_cost
        + tco_params.current_environment.network_annual_cost
        + tco_params.current_environment.it_personnel_annual_cost
        + tco_params.current_environment.maintenance_annual_cost;

    let target_annual_cost = tco_params.target_environment.windows_server_licensing_annual_cost
        + tco_params.target_environment.azure_local_licensing_annual_cost
        + tco_params.target_environment.system_center_licensing_annual_cost;

    let one_time_costs = tco_params.target_environment.implementation_services_cost
        + tco_params.target_environment.training_cost
        + tco_params.target_environment.migration_tools_cost;

    let tco_result = TcoResult {
        analysis_period_years: tco_params.analysis_period_years,
        current_environment_total_cost: current_annual_cost * tco_params.analysis_period_years as f64,
        target_environment_total_cost: (target_annual_cost * tco_params.analysis_period_years as f64) + one_time_costs,
        savings: (current_annual_cost - target_annual_cost) * tco_params.analysis_period_years as f64 - one_time_costs,
        roi_percent: if current_annual_cost > 0.0 {
            ((current_annual_cost - target_annual_cost) * tco_params.analysis_period_years as f64 - one_time_costs) / (current_annual_cost * tco_params.analysis_period_years as f64) * 100.0
        } else {
            0.0
        },
        payback_period_years: if current_annual_cost > target_annual_cost {
            one_time_costs / (current_annual_cost - target_annual_cost)
        } else {
            f64::INFINITY
        },
        currency: tco_params.currency,
    };

    serde_json::to_string(&tco_result)
        .map_err(|e| format!("Failed to serialize TCO result: {}", e))
}

/// Get current application settings
#[tauri::command]
pub async fn get_app_settings(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let settings = state.app_settings.read();
    serde_json::to_string(&*settings)
        .map_err(|e| format!("Failed to serialize app settings: {}", e))
}

/// Update application settings
#[tauri::command]
pub async fn update_app_settings(
    settings: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let app_settings: AppSettings = serde_json::from_value(settings)
        .map_err(|e| format!("Invalid app settings format: {}", e))?;

    {
        let mut settings = state.app_settings.write();
        *settings = app_settings;
    }

    Ok("Application settings updated".to_string())
}

/// Update TCO parameters
#[tauri::command]
pub async fn update_tco_parameters(
    parameters: JsonValue,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let tco_parameters: TcoParameters = serde_json::from_value(parameters)
        .map_err(|e| format!("Invalid TCO parameters format: {}", e))?;

    {
        let mut params = state.tco_parameters.write();
        *params = tco_parameters;
    }

    Ok("TCO parameters updated".to_string())
}

/// Save hardware basket to file
#[tauri::command]
pub async fn save_hardware_basket(
    file_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let basket = state.hardware_basket.read();
    let json = serde_json::to_string_pretty(&*basket)
        .map_err(|e| format!("Failed to serialize hardware basket: {}", e))?;

    tokio::fs::write(&file_path, json).await
        .map_err(|e| format!("Failed to write hardware basket file: {}", e))?;

    Ok(format!("Hardware basket saved to: {}", file_path))
}

/// Load hardware basket from file
#[tauri::command]
pub async fn load_hardware_basket(
    file_path: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let json = tokio::fs::read_to_string(&file_path).await
        .map_err(|e| format!("Failed to read hardware basket file: {}", e))?;

    let basket: sizing::HardwareBasket = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to parse hardware basket file: {}", e))?;

    {
        let mut current_basket = state.hardware_basket.write();
        *current_basket = basket;
    }

    Ok(format!("Hardware basket loaded from: {}", file_path))
}

/// Check if file exists
#[tauri::command]
pub async fn file_exists(file_path: String) -> Result<bool, String> {
    Ok(Path::new(&file_path).exists())
}

/// Get file info
#[tauri::command]
pub async fn get_file_info(file_path: String) -> Result<JsonValue, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err("File does not exist".to_string());
    }

    let metadata = tokio::fs::metadata(&file_path).await
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;

    let file_info = serde_json::json!({
        "exists": true,
        "size": metadata.len(),
        "is_file": metadata.is_file(),
        "is_dir": metadata.is_dir(),
        "modified": metadata.modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs()),
    });

    Ok(file_info)
}

/// Clear current environment and caches
#[tauri::command]
pub async fn clear_environment(
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    state.clear_current_environment();
    Ok("Environment cleared".to_string())
}

/// Environment summary structure for UI display
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct EnvironmentSummary {
    pub id: Uuid,
    pub name: String,
    pub parsed_at: chrono::DateTime<chrono::Utc>,
    pub cluster_count: u32,
    pub total_vms: u32,
    pub total_hosts: u32,
    pub total_cpu_cores: u32,
    pub total_memory_gb: f64,
    pub total_storage_gb: f64,
    pub power_on_vms: u32,
    pub power_off_vms: u32,
}

/// Parse a hardware configuration file (e.g., Dell SCP, Lenovo DCSC)
#[tauri::command]
pub async fn parse_hardware_file(
    file_path: String,
) -> Result<UniversalServer, String> {
    let parser = hardware_parser::UniversalParser;
    match parser.parse_file(&file_path) {
        Ok(server) => Ok(server),
        Err(e) => Err(format!("Failed to parse hardware file: {}", e)),
    }
}

/// TCO calculation result
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TcoResult {
    pub analysis_period_years: u32,
    pub current_environment_total_cost: f64,
    pub target_environment_total_cost: f64,
    pub savings: f64,
    pub roi_percent: f64,
    pub payback_period_years: f64,
    pub currency: String,
}
