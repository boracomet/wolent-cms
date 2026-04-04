/**
 * Demo şemalar: Content Builder’daki Strapi tarzı alan tiplerini içerik düzenleyicide göstermek için.
 * apiId, /content/:type rotası ile eşleşir.
 */

export interface DemoField {
  id: string;
  apiName: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  /** enumeration tipi için */
  enumOptions?: string[];
}

export interface DemoContentType {
  id: string;
  name: string;
  singularName: string;
  pluralName: string;
  apiId: string;
  description: string;
  fields: DemoField[];
  createdAt: string;
  color: string;
  isSingleType?: boolean;
  /** true: ContentEditor şemaya göre dinamik alan çizer */
  useDynamicEditor?: boolean;
}

/** Tüm Strapi-tarzı alan tipleri — tek koleksiyonda gösterim */
const FIELD_SHOWCASE_FIELDS: DemoField[] = [
  { id: "f1", apiName: "headline", label: "Text", type: "text", required: true },
  { id: "f2", apiName: "summary", label: "Text (Long text)", type: "text_long", required: false },
  { id: "f3", apiName: "body", label: "Rich text (Blocks)", type: "blocks", required: true },
  { id: "f4", apiName: "meta_json", label: "JSON", type: "json", required: false, description: "Structured metadata" },
  { id: "f5", apiName: "units", label: "Number (integer)", type: "number_int", required: false },
  { id: "f6", apiName: "weight_kg", label: "Number (decimal)", type: "number_float", required: false },
  { id: "f7", apiName: "big_counter", label: "Number (big integer)", type: "number_big", required: false },
  { id: "f8", apiName: "api_secret", label: "Password", type: "password", required: false },
  { id: "f9", apiName: "contact_email", label: "Email", type: "email", required: false },
  {
    id: "f10",
    apiName: "workflow_status",
    label: "Enumeration",
    type: "enumeration",
    required: false,
    enumOptions: ["draft", "in_review", "published", "archived"],
  },
  { id: "f11", apiName: "slug_uid", label: "UID", type: "uid", required: false, description: "Unique identifier" },
  { id: "f12", apiName: "start_date", label: "Date", type: "date", required: false },
  { id: "f13", apiName: "daily_cutoff", label: "Time", type: "time", required: false },
  { id: "f14", apiName: "go_live_at", label: "Datetime", type: "datetime", required: false },
  { id: "f15", apiName: "is_featured", label: "Boolean", type: "boolean", required: false },
  { id: "f16", apiName: "hero_media", label: "Media", type: "media", required: false },
  {
    id: "f17",
    apiName: "linked_category",
    label: "Relation",
    type: "relation",
    required: false,
    description: "Relation (manyToOne) with Category",
  },
  {
    id: "f18",
    apiName: "seo_component",
    label: "Component",
    type: "component",
    required: false,
    description: "Repeatable component group (demo UI)",
  },
  {
    id: "f19",
    apiName: "page_sections",
    label: "Dynamic Zone",
    type: "dynamiczone",
    required: false,
    description: "Mix of components (demo UI)",
  },
];

/** İkinci örnek: yapısal alanlara odaklı */
const COMPONENT_PLAYGROUND_FIELDS: DemoField[] = [
  { id: "p1", apiName: "section_title", label: "Title", type: "text", required: true },
  { id: "p2", apiName: "lead", label: "Lead paragraph", type: "text_long", required: false },
  { id: "p3", apiName: "main_content", label: "Rich text (Blocks)", type: "blocks", required: false },
  { id: "p4", apiName: "banner", label: "Media", type: "media", required: false },
  {
    id: "p5",
    apiName: "feature_tile",
    label: "Component",
    type: "component",
    required: false,
    description: "Icon + title + link",
  },
  {
    id: "p6",
    apiName: "flexible_blocks",
    label: "Dynamic Zone",
    type: "dynamiczone",
    required: false,
    description: "Hero, quote, CTA blocks",
  },
];

