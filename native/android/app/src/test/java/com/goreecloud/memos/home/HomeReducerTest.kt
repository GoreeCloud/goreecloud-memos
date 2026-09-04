package com.goreecloud.memos.home

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HomeReducerTest {
    @Test
    fun saveTrimsDraftPrependsMemoAndClosesComposer() {
        val state = HomeUiState(composerExpanded = true, draft = "  native memo  ")

        val result = HomeReducer.saveDraft(state, "session-1")

        assertFalse(result.composerExpanded)
        assertEquals("", result.draft)
        assertEquals(listOf(NativeMemoCard("session-1", "native memo")), result.memos)
    }

    @Test
    fun blankSaveDoesNotCreateMemo() {
        val state = HomeUiState(composerExpanded = true, draft = "   ")

        assertEquals(state, HomeReducer.saveDraft(state, "session-1"))
    }

    @Test
    fun collapsePreservesDraftForNativeBackReentry() {
        val state = HomeUiState(composerExpanded = true, draft = "keep this draft")

        val result = HomeReducer.collapseComposer(state)

        assertFalse(result.composerExpanded)
        assertEquals("keep this draft", result.draft)
    }

    @Test
    fun cancelExplicitlyClearsDraft() {
        val state = HomeUiState(composerExpanded = true, draft = "discard me")

        val result = HomeReducer.cancelDraft(state)

        assertFalse(result.composerExpanded)
        assertEquals("", result.draft)
    }

    @Test
    fun pinningMovesMemoIntoPinnedPriorityWithoutChangingContent() {
        val state = HomeUiState(
            memos = listOf(
                NativeMemoCard("one", "first"),
                NativeMemoCard("two", "second"),
            ),
        )

        val result = HomeReducer.togglePinned(state, "two")

        assertTrue(result.memos.first().pinned)
        assertEquals("two", result.memos.first().id)
        assertEquals("second", result.memos.first().body)
    }

    @Test
    fun sharedTextPopulatesBlankDraftAndOpensComposer() {
        val result = HomeReducer.beginExternalCapture(HomeUiState(), " shared thought ")

        assertTrue(result.composerExpanded)
        assertEquals("shared thought", result.draft)
        assertTrue(result.pendingCaptures.isEmpty())
    }

    @Test
    fun sharedTextNeverOverwritesExistingDraft() {
        val state = HomeUiState(composerExpanded = true, draft = "my draft")

        val result = HomeReducer.beginExternalCapture(state, "shared thought")

        assertEquals("my draft", result.draft)
        assertEquals(listOf("shared thought"), result.pendingCaptures)
    }

    @Test
    fun savingCurrentDraftPromotesQueuedSharedCapture() {
        val state = HomeUiState(
            composerExpanded = true,
            draft = "current draft",
            pendingCaptures = listOf("shared next"),
        )

        val result = HomeReducer.saveDraft(state, "session-1")

        assertTrue(result.composerExpanded)
        assertEquals("shared next", result.draft)
        assertTrue(result.pendingCaptures.isEmpty())
        assertEquals("current draft", result.memos.single().body)
    }

    @Test
    fun cancelingCurrentDraftPromotesQueuedSharedCaptureInsteadOfDroppingIt() {
        val state = HomeUiState(
            composerExpanded = true,
            draft = "discard current",
            pendingCaptures = listOf("shared next"),
        )

        val result = HomeReducer.cancelDraft(state)

        assertTrue(result.composerExpanded)
        assertEquals("shared next", result.draft)
        assertTrue(result.pendingCaptures.isEmpty())
    }

    @Test
    fun repeatedSharedPayloadIsNotQueuedTwice() {
        val state = HomeUiState(
            composerExpanded = true,
            draft = "current",
            pendingCaptures = listOf("shared"),
        )

        val result = HomeReducer.beginExternalCapture(state, "shared")

        assertEquals(listOf("shared"), result.pendingCaptures)
    }
}
