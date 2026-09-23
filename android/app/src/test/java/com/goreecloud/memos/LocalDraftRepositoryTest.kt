package com.goreecloud.memos

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.assertThrows
import org.junit.Test

class LocalDraftRepositoryTest {
    @Test
    fun draftSurvivesRepositoryRecreationAndCanBeCleared() {
        val root = newRoot()
        LocalDraftRepository(root).save("Title", "Body", now = 55L)

        val loaded = LocalDraftRepository(root).load()
        assertFalse(loaded.recoveredFromBackup)
        assertEquals(MemoDraft("Title", "Body", 55L), loaded.draft)

        LocalDraftRepository(root).clear()
        assertEquals(MemoDraft(), LocalDraftRepository(root).load().draft)
    }

    @Test
    fun corruptPrimaryFallsBackToPreviousDraftGeneration() {
        val root = newRoot()
        val repository = LocalDraftRepository(root)
        repository.save("First", "draft", now = 1L)
        repository.save("Second", "draft", now = 2L)

        File(root, LocalDraftRepository.DRAFT_FILE).writeText("corrupt")

        val recovered = LocalDraftRepository(root).load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals(MemoDraft("First", "draft", 1L), recovered.draft)
    }

    @Test
    fun recoveredDraftSavePreservesReadableBackupInsteadOfCopyingCorruption() {
        val root = newRoot()
        val repository = LocalDraftRepository(root)
        repository.save("Earlier", "safe", now = 1L)
        repository.save("Later", "primary", now = 2L)
        File(root, LocalDraftRepository.DRAFT_FILE).writeText("corrupted-primary")

        val recovered = repository.load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals("Earlier", recovered.draft.title)

        repository.save("Fresh", "after recovery", now = 3L)
        val reloaded = LocalDraftRepository(root).load()
        assertFalse(reloaded.recoveredFromBackup)
        assertEquals(MemoDraft("Fresh", "after recovery", 3L), reloaded.draft)

        File(root, LocalDraftRepository.DRAFT_FILE).writeText("corrupted-again")
        val secondRecovery = LocalDraftRepository(root).load()
        assertTrue(secondRecovery.recoveredFromBackup)
        assertEquals(MemoDraft("Earlier", "safe", 1L), secondRecovery.draft)
    }

    @Test
    fun unreadablePrimaryAndBackupRejectLoadAndSaveWithoutOverwritingEither() {
        val root = newRoot()
        val repository = LocalDraftRepository(root)
        repository.save("Earlier", "safe", now = 1L)
        repository.save("Later", "primary", now = 2L)
        val primary = File(root, LocalDraftRepository.DRAFT_FILE)
        val backup = File(root, "${LocalDraftRepository.DRAFT_FILE}.bak")
        primary.writeText("broken-primary")
        backup.writeText("broken-backup")

        assertThrows(IllegalStateException::class.java) { repository.load() }
        assertThrows(IllegalStateException::class.java) {
            repository.save("Must not save", "unsafe", now = 3L)
        }
        assertEquals("broken-primary", primary.readText())
        assertEquals("broken-backup", backup.readText())
    }

    @Test
    fun emptyTruncatedPrimaryRecoversDraftBackupWithoutCopyingDataLoss() {
        val root = newRoot()
        val repository = LocalDraftRepository(root)
        repository.save("Earlier", "safe", now = 1L)
        repository.save("Later", "primary", now = 2L)
        val primary = File(root, LocalDraftRepository.DRAFT_FILE)
        primary.writeText("")

        val recovered = repository.load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals(MemoDraft("Earlier", "safe", 1L), recovered.draft)

        repository.save("Fresh", "safe", now = 3L)
        assertEquals(MemoDraft("Fresh", "safe", 3L), LocalDraftRepository(root).load().draft)
        primary.writeText("")
        assertEquals(MemoDraft("Earlier", "safe", 1L), LocalDraftRepository(root).load().draft)
    }

    @Test
    fun emptyPrimaryAndBackupRejectDraftMutationWithoutOverwritingEither() {
        val root = newRoot()
        val repository = LocalDraftRepository(root)
        repository.save("Earlier", "safe", now = 1L)
        repository.save("Later", "primary", now = 2L)
        val primary = File(root, LocalDraftRepository.DRAFT_FILE)
        val backup = File(root, "${LocalDraftRepository.DRAFT_FILE}.bak")
        primary.writeText("")
        backup.writeText("\n")

        assertThrows(IllegalStateException::class.java) { repository.load() }
        assertThrows(IllegalStateException::class.java) {
            repository.save("Unsafe", "must fail", now = 3L)
        }
        assertEquals("", primary.readText())
        assertEquals("\n", backup.readText())
    }

    private fun newRoot(): File =
        Files.createTempDirectory("goreecloud-memos-draft-test").toFile().apply {
            deleteOnExit()
        }
}
