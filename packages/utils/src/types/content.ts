import { z } from 'zod'

// ─── Field Types ───────────────────────────────────────────────────────────────
export const FieldTypeSchema = z.enum([
  'text',
  'text_long',
  'richtext',
  'blocks',
  'json',
  'number_int',
  'number_float',
  'number_big',
  'password',
  'email',
  'enumeration',
  'uid',
  'date',
  'time',
  'datetime',
  'boolean',
  'media',
  'relation',
  'component',
  'dynamiczone',
])

export type FieldType = z.infer<typeof FieldTypeSchema>

// ─── Field Definition ──────────────────────────────────────────────────────────
export const FieldDefinitionSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  type: FieldTypeSchema,
  required: z.boolean().default(false),
  unique: z.boolean().default(false),
  private: z.boolean().default(false),
  default: z.unknown().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  regex: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
  targetType: z.string().optional(), // for relation
  relation: z.enum(['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany']).optional(),
  component: z.string().optional(), // component name
  repeatable: z.boolean().optional(), // for component fields
  components: z.array(z.string()).optional(), // for dynamiczone
  allowedTypes: z.array(z.enum(['images', 'videos', 'files', 'audios'])).optional(), // for media
  multiple: z.boolean().optional(), // for media
})

export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>

// ─── Content Type Schema ───────────────────────────────────────────────────────
export const ContentTypeKindSchema = z.enum(['collectionType', 'singleType'])
export type ContentTypeKind = z.infer<typeof ContentTypeKindSchema>

export const ContentTypeDefinitionSchema = z.object({
  kind: ContentTypeKindSchema.default('collectionType'),
  collectionName: z.string().min(1).max(100),
  singularName: z.string().min(1).max(100),
  pluralName: z.string().min(1).max(100),
  displayName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  draftAndPublish: z.boolean().default(true),
  pluginOptions: z.record(z.unknown()).optional(),
  attributes: z.record(FieldDefinitionSchema),
})

export type ContentTypeDefinition = z.infer<typeof ContentTypeDefinitionSchema>

// ─── Entry ─────────────────────────────────────────────────────────────────────
export type EntryStatus = 'draft' | 'published'

export interface BaseEntry {
  id: string
  documentId: string
  createdAt: Date
  updatedAt: Date
  publishedAt: Date | null
  locale: string | null
  createdBy: string | null
  updatedBy: string | null
}
