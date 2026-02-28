"""
FastAPI — Satellite Processor Service
Porta: 8001
"""

import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from processor import compute_ndvi_and_image, parse_geometry

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AgroFlowAI Satellite Processor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ProcessRequest(BaseModel):
    coordinates: str          # "lat,lon" ou GeoJSON string
    property_id: Optional[str] = None
    property_name: Optional[str] = None
    days_back: int = 90


class ProcessResponse(BaseModel):
    property_id: Optional[str]
    property_name: Optional[str]
    ndvi_mean: Optional[float]
    ndvi_history: list
    image_b64: Optional[str]
    collection: Optional[str]
    items_found: int
    alert: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "satellite-processor"}


@app.post("/process", response_model=ProcessResponse)
def process_property(req: ProcessRequest):
    """
    Recebe coordenadas de uma propriedade e retorna:
    - NDVI médio atual
    - Histórico NDVI por data
    - Imagem RGB em base64 (PNG)
    - Alerta se NDVI < 0.3
    """
    logger.info(f"Processing property {req.property_id} — coords: {req.coordinates[:60]}")

    if not req.coordinates:
        raise HTTPException(status_code=400, detail="coordinates é obrigatório")

    result = compute_ndvi_and_image(req.coordinates, days_back=req.days_back)

    if "error" in result and result.get("ndvi_mean") is None and result.get("items_found", 0) == 0:
        raise HTTPException(status_code=422, detail=result.get("error", "Processamento falhou"))

    ndvi = result.get("ndvi_mean")
    alert = None
    if ndvi is not None:
        if ndvi < 0.3:
            alert = "RISCO CRÍTICO — NDVI abaixo de 0.3: possível desmatamento ou estresse severo"
        elif ndvi < 0.5:
            alert = "ATENÇÃO — NDVI baixo: vegetação degradada ou em estresse moderado"

    return ProcessResponse(
        property_id=req.property_id,
        property_name=req.property_name,
        ndvi_mean=ndvi,
        ndvi_history=result.get("ndvi_history", []),
        image_b64=result.get("image_b64"),
        collection=result.get("collection"),
        items_found=result.get("items_found", 0),
        alert=alert,
    )


@app.get("/collections")
def list_collections():
    """Lista as coleções disponíveis no Brazil Data Cube STAC."""
    import pystac_client
    try:
        catalog = pystac_client.Client.open("https://brazildatacube.dpi.inpe.br/stac/")
        collections = [c.id for c in catalog.get_collections()]
        return {"collections": collections}
    except Exception as e:
        return {"collections": [], "error": str(e)}
