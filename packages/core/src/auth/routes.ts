import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authService } from './service.js'
import { LoginSchema, ChangePasswordSchema } from '@wolent/utils'
import { requireAuth } from '../middleware/auth.js'
import { generateTotpSecret, generateQrCode, generateBackupCodes } from './totp.js'
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.js'
import { prisma, runInTenantContext } from '@wolent/database'
import { BadRequestError, ForbiddenError, NotFoundError } from '@wolent/utils'

const REFRESH_COOKIE = 'wolent_refresh'

export async function authRoutes(app: FastifyInstance) {
  // ─── POST /api/auth/login ──────────────────────────────────────────────────
  app.post('/api/auth/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          totpCode: { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const input = LoginSchema.parse(req.body)
    const tenantId = req.tenantId

    const result = await authService.login(input, {
      ip: req.ip,
      ua: req.headers['user-agent'],
      tenantId,
    })

    if (result.requiresTwoFactor) {
      return reply.status(200).send({ data: { requiresTwoFactor: true } })
    }

    const { accessToken, refreshToken } = result.tokens

    if (refreshToken) {
      reply.setCookie(REFRESH_COOKIE, refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      })
    }

    return reply.send({ data: { accessToken } })
  })

  // ─── POST /api/auth/refresh ────────────────────────────────────────────────
  app.post('/api/auth/refresh', async (req, reply) => {
    const refreshToken =
      req.cookies[REFRESH_COOKIE] ??
      (req.body as Record<string, string> | undefined)?.['refreshToken']

    if (!refreshToken) {
      return reply.status(401).send({ error: { status: 401, name: 'UnauthorizedError', message: 'No refresh token' } })
    }

    const tokens = await authService.refresh(refreshToken, { tenantId: req.tenantId })

    if (tokens.refreshToken) {
      reply.setCookie(REFRESH_COOKIE, tokens.refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60,
      })
    }

    return reply.send({ data: { accessToken: tokens.accessToken } })
  })

  // ─── POST /api/auth/logout ─────────────────────────────────────────────────
  app.post('/api/auth/logout', async (req, reply) => {
    const refreshToken = req.cookies[REFRESH_COOKIE]
    if (refreshToken) {
      await authService.logout(refreshToken, req.tenantId)
      reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
    }
    return reply.send({ data: { ok: true } })
  })

  // ─── GET /api/auth/me ──────────────────────────────────────────────────────
  app.get('/api/auth/me', { preHandler: [requireAuth] }, async (req, reply) => {
    const me = await authService.me(req.user.sub, req.tenantId)
    return reply.send({ data: me })
  })

  // ─── POST /api/auth/change-password ───────────────────────────────────────
  app.post('/api/auth/change-password', { preHandler: [requireAuth] }, async (req, reply) => {
    const input = ChangePasswordSchema.parse(req.body)
    const { tenantId, user } = req

    await runInTenantContext({ tenantId }, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUser = await (prisma as any).user.findFirst({ where: { id: user.sub } }) as any
      if (!dbUser) throw new NotFoundError('User')

      const ok = await verifyPassword(dbUser.passwordHash, input.currentPassword)
      if (!ok) throw new BadRequestError('Current password is incorrect')

      const strength = validatePasswordStrength(input.newPassword)
      if (!strength.valid) throw new BadRequestError(strength.reason!)

      const newHash = await hashPassword(input.newPassword)
      await (prisma as any).user.update({ where: { id: user.sub }, data: { passwordHash: newHash } })

      // Revoke all refresh tokens (force re-login everywhere)
      await (prisma as any).refreshToken.updateMany({
        where: { userId: user.sub },
        data: { revoked: true },
      })
    })

    reply.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
    return reply.send({ data: { ok: true } })
  })

  // ─── POST /api/auth/2fa/setup ──────────────────────────────────────────────
  app.post('/api/auth/2fa/setup', { preHandler: [requireAuth] }, async (req, reply) => {
    const { tenantId, user } = req

    const secret = generateTotpSecret()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUser = await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.findFirst({ where: { id: user.sub } })
    ) as any
    if (!dbUser) throw new NotFoundError('User')

    const qrCode = await generateQrCode(dbUser.email, secret)

    // Store secret temporarily (not enabled yet until verified)
    await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.update({
        where: { id: user.sub },
        data: { twoFactorSecret: secret },
      })
    )

    return reply.send({ data: { secret, qrCode } })
  })

  // ─── POST /api/auth/2fa/enable ─────────────────────────────────────────────
  app.post('/api/auth/2fa/enable', { preHandler: [requireAuth] }, async (req, reply) => {
    const { totpCode } = z.object({ totpCode: z.string().length(6) }).parse(req.body)
    const { tenantId, user } = req

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUser = await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.findFirst({ where: { id: user.sub } })
    ) as any
    if (!dbUser?.twoFactorSecret) throw new BadRequestError('Run 2FA setup first')

    const { verifyTotp: vt } = await import('./totp.js')
    if (!vt(dbUser.twoFactorSecret, totpCode)) {
      throw new BadRequestError('Invalid TOTP code')
    }

    const { plaintext, hashed } = await generateBackupCodes()

    await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.update({
        where: { id: user.sub },
        data: { twoFactorEnabled: true, backupCodes: JSON.stringify(hashed) },
      })
    )

    return reply.send({ data: { backupCodes: plaintext } })
  })

  // ─── POST /api/auth/2fa/disable ────────────────────────────────────────────
  app.post('/api/auth/2fa/disable', { preHandler: [requireAuth] }, async (req, reply) => {
    const { password } = z.object({ password: z.string() }).parse(req.body)
    const { tenantId, user } = req

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbUser = await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.findFirst({ where: { id: user.sub } })
    ) as any
    if (!dbUser) throw new NotFoundError('User')

    const ok = await verifyPassword(dbUser.passwordHash, password)
    if (!ok) throw new BadRequestError('Password incorrect')

    await runInTenantContext({ tenantId }, () =>
      (prisma as any).user.update({
        where: { id: user.sub },
        data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null },
      })
    )

    return reply.send({ data: { ok: true } })
  })
}
