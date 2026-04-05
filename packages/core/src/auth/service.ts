import crypto from 'node:crypto'
import { prisma, runInTenantContext } from '@wolent/database'
import {
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  NotFoundError,
  BadRequestError,
  type LoginInput,
  type RegisterInput,
  type AuthTokens,
  type MeResponse,
  type JwtPayload,
  type Role,
} from '@wolent/utils'
import { hashPassword, verifyPassword, validatePasswordStrength } from './password.js'
import { signAccessToken, verifyAccessToken } from './jwt.js'
import { verifyTotp, verifyAndConsumeBackupCode } from './totp.js'
import { generateToken, sha256 } from '../utils/crypto.js'
import { getEnv } from '../config/env.js'

const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 15 * 60 * 1000 // 15 minutes

// Generic auth error — never reveal whether email or password is wrong
const AUTH_ERROR = new UnauthorizedError('Invalid email or password')

export class AuthService {
  async login(
    input: LoginInput,
    meta: { ip?: string; ua?: string; tenantId: string }
  ): Promise<{ tokens: AuthTokens; requiresTwoFactor?: boolean }> {
    return runInTenantContext({ tenantId: meta.tenantId }, async () => {
      const user = await (prisma as any).user.findFirst({ where: { email: input.email } })

      if (!user || !user.isActive) throw AUTH_ERROR

      // Lockout check
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        throw new ForbiddenError('Account temporarily locked. Try again later.')
      }

      const passwordValid = await verifyPassword(user.passwordHash, input.password)
      if (!passwordValid) {
        await this.recordFailedAttempt(user.id, meta.tenantId, user.loginAttempts + 1)
        throw AUTH_ERROR
      }

      // 2FA check
      if (user.twoFactorEnabled) {
        if (!input.totpCode) {
          return { tokens: { accessToken: '' }, requiresTwoFactor: true }
        }

        const secret = user.twoFactorSecret
        if (!secret) throw AUTH_ERROR

        let twoFactorPassed = verifyTotp(secret, input.totpCode)

        if (!twoFactorPassed && user.backupCodes) {
          const codes = JSON.parse(user.backupCodes) as string[]
          const { valid, remaining } = await verifyAndConsumeBackupCode(codes, input.totpCode)
          if (valid) {
            twoFactorPassed = true
            await (prisma as any).user.update({
              where: { id: user.id },
              data: { backupCodes: JSON.stringify(remaining) },
            })
          }
        }

        if (!twoFactorPassed) throw new UnauthorizedError('Invalid 2FA code')
      }

      // Reset failed attempts, update last login
      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: meta.ip ?? null,
          lastLoginUa: meta.ua ?? null,
        },
      })

      const tokens = await this.issueTokens(user, meta)
      return { tokens }
    })
  }

  async refresh(
    refreshTokenPlain: string,
    meta: { tenantId: string }
  ): Promise<AuthTokens> {
    return runInTenantContext({ tenantId: meta.tenantId }, async () => {
      const hash = sha256(refreshTokenPlain)
      const stored = await (prisma as any).refreshToken.findFirst({
        where: { tokenHash: hash, revoked: false },
        include: { user: true },
      })

      if (!stored || stored.expiresAt < new Date()) {
        if (stored) {
          // Possible token theft — revoke all sessions for this user
          await (prisma as any).refreshToken.updateMany({
            where: { userId: stored.userId },
            data: { revoked: true },
          })
        }
        throw new UnauthorizedError('Invalid or expired refresh token')
      }

      // Rotate: revoke old, issue new
      await (prisma as any).refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      })

      return this.issueTokens(stored.user, meta)
    })
  }

  async logout(refreshTokenPlain: string, tenantId: string): Promise<void> {
    const hash = sha256(refreshTokenPlain)
    await runInTenantContext({ tenantId }, async () => {
      await (prisma as any).refreshToken.updateMany({
        where: { tokenHash: hash },
        data: { revoked: true },
      })
    })
  }

  async me(userId: string, tenantId: string): Promise<MeResponse> {
    return runInTenantContext({ tenantId }, async () => {
      const user = await (prisma as any).user.findFirst({ where: { id: userId } })
      if (!user) throw new NotFoundError('User')
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as Role,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      }
    })
  }

  async register(
    input: RegisterInput,
    tenantId: string,
    role: Role = 'author'
  ): Promise<{ id: string }> {
    const strength = validatePasswordStrength(input.password)
    if (!strength.valid) throw new BadRequestError(strength.reason!)

    return runInTenantContext({ tenantId }, async () => {
      const existing = await (prisma as any).user.findFirst({ where: { email: input.email } })
      if (existing) throw new ConflictError('Email already registered')

      const passwordHash = await hashPassword(input.password)
      const user = await (prisma as any).user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash,
          role,
          tenantId,
        },
      })
      return { id: user.id }
    })
  }

  private async issueTokens(
    user: { id: string; email: string; role: string; tenantId: string },
    meta: { ip?: string; ua?: string; tenantId: string }
  ): Promise<AuthTokens> {
    const env = getEnv()

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role as Role,
      tenantId: meta.tenantId,
    }

    const accessToken = await signAccessToken(payload)

    // Refresh token: random bytes, store SHA-256 hash
    const refreshTokenPlain = generateToken(64)
    const refreshTokenHash = sha256(refreshTokenPlain)
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await (prisma as any).refreshToken.create({
      data: {
        userId: user.id,
        tenantId: meta.tenantId,
        tokenHash: refreshTokenHash,
        expiresAt: refreshExpires,
        ipAddress: meta.ip ?? null,
        userAgent: meta.ua ?? null,
      },
    })

    return { accessToken, refreshToken: refreshTokenPlain }
  }

  private async recordFailedAttempt(userId: string, tenantId: string, attempts: number) {
    const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION_MS)
      : null

    await runInTenantContext({ tenantId }, async () => {
      await (prisma as any).user.update({
        where: { id: userId },
        data: { loginAttempts: attempts, lockedUntil },
      })
    })
  }
}

export const authService = new AuthService()
