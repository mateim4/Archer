#!/usr/bin/env python3
"""
Hardware Basket Population Script

Processes Dell and Lenovo Excel files and populates the backend database with hardware baskets.
"""

import requests
import json
import logging
from pathlib import Path
import pandas as pd
from typing import Dict, Any, List

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class HardwareBasketPopulator:
    def __init__(self, backend_url: str = "http://localhost:3005"):
        self.backend_url = backend_url
        self.headers = {"Content-Type": "application/json"}

    def test_backend_connection(self) -> bool:
        """Test if backend is accessible"""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200:
                logger.info("✅ Backend connection successful")
                return True
        except Exception as e:
            logger.error(f"❌ Backend connection failed: {e}")
        return False

    def create_hardware_basket(self, name: str, vendor: str, filename: str) -> str:
        """Create a hardware basket and return its ID"""
        try:
            basket_data = {
                "name": name,
                "vendor": vendor,
                "quarter": "Q3",
                "year": 2025,
                "filename": filename,
                "quotation_date": "2025-09-04T11:00:00Z",
                "total_models": 0,
                "total_configurations": 0
            }
            
            logger.info(f"Creating basket: {name}")
            response = requests.post(
                f"{self.backend_url}/hardware-baskets",
                json=basket_data,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                basket_id = result.get('id', result.get('basket_id', 'unknown'))
                logger.info(f"✅ Created basket: {basket_id}")
                return basket_id
            else:
                logger.error(f"❌ Failed to create basket: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error creating basket: {e}")
            return None

    def parse_excel_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse Excel file and extract hardware data"""
        try:
            logger.info(f"Parsing Excel file: {file_path}")
            
            # Read Excel file
            df = pd.read_excel(file_path, sheet_name=0)  # Read first sheet
            
            # Basic data extraction - adapt based on actual Excel structure
            items = []
            for index, row in df.iterrows():
                # Skip empty rows
                if row.isna().all():
                    continue
                    
                # Extract basic information (adapt column names as needed)
                item = {
                    "description": str(row.iloc[0]) if not pd.isna(row.iloc[0]) else "Unknown",
                    "part_number": str(row.iloc[1]) if len(row) > 1 and not pd.isna(row.iloc[1]) else "N/A",
                    "model_name": str(row.iloc[2]) if len(row) > 2 and not pd.isna(row.iloc[2]) else "Unknown Model",
                    "category": "Hardware Component",
                    "form_factor": "Server Component",
                    "specifications": {
                        "raw_data": row.to_dict()
                    }
                }
                items.append(item)
            
            logger.info(f"✅ Parsed {len(items)} items from {file_path}")
            return items
            
        except Exception as e:
            logger.error(f"❌ Error parsing Excel file {file_path}: {e}")
            return []

    def upload_hardware_items(self, basket_id: str, items: List[Dict[str, Any]], vendor: str) -> int:
        """Upload hardware items to a basket"""
        success_count = 0
        
        for i, item in enumerate(items):
            try:
                # Prepare item data
                hardware_model = {
                    "basket_id": basket_id,
                    "lot_description": item.get("description", ""),
                    "model_name": item.get("model_name", ""),
                    "model_number": item.get("part_number", ""),
                    "category": item.get("category", "Hardware"),
                    "form_factor": item.get("form_factor", "Component"),
                    "vendor": vendor,
                    "quotation_date": "2025-09-04T11:00:00Z",
                    "base_specifications": item.get("specifications", {})
                }
                
                response = requests.post(
                    f"{self.backend_url}/hardware-baskets/{basket_id}/models",
                    json=hardware_model,
                    headers=self.headers,
                    timeout=10
                )
                
                if response.status_code in [200, 201]:
                    success_count += 1
                    if (i + 1) % 10 == 0:
                        logger.info(f"Uploaded {i + 1}/{len(items)} items...")
                else:
                    logger.warning(f"Failed to upload item {i + 1}: {response.status_code}")
                    
            except Exception as e:
                logger.error(f"Error uploading item {i + 1}: {e}")
        
        logger.info(f"✅ Successfully uploaded {success_count}/{len(items)} items")
        return success_count

    def process_basket_file(self, file_path: str, vendor: str) -> bool:
        """Process a complete basket file"""
        filename = Path(file_path).name
        basket_name = f"{vendor} Hardware Basket Q3 2025"
        
        logger.info(f"🚀 Processing {vendor} basket: {filename}")
        
        # Create basket
        basket_id = self.create_hardware_basket(basket_name, vendor, filename)
        if not basket_id:
            return False
        
        # Parse Excel file
        items = self.parse_excel_file(file_path)
        if not items:
            logger.error("No items found in Excel file")
            return False
        
        # Upload items
        success_count = self.upload_hardware_items(basket_id, items, vendor)
        
        # Update basket totals
        try:
            update_data = {
                "total_models": len(set(item.get("model_name", "") for item in items)),
                "total_configurations": success_count
            }
            
            response = requests.put(
                f"{self.backend_url}/hardware-baskets/{basket_id}",
                json=update_data,
                headers=self.headers
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Updated basket totals: {update_data}")
            
        except Exception as e:
            logger.warning(f"Failed to update basket totals: {e}")
        
        return success_count > 0

def main():
    """Main execution"""
    print("="*80)
    print("🚀 HARDWARE BASKET POPULATION")
    print("="*80)
    
    populator = HardwareBasketPopulator()
    
    # Test backend connection
    if not populator.test_backend_connection():
        print("❌ Cannot connect to backend. Make sure it's running on localhost:3005")
        return 1
    
    # Define basket files
    baskets = [
        {
            "file": "/home/mateim/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Dell Only.xlsx",
            "vendor": "Dell"
        },
        {
            "file": "/home/mateim/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx", 
            "vendor": "Lenovo"
        }
    ]
    
    success_count = 0
    
    for basket in baskets:
        file_path = basket["file"]
        vendor = basket["vendor"]
        
        if not Path(file_path).exists():
            logger.error(f"❌ File not found: {file_path}")
            continue
        
        print(f"\n📊 Processing {vendor} basket...")
        
        if populator.process_basket_file(file_path, vendor):
            success_count += 1
            print(f"✅ {vendor} basket processed successfully")
        else:
            print(f"❌ Failed to process {vendor} basket")
    
    print("\n" + "="*80)
    print(f"🎉 POPULATION COMPLETE: {success_count}/{len(baskets)} baskets processed")
    print("="*80)
    
    if success_count > 0:
        print("\n💡 You can now view the hardware baskets in the frontend!")
        print("   Navigate to: http://localhost:1420/app/hardware-basket")
    
    return 0 if success_count == len(baskets) else 1

if __name__ == "__main__":
    exit(main())