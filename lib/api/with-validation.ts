import { NextRequest, NextResponse } from 'next/server'
import { z, ZodSchema } from 'zod'

type RouteHandler<T> = (
  request: NextRequest,
  body: T,
  context?: { params: Record<string, string> }
) => Promise<NextResponse>

/**
 * HOF que valida o corpo da requisição contra um schema Zod antes de executar o handler.
 * Uso:
 *   export const POST = withValidation(MySchema, async (req, body) => { ... })
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: RouteHandler<T>
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    let raw: unknown
    try {
      raw = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido ou não é JSON.' },
        { status: 400 }
      )
    }

    const result = schema.safeParse(raw)
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Dados inválidos.',
          details: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    return handler(request, result.data, context)
  }
}

/**
 * HOF para validar query params (GET requests).
 * Uso:
 *   export const GET = withQueryValidation(MySchema, async (req, params) => { ... })
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: RouteHandler<T>
) {
  return async (
    request: NextRequest,
    context?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const result = schema.safeParse(searchParams)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Parâmetros de consulta inválidos.',
          details: result.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    return handler(request, result.data, context)
  }
}

// Schemas comuns reutilizáveis
export const StudioIdSchema = z.object({
  studioId: z.string().uuid('studioId deve ser um UUID válido'),
})

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
