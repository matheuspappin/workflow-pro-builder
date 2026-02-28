import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    // Buscar transações manuais do AgroFlowAI (financial_notes)
    let notes: any[] = []
    try {
      const { data } = await supabaseAdmin
        .from('financial_notes')
        .select('id, amount, status, source_type, source_id, customer_data, invoice_number, created_at')
        .eq('studio_id', studioId)
        .order('created_at', { ascending: false })
      notes = data || []
    } catch { /* tabela pode não existir */ }

    // Buscar OS finalizadas (laudos emitidos + OS de campo concluídas)
    let osFinished: any[] = []
    try {
      const { data } = await supabaseAdmin
        .from('service_orders')
        .select('id, title, total_amount, finished_at, project_type, customer:students(name)')
        .eq('studio_id', studioId)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false })
      osFinished = data || []
    } catch { /* */ }

    const lancamentos: Array<{
      id: string
      descricao: string
      cliente: string
      valor: number
      tipo: 'receita' | 'despesa'
      status: string
      categoria: string
      vencimento: string
      pagamento: string | null
    }> = []

    // Notas fiscais / financeiro manual
    for (const n of notes) {
      const custData = n.customer_data as { name?: string; tipo?: string; categoria?: string } || {}
      const cust = custData.name || 'Cliente'
      let status = 'pendente'
      if (n.status === 'emitted') status = 'recebido'
      else if (n.status === 'cancelled') continue
      else if (n.status === 'error') status = 'vencido'

      // Detect tipo from customer_data metadata
      const tipo: 'receita' | 'despesa' = custData.tipo === 'despesa' ? 'despesa' : 'receita'

      const categoria =
        custData.categoria ? custData.categoria :
        n.source_type === 'service_order' ? 'Serviço / OS' :
        n.source_type === 'erp_order' ? 'Venda' : 'Manual'

      lancamentos.push({
        id: n.id,
        descricao: n.invoice_number
          ? `NF #${n.invoice_number} — ${cust}`
          : tipo === 'despesa' ? `Despesa — ${cust}` : `Receita — ${cust}`,
        cliente: cust,
        valor: Number(n.amount),
        tipo,
        categoria,
        status,
        vencimento: new Date(n.created_at).toLocaleDateString('pt-BR'),
        pagamento: status === 'recebido' ? new Date(n.created_at).toLocaleDateString('pt-BR') : null,
      })
    }

    // OS/Laudos finalizados como receitas pendentes de faturamento
    const notedOsIds = new Set(
      notes.filter(n => n.source_type === 'service_order' && n.source_id).map(n => n.source_id)
    )

    for (const os of osFinished) {
      if (notedOsIds.has(os.id)) continue
      const cust = (os.customer as { name?: string })?.name || 'Cliente'
      const valor = Number(os.total_amount || 0)
      if (valor <= 0) continue

      const isLaudo = os.project_type === 'laudo'
      lancamentos.push({
        id: `os-${os.id}`,
        descricao: isLaudo ? `Laudo Técnico — ${cust}` : `${os.title || 'OS Ambiental'} — ${cust}`,
        cliente: cust,
        valor,
        tipo: 'receita',
        categoria: isLaudo ? 'Laudo Técnico' : 'OS de Campo',
        status: 'pendente',
        vencimento: os.finished_at ? new Date(os.finished_at).toLocaleDateString('pt-BR') : '—',
        pagamento: null,
      })
    }

    // Ordenar por data decrescente
    lancamentos.sort((a, b) => {
      const parseDate = (s: string) => {
        if (!s || s === '—') return '9999-99-99'
        const p = s.split('/')
        if (p.length !== 3) return '9999-99-99'
        return `${p[2]}-${p[1]}-${p[0]}`
      }
      return parseDate(b.vencimento).localeCompare(parseDate(a.vencimento))
    })

    // KPIs agregados
    const receitaTotal = lancamentos.filter(l => l.tipo === 'receita').reduce((acc, l) => acc + l.valor, 0)
    const receitaRecebida = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'recebido').reduce((acc, l) => acc + l.valor, 0)
    const receitaPendente = lancamentos.filter(l => l.tipo === 'receita' && l.status === 'pendente').reduce((acc, l) => acc + l.valor, 0)
    const despesasTotal = lancamentos.filter(l => l.tipo === 'despesa').reduce((acc, l) => acc + l.valor, 0)
    const lucro = receitaRecebida - despesasTotal

    return NextResponse.json({
      lancamentos,
      kpis: {
        receita_total: receitaTotal,
        receita_recebida: receitaRecebida,
        receita_pendente: receitaPendente,
        despesas_total: despesasTotal,
        lucro,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, studioId, studio_id, status } = body

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    // Só atualizamos lançamentos manuais (financial_notes)
    const statusMap: Record<string, string> = { recebido: 'emitted', pendente: 'pending', vencido: 'error' }
    const dbStatus = statusMap[status] || status

    const { data, error } = await supabaseAdmin
      .from('financial_notes')
      .update({ status: dbStatus })
      .eq('id', id)
      .eq('studio_id', sid)
      .select('id, status')
      .single()

    if (error) throw error

    return NextResponse.json({ id: data.id, status: status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const studioId = searchParams.get('studioId')

    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })
    if (!studioId) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })

    const { error } = await supabaseAdmin
      .from('financial_notes')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('studio_id', studioId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studioId, studio_id, descricao, cliente, valor, tipo, categoria, vencimento } = body

    const sid = studioId || studio_id
    if (!sid) return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    if (!descricao || !valor) return NextResponse.json({ error: 'descricao e valor são obrigatórios' }, { status: 400 })

    const { data, error } = await supabaseAdmin
      .from('financial_notes')
      .insert({
        studio_id: sid,
        amount: Number(valor),
        status: 'pending',
        source_type: 'manual',
        customer_data: {
          name: cliente || 'Sem cliente',
          categoria: categoria || (tipo === 'despesa' ? 'Despesa Operacional' : 'Manual'),
          tipo: tipo || 'receita',
        },
        invoice_number: null,
        created_at: vencimento ? new Date(vencimento).toISOString() : new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      id: data.id,
      descricao,
      cliente: cliente || '',
      valor: Number(valor),
      tipo: tipo || 'receita',
      categoria: categoria || 'Manual',
      status: 'pendente',
      vencimento: vencimento || new Date().toLocaleDateString('pt-BR'),
      pagamento: null,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
