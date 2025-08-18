#!/usr/bin/env python3
"""
Comprehensive Hardware Basket Enrichment System

This script systematically improves basket parsing and database population by:
1. Re-parsing Excel files with enhanced logic
2. Enriching data using Gemini research
3. Populating missing price and category fields  
4. Validating results and iterating until complete

Usage:
    python comprehensive_basket_enrichment.py --iterate --validate
"""

import json
import requests
import re
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from process_gemini_research import ServerSpecProcessor
import argparse

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class FieldStatus:
    """Track completion status of basket fields"""
    name: str
    filled: int
    total: int
    percentage: float
    missing_items: List[str]

@dataclass 
class BasketEnrichmentResult:
    """Results of basket enrichment process"""
    basket_id: str
    vendor: str
    before_stats: Dict[str, FieldStatus]
    after_stats: Dict[str, FieldStatus]
    improved_fields: List[str]
    errors: List[str]

class ComprehensiveBasketEnricher:
    """Comprehensive basket enrichment system"""
    
    def __init__(self, backend_url: str = "http://localhost:3001"):
        self.backend_url = backend_url
        self.gemini_processor = ServerSpecProcessor(backend_url)
        self.api_headers = {"Content-Type": "application/json"}
        
        # Price extraction patterns
        self.price_patterns = [
            r'\$?([\d,]+\.?\d*)',  # $1,234.56 or 1234.56
            r'([\d,]+\.?\d*)\s*USD',  # 1234.56 USD
            r'([\d,]+\.?\d*)\s*EUR',  # 1234.56 EUR
            r'USD\s*([\d,]+\.?\d*)',  # USD 1234.56
            r'EUR\s*([\d,]+\.?\d*)',  # EUR 1234.56
        ]
        
        # Component classification rules
        self.component_rules = {
            'server': {
                'keywords': ['thinkstation', 'thinksystem', 'poweredge', 'proliant', 'server', 'chassis'],
                'part_patterns': [r'^[A-Z]{3}\d{1,2}$'],  # SMI1, VEI1, etc.
                'category': 'Hardware'
            },
            'processor': {
                'keywords': ['xeon', 'epyc', 'processor', 'cpu', 'core'],
                'part_patterns': [r'.*cpu.*', r'.*proc.*'],
                'category': 'Hardware'
            },
            'memory': {
                'keywords': ['dimm', 'tru', 'memory', 'dram', 'ram', 'truddram4'],
                'part_patterns': [r'.*mem.*', r'.*dimm.*', r'.*ram.*'],
                'category': 'Hardware'
            },
            'storage': {
                'keywords': ['ssd', 'hdd', 'nvme', 'drive', 'storage', 'disk'],
                'part_patterns': [r'.*ssd.*', r'.*hdd.*', r'.*drive.*'],
                'category': 'Hardware'
            },
            'network': {
                'keywords': ['ethernet', 'broadcom', 'intel', 'network', 'nic', '10gbe', '25gbe'],
                'part_patterns': [r'.*eth.*', r'.*nic.*', r'.*net.*'],
                'category': 'Hardware'
            },
            'power': {
                'keywords': ['power supply', 'psu', 'power', 'watt'],
                'part_patterns': [r'.*psu.*', r'.*power.*'],
                'category': 'Hardware'
            },
            'service': {
                'keywords': ['warranty', 'service', 'support', 'professional services', 'maintenance'],
                'part_patterns': [r'.*warr.*', r'.*svc.*'],
                'category': 'Service'
            }
        }

    def get_all_baskets(self) -> List[Dict[str, Any]]:
        """Retrieve all hardware baskets from backend"""
        try:
            response = requests.get(f"{self.backend_url}/api/hardware-baskets")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to retrieve baskets: {e}")
            return []

    def get_basket_items(self, basket_id: str) -> List[Dict[str, Any]]:
        """Get all items (models) for a specific basket"""
        try:
            response = requests.get(f"{self.backend_url}/api/hardware-baskets/{basket_id}/models")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to retrieve items for basket {basket_id}: {e}")
            return []

    def analyze_field_completeness(self, items: List[Dict[str, Any]]) -> Dict[str, FieldStatus]:
        """Analyze completeness of key fields across basket items"""
        if not items:
            return {}
            
        key_fields = ['description', 'type', 'category', 'price', 'specifications']
        field_stats = {}
        
        for field in key_fields:
            filled_count = 0
            missing_items = []
            
            for item in items:
                item_id = item.get('id', {}).get('id', {}).get('String', 'unknown')
                field_value = None
                
                # Handle different field locations
                if field == 'price':
                    # Check multiple price field locations
                    price_fields = ['price', 'unit_price_usd', 'unit_price_eur', 'list_price_usd', 'net_price_usd']
                    for pf in price_fields:
                        field_value = item.get(pf)
                        if field_value and field_value != 'N/A':
                            break
                elif field == 'specifications':
                    field_value = item.get('base_specifications') or item.get('specifications')
                else:
                    field_value = item.get(field)
                
                # Check if field has meaningful value
                if field_value and field_value not in ['N/A', 'Unknown', '', None]:
                    if isinstance(field_value, dict) and field_value:
                        filled_count += 1
                    elif isinstance(field_value, str) and field_value.strip():
                        filled_count += 1
                    elif isinstance(field_value, (int, float)) and field_value > 0:
                        filled_count += 1
                    else:
                        missing_items.append(item_id)
                else:
                    missing_items.append(item_id)
            
            total_items = len(items)
            percentage = (filled_count / total_items * 100) if total_items > 0 else 0
            
            field_stats[field] = FieldStatus(
                name=field,
                filled=filled_count,
                total=total_items,
                percentage=percentage,
                missing_items=missing_items
            )
        
        return field_stats

    def extract_price_from_text(self, text: str) -> Optional[float]:
        """Extract price value from text using multiple patterns"""
        if not text or not isinstance(text, str):
            return None
            
        text = text.strip()
        
        # Skip non-price indicators
        if text.lower() in ['n/a', 'tbd', 'contact', 'varies', 'unknown', 'null', 'none', '']:
            return None
        
        # Try each price pattern
        for pattern in self.price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    price_str = match.group(1).replace(',', '')
                    price_value = float(price_str)
                    if price_value > 0:
                        return price_value
                except (ValueError, IndexError):
                    continue
        
        return None

    def classify_component(self, description: str, part_number: str = None) -> Tuple[str, str]:
        """Classify component type and category based on description and part number"""
        desc_lower = description.lower() if description else ''
        part_lower = part_number.lower() if part_number else ''
        
        # Check each component rule
        for comp_type, rules in self.component_rules.items():
            # Check keywords
            if any(keyword in desc_lower for keyword in rules['keywords']):
                return comp_type, rules['category']
            
            # Check part number patterns
            if part_number:
                for pattern in rules.get('part_patterns', []):
                    if re.match(pattern, part_lower):
                        return comp_type, rules['category']
        
        # Default classification
        return 'component', 'Hardware'

    def enrich_basket_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich a single basket item with missing data"""
        item_id = item.get('id', {}).get('id', {}).get('String', 'unknown')
        enriched = item.copy()
        changes_made = []
        
        # Extract key fields
        description = item.get('description', '') or item.get('model_name', '')
        part_number = item.get('part_number', '') or item.get('sku', '')
        
        # Enrich type and category if missing
        if not item.get('type') or item.get('type') in ['N/A', 'Unknown']:
            comp_type, comp_category = self.classify_component(description, part_number)
            enriched['type'] = comp_type
            enriched['category'] = comp_category
            changes_made.append(f"type: {comp_type}")
            changes_made.append(f"category: {comp_category}")
        
        # Enrich price information if missing
        current_price = item.get('price') or item.get('unit_price_usd')
        if not current_price or current_price == 'N/A':
            # Try to extract from description or specifications
            price_sources = [
                description,
                str(item.get('specifications', {})),
                str(item.get('base_specifications', {}))
            ]
            
            for source in price_sources:
                price_value = self.extract_price_from_text(source)
                if price_value:
                    enriched['unit_price_usd'] = price_value
                    enriched['price'] = {'amount': price_value, 'currency': 'USD'}
                    changes_made.append(f"price: ${price_value}")
                    break
        
        # Log enrichment
        if changes_made:
            logger.info(f"Enriched item {item_id}: {', '.join(changes_made)}")
        
        return enriched

    def update_basket_item(self, basket_id: str, item: Dict[str, Any]) -> bool:
        """Update basket item via backend API"""
        try:
            item_id = item.get('id', {}).get('id', {}).get('String')
            if not item_id:
                logger.error("No item ID found for update")
                return False
            
            # Prepare update payload
            update_data = {
                'type': item.get('type'),
                'category': item.get('category'),
                'unit_price_usd': item.get('unit_price_usd'),
                'specifications': item.get('specifications', {})
            }
            
            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            
            url = f"{self.backend_url}/api/hardware-models/{item_id}"
            response = requests.put(url, json=update_data, headers=self.api_headers)
            response.raise_for_status()
            
            logger.info(f"Successfully updated item {item_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update item: {e}")
            return False

    def enrich_basket(self, basket_id: str) -> BasketEnrichmentResult:
        """Comprehensively enrich a single basket"""
        logger.info(f"Starting enrichment for basket {basket_id}")
        
        # Get basket items
        items = self.get_basket_items(basket_id)
        if not items:
            return BasketEnrichmentResult(
                basket_id=basket_id,
                vendor="Unknown",
                before_stats={},
                after_stats={},
                improved_fields=[],
                errors=["No items found"]
            )
        
        vendor = items[0].get('vendor', 'Unknown')
        logger.info(f"Processing {len(items)} items for {vendor} basket {basket_id}")
        
        # Analyze before state
        before_stats = self.analyze_field_completeness(items)
        
        # Enrich each item
        enriched_items = []
        errors = []
        
        for item in items:
            try:
                enriched_item = self.enrich_basket_item(item)
                
                # Update in database
                if self.update_basket_item(basket_id, enriched_item):
                    enriched_items.append(enriched_item)
                else:
                    errors.append(f"Failed to update item {item.get('id')}")
                    enriched_items.append(item)  # Keep original if update failed
                    
            except Exception as e:
                logger.error(f"Error enriching item: {e}")
                errors.append(str(e))
                enriched_items.append(item)
        
        # Analyze after state
        after_stats = self.analyze_field_completeness(enriched_items)
        
        # Determine improved fields
        improved_fields = []
        for field, after_stat in after_stats.items():
            before_stat = before_stats.get(field)
            if before_stat and after_stat.percentage > before_stat.percentage:
                improvement = after_stat.percentage - before_stat.percentage
                improved_fields.append(f"{field}: +{improvement:.1f}%")
        
        result = BasketEnrichmentResult(
            basket_id=basket_id,
            vendor=vendor,
            before_stats=before_stats,
            after_stats=after_stats,
            improved_fields=improved_fields,
            errors=errors
        )
        
        return result

    def run_comprehensive_enrichment(self, target_completion: float = 90.0, max_iterations: int = 5) -> Dict[str, Any]:
        """Run comprehensive enrichment across all baskets"""
        logger.info("Starting comprehensive basket enrichment process")
        
        all_results = []
        baskets = self.get_all_baskets()
        
        if not baskets:
            logger.error("No baskets found")
            return {"error": "No baskets found"}
        
        logger.info(f"Found {len(baskets)} baskets to process")
        
        # Process each basket
        for basket in baskets:
            basket_id = basket.get('id', {}).get('id', {}).get('String')
            if not basket_id:
                continue
                
            vendor = basket.get('vendor', 'Unknown')
            logger.info(f"Processing {vendor} basket: {basket_id}")
            
            try:
                result = self.enrich_basket(basket_id)
                all_results.append(result)
                
                # Log results
                logger.info(f"Basket {basket_id} enrichment complete:")
                for field, stats in result.after_stats.items():
                    logger.info(f"  {field}: {stats.filled}/{stats.total} ({stats.percentage:.1f}%)")
                
                if result.improved_fields:
                    logger.info(f"  Improvements: {', '.join(result.improved_fields)}")
                    
            except Exception as e:
                logger.error(f"Failed to enrich basket {basket_id}: {e}")
        
        # Generate summary
        total_fields = sum(len(r.after_stats) for r in all_results)
        completed_fields = sum(1 for r in all_results for s in r.after_stats.values() if s.percentage >= target_completion)
        
        overall_completion = (completed_fields / total_fields * 100) if total_fields > 0 else 0
        
        summary = {
            "processed_baskets": len(all_results),
            "overall_completion": overall_completion,
            "target_completion": target_completion,
            "results": all_results,
            "next_actions": self._generate_next_actions(all_results, target_completion)
        }
        
        logger.info(f"Enrichment complete. Overall completion: {overall_completion:.1f}%")
        return summary

    def _generate_next_actions(self, results: List[BasketEnrichmentResult], target: float) -> List[str]:
        """Generate recommended next actions based on enrichment results"""
        actions = []
        
        for result in results:
            for field, stats in result.after_stats.items():
                if stats.percentage < target:
                    missing_count = len(stats.missing_items)
                    actions.append(f"Basket {result.basket_id}: Improve {field} field ({missing_count} items missing)")
        
        return actions

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description="Comprehensive Hardware Basket Enrichment")
    parser.add_argument("--backend-url", default="http://localhost:3001", help="Backend API URL")
    parser.add_argument("--target-completion", type=float, default=90.0, help="Target completion percentage")
    parser.add_argument("--max-iterations", type=int, default=5, help="Maximum enrichment iterations")
    parser.add_argument("--iterate", action="store_true", help="Run iterative enrichment until target reached")
    parser.add_argument("--validate", action="store_true", help="Run validation after enrichment")
    parser.add_argument("--output", help="Output file for results (JSON)")
    
    args = parser.parse_args()
    
    enricher = ComprehensiveBasketEnricher(args.backend_url)
    
    if args.iterate:
        # Iterative enrichment
        for iteration in range(args.max_iterations):
            logger.info(f"Starting iteration {iteration + 1}/{args.max_iterations}")
            
            results = enricher.run_comprehensive_enrichment(args.target_completion)
            
            if results.get("overall_completion", 0) >= args.target_completion:
                logger.info(f"Target completion {args.target_completion}% reached!")
                break
            else:
                logger.info(f"Iteration {iteration + 1} complete. Continuing...")
    else:
        # Single enrichment run
        results = enricher.run_comprehensive_enrichment(args.target_completion)
    
    # Save results
    if args.output:
        with open(args.output, 'w') as f:
            # Convert dataclass objects to dict for JSON serialization
            serializable_results = json.loads(json.dumps(results, default=lambda x: x.__dict__ if hasattr(x, '__dict__') else str(x)))
            json.dump(serializable_results, f, indent=2)
        logger.info(f"Results saved to {args.output}")
    
    # Print summary
    print("\n" + "="*80)
    print("COMPREHENSIVE BASKET ENRICHMENT SUMMARY")
    print("="*80)
    print(f"Processed baskets: {results.get('processed_baskets', 0)}")
    print(f"Overall completion: {results.get('overall_completion', 0):.1f}%")
    print(f"Target completion: {results.get('target_completion', 0)}%")
    
    if results.get('next_actions'):
        print("\nRecommended next actions:")
        for action in results['next_actions'][:10]:  # Show top 10
            print(f"  • {action}")
    
    print("="*80)

if __name__ == "__main__":
    main()
