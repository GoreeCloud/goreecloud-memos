package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Native Android mapping of the GLAZE UI V1.3 structural foundation consumed by Memos.
 *
 * V1.3 inherits its structural rendering baseline from V1.2. Memos therefore preserves
 * its already-reviewed spacing, structural-radius, optical-geometry, and interaction-target
 * contracts while pinning the current V1.3 implementation authority explicitly. Adaptive
 * expression remains a separate policy layer and must not silently redefine these values.
 */
object GlazeMetrics {
    const val targetVersion = "1.3.0"
    const val sourceRevision = "fc7cc91d2eace8da2371371c2855c24cbcb326a1"
    const val stableAuthorityRevision = "d68e408a9abd946a7fd1b30816a0e3876d8bf8bb"

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

    // V1.3 reachability preserves these inherited interaction floors.
    val minimumTarget: Dp = 48.dp
    val touchAssistanceTarget: Dp = 56.dp

    // Inherited optical geometry references, intentionally separate from structural radii.
    val opticalMicro: Dp = 8.dp
    val opticalControl: Dp = 16.dp
    val opticalContainer: Dp = 24.dp
    val opticalHero: Dp = 32.dp
    val opticalCapsule: Dp = 999.dp
}
