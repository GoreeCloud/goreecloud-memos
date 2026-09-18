package com.goreecloud.memos

import java.io.File
import java.io.FileOutputStream
import java.nio.charset.StandardCharsets

internal class RecoverableTextFile(
    private val root: File,
    baseName: String,
) {
    private val primary = File(root, baseName)
    private val backup = File(root, "$baseName.bak")
    private val temporary = File(root, "$baseName.tmp")

    fun readPrimary(): String? =
        primary.takeIf { it.isFile }?.readText(StandardCharsets.UTF_8)

    fun readBackup(): String? =
        backup.takeIf { it.isFile }?.readText(StandardCharsets.UTF_8)

    fun write(content: String, backupCurrentPrimary: Boolean = true) {
        ensureRoot()

        FileOutputStream(temporary).use { output ->
            output.write(content.toByteArray(StandardCharsets.UTF_8))
            output.fd.sync()
        }

        if (backupCurrentPrimary && primary.isFile) {
            primary.copyTo(backup, overwrite = true)
        }

        if (primary.exists() && !primary.delete()) {
            temporary.delete()
            error("Unable to replace local Memos data file.")
        }

        if (!temporary.renameTo(primary)) {
            temporary.copyTo(primary, overwrite = true)
            temporary.delete()
        }
    }

    fun clear() {
        primary.delete()
        backup.delete()
        temporary.delete()
    }

    private fun ensureRoot() {
        if (!root.exists() && !root.mkdirs()) {
            error("Unable to create local Memos data directory.")
        }
        require(root.isDirectory) { "Local Memos data root is not a directory." }
    }
}
