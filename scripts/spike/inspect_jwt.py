"""Print a safe, unverified summary of a JWT supplied through the environment."""

from __future__ import annotations

import base64
import json
import os
from datetime import UTC, datetime


def _decode_part(value: str) -> dict[str, object]:
    padding = "=" * (-len(value) % 4)
    decoded = base64.urlsafe_b64decode(value + padding)
    result = json.loads(decoded)
    if not isinstance(result, dict):
        raise ValueError("JWT section must be a JSON object")
    return result


def main() -> int:
    token = os.environ.get("TOKEN_TO_INSPECT", "").strip()
    if not token:
        print("ERROR: TOKEN_TO_INSPECT is required")
        return 2

    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("JWT must contain three sections")
        header = _decode_part(parts[0])
        payload = _decode_part(parts[1])
        expires_at = payload.get("exp")
        readable_exp = None
        if isinstance(expires_at, (int, float)):
            readable_exp = datetime.fromtimestamp(expires_at, tz=UTC).isoformat()
        subject = str(payload.get("sub", ""))
        print(
            json.dumps(
                {
                    "alg": header.get("alg"),
                    "kid": header.get("kid"),
                    "iss": payload.get("iss"),
                    "aud": payload.get("aud"),
                    "role": payload.get("role"),
                    "sub_prefix": subject[:8] if subject else None,
                    "exp": readable_exp,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        print(f"ERROR: cannot inspect token: {exc}")
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
