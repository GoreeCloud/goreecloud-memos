package com.goreecloud.memos

import java.nio.charset.StandardCharsets
import java.util.Base64

internal object MemoCodec {
    private const val VERSION = "1"

    fun encode(records: List<MemoRecord>): String =
        records.joinToString("\n") { record ->
            listOf(
                VERSION,
                record.id,
                record.createdAt.toString(),
                record.updatedAt.toString(),
                encodeText(record.title),
                encodeText(record.body),
            ).joinToString("\t")
        }

    fun decode(raw: String): List<MemoRecord> {
        if (raw.isBlank()) return emptyList()

        return raw.lineSequence()
            .filter { it.isNotBlank() }
            .mapIndexed { index, line -> decodeLine(index + 1, line) }
            .toList()
    }

    private fun decodeLine(lineNumber: Int, line: String): MemoRecord {
        val fields = line.split("\t")
        require(fields.size == 6) { "Invalid memo record field count at line $lineNumber." }
        require(fields[0] == VERSION) { "Unsupported memo record version at line $lineNumber." }

        return MemoRecord(
            id = fields[1].also { require(it.isNotBlank()) { "Missing memo id at line $lineNumber." } },
            createdAt = fields[2].toLong(),
            updatedAt = fields[3].toLong(),
            title = decodeText(fields[4]),
            body = decodeText(fields[5]),
        )
    }

    private fun encodeText(value: String): String =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(value.toByteArray(StandardCharsets.UTF_8))

    private fun decodeText(value: String): String =
        String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8)
}

internal object DraftCodec {
    private const val VERSION = "1"

    fun encode(draft: MemoDraft): String =
        listOf(
            VERSION,
            draft.updatedAt.toString(),
            encodeText(draft.title),
            encodeText(draft.body),
        ).joinToString("\t")

    fun decode(raw: String): MemoDraft {
        if (raw.isBlank()) return MemoDraft()

        val fields = raw.trimEnd().split("\t")
        require(fields.size == 4) { "Invalid draft record." }
        require(fields[0] == VERSION) { "Unsupported draft version." }

        return MemoDraft(
            title = decodeText(fields[2]),
            body = decodeText(fields[3]),
            updatedAt = fields[1].toLong(),
        )
    }

    private fun encodeText(value: String): String =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(value.toByteArray(StandardCharsets.UTF_8))

    private fun decodeText(value: String): String =
        String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8)
}
