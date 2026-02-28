
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import logger from '@/lib/logger'

const messageSchema = z.object({
  message: z.string().min(1, "Mensagem é obrigatória"),
  is_internal: z.boolean().optional().default(false),
  attachments: z.array(z.string()).optional()
})

// REMOVED local createClient

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: messages, error } = await supabase
      .from('support_messages')
      .select('*, user:user_id(email, user_metadata)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      logger.error('Error fetching messages:', error)
      return new NextResponse('Error fetching messages', { status: 500 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = messageSchema.parse(json)

    const { data, error } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: id,
        user_id: session.user.id,
        message: body.message,
        is_internal: body.is_internal,
        attachments: body.attachments
      })
      .select()
      .single()

    if (error) {
      logger.error('Error adding message:', error)
      return new NextResponse('Error adding message', { status: 500 })
    }

    // Also update ticket updated_at
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
