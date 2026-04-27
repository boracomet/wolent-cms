# memguide.md — yalnızca bu repoda (wolent-cms) AI bağlamı

## Amaç (doğru anlama)

Bu dosya **senin yeni uygulaman / başka repoda açılmayacak** ve oradaki şeyleri anlatmıyor. Tek işi: **bu monorepo üzerinde çalışırken** sohbet veya Cursor oturumu değişince, asistanın `mempalace.yaml` ve MemPalace eşlemesini **tekrar aynı şekilde** okuyabilmesi. Kısa bir **oturum yenileme notu**; ürün dokümantasyonu veya şablon değil.

---

## MemPalace yazılımı vs bu repodaki yaml

| Ne | Rol |
|----|-----|
| **MemPalace** (pip, `mempalace init` / `mine`, MCP: `python -m mempalace.mcp_server`) | Yerel bellek; veri `~/.mempalace/`. Resmi repo: [milla-jovovich/mempalace](https://github.com/milla-jovovich/mempalace). |
| **`mempalace.yaml`** (bu repoda, kök) | MemPalace’ın zorunlu dosyası değil. Burada: **`wing`** = bu proje için MCP’de kullanılan kanat adı; **`rooms`** = kodun mantıksal bölgeleri (ajanın nereye bakacağını hatırlatır). |

Palace içeriği `mine` ile dolar; yaml **bu repodaki isim ve oda sözleşmesi**.

---

## `mempalace.yaml` — bu repoya özel

- **`wing: wolent-cms`** — Kanat adı; yorumdaki gibi palace/MCP tarafıyla **aynı string** olmalı.
- **`rooms`** — Tablo yalnızca **wolent-cms** dizinlerine göre:

| `name` | Bu repoda |
|--------|-----------|
| `packages` | `packages/admin`, `core`, `database`, `utils`, `cli`, `create-wolent-app` |
| `src` | Yaml’da kök `src/` denmiş; **kökte `src/` yok** — fiilen kaynak `packages/*/src`, `plugins/*/src`. Soru UI/API ise `packages` / `plugins` önce. |
| `plugins` | `plugins/*` (media, graphql, seo, email, i18n, …) |
| `backend` | `packages/database` (Prisma) |
| `guidelines` | `guidelines/` |
| `docker` | `docker-compose.yml`, `Dockerfile.*`, `docker-entrypoint.sh` |
| `general` | Kök README, `eksikler.md`, `status.md`, kök `package.json`, workspace dosyaları, vb. |

Yapı değişince önce `mempalace.yaml`, sonra bu tabloyu güncelle.

---

## `entities.json` (kök, varsa)

MemPalace / benzeri akışlarda proje anahtar kelimeleri için; bu repoda isteğe bağlı tamamlanır. Guide’ın kapsamı dışında tutulabilir; sadece kökte var diye bil.

---

## Bu repoda soru türüne göre (AI için tek blok)

`wing: wolent-cms` ve yukarıdaki odalar geçerli. Kod: `packages/` ve `plugins/`. DB şeması: `packages/database`. Docker: kök docker dosyaları. Genel notlar: `general`. Kök `src/` klasörü yok.

---

*Yeni uygulama için ayrı bir `mempalace.yaml` / guide yazılır; bu dosya wolent-cms’e özeldir.*
