// Server Assembly Engine
// Assembles classified components into server configurations

use crate::hardware_parser::component_classifier::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use uuid::Uuid;

pub struct ServerAssemblyEngine {
    classifier: ComponentClassifier,
    server_platform_rules: HashMap<String, PlatformRules>,
}

#[derive(Debug, Clone)]
pub struct PlatformRules {
    pub vendor: String,
    pub model_family: String,
    pub form_factor: String,
    pub server_type: ServerType,
    pub cpu_socket_count: u32,
    pub memory_slot_count: u32,
    pub drive_bay_count: u32,
    pub pcie_slot_count: u32,
    pub supported_cpu_families: Vec<String>,
}

impl ServerAssemblyEngine {
    pub fn new() -> Self {
        let mut engine = Self {
            classifier: ComponentClassifier::new(),
            server_platform_rules: HashMap::new(),
        };
        
        engine.initialize_platform_rules();
        engine
    }

    fn initialize_platform_rules(&mut self) {
        // Lenovo ThinkSystem rules
        self.server_platform_rules.insert("SR630".to_string(), PlatformRules {
            vendor: "Lenovo".to_string(),
            model_family: "ThinkSystem".to_string(),
            form_factor: "1U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 2,
            memory_slot_count: 16,
            drive_bay_count: 8,
            pcie_slot_count: 3,
            supported_cpu_families: vec!["Intel Xeon".to_string()],
        });

        self.server_platform_rules.insert("SR645".to_string(), PlatformRules {
            vendor: "Lenovo".to_string(),
            model_family: "ThinkSystem".to_string(),
            form_factor: "1U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 1,
            memory_slot_count: 16,
            drive_bay_count: 10,
            pcie_slot_count: 2,
            supported_cpu_families: vec!["AMD EPYC".to_string(), "Intel Xeon".to_string()],
        });

        self.server_platform_rules.insert("SR650".to_string(), PlatformRules {
            vendor: "Lenovo".to_string(),
            model_family: "ThinkSystem".to_string(),
            form_factor: "2U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 2,
            memory_slot_count: 24,
            drive_bay_count: 16,
            pcie_slot_count: 6,
            supported_cpu_families: vec!["Intel Xeon".to_string()],
        });

        self.server_platform_rules.insert("SR665".to_string(), PlatformRules {
            vendor: "Lenovo".to_string(),
            model_family: "ThinkSystem".to_string(),
            form_factor: "2U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 2,
            memory_slot_count: 32,
            drive_bay_count: 24,
            pcie_slot_count: 8,
            supported_cpu_families: vec!["AMD EPYC".to_string()],
        });

        // Dell PowerEdge rules
        self.server_platform_rules.insert("R750".to_string(), PlatformRules {
            vendor: "Dell".to_string(),
            model_family: "PowerEdge".to_string(),
            form_factor: "2U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 2,
            memory_slot_count: 32,
            drive_bay_count: 16,
            pcie_slot_count: 8,
            supported_cpu_families: vec!["Intel Xeon".to_string()],
        });

        self.server_platform_rules.insert("R740".to_string(), PlatformRules {
            vendor: "Dell".to_string(),
            model_family: "PowerEdge".to_string(),
            form_factor: "2U Rack".to_string(),
            server_type: ServerType::RackServer,
            cpu_socket_count: 2,
            memory_slot_count: 24,
            drive_bay_count: 16,
            pcie_slot_count: 6,
            supported_cpu_families: vec!["Intel Xeon".to_string()],
        });
    }

    pub fn process_hardware_basket(&self, raw_data: Vec<(String, String, String)>) -> ProcessingResult {
        // Phase 1: Classify all components
        println!("🔍 Phase 1: Component Classification");
        let classified_components = self.classify_components(raw_data);
        
        // Phase 2: Identify server platforms
        println!("🔍 Phase 2: Server Platform Detection");
        let detected_platforms = self.detect_server_platforms(&classified_components);
        
        // Phase 3: Assemble server configurations
        println!("🔍 Phase 3: Server Configuration Assembly");
        let server_configurations = self.assemble_server_configurations(&classified_components, &detected_platforms);
        
        // Phase 4: Separate remaining components as upgrade options
        println!("🔍 Phase 4: Component Separation");
        let upgrade_components = self.separate_upgrade_components(&classified_components, &server_configurations);
        
        ProcessingResult {
            server_configurations,
            upgrade_components,
            classification_summary: self.generate_classification_summary(&classified_components),
        }
    }

