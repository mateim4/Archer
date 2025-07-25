use crate::models::*;
use crate::error::CoreEngineError;
use calamine::{open_workbook, Reader, Xlsx, DataType};
use serde::Deserialize;
use std::collections::HashMap;

// A new top-level struct for the network topology
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct NetworkTopology {
    pub clusters: Vec<Cluster>,
}

// Raw structs for deserializing each sheet
#[derive(Debug, Deserialize)]
struct VmInfoRow {
    #[serde(rename = "VM")]
    vm: String,
    #[serde(rename = "Host")]
    host: String,
    #[serde(rename = "Cluster")]
    cluster: String,
    #[serde(rename = "Powerstate")]
    power_state: String,
}

#[derive(Debug, Deserialize)]
struct VNetworkRow {
    #[serde(rename = "VM")]
    vm: String,
    #[serde(rename = "NIC Label")]
    nic_label: String,
    #[serde(rename = "Network Name")]
    network_name: String,
    #[serde(rename = "MAC Address")]
    mac_address: String,
    #[serde(rename = "IPv4 Address")]
    ip_address: String,
}

#[derive(Debug, Deserialize)]
struct VSwitchRow {
    #[serde(rename = "Host")]
    host: String,
    #[serde(rename = "Switch")]
    name: String,
    #[serde(rename = "Type")]
    switch_type: Option<String>, // Not always present
}

#[derive(Debug, Deserialize)]
struct VPortRow {
    #[serde(rename = "Host")]
    host: String,
    #[serde(rename = "Port Group")]
    name: String,
    #[serde(rename = "VLAN ID")]
    vlan_id: String, // Read as string and parse later
    #[serde(rename = "Switch")]
    vswitch: String,
}

#[derive(Debug, Deserialize)]
struct VNicRow {
    #[serde(rename = "Host")]
    host: String,
    #[serde(rename = "Name")]
    name: String,
    #[serde(rename = "Speed")]
    speed_mbps: Option<u32>,
    #[serde(rename = "MAC Address")]
    mac_address: String,
    #[serde(rename = "Switch")]
    vswitch: String,
}

