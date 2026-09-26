package com.goreecloud.memos

import android.content.Context

internal class MemosOnboardingPreferences(context: Context) {
    private val preferences =
        context.getSharedPreferences(NAME, Context.MODE_PRIVATE)

    fun isComplete(): Boolean =
        preferences.getBoolean(KEY_COMPLETE, false)

    fun currentStep(): Int =
        preferences.getInt(KEY_STEP, 0).coerceIn(0, STEP_COUNT - 1)

    fun setCurrentStep(step: Int) {
        preferences.edit()
            .putInt(KEY_STEP, step.coerceIn(0, STEP_COUNT - 1))
            .apply()
    }

    fun markComplete() {
        preferences.edit()
            .putBoolean(KEY_COMPLETE, true)
            .putInt(KEY_STEP, 0)
            .apply()
    }

    fun hintsEnabled(): Boolean =
        preferences.getBoolean(KEY_HINTS_ENABLED, true)

    fun setHintsEnabled(enabled: Boolean) {
        preferences.edit()
            .putBoolean(KEY_HINTS_ENABLED, enabled)
            .apply()
    }

    companion object {
        internal const val NAME = "goreecloud_memos_onboarding"
        internal const val STEP_COUNT = 3

        private const val KEY_COMPLETE = "setup_complete"
        private const val KEY_STEP = "setup_step"
        private const val KEY_HINTS_ENABLED = "contextual_hints_enabled"
    }
}
