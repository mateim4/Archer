#!/usr/bin/env python3
"""
Corrected Lenovo Parser for Backend Integration
Fixes the server grouping and pricing issues
"""

import requests
import json
from pathlib import Path
from datetime import datetime
import pandas as pd
from colorama import init, Fore, Style

init(autoreset=True)

class CorrectedLenovoParser:
    def __init__(self):
        self.debug = True
        self.backend_url = "http://localhost:3001"
        
    def parse_lenovo_correctly(self, file_path):
        """Parse Lenovo file with correct server grouping logic"""
        try:
            df = pd.read_excel(file_path, sheet_name='Lenovo X86 Server Lots', header=None)
            
            # Find header row (row 3 based on our analysis)
            header_row = 3
            
            # Column mapping from our analysis
            part_col = 1      # Part Number
            desc_col = 2      # Description  
            qty_col = 3       # Quantity
            usd_price_col = 4 # Total price in USD
            eur_price_col = 5 # Total price in EUR
            
            print(f"{Fore.GREEN}📊 Processing Lenovo Server Lots with correct grouping...")
            
            corrected_models = []
            current_server = None
            
            # Process data starting from row 4 (after header)
            for idx in range(header_row + 1, df.shape[0]):
                row = df.iloc[idx].fillna('')
                
                part_number = str(row.iloc[part_col]).strip() if part_col < len(row) else ''
                description = str(row.iloc[desc_col]).strip() if desc_col < len(row) else ''
                
                # Skip empty rows
                if not part_number and not description:
                    continue
                
                # Check if this is a main server entry
                if self._is_main_server_entry(part_number, description, row, usd_price_col):
                    # Save previous server if exists
                    if current_server:
                        corrected_models.append(current_server)
                        
                    # Extract pricing
                    usd_price = self._safe_float(row.iloc[usd_price_col]) if usd_price_col < len(row) else None
                    eur_price = self._safe_float(row.iloc[eur_price_col]) if eur_price_col < len(row) else None
                    
                    # Create new server model
                    current_server = {
                        'id': f'lenovo_server_{len(corrected_models) + 1}',
                        'lot_description': description,
                        'model_name': self._extract_clean_model_name(description),
                        'model_number': part_number,
                        'category': 'Server',
                        'form_factor': self._extract_form_factor(description),
                        'vendor': 'Lenovo',
                        'processor_info': '',
                        'ram_info': '',
                        'network_info': '',
                        'price_5yr_psp': str(usd_price) if usd_price else '',
                        'all_prices': {
                            'Total price in USD': str(usd_price) if usd_price else 'N/A',
                            'Total price in EUR': str(eur_price) if eur_price else 'N/A'
                        },
                        'quotation_date': datetime.now().isoformat(),
                        'full_configurations': [],
                        'components_summary': {
                            'processor': [],
                            'memory': [],
                            'storage': [],
                            'network': [],
                            'other': []
                        }
                    }
                    
                    print(f"{Fore.GREEN}🖥️ Server: {current_server['model_name']} - ${usd_price}")
                    
                elif current_server and (part_number or description):
                    # This is a component/configuration item
                    config = {
                        'id': f"config_{current_server['id']}_{len(current_server['full_configurations'])}",
                        'item_type': self._classify_component_type(description),
                        'description': description,
                        'raw_data': {
                            'part_number': part_number,
                            'quantity': str(row.iloc[qty_col]) if qty_col < len(row) and row.iloc[qty_col] else '1',
                            'Total price in USD': 'N/A',  # Components don't have individual pricing
                            'Total price in EUR': 'N/A'
                        }
                    }
                    
                    current_server['full_configurations'].append(config)
                    
                    # Categorize components for easier analysis
                    component_type = config['item_type']
                    if component_type in current_server['components_summary']:
                        current_server['components_summary'][component_type].append(description)
                    else:
                        current_server['components_summary']['other'].append(description)
                    
                    # Extract specs for main model fields
                    if component_type == 'processor' and not current_server['processor_info']:
                        current_server['processor_info'] = description
                    elif component_type == 'memory' and not current_server['ram_info']:
                        current_server['ram_info'] = description
                    elif component_type == 'network' and not current_server['network_info']:
                        current_server['network_info'] = description
                        
                    if self.debug and len(current_server['full_configurations']) <= 5:
                        print(f"    {Fore.CYAN}├── {component_type}: {description[:60]}...")
                        
            # Add the last server
            if current_server:
                corrected_models.append(current_server)
                
            print(f"{Fore.GREEN}✅ Correctly parsed {len(corrected_models)} server models")
            return corrected_models
            
        except Exception as e:
            print(f"{Fore.RED}Error in corrected parsing: {e}")
            return []
    
    def _is_main_server_entry(self, part_number, description, row, price_col):
        """Determine if this is a main server entry (has pricing and server indicators)"""
        if not description:
            return False
            
        # Check for pricing data (main indicator)
        has_price = False
        if price_col < len(row):
            price_val = self._safe_float(row.iloc[price_col])
            has_price = price_val is not None and price_val > 0
        
        # Check for server model indicators in description
        desc_lower = description.lower()
        server_indicators = [
            'smi1', 'smi2', 'sma1', 'sma2', 'mei1', 'mei2', 'mea1', 'mea2',
            'hvi1', 'hvi2', 'hva1', 'hva2', 'vei1', 'vei2', 'vea1', 'vea2',
            'voi1', 'voi2', 'voa1', 'voa2', 'dhc1', 'dhc2'
        ]
        
        # Additional server patterns
        server_patterns = [
            'server', '- intel ', '- amd', 'rack server', 'lenovo', 'thinksystem', 'thinkagile'
        ]
        
        has_server_indicator = any(indicator in desc_lower for indicator in server_indicators)
        has_server_pattern = any(pattern in desc_lower for pattern in server_patterns)
        
        # Main server entry must have price AND server indicators
        return has_price and (has_server_indicator or has_server_pattern)
    
    def _safe_float(self, val):
        """Safely convert to float"""
        try:
            if val is None or val == '' or str(val).strip() == '':
                return None
            return float(val)
        except:
            return None
    
    def _extract_clean_model_name(self, description):
        """Extract clean model name"""
        if not description:
            return "Unknown Model"
            
        desc = description.strip()
        
        # Handle patterns like "SMI1 - Intel  - 1 Proc - Small Rack Server"
        if ' - ' in desc:
            parts = desc.split(' - ')
            if len(parts) >= 2:
                return f"{parts[0]} - {parts[1]}".strip()
        
        # Extract first meaningful part (up to first dash or first 40 chars)
        if ' - ' in desc:
            return desc.split(' - ')[0].strip()
        
        return desc[:40].strip()
    
    def _extract_form_factor(self, description):
        """Extract form factor from description"""
        desc_lower = description.lower()
        
        if 'rack server' in desc_lower or 'rack' in desc_lower:
            return 'Rack'
        elif 'blade' in desc_lower:
            return 'Blade'
        elif 'tower' in desc_lower:
            return 'Tower'
        else:
            return 'Rack'  # Default
    
    def _classify_component_type(self, description):
        """Classify component type"""
        if not description:
            return 'other'
            
        desc_lower = description.lower()
        
        if any(kw in desc_lower for kw in ['processor', 'cpu', 'intel', 'amd', 'xeon', 'epyc']):
            return 'processor'
        elif any(kw in desc_lower for kw in ['memory', 'ram', 'gb', 'dimm', 'truddr']):
            return 'memory'
        elif any(kw in desc_lower for kw in ['storage', 'disk', 'ssd', 'hdd', 'drive', 'raid', 'nvme']):
            return 'storage'
        elif any(kw in desc_lower for kw in ['network', 'ethernet', 'nic', 'adapter', 'broadcom']):
            return 'network'
        else:
            return 'other'
    
    def update_backend_data(self, models):
        """Update the backend with corrected Lenovo data"""
        try:
            print(f"\n{Fore.BLUE}🚀 Updating backend with corrected Lenovo data...")
            
            # First, get current baskets to find the Lenovo one
            response = requests.get(f"{self.backend_url}/api/hardware-baskets")
            if response.status_code != 200:
                print(f"{Fore.RED}Failed to get current baskets: {response.status_code}")
                return False
            
            baskets = response.json()
            lenovo_basket = None
            
            for basket in baskets:
                if 'Lenovo' in basket.get('filename', ''):
                    lenovo_basket = basket
                    break
            
            if not lenovo_basket:
                print(f"{Fore.RED}No Lenovo basket found in backend")
                return False
                
            print(f"{Fore.GREEN}Found Lenovo basket: {lenovo_basket['name']}")
            
            # Update the basket with corrected models
            lenovo_basket['models'] = models
            lenovo_basket['name'] = 'Lenovo Q3 2025 (Corrected)'
            lenovo_basket['vendor'] = 'Lenovo'
            
            # Send update to backend
            update_response = requests.put(
                f"{self.backend_url}/api/hardware-baskets/{lenovo_basket['id']}", 
                json=lenovo_basket
            )
            
            if update_response.status_code == 200:
                print(f"{Fore.GREEN}✅ Successfully updated Lenovo basket")
                return True
            else:
                print(f"{Fore.RED}Failed to update basket: {update_response.status_code}")
                return False
                
        except Exception as e:
            print(f"{Fore.RED}Error updating backend: {e}")
            return False
    
    def generate_comparison_report(self, models):
        """Generate a comparison report"""
        total_models = len(models)
        models_with_pricing = len([m for m in models if m['all_prices']['Total price in USD'] != 'N/A'])
        total_components = sum(len(m['full_configurations']) for m in models)
        
        # Component distribution
        component_types = {'processor': 0, 'memory': 0, 'storage': 0, 'network': 0, 'other': 0}
        for model in models:
            for comp_type, components in model['components_summary'].items():
                component_types[comp_type] += len(components)
        
        report = {
            'parsing_summary': {
                'total_models': total_models,
                'models_with_pricing': models_with_pricing,
                'pricing_completion_rate': f"{(models_with_pricing/total_models*100):.1f}%" if total_models > 0 else "0%",
                'total_components': total_components,
                'avg_components_per_model': f"{total_components/total_models:.1f}" if total_models > 0 else "0"
            },
            'component_distribution': component_types,
            'sample_models': models[:3] if len(models) >= 3 else models,
            'pricing_analysis': {
                'price_range_usd': self._analyze_price_range(models, 'Total price in USD'),
                'price_range_eur': self._analyze_price_range(models, 'Total price in EUR')
            }
        }
        
        return report
    
    def _analyze_price_range(self, models, price_key):
        """Analyze price ranges"""
        prices = []
        for model in models:
            price_str = model['all_prices'].get(price_key, 'N/A')
            if price_str != 'N/A':
                try:
                    prices.append(float(price_str))
                except:
                    pass
        
        if not prices:
            return {'min': 0, 'max': 0, 'avg': 0, 'count': 0}
        
        return {
            'min': min(prices),
            'max': max(prices),
            'avg': sum(prices) / len(prices),
            'count': len(prices)
        }

