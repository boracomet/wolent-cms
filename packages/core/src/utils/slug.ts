import { nanoid } from 'nanoid'

export function generateDocumentId(): string {
  return nanoid(21)
}

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function toApiId(displayName: string): string {
  return toSlug(displayName).replace(/-/g, '_')
}

export function toCollectionName(singularName: string): string {
  return toApiId(singularName) + 's'
}

export function buildContentTypeUid(singularName: string): string {
  return `api::${toApiId(singularName)}.${toApiId(singularName)}`
}
