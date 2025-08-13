#!/usr/bin/env python3

import pandas as pd
import requests
import time

def test_schema_based_parsing():
    print("🧪 Testing Schema-Based Hardware Basket Parsing")
    print("=" * 60)
    
    # 1. Start with our synthetic test data
    print("\n📊 Testing with Synthetic Lenovo Data")
    print("-" * 40)
    
    # Test the current smart parsing first
    try:
        response = requests.post(
            "http://127.0.0.1:3001/api/hardware-baskets/upload",
            files={"file": open("test_lenovo_x86_parts.xlsx", "rb")},
            data={"vendor": "lenovo"},
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Upload successful!")
            print(f"📋 Response: {response.text[:200]}...")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"📋 Error: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    
    # 2. Analyze the test data structure
    print("\n🔍 Analyzing Test Data Structure")
    print("-" * 40)
    
    df = pd.read_excel("test_lenovo_x86_parts.xlsx")
    print(f"Total rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    
    # Group by potential server platforms
    platforms = set()
    cpus = []
    memory = []
    storage = []
    network = []
    other = []
    
    for _, row in df.iterrows():
        desc = row['Description'].lower()
        
        # Extract server platforms
        if 'sr630' in desc:
            platforms.add('SR630')
        if 'sr645' in desc:
            platforms.add('SR645')
        if 'sr650' in desc:
            platforms.add('SR650')
        if 'sr665' in desc:
            platforms.add('SR665')
            
        # Classify components
        if 'xeon' in desc or 'epyc' in desc:
            cpus.append(desc)
        elif 'rdimm' in desc or 'gb' in desc and 'trudd' in desc:
            memory.append(desc)
        elif 'ssd' in desc or 'hard drive' in desc or 'sata' in desc:
            storage.append(desc)
        elif 'ethernet' in desc or 'adapter' in desc or 'gbe' in desc:
            network.append(desc)
        else:
            other.append(desc)
    
    print(f"\n🏭 Server Platforms Found: {sorted(platforms)}")
    print(f"🔧 Component Classification:")
    print(f"   CPUs: {len(cpus)} items")
    print(f"   Memory: {len(memory)} items")
    print(f"   Storage: {len(storage)} items")
    print(f"   Network: {len(network)} items")
    print(f"   Other: {len(other)} items")
    
    # 3. Expected vs Actual Results
    print("\n📈 Expected Schema-Based Results")
    print("-" * 40)
    
    expected_servers = len(platforms) * len(cpus) if cpus else len(platforms)
    expected_components = len(memory) + len(storage) + len(network) + len(other)
    
    print(f"Expected server configurations: {expected_servers}")
    print(f"Expected upgrade components: {expected_components}")
    print(f"Server configurations should be: [Platform] + [CPU] combinations")
    print(f"Each server should include compatible components")
    
    # 4. Validation Schema
    print("\n✅ Schema Validation Checklist")
    print("-" * 40)
    print("□ Components correctly classified by type")
    print("□ Server platforms identified from descriptions")
    print("□ Server configurations created (not individual components)")
    print("□ Base configurations include CPU, Memory, Storage")
    print("□ Upgrade options separated from base configs")
    print("□ Pricing information preserved")
    print("□ Compatibility matrix populated")
    
    return {
        'total_components': len(df),
        'platforms': platforms,
        'expected_servers': expected_servers,
        'component_breakdown': {
            'cpus': len(cpus),
            'memory': len(memory),
            'storage': len(storage),
            'network': len(network),
            'other': len(other)
        }
    }

if __name__ == "__main__":
    results = test_schema_based_parsing()
    
    print(f"\n🎯 Test Summary")
    print("=" * 60)
    print(f"Total components processed: {results['total_components']}")
    print(f"Server platforms detected: {len(results['platforms'])}")
    print(f"Expected server configurations: {results['expected_servers']}")
    print(f"Component classification: {results['component_breakdown']}")
    
    print(f"\n🚀 Next Steps:")
    print("1. Implement schema-based backend endpoint")
    print("2. Test with real-world Dell data")
    print("3. Validate frontend integration")
    print("4. Performance testing with large datasets")
