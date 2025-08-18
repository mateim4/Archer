#!/usr/bin/env python3
"""
Simple Lenovo Parser Test
"""

import pandas as pd
import json
from datetime import datetime
from pathlib import Path

def test_lenovo_parsing():
    file_path = "/Users/mateimarcu/DevApps/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(file_path).exists():
        print("❌ File not found")
        return
    
    print("🔍 Loading Lenovo file...")
    
    try:
        df = pd.read_excel(file_path, sheet_name='Lenovo X86 Server Lots', header=None)
        print(f"✅ File loaded: {df.shape[0]} rows x {df.shape[1]} columns")
        
        # Find header row (row 3)
        header_row = 3
        print(f"📊 Header row: {header_row}")
        
        # Show headers
        headers = df.iloc[header_row].fillna('').astype(str).tolist()
        print(f"📋 Headers: {headers}")
        
        # Process a few rows to demonstrate correct parsing
        corrected_models = []
        current_server = None
        
        part_col = 1
        desc_col = 2
        usd_price_col = 4
        eur_price_col = 5
        
        print("\n🚀 Processing data...")
        
        for idx in range(header_row + 1, min(header_row + 20, df.shape[0])):  # Process first 20 rows for demo
            row = df.iloc[idx].fillna('')
            
            part_number = str(row.iloc[part_col]).strip()
            description = str(row.iloc[desc_col]).strip()
            
            if not part_number and not description:
                continue
                
            # Check if this is a main server entry (has pricing)
            usd_price = None
            try:
                if row.iloc[usd_price_col] and str(row.iloc[usd_price_col]).strip():
                    usd_price = float(row.iloc[usd_price_col])
            except:
                pass
                
            desc_lower = description.lower()
            server_indicators = ['smi1', 'smi2', 'server', '- intel', '- amd']
            has_server_indicator = any(indicator in desc_lower for indicator in server_indicators)
            
            is_main_server = usd_price and usd_price > 0 and has_server_indicator
            
            if is_main_server:
                # Save previous server
                if current_server:
                    corrected_models.append(current_server)
                
                # Create new server
                current_server = {
                    'id': f'server_{len(corrected_models) + 1}',
                    'model_name': description.split(' - ')[0] if ' - ' in description else description,
                    'part_number': part_number,
                    'description': description,
                    'usd_price': usd_price,
                    'components': []
                }
                
                print(f"🖥️  SERVER: {current_server['model_name']} (${usd_price})")
                
            elif current_server and (part_number or description):
                # Add component
                component = {
                    'part_number': part_number,
                    'description': description,
                    'type': 'processor' if any(kw in desc_lower for kw in ['processor', 'intel', 'amd']) else 'component'
                }
                current_server['components'].append(component)
                print(f"    ├── {component['type']}: {description[:50]}...")
        
        # Add last server
        if current_server:
            corrected_models.append(current_server)
        
        print(f"\n✅ Successfully parsed {len(corrected_models)} server models")
        
        for i, model in enumerate(corrected_models):
            print(f"  {i+1}. {model['model_name']} - ${model['usd_price']} ({len(model['components'])} components)")
        
        # Save results
        output_file = "/Users/mateimarcu/DevApps/LCMDesigner/simple_lenovo_test.json"
        with open(output_file, 'w') as f:
            json.dump(corrected_models, f, indent=2)
        
        print(f"\n💾 Results saved to: {output_file}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_lenovo_parsing()
