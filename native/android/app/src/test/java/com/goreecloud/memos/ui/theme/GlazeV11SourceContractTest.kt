package com.goreecloud.memos.ui.theme

import androidx.compose.ui.unit.dp
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test

class GlazeV11SourceContractTest {
    @Test
    fun `native Memos pins exact current Stable GLAZE UI V1_1 authority`() {
        assertEquals("1.1.0", GlazeMetrics.targetVersion)
        assertEquals(
            "15cc76d2bcd4065552dc31c77145b63f34d9e7b2",
            GlazeMetrics.sourceRevision,
        )
    }

    @Test
    fun `V1_1 optical geometry remains separate from structural radius and targets`() {
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
    fun `Deep Dark remains an explicit source appearance`() {
        assertEquals(
            listOf(
                GlazeAppearance.SYSTEM,
                GlazeAppearance.LIGHT,
                GlazeAppearance.DARK,
                GlazeAppearance.DEEP_DARK,
            ),
            GlazeAppearance.entries,
        )
    }

    @Test
    fun `atmosphere contract cannot enable content sampling persistence or semantic inference`() {
        assertEquals(0xFF0F6B6F.toInt(), GlazeAtmosphere.deepTealArgb)
        assertEquals(0xFFD9A35F.toInt(), GlazeAtmosphere.softAmberArgb)
        assertFalse(GlazeAtmosphere.environmentalColorMemoryEnabled)
        assertFalse(GlazeAtmosphere.remoteColorDerivationAllowed)
        assertFalse(GlazeAtmosphere.persistentSampleHistoryAllowed)
        assertFalse(GlazeAtmosphere.semanticInferenceAllowed)
    }
}
