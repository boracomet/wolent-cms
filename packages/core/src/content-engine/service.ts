import { prisma, runInTenantContext } from '@wolent/database'
import {
  type ContentTypeDefinition,
  type ListQuery,
  type PaginatedResponse,
  type BaseEntry,
  NotFoundError,
  ConflictError,
  BadRequestError,
  ValidationError,
} from '@wolent/utils'
import { buildContentTypeUid } from '../utils/slug.js'
import { validateEntryData } from './validator.js'
import { sanitizeEntryData } from './sanitizer.js'
import { generateDocumentId } from '../utils/slug.js'

export class ContentTypeService {
  async list(tenantId: string) {
    return runInTenantContext({ tenantId }, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const types = await (prisma as any).contentType.findMany({ orderBy: { createdAt: 'desc' } }) as any[]
      return types.map((t: any) => ({
        ...t,
        schema: JSON.parse(t.schema) as ContentTypeDefinition,
      }))
    })
  }

  async findByUid(uid: string, tenantId: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await (prisma as any).contentType.findFirst({
        where: uid.includes('::') ? { uid } : { OR: [{ uid }, { singularName: uid }, { id: uid }] }
      })
      if (!type) throw new NotFoundError('ContentType', uid)
      return { ...type, schema: JSON.parse(type.schema) as ContentTypeDefinition }
    })
  }

  async create(
    data: ContentTypeDefinition & { color?: string; icon?: string; singularApiId?: string; pluralApiId?: string },
    tenantId: string
  ) {
    return runInTenantContext({ tenantId }, async () => {
      // Accept both singularName (canonical) and singularApiId (frontend alias)
      if (!data.singularName && (data as any).singularApiId) {
        data = { ...data, singularName: (data as any).singularApiId, pluralName: (data as any).pluralApiId ?? (data as any).singularApiId + 's' }
      }
      const uid = buildContentTypeUid(data.singularName)

      const existing = await (prisma as any).contentType.findFirst({ where: { uid } })
      if (existing) throw new ConflictError(`Content type "${uid}" already exists`)

      const { color, icon, ...schema } = data

      const type = await (prisma as any).contentType.create({
        data: {
          uid,
          kind: schema.kind ?? 'collectionType',
          displayName: schema.displayName,
          singularName: schema.singularName,
          pluralName: schema.pluralName,
          description: schema.description ?? null,
          draftAndPublish: schema.draftAndPublish ?? true,
          schema: JSON.stringify(schema),
          color: color ?? null,
          icon: icon ?? null,
          tenantId,
        },
      })

      return { ...type, schema }
    })
  }

  async update(
    uid: string,
    data: Partial<ContentTypeDefinition> & { color?: string; icon?: string; singularApiId?: string; pluralApiId?: string },
    tenantId: string
  ) {
    return runInTenantContext({ tenantId }, async () => {
      // Normalize singularApiId → singularName (frontend alias)
      if ((data as any).singularApiId && !data.singularName) {
        data = { ...data, singularName: (data as any).singularApiId, pluralName: (data as any).pluralApiId ?? (data as any).singularApiId + 's' }
      }
      const existing = await (prisma as any).contentType.findFirst({
        where: uid.includes('::') ? { uid } : { OR: [{ uid }, { singularName: uid }, { id: uid }] }
      })
      if (!existing) throw new NotFoundError('ContentType', uid)

      const currentSchema = JSON.parse(existing.schema) as ContentTypeDefinition
      const { color, icon, ...schemaUpdate } = data
      const newSchema = { ...currentSchema, ...schemaUpdate }

      const updated = await (prisma as any).contentType.update({
        where: { id: existing.id },
        data: {
          displayName: newSchema.displayName ?? existing.displayName,
          description: newSchema.description ?? existing.description,
          draftAndPublish: newSchema.draftAndPublish ?? existing.draftAndPublish,
          schema: JSON.stringify(newSchema),
          ...(color !== undefined ? { color } : {}),
          ...(icon !== undefined ? { icon } : {}),
        },
      })

      return { ...updated, schema: newSchema }
    })
  }

  async delete(uid: string, tenantId: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await (prisma as any).contentType.findFirst({
        where: uid.includes('::') ? { uid } : { OR: [{ uid }, { singularName: uid }, { id: uid }] }
      })
      if (!type) throw new NotFoundError('ContentType', uid)

      // Soft-delete all entries
      await (prisma as any).entry.updateMany({
        where: { contentTypeId: type.id },
        data: { deletedAt: new Date() },
      })

      await (prisma as any).contentType.delete({ where: { id: type.id } })
      return { ok: true }
    })
  }
}

