import { MemoService } from "../src/app/memo-service.mjs";
import { LabelService } from "../src/app/label-service.mjs";
import { buildLabelPresentations } from "../src/app/label-presentation.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";
import { loadPresentationMode, savePresentationMode } from "../src/app/presentation-preference.mjs";
import { ALL_COLORS, ALL_LABEL_COLORS, collectLabelOptions, filterMemos } from "../src/app/memo-query.mjs";
import { parseSearchExpression } from "../src/app/search-expression.mjs";
import { SavedViewService } from "../src/app/saved-view-service.mjs";

const DRAFT_KEY = "goreecloud-memos:draft:v1";
const AUTOSAVE_DELAY_MS = 450;
const MEMO_RENDER_BATCH_SIZE = 200;
const MEMO_PREVIEW_CHARACTER_LIMIT = 560;
const MEMO_PREVIEW_LINE_LIMIT = 10;
const memoTimestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short"
});

const form = document.querySelector("#memo-form");
const capturePanel = document.querySelector("#capture-panel");
const captureSummary = capturePanel?.querySelector(":scope > summary");
const titleInput = document.querySelector("#memo-title");
const colorInput = document.querySelector("#memo-color");
const labelsInput = document.querySelector("#memo-labels");
const contentInput = document.querySelector("#memo-content");
const saveButton = document.querySelector("#save-button");
const listElement = document.querySelector("#memo-list");
const renderProgress = document.querySelector("#memo-render-progress");
const renderProgressStatus = document.querySelector("#memo-render-progress-status");
const renderMoreButton = document.querySelector("#memo-render-more");
const template = document.querySelector("#memo-template");
const editorTemplate = document.querySelector("#memo-editor-template");
const status = document.querySelector("#status");
const draftState = document.querySelector("#draft-state");
const viewButtons = [...document.querySelectorAll("[data-view]")];
const presentationInputs = [...document.querySelectorAll("input[name='presentation']")];
const presentationStatus = document.querySelector("#presentation-status");
const searchInput = document.querySelector("#memo-search");
const filterColorInput = document.querySelector("#memo-filter-color");
const filterLabelInput = document.querySelector("#memo-filter-label");
const filterLabelColorInput = document.querySelector("#memo-filter-label-color");
const clearFiltersButton = document.querySelector("#clear-filters");
const filterStatus = document.querySelector("#filter-status");
const savedViewNameInput = document.querySelector("#saved-view-name");
const savedViewSaveButton = document.querySelector("#saved-view-save");
const savedViewSelect = document.querySelector("#saved-view-select");
const savedViewApplyButton = document.querySelector("#saved-view-apply");
const savedViewDeleteButton = document.querySelector("#saved-view-delete");
const savedViewStatus = document.querySelector("#saved-view-status");

const store = new IndexedDbMemoStore();
const service = new MemoService(store);
const labelService = new LabelService(store);
const savedViewService = new SavedViewService(store);
const editTimers = new Map();
let currentView = "active";
let currentPresentation = loadPresentationMode(localStorage);
let refreshGeneration = 0;
let managedLabels = [];
let savedViews = [];
let renderedMemoContexts = new Map();
let progressiveMemos = [];
let progressiveRenderIndex = 0;
let progressivePinnedIndexes = new Map();
let progressivePinnedCount = 0;

function setStatus(message) {
  status.textContent = message;
}

function applyPresentationMode(mode, { persist = false } = {}) {
  currentPresentation = mode;
  listElement.dataset.presentation = mode;
  for (const input of presentationInputs) {
    input.checked = input.value === mode;
  }
  presentationStatus.textContent = `Presentation: ${mode[0].toUpperCase()}${mode.slice(1)}.`;
  if (persist && !savePresentationMode(mode, localStorage)) {
    presentationStatus.textContent += " Preference could not be stored in this browser.";
  }
}

function parseLabelsInput(value) {
  return value.split(",").map((label) => label.trim()).filter(Boolean);
}

function labelsToInput(labels) {
  return labels.join(", ");
}

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
}

function saveDraft() {
  const draft = {
    title: titleInput.value,
    content: contentInput.value,
    color: colorInput.value,
    labels: labelsInput.value
  };
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  draftState.textContent = "Draft saved on this device.";
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  draftState.textContent = "Drafts stay on this device.";
}

