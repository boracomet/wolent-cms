import type { WolentPlugin } from '@wolent/utils'

export interface MediaPluginConfig {
  provider: 'local' | 's3'
  s3?: {
    bucket: string
    region: string
    accessKeyId: string
    secretAccessKey: string
    endpoint?: string // for S3-compatible providers (R2, MinIO)
    baseUrl?: string  // custom CDN URL
  }
  imageSizes?: {
    thumbnail: { width: number; height: number }
    small: { width: number; height: number }
    medium: { width: number; height: number }
    large: { width: number; height: number }
  }
}

export const MediaPlugin = (config: MediaPluginConfig = { provider: 'local' }): WolentPlugin => ({
  meta: {
    name: '@wolent/plugin-media',
    version: '0.1.0',
    description: 'Media storage (local/S3) with image optimization',
    permissions: ['db.read', 'db.write', 'storage.read', 'storage.write', 'http.outbound', 'events.listen'],
  },

  async register(cms) {
    cms.events.on('media.afterUpload', async (ctx) => {
      const file = ctx.data as { mime?: string; url?: string; id?: string }

      // Generate image variants if it's an image
      if (file.mime?.startsWith('image/') && config.provider === 's3' && config.s3) {
        // TODO: integrate sharp for image resizing
        // This is a placeholder for image processing pipeline
      }
    })
  },
})

export default MediaPlugin
