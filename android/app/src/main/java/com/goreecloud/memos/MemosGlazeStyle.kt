package com.goreecloud.memos

import android.app.Activity
import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.View
import android.view.Window
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Development-only Android presentation mapping for GoreeCloud Memos.
 *
 * This source targets current governed Stable Glaze UI 1.5.1 semantics but
 * does not claim rendered, accessibility, device, performance, or production
 * Glaze acceptance.
 */
class MemosGlazeStyle(private val context: Context) {
    companion object {
        const val GLAZE_UI_TARGET = "1.5.1"
        const val GENERAL_TARGET_DP = 48
        const val PRIMARY_TARGET_DP = 56
    }

    private val dark =
        (context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) ==
            Configuration.UI_MODE_NIGHT_YES

    val canvas = Color.parseColor(if (dark) "#0B0F16" else "#F4F7FB")
    val surface = Color.parseColor(if (dark) "#E6141B25" else "#E6FFFFFF")
    val surfaceStrong = Color.parseColor(if (dark) "#F01A2230" else "#F7FFFFFF")
    val textPrimary = Color.parseColor(if (dark) "#F4F7FB" else "#172033")
    val textSecondary = Color.parseColor(if (dark) "#AEB8C7" else "#5B6577")
    val accent = Color.parseColor("#3B82F6")
    val accentStrong = Color.parseColor("#174EA6")
    val outline = Color.parseColor(if (dark) "#354153" else "#D8E0EC")
    val error = Color.parseColor(if (dark) "#FFB4AB" else "#B3261E")

    fun applyWindow(activity: Activity) {
        val window: Window = activity.window
        window.statusBarColor = canvas
        window.navigationBarColor = canvas
        if (!dark) {
            window.decorView.systemUiVisibility =
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
    }

    fun styleCanvas(view: View) {
        view.setBackgroundColor(canvas)
    }

    fun styleSurface(view: View, strong: Boolean = false) {
        view.background = rounded(
            color = if (strong) surfaceStrong else surface,
            radiusDp = 24,
            strokeColor = outline,
            strokeDp = 1,
        )
    }

    fun styleHeading(view: TextView) {
        view.setTextColor(textPrimary)
        view.textSize = 28f
    }

    fun styleSubheading(view: TextView) {
        view.setTextColor(textPrimary)
        view.textSize = 18f
    }

    fun styleBody(view: TextView) {
        view.setTextColor(textSecondary)
        view.textSize = 15f
    }

    fun styleStatus(view: TextView, isError: Boolean = false) {
        view.setTextColor(if (isError) error else textSecondary)
        view.textSize = 13f
    }

    fun styleEditor(view: EditText) {
        view.setTextColor(textPrimary)
        view.setHintTextColor(textSecondary)
        view.background = rounded(
            color = surfaceStrong,
            radiusDp = 18,
            strokeColor = outline,
            strokeDp = 1,
        )
        view.setPadding(dp(16), dp(12), dp(16), dp(12))
        view.minHeight = dp(GENERAL_TARGET_DP)
    }

    fun stylePrimaryButton(view: Button) {
        view.isAllCaps = false
        view.setTextColor(Color.WHITE)
        view.textSize = 16f
        view.minHeight = dp(PRIMARY_TARGET_DP)
        view.background = rounded(accentStrong, 18, accentStrong, 0)
    }

    fun styleMemoCard(view: LinearLayout) {
        styleSurface(view, strong = false)
        view.setPadding(dp(16), dp(14), dp(16), dp(14))
    }

    fun dp(value: Int): Int =
        (value * context.resources.displayMetrics.density).toInt()

    private fun rounded(
        color: Int,
        radiusDp: Int,
        strokeColor: Int,
        strokeDp: Int,
    ): GradientDrawable =
        GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            setColor(color)
            cornerRadius = dp(radiusDp).toFloat()
            if (strokeDp > 0) setStroke(dp(strokeDp), strokeColor)
        }
}
