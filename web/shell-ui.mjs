const APPEARANCE_KEY = "goreecloud-memos:appearance:v1";
const VALID_APPEARANCES = new Set(["system", "light", "dark", "deep-dark"]);

const workspaceTitle = document.querySelector("#workspace-title");
const boardTitle = document.querySelector("#memos-heading");
const viewButtons = [...document.querySelectorAll("[data-view]")];
const appearanceInputs = [...document.querySelectorAll("input[name='appearance']")];
const appearanceStatus = document.querySelector("#appearance-status");
const searchInput = document.querySelector("#memo-search");
const capturePanel = document.querySelector("#capture-panel");
const captureContent = document.querySelector("#memo-content");
const utilityDrawer = document.querySelector("details.utility-drawer");
const managerDrawer = document.querySelector("details.manager-drawer");

const VIEW_COPY = Object.freeze({
  active: { workspace: "Capture space", board: "Memos" },
  archived: { workspace: "Archive", board: "Archive" },
  trashed: { workspace: "Trash", board: "Trash" }
});

const APPEARANCE_COPY = Object.freeze({
  system: "Follow system",
  light: "Light",
  dark: "Dark",
  "deep-dark": "Deep Dark"
});

function applyViewCopy(view) {
  const copy = VIEW_COPY[view] ?? VIEW_COPY.active;
  if (workspaceTitle) workspaceTitle.textContent = copy.workspace;
  if (boardTitle) boardTitle.textContent = copy.board;
  document.body.dataset.memoView = view;
}

function readAppearance() {
  const saved = localStorage.getItem(APPEARANCE_KEY);
  return VALID_APPEARANCES.has(saved) ? saved : "system";
}

function applyAppearance(appearance, { persist = false } = {}) {
  const next = VALID_APPEARANCES.has(appearance) ? appearance : "system";
  if (next === "system") {
    document.documentElement.removeAttribute("data-appearance");
  } else {
    document.documentElement.dataset.appearance = next;
  }

  for (const input of appearanceInputs) input.checked = input.value === next;
  if (appearanceStatus) appearanceStatus.textContent = `Appearance: ${APPEARANCE_COPY[next]}.`;
  if (persist) localStorage.setItem(APPEARANCE_KEY, next);
}

function isTypingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

function closeTransientUi() {
  if (utilityDrawer) utilityDrawer.open = false;
  if (managerDrawer) managerDrawer.open = false;
  for (const menu of document.querySelectorAll("details.memo-card-menu[open]")) menu.open = false;
}

function openCapture() {
  if (!capturePanel) return;
  capturePanel.open = true;
  requestAnimationFrame(() => captureContent?.focus());
}

for (const button of viewButtons) {
  button.addEventListener("click", () => applyViewCopy(button.dataset.view));
}

for (const input of appearanceInputs) {
  input.addEventListener("change", () => {
    if (input.checked) applyAppearance(input.value, { persist: true });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeTransientUi();
    return;
  }

  if (isTypingTarget(event.target)) return;

  if (event.key === "/") {
    event.preventDefault();
    searchInput?.focus();
    return;
  }

  if (event.key.toLocaleLowerCase() === "n") {
    event.preventDefault();
    openCapture();
  }
});

applyViewCopy(
  document.querySelector("[data-view][aria-pressed='true']")?.dataset.view ?? "active"
);
applyAppearance(readAppearance());
