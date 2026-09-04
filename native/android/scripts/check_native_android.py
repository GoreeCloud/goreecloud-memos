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
THEME = (SOURCE_ROOT / "com/goreecloud/memos/ui/theme/GlazeTheme.kt").read_text(encoding="utf-8")
ATMOSPHERE = (SOURCE_ROOT / "com/goreecloud/memos/ui/theme/GlazeAtmosphere.kt").read_text(encoding="utf-8")
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

    require('const val targetVersion = "1.1.0"' in METRICS, "GLAZE UI V1.1 target must remain pinned")
    require('const val sourceRevision = "15cc76d2bcd4065552dc31c77145b63f34d9e7b2"' in METRICS, "GLAZE UI V1.1 source revision must remain exact")
    require("val minimumTarget: Dp = 48.dp" in METRICS, "48 dp normal interaction floor is required")
    require("val touchAssistanceTarget: Dp = 56.dp" in METRICS, "56 dp touch-assistance target must remain available")
    for marker in (
        "val opticalMicro: Dp = 8.dp",
        "val opticalControl: Dp = 16.dp",
        "val opticalContainer: Dp = 24.dp",
        "val opticalHero: Dp = 32.dp",
        "val opticalCapsule: Dp = 999.dp",
    ):
        require(marker in METRICS, f"missing V1.1 optical geometry marker: {marker}")

    require("enum class GlazeAppearance { SYSTEM, LIGHT, DARK, DEEP_DARK }" in THEME, "V1.1 explicit appearance source contract is required")
    require("GlazeAppearance.SYSTEM -> if (isSystemInDarkTheme()) darkColors else lightColors" in THEME, "SYSTEM must remain Android Light/Dark only")
    require("GlazeAppearance.DEEP_DARK -> deepDarkColors" in THEME, "Deep Dark must remain an explicit source capability")
    for marker in (
        "background = Color(0xFF05070A)",
        "surface = Color(0xFF0D1015)",
        "surfaceVariant = Color(0xE6171C23)",
        "onSurfaceVariant = Color(0xFFABB4C2)",
    ):
        require(marker in THEME, f"missing exact V1.1 Deep Dark structural marker: {marker}")

    for marker in (
        "const val deepTealArgb = 0xFF0F6B6F.toInt()",
        "const val softAmberArgb = 0xFFD9A35F.toInt()",
        "const val environmentalColorMemoryEnabled = false",
        "const val remoteColorDerivationAllowed = false",
        "const val persistentSampleHistoryAllowed = false",
        "const val semanticInferenceAllowed = false",
        "no memo-content",
    ):
        require(marker in ATMOSPHERE, f"missing bounded V1.1 atmosphere boundary: {marker}")
    require("GlazeAtmosphere" not in HOME, "Home/Capture must not render V1.1 atmosphere in this source-mapping slice")
    require("GlazeAppearance.DEEP_DARK" not in HOME, "Home/Capture must not auto-select Deep Dark in this source-mapping slice")

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
