import { z } from 'zod'

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1),

  // JWT — RS256 keys (PEM format, base64 encoded in env)
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),

  // Cookie
  COOKIE_SECRET: z.string().min(32),

  // Admin
  ADMIN_JWT_SECRET: z.string().min(32),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:1337'),

  // Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().int().default(100),
  RATE_LIMIT_WINDOW: z.string().default('1 minute'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),

  // Media
  UPLOAD_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('./public/uploads'),
  MAX_UPLOAD_SIZE: z.coerce.number().int().default(10 * 1024 * 1024), // 10MB

  // Plugins
  PLUGIN_DIR: z.string().default('./src/plugins'),

  // Setup
  SETUP_COMPLETED: z.string().transform(v => v === 'true').default('false'),
})

export type Env = z.infer<typeof envSchema>

let _env: Env | undefined

export function getEnv(): Env {
  if (_env) return _env

  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n')
    throw new Error(`❌ Invalid environment variables:\n${missing}\n\nRun "wolent setup" to configure your environment.`)
  }

  _env = result.data
  return _env
}

export function isDev(): boolean {
  return getEnv().NODE_ENV === 'development'
}

export function isProd(): boolean {
  return getEnv().NODE_ENV === 'production'
}
