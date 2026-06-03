# Wolent CMS — İçerik Türü ve İlişki Alanları UX İyileştirme Planı

> **Kapsam:** Yalnızca analiz ve plan. Uygulama kodu bu belgede yok.  
> **İncelenen dosyalar:**  
> - `packages/admin/src/app/components/ContentBuilder.tsx`  
> - `packages/admin/src/app/components/ContentTypes.tsx`  
> - `packages/core/src/content-engine/service.ts`  
> - İlgili: `packages/utils/src/types/content.ts`, `packages/admin/src/app/data/contentPresets.ts`, `packages/admin/src/app/lib/contentTypeCache.ts`, `packages/admin/src/app/components/DynamicSchemaFields.tsx`, `packages/admin/src/locales/tr.json`

---

## Özet

İçerik türü oluşturma akışı teknik kavramlara (API ID, `manyToOne`, ham entry ID) dayanıyor. **İlişki hedefi için görünen ad dropdown’u `ContentBuilder` içinde kısmen var**, ancak şema kaydı ve içerik düzenleme tarafında ilişki metadata’sı kayboluyor veya hiç yazılmıyor. Bu belge, sorunu uçtan uca tanımlar ve beş başlık altında uygulanabilir bir yol haritası sunar.

---

## 1. Mevcut Durum Analizi

### 1.1 Veri modeli (backend)

`packages/utils/src/types/content.ts` içindeki `FieldDefinitionSchema`, ilişki alanları için resmi alanları tanımlar:

| Alan | Amaç |
|------|------|
| `type: 'relation'` | Alan türü |
| `targetType` | Hedef içerik türü (uid veya `singularName`) |
| `relation` | `oneToOne` \| `oneToMany` \| `manyToOne` \| `manyToMany` |

`packages/core/src/content-engine/service.ts` — `ContentTypeService`:

- `create` / `update`: Gelen gövdeyi (renk/ikon ayrılarak) `schema` JSON olarak saklar; `attributes` doğrudan şemaya yazılır.
- `list` / `findByUid`: Şemayı admin’in beklediği düz `{ attributes }` biçimine açar.
- `singularApiId` → `singularName` alias normalizasyonu vardır (satır 61–64, 98–101).

`EntryService` ilişki alanlarını **ayrı bir join tablosu olmadan** entry `data` JSON içinde saklar. `validator.ts` ilişki için yalnızca hafif tip kontrolü yapar; `targetType` ile hedef kaydın varlığını doğrulamaz.

`resolveContentType` (satır 147–151): `uid` tam format (`api::blog-post.blog-post`) veya kısa `singularName` (`blog-post`) ile çözümleme yapar — admin tarafında hedef olarak **tercihen `singularName` kullanılmalı** (okunabilir, preset’lerle uyumlu).

### 1.2 Admin — şema oluşturma (`ContentBuilder`)

**Bileşen:** `ContentBuilder` (`export function ContentBuilder`)

**Alan modeli (UI):** Yerel `Field` arayüzü (satır 37–44): `id`, `name`, `type`, `required`, `description?`, `enumerationValues?` — **`targetType` ve `relation` yok.**

**İlişki UI (ekleme modalı):**

- `relationType` state: `oneToOne` \| `oneToMany` \| `manyToOne` \| `manyToMany` (varsayılan `manyToOne`, satır 275–278).
- `relationTarget` state: varsayılan `"categories"` (sabit string, satır 275).
- `availableCollections`: `api.contentTypes.list()` ile doldurulur; dropdown **görünen ad** gösterir, değer olarak `uid` kullanır (satır 283–293, 798–808).
- İlişki türü seçimi: dört kart, İngilizce başlık + örnek alt metin (satır 766–791).

**Kritik boşluk — kaydetme (`handleSave`, satır 298–334):**

```ts
attributes[f.name] = { type: f.type, required: f.required };
// + description, enum ...
```

`relation` alanı eklendiğinde yalnızca `type: 'relation'` gider; **`targetType` ve `relation` API’ye yazılmaz.** Modalda seçilen hedef ve tür yalnızca `description` metnine sıkıştırılır:

```ts
description = `Relation (${relationType}) with ${target?.name ?? relationTarget}`;
```

(`addField`, satır 344–358)

**Kritik boşluk — düzenleme yükleme (satır 248–258):**

Şemadan alanlar yüklenirken `targetType` / `relation` okunmaz; ilişki alanı düzenlenemez, modal yeniden açılsa bile bilgi kayıp.

