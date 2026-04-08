import type { ContentTypeDefinition, FieldDefinition } from '@wolent/utils'

export interface ValidationError {
  field: string
  message: string
}

export function validateEntryData(
  data: Record<string, unknown>,
  schema: ContentTypeDefinition
): ValidationError[] {
  const errors: ValidationError[] = []

  for (const [fieldName, fieldDef] of Object.entries(schema.attributes)) {
    const value = data[fieldName]

    // Required check
    if (fieldDef.required && (value === null || value === undefined || value === '')) {
      errors.push({ field: fieldName, message: `"${fieldName}" is required` })
      continue
    }

    if (value === null || value === undefined) continue

    // Type-specific validation
    switch (fieldDef.type) {
      case 'text':
      case 'text_long':
      case 'richtext':
      case 'blocks':
      case 'uid':
      case 'email': {
        if (typeof value !== 'string') {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a string` })
          break
        }
        if (fieldDef.minLength && value.length < fieldDef.minLength) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at least ${fieldDef.minLength} characters` })
        }
        if (fieldDef.maxLength && value.length > fieldDef.maxLength) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at most ${fieldDef.maxLength} characters` })
        }
        if (fieldDef.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a valid email` })
        }
        if (fieldDef.regex) {
          const pat = fieldDef.regex
          if (typeof pat !== 'string' || pat.length > 500) {
            errors.push({ field: fieldName, message: `"${fieldName}" has an invalid validation rule` })
            break
          }
          try {
            const re = new RegExp(pat)
            if (!re.test(value)) {
              errors.push({ field: fieldName, message: `"${fieldName}" format is invalid` })
            }
          } catch {
            errors.push({ field: fieldName, message: `"${fieldName}" has an invalid validation pattern` })
          }
        }
        break
      }

      case 'number_int':
      case 'number_big': {
        const num = Number(value)
        if (!Number.isInteger(num)) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be an integer` })
          break
        }
        if (fieldDef.min !== undefined && num < fieldDef.min) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at least ${fieldDef.min}` })
        }
        if (fieldDef.max !== undefined && num > fieldDef.max) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at most ${fieldDef.max}` })
        }
        break
      }

      case 'number_float': {
        const num = Number(value)
        if (isNaN(num)) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a number` })
          break
        }
        if (fieldDef.min !== undefined && num < fieldDef.min) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at least ${fieldDef.min}` })
        }
        if (fieldDef.max !== undefined && num > fieldDef.max) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be at most ${fieldDef.max}` })
        }
        break
      }

      case 'boolean': {
        if (typeof value !== 'boolean') {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a boolean` })
        }
        break
      }

      case 'enumeration': {
        if (!fieldDef.enumValues?.includes(String(value))) {
          errors.push({
            field: fieldName,
            message: `"${fieldName}" must be one of: ${fieldDef.enumValues?.join(', ')}`,
          })
        }
        break
      }

      case 'date':
      case 'time':
      case 'datetime': {
        if (typeof value === 'string' && isNaN(Date.parse(value))) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a valid date` })
        }
        break
      }

      case 'json': {
        if (typeof value === 'string') {
          try {
            JSON.parse(value)
          } catch {
            errors.push({ field: fieldName, message: `"${fieldName}" must be valid JSON` })
          }
        }
        break
      }

      // media, relation, component, dynamiczone — lightweight type check
      case 'media': {
        if (typeof value !== 'string' && !Array.isArray(value)) {
          errors.push({ field: fieldName, message: `"${fieldName}" must be a media ID or array of IDs` })
        }
        break
      }
    }
  }

  return errors
}
