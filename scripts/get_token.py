#!/usr/bin/env python3
import json, urllib.request

# Login
login_data = json.dumps({"email":"admin@flowers.com","password":"FlowerAdmin2024!"}).encode()
req = urllib.request.Request("http://localhost:3001/api/auth/login", data=login_data, headers={"Content-Type":"application/json"})
resp = json.loads(urllib.request.urlopen(req).read())
admin_token = resp["data"]["accessToken"]
print("Admin token length:", len(admin_token))

# List existing API tokens
req2 = urllib.request.Request("http://localhost:3001/api/admin/api-tokens", headers={"Authorization":"Bearer " + admin_token})
tokens = json.loads(urllib.request.urlopen(req2).read())
print("\nExisting tokens:")
for t in tokens.get("data", []):
    name = t.get("name", "?")
    tok_type = t.get("type", "?")
    tok_id = t.get("id", "?")[:8]
    print("  {} - {} - type: {}".format(tok_id, name, tok_type))
    for key in ["accessToken", "token"]:
        if t.get(key):
            print("    {}: {}...".format(key, t[key][:30]))

# Create new read-only token
print("\nCreating new frontend token...")
body = json.dumps({"name":"Blog Frontend 2","description":"Read-only for flower blog","type":"read-only"}).encode()
req3 = urllib.request.Request("http://localhost:3001/api/admin/api-tokens", data=body,
    headers={"Content-Type":"application/json","Authorization":"Bearer " + admin_token}, method="POST")
try:
    new_tok = json.loads(urllib.request.urlopen(req3).read())
    data = new_tok.get("data", {})
    tok = data.get("accessToken") or data.get("token") or "NO TOKEN FOUND"
    print("New token: " + tok)
    with open("/root/wolent-cms/.frontend-token", "w") as f:
        f.write(tok)
    print("Saved to .frontend-token")
except urllib.error.HTTPError as e:
    print("Error:", e.read().decode()[:300])
