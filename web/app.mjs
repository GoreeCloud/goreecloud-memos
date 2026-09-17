import { MemoService } from "../src/app/memo-service.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";

const DRAFT_KEY = "goreecloud-memos:draft:v1";
const AUTOSAVE_DELAY_MS = 450;

const form = document.querySelector("#memo-form");
const titleInput = document.querySelector("#memo-title");
const contentInput = document.querySelector("#memo-content");
const saveButton = document.querySelector("#save-button");
const listElement = document.querySelector("#memo-list");
const template = document.querySelector("#memo-template");
const status = document.querySelector("#status");
const draftState = document.querySelector("#draft-state");
const viewButtons = [...document.querySelectorAll("[data-view]")];

const service = new MemoService(new IndexedDbMemoStore());
const editTimers = new Map();
let currentView = "active";

function setStatus(message) {
  status.textContent = message;
}

function readDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
  } catch {
    return null;
  }
}

function saveDraft() {
  const draft = { title: titleInput.value, content: contentInput.value };
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
  if (titleInput.value || contentInput.value) {
    draftState.textContent = "Recovered a local draft.";
  }
}

function createAction(label, action, memoId, { danger = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = danger ? "danger" : "secondary";
  button.dataset.action = action;
  button.dataset.memoId = memoId;
  button.textContent = label;
  return button;
}

function renderActions(container, memo) {
  if (currentView === "active") {
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

function renderMemos(memos) {
  listElement.replaceChildren();

  if (memos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = currentView === "active"
      ? "No memos yet. Capture the first one above."
      : currentView === "archived"
        ? "Archive is empty."
        : "Trash is empty.";
    listElement.append(empty);
    return;
  }

  for (const memo of memos) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".memo-card");
    const title = fragment.querySelector(".memo-card__title");
    const time = fragment.querySelector(".memo-card__time");
    const content = fragment.querySelector(".memo-card__content");
    const actions = fragment.querySelector(".memo-card__actions");
    const editor = fragment.querySelector(".memo-editor");
    const editTitle = fragment.querySelector("[data-edit-field='title']");
    const editContent = fragment.querySelector("[data-edit-field='content']");

    card.dataset.memoId = memo.id;
    title.textContent = memo.title || "Untitled memo";
    time.dateTime = memo.updatedAt;
    time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(memo.updatedAt));
    content.textContent = memo.content;
    editor.dataset.memoId = memo.id;
    editTitle.value = memo.title;
    editContent.value = memo.content;
    renderActions(actions, memo);

    listElement.append(fragment);
  }
}

async function refresh() {
  const memos = await service.list({ state: currentView });
  renderMemos(memos);
  const label = currentView === "active" ? "memo" : currentView === "archived" ? "archived memo" : "trashed memo";
  setStatus(`${memos.length} ${memos.length === 1 ? label : `${label}s`}`);
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
        content: editor.querySelector("[data-edit-field='content']").value
      });
      const card = editor.closest(".memo-card");
      card.querySelector(".memo-card__title").textContent = updated.title || "Untitled memo";
      card.querySelector(".memo-card__content").textContent = updated.content;
      const time = card.querySelector(".memo-card__time");
      time.dateTime = updated.updatedAt;
      time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(updated.updatedAt));
      editorStatus.textContent = "Saved.";
    } catch (error) {
      editorStatus.textContent = error instanceof Error ? error.message : "Could not save changes";
    }
  }, AUTOSAVE_DELAY_MS);

  editTimers.set(memoId, timer);
}

form.addEventListener("input", saveDraft);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;

  try {
    await service.capture({ title: titleInput.value, content: contentInput.value });
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

restoreDraft();
refresh().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load local memos");
});
