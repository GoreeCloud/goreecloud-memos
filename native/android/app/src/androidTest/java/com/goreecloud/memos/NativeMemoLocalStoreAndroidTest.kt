package com.goreecloud.memos

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.goreecloud.memos.home.NativeMemoCard
import com.goreecloud.memos.home.NativeMemoLocalStore
import com.goreecloud.memos.home.NativeMemoStoreLoadResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class NativeMemoLocalStoreAndroidTest {
    @Test
    fun atomicStoreRoundTripPreservesSavedCards() {
        val file = temporaryStoreFile("roundtrip")
        try {
            val expected = listOf(
                NativeMemoCard(id = "local-one", body = "Persisted on Android", pinned = true),
                NativeMemoCard(id = "local-two", body = "Second saved card", pinned = false),
            )
            val store = NativeMemoLocalStore(file)

            assertTrue(store.replace(expected))
            val loaded = store.load()

            assertTrue(loaded is NativeMemoStoreLoadResult.Loaded)
            assertEquals(expected, (loaded as NativeMemoStoreLoadResult.Loaded).memos)
        } finally {
            cleanAtomicFile(file)
        }
    }

    @Test
    fun malformedStoreLoadsAsRecoveryRequired() {
        val file = temporaryStoreFile("corrupt")
        try {
            file.parentFile?.mkdirs()
            file.writeText("not-a-supported-native-memos-store")

            val loaded = NativeMemoLocalStore(file).load()

            assertTrue(loaded is NativeMemoStoreLoadResult.RecoveryRequired)
        } finally {
            cleanAtomicFile(file)
        }
    }

    private fun temporaryStoreFile(label: String): File {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        return File(
            context.cacheDir,
            "native-memo-store-$label-${System.nanoTime()}.store",
        )
    }

    private fun cleanAtomicFile(file: File) {
        file.delete()
        File(file.path + ".new").delete()
        File(file.path + ".bak").delete()
    }
}
