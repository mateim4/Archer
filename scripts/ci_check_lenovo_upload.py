#!/usr/bin/env python3
"""
Simple CI check: Upload the Lenovo sample workbook to the running backend and
assert that processors have numeric core_count and frequency_ghz populated.
Exits with non-zero code on failure so it can be used in CI.
"""
import sys
from pathlib import Path
import urllib.request
import uuid
import json

URL = "http://127.0.0.1:3001/api/hardware-baskets/upload"
FILE = Path(__file__).resolve().parents[1] / 'docs' / 'X86 Basket Q3 2025 v2 Lenovo Only.xlsx'

if not FILE.exists():
    print(f"ERROR: sample file not found at {FILE}")
    sys.exit(2)

def post_multipart(url: str, file_path: Path, field_name: str = 'file'):
    boundary = uuid.uuid4().hex
    filename = file_path.name
    content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    CRLF = '\r\n'

    with file_path.open('rb') as fh:
        file_data = fh.read()

    parts = []
    parts.append(f'--{boundary}'.encode())
    parts.append(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"'.encode())
    parts.append(f'Content-Type: {content_type}'.encode())
    parts.append(b'')
    parts.append(file_data)
    parts.append(f'--{boundary}--'.encode())

    body = CRLF.encode().join(parts)

    req = urllib.request.Request(url, data=body)
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Content-Length', str(len(body)))

    with urllib.request.urlopen(req, timeout=120) as resp:
        status = resp.getcode()
        text = resp.read().decode('utf-8')
    return status, text

print(f"Uploading {FILE} -> {URL}")
status, text = post_multipart(URL, FILE)

if status != 200:
    print(f"Upload failed: status={status}\n{text}")
    sys.exit(3)

data = json.loads(text)
servers = data.get('servers', [])
print(f"Total servers returned: {len(servers)}")

count_with_both = 0
examples = []
for s in servers:
    specs = s.get('specifications') or {}
    p = specs.get('processor')
    if not p:
        continue
    if p.get('core_count') is not None and p.get('frequency_ghz') is not None:
        count_with_both += 1
        if len(examples) < 6:
            examples.append({
                'model': p.get('model'),
                'core_count': p.get('core_count'),
                'frequency_ghz': p.get('frequency_ghz')
            })

print(f"Processors with both core_count and frequency_ghz: {count_with_both}")
if examples:
    print("Examples:")
    for e in examples:
        print(" -", e)

MIN_EXPECTED = 5
if count_with_both < MIN_EXPECTED:
    print(f"FAIL: expected at least {MIN_EXPECTED} processor specs with numeric fields, got {count_with_both}")
    sys.exit(4)

print("PASS: Lenovo upload processor numeric fields verification succeeded.")
sys.exit(0)
