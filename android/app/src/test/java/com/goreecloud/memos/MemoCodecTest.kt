package com.goreecloud.memos

import org.junit.Assert.assertEquals
import org.junit.Test

class MemoCodecTest {
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
