#!/usr/bin/env python3
"""
Comprehensive Hardware Basket Parsing Analysis
Analyzes current parsing effectiveness for server models and extension components
"""

import subprocess
import json
import pandas as pd
import numpy as np
from pathlib import Path
from colorama import init, Fore, Style
import re
import requests

init(autoreset=True)

class ComprehensiveParsingAnalysis:
    def __init__(self):
        self.backend_url = "http://localhost:3001"
        
    def get_current_baskets(self):
        """Get all currently parsed baskets"""
        try:
            result = subprocess.run([
                'curl', '-s', f'{self.backend_url}/api/hardware-baskets'
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                return json.loads(result.stdout)
            return []
        except Exception as e:
            print(f"{Fore.RED}Error getting baskets: {e}")
            return []
    
    def analyze_parsing_quality(self, baskets):
        """Analyze quality of server model and extension component parsing"""
        analysis = {
            'total_baskets': len(baskets),
            'vendors': {},
            'parsing_issues': [],
            'server_model_extraction': {},
            'extension_component_extraction': {},
            'database_schema_compliance': {}
        }
        
        for basket in baskets:
            vendor = basket.get('vendor', 'Unknown')
            filename = basket.get('filename', 'Unknown')
            models = basket.get('models', [])
            
            if vendor not in analysis['vendors']:
                analysis['vendors'][vendor] = {
                    'baskets': 0,
                    'total_models': 0,
                    'server_models': 0,
                    'extension_components': 0,
                    'parsing_completeness': {}
                }
            
            vendor_data = analysis['vendors'][vendor]
            vendor_data['baskets'] += 1
            vendor_data['total_models'] += len(models)
            
            # Analyze each model
            for model in models:
                model_analysis = self.analyze_model_parsing(model, vendor)
                
                if model_analysis['is_server_model']:
                    vendor_data['server_models'] += 1
                elif model_analysis['is_extension_component']:
                    vendor_data['extension_components'] += 1
                
                # Track parsing completeness
                completeness = model_analysis['completeness_score']
                if completeness not in vendor_data['parsing_completeness']:
                    vendor_data['parsing_completeness'][completeness] = 0
                vendor_data['parsing_completeness'][completeness] += 1
        
        return analysis
    
    def analyze_model_parsing(self, model, vendor):
        """Analyze individual model parsing quality"""
        model_name = model.get('model_name', '')
        model_number = model.get('model_number', '')
        part_number = model.get('part_number', '')
        specs = model.get('specs', {})
        configurations = model.get('configurations', [])
        
        analysis = {
            'is_server_model': self.is_server_model(model_name, model_number, part_number, vendor),
            'is_extension_component': self.is_extension_component(model_name, model_number, part_number, vendor),
            'has_specifications': bool(specs and len(specs) > 0),
            'has_configurations': len(configurations) > 0,
            'pricing_complete': self.check_pricing_completeness(model),
            'specification_completeness': self.check_specification_completeness(specs, vendor),
            'component_classification': self.classify_component(model_name, model_number, part_number, vendor)
        }
        
        # Calculate completeness score (0-100)
        score = 0
        if analysis['is_server_model'] or analysis['is_extension_component']:
            score += 20  # Correct classification
        if analysis['has_specifications']:
            score += 20  # Has basic specs
        if analysis['has_configurations']:
            score += 20  # Has configurations
        if analysis['pricing_complete']:
            score += 20  # Has pricing
        if analysis['specification_completeness'] > 0.5:
            score += 20  # Good specification detail
        
        analysis['completeness_score'] = min(100, score)
        
        return analysis
    
    def is_server_model(self, model_name, model_number, part_number, vendor):
        """Determine if this is a server model"""
        if vendor.lower() == 'dell':
            # Dell server indicators
            server_indicators = ['SMI', 'SMA', 'MEI', 'MEA', 'HVI', 'HVA', 'R640', 'R740', 'R440', 'PowerEdge']
            return any(indicator in (model_name + model_number + part_number).upper() for indicator in server_indicators)
        
        elif vendor.lower() == 'lenovo':
            # Lenovo server indicators
            server_indicators = ['ThinkSystem', 'ThinkEdge', 'SR630', 'SR650', 'SR850', 'SR950', 'ST250', 'ST550']
            return any(indicator in (model_name + model_number + part_number) for indicator in server_indicators)
        
        return False
    
    def is_extension_component(self, model_name, model_number, part_number, vendor):
        """Determine if this is an extension component"""
        if vendor.lower() == 'dell':
            # Dell extension indicators (network cards, storage controllers, etc.)
            extension_indicators = ['DHC', 'Network', 'Adapter', 'Controller', 'Card', 'Module', 'NIC']
            return any(indicator in (model_name + model_number + part_number) for indicator in extension_indicators)
        
        elif vendor.lower() == 'lenovo':
            # Lenovo extension indicators
            extension_indicators = ['Adapter', 'Controller', 'Module', 'Card', 'NIC', 'HBA', 'RAID']
            return any(indicator in (model_name + model_number + part_number) for indicator in extension_indicators)
        
        return False
    
    def check_pricing_completeness(self, model):
        """Check if pricing data is complete"""
        all_prices = model.get('all_prices', {})
        usd_price = all_prices.get('Total price in USD', 'N/A')
        return usd_price != 'N/A' and usd_price != '' and usd_price is not None
    
    def check_specification_completeness(self, specs, vendor):
        """Check completeness of specifications (0.0 to 1.0)"""
        if not specs:
            return 0.0
        
        # Essential fields to check
        essential_fields = ['processor', 'memory', 'storage', 'form_factor', 'network']
        filled_fields = 0
        
        for field in essential_fields:
            if field in specs and specs[field] and specs[field] != 'N/A':
                filled_fields += 1
        
        return filled_fields / len(essential_fields)
    
    def classify_component(self, model_name, model_number, part_number, vendor):
        """Classify the component type"""
        combined = (model_name + model_number + part_number).upper()
        
        if any(kw in combined for kw in ['PROCESSOR', 'CPU', 'XEON', 'AMD', 'INTEL']):
            return 'processor'
        elif any(kw in combined for kw in ['MEMORY', 'RAM', 'DDR', 'DIMM']):
            return 'memory'
        elif any(kw in combined for kw in ['STORAGE', 'SSD', 'HDD', 'NVME', 'SATA']):
            return 'storage'
        elif any(kw in combined for kw in ['NETWORK', 'NIC', 'ETHERNET', 'ADAPTER']):
            return 'network'
        elif any(kw in combined for kw in ['CONTROLLER', 'RAID', 'HBA']):
            return 'controller'
        elif self.is_server_model(model_name, model_number, part_number, vendor):
            return 'server_chassis'
        else:
            return 'unknown'
    
    def analyze_excel_structure(self, file_path, vendor):
        """Analyze the original Excel structure vs parsed results"""
        try:
            # Get sheet names
            xl_file = pd.ExcelFile(file_path)
            sheets_info = {}
            
            for sheet_name in xl_file.sheet_names:
                try:
                    df = pd.read_excel(file_path, sheet_name=sheet_name)
                    sheets_info[sheet_name] = {
                        'rows': len(df),
                        'cols': len(df.columns),
                        'non_empty_rows': df.dropna(how='all').shape[0],
                        'data_density': df.count().sum() / (len(df) * len(df.columns)) if len(df) > 0 else 0
                    }
                except Exception as e:
                    sheets_info[sheet_name] = {'error': str(e)}
            
            return sheets_info
        except Exception as e:
            print(f"{Fore.RED}Error analyzing Excel structure: {e}")
            return {}
    
    def identify_parsing_improvements(self, analysis):
        """Identify specific areas for parsing improvements"""
        improvements = {
            'high_priority': [],
            'medium_priority': [],
            'low_priority': []
        }
        
        for vendor, vendor_data in analysis['vendors'].items():
            total_models = vendor_data['total_models']
            server_models = vendor_data['server_models']
            extension_components = vendor_data['extension_components']
            
            # High priority issues
            if server_models == 0 and total_models > 0:
                improvements['high_priority'].append(f"{vendor}: No server models detected - parsing may be missing server identification logic")
            
            if extension_components == 0 and total_models > 10:
                improvements['high_priority'].append(f"{vendor}: No extension components detected - may be lumping everything as servers")
            
            # Check parsing completeness
            low_completeness = sum(count for score, count in vendor_data['parsing_completeness'].items() if score < 50)
            total_completeness = sum(vendor_data['parsing_completeness'].values())
            
            if low_completeness / total_completeness > 0.5:
                improvements['high_priority'].append(f"{vendor}: >50% of models have low completeness (<50%) - needs specification extraction improvements")
            
            # Medium priority issues
            if server_models / total_models < 0.1 and total_models > 5:
                improvements['medium_priority'].append(f"{vendor}: Very few server models detected ({server_models}/{total_models}) - check server identification patterns")
            
            if extension_components / total_models > 0.8:
                improvements['medium_priority'].append(f"{vendor}: Too many extension components ({extension_components}/{total_models}) - may be missing server chassis parsing")
        
        return improvements
    
    def generate_parsing_report(self):
        """Generate comprehensive parsing analysis report"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"{Fore.CYAN}🔬 COMPREHENSIVE HARDWARE BASKET PARSING ANALYSIS")
        print(f"{Fore.CYAN}{'='*60}")
        
        # Get current baskets
        print(f"\n{Fore.YELLOW}📊 Getting current parsed baskets...")
        baskets = self.get_current_baskets()
        
        if not baskets:
            print(f"{Fore.RED}❌ No baskets found - ensure backend is running")
            return
        
        # Analyze parsing quality
        print(f"{Fore.YELLOW}🔍 Analyzing parsing quality...")
        analysis = self.analyze_parsing_quality(baskets)
        
        # Display vendor summary
        print(f"\n{Fore.GREEN}📋 VENDOR PARSING SUMMARY")
        print(f"{Fore.GREEN}{'-'*40}")
        
        for vendor, vendor_data in analysis['vendors'].items():
            print(f"\n{Fore.BLUE}🏭 {vendor}")
            print(f"  📦 Baskets: {vendor_data['baskets']}")
            print(f"  🔧 Total Models: {vendor_data['total_models']}")
            print(f"  🖥️  Server Models: {vendor_data['server_models']}")
            print(f"  🔌 Extension Components: {vendor_data['extension_components']}")
            
            # Show completeness distribution
            if vendor_data['parsing_completeness']:
                avg_completeness = sum(score * count for score, count in vendor_data['parsing_completeness'].items()) / vendor_data['total_models']
                print(f"  📈 Avg Completeness: {avg_completeness:.1f}%")
                
                # Show completeness breakdown
                high_quality = sum(count for score, count in vendor_data['parsing_completeness'].items() if score >= 80)
                medium_quality = sum(count for score, count in vendor_data['parsing_completeness'].items() if 50 <= score < 80)
                low_quality = sum(count for score, count in vendor_data['parsing_completeness'].items() if score < 50)
                
                print(f"  ✅ High Quality (80%+): {high_quality}")
                print(f"  ⚠️  Medium Quality (50-79%): {medium_quality}")
                print(f"  ❌ Low Quality (<50%): {low_quality}")
        
        # Analyze Excel structure vs parsing results
        print(f"\n{Fore.GREEN}📁 EXCEL FILE ANALYSIS")
        print(f"{Fore.GREEN}{'-'*40}")
        
        dell_file = "docs/X86 Basket Q3 2025 v2 Dell Only.xlsx"
        lenovo_file = "docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
        
        if Path(dell_file).exists():
            print(f"\n{Fore.BLUE}📊 Dell Excel Structure:")
            dell_structure = self.analyze_excel_structure(dell_file, 'Dell')
            for sheet, info in dell_structure.items():
                if 'error' not in info:
                    print(f"  • {sheet}: {info['rows']} rows, {info['non_empty_rows']} non-empty, {info['data_density']:.2f} density")
        
        if Path(lenovo_file).exists():
            print(f"\n{Fore.BLUE}📊 Lenovo Excel Structure:")
            lenovo_structure = self.analyze_excel_structure(lenovo_file, 'Lenovo')
            for sheet, info in lenovo_structure.items():
                if 'error' not in info:
                    print(f"  • {sheet}: {info['rows']} rows, {info['non_empty_rows']} non-empty, {info['data_density']:.2f} density")
        
        # Identify improvements
        print(f"\n{Fore.GREEN}🎯 PARSING IMPROVEMENT RECOMMENDATIONS")
        print(f"{Fore.GREEN}{'-'*50}")
        
        improvements = self.identify_parsing_improvements(analysis)
        
        if improvements['high_priority']:
            print(f"\n{Fore.RED}🚨 HIGH PRIORITY ISSUES:")
            for issue in improvements['high_priority']:
                print(f"  • {issue}")
        
        if improvements['medium_priority']:
            print(f"\n{Fore.YELLOW}⚠️  MEDIUM PRIORITY ISSUES:")
            for issue in improvements['medium_priority']:
                print(f"  • {issue}")
        
        if improvements['low_priority']:
            print(f"\n{Fore.CYAN}ℹ️  LOW PRIORITY ISSUES:")
            for issue in improvements['low_priority']:
                print(f"  • {issue}")
        
        # Save detailed analysis
        output_file = "comprehensive_parsing_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)
        
        print(f"\n{Fore.GREEN}💾 Detailed analysis saved to: {output_file}")
        
        return analysis

def main():
    analyzer = ComprehensiveParsingAnalysis()
    analysis = analyzer.generate_parsing_report()
    
    print(f"\n{Fore.CYAN}🎉 Analysis complete!")
    print(f"{Fore.CYAN}Focus areas for iterative improvement:")
    print(f"  1. Server model identification accuracy")
    print(f"  2. Extension component classification")
    print(f"  3. Specification extraction completeness")
    print(f"  4. Database schema compliance")

if __name__ == "__main__":
    main()