**Diğer teknik sürtünmeler:**

- `STRAPI_FIELD_TYPES` etiketleri kod içinde İngilizce sabit (satır 47–73); `tr.json` altında `contentBuilder.fieldTypes` tanımlı olsa da **kullanılmıyor**.
- `apiIdSingular` / `apiIdPlural` alanları kullanıcıya açık; slug üretimi manuel.
- `i18n`, `reviewWorkflow` toggle’ları kaydedilir; backend’de bu bayrakların entry düzeyinde etkisi belirsiz (UX beklentisi ile uyumsuzluk riski).
- Gelişmiş sekme API anahtarlarını salt okunur gösterir — geliştirici odaklı.

### 1.3 Admin — liste ve oluşturma (`ContentTypes`)

**Bileşen:** `ContentTypes`, alt bileşenler:

| Bileşen | Dosya içi | Rol |
|---------|-----------|-----|
| `ContentTypes` | ana export | Liste, silme, preset uygulama |
| `CreateContentTypeModal` | satır 749–982 | Ad, renk, ikon, collection/single seçimi |
| `PresetsModal` | satır 633–714 | Şablon galerisi |
| `DuplicateCollectionModal` | satır 528–631 | Kopyalama |

**Oluşturma akışı (kısmi sihirbaz):**

1. `CreateContentTypeModal` → `navigate('/content-types/create/builder?kind=...', { state })`
2. `ContentBuilder` (`id === 'create'`) state’ten `displayName`, `singularId`, `pluralId`, `color`, `icon` alır.

API ID’ler modalda **disabled** input olarak gösterilir (`displayName.toLowerCase()` türetimi) — kullanıcı “API Kimliği” kavramını yine görür.

**Preset uygulama (`applyPreset`, satır 144–199):**

- Kaynak: `packages/admin/src/app/data/contentPresets.ts` — `contentPresets` dizisi.
- Her alan için `attributes[apiName] = { type, required, description? }` — ilişkiler için `targetType`/`relation` **yine yok**; açıklama metni örn. `"manyToOne → Blog Category"`.
- Çakışma kontrolü: `apiId` bazlı (`existing.has(t.apiId)`).

Mevcut şablonlar: Blog, Gallery, Header & Footer, Landing, FAQ, Testimonials — **Product ve Portfolio yok.**

### 1.4 Admin — içerik girişi (`DynamicSchemaFields`)

**Bileşen:** `DynamicSchemaFields` — `case "relation"` (satır 238–254):

- Tek satırlık metin input, placeholder: `"İlişki ID gir…"`.
- Hedef tür veya kayıt seçici yok; kullanıcı entry UUID’sini bilmek zorunda.

`contentTypeCache.ts` — `apiTypeToDemoType`: Şemadan `targetType`/`relation` `DemoField`’a aktarılmıyor; etiket `apiName`’den türetiliyor.

### 1.5 Kullanıcı için kafa karıştıran noktalar (özet tablo)

| Sorun | Nerede | Etki |
|-------|--------|------|
| API ID zorunlu görünürlük | `ContentTypes` kartları, `CreateContentTypeModal`, `ContentBuilder` temel sekme | Teknik olmayan kullanıcı geri çekilir |
| İlişki metadata kaydedilmiyor | `ContentBuilder.handleSave`, `ContentTypes.applyPreset` | İlişki “süs metin”; API/GraphQL tüketicileri hedefi bilemez |
| `manyToOne` jargonu | İlişki modalı, preset açıklamaları | İlişki türü seçimi anlaşılmaz |
| Entry düzenlemede ham ID | `DynamicSchemaFields` | Post → Category bağlantısı pratikte kullanılamaz |
| İlişki düzenleme yok | `ContentBuilder` alan listesi | Kayıtlı ilişki alanı değiştirilemez |
| Varsayılan hedef `"categories"` | `relationTarget` initial state | Boş projede yanlış/çalışmayan varsayılan |
| İngilizce alan türü etiketleri | `STRAPI_FIELD_TYPES` | TR arayüz tutarsız |
| Preset ilişkileri kopuk | `contentPresets.ts` | Şablon uygulansa bile ilişki çalışmaz |

### 1.6 İdeal hedef şema örneği (referans)

Post → Category (`manyToOne`) için kayıtlı attribute örneği:

```json
{
  "category": {
    "type": "relation",
    "relation": "manyToOne",
    "targetType": "blog-category",
    "required": false,
    "description": "Yazının bağlı olduğu kategori"
  }
}
```