function restoreDraft() {
  const draft = readDraft();
  if (!draft) return;
  titleInput.value = typeof draft.title === "string" ? draft.title : "";
  contentInput.value = typeof draft.content === "string" ? draft.content : "";
  colorInput.value = typeof draft.color === "string" ? draft.color : "";
  labelsInput.value = typeof draft.labels === "string" ? draft.labels : "";
  if (titleInput.value || contentInput.value || colorInput.value || labelsInput.value) {
    if (capturePanel) capturePanel.open = true;
    draftState.textContent = "Recovered a local draft.";
  }
}

function createAction(label, action, memoId, { danger = false, disabled = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = danger ? "danger" : "secondary";
  button.dataset.action = action;
  button.dataset.memoId = memoId;
  button.textContent = label;
  button.disabled = disabled;
  return button;
}

function renderActions(container, memo, { pinnedIndex = -1, pinnedCount = 0 } = {}) {
  if (currentView === "active") {
    if (memo.pinned) {
      container.append(
        createAction("Unpin", "unpin", memo.id),
        createAction("Move pin up", "pin-up", memo.id, { disabled: pinnedIndex <= 0 }),
        createAction("Move pin down", "pin-down", memo.id, { disabled: pinnedIndex < 0 || pinnedIndex >= pinnedCount - 1 })
      );
    } else {
      container.append(createAction("Pin", "pin", memo.id));
    }
    container.append(
      createAction("Archive", "archive", memo.id),
      createAction("Move to Trash", "trash", memo.id, { danger: true })
    );
    return;
  }

  if (currentView === "archived") {
    container.append(
      createAction("Restore", "restore-archive", memo.id),
      createAction("Move to Trash", "trash", memo.id, { danger: true })
    );
    return;
  }

  container.append(
    createAction("Restore", "restore-trash", memo.id),
    createAction("Delete permanently", "delete-permanent", memo.id, { danger: true })
  );
}

function renderMemoMetadata(container, memo) {
  container.replaceChildren();

  if (memo.pinned) {
    const pinned = document.createElement("span");
    pinned.className = "memo-badge memo-badge--pin";
    pinned.textContent = "Pinned";
    container.append(pinned);
  }

  if (memo.color) {
    const color = document.createElement("span");
    color.className = "memo-badge memo-badge--color";
    color.textContent = `Color: ${memo.color[0].toUpperCase()}${memo.color.slice(1)}`;
    container.append(color);
  }

  for (const presentation of buildLabelPresentations(memo, managedLabels)) {
    const label = document.createElement("span");
    label.className = "memo-badge memo-badge--label";
    label.dataset.labelColor = presentation.color ?? "none";
    label.setAttribute("aria-label", `Label: ${presentation.name}`);

    if (presentation.icon) {
      const icon = document.createElement("span");
      icon.className = "memo-label__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = presentation.icon;
      label.append(icon);
    }

    const name = document.createElement("span");
    name.className = "memo-label__name";
    name.textContent = presentation.name;
    label.append(name);
    container.append(label);
  }

  container.hidden = container.childElementCount === 0;
}

function applyMemoToCard(card, memo) {
  card.dataset.color = memo.color ?? "none";
  const displayTitle = memo.title || "Untitled memo";
  card.querySelector(".memo-card__title").textContent = displayTitle;

  if (currentView === "active") {
    card.dataset.editable = "true";
    card.tabIndex = 0;
    card.setAttribute("aria-label", `Edit memo: ${displayTitle}`);
  } else {
    delete card.dataset.editable;
    card.removeAttribute("tabindex");
    card.removeAttribute("aria-label");
  }

  const bulkSelect = card.querySelector("[data-bulk-select]");
  if (bulkSelect) {
    bulkSelect.value = memo.id;
    bulkSelect.setAttribute("aria-label", `Select ${displayTitle}`);
    bulkSelect.closest(".memo-select")?.setAttribute("aria-label", `Select ${displayTitle}`);
  }

  const content = card.querySelector(".memo-card__content");
  const expandButton = card.querySelector("[data-expand-content]");
  const contentWasExpanded = card.classList.contains("memo-card--content-expanded");
  const contentNeedsPreview =
    memo.content.length > MEMO_PREVIEW_CHARACTER_LIMIT ||
    memo.content.split("\n").length > MEMO_PREVIEW_LINE_LIMIT;

  content.textContent = memo.content;
  content.id = `memo-content-${memo.id}`;
  card.classList.toggle("memo-card--content-collapsed", contentNeedsPreview && !contentWasExpanded);
  card.classList.toggle("memo-card--content-expanded", contentNeedsPreview && contentWasExpanded);

  if (expandButton) {
    expandButton.hidden = !contentNeedsPreview;
    expandButton.setAttribute("aria-controls", content.id);
    expandButton.setAttribute("aria-expanded", String(contentNeedsPreview && contentWasExpanded));
    expandButton.textContent = contentNeedsPreview && contentWasExpanded ? "Show less" : "Show more";
  }

  const time = card.querySelector(".memo-card__time");
  time.dateTime = memo.updatedAt;
  time.textContent = memoTimestampFormatter.format(new Date(memo.updatedAt));
  renderMemoMetadata(card.querySelector(".memo-card__meta"), memo);
}

function summarizeMemoStates(memos) {
  const counts = { active: 0, archived: 0, trashed: 0 };
  for (const memo of memos) {
    if (Object.hasOwn(counts, memo.state)) counts[memo.state] += 1;
  }
  return counts;
}

function notifyWorkspaceRendered({ view, memos, visibleMemos, labels, stateCounts, filtered, error = null }) {
  document.dispatchEvent(new CustomEvent("goreecloud:memos-rendered", {
    detail: {
      view,
      memos: [...memos],
      visibleMemos: [...visibleMemos],
      labels: [...labels],
      stateCounts: { ...stateCounts },
      filtered: Boolean(filtered),
      error: error ? String(error.message ?? error) : null
    }
  }));
}

function hasActiveFilters() {
  return searchInput.value.trim().length > 0 ||
    filterColorInput.value !== ALL_COLORS ||
    filterLabelInput.value !== "all" ||
    filterLabelColorInput.value !== ALL_LABEL_COLORS;
}

function readFilterState() {
  const expression = parseSearchExpression(searchInput.value);
  return {
    query: expression.query,
    color: filterColorInput.value,
    label: filterLabelInput.value,
    labelColor: filterLabelColorInput.value,
    expression
  };
}

function updateLabelFilterOptions(memos) {
  const previous = filterLabelInput.value || "all";
  const previousKey = previous.toLocaleLowerCase();
  const labels = collectLabelOptions(memos);
  filterLabelInput.replaceChildren();

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "All labels";
  filterLabelInput.append(all);

  for (const labelName of labels) {
    const option = document.createElement("option");
    option.value = labelName;
    option.textContent = labelName;
    filterLabelInput.append(option);
  }

  const retained = labels.find((labelName) => labelName.toLocaleLowerCase() === previousKey);
  filterLabelInput.value = retained ?? "all";
}

function updateFilterStatus(error = null) {
  const active = hasActiveFilters();
  clearFiltersButton.disabled = !active;
  if (error) {
    filterStatus.textContent = `Search expression error: ${error.message}`;
    return;
  }
  filterStatus.textContent = active
    ? "Search and filters apply only to the current memo location and are not saved."
    : "Search and filters are not saved.";
}

function readSavedViewFilters() {
  parseSearchExpression(searchInput.value);
  return {
    query: searchInput.value,
    color: filterColorInput.value,
    label: filterLabelInput.value,
    labelColor: filterLabelColorInput.value
  };
}

function selectedSavedView() {
  return savedViews.find((view) => view.id === savedViewSelect.value) ?? null;
}

function updateSavedViewActions() {
  const selected = selectedSavedView();
  savedViewApplyButton.disabled = !selected;
  savedViewDeleteButton.disabled = !selected;
}

function renderSavedViewOptions({ selectedId = savedViewSelect.value } = {}) {
  savedViewSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose saved view…";
  savedViewSelect.append(placeholder);

  for (const view of savedViews) {
    const option = document.createElement("option");
    option.value = view.id;
    option.textContent = view.name;
    savedViewSelect.append(option);
  }

  savedViewSelect.value = savedViews.some((view) => view.id === selectedId) ? selectedId : "";
  updateSavedViewActions();
}

async function refreshSavedViews({ selectedId = savedViewSelect.value } = {}) {
  savedViews = await savedViewService.list();
  renderSavedViewOptions({ selectedId });
}

function ensureSavedLabelAvailable(view) {
  const label = view.filters.label;
  if (!label || label === "all") return;
  const available = [...filterLabelInput.options].some((option) =>
    option.value.toLocaleLowerCase() === label.toLocaleLowerCase()
  );
  if (!available) {
    throw new Error(`Saved label "${label}" is not available in the current memo location`);
  }
}

async function applySavedView(view) {
  ensureSavedLabelAvailable(view);
  searchInput.value = view.filters.query;
  filterColorInput.value = view.filters.color;
  filterLabelInput.value = view.filters.label;
  filterLabelColorInput.value = view.filters.labelColor;
  await refreshAndWait();
  savedViewStatus.textContent = `Applied saved view "${view.name}" in the current memo location.`;
}

function updateMemoRenderProgress() {
  if (!renderProgress || !renderProgressStatus || !renderMoreButton) return;

  const total = progressiveMemos.length;
  const remaining = Math.max(0, total - progressiveRenderIndex);
  if (total <= MEMO_RENDER_BATCH_SIZE || remaining === 0) {
    renderProgress.hidden = true;
    renderProgressStatus.textContent = "";
    return;
  }

  renderProgress.hidden = false;
  renderProgressStatus.textContent = `Showing ${progressiveRenderIndex} of ${total} memos.`;
  const nextBatch = Math.min(MEMO_RENDER_BATCH_SIZE, remaining);
  renderMoreButton.textContent = remaining <= MEMO_RENDER_BATCH_SIZE
    ? `Show remaining ${remaining}`
    : `Show ${nextBatch} more`;
}

function appendMemoRenderBatch() {
  if (progressiveRenderIndex >= progressiveMemos.length) {
    updateMemoRenderProgress();
    return;
  }

  const nextIndex = Math.min(progressiveRenderIndex + MEMO_RENDER_BATCH_SIZE, progressiveMemos.length);
  const renderedCards = document.createDocumentFragment();

  for (const memo of progressiveMemos.slice(progressiveRenderIndex, nextIndex)) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".memo-card");
    const pinnedIndex = progressivePinnedIndexes.get(memo.id) ?? -1;

    card.dataset.memoId = memo.id;
    renderedMemoContexts.set(memo.id, {
      memo,
      pinnedIndex,
      pinnedCount: progressivePinnedCount
    });

    applyMemoToCard(card, memo);
    renderedCards.append(fragment);
  }

  listElement.append(renderedCards);
  progressiveRenderIndex = nextIndex;
  updateMemoRenderProgress();
}

