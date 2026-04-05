# Wolent CMS

Strapi'den daha hızlı, her şeyden daha güvenli. Fastify 5 + React + Prisma ile inşa edilmiş, self-hosted headless CMS.

---

## Özellikler

- **İçerik Motoru** — Sürükle-bırak ile alan oluşturma, ilişkiler, bileşenler, dinamik zone'lar
- **Medya Kütüphanesi** — Klasör yönetimi, toplu yükleme, S3 entegrasyonu
- **Kullanıcı Yönetimi** — Rol tabanlı erişim (super_admin, admin, editor, author, viewer)
- **API Token'ları** — Full Access / Read Only / Custom izinli tokenlar
- **Çoklu Dil** — TR / EN / DE / FR panel desteği, AI çeviri (Gemini)
- **11 Plugin** — S3, SMTP, Redis, Sitemap, Robots.txt, N8N, Webhook, Gemini AI, Analytics, Görsel Optimizasyon, Cookie Yönetimi
- **JWT RS256 Auth** — Access + refresh token, argon2id parola hash
- **Rate Limiting** — Global + auth endpoint'lerine özel limit
- **Docker Desteği** — SQLite (geliştirme) veya PostgreSQL (üretim)

---

## Hızlı Başlangıç — `create-wolent-app`

```bash
npx create-wolent-app my-site
```

Sihirbaz şunları sorar:
- Veritabanı: SQLite (sıfır kurulum) veya PostgreSQL
- Docker Compose üretilsin mi?
- Admin e-posta ve şifresi

Sonrasında:

```bash
cd my-site
npm run db:push        # Veritabanı tablolarını oluştur
npm run develop        # Geliştirme sunucusunu başlat
```

Panel: `http://localhost:1337` · API: `http://localhost:3000`

---

## Manuel Kurulum (Monorepo)

### Gereksinimler

- Node.js 20+
- pnpm 9+

### 1. Bağımlılıkları Yükle

```bash
git clone <repo-url> wolent-cms
cd wolent-cms
pnpm install
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
# Veritabanı
DATABASE_URL="file:./dev.db"          # SQLite için
# DATABASE_URL="postgresql://..."     # PostgreSQL için

# JWT RS256 anahtarları (aşağıdaki komutla otomatik oluşturulur)
JWT_PRIVATE_KEY=""
JWT_PUBLIC_KEY=""
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Gizli anahtarlar
COOKIE_SECRET="en-az-32-karakter-rastgele"
ADMIN_JWT_SECRET="en-az-32-karakter-rastgele"

# CORS
CORS_ORIGINS=http://localhost:1337

# İlk admin kullanıcısı (ilk çalıştırmada otomatik oluşturulur)
WOLENT_ADMIN_EMAIL="admin@example.com"
WOLENT_ADMIN_PASSWORD="Admin1234!"

# Medya
UPLOAD_PROVIDER=local
UPLOAD_DIR=./public/uploads
MAX_UPLOAD_SIZE=10485760
```

### 3. RSA Anahtarları Oluştur

```bash
pnpm generate-keys
```

Bu komut `.env` dosyasına `JWT_PRIVATE_KEY` ve `JWT_PUBLIC_KEY` değerlerini otomatik yazar.

### 4. Veritabanını Hazırla

```bash
# Geliştirme (SQLite)
pnpm --filter @wolent/database db:push

# Üretim (PostgreSQL)
pnpm --filter @wolent/database db:migrate
```

### 5. Geliştirme Sunucusunu Başlat

```bash
pnpm dev
```

- Admin Paneli: `http://localhost:1337`
- API: `http://localhost:3000`
- Health Check: `http://localhost:3000/health`

---

## Üretim Build

```bash
# Tüm paketleri derle
pnpm build

# Sunucuyu başlat
pnpm --filter @wolent/core start
```

Admin paneli `packages/admin/dist` klasöründen `http://localhost:3000` üzerinden servis edilir — ayrı port gerekmez.

---

## Docker ile Çalıştırma

### SQLite (Hızlı Başlangıç)

```bash
docker-compose up
```

### PostgreSQL (Üretim)

```bash
docker-compose -f docker-compose.yml up
```

`docker-compose.yml` içinde PostgreSQL + Redis + API + Admin servisleri tanımlıdır.

---

## Proje Yapısı

```
wolent-cms/
├── packages/
│   ├── core/                  # Fastify 5 API sunucusu
│   │   └── src/
│   │       ├── auth/          # JWT RS256, login, refresh
│   │       ├── content-engine/# İçerik tipleri & entry CRUD
│   │       ├── api/           # Users, Media, Tokens, Audit
│   │       └── api/plugins/   # 11 plugin route'u
│   ├── admin/                 # React + Vite + Tailwind admin paneli
│   │   └── src/app/
│   │       ├── components/    # Sayfa bileşenleri
│   │       ├── api/           # API istemcisi
│   │       └── i18n/          # TR/EN/DE/FR çeviriler
│   ├── database/              # Prisma schema + client
│   ├── utils/                 # Paylaşılan yardımcı fonksiyonlar
│   └── create-wolent-app/     # CLI kurulum sihirbazı
├── docker-compose.yml
└── .env.example
```

