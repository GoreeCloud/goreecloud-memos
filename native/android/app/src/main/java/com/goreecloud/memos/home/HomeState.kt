package com.goreecloud.memos.home

data class NativeMemoCard(
    val id: String,
    val body: String,
    val pinned: Boolean = false,
)

data class HomeUiState(
    val composerExpanded: Boolean = false,
    val draft: String = "",
    val memos: List<NativeMemoCard> = emptyList(),
)

object HomeReducer {
    fun expandComposer(state: HomeUiState): HomeUiState = state.copy(composerExpanded = true)

    fun updateDraft(state: HomeUiState, draft: String): HomeUiState = state.copy(draft = draft)

    fun collapseComposer(state: HomeUiState): HomeUiState = state.copy(composerExpanded = false)

    fun cancelDraft(state: HomeUiState): HomeUiState =
        state.copy(composerExpanded = false, draft = "")

    fun saveDraft(state: HomeUiState, memoId: String): HomeUiState {
        val body = state.draft.trim()
        if (body.isEmpty()) return state
        val memo = NativeMemoCard(id = memoId, body = body)
        return state.copy(
            composerExpanded = false,
            draft = "",
            memos = listOf(memo) + state.memos,
        )
    }

    fun togglePinned(state: HomeUiState, memoId: String): HomeUiState {
        val updated = state.memos.map { memo ->
            if (memo.id == memoId) memo.copy(pinned = !memo.pinned) else memo
        }
        return state.copy(memos = updated.sortedWith(compareByDescending<NativeMemoCard> { it.pinned }))
    }
}
