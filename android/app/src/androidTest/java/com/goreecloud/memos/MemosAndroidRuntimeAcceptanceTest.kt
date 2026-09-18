package com.goreecloud.memos

import android.Manifest
import android.content.Context
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Managed-emulator acceptance for the local-only Android Development foundation.
 *
 * This does not establish synchronization, accounts/Identity, backup/recovery,
 * attachments, reminders, sharing, widgets, biometric lock, production signing,
 * Release Candidate qualification, or Stable acceptance.
 */
@RunWith(AndroidJUnit4::class)
class MemosAndroidRuntimeAcceptanceTest {
    private val context: Context
        get() = ApplicationProvider.getApplicationContext()

    @Before
    fun clearLocalDevelopmentState() {
        context.filesDir.listFiles().orEmpty().forEach { it.deleteRecursively() }
    }

    @Test
    fun launchPreservesLocalOnlyBoundaryAndNoNetworkAuthority() {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0x00001000)
        val requestedPermissions = packageInfo.requestedPermissions.orEmpty().toSet()
        assertFalse(requestedPermissions.contains(Manifest.permission.INTERNET))

        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                val visibleText = collectText(activity.window.decorView)
                assertTrue(visibleText.any { it.contains("Open → type → save locally.") })
                assertTrue(visibleText.any { it.contains("Local only") })
                assertTrue(visibleText.any { it.contains("Sync not configured") })
                assertTrue(visibleText.any { it.contains("No locally saved memos yet.") })
                assertTrue(visibleText.any { it.contains("Save locally") })

                val headings = collectViews(activity.window.decorView)
                    .filterIsInstance<TextView>()
                    .filter { it.isAccessibilityHeading }
                    .map { it.text?.toString().orEmpty() }
                    .toSet()
                assertTrue(headings.contains("Memos"))
                assertTrue(headings.contains("Saved locally"))
            }
        }
    }

    @Test
    fun draftSurvivesActivityRecreation() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                findEditText(activity.window.decorView, "Memo title").setText("Recreation title")
                findEditText(activity.window.decorView, "Memo body").setText("Recreation body")
            }

            scenario.recreate()

            scenario.onActivity { activity ->
                assertEquals(
                    "Recreation title",
                    findEditText(activity.window.decorView, "Memo title").text.toString(),
                )
                assertEquals(
                    "Recreation body",
                    findEditText(activity.window.decorView, "Memo body").text.toString(),
                )
                val visibleText = collectText(activity.window.decorView)
                assertTrue(visibleText.any { it.contains("Sync not configured") })
            }
        }
    }

    @Test
    fun locallySavedMemoSurvivesActivityRecreation() {
        ActivityScenario.launch(MainActivity::class.java).use { scenario ->
            scenario.onActivity { activity ->
                findEditText(activity.window.decorView, "Memo title").setText("Saved title")
                findEditText(activity.window.decorView, "Memo body").setText("Saved body")
                findButton(activity.window.decorView, "Save memo locally").performClick()
            }

            scenario.recreate()

            scenario.onActivity { activity ->
                val visibleText = collectText(activity.window.decorView)
                assertTrue(visibleText.any { it == "Saved title" })
                assertTrue(visibleText.any { it == "Saved body" })
                assertTrue(visibleText.any { it.contains("Sync not configured") })
            }
        }
    }

    private fun findEditText(root: View, description: String): EditText =
        collectViews(root)
            .filterIsInstance<EditText>()
            .first { it.contentDescription?.toString() == description }

    private fun findButton(root: View, description: String): Button =
        collectViews(root)
            .filterIsInstance<Button>()
            .first { it.contentDescription?.toString() == description }

    private fun collectViews(view: View): List<View> = when (view) {
        is ViewGroup -> buildList {
            add(view)
            repeat(view.childCount) { index -> addAll(collectViews(view.getChildAt(index))) }
        }
        else -> listOf(view)
    }

    private fun collectText(view: View): List<String> = when (view) {
        is TextView -> listOf(view.text?.toString().orEmpty())
        is ViewGroup -> buildList {
            repeat(view.childCount) { index -> addAll(collectText(view.getChildAt(index))) }
        }
        else -> emptyList()
    }
}
