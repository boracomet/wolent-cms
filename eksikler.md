# Strapi vs bu proje — eksikler ve ekleme önerileri

Bu doküman **Strapi** (v4/v5 admin + REST/GraphQL + eklenti ekosistemi) ile **wolent** deposundaki **hafif, Strapi tarzı UI prototipi** arasında kapsamlı bir boşluk analizidir. Amaç: nelerin olmadığını netleştirmek ve “lightweight headless CMS” hedefi için önceliklendirilmiş bir yol haritası önermek.

---

## 1. Özet: projenin bugünkü durumu

| Alan | Projede | Strapi’de |
|------|---------|-----------|
| Veri katmanı | Yok (tamamı mock state / statik JSON benzeri) | Gerçek DB, şema, migration |
| HTTP API | Yok | Otomatik REST + GraphQL (+ OpenAPI) |
| Admin UI | Var (Figma/make türevi, zengin prototip) | Üretim admin paneli |
| Kimlik doğrulama | Yok (panel açık) | Admin login, JWT, oturum |
| Eklentiler | UI iskelesi (ör. cookie plugin kartı) | Çalışan plugin runtime + marketplace |

**Sonuç:** Bu repo şu an **ön uç odaklı bir tasarım / demo**. Strapi’nin “headless CMS” tanımının çekirdeği olan **kalıcı veri + API + yetkilendirme** burada yok; eksikler listesinin büyük kısmı bu yüzden “backend ve entegrasyon” tarafında toplanıyor.

---

## 2. Backend ve veri modeli (en kritik fark)

Strapi’de olan, bizde olmayanlar:

- **Gerçek veritabanı** (PostgreSQL / MySQL / SQLite) ve ORM ile içerik saklama.
- **Şema → tablo/koleksiyon** eşlemesi; içerik tipi değişince migration veya senkron stratejisi.
- **Document Service / Entity Service** benzeri tek giriş noktasından CRUD (Strapi v5 doküman odaklı API).
- **Bütünlük kısıtları:** unique, foreign key, cascade, ilişkili kayıt silme kuralları.
- **Transaction** desteği (özellikle ilişki ve medya güncellemelerinde).
- **Sunucu tarafı doğrulama:** şema ile uyumlu tip/format kontrolü (bizde çoğunlukla yok).
- **Lifecycle hooks:** beforeCreate, afterUpdate vb. (iş kuralları, denormalizasyon, bildirim).
- **Policies / middleware** ile route bazlı kontrol.

**Lightweight CMS için makul minimum:** tek DB, tek API katmanı (REST veya tRPC), içerik tipleri için JSON şema veya codegen; tam Strapi ORM karmaşıklığı şart değil.

---

## 3. REST / GraphQL API yüzeyi

Strapi’de olan, bizde olmayanlar:

- **Otomatik endpoint’ler:** `/api/articles`, `/api/articles/:id`, populate, filtre operatörleri (`$eq`, `$contains`, `$in`…), sıralama, sayfalama (`pagination[page]`, `pageSize`).
- **GraphQL** (plugin) ve şema introspeksiyonu.
- **`populate`** ile derin ilişki ve bileşen ağaçları.
- **`filters` query syntax** (iç içe AND/OR).
- **`fields` seçimi** (sadece belirli alanları döndürme).
- **`publicationState`** (draft vs live) — API seviyesinde.
- **OpenAPI / Swagger** üretimi.
- **Rate limiting, CORS, güvenlik başlıkları** yapılandırması (sunucu tarafı).
- **Webhook tetikleyicileri** (create/update/delete/publish).

**Projede:** API Permissions ekranı token/rol **görsel** olarak var; gerçek token doğrulama ve route koruması yok.

---

## 4. İçerik modelleme (Content-Type Builder derinliği)

Projede Content Builder ve Strapi’ye yakın alan tipleri listesi var; Strapi’de olan ek derinlik:

### 4.1 Alan başına gelişmiş ayarlar

- Min/max length, min/max value, regex, özel hata mesajları.
- **Default value**, **private** (API’de gizli), **unique** (UID veya text).
- **Required** dışında: **conditional** görünürlük (bazen plugin).
- **Localization** checkbox’ı (alan bazlı i18n açık/kapalı).
- **Zengin metin:** Strapi Blocks için özel editör, özel blok tipleri, sıralama.

### 4.2 İlişkiler

- İki taraflı ilişki düzenleme, “mappedBy” / ters ilişki gösterimi.
- Admin’de ilişkili giriş seçici (search, çoklu seçim).
- **Self-relation**, çok seviyeli populate stratejileri.

