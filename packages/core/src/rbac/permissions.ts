import type { Role, Action } from '@wolent/utils'
import { ForbiddenError } from '@wolent/utils'

// ─── Default Role Permission Matrix ───────────────────────────────────────────
// subject: '*' means all content types
// Fields left empty = inherits from parent role
const ROLE_PERMISSIONS: Record<Role, Record<string, Action[]>> = {
  super_admin: {
    '*': ['create', 'read', 'update', 'delete', 'publish', 'settings'],
  },
  admin: {
    '*': ['create', 'read', 'update', 'delete', 'publish'],
    settings: ['read', 'update'],
  },
  editor: {
    '*': ['create', 'read', 'update', 'publish'],
  },
  author: {
    '*': ['create', 'read', 'update'],
    // Can only see own entries (enforced via condition 'isOwner')
  },
  viewer: {
    '*': ['read'],
  },
}

// ─── Field-level permission defaults ─────────────────────────────────────────
// Fields that only editors and above can write
const RESTRICTED_WRITE_FIELDS = new Set([
  'publishedAt',
  'createdBy',
  'updatedBy',
  'createdAt',
  'updatedAt',
  'deletedAt',
])

const EDITOR_ONLY_WRITE_FIELDS = new Set([
  'publishedAt',
])

export function canPerformAction(role: Role, action: Action, subject: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  const subjectPerms = perms[subject] ?? perms['*'] ?? []
  return subjectPerms.includes(action)
}

export function assertCan(role: Role, action: Action, subject: string): void {
  if (!canPerformAction(role, action, subject)) {
    throw new ForbiddenError(`Role "${role}" cannot perform "${action}" on "${subject}"`)
  }
}

/**
 * Filter an entry's fields based on the user's role.
 * Returns only the fields the user is allowed to read/write.
 */
export function filterFieldsByPermission(
  data: Record<string, unknown>,
  role: Role,
  mode: 'read' | 'write'
): Record<string, unknown> {
  if (role === 'super_admin' || role === 'admin') return data

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (mode === 'write') {
      if (RESTRICTED_WRITE_FIELDS.has(key)) continue
      const canWriteEditorFields: Role[] = ['editor', 'admin', 'super_admin']
      if (EDITOR_ONLY_WRITE_FIELDS.has(key) && !canWriteEditorFields.includes(role)) {
        continue
      }
    }
    result[key] = value
  }

  return result
}

/**
 * Apply ownership condition: authors can only see/modify their own entries.
 */
export function applyOwnershipFilter(
  role: Role,
  userId: string,
  query: Record<string, unknown>
): Record<string, unknown> {
  if (role === 'author') {
    return { ...query, createdById: userId }
  }
  return query
}
