use crate::models::*;
use crate::error::CoreEngineError;
use serde::Deserialize;

use super::parser::NetworkTopology;

#[derive(Debug, Deserialize)]
struct HyperVReport {
    hosts: Vec<HyperVHost>,
}

#[derive(Debug, Deserialize)]
struct HyperVHost {
    name: String,
    virtual_switches: Vec<HyperVSwitch>,
    vms: Vec<HyperVvm>,
}

#[derive(Debug, Deserialize)]
struct HyperVSwitch {
    name: String,
    switch_type: String, // "External", "Internal", "Private"
    uplinks: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct HyperVvm {
    name: String,
    state: String,
    vnics: Vec<HyperVVnic>,
}

#[derive(Debug, Deserialize)]
struct HyperVVnic {
    name: String,
    mac_address: String,
    ip_addresses: Vec<String>,
    connected_to: String,
}

pub fn parse_hyperv_report_json(json_str: &str) -> Result<NetworkTopology, CoreEngineError> {
    let report: HyperVReport = serde_json::from_str(json_str).map_err(|e| CoreEngineError::parsing(e.to_string()))?;
    let mut topology = NetworkTopology { clusters: vec![] };

    for host_data in report.hosts {
        let mut cluster = Cluster {
            name: "Hyper-V Cluster".to_string(), // Hyper-V doesn't have a direct cluster concept in the same way as VMware
            hosts: vec![],
            vms: vec![],
            metrics: Default::default(),
            health_status: Default::default(),
        };

        let mut host = Host {
            name: host_data.name.clone(),
            virtual_switches: vec![],
            physical_nics: vec![],
            vms: vec![],
            ..Default::default()
        };

        for vswitch_data in host_data.virtual_switches {
            host.virtual_switches.push(VirtualSwitch {
                name: vswitch_data.name.clone(),
                switch_type: SwitchType::from_string(&vswitch_data.switch_type),
                physical_adapters: vswitch_data.uplinks.clone(),
                enable_sr_iov: false,
                enable_rdma: false,
                port_groups: vec![], // Hyper-V doesn't have port groups in the same way, we can simulate them if needed
            });
        }

        for vm_data in host_data.vms {
            let mut vm = VirtualMachine {
                name: vm_data.name.clone(),
                power_state: PowerState::from_string(&vm_data.state),
                nics: vec![],
                ..Default::default()
            };
            for vnic_data in vm_data.vnics {
                vm.nics.push(VirtualNic {
                    vm_name: vm.name.clone(),
                    network_label: Some(vnic_data.name.clone()),
                    mac_address: Some(vnic_data.mac_address.clone()),
                    port_group_name: vnic_data.connected_to.clone(),
                    ..Default::default()
                });
            }
            host.vms.push(vm);
        }
        cluster.hosts.push(host);
        topology.clusters.push(cluster);
    }

    Ok(topology)
}