def main():
    """Main function"""
    file_path = "/Users/mateimarcu/DevApps/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(file_path).exists():
        print(f"{Fore.RED}File not found: {file_path}")
        return
    
    parser = CorrectedLenovoParser()
    
    # Parse with correct logic
    print(f"{Fore.BLUE}🔧 Applying corrected Lenovo parsing logic...")
    models = parser.parse_lenovo_correctly(file_path)
    
    if models:
        # Generate comparison report
        report = parser.generate_comparison_report(models)
        
        print(f"\n{Fore.GREEN}📊 Corrected Parsing Results:")
        print(f"  ✅ Total server models: {report['parsing_summary']['total_models']}")
        print(f"  💰 Models with pricing: {report['parsing_summary']['models_with_pricing']}")
        print(f"  📈 Pricing completion rate: {report['parsing_summary']['pricing_completion_rate']}")
        print(f"  🔧 Total components: {report['parsing_summary']['total_components']}")
        print(f"  📊 Avg components per model: {report['parsing_summary']['avg_components_per_model']}")
        
        print(f"\n{Fore.CYAN}🏷️ Component Distribution:")
        for comp_type, count in report['component_distribution'].items():
            print(f"  {comp_type.title()}: {count}")
        
        print(f"\n{Fore.YELLOW}💵 Price Analysis (USD):")
        price_analysis = report['pricing_analysis']['price_range_usd']
        print(f"  Range: ${price_analysis['min']:.0f} - ${price_analysis['max']:.0f}")
        print(f"  Average: ${price_analysis['avg']:.0f}")
        print(f"  Models with pricing: {price_analysis['count']}")
        
        # Show sample models
        print(f"\n{Fore.MAGENTA}📋 Sample Models:")
        for i, model in enumerate(report['sample_models'][:3]):
            print(f"  {i+1}. {model['model_name']}")
            print(f"     Part: {model['model_number']}")
            print(f"     Price: ${model['all_prices']['Total price in USD']}")
            print(f"     Components: {len(model['full_configurations'])}")
        
        # Save results
        output_file = "/Users/mateimarcu/DevApps/LCMDesigner/corrected_lenovo_results.json"
        with open(output_file, 'w') as f:
            json.dump({
                'corrected_models': models,
                'analysis_report': report,
                'timestamp': datetime.now().isoformat()
            }, f, indent=2)
        
        print(f"\n{Fore.GREEN}💾 Results saved to: {output_file}")
        
        # Update backend if possible
        if parser.update_backend_data(models):
            print(f"{Fore.GREEN}🎉 Backend successfully updated with corrected data!")
        else:
            print(f"{Fore.YELLOW}⚠️ Backend update failed, but parsing was successful")
    
    else:
        print(f"{Fore.RED}❌ No models were parsed")

if __name__ == "__main__":
    main()
