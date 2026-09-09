package com.goreecloud.memos.home

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import java.io.File
import java.util.UUID

/**
 * Activity-scoped native Home/Capture state holder.
 *
 * Explicitly saved cards are persisted to one bounded app-private atomic store. Draft text and
 * queued Android share payloads remain process-memory only. This class still has no server,
 * GoreeCloud Identity, sync, attachment, migration, or production memo-library authority.
 */
class HomeViewModel(application: Application) : AndroidViewModel(application) {
    private val localStore = NativeMemoLocalStore(
        File(application.filesDir, "goreecloud-memos-native-saved-v1.store")
    )
    private var storageRecoveryRequired = false

    var uiState by mutableStateOf(loadInitialState())
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
        val candidate = HomeReducer.saveDraft(uiState, "local-${UUID.randomUUID()}")
        if (candidate === uiState || candidate == uiState) return
        persistCandidate(candidate)
    }

    fun togglePinned(memoId: String) {
        val candidate = HomeReducer.togglePinned(uiState, memoId)
        if (candidate.memos == uiState.memos) return
        persistCandidate(candidate)
    }

    private fun loadInitialState(): HomeUiState = when (val loaded = localStore.load()) {
        is NativeMemoStoreLoadResult.Loaded -> HomeUiState(memos = loaded.memos)
        is NativeMemoStoreLoadResult.RecoveryRequired -> {
            storageRecoveryRequired = true
            HomeUiState(
                storageIssue = "Saved memo storage needs recovery before it can be changed."
            )
        }
    }

    private fun persistCandidate(candidate: HomeUiState) {
        if (storageRecoveryRequired) {
            uiState = uiState.copy(
                storageIssue = "Saved memo storage needs recovery before it can be changed."
            )
            return
        }
        if (localStore.replace(candidate.memos)) {
            uiState = candidate.copy(storageIssue = null)
        } else {
            uiState = uiState.copy(
                storageIssue = "Memos could not safely write saved cards to local storage. Try again."
            )
        }
    }
}
