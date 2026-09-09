package com.goreecloud.memos.home

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import java.nio.charset.StandardCharsets

class NativeMemoPersistenceCodecTest {
    @Test
    fun roundTripPreservesOrderBodyAndPinState() {
        val expected = listOf(
            NativeMemoCard(id = "local-a", body = "First memo\nwith a second line", pinned = true),
            NativeMemoCard(id = "local-b", body = "Unicode: café 🌤️", pinned = false),
        )

        val encoded = NativeMemoPersistenceCodec.encode(expected)
        val decoded = NativeMemoPersistenceCodec.decode(encoded)

        assertEquals(expected, decoded)
    }

    @Test
    fun decodeRejectsUnknownFormatMalformedRecordsAndNoncanonicalBase64() {
        listOf(
            "GCMEMOS\t2\n",
            "GCMEMOS\t1\n\nZm9v\t0\tYmFy\n",
            "GCMEMOS\t1\nZm9v\t2\tYmFy\n",
            "GCMEMOS\t1\n%%%\t0\tYmFy\n",
            "GCMEMOS\t1\nYQ\t0\tYg==\n",
        ).forEach { value ->
            assertThrows(IllegalArgumentException::class.java) {
                NativeMemoPersistenceCodec.decode(value.toByteArray(StandardCharsets.US_ASCII))
            }
        }
    }

    @Test
    fun encodeRejectsDuplicateIdsBlankBodiesAndOversizedBodies() {
        assertThrows(IllegalArgumentException::class.java) {
            NativeMemoPersistenceCodec.encode(
                listOf(
                    NativeMemoCard(id = "same", body = "one"),
                    NativeMemoCard(id = "same", body = "two"),
                )
            )
        }
        assertThrows(IllegalArgumentException::class.java) {
            NativeMemoPersistenceCodec.encode(listOf(NativeMemoCard(id = "memo", body = "   ")))
        }
        assertThrows(IllegalArgumentException::class.java) {
            NativeMemoPersistenceCodec.encode(
                listOf(
                    NativeMemoCard(
                        id = "memo",
                        body = "x".repeat(NativeMemoPersistenceCodec.MAX_BODY_BYTES + 1),
                    )
                )
            )
        }
    }

    @Test
    fun decodeRejectsNonAsciiContainerBytes() {
        assertThrows(IllegalArgumentException::class.java) {
            NativeMemoPersistenceCodec.decode(byteArrayOf(0x47, 0x43, 0x80.toByte()))
        }
    }
}
