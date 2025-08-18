#!/usr/bin/env python3
"""
Enhanced Lenovo-specific parser to improve field completion rates
"""

import requests
import json
import time
from pathlib import Path

def enhanced_lenovo_parsing_logic():
    """
    Create enhanced parsing logic for Lenovo Excel structure based on our analysis:
    
    Structure:
    - Row with lot number (e.g., 7D73CTO1WW) + high-level description + pricing
    - Next row: Server model (e.g., "SMI1 : ThinkSystem SR630 V3 - 1yr Warranty")  
    - Following rows: Components (Chassis, CPU, Memory, Storage, Network, etc.)
    """
    
    # First, let's enhance the backend parser with better Lenovo logic
    backend_enhancement = """
    
    ENHANCED LENOVO PARSING LOGIC NEEDED:
    
    1. FORM FACTOR EXTRACTION:
       - Look for "1U", "2U", "4U" in descriptions
       - Extract from chassis descriptions like "ThinkSystem V3 1U 10x2.5" Chassis"
       - Map server models to form factors (SR630 = 1U, SR650 = 2U, etc.)
    
    2. PROCESSOR INFO EXTRACTION:
       - Look for "Intel Xeon" patterns in component rows
       - Extract core/thread count: "10C", "36C/72T" 
       - Extract frequency: "2.7GHz", "2.0GHz"
       - Extract TDP: "150W", "300W"
    
    3. MEMORY INFO EXTRACTION:
       - Look for "DIMM", "DDR5", "GB" patterns
       - Extract capacity from descriptions like "16GB TruDDR5 4800MHz"
       - Calculate total memory from quantity * capacity
    
    4. STORAGE INFO EXTRACTION:
       - Look for "SSD", "NVMe", "RAID" patterns
       - Extract capacity from descriptions like "960GB Read Intensive NVMe"
       - Identify storage types: NVMe, SAS, SATA
    
    5. NETWORK INFO EXTRACTION:
       - Look for "GbE", "Ethernet", "NIC" patterns
       - Extract speed: "10/25GbE", "1GbE"
       - Extract port count: "2-Port", "4-Port"
    """
    
    print("📋 ENHANCED LENOVO PARSING STRATEGY")
    print("=" * 70)
    print(backend_enhancement)
    
    # Let's create a more advanced parser that analyzes the actual structure
    return create_advanced_lenovo_parser()

