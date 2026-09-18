package com.goreecloud.memos

data class MemoRecord(
    val id: String,
    val title: String,
    val body: String,
    val createdAt: Long,
    val updatedAt: Long,
)

data class MemoDraft(
    val title: String = "",
    val body: String = "",
    val updatedAt: Long = 0L,
)

data class MemoLoadResult(
    val records: List<MemoRecord>,
    val recoveredFromBackup: Boolean,
)

data class DraftLoadResult(
    val draft: MemoDraft,
    val recoveredFromBackup: Boolean,
)
