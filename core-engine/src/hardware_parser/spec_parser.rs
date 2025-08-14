use crate::models::hardware_basket::{ProcessorSpec, MemorySpec, StorageSpec, NetworkSpec, NetworkPort, StorageSlot};
use regex::{Regex, Captures};
use once_cell::sync::Lazy;

// This module is responsible for parsing raw string descriptions of hardware
// components into structured data models.

// --- Regex Definitions ---
// Using once_cell::sync::Lazy to compile regexes only once for performance.

static PROCESSOR_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)(?:(\d+)\s*x\s*)?.*(?:Intel|AMD)\s*(?:Xeon|EPYC|Ryzen)\s*([\w\-\s]+?)\s*(\d\.\d+G(?:Hz)?),?\s*(\d+)C/(\d+)T").unwrap()
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
    /// Example: "Intel® Xeon® Gold 5416S 2.0G, 16C/32T, 16.0GT/s, 30M Cache, Turbo, HT (150W) DDR5-4400"
    /// Example: "2 x Intel® Xeon® Gold 6442Y 2.6G, 32C/64T, 16.0GT/s, 60M Cache, Turbo, HT (225W) DDR5-4800"
    pub fn parse_processor(&self, description: &str) -> Option<ProcessorSpec> {
        PROCESSOR_REGEX.captures(description).map(|caps| {
            let count = get_capture_i32(&caps, 1).unwrap_or(1);
            let model = caps.get(2).map_or("".to_string(), |m| m.as_str().trim().to_string());
            let base_frequency = caps.get(3).map_or("".to_string(), |m| m.as_str().to_string());
            let cores = get_capture_i32(&caps, 4);
            let threads = get_capture_i32(&caps, 5);

            ProcessorSpec {
                count,
                model,
                cores,
                threads,
                base_frequency: Some(base_frequency),
                max_frequency: None, // Could be parsed from "Turbo" if needed
                tdp: self.parse_tdp(description),
                socket_type: None, // Not typically in this string
            }
        })
    }

    /// Parses a memory description string.
    /// Example: "32GB RDIMM, 4800MT/s Single Rank"
    pub fn parse_memory(&self, description: &str) -> Option<MemorySpec> {
        // Implementation will follow
        None // Placeholder
    }

    /// Parses a storage description string.
    /// Example: "480GB SSD SATA Read Intensive 6Gbps 512 2.5in Hot-plug"
    pub fn parse_storage(&self, description: &str) -> Option<StorageSpec> {
        // Implementation will follow
        None // Placeholder
    }

    /// Parses a network description string.
    /// Example: "Broadcom 5720 Quad Port 1GbE BASE-T Adapter, OCP NIC 3.0"
    pub fn parse_network(&self, description: &str) -> Option<NetworkSpec> {
        // Implementation will follow
        None // Placeholder
    }

    /// Helper to parse TDP value from a string like "(150W)".
    fn parse_tdp(&self, description: &str) -> Option<i32> {
        let tdp_regex = Regex::new(r"\((\d+)W\)").unwrap();
        tdp_regex.captures(description)
            .and_then(|caps| caps.get(1))
            .and_then(|m| m.as_str().parse::<i32>().ok())
    }
}

/// Helper function to get an i32 from a regex capture group.
fn get_capture_i32(caps: &Captures, index: usize) -> Option<i32> {
    caps.get(index).and_then(|c| c.as_str().parse::<i32>().ok())
}
