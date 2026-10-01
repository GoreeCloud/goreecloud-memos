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
    private lateinit var onboardingPreferences: MemosOnboardingPreferences

    private lateinit var titleEditor: EditText
    private lateinit var bodyEditor: EditText
    private lateinit var statusText: TextView
    private lateinit var memoList: LinearLayout
    private lateinit var contextualHint: TextView
    private lateinit var hintsToggleButton: Button

    private var suppressDraftWrites = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        glaze = MemosGlazeStyle(this)
        glaze.applyWindow(this)
        memoRepository = LocalMemoRepository(filesDir)
        draftRepository = LocalDraftRepository(filesDir)
        onboardingPreferences = MemosOnboardingPreferences(this)

        if (onboardingPreferences.isComplete()) {
            showWorkspace()
        } else {
            renderSetupWizard(
                step = onboardingPreferences.currentStep(),
                replay = false,
            )
        }
    }

    override fun onPause() {
        persistDraft()
        super.onPause()
    }

    private fun showWorkspace() {
        buildSurface()
        restoreDraft()
        attachDraftPersistence()
        renderMemos()
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
            isAccessibilityHeading = true
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

        contextualHint = TextView(this).apply {
            text = "Hint: Start typing immediately. Your unfinished draft is preserved locally as you type."
            contentDescription = "Contextual Memos hint"
        }
        glaze.styleStatus(contextualHint)
        root.addView(contextualHint, matchWrap(top = 8))
        contextualHint.visibility =
            if (onboardingPreferences.hintsEnabled()) View.VISIBLE else View.GONE

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

        val guidance = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(14), dp(14), dp(14), dp(14))
        }
        glaze.styleSurface(guidance)
        root.addView(guidance, matchWrap(top = 18))

        val guidanceHeading = TextView(this).apply {
            text = "Guidance"
            isAccessibilityHeading = true
        }
        glaze.styleSubheading(guidanceHeading)
        guidance.addView(guidanceHeading)

        val guidanceSummary = TextView(this).apply {
            text = "Ordinary contextual hints are optional. Safety, recovery, and error messages remain visible."
        }
        glaze.styleBody(guidanceSummary)
        guidance.addView(guidanceSummary, matchWrap(top = 6))

        hintsToggleButton = Button(this).apply {
            contentDescription = "Toggle contextual hints"
            setOnClickListener {
                onboardingPreferences.setHintsEnabled(!onboardingPreferences.hintsEnabled())
                updateHintsPresentation()
            }
        }
        glaze.stylePrimaryButton(hintsToggleButton)
        guidance.addView(hintsToggleButton, matchWrap(top = 10))

        val replaySetup = Button(this).apply {
            text = "Replay setup"
            contentDescription = "Replay Memos setup"
            setOnClickListener {
                persistDraft()
                renderSetupWizard(step = 0, replay = true)
            }
        }
        glaze.stylePrimaryButton(replaySetup)
        guidance.addView(replaySetup, matchWrap(top = 10))

        updateHintsPresentation()

        val savedHeading = TextView(this).apply {
            text = "Saved locally"
            isAccessibilityHeading = true
        }
        glaze.styleSubheading(savedHeading)
        root.addView(savedHeading, matchWrap(top = 24))

        memoList = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
        }
        root.addView(memoList, matchWrap(top = 10))

        setContentView(scroll)
    }


    private fun renderSetupWizard(step: Int, replay: Boolean) {
        val resolvedStep = step.coerceIn(0, MemosOnboardingPreferences.STEP_COUNT - 1)
        if (!replay) {
            onboardingPreferences.setCurrentStep(resolvedStep)
        }

        val scroll = ScrollView(this).apply {
            isFillViewport = true
            contentDescription = "GoreeCloud Memos first-use setup"
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
            text = if (replay) "Review Memos setup" else "Set up Memos"
            contentDescription = text
            isAccessibilityHeading = true
        }
        glaze.styleHeading(heading)
        root.addView(heading)

        val progress = TextView(this).apply {
            text = "Step ${resolvedStep + 1} of ${MemosOnboardingPreferences.STEP_COUNT}"
            contentDescription = text
        }
        glaze.styleStatus(progress)
        root.addView(progress, matchWrap(top = 6))

        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(16), dp(16), dp(16))
        }
        glaze.styleSurface(card, strong = true)
        root.addView(card, matchWrap(top = 18))

        val stepTitle = TextView(this).apply {
            text = when (resolvedStep) {
                0 -> "Quick capture, kept local"
                1 -> "Know the privacy boundary"
                else -> "Choose your guidance"
            }
            isAccessibilityHeading = true
        }
        glaze.styleSubheading(stepTitle)
        card.addView(stepTitle)

        val stepBody = TextView(this).apply {
            text = when (resolvedStep) {
                0 ->
                    "Memos is for fast capture: open, type, and save. A title is optional, and unfinished text is preserved as a local draft."
                1 ->
                    "This Development build has no Internet permission, account, or synchronization. Memos and drafts stay on this device. No permission is required to begin."
                else ->
                    "Contextual hints explain useful behavior near the workspace. You can turn ordinary hints off now or later, re-enable them at any time, and replay this setup from the Guidance section."
            }
        }
        glaze.styleBody(stepBody)
        card.addView(stepBody, matchWrap(top = 8))

        if (resolvedStep == 2) {
            val toggle = Button(this).apply {
                fun refreshLabel() {
                    text = if (onboardingPreferences.hintsEnabled()) {
                        "Contextual hints: On"
                    } else {
                        "Contextual hints: Off"
                    }
                    contentDescription = "Toggle setup contextual hints"
                }
                setOnClickListener {
                    onboardingPreferences.setHintsEnabled(!onboardingPreferences.hintsEnabled())
                    refreshLabel()
                }
                refreshLabel()
            }
            glaze.stylePrimaryButton(toggle)
            card.addView(toggle, matchWrap(top = 14))
        }

        if (resolvedStep > 0) {
            val back = Button(this).apply {
                text = "Back"
                contentDescription = "Back in Memos setup"
                setOnClickListener {
                    renderSetupWizard(
                        step = resolvedStep - 1,
                        replay = replay,
                    )
                }
            }
            glaze.stylePrimaryButton(back)
            root.addView(back, matchWrap(top = 16))
        } else if (replay) {
            val returnToMemos = Button(this).apply {
                text = "Return to Memos"
                contentDescription = "Return from Memos setup"
                setOnClickListener { showWorkspace() }
            }
            glaze.stylePrimaryButton(returnToMemos)
            root.addView(returnToMemos, matchWrap(top = 16))
        }

        val next = Button(this).apply {
            val isLast = resolvedStep == MemosOnboardingPreferences.STEP_COUNT - 1
            text = if (isLast) "Finish" else "Continue"
            contentDescription =
                if (isLast) "Finish Memos setup" else "Continue Memos setup"
            setOnClickListener {
                if (isLast) {
                    if (!replay) onboardingPreferences.markComplete()
                    showWorkspace()
                } else {
                    renderSetupWizard(
                        step = resolvedStep + 1,
                        replay = replay,
                    )
                }
            }
        }
        glaze.stylePrimaryButton(next)
        root.addView(next, matchWrap(top = 10))

        setContentView(scroll)
    }

    private fun updateHintsPresentation() {
        if (::contextualHint.isInitialized) {
            contextualHint.visibility =
                if (onboardingPreferences.hintsEnabled()) View.VISIBLE else View.GONE
        }
        if (::hintsToggleButton.isInitialized) {
            hintsToggleButton.text =
                if (onboardingPreferences.hintsEnabled()) {
                    "Contextual hints: On"
                } else {
                    "Contextual hints: Off"
                }
        }
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
