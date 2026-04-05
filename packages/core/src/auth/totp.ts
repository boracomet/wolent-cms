import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'
import { generateToken } from '../utils/crypto.js'
import { hashPassword, verifyPassword } from './password.js'

authenticator.options = {
  window: 1, // allow 1 step drift (30s before/after)
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret()
}

export function verifyTotp(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ secret, token })
  } catch {
    return false
  }
}

export async function generateQrCode(email: string, secret: string, issuer = 'Wolent CMS'): Promise<string> {
  const otpauth = authenticator.keyuri(email, issuer, secret)
  return toDataURL(otpauth)
}

/**
 * Generate 8 backup codes. Returns both plaintext (show once to user) and hashed versions (store in DB).
 */
export async function generateBackupCodes(): Promise<{ plaintext: string[]; hashed: string[] }> {
  const plaintext = Array.from({ length: 8 }, () => generateToken(5).toUpperCase())
  const hashed = await Promise.all(plaintext.map(code => hashPassword(code)))
  return { plaintext, hashed }
}

/**
 * Verify and consume a backup code (removes it from the list after use).
 */
export async function verifyAndConsumeBackupCode(
  hashedCodes: string[],
  input: string
): Promise<{ valid: boolean; remaining: string[] }> {
  let matchedIndex = -1

  for (let i = 0; i < hashedCodes.length; i++) {
    const code = hashedCodes[i]
    if (code && await verifyPassword(code, input.toUpperCase())) {
      matchedIndex = i
      break
    }
  }

  if (matchedIndex === -1) return { valid: false, remaining: hashedCodes }

  const remaining = [...hashedCodes]
  remaining.splice(matchedIndex, 1)
  return { valid: true, remaining }
}
