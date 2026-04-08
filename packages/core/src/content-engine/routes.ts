import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { contentTypeService, entryService } from './service.js'
import { requireAuth, requireAuthOrApiToken, requireRole } from '../middleware/auth.js'
import { ListQuerySchema } from '@wolent/utils'
import { assertCan } from '../rbac/permissions.js'
import type { Role } from '@wolent/utils'
import { writeAuditLog } from '../api/audit.js'
import { emitWebhookEvent } from '../api/plugins/webhooks.js'

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
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'contentType.create', subject: 'ContentType', subjectId: (type as any).id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentTypeSchemaChange', { action: 'create', type })
    return reply.status(201).send({ data: type })
  })

  // ─── PUT /api/content-types/:uid ─────────────────────────────────────────
  app.put('/api/content-types/:uid', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'settings', 'content-types')
    const body = req.body as Record<string, unknown>
    const type = await contentTypeService.update(uid, body as never, req.tenantId)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'contentType.update', subject: 'ContentType', subjectId: uid, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentTypeSchemaChange', { action: 'update', uid, type })
    return reply.send({ data: type })
  })

  // ─── DELETE /api/content-types/:uid ──────────────────────────────────────
  app.delete('/api/content-types/:uid', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'settings', 'content-types')
    const result = await contentTypeService.delete(uid, req.tenantId)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'contentType.delete', subject: 'ContentType', subjectId: uid, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentTypeSchemaChange', { action: 'delete', uid })
    return reply.send({ data: result })
  })
}

export async function entryRoutes(app: FastifyInstance) {
  // ─── GET /api/:uid ────────────────────────────────────────────────────────
  app.get('/api/:uid', { preHandler: [requireAuthOrApiToken] }, async (req) => {
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
  app.get('/api/:uid/:id', { preHandler: [requireAuthOrApiToken] }, async (req) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'read', uid)
    const entry = await entryService.findOne(uid, id, req.tenantId, req.user.role, req.user.sub)
    return { data: entry }
  })

  // ─── POST /api/:uid ───────────────────────────────────────────────────────
  app.post('/api/:uid', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid } = req.params as { uid: string }
    assertCan(req.user.role as Role, 'create', uid)
    const body = req.body as Record<string, unknown>
    const locale = (req.query as { locale?: string }).locale ?? 'en'
    const entry = await entryService.create(uid, body, req.tenantId, req.user.sub, locale)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.create', subject: uid, subjectId: (entry as any).id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentCreated', { uid, entry })
    return reply.status(201).send({ data: entry })
  })

  // ─── PUT /api/:uid/:id ────────────────────────────────────────────────────
  app.put('/api/:uid/:id', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'update', uid)
    const body = req.body as Record<string, unknown>
    const entry = await entryService.update(uid, id, body, req.tenantId, req.user.sub, req.user.role)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.update', subject: uid, subjectId: id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentUpdated', { uid, id, entry })
    return reply.send({ data: entry })
  })

  // ─── PATCH /api/:uid/:id ──────────────────────────────────────────────────
  app.patch('/api/:uid/:id', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'update', uid)
    const body = req.body as Record<string, unknown>
    const entry = await entryService.update(uid, id, body, req.tenantId, req.user.sub, req.user.role)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.update', subject: uid, subjectId: id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentUpdated', { uid, id, entry })
    return reply.send({ data: entry })
  })

  // ─── POST /api/:uid/:id/publish ───────────────────────────────────────────
  app.post('/api/:uid/:id/publish', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'publish', uid)
    const result = await entryService.publish(uid, id, req.tenantId, req.user.sub, req.user.role)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.publish', subject: uid, subjectId: id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentPublished', { uid, id, entry: result })
    return reply.send({ data: result })
  })

  // ─── POST /api/:uid/:id/unpublish ─────────────────────────────────────────
  app.post('/api/:uid/:id/unpublish', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'publish', uid)
    const result = await entryService.unpublish(uid, id, req.tenantId, req.user.sub, req.user.role)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.unpublish', subject: uid, subjectId: id, ipAddress: req.ip })
    return reply.send({ data: result })
  })

  // ─── DELETE /api/:uid/:id ─────────────────────────────────────────────────
  app.delete('/api/:uid/:id', { preHandler: [requireAuthOrApiToken] }, async (req, reply) => {
    const { uid, id } = req.params as { uid: string; id: string }
    assertCan(req.user.role as Role, 'delete', uid)
    const result = await entryService.delete(uid, id, req.tenantId, req.user.sub, req.user.role)
    void writeAuditLog({ tenantId: req.tenantId, userId: req.user.sub, action: 'entry.delete', subject: uid, subjectId: id, ipAddress: req.ip })
    void emitWebhookEvent(req.tenantId, 'onContentDeleted', { uid, id })
    return reply.send({ data: result })
  })
}