    fn classify_components(&self, raw_data: Vec<(String, String, String)>) -> Vec<ClassifiedComponent> {
        raw_data.into_iter()
            .map(|(part_number, description, price)| {
                let mut component = self.classifier.classify_component(&description, &part_number);
                
                // Parse price if available
                if let Ok(price_value) = price.replace(['$', ','], "").parse::<f64>() {
                    component.pricing.unit_price = Some(price_value);
                }
                
                component
            })
            .collect()
    }

    fn detect_server_platforms(&self, components: &[ClassifiedComponent]) -> Vec<String> {
        let mut detected_platforms = std::collections::HashSet::new();
        
        for component in components {
            for platform in &component.compatibility.platforms {
                if self.server_platform_rules.contains_key(platform) {
                    detected_platforms.insert(platform.clone());
                }
            }
        }
        
        let platforms: Vec<String> = detected_platforms.into_iter().collect();
        println!("🔍 Detected server platforms: {:?}", platforms);
        platforms
    }

    fn assemble_server_configurations(&self, components: &[ClassifiedComponent], platforms: &[String]) -> Vec<ServerConfiguration> {
        let mut configurations = Vec::new();
        
        for platform in platforms {
            if let Some(platform_rules) = self.server_platform_rules.get(platform) {
                // Find components compatible with this platform
                let compatible_components: Vec<&ClassifiedComponent> = components.iter()
                    .filter(|comp| comp.compatibility.platforms.contains(platform))
                    .collect();
                
                // Group compatible components by CPU to create different configurations
                let cpu_components: Vec<&ClassifiedComponent> = compatible_components.iter()
                    .filter(|comp| matches!(comp.component_subcategory, Some(ComponentSubcategory::Cpu)))
                    .cloned()
                    .collect();
                
                if cpu_components.is_empty() {
                    // Create base configuration without CPU specified
                    let config = self.create_base_configuration(platform, platform_rules, &compatible_components, None);
                    configurations.push(config);
                } else {
                    // Create configuration for each CPU option
                    for cpu in cpu_components {
                        let config = self.create_base_configuration(platform, platform_rules, &compatible_components, Some(cpu));
                        configurations.push(config);
                    }
                }
            }
        }
        
        println!("✅ Assembled {} server configurations", configurations.len());
        configurations
    }

    fn create_base_configuration(
        &self, 
        platform: &str, 
        rules: &PlatformRules, 
        compatible_components: &[&ClassifiedComponent],
        cpu: Option<&ClassifiedComponent>
    ) -> ServerConfiguration {
        
        let cpu_info = cpu.map(|c| format!(" - {}", c.model)).unwrap_or_default();
        
        ServerConfiguration {
            id: format!("{}_{}", platform, Uuid::new_v4().to_string()[..8].to_string()),
            vendor: rules.vendor.clone(),
            model_family: rules.model_family.clone(),
            model_number: platform.to_string(),
            display_name: format!("{} {} {}{} ({})", 
                rules.vendor, rules.model_family, platform, cpu_info, rules.form_factor),
            form_factor: rules.form_factor.clone(),
            server_type: rules.server_type.clone(),
            base_configuration: BaseConfiguration {
                cpu: cpu.cloned(),
                memory: compatible_components.iter()
                    .filter(|comp| matches!(comp.component_subcategory, Some(ComponentSubcategory::SystemMemory)))
                    .take(2) // Base memory configuration
                    .cloned()
                    .cloned()
                    .collect(),
                storage: compatible_components.iter()
                    .filter(|comp| matches!(comp.component_subcategory, Some(ComponentSubcategory::Ssd) | Some(ComponentSubcategory::Hdd)))
                    .take(1) // Base storage
                    .cloned()
                    .cloned()
                    .collect(),
                network: compatible_components.iter()
                    .filter(|comp| matches!(comp.component_subcategory, Some(ComponentSubcategory::Ethernet)))
                    .take(1) // Base network
                    .cloned()
                    .cloned()
                    .collect(),
                power: compatible_components.iter()
                    .filter(|comp| matches!(comp.component_subcategory, Some(ComponentSubcategory::PowerSupply)))
                    .take(1) // Base power
                    .cloned()
                    .cloned()
                    .collect(),
            },
            upgrade_options: compatible_components.iter()
                .filter(|comp| !matches!(comp.primary_category, PrimaryCategory::ServerChassis))
                .cloned()
                .cloned()
                .collect(),
            compatibility_matrix: CompatibilityMatrix {
                cpu_sockets: rules.cpu_socket_count,
                memory_slots: rules.memory_slot_count,
                drive_bays: rules.drive_bay_count,
                pcie_slots: rules.pcie_slot_count,
                max_memory_capacity: Some("4TB".to_string()), // Default - should be calculated
                supported_cpu_families: rules.supported_cpu_families.clone(),
            },
            pricing: ComponentPricing {
                unit_price: self.calculate_base_price(cpu, &compatible_components),
                currency: "USD".to_string(),
                volume_discounts: None,
            },
        }
    }

