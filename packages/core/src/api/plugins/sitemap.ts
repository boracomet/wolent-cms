/**
 * Sitemap XML plugin.
 * GET /sitemap.xml — auto-generated from published entries.
 * POST /api/plugins/sitemap/ping — ping Google & Bing.
 */
import type { FastifyInstance } from 'fastify'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface SitemapConfig {
  baseUrl: string          // e.g. https://example.com
  includeTypes?: string[]  // content type UIDs to include, empty = all
  changefreq?: string      // always|hourly|daily|weekly|monthly|yearly|never
  priority?: number        // 0.0 to 1.0
}

export async function sitemapPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /sitemap.xml ─────────────────────────────────────────────────────
  app.get('/sitemap.xml', async (req, reply) => {
    const tenantId = req.tenantId

    // Run everything inside a single tenant context to keep AsyncLocalStorage intact
    const result = await runInTenantContext({ tenantId }, async () => {
      const pluginRow = await (prisma as any).pluginConfig.findFirst({
        where: { pluginId: 'sitemap-xml', enabled: true },
      }) as any

      if (!pluginRow) return { error: 'not_enabled' }
      const config = JSON.parse(pluginRow.config) as SitemapConfig
      if (!config.baseUrl) return { error: 'no_base_url' }

      const baseUrl = config.baseUrl.replace(/\/$/, '')
      const changefreq = config.changefreq ?? 'weekly'
      const priority = config.priority ?? 0.8

      const where: Record<string, unknown> = { status: 'published' }
      if (config.includeTypes?.length) {
        const types = await (prisma as any).contentType.findMany({
          where: { uid: { in: config.includeTypes } },
          select: { id: true, uid: true, pluralName: true },
        }) as any[]
        where['contentTypeId'] = { in: types.map((t: any) => t.id) }
      }

      const entries = await (prisma as any).entry.findMany({
        where,
        include: { contentType: { select: { uid: true, pluralName: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 50000,
      }) as any[]

      return { config, baseUrl, changefreq, priority, entries }
    })

    if ((result as any).error === 'not_enabled') {
      return reply.status(404).send('Sitemap plugin is not enabled')
    }
    if ((result as any).error === 'no_base_url') {
      return reply.status(503).send('Sitemap base URL not configured')
    }

    const { baseUrl, changefreq, priority, entries } = result as any
    const entriesArr: any[] = entries ?? []

    const urls = entriesArr.map((entry: any) => {
      const data = safeJsonParse(entry.data)
      const slug = data['slug'] ?? data['uid'] ?? entry.id
      const typePath = entry.contentType?.pluralName?.toLowerCase() ?? 'content'
      const loc = `${baseUrl}/${typePath}/${slug}`
      const lastmod = new Date(entry.updatedAt).toISOString().split('T')[0]
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
    })

    // Add homepage
    urls.unshift(`  <url>
    <loc>${escapeXml(baseUrl)}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return reply
      .header('Content-Type', 'application/xml; charset=utf-8')
      .header('Cache-Control', 'public, max-age=3600')
      .send(xml)
  })

  // ─── POST /api/plugins/sitemap/ping ──────────────────────────────────────
  app.post('/api/plugins/sitemap/ping', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'sitemap-xml', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('Sitemap plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as SitemapConfig
    if (!config.baseUrl) throw new BadRequestError('Base URL not configured')

    const sitemapUrl = encodeURIComponent(`${config.baseUrl.replace(/\/$/, '')}/sitemap.xml`)
    const results: Record<string, string> = {}

    const pingEngines = [
      { name: 'Google', url: `https://www.google.com/ping?sitemap=${sitemapUrl}` },
      { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${sitemapUrl}` },
    ]

    await Promise.allSettled(
      pingEngines.map(async ({ name, url }) => {
        try {
          const res = await fetch(url, { method: 'GET' })
          results[name] = res.ok ? 'OK' : `HTTP ${res.status}`
        } catch (err) {
          results[name] = `Failed: ${err instanceof Error ? err.message : 'unknown'}`
        }
      })
    )

    return reply.send({ data: { pinged: results } })
  })

  // ─── GET /api/plugins/sitemap/preview ────────────────────────────────────
  app.get('/api/plugins/sitemap/preview', { preHandler: [requireAuth] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'sitemap-xml', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('Sitemap plugin is not enabled')

    const count = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).entry.count({ where: { status: 'published', deletedAt: null } })
    ) as number

    const config = JSON.parse(pluginRow.config) as SitemapConfig
    return reply.send({
      data: {
        sitemapUrl: config.baseUrl ? `${config.baseUrl.replace(/\/$/, '')}/sitemap.xml` : null,
        entryCount: count + 1, // +1 for homepage
        baseUrl: config.baseUrl,
      },
    })
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function safeJsonParse(str: string): Record<string, unknown> {
  try { return JSON.parse(str) } catch { return {} }
}
