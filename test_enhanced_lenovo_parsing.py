
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
    
    print(f"\n📊 PARSING RESULTS:")
    print(f"   🖥️  Models found: {models_found}")
    print(f"   🔧 Avg components per model: {avg_components:.1f}")
    print(f"   📋 Component distribution: {components_per_model[:10]}...")

if __name__ == "__main__":
    test_enhanced_lenovo_parsing()
