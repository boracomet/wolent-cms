/**
 * S3 / R2 / MinIO / DigitalOcean Spaces upload provider.
 * Activated when the s3-object-storage plugin is enabled.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import path from 'node:path'
import crypto from 'node:crypto'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

// Lazy-loaded AWS SDK (only when plugin is used)
async function getS3Client(config: S3Config) {
  const { S3Client } = await import('@aws-sdk/client-s3')
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint || undefined,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: Boolean(config.endpoint), // required for MinIO
  })
}

interface S3Config {
  bucket: string
  region: string
  accessKeyId: string
  secretAccessKey: string
  endpoint?: string  // for R2/MinIO/Spaces
  baseUrl?: string   // CDN base URL
  acl?: string       // 'public-read' | 'private'
}

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
])

export async function s3PluginRoutes(app: FastifyInstance) {
  // ─── POST /api/upload/s3 — Upload to S3 ──────────────────────────────────
  app.post('/api/upload/s3', { preHandler: [requireAuth] }, async (req, reply) => {
    // Get plugin config
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 's3-object-storage', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('S3 plugin is not enabled or configured')
    const s3Config = JSON.parse(pluginRow.config) as S3Config
    if (!s3Config.bucket || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
      throw new BadRequestError('S3 plugin is missing required configuration')
    }

    const data = await req.file()
    if (!data) throw new BadRequestError('No file provided')
    const { mimetype, filename, file: stream } = data

    if (!ALLOWED_MIME.has(mimetype)) {
      throw new BadRequestError(`File type "${mimetype}" is not allowed`)
    }

    // Read into buffer
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(chunk as Buffer)
    const buffer = Buffer.concat(chunks)

    const ext = path.extname(filename) || ''
    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32)
    const key = `uploads/${hash}${ext}`

    const s3 = await getS3Client(s3Config)
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')

    await s3.send(new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: (s3Config.acl as any) || 'public-read',
    }))

    const baseUrl = s3Config.baseUrl ||
      (s3Config.endpoint
        ? `${s3Config.endpoint}/${s3Config.bucket}`
        : `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`)

    const url = `${baseUrl}/${key}`

    // Save to MediaFile DB
    const mediaFile = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.create({
        data: {
          name: filename,
          hash: key,
          ext,
          mime: mimetype,
          size: buffer.length,
          url,
          provider: 's3',
          providerMeta: JSON.stringify({ bucket: s3Config.bucket, key, region: s3Config.region }),
          tenantId: req.tenantId,
          createdById: req.user.sub,
        },
      })
    )

    return reply.status(201).send({ data: mediaFile })
  })

  // ─── DELETE /api/upload/s3/:id — Delete from S3 ──────────────────────────
  app.delete('/api/upload/s3/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 's3-object-storage', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('S3 plugin is not enabled')
    const s3Config = JSON.parse(pluginRow.config) as S3Config

    const file = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.findFirst({ where: { id } })
    ) as any
    if (!file) throw new BadRequestError('File not found')

    const s3 = await getS3Client(s3Config)
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const meta = file.providerMeta ? JSON.parse(file.providerMeta) : {}

    await s3.send(new DeleteObjectCommand({
      Bucket: s3Config.bucket,
      Key: meta.key || file.hash,
    }))

    await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.update({ where: { id }, data: { deletedAt: new Date() } })
    )

    return reply.send({ data: { ok: true } })
  })

  // ─── POST /api/upload/s3/presign — Get presigned upload URL ──────────────
  app.post('/api/upload/s3/presign', { preHandler: [requireAuth] }, async (req, reply) => {
    const { filename, contentType } = z.object({
      filename: z.string().min(1),
      contentType: z.string().min(1),
    }).parse(req.body)

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 's3-object-storage', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('S3 plugin is not enabled')
    const s3Config = JSON.parse(pluginRow.config) as S3Config

    const ext = path.extname(filename) || ''
    const key = `uploads/${crypto.randomBytes(16).toString('hex')}${ext}`

    const s3 = await getS3Client(s3Config)
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner')

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      ContentType: contentType,
    })
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })

    const baseUrl = s3Config.baseUrl ||
      `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com`
    const publicUrl = `${baseUrl}/${key}`

    return reply.send({ data: { uploadUrl, publicUrl, key } })
  })
}
