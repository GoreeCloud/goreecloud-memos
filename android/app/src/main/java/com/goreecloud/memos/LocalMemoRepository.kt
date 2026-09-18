package com.goreecloud.memos

import java.io.File
import java.util.UUID

class LocalMemoRepository(root: File) {
    private val storage = RecoverableTextFile(root, MEMO_FILE)

    fun load(): MemoLoadResult {
        val primary = storage.readPrimary()
        if (primary == null) {
            val backup = storage.readBackup()
            return if (backup == null) {
                MemoLoadResult(emptyList(), recoveredFromBackup = false)
            } else {
                MemoLoadResult(MemoCodec.decode(backup), recoveredFromBackup = true)
            }
        }

        return try {
            MemoLoadResult(MemoCodec.decode(primary), recoveredFromBackup = false)
        } catch (primaryFailure: RuntimeException) {
            val backup = storage.readBackup() ?: throw primaryFailure
            MemoLoadResult(MemoCodec.decode(backup), recoveredFromBackup = true)
        }
    }

    fun create(
        title: String,
        body: String,
        now: Long = System.currentTimeMillis(),
        id: String = UUID.randomUUID().toString(),
    ): MemoRecord {
        val normalizedTitle = title.trim().take(MAX_TITLE_CHARS)
        val normalizedBody = body.trimEnd()
        require(normalizedTitle.isNotBlank() || normalizedBody.isNotBlank()) {
            "A memo needs a title or body."
        }

        val loaded = load()
        val record = MemoRecord(
            id = id,
            title = normalizedTitle,
            body = normalizedBody,
            createdAt = now,
            updatedAt = now,
        )
        val updated = loaded.records + record

        storage.write(
            MemoCodec.encode(updated),
            backupCurrentPrimary = !loaded.recoveredFromBackup,
        )
        return record
    }

    companion object {
        internal const val MEMO_FILE = "memos-v1.txt"
        private const val MAX_TITLE_CHARS = 200
    }
}
