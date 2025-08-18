#!/usr/bin/env python3
"""
Automated Basket Testing and Parsing Analysis
Uploads real production basket files and analyzes parsing results automatically.
"""

import requests
import json
import pandas as pd
import time
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np

class AutomatedBasketTester:
    def __init__(self, backend_url: str = "http://localhost:3001"):
        self.backend_url = backend_url
        self.test_results = []
        
    def check_backend_health(self) -> bool:
        """Check if the backend is running and responsive."""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            return response.status_code == 200
        except requests.RequestException:
            return False
    
    def upload_file(self, file_path: Path) -> Optional[str]:
        """Upload a file to the backend and return basket ID."""
        print(f"📤 Uploading {file_path.name}...")
        
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (file_path.name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                response = requests.post(f"{self.backend_url}/api/hardware-baskets/upload", files=files, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                basket_id = result.get('basket_id')
                print(f"✅ Upload successful! Basket ID: {basket_id}")
                return basket_id
            else:
                print(f"❌ Upload failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Upload error: {e}")
            return None
    
    def get_basket_data(self, basket_id: str) -> Optional[List[Dict]]:
        """Retrieve parsed basket data from backend."""
        try:
            response = requests.get(f"{self.backend_url}/api/hardware-baskets/{basket_id}/models", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ Failed to retrieve data: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ Data retrieval error: {e}")
            return None
    
    def analyze_field_completion(self, data: List[Dict]) -> Dict[str, float]:
        """Analyze field completion rates in the parsed data."""
        if not data:
            return {}
        
        field_stats = {}
        total_items = len(data)
        
        # Define important fields to check
        important_fields = [
            'description', 'type', 'part_number', 'unit_price_usd', 
            'manufacturer', 'specifications', 'category', 'sub_category',
            'cpu_cores', 'memory_gb', 'storage_gb', 'gpu_model'
        ]
        
        for field in important_fields:
            filled_count = 0
            for item in data:
                value = item.get(field)
                if value is not None and value != "" and str(value).strip() != "":
                    if isinstance(value, (int, float)) and not pd.isna(value):
                        filled_count += 1
                    elif isinstance(value, str) and value.strip().lower() not in ['n/a', 'null', 'none', '']:
                        filled_count += 1
            
            completion_rate = (filled_count / total_items) * 100 if total_items > 0 else 0
            field_stats[field] = completion_rate
        
        return field_stats
    
    def generate_detailed_report(self, file_name: str, data: List[Dict], field_stats: Dict[str, float]) -> str:
        """Generate a detailed analysis report."""
        report = []
        report.append(f"\n🔍 DETAILED ANALYSIS REPORT: {file_name}")
        report.append("=" * 60)
        report.append(f"📊 Total Items Parsed: {len(data)}")
        report.append(f"⏰ Test Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        report.append("\n📈 FIELD COMPLETION RATES:")
        for field, rate in sorted(field_stats.items(), key=lambda x: x[1], reverse=True):
            status = "✅" if rate >= 80 else "⚠️" if rate >= 50 else "❌"
            report.append(f"  {status} {field:20} {rate:6.1f}%")
        
        # Overall completion rate
        avg_completion = sum(field_stats.values()) / len(field_stats) if field_stats else 0
        report.append(f"\n🎯 OVERALL COMPLETION: {avg_completion:.1f}%")
        
        # Sample data analysis
        if data:
            report.append("\n📝 SAMPLE PARSED ITEMS:")
            for i, item in enumerate(data[:3], 1):
                report.append(f"\n  Sample {i}:")
                report.append(f"    Description: {item.get('description', 'N/A')[:60]}...")
                report.append(f"    Type: {item.get('type', 'N/A')}")
                report.append(f"    Price: ${item.get('unit_price_usd', 0):.2f}")
                report.append(f"    Manufacturer: {item.get('manufacturer', 'N/A')}")
        
        # Issues and improvements
        report.append("\n⚠️ ISSUES IDENTIFIED:")
        low_completion_fields = [field for field, rate in field_stats.items() if rate < 50]
        if low_completion_fields:
            report.append(f"  • Low completion fields: {', '.join(low_completion_fields)}")
        
        missing_prices = sum(1 for item in data if not item.get('unit_price_usd') or item.get('unit_price_usd') == 0)
        if missing_prices > 0:
            report.append(f"  • Missing prices: {missing_prices}/{len(data)} items ({missing_prices/len(data)*100:.1f}%)")
        
        missing_types = sum(1 for item in data if not item.get('type'))
        if missing_types > 0:
            report.append(f"  • Missing types: {missing_types}/{len(data)} items ({missing_types/len(data)*100:.1f}%)")
        
        return "\n".join(report)
    
    def test_file_upload_and_parsing(self, file_path: Path) -> Dict:
        """Test upload and parsing of a single file."""
        print(f"\n🚀 Testing {file_path.name}...")
        
        # Upload file
        basket_id = self.upload_file(file_path)
        if not basket_id:
            return {"success": False, "error": "Upload failed"}
        
        # Wait for processing
        print("⏳ Waiting for processing...")
        time.sleep(2)
        
        # Retrieve data
        data = self.get_basket_data(basket_id)
        if data is None:
            return {"success": False, "error": "Data retrieval failed"}
        
        # Analyze results
        field_stats = self.analyze_field_completion(data)
        report = self.generate_detailed_report(file_path.name, data, field_stats)
        
        print(report)
        
        return {
            "success": True,
            "file": file_path.name,
            "basket_id": basket_id,
            "total_items": len(data),
            "field_completion": field_stats,
            "avg_completion": sum(field_stats.values()) / len(field_stats) if field_stats else 0,
            "report": report,
            "data_sample": data[:5] if data else []
        }
    
    def run_automated_tests(self, iterations: int = 1) -> List[Dict]:
        """Run automated testing cycles on both production files."""
        print("🤖 STARTING AUTOMATED BASKET TESTING")
        print("=" * 50)
        
        # Check backend
        if not self.check_backend_health():
            print("❌ Backend is not running or not responsive!")
            print("Please start the backend with: ./start-rust-backend.sh")
            return []
        
        print("✅ Backend is running and healthy")
        
        # Production files to test
        production_files = [
            Path("docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"),
            Path("docs/X86 Basket Q3 2025 v2 Dell Only.xlsx")
        ]
        
        all_results = []
        
        for iteration in range(1, iterations + 1):
            print(f"\n🔄 ITERATION {iteration}/{iterations}")
            print("-" * 40)
            
            iteration_results = []
            
            for file_path in production_files:
                if file_path.exists():
                    result = self.test_file_upload_and_parsing(file_path)
                    result["iteration"] = iteration
                    iteration_results.append(result)
                    all_results.append(result)
                else:
                    print(f"❌ File not found: {file_path}")
            
            # Summary for this iteration
            if iteration_results:
                avg_completion = sum(r.get("avg_completion", 0) for r in iteration_results) / len(iteration_results)
                total_items = sum(r.get("total_items", 0) for r in iteration_results)
                print(f"\n📊 ITERATION {iteration} SUMMARY:")
                print(f"  📈 Average Field Completion: {avg_completion:.1f}%")
                print(f"  📦 Total Items Processed: {total_items}")
            
            if iteration < iterations:
                print(f"\n⏳ Waiting 5 seconds before next iteration...")
                time.sleep(5)
        
        # Final summary
        if all_results:
            self.print_final_summary(all_results)
            
        return all_results
    
    def print_final_summary(self, results: List[Dict]):
        """Print final testing summary."""
        print("\n" + "="*60)
        print("🏁 FINAL TESTING SUMMARY")
        print("="*60)
        
        successful_tests = [r for r in results if r.get("success")]
        
        if not successful_tests:
            print("❌ No successful tests completed!")
            return
        
        # Group by file
        by_file = {}
        for result in successful_tests:
            file_name = result.get("file", "unknown")
            if file_name not in by_file:
                by_file[file_name] = []
            by_file[file_name].append(result)
        
        for file_name, file_results in by_file.items():
            print(f"\n📁 {file_name}:")
            avg_completion = sum(r.get("avg_completion", 0) for r in file_results) / len(file_results)
            avg_items = sum(r.get("total_items", 0) for r in file_results) / len(file_results)
            print(f"  📊 Average Completion: {avg_completion:.1f}%")
            print(f"  📦 Average Items: {avg_items:.0f}")
            
            # Best performing fields
            if file_results[0].get("field_completion"):
                best_fields = sorted(
                    file_results[0]["field_completion"].items(), 
                    key=lambda x: x[1], 
                    reverse=True
                )[:3]
                print(f"  ✅ Best Fields: {', '.join([f'{field} ({rate:.0f}%)' for field, rate in best_fields])}")
        
        print(f"\n🎯 RECOMMENDATIONS:")
        print(f"  • Focus on improving low-completion fields")
        print(f"  • Enhance price extraction patterns")
        print(f"  • Improve component type classification")
        print(f"  • Add more specification parsing rules")

def main():
    """Main function to run automated testing."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Automated Basket Upload and Parsing Tester")
    parser.add_argument("--iterations", "-i", type=int, default=1, help="Number of test iterations")
    parser.add_argument("--backend-url", default="http://localhost:3001", help="Backend URL")
    parser.add_argument("--output", "-o", help="Output JSON file for results")
    
    args = parser.parse_args()
    
    tester = AutomatedBasketTester(backend_url=args.backend_url)
    results = tester.run_automated_tests(iterations=args.iterations)
    
    if args.output and results:
        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n💾 Results saved to {args.output}")
    
    return results

if __name__ == "__main__":
    main()
