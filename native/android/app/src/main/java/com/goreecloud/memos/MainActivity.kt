package com.goreecloud.memos

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.goreecloud.memos.home.MemosHomeRoute
import com.goreecloud.memos.home.NativeCaptureRequest
import com.goreecloud.memos.ui.theme.GlazeTheme

class MainActivity : ComponentActivity() {
    private var captureSequence = 0L
    private var incomingCapture by mutableStateOf<NativeCaptureRequest?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        incomingCapture = intent.toNativeCaptureRequest()
        enableEdgeToEdge()
        setContent {
            GlazeTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MemosHomeRoute(
                        incomingCapture = incomingCapture,
                        onIncomingCaptureConsumed = { token ->
                            if (incomingCapture?.token == token) incomingCapture = null
                        },
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        incomingCapture = intent.toNativeCaptureRequest()
    }

    private fun Intent?.toNativeCaptureRequest(): NativeCaptureRequest? {
        val current = this ?: return null
        return when {
            current.action == ACTION_NEW_MEMO ->
                NativeCaptureRequest(token = ++captureSequence)

            current.action == Intent.ACTION_SEND && current.type.equals("text/plain", ignoreCase = true) -> {
                val sharedText = current.getStringExtra(Intent.EXTRA_TEXT)?.trim().orEmpty()
                if (sharedText.isEmpty()) null
                else NativeCaptureRequest(token = ++captureSequence, text = sharedText)
            }

            else -> null
        }
    }

    companion object {
        const val ACTION_NEW_MEMO = "com.goreecloud.memos.action.NEW_MEMO"
    }
}
