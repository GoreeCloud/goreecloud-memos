from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = ROOT / "platform" / "browser_capture_contract.json"
ALLOWED_KINDS = {"page", "link", "selection"}
TOP_LEVEL_KEYS = {
    "schema",
    "service",
    "destination",
    "acceptedKinds",
    "requirements",
    "implementation",
    "openGates",
}
REQUIREMENT_KEYS = {
    "authenticated",
    "reviewedAdapter",
    "oneTimeIntent",
    "privateBrowsingExportAllowed",
    "capturedContentInURLAllowed",
    "leastPrivilege",
    "ownerScopedWrite",
}
IMPLEMENTATION_KEYS = {
    "serviceWriteEndpointReady",
    "browserAdapterReady",
    "productionApproved",
}


def require_exact_keys(value: object, expected: set[str], label: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{label} must be an object")
    actual = set(value)
    if actual != expected:
        missing = sorted(expected - actual)
        unexpected = sorted(actual - expected)
        raise SystemExit(
            f"{label} keys must match reviewed schema; missing={missing}, unexpected={unexpected}"
        )
    return value


def require_bool(value: object, label: str) -> bool:
    if type(value) is not bool:
        raise SystemExit(f"{label} must be an explicit boolean")
    return value


def main() -> None:
    data = require_exact_keys(
        json.loads(CONTRACT.read_text(encoding="utf-8")),
        TOP_LEVEL_KEYS,
        "contract",
    )
    if data["schema"] != "goreecloud.browser-capture/v1":
        raise SystemExit("unsupported Browser capture contract schema")
    if data["service"] != "GoreeCloud Memos":
        raise SystemExit("contract must identify GoreeCloud Memos")
    if data["destination"] != "https://memos.goreecloud.com":
        raise SystemExit("unexpected Memos capture destination")

    kinds = data["acceptedKinds"]
    if (
        not isinstance(kinds, list)
        or not kinds
        or any(not isinstance(kind, str) for kind in kinds)
        or len(kinds) != len(set(kinds))
        or set(kinds) - ALLOWED_KINDS
    ):
        raise SystemExit("acceptedKinds must be a unique, non-empty subset of reviewed capture kinds")

    requirements = require_exact_keys(data["requirements"], REQUIREMENT_KEYS, "requirements")
    for key in ("authenticated", "reviewedAdapter", "oneTimeIntent", "leastPrivilege", "ownerScopedWrite"):
        if require_bool(requirements[key], f"requirements.{key}") is not True:
            raise SystemExit(f"{key} must remain required")
    for key in ("privateBrowsingExportAllowed", "capturedContentInURLAllowed"):
        if require_bool(requirements[key], f"requirements.{key}") is not False:
            raise SystemExit(f"{key} must remain false")

    implementation = require_exact_keys(data["implementation"], IMPLEMENTATION_KEYS, "implementation")
    endpoint_ready = require_bool(
        implementation["serviceWriteEndpointReady"],
        "implementation.serviceWriteEndpointReady",
    )
    adapter_ready = require_bool(
        implementation["browserAdapterReady"],
        "implementation.browserAdapterReady",
    )
    production = require_bool(
        implementation["productionApproved"],
        "implementation.productionApproved",
    )

    gates = data["openGates"]
    if (
        not isinstance(gates, list)
        or any(not isinstance(gate, str) or not gate.strip() for gate in gates)
        or len(gates) != len(set(gates))
    ):
        raise SystemExit("openGates must contain unique, non-empty strings")
    if adapter_ready and not endpoint_ready:
        raise SystemExit("Browser adapter cannot be ready before the service endpoint")
    if production and (not endpoint_ready or not adapter_ready or gates):
        raise SystemExit("production approval requires endpoint, adapter, and zero open gates")

    print("browser capture contract validated")


if __name__ == "__main__":
    main()
