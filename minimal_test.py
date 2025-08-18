print("Starting Lenovo test...")

try:
    import pandas as pd
    print("✅ Pandas imported")
    
    file_path = "/Users/mateimarcu/DevApps/LCMDesigner/docs/X86 Basket Q3 2025 v2 Lenovo Only.xlsx"
    df = pd.read_excel(file_path, sheet_name='Lenovo X86 Server Lots', header=None)
    print(f"✅ File loaded: {df.shape}")
    
    # Look at the first 10 rows around the header
    print("\n📋 Sample data:")
    for i in range(3, min(10, df.shape[0])):
        row_data = df.iloc[i].fillna('').astype(str).tolist()[:5]  # First 5 columns
        print(f"Row {i}: {row_data}")
    
    print("\n✅ Test completed successfully")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
