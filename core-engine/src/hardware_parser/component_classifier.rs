// Hardware Component Classification System
// Based on HARDWARE_SCHEMA_DESIGN.md

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PrimaryCategory {
    ServerChassis,
    Component,
    Accessory,
    Software,
    Service,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ServerType {
    RackServer,
    BladeServer,
    TowerServer,
    ModularServer,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ComponentCategory {
    Processing,
    Memory,
    Storage,
    Networking,
    Power,
    Cooling,
    Expansion,
    Management,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ComponentSubcategory {
    // Processing
    Cpu,
    Gpu,
    Coprocessor,
    
    // Memory
    SystemMemory,
    Nvdimm,
    Hbm,
    
    // Storage
    Hdd,
    Ssd,
    Nvme,
    RaidController,
    Hba,
    BootController,
    DriveBay,
    StorageEnclosure,
    
    // Networking
    Ethernet,
    FibreChannel,
    Infiniband,
    Wireless,
    NetworkSwitch,
    NetworkSecurity,
    
    // Power
    PowerSupply,
    Ups,
    Pdu,
    
    // Cooling
    Fan,
    HeatSink,
    LiquidCooling,
    
    // Expansion
    ExpansionCard,
    RiserCard,
    Backplane,
    
    // Management
    RemoteManagement,
    Kvm,
    Monitoring,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentSpecifications {
    pub cores: Option<u32>,
    pub base_frequency: Option<String>,
    pub cache: Option<String>,
    pub capacity: Option<String>,
    pub speed: Option<String>,
    pub interface: Option<String>,
    pub form_factor: Option<String>,
    pub power_consumption: Option<u32>,
    pub port_count: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentCompatibility {
    pub platforms: Vec<String>,
    pub socket_type: Option<String>,
    pub interface_type: Option<String>,
    pub physical_constraints: Option<String>,
    pub power_requirements: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentPricing {
    pub unit_price: Option<f64>,
    pub currency: String,
    pub volume_discounts: Option<HashMap<u32, f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassifiedComponent {
    pub id: String,
    pub primary_category: PrimaryCategory,
    pub component_category: Option<ComponentCategory>,
    pub component_subcategory: Option<ComponentSubcategory>,
    pub vendor: String,
    pub model: String,
    pub display_name: String,
    pub description: String,
    pub part_number: String,
    pub specifications: ComponentSpecifications,
    pub compatibility: ComponentCompatibility,
    pub pricing: ComponentPricing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfiguration {
    pub id: String,
    pub vendor: String,
    pub model_family: String,
    pub model_number: String,
    pub display_name: String,
    pub form_factor: String,
    pub server_type: ServerType,
    pub base_configuration: BaseConfiguration,
    pub upgrade_options: Vec<ClassifiedComponent>,
    pub compatibility_matrix: CompatibilityMatrix,
    pub pricing: ComponentPricing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaseConfiguration {
    pub cpu: Option<ClassifiedComponent>,
    pub memory: Vec<ClassifiedComponent>,
    pub storage: Vec<ClassifiedComponent>,
    pub network: Vec<ClassifiedComponent>,
    pub power: Vec<ClassifiedComponent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompatibilityMatrix {
    pub cpu_sockets: u32,
    pub memory_slots: u32,
    pub drive_bays: u32,
    pub pcie_slots: u32,
    pub max_memory_capacity: Option<String>,
    pub supported_cpu_families: Vec<String>,
}

// Component Classification Rules
pub struct ComponentClassifier {
    cpu_patterns: Vec<&'static str>,
    memory_patterns: Vec<&'static str>,
    storage_patterns: Vec<&'static str>,
    network_patterns: Vec<&'static str>,
    power_patterns: Vec<&'static str>,
    server_patterns: HashMap<&'static str, Vec<&'static str>>,
}

impl ComponentClassifier {
    pub fn new() -> Self {
        Self {
            cpu_patterns: vec![
                r"(?i)(intel|amd).*(xeon|epyc|core).*(processor|cpu)",
                r"(?i)\d+c[/]\d+t",  // cores/threads pattern
                r"(?i)\d+\.\d+ghz",  // frequency pattern
            ],
            memory_patterns: vec![
                r"(?i)\d+gb.*rdimm",
                r"(?i)\d+gb.*dimm",
                r"(?i)ddr[4-5]",
                r"(?i)memory",
            ],
            storage_patterns: vec![
                r"(?i)\d+(\.\d+)?(tb|gb).*(ssd|hdd|hard.*drive)",
                r"(?i)(sata|sas|nvme|pcie)",
                r"(?i)2\.5.*in|3\.5.*in",  // drive form factors
            ],
            network_patterns: vec![
                r"(?i)\d+gbe|ethernet",
                r"(?i)fibre.*channel|fc\d+",
                r"(?i)(dual|quad).*port",
                r"(?i)(sfp|qsfp|base-t)",
            ],
            power_patterns: vec![
                r"(?i)\d+w.*power.*supply",
                r"(?i)hot.*plug.*power",
                r"(?i)redundant.*power",
            ],
            server_patterns: HashMap::from([
                ("dell", vec!["poweredge r", "poweredge t", "poweredge m"]),
                ("lenovo", vec!["thinksystem sr", "thinksystem st", "thinksystem sd"]),
                ("hpe", vec!["proliant dl", "proliant ml", "proliant bl"]),
            ]),
        }
    }

    pub fn classify_component(&self, description: &str, part_number: &str) -> ClassifiedComponent {
        let description_lower = description.to_lowercase();
        
        // Determine primary category
        let (primary_category, component_category, component_subcategory) = 
            self.determine_component_type(&description_lower);
        
        // Extract specifications
        let specifications = self.extract_specifications(&description_lower, &component_subcategory);
        
        // Extract compatibility info
        let compatibility = self.extract_compatibility(&description_lower);
        
        // Extract vendor info
        let vendor = self.extract_vendor(&description_lower);
        
        ClassifiedComponent {
            id: format!("{}_{}", part_number, uuid::Uuid::new_v4().to_string()[..8].to_string()),
            primary_category,
            component_category,
            component_subcategory,
            vendor,
            model: self.extract_model(description),
            display_name: description.to_string(),
            description: description.to_string(),
            part_number: part_number.to_string(),
            specifications,
            compatibility,
            pricing: ComponentPricing {
                unit_price: None,
                currency: "USD".to_string(),
                volume_discounts: None,
            },
        }
    }

    fn determine_component_type(&self, description: &str) -> (PrimaryCategory, Option<ComponentCategory>, Option<ComponentSubcategory>) {
        // Check for server chassis first
        for (vendor, patterns) in &self.server_patterns {
            for pattern in patterns {
                if description.contains(pattern) {
                    return (PrimaryCategory::ServerChassis, None, None);
                }
            }
        }

        // Check component types
        if self.matches_patterns(description, &self.cpu_patterns) {
            return (PrimaryCategory::Component, Some(ComponentCategory::Processing), Some(ComponentSubcategory::Cpu));
        }
        
        if self.matches_patterns(description, &self.memory_patterns) {
            return (PrimaryCategory::Component, Some(ComponentCategory::Memory), Some(ComponentSubcategory::SystemMemory));
        }
        
        if self.matches_patterns(description, &self.storage_patterns) {
            // Determine storage subcategory
            if description.contains("raid") || description.contains("perc") || description.contains("controller") {
                return (PrimaryCategory::Component, Some(ComponentCategory::Storage), Some(ComponentSubcategory::RaidController));
            } else if description.contains("ssd") {
                return (PrimaryCategory::Component, Some(ComponentCategory::Storage), Some(ComponentSubcategory::Ssd));
            } else {
                return (PrimaryCategory::Component, Some(ComponentCategory::Storage), Some(ComponentSubcategory::Hdd));
            }
        }
        
        if self.matches_patterns(description, &self.network_patterns) {
            if description.contains("fibre") || description.contains("fc") {
                return (PrimaryCategory::Component, Some(ComponentCategory::Networking), Some(ComponentSubcategory::FibreChannel));
            } else {
                return (PrimaryCategory::Component, Some(ComponentCategory::Networking), Some(ComponentSubcategory::Ethernet));
            }
        }
        
        if self.matches_patterns(description, &self.power_patterns) {
            return (PrimaryCategory::Component, Some(ComponentCategory::Power), Some(ComponentSubcategory::PowerSupply));
        }

        // Default to accessory if no clear classification
        (PrimaryCategory::Accessory, None, None)
    }

    fn matches_patterns(&self, text: &str, patterns: &[&str]) -> bool {
        patterns.iter().any(|pattern| {
            regex::Regex::new(pattern)
                .map(|re| re.is_match(text))
                .unwrap_or(false)
        })
    }

    fn extract_specifications(&self, description: &str, subcategory: &Option<ComponentSubcategory>) -> ComponentSpecifications {
        let mut specs = ComponentSpecifications {
            cores: None,
            base_frequency: None,
            cache: None,
            capacity: None,
            speed: None,
            interface: None,
            form_factor: None,
            power_consumption: None,
            port_count: None,
        };

        match subcategory {
            Some(ComponentSubcategory::Cpu) => {
                // Extract CPU specifications
                if let Some(caps) = regex::Regex::new(r"(\d+)c[/](\d+)t").unwrap().captures(description) {
                    specs.cores = caps.get(1).and_then(|m| m.as_str().parse().ok());
                }
                if let Some(caps) = regex::Regex::new(r"(\d+\.\d+)ghz").unwrap().captures(description) {
                    specs.base_frequency = caps.get(1).map(|m| format!("{}GHz", m.as_str()));
                }
                if let Some(caps) = regex::Regex::new(r"(\d+)m.*cache").unwrap().captures(description) {
                    specs.cache = caps.get(1).map(|m| format!("{}MB", m.as_str()));
                }
            },
            Some(ComponentSubcategory::SystemMemory) => {
                // Extract memory specifications
                if let Some(caps) = regex::Regex::new(r"(\d+)gb").unwrap().captures(description) {
                    specs.capacity = caps.get(1).map(|m| format!("{}GB", m.as_str()));
                }
                if let Some(caps) = regex::Regex::new(r"ddr([4-5])-?(\d+)").unwrap().captures(description) {
                    specs.speed = Some(format!("DDR{}-{}", 
                        caps.get(1).map(|m| m.as_str()).unwrap_or("4"),
                        caps.get(2).map(|m| m.as_str()).unwrap_or("3200")
                    ));
                }
            },
            Some(ComponentSubcategory::Ssd) | Some(ComponentSubcategory::Hdd) => {
                // Extract storage specifications
                if let Some(caps) = regex::Regex::new(r"(\d+(?:\.\d+)?)(tb|gb)").unwrap().captures(description) {
                    specs.capacity = Some(format!("{}{}", 
                        caps.get(1).map(|m| m.as_str()).unwrap(),
                        caps.get(2).map(|m| m.as_str().to_uppercase()).unwrap()
                    ));
                }
                if description.contains("sata") {
                    specs.interface = Some("SATA".to_string());
                } else if description.contains("sas") {
                    specs.interface = Some("SAS".to_string());
                } else if description.contains("nvme") {
                    specs.interface = Some("NVMe".to_string());
                }
            },
            Some(ComponentSubcategory::Ethernet) => {
                // Extract network specifications
                if let Some(caps) = regex::Regex::new(r"(\d+)gbe").unwrap().captures(description) {
                    specs.speed = caps.get(1).map(|m| format!("{}GbE", m.as_str()));
                }
                if description.contains("dual") {
                    specs.port_count = Some(2);
                } else if description.contains("quad") {
                    specs.port_count = Some(4);
                }
            },
            _ => {}
        }

        specs
    }

    fn extract_compatibility(&self, description: &str) -> ComponentCompatibility {
        let mut platforms = Vec::new();
        
        // Extract server platform compatibility
        if description.contains("sr630") { platforms.push("SR630".to_string()); }
        if description.contains("sr645") { platforms.push("SR645".to_string()); }
        if description.contains("sr650") { platforms.push("SR650".to_string()); }
        if description.contains("sr665") { platforms.push("SR665".to_string()); }
        if description.contains("r750") { platforms.push("R750".to_string()); }
        if description.contains("r740") { platforms.push("R740".to_string()); }

        ComponentCompatibility {
            platforms,
            socket_type: None,
            interface_type: None,
            physical_constraints: None,
            power_requirements: None,
        }
    }

    fn extract_vendor(&self, description: &str) -> String {
        if description.contains("intel") {
            "Intel".to_string()
        } else if description.contains("amd") {
            "AMD".to_string()
        } else if description.contains("broadcom") {
            "Broadcom".to_string()
        } else if description.contains("dell") {
            "Dell".to_string()
        } else if description.contains("lenovo") || description.contains("thinksystem") {
            "Lenovo".to_string()
        } else {
            "Unknown".to_string()
        }
    }

    fn extract_model(&self, description: &str) -> String {
        // Extract meaningful model information from description
        // This is a simplified version - could be much more sophisticated
        description.split_whitespace()
            .take(5)
            .collect::<Vec<_>>()
            .join(" ")
    }
}
