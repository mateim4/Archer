# Network Elements Reference Guide
## Complete Naming Conventions for VMware, Hyper-V, and Nutanix

This document provides the official naming conventions and component types for all supported virtualization platforms.

---

## 🟢 VMware vSphere Network Components

### Virtual Switches
- **Standard vSwitch (vSS)**
  - Name format: `vSwitch0`, `vSwitch1`, etc.
  - Also known as: vSphere Standard Switch
  - CLI: `esxcli network vswitch standard`

- **Distributed vSwitch (vDS)**
  - Name format: `DSwitch`, `dvSwitch-01`, etc.
  - Also known as: vSphere Distributed Switch
  - CLI: `esxcli network vswitch dvs`

### Port Groups
- **Standard Port Group**
  - Name format: `VM Network`, `VLAN-100-Production`, etc.
  - Attached to: Standard vSwitch

- **Distributed Port Group (dvPortGroup)**
  - Name format: `dvPortGroup-Production`, `DPG-100`, etc.
  - Attached to: Distributed vSwitch

### Physical NICs (vmnic)
- **vmnic0, vmnic1, vmnic2...** - Physical network adapters
- **Naming convention**: vmnic[0-N]
- **Driver examples**: ixgbe, igb, i40e, nenic, vmxnet3

### VMkernel Ports (vmk)
- **vmk0** - Management Network (always present)
- **vmk1** - vMotion
- **vmk2** - vSAN
- **vmk3** - Fault Tolerance (FT) Logging
- **vmk4** - Replication
- **vmk5** - Provisioning
- **Naming convention**: vmk[0-N]

**Service Types:**
- Management
- vMotion
- vSphere Replication
- vSAN
- Fault Tolerance logging
- vSphere Provisioning
- vSphere Backup/NFC

### VM Network Adapters
- **Network adapter 1, 2, 3...**
- **Types**: 
  - vmxnet3 (paravirtualized, recommended)
  - vmxnet2 (legacy paravirtualized)
  - E1000 (Intel 1Gbps emulated)
  - E1000E (Intel enhanced)
  - VMXNET (legacy)
  - Flexible (auto-detect)

### Uplinks
- **Physical uplink**: vmnic to vSwitch binding
- **LAG (Link Aggregation)**: Multiple vmnics in active/active or active/standby
- **Teaming policies**: 
  - Route based on originating virtual port
  - Route based on IP hash
  - Route based on source MAC hash
  - Explicit failover order

---

## 🔵 Microsoft Hyper-V Network Components

### Virtual Switches
- **External vSwitch**
  - Binds to physical NIC
  - Allows VMs to communicate with external network
  - Name format: User-defined (e.g., `External-Switch`, `Production-vSwitch`)

- **Internal vSwitch**
  - Communication between VMs and host
  - No physical NIC binding
  - Name format: User-defined (e.g., `Internal-Switch`)

- **Private vSwitch**
  - VM-to-VM communication only
  - No host or external access
  - Name format: User-defined (e.g., `Private-Switch`)

- **Switch Embedded Teaming (SET)**
  - Hyper-V 2016+ feature
  - NIC teaming built into vSwitch
  - Supports RDMA
  - Name format: User-defined with SET suffix (e.g., `SET-Team01`)

### Management vNICs
- **Management vNIC (vEthernet)**
  - Created when External vSwitch is created
  - Name format: `vEthernet (Switch Name)`
  - Example: `vEthernet (External-Switch)`

### Physical NICs
- **Ethernet 1, Ethernet 2...**
- **Network Adapter, Network Adapter #2...**
- **Driver-based names**: Intel(R) PRO/1000, Mellanox ConnectX, Broadcom NetXtreme

### VM Network Adapters
- **Network Adapter**
- **Legacy Network Adapter** (Gen 1 VMs only)
- **Types**:
  - Synthetic (default, paravirtualized)
  - Legacy (emulated, boot support)

### VLAN Configuration
- **Trunk mode**: VLAN ID range (e.g., 1-4094)
- **Access mode**: Single VLAN ID
- **Private VLAN (PVLAN)**: Primary/Secondary VLAN pairs

### Advanced Features
- **SR-IOV** (Single Root I/O Virtualization)
- **VMQ** (Virtual Machine Queue)
- **RDMA** (Remote Direct Memory Access)
- **RSS** (Receive Side Scaling)
- **IPsec Task Offload**

---

## 🟣 Nutanix AHV (Acropolis) Network Components

### Virtual Switch (Open vSwitch - OVS)
- **br0** - Default OVS bridge (always present)
- **Additional bridges**: br1, br2, etc.
- **Naming convention**: br[0-N]
- **Type**: Open vSwitch (OVS) with VXLAN support

