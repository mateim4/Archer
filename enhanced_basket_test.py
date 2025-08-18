#!/usr/bin/env python3
"""
Enhanced Automated Basket Tester - Fixed to show actual parsing results
"""

import requests
import json
import time
from pathlib import Path

def get_all_baskets():
    """Get all baskets from the system."""
    try:
        response = requests.get("http://localhost:3001/api/hardware-baskets", timeout=5)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching baskets: {e}")
        return []

def get_basket_models(basket_id):
    """Get models for a specific basket."""
    try:
        response = requests.get(f"http://localhost:3001/api/hardware-baskets/{basket_id}/models", timeout=10)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching models for {basket_id}: {e}")
        return []

def analyze_models(models, file_name):
    """Analyze the parsed models."""
    if not models:
        print(f"❌ No models found for {file_name}")
        return
    
    print(f"\n📊 ANALYSIS FOR {file_name}")
    print("=" * 60)
    print(f"📦 Total Models: {len(models)}")
    
    # Field completion analysis
    fields_to_check = {
        'description': 'lot_description',
        'model_name': 'model_name', 
        'category': 'category',
        'form_factor': 'form_factor',
        'processor': 'base_specifications.processor',
        'memory': 'base_specifications.memory', 
        'storage': 'base_specifications.storage'
    }
    
    print("\n📈 FIELD COMPLETION RATES:")
    for field_name, field_path in fields_to_check.items():
        filled = 0
        for model in models:
            if '.' in field_path:
                parts = field_path.split('.')
                value = model
                for part in parts:
                    value = value.get(part) if isinstance(value, dict) else None
                    if value is None:
                        break
            else:
                value = model.get(field_path)
            
            if value is not None and str(value).strip():
                filled += 1
        
        completion = (filled / len(models)) * 100
        status = "✅" if completion >= 80 else "⚠️" if completion >= 50 else "❌"
        print(f"  {status} {field_name:15} {completion:6.1f}% ({filled}/{len(models)})")
    
    # Show sample models
    print(f"\n📝 SAMPLE MODELS (first 5):")
    for i, model in enumerate(models[:5], 1):
        desc = model.get('lot_description', 'N/A')[:60]
        category = model.get('category', 'N/A')
        form_factor = model.get('form_factor', 'N/A') 
        print(f"  {i}. {desc}... | {category} | {form_factor}")
        
        # Show processor info if available
        proc = model.get('base_specifications', {}).get('processor')
        if proc and isinstance(proc, dict):
            proc_model = proc.get('model', 'N/A')
            proc_cores = proc.get('core_count') or proc.get('cores', 'N/A')
            print(f"     🖥️  CPU: {proc_model} ({proc_cores} cores)")
        
        # Show memory info if available
        mem = model.get('base_specifications', {}).get('memory')
        if mem and isinstance(mem, dict):
            mem_total = mem.get('total_capacity', 'N/A')
            mem_type = mem.get('type', 'N/A')
            print(f"     💾 Memory: {mem_total} {mem_type}")

def upload_and_analyze_file(file_path):
    """Upload file and analyze results."""
    print(f"\n🚀 TESTING {file_path.name}")
    print("=" * 70)
    
    # Get baskets count before upload
    baskets_before = get_all_baskets()
    print(f"📊 Baskets before upload: {len(baskets_before)}")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post("http://localhost:3001/api/hardware-baskets/upload", files=files, timeout=60)
        
        print(f"📤 Upload status: {response.status_code}")
        
        if response.status_code == 200:
            # Wait for processing
            print("⏳ Waiting for processing...")
            time.sleep(3)
            
            # Get baskets after upload
            baskets_after = get_all_baskets()
            print(f"📊 Baskets after upload: {len(baskets_after)}")
            
            if len(baskets_after) > len(baskets_before):
                # Find the new basket (should be the last one)
                new_basket = baskets_after[-1]
                basket_id = new_basket.get('id')
                
                print(f"✅ New basket created: {basket_id}")
                
                # Get models for this basket
                models = get_basket_models(basket_id)
                analyze_models(models, file_path.name)
                
                return True
            else:
                print("⚠️ No new basket created - checking all baskets for new models...")
                # Check all baskets for models
                total_models = 0
                for basket in baskets_after:
                    basket_id = basket.get('id')
                    models = get_basket_models(basket_id) 
                    if models:
                        total_models += len(models)
                        print(f"📦 Basket {basket_id}: {len(models)} models")
                
                if total_models > 0:
                    print(f"✅ Found {total_models} total models across all baskets")
                    return True
        else:
            print(f"❌ Upload failed: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return False

def main():
    print("🤖 ENHANCED AUTOMATED BASKET TESTING")
    print("=" * 70)
    
    # Check all existing data first
    existing_baskets = get_all_baskets()
    if existing_baskets:
        print(f"\n📋 EXISTING DATA:")
        total_existing_models = 0
        for basket in existing_baskets:
            basket_id = basket.get('id')
            models = get_basket_models(basket_id)
            total_existing_models += len(models)
            print(f"  📦 Basket {basket_id}: {len(models)} models")
        
        print(f"\n📊 Total existing models: {total_existing_models}")
        
        # Show analysis of most recent basket
        if existing_baskets:
            latest_basket = existing_baskets[-1]
            models = get_basket_models(latest_basket.get('id'))
            if models:
                analyze_models(models, "Latest Existing Basket")
    else:
        print("📋 No existing baskets found")
    
    # Test new uploads
    production_files = [
        Path("docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"),
        Path("docs/X86 Basket Q3 2025 v2 Dell Only.xlsx")
    ]
    
    print(f"\n🔄 TESTING NEW UPLOADS:")
    for file_path in production_files:
        if file_path.exists():
            success = upload_and_analyze_file(file_path)
            if success:
                print(f"✅ {file_path.name} processing completed")
            else:
                print(f"❌ {file_path.name} processing failed")
        else:
            print(f"❌ File not found: {file_path}")

if __name__ == "__main__":
    main()
