package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Native Android mapping of the GLAZE UI V1.4 structural foundation consumed by Memos.
 *
 * V1.4 inherits the V1.3 token system and public component baseline. Memos therefore preserves
 * its already-reviewed spacing, structural-radius, optical-geometry, and interaction-target
 * contracts while pinning current V1.4 Stable authority explicitly. Optical Intelligence is a
 * separate additive policy layer and must not silently redefine these values or product truth.
 */
object GlazeMetrics {
    const val targetVersion = "1.4.0"
    const val sourceRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"
    const val stableAuthorityRevision = "84cb3db4884042f0fa25ed6d475a127fb110f596"

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

    // V1.4 preserves these inherited interaction floors.
    val minimumTarget: Dp = 48.dp
    val touchAssistanceTarget: Dp = 56.dp

    // Inherited optical geometry references, intentionally separate from structural radii.
    val opticalMicro: Dp = 8.dp
    val opticalControl: Dp = 16.dp
    val opticalContainer: Dp = 24.dp
    val opticalHero: Dp = 32.dp
    val opticalCapsule: Dp = 999.dp
}