def create_advanced_lenovo_parser():
    """Create an advanced parser that handles Lenovo-specific structure"""
    
    parser_code = '''
// Enhanced Lenovo parsing logic for better field completion

fn parse_lenovo_structure(range: calamine::Range<DataType>, headers: &HashMap<usize, String>) -> Result<Vec<HardwareModel>, anyhow::Error> {
    let mut models = Vec::new();
    let mut current_lot: Option<(String, String, f64)> = None; // (lot_id, description, price)
    let mut current_model: Option<HardwareModel> = None;
    let mut components: Vec<String> = Vec::new();
    
    for (row_idx, row) in range.rows().enumerate().skip(4) { // Skip header rows
        let part_number = get_string_value(row, headers, "part number");
        let description = get_string_value(row, headers, "description");
        let quantity = get_i64_value(row, headers, "quantity");
        let price = get_f64_value(row, headers, "total price in usd");
        
        // Check if this is a new lot (has lot-style part number and significant price)
        if is_lot_row(&part_number, &description, price) {
            // Finalize previous model if exists
            if let Some(model) = current_model.take() {
                let enhanced_model = enhance_model_with_components(model, &components);
                models.push(enhanced_model);
            }
            
            // Start new lot
            current_lot = Some((part_number.clone(), description.clone(), price));
            components.clear();
            
        } else if let Some((lot_id, lot_desc, lot_price)) = &current_lot {
            // Check if this is the server model description row
            if is_server_model_row(&description) {
                // Create new model
                current_model = Some(create_lenovo_model(
                    &lot_id, &lot_desc, &description, lot_price, basket_id.clone(), quotation_date.clone()
                ));
            } else if !description.is_empty() {
                // This is a component, add to current model's components
                components.push(description.clone());
            }
        }
    }
    
    // Finalize last model
    if let Some(model) = current_model.take() {
        let enhanced_model = enhance_model_with_components(model, &components);
        models.push(enhanced_model);
    }
    
    Ok(models)
}

fn is_lot_row(part_number: &str, description: &str, price: f64) -> bool {
    // Lot rows have format like "7D73CTO1WW" and high-level descriptions with pricing
    !part_number.is_empty() && 
    part_number.len() >= 8 && 
    description.contains("Intel") || description.contains("AMD") && 
    price > 1000.0 // Lots typically have significant pricing
}

fn is_server_model_row(description: &str) -> bool {
    // Server model rows contain server names and warranty info
    description.contains("ThinkSystem") && 
    (description.contains("SR630") || description.contains("SR650") || description.contains("SR645")) &&
    description.contains("Warranty")
}

fn create_lenovo_model(lot_id: &str, lot_desc: &str, server_desc: &str, price: &f64, basket_id: Thing, quotation_date: Datetime) -> HardwareModel {
    let form_factor = extract_form_factor(server_desc);
    let server_model = extract_server_model(server_desc);
    
    HardwareModel {
        id: Some(Thing { tb: "hardware_model".to_string(), id: Uuid::new_v4().to_string().into() }),
        basket_id,
        lot_description: lot_desc.to_string(),
        model_name: server_desc.to_string(),
        model_number: lot_id.to_string(),
        category: "Server".to_string(),
        form_factor: form_factor,
        vendor: "Lenovo".to_string(),
        server_model: server_model,
        // ... other fields will be enhanced by enhance_model_with_components
        quotation_date,
    }
}

fn extract_form_factor(description: &str) -> String {
    // Extract form factor from server descriptions
    if description.contains("SR630") { return "1U".to_string(); }
    if description.contains("SR650") { return "2U".to_string(); }
    if description.contains("SR645") { return "1U".to_string(); }
    
    // Look for explicit form factor mentions
    if description.contains("1U") { return "1U".to_string(); }
    if description.contains("2U") { return "2U".to_string(); }
    if description.contains("4U") { return "4U".to_string(); }
    
    "1U".to_string() // Default for most ThinkSystem servers
}

fn enhance_model_with_components(mut model: HardwareModel, components: &[String]) -> HardwareModel {
    let mut processor_parts = Vec::new();
    let mut memory_parts = Vec::new();
    let mut storage_parts = Vec::new();
    let mut network_parts = Vec::new();
    
    for component in components {
        let comp_lower = component.to_lowercase();
        
        if comp_lower.contains("xeon") || comp_lower.contains("processor") {
            processor_parts.push(component.clone());
            
            // Extract detailed processor info
            if let Some(cpu_info) = extract_cpu_details(component) {
                model.cpu_model = cpu_info.model;
                model.cpu_cores = cpu_info.cores;
                model.cpu_threads = cpu_info.threads;
                model.cpu_frequency = cpu_info.frequency;
            }
        }
        
        if comp_lower.contains("dimm") || comp_lower.contains("ddr5") || comp_lower.contains("gb") {
            memory_parts.push(component.clone());
        }
        
        if comp_lower.contains("ssd") || comp_lower.contains("nvme") || comp_lower.contains("storage") {
            storage_parts.push(component.clone());
        }
        
        if comp_lower.contains("ethernet") || comp_lower.contains("nic") || comp_lower.contains("gbe") {
            network_parts.push(component.clone());
        }
        
        // Look for chassis info for form factor
        if comp_lower.contains("chassis") {
            if let Some(ff) = extract_chassis_form_factor(component) {
                model.form_factor = ff;
            }
        }
    }
    
    // Populate summary fields
    model.processor_info = processor_parts.join("; ");
    model.ram_info = memory_parts.join("; ");
    model.network_info = network_parts.join("; ");
    
    model
}
'''
    
    print("📝 ENHANCED PARSER LOGIC CREATED")
    print("=" * 70)
    print("Key improvements:")
    print("  ✅ Lot-based grouping instead of row-by-row")
    print("  ✅ Form factor extraction from server models and chassis")
    print("  ✅ Component aggregation per server model")
    print("  ✅ Detailed field extraction from component descriptions")
    
    return parser_code

