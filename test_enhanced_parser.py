#!/usr/bin/env python3
"""
Enhanced test script to upload files to the new backend and test the enhanced Lenovo parsing
"""
import requests
import json
import time
from pathlib import Path

def test_enhanced_lenovo_parsing():
    """Test the enhanced Lenovo parsing with real production files"""
    
    print("🧪 TESTING ENHANCED LENOVO PARSING")
    print("=" * 70)
    
    base_url = "http://localhost:3002"
    
    # Test files
    lenovo_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    dell_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    
    test_files = [
        (lenovo_file, "Lenovo", "Enhanced Lenovo Parser Test"),
        (dell_file, "Dell", "Dell Baseline Parser Test")
    ]
    
    for file_path, vendor, description in test_files:
        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            continue
            
        print(f"\n📤 UPLOADING: {vendor} - {Path(file_path).name}")
        print("-" * 50)
        
        # Upload file
        with open(file_path, 'rb') as f:
            files = {'file': f}
            data = {
                'vendor': vendor,
                'description': description,
                'quotation_date': '2025-04-01T00:00:00Z'
            }
            
            response = requests.post(f"{base_url}/api/hardware-baskets/upload", 
                                   files=files, data=data, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            basket_id = result.get('basket_id')
            models_created = result.get('models_created', 0)
            
            print(f"✅ Upload successful!")
            print(f"   📦 Basket ID: {basket_id}")
            print(f"   🖥️  Models created: {models_created}")
            
            # Get detailed parsing results
            if basket_id:
                time.sleep(1)  # Let the database settle
                
                models_response = requests.get(f"{base_url}/api/hardware-baskets/{basket_id}/models")
                if models_response.status_code == 200:
                    models = models_response.json()
                    
                    if models:
                        print(f"\n📊 PARSING ANALYSIS ({vendor}):")
                        analyze_models(models, vendor)
                    else:
                        print("   ❌ No models found in response")
                else:
                    print(f"   ❌ Failed to get models: {models_response.status_code}")
                    
        else:
            print(f"❌ Upload failed: {response.status_code}")
            if response.text:
                print(f"   Error: {response.text}")

def analyze_models(models, vendor):
    """Analyze the parsed models for field completion"""
    
    total_models = len(models)
    
    # Field completion analysis
    fields_to_check = [
        ('Description', 'lot_description'),
        ('Model Name', 'model_name'), 
        ('Category', 'category'),
        ('Form Factor', 'form_factor'),
        ('Processor Info', 'processor_info'),
        ('Memory Info', 'ram_info'), 
        ('Network Info', 'network_info')
    ]
    
    completion_stats = {}
    
    for field_name, field_key in fields_to_check:
        filled_count = 0
        for model in models:
            value = model.get(field_key, '')
            if value and value.strip() and value.strip().lower() != 'unknown' and value.strip() != '':
                filled_count += 1
        
        completion_pct = (filled_count / total_models) * 100 if total_models > 0 else 0
        completion_stats[field_name] = completion_pct
        
        status = "✅" if completion_pct >= 90 else "⚠️" if completion_pct >= 50 else "❌"
        print(f"   {status} {field_name:<15} {completion_pct:5.1f}%")
    
    # Show sample models for detailed analysis
    print(f"\n📝 SAMPLE MODELS ({min(5, total_models)} of {total_models}):")
    for i, model in enumerate(models[:5]):
        print(f"\n{i+1}. {model.get('model_name', 'Unknown')[:60]}...")
        print(f"   📁 Category: {model.get('category', 'None')}")
        print(f"   🏗️  Form Factor: {model.get('form_factor', 'None')}")
        
        if model.get('processor_info'):
            cpu_info = model['processor_info'][:100] + "..." if len(model['processor_info']) > 100 else model['processor_info']
            print(f"   🖥️  CPU: {cpu_info}")
            
        if model.get('ram_info'):
            ram_info = model['ram_info'][:80] + "..." if len(model['ram_info']) > 80 else model['ram_info']
            print(f"   💾 Memory: {ram_info}")
            
        if model.get('network_info'):
            net_info = model['network_info'][:80] + "..." if len(model['network_info']) > 80 else model['network_info']
            print(f"   🌐 Network: {net_info}")
    
    # Overall completion score
    avg_completion = sum(completion_stats.values()) / len(completion_stats)
    print(f"\n🎯 OVERALL COMPLETION: {avg_completion:.1f}%")
    
    if vendor.lower() == "lenovo":
        print("\n📈 ENHANCEMENT IMPACT:")
        print("   🎯 Target improvements:")
        if completion_stats.get('Form Factor', 0) < 90:
            print(f"      - Form Factor: {completion_stats.get('Form Factor', 0):.1f}% → Target 95%+")
        if completion_stats.get('Processor Info', 0) < 90:
            print(f"      - Processor Info: {completion_stats.get('Processor Info', 0):.1f}% → Target 95%+") 
        if completion_stats.get('Memory Info', 0) < 90:
            print(f"      - Memory Info: {completion_stats.get('Memory Info', 0):.1f}% → Target 95%+")
        if completion_stats.get('Network Info', 0) < 90:
            print(f"      - Network Info: {completion_stats.get('Network Info', 0):.1f}% → Target 95%+")

if __name__ == "__main__":
    test_enhanced_lenovo_parsing()