### 4.3 Bileşen ve Dynamic Zone

- **Component** kütüphanesi: global tanımlı bileşenler, iç içe bileşenler.
- **Dynamic Zone:** hangi bileşenlerin eklenebileceği whitelist, sürükle-bırak sıra.
- Projede: UI’da “Component” ve “Dynamic Zone” alan tipi seçilebiliyor; **gerçek iç içe şema editörü ve veri ağacı yok**.

### 4.4 UID alanı

- Strapi’de genelde başka alana bağlı slug üretimi (ör. title’dan).
- Projede: UID tipi var; **otomatik slug / benzersizlik kontrolü yok**.

### 4.5 Enumeration

- Strapi’de enum değerleri şemada sabit; API tip güvenliği.
- Projede: serbest metin textarea; şema seviyesinde kısıt yok.

### 4.6 Medya alanı

- Çoklu medya, izin verilen MIME tipleri, tek dosya vs çoklu.
- Projede: tek “media” tipi; mime/limit yapılandırması yok.

---

## 5. Medya kütüphanesi

Strapi Media Library özellikleri (projeyle karşılaştırma):

| Özellik | Strapi | Bu proje |
|---------|--------|----------|
| Gerçek dosya yükleme / depolama (local, S3, Cloudinary…) | Var | Yok (mock liste) |
| Görsel varyantları (thumbnail, large…) | Var | Yok |
| Kırpma, odak noktası (focal point) | Var | Yok |
| Klasör / izinler | Var (gelişmiş) | UI iskelesi |
| Çoklu seçim, toplu silme, replace | Var | Kısmi / mock |
| CDN URL’leri, imzalı URL | Entegrasyon | Yok |
| Video işleme | Eklenti / sağlayıcı | Yok |

**Lightweight öneri:** tek depolama adaptörü (ör. S3 uyumlu) + orijinal + 1–2 thumbnail; Strapi kadar varyant zorunlu değil.

---

## 6. Yayınlama, taslak ve önizleme

Strapi’de olan, bizde eksik veya sadece UI:

- **Draft & Publish:** API ve listede `publishedAt` / state; taslakken public API’de görünmeme.
- **Preview:** front-end URL şablonu, secret token ile önizleme linki.
- **Scheduled publishing / Releases** (Strapi Cloud / belirli planlar).
- **Audit log** (kim neyi ne zaman değiştirdi) — genelde üst segment.

Projede: ContentEditor’da “draft/published” state ve kaydet uyarıları **mock**; kalıcı yayın akışı yok.

---

## 7. Uluslararasılaştırma (i18n)

Strapi:

- Locale listesi, varsayılan locale, içerik girişi locale bazlı.
- API’de `locale` query; eksik çeviri yönetimi, bazen “tek alan çeviri” ayrıntıları.

Proje:

- Ayarlarda i18n sekmesi (çok dil listesi) ve ContentEditor’da locale seçici **var**.
- **Panel dili** JSON ile çözülmüş (`src/locales`).
- **İçerik verisinin locale bazlı kalıcı saklanması ve API ile sunulması yok.**

---

## 8. Kullanıcılar, roller ve izinler (Users & Permissions)

Strapi:

- Admin kullanıcıları vs **Users-Permissions** (son kullanıcı kayıt/giriş) ayrımı.
- Rol bazlı **granüler izinler:** content-type → find, findOne, create, update, delete, publish.
- Alan bazlı kısıt (sınırlı / eklenti ile).

Proje:

- User Management ve API Permissions **mock**.
- Giriş ekranı, şifre sıfırlama, e-posta doğrulama, 2FA **yok**.
- **JWT / session / RBAC middleware yok.**

---

## 9. Eklenti sistemi

Strapi:

- `strapi-server.js` / `register` / `bootstrap`, route injection, admin extension.
- Resmi ve topluluk eklentileri (GraphQL, S3 upload, vb.).

Proje:

- Plugins sayfasında örnek “Cookie Management” kartı; **çalışma zamanı hook’u, manifest, API genişletmesi yok.**

**Lightweight öneri:** basit “plugin” arayüzü: `{ id, routes?, adminRoutes?, hooks? }` ve yüklenen modüller; tam Strapi plugin ABI’si gerekmez.

---

## 10. Geliştirici deneyimi ve operasyon

Strapi’de olan, bizde olmayanlar:

- **CLI:** proje oluşturma, generator, migration.
- **Environment-based config** (`config/database.js`, `server.js`, …).
- **TypeScript** desteği (Strapi projelerinde yaygın).
- **Transfer / backup** token’ları, ortamlar arası veri taşıma.
- **Telemetry / health check** (opsiyonel).

