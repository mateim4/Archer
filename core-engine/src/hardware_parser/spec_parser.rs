use crate::models::hardware_basket::{ProcessorSpec, MemorySpec, StorageSpec, NetworkSpec, NetworkPort, StorageSlot};
use regex::{Regex, Captures};
use once_cell::sync::Lazy;

// This module is responsible for parsing raw string descriptions of hardware
// components into structured data models.

// --- Regex Definitions ---
// Using once_cell::sync::Lazy to compile regexes only once for performance.

static PROCESSOR_REGEX: Lazy<Regex> = Lazy::new(|| {
    // Updated regex to handle Dell processor descriptions like "1 x 4309Y" or "2 x 5415+ (8C/16T 2.9Ghz)" or "1x 8C/16T 4thGeneration"
    Regex::new(r"(?i)(?:(\d+)\s*x\s+)?(?:(\d+)C/(\d+)T\s+)?([^(]+?)(?:\s*\(.*?\))?$").unwrap()
});

// Regex to capture core/thread notation like "8C/16T" (case-insensitive)
static PROCESSOR_CT_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d+)\s*C\s*/\s*(\d+)\s*T").unwrap()
});

// Regex to capture cores only notation like "10C" or "16 C" (case-insensitive)
static PROCESSOR_CORES_ONLY_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d+)\s*C\b").unwrap()
});

// Frequency regex to match "2.7GHz", "2.7 GHz", case-insensitive
static PROCESSOR_FREQ_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d+(?:\.\d+)?)\s*GHz").unwrap()
});

static MEMORY_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d+)GB\s*(?:RDIMM|LRDIMM|DIMM),\s*(\d+)MT/s").unwrap()
});

static STORAGE_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(\d+(?:GB|TB))\s*SSD\s*(SATA|SAS|NVMe)").unwrap()
});

static NETWORK_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:(Quad|Dual|Single)\s*Port\s*)?(\d+)(GbE|Gb|MB)\s*(BASE-T|SFP\+|SFP28|QSFP\+)?").unwrap()
});


/// Main struct for the specification parser.
pub struct SpecParser;

impl SpecParser {
    pub fn new() -> Self {
        Self
    }

    /// Parses a processor description string.
    /// Example: "1 x 4309Y", "2 x 5415+ (8C/16T 2.9Ghz)", "1x 8C/16T 4thGeneration"
    pub fn parse_processor(&self, description: &str) -> Option<ProcessorSpec> {
        PROCESSOR_REGEX.captures(description).map(|caps| {
            let count = get_capture_i32(&caps, 1).unwrap_or(1);
            // initial optional captures from the broad regex
            let mut cores = get_capture_i32(&caps, 2);
            let mut threads = get_capture_i32(&caps, 3);
            let model = caps.get(4).map_or("".to_string(), |m| m.as_str().trim().to_string());

            // Try to extract core/thread from the model or description using improved regexes
            let mut core_count = cores;
            let mut thread_count = threads;
            let mut frequency_ghz: Option<f32> = None;

            // Prefer explicit CT pattern anywhere in description or model
            if let Some(ct_caps) = PROCESSOR_CT_REGEX.captures(description).or_else(|| PROCESSOR_CT_REGEX.captures(&model)) {
                core_count = ct_caps.get(1).and_then(|m| m.as_str().parse::<i32>().ok());
                thread_count = ct_caps.get(2).and_then(|m| m.as_str().parse::<i32>().ok());
            } else if let Some(caps_cores) = PROCESSOR_CORES_ONLY_REGEX.captures(description).or_else(|| PROCESSOR_CORES_ONLY_REGEX.captures(&model)) {
                core_count = caps_cores.get(1).and_then(|m| m.as_str().parse::<i32>().ok());
            }

            if let Some(freq_caps) = PROCESSOR_FREQ_REGEX.captures(description).or_else(|| PROCESSOR_FREQ_REGEX.captures(&model)) {
                frequency_ghz = freq_caps.get(1).and_then(|m| m.as_str().parse::<f32>().ok());
            }

            ProcessorSpec {
                count,
                model,
                cores,
                threads,
                base_frequency: None,
                max_frequency: None,
                tdp: self.parse_tdp(description),
                socket_type: None,
                core_count,
                thread_count,
                frequency_ghz,
            }
        })
    }

