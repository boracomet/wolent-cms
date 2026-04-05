import type { JwtPayload } from '@wolent/utils'
import { UnauthorizedError } from '@wolent/utils'
import { getEnv } from '../config/env.js'
import { decodeBase64 } from '../utils/crypto.js'
import { createSigner, createVerifier } from 'fast-jwt'

// Lazily initialized signer/verifier
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _signer: any = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _verifier: any = null

function getSigner() {
  if (!_signer) {
    const env = getEnv()
    const privateKey = decodeBase64(env.JWT_PRIVATE_KEY)
    _signer = createSigner({
      algorithm: 'RS256',
      key: async () => privateKey,
      expiresIn: env.JWT_ACCESS_EXPIRES,
    })
  }
  return _signer
}

function getVerifier() {
  if (!_verifier) {
    const env = getEnv()
    const publicKey = decodeBase64(env.JWT_PUBLIC_KEY)
    _verifier = createVerifier({
      algorithms: ['RS256'],
      key: async () => publicKey,
    })
  }
  return _verifier
}

export async function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const signer = getSigner()
  // fast-jwt with async key returns a promise
  const token = await signer(payload)
  return token as string
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const verifier = getVerifier()
  try {
    const payload = await verifier(token)
    return payload as JwtPayload
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid token'
    throw new UnauthorizedError(msg.includes('expired') ? 'Token expired' : 'Invalid token')
  }
}
