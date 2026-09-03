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
}
