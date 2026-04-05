import { z } from 'zod'

// ─── Pagination ────────────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export type Pagination = z.infer<typeof PaginationSchema>

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    pagination: {
      page: number
      pageSize: number
      pageCount: number
      total: number
    }
  }
}

// ─── Standard API Response ─────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: {
    status: number
    name: string
    message: string
    details?: unknown
  }
}

// ─── Sort + Filter ─────────────────────────────────────────────────────────────
export const SortOrderSchema = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof SortOrderSchema>

export const ListQuerySchema = PaginationSchema.extend({
  sort: z.string().optional(),
  order: SortOrderSchema.optional().default('desc'),
  search: z.string().max(500).optional(),
  status: z.enum(['draft', 'published', 'all']).optional().default('all'),
  locale: z.string().length(2).optional(),
  populate: z.string().optional(),
})

export type ListQuery = z.infer<typeof ListQuerySchema>
