#!/usr/bin/env python3
import pandas as pd
import sys
import openpyxl
import json
from pathlib import Path

def comprehensive_excel_analysis(filepath):
    """Analyze ALL data in ALL sheets of an Excel file"""
    print(f"🔍 COMPREHENSIVE Analysis of: {filepath}")
    analysis = {
        "file_path": filepath,
        "sheets": {},
        "summary": {
            "total_sheets": 0,
            "total_rows_across_sheets": 0,
            "data_heavy_sheets": [],
            "potential_main_data_sheets": []
        }
    }
    
    try:
        # Load workbook to get sheet names
        wb = openpyxl.load_workbook(filepath, read_only=True)
        sheet_names = wb.sheetnames
        analysis["summary"]["total_sheets"] = len(sheet_names)
        
        print(f"📋 Found {len(sheet_names)} sheets: {sheet_names}")
        
        for sheet_name in sheet_names:
            print(f"\n📊 FULL ANALYSIS of sheet: '{sheet_name}'")
            sheet_analysis = {
                "name": sheet_name,
                "total_rows": 0,
                "total_columns": 0,
                "non_empty_rows": 0,
                "headers_detected": [],
                "sample_data": [],
                "data_patterns": {},
                "column_analysis": {}
            }
            
            try:
                # Read WITHOUT nrows limit to get ALL data
                df = pd.read_excel(filepath, sheet_name=sheet_name, header=None)
                
                sheet_analysis["total_rows"] = len(df)
                sheet_analysis["total_columns"] = len(df.columns)
                
                # Count non-empty rows
                non_empty_rows = 0
                for idx, row in df.iterrows():
                    if not row.isna().all() and not (row.astype(str).str.strip() == '').all():
                        non_empty_rows += 1
                
                sheet_analysis["non_empty_rows"] = non_empty_rows
                analysis["summary"]["total_rows_across_sheets"] += non_empty_rows
                
                print(f"  📏 Dimensions: {sheet_analysis['total_rows']} total rows x {sheet_analysis['total_columns']} columns")
                print(f"  📄 Non-empty rows: {non_empty_rows}")
                
                # If this sheet has significant data, mark it
                if non_empty_rows > 50:
                    analysis["summary"]["data_heavy_sheets"].append(sheet_name)
                
                # Detect headers by looking at first few rows
                potential_headers = []
                for i in range(min(5, len(df))):
                    row_values = [str(val).strip() for val in df.iloc[i].values if pd.notna(val) and str(val).strip()]
                    if len(row_values) >= 3:  # Row with at least 3 non-empty values
                        # Check if it looks like headers (contains common header words)
                        header_indicators = ['name', 'price', 'model', 'part', 'description', 'qty', 'quantity', 'sku', 'type', 'category']
                        if any(indicator in ' '.join(row_values).lower() for indicator in header_indicators):
                            potential_headers.append({
                                "row_index": i,
                                "values": row_values[:10]  # First 10 values
                            })
                
                sheet_analysis["headers_detected"] = potential_headers
                
                # Sample data from different parts of the sheet
                sample_rows = []
                if len(df) > 0:
                    # First few rows
                    for i in range(min(3, len(df))):
                        row_data = [str(val) for val in df.iloc[i].values[:10]]  # First 10 columns
                        sample_rows.append({"position": f"row_{i}", "data": row_data})
                    
                    # Middle rows (if sheet is large)
                    if len(df) > 20:
                        mid_point = len(df) // 2
                        for i in range(mid_point, min(mid_point + 2, len(df))):
                            row_data = [str(val) for val in df.iloc[i].values[:10]]
                            sample_rows.append({"position": f"mid_row_{i}", "data": row_data})
                    
                    # Last few rows
                    if len(df) > 5:
                        for i in range(max(len(df) - 2, 0), len(df)):
                            row_data = [str(val) for val in df.iloc[i].values[:10]]
                            sample_rows.append({"position": f"end_row_{i}", "data": row_data})
                
                sheet_analysis["sample_data"] = sample_rows
                
                # Column analysis - look for data patterns
                for col_idx in range(min(20, len(df.columns))):  # Analyze first 20 columns
                    col_data = df.iloc[:, col_idx].dropna()
                    if len(col_data) > 0:
                        # Determine data type patterns
                        numeric_count = sum(pd.to_numeric(col_data, errors='coerce').notna())
                        text_count = len(col_data) - numeric_count
                        
                        sheet_analysis["column_analysis"][f"col_{col_idx}"] = {
                            "total_values": len(col_data),
                            "numeric_values": numeric_count,
                            "text_values": text_count,
                            "sample_values": [str(val) for val in col_data.head(5).values],
                            "is_mostly_numeric": numeric_count > text_count,
                            "has_currency_data": any('$' in str(val) or '€' in str(val) for val in col_data.head(10)),
                            "has_part_numbers": any(len(str(val)) > 5 and any(c.isdigit() for c in str(val)) for val in col_data.head(10))
                        }
                
                # Determine if this looks like a main data sheet
                main_sheet_indicators = 0
                if non_empty_rows > 100:
                    main_sheet_indicators += 2
                if len(potential_headers) > 0:
                    main_sheet_indicators += 2
                if any(col.get("has_currency_data", False) for col in sheet_analysis["column_analysis"].values()):
                    main_sheet_indicators += 1
                if any(col.get("has_part_numbers", False) for col in sheet_analysis["column_analysis"].values()):
                    main_sheet_indicators += 1
                
                if main_sheet_indicators >= 3:
                    analysis["summary"]["potential_main_data_sheets"].append(sheet_name)
                
                print(f"  ✅ Headers found: {len(potential_headers)}")
                print(f"  💰 Currency data detected: {any(col.get('has_currency_data', False) for col in sheet_analysis['column_analysis'].values())}")
                print(f"  🔢 Part numbers detected: {any(col.get('has_part_numbers', False) for col in sheet_analysis['column_analysis'].values())}")
                
            except Exception as e:
                print(f"  ❌ Error analyzing sheet '{sheet_name}': {e}")
                sheet_analysis["error"] = str(e)
            
            analysis["sheets"][sheet_name] = sheet_analysis
        
        wb.close()
        
        # Print summary
        print(f"\n🎯 ANALYSIS SUMMARY:")
        print(f"  📊 Total sheets: {analysis['summary']['total_sheets']}")
        print(f"  📄 Total data rows across all sheets: {analysis['summary']['total_rows_across_sheets']}")
        print(f"  🔥 Data-heavy sheets: {analysis['summary']['data_heavy_sheets']}")
        print(f"  🎯 Potential main data sheets: {analysis['summary']['potential_main_data_sheets']}")
        
        return analysis
        
    except Exception as e:
        print(f"❌ Error analyzing file: {e}")
        analysis["error"] = str(e)
        return analysis

