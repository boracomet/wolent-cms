/**
 * n8n Automation + Outbound Webhook plugin.
 * Fires HTTP POST to configured webhook URL on CMS lifecycle events.
 * Payload is HMAC-SHA256 signed with the configured secret.
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import crypto from 'node:crypto'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface WebhookConfig {
  instanceUrl?: string    // n8n only
  webhookUrl: string
  signingSecret: string
  channelLabel?: string   // outbound webhook label
  onContentCreated: boolean
  onContentUpdated: boolean
  onContentPublished: boolean
  onContentDeleted: boolean
  onMediaLibraryChange: boolean
  onUserOrRoleChange: boolean
  onContentTypeSchemaChange: boolean
  onPluginSettingsChange: boolean
  payloadIncludeLocales: boolean
  payloadIncludeAuthor: boolean
  payloadIncludeFullEntry: boolean
}

type WebhookEvent = keyof Pick<WebhookConfig,
  | 'onContentCreated' | 'onContentUpdated' | 'onContentPublished' | 'onContentDeleted'
  | 'onMediaLibraryChange' | 'onUserOrRoleChange' | 'onContentTypeSchemaChange'
  | 'onPluginSettingsChange'
>

function signPayload(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

async function fireWebhook(pluginId: string, config: WebhookConfig, eventKey: WebhookEvent, payload: unknown): Promise<void> {
  if (!config[eventKey]) return
  if (!config.webhookUrl) return

  const body = JSON.stringify({
    event: eventKey,
    plugin: pluginId,
    timestamp: new Date().toISOString(),
    data: payload,
  })

  const signature = config.signingSecret ? signPayload(config.signingSecret, body) : ''

  try {
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wolent-Signature': signature,
        'X-Wolent-Event': eventKey,
        ...(config.instanceUrl ? { 'X-N8n-Instance': config.instanceUrl } : {}),
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    })
  } catch (err) {
    console.warn(`Webhook delivery failed (${pluginId}):`, err instanceof Error ? err.message : err)
  }
}

// ─── Public emitter — called from content engine lifecycle ───────────────────
export async function emitWebhookEvent(
  tenantId: string,
  eventKey: WebhookEvent,
  payload: unknown
): Promise<void> {
  // Fire n8n and outbound webhook in parallel (non-blocking)
  const pluginIds = ['n8n-automation', 'outbound-webhook']

  await Promise.allSettled(
    pluginIds.map(async (pluginId) => {
      try {
        const row = await runInTenantContext({ tenantId }, () =>
          (prisma as any).pluginConfig.findFirst({ where: { pluginId, enabled: true } }) as any
        ) as any
        if (!row) return
        const config = JSON.parse(row.config) as WebhookConfig
        await fireWebhook(pluginId, config, eventKey, payload)
      } catch {}
    })
  )
}

export async function webhookPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/webhooks/test ─────────────────────────────────────
  app.post('/api/plugins/webhooks/test', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { pluginId, webhookUrl, signingSecret } = z.object({
      pluginId: z.enum(['n8n-automation', 'outbound-webhook']),
      webhookUrl: z.string().url(),
      signingSecret: z.string().optional(),
    }).parse(req.body)

    const testPayload = JSON.stringify({
      event: 'test',
      plugin: pluginId,
      timestamp: new Date().toISOString(),
      data: { message: 'Wolent CMS webhook test — connection successful!' },
    })

    const signature = signingSecret ? signPayload(signingSecret, testPayload) : ''

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Wolent-Signature': signature,
          'X-Wolent-Event': 'test',
        },
        body: testPayload,
        signal: AbortSignal.timeout(10000),
      })
      return reply.send({ data: { ok: res.ok, status: res.status } })
    } catch (err) {
      throw new BadRequestError(`Webhook test failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  })

  // ─── GET /api/plugins/webhooks/events ────────────────────────────────────
  // Returns list of supported events
  app.get('/api/plugins/webhooks/events', { preHandler: [requireAuth] }, async (_req, reply) => {
    return reply.send({
      data: [
        { key: 'onContentCreated', label: 'Content Created' },
        { key: 'onContentUpdated', label: 'Content Updated' },
        { key: 'onContentPublished', label: 'Content Published' },
        { key: 'onContentDeleted', label: 'Content Deleted' },
        { key: 'onMediaLibraryChange', label: 'Media Library Changed' },
        { key: 'onUserOrRoleChange', label: 'User / Role Changed' },
        { key: 'onContentTypeSchemaChange', label: 'Content Type Schema Changed' },
        { key: 'onPluginSettingsChange', label: 'Plugin Settings Changed' },
      ],
    })
  })
}
