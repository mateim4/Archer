#!/usr/bin/env python3
"""
Examine Lenovo Excel file structure to understand parsing issues
"""
import pandas as pd
import json
from pathlib import Path

def analyze_lenovo_excel():
    """Examine the Lenovo Excel file to understand why parsing is failing"""
    
    lenovo_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(lenovo_file).exists():
        print(f"❌ File not found: {lenovo_file}")
        return
    
    print("🔍 ANALYZING LENOVO EXCEL FILE STRUCTURE")
    print("=" * 70)
    
    # Read all sheets
    excel_file = pd.ExcelFile(lenovo_file)
    print(f"📄 Available sheets: {excel_file.sheet_names}")
    
    for sheet_name in excel_file.sheet_names:
        print(f"\n📊 SHEET: {sheet_name}")
        print("-" * 50)
        
        try:
            df = pd.read_excel(lenovo_file, sheet_name=sheet_name, header=None)
            print(f"   Dimensions: {df.shape[0]} rows x {df.shape[1]} columns")
            
            # Show first 10 rows to understand structure
            print("   First 10 rows:")
            for i in range(min(10, len(df))):
                row_data = [str(df.iloc[i, j]) if j < df.shape[1] and pd.notna(df.iloc[i, j]) else "" 
                           for j in range(min(10, df.shape[1]))]
                non_empty = [cell for cell in row_data if cell.strip()]
                if non_empty:  # Only show rows with content
                    print(f"     Row {i}: {non_empty[:5]}...")  # Show first 5 non-empty cells
                    
            # Look for potential header rows
            print("\n   🔍 POTENTIAL HEADER ROWS:")
            for i in range(min(20, len(df))):
                row_data = [str(df.iloc[i, j]).lower() if j < df.shape[1] and pd.notna(df.iloc[i, j]) else "" 
                           for j in range(df.shape[1])]
                hardware_terms = sum(1 for cell in row_data if any(term in cell for term in [
                    'lot', 'description', 'item', 'specification', 'price', 'model', 'sku', 'part', 'quantity'
                ]))
                if hardware_terms >= 3:
                    print(f"     Row {i} (Score: {hardware_terms}): {[cell for cell in row_data if cell][:8]}")
                    
        except Exception as e:
            print(f"   ❌ Error reading sheet: {e}")

if __name__ == "__main__":
    analyze_lenovo_excel()
