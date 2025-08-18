#!/usr/bin/env python3
"""
Production Basket Parser Results Analyzer
Shows current parsing results from the real production files
"""

import requests
import json
from collections import defaultdict

def extract_basket_id(basket_obj):
    """Extract the actual basket ID from the complex SurrealDB object."""
    return basket_obj['id']['id']['String']

def get_all_baskets():
    """Get all baskets."""
    response = requests.get("http://localhost:3001/api/hardware-baskets")
    return response.json() if response.status_code == 200 else []

def get_models_for_basket(basket_id):
    """Get all models for a basket."""
    response = requests.get(f"http://localhost:3001/api/hardware-baskets/{basket_id}/models")
    return response.json() if response.status_code == 200 else []

def analyze_field_completion(models):
    """Analyze field completion rates."""
    if not models:
        return {}
    
    stats = {}
    total = len(models)
    
    # Basic fields
    fields = {
        'lot_description': 'Description',
        'model_name': 'Model Name',
        'category': 'Category',
        'form_factor': 'Form Factor'
    }
    
    for field, label in fields.items():
        filled = sum(1 for m in models if m.get(field) and str(m[field]).strip())
        stats[label] = (filled / total) * 100
    
    # Nested specification fields
    spec_fields = {
        'processor': 'Processor Info',
        'memory': 'Memory Info', 
        'storage': 'Storage Info',
        'network': 'Network Info'
    }
    
    for field, label in spec_fields.items():
        filled = 0
        for model in models:
            specs = model.get('base_specifications', {})
            if specs and specs.get(field):
                spec_data = specs[field]
                if spec_data and (
                    (isinstance(spec_data, dict) and any(spec_data.values())) or
                    (isinstance(spec_data, str) and spec_data.strip()) or
                    (isinstance(spec_data, (int, float)) and spec_data != 0)
                ):
                    filled += 1
        stats[label] = (filled / total) * 100
    
    return stats

def show_model_samples(models, count=5):
    """Show sample models with their specifications."""
    print(f"\n📝 SAMPLE MODELS ({count} of {len(models)}):")
    print("-" * 80)
    
    for i, model in enumerate(models[:count], 1):
        desc = model.get('lot_description', 'N/A')
        category = model.get('category', 'N/A')
        form_factor = model.get('form_factor', 'N/A')
        
        print(f"\n{i}. {desc[:70]}...")
        print(f"   📁 Category: {category} | 🏗️  Form Factor: {form_factor}")
        
        # Show processor details
        specs = model.get('base_specifications', {})
        if specs.get('processor'):
            proc = specs['processor']
            if isinstance(proc, dict):
                model_name = proc.get('model', 'N/A')
                cores = proc.get('core_count') or proc.get('cores', 'N/A')
                threads = proc.get('thread_count') or proc.get('threads', 'N/A')
                freq = proc.get('frequency_ghz', 'N/A')
                print(f"   🖥️  CPU: {model_name} | {cores}C/{threads}T @ {freq}GHz")
        
        # Show memory details  
        if specs.get('memory'):
            mem = specs['memory']
            if isinstance(mem, dict):
                capacity = mem.get('total_capacity', 'N/A')
                mem_type = mem.get('type', 'N/A')
                print(f"   💾 Memory: {capacity} {mem_type}")
        
        # Show storage details
        if specs.get('storage'):
            storage = specs['storage']
            if isinstance(storage, dict):
                capacity = storage.get('total_capacity', 'N/A')
                print(f"   💿 Storage: {capacity}")

def main():
    print("🔍 PRODUCTION BASKET PARSER ANALYSIS")
    print("=" * 70)
    
    baskets = get_all_baskets()
    if not baskets:
        print("❌ No baskets found!")
        return
    
    print(f"📊 Found {len(baskets)} baskets total")
    
    # Analyze each basket
    vendors = defaultdict(list)
    total_models = 0
    
    for basket in baskets:
        basket_id = extract_basket_id(basket)
        vendor = basket.get('vendor', 'Unknown')
        file_name = basket.get('file_path', 'Unknown')
        
        models = get_models_for_basket(basket_id)
        model_count = len(models)
        total_models += model_count
        
        vendors[vendor].append({
            'basket_id': basket_id,
            'file_name': file_name,
            'model_count': model_count,
            'models': models
        })
        
        print(f"\n📁 {vendor} - {file_name}")
        print(f"   📦 Models: {model_count}")
        
        if models:
            # Field completion analysis
            stats = analyze_field_completion(models)
            print("   📈 Field Completion:")
            for field, percentage in sorted(stats.items(), key=lambda x: x[1], reverse=True):
                status = "✅" if percentage >= 80 else "⚠️" if percentage >= 50 else "❌"
                print(f"      {status} {field:15} {percentage:6.1f}%")
    
    print(f"\n🎯 OVERALL SUMMARY")
    print("=" * 70)
    print(f"📊 Total Models Parsed: {total_models}")
    
    for vendor, basket_list in vendors.items():
        vendor_total = sum(b['model_count'] for b in basket_list)
        print(f"   🏢 {vendor}: {vendor_total} models")
    
    # Show detailed analysis for the largest basket
    if vendors:
        largest_vendor = max(vendors.keys(), key=lambda v: sum(b['model_count'] for b in vendors[v]))
        largest_basket = max(vendors[largest_vendor], key=lambda b: b['model_count'])
        
        if largest_basket['models']:
            print(f"\n🔬 DETAILED ANALYSIS - {largest_vendor} ({largest_basket['model_count']} models)")
            print("=" * 70)
            show_model_samples(largest_basket['models'])
    
    # Overall recommendations
    print(f"\n💡 PARSING IMPROVEMENT RECOMMENDATIONS:")
    print("=" * 70)
    all_models = []
    for vendor_data in vendors.values():
        for basket_data in vendor_data:
            all_models.extend(basket_data['models'])
    
    if all_models:
        overall_stats = analyze_field_completion(all_models)
        low_completion = [(field, pct) for field, pct in overall_stats.items() if pct < 80]
        
        if low_completion:
            print("🎯 Focus on improving these fields:")
            for field, pct in sorted(low_completion, key=lambda x: x[1]):
                print(f"   ❌ {field}: {pct:.1f}% completion")
        else:
            print("✅ All major fields have >80% completion!")
        
        print(f"\n📈 Current parsing achieves {sum(overall_stats.values())/len(overall_stats):.1f}% average completion")

if __name__ == "__main__":
    main()
