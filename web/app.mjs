import { MemoService } from "../src/app/memo-service.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";

const DRAFT_KEY = "goreecloud-memos:draft:v1";

const form = document.querySelector("#memo-form");
const titleInput = document.querySelector("#memo-title");
const contentInput = document.querySelector("#memo-content");
const saveButton = document.querySelector("#save-button");
const listElement = document.querySelector("#memo-list");
const template = document.querySelector("#memo-template");
const status = document.querySelector("#status");
const draftState = document.querySelector("#draft-state");

const service = new MemoService(new IndexedDbMemoStore());

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

function renderMemos(memos) {
  listElement.replaceChildren();

  if (memos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No memos yet. Capture the first one above.";
    listElement.append(empty);
    return;
  }

  for (const memo of memos) {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".memo-card");
    const title = fragment.querySelector(".memo-card__title");
    const time = fragment.querySelector(".memo-card__time");
    const content = fragment.querySelector(".memo-card__content");
    const deleteButton = fragment.querySelector("[data-action='delete']");

    card.dataset.memoId = memo.id;
    title.textContent = memo.title || "Untitled memo";
    time.dateTime = memo.createdAt;
    time.textContent = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(memo.createdAt));
    content.textContent = memo.content;
    deleteButton.dataset.memoId = memo.id;

    listElement.append(fragment);
  }
}

async function refresh() {
  const memos = await service.list();
  renderMemos(memos);
  setStatus(`${memos.length} ${memos.length === 1 ? "memo" : "memos"}`);
}

form.addEventListener("input", saveDraft);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  saveButton.disabled = true;

  try {
    await service.capture({ title: titleInput.value, content: contentInput.value });
    form.reset();
    clearDraft();
    await refresh();
    contentInput.focus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not save memo");
  } finally {
    saveButton.disabled = false;
  }
});

listElement.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action='delete']");
  if (!button) return;

  button.disabled = true;
  try {
    await service.delete(button.dataset.memoId);
    await refresh();
  } catch (error) {
    button.disabled = false;
    setStatus(error instanceof Error ? error.message : "Could not delete memo");
  }
});

restoreDraft();
refresh().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load local memos");
});