/** Sayısal + zaman + JSON ağırlıklı üçüncü örnek */
const DATA_PRIMITIVES_FIELDS: DemoField[] = [
  { id: "d1", apiName: "sku_code", label: "UID", type: "uid", required: true },
  { id: "d2", apiName: "qty", label: "Number (integer)", type: "number_int", required: true },
  { id: "d3", apiName: "unit_price", label: "Number (decimal)", type: "number_float", required: true },
  { id: "d4", apiName: "ledger_id", label: "Number (big integer)", type: "number_big", required: false },
  { id: "d5", apiName: "attributes", label: "JSON", type: "json", required: false },
  { id: "d6", apiName: "available_from", label: "Datetime", type: "datetime", required: false },
  { id: "d7", apiName: "sale_day", label: "Date", type: "date", required: false },
  { id: "d8", apiName: "restock_time", label: "Time", type: "time", required: false },
  { id: "d9", apiName: "in_stock", label: "Boolean", type: "boolean", required: false },
  {
    id: "d10",
    apiName: "warehouse",
    label: "Enumeration",
    type: "enumeration",
    required: false,
    enumOptions: ["eu-west", "us-east", "apac"],
  },
  { id: "d11", apiName: "supplier", label: "Relation", type: "relation", required: false, description: "Relation with Author" },
  { id: "d12", apiName: "notify_email", label: "Email", type: "email", required: false },
];

export const demoContentTypes: DemoContentType[] = [
  {
    id: "1",
    name: "Article",
    singularName: "Article",
    pluralName: "Articles",
    apiId: "article",
    description: "Blog articles and news posts",
    createdAt: "2026-04-03",
    color: "blue",
    isSingleType: false,
    fields: [
      { id: "1", apiName: "title", label: "Title", type: "text", required: true },
      { id: "2", apiName: "content", label: "Content", type: "blocks", required: true },
      { id: "3", apiName: "author", label: "Author", type: "relation", required: false },
    ],
  },
  {
    id: "2",
    name: "Product",
    singularName: "Product",
    pluralName: "Products",
    apiId: "product",
    description: "E-commerce products",
    createdAt: "2026-04-02",
    color: "green",
    isSingleType: false,
    fields: [
      { id: "1", apiName: "name", label: "Name", type: "text", required: true },
      { id: "2", apiName: "price", label: "Price", type: "number_float", required: true },
      { id: "3", apiName: "description", label: "Description", type: "blocks", required: false },
    ],
  },
  {
    id: "3",
    name: "Author",
    singularName: "Author",
    pluralName: "Authors",
    apiId: "author",
    description: "Content authors and contributors",
    createdAt: "2026-04-01",
    color: "purple",
    isSingleType: false,
    fields: [
      { id: "1", apiName: "name", label: "Name", type: "text", required: true },
      { id: "2", apiName: "bio", label: "Bio", type: "text_long", required: false },
      { id: "3", apiName: "avatar", label: "Avatar", type: "media", required: false },
    ],
  },
  {
    id: "4",
    name: "Category",
    singularName: "Category",
    pluralName: "Categories",
    apiId: "category",
    description: "Content categories and tags",
    createdAt: "2026-03-30",
    color: "orange",
    isSingleType: false,
    fields: [
      { id: "1", apiName: "name", label: "Name", type: "text", required: true },
      { id: "2", apiName: "slug", label: "Slug", type: "text", required: true },
    ],
  },
  {
    id: "5",
    name: "Homepage",
    singularName: "Homepage",
    pluralName: "Homepage",
    apiId: "homepage",
    description: "Homepage content and hero section",
    createdAt: "2026-04-01",
    color: "cyan",
    isSingleType: true,
    fields: [
      { id: "1", apiName: "hero_title", label: "Hero title", type: "text", required: true },
      { id: "2", apiName: "hero_description", label: "Hero description", type: "text_long", required: true },
      { id: "3", apiName: "hero_image", label: "Hero image", type: "media", required: false },
    ],
  },
  {
    id: "6",
    name: "About",
    singularName: "About",
    pluralName: "About",
    apiId: "about",
    description: "About page content",
    createdAt: "2026-03-29",
    color: "pink",
    isSingleType: true,
    fields: [
      { id: "1", apiName: "title", label: "Title", type: "text", required: true },
      { id: "2", apiName: "content", label: "Content", type: "blocks", required: true },
    ],
  },
  {
    id: "7",
    name: "Field Showcase",
    singularName: "Field Showcase",
    pluralName: "Field Showcases",
    apiId: "field-showcase",
    description: "Tüm Strapi-tarzı alan tiplerini tek girişte incelemek için demo koleksiyonu",
    createdAt: "2026-04-04",
    color: "violet",
    isSingleType: false,
    useDynamicEditor: true,
    fields: FIELD_SHOWCASE_FIELDS,
  },
  {
    id: "8",
    name: "Component Playground",
    singularName: "Component Playground",
    pluralName: "Component Playgrounds",
    apiId: "component-playground",
    description: "Component, Dynamic Zone, medya ve zengin metin bir arada",
    createdAt: "2026-04-04",
    color: "emerald",
    isSingleType: false,
    useDynamicEditor: true,
    fields: COMPONENT_PLAYGROUND_FIELDS,
  },
  {
    id: "9",
    name: "Data Primitives Lab",
    singularName: "Data Primitives Lab",
    pluralName: "Data Primitives Labs",
    apiId: "data-primitives-lab",
    description: "Sayı, tarih/saat, JSON, enum, ilişki ve e-posta alanları",
    createdAt: "2026-04-04",
    color: "yellow",
    isSingleType: false,
    useDynamicEditor: true,
    fields: DATA_PRIMITIVES_FIELDS,
  },
];

