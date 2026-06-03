#!/bin/bash
set -e

# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@flowers.com","password":"FlowerAdmin2024!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

echo "Token length: ${#TOKEN}"

# Create API token for frontend
API_TOKEN_RESP=$(curl -s -X POST http://localhost:3001/api/admin/api-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Frontend Blog","description":"Read-only for Next.js","type":"read-only"}')

echo "API Token Response: $API_TOKEN_RESP"

# Extract the token
API_TOKEN=$(echo "$API_TOKEN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('accessToken','') or d.get('data',{}).get('token','') or d.get('token',''))")

echo "API_TOKEN=$API_TOKEN" > /root/wolent-cms/.frontend-token
echo "Frontend API Token: $API_TOKEN"

# Seed some categories
for cat in '{"name":"Gül","slug":"gul","description":"Gül türleri ve bakımı","color":"#e11d48","icon":"🌹"}' \
           '{"name":"Orkide","slug":"orkide","description":"Orkide çeşitleri","color":"#a855f7","icon":"🌸"}' \
           '{"name":"Lale","slug":"lale","description":"Lale soğanı ve yetiştirme","color":"#f59e0b","icon":"🌷"}' \
           '{"name":"Papatya","slug":"papatya","description":"Papatya türleri","color":"#fbbf24","icon":"🌼"}' \
           '{"name":"Sümbül","slug":"sumbul","description":"Sümbül bakımı","color":"#6366f1","icon":"💐"}' \
           '{"name":"Menekşe","slug":"menekse","description":"Menekşe yetiştirme","color":"#8b5cf6","icon":"💜"}'; do
  RESP=$(curl -s -X POST http://localhost:3001/api/categories \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"data\":$cat}")
  NAME=$(echo "$cat" | python3 -c "import sys,json; print(json.load(sys.stdin)['name'])")
  echo "Category created: $NAME"
done

# Publish categories
CATS=$(curl -s http://localhost:3001/api/categories -H "Authorization: Bearer $TOKEN")
echo "$CATS" | python3 -c "
import sys, json, urllib.request
data = json.load(sys.stdin)
for item in data.get('data', []):
    cid = item['id']
    req = urllib.request.Request(f'http://localhost:3001/api/categories/{cid}/publish', 
        data=b'{}', 
        headers={'Content-Type':'application/json','Authorization':'Bearer $TOKEN'},
        method='POST')
    try:
        urllib.request.urlopen(req)
        print(f'  Published: {item[\"data\"][\"name\"]}')
    except Exception as e:
        print(f'  Error publishing {cid}: {e}')
"

# Seed some posts
python3 -c "
import json, urllib.request

TOKEN = '$TOKEN'

posts = [
    {
        'title': 'Gül Bakımı: Adım Adım Rehber',
        'slug': 'gul-bakimi-rehber',
        'excerpt': 'Güllerinizi en güzel haliyle yetiştirmek için bilmeniz gereken her şey.',
        'content': '<h2>Gül Bakımı Nasıl Yapılır?</h2><p>Güller, dünyanın en popüler çiçeklerinden biridir. Doğru bakım ile bahçenizde muhteşem güller yetiştirebilirsiniz.</p><h3>1. Toprak Seçimi</h3><p>Güller için en ideal toprak, iyi drene olan ve organik maddece zengin topraktır. pH değeri 6.0-6.5 arasında olmalıdır.</p><h3>2. Sulama</h3><p>Gülleri haftada 2-3 kez derinlemesine sulayın. Sabah saatleri sulama için en ideal zamandır.</p><h3>3. Gübreleme</h3><p>İlkbahar ve yaz aylarında ayda bir kez gübreleme yapın.</p>',
        'author': 'Admin',
        'tags': ['gül', 'bakım', 'bahçe'],
        'readTime': 5
    },
    {
        'title': 'Orkide Çeşitleri ve Bakım İpuçları',
        'slug': 'orkide-cesitleri-bakim',
        'excerpt': 'Phalaenopsis den dendrobiuma, en popüler orkide türleri.',
        'content': '<h2>Orkide Dünyası</h2><p>Orkideler, 25.000den fazla türü ile bitki dünyasının en büyük ailelerinden biridir.</p><h3>Phalaenopsis (Kelebek Orkide)</h3><p>En yaygın ve bakımı en kolay orkide türüdür. Yarı gölge ortamı sever.</p><h3>Dendrobium</h3><p>Daha fazla ışık gerektirir. Düzenli sulama önemlidir.</p><h3>Cattleya</h3><p>Güçlü kokusu ile bilinir. Parlak, dolaylı ışık ister.</p>',
        'author': 'Admin',
        'tags': ['orkide', 'çiçek', 'ev bitkisi'],
        'readTime': 7
    },
    {
        'title': 'Bahar Aylarında Dikilecek Çiçekler',
        'slug': 'bahar-dikilecek-cicekler',
        'excerpt': 'Bahçenizi renklendirecek en güzel bahar çiçekleri.',
        'content': '<h2>Bahar Çiçekleri</h2><p>Bahar, doğanın yeniden canlandığı ve bahçelerin en güzel göründüğü mevsimdir.</p><h3>Lale</h3><p>Hollandanın simgesi olan laleler, sonbaharda soğanları dikilerek yetiştirilir.</p><h3>Sümbül</h3><p>Muhteşem kokusuyla bahar aylarının vazgeçilmezidir.</p><h3>Nergis</h3><p>Sarı ve beyaz çiçekleri ile bahçenize neşe katar.</p>',
        'author': 'Admin',
        'tags': ['bahar', 'dikim', 'bahçe'],
        'readTime': 4
    },
    {
        'title': 'Papatya Çayı ve Sağlık Faydaları',
        'slug': 'papatya-cayi-faydalari',
        'excerpt': 'Papatya çayının bilimsel olarak kanıtlanmış faydaları.',
        'content': '<h2>Papatya Çayının Faydaları</h2><p>Papatya, yüzyıllardır tıbbi amaçlarla kullanılan şifalı bir bitkidir.</p><h3>Rahatlatıcı Etki</h3><p>Papatya çayı, doğal bir rahatlatıcıdır ve uyku kalitesini artırır.</p><h3>Sindirim Sistemi</h3><p>Mide rahatsızlıklarına iyi gelir ve sindirimi kolaylaştırır.</p><h3>Cilt Bakımı</h3><p>Anti-inflamatuar özellikleri ile ciltteki tahrişleri azaltır.</p>',
        'author': 'Admin',
        'tags': ['papatya', 'sağlık', 'çay'],
        'readTime': 6
    },
    {
        'title': 'Sukulent Bakımı: Başlangıç Rehberi',
        'slug': 'sukulent-bakimi-baslangic',
        'excerpt': 'Sukulent yetiştirmeye yeni başlayanlar için kapsamlı rehber.',
        'content': '<h2>Sukulent Nedir?</h2><p>Sukulentler, yapraklarında su depolan bitkilerdir. Bakımları oldukça kolaydır.</p><h3>Işık İhtiyacı</h3><p>Sukulentler parlak, dolaylı ışığı sever. Günde 4-6 saat güneş ışığı idealdir.</p><h3>Sulama</h3><p>Toprak tamamen kuruduktan sonra sulayın. Aşırı sulama en yaygın hatadır.</p>',
        'author': 'Admin',
        'tags': ['sukulent', 'ev bitkisi', 'kolay bakım'],
        'readTime': 3
    },
    {
        'title': 'Menekşe Yetiştirme Sanatı',
        'slug': 'menekse-yetistirme',
        'excerpt': 'Afrika menekşelerinin bakımı ve çoğaltma yöntemleri.',
        'content': '<h2>Afrika Menekşesi</h2><p>Afrika menekşeleri, renkli çiçekleri ve kompakt yapısıyla popüler ev bitkileridir.</p><h3>Ortam</h3><p>18-24°C arası sıcaklık ve yüksek nem idealdir.</p><h3>Sulama</h3><p>Alttan sulama yöntemi tercih edilmelidir. Yapraklara su değmemelidir.</p>',
        'author': 'Admin',
        'tags': ['menekşe', 'ev bitkisi', 'çiçek'],
        'readTime': 5
    }
]

for post in posts:
    data = json.dumps({'data': post}).encode()
    req = urllib.request.Request('http://localhost:3001/api/posts', data=data,
        headers={'Content-Type':'application/json','Authorization':f'Bearer {TOKEN}'})
    resp = json.loads(urllib.request.urlopen(req).read())
    pid = resp['data']['id']
    print(f'  Created: {post[\"title\"]}')
    
    # Publish
    req2 = urllib.request.Request(f'http://localhost:3001/api/posts/{pid}/publish',
        data=b'{}',
        headers={'Content-Type':'application/json','Authorization':f'Bearer {TOKEN}'},
        method='POST')
    try:
        urllib.request.urlopen(req2)
        print(f'  Published: {post[\"title\"]}')
    except Exception as e:
        print(f'  Publish error: {e}')
"

echo "✅ All content seeded!"