pub fn parse_rvtools_report(file_path: &str) -> Result<NetworkTopology, CoreEngineError> {
    let mut workbook: Xlsx<std::io::BufReader<std::fs::File>> = open_workbook(file_path).map_err(|e: calamine::XlsxError| CoreEngineError::parsing(e.to_string()))?;

    // 1. Parse all sheets into vectors of raw structs
    let vinfo_rows: Vec<VmInfoRow> = get_sheet_data(&mut workbook, "vInfo")?;
    let vnetwork_rows: Vec<VNetworkRow> = get_sheet_data(&mut workbook, "vNetwork")?;
    let vswitch_rows: Vec<VSwitchRow> = get_sheet_data(&mut workbook, "vSwitch")?;
    let vport_rows: Vec<VPortRow> = get_sheet_data(&mut workbook, "vPort")?;
    let vnic_rows: Vec<VNicRow> = get_sheet_data(&mut workbook, "vNIC")?;

    // 2. Organize data into HashMaps for efficient lookup
    let vms_by_host: HashMap<String, Vec<VmInfoRow>> =
        vinfo_rows.into_iter().fold(HashMap::new(), |mut acc, row| {
            acc.entry(row.host.clone()).or_default().push(row);
            acc
        });

    let vnics_by_vm: HashMap<String, Vec<VNetworkRow>> =
        vnetwork_rows.into_iter().fold(HashMap::new(), |mut acc, row| {
            acc.entry(row.vm.clone()).or_default().push(row);
            acc
        });

    let vswitches_by_host: HashMap<String, Vec<VSwitchRow>> =
        vswitch_rows.into_iter().fold(HashMap::new(), |mut acc, row| {
            acc.entry(row.host.clone()).or_default().push(row);
            acc
        });

    let port_groups_by_vswitch_host: HashMap<(String, String), Vec<VPortRow>> =
        vport_rows.into_iter().fold(HashMap::new(), |mut acc, row| {
            acc.entry((row.vswitch.clone(), row.host.clone())).or_default().push(row);
            acc
        });

    let pnics_by_vswitch_host: HashMap<(String, String), Vec<VNicRow>> =
        vnic_rows.into_iter().fold(HashMap::new(), |mut acc, row| {
            if !row.vswitch.is_empty() {
                acc.entry((row.vswitch.clone(), row.host.clone())).or_default().push(row);
            }
            acc
        });


    // 3. Build the final NetworkTopology struct
    let mut topology = NetworkTopology { clusters: vec![] };
    let mut clusters: HashMap<String, Cluster> = HashMap::new();

    // Group hosts by cluster
    let hosts_by_cluster: HashMap<String, Vec<String>> = vms_by_host.values()
        .flat_map(|vms| vms.iter())
        .map(|vm| (vm.cluster.clone(), vm.host.clone()))
        .fold(HashMap::new(), |mut acc, (cluster, host)| {
            let hosts = acc.entry(cluster).or_default();
            if !hosts.contains(&host) {
                hosts.push(host);
            }
            acc
        });

    for (cluster_name, host_names) in hosts_by_cluster {
        let mut cluster = Cluster {
            name: cluster_name.clone(),
            hosts: vec![],
            vms: vec![],
            metrics: Default::default(),
            health_status: Default::default(),
        };

        for host_name in host_names {
            let mut host = Host {
                name: host_name.clone(),
                vms: vec![],
                virtual_switches: vec![],
                physical_nics: vec![],
                ..Default::default()
            };

            // Build Virtual Switches
            if let Some(vswitches) = vswitches_by_host.get(&host_name) {
                for vswitch_row in vswitches {
                    let mut virtual_switch = VirtualSwitch {
                        name: vswitch_row.name.clone(),
                        switch_type: SwitchType::from_string(&vswitch_row.switch_type.clone().unwrap_or("Standard".to_string())),
                        physical_adapters: vec![],
                        enable_sr_iov: false,
                        enable_rdma: false,
                        port_groups: vec![],
                    };

                    // Add Port Groups to vSwitch
                    if let Some(pg_rows) = port_groups_by_vswitch_host.get(&(vswitch_row.name.clone(), host_name.clone())) {
                        for pg_row in pg_rows {
                            virtual_switch.port_groups.push(PortGroup {
                                name: pg_row.name.clone(),
                                vlan_id: pg_row.vlan_id.parse().unwrap_or(0),
                            });
                        }
                    }

                    // Add Physical NICs to vSwitch
                    if let Some(pnic_rows) = pnics_by_vswitch_host.get(&(vswitch_row.name.clone(), host_name.clone())) {
                        for pnic_row in pnic_rows {
                            virtual_switch.physical_adapters.push(pnic_row.name.clone());
                            host.physical_nics.push(PhysicalNic {
                                name: pnic_row.name.clone(),
                                speed_mbps: pnic_row.speed_mbps.unwrap_or(0),
                                mac_address: pnic_row.mac_address.clone(),
                                uplink_for_vswitch: Some(vswitch_row.name.clone()),
                            });
                        }
                    }
                    host.virtual_switches.push(virtual_switch);
                }
            }

            // Build VMs
            if let Some(vm_rows) = vms_by_host.get(&host_name) {
                for vm_row in vm_rows {
                    let mut vm = VirtualMachine {
                        name: vm_row.vm.clone(),
                        power_state: PowerState::from_string(&vm_row.power_state),
                        nics: vec![],
                        ..Default::default()
                    };

                    if let Some(nic_rows) = vnics_by_vm.get(&vm_row.vm) {
                        for nic_row in nic_rows {
                            vm.nics.push(VirtualNic {
                                vm_name: vm.name.clone(),
                                network_label: Some(nic_row.nic_label.clone()),
                                mac_address: Some(nic_row.mac_address.clone()),
                                port_group_name: nic_row.network_name.clone(),
                                ..Default::default()
                            });
                        }
                    }
                    host.vms.push(vm);
                }
            }
            cluster.hosts.push(host);
        }
        clusters.insert(cluster_name, cluster);
    }

    topology.clusters = clusters.into_values().collect();
    Ok(topology)
}

