#!/usr/bin/env python3
"""
Backend Data Population Script

Populates the backend database with enhanced basket data
"""

import json
import requests
import logging
from typing import Dict, List, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class BackendPopulator:
    def __init__(self, backend_url: str = "http://localhost:3001"):
        self.backend_url = backend_url
        self.headers = {"Content-Type": "application/json"}

    def create_hardware_model(self, basket_id: str, item_data: Dict[str, Any]) -> bool:
        """Create a hardware model in the backend"""
        try:
            # Prepare model data for backend API
            model_payload = {
                "basket_id": basket_id,
                "vendor": item_data.get("vendor", "Lenovo"),
                "part_number": item_data.get("part_number", ""),
                "description": item_data.get("description", ""),
                "model_name": item_data.get("description", "").split(" - ")[0] if " - " in item_data.get("description", "") else item_data.get("description", ""),
                "type": item_data.get("type", "component"),
                "category": item_data.get("category", "Hardware"),
                "unit_price_usd": item_data.get("unit_price_usd"),
                "unit_price_eur": item_data.get("unit_price_eur"),
                "specifications": item_data.get("specifications", {}),
                "source_file": item_data.get("source_file", ""),
                "enhanced": item_data.get("enhanced", True)
            }
            
            response = requests.post(
                f"{self.backend_url}/api/hardware-models",
                json=model_payload,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"✅ Created model: {item_data.get('description', 'N/A')[:50]}...")
                return True
            else:
                logger.error(f"❌ Failed to create model: HTTP {response.status_code} - {response.text[:100]}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error creating model: {e}")
            return False

    def populate_basket(self, basket_id: str, enhanced_data_file: str) -> Dict[str, Any]:
        """Populate basket with enhanced data"""
        logger.info(f"🚀 Starting backend population for basket: {basket_id}")
        
        # Load enhanced data
        try:
            with open(enhanced_data_file, 'r') as f:
                enhanced_items = json.load(f)
        except Exception as e:
            return {"error": f"Failed to load enhanced data: {e}"}
        
        logger.info(f"📊 Loaded {len(enhanced_items)} enhanced items")
        
        # Process each item
        results = {
            "total_items": len(enhanced_items),
            "successful": 0,
            "failed": 0,
            "errors": []
        }
        
        for i, item in enumerate(enhanced_items, 1):
            logger.info(f"Processing item {i}/{len(enhanced_items)}: {item.get('description', 'N/A')[:30]}...")
            
            if self.create_hardware_model(basket_id, item):
                results["successful"] += 1
            else:
                results["failed"] += 1
                results["errors"].append(f"Failed to create: {item.get('description', 'N/A')[:50]}")
        
        logger.info(f"🎉 Population complete: {results['successful']}/{results['total_items']} successful")
        return results

    def validate_population(self, basket_id: str) -> Dict[str, Any]:
        """Validate the populated data"""
        try:
            response = requests.get(f"{self.backend_url}/api/hardware-baskets/{basket_id}/models")
            response.raise_for_status()
            models = response.json()
            
            validation_results = {
                "total_models": len(models),
                "with_prices": sum(1 for m in models if m.get("unit_price_usd")),
                "with_types": sum(1 for m in models if m.get("type") and m.get("type") != "Unknown"),
                "with_categories": sum(1 for m in models if m.get("category") and m.get("category") != "Unknown"),
                "completion_rates": {}
            }
            
            if validation_results["total_models"] > 0:
                total = validation_results["total_models"]
                validation_results["completion_rates"] = {
                    "prices": f"{validation_results['with_prices']}/{total} ({validation_results['with_prices']/total*100:.1f}%)",
                    "types": f"{validation_results['with_types']}/{total} ({validation_results['with_types']/total*100:.1f}%)",
                    "categories": f"{validation_results['with_categories']}/{total} ({validation_results['with_categories']/total*100:.1f}%)"
                }
            
            return validation_results
            
        except Exception as e:
            return {"error": f"Validation failed: {e}"}

def main():
    """Main execution"""
    # Configuration
    BASKET_ID = "16wm6dfgnqwiosdq4iio"  # From our earlier API call
    ENHANCED_DATA_FILE = "enhanced_lenovo_data.json"
    
    populator = BackendPopulator()
    
    print("="*80)
    print("🚀 BACKEND DATA POPULATION")
    print("="*80)
    print(f"Basket ID: {BASKET_ID}")
    print(f"Data File: {ENHANCED_DATA_FILE}")
    print()
    
    # Populate the basket
    results = populator.populate_basket(BASKET_ID, ENHANCED_DATA_FILE)
    
    if "error" in results:
        print(f"❌ Population failed: {results['error']}")
        return 1
    
    print("📊 Population Results:")
    print(f"   Total items: {results['total_items']}")
    print(f"   Successful: {results['successful']}")
    print(f"   Failed: {results['failed']}")
    
    if results["errors"]:
        print("\n❌ Errors:")
        for error in results["errors"][:5]:  # Show first 5 errors
            print(f"   - {error}")
    
    # Validate the results
    print("\n🔍 Validating populated data...")
    validation = populator.validate_population(BASKET_ID)
    
    if "error" in validation:
        print(f"❌ Validation failed: {validation['error']}")
    else:
        print("✅ Validation Results:")
        print(f"   Total models: {validation['total_models']}")
        print(f"   Price completion: {validation['completion_rates'].get('prices', 'N/A')}")
        print(f"   Type completion: {validation['completion_rates'].get('types', 'N/A')}")
        print(f"   Category completion: {validation['completion_rates'].get('categories', 'N/A')}")
    
    print("\n" + "="*80)
    print("🎉 BACKEND POPULATION COMPLETE")
    print("="*80)
    
    return 0 if results["failed"] == 0 else 1

if __name__ == "__main__":
    exit(main())
