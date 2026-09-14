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
ADAPTIVE = (SOURCE_ROOT / "com/goreecloud/memos/ui/theme/GlazeAdaptivePolicy.kt").read_text(encoding="utf-8")
OPTICAL = (SOURCE_ROOT / "com/goreecloud/memos/ui/theme/GlazeOpticalPolicy.kt").read_text(encoding="utf-8")
HOME = (SOURCE_ROOT / "com/goreecloud/memos/home/HomeScreen.kt").read_text(encoding="utf-8")
VIEWMODEL = (SOURCE_ROOT / "com/goreecloud/memos/home/HomeViewModel.kt").read_text(encoding="utf-8")
LOCAL_STORE = (SOURCE_ROOT / "com/goreecloud/memos/home/NativeMemoLocalStore.kt").read_text(encoding="utf-8")
ACTIVITY = (SOURCE_ROOT / "com/goreecloud/memos/MainActivity.kt").read_text(encoding="utf-8")
EMULATOR_TEST = (
    APP / "src/androidTest/java/com/goreecloud/memos/NativeHomeEmulatorAcceptanceTest.kt"
).read_text(encoding="utf-8")


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

    require('const val targetVersion = "1.4.0"' in METRICS, "GLAZE UI V1.4 target must remain pinned")
    require('const val sourceRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"' in METRICS, "GLAZE UI V1.4 source revision must remain exact")
    require('const val stableAuthorityRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"' in METRICS, "GLAZE UI V1.4 Stable authority revision must remain exact")
    require("val minimumTarget: Dp = 48.dp" in METRICS, "48 dp normal interaction floor is required")
    require("val touchAssistanceTarget: Dp = 56.dp" in METRICS, "56 dp touch-assistance target must remain available")
    for marker in (
        "val opticalMicro: Dp = 8.dp",
        "val opticalControl: Dp = 16.dp",
        "val opticalContainer: Dp = 24.dp",
        "val opticalHero: Dp = 32.dp",
        "val opticalCapsule: Dp = 999.dp",
    ):
        require(marker in METRICS, f"missing inherited optical geometry marker: {marker}")

    require("enum class GlazeAppearance { SYSTEM, LIGHT, DARK, DEEP_DARK }" in THEME, "V1.4 explicit appearance source contract is required")
    require("GlazeAppearance.SYSTEM -> if (isSystemInDarkTheme()) darkColors else lightColors" in THEME, "SYSTEM must remain Android Light/Dark only")
    require("GlazeAppearance.DEEP_DARK -> deepDarkColors" in THEME, "Deep Dark must remain an explicit source capability")
    for marker in (
        "background = Color(0xFF05070A)",
        "surface = Color(0xFF0D1015)",
        "surfaceVariant = Color(0xE6171C23)",
        "onSurfaceVariant = Color(0xFFABB4C2)",
    ):
        require(marker in THEME, f"missing inherited Deep Dark structural marker: {marker}")

    for marker in (
        'const val targetVersion = "1.4.0"',
        'const val implementationRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"',
        "const val defaultGlazeAccentArgb = 0xFF68AEE0.toInt()",
        '"accessibility"',
        '"semantic"',
        '"privacy-status"',
        '"security-status"',
        '"recovery-status"',
        "const val userAccentAdapterAccepted = false",
        "const val contextAccentAdapterAccepted = false",
        "const val environmentalSamplingAllowed = false",
        "const val remoteDynamicColorAllowed = false",
        "const val persistentColorMemoryAllowed = false",
        "const val semanticInferenceAllowed = false",
        "const val interactionZoneStart = 0.62f",
        "const val reachabilityReviewIsProductAuthority = false",
        "const val physicalDeviceAcceptanceEstablished = false",
        "const val continuousDecorativeMorphingAllowed = false",
        "const val adaptiveExpressionMayCarrySemanticState = false",
        "const val accessibilityPrecedenceRequired = true",
    ):
        require(marker in ADAPTIVE, f"missing bounded inherited adaptive policy marker: {marker}")

    for marker in (
        'const val targetVersion = "1.4.0"',
        'const val stableRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"',
        "const val opticalEngineIsLocalAndDeterministic = true",
        "const val telemetryRequired = false",
        "const val cameraAccessRequired = false",
        "const val remoteContextRequired = false",
        "const val environmentalMemoryTintInfluenceCap = 0.08f",
        "const val opticalEngineAdapterAccepted = false",
        "const val contentAwareFrostAccepted = false",
        "const val semanticBlurProtectionAccepted = false",
        "const val environmentTintAdapterAccepted = false",
        "const val chromaticDepthLayersAccepted = false",
        "const val environmentalColorMemoryAccepted = false",
        "const val forcedColorsMustUseSolidAccessibleMode = true",
        "const val reducedTransparencyMustUseSolidAccessibleMode = true",
        "const val increasedContrastSuppressesDecorativeTintAndWarmth = true",
        "const val accessibilityMayBeOverriddenByOpticalContext = false",
        "const val opticalContextMayCarrySemanticAuthority = false",
        "const val memoContentSamplingAllowed = false",
        "const val draftSamplingAllowed = false",
        "const val sharePayloadSamplingAllowed = false",
        "const val identityStateSamplingAllowed = false",
        "const val privacySecurityRecoveryStateSamplingAllowed = false",
        "const val physicalDeviceAcceptanceEstablished = false",
        "const val manualAssistiveTechnologyAcceptanceEstablished = false",
        "const val humanOpticalFinishAcceptanceEstablished = false",
        "const val humanVisualExcellenceAcceptanceEstablished = false",
        "const val representativeRealDevicePerformanceAccepted = false",
    ):
        require(marker in OPTICAL, f"missing fail-closed V1.4 optical policy marker: {marker}")

    for marker in (
        "const val deepTealArgb = 0xFF0F6B6F.toInt()",
        "const val softAmberArgb = 0xFFD9A35F.toInt()",
        "const val environmentalColorMemoryEnabled = false",
        "const val remoteColorDerivationAllowed = false",
        "const val persistentSampleHistoryAllowed = false",
        "const val semanticInferenceAllowed = false",
        "no memo-content",
    ):
        require(marker in ATMOSPHERE, f"missing bounded atmosphere boundary: {marker}")
    require("GlazeAtmosphere" not in HOME, "Home/Capture must not render atmosphere in this source-mapping slice")
    require("GlazeAdaptivePolicy" not in HOME, "Home/Capture must not activate inherited adaptive policy without accepted runtime adapters")
    require("GlazeOpticalPolicy" not in HOME, "Home/Capture must not activate V1.4 optical policy without accepted runtime adapters")
    require("GlazeAppearance.DEEP_DARK" not in HOME, "Home/Capture must not auto-select Deep Dark in this source-mapping slice")

    require("enableEdgeToEdge()" in ACTIVITY, "native Activity must preserve edge-to-edge Android presentation")
    require("LazyVerticalStaggeredGrid" in HOME, "Home must remain a native Compose staggered-card surface")
    require("BackHandler" in HOME, "native Back behavior must remain explicit")
    require("FocusRequester" in HOME, "native IME focus behavior must remain explicit")
    require("android.intent.action.SEND" in MANIFEST and 'android:mimeType="text/plain"' in MANIFEST, "native text share capture must remain declared")
    require("android.app.shortcuts" in MANIFEST, "native launcher shortcut metadata must remain declared")
    require("com.goreecloud.memos.action.NEW_MEMO" in SHORTCUTS, "native New memo shortcut action must remain declared")
    require("Intent.ACTION_SEND" in ACTIVITY and "Intent.EXTRA_TEXT" in ACTIVITY, "native Activity must explicitly consume text share intents")

    for marker in (
        "NativeMemoLocalStore(",
        'File(application.filesDir, "goreecloud-memos-native-saved-v1.store")',
        "storageRecoveryRequired",
        "local-${UUID.randomUUID()}",
    ):
        require(marker in VIEWMODEL, f"native saved-card ViewModel boundary missing: {marker}")
    for marker in (
        "AtomicFile(file)",
        'HEADER = "GCMEMOS\\t1"',
        "const val MAX_MEMOS = 5_000",
        "const val MAX_BODY_BYTES = 1_048_576",
        "const val MAX_FILE_BYTES = 16 * 1024 * 1024",
        "output.fd.sync()",
        "RecoveryRequired",
    ):
        require(marker in LOCAL_STORE, f"native saved-card local-store boundary missing: {marker}")
    require(
        "saved cards stay on-device · drafts/shares stay session-only" in HOME,
        "native Home must truthfully distinguish saved-card and transient capture lifetimes",
    )
    require("NativeStorageIssueNotice" in HOME, "native Home must visibly surface local-storage recovery/write failures")
    require('label = { Text("Find saved memos") }' in HOME, "native saved-memo filter must expose a persistent text-field label")
    require('.testTag("clear-saved-memo-filter")' in HOME, "native saved-memo filter must expose an explicit clear affordance")
    require(
        'onClickLabel = "Open memo composer"' in HOME and "role = Role.Button" in HOME,
        "collapsed quick capture must expose explicit button semantics",
    )

    for marker in (
        'androidTestImplementation("androidx.test.ext:junit:',
        'androidTestImplementation("androidx.test.espresso:espresso-core:',
        'androidTestImplementation("androidx.compose.ui:ui-test-junit4:',
        'debugImplementation("androidx.compose.ui:ui-test-manifest:',
    ):
        require(marker in BUILD, f"native Android emulator acceptance dependency missing: {marker}")
    for marker in (
        "launchShowsNativeDevelopmentBoundaryAndQuickCapture",
        "quickCaptureSavesOneLocalMemo",
        "savedMemoFilterClearRestoresLocalResults",
        "systemBackCollapsesComposerWithoutDiscardingDraft",
        "textShareIntentEntersTheNativeComposer",
        '"Native Development preview · saved cards stay on-device · drafts/shares stay session-only"',
        '"clear-saved-memo-filter"',
        '"No matching saved memos"',
        "Intent.ACTION_SEND",
    ):
        require(marker in EMULATOR_TEST, f"native Android emulator acceptance contract missing: {marker}")


if __name__ == "__main__":
    main()
