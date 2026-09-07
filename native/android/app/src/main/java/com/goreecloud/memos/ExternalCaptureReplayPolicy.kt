package com.goreecloud.memos

/**
 * Keeps external capture intents one-shot across ordinary Activity recreation.
 *
 * Memos' current native Android line deliberately keeps memo state session-only. Recreated
 * Activities reuse their retained HomeViewModel state and must not reinterpret the original launch
 * intent as a new share/shortcut capture. Process recreation is intentionally not promoted into a
 * durable memo-recovery contract here.
 */
object ExternalCaptureReplayPolicy {
    fun shouldReadLaunchIntent(isActivityRecreation: Boolean): Boolean = !isActivityRecreation
}