Proje: Vite + React; **ortam değişkenleriyle bağlanan bir API katmanı yok** (henüz).

---

## 11. Admin UX ayrıntıları (Strapi’de sık görülen)

Bunlar çoğu “nice to have” ama Strapi kullanıcıları alışkın:

- Liste görünümlerinde **sütun özelleştirme**, kayıtlı görünümler.
- **Bulk actions** (toplu sil, toplu yayınla).
- **Duplicate entry**, **import/export** (CSV/JSON).
- **Keyboard shortcuts**, komut paleti.
- **Dark/light** tema geçişi (projede ağırlık dark; Appearance’da light “coming soon”).
- **Bildirim merkezi** ve e-posta şablonları (ayarlar kısmen UI).
- **Sürüm geçmişi** (entry versioning) — Strapi’de sınırlı / eklenti.

---

## 12. Bu projede zaten güçlü veya Strapi’ye yakın olanlar

- İçerik tipleri grid’i, renk kodları, **Collection / Single Type** ayrımı (oluşturma akışı + builder’da rozet).
- Alan ekleme modalında **geniş Strapi alan tipi paleti** ve renkli seçim.
- **Locale seçici** ile editör deneyimi (görsel).
- **Medya kütüphanesi** için klasör ağacı ve grid/list UI iskelesi.
- **Dashboard**, **API Permissions** mock’u, **Settings** çok sekmeli yapı.
- **Admin panel i18n** (JSON dosyaları + Ayarlar’da panel dili).

Bunlar “ürün kabuğu” için iyi bir temel; eksik olan çoğunlukla **kalıcılık ve API**.

---

## 13. “Lightweight headless CMS” için önceliklendirilmiş yol haritası

### Faz A — Çekirdek (olmazsa olmaz)

1. **Backend + DB:** Tek içerik tablosu veya JSONB ile esnek şema; ya da içerik tipi başına tablo üreten basit motor.
2. **REST API:** CRUD + `filters` + `pagination` (basit operatörlerle başla).
3. **Kimlik doğrulama:** Admin için JWT veya session; en az bir **Admin** rolü.
4. **Medya:** Upload endpoint + dosya metadata tablosu + public URL.

### Faz B — Strapi benzeri deneyim

5. **Taslak/yayın** alanları ve listede filtre.
6. **Populate** (en az 1 seviye ilişki).
7. **i18n:** `locale` kolonu veya JSON yapı; API `locale` parametresi.
8. **API token** (read-only / full) ve middleware ile koruma.

### Faz C — Derinleşme

9. Bileşen + dynamic zone için **gerçek veri modeli** ve editörde iç içe form.
10. Webhook’lar (isteğe bağlı kuyruk ile).
11. Plugin hook noktaları (lifecycle benzeri).
12. OpenAPI dokümanı.

---

## 14. Sonuç

Strapi’de olan ama bu projede **henüz olmayan** başlıca başlıklar:

1. Kalıcı veri ve migration stratejisi  
2. Otomatik veya yarı otomatik **REST/GraphQL API**  
3. **Kimlik doğrulama ve gerçek RBAC**  
4. **Dosya yükleme ve işleme** (medya pipeline)  
5. **Sunucu tarafı doğrulama ve iş kuralları**  
6. **Taslak/yayın ve önizleme** entegrasyonu  
7. **i18n içerik** kalıcılığı ve API sözleşmesi  
8. **Eklenti çalışma zamanı** (sadece UI değil)  
9. **Operasyonel araçlar** (CLI, transfer, izleme)  

Bu liste, “Strapi’nin her şeyini kopyala” değil, **lightweight** bir ürün için **nereden başlanacağını** ve **nerede bilinçli olarak sade kalınacağını** görmek içindir. İstersen bir sonraki adımda Faz A maddelerini teknik görevlere (issue checklist) bölebiliriz.

---

## 15. Genel olarak bir CMS’de olması beklenenler (Strapi’den bağımsız)

Aşağıdaki liste **herhangi bir headless / hybrid CMS** için yaygın beklentileri özetler. Strapi’ye özel olmayan maddeler; ürünü “developer-safe, lightweight panel” olarak konumlandırırken hangi boşlukların **tasarımda bile** düşünülmesi gerektiğini ayırmak kolaylaşır.

### 15.1 Kimlik, oturum ve güvenlik

