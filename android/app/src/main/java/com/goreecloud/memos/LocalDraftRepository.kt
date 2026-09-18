package com.goreecloud.memos

import java.io.File

class LocalDraftRepository(root: File) {
    private val storage = RecoverableTextFile(root, DRAFT_FILE)

    fun load(): DraftLoadResult {
        val primary = storage.readPrimary()
        if (primary == null) {
            val backup = storage.readBackup()
            return if (backup == null) {
                DraftLoadResult(MemoDraft(), recoveredFromBackup = false)
            } else {
                DraftLoadResult(DraftCodec.decode(backup), recoveredFromBackup = true)
            }
        }

        return try {
            DraftLoadResult(DraftCodec.decode(primary), recoveredFromBackup = false)
        } catch (primaryFailure: RuntimeException) {
            val backup = storage.readBackup() ?: throw primaryFailure
            DraftLoadResult(DraftCodec.decode(backup), recoveredFromBackup = true)
        }
    }

    fun save(
        title: String,
        body: String,
        now: Long = System.currentTimeMillis(),
    ) {
        val loaded = load()
        val draft = MemoDraft(title = title, body = body, updatedAt = now)
        storage.write(
            DraftCodec.encode(draft),
            backupCurrentPrimary = !loaded.recoveredFromBackup,
        )
    }

    fun clear() = storage.clear()

    companion object {
        internal const val DRAFT_FILE = "draft-v1.txt"
    }
}
