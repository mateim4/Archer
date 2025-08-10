#!/usr/bin/env python3
"""
Hardware Basket Excel File Analyzer
Analyzes the structure and content of Atos hardware basket Excel files
"""

import pandas as pd
import json
import os
from pathlib import Path

def analyze_excel_file(filepath):
    """Analyze an Excel file and return detailed structure information"""
    print(f"\n{'='*80}")
    print(f"ANALYZING: {filepath}")
    print(f"{'='*80}")
    
    if not os.path.exists(filepath):
        print(f"❌ File not found: {filepath}")
        return None
    
    try:
        # Get all sheet names
        excel_file = pd.ExcelFile(filepath)
        sheets = excel_file.sheet_names
        print(f"📊 Number of worksheets: {len(sheets)}")
        print(f"📋 Worksheet names: {sheets}")
        
        analysis_results = {
            "filename": os.path.basename(filepath),
            "filepath": filepath,
            "sheet_count": len(sheets),
            "sheets": {}
        }
        
        # Analyze each sheet
        for sheet_name in sheets:
            print(f"\n🔍 ANALYZING SHEET: '{sheet_name}'")
            print("-" * 60)
            
            try:
                # Read the sheet
                df = pd.read_excel(filepath, sheet_name=sheet_name)
                
                # Basic info
                rows, cols = df.shape
                print(f"📏 Dimensions: {rows} rows × {cols} columns")
                print(f"📝 Column names: {list(df.columns)}")
                
                # Sample data
                print(f"\n📄 First 5 rows:")
                print(df.head().to_string())
                
                # Data types
                print(f"\n🔢 Data types:")
                for col in df.columns:
                    dtype = df[col].dtype
                    non_null = df[col].count()
                    print(f"  {col}: {dtype} ({non_null}/{rows} non-null)")
                
                # Look for key patterns
                print(f"\n🔍 Pattern Analysis:")
                
                # Check for model/part number columns
                model_like_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['model', 'part', 'sku', 'product', 'item'])]
                if model_like_cols:
                    print(f"  📦 Potential model/part columns: {model_like_cols}")
                
                # Check for price/cost columns
                price_like_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['price', 'cost', 'euro', 'eur', 'usd', 'dollar', '$', '€'])]
                if price_like_cols:
                    print(f"  💰 Potential price columns: {price_like_cols}")
                
                # Check for specification columns
                spec_like_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['spec', 'description', 'cpu', 'memory', 'ram', 'storage', 'disk', 'processor'])]
                if spec_like_cols:
                    print(f"  ⚙️ Potential spec columns: {spec_like_cols}")
                
                # Check for vendor/manufacturer columns
                vendor_like_cols = [col for col in df.columns if any(keyword in col.lower() for keyword in ['vendor', 'manufacturer', 'brand', 'dell', 'lenovo', 'hp', 'cisco'])]
                if vendor_like_cols:
                    print(f"  🏢 Potential vendor columns: {vendor_like_cols}")
                
                # Unique values for categorical columns
                for col in df.columns:
                    unique_count = df[col].nunique()
                    if unique_count <= 20 and unique_count > 1:  # Likely categorical
                        unique_vals = df[col].dropna().unique()
                        print(f"  📋 '{col}' unique values ({unique_count}): {list(unique_vals)[:10]}...")
                
                # Store analysis results
                analysis_results["sheets"][sheet_name] = {
                    "dimensions": {"rows": rows, "columns": cols},
                    "columns": list(df.columns),
                    "data_types": {col: str(df[col].dtype) for col in df.columns},
                    "non_null_counts": {col: int(df[col].count()) for col in df.columns},
                    "sample_data": df.head(3).to_dict('records'),
                    "potential_patterns": {
                        "model_columns": model_like_cols,
                        "price_columns": price_like_cols,
                        "spec_columns": spec_like_cols,
                        "vendor_columns": vendor_like_cols
                    }
                }
                
                # Look for interesting data patterns
                print(f"\n🎯 Key Data Insights:")
                
                # Check if there are server models
                for col in df.columns:
                    if any(keyword in col.lower() for keyword in ['model', 'product', 'item']):
                        sample_values = df[col].dropna().head(10).tolist()
                        print(f"  Sample {col} values: {sample_values}")
                
            except Exception as e:
                print(f"❌ Error reading sheet '{sheet_name}': {e}")
                analysis_results["sheets"][sheet_name] = {"error": str(e)}
        
        return analysis_results
        
    except Exception as e:
        print(f"❌ Error analyzing file: {e}")
        return None

def main():
    """Main analysis function"""
    print("🔍 Hardware Basket Excel File Analyzer")
    print("=" * 80)
    
    # File paths
    dell_file = "/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    lenovo_file = "/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    files_to_analyze = [dell_file, lenovo_file]
    
    all_results = {}
    
    for filepath in files_to_analyze:
        result = analyze_excel_file(filepath)
        if result:
            all_results[os.path.basename(filepath)] = result
    
    # Save analysis results
    output_file = "/Users/mateimarcu/DevApps/LCMDesigner/hardware_basket_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(all_results, f, indent=2, default=str)
    
    print(f"\n💾 Analysis results saved to: {output_file}")
    
    # Summary
    print(f"\n📊 ANALYSIS SUMMARY")
    print("=" * 80)
    for filename, result in all_results.items():
        if result:
            print(f"📁 {filename}:")
            print(f"  📊 Sheets: {result['sheet_count']}")
            for sheet_name, sheet_data in result['sheets'].items():
                if 'error' not in sheet_data:
                    dims = sheet_data['dimensions']
                    print(f"    📋 {sheet_name}: {dims['rows']} rows × {dims['columns']} cols")

if __name__ == "__main__":
    main()
