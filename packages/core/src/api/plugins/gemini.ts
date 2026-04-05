/**
 * Gemini AI Auto-Translate plugin.
 * Uses Google Gemini API to translate content fields between locales.
 * POST /api/plugins/gemini/translate
 * POST /api/plugins/gemini/test
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface GeminiConfig {
  apiKey: string
  model: string   // e.g. 'gemini-1.5-flash', 'gemini-1.5-pro'
}

const SUPPORTED_LOCALES: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ar: 'Arabic',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      ],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new BadRequestError(`Gemini API error (${res.status}): ${err.slice(0, 200)}`)
  }

  const data = await res.json() as any
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new BadRequestError('Gemini returned empty response')
  return text.trim()
}

export async function geminiPluginRoutes(app: FastifyInstance) {
  // ─── POST /api/plugins/gemini/translate ──────────────────────────────────
  app.post('/api/plugins/gemini/translate', { preHandler: [requireAuth] }, async (req, reply) => {
    const schema = z.object({
      title: z.string().min(1),
      summary: z.string().optional(),
      targetLocale: z.string().length(2),
      sourceLocale: z.string().length(2).default('en'),
    })
    const input = schema.parse(req.body)

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'gemini-auto-translate', enabled: true } }) as any
    ) as any
    if (!pluginRow) throw new BadRequestError('Gemini plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as GeminiConfig
    if (!config.apiKey) throw new BadRequestError('Gemini API key not configured')

    const targetLang = SUPPORTED_LOCALES[input.targetLocale] ?? input.targetLocale
    const sourceLang = SUPPORTED_LOCALES[input.sourceLocale] ?? input.sourceLocale
    const model = config.model || 'gemini-1.5-flash'

    // Build prompt
    const contentToTranslate = [
      `Title: ${input.title}`,
      input.summary ? `Summary: ${input.summary}` : null,
    ].filter(Boolean).join('\n')

    const prompt = `You are a professional translator. Translate the following content from ${sourceLang} to ${targetLang}.
Keep the same formatting and tone. Return ONLY the translated content in this exact format:
Title: [translated title]${input.summary ? '\nSummary: [translated summary]' : ''}

Content to translate:
${contentToTranslate}`

    const result = await callGemini(config.apiKey, model, prompt)

    // Parse result
    const titleMatch = result.match(/Title:\s*(.+?)(?:\n|$)/i)
    const summaryMatch = result.match(/Summary:\s*([\s\S]+?)(?:\n\n|$)/i)

    return reply.send({
      data: {
        title: titleMatch?.[1]?.trim() ?? input.title,
        summary: summaryMatch?.[1]?.trim(),
        targetLocale: input.targetLocale,
        model,
      },
    })
  })

  // ─── POST /api/plugins/gemini/translate-html ──────────────────────────────
  // Translate rich text content (HTML or JSON blocks)
  app.post('/api/plugins/gemini/translate-html', { preHandler: [requireAuth] }, async (req, reply) => {
    const schema = z.object({
      content: z.string().min(1).max(50000),
      targetLocale: z.string().length(2),
      sourceLocale: z.string().length(2).default('en'),
      isHtml: z.boolean().default(true),
    })
    const input = schema.parse(req.body)

    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'gemini-auto-translate', enabled: true } }) as any
    ) as any
    if (!pluginRow) throw new BadRequestError('Gemini plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as GeminiConfig
    if (!config.apiKey) throw new BadRequestError('Gemini API key not configured')

    const targetLang = SUPPORTED_LOCALES[input.targetLocale] ?? input.targetLocale
    const sourceLang = SUPPORTED_LOCALES[input.sourceLocale] ?? input.sourceLocale
    const model = config.model || 'gemini-1.5-flash'

    const prompt = input.isHtml
      ? `Translate this HTML content from ${sourceLang} to ${targetLang}. Preserve all HTML tags exactly. Only translate the text content inside tags. Return ONLY the translated HTML, no explanations.\n\n${input.content}`
      : `Translate this text from ${sourceLang} to ${targetLang}. Return ONLY the translated text, no explanations.\n\n${input.content}`

    const translated = await callGemini(config.apiKey, model, prompt)

    return reply.send({ data: { content: translated, targetLocale: input.targetLocale } })
  })

  // ─── POST /api/plugins/gemini/test ───────────────────────────────────────
  app.post('/api/plugins/gemini/test', { preHandler: [requireAuth] }, async (req, reply) => {
    const { apiKey, model } = z.object({
      apiKey: z.string().min(1),
      model: z.string().default('gemini-1.5-flash'),
    }).parse(req.body)

    const result = await callGemini(apiKey, model, 'Say "Wolent CMS connection successful!" in English.')
    return reply.send({ data: { ok: true, response: result } })
  })

  // ─── GET /api/plugins/gemini/locales ─────────────────────────────────────
  app.get('/api/plugins/gemini/locales', { preHandler: [requireAuth] }, async (_req, reply) => {
    return reply.send({
      data: Object.entries(SUPPORTED_LOCALES).map(([code, name]) => ({ code, name })),
    })
  })

  // ─── GET /api/plugins/gemini/models ──────────────────────────────────────
  app.get('/api/plugins/gemini/models', { preHandler: [requireAuth] }, async (_req, reply) => {
    return reply.send({
      data: [
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (fast, recommended)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (more accurate, slower)' },
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (latest)' },
      ],
    })
  })
}
