#!/usr/bin/env python3
import json, urllib.request

with open("/root/wolent-cms/.frontend-token") as f:
    FTOKEN = f.read().strip()

def get(path):
    req = urllib.request.Request("http://localhost:3001" + path, headers={"Authorization": "Bearer " + FTOKEN})
    return json.loads(urllib.request.urlopen(req).read())

cats = get("/api/category?status=published")
posts = get("/api/post?status=published")

print("=== Categories ===")
for c in cats.get("data", []):
    print("  {} {} ({})".format(c.get("icon", ""), c["name"], c["slug"]))

print("\n=== Posts ===")
for p in posts.get("data", []):
    print("  {} ({})".format(p["title"], p["slug"]))

print("\nTotal: {} categories, {} posts".format(len(cats.get("data",[])), len(posts.get("data",[]))))