---

## API Kullanımı

### Kimlik Doğrulama

```bash
# Giriş
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin1234!"}'

# Dönen token'ı tüm isteklerde kullan
curl http://localhost:3000/api/articles \
  -H "Authorization: Bearer <access_token>" \
  -H "X-Wolent-Tenant: default"
```

### İçerik CRUD

```bash
# Listeleme
GET  /api/{uid}

# Tekil kayıt
GET  /api/{uid}/{id}

# Oluşturma
POST /api/{uid}
Body: { "data": { "title": "...", ... } }

# Güncelleme
PUT  /api/{uid}/{id}

# Yayınlama / Yayından Kaldırma
POST /api/{uid}/{id}/publish
POST /api/{uid}/{id}/unpublish

# Silme
DELETE /api/{uid}/{id}
```

### Admin Endpointleri

| Endpoint | Açıklama |
|---|---|
| `POST /api/auth/login` | Giriş |
| `POST /api/auth/refresh` | Token yenileme |
| `GET /api/admin/content-types` | İçerik tipi listesi |
| `POST /api/admin/content-types` | Yeni içerik tipi |
| `GET /api/admin/users` | Kullanıcı listesi |
| `POST /api/admin/users` | Yeni kullanıcı |
| `GET /api/upload/files` | Medya dosyaları |
| `POST /api/upload` | Dosya yükleme |
| `GET /api/admin/api-tokens` | API token listesi |
| `GET /api/admin/plugins` | Plugin durumları |
| `POST /api/admin/plugins/{id}/toggle` | Plugin aç/kapat |
| `GET /health` | Sunucu sağlık kontrolü |

---

## Plugin Yapılandırması

Pluginler admin panelindeki **Plugins** sayfasından açılıp kapatılır ve yapılandırılır.

| Plugin | Açıklama |
|---|---|
| S3 Object Storage | AWS S3 veya uyumlu depolama (MinIO vb.) |
| SMTP Mail | Transactional e-posta gönderimi |
| Redis Cache | API yanıt önbellekleme |
| Gemini AI Translate | Otomatik içerik çevirisi |
| Native Analytics | Gizlilik dostu sayfa görüntüleme takibi |
| Sitemap XML | Otomatik `/sitemap.xml` üretimi |
| Robots.txt | `/robots.txt` içerik yönetimi |
| N8N Automation | N8N webhook entegrasyonu |
| Outbound Webhook | İçerik olaylarına özel webhook gönderimi |
| Image Optimization | Yükleme sırasında görsel sıkıştırma |
| Cookie Management | GDPR uyumlu cookie banner |

---

## Geliştirme

### Bağımlılık Ekleme

```bash
# Core paketine
pnpm --filter @wolent/core add <paket>

# Admin paketine
pnpm --filter @wolent/admin add <paket>
```

### Veritabanı İşlemleri

```bash
# Schema değişikliği sonrası güncelle
pnpm --filter @wolent/database db:push

# Prisma Studio (görsel DB yönetimi)
pnpm --filter @wolent/database db:studio

# Yeni migration oluştur
pnpm --filter @wolent/database db:migrate
```

### Tip Kontrolü

```bash
pnpm typecheck
```

---

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `NODE_ENV` | `development` | Ortam |
| `PORT` | `3000` | API port |
| `HOST` | `0.0.0.0` | Dinleme adresi |
| `DATABASE_URL` | — | Prisma bağlantı URL'i |
| `JWT_PRIVATE_KEY` | — | RSA özel anahtar (base64) |
| `JWT_PUBLIC_KEY` | — | RSA açık anahtar (base64) |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token ömrü |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token ömrü |
| `COOKIE_SECRET` | — | Cookie imzalama anahtarı |
| `CORS_ORIGINS` | — | İzin verilen originler (virgülle ayrılmış) |
| `RATE_LIMIT_MAX` | `100` | Dakika başına istek limiti |
| `RATE_LIMIT_WINDOW` | `1 minute` | Rate limit penceresi |
| `UPLOAD_PROVIDER` | `local` | `local` veya `s3` |
| `UPLOAD_DIR` | `./public/uploads` | Yerel yükleme klasörü |
| `MAX_UPLOAD_SIZE` | `10485760` | Maksimum dosya boyutu (byte) |
| `WOLENT_ADMIN_EMAIL` | — | İlk admin e-postası |
| `WOLENT_ADMIN_PASSWORD` | — | İlk admin şifresi |