    /// Parses a memory description string.
    /// Example: "32GB RDIMM, 4800MT/s Single Rank"
    pub fn parse_memory(&self, description: &str) -> Option<MemorySpec> {
        if description.is_empty() {
            return None;
        }
        
        // Pattern to match memory specs like "32GB", "64GB", etc.
        let capacity_regex = Regex::new(r"(\d+)\s*GB").unwrap();
        let speed_regex = Regex::new(r"(\d+)MT/s").unwrap();
        let type_regex = Regex::new(r"(DDR[345]|RDIMM|LRDIMM|ECC)").unwrap();
        
        // Extract capacity (required field)
        let total_capacity = if let Some(caps) = capacity_regex.captures(description) {
            if let Some(capacity) = caps.get(1).and_then(|m| m.as_str().parse::<i32>().ok()) {
                format!("{}GB", capacity)
            } else {
                return None;
            }
        } else {
            return None;
        };
        
        // Extract speed
        let speed = if let Some(caps) = speed_regex.captures(description) {
            if let Some(speed) = caps.get(1) {
                Some(format!("{}MT/s", speed.as_str()))
            } else {
                None
            }
        } else {
            None
        };
        
        // Detect memory type (required field)
        let description_upper = description.to_uppercase();
        let memory_type = if description_upper.contains("DDR5") {
            "DDR5".to_string()
        } else if description_upper.contains("DDR4") {
            "DDR4".to_string()
        } else if description_upper.contains("DDR3") {
            "DDR3".to_string()
        } else if description_upper.contains("RDIMM") {
            "RDIMM".to_string()
        } else if description_upper.contains("LRDIMM") {
            "LRDIMM".to_string()
        } else {
            "DDR4".to_string() // Default fallback
        };
        
        // Check for ECC
        let ecc = if description_upper.contains("ECC") {
            Some(true)
        } else {
            None
        };
        
        // Create memory spec with required fields
        Some(MemorySpec {
            total_capacity: total_capacity.clone(),
            module_count: 1, // Default for now
            module_capacity: total_capacity,
            memory_type,
            speed,
            ecc,
        })
    }

    /// Parses a storage description string.
    /// Example: "480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug"
    pub fn parse_storage(&self, description: &str) -> Option<StorageSpec> {
        if description.is_empty() {
            return None;
        }
        
        // Pattern to match storage capacity like "480GB", "1.92TB", etc.
        let capacity_regex = Regex::new(r"(\d+(?:\.\d+)?)\s*(GB|TB)").unwrap();
        let interface_regex = Regex::new(r"(SATA|SAS|NVMe|PCIe)").unwrap();
        let form_factor_regex = Regex::new(r"(\d+\.\d+)\s*in").unwrap();
        
        // Extract capacity
        let total_capacity = if let Some(caps) = capacity_regex.captures(description) {
            if let Some(size) = caps.get(1) {
                if let Some(unit) = caps.get(2) {
                    format!("{}{}", size.as_str(), unit.as_str())
                } else {
                    return None;
                }
            } else {
                return None;
            }
        } else {
            return None;
        };
        
        // Create storage slots
        let mut slots = Vec::new();
        let description_upper = description.to_uppercase();
        
        if description_upper.contains("SSD") || description_upper.contains("HDD") || 
           description_upper.contains("NVME") || description_upper.contains("SATA") {
            
            // Determine interface
            let interface = if let Some(caps) = interface_regex.captures(&description_upper) {
                if let Some(intf) = caps.get(1) {
                    intf.as_str().to_string()
                } else {
                    "SATA".to_string()
                }
            } else {
                "SATA".to_string()
            };
            
            // Determine form factor
            let size = if let Some(caps) = form_factor_regex.captures(description) {
                caps.get(1).map(|m| format!("{}\"", m.as_str())).unwrap_or_else(|| "2.5\"".to_string())
            } else if description_upper.contains("3.5") {
                "3.5\"".to_string()
            } else {
                "2.5\"".to_string()
            };
            
            let slot = StorageSlot {
                count: 1,
                size: size,
                interface: interface,
            };
            
            slots.push(slot);
        }
        
        Some(StorageSpec {
            total_capacity: Some(total_capacity),
            slots: slots,
            raid_controller: None,
        })
    }

