#!/usr/bin/env python3
"""
Test script to verify the new smart Lenovo parsing logic
This creates a synthetic Lenovo X86 Parts file to test our logic
"""

import pandas as pd
import os

def create_lenovo_test_file():
    """Create a synthetic Lenovo X86 Parts Excel file for testing"""
    
    # Define synthetic Lenovo data that matches the expected structure
    lenovo_parts_data = [
        # CPU Models for different server platforms
        {"Part Number": "7XG7A05575", "Description": "Intel® Xeon® Platinum 8358 32C/2.6G 48M - ThinkSystem SR630 SR650", "USD Price": 4950.00, "EUR Price": 4500.00},
        {"Part Number": "7XG7A05576", "Description": "Intel® Xeon® Gold 6326 16C/2.9G 24M - ThinkSystem SR630 SR650 SR645", "USD Price": 2450.00, "EUR Price": 2200.00},
        {"Part Number": "7XG7A05577", "Description": "Intel® Xeon® Silver 4314 16C/2.4G 24M - ThinkSystem SR630 SR650", "USD Price": 1200.00, "EUR Price": 1100.00},
        {"Part Number": "7Y37A01085", "Description": "AMD EPYC 7763 64C/2.45G 256M - ThinkSystem SR645 SR665", "USD Price": 6950.00, "EUR Price": 6300.00},
        {"Part Number": "7Y37A01086", "Description": "AMD EPYC 7543 32C/2.8G 256M - ThinkSystem SR645 SR665", "USD Price": 3450.00, "EUR Price": 3100.00},
        {"Part Number": "7Y37A01087", "Description": "AMD EPYC 7313 16C/3.0G 128M - ThinkSystem SR645", "USD Price": 1950.00, "EUR Price": 1750.00},
        
        # Memory modules compatible with various platforms
        {"Part Number": "7X77A01302", "Description": "16GB TruDDR4 3200MHz (2Rx8) RDIMM - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 295.00, "EUR Price": 270.00},
        {"Part Number": "7X77A01303", "Description": "32GB TruDDR4 3200MHz (2Rx4) RDIMM - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 590.00, "EUR Price": 540.00},
        {"Part Number": "7X77A01304", "Description": "64GB TruDDR4 3200MHz (2Rx4) RDIMM - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 1180.00, "EUR Price": 1080.00},
        {"Part Number": "7X77A01305", "Description": "128GB TruDDR4 3200MHz (2Rx4) LRDIMM - ThinkSystem SR650 SR665", "USD Price": 2360.00, "EUR Price": 2160.00},
        {"Part Number": "7X77A01306", "Description": "256GB TruDDR4 3200MHz (2Rx4) LRDIMM - ThinkSystem SR650 SR665", "USD Price": 4720.00, "EUR Price": 4320.00},
        
        # Storage devices
        {"Part Number": "7N47A00129", "Description": "480GB SATA 6Gb/s 2.5\" Hot Swap SSD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 195.00, "EUR Price": 180.00},
        {"Part Number": "7N47A00130", "Description": "960GB SATA 6Gb/s 2.5\" Hot Swap SSD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 390.00, "EUR Price": 360.00},
        {"Part Number": "7N47A00131", "Description": "1.92TB SATA 6Gb/s 2.5\" Hot Swap SSD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 780.00, "EUR Price": 720.00},
        {"Part Number": "7N47A00132", "Description": "3.84TB SATA 6Gb/s 2.5\" Hot Swap SSD - ThinkSystem SR650 SR665", "USD Price": 1560.00, "EUR Price": 1440.00},
        
        {"Part Number": "7N47A00140", "Description": "1TB SATA 6Gb/s 2.5\" Hot Swap HDD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 125.00, "EUR Price": 115.00},
        {"Part Number": "7N47A00141", "Description": "2TB SATA 6Gb/s 2.5\" Hot Swap HDD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 250.00, "EUR Price": 230.00},
        {"Part Number": "7N47A00142", "Description": "4TB SATA 6Gb/s 2.5\" Hot Swap HDD - ThinkSystem SR650 SR665", "USD Price": 500.00, "EUR Price": 460.00},
        
        # NVMe drives
        {"Part Number": "7N47A00150", "Description": "960GB NVMe PCIe 3.0 2.5\" Hot Swap SSD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 490.00, "EUR Price": 450.00},
        {"Part Number": "7N47A00151", "Description": "1.92TB NVMe PCIe 3.0 2.5\" Hot Swap SSD - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 980.00, "EUR Price": 900.00},
        {"Part Number": "7N47A00152", "Description": "3.84TB NVMe PCIe 3.0 2.5\" Hot Swap SSD - ThinkSystem SR650 SR665", "USD Price": 1960.00, "EUR Price": 1800.00},
        
        # Network adapters
        {"Part Number": "7ZT7A00484", "Description": "Broadcom NetXtreme PCIe 1Gb 4-Port RJ45 Ethernet Adapter - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 195.00, "EUR Price": 180.00},
        {"Part Number": "7ZT7A00485", "Description": "Intel Ethernet Connection X722 PCIe 10Gb 2-Port SFP+ Adapter - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 390.00, "EUR Price": 360.00},
        {"Part Number": "7ZT7A00486", "Description": "Broadcom 57414 PCIe 25Gb 2-Port SFP28 Ethernet Adapter - ThinkSystem SR650 SR665", "USD Price": 780.00, "EUR Price": 720.00},
        
        # Power supplies
        {"Part Number": "7N67A00882", "Description": "550W 230V/115V Platinum Hot Swap Power Supply - ThinkSystem SR630", "USD Price": 245.00, "EUR Price": 225.00},
        {"Part Number": "7N67A00883", "Description": "750W 230V/115V Platinum Hot Swap Power Supply - ThinkSystem SR630 SR650", "USD Price": 345.00, "EUR Price": 315.00},
        {"Part Number": "7N67A00884", "Description": "1100W 230V/115V Platinum Hot Swap Power Supply - ThinkSystem SR650 SR645 SR665", "USD Price": 545.00, "EUR Price": 500.00},
        
        # RAID controllers
        {"Part Number": "7Y37A01020", "Description": "ThinkSystem RAID 930-8i 2GB Flash PCIe 12Gb Adapter - ThinkSystem SR630 SR650 SR645 SR665", "USD Price": 495.00, "EUR Price": 455.00},
        {"Part Number": "7Y37A01021", "Description": "ThinkSystem RAID 930-16i 4GB Flash PCIe 12Gb Adapter - ThinkSystem SR650 SR665", "USD Price": 995.00, "EUR Price": 915.00},
        
        # Cables and transceivers
        {"Part Number": "7Z57A03758", "Description": "1m Passive DAC SFP28 25Gb Cable - ThinkSystem Universal", "USD Price": 45.00, "EUR Price": 40.00},
        {"Part Number": "7Z57A03759", "Description": "3m Passive DAC SFP28 25Gb Cable - ThinkSystem Universal", "USD Price": 65.00, "EUR Price": 60.00},
        {"Part Number": "7Z57A03760", "Description": "SFP28 25Gb SR Optical Transceiver - ThinkSystem Universal", "USD Price": 125.00, "EUR Price": 115.00},
        
        # Some upgrade options (should be filtered out)
        {"Part Number": "UPGRADE-001", "Description": "Upgrade Option - Extended Warranty 3 Years", "USD Price": 500.00, "EUR Price": 460.00},
        {"Part Number": "UPGRADE-002", "Description": "Configuration Upgrade - Professional Services", "USD Price": 750.00, "EUR Price": 690.00},
    ]
    
    # Create DataFrame
    df = pd.DataFrame(lenovo_parts_data)
    
    # Save to Excel with proper sheet name
    output_file = 'test_lenovo_x86_parts.xlsx'
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Lenovo X86 Parts', index=False)
    
    print(f"✅ Created test Lenovo file: {output_file}")
    print(f"📊 Total parts: {len(lenovo_parts_data)}")
    
    # Print summary of what should be detected
    cpu_count = len([p for p in lenovo_parts_data if 'Intel® Xeon®' in p['Description'] or 'AMD EPYC' in p['Description']])
    memory_count = len([p for p in lenovo_parts_data if 'RDIMM' in p['Description'] or 'LRDIMM' in p['Description']])
    storage_count = len([p for p in lenovo_parts_data if 'SSD' in p['Description'] or 'HDD' in p['Description']])
    network_count = len([p for p in lenovo_parts_data if 'Ethernet' in p['Description']])
    upgrade_count = len([p for p in lenovo_parts_data if 'Upgrade Option' in p['Description']])
    
    print(f"🔧 Component breakdown:")
    print(f"   - CPUs: {cpu_count} (should create {4} server configurations)")  # SR630, SR650, SR645, SR665
    print(f"   - Memory: {memory_count}")
    print(f"   - Storage: {storage_count}")
    print(f"   - Network: {network_count}")
    print(f"   - Upgrade Options: {upgrade_count} (should be filtered out)")
    
    # Print unique platforms that should be detected
    platforms = set()
    for part in lenovo_parts_data:
        desc = part['Description']
        if 'SR630' in desc:
            platforms.add('SR630')
        if 'SR650' in desc:
            platforms.add('SR650')
        if 'SR645' in desc:
            platforms.add('SR645')
        if 'SR665' in desc:
            platforms.add('SR665')
    
    print(f"🖥️  Server platforms detected: {sorted(platforms)}")
    print(f"📝 Expected smart parsing result: ~{len(platforms) * 2} server configurations + components as options")
    
    return output_file

if __name__ == "__main__":
    create_lenovo_test_file()
