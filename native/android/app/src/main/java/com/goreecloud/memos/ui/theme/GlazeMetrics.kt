package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Native Android mapping of the GLAZE UI V1.1 foundation/optical subset consumed by Memos.
 *
 * V1.1 preserves the inherited V1 spacing, structural radius, and interaction-target
 * contracts. Optical geometry references are recorded separately so they do not silently
 * redefine structural curvature or hit targets.
 */
object GlazeMetrics {
    const val targetVersion = "1.1.0"
    const val sourceRevision = "15cc76d2bcd4065552dc31c77145b63f34d9e7b2"

    val space1: Dp = 4.dp
    val space2: Dp = 8.dp
    val space3: Dp = 12.dp
    val space4: Dp = 16.dp
    val space5: Dp = 20.dp
    val space6: Dp = 24.dp
    val space8: Dp = 32.dp
    val space12: Dp = 48.dp
    val space16: Dp = 64.dp

    val radiusSmall: Dp = 12.dp
    val radiusStandard: Dp = 20.dp
    val radiusPanel: Dp = 28.dp
    val radiusPill: Dp = 999.dp

    val minimumTarget: Dp = 48.dp
    val touchAssistanceTarget: Dp = 56.dp

    // V1.1 optical geometry references, intentionally separate from structural radii.
    val opticalMicro: Dp = 8.dp
    val opticalControl: Dp = 16.dp
    val opticalContainer: Dp = 24.dp
    val opticalHero: Dp = 32.dp
    val opticalCapsule: Dp = 999.dp
}
