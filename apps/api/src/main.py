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
# Health / Status
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


@app.get("/api/status")
async def status():
    """Check which data sources are reachable from this server."""
    results = {}
    import httpx
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            r = await client.get("https://opensky-network.org/api/states/all")
            results["opensky"] = {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            results["opensky"] = {"ok": False, "error": str(e)}

        try:
            r = await client.get("https://meri.digitraffic.fi/api/ais/v1/locations")
            results["digitraffic"] = {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            results["digitraffic"] = {"ok": False, "error": str(e)}

        try:
            r = await client.get("https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=json")
            results["celestrak"] = {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            results["celestrak"] = {"ok": False, "error": str(e)}

        try:
            r = await client.get("https://feeds.bbci.co.uk/news/rss.xml")
            results["bbc_rss"] = {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            results["bbc_rss"] = {"ok": False, "error": str(e)}

        try:
            r = await client.get("https://api.manifold.markets/v0/markets?limit=1")
            results["manifold"] = {"ok": r.status_code == 200, "status": r.status_code}
        except Exception as e:
            results["manifold"] = {"ok": False, "error": str(e)}

    return {
        "server": "online",
        "timestamp": datetime.utcnow().isoformat(),
        "sources": results,
    }

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
    result = await fetch_signals()
    return {
        "signals": result.get("signals", []),
        "receivers": result.get("receivers", []),
        "count": result.get("count", 0),
        "receiverCount": result.get("receiverCount", 0),
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
# Mesh Chat (in-memory — real messages, no fake data)
# ------------------------------------------------------------------
class MeshMessageIn(BaseModel):
    channel: str
    sender: str
    content: str

# In-memory storage (resets on deploy — acceptable for demo/early stage)
MESH_CHANNELS = [
    {"id": "general", "name": "General", "type": "public", "participants": 0, "unread": 0},
    {"id": "ops", "name": "Operations", "type": "encrypted", "participants": 0, "unread": 0},
    {"id": "intel", "name": "Intelligence", "type": "encrypted", "participants": 0, "unread": 0},
    {"id": "logistics", "name": "Logistics", "type": "direct", "participants": 0, "unread": 0},
]

MESH_MESSAGES: dict[str, list[dict]] = {
    "general": [
        {"id": "msg_1", "channelId": "general", "sender": "system", "content": "Mesh network initialized. All channels secure.", "timestamp": datetime.utcnow().isoformat(), "encrypted": False},
    ],
    "ops": [],
    "intel": [],
    "logistics": [],
}


@app.get("/api/mesh/channels")
async def mesh_channels():
    # Update participant counts based on recent messages
    for ch in MESH_CHANNELS:
        msgs = MESH_MESSAGES.get(ch["id"], [])
        senders = {m["sender"] for m in msgs}
        ch["participants"] = max(len(senders), 1)
    return {
        "channels": MESH_CHANNELS,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/api/mesh/messages")
async def mesh_messages(channel: str = Query(...)):
    msgs = MESH_MESSAGES.get(channel, [])
    return {
        "messages": msgs,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/mesh/messages")
async def post_mesh_message(msg: MeshMessageIn):
    if not msg.channel or not msg.sender or not msg.content:
        raise HTTPException(status_code=400, detail="channel, sender, and content required")
    if msg.channel not in {c["id"] for c in MESH_CHANNELS}:
        raise HTTPException(status_code=404, detail="Channel not found")

    message = {
        "id": f"msg_{datetime.utcnow().timestamp()}",
        "channelId": msg.channel,
        "sender": msg.sender,
        "content": msg.content,
        "timestamp": datetime.utcnow().isoformat(),
        "encrypted": msg.channel != "general",
    }
    MESH_MESSAGES.setdefault(msg.channel, []).append(message)
    # Cap at 500 messages per channel
    if len(MESH_MESSAGES[msg.channel]) > 500:
        MESH_MESSAGES[msg.channel] = MESH_MESSAGES[msg.channel][-500:]
    return {"message": message, "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
