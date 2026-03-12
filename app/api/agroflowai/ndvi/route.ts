import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { checkStudioAccess } from '@/lib/auth'

/**
 * Brazil Data Cube — WTSS (Web Time Series Service)
 * API pública e gratuita do INPE, sem necessidade de autenticação.
 * Docs: https://brazildatacube.dpi.inpe.br/
 *
 * Coberturas usadas:
 *  - S2-16D-2: Sentinel-2 compostos 16 dias (2017–presente, resolução 10m)
 *  - MOD13Q1-6: MODIS 16 dias como fallback (2000–presente, resolução 250m)
 */
const BDC_BASE = 'https://brazildatacube.dpi.inpe.br/wtss'
const S2_COVERAGE = 'S2-16D-2'
const MODIS_COVERAGE = 'MOD13Q1-6'

// Sentinel Hub como opcional para quem quiser mais granularidade
const SENTINEL_HUB_CLIENT_ID = process.env.SENTINEL_HUB_CLIENT_ID || ''
const SENTINEL_HUB_CLIENT_SECRET = process.env.SENTINEL_HUB_CLIENT_SECRET || ''

interface NDVIResult {
  property_id: string
  property_name: string
  ndvi_current: number | null
  ndvi_previous: number | null
  ndvi_change_pct: number | null
  ndvi_history: Array<{ date: string; value: number }>
  area_ha: number
  city: string
  state: string
  last_update: string
  source: 'bdc_sentinel2' | 'bdc_modis' | 'sentinel_hub' | 'unavailable'
  lat: number | null
  lon: number | null
}

let sentinelToken: { value: string; expires: number } | null = null

async function getSentinelToken(): Promise<string | null> {
  if (!SENTINEL_HUB_CLIENT_ID || !SENTINEL_HUB_CLIENT_SECRET) return null
  if (sentinelToken && Date.now() < sentinelToken.expires - 60_000) return sentinelToken.value

  try {
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: SENTINEL_HUB_CLIENT_ID,
      client_secret: SENTINEL_HUB_CLIENT_SECRET,
    })
    const res = await fetch(
      'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }
    )
    if (!res.ok) return null
    const json = await res.json()
    sentinelToken = { value: json.access_token, expires: Date.now() + json.expires_in * 1000 }
    return sentinelToken.value
  } catch {
    return null
  }
}

/**
 * Busca série temporal de NDVI via Brazil Data Cube WTSS
 * Endpoint: GET /time_series?coverage=S2-16D-2&attributes=NDVI&latitude=X&longitude=Y&start_date=...&end_date=...
 */
