/**
 * Wolent CMS — API Client
 * Wraps fetch with auth, error handling, and type safety.
 */

const API_BASE = '/api'

// ─── Token Store ──────────────────────────────────────────────────────────────
let _accessToken: string | null = null

export function setAccessToken(token: string | null) {
  _accessToken = token
  if (token) {
    localStorage.setItem('wolent_access_token', token)
  } else {
    localStorage.removeItem('wolent_access_token')
  }
}

export function getAccessToken(): string | null {
  if (_accessToken) return _accessToken
  return localStorage.getItem('wolent_access_token')
}

// ─── Error class ─────────────────────────────────────────────────────────────
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly name: string,
    public readonly details?: unknown
  ) {
    super(message)
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
interface RequestOptions {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  noAuth?: boolean
}

async function request<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, noAuth = false } = opts

  // Build URL with query params
  let url = `${API_BASE}${endpoint}`
  if (params) {
    const search = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) search.set(k, String(v))
    }
    const qs = search.toString()
    if (qs) url += `?${qs}`
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Wolent-Tenant': 'default',
  }

  if (!noAuth) {
    const token = getAccessToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include', // send cookies (refresh token)
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Handle 401 — try to refresh token
  if (res.status === 401 && !noAuth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      // Retry with new token
      headers['Authorization'] = `Bearer ${getAccessToken()}`
      const retryRes = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      return handleResponse<T>(retryRes)
    }
    // Refresh failed — clear token, throw so callers can handle gracefully
    setAccessToken(null)
    throw new ApiClientError('Session expired', 401, 'UnauthorizedError')
  }

  return handleResponse<T>(res)
}

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    if (!res.ok) throw new ApiClientError(res.statusText, res.status, 'NetworkError')
    return text as unknown as T
  }

  if (!res.ok) {
    const err = (json as { error?: { status: number; name: string; message: string; details?: unknown } }).error
    throw new ApiClientError(
      err?.message ?? 'Request failed',
      err?.status ?? res.status,
      err?.name ?? 'ApiError',
      err?.details
    )
  }

  return json as T
}

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Wolent-Tenant': 'default' },
    })
    if (!res.ok) return false
    const data = await res.json() as { data: { accessToken: string } }
    setAccessToken(data.data.accessToken)
    return true
  } catch {
    return false
  }
}

