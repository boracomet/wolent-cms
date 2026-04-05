import Fastify from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getEnv } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { injectTenant } from './middleware/auth.js'
import { authRoutes } from './auth/routes.js'
import { contentTypeRoutes, entryRoutes } from './content-engine/routes.js'
import { userRoutes } from './api/users.js'
import { mediaRoutes } from './api/media.js'
import { apiTokenRoutes } from './api/api-tokens.js'
import { auditRoutes } from './api/audit.js'
import { pluginConfigRoutes } from './api/plugins/config.js'
import { s3PluginRoutes } from './api/plugins/s3.js'
import { smtpPluginRoutes } from './api/plugins/smtp.js'
import { redisPluginRoutes } from './api/plugins/redis.js'
import { sitemapPluginRoutes } from './api/plugins/sitemap.js'
import { robotsPluginRoutes } from './api/plugins/robots.js'
import { webhookPluginRoutes } from './api/plugins/webhooks.js'
import { geminiPluginRoutes } from './api/plugins/gemini.js'
import { analyticsPluginRoutes } from './api/plugins/analytics.js'
import { imageOptPluginRoutes } from './api/plugins/image-optimization.js'
import { cookieConsentRoutes } from './api/plugins/cookie-consent.js'
import { setupRoutes } from './api/setup.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export async function buildApp() {
  const env = getEnv()

  const isDev = env.NODE_ENV === 'development'
  const app = Fastify({
    logger: isDev
      ? { level: 'info', transport: { target: 'pino-pretty', options: { colorize: true } } }
      : { level: 'warn' },
    bodyLimit: env.MAX_UPLOAD_SIZE,
    requestTimeout: 30_000,
    trustProxy: true,
  })

  // ─── Security Headers ──────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow admin panel to load
  })

  // ─── CORS ──────────────────────────────────────────────────────────────────
  const corsOrigins = env.CORS_ORIGINS.split(',').map(o => o.trim())
  await app.register(fastifyCors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Wolent-Tenant'],
  })

  // ─── Cookies ──────────────────────────────────────────────────────────────
  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET,
  })

  // ─── Rate Limiting ─────────────────────────────────────────────────────────
  await app.register(fastifyRateLimit, {
    global: true,
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
    keyGenerator: (req) => {
      return req.ip
    },
    errorResponseBuilder: () => ({
      error: {
        status: 429,
        name: 'TooManyRequestsError',
        message: 'Rate limit exceeded. Please slow down.',
      },
    }),
  })

  // ─── Auth endpoints get stricter rate limit ────────────────────────────────
  app.register(async (authApp) => {
    await authApp.register(fastifyRateLimit, {
      max: 10,
      timeWindow: '1 minute',
      keyGenerator: (req) => req.ip,
    })
  })

  // ─── Multipart (file uploads) ──────────────────────────────────────────────
  await app.register(fastifyMultipart, {
    limits: { fileSize: env.MAX_UPLOAD_SIZE },
  })

  // ─── Static file serving (uploaded media) ─────────────────────────────────
  await app.register(fastifyStatic, {
    root: path.resolve(env.UPLOAD_DIR),
    prefix: '/uploads/',
    decorateReply: false,
  })

  // ─── Admin panel static serving (production) ──────────────────────────────
  // Serve the built React admin from packages/admin/dist at /
  const adminDistPath = path.resolve(__dirname, '../../admin/dist')
  try {
    const { existsSync, readFileSync } = await import('node:fs')
    if (existsSync(adminDistPath)) {
      const indexHtml = readFileSync(path.join(adminDistPath, 'index.html'))

      await app.register(fastifyStatic, {
        root: adminDistPath,
        prefix: '/',
        wildcard: false,
        index: 'index.html',
      })
      // SPA fallback — serve index.html for all non-API routes
      app.setNotFoundHandler(async (req, reply) => {
        const url = req.url.split('?')[0]
        const isBackendRoute = url.startsWith('/api/') || url === '/api'
          || url.startsWith('/uploads/')
          || url === '/sitemap.xml'
          || url === '/robots.txt'
          || url === '/health'
        if (!isBackendRoute) {
          return reply.type('text/html').send(indexHtml)
        }
        return reply.status(404).send({ error: { status: 404, name: 'NotFoundError', message: 'Route not found' } })
      })
    }
  } catch {
    // Admin dist not available — development mode
  }

  // ─── Global Hooks ──────────────────────────────────────────────────────────
  app.addHook('onRequest', injectTenant)

  // ─── Error Handler ─────────────────────────────────────────────────────────
  app.setErrorHandler(errorHandler)

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    version: process.env['npm_package_version'] ?? '0.1.0',
    timestamp: new Date().toISOString(),
  }))

  // ─── Routes ────────────────────────────────────────────────────────────────
  await app.register(setupRoutes)  // Must be first — setup wizard
  await app.register(authRoutes)
  await app.register(contentTypeRoutes)
  await app.register(entryRoutes)
  await app.register(userRoutes)
  await app.register(mediaRoutes)
  await app.register(apiTokenRoutes)
  await app.register(auditRoutes)

  // ─── Plugin Routes ──────────────────────────────────────────────────────────
  await app.register(pluginConfigRoutes)
  await app.register(s3PluginRoutes)
  await app.register(smtpPluginRoutes)
  await app.register(redisPluginRoutes)
  await app.register(sitemapPluginRoutes)
  await app.register(robotsPluginRoutes)
  await app.register(webhookPluginRoutes)
  await app.register(geminiPluginRoutes)
  await app.register(analyticsPluginRoutes)
  await app.register(imageOptPluginRoutes)
  await app.register(cookieConsentRoutes)

  return app
}