async function fetchBDCTimeSeries(
  lat: number,
  lon: number,
  coverage: string,
  attribute: string,
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; value: number }> | null> {
  try {
    const params = new URLSearchParams({
      coverage,
      attributes: attribute,
      latitude: lat.toString(),
      longitude: lon.toString(),
      start_date: startDate,
      end_date: endDate,
    })

    const url = `${BDC_BASE}/time_series?${params.toString()}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) return null

    const json = await res.json()
    const result = json.result

    if (!result || !result.timeline || !result.attributes) return null

    const timeline: string[] = result.timeline
    const values: number[] = result.attributes?.[attribute]?.values ?? []

    if (!timeline.length || !values.length) return null

    const series: Array<{ date: string; value: number }> = []
    for (let i = 0; i < timeline.length; i++) {
      const v = values[i]
      if (v !== null && v !== undefined && !isNaN(v) && v > 0) {
        // BDC retorna NDVI escalado (0–10000) para S2, normaliza para 0–1
        const normalized = coverage === S2_COVERAGE ? parseFloat((v / 10000).toFixed(4)) : parseFloat(v.toFixed(4))
        if (normalized > 0 && normalized <= 1) {
          series.push({ date: timeline[i], value: normalized })
        }
      }
    }

    return series.length > 0 ? series : null
  } catch {
    return null
  }
}

/**
 * Calcula NDVI médio de um período da série temporal
 */
function avgNdvi(series: Array<{ date: string; value: number }>, from: Date, to: Date): number | null {
  const filtered = series.filter(s => {
    const d = new Date(s.date)
    return d >= from && d <= to
  })
  if (!filtered.length) return null
  const sum = filtered.reduce((acc, s) => acc + s.value, 0)
  return parseFloat((sum / filtered.length).toFixed(3))
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studioId = searchParams.get('studioId')

    if (!studioId) {
      return NextResponse.json({ error: 'studioId é obrigatório' }, { status: 400 })
    }

    const access = await checkStudioAccess(request, studioId)
    if (!access.authorized) return access.response

    const { data: properties, error } = await supabaseAdmin
      .from('agroflowai_properties')
      .select('id, name, total_area_ha, city, state, coordinates, updated_at')
      .eq('studio_id', studioId)
      .order('name', { ascending: true })

    if (error) throw error

    const now = new Date()
    const currentEnd = now.toISOString().split('T')[0]
    const currentStart = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0]
    const prevEnd = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0]
    const prevStart = new Date(now.getTime() - 120 * 86400000).toISOString().split('T')[0]
    const histStart = new Date(now.getTime() - 365 * 86400000).toISOString().split('T')[0]

    // Sentinel Hub como upgrade opcional
    const sentinelToken = await getSentinelToken()

    const results: NDVIResult[] = []

    for (const prop of properties || []) {
      // Sem coordenadas → sem NDVI real
      if (!prop.coordinates) {
        results.push({
          property_id: prop.id,
          property_name: prop.name,
          ndvi_current: null,
          ndvi_previous: null,
          ndvi_change_pct: null,
          ndvi_history: [],
          area_ha: prop.total_area_ha ? parseFloat(prop.total_area_ha) : 0,
          city: prop.city || '',
          state: prop.state || '',
          last_update: new Date(prop.updated_at).toLocaleDateString('pt-BR'),
          source: 'unavailable',
          lat: null,
          lon: null,
        })
        continue
      }

      const [latStr, lonStr] = prop.coordinates.split(',').map((s: string) => s.trim())
      const lat = parseFloat(latStr)
      const lon = parseFloat(lonStr)

      if (isNaN(lat) || isNaN(lon)) {
        results.push({
          property_id: prop.id,
          property_name: prop.name,
          ndvi_current: null,
          ndvi_previous: null,
          ndvi_change_pct: null,
          ndvi_history: [],
          area_ha: prop.total_area_ha ? parseFloat(prop.total_area_ha) : 0,
          city: prop.city || '',
          state: prop.state || '',
          last_update: new Date(prop.updated_at).toLocaleDateString('pt-BR'),
          source: 'unavailable',
          lat: null,
          lon: null,
        })
        continue
      }

      let source: NDVIResult['source'] = 'unavailable'
      let ndviCurrent: number | null = null
      let ndviPrevious: number | null = null
      let history: Array<{ date: string; value: number }> = []

      // 1. Tenta Sentinel-2 via Brazil Data Cube (gratuito)
      const s2Series = await fetchBDCTimeSeries(lat, lon, S2_COVERAGE, 'NDVI', histStart, currentEnd)

      if (s2Series && s2Series.length > 0) {
        source = 'bdc_sentinel2'
        history = s2Series

        const currentFrom = new Date(now.getTime() - 60 * 86400000)
        const prevFrom = new Date(now.getTime() - 120 * 86400000)
        const prevTo = new Date(now.getTime() - 60 * 86400000)

        ndviCurrent = avgNdvi(s2Series, currentFrom, now)
        ndviPrevious = avgNdvi(s2Series, prevFrom, prevTo)
      } else {
        // 2. Fallback: MODIS via Brazil Data Cube (resolução menor mas mais cobertura)
        const modisAttr = 'NDVI'
        const modisSeries = await fetchBDCTimeSeries(lat, lon, MODIS_COVERAGE, modisAttr, histStart, currentEnd)

        if (modisSeries && modisSeries.length > 0) {
          source = 'bdc_modis'
          history = modisSeries

          const currentFrom = new Date(now.getTime() - 60 * 86400000)
          const prevFrom = new Date(now.getTime() - 120 * 86400000)
          const prevTo = new Date(now.getTime() - 60 * 86400000)

          ndviCurrent = avgNdvi(modisSeries, currentFrom, now)
          ndviPrevious = avgNdvi(modisSeries, prevFrom, prevTo)
        }
      }

      // Calcula variação percentual
      const changePct =
        ndviCurrent !== null && ndviPrevious !== null && ndviPrevious > 0
          ? parseFloat((((ndviCurrent - ndviPrevious) / ndviPrevious) * 100).toFixed(1))
          : null

      const lastHistDate = history.length > 0 ? history[history.length - 1].date : null

      results.push({
        property_id: prop.id,
        property_name: prop.name,
        ndvi_current: ndviCurrent,
        ndvi_previous: ndviPrevious,
        ndvi_change_pct: changePct,
        ndvi_history: history.slice(-12), // últimas 12 observações (~6 meses)
        area_ha: prop.total_area_ha ? parseFloat(prop.total_area_ha) : 0,
        city: prop.city || '',
        state: prop.state || '',
        last_update: lastHistDate
          ? new Date(lastHistDate).toLocaleDateString('pt-BR')
          : new Date().toLocaleDateString('pt-BR'),
        source,
        lat,
        lon,
      })
    }

    return NextResponse.json({
      properties: results,
      bdc_available: results.some(r => r.source === 'bdc_sentinel2' || r.source === 'bdc_modis'),
      sentinel_hub_available: !!sentinelToken,
      total: results.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
