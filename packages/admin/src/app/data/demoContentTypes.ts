/**
 * Content type schema types used across the admin panel.
 * Runtime schema data is managed by lib/contentTypeCache.ts (API-backed).
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
  /** relation tipi — hedef içerik türü (singularName) */
  targetType?: string;
  /** relation tipi — oneToOne | manyToOne | vb. */
  relation?: string;
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
  /**
   * Liste görünümünde bu medya alanını Strapi tarzı yuvarlak kapak olarak göster (apiName).
   */
  listCircleMediaField?: string;
}

export const CONTENT_TYPES_STORAGE_KEY = "wolent-cms-content-types";

export function buildEmptyValuesForFields(fields: DemoField[]): Record<string, string> {
  const o: Record<string, string> = {};
  for (const f of fields) {
    if (f.type === "boolean") o[f.apiName] = "false";
    else o[f.apiName] = "";
  }
  return o;
}