function renderMemos(memos, { filtered = false } = {}) {
  listElement.replaceChildren();
  renderedMemoContexts = new Map();
  progressiveMemos = memos;
  progressiveRenderIndex = 0;

  if (memos.length === 0) {
    progressivePinnedIndexes = new Map();
    progressivePinnedCount = 0;
    updateMemoRenderProgress();
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = filtered
      ? "No memos match the current search and filters."
      : currentView === "active"
        ? "No memos yet. Capture the first one above."
        : currentView === "archived"
          ? "Archive is empty."
          : "Trash is empty.";
    listElement.append(empty);
    return;
  }

  const pinnedMemos = memos.filter((memo) => memo.pinned);
  progressivePinnedIndexes = new Map(pinnedMemos.map((memo, index) => [memo.id, index]));
  progressivePinnedCount = pinnedMemos.length;
  appendMemoRenderBatch();
}

async function refresh() {
  const generation = ++refreshGeneration;
  const requestedView = currentView;
  listElement.setAttribute("aria-busy", "true");

  try {
    const [allMemos, labels] = await Promise.all([
      service.listAll(),
      labelService.list()
    ]);
    if (generation !== refreshGeneration || requestedView !== currentView) return false;

    const stateCounts = summarizeMemoStates(allMemos);
    const memos = allMemos.filter((memo) => memo.state === requestedView);
    managedLabels = labels;
    updateLabelFilterOptions(memos);
    const filtered = hasActiveFilters();
    let filterState;
    try {
      filterState = readFilterState();
    } catch (error) {
      const expressionError = error instanceof Error ? error : new Error("Invalid search expression");
      listElement.replaceChildren();
      progressiveMemos = [];
      progressiveRenderIndex = 0;
      progressivePinnedIndexes = new Map();
      progressivePinnedCount = 0;
      updateMemoRenderProgress();
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent = `Search expression error: ${expressionError.message}`;
      listElement.append(message);
      updateFilterStatus(expressionError);
      setStatus("Search expression needs correction.");
      notifyWorkspaceRendered({
        view: requestedView,
        memos,
        visibleMemos: [],
        labels,
        stateCounts,
        filtered,
        error: expressionError
      });
      return true;
    }

    const visibleMemos = filterMemos(memos, filterState, { managedLabels });
    renderMemos(visibleMemos, { filtered });
    updateFilterStatus();

    const label = currentView === "active" ? "memo" : currentView === "archived" ? "archived memo" : "trashed memo";
    if (filtered) {
      const noun = memos.length === 1 ? label : `${label}s`;
      const verb = visibleMemos.length === 1 ? "matches" : "match";
      setStatus(`${visibleMemos.length} of ${memos.length} ${noun} ${verb} current filters`);
    } else {
      setStatus(`${memos.length} ${memos.length === 1 ? label : `${label}s`}`);
    }

    notifyWorkspaceRendered({
      view: requestedView,
      memos,
      visibleMemos,
      labels,
      stateCounts,
      filtered
    });
    return true;
  } finally {
    if (generation === refreshGeneration) {
      listElement.setAttribute("aria-busy", "false");
    }
  }
}

