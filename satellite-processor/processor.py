"""
satellite_processor.py
Busca imagens do Brazil Data Cube (CBERS-4A / Sentinel-2) via STAC,
calcula NDVI médio e gera imagem RGB recortada da propriedade.
"""

import io
import os
import logging
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

import pystac_client
import stackstac
from PIL import Image
from shapely.geometry import shape, mapping, box
from pyproj import Transformer

logger = logging.getLogger(__name__)

BDC_STAC_URL = "https://brazildatacube.dpi.inpe.br/stac/"

# Coleções em ordem de preferência
COLLECTIONS = [
    "CBERS4A_WPM_L4_DN",     # CBERS-4A 8m resolução
    "S2-16D-2",               # Sentinel-2 10m compostos
    "LANDSAT-2-16D-1",        # Landsat fallback
]


def parse_geometry(coordinates_str: str) -> Optional[dict]:
    """
    Aceita:
      - "lat,lon"            → ponto, gera bbox de 0.05°
      - GeoJSON string       → polígono/feature completo
    """
    import json

    coordinates_str = coordinates_str.strip()

    # Tenta GeoJSON
    if coordinates_str.startswith("{"):
        try:
            geo = json.loads(coordinates_str)
            if geo.get("type") == "Feature":
                return geo["geometry"]
            return geo
        except Exception:
            pass

    # "lat,lon" → bbox quadrado de ~5.5km
    parts = coordinates_str.split(",")
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            delta = 0.05
            return {
                "type": "Polygon",
                "coordinates": [[
                    [lon - delta, lat - delta],
                    [lon + delta, lat - delta],
                    [lon + delta, lat + delta],
                    [lon - delta, lat + delta],
                    [lon - delta, lat - delta],
                ]],
            }
        except Exception:
            pass

    return None