| Beklenti | Bu projede (şu an) | Not |
|----------|---------------------|-----|
| Admin girişi (kim benim?) | Yok | Panel açık; üretimde asla böyle bırakılmamalı. |
| Oturum süresi, çıkış, “başka yerde açıldı” | Yok | Tasarımda: hesap menüsü, session uyarısı. |
| Rol / izin ile ekran gizleme (read-only editör vb.) | Mock | **Safe lightweight:** UI, “yetkin yok” durumunu gösterebilmeli (§8 ile aynı eksen). |
| CSRF / güvenli cookie (backend gelince) | — | Tasarım aşamasında formların yapısı buna uygun kalsın. |
| İçerikte XSS / zengin metin sanitization | Yok | Editör + API birlikte düşünülmeli (§2, §4). |
| Oran sınırlama, brute-force (login) | Yok | Backend fazında. |

### 15.2 İçerik yaşam döngüsü

| Beklenti | Bu projede | Not |
|----------|------------|-----|
| Oluştur / oku / güncelle / sil | UI var, kalıcı veri yok | §2, §3. |
| Taslak vs yayın | UI mock | §6. |
| Silinenleri geri al (soft delete / çöp kutusu) | Yok | Hafif CMS’te opsiyonel ama güvenlik için değerli. |
| Kim yaptı, ne zaman (audit trail) | Yok | §6, §11; compliance için önemli. |
| Çakışma: iki editör aynı kayıt | Yok | İleride optimistic lock veya “başkası kaydetti” uyarısı. |

### 15.3 Medya ve dosyalar

| Beklenti | Bu projede | Not |
|----------|------------|-----|
| Yükleme, silme, değiştirme | Mock | §5. |
| Boyut / tip limiti, virüs taraması (kurumsal) | Yok | Lightweight’te en azından tip + max size. |
| Erişim URL’leri (public vs private) | Yok | Tasarımda medya detayında “public link” alanı düşünülebilir. |

### 15.4 Keşfedilebilirlik ve operasyon

| Beklenti | Bu projede | Not |
|----------|------------|-----|
| Sağlık / sürüm endpoint’i | Yok | DevOps için; §10. |
| Yedekleme, geri yükleme | Yok | Ürün vaadi yazılırken netleştirilmeli. |
| Arama (full-text, filtre) | Kısmi UI | Content list arama alanı var; gerçek sorgu yok (§3). |
| Webhook / event | Yok | §3, §9. |
| Dokümantasyon (API nasıl kullanılır) | Yok | Developer-safe ürün için OpenAPI veya örnek istekler şart (§3, §10). |

### 15.5 Çok dillilik ve erişilebilirlik

| Beklenti | Bu projede | Not |
|----------|------------|-----|
| İçerik çevirileri | UI kısmen | §7. |
| Panel dilini değiştirme | Var (JSON) | §12. |
| Klavye, ekran okuyucu, kontrast (a11y) | Kısmen | “Lightweight” panelde bile temel a11y tasarım checklist’i eksik sayılabilir. |

### 15.6 Geliştirici deneyimi (CMS tüketen ekip)

| Beklenti | Bu projede | Not |
|----------|------------|-----|
| Stabil API sözleşmesi, versiyonlama | Yok | §3. |
| Tip güvenli istemci (OpenAPI → types) | Yok | Sonra eklenecek. |
| Sandbox / preview API anahtarı | Mock | §8. |
| Yerel geliştirme hikayesi (`docker compose up`) | Yok | Repo henüz sadece front. |

---

## 16. Kıyaslama: §1–14 (Strapi odağı) ile §15 (genel CMS) nasıl örtüşüyor?

Aynı eksiklikler farkı kelimelerle tekrar ediyor; tek satırda eşleme:

| Genel CMS sütunu (§15) | Bu dokümanda detaylı anlatıldığı bölümler |
|-------------------------|-------------------------------------------|
| Kimlik ve güvenlik | §8, §3 (rate limit), §2 (sunucu doğrulama) |
| İçerik yaşam döngüsü | §2, §6, §11 |
| Medya | §5, §4.6 |
| API ve entegrasyon | §3, §10 |
| Modelleme | §4 |
| i18n | §7 |
| Eklentiler / genişleme | §9 |
| Admin UX | §11, §12 |

**Özet:** Strapi karşılaştırması (§1–14) aslında **genel CMS gereksinimlerinin** Strapi dilinde yazılmış detaylı bir alt kümesi. §15, aynı boşlukları **ürün-agnostik** dilde tekrar gruplayarak ekiplerin “Strapi kullanmayacağız ama CMS yine CMS” demesini kolaylaştırır.