### Virtual Networks
- **Managed Networks** (IPAM-enabled)
  - Name format: User-defined (e.g., `Production`, `Management-Network`)
  - Has DHCP server (optional)
  - Has IP address pool
  - Supports VLAN tagging

- **Unmanaged Networks** (No IPAM)
  - Name format: User-defined (e.g., `External-Network`)
  - Manual IP configuration
  - VLAN passthrough

### Network Segmentation
- **VLAN Networks**
  - VLAN ID: 1-4094
  - Name format: `VLAN-100`, `Production-VLAN100`

- **VXLAN Networks** (Flow Networking)
  - VNI (VXLAN Network Identifier): 1-16777215
  - Name format: `VNI-5000`, `Overlay-Network`
  - Requires Flow (Nutanix SDN)

### Physical NICs (Network Interfaces)
- **eth0, eth1, eth2, eth3...** - Physical network interfaces on CVM (Controller VM)
- **Naming convention**: eth[0-N]
- **Bond interfaces**: bond0, bond1 (active-backup or balance-slb)

### Host Network Interfaces (AHV Host)
- **br0-uplink** - Physical NIC(s) connected to br0
- **virbr0** - Default libvirt NAT bridge (for CVMs)

### Network Bonds
- **active-backup** (default)
  - One active, others standby
  - Failover on link failure

- **balance-slb** (Source Load Balancing)
  - Distributes traffic based on source MAC/IP
  - All NICs active

- **balance-tcp** (LACP - Link Aggregation Control Protocol)
  - Requires switch configuration
  - Maximum throughput

- **LACP** - IEEE 802.3ad Link Aggregation

### Virtual NIC Types (VM Network Adapters)
- **virtio** (paravirtualized, recommended)
  - Name: `virtio0`, `virtio1`, etc.
  - Highest performance

- **e1000** (Intel emulated)
  - Legacy support
  - Lower performance

- **rtl8139** (Realtek emulated)
  - Legacy support

### Network Function Types
- **Management Network**
  - For CVM (Controller VM) management
  - Typically on VLAN 0 or dedicated VLAN

- **VM Network**
  - User VM traffic
  - Can be on any VLAN

- **Storage Network** (optional)
  - iSCSI traffic (if using external storage)
  - Recommended separate VLAN

- **Backup Network** (optional)
  - Backup traffic isolation
  - Dedicated VLAN

### Advanced Nutanix Network Features
- **Flow Virtual Networking** (Microsegmentation)
  - Security policies
  - Layer 3/4 firewall rules
  - Application-centric networking

- **Flow Networking** (VXLAN overlay)
  - Software-defined networking
  - Stretch Layer 2 across sites
  - VNI-based segmentation

- **Network Security Policies**
  - Application Security Policies
  - Category-based rules
  - Isolation environments

### Nutanix-Specific Terminology
- **AHV** - Acropolis Hypervisor (KVM-based)
- **CVM** - Controller VM (runs Nutanix software)
- **IPAM** - IP Address Management (built-in DHCP)
- **Categories** - Labels for policy application (e.g., `Environment:Production`)
- **VPC** - Virtual Private Cloud (isolated network environment)
- **Subnet** - Network segment within a VPC or cluster

---

## 🎨 Official Vendor Stencils & Icons

