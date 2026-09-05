package com.goreecloud.memos

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ExternalCaptureReplayPolicyTest {
    @Test
    fun freshActivityMayReadItsLaunchIntent() {
        assertTrue(
            ExternalCaptureReplayPolicy.shouldReadLaunchIntent(
                isActivityRecreation = false,
            ),
        )
    }

    @Test
    fun recreatedActivityMustNotReplayItsLaunchIntent() {
        assertFalse(
            ExternalCaptureReplayPolicy.shouldReadLaunchIntent(
                isActivityRecreation = true,
            ),
        )
    }
}
