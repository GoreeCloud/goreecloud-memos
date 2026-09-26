package com.goreecloud.memos

import java.io.File
import java.nio.file.Files
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Test

class RecoverableTextFileTest {
    @Test
    fun writePromotesNewPrimaryAndRetainsPreviousGeneration() {
        val root = newRoot()
        val storage = RecoverableTextFile(root, "state.txt")

        storage.write("first")
        assertEquals("first", storage.readPrimary())
        assertNull(storage.readBackup())

        storage.write("second")
        assertEquals("second", storage.readPrimary())
        assertEquals("first", storage.readBackup())
        assertFalse(File(root, "state.txt.tmp").exists())
        assertFalse(File(root, "state.txt.bak.tmp").exists())
    }

    @Test
    fun writeWithoutBackupPromotionPreservesExistingReadableBackup() {
        val root = newRoot()
        val storage = RecoverableTextFile(root, "state.txt")

        storage.write("first")
        storage.write("second")
        storage.write("recovered", backupCurrentPrimary = false)

        assertEquals("recovered", storage.readPrimary())
        assertEquals("first", storage.readBackup())
    }

    @Test
    fun staleStagingFilesAreReplacedAndCleaned() {
        val root = newRoot()
        val storage = RecoverableTextFile(root, "state.txt")
        File(root, "state.txt.tmp").writeText("stale-primary-stage")
        File(root, "state.txt.bak.tmp").writeText("stale-backup-stage")

        storage.write("first")
        storage.write("second")

        assertEquals("second", storage.readPrimary())
        assertEquals("first", storage.readBackup())
        assertFalse(File(root, "state.txt.tmp").exists())
        assertFalse(File(root, "state.txt.bak.tmp").exists())
    }

    @Test
    fun clearRemovesAllGenerationsAndStagingFiles() {
        val root = newRoot()
        val storage = RecoverableTextFile(root, "state.txt")
        storage.write("first")
        storage.write("second")
        File(root, "state.txt.tmp").writeText("stale-primary-stage")
        File(root, "state.txt.bak.tmp").writeText("stale-backup-stage")

        storage.clear()

        assertNull(storage.readPrimary())
        assertNull(storage.readBackup())
        assertFalse(File(root, "state.txt.tmp").exists())
        assertFalse(File(root, "state.txt.bak.tmp").exists())
    }

    private fun newRoot(): File =
        Files.createTempDirectory("goreecloud-memos-recoverable-file-test").toFile().apply {
            deleteOnExit()
        }
}
