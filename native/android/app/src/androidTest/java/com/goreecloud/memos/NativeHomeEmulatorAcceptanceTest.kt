package com.goreecloud.memos

import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class NativeHomeEmulatorAcceptanceTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun launchShowsNativeDevelopmentBoundaryAndQuickCapture() {
        composeRule.onNodeWithText("Memos").assertIsDisplayed()
        composeRule
            .onNodeWithText("Native Development preview · saved cards stay on-device · drafts/shares stay session-only")
            .assertIsDisplayed()
        composeRule.onNodeWithText("Take a memo…").assertIsDisplayed()
    }

    @Test
    fun quickCaptureSavesOneLocalMemo() {
        val memoText = "Emulator acceptance memo"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNodeWithTag("memo-composer").performTextInput(memoText)
        composeRule.onNodeWithText("Save").assertIsEnabled().performClick()

        composeRule.onNodeWithText(memoText).assertIsDisplayed()
    }

    @Test
    fun systemBackCollapsesComposerWithoutDiscardingDraft() {
        val draftText = "Draft survives Back"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNodeWithTag("memo-composer").performTextInput(draftText)

        composeRule.runOnUiThread {
            composeRule.activity.onBackPressedDispatcher.onBackPressed()
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Draft waiting · Tap to continue").assertIsDisplayed().performClick()
        composeRule.onNodeWithTag("memo-composer").assertTextContains(draftText)
    }

    @Test
    fun activityRecreationPreservesCurrentProcessDraft() {
        val draftText = "Draft survives Activity recreation"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNodeWithTag("memo-composer").performTextInput(draftText)

        composeRule.activityRule.scenario.recreate()
        composeRule.waitForIdle()

        composeRule.onNodeWithTag("memo-composer").assertTextContains(draftText)
    }

    @Test
    fun textShareIntentEntersTheNativeComposer() {
        val sharedText = "Shared into native Memos"
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            setClass(composeRule.activity, MainActivity::class.java)
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, sharedText)
        }

        composeRule.runOnUiThread {
            InstrumentationRegistry.getInstrumentation()
                .callActivityOnNewIntent(composeRule.activity, shareIntent)
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithTag("memo-composer").assertTextContains(sharedText)
    }
}
