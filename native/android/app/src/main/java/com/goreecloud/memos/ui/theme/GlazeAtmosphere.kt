package com.goreecloud.memos.ui.theme

/**
 * Non-semantic atmospheric source contract retained under native GLAZE UI V1.3.
 *
 * V1.3 Adaptive Resonance permits richer contextual/adaptive expression only behind explicit
 * authority. These existing Memos-local values remain deliberately unrendered by Home/Capture
 * and cannot represent privacy, security, identity, recovery, synchronization, availability,
 * pin state, persistence state, or any other authoritative meaning.
 *
 * Environmental Color Memory remains disabled: this source mapping authorizes no memo-content
 * sampling, remote color derivation, persistent sample history, semantic inference, telemetry,
 * or animated atmosphere. GlazeAdaptivePolicy separately keeps V1.3 user/context adapters
 * fail-closed until independently accepted.
 */
object GlazeAtmosphere {
    const val deepTealArgb = 0xFF0F6B6F.toInt()
    const val mineralTealArgb = 0xFF1C8A8D.toInt()
    const val softAquaArgb = 0xFF8FD6D2.toInt()
    const val softAmberArgb = 0xFFD9A35F.toInt()
    const val champagneGoldArgb = 0xFFE7C78A.toInt()
    const val warmGlowArgb = 0xFFF2D7A6.toInt()

    const val lightTealAuraMaxAlpha = 0.08f
    const val lightAmberAuraMaxAlpha = 0.04f
    const val darkTealAuraMaxAlpha = 0.12f
    const val darkAmberAuraMaxAlpha = 0.06f
    const val deepDarkTealAuraMaxAlpha = 0.16f
    const val deepDarkAmberAuraMaxAlpha = 0.08f

    const val environmentalColorMemoryEnabled = false
    const val remoteColorDerivationAllowed = false
    const val persistentSampleHistoryAllowed = false
    const val semanticInferenceAllowed = false
}
