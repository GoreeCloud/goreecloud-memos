package com.goreecloud.memos

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Assert.assertThrows
import org.junit.Test

class LocalMemoRepositoryTest {
    @Test
    fun savedMemoSurvivesRepositoryRecreation() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        val saved = repository.create(
            title = "Quick thought",
            body = "Keep this offline.",
            now = 1234L,
            id = "memo-1",
        )

        val reloaded = LocalMemoRepository(root).load()
        assertFalse(reloaded.recoveredFromBackup)
        assertEquals(listOf(saved), reloaded.records)
    }

    @Test
    fun corruptPrimaryFallsBackToPreviousReadableGeneration() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("First", "one", now = 1L, id = "memo-1")
        repository.create("Second", "two", now = 2L, id = "memo-2")

        File(root, LocalMemoRepository.MEMO_FILE).writeText("not-a-valid-record")

        val recovered = LocalMemoRepository(root).load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals(listOf("memo-1"), recovered.records.map { it.id })
    }

    @Test(expected = IllegalArgumentException::class)
    fun blankMemoIsRejectedWithoutClearingExistingData() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("Existing", "memo", now = 1L, id = "memo-1")

        try {
            repository.create("   ", "", now = 2L, id = "memo-2")
        } finally {
            assertEquals(listOf("memo-1"), LocalMemoRepository(root).load().records.map { it.id })
        }
    }

    @Test
    fun recoveredMemoCreatePreservesReadableBackupInsteadOfCopyingCorruption() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("Earlier", "safe", now = 1L, id = "memo-1")
        repository.create("Later", "primary", now = 2L, id = "memo-2")
        File(root, LocalMemoRepository.MEMO_FILE).writeText("corrupted-primary")

        val recovered = repository.load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals(listOf("memo-1"), recovered.records.map { it.id })

        repository.create("Fresh", "after recovery", now = 3L, id = "memo-3")
        val reloaded = LocalMemoRepository(root).load()
        assertFalse(reloaded.recoveredFromBackup)
        assertEquals(listOf("memo-1", "memo-3"), reloaded.records.map { it.id })

        File(root, LocalMemoRepository.MEMO_FILE).writeText("corrupted-again")
        val secondRecovery = LocalMemoRepository(root).load()
        assertTrue(secondRecovery.recoveredFromBackup)
        assertEquals(listOf("memo-1"), secondRecovery.records.map { it.id })
    }

    @Test
    fun unreadablePrimaryAndBackupRejectLoadAndCreateWithoutOverwritingEither() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("Earlier", "safe", now = 1L, id = "memo-1")
        repository.create("Later", "primary", now = 2L, id = "memo-2")
        val primary = File(root, LocalMemoRepository.MEMO_FILE)
        val backup = File(root, "${LocalMemoRepository.MEMO_FILE}.bak")
        primary.writeText("broken-primary")
        backup.writeText("broken-backup")

        assertThrows(IllegalStateException::class.java) { repository.load() }
        assertThrows(IllegalStateException::class.java) {
            repository.create("Must not save", "unsafe", now = 3L, id = "memo-3")
        }
        assertEquals("broken-primary", primary.readText())
        assertEquals("broken-backup", backup.readText())
    }

    @Test
    fun emptyTruncatedPrimaryRecoversBackupWithoutCopyingDataLoss() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("Earlier", "safe", now = 1L, id = "memo-1")
        repository.create("Later", "primary", now = 2L, id = "memo-2")
        val primary = File(root, LocalMemoRepository.MEMO_FILE)
        primary.writeText("")

        val recovered = repository.load()
        assertTrue(recovered.recoveredFromBackup)
        assertEquals(listOf("memo-1"), recovered.records.map { it.id })

        repository.create("Fresh", "safe", now = 3L, id = "memo-3")
        assertEquals(listOf("memo-1", "memo-3"), LocalMemoRepository(root).load().records.map { it.id })
        primary.writeText("")
        assertEquals(listOf("memo-1"), LocalMemoRepository(root).load().records.map { it.id })
    }

    @Test
    fun emptyPrimaryAndBackupRejectMutationWithoutOverwritingEither() {
        val root = newRoot()
        val repository = LocalMemoRepository(root)
        repository.create("Earlier", "safe", now = 1L, id = "memo-1")
        repository.create("Later", "primary", now = 2L, id = "memo-2")
        val primary = File(root, LocalMemoRepository.MEMO_FILE)
        val backup = File(root, "${LocalMemoRepository.MEMO_FILE}.bak")
        primary.writeText("")
        backup.writeText("\n")

        assertThrows(IllegalStateException::class.java) { repository.load() }
        assertThrows(IllegalStateException::class.java) {
            repository.create("Unsafe", "must fail", now = 3L, id = "memo-3")
        }
        assertEquals("", primary.readText())
        assertEquals("\n", backup.readText())
    }

    private fun newRoot(): File =
        Files.createTempDirectory("goreecloud-memos-test").toFile().apply {
            deleteOnExit()
        }
}
