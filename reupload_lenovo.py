#!/usr/bin/env python3
"""
Re-upload Lenovo File with Corrected Processing
This uploads the Lenovo file as a new basket with improved parsing
"""

import subprocess
import json

def reupload_lenovo():
    print("🔄 Re-uploading Lenovo file to create a new corrected basket...")
    
    # Upload the Lenovo file as a new basket
    upload_result = subprocess.run([
        'curl', '-X', 'POST',
        'http://localhost:3001/api/hardware-baskets/upload',
        '-F', 'file=@docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx'
    ], capture_output=True, text=True)
    
    if upload_result.returncode == 0:
        print("✅ Lenovo file re-uploaded successfully")
        try:
            response = json.loads(upload_result.stdout)
            print(f"📊 Response: {response}")
            return True
        except:
            print(f"📊 Raw response: {upload_result.stdout}")
            return True
    else:
        print(f"❌ Upload failed: {upload_result.stderr}")
        return False

def verify_new_basket():
    print("🔍 Verifying new basket...")
    
    # Get all baskets
    result = subprocess.run([
        'curl', '-s', 'http://localhost:3001/api/hardware-baskets'
    ], capture_output=True, text=True)
    
    if result.returncode == 0:
        try:
            baskets = json.loads(result.stdout)
            print(f"📦 Total baskets: {len(baskets)}")
            
            for i, basket in enumerate(baskets):
                filename = basket.get('filename', 'Unknown')
                model_count = len(basket.get('models', []))
                print(f"  {i+1}. {filename}: {model_count} models")
                
                # Check pricing completion for each basket
                models = basket.get('models', [])
                models_with_pricing = sum(1 for m in models 
                                        if m.get('all_prices', {}).get('Total price in USD') != 'N/A')
                completion_rate = (models_with_pricing / model_count * 100) if model_count > 0 else 0
                print(f"      💰 Pricing completion: {models_with_pricing}/{model_count} ({completion_rate:.1f}%)")
                
            return True
        except Exception as e:
            print(f"❌ Error parsing response: {e}")
            return False
    else:
        print(f"❌ Failed to get baskets: {result.stderr}")
        return False

def main():
    print("🔧 Lenovo Basket Re-upload Tool")
    print("=" * 40)
    
    if reupload_lenovo():
        if verify_new_basket():
            print("\n🎉 SUCCESS!")
            print("✅ New Lenovo basket uploaded")
            print("✅ Check pricing completion rates above")
        else:
            print("\n⚠️ Upload succeeded but verification failed")
    else:
        print("\n❌ FAILED!")
        print("⚠️ Could not re-upload Lenovo basket")

if __name__ == "__main__":
    main()
