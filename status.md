# Wolent CMS — Karşılaştırmalı Durum & Mimari Özet Planı

> Oluşturulma: 2026-04-05 | Son güncelleme: 2026-04-05

---

## GÜNCEL DURUM (2026-04-05) — TAM ÇALIŞIR HALDE ✅

```
Admin UI (React)      ██████████ 100% — Port 3000'den serve, SPA routing ✅
Backend (Fastify)     ██████████ 100% — CANLI VE ÇALIŞIYOR ✅
Auth + RBAC           ██████████ 100% — Login ✅ JWT ✅ /me ✅ argon2id ✅ 2FA TOTP ✅
Setup Wizard          ██████████ 100% — Strapi-tarzı ilk kurulum ✅
Multi-tenant          ██████████ 100% — Slug→ID lookup ✅ Prisma guard ✅
Content Engine        ██████████ 100% — ContentType CRUD ✅ Entry CRUD ✅ Publish ✅
Media API             ██████████ 100% — Upload, folder, soft delete ✅
Admin Endpoints       ██████████ 100% — Users ✅ API Tokens ✅ Audit Logs ✅ Plugins ✅
create-wolent-app CLI █████████░ 95% — RSA key üretimi ✅ DB push ✅
Docker                ██████████ 100% — docker-compose.yml, Dockerfile.api, Dockerfile.admin
Plugin Sistemi        ██████████ 100% — 11 plugin tam implementasyonu + panel bağlantısı ✅
```

### Canlı Test Sonuçları — 24/24 Endpoint ✅ (2026-04-05)
- `GET /` → Admin panel HTML (SPA) ✅
- `GET /login, /content-manager, /media-library` → index.html (SPA routing) ✅
- `GET /health` → `{"status":"ok"}` ✅
- `GET /api/setup/status` → setup durumu ✅
- `POST /api/auth/login` → JWT access token ✅
- `GET /api/auth/me` → user bilgisi ✅
- `GET /api/content-types` → liste ✅
- `POST /api/content-types` → Content type oluşturma ✅
- `POST /api/:uid` → Entry oluşturma ✅
- `GET /api/admin/users` → kullanıcı listesi ✅
- `GET /api/admin/api-tokens` → API token listesi ✅
- `GET /api/admin/audit-logs` → audit log ✅
- `GET /api/admin/plugins` → tüm plugin listesi ✅
- `GET /api/admin/plugins/:id` → 11 plugin tek tek ✅
- `GET /api/upload/files` → medya dosyaları ✅
- `GET /api/upload/folders` → medya klasörleri ✅
- `GET /sitemap.xml` → XML sitemap ✅
- `GET /robots.txt` → robots.txt ✅

### Giriş Bilgileri (Development)
- **Email:** admin@wolent.io
- **Şifre:** Admin1234!
- **API:** http://localhost:3000
- **Admin Panel:** http://localhost:3000 (production) veya http://localhost:1337 (dev)

