/**
 * SMTP Mail plugin routes.
 * - Test connection
 * - Send transactional email
 * - Password reset emails (integrated with auth)
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, runInTenantContext } from '@wolent/database'
import { requireAuth, requireRole } from '../../middleware/auth.js'
import { BadRequestError } from '@wolent/utils'
import { generateToken } from '../../utils/crypto.js'

interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
  from: string
  fromName: string
}

async function createTransporter(config: SmtpConfig) {
  const nodemailer = await import('nodemailer')
  return nodemailer.default.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
  })
}

export async function smtpPluginRoutes(app: FastifyInstance) {
  const adminOnly = requireRole(['super_admin', 'admin'])

  // ─── POST /api/plugins/smtp/test ─────────────────────────────────────────
  app.post('/api/plugins/smtp/test', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const { to } = z.object({ to: z.string().email() }).parse(req.body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'smtp-mail', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('SMTP plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as SmtpConfig

    const transporter = await createTransporter(config)
    await transporter.sendMail({
      from: `"${config.fromName || 'Wolent CMS'}" <${config.from}>`,
      to,
      subject: 'Wolent CMS — SMTP Test',
      html: '<p>Your SMTP configuration is working correctly! 🎉</p>',
    })

    transporter.close()
    return reply.send({ data: { ok: true, message: `Test email sent to ${to}` } })
  })

  // ─── POST /api/plugins/smtp/send ─────────────────────────────────────────
  app.post('/api/plugins/smtp/send', { preHandler: [requireAuth, await adminOnly] }, async (req, reply) => {
    const schema = z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      html: z.string().optional(),
      text: z.string().optional(),
    })
    const input = schema.parse(req.body)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'smtp-mail', enabled: true } })
    ) as any
    if (!pluginRow) throw new BadRequestError('SMTP plugin is not enabled')
    const config = JSON.parse(pluginRow.config) as SmtpConfig

    const transporter = await createTransporter(config)
    await transporter.sendMail({
      from: `"${config.fromName || 'Wolent CMS'}" <${config.from}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    transporter.close()

    return reply.send({ data: { ok: true } })
  })

  // ─── POST /api/auth/forgot-password ──────────────────────────────────────
  // Integrated password reset using SMTP plugin
  app.post('/api/auth/forgot-password', async (req, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)

    // Always return success to prevent email enumeration
    void (async () => {
      try {
        const user = await runInTenantContext({ tenantId: req.tenantId }, () =>
          (prisma as any).user.findFirst({ where: { email } })
        ) as any
        if (!user) return

        const pluginRow = await runInTenantContext({ tenantId: req.tenantId }, () =>
          (prisma as any).pluginConfig.findFirst({ where: { pluginId: 'smtp-mail', enabled: true } }) as any
        ) as any
        if (!pluginRow) return

        const config = JSON.parse(pluginRow.config) as SmtpConfig
        const token = generateToken(32)
        const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

        // Store reset token (reuse refresh token table with special marker)
        const { sha256 } = await import('../../utils/crypto.js')
        await runInTenantContext({ tenantId: req.tenantId }, () =>
          (prisma as any).refreshToken.create({
            data: {
              userId: user.id,
              tenantId: req.tenantId,
              tokenHash: `reset:${sha256(token)}`,
              expiresAt: expires,
            },
          })
        )

        const resetUrl = `${process.env['FRONTEND_URL'] ?? 'http://localhost:1337'}/reset-password?token=${token}`
        const transporter = await createTransporter(config)
        await transporter.sendMail({
          from: `"${config.fromName || 'Wolent CMS'}" <${config.from}>`,
          to: email,
          subject: 'Password Reset Request',
          html: `
            <p>You requested a password reset for your Wolent CMS account.</p>
            <p><a href="${resetUrl}">Click here to reset your password</a></p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        })
        transporter.close()
      } catch (err) {
        console.error('Forgot password error:', err)
      }
    })()

    return reply.send({ data: { ok: true, message: 'If this email exists, a reset link has been sent.' } })
  })

  // ─── POST /api/auth/reset-password ───────────────────────────────────────
  app.post('/api/auth/reset-password', async (req, reply) => {
    const { token, newPassword } = z.object({
      token: z.string().min(1),
      newPassword: z.string().min(8),
    }).parse(req.body)

    const { sha256 } = await import('../../utils/crypto.js')
    const { hashPassword, validatePasswordStrength } = await import('../../auth/password.js')

    const strength = validatePasswordStrength(newPassword)
    if (!strength.valid) throw new BadRequestError(strength.reason!)

    const tokenHash = `reset:${sha256(token)}`
    const resetToken = await runInTenantContext({ tenantId: req.tenantId }, () =>
      (prisma as any).refreshToken.findFirst({
        where: { tokenHash, revoked: false },
        include: { user: true },
      })
    ) as any

    if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
      throw new BadRequestError('Invalid or expired reset token')
    }

    const newHash = await hashPassword(newPassword)
    await runInTenantContext({ tenantId: req.tenantId }, async () => {
      await (prisma as any).user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newHash, loginAttempts: 0, lockedUntil: null },
      })
      // Revoke all sessions
      await (prisma as any).refreshToken.updateMany({
        where: { userId: resetToken.userId },
        data: { revoked: true },
      })
    })

    return reply.send({ data: { ok: true, message: 'Password reset successful.' } })
  })
}
