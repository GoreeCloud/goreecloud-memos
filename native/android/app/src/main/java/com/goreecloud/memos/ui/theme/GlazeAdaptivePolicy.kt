package com.goreecloud.memos.ui.theme

/**
 * GoreeCloud Memos' bounded native mapping of GLAZE UI V1.3 Adaptive Resonance policy.
 *
 * V1.3 supports adaptive color, expressive shape, reachability review, and richer material
 * behavior, but those capabilities do not gain product truth or data authority merely because
 * the shared design system supports them. Memos keeps every adaptive source that could depend
 * on user/environment context disabled until an independently accepted native adapter exists.
 */
object GlazeAdaptivePolicy {
    const val targetVersion = "1.3.0"
    const val implementationRevision = "fc7cc91d2eace8da2371371c2855c24cbcb326a1"

    // Shared V1.3 default presentation accent. This is not a semantic status color.
    const val defaultGlazeAccentArgb = 0xFF68AEE0.toInt()

    // V1.3 color-authority precedence. Protected truth remains owned outside Glaze.
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

    // V1.3 compact reachability values are review signals only, not autonomous authority.
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