def test_enhanced_parser():
    """Test the current backend with focus on Lenovo improvements"""
    
    print("\n🧪 TESTING ENHANCED PARSING APPROACH")
    print("=" * 70)
    
    # Let's implement a quick Python prototype to validate our approach
    prototype_code = '''
def prototype_lenovo_parser():
    """Prototype the enhanced parsing logic in Python"""
    
    import pandas as pd
    
    lenovo_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    df = pd.read_excel(lenovo_file, sheet_name='Lenovo X86 Server Lots', header=None)
    
    models = []
    current_lot = None
    current_components = []
    
    # Start from row 5 (first data row)
    for i in range(5, len(df)):
        row = df.iloc[i]
        
        # Get key values
        part_num = str(row[1]) if pd.notna(row[1]) else ""
        desc = str(row[2]) if pd.notna(row[2]) else ""
        qty = row[3] if pd.notna(row[3]) else 1
        price_usd = row[4] if pd.notna(row[4]) and isinstance(row[4], (int, float)) else 0
        
        # Check if this is a lot row (has long part number and high price)
        if (len(part_num) >= 8 and price_usd > 1000):
            # Finalize previous model
            if current_lot:
                model = finalize_lenovo_model(current_lot, current_components)
                models.append(model)
            
            # Start new lot
            current_lot = {
                'lot_id': part_num,
                'lot_description': desc,
                'price': price_usd,
                'server_description': None
            }
            current_components = []
            
        elif current_lot and desc.startswith(current_lot['lot_id'].split('_')[0] if '_' in current_lot['lot_id'] else current_lot['lot_id'][:4]):
            # This is the server model description
            current_lot['server_description'] = desc
            
        elif current_lot and desc and not desc.isspace():
            # This is a component
            current_components.append({
                'part_number': part_num,
                'description': desc,
                'quantity': qty
            })
    
    # Finalize last model
    if current_lot:
        model = finalize_lenovo_model(current_lot, current_components)
        models.append(model)
    
    return models

def finalize_lenovo_model(lot_info, components):
    """Convert lot and components into enhanced model"""
    
    model = {
        'lot_id': lot_info['lot_id'],
        'lot_description': lot_info['lot_description'],
        'server_description': lot_info['server_description'] or lot_info['lot_description'],
        'form_factor': extract_form_factor_python(lot_info['server_description'] or lot_info['lot_description']),
        'processor_info': '',
        'memory_info': '',
        'storage_info': '',
        'network_info': '',
        'components': components
    }
    
    # Analyze components
    for comp in components:
        desc = comp['description'].lower()
        
        if 'xeon' in desc or 'processor' in desc:
            model['processor_info'] += f"{comp['description']}; "
            
        if 'dimm' in desc or 'ddr5' in desc or 'gb' in desc and 'memory' in desc:
            model['memory_info'] += f"{comp['description']} x{comp['quantity']}; "
            
        if 'ssd' in desc or 'nvme' in desc or 'storage' in desc:
            model['storage_info'] += f"{comp['description']} x{comp['quantity']}; "
            
        if 'ethernet' in desc or 'nic' in desc or 'gbe' in desc:
            model['network_info'] += f"{comp['description']}; "
            
        if 'chassis' in desc and ('1u' in desc or '2u' in desc or '4u' in desc):
            model['form_factor'] = extract_chassis_form_factor_python(comp['description'])
    
    # Clean up info fields
    for field in ['processor_info', 'memory_info', 'storage_info', 'network_info']:
        model[field] = model[field].strip('; ')
    
    return model

def extract_form_factor_python(description):
    """Extract form factor from description"""
    desc_lower = description.lower()
    
    # Server model mappings
    if 'sr630' in desc_lower: return '1U'
    if 'sr650' in desc_lower: return '2U' 
    if 'sr645' in desc_lower: return '1U'
    
    # Direct mentions
    if '1u' in desc_lower: return '1U'
    if '2u' in desc_lower: return '2U'
    if '4u' in desc_lower: return '4U'
    
    return '1U'  # Default for ThinkSystem

def extract_chassis_form_factor_python(description):
    """Extract form factor from chassis description"""
    desc_lower = description.lower()
    if '1u' in desc_lower: return '1U'
    if '2u' in desc_lower: return '2U'
    if '4u' in desc_lower: return '4U'
    return '1U'
'''
    
    return prototype_code

