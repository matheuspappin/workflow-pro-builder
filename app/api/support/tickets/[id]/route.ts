import { createClient } from '@/lib/supabase/server'
import logger from '@/lib/logger'
import { NextResponse } from 'next/server'

// REMOVED local createClient

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:user_id(email, user_metadata),
        studio:studio_id(name),
        messages:support_messages(
          id, message, created_at, user_id, is_internal, attachments,
          user:user_id(email, user_metadata)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      return new NextResponse('Not Found', { status: 404 })
    }

    // Sort messages
    ticket.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

    return NextResponse.json(ticket)
  } catch (error) {
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await req.json()
    const { status, priority, assigned_to } = json

    const updateData: any = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to

    const { data, error } = await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('Error updating ticket:', error)
      return new NextResponse('Error updating ticket', { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    logger.error('Internal Error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