/** Resolve a content type by uid (full "api::x.x") OR singularName (short "x") */
async function resolveContentType(uid: string, tenantId: string) {
  const type = await (prisma as any).contentType.findFirst({
    where: uid.includes('::') ? { uid } : { OR: [{ uid }, { singularName: uid }] }
  })
  return type
}

/** Yazar rolü yalnızca kendi oluşturduğu kayıtlara erişebilir (IDOR önleme). */
function assertAuthorOwnsEntry(
  entry: { createdById: string | null; id: string },
  userRole: string | undefined,
  userId: string | undefined
): void {
  if (userRole !== 'author' || !userId) return
  if (entry.createdById !== userId) {
    throw new NotFoundError('Entry', entry.id)
  }
}

export class EntryService {
  async list(
    uid: string,
    query: ListQuery,
    tenantId: string,
    userId?: string,
    userRole?: string
  ): Promise<PaginatedResponse<BaseEntry & Record<string, unknown>>> {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const { page, pageSize, status, search, locale, sort, order } = query
      const sortField = sort ?? 'createdAt'
      const ALLOWED_SORT = new Set(['createdAt', 'updatedAt', 'publishedAt', 'locale', 'status'])
      if (!ALLOWED_SORT.has(sortField)) {
        throw new BadRequestError(`Invalid sort field: ${sortField}`)
      }

      const where: Record<string, unknown> = {
        contentTypeId: type.id,
        deletedAt: null,
      }

      // Status filter
      if (status && status !== 'all') {
        where['status'] = status
      }

      // Locale filter
      if (locale) {
        where['locale'] = locale
      }

      // Ownership filter for authors
      if (userRole === 'author' && userId) {
        where['createdById'] = userId
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [total, rows] = await Promise.all([
        (prisma as any).entry.count({ where } as any),
        (prisma as any).entry.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { [sortField]: order ?? 'desc' },
        } as any),
      ]) as [number, any[]]

