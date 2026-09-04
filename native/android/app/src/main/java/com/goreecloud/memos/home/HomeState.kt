package com.goreecloud.memos.home

data class NativeMemoCard(
    val id: String,
    val body: String,
    val pinned: Boolean = false,
)

data class HomeUiState(
    val composerExpanded: Boolean = false,
    val draft: String = "",
    val pendingCaptures: List<String> = emptyList(),
    val memos: List<NativeMemoCard> = emptyList(),
)

object HomeReducer {
    fun expandComposer(state: HomeUiState): HomeUiState = state.copy(composerExpanded = true)

    fun updateDraft(state: HomeUiState, draft: String): HomeUiState = state.copy(draft = draft)

    fun collapseComposer(state: HomeUiState): HomeUiState = state.copy(composerExpanded = false)

    fun beginExternalCapture(state: HomeUiState, sharedText: String?): HomeUiState {
        val incoming = sharedText?.trim().orEmpty()
        if (incoming.isEmpty()) return state.copy(composerExpanded = true)
        if (state.draft.isBlank() && state.pendingCaptures.isEmpty()) {
            return state.copy(composerExpanded = true, draft = incoming)
        }
        if (state.draft.trim() == incoming || incoming in state.pendingCaptures) {
            return state.copy(composerExpanded = true)
        }
        return state.copy(
            composerExpanded = true,
            pendingCaptures = state.pendingCaptures + incoming,
        )
    }

    fun cancelDraft(state: HomeUiState): HomeUiState = advancePending(state)

    fun saveDraft(state: HomeUiState, memoId: String): HomeUiState {
        val body = state.draft.trim()
        if (body.isEmpty()) return state
        val memo = NativeMemoCard(id = memoId, body = body)
        return advancePending(state).copy(memos = listOf(memo) + state.memos)
    }

    fun togglePinned(state: HomeUiState, memoId: String): HomeUiState {
        val updated = state.memos.map { memo ->
            if (memo.id == memoId) memo.copy(pinned = !memo.pinned) else memo
        }
        return state.copy(memos = updated.sortedWith(compareByDescending<NativeMemoCard> { it.pinned }))
    }

    private fun advancePending(state: HomeUiState): HomeUiState {
        val next = state.pendingCaptures.firstOrNull()
        return state.copy(
            composerExpanded = next != null,
            draft = next.orEmpty(),
            pendingCaptures = if (next == null) emptyList() else state.pendingCaptures.drop(1),
        )
    }
}
