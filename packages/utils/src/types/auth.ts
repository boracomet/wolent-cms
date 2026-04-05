import { z } from 'zod'

// ─── Roles ─────────────────────────────────────────────────────────────────────
export const RoleSchema = z.enum([
  'super_admin',
  'admin',
  'editor',
  'author',
  'viewer',
])
export type Role = z.infer<typeof RoleSchema>

export const ROLE_HIERARCHY: Record<Role, number> = {
  super_admin: 100,
  admin: 80,
  editor: 60,
  author: 40,
  viewer: 20,
}

// ─── Permissions ───────────────────────────────────────────────────────────────
export const ActionSchema = z.enum([
  'create',
  'read',
  'update',
  'delete',
  'publish',
  'settings',
])
export type Action = z.infer<typeof ActionSchema>

export interface Permission {
  action: Action
  subject: string // content type uid or '*'
  fields?: string[] // null = all fields
  conditions?: string[] // e.g. ['isOwner']
}

// ─── JWT Payload ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string // userId
  email: string
  role: Role
  tenantId: string
  iat?: number
  exp?: number
}

// ─── Auth Schemas ──────────────────────────────────────────────────────────────
export const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  totpCode: z.string().length(6).optional(),
})
export type LoginInput = z.infer<typeof LoginSchema>

export const RegisterSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
})
export type RegisterInput = z.infer<typeof RegisterSchema>

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>

// ─── Token Response ────────────────────────────────────────────────────────────
export interface AuthTokens {
  accessToken: string
  refreshToken?: string // only on login/refresh, not on every request
}

export interface MeResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  twoFactorEnabled: boolean
  createdAt: Date
}
