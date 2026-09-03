package com.goreecloud.memos

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.goreecloud.memos.home.MemosHomeRoute
import com.goreecloud.memos.ui.theme.GlazeTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            GlazeTheme {
                Surface(modifier = Modifier.fillMaxSize()) {
                    MemosHomeRoute()
                }
            }
        }
    }
}
