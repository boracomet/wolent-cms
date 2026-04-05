// ─── Domain Errors ─────────────────────────────────────────────────────────────

export class WolentError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly name: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = name
  }
}

export class NotFoundError extends WolentError {
  constructor(resource = 'Resource', id?: string) {
    super(
      id ? `${resource} with id "${id}" not found` : `${resource} not found`,
      404,
      'NotFoundError'
    )
  }
}

export class UnauthorizedError extends WolentError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UnauthorizedError')
  }
}

export class ForbiddenError extends WolentError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'ForbiddenError')
  }
}

export class ValidationError extends WolentError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'ValidationError', details)
  }
}

export class ConflictError extends WolentError {
  constructor(message: string) {
    super(message, 409, 'ConflictError')
  }
}

export class BadRequestError extends WolentError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'BadRequestError', details)
  }
}

export class InternalError extends WolentError {
  constructor(message = 'Internal server error') {
    super(message, 500, 'InternalError')
  }
}

export class PluginSandboxError extends WolentError {
  constructor(pluginName: string, reason: string) {
    super(
      `Plugin "${pluginName}" sandbox violation: ${reason}`,
      403,
      'PluginSandboxError'
    )
  }
}

export class TenantError extends WolentError {
  constructor(message = 'Tenant context missing') {
    super(message, 400, 'TenantError')
  }
}
