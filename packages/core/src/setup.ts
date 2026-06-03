/**
 * First-run setup script.
 * Creates the default tenant and super admin user.
 * Called automatically on server start if SETUP_COMPLETED=false.
 */

import 'dotenv/config'
import { PrismaClient } from '@wolent/database'
import { hashPassword } from './auth/password.js'

const prisma = new PrismaClient()

// Bypass tenant guard for setup
process.env['WOLENT_BYPASS_TENANT_GUARD'] = 'true'

async function setup() {
  console.log('🔧 Running first-time setup...')

  const adminEmail = process.env['WOLENT_ADMIN_EMAIL']
  const adminPassword = process.env['WOLENT_ADMIN_PASSWORD']

  if (!adminEmail || !adminPassword) {
    console.error('❌ WOLENT_ADMIN_EMAIL and WOLENT_ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  // Check if already set up
  const existingTenant = await prisma.tenant.findFirst({ where: { slug: 'default' } })
  if (existingTenant) {
    console.log('✅ Setup already completed. Skipping.')
    await prisma.$disconnect()
    return
  }

  // Create default tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Default',
      slug: 'default',
    },
  })

  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`)

  // Create super admin
  const passwordHash = await hashPassword(adminPassword)
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash,
      role: 'super_admin',
      isActive: true,
      tenantId: tenant.id,
    },
  })

  console.log(`✅ Super admin created: ${admin.email}`)
  console.log()
  console.log('🚀 Setup complete! You can now log in at http://localhost:1337')
  console.log()

  await prisma.$disconnect()
}

setup().catch(async (err) => {
  console.error('❌ Setup failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