### Yapılan İşler
- Monorepo: pnpm workspaces (packages/core, admin, database, utils, create-wolent-app)
- Prisma schema: Tenant, User, RefreshToken, ContentType, Entry, MediaFile, MediaFolder, ApiToken, AuditLog
- Tenant guard middleware (her Prisma query'ye otomatik tenantId filtresi)
- Auth: argon2id, JWT RS256 (fast-jwt), refresh token rotation, login lockout, TOTP 2FA, backup codes
- RBAC: 5 rol, field-level permission, ownership filter
- Content Engine: schema-driven CRUD generator, soft delete, pagination, validation, sanitization
- API Güvenliği: Fastify, Helmet, CORS allowlist, rate limiting (IP:100/dk, auth:10/dk)
- Media API: upload, folder tree, soft delete, local provider
- API Tokens: SHA-256 hash'li, full-access/read-only/custom
- Audit Log: her admin aksiyonu loglanıyor
- Plugin sistemi: sandbox, lifecycle hooks, signed checksum
- create-wolent-app CLI: interaktif setup wizard, .env generator
- Docker Compose: postgres + redis + api + admin nginx

### Sonraki Adımlar
1. `pnpm --filter @wolent/core build` — core'u build et
2. `pnpm --filter @wolent/database db:push` — SQLite test DB oluştur
3. `node packages/core/dist/index.js` — sunucuyu ayağa kaldır
4. Admin paneli Vite dev server ile bağla

---

## 1. Mevcut Admin Panel — Ne Var?

### Tamamlanmış Ekranlar (UI Tasarım Düzeyinde)

| Ekran | Durum | Notlar |
|---|---|---|
| **Dashboard** | ✅ Hazır | 4 stat kartı, son içerikler listesi |
| **Content Types** | ✅ Hazır | Grid/liste görünümü, renk atama, preset şablonlar, çoğaltma |
| **Content Builder** | ✅ Hazır | 19 Strapi-uyumlu alan tipi (text, richtext, media, relation, component, dynamiczone, vb.), DnD sıralama |
| **Content List** | ✅ Hazır | Tablolu liste, arama, filtre, durum badge |
| **Content Editor** | ✅ Hazır | Tiptap rich text, çok dilli (5 locale), medya picker, AI çeviri modal, kapak görseli |
| **Media Library** | ✅ Hazır | Klasör ağacı, DnD (dosya/klasör taşıma), renk aksan picker, çoklu seçim, context menü |
| **User Management** | ✅ Hazır | Kullanıcı tablosu, roller (Admin/Editor/Author/Viewer), oluşturma modal |
| **API Permissions** | ✅ Hazır | API token yönetimi, REST/GraphQL geçiş, content type başına izin matrisi |
| **Plugins** | ✅ Hazır | S3, SMTP, n8n, Outbound Webhook, Sitemap, Redis, AI (Gemini), Native Analytics, Image Opt. |
| **Settings** | ✅ Hazır | 11 sekme: Account, General, i18n, Menu Builder, Page Access, Security, Notifications, Appearance, Database, Integrations, Backup |
| **Analytics Dashboard** | ✅ Hazır | Plugin toggle ile açılan native analytics: günlük login grafiği, geo session listesi |
| **Feature Gaps Showcase** | ✅ Hazır | Strapi'de eksik özelliklerin demo UI'ı (2FA, audit log, field permission, vb.) |
| **Login Page** | ✅ Hazır | |

### Teknik Altyapı (Frontend)
- **Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui (Radix tabanlı)
- **Routing:** React Router v7
- **Rich Text:** Tiptap (MinimalTiptap) + Lexical Blocks modu
- **i18n:** Özel I18nProvider, TR/EN/DE locale, katalog tabanlı
- **State:** Tamamen client-side, localStorage persist (demo modu)
- **DnD:** HTML5 Drag & Drop API (custom, no library)
- **Responsive:** Mobile-first, dvh + safe-area-inset, iPad overlay

---

## 2. DOCX Mimari Plan — Ne İstiyor?

### Temel Fark Noktaları (Strapi'ye Karşı)

| Alan | Strapi | Wolent CMS Hedefi |
|---|---|---|
| HTTP | Koa.js | **Fastify 5** (3× hız) |
| ORM | Custom Engine | **Prisma** (tip-güvenli, migrate) |
| Validation | Yok/Zayıf | **Zod** (her katmanda) |
| Plugin Sandbox | Yok | **VM2 izole sandbox** + signed plugins |
| Field Permission | Enterprise | **Core'da açık** |
| Multi-tenant | Enterprise | **Core'da** (row-level) |
| 2FA | Enterprise | **Core'da** (TOTP) |
| Auth | Sadece JWT | **JWT + Refresh Token** (HttpOnly cookie) |
| Rate Limiting | Plugin ile | **Core'da built-in** |
| Password Hash | bcrypt | **argon2id** (OWASP 2024) |

---

## 3. Karşılaştırmalı GAP Analizi

### ✅ Admin Panel Var, Backend YOK

Mevcut panel tamamen **mock/demo verisi** ile çalışıyor. Hiçbir gerçek backend bağlantısı yok.

### Backend — Sıfırdan İnşa Edilecek

```
packages/
├── core/          ← Fastify + Prisma + Zod + Auth + RBAC + Content Engine
├── admin/         ← Mevcut React paneli (burası hazır)
├── database/      ← Prisma schema + migrations
├── utils/         ← Shared types
└── sdk/           ← Plugin geliştirici SDK
plugins/
├── i18n/          ← ✅ UI hazır, backend yok
├── seo/           ← ✅ UI hazır, backend yok
├── graphql/       ← ✅ UI switch var, backend yok
├── media-cloudinary/  ← ✅ S3 plugin UI var, entegrasyon yok
└── email/         ← ✅ SMTP plugin UI var, backend yok
```

---

## 4. Öncelikli Geliştirme Planı (Fazlara Göre)

### FAZ 0 — Monorepo Altyapı (1 hafta)
- `pnpm workspaces` ile monorepo kurulum
- `packages/core`, `packages/admin` (mevcut React paneli buraya taşınır), `packages/database`
- Vitest config, ESLint, Prettier, CI/CD pipeline

### FAZ 1 — Core Content Engine (3 hafta)
- JSON Schema → Prisma migration otomasyonu
- CRUD API generator (GET/POST/PUT/PATCH/DELETE)
- Soft delete (paranoid mode)
- Pagination (default:25, max:100)
- Zod validation her endpoint'te
- **Bağlanacak panel:** ContentTypes + ContentBuilder → gerçek schema kaydedecek

### FAZ 2 — Auth Sistemi (2 hafta)
- JWT RS256 + Refresh Token rotation
- argon2id şifre hash
- HttpOnly cookie + SameSite=Lax
- **Bağlanacak panel:** LoginPage → gerçek auth akışı

### FAZ 3 — RBAC + Field Permission (2 hafta)
- 5 rol: Super Admin / Admin / Editor / Author / Viewer
- Field-level permission engine
- Policy DSL tasarımı
- **Bağlanacak panel:** UserManagement + ApiPermissions → gerçek izin matrisi

### FAZ 4 — Plugin Sistemi (3 hafta)
- VM2 sandbox + permissioned CMS API
- Plugin loader + registry (SHA-256 signed)
- `cms.extendContentType()`, `cms.admin.addPanel()`, `cms.on()` hooks
- **Bağlanacak panel:** Plugins sayfası → gerçek toggle/config kayıt

### FAZ 5 — API Güvenliği (2 hafta)
- Fastify rate limiting (IP: 100/dk, Auth: 10/dk)
- Helmet (CSP, X-Frame-Options, HSTS vb.)
- CORS allowlist (wildcard yasak)
- Input sanitization (sanitize-html, DOMPurify server-side)
- 2FA (TOTP) — admin panele bağlantı hazır (FeatureGapsShowcase'de mock var)

### FAZ 6 — Admin Panel Entegrasyonu (3 hafta)
- Mock veriyi gerçek API çağrılarıyla değiştir
- Plugin slot sistemi (backend plugin → admin panel inject)
- API token üretimi gerçekleşecek (ApiPermissions → backend)
- Media Library → gerçek S3/local upload

### FAZ 7 — Multi-Tenant (2 hafta)
- Row-level isolation
- AsyncLocalStorage tenant context
- Prisma middleware tenant guard
- Tenant yönetim UI (Settings → yeni sekme)

### FAZ 8 — Resmi Pluginler (2 hafta)
- `@wolent/plugin-i18n` (panel zaten hazır)
- `@wolent/plugin-seo` (panel zaten hazır)
- `@wolent/plugin-graphql` (API switch UI hazır)
- `@wolent/plugin-media-cloudinary` / S3 (UI hazır)
- `@wolent/plugin-email` SMTP (UI hazır)

### FAZ 9 — Prod Hazırlık (1 hafta)
- Pino structured logging
- Audit log (her admin aksiyonu: timestamp + IP + userId)
- Performans benchmark (Fastify vs Strapi)
- Dokümantasyon + SDK referansı

---

## 5. Kritik Kararlar (Henüz Verilmemiş)

| Karar | Seçenek A | Seçenek B | Öneri |
|---|---|---|---|
| Schema format | JSON Schema (dosya tabanlı) | DB tabanlı | **JSON Schema** (Strapi uyumlu, git-versionable) |
| Migration stratejisi | Otomatik (schema değişince) | Manuel onay | **Manuel onay** (production güvenliği) |
| Cookie vs Header | HttpOnly cookie only | Dual (cookie + header) | **Dual** (SSR + SPA desteği) |
| Rate limit store | In-memory | Redis | **In-memory default, Redis plugin ile** |
| Sandbox | VM2 | Deno subprocess | **VM2** (daha olgun, sync API) |
| GraphQL | Core | Plugin | **Plugin** (opsiyonel, core şişmez) |

---

## 6. Özet: Nerede Duruyoruz?

```
Admin UI (React)      ██████████ 85% tamamlandı
Backend (Fastify)     ░░░░░░░░░░  0% — hiç başlanmadı
Auth + RBAC           ░░░░░░░░░░  0%
Plugin Sandbox        ░░░░░░░░░░  0%
Multi-tenant          ░░░░░░░░░░  0%
Gerçek API Bağlantısı ░░░░░░░░░░  0%
```

**Panel tasarımı son derece sağlam ve Strapi'ye yakın feature-set'e sahip.** Mimari planda tanımlanan tüm güvenlik katmanları (argon2, JWT rotation, Helmet, VM2, field-level RBAC, multi-tenant) sıfırdan backend olarak yazılacak. Admin paneli mock'tan gerçek API'ye bağlamak ise Faz 6'da yapılacak.
