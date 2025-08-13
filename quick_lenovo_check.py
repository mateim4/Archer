#!/usr/bin/env python3

import pandas as pd

# Quick Lenovo analysis
df = pd.read_excel('/home/mateim/Downloads/work/Hardware BOM/X86 Basket Q3 2025 v2 Lenovo Only.xlsx', 
                   sheet_name='Lenovo X86 Server Lots', header=None)

print("🔍 Lenovo X86 Server Lots Analysis")
print(f"📊 Total rows: {len(df)}, columns: {len(df.columns)}")

print("\n📝 First 10 rows:")
for i in range(10):
    row_data = df.iloc[i].tolist()
    print(f"Row {i}: {row_data}")

print("\n📝 Row 3 (headers):")
headers = df.iloc[3].tolist()
print(headers)

print("\n📝 Data starting from row 4:")
for i in range(4, 14):  # Show rows 4-13
    row_data = df.iloc[i].tolist()
    print(f"Row {i}: {row_data}")