Entry `data` içinde: `"category": "<hedef-entry-uuid>"` (veya ileride `documentId`).

---

## 2. İlişki Alanı UX İyileştirmesi

### 2.1 Hedef deneyim

Kullanıcı şunu yapabilmeli:

1. “Bu alan hangi içerik türüne bağlansın?” → **Görünen ad** listesinden seçim (Blog Category, Ürün Kategorisi, …).
2. “Bir kayıt mı, birden fazla mı?” → **Sade dil** ile seçim (çoğu senaryoda varsayılan: “Her yazı **bir** kategoriye bağlanır”).
3. İçerik yazarken → **Arama yapılabilir kayıt seçici** (ID yazmadan).

Teknik `uid` / `singularName` eşlemesi UI katmanında gizlenir.

### 2.1.1 Mevcut dropdown’u tamamlama (`ContentBuilder`)

**Dosya:** `ContentBuilder.tsx`  
**State genişletmesi:** `Field` arayüzüne ekle:

```ts
targetType?: string;      // singularName (tercih) veya uid
relation?: 'manyToOne' | ...;
targetDisplayName?: string; // liste gösterimi için cache
```

**`addField`:** `description` yerine/yanında `targetType` + `relation` set et.

**`handleSave`:** Her relation alanı için:

```ts
attr.targetType = resolveTargetSingularName(relationTarget);
attr.relation = relationType;
```

**`useEffect` (edit yükleme):** `d.targetType`, `d.relation` oku; alan satırında insan okunur özet göster:  
`"Kategori (Blog Category) · Her kayıt bir hedefe bağlanır"`.

**`availableCollections` düzeltmesi (satır 286–290):**

- `id`: `singularName` (API çözümlemesi ile uyumlu).
- `name`: `displayName`.
- `uid`: yedek / GraphQL için saklanabilir ama dropdown value olarak kullanılmamalı.
- `pluralApiId` yerine `pluralName` kullan (şu an `pluralApiId` API yanıtında olmayabilir → boş kalıyor).

### 2.2 İlişki türü — sadeleştirilmiş UI

**Bileşen (yeni öneri):** `RelationTypePicker.tsx`  
**Konum:** `packages/admin/src/app/components/`  
**Kullanım:** `ContentBuilder` add-field modalı.

| Teknik | Kullanıcı etiketi (TR) | Ne zaman önerilir |
|--------|------------------------|-------------------|
| `manyToOne` | **Tek seçim** — “Bu kayıt, şu türden **bir** kayda bağlanır” | Post → Category, Product → Brand |
| `oneToMany` | **Liste** — “Bu kayıt, diğer türden **birden fazla** kayda sahip olabilir” | Category → Posts (ters yön) |
| `oneToOne` | **Bire bir** | Profil → Kullanıcı |
| `manyToMany` | **Çoklu seçim** — “Birden fazla X, birden fazla Y” | Article ↔ Tags |

**UX kuralları:**

- Varsayılan: `manyToOne` (en yaygın).
- Gelişmiş mod: “Diğer ilişki türleri…” ile `oneToMany` / `manyToMany` açılır.
- Kart alt metinleri mevcut İngilizce örnekler yerine **mevcut içerik türü adlarıyla** dinamik:  
  `"Blog Post → Blog Category"` (`displayName` + seçilen hedef).

**i18n:** `packages/admin/src/locales/tr.json` (ve `en.json`, `de.json`) — `contentBuilder.relation.*` anahtarları.

### 2.3 Hedef içerik türü seçici

**Bileşen (yeni öneri):** `ContentTypeTargetSelect.tsx`

- Props: `value`, `onChange`, `excludeUid?` (kendi türüne ilişki engeli).
- Veri: `api.contentTypes.list()` — sıralama: `displayName` A–Z.
- Boş liste: “Önce bir içerik türü oluşturun” + link `/content-types`.
- Gruplama: Collection vs Single (single türler ilişkide nadir; isteğe bağlı filtre).

`ContentBuilder` satır 794–809’daki `<select>` bu bileşene taşınır.

### 2.4 İçerik girişi — ilişki seçici

**Dosya:** `DynamicSchemaFields.tsx`  
**Bileşen (yeni öneri):** `RelationEntryPicker.tsx`

- `field.targetType` ile `api/{singularName}` listesinden kayıt çeker (`entryService.list` REST: `GET /api/:uid`).
- Gösterim: `displayName` veya şemadaki ilk `text` alanı (title, name).
- Değer: entry `id` (mevcut validator ile uyumlu).
- `manyToMany` / `oneToMany`: çoklu seçim + chip listesi (ileriki faz).

