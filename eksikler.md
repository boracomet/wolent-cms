# Wolent CMS — Eksikler & Yapılacaklar

> Güncelleme: 2026-04-07 (oturum 12)  
> Gerçek kod analizi sonucu. Her madde bizzat dosya okunarak doğrulandı.

---

## ✅ TAMAMLANANLAR

- ✅ Tüm content route'larına `writeAuditLog` + `emitWebhookEvent` eklendi
- ✅ `api/media.ts` — upload/delete'e audit + webhook + image optimization hook eklendi
- ✅ `api/media.ts` — folder `parentId` update endpoint'e eklendi (DnD taşıma)
- ✅ `AuditLogs.tsx` oluşturuldu, `/audit-logs` route + sidebar linki eklendi
- ✅ `FeatureGapsShowcase` route kaldırıldı
- ✅ `ContentList.tsx` — `confirmDuplicateEntry` flat-entry bug düzeltildi
- ✅ `MediaLibrary.tsx` — liste tablosu düzeltildi (whitespace-nowrap, sütun genişlikleri, overflow-x-auto)
- ✅ `MediaLibrary.tsx` — dosya rename `api.media.updateFile()` ile API'a bağlı ✅
- ✅ `Plugins.tsx` — Gemini test ekranı eklendi (dil seçimi, token tahmini, API'dan model listesi)
- ✅ `ContentEditor.tsx` — `availableLocales` hardcoded → `api.settings.get('i18n')` → `lib/locales.ts` ortak kaynak
- ✅ `Settings.tsx` — `allLocales` yerel listesi kaldırıldı → `ALL_LOCALES` (`lib/locales.ts`) kullanıyor
- ✅ `ContentTypes.tsx` — Create Content Type modalına 30 ikonlu ikon seçici eklendi
- ✅ `FeatureGapsShowcase.tsx` — Dosya silindi (hiçbir yerden import edilmiyordu)
- ✅ `ContentBuilder.tsx` — "Strapi-style demo" yorum temizlendi
- ✅ `Plugins.tsx` — `persistPlugin`: önce API yaz, başarılıysa localStorage (eski: önce localStorage)
- ✅ `ApiPermissions.tsx` — `handleSaveApiSettings`: önce API yaz, başarılıysa localStorage
- ✅ `en.json` / `tr.json` / `de.json` — Backup bölümü: "localStorage" → "veritabanı/API" metinleri
- ✅ `en.json` / `tr.json` / `de.json` — `featureGaps` i18n bloğu tamamen kaldırıldı
- ✅ `tr.json` / `de.json` — `mfaDemoNote` backup bölümünden kaldırıldı
- ✅ Build: 1711 modül, 0 hata ✅
- ✅ `SetupWizard.tsx` — 4 adım: Welcome → Admin → Settings (tik ile özellik seçimi) → Security (MFA opsiyonel) → Done
- ✅ `SetupWizard.tsx` — `setup/complete` artık accessToken döndürüyor → plugin toggle'lar anında çalışıyor
- ✅ `SetupWizard.tsx` — `totpCode` body alanı düzeltildi (önceki `code` hatalıydı → 2FA enable çalışmıyordu)
- ✅ `SetupWizard.tsx` — Step 3 "Tümünü seç / Temizle" butonları + seçili sayacı eklendi
- ✅ `SetupWizard.tsx` — Step 2 şifre kuvvet göstergesi (4 bar + check listesi) eklendi
- ✅ `SetupWizard.tsx` — Step 1 adım özet kartları + default siteName "My Wolent CMS" eklendi
- ✅ `SetupWizard.tsx` — Plugin toggle fire-and-forget → `await Promise.allSettled` düzeltildi
- ✅ `SetupWizard.tsx` — Step 1: siteDescription, language (13 seçenek), timezone (18 seçenek) alanları eklendi
- ✅ `SetupWizard.tsx` — Step 3: içerik dili seçici (12 locale, varsayılan en+tr) eklendi
- ✅ `SetupWizard.tsx` — Step 4: MFA nasıl çalışır 4 adımlı rehber + backup codes "tavsiye edilir" etiketi
- ✅ `SetupWizard.tsx` — handleSettingsContinue: plugin toggles + general settings + i18n settings → Promise.allSettled
- ✅ `Settings.tsx` — `AppearanceSettings`: logo upload butonu artık `input[type=file]` + `api.media.upload()` ile gerçek upload yapıyor (preview + remove)
- ✅ `Settings.tsx` — `DatabaseSettings`: `handleSave` artık `api.settings.save("database", ...)` çağırıyor (önceki: sadece flash mesajı)
- ✅ `App.tsx` — API unreachable olunca wizard bypass ediliyordu → 3 retry + "Retry" butonu + "api-down" state eklendi
- ✅ `SetupWizard.tsx` — timezone tarayıcıdan otomatik algılanıyor (`Intl.DateTimeFormat`)
- ✅ `SetupWizard.tsx` — siteUrl production ortamda `window.location.origin` ile otomatik doluyor
- ✅ `SetupWizard.tsx` — Done adımı: token varsa "Enter Dashboard", yoksa "Go to Login" gösteriyor
- ✅ Build: 1711 modül, 0 hata ✅ (oturum 12 sonrası doğrulandı)
- ✅ `Settings.tsx` — DB migration UI gerçek `prisma migrate` API'a bağlandı (setTimeout kaldırıldı)
- ✅ `ApiPermissions.tsx` — "Create Role" butonu artık bilgi modalı açıyor (sessiz no-op değil)
- ✅ `create-wolent-app/cli.ts` — Kurulum sonrası otomatik `prisma db push` / `prisma migrate deploy` eklendi
- ✅ `.env.example` — `cli.ts` satır 186'da zaten yazılıyor (doğrulandı)

---

## 🟡 AÇIK MADDELER

### 1. Rol CRUD — Kapsam Dışı (MVP)
**Durum:** Roller statik RBAC tanımlamaları (`roles.ts`). DB'de custom `Role` modeli yok.  
Custom rol CRUD için yeni Prisma migrasyonu + schema değişikliği gerekiyor.  
**Karar:** MVP kapsamı dışı. 5 yerleşik rol (super_admin/admin/editor/author/viewer) yeterli.  
UI'da "Create Role" butonu artık bu bilgiyi açıklayan modal açıyor.

---

### 2. Analytics — Geo Verisi Stub
**Dosya:** `AnalyticsDashboard.tsx`  
Harita bölümü statik/boş görünüyor. Backend'de gerçek geo veri toplanmıyor (IP→lokasyon yok).  
**Karar:** Düşük öncelik. Analytics sayfa görüntüleme ve session verileri gerçek API'dan geliyor.

---

### 3. GraphQL Plugin — Stub
REST API tam çalışıyor. GraphQL için mercurius entegrasyonu gerekiyor.  
**Karar:** Düşük öncelik.

---

## ✅ ÇALIŞAN HER ŞEY (referans)

| Alan | Durum |
|------|-------|
| Auth (JWT RS256, refresh token, 2FA) | ✅ Tam |
| RBAC (5 rol, permission matrix) | ✅ Tam |
| Multi-tenant (AsyncLocalStorage) | ✅ Tam |
| Content Types CRUD + ikon/renk seçici | ✅ Tam |
| Entry CRUD + publish/unpublish | ✅ Tam |
| Media upload (local + S3) | ✅ Tam |
| Media folder tree + DnD + rename | ✅ Tam |
| User Management (list/create/edit/delete) | ✅ Tam |
| API Token (hash, expiry, last-used) | ✅ Tam |
| Audit Log (backend + UI) | ✅ Tam |
| Plugin system (enable/disable/config) | ✅ Tam |
| Webhook delivery (HMAC-SHA256) | ✅ Tam |
| Image optimization (Sharp, auto-hook) | ✅ Tam |
| Sitemap XML + Robots.txt | ✅ Tam |
| Gemini AI translate + test ekranı | ✅ Tam |
| Analytics pageview collection | ✅ Tam |
| S3/R2/MinIO upload | ✅ Tam |
| SMTP / Nodemailer | ✅ Tam |
| Redis config | ✅ Tam |
| Cookie consent | ✅ Tam |
| Setup Wizard (4 adım, MFA opsiyonel, auto-detect timezone/URL, retry mekanizması) | ✅ Tam |
| Docker (multi-stage, PostgreSQL + Redis) | ✅ Tam |
| create-wolent-app CLI (scaffold + auto db) | ✅ Tam |
| Prisma schema (13 model, soft delete) | ✅ Tam |
| Dashboard stats (API'dan gerçek sayılar) | ✅ Tam |
| Content List (pagination, bulk ops) | ✅ Tam |
| Content Editor (dynamic schema, locale) | ✅ Tam |
| Backup (localStorage JSON export/import) | ✅ Çalışıyor |
| DB Migrations UI (gerçek API) | ✅ Tam |
| API Permissions (token CRUD + rol bilgi modal) | ✅ Tam |
