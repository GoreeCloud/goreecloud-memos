import { LabelService } from "../src/app/label-service.mjs";
import { MemoService } from "../src/app/memo-service.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";
import { formatMemoPlainTextSelection, memoPlainTextSelectionFilename } from "../src/app/memo-portability.mjs";

const listElement = document.querySelector("#memo-list");
const labelSelect = document.querySelector("#bulk-label-select");
const applyButton = document.querySelector("#bulk-label-apply");
const removeButton = document.querySelector("#bulk-label-remove");
const clearButton = document.querySelector("#bulk-selection-clear");
const copyButton = document.querySelector("#bulk-selection-copy");
const exportButton = document.querySelector("#bulk-selection-export");
const archiveButton = document.querySelector("#bulk-selection-archive");
const restoreButton = document.querySelector("#bulk-selection-restore");
const trashButton = document.querySelector("#bulk-selection-trash");
const statusElement = document.querySelector("#bulk-label-status");
const utilityDrawer = document.querySelector("details.utility-drawer");

const store = new IndexedDbMemoStore();
const memoService = new MemoService(store);
const labelService = new LabelService(store);
let selectedMemoIds = new Set();
let actionMessage = "";
let labelOptionsGeneration = 0;
let latestWorkspaceLabels = null;
let latestWorkspaceView = "active";

function memoCountText(count) {
  return `${count} ${count === 1 ? "memo" : "memos"}`;
}

function updateControls() {
  const count = selectedMemoIds.size;
  const ready = count > 0 && Boolean(labelSelect.value);
  applyButton.disabled = !ready;
  removeButton.disabled = !ready;
  copyButton.disabled = count === 0;
  exportButton.disabled = count === 0;
  const activeView = latestWorkspaceView === "active";
  const trashView = latestWorkspaceView === "trashed";
  archiveButton.hidden = !activeView;
  restoreButton.hidden = activeView;
  trashButton.hidden = trashView;
  archiveButton.disabled = count === 0 || !activeView;
  restoreButton.disabled = count === 0 || activeView;
  trashButton.disabled = count === 0 || trashView;
  clearButton.disabled = count === 0;
  statusElement.textContent = actionMessage
    ? `${actionMessage} ${memoCountText(count)} selected.`
    : `${memoCountText(count)} selected. Selection stays only in this view and is not saved.`;
}

function clearSelection({ clearMessage = true } = {}) {
  selectedMemoIds = new Set();
  if (clearMessage) actionMessage = "";
  for (const input of listElement.querySelectorAll("[data-bulk-select]")) input.checked = false;
  updateControls();
}

function createSelector(card) {
  const memoId = card.dataset.memoId;
  if (!memoId) return;

  const title = card.querySelector(".memo-card__title")?.textContent?.trim() || "memo";
  let input = card.querySelector("[data-bulk-select]");
  let label = input?.closest(".memo-select") ?? null;

  if (!input) {
    label = document.createElement("label");
    label.className = "memo-select";
    input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.bulkSelect = "";
    const text = document.createElement("span");
    text.className = "sr-only";
    text.textContent = "Select";
    label.append(input, text);
    card.querySelector(".memo-card__header")?.prepend(label);
  }

  input.value = memoId;
  input.checked = selectedMemoIds.has(memoId);
  input.setAttribute("aria-label", `Select ${title}`);
  label?.setAttribute("aria-label", `Select ${title}`);
}

function enhanceVisibleCards() {
  for (const card of listElement.querySelectorAll(".memo-card")) createSelector(card);
}

async function refreshLabelOptions(labelsSnapshot = null) {
  const generation = ++labelOptionsGeneration;
  const previous = labelSelect.value;
  const labels = Array.isArray(labelsSnapshot) ? labelsSnapshot : await labelService.list();
  if (generation !== labelOptionsGeneration) return;
  labelSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = labels.length === 0 ? "No managed labels" : "Choose label…";
  labelSelect.append(placeholder);

  for (const label of labels) {
    const option = document.createElement("option");
    option.value = label.id;
    option.textContent = label.name;
    labelSelect.append(option);
  }

  if (labels.some((label) => label.id === previous)) labelSelect.value = previous;
  updateControls();
}

function syncFromWorkspaceRender(event) {
  selectedMemoIds = new Set();
  latestWorkspaceView = ["active", "archived", "trashed"].includes(event?.detail?.view)
    ? event.detail.view
    : "active";
  enhanceVisibleCards();
  const labels = Array.isArray(event?.detail?.labels) ? event.detail.labels : null;
  if (labels) latestWorkspaceLabels = labels;
  refreshLabelOptions(labels ?? latestWorkspaceLabels).catch((error) => {
    statusElement.textContent = error instanceof Error ? error.message : "Could not refresh bulk label controls";
  });
  updateControls();
}

