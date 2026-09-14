package com.goreecloud.memos.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

enum class GlazeAppearance { SYSTEM, LIGHT, DARK, DEEP_DARK }

/*
 * V1.4 inherits the V1.3 structural/token foundation. These static Memos schemes therefore remain
 * the deterministic fallback while native V1.4 Optical Engine and Personalization/environment
 * adapters are unaccepted. GlazeAdaptivePolicy and GlazeOpticalPolicy own those fail-closed
 * boundaries and are intentionally not consulted by this fallback renderer.
 */
private val lightColors = lightColorScheme(
    primary = Color(0xFF3478F6),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0x1F3478F6),
    onPrimaryContainer = Color(0xFF151A23),
    secondary = Color(0xFF7657F6),
    background = Color(0xFFF5F7FA),
    onBackground = Color(0xFF151A23),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF151A23),
    surfaceVariant = Color(0xE0FFFFFF),
    onSurfaceVariant = Color(0xFF5D6675),
)

private val darkColors = darkColorScheme(
    primary = Color(0xFF8DB5FF),
    onPrimary = Color(0xFF0B0D11),
    primaryContainer = Color(0x1F8DB5FF),
    onPrimaryContainer = Color(0xFFF5F7FA),
    secondary = Color(0xFFA990FF),
    background = Color(0xFF0B0D11),
    onBackground = Color(0xFFF5F7FA),
    surface = Color(0xFF12151B),
    onSurface = Color(0xFFF5F7FA),
    surfaceVariant = Color(0xDB181D26),
    onSurfaceVariant = Color(0xFFB0B7C3),
)

private val deepDarkColors = darkColorScheme(
    primary = Color(0xFF8DB5FF),
    onPrimary = Color(0xFF05070A),
    primaryContainer = Color(0x1F8DB5FF),
    onPrimaryContainer = Color(0xFFF5F7FA),
    secondary = Color(0xFFA990FF),
    background = Color(0xFF05070A),
    onBackground = Color(0xFFF5F7FA),
    surface = Color(0xFF0D1015),
    onSurface = Color(0xFFF5F7FA),
    surfaceVariant = Color(0xE6171C23),
    onSurfaceVariant = Color(0xFFABB4C2),
)

/**
 * Applies the deterministic native GLAZE UI V1.4 fallback appearance mapping.
 *
 * SYSTEM intentionally follows Android's binary light/dark signal and therefore does not infer
 * Deep Dark or optical context. DEEP_DARK remains explicit. V1.4 optical/adaptive behavior is not
 * activated here because Memos has no independently accepted native Optical Engine,
 * Personalization, environmental-context, or accessibility-runtime adapter in this Development
 * tranche.
 */
@Composable
fun GlazeTheme(
    appearance: GlazeAppearance = GlazeAppearance.SYSTEM,
    content: @Composable () -> Unit,
) {
    val colors = when (appearance) {
        GlazeAppearance.SYSTEM -> if (isSystemInDarkTheme()) darkColors else lightColors
        GlazeAppearance.LIGHT -> lightColors
        GlazeAppearance.DARK -> darkColors
        GlazeAppearance.DEEP_DARK -> deepDarkColors
    }
    MaterialTheme(colorScheme = colors, content = content)
}