function waitForWorkspaceReady() {
  if (listElement.getAttribute("aria-busy") !== "true") return Promise.resolve();

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (listElement.getAttribute("aria-busy") === "true") return;
      observer.disconnect();
      resolve();
    });
    observer.observe(listElement, { attributes: true, attributeFilter: ["aria-busy"] });
  });
}

async function refreshAndWait() {
  const rendered = await refresh();
  if (!rendered) await waitForWorkspaceReady();
}

function setView(nextView) {
  currentView = nextView;
  for (const button of viewButtons) {
    const selected = button.dataset.view === nextView;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("secondary", !selected);
  }
  return refreshAndWait();
}

function hydrateMemoActions(card) {
  const actions = card?.querySelector(".memo-card__actions");
  const context = card ? renderedMemoContexts.get(card.dataset.memoId) : null;
  if (!actions || !context || actions.dataset.hydrated === "true") return;

  renderActions(actions, context.memo, {
    pinnedIndex: context.pinnedIndex,
    pinnedCount: context.pinnedCount
  });
  actions.dataset.hydrated = "true";
}

function ensureMemoEditor(card) {
  let editor = card?.querySelector(".memo-editor");
  if (editor) return editor;

  const context = card ? renderedMemoContexts.get(card.dataset.memoId) : null;
  if (!card || !context || !editorTemplate) return null;

  const fragment = editorTemplate.content.cloneNode(true);
  editor = fragment.querySelector(".memo-editor");
  editor.dataset.memoId = context.memo.id;
  editor.querySelector("[data-edit-field='title']").value = context.memo.title;
  editor.querySelector("[data-edit-field='content']").value = context.memo.content;
  editor.querySelector("[data-edit-field='color']").value = context.memo.color ?? "";
  editor.querySelector("[data-edit-field='labels']").value = labelsToInput(context.memo.labels);
  card.append(fragment);
  return editor;
}

