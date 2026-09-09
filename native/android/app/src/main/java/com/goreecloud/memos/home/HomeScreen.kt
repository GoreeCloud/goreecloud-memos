package com.goreecloud.memos.home

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.staggeredgrid.LazyVerticalStaggeredGrid
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridCells
import androidx.compose.foundation.lazy.staggeredgrid.StaggeredGridItemSpan
import androidx.compose.foundation.lazy.staggeredgrid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.goreecloud.memos.ui.theme.GlazeMetrics
import java.text.Normalizer
import java.util.Locale

@Composable
fun MemosHomeRoute(
    viewModel: HomeViewModel = viewModel(),
    incomingCapture: NativeCaptureRequest? = null,
    onIncomingCaptureConsumed: (Long) -> Unit = {},
) {
    val state = viewModel.uiState
    val focusManager = LocalFocusManager.current
    val keyboard = LocalSoftwareKeyboardController.current

    LaunchedEffect(incomingCapture?.token) {
        incomingCapture?.let { request ->
            viewModel.beginExternalCapture(request.text)
            onIncomingCaptureConsumed(request.token)
        }
    }

    BackHandler(enabled = state.composerExpanded) {
        focusManager.clearFocus()
        keyboard?.hide()
        viewModel.collapseComposer()
    }

    MemosHomeScreen(
        state = state,
        onExpandComposer = viewModel::expandComposer,
        onDraftChange = viewModel::updateDraft,
        onCancelDraft = {
            focusManager.clearFocus()
            keyboard?.hide()
            viewModel.cancelDraft()
        },
        onSaveDraft = {
            focusManager.clearFocus()
            keyboard?.hide()
            viewModel.saveDraft()
        },
        onTogglePinned = viewModel::togglePinned,
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MemosHomeScreen(
    state: HomeUiState,
    onExpandComposer: () -> Unit,
    onDraftChange: (String) -> Unit,
    onCancelDraft: () -> Unit,
    onSaveDraft: () -> Unit,
    onTogglePinned: (String) -> Unit,
) {
    var memoQuery by rememberSaveable { mutableStateOf("") }
    val visibleMemos = filterMemosForHome(state.memos, memoQuery)

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text(
                        "Memos",
                        modifier = Modifier.testTag("memos-title"),
                        fontWeight = FontWeight.SemiBold,
                    )
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
        containerColor = MaterialTheme.colorScheme.background,
    ) { innerPadding ->
        val pinned = visibleMemos.filter { it.pinned }
        val ordinary = visibleMemos.filterNot { it.pinned }

        LazyVerticalStaggeredGrid(
            columns = StaggeredGridCells.Adaptive(minSize = 168.dp),
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(
                start = GlazeMetrics.space4,
                end = GlazeMetrics.space4,
                top = GlazeMetrics.space2,
                bottom = GlazeMetrics.space6,
            ),
            horizontalArrangement = Arrangement.spacedBy(GlazeMetrics.space3),
            verticalItemSpacing = GlazeMetrics.space3,
        ) {
            item(span = StaggeredGridItemSpan.FullLine) {
                NativeDevelopmentNotice()
            }
            if (state.storageIssue != null) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    NativeStorageIssueNotice(state.storageIssue)
                }
            }
            item(span = StaggeredGridItemSpan.FullLine) {
                QuickCapture(
                    expanded = state.composerExpanded,
                    draft = state.draft,
                    pendingCaptureCount = state.pendingCaptures.size,
                    onExpand = onExpandComposer,
                    onDraftChange = onDraftChange,
                    onCancel = onCancelDraft,
                    onSave = onSaveDraft,
                )
            }

            if (state.memos.isNotEmpty()) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    OutlinedTextField(
                        value = memoQuery,
                        onValueChange = { memoQuery = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .testTag("saved-memo-filter"),
                        singleLine = true,
                        placeholder = { Text("Find saved memos") },
                        supportingText = { Text("Filters saved cards on this device only") },
                        shape = RoundedCornerShape(GlazeMetrics.radiusSmall),
                    )
                }
            }

            if (state.memos.isEmpty()) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    EmptyHomeState()
                }
            } else if (visibleMemos.isEmpty()) {
                item(span = StaggeredGridItemSpan.FullLine) {
                    NoMemoMatches()
                }
            } else {
                if (pinned.isNotEmpty()) {
                    item(span = StaggeredGridItemSpan.FullLine) { SectionLabel("Pinned") }
                    items(pinned, key = { it.id }) { memo ->
                        MemoCard(memo = memo, onTogglePinned = onTogglePinned)
                    }
                }
                if (ordinary.isNotEmpty()) {
                    item(span = StaggeredGridItemSpan.FullLine) { SectionLabel("Memos") }
                    items(ordinary, key = { it.id }) { memo ->
                        MemoCard(memo = memo, onTogglePinned = onTogglePinned)
                    }
                }
            }
        }
    }
}

internal fun filterMemosForHome(
    memos: List<NativeMemoCard>,
    query: String,
): List<NativeMemoCard> {
    val normalizedQuery = normalizeMemoSearchText(query).trim()
    if (normalizedQuery.isEmpty()) return memos

    val terms = normalizedQuery
        .split(MEMO_SEARCH_WHITESPACE)
        .filter(String::isNotEmpty)
        .distinct()
    if (terms.isEmpty()) return memos

    return memos.filter { memo ->
        val normalizedBody = normalizeMemoSearchText(memo.body)
        terms.all(normalizedBody::contains)
    }
}

private fun normalizeMemoSearchText(value: String): String =
    Normalizer.normalize(value, Normalizer.Form.NFC).lowercase(Locale.ROOT)

