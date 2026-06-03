#!/usr/bin/env python3
"""Fix content types and seed data for flower blog"""
import json
import urllib.request

BASE = "http://localhost:3001"

def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    body = json.dumps(data).encode() if data else (b"" if method in ("DELETE", "POST") else None)
    req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print("  ERROR {}: {}".format(e.code, err[:300]))
        return None

# Login
print("Logging in...")
login = api("POST", "/api/auth/login", {"email": "admin@flowers.com", "password": "FlowerAdmin2024!"})
if not login:
    exit(1)
TOKEN = login["data"]["accessToken"]
print("Logged in")

# Update Category content type with correct schema
print("\nUpdating Category content type...")
cat_ct = api("PUT", "/api/content-types/api::category.category", {
    "schema": {
        "attributes": {
            "name": {"name": "name", "type": "string", "required": True},
            "slug": {"name": "slug", "type": "uid", "required": True},
            "description": {"name": "description", "type": "text"},
            "color": {"name": "color", "type": "string"},
            "icon": {"name": "icon", "type": "string"}
        }
    }
}, TOKEN)
if cat_ct:
    print("  Category updated")
else:
    print("  Category update failed")

# Update Post content type
print("\nUpdating Post content type...")
post_ct = api("PUT", "/api/content-types/api::post.post", {
    "schema": {
        "attributes": {
            "title": {"name": "title", "type": "string", "required": True},
            "slug": {"name": "slug", "type": "uid", "required": True},
            "excerpt": {"name": "excerpt", "type": "text"},
            "content": {"name": "content", "type": "richtext", "required": True},
            "coverImage": {"name": "coverImage", "type": "media", "multiple": False, "allowedTypes": ["images"]},
            "category": {"name": "category", "type": "relation", "relation": "manyToOne", "targetType": "api::category.category"},
            "tags": {"name": "tags", "type": "json"},
            "author": {"name": "author", "type": "string"},
            "readTime": {"name": "readTime", "type": "number_int"}
        }
    }
}, TOKEN)
if post_ct:
    print("  Post updated")
else:
    print("  Post update failed")

# Seed categories
print("\nSeeding categories...")
categories = [
    {"name": "Gul", "slug": "gul", "description": "Gul turleri ve bakimi", "color": "#e11d48", "icon": "🌹"},
    {"name": "Orkide", "slug": "orkide", "description": "Orkide cesitleri ve bakimi", "color": "#a855f7", "icon": "🌸"},
    {"name": "Lale", "slug": "lale", "description": "Lale sogani ve yetistirme", "color": "#f59e0b", "icon": "🌷"},
    {"name": "Papatya", "slug": "papatya", "description": "Papatya turleri ve faydalari", "color": "#fbbf24", "icon": "🌼"},
    {"name": "Sumbul", "slug": "sumbul", "description": "Sumbul bakimi", "color": "#6366f1", "icon": "💐"},
    {"name": "Menekse", "slug": "menekse", "description": "Menekse yetistirme", "color": "#8b5cf6", "icon": "💜"},
]

for cat in categories:
    resp = api("POST", "/api/category", cat, TOKEN)
    if resp:
        cid = resp["data"]["id"]
        api("POST", "/api/category/" + cid + "/publish", {}, TOKEN)
        print("  OK: " + cat["name"])
    else:
        print("  FAIL: " + cat["name"])

# Seed posts
print("\nSeeding posts...")
posts_data = [
    {
        "title": "Gul Bakimi: Adim Adim Rehber",
        "slug": "gul-bakimi-rehber",
        "excerpt": "Gullerinizi en guzel haliyle yetistirmek icin bilmeniz gereken her sey.",
        "content": "<h2>Gul Bakimi Nasil Yapilir?</h2><p>Guller, dunyanin en populer ciceklerinden biridir.</p><h3>1. Toprak Secimi</h3><p>Iyi drene olan toprak idealdir.</p><h3>2. Sulama</h3><p>Haftada 2-3 kez sulayin.</p>",
        "author": "Admin",
        "tags": ["gul", "bakim", "bahce"],
        "readTime": 5
    },
    {
        "title": "Orkide Cesitleri ve Bakim Ipuclari",
        "slug": "orkide-cesitleri-bakim",
        "excerpt": "Phalaenopsisden dendrobiuma en populer orkide turleri.",
        "content": "<h2>Orkide Dunyasi</h2><p>25.000den fazla turu vardir.</p><h3>Phalaenopsis</h3><p>Bakimi en kolay orkide turudur.</p>",
        "author": "Admin",
        "tags": ["orkide", "cicek", "ev bitkisi"],
        "readTime": 7
    },
    {
        "title": "Bahar Aylarinda Dikilecek Cicekler",
        "slug": "bahar-dikilecek-cicekler",
        "excerpt": "Bahcenizi renklendirecek en guzel bahar cicekleri.",
        "content": "<h2>Bahar Cicekleri</h2><p>Bahar, doganin yeniden canlandigi mevsimdir.</p><h3>Lale</h3><p>Sonbaharda dikilir.</p>",
        "author": "Admin",
        "tags": ["bahar", "dikim", "bahce"],
        "readTime": 4
    },
    {
        "title": "Papatya Cayi ve Saglik Faydalari",
        "slug": "papatya-cayi-faydalari",
        "excerpt": "Papatya cayinin faydalari.",
        "content": "<h2>Papatya Cayinin Faydalari</h2><p>Papatya, yuzyillardir kullanilir.</p><h3>Rahatlatici Etki</h3><p>Dogal bir rahatlaticidir.</p>",
        "author": "Admin",
        "tags": ["papatya", "saglik", "cay"],
        "readTime": 6
    },
    {
        "title": "Sukulent Bakimi: Baslangic Rehberi",
        "slug": "sukulent-bakimi-baslangic",
        "excerpt": "Sukulent yetistirmeye yeni baslayanlar icin rehber.",
        "content": "<h2>Sukulent Nedir?</h2><p>Yapraklarinda su depolan bitkilerdir.</p><h3>Isik</h3><p>Parlak dolayli isigi sever.</p>",
        "author": "Admin",
        "tags": ["sukulent", "ev bitkisi"],
        "readTime": 3
    },
    {
        "title": "Menekse Yetistirme Sanati",
        "slug": "menekse-yetistirme",
        "excerpt": "Afrika menekselerinin bakimi.",
        "content": "<h2>Afrika Meneksesi</h2><p>Renkli cicekleriyle populerdir.</p><h3>Ortam</h3><p>18-24 derece idealdir.</p>",
        "author": "Admin",
        "tags": ["menekse", "ev bitkisi", "cicek"],
        "readTime": 5
    },
]

for post in posts_data:
    resp = api("POST", "/api/post", post, TOKEN)
    if resp:
        pid = resp["data"]["id"]
        api("POST", "/api/post/" + pid + "/publish", {}, TOKEN)
        print("  OK: " + post["title"])
    else:
        print("  FAIL: " + post["title"])

# Verify
print("\nVerifying...")
cats = api("GET", "/api/category", token=TOKEN)
posts = api("GET", "/api/post", token=TOKEN)
cat_count = len(cats.get("data", [])) if cats else 0
post_count = len(posts.get("data", [])) if posts else 0
print("  Categories: " + str(cat_count))
print("  Posts: " + str(post_count))

# Read frontend token
with open("/root/wolent-cms/.frontend-token") as f:
    ft = f.read().strip()
print("\nFrontend API Token: " + ft)
print("Done!")
