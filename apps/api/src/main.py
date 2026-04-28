import os

from fastapi import FastAPI, Query, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Any

from .services import (
    fetch_flights,
    fetch_vessels,
    fetch_news,
    fetch_signals,
    search_shodan,
    get_shodan_host,
    fetch_markets,
    fetch_satellites,
    fetch_cctv_cameras,
    fetch_cctv_countries,
)
from . import codes as invite_codes

app = FastAPI(title="Blacktivism API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Health
# ------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    version: str
    timestamp: str

@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="online",
        version="2.0.0",
        timestamp=datetime.utcnow().isoformat(),
    )

# ------------------------------------------------------------------
# Auth / Invite Codes
# ------------------------------------------------------------------
class ValidateRequest(BaseModel):
    key: str

class ValidateResponse(BaseModel):
    success: bool
    error: str | None = None

@app.post("/api/auth/validate", response_model=ValidateResponse)
async def validate_auth(req: ValidateRequest):
    """Validate an invite code or master key."""
    master_key = os.environ.get("SECRET_KEY", "")
    if req.key == master_key:
        return ValidateResponse(success=True)
    if invite_codes.validate_code(req.key):
        return ValidateResponse(success=True)
    return ValidateResponse(success=False, error="Invalid code")

class GenerateCodeResponse(BaseModel):
    code: str
    label: str = ""

class CodesListResponse(BaseModel):
    codes: dict

@app.post("/api/codes/generate")
async def generate_code_endpoint(
    label: str = "",
    authorization: str = Header(default=""),
):
    """Generate a new invite code (admin only)."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not invite_codes.verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Invalid admin token")
    code = invite_codes.create_code(label=label)
    return {"code": code, "label": label}

@app.get("/api/codes")
async def list_codes_endpoint(
    authorization: str = Header(default=""),
):
    """List all valid invite codes (admin only)."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not invite_codes.verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Invalid admin token")
    return {"codes": invite_codes.list_codes()}

@app.delete("/api/codes/{code}")
async def revoke_code_endpoint(
    code: str,
    authorization: str = Header(default=""),
):
    """Revoke an invite code (admin only)."""
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not invite_codes.verify_admin_token(token):
        raise HTTPException(status_code=401, detail="Invalid admin token")
    existed = invite_codes.revoke_code(code)
    if not existed:
        raise HTTPException(status_code=404, detail="Code not found")
    return {"revoked": code}

# ------------------------------------------------------------------
# Live Data
# ------------------------------------------------------------------
@app.get("/api/live-data")
async def live_data():
    flights = await fetch_flights()
    vessels = await fetch_vessels()
    satellites = await fetch_satellites()
    return {
        "flights": flights,
        "vessels": vessels,
        "satellites": satellites,
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/api/flights")
async def flights_endpoint():
    return {"flights": await fetch_flights(), "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/vessels")
async def vessels_endpoint():
    return {"vessels": await fetch_vessels(), "timestamp": datetime.utcnow().isoformat()}

@app.get("/api/satellites")
async def satellites_endpoint():
    return {"satellites": await fetch_satellites(), "timestamp": datetime.utcnow().isoformat()}

# ------------------------------------------------------------------
# News
# ------------------------------------------------------------------
@app.get("/api/news")
async def news_endpoint(
    source: str | None = Query(None),
    q: str | None = Query(None),
):
    items = await fetch_news(source=source, q=q)
    return {
        "items": items,
        "timestamp": datetime.utcnow().isoformat(),
    }

# ------------------------------------------------------------------
# SIGINT
# ------------------------------------------------------------------
@app.get("/api/sigint")
async def sigint_endpoint():
    return {
        "signals": await fetch_signals(),
        "timestamp": datetime.utcnow().isoformat(),
    }

# ------------------------------------------------------------------
# Shodan
# ------------------------------------------------------------------
@app.get("/api/shodan/search")
async def shodan_search(q: str = Query(...)):
    return await search_shodan(q)

@app.get("/api/shodan/host/{ip}")
async def shodan_host(ip: str):
    return await get_shodan_host(ip)

# ------------------------------------------------------------------
# Prediction Markets
# ------------------------------------------------------------------
@app.get("/api/markets")
async def markets_endpoint():
    return {
        "markets": await fetch_markets(),
        "timestamp": datetime.utcnow().isoformat(),
    }

# ------------------------------------------------------------------
# CCTV Feeds
# ------------------------------------------------------------------
@app.get("/api/cctv")
async def cctv_endpoint(country: str | None = Query(None), limit: int = Query(50)):
    cameras = await fetch_cctv_cameras(country=country, limit=min(limit, 100))
    return {
        "cameras": cameras,
        "total": len(cameras),
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/api/cctv/countries")
async def cctv_countries_endpoint():
    return {
        "countries": await fetch_cctv_countries(),
        "timestamp": datetime.utcnow().isoformat(),
    }

# ------------------------------------------------------------------
# Mesh (real encrypted channels — no fake data)
# ------------------------------------------------------------------
@app.get("/api/mesh/channels")
async def mesh_channels():
    return {
        "channels": [],
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.get("/api/mesh/messages")
async def mesh_messages(channel: str = Query(...)):
    return {
        "messages": [],
        "timestamp": datetime.utcnow().isoformat(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
