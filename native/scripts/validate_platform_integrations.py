from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "platform" / "integrations.json"
REQUIRED = {"glazeUI", "wardveilSecurity", "privacyShield", "everkeep"}
ALLOWED_STATUS = {"planned", "foundation", "implemented", "validated", "accepted"}
GLAZE_VERSION = "1.1.0"
GLAZE_SOURCE_REVISION = "15cc76d2bcd4065552dc31c77145b63f34d9e7b2"
ANDROID_EVIDENCE = {
    ROOT / "android/app/src/main/java/com/goreecloud/memos/MainActivity.kt",
    ROOT / "android/app/src/main/java/com/goreecloud/memos/home/HomeScreen.kt",
    ROOT / "android/app/src/main/java/com/goreecloud/memos/ui/theme/GlazeMetrics.kt",
    ROOT / "android/app/src/main/java/com/goreecloud/memos/ui/theme/GlazeTheme.kt",
    ROOT / "android/app/src/main/java/com/goreecloud/memos/ui/theme/GlazeAtmosphere.kt",
}


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
    if glaze.get("status") != "foundation":
        raise SystemExit(
            "native Memos Glaze status must remain foundation until broader implementation and acceptance are established"
        )
    if glaze.get("contract") != GLAZE_VERSION:
        raise SystemExit(f"Glaze target must be GLAZE UI V1.1 ({GLAZE_VERSION})")
    if glaze.get("sourceRevision") != GLAZE_SOURCE_REVISION:
        raise SystemExit("Glaze target must pin the exact Stable V1.1 source revision")
    missing_android = sorted(str(path.relative_to(ROOT)) for path in ANDROID_EVIDENCE if not path.is_file())
    if missing_android:
        raise SystemExit(f"native Android Glaze foundation evidence is missing: {missing_android}")

    if not data.get("stableQualificationBlocked"):
        statuses = {systems[name]["status"] for name in REQUIRED}
        if statuses != {"accepted"}:
            raise SystemExit(
                "Stable qualification may be unblocked only when all mandatory systems are accepted"
            )


if __name__ == "__main__":
    main()
