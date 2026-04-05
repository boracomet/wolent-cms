import type { WolentPlugin } from '@wolent/utils'

export interface I18nPluginConfig {
  defaultLocale: string
  locales: string[]
  autoTranslate?: boolean
}

export const I18nPlugin = (config: I18nPluginConfig = { defaultLocale: 'en', locales: ['en'] }): WolentPlugin => ({
  meta: {
    name: '@wolent/plugin-i18n',
    version: '0.1.0',
    description: 'Internationalization support for content types',
    permissions: ['db.read', 'db.write', 'events.listen', 'admin.panel'],
  },

  async register(cms) {
    // Add locale field to all content entries (via lifecycle hook)
    cms.events.on('content.beforeCreate', async (ctx) => {
      if (!ctx.data['locale']) {
        ctx.data['locale'] = config.defaultLocale
      }
    })

    // Admin panel slot for locale management
    cms.admin.addMenuItem({
      label: 'Internationalization',
      path: '/settings?tab=i18n',
      icon: 'Globe',
    })
  },
})

export default I18nPlugin
