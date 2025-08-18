#!/usr/bin/env python3
"""
Gemini Research Processing Validation Script
Demonstrates the complete pipeline functionality
"""

import json
import requests
import sys
from typing import Dict, Any

BACKEND_URL = "http://127.0.0.1:3001"
API_HEADERS = {
    "Content-Type": "application/json",
    "x-user-id": "admin"
}

def validate_backend_connection():
    """Test backend connectivity"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/hardware-baskets", headers=API_HEADERS)
        if response.status_code == 200:
            print("✅ Backend connection successful")
            return True
        else:
            print(f"❌ Backend returned status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def test_specification_update():
    """Test the new specification update endpoint"""
    test_spec = {
        "processor": {
            "socket_count": 2,
            "supported_families": ["Intel Xeon Scalable 5th Gen"],
            "max_cores_per_socket": 64,
            "tdp_range": "Up to 385W"
        },
        "memory": {
            "max_capacity": "8TB",
            "slots": 32,
            "types": ["DDR5 RDIMM", "DDR5 LRDIMM"],
            "speeds_supported": ["5600 MT/s"]
        },
        "storage": {
            "front_bays": {
                "count": 40,
                "size": "2.5\"",
                "interfaces": ["SAS", "SATA", "NVMe"]
            },
            "max_capacity": "2.2PB"
        },
        "network": {
            "expansion_slots": "Up to 12 PCIe slots",
            "management": "XClarity Controller"
        }
    }
    
    try:
        response = requests.put(
            f"{BACKEND_URL}/api/hardware-models/demo-model-123/specifications",
            headers=API_HEADERS,
            json=test_spec
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Specification update successful")
            print(f"   Model ID: {result.get('model_id')}")
            print(f"   Message: {result.get('message')}")
            return True
        else:
            print(f"❌ Specification update failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Specification update error: {e}")
        return False

def validate_gemini_data_format():
    """Validate the Gemini research data format"""
    try:
        with open('gemini_research_results.json', 'r') as f:
            data = json.load(f)
        
        # Check metadata
        if 'research_metadata' in data:
            metadata = data['research_metadata']
            print("✅ Research metadata found")
            print(f"   Confidence: {metadata.get('confidence_level')}")
            print(f"   Sources: {len(metadata.get('sources_consulted', []))}")
        
        # Check servers
        if 'servers' in data:
            servers = data['servers']
            print(f"✅ Server models found: {len(servers)}")
            
            # Validate structure of first server
            if servers:
                server = servers[0]
                required_fields = ['vendor', 'model_name', 'processor', 'memory', 'storage']
                missing_fields = [field for field in required_fields if field not in server]
                
                if not missing_fields:
                    print(f"✅ Server data structure valid")
                    print(f"   Sample: {server['vendor']} {server['model_name']}")
                else:
                    print(f"❌ Missing fields: {missing_fields}")
                    return False
        
        return True
        
    except FileNotFoundError:
        print("❌ Gemini research file not found")
        return False
    except Exception as e:
        print(f"❌ Data validation error: {e}")
        return False

def main():
    """Run complete validation"""
    print("🧪 Gemini Research Processing Validation")
    print("=" * 50)
    
    success_count = 0
    total_tests = 3
    
    # Test 1: Backend connectivity
    print("\n1. Testing backend connectivity...")
    if validate_backend_connection():
        success_count += 1
    
    # Test 2: Specification update endpoint
    print("\n2. Testing specification update endpoint...")
    if test_specification_update():
        success_count += 1
    
    # Test 3: Gemini data validation
    print("\n3. Validating Gemini research data...")
    if validate_gemini_data_format():
        success_count += 1
    
    # Summary
    print("\n" + "=" * 50)
    print(f"🎯 Validation Results: {success_count}/{total_tests} tests passed")
    
    if success_count == total_tests:
        print("🎉 All systems operational! Ready for production.")
        sys.exit(0)
    else:
        print("⚠️  Some issues detected. Please review and fix.")
        sys.exit(1)

if __name__ == "__main__":
    main()
