import crypto from 'node:crypto'

/**
 * Generate a cryptographically secure random token (hex string).
 */
export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * SHA-256 hash of a plaintext string (for storing refresh tokens, API tokens).
 */
export function sha256(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'))
}

/**
 * Decode a base64-encoded string (used for PEM keys in env vars).
 */
export function decodeBase64(encoded: string): string {
  return Buffer.from(encoded, 'base64').toString('utf8')
}
