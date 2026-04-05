#!/usr/bin/env node
/**
 * RSA key pair generator for Wolent CMS JWT (RS256).
 * Generates a 2048-bit RSA key pair and outputs base64-encoded PEM strings
 * ready to paste into .env.
 *
 * Usage: tsx src/scripts/generate-keys.ts
 */

import crypto from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function generateRsaKeyPair(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })
  return { privateKey, publicKey }
}

function toBase64(pem: string): string {
  return Buffer.from(pem).toString('base64')
}

function generateSecret(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

async function main() {
  console.log('🔑 Generating RSA 2048-bit key pair for JWT RS256...\n')

  const { privateKey, publicKey } = generateRsaKeyPair()
  const privateKeyB64 = toBase64(privateKey)
  const publicKeyB64 = toBase64(publicKey)
  const cookieSecret = generateSecret(32)
  const adminJwtSecret = generateSecret(32)

  // Try to update existing .env file
  // Look from cwd first, then from monorepo root (packages/core -> ../../)
  let envPath = path.resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) {
    envPath = path.resolve(__dirname, '../../../../.env')
  }
  if (existsSync(envPath)) {
    let env = readFileSync(envPath, 'utf8')

    const replacements: [RegExp, string][] = [
      [/^JWT_PRIVATE_KEY=.*$/m, `JWT_PRIVATE_KEY="${privateKeyB64}"`],
      [/^JWT_PUBLIC_KEY=.*$/m, `JWT_PUBLIC_KEY="${publicKeyB64}"`],
      [/^COOKIE_SECRET=.*$/m, `COOKIE_SECRET="${cookieSecret}"`],
      [/^ADMIN_JWT_SECRET=.*$/m, `ADMIN_JWT_SECRET="${adminJwtSecret}"`],
    ]

    let changed = false
    for (const [pattern, replacement] of replacements) {
      if (pattern.test(env)) {
        env = env.replace(pattern, replacement)
        changed = true
      }
    }

    if (changed) {
      writeFileSync(envPath, env)
      console.log('✅ Updated existing .env with generated keys\n')
    } else {
      console.log('ℹ️  .env found but keys not replaced (patterns not found). Printing values:\n')
      printValues(privateKeyB64, publicKeyB64, cookieSecret, adminJwtSecret)
    }
  } else {
    console.log('ℹ️  No .env found. Copy these values into your .env:\n')
    printValues(privateKeyB64, publicKeyB64, cookieSecret, adminJwtSecret)
  }

  console.log('\n✅ Done! You can now run: npm run develop')
}

function printValues(privateKey: string, publicKey: string, cookie: string, jwt: string) {
  console.log(`JWT_PRIVATE_KEY="${privateKey}"`)
  console.log(`JWT_PUBLIC_KEY="${publicKey}"`)
  console.log(`COOKIE_SECRET="${cookie}"`)
  console.log(`ADMIN_JWT_SECRET="${jwt}"`)
}

main()
