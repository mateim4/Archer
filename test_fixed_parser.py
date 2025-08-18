#!/usr/bin/env python3
"""
Test the fixed Lenovo parser after rebuilding the Rust core engine.
This script will:
1. Upload the Lenovo file using the fixed parser
2. Check the pricing completion rate
3. Compare with previous results
"""

import requests
import json
import os
from pathlib import Path

# Configuration
BACKEND_URL = "http://localhost:3001"
LENOVO_FILE = "/Users/mateimarcu/DevApps/LCMDesigner/Lenovo_14Gen_Servers.xlsx"

def upload_lenovo_file():
    """Upload Lenovo file and create a new basket with the fixed parser."""
    print("🔄 Uploading Lenovo file with fixed parser...")
    
    if not os.path.exists(LENOVO_FILE):
        print(f"❌ Error: Lenovo file not found at {LENOVO_FILE}")
        return None
    
    try:
        with open(LENOVO_FILE, 'rb') as f:
            files = {'file': (os.path.basename(LENOVO_FILE), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            data = {
                'vendor': 'Lenovo',
                'basket_name': f'Lenovo_14Gen_Fixed_Parser_Test'
            }
            
            response = requests.post(f"{BACKEND_URL}/api/baskets/upload", files=files, data=data)
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ Upload successful!")
            print(f"   Basket ID: {result.get('basket_id')}")
            print(f"   Parsed servers: {result.get('parsed_count', 'N/A')}")
            return result.get('basket_id')
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Upload failed: {e}")
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                print(f"   Error details: {error_detail}")
            except:
                print(f"   Response content: {e.response.text}")
        return None

def analyze_basket(basket_id):
    """Analyze the uploaded basket for pricing completion."""
    print(f"\n🔍 Analyzing basket {basket_id}...")
    
    try:
        # Get basket details
        response = requests.get(f"{BACKEND_URL}/api/baskets/{basket_id}")
        response.raise_for_status()
        basket_data = response.json()
        
        print(f"📊 Basket Analysis:")
        print(f"   Name: {basket_data.get('name', 'N/A')}")
        print(f"   Vendor: {basket_data.get('vendor', 'N/A')}")
        print(f"   Total models: {len(basket_data.get('models', []))}")
        
        # Analyze pricing data
        models = basket_data.get('models', [])
        total_models = len(models)
        models_with_pricing = 0
        models_without_pricing = 0
        
        pricing_issues = []
        
        for i, model in enumerate(models):
            price_usd = model.get('price_usd')
            model_name = model.get('model', f'Model_{i+1}')
            
            if price_usd is not None and price_usd > 0:
                models_with_pricing += 1
            else:
                models_without_pricing += 1
                pricing_issues.append({
                    'index': i + 1,
                    'model': model_name,
                    'part_number': model.get('part_number', 'N/A'),
                    'price_usd': price_usd
                })
        
        # Calculate completion rate
        completion_rate = (models_with_pricing / total_models * 100) if total_models > 0 else 0
        
        print(f"\n💰 Pricing Analysis:")
        print(f"   Models with pricing: {models_with_pricing}")
        print(f"   Models without pricing: {models_without_pricing}")
        print(f"   Pricing completion rate: {completion_rate:.1f}%")
        
        # Show success/failure status
        if completion_rate >= 90:
            print(f"✅ PARSER FIX SUCCESSFUL! Pricing completion rate: {completion_rate:.1f}%")
        elif completion_rate >= 70:
            print(f"🔶 PARTIAL SUCCESS: Pricing completion rate: {completion_rate:.1f}% (some improvement)")
        else:
            print(f"❌ PARSER ISSUE PERSISTS: Pricing completion rate: {completion_rate:.1f}%")
        
        # Show first few problematic models if any
        if pricing_issues and completion_rate < 90:
            print(f"\n⚠️  First few models without pricing:")
            for issue in pricing_issues[:5]:
                print(f"   #{issue['index']}: {issue['model']} (PN: {issue['part_number']}) - Price: {issue['price_usd']}")
            
            if len(pricing_issues) > 5:
                print(f"   ... and {len(pricing_issues) - 5} more")
        
        return {
            'total_models': total_models,
            'models_with_pricing': models_with_pricing,
            'models_without_pricing': models_without_pricing,
            'completion_rate': completion_rate,
            'success': completion_rate >= 90
        }
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Analysis failed: {e}")
        return None

def cleanup_old_baskets():
    """List all baskets for potential cleanup."""
    print(f"\n🧹 Listing all baskets for potential cleanup...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/api/baskets")
        response.raise_for_status()
        baskets = response.json()
        
        print(f"📋 Found {len(baskets)} baskets:")
        for basket in baskets:
            basket_id = basket.get('id', 'N/A')
            name = basket.get('name', 'N/A')
            vendor = basket.get('vendor', 'N/A')
            model_count = len(basket.get('models', []))
            print(f"   {basket_id}: {name} ({vendor}) - {model_count} models")
        
        return baskets
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to list baskets: {e}")
        return []

def main():
    print("🚀 Testing Fixed Lenovo Parser")
    print("=" * 50)
    
    # Upload Lenovo file with fixed parser
    basket_id = upload_lenovo_file()
    if not basket_id:
        print("❌ Upload failed, cannot continue testing")
        return
    
    # Analyze the results
    analysis_result = analyze_basket(basket_id)
    if not analysis_result:
        print("❌ Analysis failed")
        return
    
    # List other baskets for comparison
    cleanup_old_baskets()
    
    print(f"\n🎯 TEST SUMMARY:")
    print(f"   New basket ID: {basket_id}")
    print(f"   Total models: {analysis_result['total_models']}")
    print(f"   Pricing completion: {analysis_result['completion_rate']:.1f}%")
    print(f"   Parser fix successful: {'YES' if analysis_result['success'] else 'NO'}")
    
    if analysis_result['success']:
        print(f"\n✅ PARSER FIX VERIFIED! The Lenovo pricing issues have been resolved.")
        print(f"   Next steps:")
        print(f"   1. Clean up old problematic baskets")
        print(f"   2. Continue with iterative improvements pipeline")
    else:
        print(f"\n⚠️  Parser fix needs further investigation.")
        print(f"   Current completion rate: {analysis_result['completion_rate']:.1f}%")
        print(f"   Target completion rate: ≥90%")

if __name__ == "__main__":
    main()
