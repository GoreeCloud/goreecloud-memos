package com.goreecloud.memos.ui.theme

/**
 * GoreeCloud Memos' source-level adoption boundary for GLAZE UI V1.4.1 Optical Hardening.
 *
 * The shared V1.4.1 release carries the validated V1.4 optical behavior and governed shared
 * human-validation record. Memos does not inherit downstream acceptance merely by pinning the
 * release: its own adapters, rendering, accessibility, performance, and representative-device
 * behavior remain independently gated here.
 */
object GlazeOpticalPolicy {
    const val targetVersion = "1.4.1"
    const val stableRevision = "4fab9da0fad2e5c974e0e66ec88632c61745751c"

    const val opticalEngineIsLocalAndDeterministic = true
    const val telemetryRequired = false
    const val cameraAccessRequired = false
    const val remoteContextRequired = false
    const val environmentalMemoryTintInfluenceCap = 0.08f

    const val opticalEngineAdapterAccepted = false
    const val contentAwareFrostAccepted = false
    const val semanticBlurProtectionAccepted = false
    const val environmentTintAdapterAccepted = false
    const val chromaticDepthLayersAccepted = false
    const val environmentalColorMemoryAccepted = false

    const val forcedColorsMustUseSolidAccessibleMode = true
    const val reducedTransparencyMustUseSolidAccessibleMode = true
    const val increasedContrastSuppressesDecorativeTintAndWarmth = true
    const val accessibilityMayBeOverriddenByOpticalContext = false

    const val opticalContextMayCarrySemanticAuthority = false
    const val memoContentSamplingAllowed = false
    const val draftSamplingAllowed = false
    const val sharePayloadSamplingAllowed = false
    const val identityStateSamplingAllowed = false
    const val privacySecurityRecoveryStateSamplingAllowed = false

    // Shared Glaze 1.4.1 qualification does not automatically establish Memos-local acceptance.
    const val physicalDeviceAcceptanceEstablished = false
    const val manualAssistiveTechnologyAcceptanceEstablished = false
    const val humanOpticalFinishAcceptanceEstablished = false
    const val humanVisualExcellenceAcceptanceEstablished = false
    const val representativeRealDevicePerformanceAccepted = false
}
