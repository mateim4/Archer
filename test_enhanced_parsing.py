#!/usr/bin/env python3
"""
Test script to verify the enhanced Lenovo parsing improvements
"""

import requests
import json
import time
from pathlib import Path

def test_enhanced_parsing():
    print("🧪 TESTING ENHANCED LENOVO PARSING")
    print("=" * 50)
    
    base_url = "http://localhost:3002"
    
    # Test Lenovo file
    lenovo_file = "docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(lenovo_file).exists():
        print(f"❌ File not found: {lenovo_file}")
        return
    
    print(f"📤 Testing: {lenovo_file}")
    
    # Upload the file
    with open(lenovo_file, 'rb') as f:
        files = {'file': f}
        data = {
            'vendor': 'Lenovo',
            'description': 'Enhanced Parser Test',
            'quotation_date': '2025-08-01T00:00:00Z'
        }
        
        response = requests.post(f"{base_url}/api/hardware-baskets/upload", 
                               files=files, data=data, timeout=60)
    
    if response.status_code != 200:
        print(f"❌ Upload failed: {response.status_code}")
        return
    
    result = response.json()
    basket_id = result.get('basket_id')
    models_created = result.get('models_created', 0)
    
    print(f"✅ Upload successful!")
    print(f"📦 Basket ID: {basket_id}")
    print(f"🖥️  Models created: {models_created}")
    
    # Get detailed model information
    time.sleep(1)
    models_response = requests.get(f"{base_url}/api/hardware-baskets/{basket_id}/models")
    
    if models_response.status_code != 200:
        print(f"❌ Failed to get models: {models_response.status_code}")
        return
    
    models = models_response.json()
    
    if not models:
        print("❌ No models found")
        return
    
    print(f"\n🔍 DETAILED ANALYSIS ({len(models)} models):")
    print("-" * 40)
    
    # Analyze field completion
    fields_to_check = [
        'model_name', 'model_number', 'form_factor', 
        'processor_info', 'ram_info', 'network_info',
        'category', 'lot_description'
    ]
    
    field_stats = {field: 0 for field in fields_to_check}
    
    for model in models:
        for field in fields_to_check:
            value = model.get(field)
            if value and str(value).strip():
                field_stats[field] += 1
    
    # Calculate completion percentages
    total_models = len(models)
    completion_rates = {}
    for field, count in field_stats.items():
        rate = (count / total_models) * 100 if total_models > 0 else 0
        completion_rates[field] = rate
        status = "✅" if rate > 80 else "⚠️" if rate > 50 else "❌"
        print(f"  {status} {field}: {rate:.1f}% ({count}/{total_models})")
    
    # Show sample models with enhancements
    print(f"\n📝 SAMPLE ENHANCED MODELS:")
    print("-" * 40)
    
    for i, model in enumerate(models[:3]):
        print(f"\n  Model {i+1}:")
        print(f"    🏷️  Name: {model.get('model_name', 'N/A')}")
        print(f"    📄 Lot Description: {model.get('lot_description', 'N/A')[:60]}...")
        print(f"    🔢 Model Number: {model.get('model_number', 'N/A')}")
        print(f"    📐 Form Factor: {model.get('form_factor', 'N/A')}")
        
        if model.get('processor_info'):
            print(f"    🖥️  CPU: {model['processor_info'][:60]}...")
        
        if model.get('ram_info'):
            print(f"    💾 Memory: {model['ram_info'][:60]}...")
        
        if model.get('network_info'):
            print(f"    🌐 Network: {model['network_info'][:60]}...")
        
        # Check base_specifications
        base_specs = model.get('base_specifications', {})
        if base_specs:
            if base_specs.get('processor'):
                proc = base_specs['processor']
                print(f"    ⚙️  Enhanced CPU: {proc.get('brand', 'N/A')} - {proc.get('core_count', 'N/A')} cores @ {proc.get('frequency_ghz', 'N/A')}GHz")
            
            if base_specs.get('memory'):
                mem = base_specs['memory']
                print(f"    ⚙️  Enhanced Memory: {mem.get('total_capacity_gb', 'N/A')}GB {mem.get('memory_type', 'N/A')}")
    
    # Overall enhancement assessment
    avg_completion = sum(completion_rates.values()) / len(completion_rates)
    print(f"\n🎯 OVERALL ENHANCEMENT RESULTS:")
    print(f"   📊 Average Completion: {avg_completion:.1f}%")
    
    # Key improvements to highlight
    key_improvements = []
    if completion_rates.get('form_factor', 0) > 80:
        key_improvements.append("✅ Form factor detection working")
    if completion_rates.get('model_name', 0) > 90:
        key_improvements.append("✅ Model name extraction improved")
    
    if key_improvements:
        print("   🚀 Key Improvements:")
        for improvement in key_improvements:
            print(f"      {improvement}")
    
    # Areas needing work
    needs_work = []
    if completion_rates.get('model_number', 0) < 50:
        needs_work.append("❌ Model number extraction needs work")
    if completion_rates.get('processor_info', 0) < 50:
        needs_work.append("❌ Processor info extraction needs improvement")
    if completion_rates.get('ram_info', 0) < 50:
        needs_work.append("❌ RAM info extraction needs improvement")
    if completion_rates.get('network_info', 0) < 50:
        needs_work.append("❌ Network info extraction needs improvement")
    
    if needs_work:
        print("   📋 Still Needs Work:")
        for issue in needs_work:
            print(f"      {issue}")

if __name__ == "__main__":
    test_enhanced_parsing()
