#!/usr/bin/env python3
"""
Integration test: Upload Lenovo workbook, then for each model that has extensions,
verify each extension resolves to an existing hardware_configuration record via
GET /api/hardware-configurations/:id
"""
import sys, json, uuid, urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:3001"
UPLOAD_URL = BASE + "/api/hardware-baskets/upload"
SAMPLE = Path(__file__).resolve().parents[1] / 'docs' / 'X86 Basket Q3 2025 v2 Lenovo Only.xlsx'

if not SAMPLE.exists():
    print("ERROR: sample file not found", SAMPLE)
    sys.exit(2)

# multipart helper
import uuid

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

print(f"Uploading {SAMPLE} -> {UPLOAD_URL}")
status, text = post_multipart(UPLOAD_URL, SAMPLE)
if status != 200:
    print("Upload failed:", status)
    print(text)
    sys.exit(3)

resp = json.loads(text)
print("Upload response: models_count=", resp.get('models_count'), "configs=", resp.get('configurations_count'))

# find Lenovo basket
baskets_txt = urllib.request.urlopen(BASE + '/api/hardware-baskets').read().decode('utf-8')
baskets = json.loads(baskets_txt)
if not baskets:
    print('No baskets found after upload')
    sys.exit(4)

basket = None
for b in baskets:
    if b.get('vendor', '').lower() == 'lenovo':
        basket = b
        break

if not basket:
    print('No Lenovo basket found')
    sys.exit(5)

basket_id = basket['id']
if isinstance(basket_id, dict) and basket_id.get('id'):
    inner = basket_id['id']
    if isinstance(inner, dict) and inner.get('String'):
        basket_str = inner['String']
    else:
        basket_str = str(inner)
else:
    basket_str = str(basket_id)

models_txt = urllib.request.urlopen(f"{BASE}/api/hardware-baskets/{basket_str}/models").read().decode('utf-8')
models = json.loads(models_txt)
print('Found', len(models), 'models')

failures = []
checked = 0
for m in models:
    exts = m.get('extensions') or []
    if not exts:
        continue
    for e in exts:
        # e may be a string like "hardware_configuration:xxxx" or an object; normalize
        if isinstance(e, str):
            # strip prefix if present
            if ':' in e:
                _, eid = e.split(':', 1)
            else:
                eid = e
        elif isinstance(e, dict):
            # try to extract id field inside the Thing
            if e.get('id'):
                if isinstance(e['id'], dict) and e['id'].get('String'):
                    eid = e['id']['String']
                else:
                    eid = str(e['id'])
            else:
                # fallback to stringifying
                eid = str(e)
        else:
            eid = str(e)

        checked += 1
        cfg_url = f"{BASE}/api/hardware-configurations/{eid}"
        try:
            resp = urllib.request.urlopen(cfg_url)
            if resp.getcode() != 200:
                failures.append((eid, resp.getcode()))
            else:
                # Optionally parse body
                _ = json.loads(resp.read().decode('utf-8'))
        except Exception as ex:
            failures.append((eid, str(ex)))

print(f"Checked {checked} configuration references")
if failures:
    print('FAILURES:')
    for f in failures:
        print(f)
    sys.exit(6)

print('PASS: all referenced configurations exist')
sys.exit(0)
