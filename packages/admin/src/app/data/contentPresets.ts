import type { DemoContentType, DemoField } from "./demoContentTypes";

export type PresetIconKey =
  | "blog"
  | "gallery"
  | "navigation"
  | "landing"
  | "faq"
  | "testimonial"
  | "product"
  | "portfolio";

export interface ContentPresetDefinition {
  id: string;
  title: string;
  description: string;
  /** Kısa madde listesi — hangi tipler oluşur */
  includes: string[];
  /** cmsColorSwatches ile uyumlu */
  color: string;
  icon: PresetIconKey;
  /** Benzersiz id kökü (timestamp) ile tam DemoContentType[] üretir */
  build: (uniqueKey: string) => DemoContentType[];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

const blogCategoryFields: DemoField[] = [
  { id: "bc1", apiName: "name", label: "Name", type: "text", required: true },
  { id: "bc2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "bc3", apiName: "description", label: "Description", type: "text_long", required: false },
];

const blogPostFields: DemoField[] = [
  { id: "bp1", apiName: "title", label: "Title", type: "text", required: true },
  { id: "bp2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "bp3", apiName: "excerpt", label: "Excerpt", type: "text_long", required: false },
  { id: "bp4", apiName: "body", label: "Body", type: "blocks", required: true },
  { id: "bp5", apiName: "cover", label: "Cover", type: "media", required: false },
  {
    id: "bp6",
    apiName: "category",
    label: "Category",
    type: "relation",
    required: false,
    targetType: "blog-category",
    relation: "manyToOne",
    description: "Yazının kategorisi",
  },
];

const galleryAlbumFields: DemoField[] = [
  { id: "ga1", apiName: "title", label: "Title", type: "text", required: true },
  { id: "ga2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "ga3", apiName: "summary", label: "Summary", type: "text_long", required: false },
];

const galleryPhotoFields: DemoField[] = [
  { id: "gp1", apiName: "title", label: "Title", type: "text", required: true },
  { id: "gp2", apiName: "caption", label: "Caption", type: "text_long", required: false },
  { id: "gp3", apiName: "image", label: "Image", type: "media", required: true },
  {
    id: "gp4",
    apiName: "album",
    label: "Album",
    type: "relation",
    required: false,
    targetType: "gallery-album",
    relation: "manyToOne",
    description: "Fotoğrafın albümü",
  },
];

const headerNavFields: DemoField[] = [
  {
    id: "hn1",
    apiName: "logo_link",
    label: "Logo link (URL)",
    type: "text",
    required: false,
  },
  {
    id: "hn2",
    apiName: "menu_items",
    label: "Menu items (JSON)",
    type: "json",
    required: false,
    description: "Örn. [{ \"label\", \"url\", \"children\": [] }]",
  },
  {
    id: "hn3",
    apiName: "cta_label",
    label: "CTA button label",
    type: "text",
    required: false,
  },
  { id: "hn4", apiName: "cta_url", label: "CTA button URL", type: "text", required: false },
];

const footerNavFields: DemoField[] = [
  {
    id: "fn1",
    apiName: "columns",
    label: "Footer columns (JSON)",
    type: "json",
    required: false,
    description: "Sütunlar ve link grupları",
  },
  {
    id: "fn2",
    apiName: "social_links",
    label: "Social links (JSON)",
    type: "json",
    required: false,
  },
  { id: "fn3", apiName: "copyright", label: "Copyright line", type: "text", required: false },
  {
    id: "fn4",
    apiName: "legal_links",
    label: "Legal links (JSON)",
    type: "json",
    required: false,
    description: "Gizlilik, KVKK, vb.",
  },
];

const landingFields: DemoField[] = [
  { id: "lp1", apiName: "meta_title", label: "Meta title", type: "text", required: true },
  {
    id: "lp2",
    apiName: "meta_description",
    label: "Meta description",
    type: "text_long",
    required: false,
  },
  { id: "lp3", apiName: "hero_title", label: "Hero title", type: "text", required: true },
  { id: "lp4", apiName: "hero_subtitle", label: "Hero subtitle", type: "text_long", required: false },
  { id: "lp5", apiName: "hero_image", label: "Hero image", type: "media", required: false },
  { id: "lp6", apiName: "page_sections", label: "Page sections", type: "dynamiczone", required: false },
];

const faqCategoryFields: DemoField[] = [
  { id: "fc1", apiName: "name", label: "Name", type: "text", required: true },
  { id: "fc2", apiName: "slug", label: "Slug", type: "uid", required: true },
];

const faqItemFields: DemoField[] = [
  { id: "fi1", apiName: "question", label: "Question", type: "text", required: true },
  { id: "fi2", apiName: "answer", label: "Answer", type: "blocks", required: true },
  {
    id: "fi3",
    apiName: "faq_category",
    label: "FAQ category",
    type: "relation",
    required: false,
    targetType: "faq-category",
    relation: "manyToOne",
    description: "SSS kategorisi",
  },
  { id: "fi4", apiName: "sort_order", label: "Sort order", type: "number_int", required: false },
];

const testimonialFields: DemoField[] = [
  { id: "tm1", apiName: "quote", label: "Quote", type: "text_long", required: true },
  { id: "tm2", apiName: "author_name", label: "Author name", type: "text", required: true },
  { id: "tm3", apiName: "author_role", label: "Role / company", type: "text", required: false },
  { id: "tm4", apiName: "avatar", label: "Avatar", type: "media", required: false },
  { id: "tm5", apiName: "rating", label: "Rating (1–5)", type: "number_int", required: false },
];

const productCategoryFields: DemoField[] = [
  { id: "pc1", apiName: "name", label: "Name", type: "text", required: true },
  { id: "pc2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "pc3", apiName: "description", label: "Description", type: "text_long", required: false },
];

const productFields: DemoField[] = [
  { id: "pr1", apiName: "name", label: "Name", type: "text", required: true },
  { id: "pr2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "pr3", apiName: "price", label: "Price", type: "number_float", required: false },
  { id: "pr4", apiName: "description", label: "Description", type: "text_long", required: false },
  { id: "pr5", apiName: "image", label: "Image", type: "media", required: false },
  {
    id: "pr6",
    apiName: "category",
    label: "Category",
    type: "relation",
    required: false,
    targetType: "product-category",
    relation: "manyToOne",
    description: "Ürün kategorisi",
  },
  { id: "pr7", apiName: "tags", label: "Tags", type: "text", required: false, description: "Virgülle ayrılmış etiketler" },
];

const portfolioCategoryFields: DemoField[] = [
  { id: "poc1", apiName: "name", label: "Name", type: "text", required: true },
  { id: "poc2", apiName: "slug", label: "Slug", type: "uid", required: true },
];

const portfolioProjectFields: DemoField[] = [
  { id: "pop1", apiName: "title", label: "Title", type: "text", required: true },
  { id: "pop2", apiName: "slug", label: "Slug", type: "uid", required: true },
  { id: "pop3", apiName: "description", label: "Description", type: "text_long", required: false },
  { id: "pop4", apiName: "images", label: "Images", type: "media", required: false },
  { id: "pop5", apiName: "client", label: "Client", type: "text", required: false },
  { id: "pop6", apiName: "year", label: "Year", type: "number_int", required: false },
  {
    id: "pop7",
    apiName: "category",
    label: "Category",
    type: "relation",
    required: false,
    targetType: "portfolio-category",
    relation: "manyToOne",
    description: "Proje kategorisi",
  },
];

/** Tek tür oluşturma sihirbazı — hızlı başlangıç alan şablonları */
export interface QuickStartTemplate {
  id: string;
  title: string;
  description: string;
  fields: DemoField[];
}

export const quickStartTemplates: QuickStartTemplate[] = [
  {
    id: "empty",
    title: "Boş şablon",
    description: "Alanları kendiniz ekleyin",
    fields: [],
  },
  {
    id: "blog-post",
    title: "Blog yazısı",
    description: "Başlık, özet, gövde, kapak ve kategori",
    fields: blogPostFields,
  },
  {
    id: "product",
    title: "Ürün",
    description: "İsim, fiyat, görsel, kategori ve etiketler",
    fields: productFields,
  },
  {
    id: "portfolio-project",
    title: "Portfolyo projesi",
    description: "Başlık, açıklama, görseller, müşteri ve yıl",
    fields: portfolioProjectFields,
  },
];

export const contentPresets: ContentPresetDefinition[] = [
  {
    id: "blog",
    title: "Blog",
    description:
      "Kategori + yazı koleksiyonları; yazılar tek kategoriye bağlanır (ilişki alanı).",
    includes: [
      "Blog Category — isim, slug, açıklama",
      "Blog Post — başlık, özet, gövde, kapak, kategori ilişkisi",
    ],
    color: "orange",
    icon: "blog",
    build: (key) => [
      {
        id: `preset-${key}-blog-cat`,
        name: "Blog Category",
        singularName: "Blog Category",
        pluralName: "Blog Categories",
        apiId: "blog-category",
        description: "Blog yazıları için taksonomi",
        createdAt: today(),
        color: "orange",
        useDynamicEditor: true,
        fields: blogCategoryFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-blog-post`,
        name: "Blog Post",
        singularName: "Blog Post",
        pluralName: "Blog Posts",
        apiId: "blog-post",
        description: "Kategoriye bağlı blog içeriği",
        createdAt: today(),
        color: "teal",
        useDynamicEditor: true,
        listCircleMediaField: "cover",
        fields: blogPostFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "gallery-suite",
    title: "Gallery",
    description: "Albüm + fotoğraf; fotoğraflar albüme bağlanır, listede yuvarlak görsel.",
    includes: [
      "Gallery Album — başlık, slug, özet",
      "Gallery Photo — görsel, başlık, albüm ilişkisi",
    ],
    color: "indigo",
    icon: "gallery",
    build: (key) => [
      {
        id: `preset-${key}-gal-album`,
        name: "Gallery Album",
        singularName: "Gallery Album",
        pluralName: "Gallery Albums",
        apiId: "gallery-album",
        description: "Galeri grupları",
        createdAt: today(),
        color: "indigo",
        useDynamicEditor: true,
        fields: galleryAlbumFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-gal-photo`,
        name: "Gallery Photo",
        singularName: "Gallery Photo",
        pluralName: "Gallery Photos",
        apiId: "gallery-photo",
        description: "Albüme bağlı görseller",
        createdAt: today(),
        color: "violet",
        useDynamicEditor: true,
        listCircleMediaField: "image",
        fields: galleryPhotoFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "navigation",
    title: "Header & footer",
    description:
      "Tekil tipler: üst menü (logo, JSON menü, CTA) ve alt bilgi (sütunlar, sosyal, yasal).",
    includes: [
      "Header Navigation (single) — menu_items JSON, CTA",
      "Footer Navigation (single) — columns, social, legal JSON",
    ],
    color: "cyan",
    icon: "navigation",
    build: (key) => [
      {
        id: `preset-${key}-header`,
        name: "Header Navigation",
        singularName: "Header Navigation",
        pluralName: "Header Navigation",
        apiId: "header-navigation",
        description: "Site üst menüsü ve CTA",
        createdAt: today(),
        color: "cyan",
        isSingleType: true,
        useDynamicEditor: true,
        fields: headerNavFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-footer`,
        name: "Footer Navigation",
        singularName: "Footer Navigation",
        pluralName: "Footer Navigation",
        apiId: "footer-navigation",
        description: "Alt menü, sosyal ve yasal linkler",
        createdAt: today(),
        color: "pink",
        isSingleType: true,
        useDynamicEditor: true,
        fields: footerNavFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "landing",
    title: "Landing page",
    description: "SEO, hero ve dynamic zone ile tek sayfa düzeni (ör. kampanya girişi).",
    includes: [
      "Landing Page (single) — meta, hero, bölüm alanı",
    ],
    color: "emerald",
    icon: "landing",
    build: (key) => [
      {
        id: `preset-${key}-landing`,
        name: "Landing Page",
        singularName: "Landing Page",
        pluralName: "Landing Page",
        apiId: "landing-page",
        description: "Tekil açılış / kampanya sayfası",
        createdAt: today(),
        color: "emerald",
        isSingleType: true,
        useDynamicEditor: true,
        fields: landingFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    description: "Soru-cevap grupları; öğeler kategoriye bağlanır ve sıra numarası taşır.",
    includes: [
      "FAQ Category — isim, slug",
      "FAQ Item — soru, zengin cevap, kategori, sıra",
    ],
    color: "yellow",
    icon: "faq",
    build: (key) => [
      {
        id: `preset-${key}-faq-cat`,
        name: "FAQ Category",
        singularName: "FAQ Category",
        pluralName: "FAQ Categories",
        apiId: "faq-category",
        description: "SSS grupları",
        createdAt: today(),
        color: "yellow",
        useDynamicEditor: true,
        fields: faqCategoryFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-faq-item`,
        name: "FAQ Item",
        singularName: "FAQ Item",
        pluralName: "FAQ Items",
        apiId: "faq-item",
        description: "Kategoriye bağlı soru-cevap",
        createdAt: today(),
        color: "red",
        useDynamicEditor: true,
        fields: faqItemFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "testimonials",
    title: "Testimonials",
    description: "Müşteri / kullanıcı yorumları; avatar ve puan alanları.",
    includes: [
      "Testimonial — alıntı, yazar, rol, avatar, puan",
    ],
    color: "pink",
    icon: "testimonial",
    build: (key) => [
      {
        id: `preset-${key}-test`,
        name: "Testimonial",
        singularName: "Testimonial",
        pluralName: "Testimonials",
        apiId: "testimonial",
        description: "Referans ve yorum kartları",
        createdAt: today(),
        color: "pink",
        useDynamicEditor: true,
        listCircleMediaField: "avatar",
        fields: testimonialFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "product",
    title: "Ürün kataloğu",
    description: "Kategori + ürün; fiyat, görsel ve kategori ilişkisi.",
    includes: [
      "Ürün Kategorisi — isim, slug, açıklama",
      "Ürün — isim, fiyat, açıklama, görsel, kategori, etiketler",
    ],
    color: "emerald",
    icon: "product",
    build: (key) => [
      {
        id: `preset-${key}-product-cat`,
        name: "Ürün Kategorisi",
        singularName: "Ürün Kategorisi",
        pluralName: "Ürün Kategorileri",
        apiId: "product-category",
        description: "Ürünler için taksonomi",
        createdAt: today(),
        color: "emerald",
        useDynamicEditor: true,
        fields: productCategoryFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-product`,
        name: "Ürün",
        singularName: "Ürün",
        pluralName: "Ürünler",
        apiId: "product",
        description: "Kategoriye bağlı ürün kaydı",
        createdAt: today(),
        color: "green",
        useDynamicEditor: true,
        listCircleMediaField: "image",
        fields: productFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
  {
    id: "portfolio",
    title: "Portfolyo",
    description: "Proje kategorisi + çalışmalar; müşteri, yıl ve galeri.",
    includes: [
      "Portfolyo Kategorisi — isim, slug",
      "Proje — başlık, açıklama, görseller, müşteri, yıl, kategori",
    ],
    color: "violet",
    icon: "portfolio",
    build: (key) => [
      {
        id: `preset-${key}-portfolio-cat`,
        name: "Portfolyo Kategorisi",
        singularName: "Portfolyo Kategorisi",
        pluralName: "Portfolyo Kategorileri",
        apiId: "portfolio-category",
        description: "Projeler için gruplar",
        createdAt: today(),
        color: "violet",
        useDynamicEditor: true,
        fields: portfolioCategoryFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
      {
        id: `preset-${key}-portfolio-project`,
        name: "Proje",
        singularName: "Proje",
        pluralName: "Projeler",
        apiId: "portfolio-project",
        description: "Kategoriye bağlı portfolyo çalışması",
        createdAt: today(),
        color: "indigo",
        useDynamicEditor: true,
        listCircleMediaField: "images",
        fields: portfolioProjectFields.map((f) => ({ ...f, id: `${f.id}-${key}` })),
      },
    ],
  },
];