      return {
        data: rows.map((row: any) => ({
          ...this.parseEntryData(row),
          id: row.id,
          documentId: row.documentId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          publishedAt: row.publishedAt,
          locale: row.locale,
          status: row.status,
          createdBy: row.createdById,
          updatedBy: row.updatedById,
        })),
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(total / pageSize),
            total,
          },
        },
      }
    })
  }

  async findOne(uid: string, id: string, tenantId: string, userRole?: string, userId?: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const entry = await (prisma as any).entry.findFirst({
        where: { id, contentTypeId: type.id, deletedAt: null },
      })
      if (!entry) throw new NotFoundError(type.displayName, id)
      assertAuthorOwnsEntry(entry, userRole, userId)

      return {
        ...this.parseEntryData(entry),
        id: entry.id,
        documentId: entry.documentId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        publishedAt: entry.publishedAt,
        locale: entry.locale,
        status: entry.status,
      }
    })
  }

  async create(
    uid: string,
    data: Record<string, unknown>,
    tenantId: string,
    userId?: string,
    locale = 'en'
  ) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const rawSchema = JSON.parse(type.schema) as ContentTypeDefinition & { schema?: ContentTypeDefinition }
      // Normalize: schema may be stored with nested `schema.schema.attributes` structure
      const schema: ContentTypeDefinition = rawSchema.attributes
        ? rawSchema
        : (rawSchema as any).schema ?? { attributes: {} }

      // Validate against schema
      const errors = validateEntryData(data, schema)
      if (errors.length > 0) {
        throw new ValidationError('Entry validation failed', errors)
      }

      // Sanitize (XSS, HTML cleanup)
      const cleanData = sanitizeEntryData(data, schema)

      const entry = await (prisma as any).entry.create({
        data: {
          documentId: generateDocumentId(),
          contentTypeId: type.id,
          tenantId,
          locale,
          status: 'draft',
          data: JSON.stringify(cleanData),
          createdById: userId ?? null,
          updatedById: userId ?? null,
        },
      })

      return { ...cleanData, id: entry.id, documentId: entry.documentId, status: entry.status }
    })
  }

  async update(
    uid: string,
    id: string,
    data: Record<string, unknown>,
    tenantId: string,
    userId?: string,
    userRole?: string
  ) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const existing = await (prisma as any).entry.findFirst({
        where: { id, contentTypeId: type.id, deletedAt: null },
      })
      if (!existing) throw new NotFoundError(type.displayName, id)
      assertAuthorOwnsEntry(existing, userRole, userId)

      const schema = JSON.parse(type.schema) as ContentTypeDefinition
      const currentData = this.parseEntryData(existing)
      const merged = { ...currentData, ...data }

      const errors = validateEntryData(merged, schema)
      if (errors.length > 0) throw new ValidationError('Entry validation failed', errors)

      const cleanData = sanitizeEntryData(merged, schema)

      const updated = await (prisma as any).entry.update({
        where: { id, contentTypeId: type.id },
        data: {
          data: JSON.stringify(cleanData),
          updatedById: userId ?? null,
        },
      })

      return { ...cleanData, id: updated.id, status: updated.status }
    })
  }

  async publish(uid: string, id: string, tenantId: string, userId?: string, userRole?: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const entry = await (prisma as any).entry.findFirst({
        where: { id, contentTypeId: type.id, deletedAt: null },
      })
      if (!entry) throw new NotFoundError(type.displayName, id)
      assertAuthorOwnsEntry(entry, userRole, userId)

      const updated = await (prisma as any).entry.update({
        where: { id, contentTypeId: type.id },
        data: {
          status: 'published',
          publishedAt: new Date(),
          updatedById: userId ?? null,
        },
      })

      return { id: updated.id, status: updated.status, publishedAt: updated.publishedAt }
    })
  }

  async unpublish(uid: string, id: string, tenantId: string, userId?: string, userRole?: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const entry = await (prisma as any).entry.findFirst({
        where: { id, contentTypeId: type.id, deletedAt: null },
      })
      if (!entry) throw new NotFoundError(type.displayName, id)
      assertAuthorOwnsEntry(entry, userRole, userId)

      const updated = await (prisma as any).entry.update({
        where: { id, contentTypeId: type.id },
        data: {
          status: 'draft',
          publishedAt: null,
          updatedById: userId ?? null,
        },
      })

      return { id: updated.id, status: updated.status }
    })
  }

  async delete(uid: string, id: string, tenantId: string, userId?: string, userRole?: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      const entry = await (prisma as any).entry.findFirst({
        where: { id, contentTypeId: type.id, deletedAt: null },
      })
      if (!entry) throw new NotFoundError(type.displayName, id)
      assertAuthorOwnsEntry(entry, userRole, userId)

      await (prisma as any).entry.update({
        where: { id, contentTypeId: type.id },
        data: { deletedAt: new Date(), updatedById: userId ?? null },
      })

      return { ok: true }
    })
  }

  async hardDelete(uid: string, id: string, tenantId: string) {
    return runInTenantContext({ tenantId }, async () => {
      const type = await resolveContentType(uid, tenantId)
      if (!type) throw new NotFoundError('ContentType', uid)

      await (prisma as any).entry.delete({ where: { id } })
      return { ok: true }
    })
  }

  private parseEntryData(entry: { data: string }): Record<string, unknown> {
    try {
      return JSON.parse(entry.data) as Record<string, unknown>
    } catch {
      return {}
    }
  }
}

export const contentTypeService = new ContentTypeService()
export const entryService = new EntryService()