// ─── API methods ──────────────────────────────────────────────────────────────
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string, totpCode?: string) =>
      request<{ data: { accessToken?: string; requiresTwoFactor?: boolean } }>('/auth/login', {
        method: 'POST',
        body: { email, password, ...(totpCode ? { totpCode } : {}) },
        noAuth: true,
      }),

    logout: () =>
      request<{ data: { ok: boolean } }>('/auth/logout', { method: 'POST' }),

    refresh: () =>
      request<{ data: { accessToken: string } }>('/auth/refresh', { method: 'POST', noAuth: true }),

    me: () =>
      request<{ data: { id: string; email: string; firstName: string; lastName: string; role: string; twoFactorEnabled: boolean } }>('/auth/me'),

    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ data: { ok: boolean } }>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      }),

    setup2fa: () =>
      request<{ data: { secret: string; qrCode: string } }>('/auth/2fa/setup', { method: 'POST' }),

    enable2fa: (totpCode: string) =>
      request<{ data: { backupCodes: string[] } }>('/auth/2fa/enable', {
        method: 'POST',
        body: { totpCode },
      }),

    disable2fa: (password: string) =>
      request<{ data: { ok: boolean } }>('/auth/2fa/disable', {
        method: 'POST',
        body: { password },
      }),
  },

  // Content Types
  contentTypes: {
    list: () =>
      request<{ data: unknown[] }>('/content-types'),

    get: (uid: string) =>
      request<{ data: unknown }>(`/content-types/${uid}`),

    create: (data: unknown) =>
      request<{ data: unknown }>('/content-types', { method: 'POST', body: data }),

    update: (uid: string, data: unknown) =>
      request<{ data: unknown }>(`/content-types/${uid}`, { method: 'PUT', body: data }),

    delete: (uid: string) =>
      request<{ data: { ok: boolean } }>(`/content-types/${uid}`, { method: 'DELETE' }),
  },

  // Entries (Content Manager)
  entries: {
    list: (uid: string, params?: Record<string, string | number | boolean | undefined>) =>
      request<{ data: unknown[]; meta: unknown }>(`/${uid}`, { params }),

    get: (uid: string, id: string) =>
      request<{ data: unknown }>(`/${uid}/${id}`),

    create: (uid: string, data: unknown, locale?: string) =>
      request<{ data: unknown }>(`/${uid}`, {
        method: 'POST',
        body: data,
        params: locale ? { locale } : undefined,
      }),

    update: (uid: string, id: string, data: unknown) =>
      request<{ data: unknown }>(`/${uid}/${id}`, { method: 'PUT', body: data }),

    patch: (uid: string, id: string, data: unknown) =>
      request<{ data: unknown }>(`/${uid}/${id}`, { method: 'PATCH', body: data }),

    publish: (uid: string, id: string) =>
      request<{ data: unknown }>(`/${uid}/${id}/publish`, { method: 'POST' }),

    unpublish: (uid: string, id: string) =>
      request<{ data: unknown }>(`/${uid}/${id}/unpublish`, { method: 'POST' }),

    delete: (uid: string, id: string) =>
      request<{ data: { ok: boolean } }>(`/${uid}/${id}`, { method: 'DELETE' }),
  },

  // Users
  users: {
    list: () =>
      request<{ data: unknown[] }>('/admin/users'),

    get: (id: string) =>
      request<{ data: unknown }>(`/admin/users/${id}`),

    create: (data: unknown) =>
      request<{ data: unknown }>('/admin/users', { method: 'POST', body: data }),

    update: (id: string, data: unknown) =>
      request<{ data: unknown }>(`/admin/users/${id}`, { method: 'PUT', body: data }),

    delete: (id: string) =>
      request<{ data: { ok: boolean } }>(`/admin/users/${id}`, { method: 'DELETE' }),
  },

  // Media
  media: {
    files: (params?: Record<string, string | number | boolean | undefined>) =>
      request<{ data: unknown[]; meta: unknown }>('/upload/files', { params }),

    getFile: (id: string) =>
      request<{ data: unknown }>(`/upload/files/${id}`),

    upload: async (file: File, folderId?: string) => {
      const form = new FormData()
      form.append('file', file)

      const run = () => {
        const headers: Record<string, string> = {
          'X-Wolent-Tenant': 'default',
        }
        const token = getAccessToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
        const url = folderId ? `/api/upload?folderId=${encodeURIComponent(folderId)}` : '/api/upload'
        return fetch(url, { method: 'POST', headers, credentials: 'include', body: form })
      }

      let res = await run()
      if (res.status === 401) {
        const refreshed = await tryRefresh()
        if (refreshed) res = await run()
      }
      if (res.status === 401) {
        setAccessToken(null)
        throw new ApiClientError('Session expired', 401, 'UnauthorizedError')
      }
      return handleResponse<{ data: unknown }>(res)
    },

    updateFile: (id: string, data: unknown) =>
      request<{ data: unknown }>(`/upload/files/${id}`, { method: 'PUT', body: data }),

    deleteFile: (id: string) =>
      request<{ data: { ok: boolean } }>(`/upload/files/${id}`, { method: 'DELETE' }),

    folders: () =>
      request<{ data: unknown[] }>('/upload/folders'),

    createFolder: (data: unknown) =>
      request<{ data: unknown }>('/upload/folders', { method: 'POST', body: data }),

    updateFolder: (id: string, data: unknown) =>
      request<{ data: unknown }>(`/upload/folders/${id}`, { method: 'PUT', body: data }),

    deleteFolder: (id: string) =>
      request<{ data: { ok: boolean } }>(`/upload/folders/${id}`, { method: 'DELETE' }),
  },

  // Roles
  roles: {
    list: () =>
      request<{ data: unknown[] }>('/admin/roles'),
    updatePermissions: (id: string, permissions: unknown) =>
      request<{ data: unknown }>(`/admin/roles/${id}/permissions`, { method: 'PUT', body: permissions }),
  },

  // DB Info
  dbInfo: {
    get: () =>
      request<{ data: unknown }>('/admin/db-info'),
    migrations: () =>
      request<{ data: { id: string; name: string; status: 'applied' | 'pending'; appliedAt: string | null }[] }>('/admin/db-info/migrations'),
    migrate: () =>
      request<{ data: { ok: boolean } }>('/admin/db-info/migrate', { method: 'POST' }),
  },

  // API Tokens
  apiTokens: {
    list: () =>
      request<{ data: unknown[] }>('/admin/api-tokens'),

    create: (data: unknown) =>
      request<{ data: unknown }>('/admin/api-tokens', { method: 'POST', body: data }),

    delete: (id: string) =>
      request<{ data: { ok: boolean } }>(`/admin/api-tokens/${id}`, { method: 'DELETE' }),
  },

  // Audit Logs
  auditLogs: {
    list: (params?: Record<string, string | number | boolean | undefined>) =>
      request<{ data: unknown[]; meta: unknown }>('/admin/audit-logs', { params }),
  },

  // Backup
  backup: {
    export: (included: Record<string, boolean>) =>
      request<Record<string, unknown>>('/admin/backup/export', { method: 'POST', body: included }),
    import: (backup: unknown, include?: Record<string, boolean>) =>
      request<{ data: { ok: boolean; restored: number } }>('/admin/backup/import', {
        method: 'POST',
        body: { backup, include },
      }),
  },

  // Admin Settings
  settings: {
    get: (namespace: string) =>
      request<{ data: Record<string, unknown> }>(`/admin/settings/${namespace}`),
    save: (namespace: string, data: Record<string, unknown>) =>
      request<{ data: Record<string, unknown> }>(`/admin/settings/${namespace}`, { method: 'PUT', body: data }),
  },
}