def test_prototype_parser():
    """Test our enhanced parsing approach"""
    
    print("\n🧪 TESTING PROTOTYPE ENHANCED PARSER")
    print("=" * 70)
    
    # Create a simple test script
    test_script = '''
import pandas as pd

def test_enhanced_lenovo_parsing():
    """Test enhanced parsing logic"""
    
    lenovo_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    df = pd.read_excel(lenovo_file, sheet_name='Lenovo X86 Server Lots', header=None)
    
    print("🔍 TESTING ENHANCED LENOVO PARSING")
    print("=" * 50)
    
    models_found = 0
    components_per_model = []
    current_components = 0
    
    for i in range(5, min(50, len(df))):  # Test first 45 data rows
        row = df.iloc[i]
        part_num = str(row[1]) if pd.notna(row[1]) else ""
        desc = str(row[2]) if pd.notna(row[2]) else ""
        price_usd = row[4] if pd.notna(row[4]) and isinstance(row[4], (int, float)) else 0
        
        if len(part_num) >= 8 and price_usd > 1000:
            # This is a lot - finalize previous model
            if current_components > 0:
                components_per_model.append(current_components)
                current_components = 0
            models_found += 1
            print(f"🖥️  Model {models_found}: {part_num} - {desc[:50]}... (${price_usd})")
            
        elif desc and not desc.isspace():
            current_components += 1
            
            # Analyze component for field extraction
            desc_lower = desc.lower()
            component_type = "Unknown"
            extracted_info = ""
            
            if 'chassis' in desc_lower:
                component_type = "🏗️ Chassis"
                if '1u' in desc_lower: extracted_info = "Form Factor: 1U"
                elif '2u' in desc_lower: extracted_info = "Form Factor: 2U"
                
            elif 'xeon' in desc_lower or 'processor' in desc_lower:
                component_type = "🖥️  CPU"
                # Extract CPU details
                cores = "Unknown"
                freq = "Unknown"
                if 'c ' in desc_lower:
                    import re
                    core_match = re.search(r'(\d+)c ', desc_lower)
                    if core_match: cores = f"{core_match.group(1)}C"
                if 'ghz' in desc_lower:
                    freq_match = re.search(r'(\d+\.?\d*)ghz', desc_lower)
                    if freq_match: freq = f"{freq_match.group(1)}GHz"
                extracted_info = f"Cores: {cores}, Freq: {freq}"
                
            elif 'dimm' in desc_lower or 'ddr5' in desc_lower:
                component_type = "💾 Memory"
                # Extract memory details
                import re
                gb_match = re.search(r'(\d+)gb', desc_lower)
                if gb_match: extracted_info = f"Capacity: {gb_match.group(1)}GB"
                
            elif 'ssd' in desc_lower or 'nvme' in desc_lower:
                component_type = "💿 Storage"
                import re
                storage_match = re.search(r'(\d+)gb', desc_lower)
                if storage_match: extracted_info = f"Capacity: {storage_match.group(1)}GB"
                
            elif 'ethernet' in desc_lower or 'gbe' in desc_lower:
                component_type = "🌐 Network"
                import re
                speed_match = re.search(r'(\d+)/?(\d+)?gbe', desc_lower)
                if speed_match: extracted_info = f"Speed: {speed_match.group(0).upper()}"
            
            print(f"    {component_type}: {desc[:60]}... → {extracted_info}")
    
    # Final statistics
    if current_components > 0:
        components_per_model.append(current_components)
    
    avg_components = sum(components_per_model) / len(components_per_model) if components_per_model else 0
    
    print(f"\\n📊 PARSING RESULTS:")
    print(f"   🖥️  Models found: {models_found}")
    print(f"   🔧 Avg components per model: {avg_components:.1f}")
    print(f"   📋 Component distribution: {components_per_model[:10]}...")

if __name__ == "__main__":
    test_enhanced_lenovo_parsing()
'''
    
    return test_script

if __name__ == "__main__":
    enhanced_lenovo_parsing_logic()
    
    # Create and run the test script
    test_code = test_prototype_parser()
    
    with open('/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/test_enhanced_lenovo_parsing.py', 'w') as f:
        f.write(test_code)
    
    print("\n✅ Created test_enhanced_lenovo_parsing.py")
    print("📝 Run: python3 test_enhanced_lenovo_parsing.py")
