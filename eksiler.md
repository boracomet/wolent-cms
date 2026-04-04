# Eksiler — özet + §19 numaralı indeks

Bu dosya **`eksikler.md`** ile aynı boşluk analizini **tek bakışta** gösterir. Paragraflar ve geniş tablolar → **[`eksikler.md`](./eksikler.md)** (özellikle **§19**).

---

## Hızlı harita

| Bölüm | Konu |
|-------|------|
| §1–14 | Strapi karşılaştırması, Faz A–C yol haritası |
| §15–17 | Genel CMS, kıyaslama, tasarım fazı |
| §18 | Yaygın eklenti / entegrasyon türleri |
| **§19** | **Tek kontrol listesi** (YOK / MOCK / KISMI) |
| **§19.9** | Tablolarda satırı olmayan ek maddeler (60–63) |
| **§19.10** | Bilinçli kapsam dışı (eksik sayılmaz) |

---

## §19 numaralı indeks (dokümanda var × projede tam değil)

Tümü **`eksikler.md` §19** ile aynı. **Durum:** çoğu **YOK**; MOCK/KISMI olanlar parantezde.

### 19.1 Çekirdek (1–15) → YOK

1. DB / ORM / migration  
2. Kalıcı içerik CRUD  
3. REST otomatik uçlar, filtre/sort/pagination  
4. GraphQL + introspeksiyon  
5. `populate` / derin ilişki  
6. `publicationState` API  
7. OpenAPI/Swagger üretimi  
8. Sunucu rate limit, CORS, güvenlik başlıkları  
9. Gerçek webhook  
10. Transaction, FK, sunucu doğrulama  
11. Lifecycle hooks, policies/middleware  
12. API sürümleme / stabil sözleşme  
13. Env ile bağlı API katmanı  
14. CLI, transfer token, health/version  
15. Docker compose tam stack  

### 19.2 Kimlik & güvenlik (16–21)

16. Admin login, JWT/session → **YOK**  
17. Granüler RBAC → **MOCK**  
18. 2FA, şifre sıfırlama, e-posta doğrulama → **YOK**  
19. CSRF, güvenli cookie (sunucu) → **YOK**  
20. XSS sunucu sanitization → **YOK**  
21. Login brute-force limit → **YOK**  

### 19.3 Medya (22–26)

22–25 → **YOK** (upload, S3, varyant/focal, MIME limit)  
26 → **KISMI / YOK** (toplu işlem, replace, video)  

### 19.4 Modelleme (27–32)

27, 29, 30, 32 → **YOK**  
28, 31 → **KISMI** (ilişki demo select; enum serbest metin)  

### 19.5 Yayın & i18n içerik (33–39)

33 → **MOCK** (taslak/yayın kalıcılığı)  
34–38, 39 → **YOK**  

### 19.6 Eklenti & §18 entegrasyon (40–48) + Gemini notu

40–47 → **YOK**  
48 → **MOCK** (cookie sadece kart)  
**Gemini:** anahtar `localStorage` — **gerçek çeviri API çağrısı YOK**  

### 19.7 Admin UX (49–59)

49–55, 58 → **YOK**  
53 → **YOK** (light tema “coming soon”)  
56, 57, 59 → **KISMI**  

### 19.9 Ek satırlar (60–63) → `eksikler.md` §19.9

60. Medya virüs taraması → **YOK**  
61. OpenAPI → client/codegen → **YOK**  
62. Preview API anahtarı sunucu doğrulama → **MOCK**  
63. E-posta şablonları (gerçek) → **YOK**  

### 19.10 Kapsam dışı (sayılmaz)

WP tarzı tam sayfa cache, ağır visual builder, e-ticaret yığını — **bilinçli yok** (§18.4).

---

## Projede şu an var (karışmasın)

Panel UI (routes), dashboard, content types + builder, content list/edit, medya **görünümü**, settings, API permissions **ekranı**, plugins (Cookie + Gemini kartları), **panel i18n JSON**, demo **dinamik şemalı** editör, Gemini anahtarı **saklama** (işlev yok).

---

*§19.1–19.8 tam tablolar için → `eksikler.md` §19.*
