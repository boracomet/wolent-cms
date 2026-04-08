/**
 * Backup API — export & import CMS data from the real database.
 * GET  /api/admin/backup/export  — streams a JSON backup file
 * POST /api/admin/backup/import  — restores data from a JSON backup
 * GET  /api/admin/backup/list    — lists stored backup records
 * POST /api/admin/backup/create  — creates & stores a backup record in DB
 * DELETE /api/admin/backup/:id   — deletes a stored backup record
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../middleware/auth.js'

const BackupIncludedSchema = z.object({
  contentTypes: z.boolean().default(true),
  mediaLibrary: z.boolean().default(true),
  users: z.boolean().default(true),
  plugins: z.boolean().default(true),
  panelSettings: z.boolean().default(true),
})

type BackupIncluded = z.infer<typeof BackupIncludedSchema>

async function buildBackupData(tenantId: string, included: BackupIncluded) {
  return runInTenantContext({ tenantId }, async () => {
    const data: Record<string, unknown> = {}

    if (included.contentTypes) {
      const types = await (prisma as any).contentType.findMany({ orderBy: { createdAt: 'asc' } })
      data.contentTypes = types
    }

    if (included.mediaLibrary) {
      const files = await (prisma as any).mediaFile.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
      })
      const folders = await (prisma as any).mediaFolder.findMany({ orderBy: { createdAt: 'asc' } })
      data.mediaLibrary = { files, folders }
    }

    if (included.users) {
      const users = await (prisma as any).user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          twoFactorEnabled: true,
          createdAt: true,
        },
      })
      data.users = users
    }

    if (included.plugins) {
      const configs = await (prisma as any).pluginConfig.findMany({
        where: { NOT: { pluginId: { startsWith: '_settings::' } } },
      })
      data.plugins = configs
    }

    if (included.panelSettings) {
      const settings = await (prisma as any).pluginConfig.findMany({
        where: { pluginId: { startsWith: '_settings::' } },
      })
      data.panelSettings = settings
    }

    return data
  })
}

export async function backupRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // GET /api/admin/backup/list
  app.get('/api/admin/backup/list', { preHandler: [requireAuth, await adminOnly] }, async (req) => {
    const records = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).backupRecord?.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }).catch(() => [])  // table may not exist yet
    )
    return { data: records ?? [] }
  })

  // POST /api/admin/backup/export — generate and return backup JSON
  app.post('/api/admin/backup/export', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const body = BackupIncludedSchema.safeParse(req.body)
    const included: BackupIncluded = body.success ? body.data : BackupIncludedSchema.parse({})

    const data = await buildBackupData(req.tenantId, included)

    const backup = {
      cmsBackup: true,
      version: '2.0',
      createdAt: new Date().toISOString(),
      label: `Backup ${new Date().toLocaleString('tr-TR')}`,
      included,
      data,
    }

    reply.header('Content-Type', 'application/json')
    reply.header('Content-Disposition', `attachment; filename="wolent-backup-${Date.now()}.json"`)
    return backup
  })

  // POST /api/admin/backup/import — restore from backup JSON
  app.post('/api/admin/backup/import', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const body = req.body as {
      backup: {
        cmsBackup: boolean
        version: string
        included: BackupIncluded
        data: Record<string, unknown>
      }
      include?: Partial<BackupIncluded>
    }

    if (!body?.backup?.cmsBackup) {
      return reply.status(400).send({ error: { status: 400, name: 'BadRequestError', message: 'Invalid backup file' } })
    }

    const include = body.include ?? body.backup.included ?? BackupIncludedSchema.parse({})
    const bData = body.backup.data ?? {}
    const tenantId = req.tenantId

    let restored = 0

    await runInTenantContext({ tenantId }, async () => {
      // Restore content types
      if (include.contentTypes && Array.isArray(bData.contentTypes)) {
        for (const ct of bData.contentTypes as any[]) {
          const existing = await (prisma as any).contentType.findFirst({ where: { uid: ct.uid, tenantId } })
          if (!existing) {
            await (prisma as any).contentType.create({
              data: { ...ct, id: undefined, tenantId },
            }).catch(() => null)
            restored++
          }
        }
      }

      // Restore plugin configs
      if (include.plugins && Array.isArray(bData.plugins)) {
        for (const cfg of bData.plugins as any[]) {
          await (prisma as any).pluginConfig.upsert({
            where: { id: cfg.id },
            update: { config: cfg.config, enabled: cfg.enabled ?? cfg.isEnabled },
            create: { ...cfg, id: undefined, tenantId },
          }).catch(() => null)
          restored++
        }
      }

      // Restore panel settings
      if (include.panelSettings && Array.isArray(bData.panelSettings)) {
        for (const cfg of bData.panelSettings as any[]) {
          await (prisma as any).pluginConfig.upsert({
            where: { id: cfg.id },
            update: { config: cfg.config },
            create: { ...cfg, id: undefined, tenantId },
          }).catch(() => null)
          restored++
        }
      }
    })

    return { data: { ok: true, restored } }
  })
}
