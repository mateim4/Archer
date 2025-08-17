# Gemini Deep Research Prompt for Server Hardware Specifications

## Primary Research Objective
Research comprehensive technical specifications for enterprise server models to enhance our hardware database with accurate, detailed information for IT infrastructure planning and procurement decisions.

## Research Scope and Instructions

### Core Server Models to Research
1. **Lenovo ThinkSystem Series:**
   - SR630 V3 (1U rack server)
   - SR650 V3 (2U rack server) 
   - SR665 V3 (2U AMD server)
   - ThinkAgile HX Series (hyper-converged)
   - ST650 V3 (tower server)

2. **Dell PowerEdge Series:**
   - R650 (2U rack server)
   - R750 (2U rack server)
   - R6625 (AMD 2U server)
   - R350 (1U entry server)
   - VxRail (hyper-converged)

3. **HPE ProLiant Series:**
   - DL380 Gen11 (2U rack server)
   - DL360 Gen11 (1U rack server)
   - ML350 Gen11 (tower server)
   - SimpliVity (hyper-converged)

### Required Specification Categories

For each server model, research and provide:

#### 1. **Processor Specifications**
- Supported CPU families (Intel Xeon, AMD EPYC)
- Socket count and socket type (LGA4677, SP5, etc.)
- Maximum cores per socket
- Maximum threads per socket
- Supported TDP ranges
- Specific processor model examples with frequencies

#### 2. **Memory Specifications**
- Maximum memory capacity
- Memory slot count
- Supported memory types (DDR4, DDR5, RDIMM, LRDIMM)
- Memory speeds (MT/s ratings)
- ECC support details
- Memory configuration examples

#### 3. **Storage Specifications**
- Drive bay configurations (2.5", 3.5", M.2)
- Front bay count and rear bay count
- Supported interfaces (SATA, SAS, NVMe, U.2, U.3)
- Internal M.2 slot availability
- RAID controller options and supported RAID levels
- Maximum storage capacity examples

#### 4. **Network Specifications**
- Onboard network ports (1GbE, 10GbE, 25GbE)
- Network interface types (RJ45, SFP+, SFP28, QSFP+)
- PCIe expansion slot count for network cards
- Management network capabilities (iDRAC, iLO, XClarity)

#### 5. **Physical Specifications**
- Form factor (1U, 2U, tower)
- Exact dimensions (height, width, depth in mm)
- Weight ranges (minimum to maximum configuration)
- Rack unit specifications

#### 6. **Power and Cooling**
- Power supply options and wattages
- Redundancy configurations (1+1, N+1)
- Efficiency ratings (80 PLUS Bronze/Gold/Platinum/Titanium)
- Typical power consumption ranges
- Cooling requirements and fan configurations

#### 7. **Expansion and I/O**
- PCIe slot count and generations (Gen3, Gen4, Gen5)
- Slot form factors (full-height, low-profile)
- USB port availability
- Serial/console port options
- Other I/O specifications

#### 8. **Management and Security**
- Out-of-band management controllers
- Security features (TPM, secure boot, encryption)
- Remote management capabilities
- Firmware and BIOS specifications

### Data Format Requirements

Present findings in structured JSON format for each server model:

```json
{
  "model_name": "ThinkSystem SR630 V3",
  "vendor": "Lenovo",
  "form_factor": "1U",
  "processor": {
    "socket_count": 2,
    "socket_type": "LGA4677",
    "supported_families": ["Intel Xeon Scalable 4th Gen"],
    "max_cores_per_socket": 60,
    "max_threads_per_socket": 120,
    "tdp_range": "150W-350W",
    "example_processors": [
      {
        "model": "Intel Xeon Gold 6426Y",
        "cores": 16,
        "threads": 32,
        "frequency": "2.5GHz",
        "tdp": "185W"
      }
    ]
  },
  "memory": {
    "max_capacity": "4TB",
    "slots": 32,
    "types": ["DDR5 RDIMM", "DDR5 LRDIMM"],
    "speeds": ["4400", "4800", "5600"],
    "ecc": true,
    "example_configs": ["32GB DDR5-4800 RDIMM ECC"]
  },
  // ... continue for all categories
}
```

### Research Sources Priority
1. **Official vendor documentation** (highest priority)
2. **Vendor product specification sheets**
3. **Vendor configurator tools**
4. **Technical review sites** (AnandTech, ServeTheHome, etc.)
5. **Industry databases** (TechSpecs, IT hardware databases)
6. **Recent product announcements and press releases**

### Research Quality Requirements
- Verify specifications across multiple sources
- Focus on current generation models (2023-2025)
- Include both minimum and maximum configuration examples
- Note any regional variations or model sub-variants
- Cross-reference processor compatibility matrices
- Validate memory and storage maximums with official docs

### Expected Deliverables
1. **Complete specification database** in JSON format for all requested models
2. **Source attribution** for each specification category
3. **Configuration examples** showing typical enterprise setups
4. **Compatibility matrices** for processors, memory, and expansion cards
5. **Pricing context** (if available from official sources)
6. **Availability and lifecycle status** of each model

### Additional Research Instructions
- Focus on specifications most relevant for IT infrastructure planning
- Include both technical specs and practical deployment considerations
- Note any special certifications (VMware HCL, Microsoft WSSC, etc.)
- Identify common configuration patterns and best practices
- Research warranty and support options available
- Include energy efficiency ratings and environmental specifications where available

### Output Organization
Please organize the research results by:
1. **Executive summary** of findings per vendor
2. **Detailed specifications** in the JSON format above
3. **Comparative analysis** highlighting key differences between similar models
4. **Procurement recommendations** based on typical use cases
5. **Data quality assessment** noting confidence levels and source reliability

This research will directly enhance our hardware specification database for enterprise IT infrastructure planning and vendor comparison tools.