    /// Parses a network description string.
    /// Example: "Broadcom 5720 Quad Port 1GbE BASE-T Adapter, OCP NIC 3.0"
    pub fn parse_network(&self, description: &str) -> Option<NetworkSpec> {
        if description.is_empty() {
            return None;
        }
        
        // Pattern to match network speeds like "1GbE", "10GbE", "25GbE"
        let speed_regex = Regex::new(r"(\d+)GbE").unwrap();
        let port_regex = Regex::new(r"(Single|Dual|Quad|Four|Two|\d+)\s*(Port|port)").unwrap();
        
        // Extract port count
        let mut port_count = 1; // Default to 1 port
        if let Some(caps) = port_regex.captures(description) {
            if let Some(port_desc) = caps.get(1) {
                port_count = match port_desc.as_str().to_lowercase().as_str() {
                    "single" | "1" => 1,
                    "dual" | "two" | "2" => 2,
                    "quad" | "four" | "4" => 4,
                    _ => {
                        // Try to parse as number
                        port_desc.as_str().parse::<i32>().unwrap_or(1)
                    }
                };
            }
        }
        
        // Extract speed
        let speed = if let Some(caps) = speed_regex.captures(description) {
            if let Some(speed_str) = caps.get(1) {
                format!("{}Gb", speed_str.as_str())
            } else {
                "1Gb".to_string() // Default speed
            }
        } else {
            "1Gb".to_string()
        };
        
        // Determine interface type
        let description_upper = description.to_uppercase();
        let port_type = if description_upper.contains("BASE-T") || description_upper.contains("RJ45") {
            "RJ45".to_string()
        } else if description_upper.contains("SFP") {
            "SFP+".to_string()
        } else if description_upper.contains("FIBER") || description_upper.contains("FIBRE") {
            "Fiber".to_string()
        } else {
            "RJ45".to_string()
        };
        
        // Create network port entry
        let port = NetworkPort {
            count: port_count,
            speed: speed,
            port_type: port_type,
        };
        
        Some(NetworkSpec {
            ports: vec![port],
            management_ports: None,
        })
    }

    /// Helper to parse TDP value from a string like "(150W)".
    fn parse_tdp(&self, description: &str) -> Option<i32> {
        let tdp_regex = Regex::new(r"\((\d+)W\)").unwrap();
        tdp_regex.captures(description)
            .and_then(|caps| caps.get(1))
            .and_then(|m| m.as_str().parse::<i32>().ok())
    }

    /// Parses form factor from Dell model strings like "R450 1U 1S", "R660XS 1U 2S", "R760 2U 2S"
    pub fn parse_form_factor(&self, description: &str) -> Option<String> {
        let form_factor_regex = Regex::new(r"(\d+)U").unwrap();
        form_factor_regex.captures(description)
            .and_then(|caps| caps.get(1))
            .map(|m| format!("{}U", m.as_str()))
    }

    /// Lightweight classifier used by the basket parser to pre-classify a
    /// component description. Returns one of: "processor", "memory",
    /// "storage", "network", or "component".
    pub fn classify_component_for_parser(&self, description: &str) -> String {
        let lower = description.to_lowercase();
        if lower.contains("processor") || lower.contains("cpu") || PROCESSOR_CT_REGEX.is_match(&lower) || PROCESSOR_CORES_ONLY_REGEX.is_match(&lower) {
            return "processor".to_string();
        }
        if lower.contains("memory") || lower.contains("rdimm") || lower.contains("dimm") || MEMORY_REGEX.is_match(&lower) {
            return "memory".to_string();
        }
        if lower.contains("ssd") || lower.contains("hdd") || lower.contains("nvme") || STORAGE_REGEX.is_match(&lower) {
            return "storage".to_string();
        }
        if lower.contains("nic") || lower.contains("ethernet") || NETWORK_REGEX.is_match(&lower) {
            return "network".to_string();
        }
        "component".to_string()
    }
}

/// Helper function to get an i32 from a regex capture group.
fn get_capture_i32(caps: &Captures, index: usize) -> Option<i32> {
    caps.get(index).and_then(|c| c.as_str().parse::<i32>().ok())
}

#[cfg(test)]
mod tests {
    use super::SpecParser;

    #[test]
    fn test_parse_processor_lenovo_examples() {
        let sp = SpecParser::new();

        let s1 = "Intel Xeon Silver 4410T 10C 150W 2.7GHz Processor";
        let p1 = sp.parse_processor(s1).expect("should parse");
        assert_eq!(p1.core_count, Some(10));
        assert_eq!(p1.thread_count, None);
        assert_eq!(p1.frequency_ghz, Some(2.7));

        let s2 = "AMD EPYC 9124 16C 200W 3.0GHz Processor";
        let p2 = sp.parse_processor(s2).expect("should parse");
        assert_eq!(p2.core_count, Some(16));
        assert_eq!(p2.frequency_ghz, Some(3.0));

        let s3 = "Intel Xeon Platinum 8462Y+ 32C 300W 2.8GHz Processor";
        let p3 = sp.parse_processor(s3).expect("should parse");
        assert_eq!(p3.core_count, Some(32));
        assert_eq!(p3.frequency_ghz, Some(2.8));
    }
}
