package com.goreecloud.memos.ui.theme

/**
 * GoreeCloud Memos' bounded native mapping of the Adaptive Resonance policy inherited by
 * GLAZE UI V1.4 Optical Intelligence.
 *
 * V1.4 preserves the V1.3 token/adaptive baseline. Memos keeps every adaptive source that could
 * depend on user/environment context disabled until an independently accepted native adapter
 * exists. V1.4 optical behavior is additionally bounded by [GlazeOpticalPolicy].
 */
object GlazeAdaptivePolicy {
    const val targetVersion = "1.4.0"
    const val implementationRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"

    // Retained shared non-semantic presentation accent.
    const val defaultGlazeAccentArgb = 0xFF68AEE0.toInt()

    val colorAuthorityPrecedence = listOf(
        "accessibility",
        "semantic",
        "product-identity",
        "user-accent",
        "context-accent",
        "default-glaze-accent",
    )

    val protectedSemanticRoles = setOf(
        "success",
        "information",
        "warning",
        "danger",
        "protected",
        "restricted",
        "online",
        "offline",
        "syncing",
        "unavailable",
        "security-status",
        "privacy-status",
        "recovery-status",
    )

    // Memos has no accepted native Personalization/environment adapter in this tranche.
    const val userAccentAdapterAccepted = false
    const val contextAccentAdapterAccepted = false
    const val environmentalSamplingAllowed = false
    const val remoteDynamicColorAllowed = false
    const val persistentColorMemoryAllowed = false
    const val semanticInferenceAllowed = false

    // Compact reachability values remain review signals only, not autonomous authority.
    const val viewingZoneStart = 0.00f
    const val viewingZoneEnd = 0.42f
    const val transitionZoneStart = 0.30f
    const val transitionZoneEnd = 0.74f
    const val interactionZoneStart = 0.62f
    const val interactionZoneEnd = 1.00f
    const val reachabilityReviewIsProductAuthority = false
    const val physicalDeviceAcceptanceEstablished = false

    // Expressive morphology cannot carry memo lifecycle, privacy, security, sync, or recovery.
    const val continuousDecorativeMorphingAllowed = false
    const val adaptiveExpressionMayCarrySemanticState = false
    const val accessibilityPrecedenceRequired = true
}