function openMemoEditor(card, { focus = true } = {}) {
  if (!card || currentView !== "active") return null;
  const editor = ensureMemoEditor(card);
  if (!editor) return null;

  editor.hidden = false;
  card.classList.add("memo-card--editing");
  card.setAttribute("aria-expanded", "true");
  if (focus) {
    requestAnimationFrame(() => editor.querySelector("[data-edit-field='content']")?.focus());
  }
  return editor;
}

function closeMemoEditor(card, { focusCard = true } = {}) {
  const editor = card?.querySelector(".memo-editor");
  if (!editor) return;

  editor.hidden = true;
  card.classList.remove("memo-card--editing");
  card.setAttribute("aria-expanded", "false");
  if (focusCard) card.focus();
}

function closeOpenMemoMenus(except = null) {
  for (const menu of listElement.querySelectorAll("details.memo-card-menu[open]")) {
    if (menu !== except) menu.open = false;
  }
}

function scheduleEditSave(editor) {
  const memoId = editor.dataset.memoId;
  const editorStatus = editor.querySelector(".editor-status");
  const existing = editTimers.get(memoId);
  if (existing) clearTimeout(existing);
  editorStatus.textContent = "Waiting to save…";

  const timer = setTimeout(async () => {
    editTimers.delete(memoId);
    editorStatus.textContent = "Saving…";
    try {
      const updated = await service.edit(memoId, {
        title: editor.querySelector("[data-edit-field='title']").value,
        content: editor.querySelector("[data-edit-field='content']").value,
        color: editor.querySelector("[data-edit-field='color']").value,
        labels: parseLabelsInput(editor.querySelector("[data-edit-field='labels']").value)
      });
      const existingContext = renderedMemoContexts.get(memoId);
      if (existingContext) {
        renderedMemoContexts.set(memoId, { ...existingContext, memo: updated });
      }
      applyMemoToCard(editor.closest(".memo-card"), updated);
      editorStatus.textContent = "Saved.";
    } catch (error) {
      editorStatus.textContent = error instanceof Error ? error.message : "Could not save changes";
    }
  }, AUTOSAVE_DELAY_MS);

  editTimers.set(memoId, timer);
}

