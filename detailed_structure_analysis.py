#!/usr/bin/env python3

import pandas as pd
import json
from pathlib import Path

def analyze_dell_structure(file_path):
    """Analyze the detailed structure of Dell Excel file"""
    print(f"🔍 Analyzing Dell file structure: {file_path}")
    
    # Read the main data sheet
    df = pd.read_excel(file_path, sheet_name='Dell Lot Pricing', header=None)
    
    print(f"📊 Dell Lot Pricing sheet: {len(df)} rows x {len(df.columns)} columns")
    
    # Find header row (should be row 3)
    header_row = 3
    headers = df.iloc[header_row].tolist()
    print(f"📝 Headers at row {header_row}: {headers}")
    
    # Extract actual data starting after headers
    data_start = header_row + 1
    data_df = df.iloc[data_start:].copy()
    data_df.columns = headers
    
    # Find rows with lot descriptions (SMI1, SMI2, etc.)
    lot_rows = data_df[data_df.iloc[:, 0].str.contains('SM[IA][12]', na=False, regex=True)]
    print(f"🎯 Found {len(lot_rows)} lot description rows:")
    
    for idx, row in lot_rows.iterrows():
        print(f"  Row {idx}: {row.iloc[0]} | {row.iloc[1]} | Prices: ${row.iloc[4]} / €{row.iloc[5]}")
    
    # Analyze structure around each lot
    for idx, row in lot_rows.iterrows():
        lot_name = row.iloc[0]
        print(f"\n🔍 Analyzing structure around lot: {lot_name} (row {idx})")
        
        # Get 10 rows after this lot to see the configuration items
        config_rows = data_df.iloc[idx+1:idx+11]
        non_empty_configs = config_rows.dropna(subset=[config_rows.columns[1]])
        
        print(f"  📋 Configuration items ({len(non_empty_configs)} found):")
        for i, config_row in non_empty_configs.iterrows():
            item_type = config_row.iloc[1] if pd.notna(config_row.iloc[1]) else "N/A"
            specification = config_row.iloc[2] if pd.notna(config_row.iloc[2]) else "N/A"
            price_usd = config_row.iloc[4] if pd.notna(config_row.iloc[4]) else "N/A"
            print(f"    Row {i}: {item_type} | {specification} | ${price_usd}")
    
    return data_df

def analyze_lenovo_structure(file_path):
    """Analyze the detailed structure of Lenovo Excel file"""
    print(f"\n🔍 Analyzing Lenovo file structure: {file_path}")
    
    # Read the main data sheet
    df = pd.read_excel(file_path, sheet_name='Lenovo X86 Server Lots', header=None)
    
    print(f"📊 Lenovo X86 Server Lots sheet: {len(df)} rows x {len(df.columns)} columns")
    
    # Find header row (should be row 3)
    header_row = 3
    headers = df.iloc[header_row].tolist()
    print(f"📝 Headers at row {header_row}: {headers}")
    
    # Extract actual data starting after headers
    data_start = header_row + 1
    data_df = df.iloc[data_start:].copy()
    data_df.columns = headers
    
    # Find rows with part numbers (first 20 data rows)
    part_rows = data_df.dropna(subset=[data_df.columns[0]]).head(20)
    print(f"🎯 First 20 part number rows:")
    
    for idx, row in part_rows.iterrows():
        part_num = row.iloc[0] if pd.notna(row.iloc[0]) else "N/A"
        description = row.iloc[1] if pd.notna(row.iloc[1]) else "N/A"
        quantity = row.iloc[2] if pd.notna(row.iloc[2]) else "N/A"
        price_usd = row.iloc[3] if pd.notna(row.iloc[3]) else "N/A"
        print(f"  Row {idx}: {part_num} | {description} | Qty: {quantity} | ${price_usd}")
    
    return data_df

def main():
    """Main analysis function"""
    print("🚀 Starting detailed structure analysis...")
    
    dell_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    lenovo_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    # Analyze Dell structure
    try:
        dell_data = analyze_dell_structure(dell_file)
        print(f"✅ Dell analysis complete: {len(dell_data)} data rows processed")
    except Exception as e:
        print(f"❌ Error analyzing Dell file: {e}")
    
    # Analyze Lenovo structure
    try:
        lenovo_data = analyze_lenovo_structure(lenovo_file)
        print(f"✅ Lenovo analysis complete: {len(lenovo_data)} data rows processed")
    except Exception as e:
        print(f"❌ Error analyzing Lenovo file: {e}")

if __name__ == "__main__":
    main()
