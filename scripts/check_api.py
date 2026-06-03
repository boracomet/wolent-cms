#!/usr/bin/env python3
import json, urllib.request

with open("/root/wolent-cms/.frontend-token") as f:
    ft = f.read().strip()

# Check post data structure
req = urllib.request.Request("http://localhost:3001/api/post?status=published", headers={"Authorization":"Bearer " + ft})
posts = json.loads(urllib.request.urlopen(req).read())
print("=== Posts ===")
for p in posts.get("data", []):
    print("slug={} title={}".format(p.get("slug","?"), p.get("title","?")))

# Test filter
print("\n=== Filter test ===")
req2 = urllib.request.Request("http://localhost:3001/api/post?status=published&filters[slug][$eq]=gul-bakimi-rehber", headers={"Authorization":"Bearer " + ft})
filtered = json.loads(urllib.request.urlopen(req2).read())
print("Filtered results:", len(filtered.get("data",[])))
for p in filtered.get("data",[]):
    print("  slug={} title={}".format(p.get("slug","?"), p.get("title","?")))

# Check if data is nested
first = posts["data"][0] if posts.get("data") else {}
print("\n=== First post keys ===")
print(list(first.keys()))
if "data" in first:
    print("Nested data keys:", list(first["data"].keys()))
    print("Nested title:", first["data"].get("title"))
    print("Nested slug:", first["data"].get("slug"))
