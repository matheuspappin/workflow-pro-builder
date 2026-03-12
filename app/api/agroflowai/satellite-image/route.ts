import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import logger from '@/lib/logger'
import { checkStudioAccess } from '@/lib/auth'

const SATELLITE_PROCESSOR_URL = process.env.SATELLITE_PROCESSOR_URL || 'http://localhost:8001'

export async function POST(request: NextRequest) {
  const startMs = Date.now()

  try {
    const body = await request.json()
    const { propertyId, studioId, daysBack = 90 } = body

    if (!propertyId || !studioId) {
      return NextResponse.json({ error: 'propertyId e studioId são obrigatórios' }, { status: 400 })
    }

    const accessPost = await checkStudioAccess(request, studioId)
    if (!accessPost.authorized) return accessPost.response

    // 1. Busca a propriedade no Supabase
    const { data: prop, error: propError } = await supabaseAdmin
      .from('agroflowai_properties')
      .select('id, name, coordinates, polygon_geojson, city, state, total_area_ha')
      .eq('id', propertyId)
      .eq('studio_id', studioId)
      .single()

    if (propError || !prop) {
      return NextResponse.json({ error: 'Propriedade não encontrada' }, { status: 404 })
    }

    // Usa polygon_geojson se disponível, senão usa coordinates
    const coordinatesStr = prop.polygon_geojson
      ? JSON.stringify(prop.polygon_geojson)
      : prop.coordinates

    if (!coordinatesStr) {
      return NextResponse.json({ error: 'Propriedade sem coordenadas cadastradas' }, { status: 422 })
    }

    // 2. Verifica se há cache recente (< 24h) para não reprocessar desnecessariamente
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: cached } = await supabaseAdmin
      .from('agroflowai_compliance_logs')
      .select('*')
      .eq('property_id', propertyId)
      .gt('processed_at', oneDayAgo)
      .order('processed_at', { ascending: false })
      .limit(1)
      .single()

    if (cached && cached.ndvi_mean !== null) {
      return NextResponse.json({
        ...cached,
        property_name: prop.name,
        cached: true,
      })
    }

    // 3. Chama o Python processor
    const processorRes = await fetch(`${SATELLITE_PROCESSOR_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: coordinatesStr,
        property_id: propertyId,
        property_name: prop.name,
        days_back: daysBack,
      }),
      signal: AbortSignal.timeout(120_000), // 2 min timeout
    })

    if (!processorRes.ok) {
      const err = await processorRes.text()
      return NextResponse.json({ error: `Processor error: ${err}` }, { status: 502 })
    }

    const result = await processorRes.json()

    const processingMs = Date.now() - startMs

    // Determina nível de alerta
    const ndvi = result.ndvi_mean
    let alertLevel: 'critical' | 'warning' | 'ok' | null = null
    if (ndvi !== null && ndvi !== undefined) {
      alertLevel = ndvi < 0.3 ? 'critical' : ndvi < 0.5 ? 'warning' : 'ok'
    }

    // 4. Persiste no compliance_logs
    const { data: log, error: logError } = await supabaseAdmin
      .from('agroflowai_compliance_logs')
      .insert({
        studio_id: studioId,
        property_id: propertyId,
        ndvi_mean: ndvi ?? null,
        ndvi_history: result.ndvi_history ?? [],
        image_b64: result.image_b64 ?? null,
        collection: result.collection ?? null,
        items_found: result.items_found ?? 0,
        alert_level: alertLevel,
        alert_message: result.alert ?? null,
        days_back: daysBack,
        processing_ms: processingMs,
        error: result.error ?? null,
      })
      .select()
      .single()

    if (logError) {
      logger.error('compliance_logs insert error:', logError)
    }

    // 5. Se NDVI crítico, cria alerta na tabela agroflowai_alerts
    if (alertLevel === 'critical' || alertLevel === 'warning') {
      await supabaseAdmin
        .from('agroflowai_alerts')
        .upsert({
          studio_id: studioId,
          ref_id: propertyId,
          ref_type: 'property',
          alert_type: 'ndvi_alert',
          severity: alertLevel,
          title: alertLevel === 'critical' ? 'NDVI Crítico — Risco de Desmatamento' : 'NDVI Baixo — Atenção',
          description: result.alert || `NDVI ${ndvi?.toFixed(3)} detectado em ${prop.name}`,
          dismissed: false,
        }, { onConflict: 'ref_id,alert_type' })
    }

    // 6. Atualiza satellite_source na propriedade
    if (result.collection) {
      await supabaseAdmin
        .from('agroflowai_properties')
        .update({ satellite_source: result.collection })
        .eq('id', propertyId)
    }

    return NextResponse.json({
      id: log?.id,
      property_id: propertyId,
      property_name: prop.name,
      ndvi_mean: ndvi,
      ndvi_history: result.ndvi_history ?? [],
      image_b64: result.image_b64,
      collection: result.collection,
      items_found: result.items_found,
      alert_level: alertLevel,
      alert_message: result.alert ?? null,
      processing_ms: processingMs,
      cached: false,
    })
  } catch (error: any) {
    const isTimeout = error.name === 'TimeoutError'
    return NextResponse.json(
      { error: isTimeout ? 'Timeout: processamento demorou mais de 2 minutos' : error.message },
      { status: isTimeout ? 504 : 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const studioId = searchParams.get('studioId')
    const limit = parseInt(searchParams.get('limit') || '12')

    if (!propertyId || !studioId) {
      return NextResponse.json({ error: 'propertyId e studioId são obrigatórios' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data, error } = await supabaseAdmin
      .from('agroflowai_compliance_logs')
      .select('id, processed_at, ndvi_mean, ndvi_history, alert_level, alert_message, collection, items_found, processing_ms')
      .eq('property_id', propertyId)
      .eq('studio_id', studioId)
      .order('processed_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ logs: data || [], total: data?.length ?? 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
