package com.goreecloud.memos.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

enum class GlazeAppearance { SYSTEM, LIGHT, DARK, DEEP_DARK }

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
 * Applies the current GLAZE UI V1.1 structural appearance mapping.
 *
 * SYSTEM intentionally follows Android's binary light/dark signal and therefore does not
 * infer Deep Dark. DEEP_DARK is an explicit source capability only until Memos gains a
 * separately reviewed runtime appearance policy or user choice.
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
