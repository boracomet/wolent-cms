/**
 * Plugin API helpers for the admin panel.
 * Wraps /api/admin/plugins/* endpoints.
 * Falls back gracefully if backend is not available (localStorage compat).
 */
import { api } from './client'

export type PluginId =
  | 'cookie-management'
  | 'gemini-auto-translate'
  | 's3-object-storage'
  | 'sitemap-xml'
  | 'robots-txt'
  | 'redis-cache'
  | 'smtp-mail'
  | 'n8n-automation'
  | 'outbound-webhook'
  | 'native-analytics'
  | 'image-optimization'

interface PluginState {
  enabled: boolean
  config: Record<string, unknown>
}

// ─── Fetch all plugin states from backend ────────────────────────────────────
export async function fetchAllPlugins(): Promise<Record<PluginId, PluginState>> {
  try {
    const res = await fetch('/api/admin/plugins', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
    }).then(r => r.json()) as { data: Record<PluginId, PluginState> }
    return (res.data ?? {}) as Record<PluginId, PluginState>
  } catch {
    return {} as Record<PluginId, PluginState>
  }
}

// ─── Toggle plugin enabled state ────────────────────────────────────────────
export async function togglePlugin(pluginId: PluginId, enabled: boolean): Promise<void> {
  await fetch(`/api/admin/plugins/${pluginId}/toggle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
      'X-Wolent-Tenant': 'default',
    },
    body: JSON.stringify({ enabled }),
  })
}

// ─── Save plugin config ──────────────────────────────────────────────────────
export async function savePluginConfig(pluginId: PluginId, config: Record<string, unknown>): Promise<void> {
  await fetch(`/api/admin/plugins/${pluginId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
      'X-Wolent-Tenant': 'default',
    },
    body: JSON.stringify({ config }),
  })
}

// ─── Get plugin config ───────────────────────────────────────────────────────
export async function getPluginConfig(pluginId: PluginId): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`/api/admin/plugins/${pluginId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
    })
    const json = await res.json() as { data: { config: Record<string, unknown> } }
    return json.data?.config ?? {}
  } catch {
    return {}
  }
}

// ─── Test specific plugin connections ────────────────────────────────────────
export async function testSmtp(to: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/plugins/smtp/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
      body: JSON.stringify({ to }),
    })
    const json = await res.json() as { data: { ok: boolean; message: string } }
    return { ok: json.data?.ok ?? false, message: json.data?.message }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function testGemini(apiKey: string, model: string): Promise<{ ok: boolean; response?: string }> {
  try {
    const res = await fetch('/api/plugins/gemini/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
      body: JSON.stringify({ apiKey, model }),
    })
    const json = await res.json() as { data: { ok: boolean; response: string } }
    return { ok: json.data?.ok ?? false, response: json.data?.response }
  } catch (err) {
    return { ok: false }
  }
}

export async function testRedis(): Promise<{ ok: boolean; version?: string }> {
  try {
    const res = await fetch('/api/plugins/redis/test', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
    })
    const json = await res.json() as { data: { ok: boolean; version: string } }
    return { ok: json.data?.ok ?? false, version: json.data?.version }
  } catch {
    return { ok: false }
  }
}

export async function testWebhook(pluginId: 'n8n-automation' | 'outbound-webhook', webhookUrl: string, signingSecret?: string): Promise<{ ok: boolean; status?: number }> {
  try {
    const res = await fetch('/api/plugins/webhooks/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
        'X-Wolent-Tenant': 'default',
      },
      body: JSON.stringify({ pluginId, webhookUrl, signingSecret }),
    })
    const json = await res.json() as { data: { ok: boolean; status: number } }
    return { ok: json.data?.ok ?? false, status: json.data?.status }
  } catch {
    return { ok: false }
  }
}

// ─── AI Translate helper (called from AiTranslateModal) ─────────────────────
export async function aiTranslate(params: {
  title: string
  summary?: string
  targetLocale: string
  sourceLocale?: string
}): Promise<{ title: string; summary?: string }> {
  const res = await fetch('/api/plugins/gemini/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
      'X-Wolent-Tenant': 'default',
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error('Translation failed')
  const json = await res.json() as { data: { title: string; summary?: string } }
  return json.data
}

// ─── Analytics stats (called from AnalyticsDashboard) ───────────────────────
export async function fetchAnalyticsStats(range = '7d') {
  const res = await fetch(`/api/plugins/analytics/stats?range=${range}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('wolent_access_token') ?? ''}`,
      'X-Wolent-Tenant': 'default',
    },
  })
  if (!res.ok) throw new Error('Failed to fetch analytics')
  const json = await res.json() as { data: unknown }
  return json.data
}
