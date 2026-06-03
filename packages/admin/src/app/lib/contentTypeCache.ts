/**
 * Runtime cache for content type schemas fetched from the API.
 * Replaces the static demoContentTypes fallback across the app.
 */
import type { DemoContentType, DemoField } from "../data/demoContentTypes";
import { api } from "../api/client";

let cache: DemoContentType[] | null = null;
let fetchPromise: Promise<DemoContentType[]> | null = null;

export function apiTypeToDemoType(t: Record<string, unknown>): DemoContentType {
  const schema = t["schema"] as Record<string, unknown> | undefined;
  const attributes = (
    schema?.["attributes"] ??
    (schema?.["schema"] as Record<string, unknown> | undefined)?.["attributes"] ??
    {}
  ) as Record<string, unknown>;

  const fields: DemoField[] = Object.entries(attributes).map(([apiName, def], i) => {
    const d = def as Record<string, unknown>;
    return {
      id: `f${i + 1}`,
      apiName,
      label: apiName.charAt(0).toUpperCase() + apiName.slice(1).replace(/_/g, " "),
      type: (d["type"] as string) ?? "text",
      required: Boolean(d["required"]),
      description: (d["description"] as string) ?? undefined,
      enumOptions: Array.isArray(d["enum"]) ? (d["enum"] as string[]) : undefined,
      targetType: (d["targetType"] as string) ?? undefined,
      relation: (d["relation"] as string) ?? undefined,
    };
  });

  return {
    id: (t["id"] as string) ?? (t["uid"] as string),
    name: (t["displayName"] as string) ?? (t["uid"] as string),
    singularName: (t["singularName"] as string) ?? "",
    pluralName: (t["pluralName"] as string) ?? "",
    apiId: (t["singularName"] as string) ?? (t["uid"] as string),
    description: (t["description"] as string) ?? "",
    fields,
    createdAt: t["createdAt"]
      ? new Date(t["createdAt"] as string).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    color: (t["color"] as string) ?? "blue",
    isSingleType: t["kind"] === "singleType",
    useDynamicEditor: true,
  };
}

export function getAllCachedTypes(): DemoContentType[] {
  return cache ?? [];
}

export function getCachedTypeByApiId(apiId: string | undefined): DemoContentType | undefined {
  if (!apiId || !cache) return undefined;
  return cache.find((t) => t.apiId === apiId || t.id === apiId);
}

export function setCachedTypes(types: DemoContentType[]): void {
  cache = types;
}

/** Fetch and cache all content types from API. Returns cached result if already loaded. */
export async function fetchContentTypes(): Promise<DemoContentType[]> {
  if (cache !== null) return cache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = api.contentTypes
    .list()
    .then((res) => {
      const types = (res.data as unknown[]).map((t) =>
        apiTypeToDemoType(t as Record<string, unknown>)
      );
      cache = types;
      return types;
    })
    .catch(() => {
      fetchPromise = null;
      return [] as DemoContentType[];
    });

  return fetchPromise;
}

export const CONTENT_TYPES_CHANGED_EVENT = "wolent:content-types-changed";

/** Invalidate cache (call after create/update/delete). */
export function invalidateContentTypeCache(): void {
  cache = null;
  fetchPromise = null;
  window.dispatchEvent(new CustomEvent(CONTENT_TYPES_CHANGED_EVENT));
}
