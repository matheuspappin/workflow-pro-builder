"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface PropertyMarker {
  id: string
  name: string
  lat: number
  lon: number
  ndvi?: number
  area_ha?: number
  city?: string
  state?: string
  car_status?: string
  polygon_geojson?: any  // GeoJSON Feature ou Geometry
  satellite_image_b64?: string // imagem RGB em base64
}

interface HotspotMarker {
  id: string
  lat: number
  lon: number
  description: string
  source: string
  date: string
}

interface MapaSateliteProps {
  properties?: PropertyMarker[]
  hotspots?: HotspotMarker[]
  className?: string
}

// Camadas disponíveis
const LAYERS = [
  { id: "osm", label: "OpenStreetMap", url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  { id: "satellite", label: "Satélite (ESRI)", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "© Esri, Maxar, Earthstar Geographics" },
  { id: "topo", label: "Topográfico", url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", attribution: "© OpenTopoMap" },
] as const

// WMS INPE TerraBrasilis — Alertas DETER
const DETER_WMS = "https://terrabrasilis.dpi.inpe.br/geoserver/deter-amz/wms"

export default function MapaSatelite({ properties = [], hotspots = [], className }: MapaSateliteProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<any>(null)
  const [activeLayer, setActiveLayer] = useState<"osm" | "satellite" | "topo">("satellite")
  const [showDeter, setShowDeter] = useState(true)
  const [showFirms, setShowFirms] = useState(true)
  const [showProperties, setShowProperties] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !mapRef.current) return

    // Leaflet é client-only — importação dinâmica
    let L: any
    let map: any
    let tileLayer: any
    let deterLayer: any
    let firmsLayer: any
    const markers: any[] = []

    const initMap = async () => {
      try {
        L = (await import("leaflet")).default
        // @ts-expect-error leaflet CSS has no type declarations
        await import("leaflet/dist/leaflet.css")

        // Fix ícones default do Leaflet no Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })

        if (leafletMapRef.current) return // Já inicializado

        // Centro padrão: Brasil
        map = L.map(mapRef.current!, {
          center: [-14, -52],
          zoom: 5,
          zoomControl: true,
        })

        leafletMapRef.current = map

        // Tile layer base
        const layerConfig = LAYERS.find(l => l.id === activeLayer) || LAYERS[1]
        tileLayer = L.tileLayer(layerConfig.url, {
          attribution: layerConfig.attribution,
          maxZoom: 19,
        }).addTo(map)

        // WMS INPE DETER
        deterLayer = L.tileLayer.wms(DETER_WMS, {
          layers: "deter-amz:deter_public",
          format: "image/png",
          transparent: true,
          opacity: 0.6,
          attribution: "INPE DETER",
        })
        if (showDeter) deterLayer.addTo(map)

        // NASA FIRMS WMS (focos de calor)
        firmsLayer = L.tileLayer.wms("https://firms.modaps.eosdis.nasa.gov/mapserver/wms/South_America/", {
          layers: "fires24",
          format: "image/png",
          transparent: true,
          opacity: 0.7,
          attribution: "NASA FIRMS",
        })
        if (showFirms) firmsLayer.addTo(map)

        // Marcadores e polígonos de propriedades
        if (showProperties) {
          const allBounds: [number, number][] = []

          for (const prop of properties) {
            const ndviCol = !prop.ndvi ? "#94a3b8"
              : prop.ndvi >= 0.7 ? "#10b981"
              : prop.ndvi >= 0.5 ? "#f59e0b"
              : "#ef4444"

            const popupContent = `
              <div style="font-family: sans-serif; min-width: 220px;">
                <p style="font-weight: 800; font-size: 14px; margin: 0 0 6px 0; color: #1e293b;">${prop.name}</p>
                ${prop.city ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0;">📍 ${prop.city}, ${prop.state}</p>` : ""}
                ${prop.area_ha ? `<p style="font-size: 12px; color: #64748b; margin: 0 0 4px 0;">🌿 ${prop.area_ha.toLocaleString("pt-BR")} ha</p>` : ""}
                ${prop.ndvi !== undefined ? `<p style="font-size: 13px; font-weight: 700; color: ${ndviCol}; margin: 4px 0 0 0;">NDVI: ${prop.ndvi.toFixed(3)}</p>` : ""}
                ${prop.satellite_image_b64 ? `<img src="data:image/png;base64,${prop.satellite_image_b64}" style="width:100%;border-radius:6px;margin-top:8px;" alt="satélite"/>` : ""}
              </div>
            `

            // Se tem polígono GeoJSON, desenha o contorno
            if (prop.polygon_geojson) {
              try {
                const geoLayer = L.geoJSON(prop.polygon_geojson, {
                  style: {
                    color: ndviCol,
                    weight: 2,
                    fillColor: ndviCol,
                    fillOpacity: 0.15,
                  },
                }).bindPopup(popupContent).addTo(map)

                const polyBounds = geoLayer.getBounds()
                if (polyBounds.isValid()) {
                  allBounds.push(
                    [polyBounds.getSouth(), polyBounds.getWest()],
                    [polyBounds.getNorth(), polyBounds.getEast()],
                  )
                }
                markers.push(geoLayer)
              } catch {}
            }

            // Marcador de ponto sempre (mesmo quando há polígono)
            const icon = L.divIcon({
              className: "",
              html: `
                <div style="
                  background: ${ndviCol};
                  border: 2px solid white;
                  border-radius: 50%;
                  width: 14px;
                  height: 14px;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
                "></div>
              `,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })

            const m = L.marker([prop.lat, prop.lon], { icon })
              .bindPopup(L.popup({ className: "agroflow-popup" }).setContent(popupContent))
              .addTo(map)
            markers.push(m)
            allBounds.push([prop.lat, prop.lon])
          }

          // Centraliza no conjunto de propriedades
          if (allBounds.length > 0) {
            const bounds = L.latLngBounds(allBounds)
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
          }
        }

        // Marcadores de focos de calor
        for (const hs of hotspots) {
          const icon = L.divIcon({
            className: "",
            html: `
              <div style="
                background: #ef4444;
                border: 2px solid #fca5a5;
                border-radius: 2px;
                width: 10px;
                height: 10px;
                transform: rotate(45deg);
                box-shadow: 0 0 6px rgba(239,68,68,0.6);
              "></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })

          const popup = L.popup().setContent(`
            <div style="font-family: sans-serif; min-width: 180px;">
              <p style="font-weight: 800; font-size: 13px; color: #dc2626; margin: 0 0 4px 0;">🔥 Foco de Calor</p>
              <p style="font-size: 12px; color: #64748b; margin: 0 0 2px 0;">${hs.description}</p>
              <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">Fonte: ${hs.source} · ${hs.date}</p>
            </div>
          `)

          L.marker([hs.lat, hs.lon], { icon }).bindPopup(popup).addTo(map)
        }

      } catch (e) {
        console.error("Leaflet init error:", e)
      }
    }

    initMap()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Troca de camada base
  useEffect(() => {
    if (!leafletMapRef.current || !mounted) return

    const run = async () => {
      const L = (await import("leaflet")).default
      const map = leafletMapRef.current
      const layerConfig = LAYERS.find(l => l.id === activeLayer) || LAYERS[1]

      map.eachLayer((layer: any) => {
        if (layer._url && !layer.wmsParams) map.removeLayer(layer)
      })

      L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19,
      }).addTo(map)
    }
    run()
  }, [activeLayer, mounted])

  return (
    <div className={cn("flex flex-col gap-0 rounded-xl overflow-hidden border border-slate-700", className)}>
      {/* Toolbar */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Camada base</span>
        {LAYERS.map(l => (
          <button
            key={l.id}
            onClick={() => setActiveLayer(l.id as any)}
            className={cn(
              "text-xs font-bold px-3 py-1 rounded-lg transition-all",
              activeLayer === l.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
            )}
          >
            {l.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showDeter}
              onChange={e => {
                setShowDeter(e.target.checked)
                if (!leafletMapRef.current) return
                import("leaflet").then(({ default: L }) => {
                  leafletMapRef.current.eachLayer((layer: any) => {
                    if (layer.wmsParams?.layers?.includes("deter")) {
                      e.target.checked ? layer.addTo(leafletMapRef.current) : leafletMapRef.current.removeLayer(layer)
                    }
                  })
                  if (e.target.checked) {
                    L.tileLayer.wms(DETER_WMS, { layers: "deter-amz:deter_public", format: "image/png", transparent: true, opacity: 0.6, attribution: "INPE DETER" }).addTo(leafletMapRef.current)
                  }
                })
              }}
              className="accent-red-500"
            />
            <span className="text-red-400">DETER</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFirms}
              onChange={e => setShowFirms(e.target.checked)}
              className="accent-amber-500"
            />
            <span className="text-amber-400">Focos NASA</span>
          </label>

          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showProperties}
              onChange={e => setShowProperties(e.target.checked)}
              className="accent-emerald-500"
            />
            <span className="text-emerald-400">Propriedades</span>
          </label>
        </div>
      </div>

      {/* Legenda */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex items-center gap-4 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Legenda NDVI</span>
        {[
          { color: "#10b981", label: "≥ 0.70 Saudável" },
          { color: "#f59e0b", label: "0.50–0.69 Moderado" },
          { color: "#ef4444", label: "< 0.50 Degradado" },
          { color: "#94a3b8", label: "Sem dados" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ background: l.color }} />
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2.5 h-2.5 rotate-45 border border-red-400/50 bg-red-500" />
          <span className="text-[10px] text-slate-500">Foco de calor</span>
        </div>
      </div>

      {/* Mapa */}
      {!mounted ? (
        <div className="h-[520px] bg-slate-900 flex items-center justify-center">
          <div className="text-slate-500 text-sm animate-pulse">Carregando mapa...</div>
        </div>
      ) : (
        <div ref={mapRef} className="h-[520px] w-full z-0" />
      )}
    </div>
  )
}