function requestWorkspaceRefresh(source) {
  return new Promise((resolve, reject) => {
    document.dispatchEvent(new CustomEvent("goreecloud:memos-refresh-requested", {
      detail: { source, resolve, reject }
    }));
  });
}

async function selectedMemoBundle() {
  const memoIds = [...selectedMemoIds];
  if (memoIds.length === 0) throw new Error("Select at least one memo first.");
  const memos = await Promise.all(memoIds.map((memoId) => memoService.get(memoId)));
  return {
    count: memos.length,
    text: formatMemoPlainTextSelection(memos)
  };
}

async function copySelectedMemos() {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard access is not available in this browser.");
  }
  const bundle = await selectedMemoBundle();
  await navigator.clipboard.writeText(bundle.text);
  actionMessage = `Copied ${memoCountText(bundle.count)} to the clipboard.`;
  updateControls();
}

async function exportSelectedMemos() {
  const bundle = await selectedMemoBundle();
  const blob = new Blob([bundle.text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = memoPlainTextSelectionFilename(bundle.count);
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  actionMessage = `Exported ${memoCountText(bundle.count)} as one local text file.`;
  updateControls();
}

async function runSelectionPortability(action) {
  copyButton.disabled = true;
  exportButton.disabled = true;
  try {
    if (action === "copy") await copySelectedMemos();
    else await exportSelectedMemos();
  } catch (error) {
    actionMessage = error instanceof Error ? error.message : "Could not export selected memos";
    updateControls();
  }
}

async function runBulkLifecycle(action) {
  const memoIds = [...selectedMemoIds];
  if (memoIds.length === 0) return;
  archiveButton.disabled = true;
  restoreButton.disabled = true;
  trashButton.disabled = true;

  try {
    const result = action === "archive"
      ? await memoService.archiveMany(memoIds)
      : action === "restore"
        ? await memoService.restoreMany(memoIds)
        : await memoService.trashMany(memoIds);
    clearSelection();
    await requestWorkspaceRefresh(`bulk-${action}`);
    const verb = action === "archive" ? "Archived" : action === "restore" ? "Restored" : "Moved to Trash";
    actionMessage = `${verb} ${memoCountText(result.length)}.`;
    updateControls();
  } catch (error) {
    actionMessage = error instanceof Error ? error.message : "Could not update selected memos";
    updateControls();
  }
}

async function runBulkAction(mode) {
  const memoIds = [...selectedMemoIds];
  const labelId = labelSelect.value;
  if (memoIds.length === 0 || !labelId) return;
  applyButton.disabled = true;
  removeButton.disabled = true;

  try {
    const result = mode === "apply"
      ? await memoService.applyLabelToMany(memoIds, labelId)
      : await memoService.removeLabelFromMany(memoIds, labelId);
    const verb = mode === "apply" ? "Applied" : "Removed";
    const preposition = mode === "apply" ? "to" : "from";
    clearSelection();
    await requestWorkspaceRefresh("bulk-labels");
    actionMessage = `${verb} ${result.label.name} ${preposition} ${memoCountText(result.changedMemoCount)}.`;
    updateControls();
  } catch (error) {
    actionMessage = error instanceof Error ? error.message : "Could not update selected memos";
    updateControls();
  }
}

listElement.addEventListener("change", (event) => {
  const input = event.target.closest("[data-bulk-select]");
  if (!input) return;
  actionMessage = "";
  if (input.checked) selectedMemoIds.add(input.value);
  else selectedMemoIds.delete(input.value);
  updateControls();
});

labelSelect.addEventListener("change", () => {
  actionMessage = "";
  updateControls();
});
copyButton.addEventListener("click", () => runSelectionPortability("copy"));
exportButton.addEventListener("click", () => runSelectionPortability("export"));
archiveButton.addEventListener("click", () => runBulkLifecycle("archive"));
restoreButton.addEventListener("click", () => runBulkLifecycle("restore"));
trashButton.addEventListener("click", () => runBulkLifecycle("trash"));
applyButton.addEventListener("click", () => runBulkAction("apply"));
removeButton.addEventListener("click", () => runBulkAction("remove"));
clearButton.addEventListener("click", () => {
  clearSelection();
  listElement.querySelector("[data-bulk-select]")?.focus();
});

document.addEventListener("goreecloud:memos-rendered", syncFromWorkspaceRender);

utilityDrawer?.addEventListener("toggle", () => {
  if (!utilityDrawer.open) return;
  refreshLabelOptions(latestWorkspaceLabels).catch((error) => {
    statusElement.textContent = error instanceof Error ? error.message : "Could not refresh bulk label controls";
  });
});

enhanceVisibleCards();
refreshLabelOptions().catch((error) => {
  statusElement.textContent = error instanceof Error ? error.message : "Could not load bulk label controls";
});
updateControls();
