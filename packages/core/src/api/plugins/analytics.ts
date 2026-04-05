/**
 * Native Analytics plugin.
 * Lightweight privacy-friendly pageview tracker.
 *
 * Client-side: embeds a tiny JS snippet that POSTs pageviews to /api/plugins/analytics/collect
 * Server-side: stores in AnalyticsEvent table, exposes stats API.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface AnalyticsConfig {
  ingestUrl: string  // base URL for the collect endpoint
  siteKey: string    // unique site identifier
}

export async function analyticsPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/analytics/collect — Public, no auth ───────────────
  // Called by the tracking snippet on the visitor's browser
  app.post('/api/plugins/analytics/collect', async (req, reply) => {
    const schema = z.object({
      siteKey: z.string().min(1).max(100),
      url: z.string().url().max(2048),
      referrer: z.string().max(2048).optional(),
      sessionId: z.string().max(100).optional(),
      event: z.string().max(50).default('pageview'),
      meta: z.record(z.unknown()).optional(),
    })

    let input: z.infer<typeof schema>
    try {
      input = schema.parse(req.body)
    } catch {
      return reply.status(400).send({ error: 'Invalid payload' })
    }

    // Find tenant by site key (without tenant guard — this is public)
    process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
    const pluginRow = await (prisma as any).pluginConfig.findFirst({
      where: { pluginId: 'native-analytics', enabled: true },
    }) as any
    process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''

    if (!pluginRow) {
      return reply.status(404).send({ error: 'Analytics not enabled' })
    }

    const config = JSON.parse(pluginRow.config) as AnalyticsConfig
    if (config.siteKey !== input.siteKey) {
      return reply.status(403).send({ error: 'Invalid site key' })
    }

    // Extract IP (anonymized — last octet zeroed for privacy)
    const rawIp = req.ip
    const anonIp = rawIp.includes('.')
      ? rawIp.replace(/\.\d+$/, '.0')
      : rawIp

    await runInTenantContext({ tenantId: pluginRow.tenantId }, () =>
      (prisma as any).analyticsEvent.create({
        data: {
          tenantId: pluginRow.tenantId,
          siteKey: input.siteKey,
          event: input.event,
          url: input.url,
          referrer: input.referrer ?? null,
          userAgent: req.headers['user-agent'] ?? null,
          ip: anonIp,
          sessionId: input.sessionId ?? null,
          meta: input.meta ? JSON.stringify(input.meta) : null,
        },
      })
    )

    // Return 1x1 pixel GIF for compatibility
    return reply
      .header('Content-Type', 'image/gif')
      .header('Cache-Control', 'no-store')
      .send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'))
  })

  // ─── GET /api/plugins/analytics/stats ────────────────────────────────────
  app.get('/api/plugins/analytics/stats', { preHandler: [requireAuth] }, async (req, reply) => {
    const query = z.object({
      range: z.enum(['7d', '1m', '3m', '6m', '12m']).default('7d'),
    }).parse(req.query)

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'native-analytics', enabled: true } }) as any
    )
    if (!pluginRow) throw new BadRequestError('Analytics plugin is not enabled')

    const rangeMap: Record<string, number> = {
      '7d': 7, '1m': 30, '3m': 90, '6m': 180, '12m': 365,
    }
    const days = rangeMap[query.range] ?? 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [totalPageviews, uniqueSessions, topPages, topReferrers, dailyCounts] = await runInTenantContext(
      { tenantId: req.tenantId },
      () => Promise.all([
        // Total pageviews
        (prisma as any).analyticsEvent.count({
          where: { event: 'pageview', createdAt: { gte: since } },
        }),
        // Unique sessions (approximate)
        (prisma as any).analyticsEvent.groupBy({
          by: ['sessionId'],
          where: { event: 'pageview', createdAt: { gte: since }, sessionId: { not: null } },
          _count: true,
        }).then((r: any[]) => r.length),
        // Top pages
        (prisma as any).analyticsEvent.groupBy({
          by: ['url'],
          where: { event: 'pageview', createdAt: { gte: since } },
          _count: { url: true },
          orderBy: { _count: { url: 'desc' } },
          take: 10,
        }),
        // Top referrers
        (prisma as any).analyticsEvent.groupBy({
          by: ['referrer'],
          where: { event: 'pageview', createdAt: { gte: since }, referrer: { not: null } },
          _count: { referrer: true },
          orderBy: { _count: { referrer: 'desc' } },
          take: 10,
        }),
        // Daily counts (SQLite compatible)
        (prisma as any).analyticsEvent.findMany({
          where: { event: 'pageview', createdAt: { gte: since } },
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        }),
      ])
    ) as any[]

    // Group daily counts by date
    const dailyMap: Record<string, number> = {}
    for (const row of (dailyCounts as any[])) {
      const date = new Date(row.createdAt).toISOString().split('T')[0]!
      dailyMap[date] = (dailyMap[date] ?? 0) + 1
    }

    // Fill in missing days with 0
    const dailySeries = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!
      dailySeries.push({ date, views: dailyMap[date] ?? 0 })
    }

    return reply.send({
      data: {
        totalPageviews,
        uniqueSessions,
        topPages: (topPages as any[]).map((r: any) => ({ url: r.url, views: r._count.url })),
        topReferrers: (topReferrers as any[]).map((r: any) => ({ referrer: r.referrer, views: r._count.referrer })),
        dailySeries,
        range: query.range,
      },
    })
  })

  // ─── GET /api/plugins/analytics/snippet ──────────────────────────────────
  // Returns the tracking snippet HTML to embed on the website
  app.get('/api/plugins/analytics/snippet', { preHandler: [requireAuth] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'native-analytics' } }) as any
    ) as any
    if (!pluginRow) throw new BadRequestError('Analytics plugin not configured')
    const config = JSON.parse(pluginRow.config) as AnalyticsConfig

    const collectUrl = config.ingestUrl
      ? `${config.ingestUrl}/api/plugins/analytics/collect`
      : '/api/plugins/analytics/collect'

    const snippet = `<!-- Wolent CMS Analytics -->
<script>
(function() {
  var sid = sessionStorage.getItem('_wid') || Math.random().toString(36).slice(2);
  sessionStorage.setItem('_wid', sid);
  fetch('${collectUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteKey: '${config.siteKey}',
      url: location.href,
      referrer: document.referrer || undefined,
      sessionId: sid
    })
  }).catch(function(){});
})();
</script>`

    return reply.send({ data: { snippet, siteKey: config.siteKey } })
  })

  // ─── DELETE /api/plugins/analytics/data ──────────────────────────────────
  app.delete('/api/plugins/analytics/data', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { before } = z.object({
      before: z.string().datetime().optional(),
    }).parse(req.query)

    const where: Record<string, unknown> = {}
    if (before) where['createdAt'] = { lt: new Date(before) }

    const { count } = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).analyticsEvent.deleteMany({ where })
    ) as any

    return reply.send({ data: { deleted: count } })
  })
}