// Java/Kotlin's default `\s` class does not cover every Unicode separator without an explicit
// Unicode-character-class mode. Include Unicode separator characters so pasted queries containing
// NBSP/figure-space/em-space boundaries retain the same local multi-term semantics as ASCII spaces.
private val MEMO_SEARCH_WHITESPACE = Regex("[\\s\\p{Z}]+")

@Composable
private fun NativeDevelopmentNotice() {
    Surface(
        shape = RoundedCornerShape(GlazeMetrics.radiusSmall),
        color = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
    ) {
        Text(
            text = "Native Development preview · saved cards stay on-device · drafts/shares stay session-only",
            modifier = Modifier.padding(horizontal = GlazeMetrics.space4, vertical = GlazeMetrics.space3),
            style = MaterialTheme.typography.labelLarge,
        )
    }
}

@Composable
private fun NativeStorageIssueNotice(message: String) {
    Surface(
        shape = RoundedCornerShape(GlazeMetrics.radiusSmall),
        color = MaterialTheme.colorScheme.errorContainer,
        contentColor = MaterialTheme.colorScheme.onErrorContainer,
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(horizontal = GlazeMetrics.space4, vertical = GlazeMetrics.space3),
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun QuickCapture(
    expanded: Boolean,
    draft: String,
    pendingCaptureCount: Int,
    onExpand: () -> Unit,
    onDraftChange: (String) -> Unit,
    onCancel: () -> Unit,
    onSave: () -> Unit,
) {
    val shape = RoundedCornerShape(GlazeMetrics.radiusStandard)
    if (!expanded) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = GlazeMetrics.minimumTarget)
                .clickable(onClick = onExpand),
            shape = shape,
            color = MaterialTheme.colorScheme.surface,
            tonalElevation = 1.dp,
            shadowElevation = 1.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = GlazeMetrics.space4, vertical = GlazeMetrics.space3),
            ) {
                Text(
                    text = if (draft.isBlank()) "Take a memo…" else "Draft waiting · Tap to continue",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodyLarge,
                )
            }
        }
        return
    }

    val focusRequester = FocusRequester()
    val keyboard = LocalSoftwareKeyboardController.current
    LaunchedEffect(Unit) {
        focusRequester.requestFocus()
        keyboard?.show()
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = shape,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(GlazeMetrics.space4),
            verticalArrangement = Arrangement.spacedBy(GlazeMetrics.space3),
        ) {
            if (pendingCaptureCount > 0) {
                PendingCaptureNotice(pendingCaptureCount)
            }
            OutlinedTextField(
                value = draft,
                onValueChange = onDraftChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 132.dp)
                    .testTag("memo-composer")
                    .focusRequester(focusRequester),
                placeholder = { Text("Capture a thought, list, reminder, or snippet") },
                shape = RoundedCornerShape(GlazeMetrics.radiusSmall),
                minLines = 4,
                maxLines = 10,
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(GlazeMetrics.space2),
            ) {
                TextButton(
                    onClick = onCancel,
                    modifier = Modifier.heightIn(min = GlazeMetrics.minimumTarget),
                ) {
                    Text("Cancel")
                }
                Button(
                    onClick = onSave,
                    enabled = draft.isNotBlank(),
                    modifier = Modifier.heightIn(min = GlazeMetrics.minimumTarget),
                ) {
                    Text("Save")
                }
            }
        }
    }
}

@Composable
private fun PendingCaptureNotice(count: Int) {
    Surface(
        shape = RoundedCornerShape(GlazeMetrics.radiusSmall),
        color = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
    ) {
        Text(
            text = if (count == 1) {
                "1 shared capture is waiting. Save or cancel this draft to continue."
            } else {
                "$count shared captures are waiting. Save or cancel this draft to continue."
            },
            modifier = Modifier.padding(horizontal = GlazeMetrics.space3, vertical = GlazeMetrics.space2),
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        modifier = Modifier.padding(top = GlazeMetrics.space2),
        style = MaterialTheme.typography.titleSmall,
        color = MaterialTheme.colorScheme.onBackground,
        fontWeight = FontWeight.SemiBold,
    )
}

@Composable
private fun EmptyHomeState() {
    Surface(
        shape = RoundedCornerShape(GlazeMetrics.radiusStandard),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(GlazeMetrics.space5),
            verticalArrangement = Arrangement.spacedBy(GlazeMetrics.space2),
        ) {
            Text("Ready for a quick capture", style = MaterialTheme.typography.titleMedium)
            Text(
                "This native Development build does not load the web service or production memo library. Explicitly saved cards stay local to this app install.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun NoMemoMatches() {
    Surface(
        shape = RoundedCornerShape(GlazeMetrics.radiusStandard),
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(GlazeMetrics.space5),
            verticalArrangement = Arrangement.spacedBy(GlazeMetrics.space2),
        ) {
            Text("No matching saved memos", style = MaterialTheme.typography.titleMedium)
            Text(
                "Try a different word or clear the local filter.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
            )
        }
    }
}

@Composable
private fun MemoCard(
    memo: NativeMemoCard,
    onTogglePinned: (String) -> Unit,
) {
    Card(
        shape = RoundedCornerShape(GlazeMetrics.radiusStandard),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(
            modifier = Modifier.padding(GlazeMetrics.space4),
            verticalArrangement = Arrangement.spacedBy(GlazeMetrics.space3),
        ) {
            Text(
                text = memo.body,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )
            TextButton(
                onClick = { onTogglePinned(memo.id) },
                modifier = Modifier.heightIn(min = GlazeMetrics.minimumTarget),
            ) {
                Text(if (memo.pinned) "Unpin" else "Pin")
            }
        }
    }
}
