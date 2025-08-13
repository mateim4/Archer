import pandas as pd
import json

def examine_actual_data():
    """Examine the actual data structure and content of the primary sheets"""
    
    dell_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Dell Only.xlsx"
    lenovo_file = "/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    
    print("🔍 EXAMINING ACTUAL DATA CONTENT...")
    print("="*80)
    
    # Dell Lot Pricing - the primary sheet
    print("\n📊 DELL LOT PRICING - Sample Data:")
    print("-"*50)
    try:
        df_dell = pd.read_excel(dell_file, sheet_name='Dell Lot Pricing')
        print(f"📏 Total rows: {len(df_dell)}")
        print(f"📏 Total columns: {len(df_dell.columns)}")
        print(f"🏷️  Column names: {list(df_dell.columns)}")
        
        # Show header row (should be row 2, index 2)
        print(f"\n🏷️  Header row (row 3): {df_dell.iloc[2].tolist()}")
        
        # Show first few data rows
        print(f"\n📊 First 5 data rows:")
        for i in range(3, min(8, len(df_dell))):
            row_data = df_dell.iloc[i].fillna('').tolist()
            print(f"  Row {i+1}: {row_data[:8]}...")  # First 8 columns
            
        # Check for lot groupings - look for patterns
        print(f"\n🔍 Looking for lot patterns...")
        lot_col = df_dell.iloc[2:].iloc[:, 0]  # First column after header
        non_empty_lots = lot_col.dropna()
        print(f"  Non-empty lot descriptions: {len(non_empty_lots)}")
        print(f"  Sample lot descriptions: {non_empty_lots.head(10).tolist()}")
        
    except Exception as e:
        print(f"❌ Error reading Dell file: {e}")
    
    # Lenovo X86 Server Lots - the primary sheet  
    print("\n📊 LENOVO X86 SERVER LOTS - Sample Data:")
    print("-"*50)
    try:
        df_lenovo = pd.read_excel(lenovo_file, sheet_name='Lenovo X86 Server Lots')
        print(f"📏 Total rows: {len(df_lenovo)}")
        print(f"📏 Total columns: {len(df_lenovo.columns)}")
        print(f"🏷️  Column names: {list(df_lenovo.columns)}")
        
        # Show header row (should be row 2, index 2)
        print(f"\n🏷️  Header row (row 3): {df_lenovo.iloc[2].tolist()}")
        
        # Show first few data rows
        print(f"\n📊 First 5 data rows:")
        for i in range(3, min(8, len(df_lenovo))):
            row_data = df_lenovo.iloc[i].fillna('').tolist()
            print(f"  Row {i+1}: {row_data}")
            
        # Check for part number patterns
        print(f"\n🔍 Looking for part number patterns...")
        part_col = df_lenovo.iloc[2:].iloc[:, 0]  # First column after header
        non_empty_parts = part_col.dropna()
        print(f"  Non-empty part numbers: {len(non_empty_parts)}")
        print(f"  Sample part numbers: {non_empty_parts.head(10).tolist()}")
        
    except Exception as e:
        print(f"❌ Error reading Lenovo file: {e}")
    
    # Check Dell Options and Upgrades
    print("\n📊 DELL OPTIONS AND UPGRADES - Sample Data:")
    print("-"*50)
    try:
        df_dell_opts = pd.read_excel(dell_file, sheet_name='Dell Options and Upgrades')
        print(f"📏 Total rows: {len(df_dell_opts)}")
        print(f"🏷️  Header row (row 4): {df_dell_opts.iloc[3].tolist()}")
        
        # Show sample data rows
        print(f"\n📊 Sample data rows:")
        for i in range(5, min(10, len(df_dell_opts))):
            if not df_dell_opts.iloc[i].isna().all():
                row_data = df_dell_opts.iloc[i].fillna('').tolist()
                print(f"  Row {i+1}: {row_data}")
        
    except Exception as e:
        print(f"❌ Error reading Dell options: {e}")

if __name__ == "__main__":
    examine_actual_data()
