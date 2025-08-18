#!/usr/bin/env python3

import requests
import json
import sys
from pathlib import Path

def analyze_field_completion(models):
    """Analyze field completion rates for a list of models"""
    if not models:
        return {}
    
    total_models = len(models)
    completion_stats = {
        'total_models': total_models,
        'form_factor': 0,
        'processor_model': 0,
        'processor_cores': 0,
        'processor_threads': 0,
        'processor_frequency': 0,
        'memory_total': 0,
        'memory_type': 0,
        'storage_total': 0,
        'network_ports': 0,
        'overall_fields_filled': 0,
        'sample_models': []
    }
    
    total_fields_possible = total_models * 9  # 9 key fields we track
    total_fields_filled = 0
    
    for i, model in enumerate(models):
        specs = model.get('base_specifications', {})
        fields_filled = 0
        
        # Form factor
        if model.get('form_factor'):
            completion_stats['form_factor'] += 1
            fields_filled += 1
        
        # Processor fields
        proc = specs.get('processor', {})
        if proc and proc.get('model'):
            completion_stats['processor_model'] += 1
            fields_filled += 1
        if proc and proc.get('core_count'):
            completion_stats['processor_cores'] += 1
            fields_filled += 1
        if proc and proc.get('thread_count'):
            completion_stats['processor_threads'] += 1
            fields_filled += 1
        if proc and proc.get('frequency_ghz'):
            completion_stats['processor_frequency'] += 1
            fields_filled += 1
            
        # Memory fields
        mem = specs.get('memory', {})
        if mem and mem.get('total_capacity'):
            completion_stats['memory_total'] += 1
            fields_filled += 1
        if mem and mem.get('type'):
            completion_stats['memory_type'] += 1
            fields_filled += 1
            
        # Storage
        storage = specs.get('storage', {})
        if storage and storage.get('total_capacity'):
            completion_stats['storage_total'] += 1
            fields_filled += 1
            
        # Network
        network = specs.get('network', {})
        if network and network.get('ports'):
            completion_stats['network_ports'] += 1
            fields_filled += 1
            
        total_fields_filled += fields_filled
        
        # Store sample models
        if i < 3:
            completion_stats['sample_models'].append({
                'model_name': model.get('model_name', ''),
                'form_factor': model.get('form_factor'),
                'fields_filled': fields_filled,
                'specs': specs
            })
    
    # Calculate percentages
    for field in ['form_factor', 'processor_model', 'processor_cores', 'processor_threads', 
                  'processor_frequency', 'memory_total', 'memory_type', 'storage_total', 'network_ports']:
        completion_stats[f'{field}_percent'] = (completion_stats[field] / total_models) * 100 if total_models > 0 else 0
    
    completion_stats['overall_completion_percent'] = (total_fields_filled / total_fields_possible) * 100 if total_fields_possible > 0 else 0
    
    return completion_stats

def test_file_upload(file_path, server_url="http://127.0.0.1:3002"):
    """Upload a file and return the parsed models"""
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return None
        
    print(f"📤 Testing parsing: {file_path.name}")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post(f"{server_url}/api/hardware-baskets/upload", files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('models', [])
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            return None
            
    except requests.RequestException as e:
        print(f"❌ Request failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def main():
    print("🧪 Testing Enhanced Parser - Direct Analysis")
    print("=" * 60)
    
    # Test files
    lenovo_file = "docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    dell_file = "docs/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    
    # Test Lenovo parsing
    print("\n📊 LENOVO FILE ANALYSIS")
    print("-" * 40)
    lenovo_models = test_file_upload(lenovo_file)
    
    if lenovo_models:
        lenovo_stats = analyze_field_completion(lenovo_models)
        print(f"✅ Parsed {lenovo_stats['total_models']} Lenovo models")
        print(f"📈 Overall completion: {lenovo_stats['overall_completion_percent']:.1f}%")
        print(f"🏗️  Form factor: {lenovo_stats['form_factor_percent']:.1f}%")
        print(f"⚙️  Processor model: {lenovo_stats['processor_model_percent']:.1f}%")
        print(f"🧮 Processor cores: {lenovo_stats['processor_cores_percent']:.1f}%")
        print(f"🧠 Memory total: {lenovo_stats['memory_total_percent']:.1f}%")
        print(f"💾 Storage total: {lenovo_stats['storage_total_percent']:.1f}%")
        print(f"🌐 Network ports: {lenovo_stats['network_ports_percent']:.1f}%")
        
        print("\n📋 Sample Lenovo Models:")
        for sample in lenovo_stats['sample_models']:
            print(f"  • {sample['model_name']}")
            print(f"    Form Factor: {sample['form_factor']}")
            print(f"    Fields Filled: {sample['fields_filled']}/9")
            if sample['specs'].get('processor'):
                proc = sample['specs']['processor']
                print(f"    Processor: {proc.get('model', 'N/A')} ({proc.get('core_count', 'N/A')}C/{proc.get('thread_count', 'N/A')}T)")
    else:
        print("❌ Failed to parse Lenovo file")
    
    # Test Dell parsing
    print("\n📊 DELL FILE ANALYSIS")
    print("-" * 40)
    dell_models = test_file_upload(dell_file)
    
    if dell_models:
        dell_stats = analyze_field_completion(dell_models)
        print(f"✅ Parsed {dell_stats['total_models']} Dell models")
        print(f"📈 Overall completion: {dell_stats['overall_completion_percent']:.1f}%")
        print(f"🏗️  Form factor: {dell_stats['form_factor_percent']:.1f}%")
        print(f"⚙️  Processor model: {dell_stats['processor_model_percent']:.1f}%")
        print(f"🧮 Processor cores: {dell_stats['processor_cores_percent']:.1f}%")
        print(f"🧠 Memory total: {dell_stats['memory_total_percent']:.1f}%")
        print(f"💾 Storage total: {dell_stats['storage_total_percent']:.1f}%")
        print(f"🌐 Network ports: {dell_stats['network_ports_percent']:.1f}%")
        
        print("\n📋 Sample Dell Models:")
        for sample in dell_stats['sample_models']:
            print(f"  • {sample['model_name']}")
            print(f"    Form Factor: {sample['form_factor']}")
            print(f"    Fields Filled: {sample['fields_filled']}/9")
    else:
        print("❌ Failed to parse Dell file")
    
    # Comparison
    if lenovo_models and dell_models:
        print("\n📊 COMPARISON SUMMARY")
        print("=" * 40)
        print(f"Lenovo: {lenovo_stats['overall_completion_percent']:.1f}% completion")
        print(f"Dell:   {dell_stats['overall_completion_percent']:.1f}% completion")
        
        improvement = lenovo_stats['overall_completion_percent']
        if improvement > 70:
            print(f"🎉 SUCCESS! Lenovo parsing significantly improved to {improvement:.1f}%")
        elif improvement > 50:
            print(f"📈 GOOD! Lenovo parsing improved to {improvement:.1f}%")
        else:
            print(f"⚠️  Still needs work: Lenovo parsing at {improvement:.1f}%")

if __name__ == "__main__":
    main()
