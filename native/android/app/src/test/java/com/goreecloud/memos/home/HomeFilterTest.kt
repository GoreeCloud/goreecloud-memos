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
}