---

## 17. Şu anki kapsam: sadece tasarım — ne “eksik” sayılır, ne bilinçli olarak ertelenir?

Hedef: **developerlar için safe, lightweight** bir admin paneli. Şimdilik **yalnızca tasarım (UI/UX prototipi)** ile sınırlı olduğunuz için aşağıdaki ayrım net olmalıdır.

### 17.1 Backend yokluğu — bugün “beklenen eksik”, yanıltıcı olmamak

- Token ekranı, izin matrisi, “Save” ile `alert` gibi öğeler **görsel prototip**; güvenlik vaadi oluşturmamalı.
- **Safe** yaklaşım: README veya iç dokümanda “auth ve API yok, demo panel” ibaresi (isteğe bağlı ama önerilir).

### 17.2 Tasarım fazında hâlâ eklenebilecek “CMS paneli” eksikleri (kod backend gerektirmez)

Bunlar Strapi’ye özel değil; **iyi bir CMS kabuğu** için faydalı:

- **Boş durumlar:** içerik listesi 0 kayıt, medya boş, arama sonucu yok.
- **Yükleme iskeletleri:** tablo ve kartlarda skeleton.
- **Hata durumları:** form validasyon mesajları, “kaydedilemedi” toast (şu an çoğu mutlu yol).
- **Onay diyalogları:** silme, toplu işlem, yayına alma (UI only).
- **Salt okunur mod:** “Viewer” rolü için butonların disabled + tooltip (§8 mock’unu tamamlar).
- **Klavye / odak:** modal trap, Escape ile kapanma (kısmen var, tutarlılık).
- **Responsive:** uzun formlar, geniş tablolar, mobil sidebar (kısmen var).

Bunlar §11 ile örtüşür; fakat **§15.1–15.5** ile birlikte düşünülünce “henüz backend yok ama panel profesyonel hissediyor” hedefini destekler.

### 17.3 Bilinçli olarak sonraya bırakılanlar (tasarım aşamasında zorunlu değil)

- Gerçek DB, migration, webhook kuyruğu, e-posta gönderimi, 2FA, enterprise audit.
- Bunlar §13 Faz A–C ve §15 tablolarında zaten “yok” olarak işaretli.

### 17.4 Lightweight + safe için tek cümlelik ürün sınırı (öneri)

> “Bu panel, içerik modeli ve editör akışlarını doğrulamak için tasarlanmıştır; kimlik doğrulama ve veri kalıcılığı entegrasyon fazında eklenecektir.”

Bu cümle, developer tüketicisine **yanlış güvenlik beklentisi** vermeden roadmap’i çerçeveler.

---

## 18. Piyasada CMS’lerde “en çok giden” eklenti türleri (ücretsiz / açık kaynak odaklı)

Bu bölüm, **WordPress** (en geniş eklenti ekonomisi), **Strapi Market** (headless, indirme / kategori yapısı), **Sanity** ve benzeri platformlardaki **yaygın ihtiyaç kümelerine** dayanır; tek tek indirme sıralaması zamanla değiştiği için **kategori bazlı** yazılmıştır. Amaç: lightweight, ücretsiz katmanlı bir panelde **hangi eklenti fikirlerinin** önce düşünüleceğini netleştirmek.

### 18.1 Neden kategori bazlı?

