package com.goreecloud.memos

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
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

    private fun newRoot(): File =
        Files.createTempDirectory("goreecloud-memos-test").toFile().apply {
            deleteOnExit()
        }
}
