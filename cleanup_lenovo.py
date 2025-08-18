#!/usr/bin/env python3
"""
Targeted Lenovo Fix - Remove N/A pricing models and improve the good ones
"""

import json
import subprocess

def fix_lenovo_models():
    print("🔍 Getting current Lenovo basket data...")
    
    # Get current basket data
    result = subprocess.run([
        'curl', '-s', 'http://localhost:3001/api/hardware-baskets'
    ], capture_output=True, text=True)
    
    if result.returncode != 0:
        print("❌ Failed to get basket data")
        return False
    
    try:
        baskets = json.loads(result.stdout)
        lenovo_basket = baskets[0]  # First basket is Lenovo (42 models)
        
        print(f"📊 Current Lenovo basket: {lenovo_basket.get('name', 'Unknown')}")
        print(f"📦 Total models: {len(lenovo_basket['models'])}")
        
        # Analyze current models
        good_models = []
        bad_models = []
        
        for model in lenovo_basket['models']:
            usd_price = model.get('all_prices', {}).get('Total price in USD', 'N/A')
            if usd_price != 'N/A' and usd_price.replace('.', '').isdigit():
                good_models.append(model)
            else:
                bad_models.append(model)
        
        print(f"✅ Models with proper pricing: {len(good_models)}")
        print(f"❌ Models with N/A pricing: {len(bad_models)}")
        
        if len(good_models) == 0:
            print("⚠️ No good models found, cannot proceed")
            return False
        
        # Improve the good models with better names and descriptions
        print("🔧 Improving model data...")
        
        for i, model in enumerate(good_models):
            # Get the first configuration to understand what this model is
            configs = model.get('full_configurations', [])
            if configs:
                first_config = configs[0]
                part_number = first_config.get('raw_data', {}).get('Quantity', '')
                
                # Try to derive a better name from the part number or configurations
                if part_number:
                    if part_number.startswith('7D73'):
                        model['model_name'] = f'ThinkSystem SR630 V3 Config {i+1}'
                        model['form_factor'] = 'Rack'
                        model['processor_info'] = 'Intel Xeon Silver/Gold'
                    elif part_number.startswith('7D9C'):
                        model['model_name'] = f'ThinkSystem SR645 V3 Config {i+1}'  
                        model['form_factor'] = 'Rack'
                        model['processor_info'] = 'AMD EPYC'
                    elif part_number.startswith('7D76'):
                        model['model_name'] = f'ThinkSystem SR650 V3 Config {i+1}'
                        model['form_factor'] = 'Rack'
                        model['processor_info'] = 'Intel Xeon Platinum'
                    elif part_number.startswith('7D9A'):
                        model['model_name'] = f'ThinkSystem SR665 V3 Config {i+1}'
                        model['form_factor'] = 'Rack'
                        model['processor_info'] = 'AMD EPYC'
                    elif part_number.startswith('7D6W'):
                        model['model_name'] = f'ThinkAgile VX V3 vSAN Config {i+1}'
                        model['form_factor'] = 'Rack'
                        model['processor_info'] = 'Intel/AMD Configured'
                    else:
                        model['model_name'] = f'Lenovo Server Config {i+1}'
                
                # Extract component information from configurations
                processors = []
                memory = []
                storage = []
                network = []
                
                for config in configs:
                    desc = config.get('description', '').lower()
                    if any(kw in desc for kw in ['processor', 'intel', 'amd', 'xeon', 'epyc']):
                        processors.append(config['description'])
                    elif any(kw in desc for kw in ['memory', 'gb', 'truddr']):
                        memory.append(config['description'])
                    elif any(kw in desc for kw in ['storage', 'ssd', 'disk', 'raid']):
                        storage.append(config['description'])
                    elif any(kw in desc for kw in ['network', 'ethernet', 'broadcom']):
                        network.append(config['description'])
                
                # Update component info
                if processors:
                    model['processor_info'] = processors[0]
                if memory:
                    model['ram_info'] = memory[0]
                if network:
                    model['network_info'] = network[0]
            
            # Ensure vendor is set correctly
            model['vendor'] = 'Lenovo'
            model['category'] = 'Server'
            if not model.get('form_factor'):
                model['form_factor'] = 'Rack'
        
        # Update the basket with only the good models
        lenovo_basket['models'] = good_models
        lenovo_basket['name'] = 'Lenovo Q3 2025 (Cleaned)'
        lenovo_basket['vendor'] = 'Lenovo'
        
        print(f"🎯 Final model count: {len(good_models)}")
        
        # Save the updated basket to a file
        with open('/tmp/updated_lenovo_basket.json', 'w') as f:
            json.dump(lenovo_basket, f, indent=2)
        
        # Update the backend using curl
        print("🚀 Updating backend...")
        update_result = subprocess.run([
            'curl', '-s', '-X', 'PUT',
            f"http://localhost:3001/api/hardware-baskets/{lenovo_basket['id']}",
            '-H', 'Content-Type: application/json',
            '-d', f'@/tmp/updated_lenovo_basket.json'
        ], capture_output=True, text=True)
        
        if update_result.returncode == 0:
            print("✅ Successfully updated Lenovo basket!")
            
            # Verify the update
            print("🔍 Verifying update...")
            verify_result = subprocess.run([
                'curl', '-s', 'http://localhost:3001/api/hardware-baskets'
            ], capture_output=True, text=True)
            
            if verify_result.returncode == 0:
                updated_baskets = json.loads(verify_result.stdout)
                updated_lenovo = updated_baskets[0] if updated_baskets else None
                
                if updated_lenovo:
                    models_count = len(updated_lenovo['models'])
                    na_count = sum(1 for m in updated_lenovo['models'] 
                                 if m.get('all_prices', {}).get('Total price in USD') == 'N/A')
                    
                    print(f"📊 Updated basket: {models_count} models")
                    print(f"💰 Models with N/A pricing: {na_count}")
                    print(f"✅ Success rate: {((models_count - na_count) / models_count * 100):.1f}%")
                    
                    return na_count == 0
            
            return True
        else:
            print(f"❌ Failed to update backend: {update_result.stderr}")
            return False
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🔧 Lenovo Model Cleanup Tool")
    print("=" * 40)
    
    if fix_lenovo_models():
        print("\n🎉 SUCCESS!")
        print("✅ Lenovo basket has been cleaned up")
        print("✅ All remaining models have proper pricing")
        print("✅ Model names and descriptions improved")
    else:
        print("\n❌ FAILED!")
        print("⚠️ Could not clean up Lenovo basket")

if __name__ == "__main__":
    main()
