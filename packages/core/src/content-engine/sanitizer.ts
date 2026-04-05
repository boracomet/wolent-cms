import sanitizeHtml from 'sanitize-html'
import type { ContentTypeDefinition } from '@wolent/utils'

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    '*': ['class', 'id'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

const PLAIN_TEXT_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
}

export function sanitizeEntryData(
  data: Record<string, unknown>,
  schema: ContentTypeDefinition
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      result[key] = value
      continue
    }

    const fieldDef = schema.attributes[key]
    if (!fieldDef) {
      // Unknown field — drop it (prevent mass assignment)
      continue
    }

    switch (fieldDef.type) {
      case 'richtext': {
        result[key] = typeof value === 'string'
          ? sanitizeHtml(value, RICH_TEXT_OPTIONS)
          : value
        break
      }
      case 'text':
      case 'text_long': {
        result[key] = typeof value === 'string'
          ? sanitizeHtml(value, PLAIN_TEXT_OPTIONS)
          : value
        break
      }
      case 'email': {
        result[key] = typeof value === 'string' ? value.toLowerCase().trim() : value
        break
      }
      case 'blocks':
      case 'json':
      case 'component':
      case 'dynamiczone': {
        // These are structured JSON — no HTML sanitization needed
        result[key] = value
        break
      }
      case 'datetime':
      case 'date':
      case 'time': {
        // Normalize to ISO string
        result[key] = value instanceof Date ? value.toISOString() : value
        break
      }
      case 'password': {
        // Never store plaintext — this should be hashed before arriving here
        // Drop from public data response
        result[key] = undefined
        break
      }
      default: {
        result[key] = value
      }
    }
  }

  return result
}
