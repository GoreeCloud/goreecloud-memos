package com.goreecloud.memos

import org.junit.Assert.assertEquals
import org.junit.Test

class MemoCodecTest {
    @Test
    fun blankRecordAndTrailingNewlineFailClosed() {
        val record = MemoRecord(
            id = "memo-1", title = "First", body = "one", createdAt = 1L, updatedAt = 1L,
        )
        val first = MemoCodec.encode(listOf(record))
        val second = MemoCodec.encode(listOf(record.copy(id = "memo-2")))
        org.junit.Assert.assertThrows(IllegalArgumentException::class.java) {
            MemoCodec.decode("$first\n\n$second")
        }
        org.junit.Assert.assertThrows(IllegalArgumentException::class.java) {
            MemoCodec.decode("$first\n")
        }
    }

    @Test
    fun roundTripPreservesUnicodeTabsAndNewlines() {
        val records = listOf(
            MemoRecord(
                id = "memo-1",
                title = "Ideas ✓",
                body = "first line\nsecond\tcolumn",
                createdAt = 100L,
                updatedAt = 200L,
            ),
        )

        assertEquals(records, MemoCodec.decode(MemoCodec.encode(records)))
    }
}
