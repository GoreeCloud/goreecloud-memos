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
const utilitySummary = utilityDrawer?.querySelector(":scope > summary");
const managerDrawer = document.querySelector("details.manager-drawer");
const managerSummary = managerDrawer?.querySelector(":scope > summary");
const settingsPanel = document.querySelector("#view-settings-panel");
const sidebarSettings = document.querySelector("#sidebar-settings");
const sidebarNewMemo = document.querySelector("#sidebar-new-memo");
const topbarNewMemo = document.querySelector("#topbar-new-memo");
const appearanceInputs = [...document.querySelectorAll("input[name='appearance']")];
const appearanceStatus = document.querySelector("#appearance-status");

const VIEW_COPY = Object.freeze({
  active: {
    workspace: "Memos",
    board: "Memos",
    eyebrow: "Quick notes",
    title: "Capture what matters.",
    description: "Fast capture with labels, color, Archive, and recoverable Trash in your private local GoreeCloud workspace.",
    chipIcon: "⌾",
    chipLabel: "Private · local"
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
  for (const button of viewButtons) {
    if (button.dataset.view === view) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  if (workspaceTitle) workspaceTitle.textContent = copy.workspace;
  if (boardTitle) boardTitle.textContent = copy.board;
  if (heroEyebrow) heroEyebrow.textContent = copy.eyebrow;
  if (heroTitle) heroTitle.textContent = copy.title;
  if (heroDescription) heroDescription.textContent = copy.description;
  if (heroChipIcon) heroChipIcon.textContent = copy.chipIcon;
  if (heroChipLabel) heroChipLabel.textContent = copy.chipLabel;
  if (hero) {
    hero.dataset.viewSurface = view;
    hero.hidden = false;
  }
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

function closeTransientUi({ restoreFocus = true } = {}) {
  let focusTarget = null;

  if (utilityDrawer?.open) {
    utilityDrawer.open = false;
    focusTarget ??= utilitySummary;
  }

  if (managerDrawer?.open) {
    managerDrawer.open = false;
    focusTarget ??= managerSummary;
  }

  for (const menu of document.querySelectorAll("details.memo-card-menu[open]")) {
    menu.open = false;
    focusTarget ??= menu.querySelector(":scope > summary");
  }

  if (restoreFocus && focusTarget instanceof HTMLElement) {
    requestAnimationFrame(() => focusTarget.focus());
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

function syncCompactShell() {
  const compact = window.matchMedia("(max-width: 900px)").matches;
  const labelSection = managerDrawer?.closest(".sidebar-label-section");
  const sidebar = managerDrawer?.closest(".sidebar");
  const workspaceNav = sidebar?.querySelector(".workspace-nav");

  if (sidebar instanceof HTMLElement) {
    sidebar.style.gridTemplateColumns = compact ? "auto minmax(0, 1fr)" : "";
  }

  if (workspaceNav instanceof HTMLElement) {
    workspaceNav.style.paddingInlineEnd = compact ? "56px" : "";
  }

  for (const button of viewButtons) {
    button.style.paddingInline = compact ? "4px" : "";
    const count = button.querySelector(".nav-count");
    if (count instanceof HTMLElement) count.style.display = compact ? "none" : "";
  }

  if (labelSection instanceof HTMLElement) {
    labelSection.style.display = compact ? "block" : "";
    labelSection.style.margin = compact ? "0 0 0 0.2rem" : "";
    labelSection.style.padding = compact ? "0" : "";
    const headingRow = labelSection.querySelector(".sidebar-heading-row");
    const labelList = labelSection.querySelector(".sidebar-label-list");
    if (headingRow instanceof HTMLElement) headingRow.style.display = compact ? "none" : "";
    if (labelList instanceof HTMLElement) labelList.style.display = compact ? "none" : "";
  }

  if (managerDrawer instanceof HTMLElement) {
    managerDrawer.style.position = compact ? "absolute" : "";
    managerDrawer.style.top = compact ? "5px" : "";
    managerDrawer.style.insetInlineEnd = compact ? "8px" : "";
    managerDrawer.style.width = compact ? "48px" : "";
    managerDrawer.style.margin = compact ? "0" : "";
    managerDrawer.style.zIndex = compact ? "2" : "";
  }

  if (managerSummary instanceof HTMLElement) {
    managerSummary.style.display = compact ? "flex" : "";
    managerSummary.style.width = compact ? "48px" : "";
    managerSummary.style.height = compact ? "48px" : "";
    managerSummary.style.minHeight = compact ? "48px" : "";
    managerSummary.style.justifyContent = compact ? "center" : "";
    managerSummary.style.padding = compact ? "0" : "";
    const summaryLabel = managerSummary.querySelector("span:last-child");
    if (summaryLabel instanceof HTMLElement) summaryLabel.style.display = compact ? "none" : "";
  }
}

for (const button of viewButtons) {
  button.addEventListener("click", () => {
    closeTransientUi({ restoreFocus: false });
    applyViewCopy(button.dataset.view);
  });
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
  if (event.key === "Escape") {
    closeTransientUi();
    return;
  }

  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
  if (document.querySelector("dialog[open]")) return;
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

window.addEventListener("resize", syncCompactShell);
syncCompactShell();
applyAppearance(loadAppearance());
applyViewCopy(currentView());
