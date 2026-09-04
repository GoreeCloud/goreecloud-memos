package com.goreecloud.memos.home

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel

/**
 * Activity-scoped Development state holder for the first native Home/Capture slices.
 *
 * It deliberately has no repository, server, Identity, sync, or durable-storage authority.
 */
class HomeViewModel : ViewModel() {
    private var nextMemoId = 1L

    var uiState by mutableStateOf(HomeUiState())
        private set

    fun expandComposer() {
        uiState = HomeReducer.expandComposer(uiState)
    }

    fun beginExternalCapture(text: String?) {
        uiState = HomeReducer.beginExternalCapture(uiState, text)
    }

    fun updateDraft(draft: String) {
        uiState = HomeReducer.updateDraft(uiState, draft)
    }

    fun collapseComposer() {
        uiState = HomeReducer.collapseComposer(uiState)
    }

    fun cancelDraft() {
        uiState = HomeReducer.cancelDraft(uiState)
    }

    fun saveDraft() {
        uiState = HomeReducer.saveDraft(uiState, "session-${nextMemoId++}")
    }

    fun togglePinned(memoId: String) {
        uiState = HomeReducer.togglePinned(uiState, memoId)
    }
}
