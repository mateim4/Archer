#!/usr/bin/env python3
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

URL = "http://localhost:3001/api/admin/cleanup"

def main():
    req = Request(URL, method="POST")
    req.add_header("Content-Type", "application/json")
    try:
        with urlopen(req, data=b"{}") as resp:
            body = resp.read().decode("utf-8")
            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}
            print("Cleanup response:", json.dumps(data, indent=2))
    except HTTPError as e:
        print(f"HTTP {e.code}: {e.reason}")
        try:
            print(e.read().decode("utf-8"))
        except Exception:
            pass
        sys.exit(1)
    except URLError as e:
        print(f"Failed to reach {URL}: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
