#!/usr/bin/env python3
from pathlib import Path
import re

GO_MOD = Path("go.mod")
MODULE = "github.com/labstack/echo/v5"
MINIMUM = (5, 3, 1)

text = GO_MOD.read_text(encoding="utf-8")
match = re.search(r"^\s*" + re.escape(MODULE) + r"\s+v(\d+)\.(\d+)\.(\d+)\s*$", text, re.MULTILINE)
if not match:
    raise SystemExit(f"missing direct dependency: {MODULE}")
version = tuple(map(int, match.groups()))
if version < MINIMUM:
    raise SystemExit(f"{MODULE} must be >= v5.3.1; found v{'.'.join(map(str, version))}")
print(f"validated {MODULE} v{'.'.join(map(str, version))}")
