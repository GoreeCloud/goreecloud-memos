package com.goreecloud.memos

import android.app.Activity
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.Gravity
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import java.text.DateFormat
import java.util.Date

class MainActivity : Activity() {
    private lateinit var glaze: MemosGlazeStyle
    private lateinit var memoRepository: LocalMemoRepository
    private lateinit var draftRepository: LocalDraftRepository

    private lateinit var titleEditor: EditText
    private lateinit var bodyEditor: EditText
    private lateinit var statusText: TextView
    private lateinit var memoList: LinearLayout

    private var suppressDraftWrites = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        glaze = MemosGlazeStyle(this)
        glaze.applyWindow(this)
        memoRepository = LocalMemoRepository(filesDir)
        draftRepository = LocalDraftRepository(filesDir)

        buildSurface()
        restoreDraft()
        attachDraftPersistence()
        renderMemos()
    }

    override fun onPause() {
        persistDraft()
        super.onPause()
    }

    private fun buildSurface() {
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            contentDescription = "GoreeCloud Memos local Development workspace"
        }
        glaze.styleCanvas(scroll)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(18), dp(22), dp(18), dp(28))
        }
        scroll.addView(
            root,
            android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.WRAP_CONTENT,
            ),
        )

        val heading = TextView(this).apply {
            text = "Memos"
            contentDescription = "GoreeCloud Memos"
        }
        glaze.styleHeading(heading)
        root.addView(heading)

        val intro = TextView(this).apply {
            text = "Open → type → save locally."
        }
        glaze.styleBody(intro)
        root.addView(intro, matchWrap(top = 4))

        val localBoundary = TextView(this).apply {
            text = "Local only • Sync not configured in this Development build"
            contentDescription = "Local only. Synchronization is not configured."
        }
        glaze.styleStatus(localBoundary)
        root.addView(localBoundary, matchWrap(top = 8))

        val composer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        glaze.styleSurface(composer, strong = true)
        composer.setPadding(dp(14), dp(14), dp(14), dp(14))
        root.addView(composer, matchWrap(top = 18))

        titleEditor = EditText(this).apply {
            hint = "Optional title"
            contentDescription = "Memo title"
            isSingleLine = true
            imeOptions = EditorInfo.IME_ACTION_NEXT
            maxLines = 1
        }
        glaze.styleEditor(titleEditor)
        composer.addView(titleEditor, matchWrap())

        bodyEditor = EditText(this).apply {
            hint = "Take a memo…"
            contentDescription = "Memo body"
            minLines = 4
            maxLines = 10
            gravity = Gravity.TOP
            imeOptions = EditorInfo.IME_FLAG_NO_EXTRACT_UI
        }
        glaze.styleEditor(bodyEditor)
        composer.addView(bodyEditor, matchWrap(top = 10))

        val save = Button(this).apply {
            text = "Save locally"
            contentDescription = "Save memo locally"
            setOnClickListener { saveMemo() }
        }
        glaze.stylePrimaryButton(save)
        composer.addView(save, matchWrap(top = 12))

        statusText = TextView(this).apply {
            text = "Draft is preserved locally while you type."
            accessibilityLiveRegion = View.ACCESSIBILITY_LIVE_REGION_POLITE
        }
        glaze.styleStatus(statusText)
        composer.addView(statusText, matchWrap(top = 10))

        val savedHeading = TextView(this).apply {
            text = "Saved locally"
        }
        glaze.styleSubheading(savedHeading)
        root.addView(savedHeading, matchWrap(top = 24))

        memoList = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(memoList, matchWrap(top = 10))

        setContentView(scroll)
    }

    private fun restoreDraft() {
        try {
            val loaded = draftRepository.load()
            suppressDraftWrites = true
            titleEditor.setText(loaded.draft.title)
            bodyEditor.setText(loaded.draft.body)
            suppressDraftWrites = false

            if (loaded.recoveredFromBackup) {
                showStatus(
                    "Recovered the previous local draft generation after the primary draft could not be read.",
                    isError = false,
                )
            }
        } catch (_: Exception) {
            suppressDraftWrites = false
            showStatus(
                "Local draft recovery failed. Existing files were left unchanged.",
                isError = true,
            )
        }
    }

    private fun attachDraftPersistence() {
        val watcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) = Unit
            override fun afterTextChanged(s: Editable?) {
                if (!suppressDraftWrites) persistDraft()
            }
        }
        titleEditor.addTextChangedListener(watcher)
        bodyEditor.addTextChangedListener(watcher)
    }

    private fun persistDraft() {
        if (!::titleEditor.isInitialized || suppressDraftWrites) return

        try {
            draftRepository.save(
                title = titleEditor.text.toString(),
                body = bodyEditor.text.toString(),
            )
            showStatus("Draft preserved locally • Sync not configured", isError = false)
        } catch (_: Exception) {
            showStatus("Draft could not be written. Existing local data was not cleared.", isError = true)
        }
    }

    private fun saveMemo() {
        val title = titleEditor.text.toString()
        val body = bodyEditor.text.toString()
        if (title.isBlank() && body.isBlank()) {
            showStatus("Add a title or memo body before saving.", isError = true)
            return
        }

        try {
            memoRepository.create(title = title, body = body)
            draftRepository.clear()

            suppressDraftWrites = true
            titleEditor.setText("")
            bodyEditor.setText("")
            suppressDraftWrites = false

            showStatus("Saved locally • Sync not configured", isError = false)
            renderMemos()
        } catch (_: Exception) {
            suppressDraftWrites = false
            showStatus("Memo could not be saved. The current draft remains available.", isError = true)
        }
    }

    private fun renderMemos() {
        memoList.removeAllViews()

        val loaded = try {
            memoRepository.load()
        } catch (_: Exception) {
            showEmptyOrError(
                "Saved local memos could not be read. Existing files were left unchanged.",
                isError = true,
            )
            return
        }

        if (loaded.records.isEmpty()) {
            showEmptyOrError("No locally saved memos yet.", isError = false)
            return
        }

        if (loaded.recoveredFromBackup) {
            val recovery = TextView(this).apply {
                text = "Showing the previous readable local generation because the primary memo file could not be read."
                contentDescription = text
            }
            glaze.styleStatus(recovery)
            memoList.addView(recovery, matchWrap(bottom = 10))
        }

        loaded.records
            .sortedByDescending { it.updatedAt }
            .forEach { record ->
                memoList.addView(buildMemoCard(record), matchWrap(bottom = 10))
            }
    }

    private fun buildMemoCard(record: MemoRecord): View {
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            contentDescription = "Locally saved memo"
        }
        glaze.styleMemoCard(card)

        if (record.title.isNotBlank()) {
            val title = TextView(this).apply {
                text = record.title
            }
            glaze.styleSubheading(title)
            card.addView(title, matchWrap())
        }

        if (record.body.isNotBlank()) {
            val body = TextView(this).apply {
                text = record.body
            }
            glaze.styleBody(body)
            card.addView(body, matchWrap(top = if (record.title.isBlank()) 0 else 6))
        }

        val timestamp = TextView(this).apply {
            text = "Saved ${DateFormat.getDateTimeInstance(DateFormat.MEDIUM, DateFormat.SHORT).format(Date(record.updatedAt))}"
        }
        glaze.styleStatus(timestamp)
        card.addView(timestamp, matchWrap(top = 8))
        return card
    }

    private fun showEmptyOrError(message: String, isError: Boolean) {
        val text = TextView(this).apply {
            this.text = message
            contentDescription = message
        }
        glaze.styleStatus(text, isError)
        memoList.addView(text, matchWrap())
    }

    private fun showStatus(message: String, isError: Boolean) {
        statusText.text = message
        statusText.contentDescription = message
        glaze.styleStatus(statusText, isError)
    }

    private fun matchWrap(
        top: Int = 0,
        bottom: Int = 0,
    ) = LinearLayout.LayoutParams(
        LinearLayout.LayoutParams.MATCH_PARENT,
        LinearLayout.LayoutParams.WRAP_CONTENT,
    ).apply {
        topMargin = dp(top)
        bottomMargin = dp(bottom)
    }

    private fun dp(value: Int): Int = glaze.dp(value)
}
