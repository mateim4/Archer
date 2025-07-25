import { Cluster, Host, VirtualMachine, VirtualSwitch, PortGroup } from './types'; // Assuming types are defined in a separate file

export function generateVirtualDiagram(topology: { clusters: Cluster[] }): string {
    let mermaid_text = 'architecture-beta\n';

    for (const cluster of topology.clusters) {
        mermaid_text += `group "${cluster.name}" {\n`;

        for (const host of cluster.hosts) {
            mermaid_text += `  group "${host.name}" {\n`;

            for (const vswitch of host.virtual_switches) {
                const vswitch_id = `vswitch_${host.name}_${vswitch.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                mermaid_text += `    service "<img src='/icons/fluent/virtual-network.svg' width='24' height='24' /> <br/> ${vswitch.name}" as ${vswitch_id};\n`;
                for (const pg of vswitch.port_groups) {
                    const pg_id = `${vswitch.name}_${pg.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                    mermaid_text += `    service "${pg.name} (VLAN ${pg.vlan_id})" as pg_${pg_id};\n`;
                    mermaid_text += `    ${vswitch_id} -> pg_${pg_id};\n`;
                }
            }

            for (const vm of host.vms) {
                const vm_id = vm.name.replace(/[^a-zA-Z0-9_]/g, '_');
                mermaid_text += `    service "<img src='/icons/azure/virtual-machine.svg' width='24' height='24' /> <br/> ${vm.name}" as vm_${vm_id};\n`;
                for (const vnic of vm.nics) {
                    let connected_pg_id = "";
                    for (const vswitch of host.virtual_switches) {
                        for (const pg of vswitch.port_groups) {
                            if (pg.name === vnic.port_group_name) {
                                connected_pg_id = `pg_${vswitch.name}_${pg.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                                break;
                            }
                        }
                        if(connected_pg_id !== "") break;
                    }
                    if(connected_pg_id !== ""){
                        mermaid_text += `    vm_${vm_id} -> ${connected_pg_id};\n`;
                    }
                }
            }
            mermaid_text += `  }\n`;
        }
        mermaid_text += `}\n`;
    }

    return mermaid_text;
}

export function generateHyperVDiagram(topology: { clusters: Cluster[] }): string {
    let mermaid_text = 'architecture-beta\n';

    for (const cluster of topology.clusters) {
        mermaid_text += `group "${cluster.name}" {\n`;

        for (const host of cluster.hosts) {
            mermaid_text += `  group "${host.name}" {\n`;

            for (const vswitch of host.virtual_switches) {
                const vswitch_id = `vswitch_${host.name}_${vswitch.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                let icon = 'virtual-network.svg';
                if (vswitch.switch_type === 'External') {
                    icon = 'cloud.svg';
                } else if (vswitch.switch_type === 'Internal') {
                    icon = 'server.svg';
                }
                mermaid_text += `    service "<img src='/icons/fluent/${icon}' width='24' height='24' /> <br/> ${vswitch.name}" as ${vswitch_id};\n`;
            }

            for (const vm of host.vms) {
                const vm_id = vm.name.replace(/[^a-zA-Z0-9_]/g, '_');
                mermaid_text += `    service "<img src='/icons/azure/virtual-machine.svg' width='24' height='24' /> <br/> ${vm.name}" as vm_${vm_id};\n`;
                for (const vnic of vm.nics) {
                    const vswitch_id = `vswitch_${host.name}_${vnic.port_group_name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                    mermaid_text += `    vm_${vm_id} -> ${vswitch_id};\n`;
                }
            }
            mermaid_text += `  }\n`;
        }
        mermaid_text += `}\n`;
    }

    return mermaid_text;
}

export function generatePhysicalDiagram(topology: { clusters: Cluster[] }): string {
    let mermaid_text = 'architecture-beta\n';

    for (const cluster of topology.clusters) {
        mermaid_text += `group "${cluster.name}" {\n`;

        for (const host of cluster.hosts) {
            mermaid_text += `  group "${host.name}" {\n`;
            for (const pnic of host.physical_nics) {
                const pnic_id = `pnic_${host.name}_${pnic.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                mermaid_text += `    service "<img src='/icons/fluent/network-adapter.svg' width='24' height='24' /> <br/> ${pnic.name}" as ${pnic_id};\n`;
                if (pnic.uplink_for_vswitch) {
                    const vswitch_id = `vswitch_${host.name}_${pnic.uplink_for_vswitch}`.replace(/[^a-zA-Z0-9_]/g, '_');
                    mermaid_text += `    ${pnic_id} -> ${vswitch_id};\n`;
                }
            }

            for (const vswitch of host.virtual_switches) {
                const vswitch_id = `vswitch_${host.name}_${vswitch.name}`.replace(/[^a-zA-Z0-9_]/g, '_');
                mermaid_text += `    service "<img src='/icons/fluent/virtual-network.svg' width='24' height='24' /> <br/> ${vswitch.name}" as ${vswitch_id};\n`;
            }
            mermaid_text += `  }\n`;
        }
        mermaid_text += `}\n`;
    }

    return mermaid_text;
}
