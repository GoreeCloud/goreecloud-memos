package com.goreecloud.memos.home

import android.util.AtomicFile
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.charset.CodingErrorAction
import java.nio.charset.StandardCharsets
import java.util.Base64

sealed interface NativeMemoStoreLoadResult {
    data class Loaded(val memos: List<NativeMemoCard>) : NativeMemoStoreLoadResult
    data class RecoveryRequired(val reason: String) : NativeMemoStoreLoadResult
}

/**
 * App-private, versioned, bounded saved-card persistence for the native Development client.
 *
 * Drafts and queued Android shares deliberately do not cross this boundary. The store has no
 * network, server, Identity, backup, migration, or production memo-library authority.
 */
class NativeMemoLocalStore(
    private val file: File,
) {
    private val atomicFile = AtomicFile(file)

    fun load(): NativeMemoStoreLoadResult {
        if (!file.exists()) return NativeMemoStoreLoadResult.Loaded(emptyList())
        return try {
            val bytes = atomicFile.openRead().use(::readBounded)
            NativeMemoStoreLoadResult.Loaded(NativeMemoPersistenceCodec.decode(bytes))
        } catch (exception: Exception) {
            NativeMemoStoreLoadResult.RecoveryRequired(exception::class.java.simpleName)
        }
    }

    fun replace(memos: List<NativeMemoCard>): Boolean {
        val encoded = try {
            NativeMemoPersistenceCodec.encode(memos)
        } catch (_: IllegalArgumentException) {
            return false
        }

        file.parentFile?.mkdirs()
        var output: FileOutputStream? = null
        return try {
            output = atomicFile.startWrite()
            output.write(encoded)
            output.fd.sync()
            atomicFile.finishWrite(output)
            output = null
            true
        } catch (_: Exception) {
            output?.let(atomicFile::failWrite)
            false
        }
    }

    private fun readBounded(input: java.io.InputStream): ByteArray {
        val buffer = ByteArray(16 * 1024)
        val output = java.io.ByteArrayOutputStream()
        while (true) {
            val count = input.read(buffer)
            if (count < 0) break
            output.write(buffer, 0, count)
            require(output.size() <= NativeMemoPersistenceCodec.MAX_FILE_BYTES) {
                "saved memo store exceeds the supported size bound"
            }
        }
        return output.toByteArray()
    }
}

/**
 * Pure codec kept independent from Android storage APIs so corruption and size handling are covered
 * by ordinary JVM tests. The wire format is intentionally simple and private to this Development
 * package: one ASCII header plus canonical Base64-encoded id/body records.
 */
object NativeMemoPersistenceCodec {
    const val MAX_MEMOS = 5_000
    const val MAX_ID_BYTES = 512
    const val MAX_BODY_BYTES = 1_048_576
    const val MAX_FILE_BYTES = 16 * 1024 * 1024

    private const val HEADER = "GCMEMOS\t1"
    private val encoder = Base64.getEncoder()
    private val decoder = Base64.getDecoder()

    fun encode(memos: List<NativeMemoCard>): ByteArray {
        validateMemoSet(memos)
        val builder = StringBuilder(HEADER).append('\n')
        for (memo in memos) {
            val encodedId = encoder.encodeToString(memo.id.toByteArray(StandardCharsets.UTF_8))
            val encodedBody = encoder.encodeToString(memo.body.toByteArray(StandardCharsets.UTF_8))
            builder
                .append(encodedId)
                .append('\t')
                .append(if (memo.pinned) '1' else '0')
                .append('\t')
                .append(encodedBody)
                .append('\n')
            require(builder.length <= MAX_FILE_BYTES) {
                "saved memo store exceeds the supported size bound"
            }
        }
        return builder.toString().toByteArray(StandardCharsets.US_ASCII)
    }

    fun decode(bytes: ByteArray): List<NativeMemoCard> {
        require(bytes.size <= MAX_FILE_BYTES) { "saved memo store exceeds the supported size bound" }
        require(bytes.all { it.toInt() in 0..127 }) { "saved memo store is not canonical ASCII" }
        val lines = String(bytes, StandardCharsets.US_ASCII).split('\n')
        require(lines.isNotEmpty() && lines.first() == HEADER) { "unsupported saved memo store format" }
        require(lines.drop(1).dropLastWhile { it.isEmpty() }.none { it.isEmpty() }) {
            "saved memo store contains an empty record"
        }

        val records = lines.drop(1).dropLastWhile { it.isEmpty() }
        require(records.size <= MAX_MEMOS) { "saved memo store exceeds the memo-count bound" }
        val memos = records.map { line ->
            val fields = line.split('\t')
            require(fields.size == 3) { "saved memo record has an invalid field count" }
            val id = decodeUtf8(fields[0], MAX_ID_BYTES)
            val pinned = when (fields[1]) {
                "0" -> false
                "1" -> true
                else -> throw IllegalArgumentException("saved memo pin state is invalid")
            }
            val body = decodeUtf8(fields[2], MAX_BODY_BYTES)
            NativeMemoCard(id = id, body = body, pinned = pinned)
        }
        validateMemoSet(memos)
        return memos
    }

    private fun validateMemoSet(memos: List<NativeMemoCard>) {
        require(memos.size <= MAX_MEMOS) { "saved memo set exceeds the memo-count bound" }
        val ids = HashSet<String>(memos.size)
        memos.forEach { memo ->
            val idBytes = memo.id.toByteArray(StandardCharsets.UTF_8)
            val bodyBytes = memo.body.toByteArray(StandardCharsets.UTF_8)
            require(memo.id.isNotBlank()) { "saved memo id must not be blank" }
            require(memo.body.isNotBlank()) { "saved memo body must not be blank" }
            require(idBytes.size <= MAX_ID_BYTES) { "saved memo id exceeds the supported size bound" }
            require(bodyBytes.size <= MAX_BODY_BYTES) { "saved memo body exceeds the supported size bound" }
            require(ids.add(memo.id)) { "saved memo ids must be unique" }
        }
    }

    private fun decodeUtf8(value: String, maxBytes: Int): String {
        val decoded = try {
            decoder.decode(value)
        } catch (exception: IllegalArgumentException) {
            throw IllegalArgumentException("saved memo record contains invalid Base64", exception)
        }
        require(encoder.encodeToString(decoded) == value) {
            "saved memo record contains noncanonical Base64"
        }
        require(decoded.size <= maxBytes) { "saved memo field exceeds the supported size bound" }
        val utf8Decoder = StandardCharsets.UTF_8.newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
        return utf8Decoder.decode(ByteBuffer.wrap(decoded)).toString()
    }
}