**Bağımlılık:** `DemoField` genişletmesi (`packages/admin/src/app/data/demoContentTypes.ts`):

```ts
targetType?: string;
relation?: string;
```

`apiTypeToDemoType` (`contentTypeCache.ts`) bu alanları şemadan map’lemeli.

### 2.5 Backend / servis (minimal)

**Dosya:** `packages/core/src/content-engine/service.ts` — değişiklik zorunlu değil; şema zaten serbest JSON.

**İsteğe bağlı iyileştirme (Faz 2):**

- `validator.ts`: `relation` alanında `targetType` varsa entry oluştururken hedef id’nin varlığını kontrol et.
- `GET /api/content-types/:uid/entries-for-relation?search=` — hafif arama endpoint’i (büyük listeler için).

### 2.6 Migrasyon

Mevcut şemalarda ilişki yalnızca `description` içeriyorsa:

- Tek seferlik admin script veya `ContentBuilder` açılışında “İlişki alanlarını onar” uyarısı.
- Regex: `manyToOne → (.+)` ve preset `apiId` eşlemesi.

---

## 3. İçerik Türü Şablonları (Presets)

### 3.1 Mevcut durum

**Dosya:** `packages/admin/src/app/data/contentPresets.ts`  
**UI:** `ContentTypes` → `PresetsModal` → `applyPreset`

6 şablon var; ilişkiler açıklama string’inde. Kullanıcının istediği **Product** ve **Portfolio** eksik.

### 3.2 Eklenecek şablonlar (detay)

#### A. Product (E-ticaret / katalog)

| Tür | apiId önerisi | Alanlar |
|-----|---------------|---------|
| Product Category | `product-category` | name, slug (uid), description |
| Product | `product` | title, slug, description (text_long), price (number_float), sku (text), images (media, multiple), **category** (relation → product-category, manyToOne), featured (boolean) |
| Brand (opsiyonel) | `brand` | name, logo (media) — Product’ta brand (manyToOne) |

`build` fonksiyonu Blog preset yapısını kopyalar; `color`: `emerald` / `shopping-bag` ikonu (`ContentTypes.CT_ICON_OPTIONS`).

#### B. Portfolio

| Tür | apiId | Alanlar |
|-----|-------|---------|
| Project Category | `project-category` | name, slug |
| Project | `project` | title, slug, summary, body (blocks), cover (media), gallery (media, multiple), **category** (manyToOne), client (text), year (number_int), url (text) |
| Client (opsiyonel) | `client` | name, logo — Project’te manyToOne |

`color`: `violet`, ikon: `briefcase` veya `image`.

#### C. Mevcut Blog şablonu güçlendirme

`blogPostFields` içindeki `category` alanına şema metadata ekle:

```ts
targetType: "blog-category",
relation: "manyToOne",
description: "Yazının kategorisi",
```

Aynı pattern: Gallery, FAQ preset’lerindeki relation alanları.

### 3.3 Preset uygulama sırası (`ContentTypes.applyPreset`)

**Sorun:** İlişki, hedef tür oluşmadan eklenirse `targetType` geçersiz kalır.

**Çözüm planı:**

1. `preset.build()` çıktısını **topolojik sıraya** koy (önce Category, sonra Post).
2. İlk geçiş: ilişkisiz türleri oluştur.
3. İkinci geçiş: ilişkili türleri `targetType` dolu `attributes` ile oluştur.
4. Başarı mesajında hangi türlerin oluştuğu ve hangi ilişkilerin kurulduğu listelenir.

**Dosya değişiklikleri:**

- `contentPresets.ts` — yeni preset tanımları + metadata.
- `ContentTypes.tsx` — `applyPreset` iki fazlı oluşturma.

### 3.4 Preset UI (`PresetsModal`)

- Product / Portfolio kartları grid’e eklenir.
- Her kartta “Oluşturulacak türler” listesi ilişki oklarıyla:  
  `Product → Product Category`.
- Önizleme: “~8 alan, 2 koleksiyon” gibi özet.

---

## 4. Sihirbaz Akışı (Wizard)

### 4.1 Mevcut parçalar

| Adım | Bileşen | Durum |
|------|---------|--------|
| 1 | `CreateContentTypeModal` | Ad, tür, görünüm |
| 2 | `ContentBuilder` | Alanlar + gelişmiş ayarlar |

