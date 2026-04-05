// ─── Plugin System Types ───────────────────────────────────────────────────────

export type PluginPermission =
  | 'db.read'
  | 'db.write'
  | 'events.emit'
  | 'events.listen'
  | 'admin.panel'
  | 'http.outbound'
  | 'storage.read'
  | 'storage.write'
  | 'env.read'

export interface PluginMeta {
  name: string
  version: string
  description?: string
  author?: string
  permissions: PluginPermission[]
  checksum?: string // SHA-256 of plugin source
}

export type LifecycleEvent =
  | 'content.beforeCreate'
  | 'content.afterCreate'
  | 'content.beforeUpdate'
  | 'content.afterUpdate'
  | 'content.beforeDelete'
  | 'content.afterDelete'
  | 'content.beforePublish'
  | 'content.afterPublish'
  | 'media.beforeUpload'
  | 'media.afterUpload'
  | 'user.beforeCreate'
  | 'user.afterCreate'
  | 'server.start'
  | 'server.stop'

export interface LifecycleContext {
  data: Record<string, unknown>
  params?: Record<string, unknown>
  result?: unknown
  user?: { id: string; role: string }
}

// ─── Sandboxed CMS API surface exposed to plugins ──────────────────────────────
export interface PluginCmsApi {
  db: {
    read(type: string, query?: Record<string, unknown>): Promise<unknown[]>
    readOne(type: string, id: string): Promise<unknown | null>
    write(type: string, data: Record<string, unknown>): Promise<unknown>
    update(type: string, id: string, data: Record<string, unknown>): Promise<unknown>
    remove(type: string, id: string): Promise<void>
  }
  events: {
    on(event: LifecycleEvent, handler: (ctx: LifecycleContext) => Promise<void>): void
    emit(event: string, payload: unknown): void
  }
  admin: {
    addPanel(name: string, lazyImport: () => Promise<unknown>): void
    addMenuItem(item: { label: string; path: string; icon?: string }): void
    addField(type: string, component: () => Promise<unknown>): void
  }
  http: {
    get(url: string, options?: RequestInit): Promise<unknown>
    post(url: string, body: unknown, options?: RequestInit): Promise<unknown>
  }
  storage: {
    read(path: string): Promise<string>
    write(path: string, content: string): Promise<void>
  }
  env: {
    get(key: string): string | undefined
  }
  extendContentType(
    uid: string,
    extension: { fields: Record<string, { type: string }> }
  ): void
}

export interface WolentPlugin {
  meta: PluginMeta
  register(cms: PluginCmsApi): void | Promise<void>
  destroy?(): void | Promise<void>
}
