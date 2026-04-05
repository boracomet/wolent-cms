import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { contentTypeService, entryService } from './service.js'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { ListQuerySchema } from '@wolent/utils'
import { assertCan, applyOwnershipFilter } from '../rbac/permissions.js'
import type { Role } from '@wolent/utils'

export async function contentTypeRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── GET /api/content-types ──────────────────────────────────────────────
  app.get('/api/content-types', { preHandler: [requireAuth] }, async (req) => {
    const types = await contentTypeService.list(req.tenantId)
    return { data: types }
  })

  // ─── GET /api/content-types/:uid ─────────────────────────────────────────
  app.get('/api/content-types/:uid', { preHandler: [requireAuth] }, async (req) => {
    const { uid } = req.params as { uid: string }
    const type = await contentTypeService.findByUid(uid, req.tenantId)
    return { data: type }
  })

  // ─── POST /api/content-types ─────────────────────────────────────────────
  app.post('/api/content-types', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    assertCan(req.user.role as Role, 'settings', 'content-types')
    const body = req.body as Record<string, unknown>
    const type = await contentTypeService.create(body as never, req.tenantId)
    return reply.status(201).send({ data: type })
  })

  // ─── PUT /api/content-types/:uid ─────────────────────────────────────────
  app.put('/api/content-types/:uid', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'settings', 'content-types')
    const body = req.body as Record<string, unknown>
    const type = await contentTypeService.update(uid, body as never, req.tenantId)
    return reply.send({ data: type })
  })

  // ─── DELETE /api/content-types/:uid ──────────────────────────────────────
  app.delete('/api/content-types/:uid', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'settings', 'content-types')
    const result = await contentTypeService.delete(uid, req.tenantId)
    return reply.send({ data: result })
  })
}

export async function entryRoutes(app: FastifyInstance) {
  // ─── GET /api/:uid ────────────────────────────────────────────────────────
  app.get('/api/:uid', { preHandler: [requireAuth] }, async (req) => {
    const { uid } = req.params as { uid: string }
    const query = ListQuerySchema.parse(req.query)
    assertCan(req.user.role as Role, 'read', uid)

    const result = await entryService.list(
      uid, query, req.tenantId,
      req.user.sub, req.user.role
    )
    return result
  })

  // ─── GET /api/:uid/:id ────────────────────────────────────────────────────
  app.get('/api/:uid/:id', { preHandler: [requireAuth] }, async (req) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'read', uid)
    const entry = await entryService.findOne(uid, id, req.tenantId)
    return { data: entry }
  })

  // ─── POST /api/:uid ───────────────────────────────────────────────────────
  app.post('/api/:uid', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'create', uid)
    const body = req.body as Record<string, unknown>
    const locale = (req.query as { locale?: string }).locale ?? 'en'
    const entry = await entryService.create(uid, body, req.tenantId, req.user.sub, locale)
    return reply.status(201).send({ data: entry })
  })

  // ─── PUT /api/:uid/:id ────────────────────────────────────────────────────
  app.put('/api/:uid/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'update', uid)
    const body = req.body as Record<string, unknown>
    const entry = await entryService.update(uid, id, body, req.tenantId, req.user.sub)
    return reply.send({ data: entry })
  })

  // ─── PATCH /api/:uid/:id ──────────────────────────────────────────────────
  app.patch('/api/:uid/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'update', uid)
    const body = req.body as Record<string, unknown>
    const entry = await entryService.update(uid, id, body, req.tenantId, req.user.sub)
    return reply.send({ data: entry })
  })

  // ─── POST /api/:uid/:id/publish ───────────────────────────────────────────
  app.post('/api/:uid/:id/publish', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'publish', uid)
    const result = await entryService.publish(uid, id, req.tenantId, req.user.sub)
    return reply.send({ data: result })
  })

  // ─── POST /api/:uid/:id/unpublish ─────────────────────────────────────────
  app.post('/api/:uid/:id/unpublish', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'publish', uid)
    const result = await entryService.unpublish(uid, id, req.tenantId, req.user.sub)
    return reply.send({ data: result })
  })

  // ─── DELETE /api/:uid/:id ─────────────────────────────────────────────────
  app.delete('/api/:uid/:id', { preHandler: [requireAuth] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'delete', uid)
    const result = await entryService.delete(uid, id, req.tenantId, req.user.sub)
    return reply.send({ data: result })
  })
}
