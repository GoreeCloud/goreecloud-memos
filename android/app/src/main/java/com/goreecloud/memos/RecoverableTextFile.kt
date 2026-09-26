package com.goreecloud.memos

import java.io.File
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets
import java.nio.file.AtomicMoveNotSupportedException
import java.nio.file.Files
import java.nio.file.StandardCopyOption

internal class RecoverableTextFile(
    private val root: File,
    baseName: String,
) {
    private val primary = File(root, baseName)
    private val backup = File(root, "$baseName.bak")
    private val temporary = File(root, "$baseName.tmp")
    private val backupTemporary = File(root, "$baseName.bak.tmp")

    fun readPrimary(): String? =
        primary.takeIf { it.isFile }?.readText(StandardCharsets.UTF_8)

    fun readBackup(): String? =
        backup.takeIf { it.isFile }?.readText(StandardCharsets.UTF_8)

    fun write(content: String, backupCurrentPrimary: Boolean = true) {
        ensureRoot()
        writeSynced(temporary, content.toByteArray(StandardCharsets.UTF_8))

        if (backupCurrentPrimary && primary.isFile) {
            primary.inputStream().use { input ->
                FileOutputStream(backupTemporary).use { output ->
                    input.copyTo(output)
                    output.fd.sync()
                }
            }
            replaceStagedFile(backupTemporary, backup)
        }

        replaceStagedFile(temporary, primary)
    }

    fun clear() {
        primary.delete()
        backup.delete()
        temporary.delete()
        backupTemporary.delete()
    }

    private fun writeSynced(target: File, bytes: ByteArray) {
        FileOutputStream(target).use { output ->
            output.write(bytes)
            output.fd.sync()
        }
    }

    private fun replaceStagedFile(source: File, target: File) {
        try {
            Files.move(
                source.toPath(),
                target.toPath(),
                StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING,
            )
        } catch (_: AtomicMoveNotSupportedException) {
            Files.move(
                source.toPath(),
                target.toPath(),
                StandardCopyOption.REPLACE_EXISTING,
            )
        }

        // Re-open and sync the promoted inode. The staged source was already
        // synced before the move; this additionally reduces the window where
        // a promoted generation exists only in dirty filesystem state.
        FileOutputStream(target, true).use { output ->
            output.fd.sync()
        }
    }

    private fun ensureRoot() {
        if (!root.exists() && !root.mkdirs()) {
            error("Unable to create local Memos data directory.")
        }
        require(root.isDirectory) { "Local Memos data root is not a directory." }
    }
}
