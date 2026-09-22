"""Bounded last-good place results, independent of accounts and sessions."""

import hashlib
import json
import os
from pathlib import Path
import tempfile
import time
from app.core.config import settings


def read(key):
    path = Path(settings.PLACE_CACHE_DIR) / (
        hashlib.sha256(key.encode()).hexdigest() + ".json"
    )
    try:
        record = json.loads(path.read_text())
        age = time.time() - record["saved_at"]
        if age < 0 or age > 86400 or not isinstance(record["data"].get("places"), list):
            return None
        return record["data"], age
    except (OSError, ValueError, KeyError, TypeError):
        return None


def write(key, data):
    folder = Path(settings.PLACE_CACHE_DIR)
    temporary = None
    try:
        folder.mkdir(parents=True, exist_ok=True)
        target = folder / (hashlib.sha256(key.encode()).hexdigest() + ".json")
        with tempfile.NamedTemporaryFile(
            mode="w", dir=folder, suffix=".tmp", delete=False
        ) as output:
            temporary = output.name
            json.dump({"saved_at": time.time(), "data": data}, output)
        os.replace(temporary, target)
        records = sorted(
            folder.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True
        )
        for old in records:
            if time.time() - old.stat().st_mtime > 86400:
                old.unlink(missing_ok=True)
        for old in records[128:]:
            old.unlink(missing_ok=True)
    except OSError:
        # A read-only disk must not turn a successful provider response into a failure.
        pass
    finally:
        if temporary:
            Path(temporary).unlink(missing_ok=True)
