from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
MANIFEST = (APP / "src/main/AndroidManifest.xml").read_text(encoding="utf-8")
BUILD = (APP / "build.gradle.kts").read_text(encoding="utf-8")
SHORTCUTS = (APP / "src/main/res/xml/shortcuts.xml").read_text(encoding="utf-8")
SOURCE_ROOT = APP / "src/main/java"
SOURCES = "\n".join(path.read_text(encoding="utf-8") for path in SOURCE_ROOT.rglob("*.kt"))
METRICS = (SOURCE_ROOT / "com/goreecloud/memos/ui/theme/GlazeMetrics.kt").read_text(encoding="utf-8")
HOME = (SOURCE_ROOT / "com/goreecloud/memos/home/HomeScreen.kt").read_text(encoding="utf-8")
ACTIVITY = (SOURCE_ROOT / "com/goreecloud/memos/MainActivity.kt").read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(message)


def main() -> None:
    require("android.permission.INTERNET" not in MANIFEST, "native Android foundation must not request INTERNET")
    require("usesCleartextTraffic=\"false\"" in MANIFEST, "native Android foundation must fail closed on cleartext traffic")
    require("WebView" not in SOURCES, "native Android foundation must not contain WebView code")
    require("android.webkit" not in SOURCES, "native Android foundation must not import android.webkit")
    require("https://memos.goreecloud.com" not in SOURCES, "native Android foundation must not embed the live web application")
    require('applicationId = "com.goreecloud.memos.native.dev"' in BUILD, "Development package identity must remain isolated from the transitional client")
    require("compileSdk = 36" in BUILD and "targetSdk = 36" in BUILD, "native Android foundation must target the current Android baseline")
    require('const val targetVersion = "1.0.0"' in METRICS, "GLAZE UI V1.0 target must remain pinned")
    require('const val sourceRevision = "70909bbdccad378fb7281ae1842e2f5beed64c38"' in METRICS, "GLAZE UI source revision must remain exact")
    require("val minimumTarget: Dp = 48.dp" in METRICS, "48 dp normal interaction floor is required")
    require("val touchAssistanceTarget: Dp = 56.dp" in METRICS, "56 dp touch-assistance target must remain available")
    require("enableEdgeToEdge()" in ACTIVITY, "native Activity must preserve edge-to-edge Android presentation")
    require("LazyVerticalStaggeredGrid" in HOME, "Home must remain a native Compose staggered-card surface")
    require("BackHandler" in HOME, "native Back behavior must remain explicit")
    require("FocusRequester" in HOME, "native IME focus behavior must remain explicit")
    require("android.intent.action.SEND" in MANIFEST and 'android:mimeType="text/plain"' in MANIFEST, "native text share capture must remain declared")
    require("android.app.shortcuts" in MANIFEST, "native launcher shortcut metadata must remain declared")
    require("com.goreecloud.memos.action.NEW_MEMO" in SHORTCUTS, "native New memo shortcut action must remain declared")
    require("Intent.ACTION_SEND" in ACTIVITY and "Intent.EXTRA_TEXT" in ACTIVITY, "native Activity must explicitly consume text share intents")


if __name__ == "__main__":
    main()
