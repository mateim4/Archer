#!/usr/bin/env python3
"""
Direct Lenovo Basket Data Analysis and Enhancement

This script analyzes the Lenovo basket data directly from Excel files and provides
enhanced data extraction and categorization to improve field population.
"""

import pandas as pd
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple, Optional

class DirectBasketAnalyzer:
    """Direct analysis of basket Excel files with enhanced data extraction"""
    
    def __init__(self):
        self.price_patterns = [
            r'\$?([\d,]+\.?\d*)',  # $1,234.56 or 1234.56
            r'([\d,]+\.?\d*)\s*USD',  # 1234.56 USD  
            r'([\d,]+\.?\d*)\s*EUR',  # 1234.56 EUR
            r'USD\s*([\d,]+\.?\d*)',  # USD 1234.56
            r'EUR\s*([\d,]+\.?\d*)',  # EUR 1234.56
        ]
        
        self.component_classification = {
            'server': {
                'keywords': ['thinksystem', 'server', 'chassis', '1u', '2u', '4u'],
                'part_patterns': [r'^[A-Z]{2,3}\d{1,2}[A-Z]?$'],  # 7X02, 7Y02, etc.
                'category': 'Server Hardware'
            },
            'processor': {
                'keywords': ['xeon', 'processor', 'cpu', 'core', 'ghz'],
                'part_patterns': [],
                'category': 'CPU'
            },
            'memory': {
                'keywords': ['truddram4', 'memory', 'dimm', 'dram', 'gb ram'],
                'part_patterns': [],
                'category': 'Memory'
            },
            'storage': {
                'keywords': ['ssd', 'hdd', 'drive', 'storage', 'tb', 'gb disk'],
                'part_patterns': [],
                'category': 'Storage'
            },
            'network': {
                'keywords': ['ethernet', 'network', 'nic', '10gbe', '25gbe', 'adapter'],
                'part_patterns': [],
                'category': 'Network'
            },
            'power': {
                'keywords': ['power supply', 'psu', 'watt', 'power'],
                'part_patterns': [],
                'category': 'Power'
            },
            'raid': {
                'keywords': ['raid', 'controller', 'storage controller'],
                'part_patterns': [],
                'category': 'RAID Controller'
            },
            'service': {
                'keywords': ['warranty', 'service', 'support', 'maintenance'],
                'part_patterns': [],
                'category': 'Service'
            }
        }

    def extract_price(self, price_str: str) -> Optional[float]:
        """Extract numeric price value from string"""
        if not price_str or pd.isna(price_str):
            return None
            
        price_str = str(price_str).strip()
        
        # Skip common non-price indicators
        if price_str.lower() in ['n/a', 'tbd', 'contact', 'varies', 'unknown', '']:
            return None
        
        # Try each price pattern
        for pattern in self.price_patterns:
            match = re.search(pattern, price_str, re.IGNORECASE)
            if match:
                try:
                    price_value = float(match.group(1).replace(',', ''))
                    if price_value > 0:
                        return price_value
                except (ValueError, IndexError):
                    continue
        
        return None

    def classify_component(self, description: str, part_number: str = None) -> Tuple[str, str]:
        """Classify component type and category"""
        desc_lower = description.lower() if description else ''
        part_lower = part_number.lower() if part_number else ''
        
        # Check each component classification rule
        for comp_type, rules in self.component_classification.items():
            # Check keywords in description
            if any(keyword in desc_lower for keyword in rules['keywords']):
                return comp_type, rules['category']
            
            # Check part number patterns
            if part_number:
                for pattern in rules.get('part_patterns', []):
                    if re.match(pattern, part_number, re.IGNORECASE):
                        return comp_type, rules['category']
        
        return 'component', 'Hardware'

    def extract_specifications(self, description: str) -> Dict[str, Any]:
        """Extract technical specifications from description"""
        specs = {}
        
        if not description:
            return specs
        
        desc_lower = description.lower()
        
        # Extract processor specs
        cpu_match = re.search(r'(\d+)\s*core.*?(\d+\.?\d*)\s*ghz', desc_lower)
        if cpu_match:
            specs['cores'] = int(cpu_match.group(1))
            specs['frequency_ghz'] = float(cpu_match.group(2))
        
        # Extract memory specs
        memory_match = re.search(r'(\d+)\s*gb.*?ddr(\d)', desc_lower)
        if memory_match:
            specs['capacity_gb'] = int(memory_match.group(1))
            specs['memory_type'] = f"DDR{memory_match.group(2)}"
        
        # Extract storage specs
        storage_match = re.search(r'(\d+\.?\d*)\s*(tb|gb).*?(ssd|hdd)', desc_lower)
        if storage_match:
            capacity = float(storage_match.group(1))
            unit = storage_match.group(2).upper()
            drive_type = storage_match.group(3).upper()
            
            if unit == 'TB':
                capacity_gb = capacity * 1024
            else:
                capacity_gb = capacity
                
            specs['storage_capacity_gb'] = capacity_gb
            specs['storage_type'] = drive_type
        
        # Extract form factor
        form_factor_match = re.search(r'(\d+)u\s*(rack|server)', desc_lower)
        if form_factor_match:
            specs['rack_units'] = int(form_factor_match.group(1))
            specs['form_factor'] = f"{form_factor_match.group(1)}U Rack"
        
        return specs

    def analyze_lenovo_parts_sheet(self, file_path: str) -> List[Dict[str, Any]]:
        """Analyze Lenovo X86 Parts sheet with enhanced data extraction"""
        print(f"Analyzing Lenovo Parts sheet: {file_path}")
        
        try:
            # Read the Excel file
            df = pd.read_excel(file_path, sheet_name='Lenovo X86 Parts', header=None)
            
            # Find header row (contains 'Description', 'Part Number', etc.)
            header_row = None
            for i in range(min(10, len(df))):
                row_text = ' '.join([str(cell) for cell in df.iloc[i] if pd.notna(cell)]).lower()
                if 'description' in row_text and ('part' in row_text or 'number' in row_text):
                    header_row = i
                    break
            
            if header_row is None:
                print("Could not find header row")
                return []
            
            # Set header and clean data
            df.columns = df.iloc[header_row]
            df = df.iloc[header_row + 1:].reset_index(drop=True)
            
            # Clean column names
            df.columns = [str(col).strip() for col in df.columns]
            
            print(f"Found columns: {list(df.columns)}")
            
            # Process each row
            enhanced_items = []
            
            for idx, row in df.iterrows():
                # Extract basic fields
                description = str(row.get('Description', '')).strip() if pd.notna(row.get('Description')) else ''
                part_number = str(row.get('Part Number', '')).strip() if pd.notna(row.get('Part Number')) else ''
                
                # Skip empty rows
                if not description and not part_number:
                    continue
                
                # Skip obviously irrelevant entries
                if len(description) < 5 or description.lower() in ['nan', 'none', 'n/a']:
                    continue
                
                # Classify component
                comp_type, comp_category = self.classify_component(description, part_number)
                
                # Extract price information
                unit_price_usd = None
                unit_price_eur = None
                
                # Look for price columns
                for col in df.columns:
                    col_lower = str(col).lower()
                    if 'price' in col_lower or 'cost' in col_lower or 'usd' in col_lower:
                        price_val = self.extract_price(str(row.get(col, '')))
                        if price_val and 'usd' in col_lower:
                            unit_price_usd = price_val
                        elif price_val and 'eur' in col_lower:
                            unit_price_eur = price_val
                        elif price_val and not unit_price_usd:
                            unit_price_usd = price_val  # Default to USD
                
                # Extract specifications
                specifications = self.extract_specifications(description)
                
                # Build enhanced item
                enhanced_item = {
                    'row_index': idx,
                    'description': description,
                    'part_number': part_number,
                    'type': comp_type,
                    'category': comp_category,
                    'unit_price_usd': unit_price_usd,
                    'unit_price_eur': unit_price_eur,
                    'specifications': specifications,
                    'vendor': 'Lenovo',
                    'source_file': Path(file_path).name,
                    'enhanced': True
                }
                
                # Add any additional columns found in the Excel
                for col in df.columns:
                    if col not in ['Description', 'Part Number'] and pd.notna(row.get(col)):
                        enhanced_item[f'original_{col.lower().replace(" ", "_")}'] = str(row.get(col))
                
                enhanced_items.append(enhanced_item)
            
            print(f"Processed {len(enhanced_items)} items from Lenovo Parts sheet")
            
            # Analyze completion rates
            total_items = len(enhanced_items)
            price_filled = sum(1 for item in enhanced_items if item.get('unit_price_usd'))
            type_filled = sum(1 for item in enhanced_items if item.get('type') and item['type'] != 'component')
            spec_filled = sum(1 for item in enhanced_items if item.get('specifications') and len(item['specifications']) > 0)
            
            print("\nCompletion Analysis:")
            print(f"Total items: {total_items}")
            print(f"Price fields: {price_filled}/{total_items} ({price_filled/total_items*100:.1f}%)")
            print(f"Type classification: {type_filled}/{total_items} ({type_filled/total_items*100:.1f}%)")
            print(f"Specifications: {spec_filled}/{total_items} ({spec_filled/total_items*100:.1f}%)")
            
            return enhanced_items
            
        except Exception as e:
            print(f"Error analyzing Lenovo Parts sheet: {e}")
            return []

    def generate_analysis_report(self, enhanced_items: List[Dict[str, Any]]) -> str:
        """Generate comprehensive analysis report"""
        
        report = "# Lenovo Basket Enhancement Analysis Report\n\n"
        report += f"Generated: {pd.Timestamp.now()}\n\n"
        
        if not enhanced_items:
            report += "No items found for analysis.\n"
            return report
        
        # Summary statistics
        total_items = len(enhanced_items)
        type_distribution = {}
        category_distribution = {}
        
        for item in enhanced_items:
            item_type = item.get('type', 'unknown')
            item_category = item.get('category', 'unknown')
            
            type_distribution[item_type] = type_distribution.get(item_type, 0) + 1
            category_distribution[item_category] = category_distribution.get(item_category, 0) + 1
        
        report += f"## Summary\n\n"
        report += f"**Total Items Analyzed:** {total_items}\n\n"
        
        # Type distribution
        report += "### Component Type Distribution\n\n"
        for comp_type, count in sorted(type_distribution.items(), key=lambda x: x[1], reverse=True):
            percentage = count / total_items * 100
            report += f"- **{comp_type.title()}:** {count} items ({percentage:.1f}%)\n"
        
        report += "\n### Category Distribution\n\n"
        for category, count in sorted(category_distribution.items(), key=lambda x: x[1], reverse=True):
            percentage = count / total_items * 100
            report += f"- **{category}:** {count} items ({percentage:.1f}%)\n"
        
        # Field completion analysis
        price_filled = sum(1 for item in enhanced_items if item.get('unit_price_usd'))
        type_classified = sum(1 for item in enhanced_items if item.get('type') != 'component')
        spec_filled = sum(1 for item in enhanced_items if item.get('specifications') and len(item['specifications']) > 0)
        
        report += f"\n## Field Completion Analysis\n\n"
        report += f"| Field | Filled | Total | Percentage |\n"
        report += f"|-------|--------|-------|------------|\n"
        report += f"| Price (USD) | {price_filled} | {total_items} | {price_filled/total_items*100:.1f}% |\n"
        report += f"| Type Classification | {type_classified} | {total_items} | {type_classified/total_items*100:.1f}% |\n"
        report += f"| Specifications | {spec_filled} | {total_items} | {spec_filled/total_items*100:.1f}% |\n"
        
        # Sample items by type
        report += f"\n## Sample Items by Type\n\n"
        
        for comp_type in sorted(type_distribution.keys()):
            if comp_type == 'component':
                continue  # Skip generic components
            
            sample_items = [item for item in enhanced_items if item.get('type') == comp_type][:3]
            if sample_items:
                report += f"### {comp_type.title()}\n\n"
                for i, item in enumerate(sample_items, 1):
                    report += f"{i}. **{item.get('description', 'N/A')}**\n"
                    report += f"   - Part: {item.get('part_number', 'N/A')}\n"
                    report += f"   - Category: {item.get('category', 'N/A')}\n"
                    if item.get('unit_price_usd'):
                        report += f"   - Price: ${item['unit_price_usd']:.2f} USD\n"
                    if item.get('specifications'):
                        specs = item['specifications']
                        for spec_key, spec_value in specs.items():
                            report += f"   - {spec_key.replace('_', ' ').title()}: {spec_value}\n"
                    report += "\n"
        
        return report

