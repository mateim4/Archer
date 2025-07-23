use crate::hardware_parser::HardwareParser;
use crate::models::UniversalServer;
use crate::Result;
use crate::error::CoreEngineError;
use quick_xml::de::from_str;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct SystemConfiguration {
    #[serde(rename = "@Model")]
    model: String,
    #[serde(rename = "@ServiceTag")]
    service_tag: String,
    #[serde(rename = "Component")]
    components: Vec<Component>,
}

#[derive(Debug, Deserialize)]
struct Component {
    #[serde(rename = "@FQDD")]
    fqdd: String,
    #[serde(rename = "Attribute", default)]
    attributes: Vec<Attribute>,
    #[serde(rename = "Component", default)]
    components: Vec<Component>,
}

#[derive(Debug, Deserialize)]
struct Attribute {
    #[serde(rename = "@Name")]
    name: String,
    #[serde(rename = "$text")]
    value: Option<String>,
}

pub struct DellScpParser;

impl HardwareParser for DellScpParser {
    fn parse(&self, content: &str) -> Result<UniversalServer> {
        let config: SystemConfiguration = from_str(content)
            .map_err(|e| CoreEngineError::parsing(format!("Failed to parse Dell SCP XML: {}", e)))?;

        let mut server = UniversalServer {
            vendor: "Dell".to_string(),
            model_name: Some(config.model.clone()),
            serial_number: Some(config.service_tag.clone()),
            ..Default::default()
        };

        for component in config.components {
            self.parse_component(&mut server, &component)?;
        }

        Ok(server)
    }
}

impl DellScpParser {
    fn parse_component(&self, server: &mut UniversalServer, component: &Component) -> Result<()> {
        let fqdd = component.fqdd.as_str();

        match fqdd {
            _ if fqdd.starts_with("BIOS.Setup") => self.parse_bios(server, component)?,
            _ if fqdd.starts_with("iDRAC.Embedded") => self.parse_idrac(server, component)?,
            // Add other component types here as needed
            _ => {
                // You could log unknown components here if needed
            }
        }

        // Recursively parse nested components
        for sub_component in &component.components {
            self.parse_component(server, sub_component)?;
        }

        Ok(())
    }

    fn parse_bios(&self, server: &mut UniversalServer, component: &Component) -> Result<()> {
        let mut cpu = server.cpus.pop().unwrap_or_default();
        let mut bios_attributes = std::collections::HashMap::new();

        for attr in &component.attributes {
            if let Some(value) = &attr.value {
                match attr.name.as_str() {
                    "ProcCores" => {
                        if value == "All" {
                            // We can't know the exact core count from "All", so we leave it as None
                        } else if let Ok(cores) = value.parse::<u32>() {
                            cpu.core_count = Some(cores);
                        }
                    }
                    "ProcVirtualization" => {
                        bios_attributes.insert("Virtualization".to_string(), value.clone());
                    }
                    // Add other BIOS attributes as needed
                    _ => {
                        bios_attributes.insert(attr.name.clone(), value.clone());
                    }
                }
            }
        }

        // This is a simplification. In reality, you'd have a more robust way
        // of handling multiple CPUs.
        server.cpus.push(cpu);

        Ok(())
    }

    fn parse_idrac(&self, server: &mut UniversalServer, component: &Component) -> Result<()> {
        let mut idrac = server.management.take().unwrap_or_default();
        idrac.model = Some("iDRAC".to_string());
        idrac.fqdd = Some(component.fqdd.clone());

        for attr in &component.attributes {
            if let Some(value) = &attr.value {
                match attr.name.as_str() {
                    "DNSRacName" => idrac.dns_name = Some(value.clone()),
                    // Add other iDRAC attributes as needed
                    _ => {
                        idrac.vendor_specific_attributes.insert(attr.name.clone(), value.clone());
                    }
                }
            }
        }

        server.management = Some(idrac);
        Ok(())
    }
}