- Resmi marketlerde “en popüler” liste sık güncellenir; **tür** (medya, SEO, i18n…) daha stabil bir planlama verir.
- Strapi Market örneğinde yüzlerce eklenti; kategoriler arasında **Custom fields**, **Deployment**, **Monitoring**, **Documentation / GraphQL** gibi başlıklar öne çıkar ([Strapi Market](https://market.strapi.io/) — indirme sayısına göre sıralama orada yapılabilir).
- WordPress tarafında yıllardır tekrar eden “top plugin” listeleri: **SEO**, **önbellek / performans**, **yedekleme**, **güvenlik**, **formlar**, **çok dil** aynı çekirdek ihtiyaçlara işaret eder.

### 18.2 En sık talep gören eklenti / entegrasyon türleri

| Kategori | Ne işe yarar? | Ücretsiz / FOSS örnekleri (ekosistem) | Lightweight CMS’te karşılığı |
|----------|---------------|--------------------------------------|--------------------------------|
| **Depolama / CDN medya** | Dosyaları S3, Cloudinary, Uploadcare vb. üzerinde tutma | Strapi upload provider eklentileri; WP “offload” tarzı | Medya adaptörü + URL imzalama |
| **E-posta** | Bildirim, şifre sıfırlama, form gönderimi | SMTP, Resend, SendGrid entegrasyonları (çoğu freemium API) | Tek SMTP veya transactional sağlayıcı |
| **Arama** | Admin + public API’de full-text / filtre | Algolia / Meilisearch (açık kaynak: Meilisearch); WP arama eklentileri | Basit: DB `LIKE`; ileri: Meilisearch |
| **SEO** | Meta, sitemap, canonical, OG | Yoast / Rank Math (WP); headless’te genelde **front-end** veya API alanları | İçerik modelinde SEO alanları + sitemap endpoint |
| **Çok dil / çeviri** | Locale bazlı içerik, makine çevirisi | WPML alternatifleri, DeepL/Google API; projede **Gemini çeviri** UI iskelesi | i18n API + isteğe bağlı çeviri eklentisi |
| **Analitik / hata izleme** | Kullanım ve hata görünürlüğü | Sentry, Plausible, Umami (açık kaynak) | Opsiyonel telemetry eklentisi |
| **Kimlik / OAuth** | Google / GitHub ile giriş | Strapi users-permissions uzantıları; NextAuth vb. | Admin SSO (sonra) |
| **Webhook & otomasyon** | Zapier, Make, özel HTTP | Neredeyse tüm headless CMS’lerde standart | Event → POST kuyruğu |
| **Şema / özel alan** | Editörde ekstra alan tipleri | Strapi’de “Custom fields” kategorisi çok kalabalık | Plugin ile yeni field renderer |
| **Dokümantasyon API** | OpenAPI / Swagger | Strapi Documentation plugin; codegen araçları | `/openapi.json` üretimi |
| **Yedekleme / taşıma** | Ortamlar arası içerik | WP UpdraftPlus; Strapi transfer tokens | Export JSON / CLI (minimal) |
| **Güvenlik** | 2FA, rate limit, WAF (WP’de yaygın) | Çoğu uygulama katmanında | Rate limit, CORS, helmet (backend) |
| **Önbellek / performans** | Sayfa önbelleği (klasik CMS) | WP cache eklentileri | Headless’ta çoğunlukla **CDN + edge**, CMS’te az |
| **Formlar** | İletişim formu → e-posta / CRM | Contact Form 7, WPForms | Ayrı form servisi veya tek “form” content-type |
| **Çerez / KVKK** | Onay banner’ı | Cookiebot, özel script; projede **Cookie Management** kartı | Script + tercih saklama |
| **Zamanlama / yayın** | İleri tarihli yayın | WP scheduled post; Strapi releases (ürün/plana bağlı) | `publishedAt` + cron |

### 18.3 “Ücretsiz koyalım” için öncelik sırası (bu proje hedefiyle uyumlu)

**Maliyet sıfır = genelde açık kaynak yazılım + kendi barındırma veya ücretsiz kotası olan API** (e-posta, çeviri gibi). Aşağıdaki sıra, **developer-safe lightweight panel** için makul bir yol haritasıdır:

1. **Webhook** — tek HTTP POST; backend küçükse bile çok değer katar.  
2. **OpenAPI / örnek istekler** — entegrasyon sürtünmesini düşürür (§15.4).  
3. **Medya depolama adaptörü** — local disk → S3 uyumlu tek adaptör.  
4. **E-posta (SMTP veya tek sağlayıcı)** — kullanıcı davetiyesi, sıfırlama.  
5. **Arama** — önce basit DB; sonra Meilisearch eklentisi.  
6. **Sentry / Umami** — opsiyonel “Monitoring” eklentisi.  
7. **Çeviri (Gemini / DeepL)** — API anahtarı kullanıcıda; siz sadece köprü (projede UI başlangıcı var).  
8. **Yedek export** — JSON dump; restore ikinci aşama.  
9. **OAuth giriş** — ürün olgunlaşınca.  
10. **Gelişmiş SEO sitemap** — genelde ayrı mikroservis veya front-end; CMS’te alan + endpoint yeterli olabilir.

### 18.4 Bilinçli olarak “eklenti yapmaya değmez” veya sonraya bırakılabilir

- Klasik **sayfa önbelleği** (WP tarzı) — saf headless’ta edge/CDN işi.  
- Ağır **sayfa oluşturucu** (visual builder) — ürünü “lightweight” dışına iter.  
- **Çok sayıda ödeme / e-ticaret** eklentisi — ayrı ürün veya entegrasyon listesi olarak kalsın.

### 18.5 Özet cümle

CMS piyasasında **en çok giden** şey tek bir eklenti adı değil; **medya, e-posta, arama, webhook, i18n/çeviri, izleme, dokümantasyon ve yedek** gibi **entegrasyon katmanlarıdır**. Ücretsiz katman için önce **açık protokoller** (webhook, OpenAPI, S3 API, SMTP) ve **self-host / FOSS** (Meilisearch, Umami, Sentry SDK) üzerine eklenti kancaları koymak, uzun vadede sürdürülebilir ve “safe” bir stratejidir.

---

## 19. Tek kontrol listesi: bu dokümanda geçen × projede şu an yok / kısmen

Aşağıdaki liste **§1–18 ve §17.2** içinde adı geçen beklentilerin; **wolent** deposundaki mevcut koda göre özet envanteridir. *(Amaç: “dokümanda yazılan ama üründe henüz olmayan” tek yerden görülsün.)*

**Durum anahtarı:** `YOK` = çalışan backend/özellik yok · `MOCK` = yalnızca arayüz veya localStorage/demo · `KISMI` = parça var, dokümandaki tanım tam karşılanmıyor.

### 19.1 Çekirdek backend, API, veri

| # | Madde (doküman kaynağı) | Durum |
|---|-------------------------|--------|
| 1 | Gerçek veritabanı, ORM, migration (§2, §13) | YOK |
| 2 | Kalıcı içerik CRUD (§1, §15.2) | YOK |
| 3 | Otomatik REST uçları, filtre/sort/pagination operatörleri (§3) | YOK |
| 4 | GraphQL + introspeksiyon (§3) | YOK |
| 5 | `populate`, derin ilişki (§3, §13) | YOK |
| 6 | `publicationState` (draft/live) API’de (§3) | YOK |
| 7 | OpenAPI/Swagger üretimi (§3, §15.4, §18) | YOK |
| 8 | Sunucu tarafı rate limit, CORS, güvenlik başlıkları (§3, §15.1) | YOK |
| 9 | Gerçek webhook tetikleme (event → HTTP) (§3, §9, §18) | YOK |
| 10 | Transaction, FK/cascade, sunucu doğrulama (§2) | YOK |
| 11 | Lifecycle hooks, policies/middleware (§2) | YOK |
| 12 | API sürümleme, stabil sözleşme (§15.6) | YOK |
| 13 | Ortam değişkeniyle bağlı API katmanı (§10) | YOK |
| 14 | CLI, transfer/backup token, health/version endpoint (§10, §15.4) | YOK |
| 15 | `docker compose` / tek komutla tam stack (§15.6) | YOK |

### 19.2 Kimlik, yetki, güvenlik

| # | Madde | Durum |
|---|--------|--------|
| 16 | Admin login, JWT/session, çıkış (§1, §8, §15.1) | YOK |
| 17 | Granüler RBAC (ekran/alan bazlı gerçek kısıt) (§8, §15.1) | MOCK |
| 18 | 2FA, şifre sıfırlama, e-posta doğrulama (§8, §15.1) | YOK |
| 19 | CSRF koruması, güvenli cookie (sunucu) (§15.1) | YOK |
| 20 | İçerik/XSS sunucu tarafı sanitization (§15.1) | YOK |
| 21 | Brute-force / login rate limit (§15.1) | YOK |

### 19.3 Medya

| # | Madde | Durum |
|---|--------|--------|
| 22 | Gerçek dosya yükleme ve depolama (§5) | YOK |
| 23 | S3/Cloudinary adaptörü, imzalı URL (§5, §18) | YOK |
| 24 | Görsel varyantları, kırpma, focal point (§5) | YOK |
| 25 | MIME/boyut limiti sunucuda (§15.3) | YOK |
| 26 | Toplu işlem, replace, video pipeline (§5) | KISMI / YOK |

### 19.4 Modelleme (Builder derinliği)

| # | Madde | Durum |
|---|--------|--------|
| 27 | Alan başına min/max, regex, default, private, unique zorlaması (§4.1) | YOK |
| 28 | İlişki editörü (mappedBy, arama, çoklu) (§4.2) | KISMI (demo select) |
| 29 | Global component kütüphanesi + DZ gerçek veri ağacı (§4.3) | YOK |
| 30 | UID otomatik slug / sunucuda benzersizlik (§4.4) | YOK |
| 31 | Enumeration şemada sabit (builder’da serbest metin) (§4.5) | KISMI |
| 32 | Medya alanı çoklu/MIME yapılandırması (§4.6) | YOK |

### 19.5 Yayınlama, i18n içerik, iş akışı

| # | Madde | Durum |
|---|--------|--------|
| 33 | Taslak/yayın kalıcılığı ve public API ayrımı (§6) | MOCK |
| 34 | Önizleme URL + secret (§6) | YOK |
| 35 | Zamanlanmış yayın / releases (§6, §18) | YOK |
| 36 | Audit log (§6, §11, §15.2) | YOK |
| 37 | Soft delete / çöp kutusu (§15.2) | YOK |
| 38 | Eşzamanlı düzenleme kilidi (§15.2) | YOK |
| 39 | İçerik locale verisinin API ile sunulması (§7) | YOK |

### 19.6 Eklenti çalışma zamanı ve §18 entegrasyonları

| # | Madde | Durum |
|---|--------|--------|
| 40 | Plugin register/bootstrap, admin’e route enjekte (§9) | YOK |
| 41 | SMTP / transactional e-posta (§18) | YOK |
| 42 | Meilisearch/Algolia vb. arama motoru bağlantısı (§18) | YOK |
| 43 | Sentry/Umami/Plausible gerçek entegrasyon (§18) | YOK |
| 44 | OAuth/SSO admin (§18) | YOK |
| 45 | SEO sitemap/canonical üretimi (sunucu) (§18) | YOK |
| 46 | Yedek export/import gerçek dosya (§18) | YOK |
| 47 | Form → CRM/e-posta hattı (§18) | YOK |
| 48 | Cookie/KVKK: tercih + script enjeksiyonu üretimde (§18) | MOCK (sadece kart) |

**Not (projede UI var, API yok):** Gemini Auto Translate — anahtar `localStorage`’da; **Gemini HTTP çağrısı ve çeviri işlemi yok** (§7, §18 ile ilişkili “çeviri köprüsü” henüz tamamlanmadı).

### 19.7 Admin UX ve tasarım fazı (§11, §17.2)

| # | Madde | Durum |
|---|--------|--------|
| 49 | Sütun özelleştirme, kayıtlı liste görünümleri (§11) | YOK |
| 50 | Toplu sil/yayınla (§11) | YOK |
| 51 | Duplicate entry, import/export CSV-JSON (§11) | YOK |
| 52 | Komut paleti, kısayollar (§11) | YOK |
| 53 | Light tema çalışır halde (§11) | YOK (coming soon) |
| 54 | Bildirim merkezi (gerçek) (§11) | YOK |
| 55 | Entry versioning (§11) | YOK |
| 56 | Boş durum / skeleton / hata toast tutarlılığı (§17.2) | KISMI |
| 57 | Silme/yayın onay modalları (her yerde) (§17.2) | KISMI |
| 58 | Viewer rolü salt okunur UI (§17.2) | YOK |
| 59 | Tam a11y checklist (§15.5) | KISMI |

### 19.8 Projede var (dokümandaki “eksik” ile karışmasın — §12 güncel)

- Admin panel **UI** (layout, dashboard, content types, builder, liste, editör, medya **görünümü**, ayarlar, API permissions **ekranı**, plugins sayfası).  
- **Panel dili** (`src/locales` + Ayarlar).  
- **Strapi tarzı alan tipleri** ve renkli seçim; seçili demo tiplerde **şemaya bağlı dinamik editör**.  
- **Cookie** ve **Gemini** eklenti **kartları** + Gemini için tarayıcıda anahtar saklama (işlev değil).

### 19.9 Önceki bölümlerde geçen, 19.1–19.7 tablolarında adı açıkça çıkmayanlar

| # | Madde (kaynak) | Durum |
|---|----------------|--------|
| 60 | Medya **virüs taraması** (kurumsal) §15.3 | YOK |
| 61 | **OpenAPI → istemci / TypeScript codegen** §15.6 | YOK |
| 62 | **Preview / sandbox API anahtarı** sunucuda doğrulama §15.6 | MOCK |
| 63 | Ayarlarda **e-posta şablonları** yönetimi (gerçek gönderim) §11 | YOK |

### 19.10 Ürün kapsamı dışı (eksik değil — §18.4 bilinçli yok)

Bunlar dokümanda geçer ama “lightweight headless” hedefiyle **bilinçli olarak yapılmıyor**: klasik **tam sayfa önbellek** (WP tarzı), ağır **görsel sayfa oluşturucu**, **ödeme / e-ticaret eklenti yığını**. Projede olmamaları roadmap hatası sayılmaz.

---

*Dosya adı notu: Tam metin `eksikler.md` içindedir. `eksiler.md` §19 numaralı indeks + özet içerir.*
