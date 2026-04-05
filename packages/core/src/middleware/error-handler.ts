import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify'
import { WolentError } from '@wolent/utils'
import { ZodError } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(error: any, req: any, reply: any): void {
  const log = req.log ?? console

  // Zod validation error
  if (error instanceof ZodError) {
    const details = error.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message,
    }))
    void reply.status(400).send({
      error: {
        status: 400,
        name: 'ValidationError',
        message: 'Validation failed',
        details,
      },
    })
    return
  }

  // Domain errors
  if (error instanceof WolentError) {
    void reply.status(error.statusCode).send({
      error: {
        status: error.statusCode,
        name: error.name,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
      },
    })
    return
  }

  // Fastify validation error (JSON schema)
  const statusCode = (error as FastifyError).statusCode ?? 500
  if (statusCode === 400) {
    void reply.status(400).send({
      error: {
        status: 400,
        name: 'ValidationError',
        message: error.message,
      },
    })
    return
  }

  // Unexpected error — log full stack, send generic message
  log.error({ err: error, req: { method: req.method, url: req.url } }, 'Unexpected error')

  void reply.status(500).send({
    error: {
      status: 500,
      name: 'InternalError',
      message: 'An unexpected error occurred',
    },
  })
}
