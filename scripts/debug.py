#!/usr/bin/env python3
import json
import urllib.request

BASE = "http://localhost:3001"

def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = json.dumps(data).encode() if data else (b"{}" if method == "POST" else None)
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()[:300]}

# Login
login = api("POST", "/api/auth/login", {"email": "admin@flowers.com", "password": "FlowerAdmin2024!"})
TOKEN = login["data"]["accessToken"]
print("Logged in")

# Check all categories
cats = api("GET", "/api/category", token=TOKEN)
print("\nCategories:", len(cats.get("data", [])))
for c in cats.get("data", []):
    print("  id={} name={} status={}".format(c.get("id", "?")[:8], c.get("data", {}).get("name", c.get("name", "?")), c.get("status", "?")))

# Check all posts
posts = api("GET", "/api/post", token=TOKEN)
print("\nPosts:", len(posts.get("data", [])))
for p in posts.get("data", []):
    print("  id={} title={} status={}".format(p.get("id", "?")[:8], p.get("data", {}).get("title", p.get("title", "?")), p.get("status", "?")))

# Publish all categories and posts
for c in cats.get("data", []):
    if c.get("status") != "published":
        cid = c["id"]
        r = api("POST", "/api/category/" + cid + "/publish", {}, TOKEN)
        name = c.get("data", {}).get("name", "?")
        if "error" in r:
            print("  FAIL publish cat:", name, r["error"][:100])
        else:
            print("  Published cat:", name)

for p in posts.get("data", []):
    if p.get("status") != "published":
        pid = p["id"]
        r = api("POST", "/api/post/" + pid + "/publish", {}, TOKEN)
        title = p.get("data", {}).get("title", "?")
        if "error" in r:
            print("  FAIL publish post:", title, r["error"][:100])
        else:
            print("  Published post:", title)

# Verify with frontend token
with open("/root/wolent-cms/.frontend-token") as f:
    ft = f.read().strip()

fcats = api("GET", "/api/category?status=published", token=ft)
fposts = api("GET", "/api/post?status=published", token=ft)
print("\n=== Frontend View ===")
print("Categories:", len(fcats.get("data", [])))
print("Posts:", len(fposts.get("data", [])))
for p in fposts.get("data", []):
    print("  {} ({})".format(p.get("data", {}).get("title", p.get("title", "?")), p.get("status", "?")))
