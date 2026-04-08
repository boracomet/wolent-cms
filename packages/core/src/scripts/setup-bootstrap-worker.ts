/**
 * Ayrı süreç: güncel DATABASE_URL + Prisma client ile tenant, süper admin ve token üretir.
 * stdin’e JSON, stdout’a tek satır JSON.
 */
import type { Role } from '@wolent/utils'
import { hashPassword } from '../auth/password.js'
import { signAccessToken } from '../auth/jwt.js'
import { generateToken, sha256 } from '../utils/crypto.js'

type Input = {
  databaseUrl: string
  siteName: string
  firstName: string
  lastName: string
  email: string
  password: string
  ip?: string
  ua?: string
}

async function readStdinJson(): Promise<Input> {
  const chunks: Buffer[] = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer)
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim()
  return JSON.parse(raw) as Input
}

async function main() {
  const input = await readStdinJson()
  process.env['DATABASE_URL'] = input.databaseUrl

  const { PrismaClient } = await import('@prisma/client')
  const p = new PrismaClient()
  try {
    const existing = await p.tenant.findFirst({ where: { slug: 'default' } })
    if (existing) {
      console.log(JSON.stringify({ ok: false, error: 'Tenant already exists' }))
      process.exit(1)
    }

    const tenant = await p.tenant.create({
      data: { name: input.siteName, slug: 'default' },
    })

    const passwordHash = await hashPassword(input.password)
    const adminUser = await p.user.create({
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        role: 'super_admin',
        isActive: true,
        tenantId: tenant.id,
      },
    })

    const accessToken = await signAccessToken({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role as Role,
      tenantId: tenant.id,
    })

    const refreshTokenPlain = generateToken(64)
    await p.refreshToken.create({
      data: {
        userId: adminUser.id,
        tenantId: tenant.id,
        tokenHash: sha256(refreshTokenPlain),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: input.ip ?? null,
        userAgent: input.ua ?? null,
      },
    })

    console.log(
      JSON.stringify({
        ok: true,
        tenantId: tenant.id,
        userId: adminUser.id,
        accessToken,
        refreshToken: refreshTokenPlain,
      }),
    )
  } finally {
    await p.$disconnect()
  }
}

main().catch((err) => {
  console.log(
    JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : 'Bootstrap failed',
    }),
  )
  process.exit(1)
})
