#!/usr/bin/env python3
"""
Enhanced Lenovo Hardware Basket Parser
Addresses parsing issues by implementing improved logic for Lenovo Excel format
"""

import pandas as pd
import json
import numpy as np
import re
from pathlib import Path
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

class EnhancedLenovoParser:
    def __init__(self):
        self.debug = True
        
    def analyze_lenovo_structure(self, file_path):
        """Analyze Lenovo file structure to understand data organization"""
        try:
            excel_file = pd.ExcelFile(file_path)
            analysis = {
                'file_path': file_path,
                'sheets': {},
                'data_issues': []
            }
            
            for sheet_name in excel_file.sheet_names:
                if 'Lenovo X86 Server Lots' in sheet_name or 'Lenovo X86 Parts' in sheet_name:
                    df = pd.read_excel(file_path, sheet_name=sheet_name, header=None)
                    sheet_analysis = self._analyze_sheet_structure(df, sheet_name)
                    analysis['sheets'][sheet_name] = sheet_analysis
                    
            return analysis
            
        except Exception as e:
            print(f"{Fore.RED}Error analyzing file: {e}")
            return None
    
    def _analyze_sheet_structure(self, df, sheet_name):
        """Analyze individual sheet structure"""
        analysis = {
            'dimensions': f"{df.shape[0]} rows x {df.shape[1]} columns",
            'header_row': self._find_header_row(df),
            'data_start_row': None,
            'column_mapping': {},
            'sample_data': {},
            'price_columns': [],
            'data_patterns': {}
        }
        
        # Find header row
        header_row = analysis['header_row']
        if header_row is not None:
            # Extract headers
            headers = df.iloc[header_row].fillna('').astype(str).tolist()
            analysis['column_mapping'] = {i: header for i, header in enumerate(headers) if header.strip()}
            analysis['data_start_row'] = header_row + 1
            
            # Find price columns
            for i, header in enumerate(headers):
                if header and ('price' in header.lower() or 'usd' in header.lower() or 'eur' in header.lower()):
                    analysis['price_columns'].append({'index': i, 'name': header})
            
            # Sample data analysis
            if analysis['data_start_row'] < df.shape[0]:
                sample_rows = min(10, df.shape[0] - analysis['data_start_row'])
                sample_data = df.iloc[analysis['data_start_row']:analysis['data_start_row']+sample_rows].fillna('').to_dict('records')
                analysis['sample_data'] = sample_data
                
        return analysis
    
    def _find_header_row(self, df):
        """Find the row containing column headers"""
        for i in range(min(10, df.shape[0])):
            row_values = df.iloc[i].fillna('').astype(str).tolist()
            text_values = [v.strip() for v in row_values if v.strip()]
            
            # Look for header indicators
            header_indicators = ['part number', 'description', 'quantity', 'price', 'total price', 'usd', 'eur']
            matches = sum(1 for indicator in header_indicators 
                         if any(indicator in v.lower() for v in text_values))
            
            if matches >= 3:  # At least 3 header indicators found
                return i
        
        return None
    
    def parse_lenovo_server_lots(self, file_path):
        """Parse Lenovo X86 Server Lots sheet with enhanced logic"""
        try:
            df = pd.read_excel(file_path, sheet_name='Lenovo X86 Server Lots', header=None)
            analysis = self._analyze_sheet_structure(df, 'Lenovo X86 Server Lots')
            
            if analysis['header_row'] is None:
                print(f"{Fore.RED}Could not find header row in Server Lots sheet")
                return []
            
            print(f"{Fore.GREEN}Found header at row {analysis['header_row']}")
            print(f"{Fore.CYAN}Column mapping: {analysis['column_mapping']}")
            print(f"{Fore.CYAN}Price columns: {analysis['price_columns']}")
            
            # Extract data starting from header + 1
            data_start = analysis['data_start_row']
            models = []
            current_model = None
            
            # Find column indices
            part_col = self._find_column_by_keywords(analysis['column_mapping'], ['part number', 'part'])
            desc_col = self._find_column_by_keywords(analysis['column_mapping'], ['description', 'desc'])
            qty_col = self._find_column_by_keywords(analysis['column_mapping'], ['quantity', 'qty'])
            
            # Find USD and EUR price columns
            usd_price_cols = [col['index'] for col in analysis['price_columns'] 
                            if 'usd' in col['name'].lower()]
            eur_price_cols = [col['index'] for col in analysis['price_columns'] 
                            if 'eur' in col['name'].lower()]
            
            print(f"{Fore.YELLOW}Detected columns - Part: {part_col}, Desc: {desc_col}, Qty: {qty_col}")
            print(f"{Fore.YELLOW}Price columns - USD: {usd_price_cols}, EUR: {eur_price_cols}")
            
            # Process data rows
            for idx in range(data_start, df.shape[0]):
                row = df.iloc[idx].fillna('').astype(str)
                
                if part_col is not None and desc_col is not None:
                    part_number = str(row.iloc[part_col]).strip() if part_col < len(row) else ''
                    description = str(row.iloc[desc_col]).strip() if desc_col < len(row) else ''
                    
                    # Skip empty rows
                    if not part_number and not description:
                        continue
                    
                    # Detect if this is a server model (main entry)
                    if self._is_server_model_entry(part_number, description):
                        # Save previous model if exists
                        if current_model:
                            models.append(current_model)
                        
                        # Create new model
                        current_model = {
                            'id': f'lenovo_model_{len(models)+1}',
                            'model_name': self._extract_model_name(description),
                            'part_number': part_number,
                            'description': description,
                            'components': [],
                            'pricing': self._extract_pricing(row, usd_price_cols, eur_price_cols),
                            'row_index': idx,
                            'source': 'Server Lots'
                        }
                        
                        print(f"{Fore.GREEN}📦 New server model: {current_model['model_name']} ({part_number})")
                        
                    elif current_model and (part_number or description):
                        # Add component to current model
                        component = {
                            'part_number': part_number,
                            'description': description,
                            'quantity': self._extract_quantity(row, qty_col) if qty_col else 1,
                            'pricing': self._extract_pricing(row, usd_price_cols, eur_price_cols)
                        }
                        current_model['components'].append(component)
                        
                        if self.debug and len(current_model['components']) <= 3:
                            print(f"  {Fore.CYAN}├── Component: {description[:50]}...")
            
            # Add the last model
            if current_model:
                models.append(current_model)
            
            print(f"{Fore.GREEN}✅ Parsed {len(models)} server models from Server Lots")
            return models
            
        except Exception as e:
            print(f"{Fore.RED}Error parsing Server Lots: {e}")
            return []
    
    def parse_lenovo_parts(self, file_path):
        """Parse Lenovo X86 Parts sheet with enhanced logic"""
        try:
            df = pd.read_excel(file_path, sheet_name='Lenovo X86 Parts', header=None)
            analysis = self._analyze_sheet_structure(df, 'Lenovo X86 Parts')
            
            if analysis['header_row'] is None:
                print(f"{Fore.RED}Could not find header row in Parts sheet")
                return []
            
            print(f"{Fore.GREEN}Found header at row {analysis['header_row']} in Parts sheet")
            
            # Process parts data (similar to server lots but focus on individual components)
            models = []
            # Implementation for parts parsing would go here
            # For now, focus on server lots which contains the main server configurations
            
            return models
            
        except Exception as e:
            print(f"{Fore.RED}Error parsing Parts: {e}")
            return []
    
    def _find_column_by_keywords(self, column_mapping, keywords):
        """Find column index by matching keywords"""
        for col_idx, header in column_mapping.items():
            if header and any(keyword in header.lower() for keyword in keywords):
                return col_idx
        return None
    
    def _is_server_model_entry(self, part_number, description):
        """Determine if this entry represents a server model"""
        if not description:
            return False
        
        desc_lower = description.lower()
        
        # Positive indicators for server models
        server_indicators = [
            'smi1', 'smi2', 'sma1', 'sma2', 'mei1', 'mei2', 'mea1', 'mea2',
            'hvi1', 'hvi2', 'hva1', 'hva2', 'vei1', 'vei2', 'vea1', 'vea2',
            'server', 'thinksystem', 'thinkagile', 'sr630', 'sr650', 'sr655', 'sr665'
        ]
        
        # Negative indicators (components/accessories)
        negative_indicators = [
            'processor', 'memory', 'disk', 'storage', 'network', 'adapter',
            'upgrade', 'option', 'warranty', 'service', 'support', 'cable'
        ]
        
        has_server_indicator = any(indicator in desc_lower for indicator in server_indicators)
        has_negative_indicator = any(indicator in desc_lower for indicator in negative_indicators)
        
        # Additional logic: if it has pricing data and server indicators, likely a model
        return has_server_indicator and not has_negative_indicator
    
    def _extract_model_name(self, description):
        """Extract a clean model name from description"""
        if not description:
            return "Unknown Model"
        
        # Extract model codes and meaningful parts
        desc = description.strip()
        
        # Look for patterns like "SMI1 - Intel - 1 Proc - Small Rack Server"
        if ' - ' in desc:
            parts = desc.split(' - ')
            if len(parts) >= 2:
                return f"{parts[0]} - {parts[1]}"
        
        # Extract first meaningful part
        words = desc.split()
        if len(words) > 0:
            return ' '.join(words[:3])  # Take first 3 words
        
        return desc
    
    def _extract_pricing(self, row, usd_cols, eur_cols):
        """Extract pricing information from row"""
        pricing = {'usd': None, 'eur': None}
        
        # Extract USD pricing
        for col_idx in usd_cols:
            if col_idx < len(row):
                val = str(row.iloc[col_idx]).strip()
                if val and val.replace('.', '').replace(',', '').isdigit():
                    pricing['usd'] = float(val.replace(',', ''))
                    break
        
        # Extract EUR pricing  
        for col_idx in eur_cols:
            if col_idx < len(row):
                val = str(row.iloc[col_idx]).strip()
                if val and val.replace('.', '').replace(',', '').isdigit():
                    pricing['eur'] = float(val.replace(',', ''))
                    break
        
        return pricing
    
    def _extract_quantity(self, row, qty_col):
        """Extract quantity from row"""
        if qty_col is None or qty_col >= len(row):
            return 1
        
        val = str(row.iloc[qty_col]).strip()
        try:
            return int(float(val)) if val and val.replace('.', '').isdigit() else 1
        except:
            return 1
    
    def generate_api_payload(self, models, basket_info):
        """Generate API-compatible payload"""
        api_models = []
        
        for model in models:
            # Create configurations from components
            configurations = []
            for i, component in enumerate(model['components']):
                config = {
                    'id': f"config_{model['id']}_{i}",
                    'item_type': self._classify_component_type(component['description']),
                    'description': component['description'],
                    'raw_data': {
                        'part_number': component['part_number'],
                        'quantity': component['quantity'],
                        'price_usd': component['pricing'].get('usd'),
                        'price_eur': component['pricing'].get('eur')
                    }
                }
                configurations.append(config)
            
            api_model = {
                'id': model['id'],
                'lot_description': model['description'],
                'model_name': model['model_name'],
                'model_number': model['part_number'],
                'category': 'Server',
                'form_factor': 'Rack',
                'vendor': 'Lenovo',
                'processor_info': self._extract_processor_info(model['components']),
                'ram_info': self._extract_memory_info(model['components']),
                'network_info': self._extract_network_info(model['components']),
                'price_5yr_psp': model['pricing'].get('usd', ''),
                'all_prices': {
                    'Total price in USD': str(model['pricing'].get('usd', 'N/A')),
                    'Total price in EUR': str(model['pricing'].get('eur', 'N/A'))
                },
                'quotation_date': datetime.now().isoformat(),
                'full_configurations': configurations
            }
            api_models.append(api_model)
        
        return api_models
    
    def _classify_component_type(self, description):
        """Classify component type from description"""
        if not description:
            return 'component'
        
        desc_lower = description.lower()
        
        if any(kw in desc_lower for kw in ['processor', 'cpu', 'intel', 'amd']):
            return 'processor'
        elif any(kw in desc_lower for kw in ['memory', 'ram', 'gb', 'dimm']):
            return 'memory'
        elif any(kw in desc_lower for kw in ['storage', 'disk', 'ssd', 'hdd', 'drive']):
            return 'storage'
        elif any(kw in desc_lower for kw in ['network', 'ethernet', 'nic', 'adapter']):
            return 'network'
        else:
            return 'component'
    
    def _extract_processor_info(self, components):
        """Extract processor information from components"""
        for component in components:
            desc_lower = component['description'].lower()
            if any(kw in desc_lower for kw in ['processor', 'cpu', 'intel', 'amd']):
                return component['description']
        return ''
    
    def _extract_memory_info(self, components):
        """Extract memory information from components"""
        memory_components = []
        for component in components:
            desc_lower = component['description'].lower()
            if any(kw in desc_lower for kw in ['memory', 'ram', 'gb', 'dimm']):
                memory_components.append(component['description'])
        return '; '.join(memory_components)
    
    def _extract_network_info(self, components):
        """Extract network information from components"""
        network_components = []
        for component in components:
            desc_lower = component['description'].lower()
            if any(kw in desc_lower for kw in ['network', 'ethernet', 'nic', 'adapter']):
                network_components.append(component['description'])
        return '; '.join(network_components)

