# Hardware Basket Information Hierarchy Schema
# Version 1.0 - Comprehensive Component Classification System

## 1. TOP LEVEL HIERARCHY

### Primary Categories:
1. **SERVER_CHASSIS** - Complete server systems that can operate independently
2. **COMPONENT** - Hardware pieces that enhance or complete server systems  
3. **ACCESSORY** - Supporting items (cables, adapters, etc.)
4. **SOFTWARE** - Licenses, software packages
5. **SERVICE** - Support, warranties, installation services

## 2. SERVER_CHASSIS CLASSIFICATION

### Server Types:
- **RACK_SERVER** - 1U, 2U, 4U rack mountable servers
- **BLADE_SERVER** - Blade chassis systems
- **TOWER_SERVER** - Desktop/tower form factor
- **MODULAR_SERVER** - Modular/composable systems

### Required Server Attributes:
- **vendor**: Dell, Lenovo, HPE, etc.
- **model_family**: PowerEdge, ThinkSystem, ProLiant
- **model_number**: R750, SR630, DL380
- **form_factor**: 1U, 2U, 4U, Tower, Blade
- **cpu_socket_count**: 1, 2, 4, 8
- **base_configuration**: Minimum viable config

### Server Identification Patterns:
```
Dell: "PowerEdge [R|T|M|C]XXX"
Lenovo: "ThinkSystem [SR|ST|SD]XXX" 
HPE: "ProLiant [DL|ML|BL]XXX"
```

## 3. COMPONENT CLASSIFICATION

### Component Hierarchy:
```
COMPONENT
├── PROCESSING
│   ├── CPU (Primary processors)
│   ├── GPU (Graphics/compute accelerators)
│   └── COPROCESSOR (Specialized processing units)
├── MEMORY
│   ├── SYSTEM_MEMORY (DIMM, RDIMM, LRDIMM)
│   ├── NVDIMM (Non-volatile memory)
│   └── HBM (High bandwidth memory)
├── STORAGE
│   ├── PRIMARY_STORAGE
│   │   ├── HDD (Traditional hard drives)
│   │   ├── SSD (Solid state drives)
│   │   └── NVME (NVMe drives)
│   ├── STORAGE_CONTROLLER
│   │   ├── RAID_CONTROLLER (PERC, Smart Array)
│   │   ├── HBA (Host bus adapters)
│   │   └── BOOT_CONTROLLER (BOSS, SD cards)
│   └── STORAGE_EXPANSION
│       ├── DRIVE_BAY (Additional drive slots)
│       └── STORAGE_ENCLOSURE
├── NETWORKING
│   ├── NETWORK_ADAPTER
│   │   ├── ETHERNET (1GbE, 10GbE, 25GbE, 100GbE)
│   │   ├── FIBRE_CHANNEL (8Gb, 16Gb, 32Gb)
│   │   ├── INFINIBAND (HDR, EDR)
│   │   └── WIRELESS (WiFi, Bluetooth)
│   ├── NETWORK_SWITCH (ToR, fabric switches)
│   └── NETWORK_SECURITY (Firewalls, security modules)
├── POWER
│   ├── POWER_SUPPLY (Hot-plug, redundant PSUs)
│   ├── UPS (Uninterruptible power supplies)
│   └── PDU (Power distribution units)
├── COOLING
│   ├── FAN (System fans, CPU fans)
│   ├── HEAT_SINK (CPU heat sinks)
│   └── LIQUID_COOLING (AIO, custom loops)
├── EXPANSION
│   ├── EXPANSION_CARD (PCIe cards)
│   ├── RISER_CARD (PCIe risers)
│   └── BACKPLANE (Drive backplanes)
└── MANAGEMENT
    ├── REMOTE_MANAGEMENT (iDRAC, IMM, iLO)
    ├── KVM (Keyboard/video/mouse)
    └── MONITORING (Temperature, health sensors)
```

## 4. COMPONENT COMPATIBILITY MATRIX