def main():
    """Main execution function"""
    analyzer = DirectBasketAnalyzer()
    
    # Analyze test file
    test_file = "test_lenovo_x86_parts.xlsx"
    
    if not Path(test_file).exists():
        print(f"Test file {test_file} not found. Please ensure the Lenovo basket file is available.")
        return
    
    print("Starting direct Lenovo basket analysis...")
    
    # Analyze the file
    enhanced_items = analyzer.analyze_lenovo_parts_sheet(test_file)
    
    if enhanced_items:
        # Generate report
        report = analyzer.generate_analysis_report(enhanced_items)
        
        # Save enhanced data
        output_file = "lenovo_enhanced_analysis.json"
        with open(output_file, 'w') as f:
            json.dump(enhanced_items, f, indent=2, default=str)
        
        print(f"\nEnhanced data saved to: {output_file}")
        
        # Save report
        report_file = "lenovo_enhancement_report.md"
        with open(report_file, 'w') as f:
            f.write(report)
        
        print(f"Analysis report saved to: {report_file}")
        print("\n" + "="*80)
        print("DIRECT BASKET ANALYSIS COMPLETE")
        print("="*80)
        print(f"Processed {len(enhanced_items)} items with enhanced data extraction")
        print(f"Check {report_file} for detailed analysis")
        print("="*80)
    else:
        print("No items were successfully processed.")

if __name__ == "__main__":
    main()