### VMware
- **Official Icon Set**: [VMware PowerPoint Stencils](https://www.vmware.com/brand/visual-identity/icon-guidelines.html)
- **Components**:
  - vSphere logo
  - ESXi host icon
  - vCenter icon
  - Standard vSwitch icon
  - Distributed vSwitch icon
  - Port Group icon
  - VM icon
  - Physical server icon
  - Network connection lines

- **Download**: VMware provides official Visio, PowerPoint, and SVG stencils
- **License**: Free to use for VMware-related diagrams

### Microsoft Hyper-V / Azure
- **Official Icon Set**: [Azure Architecture Icons](https://learn.microsoft.com/en-us/azure/architecture/icons/)
- **Components**:
  - Hyper-V logo
  - Virtual machine icon
  - Virtual network icon
  - Network adapter icon
  - Load balancer icon
  - Network security group icon

- **Download**: Microsoft provides SVG, PNG, and PowerPoint formats
- **License**: Free to use for Microsoft technology diagrams

### Nutanix
- **Official Icon Set**: [Nutanix Architecture Icons](https://www.nutanix.com/partners/resources)
- **Components**:
  - Nutanix logo
  - AHV icon
  - Prism icon
  - Cluster icon
  - Node icon
  - VM icon
  - Flow icon
  - Storage icon
  - Network icon

- **Download**: Nutanix provides Visio, PowerPoint, and SVG stencils
- **License**: Free for Nutanix partners and customers

---

## 📊 Icon Integration Strategy for Visualization

### Approach 1: SVG Icons in visx Nodes
```typescript
interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  iconUrl: string;  // URL to vendor-specific SVG icon
  iconType: 'vmware' | 'hyperv' | 'nutanix';
  data: NetworkNodeData;
}
```

### Approach 2: Icon Font (Custom)
- Create custom icon font with all vendor icons
- Use CSS classes for each component type
- Lighter weight, scalable

### Approach 3: Base64 Embedded SVGs
- Embed SVG data directly in node metadata
- No external dependencies
- Larger payload

### Approach 4: Icon Library Component
```typescript
const IconLibrary = {
  vmware: {
    standard_vswitch: '<svg>...</svg>',
    distributed_vswitch: '<svg>...</svg>',
    port_group: '<svg>...</svg>',
    vmkernel_port: '<svg>...</svg>',
  },
  hyperv: {
    external_vswitch: '<svg>...</svg>',
    internal_vswitch: '<svg>...</svg>',
    set: '<svg>...</svg>',
  },
  nutanix: {
    ovs_bridge: '<svg>...</svg>',
    virtual_network: '<svg>...</svg>',
    bond: '<svg>...</svg>',
  }
};
```

**Recommended**: Approach 1 (SVG URLs) for flexibility + Approach 4 (Icon Library) for consistency

---

## 🔧 Implementation in Backend

### Extended NetworkNode Model
```rust
pub struct NetworkNode {
    pub id: String,
    pub node_type: NodeType,
    pub label: String,
    pub vendor: NetworkVendor,
    pub component_subtype: String,  // "standard_vswitch", "ovs_bridge", etc.
    pub icon_path: String,          // "/icons/vmware/standard_vswitch.svg"
    pub icon_category: String,      // "switch", "port_group", "nic", etc.
    pub data: NetworkNodeData,
    pub position: NodePosition,
    pub color: String,
    pub size: f64,
}
```

### Icon Mapping
- Map each `(vendor, node_type, component_subtype)` tuple to official icon
- Provide fallback generic icons for unknown types
- Support custom user-uploaded icons

---

## 📝 Variable Documentation Example

| RVTools Column | Our Variable | Vendor | Component | Purpose |
|----------------|--------------|--------|-----------|---------|
| `Switch` | `vswitch_name` | VMware | vSwitch | Name of standard or distributed vSwitch |
| `Portgroup` | `port_group_name` | VMware | Port Group | Name of port group VM is connected to |
| `Device` | `vmkernel_device` | VMware | VMkernel Port | VMkernel port device name (vmk0, vmk1, etc.) |
| `vSwitch` | `ovs_bridge_name` | Nutanix | OVS Bridge | Open vSwitch bridge name (br0, br1, etc.) |
| `Network` | `virtual_network_name` | Nutanix | Virtual Network | Nutanix managed or unmanaged network name |
| `NIC Team` | `bond_name` | Nutanix | Network Bond | Bond interface name (bond0, bond1, etc.) |
| `vSwitch Name` | `hyperv_vswitch_name` | Hyper-V | vSwitch | Hyper-V virtual switch name |
| `vSwitch Type` | `vswitch_type` | Hyper-V | vSwitch | External, Internal, Private, or SET |

---

## ✅ Complete Component Checklist

### VMware vSphere
- [x] Standard vSwitch
- [x] Distributed vSwitch
- [x] Port Group
- [x] Distributed Port Group
- [x] Physical NIC (vmnic)
- [x] VMkernel Port (vmk)
- [x] VM Network Adapter (vmxnet3, E1000, etc.)
- [x] Uplink (vmnic to vSwitch binding)
- [x] LAG / NIC Team

### Hyper-V
- [x] External vSwitch
- [x] Internal vSwitch
- [x] Private vSwitch
- [x] SET (Switch Embedded Teaming)
- [x] Management vNIC (vEthernet)
- [x] Physical NIC
- [x] VM Network Adapter (Synthetic, Legacy)
- [x] VLAN configuration

### Nutanix AHV
- [x] OVS Bridge (br0, br1, etc.)
- [x] Managed Virtual Network (IPAM-enabled)
- [x] Unmanaged Virtual Network
- [x] VLAN Network
- [x] VXLAN Network (Flow Networking)
- [x] Physical NIC (eth0, eth1, etc.)
- [x] Bond Interface (bond0, active-backup, balance-slb, LACP)
- [x] Host Network Interface (br0-uplink, virbr0)
- [x] VM Network Adapter (virtio, e1000, rtl8139)
- [x] VPC (Virtual Private Cloud)
- [x] Subnet

---

**Last Updated**: October 22, 2025
**Maintainer**: LCMDesigner Development Team
**Purpose**: Reference for network visualization and topology mapping