Sihirbaz **tamamlanmamış**: alan ekleme ve ilişki kurulumu tek ekranda; API ID hâlâ görünür.

### 4.2 Önerilen adımlar

**Yeni bileşen:** `ContentTypeWizard.tsx` (veya `ContentBuilder` içinde `wizardStep` state)

| Adım | Başlık | İçerik | Bileşen kaynağı |
|------|--------|--------|-----------------|
| 1 | Ne oluşturuyorsunuz? | Collection / Single kartları | `CreateContentTypeModal` type seçimi |
| 2 | İsim ve görünüm | displayName, renk, ikon | Modal + `AppearancePicker` |
| 3 | Alanlar | Sık kullanılan alanlar + “Alan ekle” | `ContentBuilder` alan listesi + sadeleştirilmiş modal |
| 4 | Bağlantılar (opsiyonel) | “Başka türlerle ilişki kur” — yalnızca hedef türler varsa | Yeni `WizardRelationsStep` |
| 5 | Yayın ayarları | draft/publish, i18n (basit dil) | `ContentBuilder` advanced (sadeleştirilmiş) |
| 6 | Özet ve oluştur | Tür adı, alan listesi, ilişki özeti; API ID **gizli**, “Gelişmiş” ile açılır | Yeni `WizardSummaryStep` |

**Rota seçenekleri:**

- **A:** `/content-types/create/wizard` tek route; mevcut `create/builder` redirect.
- **B:** `ContentBuilder` içinde stepper; `id === 'create'` iken wizard, edit modunda klasik iki sekme.

Öneri: **B** — daha az route karmaşası; `routes.tsx` değişimi minimal.

### 4.3 Wizard — ilişki adımı davranışı

- “Kategori / etiket / yazar bağlantısı eklemek ister misiniz?” → Evet ise:
  - Hedef tür dropdown (mevcut türler + “Yeni kategori türü oluştur” shortcut preset’e yönlendirir).
  - Tek soru: “Her kayıt bir X’e mi bağlansın?” → `manyToOne` otomatik.
- Oluşturulan alan adı önerisi: `category`, `author`, `tags` (hedef türe göre).

### 4.4 Wizard — API ID politikası

- Adım 2’de API ID **gösterilmez**; `displayName`’den slug üretimi arka planda (`CreateContentTypeModal` ile aynı mantık).
- Adım 6 özetinde: “Geliştirici kimliği: `blog-post`” collapsible.
- `ContentBuilder` edit modunda API ID yalnızca **Gelişmiş** sekmesinde kalır.

### 4.5 `SetupWizard` ile tutarlılık

**Referans:** `packages/admin/src/app/components/SetupWizard.tsx` — çok adımlı ilerleme, geri/ileri, validasyon.

Wizard footer: Geri | İleri | Oluştur — `SetupWizard` düğme stilleriyle hizala.

### 4.6 i18n anahtarları

`contentTypes.wizard.step1Title` … `step6Title` — `tr.json` / `en.json` / `de.json`.

---

## 5. Alan Açıklamaları ve Yardım Metinleri

### 5.1 Merkezi sözlük

**Yeni dosya:** `packages/admin/src/app/data/fieldHelp.ts`

Her `FieldType` için:

```ts
export interface FieldHelpEntry {
  labelKey: string;       // i18n: contentBuilder.fieldTypes.text
  shortHelpKey: string;   // contentBuilder.fieldHelp.text.short
  longHelpKey?: string;   // contentBuilder.fieldHelp.text.long
  nameHintKey?: string;   // örn. "küçük harf, alt çizgi: category"
  exampleKey?: string;
}
```

`STRAPI_FIELD_TYPES` bu sözlükten beslenir; hardcoded İngilizce `label` kaldırılır.

### 5.2 Gösterim yerleri

| Yer | Bileşen | UX öğesi |
|-----|---------|----------|
| Alan türü ızgarası | `ContentBuilder` add-field modal | Kart altında 1 cümle `shortHelp`; hover/`?` ile `longHelp` |
| Alan adı input | Aynı modal | `nameHint` placeholder altında |
| Zorunlu toggle | Satır 839–857 | “Yayınlamadan önce doldurulmalı” (`requiredHint` genişletmesi) |
| Liste satırı | Alan listesi (satır 584–586) | `description` yoksa `shortHelp`; relation için hedef özeti |
| İçerik editörü | `DynamicSchemaFields` | Her alan label altında `text-xs` help |
| Preset kartları | `PresetsModal` | Alan türü değil; tür düzeyi açıklama yeterli |