def save_analysis(analysis, filename):
    """Save analysis to JSON file"""
    output_path = f"{filename}_analysis.json"
    with open(output_path, 'w') as f:
        json.dump(analysis, f, indent=2, default=str)
    print(f"💾 Analysis saved to: {output_path}")

if __name__ == "__main__":
    # Analyze the Dell and Lenovo files
    dell_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    lenovo_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    files_to_analyze = []
    
    # Check which files exist
    if Path(dell_file).exists():
        files_to_analyze.append(("dell", dell_file))
    if Path(lenovo_file).exists():
        files_to_analyze.append(("lenovo", lenovo_file))
    
    # Also check local test files
    local_files = [
        ("test_dell", "legacy-server/test-basket.xlsx"),
        ("test_hardware", "test-files/test-hardware-basket.xlsx")
    ]
    
    for name, path in local_files:
        if Path(path).exists():
            files_to_analyze.append((name, path))
    
    if not files_to_analyze:
        print("❌ No files found to analyze")
        sys.exit(1)
    
    print(f"🚀 Starting comprehensive analysis of {len(files_to_analyze)} files...\n")
    
    for name, filepath in files_to_analyze:
        print("="*80)
        analysis = comprehensive_excel_analysis(filepath)
        save_analysis(analysis, name)
        print()
