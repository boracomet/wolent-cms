import type { WolentPlugin } from '@wolent/utils'

export const GraphQLPlugin = (): WolentPlugin => ({
  meta: {
    name: '@wolent/plugin-graphql',
    version: '0.1.0',
    description: 'GraphQL API endpoint generated from content types',
    permissions: ['db.read', 'admin.panel'],
  },

  async register(cms) {
    cms.admin.addMenuItem({
      label: 'GraphQL Playground',
      path: '/graphql',
      icon: 'Braces',
    })

    // The actual GraphQL schema is auto-generated from content types at runtime
    // and registered as a Fastify plugin via app.register(mercurius, { schema, resolvers })
    // Çekirdek: packages/core/src/api/graphql-route.ts — POST /api/graphql
    console.log('🚀 GraphQL plugin registered — endpoint: /api/graphql')
  },
})

export default GraphQLPlugin