def search_items(geometry: dict, days_back: int = 90) -> tuple[list, str]:
    """
    Busca itens STAC no Brazil Data Cube para o polígono/bbox dado.
    Retorna (items, collection_name) do primeiro resultado.
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days_back)
    date_range = f"{start_date.strftime('%Y-%m-%d')}/{end_date.strftime('%Y-%m-%d')}"

    shp = shape(geometry)
    bbox = list(shp.bounds)  # [minx, miny, maxx, maxy]

    try:
        catalog = pystac_client.Client.open(BDC_STAC_URL)
    except Exception as e:
        logger.warning(f"BDC STAC unavailable: {e}")
        return [], ""

    for collection in COLLECTIONS:
        try:
            search = catalog.search(
                collections=[collection],
                bbox=bbox,
                datetime=date_range,
                max_items=5,
                query={"eo:cloud_cover": {"lt": 30}},
            )
            items = list(search.items())
            if items:
                logger.info(f"Found {len(items)} items in {collection}")
                return items, collection
        except Exception as e:
            logger.warning(f"Search failed for {collection}: {e}")
            continue

    return [], ""


def compute_ndvi_and_image(
    coordinates: str,
    days_back: int = 90,
) -> dict:
    """
    Dado um string de coordenadas (lat,lon ou GeoJSON),
    retorna:
      - ndvi_mean: float ou None
      - ndvi_history: lista [{date, ndvi}]
      - image_b64: PNG RGB codificado em base64 (ou None)
      - collection: nome da coleção usada
      - items_found: int
    """
    import base64

    geometry = parse_geometry(coordinates)
    if not geometry:
        return {"error": "coordenadas inválidas", "ndvi_mean": None, "image_b64": None}

    items, collection = search_items(geometry, days_back)

    if not items:
        return {
            "ndvi_mean": None,
            "ndvi_history": [],
            "image_b64": None,
            "collection": None,
            "items_found": 0,
        }

    # Mapeamento de bandas por coleção
    band_map = {
        "CBERS4A_WPM_L4_DN": {"red": "B3", "nir": "B4", "green": "B2", "blue": "B1"},
        "S2-16D-2":          {"red": "B04", "nir": "B08", "green": "B03", "blue": "B02"},
        "LANDSAT-2-16D-1":   {"red": "B4", "nir": "B5", "green": "B3", "blue": "B2"},
    }
    bands_cfg = band_map.get(collection, band_map["S2-16D-2"])
    bands_needed = [bands_cfg["nir"], bands_cfg["red"], bands_cfg["green"], bands_cfg["blue"]]

    shp = shape(geometry)
    bbox = list(shp.bounds)

    try:
        stack = stackstac.stack(
            items,
            assets=bands_needed,
            bounds=bbox,
            epsg=4326,
            resolution=0.0001,  # ~11m
            dtype="float32",
        )
    except Exception as e:
        logger.error(f"stackstac error: {e}")
        return {"ndvi_mean": None, "ndvi_history": [], "image_b64": None, "collection": collection, "items_found": len(items)}

    try:
        # Carrega apenas a primeira cena (mais recente)
        arr = stack.isel(time=0).compute()

        nir_idx = bands_needed.index(bands_cfg["nir"])
        red_idx = bands_needed.index(bands_cfg["red"])

        nir = arr.isel(band=nir_idx).values.astype(float)
        red = arr.isel(band=red_idx).values.astype(float)

        # Máscara de dados válidos
        valid = (nir > 0) & (red > 0) & np.isfinite(nir) & np.isfinite(red)
        ndvi_arr = np.where(valid, (nir - red) / (nir + red + 1e-6), np.nan)

        ndvi_mean = float(np.nanmean(ndvi_arr)) if np.any(valid) else None
        if ndvi_mean is not None:
            ndvi_mean = round(ndvi_mean, 4)

        # Histórico NDVI por data
        ndvi_history = []
        for i, item in enumerate(items):
            try:
                scene = stack.isel(time=i).compute()
                n = scene.isel(band=nir_idx).values.astype(float)
                r = scene.isel(band=red_idx).values.astype(float)
                v = (n > 0) & (r > 0)
                val = float(np.nanmean(np.where(v, (n - r) / (n + r + 1e-6), np.nan))) if np.any(v) else None
                date_str = item.datetime.strftime("%Y-%m-%d") if item.datetime else str(stack.coords["time"].values[i])[:10]
                if val is not None:
                    ndvi_history.append({"date": date_str, "ndvi": round(val, 4)})
            except Exception:
                pass

        # Gera imagem RGB
        green_idx = bands_needed.index(bands_cfg["green"])
        blue_idx  = bands_needed.index(bands_cfg["blue"])

        r_band = arr.isel(band=red_idx).values.astype(float)
        g_band = arr.isel(band=green_idx).values.astype(float)
        b_band = arr.isel(band=blue_idx).values.astype(float)

        def norm(band: np.ndarray) -> np.ndarray:
            p2, p98 = np.nanpercentile(band[band > 0], [2, 98]) if np.any(band > 0) else (0, 1)
            stretched = np.clip((band - p2) / (p98 - p2 + 1e-6), 0, 1)
            return (stretched * 255).astype(np.uint8)

        rgb = np.dstack([norm(r_band), norm(g_band), norm(b_band)])
        img = Image.fromarray(rgb, "RGB")
        img = img.resize((512, 512), Image.LANCZOS)

        buf = io.BytesIO()
        img.save(buf, format="PNG", optimize=True)
        image_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "ndvi_mean": ndvi_mean,
            "ndvi_history": sorted(ndvi_history, key=lambda x: x["date"]),
            "image_b64": image_b64,
            "collection": collection,
            "items_found": len(items),
        }

    except Exception as e:
        logger.error(f"Processing error: {e}")
        return {
            "ndvi_mean": None,
            "ndvi_history": [],
            "image_b64": None,
            "collection": collection,
            "items_found": len(items),
            "error": str(e),
        }
