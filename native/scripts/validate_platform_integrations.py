from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "platform" / "integrations.json"
REQUIRED = {"glazeUI", "wardveilSecurity", "privacyShield", "everkeep"}
ALLOWED_STATUS = {"planned", "foundation", "implemented", "validated", "accepted"}
GLAZE_VERSION = "1.0.0"
GLAZE_SOURCE_REVISION = "70909bbdccad378fb7281ae1842e2f5beed64c38"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if data.get("schema") != "goreecloud.platform-integrations/v1":
        raise SystemExit("unsupported platform integration schema")
    if data.get("implementation") != "native":
        raise SystemExit("application implementation must be native")

    systems = data.get("systems")
    if not isinstance(systems, dict):
        raise SystemExit("systems must be an object")
    missing = REQUIRED - systems.keys()
    if missing:
        raise SystemExit(f"missing mandatory systems: {sorted(missing)}")

    for name in sorted(REQUIRED):
        entry = systems[name]
        if entry.get("required") is not True:
            raise SystemExit(f"{name} must remain required")
        if entry.get("status") not in ALLOWED_STATUS:
            raise SystemExit(f"{name} has invalid status")

    glaze = systems["glazeUI"]
    if glaze.get("status") != "planned":
        raise SystemExit(
            "native Memos must remain planned for Glaze until a rendered implementation is established"
        )
    if glaze.get("contract") != GLAZE_VERSION:
        raise SystemExit(f"Glaze target must be GLAZE UI V1.0 ({GLAZE_VERSION})")
    if glaze.get("sourceRevision") != GLAZE_SOURCE_REVISION:
        raise SystemExit("Glaze target must pin the exact canonical V1 source revision")

    if not data.get("stableQualificationBlocked"):
        statuses = {systems[name]["status"] for name in REQUIRED}
        if statuses != {"accepted"}:
            raise SystemExit(
                "Stable qualification may be unblocked only when all mandatory systems are accepted"
            )


if __name__ == "__main__":
    main()
