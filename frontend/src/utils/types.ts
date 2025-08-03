export interface NetworkTopology {
  clusters: Cluster[];
}

export interface Cluster {
  name: string;
  hosts: Host[];
  vms: VirtualMachine[];
}

export interface Host {
  name: string;
  physical_nics: PhysicalNic[];
  virtual_switches: VirtualSwitch[];
  vms: VirtualMachine[];
}

export interface PhysicalNic {
  name: string;
  speed_mbps: number;
  mac_address: string;
  uplink_for_vswitch: string | null;
}

export interface VirtualSwitch {
  name: string;
  switch_type: string;
  uplink_ports: string[];
  port_groups: PortGroup[];
}

export interface PortGroup {
  name: string;
  vlan_id: number;
}

export interface VirtualMachine {
  name: string;
  power_state: string;
  nics: VirtualNic[];
}

export interface VirtualNic {
  vm_name: string;
  port_group_name: string;
  vlan_id: number | null;
  network_label: string | null;
  connected: boolean;
  nic_type: string | null;
  mac_address: string | null;
}