### 5.3 Örnek TR metinler (relation ve sık türler)

| Tür | Kısa yardım | Uzun yardım |
|-----|-------------|-------------|
| `relation` | Başka bir içerik türündeki kayda bağlantı. | Örneğin bir blog yazısını kategoriye bağlar. Kayıt seçerken listeden seçersiniz; teknik kimlik gerekmez. |
| `text` | Kısa metin (başlık, isim). | Tek satır; birkaç kelime veya cümle. |
| `blocks` | Zengin metin editörü. | Başlık, liste, görsel içeren sayfa gövdesi. |
| `media` | Dosya veya görsel. | Medya kütüphanesinden seçilir. |
| `uid` | URL dostu benzersiz kimlik. | Genelde başlıktan otomatik üretilir (slug). |
| `enumeration` | Sabit seçenek listesi. | Örn. durum: taslak, yayında. |
| `json` | Yapılandırılmış veri (gelişmiş). | Menü ağacı gibi özel yapılar; teknik bilgi faydalıdır. |
| `dynamiczone` | Esnek sayfa bölümleri. | Farklı bileşen türlerinin karışık sırası. |

### 5.4 İlişki türü yardımı

`contentBuilder.fieldHelp.relation.manyToOne` vb. — `RelationTypePicker` kartlarının alt metni buradan.

### 5.5 Erişilebilirlik

- `aria-describedby` ile help metni input’a bağlansın.
- `IconPicker` / renk seçimi zaten görsel; alan türleri için `title` attribute + klavye gezinimi korunsun.

---

## Uygulama Fazları (öncelik)

| Faz | İş | Dosyalar | Kullanıcı değeri |
|-----|-----|----------|------------------|
| **P0** | Relation metadata kaydet/yükle | `ContentBuilder.tsx`, `contentPresets.ts`, `ContentTypes.applyPreset` | Şablon ve builder ilişkileri gerçekten çalışır |
| **P0** | `apiTypeToDemoType` + `RelationEntryPicker` | `contentTypeCache.ts`, `DynamicSchemaFields.tsx`, yeni picker | İçerik girerken ID yazılmaz |
| **P1** | Hedef tür dropdown düzeltmesi (`singularName`) | `ContentBuilder.tsx`, `ContentTypeTargetSelect.tsx` | Doğru hedef çözümlemesi |
| **P1** | `RelationTypePicker` sade dil | Yeni bileşen + `tr.json` | manyToOne korkusu gider |
| **P2** | Product + Portfolio presets | `contentPresets.ts`, `PresetsModal` | Hızlı başlangıç |
| **P2** | İki fazlı preset oluşturma | `ContentTypes.tsx` | İlişkili şablonlar kırılmaz |
| **P3** | Tam wizard + API ID gizleme | `ContentTypeWizard` / `ContentBuilder`, `CreateContentTypeModal` | Uçtan uca sade akış |
| **P3** | `fieldHelp.ts` + i18n | `fieldHelp.ts`, locales, `ContentBuilder` | Her alan türü anlaşılır |

---

## Bağımlılık ve riskler

1. **Şema uyumu:** Admin `attributes` anahtarları `FieldDefinitionSchema` ile tam örtüşmüyor (`name` alanı attribute içinde yok; anahtar = name). Dokümantasyon ve create path’te normalize edilmeli.
2. **Çift yönlü ilişki:** Yalnızca bir tarafta `relation` tanımlı; Strapi’deki “inverse relation” yok — yardım metninde belirtilmeli.
3. **Mevcut veri:** Eski relation alanları boş `targetType` ile kalabilir; migrasyon veya edit uyarısı gerekir.
4. **`reviewWorkflow` / `i18n`:** Wizard’da gösterilip backend’de işlenmiyorsa kaldırılmalı veya implement edilmeli — UX güveni için.

---

## Başarı ölçütleri

- [ ] Yeni kullanıcı, dokümantasyon olmadan Post + Category oluşturup bir yazıya kategori atayabilir.
- [ ] İlişki alanı şemasında `targetType` + `relation` API yanıtında görünür.
- [ ] Preset uygulandığında Blog yazısı düzenlemede kategori **dropdown** ile seçilir.
- [ ] API ID, varsayılan oluşturma sihirbazında görünmez; gelişmiş modda açılır.
- [ ] Alan türü seçiminde tüm etiketler seçili admin dilinde (`tr` / `en` / `de`).

---

*Belge sürümü: 2026-06-03 — kod tabanı incelemesine dayalı plan.*
