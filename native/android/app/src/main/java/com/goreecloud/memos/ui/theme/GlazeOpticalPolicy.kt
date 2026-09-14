package com.goreecloud.memos.ui.theme

/**
 * GoreeCloud Memos' source-level adoption boundary for GLAZE UI V1.4 Optical Intelligence.
 *
 * The shared V1.4 Optical Engine is local and deterministic, but Memos does not activate it merely
 * by targeting V1.4. Consumer-supplied context, rendering behavior, accessibility behavior, and
 * human/device acceptance remain independently gated here.
 */
object GlazeOpticalPolicy {
    const val targetVersion = "1.4.0"
    const val stableRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"

    // Shared V1.4 capability facts. These describe the source contract, not Memos acceptance.
    const val opticalEngineIsLocalAndDeterministic = true
    const val telemetryRequired = false
    const val cameraAccessRequired = false
    const val remoteContextRequired = false
    const val environmentalMemoryTintInfluenceCap = 0.08f

    // Consumer adapters/rendering remain unaccepted and therefore inactive.
    const val opticalEngineAdapterAccepted = false
    const val contentAwareFrostAccepted = false
    const val semanticBlurProtectionAccepted = false
    const val environmentTintAdapterAccepted = false
    const val chromaticDepthLayersAccepted = false
    const val environmentalColorMemoryAccepted = false

    // Accessibility precedence is mandatory even before optical rendering can activate.
    const val forcedColorsMustUseSolidAccessibleMode = true
    const val reducedTransparencyMustUseSolidAccessibleMode = true
    const val increasedContrastSuppressesDecorativeTintAndWarmth = true
    const val accessibilityMayBeOverriddenByOpticalContext = false

    // Product, security, privacy, and recovery truth cannot be inferred by optical presentation.
    const val opticalContextMayCarrySemanticAuthority = false
    const val memoContentSamplingAllowed = false
    const val draftSamplingAllowed = false
    const val sharePayloadSamplingAllowed = false
    const val identityStateSamplingAllowed = false
    const val privacySecurityRecoveryStateSamplingAllowed = false

    // V1.4.0 Stable explicitly defers these human/manual gates to V1.4.1.
    const val physicalDeviceAcceptanceEstablished = false
    const val manualAssistiveTechnologyAcceptanceEstablished = false
    const val humanOpticalFinishAcceptanceEstablished = false
    const val humanVisualExcellenceAcceptanceEstablished = false
    const val representativeRealDevicePerformanceAccepted = false
}
