#!/usr/bin/env python3
import pandas as pd
import sys

def quick_analyze(filepath):
    print(f"\n{'='*60}")
    print(f"ANALYZING: {filepath}")
    print(f"{'='*60}")
    
    try:
        # Get sheet names
        excel_file = pd.ExcelFile(filepath)
        sheets = excel_file.sheet_names
        print(f"Sheets ({len(sheets)}): {sheets}")
        
        # Analyze each sheet
        for sheet_name in sheets:
            print(f"\n--- SHEET: {sheet_name} ---")
            df = pd.read_excel(filepath, sheet_name=sheet_name)
            print(f"Shape: {df.shape}")
            print(f"Columns: {list(df.columns)}")
            
            # Show first few rows
            print("\nFirst 3 rows:")
            print(df.head(3).to_string())
            
            # Show data types
            print(f"\nData types:")
            for col in df.columns:
                print(f"  {col}: {df[col].dtype}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dell_file = "/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    lenovo_file = "/Users/mateimarcu/Documents/Atos/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    quick_analyze(dell_file)
    quick_analyze(lenovo_file)
