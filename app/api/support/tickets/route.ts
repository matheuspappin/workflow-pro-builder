import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logger'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createTicketSchema = z.object({
  subject: z.string().min(1, "Assunto é obrigatório"),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
  message: z.string().min(1, "Mensagem é obrigatória"), // Initial message
})

// REMOVED local createClient

export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:user_id(email, user_metadata),
        studio:studio_id(name),
        messages:support_messages(message, created_at, user_id)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (priority) {
      query = query.eq('priority', priority)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,id.eq.${search}`)
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error fetching tickets:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return new NextResponse(`Error fetching tickets: ${error.message}`, { status: 500 })
    }

    const tickets = data.map(ticket => ({
      ...ticket,
      lastMessage: ticket.messages && ticket.messages.length > 0 
        ? ticket.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].message 
        : ''
    }))

    return NextResponse.json(tickets)
  } catch (error) {
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const body = createTicketSchema.parse(json)

    const { data: userData } = await supabase
      .from('users_internal')
      .select('studio_id')
      .eq('id', session.user.id)
      .single()

    const studioId = userData?.studio_id || null

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: session.user.id,
        studio_id: studioId,
        subject: body.subject,
        category: body.category || 'general',
        priority: body.priority,
        status: 'open'
      })
      .select()
      .single()

    if (ticketError) {
      logger.error('Error creating ticket:', ticketError)
      return new NextResponse('Error creating ticket', { status: 500 })
    }

    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        user_id: session.user.id,
        message: body.message,
        is_internal: false
      })

    if (messageError) {
      logger.error('Error creating message:', messageError)
      return new NextResponse('Error creating message', { status: 500 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
