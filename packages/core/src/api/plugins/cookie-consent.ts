/**
 * Cookie Consent / GDPR plugin.
 * - POST /api/plugins/cookie-consent/record — record visitor consent
 * - GET  /api/plugins/cookie-consent/config — get banner configuration
 * - GET  /api/plugins/cookie-consent/stats  — admin: consent statistics
 * - GET  /api/plugins/cookie-consent/snippet — JS banner snippet
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface CookieConsentConfig {
  bannerTitle: string
  bannerText: string
  acceptButtonText: string
  declineButtonText: string
  categories: {
    necessary: boolean      // always true, cannot be toggled
    analytics: boolean      // default opt-in/out
    marketing: boolean
    preferences: boolean
  }
  privacyPolicyUrl?: string
  position?: 'bottom' | 'top' | 'bottom-left' | 'bottom-right'
  theme?: 'dark' | 'light' | 'auto'
}

const DEFAULT_CONFIG: CookieConsentConfig = {
  bannerTitle: 'Cookie Preferences',
  bannerText: 'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.',
  acceptButtonText: 'Accept All',
  declineButtonText: 'Decline',
  categories: { necessary: true, analytics: false, marketing: false, preferences: false },
  position: 'bottom',
  theme: 'auto',
}

export async function cookieConsentRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/cookie-consent/record — Public ────────────────────
  app.post('/api/plugins/cookie-consent/record', async (req, reply) => {
    const schema = z.object({
      accepted: z.boolean(),
      sessionId: z.string().max(100).optional(),
      categories: z.object({
        necessary: z.boolean().default(true),
        analytics: z.boolean().default(false),
        marketing: z.boolean().default(false),
        preferences: z.boolean().default(false),
      }).optional(),
    })

    const input = schema.parse(req.body)

    let pluginRow: any
    try {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
      pluginRow = await (prisma as any).pluginConfig.findFirst({
        where: { pluginId: 'cookie-management', enabled: true },
      })
    } finally {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
    }

    if (!pluginRow) {
      return reply.status(404).send({ error: 'Cookie consent not enabled' })
    }

    const sessionId = input.sessionId ?? crypto.randomUUID()

    await runInTenantContext({ tenantId: pluginRow.tenantId }, () =>
      (prisma as any).cookieConsent.create({
        data: {
          tenantId: pluginRow.tenantId,
          sessionId,
          accepted: input.accepted,
          categories: JSON.stringify(input.categories ?? { necessary: true }),
          ip: req.ip.replace(/\.\d+$/, '.0'), // anonymize
          userAgent: req.headers['user-agent'] ?? null,
        },
      })
    )

    // Set consent cookie (1 year)
    reply.setCookie('wolent_consent', JSON.stringify({
      accepted: input.accepted,
      sessionId,
      categories: input.categories,
      timestamp: Date.now(),
    }), {
      maxAge: 365 * 24 * 60 * 60,
      path: '/',
      httpOnly: false, // readable by JS
      sameSite: 'lax',
    })

    return reply.send({ data: { ok: true, sessionId } })
  })

  // ─── GET /api/plugins/cookie-consent/config — Public ─────────────────────
  app.get('/api/plugins/cookie-consent/config', async (req, reply) => {
    let pluginRow: any
    try {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'
      pluginRow = await (prisma as any).pluginConfig.findFirst({
        where: { pluginId: 'cookie-management', enabled: true },
      })
    } finally {
      process.env['WOLENT_BYPASS_TENANT_GUARD'] = ''
    }

    if (!pluginRow) {
      return reply.send({ data: null })
    }

    const config = { ...DEFAULT_CONFIG, ...JSON.parse(pluginRow.config) }
    return reply.send({ data: config })
  })

  // ─── GET /api/plugins/cookie-consent/stats ────────────────────────────────
  app.get('/api/plugins/cookie-consent/stats', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const query = z.object({
      days: z.coerce.number().int().min(1).max(365).default(30),
    }).parse(req.query)

    const since = new Date(Date.now() - query.days * 24 * 60 * 60 * 1000)

    const [total, accepted, declined] = await runInTenantContext({ tenantId: req.tenantId }, () =>
      Promise.all([
        (prisma as any).cookieConsent.count({ where: { createdAt: { gte: since } } }),
        (prisma as any).cookieConsent.count({ where: { accepted: true, createdAt: { gte: since } } }),
        (prisma as any).cookieConsent.count({ where: { accepted: false, createdAt: { gte: since } } }),
      ])
    ) as [number, number, number]

    return reply.send({
      data: {
        total,
        accepted,
        declined,
        acceptRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
        period: `${query.days}d`,
      },
    })
  })

  // ─── GET /api/plugins/cookie-consent/snippet ──────────────────────────────
  // Returns embeddable consent banner snippet
  app.get('/api/plugins/cookie-consent/snippet', { preHandler: [requireAuth] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'cookie-management' } }) as any
    ) as any

    const config: CookieConsentConfig = {
      ...DEFAULT_CONFIG,
      ...(pluginRow ? JSON.parse(pluginRow.config) : {}),
    }

    const baseUrl = process.env['FRONTEND_URL'] ?? 'http://localhost:3000'

    const safeConfig = JSON.stringify({
      title: config.bannerTitle,
      text: config.bannerText,
      acceptText: config.acceptButtonText,
      declineText: config.declineButtonText,
      position: config.position,
      privacyUrl: config.privacyPolicyUrl,
      baseUrl,
    })

    const positionCss = config.position === 'top' ? 'top:0' : 'bottom:0'

    const snippet = `<!-- Wolent CMS Cookie Consent -->
<script>
(function(){
  if(document.cookie.indexOf('wolent_consent=') > -1) return;
  var c = ${safeConfig};
  function esc(s){var d=document.createElement('div');d.appendChild(document.createTextNode(s));return d.innerHTML;}
  var banner = document.createElement('div');
  banner.id = 'wolent-consent';
  banner.style.cssText = 'position:fixed;${positionCss};left:0;right:0;background:#18181b;color:#f4f4f5;padding:1rem 1.5rem;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:1rem;font-family:system-ui,sans-serif;font-size:0.875rem;';
  var info = document.createElement('div');
  var h = document.createElement('strong');
  h.textContent = c.title;
  var p = document.createElement('p');
  p.style.margin = '0.25rem 0 0';
  p.textContent = c.text;
  info.appendChild(h);
  info.appendChild(p);
  banner.appendChild(info);
  var btns = document.createElement('div');
  btns.style.cssText = 'display:flex;gap:0.5rem;flex-shrink:0';
  var decline = document.createElement('button');
  decline.textContent = c.declineText;
  decline.style.cssText = 'padding:0.5rem 1rem;border:1px solid #52525b;background:transparent;color:#a1a1aa;border-radius:0.375rem;cursor:pointer';
  decline.onclick = function(){wcc(false)};
  var accept = document.createElement('button');
  accept.textContent = c.acceptText;
  accept.style.cssText = 'padding:0.5rem 1rem;background:#f4f4f5;color:#18181b;border:none;border-radius:0.375rem;cursor:pointer;font-weight:500';
  accept.onclick = function(){wcc(true)};
  btns.appendChild(decline);
  btns.appendChild(accept);
  banner.appendChild(btns);
  document.body.appendChild(banner);
  window.wcc = function(accepted){
    fetch(c.baseUrl+'/api/plugins/cookie-consent/record',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accepted:accepted})}).catch(function(){});
    document.getElementById('wolent-consent').remove();
    delete window.wcc;
  };
})();
</script>`

    return reply.send({ data: { snippet } })
  })
}
