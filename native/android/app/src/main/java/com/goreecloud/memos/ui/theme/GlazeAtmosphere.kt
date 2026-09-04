package com.goreecloud.memos.ui.theme

/**
 * Non-semantic GLAZE UI V1.1 atmospheric source contract for native Memos.
 *
 * These values are deliberately not consumed by the current Home/Capture surface. Memo
 * content and capture actions remain certainty-first, and atmosphere must not represent
 * privacy, security, identity, recovery, synchronization, availability, pin state,
 * persistence state, or any other authoritative meaning.
 *
 * Environmental Color Memory is disabled: this source mapping authorizes no memo-content
 * sampling, remote color derivation, persistent sample history, semantic inference,
 * telemetry, or animated atmosphere.
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
