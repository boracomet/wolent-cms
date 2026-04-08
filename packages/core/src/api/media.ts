import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import path from 'node:path'
import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth } from '../middleware/auth.js'
import { NotFoundError, BadRequestError } from '@wolent/utils'
import { getEnv } from '../config/env.js'
import { writeAuditLog } from './audit.js'
import { emitWebhookEvent } from './plugins/webhooks.js'
import { processImageVariants } from './plugins/image-optimization.js'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
])
const ALLOWED_DOC_TYPES = new Set([
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const ALLOWED_AUDIO_TYPES = new Set(['audio/mpeg', 'audio/wav', 'audio/ogg'])

const ALL_ALLOWED = new Set([
  ...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_AUDIO_TYPES,
])

export async function mediaRoutes(app: FastifyInstance) {
  const env = getEnv()

  // ─── GET /api/upload/files ────────────────────────────────────────────────
  app.get('/api/upload/files', { preHandler: [requireAuth] }, async (req) => {
    const query = z.object({
      folderId: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      pageSize: z.coerce.number().int().min(1).max(100).default(50),
    }).parse(req.query)

    const where: Record<string, unknown> = { deletedAt: null }
    if (query.folderId) where['folderId'] = query.folderId

    const [total, files] = await runInTenantContext({ tenantId: req.tenantId }, () =>
      Promise.all([
        (prisma as any).mediaFile.count({ where }),
        (prisma as any).mediaFile.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ])
    )

    return {
      data: files,
      meta: {
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          pageCount: Math.ceil(total / query.pageSize),
          total,
        },
      },
    }
  })

  // ─── GET /api/upload/files/:id ────────────────────────────────────────────
  app.get('/api/upload/files/:id', { preHandler: [requireAuth] }, async (req) => {
    const { id } = req.params as { id: string }
    const file = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.findFirst({ where: { id, deletedAt: null } })
    )
    if (!file) throw new NotFoundError('MediaFile', id)
    return { data: file }
  })

  // ─── POST /api/upload ─────────────────────────────────────────────────────
  app.post('/api/upload', { preHandler: [requireAuth] }, async (req, reply) => {
    const data = await req.file()
    if (!data) throw new BadRequestError('No file provided')

    const { mimetype, filename, file: stream } = data
    const folderId = (req.query as { folderId?: string }).folderId ?? null

    // MIME validation
    if (!ALL_ALLOWED.has(mimetype)) {
      throw new BadRequestError(`File type "${mimetype}" is not allowed`)
    }

    // Read file into buffer (max size checked by Fastify bodyLimit)
    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer)
    }
    const buffer = Buffer.concat(chunks)

    if (buffer.length > env.MAX_UPLOAD_SIZE) {
      throw new BadRequestError(`File size exceeds limit of ${env.MAX_UPLOAD_SIZE / (1024 * 1024)}MB`)
    }

    // Generate unique hash-based filename
    const ext = path.extname(filename) || ''
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32)
    const storedName = `${hash}${ext}`
    const uploadDir = path.resolve(env.UPLOAD_DIR)
    const filePath = path.join(uploadDir, storedName)

    await fs.mkdir(uploadDir, { recursive: true })
    await fs.writeFile(filePath, buffer)

    const url = `/uploads/${storedName}`
    const size = buffer.length

    // Check for duplicate by hash
    const existing = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.findFirst({ where: { hash: storedName } })
    )
    if (existing) {
      return reply.status(200).send({ data: existing })
    }

    const mediaFile = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.create({
        data: {
          name: filename,
          hash: storedName,
          ext,
          mime: mimetype,
          size,
          url,
          provider: 'local',
          tenantId: req.tenantId,
          folderId: folderId ?? null,
          createdById: req.user.sub,
        },
      })
    )

    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'media.upload', subject: 'MediaFile', subjectId: (mediaFile as any).id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onMediaLibraryChange', { action: 'upload', fileId: (mediaFile as any).id, name: filename })

    // Trigger image optimization asynchronously if plugin is enabled
    if (ALLOWED_IMAGE_TYPES.has(mimetype)) {
      void processImageVariants((mediaFile as any).id, req.tenantId).catch(() => {})
    }

    return reply.status(201).send({ data: mediaFile })
  })

  // ─── PUT /api/upload/files/:id ────────────────────────────────────────────
  app.put('/api/upload/files/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({
      name: z.string().min(1).optional(),
      alternativeText: z.string().max(500).optional(),
      caption: z.string().max(500).optional(),
      folderId: z.string().nullable().optional(),
      color: z.string().optional(),
    })
    const input = schema.parse(req.body)

    const updated = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const file = await (prisma as any).mediaFile.findFirst({ where: { id, deletedAt: null } })
      if (!file) throw new NotFoundError('MediaFile', id)
      return (prisma as any).mediaFile.update({ where: { id }, data: input })
    })

    return reply.send({ data: updated })
  })

  // ─── DELETE /api/upload/files/:id ────────────────────────────────────────
  app.delete('/api/upload/files/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const file = await (prisma as any).mediaFile.findFirst({ where: { id, deletedAt: null } })
      if (!file) throw new NotFoundError('MediaFile', id)

      // Soft delete
      await (prisma as any).mediaFile.update({ where: { id }, data: { deletedAt: new Date() } })
    })

    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'media.delete', subject: 'MediaFile', subjectId: id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onMediaLibraryChange', { action: 'delete', fileId: id })

    return reply.send({ data: { ok: true } })
  })

  // ─── Folder routes ────────────────────────────────────────────────────────
  app.get('/api/upload/folders', { preHandler: [requireAuth] }, async (req) => {
    const folders = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFolder.findMany({ orderBy: { name: 'asc' } })
    )
    return { data: folders }
  })

  app.post('/api/upload/folders', { preHandler: [requireAuth] }, async (req, reply) => {
    const schema = z.object({
      name: z.string().min(1).max(255),
      parentId: z.string().nullable().optional(),
      color: z.string().optional(),
    })
    const input = schema.parse(req.body)

    const folder = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      let basePath = '/'
      if (input.parentId) {
        const parent = await (prisma as any).mediaFolder.findFirst({ where: { id: input.parentId } })
        if (parent) basePath = parent.path + (parent.path.endsWith('/') ? '' : '/') + parent.name + '/'
      }
      return (prisma as any).mediaFolder.create({
        data: {
          name: input.name,
          parentId: input.parentId ?? null,
          path: basePath + input.name,
          color: input.color ?? null,
          tenantId: req.tenantId,
        },
      })
    })

    return reply.status(201).send({ data: folder })
  })

  app.put('/api/upload/folders/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const schema = z.object({
      name: z.string().min(1).max(255).optional(),
      color: z.string().nullable().optional(),
      parentId: z.string().nullable().optional(),
    })
    const input = schema.parse(req.body)

    const folder = await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const existing = await (prisma as any).mediaFolder.findFirst({ where: { id } })
      if (!existing) throw new NotFoundError('MediaFolder', id)
      return (prisma as any).mediaFolder.update({
        where: { id },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        },
      })
    })

    return reply.send({ data: folder })
  })

  app.delete('/api/upload/folders/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      const folder = await (prisma as any).mediaFolder.findFirst({ where: { id } })
      if (!folder) throw new NotFoundError('MediaFolder', id)

      // Move files to root
      await (prisma as any).mediaFile.updateMany({ where: { folderId: id }, data: { folderId: null } })
      await (prisma as any).mediaFolder.delete({ where: { id } })
    })

    return reply.send({ data: { ok: true } })
  })
}
