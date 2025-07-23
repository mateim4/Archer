use crate::hardware_parser::HardwareParser;
use crate::models::{UniversalServer, CPU, MemoryDIMM, StorageController};
use crate::Result;
use crate::error::CoreEngineError;
use quick_xml::de::from_str;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Configuration {
    #[serde(rename = "System")]
    system: System,
}

#[derive(Debug, Deserialize)]
struct System {
    #[serde(rename = "ProductName")]
    product_name: String,
    #[serde(rename = "SerialNumber")]
    serial_number: String,
    #[serde(rename = "Processor")]
    processors: Vec<Processor>,
    #[serde(rename = "Memory")]
    memory: Vec<Memory>,
    #[serde(rename = "Storage")]
    storage: Vec<Storage>,
}

#[derive(Debug, Deserialize)]
struct Processor {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "CoreCount")]
    core_count: u32,
    #[serde(rename = "ThreadCount")]
    thread_count: u32,
    #[serde(rename = "Speed")]
    speed_ghz: f32,
}

#[derive(Debug, Deserialize)]
struct Memory {
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "CapacityGB")]
    capacity_gb: u32,
    #[serde(rename = "SpeedMHz")]
    speed_mhz: u32,
    #[serde(rename = "Type")]
    mem_type: String,
}

#[derive(Debug, Deserialize)]
struct Storage {
    #[serde(rename = "Adapter")]
    adapters: Vec<Adapter>,
}

#[derive(Debug, Deserialize)]
struct Adapter {
    #[serde(rename = "Name")]
    name: String,
}


pub struct LenovoDcscParser;

impl HardwareParser for LenovoDcscParser {
    fn parse(&self, content: &str) -> Result<UniversalServer> {
        // The DCSC XML might have a different root element, so we need to handle that.
        // This is a simplified approach. A more robust solution would inspect the XML structure.
        let content = content.replace("<config_root>", "").replace("</config_root>", "");

        let config: Configuration = from_str(&content)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to parse Lenovo DCSC XML: {}", e)))?;

        let mut server = UniversalServer {
            vendor: "Lenovo".to_string(),
            model_name: Some(config.system.product_name.clone()),
            serial_number: Some(config.system.serial_number.clone()),
            ..Default::default()
        };

        for proc in config.system.processors {
            server.cpus.push(CPU {
                model_string: Some(proc.name),
                core_count: Some(proc.core_count),
                thread_count: Some(proc.thread_count),
                speed_ghz: Some(proc.speed_ghz),
                ..Default::default()
            });
        }

        for mem in config.system.memory {
            server.memory.push(MemoryDIMM {
                vendor_part_number: Some(mem.name),
                capacity_gb: Some(mem.capacity_gb),
                speed_mhz: Some(mem.speed_mhz),
                memory_type: Some(mem.mem_type),
                ..Default::default()
            });
        }

        for storage_group in config.system.storage {
            for adapter in storage_group.adapters {
                server.storage_controllers.push(StorageController {
                    model: Some(adapter.name),
                    ..Default::default()
                });
            }
        }


        Ok(server)
    }
}
