import { MemoService } from "../src/app/memo-service.mjs";
import { LabelService } from "../src/app/label-service.mjs";
import { buildLabelPresentations } from "../src/app/label-presentation.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";
import { loadPresentationMode, savePresentationMode } from "../src/app/presentation-preference.mjs";
import { ALL_COLORS, ALL_LABEL_COLORS, collectLabelOptions, filterMemos } from "../src/app/memo-query.mjs";
import { parseSearchExpression } from "../src/app/search-expression.mjs";

const DRAFT_KEY = "goreecloud-memos:draft:v1";
const AUTOSAVE_DELAY_MS = 450;

const form = document.querySelector("#memo-form");
const titleInput = document.querySelector("#memo-title");
const colorInput = document.querySelector("#memo-color");
const labelsInput = document.querySelector("#memo-labels");
const contentInput = document.querySelector("#memo-content");
const saveButton = document.querySelector("#save-button");
const listElement = document.querySelector("#memo-list");
const template = document.querySelector("#memo-template");
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

const store = new IndexedDbMemoStore();
const service = new MemoService(store);
const labelService = new LabelService(store);
const editTimers = new Map();
let currentView = "active";
let currentPresentation = loadPresentationMode(localStorage);
let refreshGeneration = 0;
let managedLabels = [];

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
      createAction("Edit", "edit", memo.id),
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
  card.querySelector(".memo-card__title").textContent = memo.title || "Untitled memo";
  card.querySelector(".memo-card__content").textContent = memo.content;
  const time = card.querySelector(".memo-card__time");
  time.dateTime = memo.updatedAt;
  time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(memo.updatedAt));
  renderMemoMetadata(card.querySelector(".memo-card__meta"), memo);
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

function renderMemos(memos, { filtered = false } = {}) {
  listElement.replaceChildren();

  if (memos.length === 0) {
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
  const pinnedIndexes = new Map(pinnedMemos.map((memo, index) => [memo.id, index]));

  for (const memo of memos) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".memo-card");
    const actions = fragment.querySelector(".memo-card__actions");
    const editor = fragment.querySelector(".memo-editor");
    const editTitle = fragment.querySelector("[data-edit-field='title']");
    const editContent = fragment.querySelector("[data-edit-field='content']");
    const editColor = fragment.querySelector("[data-edit-field='color']");
    const editLabels = fragment.querySelector("[data-edit-field='labels']");

    card.dataset.memoId = memo.id;
    editor.dataset.memoId = memo.id;
    editTitle.value = memo.title;
    editContent.value = memo.content;
    editColor.value = memo.color ?? "";
    editLabels.value = labelsToInput(memo.labels);
    applyMemoToCard(card, memo);
    renderActions(actions, memo, {
      pinnedIndex: pinnedIndexes.get(memo.id) ?? -1,
      pinnedCount: pinnedMemos.length
    });

    listElement.append(fragment);
  }
}

async function refresh() {
  const generation = ++refreshGeneration;
  const requestedView = currentView;
  const [memos, labels] = await Promise.all([
    service.list({ state: requestedView }),
    labelService.list()
  ]);
  if (generation !== refreshGeneration || requestedView !== currentView) return;

  managedLabels = labels;
  updateLabelFilterOptions(memos);
  const filtered = hasActiveFilters();
  let filterState;
  try {
    filterState = readFilterState();
  } catch (error) {
    const expressionError = error instanceof Error ? error : new Error("Invalid search expression");
    listElement.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = `Search expression error: ${expressionError.message}`;
    listElement.append(message);
    updateFilterStatus(expressionError);
    setStatus("Search expression needs correction.");
    return;
  }

  const visibleMemos = filterMemos(memos, filterState, { managedLabels });
  renderMemos(visibleMemos, { filtered });
  updateFilterStatus();

  const label = currentView === "active" ? "memo" : currentView === "archived" ? "archived memo" : "trashed memo";
  if (filtered) {
    setStatus(`${visibleMemos.length} of ${memos.length} ${memos.length === 1 ? label : `${label}s`} shown`);
  } else {
    setStatus(`${memos.length} ${memos.length === 1 ? label : `${label}s`}`);
  }
}

function setView(nextView) {
  currentView = nextView;
  for (const button of viewButtons) {
    const selected = button.dataset.view === nextView;
    button.setAttribute("aria-pressed", String(selected));
    button.classList.toggle("secondary", !selected);
  }
  return refresh();
}

function toggleEditor(button) {
  const card = button.closest(".memo-card");
  const editor = card.querySelector(".memo-editor");
  editor.hidden = !editor.hidden;
  button.textContent = editor.hidden ? "Edit" : "Close editor";
  if (!editor.hidden) {
    editor.querySelector("[data-edit-field='content']").focus();
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
    contentInput.focus();
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

listElement.addEventListener("input", (event) => {
  const editor = event.target.closest(".memo-editor");
  if (editor) scheduleEditSave(editor);
});

listElement.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.action === "edit") {
    toggleEditor(button);
    return;
  }

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

applyPresentationMode(currentPresentation);
updateFilterStatus();
restoreDraft();
refresh().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load local memos");
});