    fn calculate_base_price(&self, cpu: Option<&ClassifiedComponent>, components: &[&ClassifiedComponent]) -> Option<f64> {
        let mut total_price = 0.0;
        let mut has_price = false;
        
        // Add CPU price
        if let Some(cpu) = cpu {
            if let Some(price) = cpu.pricing.unit_price {
                total_price += price;
                has_price = true;
            }
        }
        
        // Add base component prices (sample of each type)
        let mut memory_added = false;
        let mut storage_added = false;
        let mut network_added = false;
        
        for component in components {
            if let Some(price) = component.pricing.unit_price {
                match component.component_subcategory {
                    Some(ComponentSubcategory::SystemMemory) if !memory_added => {
                        total_price += price;
                        memory_added = true;
                        has_price = true;
                    },
                    Some(ComponentSubcategory::Ssd) | Some(ComponentSubcategory::Hdd) if !storage_added => {
                        total_price += price;
                        storage_added = true;
                        has_price = true;
                    },
                    Some(ComponentSubcategory::Ethernet) if !network_added => {
                        total_price += price;
                        network_added = true;
                        has_price = true;
                    },
                    _ => {}
                }
            }
        }
        
        if has_price { Some(total_price) } else { None }
    }

    fn separate_upgrade_components(&self, all_components: &[ClassifiedComponent], server_configs: &[ServerConfiguration]) -> Vec<ClassifiedComponent> {
        // Components that are not part of any base server configuration
        let mut used_component_ids = std::collections::HashSet::new();
        
        for config in server_configs {
            if let Some(ref cpu) = config.base_configuration.cpu {
                used_component_ids.insert(&cpu.id);
            }
            for comp in &config.base_configuration.memory {
                used_component_ids.insert(&comp.id);
            }
            for comp in &config.base_configuration.storage {
                used_component_ids.insert(&comp.id);
            }
            for comp in &config.base_configuration.network {
                used_component_ids.insert(&comp.id);
            }
            for comp in &config.base_configuration.power {
                used_component_ids.insert(&comp.id);
            }
        }
        
        all_components.iter()
            .filter(|comp| !used_component_ids.contains(&comp.id))
            .filter(|comp| !matches!(comp.primary_category, PrimaryCategory::ServerChassis))
            .cloned()
            .collect()
    }

    fn generate_classification_summary(&self, components: &[ClassifiedComponent]) -> ClassificationSummary {
        let mut summary = ClassificationSummary::default();
        
        for component in components {
            match component.primary_category {
                PrimaryCategory::ServerChassis => summary.server_chassis_count += 1,
                PrimaryCategory::Component => {
                    summary.component_count += 1;
                    match component.component_category {
                        Some(ComponentCategory::Processing) => summary.cpu_count += 1,
                        Some(ComponentCategory::Memory) => summary.memory_count += 1,
                        Some(ComponentCategory::Storage) => summary.storage_count += 1,
                        Some(ComponentCategory::Networking) => summary.networking_count += 1,
                        Some(ComponentCategory::Power) => summary.power_count += 1,
                        _ => summary.other_component_count += 1,
                    }
                },
                PrimaryCategory::Accessory => summary.accessory_count += 1,
                _ => summary.other_count += 1,
            }
        }
        
        summary
    }
}

#[derive(Debug)]
pub struct ProcessingResult {
    pub server_configurations: Vec<ServerConfiguration>,
    pub upgrade_components: Vec<ClassifiedComponent>,
    pub classification_summary: ClassificationSummary,
}

#[derive(Debug, Default, Serialize, Deserialize)]
pub struct ClassificationSummary {
    pub server_chassis_count: u32,
    pub component_count: u32,
    pub cpu_count: u32,
    pub memory_count: u32,
    pub storage_count: u32,
    pub networking_count: u32,
    pub power_count: u32,
    pub other_component_count: u32,
    pub accessory_count: u32,
    pub other_count: u32,
}
