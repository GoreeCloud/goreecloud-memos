package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class GlazeV14SourceContractTest {
    @Test
    fun `native Memos pins exact GLAZE UI V1_4 Stable authority`() {
        assertEquals("1.4.0", GlazeMetrics.targetVersion)
        assertEquals(
            "84cb3db4884042f0fa25ed6d475a127fb110f596",
            GlazeMetrics.sourceRevision,
        )
        assertEquals(GlazeMetrics.sourceRevision, GlazeMetrics.stableAuthorityRevision)
        assertEquals(GlazeMetrics.targetVersion, GlazeAdaptivePolicy.targetVersion)
        assertEquals(GlazeMetrics.sourceRevision, GlazeAdaptivePolicy.implementationRevision)
        assertEquals(GlazeMetrics.targetVersion, GlazeOpticalPolicy.targetVersion)
        assertEquals(GlazeMetrics.sourceRevision, GlazeOpticalPolicy.stableRevision)
    }

    @Test
    fun `V1_4 preserves inherited geometry and interaction floors`() {
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
    fun `inherited adaptive authority remains fail closed`() {
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
        assertFalse(GlazeAdaptivePolicy.reachabilityReviewIsProductAuthority)
        assertFalse(GlazeAdaptivePolicy.physicalDeviceAcceptanceEstablished)
        assertFalse(GlazeAdaptivePolicy.adaptiveExpressionMayCarrySemanticState)
        assertTrue(GlazeAdaptivePolicy.accessibilityPrecedenceRequired)
    }

    @Test
    fun `V1_4 optical contract is local bounded and inactive for Memos`() {
        assertTrue(GlazeOpticalPolicy.opticalEngineIsLocalAndDeterministic)
        assertFalse(GlazeOpticalPolicy.telemetryRequired)
        assertFalse(GlazeOpticalPolicy.cameraAccessRequired)
        assertFalse(GlazeOpticalPolicy.remoteContextRequired)
        assertEquals(0.08f, GlazeOpticalPolicy.environmentalMemoryTintInfluenceCap)
        assertFalse(GlazeOpticalPolicy.opticalEngineAdapterAccepted)
        assertFalse(GlazeOpticalPolicy.contentAwareFrostAccepted)
        assertFalse(GlazeOpticalPolicy.semanticBlurProtectionAccepted)
        assertFalse(GlazeOpticalPolicy.environmentTintAdapterAccepted)
        assertFalse(GlazeOpticalPolicy.chromaticDepthLayersAccepted)
        assertFalse(GlazeOpticalPolicy.environmentalColorMemoryAccepted)
    }

    @Test
    fun `V1_4 accessibility precedence cannot be overridden by optical context`() {
        assertTrue(GlazeOpticalPolicy.forcedColorsMustUseSolidAccessibleMode)
        assertTrue(GlazeOpticalPolicy.reducedTransparencyMustUseSolidAccessibleMode)
        assertTrue(GlazeOpticalPolicy.increasedContrastSuppressesDecorativeTintAndWarmth)
        assertFalse(GlazeOpticalPolicy.accessibilityMayBeOverriddenByOpticalContext)
        assertFalse(GlazeOpticalPolicy.opticalContextMayCarrySemanticAuthority)
    }

    @Test
    fun `optical context cannot sample private product state`() {
        assertFalse(GlazeOpticalPolicy.memoContentSamplingAllowed)
        assertFalse(GlazeOpticalPolicy.draftSamplingAllowed)
        assertFalse(GlazeOpticalPolicy.sharePayloadSamplingAllowed)
        assertFalse(GlazeOpticalPolicy.identityStateSamplingAllowed)
        assertFalse(GlazeOpticalPolicy.privacySecurityRecoveryStateSamplingAllowed)
    }

    @Test
    fun `V1_4_0 does not fabricate deferred human acceptance`() {
        assertFalse(GlazeOpticalPolicy.physicalDeviceAcceptanceEstablished)
        assertFalse(GlazeOpticalPolicy.manualAssistiveTechnologyAcceptanceEstablished)
        assertFalse(GlazeOpticalPolicy.humanOpticalFinishAcceptanceEstablished)
        assertFalse(GlazeOpticalPolicy.humanVisualExcellenceAcceptanceEstablished)
        assertFalse(GlazeOpticalPolicy.representativeRealDevicePerformanceAccepted)
    }

    @Test
    fun `Deep Dark stays explicit and legacy atmosphere stays content independent`() {
        assertEquals(
            listOf(
                GlazeAppearance.SYSTEM,
                GlazeAppearance.LIGHT,
                GlazeAppearance.DARK,
                GlazeAppearance.DEEP_DARK,
            ),
            GlazeAppearance.entries,
        )
        assertEquals(0xFF0F6B6F.toInt(), GlazeAtmosphere.deepTealArgb)
        assertEquals(0xFFD9A35F.toInt(), GlazeAtmosphere.softAmberArgb)
        assertFalse(GlazeAtmosphere.environmentalColorMemoryEnabled)
        assertFalse(GlazeAtmosphere.remoteColorDerivationAllowed)
        assertFalse(GlazeAtmosphere.persistentSampleHistoryAllowed)
        assertFalse(GlazeAtmosphere.semanticInferenceAllowed)
    }
}
