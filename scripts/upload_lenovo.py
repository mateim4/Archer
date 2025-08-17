#!/usr/bin/env python3
import requests
import os

file_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'X86 Basket Q3 2025 v2 Lenovo Only.xlsx')
file_path = os.path.abspath(file_path)
url = 'http://127.0.0.1:3001/api/hardware-baskets/upload'

print('Uploading', file_path, 'to', url)
with open(file_path, 'rb') as f:
    files = {'file': (os.path.basename(file_path), f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    try:
        resp = requests.post(url, files=files, timeout=120)
        print('Status:', resp.status_code)
        try:
            print(resp.json())
        except Exception:
            print(resp.text)
    except Exception as e:
        print('Request failed:', e)
