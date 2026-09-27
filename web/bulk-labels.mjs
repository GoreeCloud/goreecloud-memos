import { LabelService } from "../src/app/label-service.mjs";
import { MemoService } from "../src/app/memo-service.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";

const listElement = document.querySelector("#memo-list");
const labelSelect = document.querySelector("#bulk-label-select");
const applyButton = document.querySelector("#bulk-label-apply");
const removeButton = document.querySelector("#bulk-label-remove");
const clearButton = document.querySelector("#bulk-selection-clear");
const statusElement = document.querySelector("#bulk-label-status");
const utilityDrawer = document.querySelector("details.utility-drawer");

const store = new IndexedDbMemoStore();
const memoService = new MemoService(store);
const labelService = new LabelService(store);
let selectedMemoIds = new Set();
let actionMessage = "";
let labelOptionsGeneration = 0;

function memoCountText(count) {
  return `${count} ${count === 1 ? "memo" : "memos"}`;
}

function updateControls() {
  const count = selectedMemoIds.size;
  const ready = count > 0 && Boolean(labelSelect.value);
  applyButton.disabled = !ready;
  removeButton.disabled = !ready;
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
  enhanceVisibleCards();
  refreshLabelOptions(event?.detail?.labels).catch((error) => {
    statusElement.textContent = error instanceof Error ? error.message : "Could not refresh bulk label controls";
  });
  updateControls();
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
    actionMessage = `${verb} ${result.label.name} ${preposition} ${memoCountText(result.changedMemoCount)}.`;
    clearSelection({ clearMessage: false });
    document.dispatchEvent(new CustomEvent("goreecloud:memos-refresh-requested", {
      detail: { source: "bulk-labels" }
    }));
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
applyButton.addEventListener("click", () => runBulkAction("apply"));
removeButton.addEventListener("click", () => runBulkAction("remove"));
clearButton.addEventListener("click", () => {
  clearSelection();
  listElement.querySelector("[data-bulk-select]")?.focus();
});

document.addEventListener("goreecloud:memos-rendered", syncFromWorkspaceRender);

utilityDrawer?.addEventListener("toggle", () => {
  if (!utilityDrawer.open) return;
  refreshLabelOptions().catch((error) => {
    statusElement.textContent = error instanceof Error ? error.message : "Could not refresh bulk label controls";
  });
});

enhanceVisibleCards();
refreshLabelOptions().catch((error) => {
  statusElement.textContent = error instanceof Error ? error.message : "Could not load bulk label controls";
});
updateControls();
