package com.goreecloud.memos.home

import org.junit.Assert.assertEquals
import org.junit.Test

class HomeFilterTest {
    private val memos = listOf(
        NativeMemoCard(id = "1", body = "Launch readiness checklist", pinned = true),
        NativeMemoCard(id = "2", body = "Buy coffee beans"),
        NativeMemoCard(id = "3", body = "Review launcher swipe fix"),
    )

    @Test
    fun blankQueryPreservesCurrentHomeOrder() {
        assertEquals(memos, filterMemosForHome(memos, "   "))
    }

    @Test
    fun matchesBodyIgnoringCase() {
        assertEquals(
            listOf(memos[0], memos[2]),
            filterMemosForHome(memos, "LAUNCH"),
        )
    }

    @Test
    fun trimsQueryBeforeMatching() {
        assertEquals(
            listOf(memos[1]),
            filterMemosForHome(memos, "  coffee  "),
        )
    }

    @Test
    fun noMatchReturnsEmptyList() {
        assertEquals(emptyList<NativeMemoCard>(), filterMemosForHome(memos, "calendar"))
    }
}