export function getDemoContentTypeByApiId(apiId: string | undefined): DemoContentType | undefined {
  if (!apiId) return undefined;
  return demoContentTypes.find((t) => t.apiId === apiId);
}

export function shouldUseDynamicEditor(apiId: string | undefined): boolean {
  const t = getDemoContentTypeByApiId(apiId);
  return Boolean(t?.useDynamicEditor);
}

/** İngilizce örnek dolgu — edit modunda seed için */
export function getFieldShowcaseSeed(): Record<string, string> {
  return {
    headline: "Field Showcase — tüm alan tipleri",
    summary:
      "Bu kayıt, Content Builder ile eklenen Strapi uyumlu alan tiplerinin düzenleme arayüzünde nasıl göründüğünü gösterir.",
    body: "<p>Rich text <strong>blocks</strong> örneği.</p>",
    meta_json: '{\n  "demo": true,\n  "priority": 2\n}',
    units: "42",
    weight_kg: "12.5",
    big_counter: "9007199254740991",
    api_secret: "",
    contact_email: "editor@example.com",
    workflow_status: "in_review",
    slug_uid: "field-showcase-demo-entry",
    start_date: "2026-04-01",
    daily_cutoff: "17:30",
    go_live_at: "2026-04-15T09:00",
    is_featured: "true",
    hero_media: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    linked_category: "cat-tech",
    seo_component: "",
    page_sections: "",
  };
}

export function getComponentPlaygroundSeed(): Record<string, string> {
  return {
    section_title: "Component Playground",
    lead: "Yapısal alanların birlikte kullanımı.",
    main_content: "<p>İçerik <em>blokları</em> burada.</p>",
    banner: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
    feature_tile: "",
    flexible_blocks: "",
  };
}

export function getDataPrimitivesSeed(): Record<string, string> {
  return {
    sku_code: "SKU-DEMO-001",
    qty: "250",
    unit_price: "49.99",
    ledger_id: "1000000000000",
    attributes: '{"color":"blue","warrantyMonths":24}',
    available_from: "2026-04-01T08:00",
    sale_day: "2026-04-10",
    restock_time: "06:00",
    in_stock: "true",
    warehouse: "eu-west",
    supplier: "1",
    notify_email: "stock@example.com",
  };
}

export function buildEmptyValuesForFields(fields: DemoField[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "boolean") o[f.apiName] = "false";
    else o[f.apiName] = "";
  }
  return o;
}

export function getEditorSeedForType(apiId: string): Record<string, string> {
  switch (apiId) {
    case "field-showcase":
      return getFieldShowcaseSeed();
    case "component-playground":
      return getComponentPlaygroundSeed();
    case "data-primitives-lab":
      return getDataPrimitivesSeed();
    default:
      return {};
  }
}
