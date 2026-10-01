package com.goreecloud.memos

import java.io.File

class LocalDraftRepository(root: File) {
    private val storage = RecoverableTextFile(root, DRAFT_FILE)

    fun load(): DraftLoadResult {
        val primary = try {
            storage.readPrimary()
        } catch (primaryFailure: Exception) {
            return recoverFromBackup(primaryFailure)
        }

        if (primary == null) {
            val backup = storage.readBackup()
            return if (backup == null) {
                DraftLoadResult(MemoDraft(), recoveredFromBackup = false)
            } else {
                check(backup.isNotBlank()) { "Previous draft generation is empty; refusing unsafe recovery." }
                DraftLoadResult(DraftCodec.decode(backup), recoveredFromBackup = true)
            }
        }

        if (primary.isBlank()) {
            return recoverFromBackup(IllegalStateException("Primary draft generation is empty."))
        }

        return try {
            DraftLoadResult(DraftCodec.decode(primary), recoveredFromBackup = false)
        } catch (primaryFailure: Exception) {
            recoverFromBackup(primaryFailure)
        }
    }

    private fun recoverFromBackup(primaryFailure: Exception): DraftLoadResult {
        val backup = try {
            storage.readBackup()
        } catch (backupFailure: Exception) {
            primaryFailure.addSuppressed(backupFailure)
            throw IllegalStateException("Primary and backup draft data could not be read.", primaryFailure)
        } ?: throw IllegalStateException(
            "Primary draft data could not be read and no previous generation is available.",
            primaryFailure,
        )

        return try {
            check(backup.isNotBlank()) { "Previous draft generation is empty." }
            DraftLoadResult(DraftCodec.decode(backup), recoveredFromBackup = true)
        } catch (backupFailure: Exception) {
            primaryFailure.addSuppressed(backupFailure)
            throw IllegalStateException("Primary and backup draft data are unreadable.", primaryFailure)
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
