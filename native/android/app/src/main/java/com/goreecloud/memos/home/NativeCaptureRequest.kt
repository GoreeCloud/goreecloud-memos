package com.goreecloud.memos.home

/** One-shot Android-native request to open quick capture, optionally with shared text. */
data class NativeCaptureRequest(
    val token: Long,
    val text: String? = null,
)