### Compatibility Rules:
1. **CPU compatibility** - Socket type, chipset support
2. **Memory compatibility** - CPU memory controller, speed, capacity
3. **Storage compatibility** - Interface type, form factor, backplane
4. **Network compatibility** - PCIe slots, form factor
5. **Power compatibility** - Power requirements, connector types
6. **Form factor compatibility** - Physical dimensions, mounting

### Compatibility Attributes:
- **compatible_platforms**: List of server models that support this component
- **required_slots**: PCIe slots, drive bays, memory slots required
- **power_requirements**: Wattage, connector types
- **physical_constraints**: Height, length, width restrictions

## 5. IDENTIFICATION PATTERNS

### CPU Identification:
```
Intel: "Intel Xeon [Platinum|Gold|Silver|Bronze] XXXX"
AMD: "AMD EPYC XXXX"
Pattern: Brand + Family + Model + Specs (cores, frequency, cache)
```

### Memory Identification:
```
Pattern: Capacity + Type + Speed + Form Factor
Example: "32GB DDR4-3200 RDIMM" or "16GB DDR5-4800 DIMM"
```

### Storage Identification:
```
Pattern: Capacity + Type + Interface + Form Factor + Performance
Example: "960GB SSD SATA 2.5in" or "1.92TB NVMe U.2"
```

### Network Identification:
```
Pattern: Brand + Speed + Port Count + Interface + Form Factor
Example: "Intel X710 Dual Port 10GbE SFP+" or "Broadcom 25GbE Quad Port"
```

## 6. PARSING STRATEGY

### Phase 1: Component Type Classification
1. **Keyword Detection** - Scan descriptions for component type indicators
2. **Pattern Matching** - Apply regex patterns for component identification
3. **Context Analysis** - Use surrounding text for disambiguation

### Phase 2: Server Platform Detection
1. **Platform Extraction** - Identify server model mentions in descriptions
2. **Compatibility Mapping** - Map components to compatible server platforms
3. **Base Configuration Detection** - Identify minimum server configurations

### Phase 3: Server Assembly
1. **Platform Grouping** - Group components by compatible server platforms
2. **Configuration Building** - Assemble base server configurations
3. **Option Separation** - Separate upgrade/optional components

### Phase 4: Validation & Output
1. **Compatibility Validation** - Verify component compatibility
2. **Duplicate Detection** - Remove duplicate configurations
3. **Output Formatting** - Format for frontend consumption

## 7. OUTPUT SCHEMA

### Server Configuration Object:
```json
{
  "id": "unique_identifier",
  "vendor": "Dell|Lenovo|HPE",
  "model_family": "PowerEdge|ThinkSystem|ProLiant",
  "model_number": "R750|SR630|DL380",
  "display_name": "Dell PowerEdge R750",
  "form_factor": "2U Rack",
  "base_configuration": {
    "cpu": {...},
    "memory": {...},
    "storage": {...},
    "network": {...},
    "power": {...}
  },
  "upgrade_options": [...],
  "compatibility": {
    "cpu_sockets": 2,
    "memory_slots": 16,
    "drive_bays": 8,
    "pcie_slots": 4
  },
  "pricing": {
    "base_price": 5000,
    "currency": "USD"
  }
}
```

### Component Object:
```json
{
  "id": "unique_identifier", 
  "category": "PROCESSING|MEMORY|STORAGE|NETWORKING|POWER|COOLING|EXPANSION|MANAGEMENT",
  "subcategory": "CPU|GPU|SYSTEM_MEMORY|HDD|SSD|ETHERNET|POWER_SUPPLY",
  "vendor": "Intel|AMD|Samsung|Broadcom",
  "model": "Xeon Gold 6326|32GB DDR4-3200",
  "specifications": {
    "cores": 16,
    "base_frequency": "2.9GHz",
    "cache": "24MB"
  },
  "compatibility": {
    "platforms": ["SR630", "SR650", "SR645"],
    "socket_type": "LGA4189",
    "form_factor": "PCIe Low Profile"
  },
  "pricing": {
    "unit_price": 2450,
    "currency": "USD"
  }
}
```

This schema provides a comprehensive framework for consistently processing hardware basket data across all vendors while maintaining the flexibility to handle vendor-specific variations.
