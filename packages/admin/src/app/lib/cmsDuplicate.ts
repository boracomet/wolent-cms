import type { DemoContentType, DemoField } from "../data/demoContentTypes";

export function slugifyApiId(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "content-type";
}

export function nextAvailableApiId(baseSlug: string, existing: Set<string>): string {
  if (!existing.has(baseSlug)) return baseSlug;
  let n = 1;
  while (existing.has(`${baseSlug}-${n}`)) n += 1;
  return `${baseSlug}-${n}`;
}

/** "Başlık 1", "Başlık 2" … mevcut isimlerle çakışmayana kadar */
export function nextDuplicateDisplayName(base: string, takenNames: Set<string>): string {
  const t = base.trim() || "Untitled";
  let n = 1;
  let candidate = `${t} ${n}`;
  while (takenNames.has(candidate)) {
    n += 1;
    candidate = `${t} ${n}`;
  }
  return candidate;
}

function guessPluralName(singular: string): string {
  const s = singular.trim();
  if (!s) return "Items";
  const lower = s.toLowerCase();
  if (lower.endsWith("y") && !/[aeiou]y$/i.test(s)) return `${s.slice(0, -1)}ies`;
  if (/[sxz]$|ch$|sh$/i.test(s)) return `${s}es`;
  return `${s}s`;
}

export function duplicateContentTypeSchema(
  source: DemoContentType,
  displayName: string,
  allTypes: DemoContentType[]
): DemoContentType {
  const takenApi = new Set(allTypes.map((t) => t.apiId));
  const takenNames = new Set(allTypes.map((t) => t.name));
  let name = displayName.trim() || nextDuplicateDisplayName(source.name, takenNames);
  if (takenNames.has(name)) {
    name = nextDuplicateDisplayName(name, takenNames);
  }
  const baseSlug = slugifyApiId(name);
  const apiId = nextAvailableApiId(baseSlug, takenApi);
  const today = new Date().toISOString().slice(0, 10);
  const stamp = Date.now();
  const fields: DemoField[] = source.fields.map((f, i) => ({
    ...f,
    id: `f-${stamp}-${i}-${Math.random().toString(36).slice(2, 8)}`,
  }));
  return {
    ...source,
    id: `ct-${stamp}`,
    name,
    singularName: name,
    pluralName: guessPluralName(name),
    apiId,
    createdAt: today,
    fields,
    /** Koleksiyon kopyası koleksiyon, tekil (Homepage vb.) kopyası tekil kalır */
    isSingleType: Boolean(source.isSingleType),
  };
}
