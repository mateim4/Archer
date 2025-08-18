#!/usr/bin/env python3
"""
Quick Automated Basket Tester - Simplified version to test file uploads
"""

import requests
import json
import time
from pathlib import Path

def test_backend():
    """Simple backend test."""
    try:
        # Try to get baskets list as health check
        response = requests.get("http://localhost:3001/api/hardware-baskets", timeout=5)
        print(f"Backend response: {response.status_code}")
        return response.status_code in [200, 404]  # 404 is OK if no baskets exist
    except Exception as e:
        print(f"Backend test failed: {e}")
        return False

def upload_and_test_file(file_path):
    """Upload a file and test parsing."""
    print(f"\n🚀 Testing {file_path.name}...")
    
    try:
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            response = requests.post("http://localhost:3001/api/hardware-baskets/upload", files=files, timeout=60)
        
        print(f"Upload response: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            basket_id = result.get('basket_id')
            print(f"✅ Upload successful! Basket ID: {basket_id}")
            
            # Wait for processing
            print("⏳ Waiting for processing...")
            time.sleep(5)
            
            # Get data
            response = requests.get(f"http://localhost:3001/api/hardware-baskets/{basket_id}/models", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print(f"📊 Retrieved {len(data)} items")
                
                # Simple analysis
                if data:
                    with_prices = sum(1 for item in data if item.get('unit_price_usd', 0) > 0)
                    with_types = sum(1 for item in data if item.get('type'))
                    with_descriptions = sum(1 for item in data if item.get('description'))
                    
                    print(f"✅ Prices: {with_prices}/{len(data)} ({with_prices/len(data)*100:.1f}%)")
                    print(f"✅ Types: {with_types}/{len(data)} ({with_types/len(data)*100:.1f}%)")
                    print(f"✅ Descriptions: {with_descriptions}/{len(data)} ({with_descriptions/len(data)*100:.1f}%)")
                    
                    # Show sample items
                    print("\n📝 Sample items:")
                    for i, item in enumerate(data[:3], 1):
                        desc = item.get('description', 'N/A')[:60]
                        price = item.get('unit_price_usd', 0)
                        type_name = item.get('type', 'N/A')
                        print(f"  {i}. {desc}... | {type_name} | ${price:.2f}")
                
                return True
            else:
                print(f"❌ Failed to retrieve data: {response.status_code}")
        else:
            print(f"❌ Upload failed: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    
    return False

def main():
    print("🤖 QUICK AUTOMATED BASKET TESTING")
    print("=" * 50)
    
    # Test backend
    if not test_backend():
        print("❌ Backend is not responding!")
        return
    
    print("✅ Backend is responding")
    
    # Test files
    production_files = [
        Path("docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"),
        Path("docs/X86 Basket Q3 2025 v2 Dell Only.xlsx")
    ]
    
    for file_path in production_files:
        if file_path.exists():
            success = upload_and_test_file(file_path)
            if success:
                print(f"✅ {file_path.name} test completed")
            else:
                print(f"❌ {file_path.name} test failed")
        else:
            print(f"❌ File not found: {file_path}")

if __name__ == "__main__":
    main()
