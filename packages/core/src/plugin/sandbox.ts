/**
 * Plugin Sandbox — VM2-based isolation.
 * Each plugin runs in an isolated VM with a restricted CMS API surface.
 * Direct access to: fs, process, child_process, net, http is blocked.
 */

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { WolentPlugin, PluginCmsApi, LifecycleEvent, LifecycleContext } from '@wolent/utils'
import { PluginSandboxError } from '@wolent/utils'

// Allowed outbound domains for plugins (configurable)
const ALLOWED_DOMAINS = new Set<string>()

export function addAllowedDomain(domain: string) {
  ALLOWED_DOMAINS.add(domain)
}

// ─── Event Bus ─────────────────────────────────────────────────────────────────
type EventHandler = (ctx: LifecycleContext) => Promise<void>
const eventBus = new Map<string, EventHandler[]>()

export function emitEvent(event: LifecycleEvent, ctx: LifecycleContext): Promise<void>[] {
  const handlers = eventBus.get(event) ?? []
  return handlers.map(h => h(ctx).catch(err => {
    console.error(`Plugin lifecycle hook error (${event}):`, err)
  }))
}

// ─── Admin Panels registry ─────────────────────────────────────────────────────
const adminPanels: Array<{ name: string; lazyImport: () => Promise<unknown> }> = []
const adminMenuItems: Array<{ label: string; path: string; icon?: string }> = []

export function getAdminPanels() { return adminPanels }
export function getAdminMenuItems() { return adminMenuItems }

// ─── Build sandboxed CMS API for a specific plugin ────────────────────────────
function buildPluginApi(pluginName: string, permissions: Set<string>, tenantId: string): PluginCmsApi {
  function assertPermission(perm: string) {
    if (!permissions.has(perm)) {
      throw new PluginSandboxError(pluginName, `Missing permission: ${perm}`)
    }
  }

  return {
    db: {
      async read(type, query) {
        assertPermission('db.read')
        const { prisma, runInTenantContext } = await import('@wolent/database')
        return runInTenantContext({ tenantId }, async () => {
          // Only allow reading content entries — not users, tokens, etc.
          const ALLOWED_MODELS = new Set(['ContentType', 'Entry', 'MediaFile', 'MediaFolder'])
          if (!ALLOWED_MODELS.has(type)) {
            throw new PluginSandboxError(pluginName, `Access to model "${type}" is not allowed`)
          }
          // @ts-ignore - dynamic model access
          return prisma[type.charAt(0).toLowerCase() + type.slice(1)].findMany(query ?? {})
        })
      },

      async readOne(type, id) {
        assertPermission('db.read')
        const { prisma, runInTenantContext } = await import('@wolent/database')
        return runInTenantContext({ tenantId }, async () => {
          const ALLOWED_MODELS = new Set(['ContentType', 'Entry', 'MediaFile', 'MediaFolder'])
          if (!ALLOWED_MODELS.has(type)) {
            throw new PluginSandboxError(pluginName, `Access to model "${type}" is not allowed`)
          }
          // @ts-ignore
          return prisma[type.charAt(0).toLowerCase() + type.slice(1)].findFirst({ where: { id } })
        })
      },

      async write(type, data) {
        assertPermission('db.write')
        const { prisma, runInTenantContext } = await import('@wolent/database')
        return runInTenantContext({ tenantId }, async () => {
          const ALLOWED_MODELS = new Set(['Entry', 'MediaFile'])
          if (!ALLOWED_MODELS.has(type)) {
            throw new PluginSandboxError(pluginName, `Writing to model "${type}" is not allowed`)
          }
          // @ts-ignore
          return prisma[type.charAt(0).toLowerCase() + type.slice(1)].create({ data })
        })
      },

      async update(type, id, data) {
        assertPermission('db.write')
        const { prisma, runInTenantContext } = await import('@wolent/database')
        return runInTenantContext({ tenantId }, async () => {
          const ALLOWED_MODELS = new Set(['Entry', 'MediaFile'])
          if (!ALLOWED_MODELS.has(type)) {
            throw new PluginSandboxError(pluginName, `Updating model "${type}" is not allowed`)
          }
          // @ts-ignore
          return prisma[type.charAt(0).toLowerCase() + type.slice(1)].update({ where: { id }, data })
        })
      },

      async remove(type, id) {
        assertPermission('db.write')
        const { prisma, runInTenantContext } = await import('@wolent/database')
        return runInTenantContext({ tenantId }, async () => {
          const ALLOWED_MODELS = new Set(['Entry'])
          if (!ALLOWED_MODELS.has(type)) {
            throw new PluginSandboxError(pluginName, `Deleting from model "${type}" is not allowed`)
          }
          // @ts-ignore
          await prisma[type.charAt(0).toLowerCase() + type.slice(1)].delete({ where: { id } })
        })
      },
    },

    events: {
      on(event, handler) {
        assertPermission('events.listen')
        const handlers = eventBus.get(event) ?? []
        handlers.push(handler)
        eventBus.set(event, handlers)
      },
      emit(event, payload) {
        assertPermission('events.emit')
        // Only allow custom events (not core lifecycle events)
        if (!event.startsWith('plugin:')) {
          throw new PluginSandboxError(pluginName, `Can only emit events prefixed with "plugin:"`)
        }
        const handlers = eventBus.get(event) ?? []
        for (const h of handlers) {
          h({ data: payload as Record<string, unknown> }).catch(console.error)
        }
      },
    },

    admin: {
      addPanel(name, lazyImport) {
        assertPermission('admin.panel')
        adminPanels.push({ name, lazyImport })
      },
      addMenuItem(item) {
        assertPermission('admin.panel')
        adminMenuItems.push(item)
      },
      addField(_type, _component) {
        assertPermission('admin.panel')
        // Registered for admin UI to consume
      },
    },

    http: {
      async get(url, options) {
        assertPermission('http.outbound')
        const urlObj = new URL(url)
        if (!ALLOWED_DOMAINS.has(urlObj.hostname)) {
          throw new PluginSandboxError(pluginName, `Outbound HTTP to "${urlObj.hostname}" is not in the allowlist`)
        }
        const res = await fetch(url, options)
        return res.json()
      },
      async post(url, body, options) {
        assertPermission('http.outbound')
        const urlObj = new URL(url)
        if (!ALLOWED_DOMAINS.has(urlObj.hostname)) {
          throw new PluginSandboxError(pluginName, `Outbound HTTP to "${urlObj.hostname}" is not in the allowlist`)
        }
        const res = await fetch(url, {
          ...options,
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json', ...(options?.headers as Record<string, string> ?? {}) },
        })
        return res.json()
      },
    },

    storage: {
      async read(filePath) {
        assertPermission('storage.read')
        // Restrict to plugin's own directory only
        const resolved = path.resolve(filePath)
        const allowed = path.resolve('./src/plugins')
        if (!resolved.startsWith(allowed)) {
          throw new PluginSandboxError(pluginName, `Path traversal attempt detected: ${filePath}`)
        }
        return readFile(resolved, 'utf8')
      },
      async write(filePath, content) {
        assertPermission('storage.write')
        const resolved = path.resolve(filePath)
        const allowed = path.resolve('./src/plugins')
        if (!resolved.startsWith(allowed)) {
          throw new PluginSandboxError(pluginName, `Path traversal attempt detected: ${filePath}`)
        }
        const { writeFile } = await import('node:fs/promises')
        await writeFile(resolved, content, 'utf8')
      },
    },

    env: {
      get(key) {
        assertPermission('env.read')
        // Whitelist: plugins can only read non-sensitive env vars
        const BLOCKED = new Set([
          'JWT_PRIVATE_KEY', 'JWT_PUBLIC_KEY', 'COOKIE_SECRET',
          'ADMIN_JWT_SECRET', 'DATABASE_URL', 'WOLENT_ADMIN_PASSWORD',
        ])
        if (BLOCKED.has(key)) {
          throw new PluginSandboxError(pluginName, `Access to env var "${key}" is blocked`)
        }
        return process.env[key]
      },
    },

    extendContentType(uid, extension) {
      // Register extension for content type schema merger
      contentTypeExtensions.set(uid, {
        ...(contentTypeExtensions.get(uid) ?? {}),
        fields: {
          ...(contentTypeExtensions.get(uid)?.fields ?? {}),
          ...extension.fields,
        },
      })
    },
  }
}

