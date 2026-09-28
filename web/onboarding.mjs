const COMPLETE_KEY = "goreecloud-memos:setup-complete:v1";
const STEP_KEY = "goreecloud-memos:setup-step:v1";
const HINTS_KEY = "goreecloud-memos:contextual-hints:v1";
const HINT_DISMISSED_KEY = "goreecloud-memos:contextual-hint-dismissed:v1";

const dialog = document.querySelector("#setup-dialog");
const progress = document.querySelector("#setup-progress");
const title = document.querySelector("#setup-title");
const body = document.querySelector("#setup-body");
const points = document.querySelector("#setup-points");
const hintsRow = document.querySelector("#setup-hints-row");
const setupHints = document.querySelector("#setup-hints-enabled");
const backButton = document.querySelector("#setup-back");
const nextButton = document.querySelector("#setup-next");
const returnButton = document.querySelector("#setup-return");
const status = document.querySelector("#setup-status");

const settingsHints = document.querySelector("#contextual-hints-enabled");
const replayButton = document.querySelector("#replay-setup");
const guidanceStatus = document.querySelector("#guidance-status");
const contextualHint = document.querySelector("#contextual-hint");
const dismissHint = document.querySelector("#dismiss-contextual-hint");
const utilityDrawer = document.querySelector("details.utility-drawer");

const STEPS = Object.freeze([
  {
    title: "Quick capture, without ceremony",
    body: "GoreeCloud Memos is your fast capture space. Open it, write what matters, and get back to what you were doing.",
    points: [
      "Titles are optional; the memo body is the primary capture surface.",
      "Unfinished text is preserved as a local browser draft while you type.",
      "Press N outside a text field to open capture and / to jump to search."
    ]
  },
  {
    title: "Know the privacy boundary",
    body: "This Development browser build is intentionally local. It does not currently claim account, server, synchronization, or shared-cloud authority.",
    points: [
      "Memos, labels, Saved Views, and drafts stay in this browser profile.",
      "Archive keeps a memo out of the active space without deleting it.",
      "Trash remains recoverable until you explicitly choose permanent deletion."
    ]
  },
  {
    title: "Shape the workspace around you",
    body: "Use labels, color, Saved Views, presentation density, and Glaze appearance controls without changing the underlying memo content.",
    points: [
      "Choose System, Light, Dark, or Deep Dark appearance from Workspace settings.",
      "Use the memo action menu for pin, edit, archive, restore, and deletion actions.",
      "Contextual hints can stay on, be disabled globally, or be re-enabled later."
    ]
  }
]);

let currentStep = 0;
let replayMode = false;
let volatileComplete = false;
let volatileHints = true;

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function isComplete() {
  const stored = safeGet(localStorage, COMPLETE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return volatileComplete;
}

function readStep() {
  const value = Number.parseInt(safeGet(localStorage, STEP_KEY) ?? "", 10);
  return Number.isInteger(value) ? Math.min(Math.max(value, 0), STEPS.length - 1) : 0;
}

function persistStep(step) {
  currentStep = Math.min(Math.max(step, 0), STEPS.length - 1);
  safeSet(localStorage, STEP_KEY, String(currentStep));
}

function hintsEnabled() {
  const stored = safeGet(localStorage, HINTS_KEY);
  if (stored === "false") return false;
  if (stored === "true") return true;
  return volatileHints;
}

function setHintsEnabled(enabled) {
  volatileHints = Boolean(enabled);
  safeSet(localStorage, HINTS_KEY, enabled ? "true" : "false");
  syncGuidance();
}

function hintDismissedThisSession() {
  return safeGet(sessionStorage, HINT_DISMISSED_KEY) === "true";
}

function syncGuidance() {
  const enabled = hintsEnabled();
  if (settingsHints) settingsHints.checked = enabled;
  if (setupHints) setupHints.checked = enabled;
  if (guidanceStatus) guidanceStatus.textContent = enabled
    ? "Contextual hints are on."
    : "Contextual hints are off.";

  if (contextualHint) {
    contextualHint.hidden = !enabled || !isComplete() || hintDismissedThisSession();
  }
}

function renderStep() {
  const step = STEPS[currentStep];

  if (dialog) dialog.dataset.step = String(currentStep + 1);
  if (progress) progress.textContent = `Step ${currentStep + 1} of ${STEPS.length}`;
  if (title) title.textContent = replayMode
    ? `Review: ${step.title}`
    : step.title;
  if (body) body.textContent = step.body;

  if (points) {
    points.replaceChildren();
    for (const item of step.points) {
      const li = document.createElement("li");
      const marker = document.createElement("span");
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = "✓";
      const copy = document.createElement("span");
      copy.textContent = item;
      li.append(marker, copy);
      points.append(li);
    }
  }

  if (hintsRow) hintsRow.hidden = currentStep !== STEPS.length - 1;
  if (backButton) {
    backButton.hidden = currentStep === 0;
    backButton.disabled = currentStep === 0;
  }
  if (returnButton) returnButton.hidden = !replayMode;
  if (nextButton) nextButton.textContent = currentStep === STEPS.length - 1
    ? (replayMode ? "Done" : "Finish setup")
    : "Continue";
  if (status) status.textContent = `Setup step ${currentStep + 1} of ${STEPS.length}: ${step.title}`;
}

function showDialog() {
  if (!dialog || dialog.open) return;
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  requestAnimationFrame(() => nextButton?.focus());
}

function hideDialog() {
  if (!dialog?.open) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function openSetup({ replay = false } = {}) {
  replayMode = replay;
  if (utilityDrawer) utilityDrawer.open = false;
  currentStep = replay ? 0 : readStep();
  renderStep();
  showDialog();
}

function finishSetup() {
  if (!replayMode) {
    volatileComplete = true;
    safeSet(localStorage, COMPLETE_KEY, "true");
    safeSet(localStorage, STEP_KEY, "0");
  }
  hideDialog();
  syncGuidance();
  requestAnimationFrame(() => {
    document.querySelector("#capture-panel > summary")?.focus();
  });
}

backButton?.addEventListener("click", () => {
  if (currentStep <= 0) return;
  if (replayMode) currentStep -= 1;
  else persistStep(currentStep - 1);
  renderStep();
});

nextButton?.addEventListener("click", () => {
  if (currentStep < STEPS.length - 1) {
    if (replayMode) currentStep += 1;
    else persistStep(currentStep + 1);
    renderStep();
    nextButton.focus();
    return;
  }
  finishSetup();
});

returnButton?.addEventListener("click", () => {
  hideDialog();
  requestAnimationFrame(() => replayButton?.focus());
});

setupHints?.addEventListener("change", () => setHintsEnabled(setupHints.checked));
settingsHints?.addEventListener("change", () => setHintsEnabled(settingsHints.checked));
replayButton?.addEventListener("click", () => openSetup({ replay: true }));

dismissHint?.addEventListener("click", () => {
  safeSet(sessionStorage, HINT_DISMISSED_KEY, "true");
  syncGuidance();
  document.querySelector("#capture-panel > summary")?.focus();
});

dialog?.addEventListener("cancel", (event) => {
  if (!replayMode) {
    event.preventDefault();
    if (status) status.textContent = "Finish the first-use setup before continuing to Memos.";
  }
});

syncGuidance();

if (!isComplete()) {
  contextualHint?.setAttribute("hidden", "");
  openSetup();
}
