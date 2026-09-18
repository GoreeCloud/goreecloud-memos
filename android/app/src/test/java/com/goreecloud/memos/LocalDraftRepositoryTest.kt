package com.goreecloud.memos

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
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

    private fun newRoot(): File =
        Files.createTempDirectory("goreecloud-memos-draft-test").toFile().apply {
            deleteOnExit()
        }
}
