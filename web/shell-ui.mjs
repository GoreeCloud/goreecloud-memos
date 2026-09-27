const APPEARANCE_KEY = "goreecloud-memos:appearance:v1";
const APPEARANCES = new Set(["system", "light", "dark", "deep-dark"]);

const workspaceTitle = document.querySelector("#workspace-title");
const boardTitle = document.querySelector("#memos-heading");
const viewButtons = [...document.querySelectorAll("[data-view]")];
const hero = document.querySelector("#view-hero");
const heroEyebrow = document.querySelector("#view-eyebrow");
const heroTitle = document.querySelector("#view-title");
const heroDescription = document.querySelector("#view-description");
const heroChipIcon = document.querySelector("#view-chip-icon");
const heroChipLabel = document.querySelector("#view-chip-label");
const capturePanel = document.querySelector("#capture-panel");
const captureContent = document.querySelector("#memo-content");
const searchInput = document.querySelector("#memo-search");
const utilityDrawer = document.querySelector("details.utility-drawer");
const settingsPanel = document.querySelector("#view-settings-panel");
const sidebarSettings = document.querySelector("#sidebar-settings");
const sidebarNewMemo = document.querySelector("#sidebar-new-memo");
const topbarNewMemo = document.querySelector("#topbar-new-memo");
const appearanceInputs = [...document.querySelectorAll("input[name='appearance']")];
const appearanceStatus = document.querySelector("#appearance-status");

const VIEW_COPY = Object.freeze({
  active: {
    workspace: "Capture space",
    board: "Memos",
    eyebrow: "Quick notes",
    title: "Capture what matters.",
    description: "Fast local capture with labels, color, Archive, recoverable Trash, search, and saved views in your private GoreeCloud workspace.",
    chipIcon: "⌾",
    chipLabel: "Local to this browser"
  },
  archived: {
    workspace: "Archive",
    board: "Archive",
    eyebrow: "Library",
    title: "Keep the active space light.",
    description: "Archived memos stay intact and searchable here until you restore them or move them to Trash.",
    chipIcon: "▣",
    chipLabel: "Saved, not deleted"
  },
  trashed: {
    workspace: "Trash",
    board: "Trash",
    eyebrow: "Recovery",
    title: "Recover what you need.",
    description: "Trash is a holding area. Memos remain here until you restore them or explicitly delete them permanently.",
    chipIcon: "↶",
    chipLabel: "Manual recovery"
  }
});

const APPEARANCE_COPY = Object.freeze({
  system: "Appearance: Follow system.",
  light: "Appearance: Light.",
  dark: "Appearance: Dark.",
  "deep-dark": "Appearance: Deep Dark."
});

function currentView() {
  return document.querySelector("[data-view][aria-pressed='true']")?.dataset.view ?? "active";
}

function applyViewCopy(view) {
  const copy = VIEW_COPY[view] ?? VIEW_COPY.active;
  if (workspaceTitle) workspaceTitle.textContent = copy.workspace;
  if (boardTitle) boardTitle.textContent = copy.board;
  if (heroEyebrow) heroEyebrow.textContent = copy.eyebrow;
  if (heroTitle) heroTitle.textContent = copy.title;
  if (heroDescription) heroDescription.textContent = copy.description;
  if (heroChipIcon) heroChipIcon.textContent = copy.chipIcon;
  if (heroChipLabel) heroChipLabel.textContent = copy.chipLabel;
  if (hero) hero.dataset.viewSurface = view;
  if (capturePanel) capturePanel.hidden = view !== "active";
  document.body.dataset.memoView = view;
}

function loadAppearance() {
  try {
    const saved = localStorage.getItem(APPEARANCE_KEY);
    return APPEARANCES.has(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

function applyAppearance(mode, { persist = false } = {}) {
  const next = APPEARANCES.has(mode) ? mode : "system";
  if (next === "system") {
    delete document.documentElement.dataset.appearance;
  } else {
    document.documentElement.dataset.appearance = next;
  }

  for (const input of appearanceInputs) {
    input.checked = input.value === next;
  }

  if (appearanceStatus) {
    appearanceStatus.textContent = APPEARANCE_COPY[next];
  }

  if (!persist) return;

  try {
    localStorage.setItem(APPEARANCE_KEY, next);
  } catch {
    if (appearanceStatus) {
      appearanceStatus.textContent += " Preference could not be stored in this browser.";
    }
  }
}

function openSettings() {
  if (!utilityDrawer) return;
  utilityDrawer.open = true;
  requestAnimationFrame(() => {
    settingsPanel?.querySelector("select, input, button")?.focus();
  });
}

function openCapture() {
  const activeButton = viewButtons.find((button) => button.dataset.view === "active");
  if (activeButton && activeButton.getAttribute("aria-pressed") !== "true") {
    activeButton.click();
  }

  if (!capturePanel) return;
  capturePanel.hidden = false;
  capturePanel.open = true;
  requestAnimationFrame(() => captureContent?.focus());
}

function isTypingTarget(target) {
  return target instanceof Element &&
    Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

for (const button of viewButtons) {
  button.addEventListener("click", () => applyViewCopy(button.dataset.view));
}

for (const input of appearanceInputs) {
  input.addEventListener("change", () => {
    if (input.checked) applyAppearance(input.value, { persist: true });
  });
}

sidebarSettings?.addEventListener("click", openSettings);
sidebarNewMemo?.addEventListener("click", openCapture);
topbarNewMemo?.addEventListener("click", openCapture);

document.addEventListener("keydown", (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (isTypingTarget(event.target)) return;

  if (event.key === "/") {
    event.preventDefault();
    searchInput?.focus();
    return;
  }

  if (event.key.toLocaleLowerCase() === "n") {
    event.preventDefault();
    openCapture();
    return;
  }

  if (event.key === "Escape" && utilityDrawer?.open) {
    utilityDrawer.open = false;
  }
});

applyAppearance(loadAppearance());
applyViewCopy(currentView());