fn get_sheet_data<T: for<'de> Deserialize<'de>>(
    workbook: &mut Xlsx<std::io::BufReader<std::fs::File>>,
    sheet_name: &str,
) -> Result<Vec<T>, CoreEngineError> {
    let range = workbook
        .worksheet_range(sheet_name)
        .ok_or_else(|| CoreEngineError::parsing(format!("Sheet '{}' not found", sheet_name)))
        .and_then(|r| r.map_err(|e| CoreEngineError::parsing(e.to_string())))?;

    let mut iter = range.rows().map(|r| {
        r.iter().map(|c| c.clone()).collect::<Vec<DataType>>()
    });

    let _headers = iter.next()
        .ok_or(CoreEngineError::parsing(format!("Sheet '{}' is empty", sheet_name)))?
        .into_iter()
        .map(|c| c.to_string().trim().to_string())
        .collect::<Vec<String>>();

    let data: Vec<Vec<DataType>> = iter.collect();
    let mut result = Vec::new();
    for row in data {
        // This is a hack to get around the fact that calamine's deserialize doesn't work well with dynamic headers
        let record: T = serde_json::from_value(serde_json::Value::Object(
            _headers.iter().zip(row.iter()).map(|(h, c)| {
                (h.clone(), serde_json::Value::String(c.to_string()))
            }).collect()
        )).map_err(|e| CoreEngineError::parsing(e.to_string()))?;
        result.push(record);
    }

    Ok(result)
}

impl Default for ClusterMetrics {
    fn default() -> Self {
        Self {
            total_hosts: 0,
            total_vms: 0,
            total_pcpu_cores: 0,
            total_vcpus: 0,
            current_vcpu_pcpu_ratio: 0.0,
            total_memory_gb: 0,
            provisioned_memory_gb: 0.0,
            memory_overcommit_ratio: 0.0,
            total_storage_gb: 0.0,
            consumed_storage_gb: 0.0,
        }
    }
}

impl Default for ClusterHealth {
    fn default() -> Self {
        Self {
            zombie_vms: vec![],
            outdated_tools: vec![],
            rdm_vms: vec![],
            ft_enabled_vms: vec![],
            warnings: vec![],
        }
    }
}

impl Default for Host {
    fn default() -> Self {
        Self {
            name: "".to_string(),
            cluster_name: None,
            cpu_model: "".to_string(),
            num_cpu_sockets: 0,
            cores_per_socket: 0,
            num_cpu_cores: 0,
            total_memory_gb: 0,
            esx_version: None,
            vendor: None,
            model: None,
            connection_state: None,
            power_state: None,
            vms: vec![],
            virtual_switches: vec![],
            physical_nics: vec![],
        }
    }
}

impl Default for VirtualMachine {
    fn default() -> Self {
        Self {
            name: "".to_string(),
            cluster_name: "".to_string(),
            host_name: "".to_string(),
            power_state: PowerState::Unknown,
            num_vcpu: 0,
            memory_gb: 0,
            guest_os: None,
            vm_version: None,
            tools_status: None,
            tools_version: None,
            is_template: false,
            disks: vec![],
            nics: vec![],
            notes: None,
            annotation: None,
            folder: None,
            resource_pool: None,
            created_date: None,
            last_powered_on: None,
            special_flags: Default::default(),
        }
    }
}

impl Default for VirtualNic {
    fn default() -> Self {
        Self {
            vm_name: "".to_string(),
            port_group_name: "".to_string(),
            vlan_id: None,
            network_label: None,
            connected: false,
            nic_type: None,
            mac_address: None,
        }
    }
}
