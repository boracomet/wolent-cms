#!/usr/bin/env python3
"""Seed content for flower blog via Wolent CMS API"""
import json
import urllib.request

BASE = "http://localhost:3001"

def api(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ERROR {e.code}: {err[:200]}")
        return None

# Login
print("🔐 Logging in...")
login = api("POST", "/api/auth/login", {"email": "admin@flowers.com", "password": "FlowerAdmin2024!"})
if not login:
    exit(1)
TOKEN = login["data"]["accessToken"]
print(f"✅ Logged in")

# Create API token for frontend
print("\n🔑 Creating frontend API token...")
tok = api("POST", "/api/admin/api-tokens", {"name": "Frontend Blog", "description": "Read-only for Next.js", "type": "read-only"}, TOKEN)
if tok:
    ft = tok["data"].get("accessToken") or tok["data"].get("token") or ""
    print(f"✅ Frontend token: {ft}")
    with open("/root/wolent-cms/.frontend-token", "w") as f:
        f.write(ft)
else:
    # Try to read existing
    existing = api("GET", "/api/admin/api-tokens", token=TOKEN)
    if existing and existing.get("data"):
        for t in existing["data"]:
            print(f"  Existing token: {t.get('name')} - type: {t.get('type')}")

# Create categories
print("\n📁 Creating categories...")
categories = [
    {"name": "Gül", "slug": "gul", "description": "Gül türleri ve bakımı", "color": "#e11d48", "icon": "🌹"},
    {"name": "Orkide", "slug": "orkide", "description": "Orkide çeşitleri ve bakımı", "color": "#a855f7", "icon": "🌸"},
    {"name": "Lale", "slug": "lale", "description": "Lale soğanı ve yetiştirme", "color": "#f59e0b", "icon": "🌷"},
    {"name": "Papatya", "slug": "papatya", "description": "Papatya türleri ve faydaları", "color": "#fbbf24", "icon": "🌼"},
    {"name": "Sümbül", "slug": "sumbul", "description": "Sümbül bakımı", "color": "#6366f1", "icon": "💐"},
    {"name": "Menekşe", "slug": "menekse", "description": "Menekşe yetiştirme", "color": "#8b5cf6", "icon": "💜"},
]

cat_ids = {}
for cat in categories:
    resp = api("POST", "/api/category", {"data": cat}, TOKEN)
    if resp:
        cid = resp["data"]["id"]
        cat_ids[cat["slug"]] = cid
        # Publish
        api("POST", f"/api/category/{cid}/publish", {}, TOKEN)
        print(f"  ✅ {cat['name']}")

# Create posts
print("\n📝 Creating posts...")
posts = [
    {
        "title": "Gül Bakımı: Adım Adım Rehber",
        "slug": "gul-bakimi-rehber",
        "excerpt": "Güllerinizi en güzel haliyle yetiştirmek için bilmeniz gereken her şey.",
        "content": "<h2>Gül Bakımı Nasıl Yapılır?</h2><p>Güller, dünyanın en popüler çiçeklerinden biridir. Doğru bakım ile bahçenizde muhteşem güller yetiştirebilirsiniz.</p><h3>1. Toprak Seçimi</h3><p>Güller için en ideal toprak, iyi drene olan ve organik maddece zengin topraktır. pH değeri 6.0-6.5 arasında olmalıdır.</p><h3>2. Sulama</h3><p>Gülleri haftada 2-3 kez derinlemesine sulayın. Sabah saatleri sulama için en ideal zamandır.</p><h3>3. Gübreleme</h3><p>İlkbahar ve yaz aylarında ayda bir kez gübreleme yapın.</p>",
        "author": "Admin",
        "tags": ["gül", "bakım", "bahçe"],
        "readTime": 5
    },
    {
        "title": "Orkide Çeşitleri ve Bakım İpuçları",
        "slug": "orkide-cesitleri-bakim",
        "excerpt": "Phalaenopsis'ten dendrobium'a, en popüler orkide türleri.",
        "content": "<h2>Orkide Dünyası</h2><p>Orkideler, 25.000'den fazla türü ile bitki dünyasının en büyük ailelerinden biridir.</p><h3>Phalaenopsis (Kelebek Orkide)</h3><p>En yaygın ve bakımı en kolay orkide türüdür. Yarı gölge ortamı sever.</p><h3>Dendrobium</h3><p>Daha fazla ışık gerektirir. Düzenli sulama önemlidir.</p>",
        "author": "Admin",
        "tags": ["orkide", "çiçek", "ev bitkisi"],
        "readTime": 7
    },
    {
        "title": "Bahar Aylarında Dikilecek Çiçekler",
        "slug": "bahar-dikilecek-cicekler",
        "excerpt": "Bahçenizi renklendirecek en güzel bahar çiçekleri.",
        "content": "<h2>Bahar Çiçekleri</h2><p>Bahar, doğanın yeniden canlandığı ve bahçelerin en güzel göründüğü mevsimdir.</p><h3>Lale</h3><p>Hollanda'nın simgesi olan laleler, sonbaharda soğanları dikilerek yetiştirilir.</p><h3>Sümbül</h3><p>Muhteşem kokusuyla bahar aylarının vazgeçilmezidir.</p>",
        "author": "Admin",
        "tags": ["bahar", "dikim", "bahçe"],
        "readTime": 4
    },
    {
        "title": "Papatya Çayı ve Sağlık Faydaları",
        "slug": "papatya-cayi-faydalari",
        "excerpt": "Papatya çayının bilimsel olarak kanıtlanmış faydaları.",
        "content": "<h2>Papatya Çayının Faydaları</h2><p>Papatya, yüzyıllardır tıbbi amaçlarla kullanılan şifalı bir bitkidir.</p><h3>Rahatlatıcı Etki</h3><p>Papatya çayı, doğal bir rahatlatıcıdır ve uyku kalitesini artırır.</p><h3>Sindirim Sistemi</h3><p>Mide rahatsızlıklarına iyi gelir ve sindirimi kolaylaştırır.</p>",
        "author": "Admin",
        "tags": ["papatya", "sağlık", "çay"],
        "readTime": 6
    },
    {
        "title": "Sukulent Bakımı: Başlangıç Rehberi",
        "slug": "sukulent-bakimi-baslangic",
        "excerpt": "Sukulent yetiştirmeye yeni başlayanlar için kapsamlı rehber.",
        "content": "<h2>Sukulent Nedir?</h2><p>Sukulentler, yapraklarında su depolan bitkilerdir. Bakımları oldukça kolaydır.</p><h3>Işık İhtiyacı</h3><p>Sukulentler parlak, dolaylı ışığı sever. Günde 4-6 saat güneş ışığı idealdir.</p><h3>Sulama</h3><p>Toprak tamamen kuruduktan sonra sulayın. Aşırı sulama en yaygın hatadır.</p>",
        "author": "Admin",
        "tags": ["sukulent", "ev bitkisi", "kolay bakım"],
        "readTime": 3
    },
    {
        "title": "Menekşe Yetiştirme Sanatı",
        "slug": "menekse-yetistirme",
        "excerpt": "Afrika menekşelerinin bakımı ve çoğaltma yöntemleri.",
        "content": "<h2>Afrika Menekşesi</h2><p>Afrika menekşeleri, renkli çiçekleri ve kompakt yapısıyla popüler ev bitkileridir.</p><h3>Ortam</h3><p>18-24°C arası sıcaklık ve yüksek nem idealdir.</p><h3>Sulama</h3><p>Alttan sulama yöntemi tercih edilmelidir. Yapraklara su değmemelidir.</p>",
        "author": "Admin",
        "tags": ["menekşe", "ev bitkisi", "çiçek"],
        "readTime": 5
    },
]

for post in posts:
    resp = api("POST", "/api/post", {"data": post}, TOKEN)
    if resp:
        pid = resp["data"]["id"]
        api("POST", f"/api/post/{pid}/publish", {}, TOKEN)
        print(f"  ✅ {post['title']}")

print("\n🎉 All content seeded successfully!")
print(f"📁 Categories: {len(categories)}")
print(f"📝 Posts: {len(posts)}")
