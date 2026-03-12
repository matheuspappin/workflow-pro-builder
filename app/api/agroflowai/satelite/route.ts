import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

const NASA_FIRMS_KEY = process.env.NASA_FIRMS_API_KEY || ''
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 min

interface SateliteAlert {
  id: string
  property: string
  type: 'deforestation' | 'fire' | 'ndvi_low' | 'car_issue'
  severity: 'critical' | 'warning' | 'info'
  description: string
  area_ha?: number
  date: string
  source: string
  lat?: number
  lon?: number
}

// In-memory cache para evitar rate limiting
const cache: { data: SateliteAlert[]; ts: number } | null = null
let cacheStore: { data: SateliteAlert[]; ts: number } | null = null

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR')
}

/**
 * NASA FIRMS — Focos de calor via API pública
 * https://firms.modaps.eosdis.nasa.gov/api/
 * MAP_KEY gratuita em: https://firms.modaps.eosdis.nasa.gov/api/area/
 */
async function fetchFirmsHotspots(bbox: string): Promise<SateliteAlert[]> {
  if (!NASA_FIRMS_KEY) return []

  try {
    // bbox: lon_min,lat_min,lon_max,lat_max  (Brasil: -74,-34,-28,6)
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/${bbox}/1`
    const res = await fetch(url, { next: { revalidate: 1800 } })
    if (!res.ok) return []

    const text = await res.text()
    const lines = text.trim().split('\n').slice(1) // skip header

    return lines.slice(0, 20).map((line, i): SateliteAlert => {
      const cols = line.split(',')
      const lat = parseFloat(cols[0])
      const lon = parseFloat(cols[1])
      const brightness = parseFloat(cols[2] || '0')
      const acqDate = cols[5] || ''
      const severity: 'critical' | 'warning' = brightness > 380 ? 'critical' : 'warning'

      return {
        id: `firms-${i}-${acqDate}`,
        property: 'Área monitorada',
        type: 'fire' as const,
        severity,
        description: `Foco de calor detectado — brilho ${brightness}K (VIIRS SNPP). Coordenadas: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        date: acqDate || formatDate(new Date()),
        source: 'NASA FIRMS VIIRS',
        lat,
        lon,
      }
    }).filter(a => typeof a.lat === 'number' && !isNaN(a.lat))
  } catch {
    return []
  }
}

/**
 * INPE TerraBrasilis — Alertas DETER (desmatamento)
 * https://terrabrasilis.dpi.inpe.br/geoserver/deter-amz/wfs
 */
async function fetchDeterAlerts(): Promise<SateliteAlert[]> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeName: 'deter-amz:deter_public',
      outputFormat: 'application/json',
      count: '20',
      CQL_FILTER: `view_date >= '${dateStr}'`,
      propertyName: 'gid,classname,areamunkm,view_date,state',
    })

    const url = `https://terrabrasilis.dpi.inpe.br/geoserver/deter-amz/wfs?${params.toString()}`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) return []

    const json = await res.json()
    const features = json.features || []

    return features.slice(0, 15).map((f: any) => {
      const p = f.properties || {}
      const areaHa = p.areamunkm ? parseFloat((p.areamunkm * 100).toFixed(1)) : undefined
      const severity: 'critical' | 'warning' = areaHa && areaHa > 50 ? 'critical' : 'warning'
      const dateStr = p.view_date ? new Date(p.view_date).toLocaleDateString('pt-BR') : formatDate(new Date())

      return {
        id: `deter-${p.gid}`,
        property: p.state ? `Estado: ${p.state}` : 'Amazônia Legal',
        type: 'deforestation' as const,
        severity,
        description: `${p.classname || 'Alerta DETER'}: ${areaHa ? `${areaHa} ha` : 'área não informada'} de supressão detectada`,
        area_ha: areaHa,
        date: dateStr,
        source: 'INPE DETER',
      }
    })
  } catch {
    return []
  }
}

/**
 * Alertas CAR das propriedades cadastradas no Supabase
 */
async function fetchCarAlerts(studioId: string): Promise<SateliteAlert[]> {
  try {
    const { data } = await supabaseAdmin
      .from('agroflowai_properties')
      .select('id, name, car_status, city, state, total_area_ha')
      .eq('studio_id', studioId)
      .in('car_status', ['pendente', 'irregular', 'vencido'])

    return (data || []).map((p: any) => ({
      id: `car-sat-${p.id}`,
      property: p.name,
      type: 'car_issue' as const,
      severity: p.car_status === 'irregular' ? 'critical' : ('warning' as 'critical' | 'warning'),
      description: `CAR ${p.car_status} — ${p.city ? `${p.city}, ${p.state}` : p.state || ''} · ${p.total_area_ha ? `${p.total_area_ha} ha` : ''}`,
      date: formatDate(new Date()),
      source: 'SICAR',
      area_ha: p.total_area_ha ? parseFloat(p.total_area_ha) : undefined,
    }))
  } catch {
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')
    const forceRefresh = searchParams.get('refresh') === '1'

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    // Serve do cache se ainda válido
    if (!forceRefresh && cacheStore && Date.now() - cacheStore.ts < CACHE_TTL_MS) {
      return NextResponse.json({ alerts: cacheStore.data, cached: true, sources: getActiveSources() })
    }

    // Busca paralela das 3 fontes
    const [firmsAlerts, deterAlerts, carAlerts] = await Promise.allSettled([
      fetchFirmsHotspots('-74,-34,-28,6'),
      fetchDeterAlerts(),
      fetchCarAlerts(studioId),
    ])

    const allAlerts: SateliteAlert[] = [
      ...(firmsAlerts.status === 'fulfilled' ? firmsAlerts.value : []),
      ...(deterAlerts.status === 'fulfilled' ? deterAlerts.value : []),
      ...(carAlerts.status === 'fulfilled' ? carAlerts.value : []),
    ]

    // Ordena: críticos primeiro
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 }
    allAlerts.sort((a, b) => order[a.severity] - order[b.severity])

    // Atualiza cache
    cacheStore = { data: allAlerts, ts: Date.now() }

    const sources = {
      firms: firmsAlerts.status === 'fulfilled' && firmsAlerts.value.length > 0,
      deter: deterAlerts.status === 'fulfilled' && deterAlerts.value.length > 0,
      car: carAlerts.status === 'fulfilled' && carAlerts.value.length > 0,
      firmsKeyConfigured: !!NASA_FIRMS_KEY,
    }

    return NextResponse.json({
      alerts: allAlerts,
      cached: false,
      sources,
      total: allAlerts.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getActiveSources() {
  return {
    firms: false,
    deter: false,
    car: false,
    firmsKeyConfigured: !!NASA_FIRMS_KEY,
  }
}
