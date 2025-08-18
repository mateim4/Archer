#!/usr/bin/env python3
"""
Deep dive into Lenovo X86 Server Lots sheet structure
"""
import pandas as pd
import json
from pathlib import Path

def analyze_lenovo_lots_sheet():
    """Examine the specific Lenovo X86 Server Lots sheet structure"""
    
    lenovo_file = "/mnt/Mew2/DevApps/LCMDesigner/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    if not Path(lenovo_file).exists():
        print(f"❌ File not found: {lenovo_file}")
        return
    
    print("🔍 DEEP ANALYSIS: Lenovo X86 Server Lots Sheet")
    print("=" * 70)
    
    # Read the specific sheet with detailed analysis
    df = pd.read_excel(lenovo_file, sheet_name='Lenovo X86 Server Lots', header=None)
    print(f"📊 Sheet dimensions: {df.shape[0]} rows x {df.shape[1]} columns")
    
    # Show first 30 rows to understand the structure better
    print("\n📋 FIRST 30 ROWS (with row numbers):")
    print("-" * 80)
    for i in range(min(30, len(df))):
        row_data = []
        for j in range(df.shape[1]):
            if j < df.shape[1] and pd.notna(df.iloc[i, j]):
                cell_value = str(df.iloc[i, j])
                if cell_value.strip():
                    row_data.append(f"Col{j}: {cell_value[:50]}...")  # Truncate long values
        
        if row_data:  # Only show rows with content
            print(f"Row {i:2d}: {' | '.join(row_data[:4])}")  # Show first 4 columns
    
    # Look for the actual header row (should be row 3 based on output)
    print(f"\n🔍 DETAILED HEADER ANALYSIS (Row 3):")
    print("-" * 50)
    if len(df) > 3:
        for j in range(df.shape[1]):
            if j < df.shape[1] and pd.notna(df.iloc[3, j]):
                header_value = str(df.iloc[3, j])
                print(f"  Column {j}: '{header_value}'")
    
    # Show some data rows after the header
    print(f"\n📊 SAMPLE DATA ROWS (5-15):")
    print("-" * 50)
    for i in range(5, min(16, len(df))):
        row_data = []
        for j in range(min(8, df.shape[1])):  # Show first 8 columns
            if j < df.shape[1] and pd.notna(df.iloc[i, j]):
                cell_value = str(df.iloc[i, j])
                if cell_value.strip():
                    row_data.append(f"{cell_value[:30]}")  # Truncate for readability
        
        if row_data:
            print(f"Row {i:2d}: {' | '.join(row_data)}")
    
    # Look for patterns in the data that indicate server models vs components
    print(f"\n🔍 PATTERN ANALYSIS:")
    print("-" * 50)
    server_indicators = ['SR630', 'SR645', 'ThinkSystem', 'ThinkAgile']
    component_indicators = ['BLK', 'BF', 'BV', 'B9', 'Processor', 'Memory', 'DIMM', 'NIC']
    
    server_rows = []
    component_rows = []
    
    for i in range(5, min(50, len(df))):  # Check first 45 data rows
        row_text = ' '.join([str(df.iloc[i, j]) for j in range(df.shape[1]) if pd.notna(df.iloc[i, j])])
        if any(indicator in row_text for indicator in server_indicators):
            server_rows.append((i, row_text[:100] + "..."))
        elif any(indicator in row_text for indicator in component_indicators):
            component_rows.append((i, row_text[:100] + "..."))
    
    print(f"🖥️ POTENTIAL SERVER ROWS (first 10):")
    for i, (row_num, text) in enumerate(server_rows[:10]):
        print(f"  Row {row_num}: {text}")
    
    print(f"\n🔧 POTENTIAL COMPONENT ROWS (first 10):")
    for i, (row_num, text) in enumerate(component_rows[:10]):
        print(f"  Row {row_num}: {text}")

if __name__ == "__main__":
    analyze_lenovo_lots_sheet()