function refreshFromFilterControl() {
  refresh().catch((error) => {
    setStatus(error instanceof Error ? error.message : "Could not filter memos");
  });
}

form.addEventListener("input", saveDraft);

capturePanel?.addEventListener("toggle", () => {
  if (!capturePanel.open) return;
  requestAnimationFrame(() => {
    if (!capturePanel.open) return;
    const active = document.activeElement;
    const userAlreadyEnteredComposer = active instanceof Element &&
      active !== captureSummary &&
      form.contains(active);
    if (!userAlreadyEnteredComposer) contentInput.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;

  try {
    await service.capture({
      title: titleInput.value,
      content: contentInput.value,
      color: colorInput.value,
      labels: parseLabelsInput(labelsInput.value)
    });
    form.reset();
    clearDraft();
    await setView("active");
    if (capturePanel) capturePanel.open = false;
    captureSummary?.focus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not save memo");
  } finally {
    saveButton.disabled = false;
  }
});

for (const button of viewButtons) {
  button.addEventListener("click", () => {
    setView(button.dataset.view).catch((error) => {
      setStatus(error instanceof Error ? error.message : "Could not change memo view");
    });
  });
}

for (const input of presentationInputs) {
  input.addEventListener("change", () => {
    if (input.checked) applyPresentationMode(input.value, { persist: true });
  });
}

searchInput.addEventListener("input", refreshFromFilterControl);
filterColorInput.addEventListener("change", refreshFromFilterControl);
filterLabelInput.addEventListener("change", refreshFromFilterControl);
filterLabelColorInput.addEventListener("change", refreshFromFilterControl);
clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  filterColorInput.value = ALL_COLORS;
  filterLabelInput.value = "all";
  filterLabelColorInput.value = ALL_LABEL_COLORS;
  refreshFromFilterControl();
  searchInput.focus();
});

savedViewSaveButton.addEventListener("click", async () => {
  savedViewSaveButton.disabled = true;
  try {
    const filters = readSavedViewFilters();
    const created = await savedViewService.create(savedViewNameInput.value, filters);
    savedViewNameInput.value = "";
    await refreshSavedViews({ selectedId: created.id });
    savedViewStatus.textContent = `Saved view "${created.name}" in this browser.`;
  } catch (error) {
    savedViewStatus.textContent = error instanceof Error ? error.message : "Could not save view";
  } finally {
    savedViewSaveButton.disabled = false;
  }
});

savedViewSelect.addEventListener("change", updateSavedViewActions);

savedViewApplyButton.addEventListener("click", async () => {
  const view = selectedSavedView();
  if (!view) return;
  savedViewApplyButton.disabled = true;
  try {
    await applySavedView(view);
  } catch (error) {
    savedViewStatus.textContent = error instanceof Error ? error.message : "Could not apply saved view";
  } finally {
    updateSavedViewActions();
  }
});

renderMoreButton?.addEventListener("click", () => {
  const firstNewCardIndex = progressiveRenderIndex;
  appendMemoRenderBatch();

  if (!renderProgress?.hidden) {
    renderMoreButton.focus();
    return;
  }

  const firstNewCard = listElement.querySelectorAll(".memo-card")[firstNewCardIndex];
  if (firstNewCard instanceof HTMLElement) {
    firstNewCard.tabIndex = -1;
    firstNewCard.focus();
  }
});