def main():
    """Main function to test the enhanced parser"""
    file_path = "/Users/mateimarcu/DevApps/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(file_path).exists():
        print(f"{Fore.RED}File not found: {file_path}")
        return
    
    parser = EnhancedLenovoParser()
    
    # Analyze structure first
    print(f"{Fore.BLUE}🔍 Analyzing Lenovo file structure...")
    analysis = parser.analyze_lenovo_structure(file_path)
    
    if analysis:
        print(f"{Fore.GREEN}📊 Structure analysis completed")
        for sheet_name, sheet_analysis in analysis['sheets'].items():
            print(f"{Fore.CYAN}  📋 {sheet_name}: {sheet_analysis['dimensions']}")
            if sheet_analysis['header_row'] is not None:
                print(f"      Header at row {sheet_analysis['header_row']}")
                print(f"      Price columns: {len(sheet_analysis['price_columns'])}")
    
    # Parse server lots
    print(f"\n{Fore.BLUE}🚀 Parsing Lenovo Server Lots...")
    models = parser.parse_lenovo_server_lots(file_path)
    
    if models:
        print(f"\n{Fore.GREEN}📈 Parsing Results:")
        print(f"  ✅ Total models parsed: {len(models)}")
        
        # Show sample of parsed models
        for i, model in enumerate(models[:3]):
            print(f"\n  {Fore.YELLOW}Model {i+1}: {model['model_name']}")
            print(f"    Part Number: {model['part_number']}")
            print(f"    Components: {len(model['components'])}")
            print(f"    USD Price: {model['pricing'].get('usd', 'N/A')}")
            print(f"    EUR Price: {model['pricing'].get('eur', 'N/A')}")
            
        # Generate API payload
        basket_info = {
            'id': 'test_basket',
            'name': 'Enhanced Lenovo Q3 2025',
            'vendor': 'Lenovo'
        }
        
        api_payload = parser.generate_api_payload(models, basket_info)
        
        # Save results
        output_file = "/Users/mateimarcu/DevApps/LCMDesigner/enhanced_lenovo_parsing_results.json"
        with open(output_file, 'w') as f:
            json.dump({
                'analysis': analysis,
                'parsed_models': api_payload,
                'summary': {
                    'total_models': len(models),
                    'models_with_pricing': len([m for m in models if m['pricing'].get('usd')]),
                    'total_components': sum(len(m['components']) for m in models)
                }
            }, f, indent=2, default=str)
        
        print(f"\n{Fore.GREEN}💾 Results saved to: {output_file}")
    else:
        print(f"{Fore.RED}❌ No models were parsed")

if __name__ == "__main__":
    main()
