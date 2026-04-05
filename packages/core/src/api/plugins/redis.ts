/**
 * Redis Cache plugin.
 * When enabled: rate limiting uses Redis store, content cache is enabled.
 * Routes: test connection, flush cache, get stats.
 */
import type { FastifyInstance } from 'fastify'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'

interface RedisConfig {
  url: string        // redis://user:pass@host:6379
  password?: string
  db?: number
  keyPrefix?: string
  ttl?: number       // default TTL in seconds
}

// Module-level Redis client (shared across requests)
let _redisClient: any = null

export async function getRedisClient(url: string): Promise<any> {
  if (_redisClient) return _redisClient
  try {
    const { createClient } = await import('redis')
    _redisClient = createClient({ url })
    _redisClient.on('error', (err: Error) => console.warn('Redis error:', err.message))
    await _redisClient.connect()
    return _redisClient
  } catch {
    return null
  }
}

export async function disconnectRedis(): Promise<void> {
  if (_redisClient) {
    await _redisClient.quit().catch(() => {})
    _redisClient = null
  }
}

export async function redisPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/redis/test ─────────────────────────────────────────
  app.post('/api/plugins/redis/test', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'redis-cache', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('Redis plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as RedisConfig

    try {
      const client = await getRedisClient(config.url)
      if (!client) throw new Error('Could not connect')
      await client.ping()
      const info = await client.info('server')
      const versionLine = info.split('\n').find((l: string) => l.startsWith('redis_version'))
      const version = versionLine?.split(':')[1]?.trim() ?? 'unknown'
      return reply.send({ data: { ok: true, version } })
    } catch (err) {
      throw new BadRequestError(`Redis connection failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  })

  // ─── POST /api/plugins/redis/flush ────────────────────────────────────────
  app.post('/api/plugins/redis/flush', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'redis-cache', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('Redis plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as RedisConfig
    const prefix = config.keyPrefix ?? `wolent:${req.tenantId}:`

    const client = await getRedisClient(config.url)
    if (!client) throw new BadRequestError('Redis not connected')

    // Flush only keys with this tenant's prefix
    const keys: string[] = await client.keys(`${prefix}*`)
    if (keys.length > 0) await client.del(keys)

    return reply.send({ data: { ok: true, flushed: keys.length } })
  })

  // ─── GET /api/plugins/redis/stats ─────────────────────────────────────────
  app.get('/api/plugins/redis/stats', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'redis-cache', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('Redis plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as RedisConfig

    const client = await getRedisClient(config.url)
    if (!client) throw new BadRequestError('Redis not connected')

    const info = await client.info('stats')
    const keyspaceInfo = await client.info('keyspace')
    const memInfo = await client.info('memory')

    const parse = (raw: string, key: string) => {
      const line = raw.split('\n').find((l: string) => l.startsWith(key))
      return line?.split(':')[1]?.trim() ?? '0'
    }

    return reply.send({
      data: {
        totalCommands: parse(info, 'total_commands_processed'),
        keyspaceHits: parse(info, 'keyspace_hits'),
        keyspaceMisses: parse(info, 'keyspace_misses'),
        usedMemory: parse(memInfo, 'used_memory_human'),
        keyspace: keyspaceInfo,
      },
    })
  })
}

// ─── Cache helpers (used by other parts of the app) ──────────────────────────
export async function cacheGet(key: string): Promise<string | null> {
  if (!_redisClient) return null
  try { return await _redisClient.get(key) } catch { return null }
}

export async function cacheSet(key: string, value: string, ttl = 300): Promise<void> {
  if (!_redisClient) return
  try { await _redisClient.set(key, value, { EX: ttl }) } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  if (!_redisClient) return
  try { await _redisClient.del(key) } catch {}
}
