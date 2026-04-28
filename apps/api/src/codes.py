"""
Simple invite-code management for Blacktivism API.

Codes are stored in-memory and optionally synced to a JSON file
so they survive container restarts on Render.
"""

import os
import json
import secrets
import string
from datetime import datetime
from typing import Set, Dict, Any
from pathlib import Path

# Configuration
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "change-me-in-production")
CODES_FILE = os.environ.get("CODES_FILE", "/tmp/blacktivism_codes.json")

# In-memory store
_valid_codes: Set[str] = set()
_code_metadata: Dict[str, Dict[str, Any]] = {}


def _load_codes() -> None:
    """Load persisted codes from disk."""
    global _valid_codes, _code_metadata
    try:
        path = Path(CODES_FILE)
        if path.exists():
            with open(path, "r") as f:
                data = json.load(f)
                _valid_codes = set(data.get("codes", []))
                _code_metadata = data.get("metadata", {})
    except Exception:
        _valid_codes = set()
        _code_metadata = {}


def _save_codes() -> None:
    """Persist codes to disk."""
    try:
        path = Path(CODES_FILE)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(
                {
                    "codes": sorted(list(_valid_codes)),
                    "metadata": _code_metadata,
                    "updated_at": datetime.utcnow().isoformat(),
                },
                f,
                indent=2,
            )
    except Exception as e:
        print(f"[codes] Warning: failed to save codes: {e}")


def generate_code(length: int = 12) -> str:
    """Generate a random alphanumeric invite code."""
    alphabet = string.ascii_uppercase + string.ascii_lowercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def create_code(label: str = "") -> str:
    """Create and store a new invite code."""
    _load_codes()
    code = generate_code()
    while code in _valid_codes:
        code = generate_code()
    _valid_codes.add(code)
    _code_metadata[code] = {
        "created_at": datetime.utcnow().isoformat(),
        "label": label,
        "uses": 0,
    }
    _save_codes()
    return code


def revoke_code(code: str) -> bool:
    """Revoke an invite code. Returns True if it existed."""
    _load_codes()
    existed = code in _valid_codes
    _valid_codes.discard(code)
    _code_metadata.pop(code, None)
    if existed:
        _save_codes()
    return existed


def validate_code(code: str) -> bool:
    """Check if a code is valid."""
    _load_codes()
    valid = code in _valid_codes
    if valid and code in _code_metadata:
        _code_metadata[code]["uses"] = _code_metadata[code].get("uses", 0) + 1
        _save_codes()
    return valid


def list_codes() -> Dict[str, Any]:
    """Return all valid codes with metadata."""
    _load_codes()
    return {
        code: {
            "created_at": _code_metadata.get(code, {}).get("created_at"),
            "label": _code_metadata.get(code, {}).get("label", ""),
            "uses": _code_metadata.get(code, {}).get("uses", 0),
        }
        for code in sorted(_valid_codes)
    }


def verify_admin_token(token: str) -> bool:
    """Verify the admin bearer token."""
    return secrets.compare_digest(token, ADMIN_TOKEN)
