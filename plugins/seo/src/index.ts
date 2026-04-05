import type { WolentPlugin } from '@wolent/utils'

export const SeoPlugin = (): WolentPlugin => ({
  meta: {
    name: '@wolent/plugin-seo',
    version: '0.1.0',
    description: 'SEO fields for content types',
    permissions: ['db.read', 'events.listen', 'admin.panel'],
  },

  async register(cms) {
    // Add SEO fields to all content types
    cms.extendContentType('*', {
      fields: {
        seoTitle: { type: 'text' },
        seoDescription: { type: 'text_long' },
        ogImage: { type: 'media' },
        canonicalUrl: { type: 'text' },
        noIndex: { type: 'boolean' },
      },
    })

    // Auto-fill seoTitle from title if not set
    cms.events.on('content.beforeCreate', async (ctx) => {
      if (!ctx.data['seoTitle'] && ctx.data['title']) {
        ctx.data['seoTitle'] = String(ctx.data['title']).slice(0, 60)
      }
      if (!ctx.data['seoDescription'] && ctx.data['content']) {
        const text = String(ctx.data['content']).replace(/<[^>]*>/g, '').slice(0, 160)
        ctx.data['seoDescription'] = text
      }
    })
  },
})

export default SeoPlugin
