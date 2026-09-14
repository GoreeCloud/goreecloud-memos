package com.goreecloud.memos.home

import org.junit.Assert.assertEquals
import org.junit.Test

class HomeFilterTest {
    private val memos = listOf(
        NativeMemoCard(id = "1", body = "Launch readiness checklist", pinned = true),
        NativeMemoCard(id = "2", body = "Buy café coffee beans"),
        NativeMemoCard(id = "3", body = "Review launcher swipe fix"),
        NativeMemoCard(id = "4", body = "Résumé release notes"),
    )

    @Test
    fun blankQueryPreservesCurrentHomeOrder() {
        assertEquals(memos, filterMemosForHome(memos, "   \t\n  "))
    }

    @Test
    fun matchesBodyIgnoringCase() {
        assertEquals(
            listOf(memos[0], memos[2]),
            filterMemosForHome(memos, "LAUNCH"),
        )
    }

    @Test
    fun trimsAndCollapsesQueryWhitespace() {
        assertEquals(
            listOf(memos[1]),
            filterMemosForHome(memos, "  café   beans  "),
        )
    }

    @Test
    fun unicodeSeparatorWhitespaceKeepsMultiTermSemantics() {
        assertEquals(
            listOf(memos[1]),
            filterMemosForHome(memos, "café\u00A0beans"),
        )
        assertEquals(
            listOf(memos[2]),
            filterMemosForHome(memos, "review\u2003fix"),
        )
    }

    @Test
    fun repeatedTermsDoNotChangeMatchSemantics() {
        assertEquals(
            listOf(memos[1]),
            filterMemosForHome(memos, "coffee coffee beans coffee"),
        )
    }

    @Test
    fun requiresEveryQueryTermButNotTermOrder() {
        assertEquals(
            listOf(memos[2]),
            filterMemosForHome(memos, "fix review"),
        )
        assertEquals(
            emptyList<NativeMemoCard>(),
            filterMemosForHome(memos, "review coffee"),
        )
    }

    @Test
    fun composedQueryMatchesDecomposedSavedText() {
        assertEquals(
            listOf(memos[3]),
            filterMemosForHome(memos, "résumé"),
        )
    }

    @Test
    fun decomposedQueryMatchesComposedSavedText() {
        assertEquals(
            listOf(memos[1]),
            filterMemosForHome(memos, "café"),
        )
    }

    @Test
    fun noMatchReturnsEmptyList() {
        assertEquals(emptyList<NativeMemoCard>(), filterMemosForHome(memos, "calendar"))
    }

    @Test
    fun preparedSnapshotPreservesStableOrderAcrossRepeatedQueries() {
        val snapshot = HomeMemoFilterSnapshot(memos)

        assertEquals(
            listOf(memos[0], memos[2]),
            snapshot.filter("launch"),
        )
        assertEquals(
            listOf(memos[1]),
            snapshot.filter("beans café"),
        )
        assertEquals(memos, snapshot.filter(""))
        assertEquals(
            listOf(memos[0], memos[2]),
            snapshot.filter("LAUNCH"),
        )
    }

    @Test
    fun preparedSnapshotHandlesLargeLocalLibraryDeterministically() {
        val largeLibrary = List(10_000) { index ->
            NativeMemoCard(
                id = "memo-$index",
                body = if (index % 250 == 0) {
                    "Release café needle $index"
                } else {
                    "Local memo body $index"
                },
                pinned = index % 1_000 == 0,
            )
        }
        val expected = largeLibrary.filterIndexed { index, _ -> index % 250 == 0 }
        val snapshot = HomeMemoFilterSnapshot(largeLibrary)

        assertEquals(expected, snapshot.filter("CAFÉ needle"))
        assertEquals(expected, snapshot.filter("needle café needle"))
        assertEquals(largeLibrary, snapshot.filter("   "))
        assertEquals(emptyList<NativeMemoCard>(), snapshot.filter("remote semantic search"))
    }
}
