// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod commands_minimal;

use state::AppState;
use commands_minimal as commands;

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
            get_forecast,
            
            // Hardware management
            get_hardware_basket,
            add_hardware_profile,
            remove_hardware_profile,
            save_hardware_basket,
            load_hardware_basket,
            
            // Sizing calculations
            calculate_sizing,
            
            // Translation
            get_translation_rules,
            update_translation_rules,
            translate_environment,
            
            // Document generation
            generate_hld_document,
            generate_lld_document,
            
            // TCO analysis
            calculate_tco,
            update_tco_parameters,
            
            // Settings management
            get_app_settings,
            update_app_settings,
            
            // File operations
            file_exists,
            get_file_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

mod commands;
mod state;
mod error;
mod config;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // RVTools and Environment Management
            commands::process_rvtools_file,
            commands::get_environment_summary,
            commands::get_cluster_details,
            commands::analyze_environment,
            
            // Hardware Basket Management
            commands::get_hardware_profiles,
            commands::add_hardware_profile,
            commands::update_hardware_profile,
            commands::delete_hardware_profile,
            commands::get_hci_certified_profiles,
            
            // Capacity Planning
            commands::calculate_sizing,
            commands::optimize_cluster_configuration,
            commands::generate_forecast,
            
            // Migration Planning
            commands::translate_cluster,
            commands::get_translation_rules,
            commands::update_translation_rules,
            
            // Document Generation
            commands::generate_hld_document,
            commands::generate_lld_document,
            commands::get_document_templates,
            commands::upload_document_template,
            
            // TCO Analysis
            commands::calculate_tco,
            commands::get_tco_parameters,
            commands::update_tco_parameters,
            
            // Settings and Configuration
            commands::get_app_settings,
            commands::update_app_settings,
            commands::export_configuration,
            commands::import_configuration,
            
            // File Operations
            commands::save_file_dialog,
            commands::open_file_dialog,
        ])
        .setup(|app| {
            // Initialize application directories
            let app_handle = app.handle();
            if let Err(e) = config::init_app_directories(&app_handle) {
                eprintln!("Failed to initialize app directories: {}", e);
            }
            
            // Load configuration
            if let Err(e) = config::load_app_config(&app_handle) {
                eprintln!("Failed to load app config: {}", e);
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