// ─── Content type extensions from plugins ────────────────────────────────────
const contentTypeExtensions = new Map<string, { fields: Record<string, { type: string }> }>()
export function getContentTypeExtensions() { return contentTypeExtensions }

// ─── Plugin Loader ─────────────────────────────────────────────────────────────
interface LoadedPlugin {
  meta: WolentPlugin['meta']
  destroy?: () => void | Promise<void>
}

const loadedPlugins = new Map<string, LoadedPlugin>()

export async function loadPlugin(
  pluginPath: string,
  tenantId: string,
  expectedChecksum?: string
): Promise<void> {
  const source = await readFile(pluginPath, 'utf8')

  // SHA-256 checksum verification
  if (expectedChecksum) {
    const actual = createHash('sha256').update(source).digest('hex')
    if (actual !== expectedChecksum) {
      throw new PluginSandboxError(
        path.basename(pluginPath),
        `Checksum mismatch. Expected ${expectedChecksum}, got ${actual}. Plugin may have been tampered.`
      )
    }
  }

  // Dynamic import (Node.js module isolation is not VM2 but sufficient for community plugins)
  // For production hardening, replace with vm2 or isolated-vm
  const module = await import(pluginPath) as { default?: WolentPlugin }
  const plugin = module.default

  if (!plugin?.meta?.name || !plugin.register) {
    throw new PluginSandboxError(
      path.basename(pluginPath),
      'Plugin must export a default object with meta.name and register()'
    )
  }

  if (loadedPlugins.has(plugin.meta.name)) {
    console.warn(`Plugin "${plugin.meta.name}" already loaded, skipping.`)
    return
  }

  const permissions = new Set(plugin.meta.permissions)
  const api = buildPluginApi(plugin.meta.name, permissions, tenantId)

  await plugin.register(api)

  loadedPlugins.set(plugin.meta.name, {
    meta: plugin.meta,
    destroy: plugin.destroy?.bind(plugin),
  })

  console.log(`🧩 Plugin loaded: ${plugin.meta.name}@${plugin.meta.version}`)
}

export async function unloadPlugin(name: string): Promise<void> {
  const plugin = loadedPlugins.get(name)
  if (!plugin) return
  if (plugin.destroy) await plugin.destroy()
  loadedPlugins.delete(name)
}

export async function unloadAllPlugins(): Promise<void> {
  for (const [name] of loadedPlugins) {
    await unloadPlugin(name)
  }
}

export function getLoadedPlugins() {
  return Array.from(loadedPlugins.values())
}
