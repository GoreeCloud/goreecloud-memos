package com.goreecloud.memos

import android.content.Intent
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertTextContains
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.junit4.createAndroidComposeRule
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
            .onNodeWithText("Native Development preview · session-only local state")
            .assertIsDisplayed()
        composeRule.onNodeWithText("Take a memo…").assertIsDisplayed()
    }

    @Test
    fun quickCaptureSavesOneSessionMemo() {
        val memoText = "Emulator acceptance memo"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNode(hasSetTextAction()).performTextInput(memoText)
        composeRule.onNodeWithText("Save").assertIsEnabled().performClick()

        composeRule.onNodeWithText(memoText).assertIsDisplayed()
    }

    @Test
    fun systemBackCollapsesComposerWithoutDiscardingDraft() {
        val draftText = "Draft survives Back"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNode(hasSetTextAction()).performTextInput(draftText)

        composeRule.runOnUiThread {
            composeRule.activity.onBackPressedDispatcher.onBackPressed()
        }
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Draft waiting · Tap to continue").assertIsDisplayed().performClick()
        composeRule.onNode(hasSetTextAction()).assertTextContains(draftText)
    }

    @Test
    fun activityRecreationPreservesCurrentSessionDraft() {
        val draftText = "Draft survives Activity recreation"

        composeRule.onNodeWithText("Take a memo…").performClick()
        composeRule.onNode(hasSetTextAction()).performTextInput(draftText)

        composeRule.activityRule.scenario.recreate()
        composeRule.waitForIdle()

        composeRule.onNode(hasSetTextAction()).assertTextContains(draftText)
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

        composeRule.onNode(hasSetTextAction()).assertTextContains(sharedText)
    }

    @Test
    fun activityRecreationDoesNotReplayConsumedLaunchShare() {
        val sharedText = "Do not replay this consumed share"
        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            setClass(composeRule.activity, MainActivity::class.java)
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, sharedText)
        }

        // Model an Activity that was originally launched from this external share. Deliver the
        // capture into the current Activity, then leave that same launch Intent attached so a
        // framework recreation would see it again through Activity.intent.
        composeRule.runOnUiThread {
            composeRule.activity.setIntent(shareIntent)
            InstrumentationRegistry.getInstrumentation()
                .callActivityOnNewIntent(composeRule.activity, shareIntent)
        }
        composeRule.waitForIdle()
        composeRule.onNode(hasSetTextAction()).assertTextContains(sharedText)
        composeRule.onNodeWithText("Save").assertIsEnabled().performClick()
        composeRule.onNodeWithText(sharedText).assertIsDisplayed()

        composeRule.activityRule.scenario.recreate()
        composeRule.waitForIdle()

        // The existing session memo remains, but the consumed launch share must not be interpreted
        // as a new capture merely because Android recreated the Activity.
        composeRule.onNodeWithText(sharedText).assertIsDisplayed()
        composeRule.onNodeWithText("Take a memo…").assertIsDisplayed()
    }
}