savedViewDeleteButton.addEventListener("click", async () => {
  const view = selectedSavedView();
  if (!view) return;
  if (!window.confirm(`Delete saved view "${view.name}"? This does not delete memos.`)) return;

  savedViewDeleteButton.disabled = true;
  try {
    await savedViewService.delete(view.id);
    await refreshSavedViews({ selectedId: "" });
    savedViewStatus.textContent = `Deleted saved view "${view.name}".`;
  } catch (error) {
    savedViewStatus.textContent = error instanceof Error ? error.message : "Could not delete saved view";
  } finally {
    updateSavedViewActions();
  }
});

document.addEventListener("goreecloud:memos-refresh-requested", async (event) => {
  try {
    await refreshAndWait();
    event.detail?.resolve?.();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh local memos";
    setStatus(message);
    event.detail?.reject?.(error instanceof Error ? error : new Error(message));
  }
});

listElement.addEventListener("input", (event) => {
  const editor = event.target.closest(".memo-editor");
  if (editor) scheduleEditSave(editor);
});

listElement.addEventListener("toggle", (event) => {
  const menu = event.target.closest?.("details.memo-card-menu");
  if (!menu?.open) return;
  closeOpenMemoMenus(menu);
  hydrateMemoActions(menu.closest(".memo-card"));
}, true);

document.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("details.memo-card-menu")) return;
  closeOpenMemoMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const openMenu = listElement.querySelector("details.memo-card-menu[open]");
  if (!openMenu) return;
  openMenu.open = false;
  openMenu.querySelector(":scope > summary")?.focus();
});

listElement.addEventListener("click", async (event) => {
  const closeEditorButton = event.target.closest("[data-editor-close]");
  if (closeEditorButton) {
    closeMemoEditor(closeEditorButton.closest(".memo-card"));
    return;
  }

  const expandButton = event.target.closest("[data-expand-content]");
  if (expandButton) {
    const card = expandButton.closest(".memo-card");
    if (!card) return;
    const expanded = card.classList.toggle("memo-card--content-expanded");
    card.classList.toggle("memo-card--content-collapsed", !expanded);
    expandButton.setAttribute("aria-expanded", String(expanded));
    expandButton.textContent = expanded ? "Show less" : "Show more";
    return;
  }

  const menuSummary = event.target.closest("details.memo-card-menu > summary");
  if (menuSummary) {
    hydrateMemoActions(menuSummary.closest(".memo-card"));
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) {
    const card = event.target.closest(".memo-card[data-editable='true']");
    const interactiveTarget = event.target.closest("button, input, select, textarea, summary, details, label, a, .memo-editor");
    if (card && !interactiveTarget) openMemoEditor(card);
    return;
  }

  const actionMenu = button.closest("details.memo-card-menu");
  if (actionMenu) actionMenu.open = false;

  button.disabled = true;
  const memoId = button.dataset.memoId;

  try {
    switch (button.dataset.action) {
      case "pin":
        await service.pin(memoId);
        break;
      case "unpin":
        await service.unpin(memoId);
        break;
      case "pin-up":
        await service.movePin(memoId, "up");
        break;
      case "pin-down":
        await service.movePin(memoId, "down");
        break;
      case "archive":
        await service.archive(memoId);
        break;
      case "restore-archive":
        await service.restoreFromArchive(memoId);
        break;
      case "trash":
        await service.trash(memoId);
        break;
      case "restore-trash":
        await service.restoreFromTrash(memoId);
        break;
      case "delete-permanent":
        if (!window.confirm("Permanently delete this memo? This cannot be undone.")) {
          button.disabled = false;
          return;
        }
        await service.deletePermanently(memoId);
        break;
      default:
        throw new Error("Unsupported memo action");
    }
    await refresh();
  } catch (error) {
    button.disabled = false;
    setStatus(error instanceof Error ? error.message : "Could not update memo");
  }
});

listElement.addEventListener("keydown", (event) => {
  const card = event.target.closest?.(".memo-card[data-editable='true']");
  if (!card || event.target !== card || (event.key !== "Enter" && event.key !== " ")) return;
  event.preventDefault();
  openMemoEditor(card);
});

applyPresentationMode(currentPresentation);
updateFilterStatus();
restoreDraft();
Promise.all([refresh(), refreshSavedViews()]).catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load local memos");
  savedViewStatus.textContent = error instanceof Error ? error.message : "Could not load saved views";
});
