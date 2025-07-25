// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod commands;

use state::AppState;
use commands::*;

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Environment management
            process_rvtools_file,
            get_environment_summary,
            clear_environment,
            
            // Analysis
            analyze_environment,
            
            // Hardware management
            get_hardware_basket,
            add_hardware_profile,
            remove_hardware_profile,
            save_hardware_basket,
            load_hardware_basket,
            parse_hardware_file,
            
            // Vendor API integration
            configure_vendor_credentials,
            
            // Vendor Data Collection
            get_all_server_models,
            get_vendor_server_models,
            get_model_specifications,
            get_compatibility_matrix,
            search_server_configurations,
            enrich_server_configuration,
            get_configuration_pricing,
            refresh_vendor_data,
            get_cache_statistics,
            
            // Planning
            calculate_sizing,
            get_forecast,
            
            // Migration
            translate_environment,
            get_translation_rules,
            update_translation_rules,
            
            // Documents
            generate_hld_document,
            generate_lld_document,
            
            // TCO
            calculate_tco,
            update_tco_parameters,
            
            // Settings
            get_app_settings,
            update_app_settings,
            
            // File operations
            file_exists,
            get_file_info,

            // Network Visualizer
            get_network_topology,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
