#!/usr/bin/env python3
"""
Integrated Basket Enhancement Pipeline

This script combines direct Excel analysis with backend API integration to:
1. Parse basket files with enhanced data extraction
2. Upload enriched data to the backend database  
3. Validate improvements through API
4. Generate comprehensive reports

Usage:
    python3 integrated_basket_pipeline.py --file test_lenovo_x86_parts.xlsx --upload
"""

import json
import requests
import pandas as pd
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from direct_basket_analyzer import DirectBasketAnalyzer

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IntegratedBasketPipeline:
    """Integrated pipeline for basket analysis, enhancement, and database population"""
    
    def __init__(self, backend_url: str = "http://localhost:3001"):
        self.backend_url = backend_url
        self.analyzer = DirectBasketAnalyzer()
        self.api_headers = {"Content-Type": "application/json"}

    def upload_basket_file(self, file_path: str) -> Optional[str]:
        """Upload basket file to backend and get basket ID"""
        try:
            logger.info(f"Uploading basket file: {file_path}")
            
            with open(file_path, 'rb') as f:
                files = {'file': (Path(file_path).name, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
                
                response = requests.post(
                    f"{self.backend_url}/api/hardware-baskets/upload",
                    files=files,
                    timeout=30
                )
            
            if response.status_code == 200:
                result = response.json()
                basket_id = result.get('basket_id')
                logger.info(f"Successfully uploaded basket. ID: {basket_id}")
                return basket_id
            else:
                logger.error(f"Upload failed: HTTP {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error uploading basket file: {e}")
            return None

    def get_basket_models(self, basket_id: str) -> List[Dict[str, Any]]:
        """Get all models for a specific basket"""
        try:
            response = requests.get(f"{self.backend_url}/api/hardware-baskets/{basket_id}/models")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Error getting basket models: {e}")
            return []

    def update_model(self, model_id: str, enhanced_data: Dict[str, Any]) -> bool:
        """Update a specific model with enhanced data"""
        try:
            # Prepare update payload
            update_payload = {
                'type': enhanced_data.get('type'),
                'category': enhanced_data.get('category'),
                'unit_price_usd': enhanced_data.get('unit_price_usd'),
                'unit_price_eur': enhanced_data.get('unit_price_eur'),
                'specifications': enhanced_data.get('specifications', {})
            }
            
            # Remove None values
            update_payload = {k: v for k, v in update_payload.items() if v is not None}
            
            response = requests.put(
                f"{self.backend_url}/api/hardware-models/{model_id}",
                json=update_payload,
                headers=self.api_headers
            )
            
            if response.status_code == 200:
                logger.info(f"Successfully updated model {model_id}")
                return True
            else:
                logger.error(f"Failed to update model {model_id}: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Error updating model {model_id}: {e}")
            return False

    def process_basket_pipeline(self, file_path: str, upload: bool = True) -> Dict[str, Any]:
        """Complete pipeline: analyze, upload, enhance, validate"""
        
        logger.info("Starting integrated basket enhancement pipeline")
        
        # Step 1: Direct analysis of Excel file
        logger.info("Step 1: Analyzing Excel file with enhanced extraction")
        enhanced_items = self.analyzer.analyze_lenovo_parts_sheet(file_path)
        
        if not enhanced_items:
            return {"error": "No items extracted from Excel file"}
        
        pipeline_result = {
            "file_analyzed": Path(file_path).name,
            "items_extracted": len(enhanced_items),
            "analysis_results": enhanced_items,
            "upload_attempted": upload,
            "backend_integration": False,
            "models_updated": 0,
            "errors": []
        }
        
        if not upload:
            logger.info("Skipping backend integration (upload=False)")
            return pipeline_result
        
        # Step 2: Upload to backend
        logger.info("Step 2: Uploading basket file to backend")
        basket_id = self.upload_basket_file(file_path)
        
        if not basket_id:
            pipeline_result["errors"].append("Failed to upload basket file to backend")
            return pipeline_result
        
        pipeline_result["basket_id"] = basket_id
        pipeline_result["backend_integration"] = True
        
        # Step 3: Get backend models and match with enhanced data
        logger.info("Step 3: Retrieving backend models and matching with enhanced data")
        backend_models = self.get_basket_models(basket_id)
        
        if not backend_models:
            pipeline_result["errors"].append("No models found in backend after upload")
            return pipeline_result
        
        logger.info(f"Found {len(backend_models)} models in backend")
        
        # Step 4: Match and update models
        logger.info("Step 4: Matching and updating models with enhanced data")
        
        updated_count = 0
        for enhanced_item in enhanced_items:
            # Try to match by description or part number
            enhanced_desc = enhanced_item.get('description', '').lower()
            enhanced_part = enhanced_item.get('part_number', '').lower()
            
            matched_model = None
            for backend_model in backend_models:
                backend_desc = backend_model.get('description', '').lower()
                backend_part = backend_model.get('part_number', '').lower()
                
                # Match by part number first (most reliable)
                if enhanced_part and backend_part and enhanced_part == backend_part:
                    matched_model = backend_model
                    break
                
                # Match by description (partial match)
                if enhanced_desc and backend_desc and (
                    enhanced_desc in backend_desc or backend_desc in enhanced_desc
                ):
                    matched_model = backend_model
                    break
            
            if matched_model:
                model_id = matched_model.get('id', {}).get('id', {}).get('String')
                if model_id and self.update_model(model_id, enhanced_item):
                    updated_count += 1
            else:
                logger.warning(f"No match found for: {enhanced_desc[:50]}...")
        
        pipeline_result["models_updated"] = updated_count
        
        # Step 5: Validation
        logger.info("Step 5: Validating improvements")
        updated_models = self.get_basket_models(basket_id)
        
        if updated_models:
            # Calculate completion rates
            total_models = len(updated_models)
            price_filled = sum(1 for m in updated_models if m.get('unit_price_usd'))
            type_filled = sum(1 for m in updated_models if m.get('type') and m.get('type') != 'Unknown')
            
            pipeline_result["validation"] = {
                "total_models": total_models,
                "price_completion": f"{price_filled}/{total_models} ({price_filled/total_models*100:.1f}%)",
                "type_completion": f"{type_filled}/{total_models} ({type_filled/total_models*100:.1f}%)"
            }
        
        logger.info("Pipeline complete")
        return pipeline_result

    def generate_pipeline_report(self, result: Dict[str, Any]) -> str:
        """Generate comprehensive pipeline report"""
        
        report = "# Integrated Basket Enhancement Pipeline Report\n\n"
        report += f"Generated: {pd.Timestamp.now()}\n\n"
        
        # Summary
        report += "## Pipeline Summary\n\n"
        report += f"**File Processed:** {result.get('file_analyzed', 'N/A')}\n"
        report += f"**Items Extracted:** {result.get('items_extracted', 0)}\n"
        report += f"**Backend Integration:** {'✅' if result.get('backend_integration') else '❌'}\n"
        report += f"**Models Updated:** {result.get('models_updated', 0)}\n"
        
        # Validation results
        if result.get('validation'):
            validation = result['validation']
            report += f"\n## Validation Results\n\n"
            report += f"**Total Models:** {validation.get('total_models', 0)}\n"
            report += f"**Price Completion:** {validation.get('price_completion', 'N/A')}\n"
            report += f"**Type Completion:** {validation.get('type_completion', 'N/A')}\n"
        
        # Errors
        if result.get('errors'):
            report += f"\n## Errors Encountered\n\n"
            for error in result['errors']:
                report += f"- {error}\n"
        
        # Analysis sample
        analysis_results = result.get('analysis_results', [])
        if analysis_results:
            report += f"\n## Sample Enhanced Items\n\n"
            
            for i, item in enumerate(analysis_results[:5], 1):
                report += f"{i}. **{item.get('description', 'N/A')}**\n"
                report += f"   - Part: {item.get('part_number', 'N/A')}\n"
                report += f"   - Type: {item.get('type', 'N/A')}\n"
                report += f"   - Category: {item.get('category', 'N/A')}\n"
                if item.get('unit_price_usd'):
                    report += f"   - Price: ${item['unit_price_usd']:.2f} USD\n"
                report += "\n"
        
        return report

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description="Integrated Basket Enhancement Pipeline")
    parser.add_argument("--file", required=True, help="Path to basket Excel file")
    parser.add_argument("--backend-url", default="http://localhost:3001", help="Backend API URL")
    parser.add_argument("--upload", action="store_true", help="Upload to backend and update database")
    parser.add_argument("--output", help="Output file for results (JSON)")
    parser.add_argument("--report", help="Output file for report (Markdown)")
    
    args = parser.parse_args()
    
    if not Path(args.file).exists():
        print(f"Error: File {args.file} not found")
        return 1
    
    pipeline = IntegratedBasketPipeline(args.backend_url)
    
    # Run the complete pipeline
    result = pipeline.process_basket_pipeline(args.file, args.upload)
    
    # Save results
    if args.output:
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2, default=str)
        logger.info(f"Results saved to {args.output}")
    
    # Generate and save report
    report = pipeline.generate_pipeline_report(result)
    
    if args.report:
        with open(args.report, 'w') as f:
            f.write(report)
        logger.info(f"Report saved to {args.report}")
    
    # Print summary
    print("\n" + "="*80)
    print("INTEGRATED BASKET ENHANCEMENT PIPELINE COMPLETE")
    print("="*80)
    print(f"File: {result.get('file_analyzed')}")
    print(f"Items Processed: {result.get('items_extracted')}")
    print(f"Backend Integration: {'✅' if result.get('backend_integration') else '❌'}")
    print(f"Models Updated: {result.get('models_updated')}")
    
    if result.get('validation'):
        val = result['validation']
        print(f"Price Completion: {val.get('price_completion')}")
        print(f"Type Completion: {val.get('type_completion')}")
    
    if result.get('errors'):
        print("\nErrors:")
        for error in result['errors']:
            print(f"  ❌ {error}")
    
    print("="*80)
    
    return 0 if not result.get('errors') else 1

if __name__ == "__main__":
    exit(main())
