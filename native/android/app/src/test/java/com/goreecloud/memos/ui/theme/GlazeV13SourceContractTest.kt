package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GlazeV13SourceContractTest {
    @Test
    fun `native Memos pins exact GLAZE UI V1_3 implementation and Stable authority`() {
        assertEquals("1.3.0", GlazeMetrics.targetVersion)
        assertEquals(
            "fc7cc91d2eace8da2371371c2855c24cbcb326a1",
            GlazeMetrics.sourceRevision,
        )
        assertEquals(
            "d68e408a9abd946a7fd1b30816a0e3876d8bf8bb",
            GlazeMetrics.stableAuthorityRevision,
        )
        assertEquals(GlazeMetrics.targetVersion, GlazeAdaptivePolicy.targetVersion)
        assertEquals(GlazeMetrics.sourceRevision, GlazeAdaptivePolicy.implementationRevision)
    }

    @Test
    fun `V1_3 preserves inherited geometry and interaction floors`() {
        assertEquals(8.dp, GlazeMetrics.opticalMicro)
        assertEquals(16.dp, GlazeMetrics.opticalControl)
        assertEquals(24.dp, GlazeMetrics.opticalContainer)
        assertEquals(32.dp, GlazeMetrics.opticalHero)
        assertEquals(999.dp, GlazeMetrics.opticalCapsule)

        assertEquals(12.dp, GlazeMetrics.radiusSmall)
        assertEquals(20.dp, GlazeMetrics.radiusStandard)
        assertEquals(28.dp, GlazeMetrics.radiusPanel)
        assertEquals(48.dp, GlazeMetrics.minimumTarget)
        assertEquals(56.dp, GlazeMetrics.touchAssistanceTarget)
    }

    @Test
    fun `V1_3 color authority remains bounded and protected roles cannot be contextual truth`() {
        assertEquals(0xFF68AEE0.toInt(), GlazeAdaptivePolicy.defaultGlazeAccentArgb)
        assertEquals("accessibility", GlazeAdaptivePolicy.colorAuthorityPrecedence.first())
        assertEquals("semantic", GlazeAdaptivePolicy.colorAuthorityPrecedence[1])
        assertTrue("privacy-status" in GlazeAdaptivePolicy.protectedSemanticRoles)
        assertTrue("security-status" in GlazeAdaptivePolicy.protectedSemanticRoles)
        assertTrue("recovery-status" in GlazeAdaptivePolicy.protectedSemanticRoles)
        assertFalse(GlazeAdaptivePolicy.userAccentAdapterAccepted)
        assertFalse(GlazeAdaptivePolicy.contextAccentAdapterAccepted)
        assertFalse(GlazeAdaptivePolicy.environmentalSamplingAllowed)
        assertFalse(GlazeAdaptivePolicy.remoteDynamicColorAllowed)
        assertFalse(GlazeAdaptivePolicy.persistentColorMemoryAllowed)
        assertFalse(GlazeAdaptivePolicy.semanticInferenceAllowed)
    }

    @Test
    fun `V1_3 reachability values remain review signals rather than product authority`() {
        assertEquals(0.00f, GlazeAdaptivePolicy.viewingZoneStart)
        assertEquals(0.42f, GlazeAdaptivePolicy.viewingZoneEnd)
        assertEquals(0.30f, GlazeAdaptivePolicy.transitionZoneStart)
        assertEquals(0.74f, GlazeAdaptivePolicy.transitionZoneEnd)
        assertEquals(0.62f, GlazeAdaptivePolicy.interactionZoneStart)
        assertEquals(1.00f, GlazeAdaptivePolicy.interactionZoneEnd)
        assertFalse(GlazeAdaptivePolicy.reachabilityReviewIsProductAuthority)
        assertFalse(GlazeAdaptivePolicy.physicalDeviceAcceptanceEstablished)
    }

    @Test
    fun `Deep Dark stays explicit and adaptive expression cannot carry semantic state`() {
        assertEquals(
            listOf(
                GlazeAppearance.SYSTEM,
                GlazeAppearance.LIGHT,
                GlazeAppearance.DARK,
                GlazeAppearance.DEEP_DARK,
            ),
            GlazeAppearance.entries,
        )
        assertFalse(GlazeAdaptivePolicy.continuousDecorativeMorphingAllowed)
        assertFalse(GlazeAdaptivePolicy.adaptiveExpressionMayCarrySemanticState)
        assertTrue(GlazeAdaptivePolicy.accessibilityPrecedenceRequired)
    }

    @Test
    fun `legacy atmosphere remains content independent under V1_3`() {
        assertEquals(0xFF0F6B6F.toInt(), GlazeAtmosphere.deepTealArgb)
        assertEquals(0xFFD9A35F.toInt(), GlazeAtmosphere.softAmberArgb)
        assertFalse(GlazeAtmosphere.environmentalColorMemoryEnabled)
        assertFalse(GlazeAtmosphere.remoteColorDerivationAllowed)
        assertFalse(GlazeAtmosphere.persistentSampleHistoryAllowed)
        assertFalse(GlazeAtmosphere.semanticInferenceAllowed)
    }
}
