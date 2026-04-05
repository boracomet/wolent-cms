/**
 * Image Optimization plugin.
 * After upload, generates responsive variants (thumbnail, small, medium, large)
 * in WebP and/or AVIF format using sharp.
 *
 * POST /api/plugins/image-optimization/process/:fileId — process existing file
 * Hooked into media upload lifecycle automatically when enabled.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import path from 'node:path'
import fs from 'node:fs/promises'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError, NotFoundError } from '@wolent/utils'
import { getEnv } from '../../config/env.js'

interface ImageOptConfig {
  formats: string[]        // ['webp', 'avif', 'original']
  quality: number          // 1-100
  generateSizes: boolean
  sizes: {
    thumbnail: { width: number; height: number }
    small:     { width: number; height: number }
    medium:    { width: number; height: number }
    large:     { width: number; height: number }
  }
}

const DEFAULT_CONFIG: ImageOptConfig = {
  formats: ['webp'],
  quality: 80,
  generateSizes: true,
  sizes: {
    thumbnail: { width: 156, height: 156 },
    small:     { width: 500, height: 500 },
    medium:    { width: 750, height: 750 },
    large:     { width: 1000, height: 1000 },
  },
}

const IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function processImageVariants(
  fileId: string,
  tenantId: string,
  config?: ImageOptConfig
): Promise<void> {
  const cfg = config ?? DEFAULT_CONFIG

  const file = await runInTenantContext({ tenantId }, () =>
    (prisma as any).mediaFile.findFirst({ where: { id: fileId } })
  ) as any
  if (!file || !IMAGE_MIMES.has(file.mime)) return

  let sharp: any
  try {
    sharp = (await import('sharp')).default
  } catch {
    console.warn('sharp not installed — image optimization skipped')
    return
  }

  const env = getEnv()
  const uploadDir = path.resolve(env.UPLOAD_DIR)
  const originalPath = path.join(uploadDir, file.hash)

  let sourceBuffer: Buffer
  try {
    sourceBuffer = await fs.readFile(originalPath)
  } catch {
    return // File not found locally (maybe S3)
  }

  const formats = cfg.formats.filter(f => ['webp', 'avif', 'jpeg', 'png'].includes(f))
  const outputFormat = formats[0] ?? 'webp'
  const ext = `.${outputFormat}`

  const variants: Record<string, { url: string; width: number; height: number; size: number }> = {}

  if (cfg.generateSizes) {
    for (const [sizeName, dimensions] of Object.entries(cfg.sizes)) {
      const outputName = `${path.parse(file.hash).name}_${sizeName}${ext}`
      const outputPath = path.join(uploadDir, outputName)

      try {
        const { width, height } = await sharp(sourceBuffer)
          .resize(dimensions.width, dimensions.height, { fit: 'inside', withoutEnlargement: true })
          .toFormat(outputFormat as any, { quality: cfg.quality })
          .toFile(outputPath)

        const stat = await fs.stat(outputPath)
        variants[sizeName] = {
          url: `/uploads/${outputName}`,
          width,
          height,
          size: stat.size,
        }
      } catch (err) {
        console.warn(`Failed to generate ${sizeName} variant:`, err)
      }
    }
  }

  // Get original dimensions
  const meta = await sharp(sourceBuffer).metadata()

  // Update media file record with variants
  await runInTenantContext({ tenantId }, () =>
    (prisma as any).mediaFile.update({
      where: { id: fileId },
      data: {
        width: meta.width ?? null,
        height: meta.height ?? null,
        formats: JSON.stringify(variants),
      },
    })
  )
}

export async function imageOptPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/image-optimization/process/:fileId ────────────────
  app.post('/api/plugins/image-optimization/process/:fileId', { preHandler: [requireAuth] }, async (req, reply) => {
    const { fileId } = req.params as { fileId: string }

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'image-optimization', enabled: true } }) as any
    ) as any
    if (!pluginRow) throw new BadRequestError('Image optimization plugin is not enabled')

    const config = { ...DEFAULT_CONFIG, ...JSON.parse(pluginRow.config) } as ImageOptConfig

    await processImageVariants(fileId, req.tenantId, config)

    const updated = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.findFirst({ where: { id: fileId } })
    ) as any
    if (!updated) throw new NotFoundError('MediaFile', fileId)

    return reply.send({
      data: {
        id: updated.id,
        formats: updated.formats ? JSON.parse(updated.formats) : {},
        width: updated.width,
        height: updated.height,
      },
    })
  })

  // ─── POST /api/plugins/image-optimization/batch ───────────────────────────
  // Process all unoptimized images
  app.post('/api/plugins/image-optimization/batch', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'image-optimization', enabled: true } }) as any
    ) as any
    if (!pluginRow) throw new BadRequestError('Image optimization plugin is not enabled')
    const config = { ...DEFAULT_CONFIG, ...JSON.parse(pluginRow.config) } as ImageOptConfig

    // Find images without variants
    const files = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).mediaFile.findMany({
        where: {
          mime: { in: ['image/jpeg', 'image/png', 'image/webp'] },
          formats: null,
          deletedAt: null,
        },
        select: { id: true },
        take: 100,
      })
    ) as any[]

    let processed = 0
    for (const file of files) {
      try {
        await processImageVariants(file.id, req.tenantId, config)
        processed++
      } catch {}
    }

    return reply.send({ data: { total: files.length, processed } })
  })

  // ─── GET /api/plugins/image-optimization/formats ─────────────────────────
  app.get('/api/plugins/image-optimization/formats', { preHandler: [requireAuth] }, async (_req, reply) => {
    let sharpAvailable = false
    try {
      await import('sharp')
      sharpAvailable = true
    } catch {}

    return reply.send({
      data: {
        available: sharpAvailable,
        formats: ['webp', 'avif', 'jpeg', 'png'],
        sizes: DEFAULT_CONFIG.sizes,
      },
    })
  })
}
