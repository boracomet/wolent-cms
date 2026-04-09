import type { FastifyInstance } from 'fastify'
import { graphql, buildSchema } from 'graphql'
import { contentTypeService } from '../content-engine/service.js'
import { requireAuth } from '../middleware/auth.js'

/**
 * GraphQL HTTP endpoint. Kayıtlı `/api/:uid` entry rotasından ÖNCE mount edilmeli;
 * aksi halde POST /api/graphql → uid=graphql olarak yanlış eşleşir.
 */
const schema = buildSchema(`
  type Query {
    contentTypes: [ContentType!]!
  }

  type ContentType {
    uid: String!
    displayName: String!
    singularName: String!
    pluralName: String
    description: String
    kind: String
    draftAndPublish: Boolean
  }
`)

export async function graphqlRoute(app: FastifyInstance) {
  app.post(
    '/api/graphql',
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const body = req.body as { query?: string; variables?: Record<string, unknown> } | null
      const source = typeof body?.query === 'string' ? body.query : ''
      if (!source.trim()) {
        return reply.status(400).send({
          errors: [{ message: 'Missing "query" in JSON body' }],
        })
      }

      const variables =
        body?.variables && typeof body.variables === 'object' && !Array.isArray(body.variables)
          ? body.variables
          : undefined

      const tenantId = req.tenantId

      const result = await graphql({
        schema,
        source,
        variableValues: variables,
        rootValue: {
          contentTypes: async () => {
            const types = await contentTypeService.list(tenantId)
            return types.map((t: { uid: string; displayName: string; singularName: string; pluralName: string; description?: string | null; kind?: string; draftAndPublish?: boolean }) => ({
              uid: t.uid,
              displayName: t.displayName,
              singularName: t.singularName,
              pluralName: t.pluralName,
              description: t.description ?? null,
              kind: t.kind ?? 'collectionType',
              draftAndPublish: Boolean(t.draftAndPublish),
            }))
          },
        },
      })

      return reply.status(200).send(result)
    }
  )
}
