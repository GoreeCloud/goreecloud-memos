package com.goreecloud.memos

import java.io.File
import java.util.UUID

class LocalMemoRepository(root: File) {
    private val storage = RecoverableTextFile(root, MEMO_FILE)

    fun load(): MemoLoadResult {
        val primary = try {
            storage.readPrimary()
        } catch (primaryFailure: Exception) {
            return recoverFromBackup(primaryFailure)
        }

        if (primary == null) {
            val backup = storage.readBackup()
            return if (backup == null) {
                MemoLoadResult(emptyList(), recoveredFromBackup = false)
            } else {
                check(backup.isNotBlank()) { "Previous memo generation is empty; refusing unsafe recovery." }
                MemoLoadResult(MemoCodec.decode(backup), recoveredFromBackup = true)
            }
        }

        if (primary.isBlank()) {
            return recoverFromBackup(IllegalStateException("Primary memo generation is empty."))
        }

        return try {
            MemoLoadResult(MemoCodec.decode(primary), recoveredFromBackup = false)
        } catch (primaryFailure: Exception) {
            recoverFromBackup(primaryFailure)
        }
    }

    private fun recoverFromBackup(primaryFailure: Exception): MemoLoadResult {
        val backup = try {
            storage.readBackup()
        } catch (backupFailure: Exception) {
            primaryFailure.addSuppressed(backupFailure)
            throw IllegalStateException("Primary and backup memo data could not be read.", primaryFailure)
        } ?: throw IllegalStateException(
            "Primary memo data could not be read and no previous generation is available.",
            primaryFailure,
        )

        return try {
            check(backup.isNotBlank()) { "Previous memo generation is empty." }
            MemoLoadResult(MemoCodec.decode(backup), recoveredFromBackup = true)
        } catch (backupFailure: Exception) {
            primaryFailure.addSuppressed(backupFailure)
            throw IllegalStateException("Primary and backup memo data are unreadable.", primaryFailure)
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
