// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod state;
mod commands_minimal;

use state::AppState;
use commands_minimal::*;

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
            get_hardware_profiles,
            add_hardware_profile,
            update_hardware_profile,
            delete_hardware_profile,
            get_hci_certified_profiles,
            save_hardware_basket,
            load_hardware_basket,
            
            // Planning
            calculate_sizing,
            optimize_cluster_configuration,
            generate_forecast,
            
            // Migration
            translate_cluster,
            get_translation_rules,
            update_translation_rules,
            
            // Documents
            generate_hld_document,
            generate_lld_document,
            get_document_templates,
            upload_document_template,
            
            // TCO
            calculate_tco,
            get_tco_parameters,
            update_tco_parameters,
            
            // Settings
            get_app_settings,
            update_app_settings,
            
            // File operations
            export_configuration,
            import_configuration,
            save_file_dialog,
            open_file_dialog,
            file_exists,
            get_file_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
