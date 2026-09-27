import { test, expect } from "@playwright/test";

async function openCapture(page) {
  const panel = page.locator("#capture-panel");
  if (!(await panel.evaluate((element) => element.open))) {
    await panel.locator(":scope > summary").click();
  }
}

async function captureMemo(page, { title = "", content, color = "", labels = "" }) {
  await openCapture(page);
  if (title) await page.locator("#memo-title").fill(title);
  if (color) await page.locator("#memo-color").selectOption(color);
  if (labels) await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: content })).toBeVisible();
}

async function openViewControls(page) {
  const drawer = page.locator("details.utility-drawer");
  if (!(await drawer.evaluate((element) => element.open))) {
    await drawer.locator(":scope > summary").click();
  }
}

async function runMemoAction(card, name) {
  const menu = card.locator("details.memo-card-menu");
  if (!(await menu.evaluate((element) => element.open))) {
    await menu.locator(":scope > summary").click();
  }
  await card.getByRole("button", { name, exact: true }).click();
}

test("Glaze capture shell keeps primary writing workflow prominent", async ({ page }) => {
  await page.goto("/web/");

  await expect(page.getByRole("heading", { name: "Capture what matters." })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Memo location" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();
  await expect(page.locator(".brand__icon")).toHaveAttribute("src", "./assets/memos-icon.svg");
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", false);
  await expect(page.locator("details.utility-drawer")).toHaveJSProperty("open", false);
  await expect(page.locator("details.manager-drawer")).toHaveJSProperty("open", false);
  await page.locator("#capture-panel > summary").click();
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", true);
  await expect(page.locator("#memo-content")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save memo" })).toBeVisible();
});

test("first-use setup resumes and remains replayable", async ({ page }) => {
  await page.goto("/web/");
  await page.evaluate(() => {
    localStorage.removeItem("goreecloud-memos:setup-complete:v1");
    localStorage.removeItem("goreecloud-memos:setup-step:v1");
  });
  await page.reload();

  const dialog = page.locator("#setup-dialog");
  await expect(dialog).toBeVisible();
  await expect(page.locator("#setup-progress")).toHaveText("Step 1 of 3");
  const setupNextBox = await page.locator("#setup-next").boundingBox();
  expect(setupNextBox).not.toBeNull();
  expect(setupNextBox.height).toBeGreaterThanOrEqual(48);
  await page.keyboard.press("n");
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", false);
  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "Search memos" })).not.toBeFocused();

  await page.locator("#setup-next").click();
  await expect(page.locator("#setup-progress")).toHaveText("Step 2 of 3");
  await page.reload();
  await expect(dialog).toBeVisible();
  await expect(page.locator("#setup-progress")).toHaveText("Step 2 of 3");

  await page.locator("#setup-next").click();
  await page.locator("#setup-next").click();
  await expect(dialog).not.toBeVisible();

  await page.locator("#sidebar-settings").click();
  await page.locator("#replay-setup").click();
  await expect(dialog).toBeVisible();
  await expect(page.locator("#setup-progress")).toHaveText("Step 1 of 3");
});

test("contextual hints can be disabled and re-enabled persistently", async ({ page }) => {
  await page.goto("/web/");

  const hint = page.locator("#contextual-hint");
  await expect(hint).toBeVisible();

  await page.locator("#sidebar-settings").click();
  const hintsToggle = page.locator("#contextual-hints-enabled");
  await expect(hintsToggle).toBeChecked();
  await hintsToggle.uncheck();
  await expect(page.locator("#guidance-status")).toHaveText("Contextual hints are off.");
  await expect(hint).toBeHidden();

  await page.reload();
  await expect(hint).toBeHidden();
  await page.locator("#sidebar-settings").click();
  await expect(hintsToggle).not.toBeChecked();
  await hintsToggle.check();
  await expect(page.locator("#guidance-status")).toHaveText("Contextual hints are on.");
  await expect(hint).toBeVisible();
});

test("compact shell keeps primary controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/web/");

  const targets = [
    page.getByRole("button", { name: "Memos", exact: true }),
    page.getByRole("button", { name: "Archive", exact: true }),
    page.getByRole("button", { name: "Trash", exact: true }),
    page.locator("details.manager-drawer > summary"),
    page.locator("#memo-search"),
    page.locator("#topbar-new-memo"),
    page.locator("details.utility-drawer > summary")
  ];

  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(48);
  }

  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();
  await expect(page.locator("#topbar-new-memo")).toBeVisible();
  await expect(page.locator("details.utility-drawer > summary")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await captureMemo(page, { content: "Compact touch target memo" });
  const compactCard = page.locator(".memo-card", { hasText: "Compact touch target memo" });
  const memoSelectBox = await compactCard.locator(".memo-select").boundingBox();
  expect(memoSelectBox).not.toBeNull();
  expect(memoSelectBox.height).toBeGreaterThanOrEqual(48);

  const memoMenuTrigger = compactCard.locator("details.memo-card-menu > summary");
  const menuBox = await memoMenuTrigger.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(menuBox.height).toBeGreaterThanOrEqual(48);
  await memoMenuTrigger.click();
  const actionButtons = compactCard.locator(".memo-card__actions button");
  const actionCount = await actionButtons.count();
  expect(actionCount).toBeGreaterThan(0);
  for (let index = 0; index < actionCount; index += 1) {
    const box = await actionButtons.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  await page.keyboard.press("Escape");

  await openViewControls(page);
  const presentationTarget = await page.getByRole("radio", { name: "Comfortable" }).locator("..").boundingBox();
  expect(presentationTarget).not.toBeNull();
  expect(presentationTarget.height).toBeGreaterThanOrEqual(48);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 768, height: 1024 });
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(48);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
    document.body.style.minHeight = "1800px";
    window.scrollTo(0, 600);
  });
  await expect(page.getByRole("heading", { name: "Capture what matters." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const compactNavBox = await page.locator(".sidebar").boundingBox();
  const topbarBox = await page.locator(".topbar").boundingBox();
  expect(compactNavBox).not.toBeNull();
  expect(topbarBox).not.toBeNull();
  expect(topbarBox.y).toBeGreaterThanOrEqual(compactNavBox.y + compactNavBox.height - 1);
});

test("Glaze accessibility media modes preserve the primary shell", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });
  await page.goto("/web/");

  await expect(page.getByRole("heading", { name: "Capture what matters." })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();

  const mediaState = await page.evaluate(() => ({
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    increasedContrast: matchMedia("(prefers-contrast: more)").matches,
    heroBorderWidth: Number.parseFloat(getComputedStyle(document.querySelector(".hero-card")).borderTopWidth),
    captureTransition: getComputedStyle(document.querySelector("#capture-panel")).transitionDuration,
    hasReducedTransparencyFallback: [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules];
        } catch {
          return [];
        }
      })
      .some((rule) => rule.cssText.includes("prefers-reduced-transparency"))
  }));

  expect(mediaState.reducedMotion).toBe(true);
  expect(mediaState.increasedContrast).toBe(true);
  expect(mediaState.heroBorderWidth).toBeGreaterThanOrEqual(2);
  expect(mediaState.hasReducedTransparencyFallback).toBe(true);

  await page.emulateMedia({ forcedColors: "active" });
  await expect(page.getByRole("heading", { name: "Capture what matters." })).toBeVisible();
  expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
});

test("workspace lifecycle counts stay exact across filters and state changes", async ({ page }) => {
  await page.goto("/web/");

  const activeCount = page.locator('[data-view-count="active"]').first();
  const archivedCount = page.locator('[data-view-count="archived"]').first();
  const trashedCount = page.locator('[data-view-count="trashed"]').first();

  await expect(activeCount).toHaveText("0");
  await expect(archivedCount).toHaveText("0");
  await expect(trashedCount).toHaveText("0");

  await captureMemo(page, { title: "Count One", content: "First count memo" });
  await captureMemo(page, { title: "Count Two", content: "Second count memo" });
  await expect(activeCount).toHaveText("2");
  await expect(archivedCount).toHaveText("0");
  await expect(trashedCount).toHaveText("0");

  await page.locator("#memo-search").fill("Count One");
  await expect(page.locator(".memo-card")).toHaveCount(1);
  await expect(activeCount).toHaveText("2");
  await page.getByRole("button", { name: "Clear search and filters" }).click();

  let card = page.locator(".memo-card", { hasText: "First count memo" });
  await runMemoAction(card, "Archive");
  await expect(activeCount).toHaveText("1");
  await expect(archivedCount).toHaveText("1");
  await expect(trashedCount).toHaveText("0");

  const location = page.getByRole("navigation", { name: "Memo location" });
  await location.getByRole("button", { name: "Archive", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "First count memo" });
  await runMemoAction(card, "Move to Trash");
  await expect(activeCount).toHaveText("1");
  await expect(archivedCount).toHaveText("0");
  await expect(trashedCount).toHaveText("1");

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "First count memo" });
  await runMemoAction(card, "Restore");
  await expect(activeCount).toHaveText("1");
  await expect(archivedCount).toHaveText("1");
  await expect(trashedCount).toHaveText("0");
});

test("Archive and Trash keep lifecycle context explicit", async ({ page }) => {
  await page.goto("/web/");

  const location = page.getByRole("navigation", { name: "Memo location" });

  await location.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(location.getByRole("button", { name: "Archive", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(location.getByRole("button", { name: "Memos", exact: true })).not.toHaveAttribute("aria-current", "page");
  await expect(page.locator("#view-hero")).toHaveAttribute("data-view-surface", "archived");
  await expect(page.getByRole("heading", { name: "Keep the active space light." })).toBeVisible();
  await expect(page.locator("#capture-panel")).toBeHidden();

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  await expect(page.locator("#view-hero")).toHaveAttribute("data-view-surface", "trashed");
  await expect(page.getByRole("heading", { name: "Recover what you need." })).toBeVisible();
  await expect(page.locator("#capture-panel")).toBeHidden();

  await page.locator("#topbar-new-memo").click();
  await expect(location.getByRole("button", { name: "Memos", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", true);
  await expect(page.locator("#memo-content")).toBeFocused();
});

test("native shell shortcuts and Glaze appearance preference persist locally", async ({ page }) => {
  await page.goto("/web/");

  await openViewControls(page);
  const utilitySummary = page.locator("details.utility-drawer > summary");
  await page.keyboard.press("Escape");
  await expect(page.locator("details.utility-drawer")).toHaveJSProperty("open", false);
  await expect(utilitySummary).toBeFocused();

  await page.keyboard.press("/");
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeFocused();
  await page.getByRole("searchbox", { name: "Search memos" }).blur();

  await page.keyboard.press("n");
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", true);
  await expect(page.locator("#memo-content")).toBeFocused();

  await openViewControls(page);
  await page.getByRole("radio", { name: "Deep Dark" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "deep-dark");
  await expect(page.locator("#appearance-status")).toHaveText("Appearance: Deep Dark.");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-appearance", "deep-dark");
  await openViewControls(page);
  await expect(page.getByRole("radio", { name: "Deep Dark" })).toBeChecked();
});

// Native shell context coverage follows the primary shell tests.
test("memo secondary controls hydrate only when requested", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { title: "Lazy controls", content: "Hydrate secondary UI on demand" });

  const card = page.locator(".memo-card", { hasText: "Hydrate secondary UI on demand" });
  await expect(card.locator(".memo-editor")).toHaveCount(0);
  await expect(card.locator(".memo-card__actions button")).toHaveCount(0);

  const menu = card.locator("details.memo-card-menu");
  await menu.locator(":scope > summary").click();
  await expect(card.locator(".memo-card__actions button")).toHaveCount(4);
  await expect(card.locator(".memo-editor")).toHaveCount(0);

  await card.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(card.locator(".memo-editor")).toHaveCount(1);
  await expect(card.locator("[data-edit-field='content']")).toHaveValue("Hydrate secondary UI on demand");
  await expect(card.locator("[data-edit-field='content']")).toBeFocused();

  await runMemoAction(card, "Close editor");
  await expect(card.locator(".memo-editor")).toBeHidden();
});

test("draft recovery and saved memo persistence survive reload", async ({ page }) => {
  await page.goto("/web/");
  await openCapture(page);
  await page.locator("#memo-title").fill("Draft title");
  await page.locator("#memo-color").selectOption("teal");
  await page.locator("#memo-labels").fill("Work, Ideas");
  await page.locator("#memo-content").fill("Recovered draft");
  await expect(page.getByText("Draft saved on this device.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#memo-title")).toHaveValue("Draft title");
  await expect(page.locator("#memo-color")).toHaveValue("teal");
  await expect(page.locator("#memo-labels")).toHaveValue("Work, Ideas");
  await expect(page.locator("#memo-content")).toHaveValue("Recovered draft");
  await page.getByRole("button", { name: "Save memo" }).click();
  const card = page.locator(".memo-card", { hasText: "Recovered draft" });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute("data-color", "teal");
  await expect(card.getByText("Work", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator(".memo-card", { hasText: "Recovered draft" })).toBeVisible();

  const snapshot = await readManagedSnapshot(page);
  const saved = snapshot.memos.find((memo) => memo.content === "Recovered draft");
  expect(saved.schemaVersion).toBe(4);
  expect(saved.labelIds).toHaveLength(2);
  expect(snapshot.labels.map((label) => label.name).sort()).toEqual(["Ideas", "Work"]);
  expect(snapshot.memoLabels.filter((relation) => relation.memoId === saved.id)).toHaveLength(2);
});

test("editing autosaves organization metadata and survives reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Before edit" });

  const card = page.locator(".memo-card").first();
  await expect(card.locator(".memo-card__content")).toHaveText("Before edit");
  await runMemoAction(card, "Edit");
  await card.locator("[data-edit-field='content']").fill("After edit");
  await card.locator("[data-edit-field='color']").selectOption("purple");
  await card.locator("[data-edit-field='labels']").fill("Research, Reference, research");
  await expect(card.locator(".editor-status")).toHaveText("Saved.");
  await expect(card.locator(".memo-card__content")).toHaveText("After edit");
  await expect(card).toHaveAttribute("data-color", "purple");
  await expect(card.getByText("Research", { exact: true })).toBeVisible();
  await expect(card.getByText("Reference", { exact: true })).toBeVisible();

  await page.reload();
  const reloaded = page.locator(".memo-card", { hasText: "After edit" });
  await expect(reloaded).toBeVisible();
  await expect(reloaded).toHaveAttribute("data-color", "purple");
  await expect(reloaded.getByText("Research", { exact: true })).toHaveCount(1);
});

test("pinning retains manual order across reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "First pinned memo", color: "blue", labels: "Work" });
  await captureMemo(page, { content: "Second pinned memo", color: "green", labels: "Ideas" });

  let first = page.locator(".memo-card", { hasText: "First pinned memo" });
  let second = page.locator(".memo-card", { hasText: "Second pinned memo" });
  await runMemoAction(first, "Pin");
  await runMemoAction(page.locator(".memo-card", { hasText: "Second pinned memo" }), "Pin");
  await expect(page.locator(".memo-card").nth(0)).toContainText("First pinned memo");

  first = page.locator(".memo-card", { hasText: "First pinned memo" });
  await runMemoAction(first, "Move pin down");
  await expect(page.locator(".memo-card").nth(0)).toContainText("Second pinned memo");
  await expect(page.locator(".memo-card").nth(1)).toContainText("First pinned memo");

  await page.reload();
  await expect(page.locator(".memo-card").nth(0)).toContainText("Second pinned memo");
  await expect(page.locator(".memo-card").nth(1)).toContainText("First pinned memo");
  first = page.locator(".memo-card", { hasText: "First pinned memo" });
  await runMemoAction(first, "Unpin");
  await expect(page.locator(".memo-card", { hasText: "First pinned memo" }).getByText("Pinned", { exact: true })).toHaveCount(0);
});

test("presentation mode is keyboard accessible and persists across reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Presentation memo", color: "blue", labels: "Layout" });
  await openViewControls(page);

  const list = page.locator("#memo-list");
  const comfortable = page.getByRole("radio", { name: "Comfortable" });
  const compact = page.getByRole("radio", { name: "Compact" });
  const listMode = page.getByRole("radio", { name: "List", exact: true });
  const dense = page.getByRole("radio", { name: "Dense" });

  await expect(comfortable).toBeChecked();
  await expect(list).toHaveAttribute("data-presentation", "comfortable");
  await comfortable.focus();
  await page.keyboard.press("ArrowRight");
  await expect(compact).toBeChecked();
  await expect(list).toHaveAttribute("data-presentation", "compact");

  await page.reload();
  await openViewControls(page);
  await expect(compact).toBeChecked();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "compact");
  await listMode.check();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "list");
  await dense.check();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "dense");

  await page.reload();
  await openViewControls(page);
  await expect(page.getByRole("radio", { name: "Dense" })).toBeChecked();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "dense");
});

test("Archive and Trash are recoverable before explicit permanent deletion", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Lifecycle memo" });

  let card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await runMemoAction(card, "Archive");
  await expect(card).toHaveCount(0);

  const location = page.getByRole("navigation", { name: "Memo location" });
  await location.getByRole("button", { name: "Archive", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await runMemoAction(card, "Move to Trash");
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await runMemoAction(card, "Restore");
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Archive", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await runMemoAction(card, "Restore");
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Memos", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await runMemoAction(card, "Move to Trash");
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await runMemoAction(card, "Delete permanently");
  await expect(page.getByText("Trash is empty.")).toBeVisible();
});

async function seedLegacyMemo(page, version) {
  await page.goto("/README.md");
  await page.evaluate(async (databaseVersion) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("goreecloud-memos-local", databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.createObjectStore("memos", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        if (databaseVersion >= 2) store.createIndex("state", "state", { unique: false });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("memos", "readwrite");
        tx.objectStore("memos").put({
          schemaVersion: databaseVersion,
          id: `legacy-${databaseVersion}`,
          title: `Legacy v${databaseVersion} memo`,
          content: `Preserved through v${databaseVersion} migration`,
          createdAt: "2026-09-17T10:00:00.000Z",
          updatedAt: "2026-09-17T10:00:00.000Z",
          state: "active",
          pinned: databaseVersion === 2,
          archivedAt: null,
          trashedAt: null,
          restoreState: null
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, version);
}

async function seedSchemaV3Labels(page) {
  await page.goto("/README.md");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("goreecloud-memos-local", 3);
      request.onupgradeneeded = () => {
        const database = request.result;
        const store = database.createObjectStore("memos", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
        store.createIndex("state", "state", { unique: false });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("memos", "readwrite");
        const store = tx.objectStore("memos");
        const base = {
          schemaVersion: 3,
          title: "",
          color: null,
          state: "active",
          pinned: false,
          pinOrder: null,
          archivedAt: null,
          trashedAt: null,
          restoreState: null
        };
        store.put({ ...base, id: "v3-a", content: "First v3", labels: ["Work", "Ideas"], createdAt: "2026-09-17T09:00:00.000Z", updatedAt: "2026-09-17T09:00:00.000Z" });
        store.put({ ...base, id: "v3-b", content: "Second v3", labels: ["work", "Research"], createdAt: "2026-09-17T10:00:00.000Z", updatedAt: "2026-09-17T10:00:00.000Z" });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

async function seedSchemaV4ManagedState(page) {
  await page.goto("/README.md");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("goreecloud-memos-local", 4);
      request.onupgradeneeded = () => {
        const database = request.result;
        const memoStore = database.createObjectStore("memos", { keyPath: "id" });
        memoStore.createIndex("updatedAt", "updatedAt", { unique: false });
        memoStore.createIndex("state", "state", { unique: false });
        const labelStore = database.createObjectStore("labels", { keyPath: "id" });
        labelStore.createIndex("nameKey", "nameKey", { unique: true });
        const relationStore = database.createObjectStore("memoLabels", { keyPath: ["memoId", "labelId"] });
        relationStore.createIndex("memoId", "memoId", { unique: false });
        relationStore.createIndex("labelId", "labelId", { unique: false });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["memos", "labels", "memoLabels"], "readwrite");
        tx.objectStore("memos").put({
          schemaVersion: 4,
          id: "v4-memo",
          title: "V4 managed memo",
          content: "Preserve managed identity through v5",
          color: "blue",
          labels: ["Work"],
          labelIds: ["label-work"],
          createdAt: "2026-09-18T12:00:00.000Z",
          updatedAt: "2026-09-18T12:00:00.000Z",
          state: "active",
          pinned: false,
          pinOrder: null,
          archivedAt: null,
          trashedAt: null,
          restoreState: null
        });
        tx.objectStore("labels").put({
          schemaVersion: 2,
          id: "label-work",
          name: "Work",
          nameKey: "work",
          color: "purple",
          icon: "💼",
          description: "Preserve me",
          createdAt: "2026-09-18T12:00:00.000Z",
          updatedAt: "2026-09-18T12:00:00.000Z"
        });
        tx.objectStore("memoLabels").put({ memoId: "v4-memo", labelId: "label-work" });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

async function readManagedSnapshot(page) {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("goreecloud-memos-local", 5);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(["memos", "labels", "memoLabels", "savedViews"], "readonly");
      const result = {};
      const reads = [
        ["memos", tx.objectStore("memos").getAll()],
        ["labels", tx.objectStore("labels").getAll()],
        ["memoLabels", tx.objectStore("memoLabels").getAll()],
        ["savedViews", tx.objectStore("savedViews").getAll()]
      ];
      let remaining = reads.length;
      for (const [key, read] of reads) {
        read.onerror = () => reject(read.error);
        read.onsuccess = () => {
          result[key] = read.result;
          remaining -= 1;
          if (remaining === 0) {
            result.version = db.version;
            db.close();
            resolve(result);
          }
        };
      }
    };
  }));
}

test("opening database v5 migrates an existing schema v1 memo", async ({ page }) => {
  await seedLegacyMemo(page, 1);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "Preserved through v1 migration" })).toBeVisible();
  const snapshot = await readManagedSnapshot(page);
  const record = snapshot.memos.find((memo) => memo.id === "legacy-1");
  expect(snapshot.version).toBe(5);
  expect(record.schemaVersion).toBe(4);
  expect(record.labelIds).toEqual([]);
});

test("opening database v5 migrates an existing schema v2 memo and preserves pin state", async ({ page }) => {
  await seedLegacyMemo(page, 2);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "Preserved through v2 migration" })).toBeVisible();
  const snapshot = await readManagedSnapshot(page);
  const record = snapshot.memos.find((memo) => memo.id === "legacy-2");
  expect(record.schemaVersion).toBe(4);
  expect(record.pinned).toBe(true);
  expect(Number.isSafeInteger(record.pinOrder)).toBe(true);
  expect(record.labelIds).toEqual([]);
});

test("opening database v5 preserves existing v4 managed identities and adds an empty saved view store", async ({ page }) => {
  await seedSchemaV4ManagedState(page);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "Preserve managed identity through v5" })).toBeVisible();

  const snapshot = await readManagedSnapshot(page);
  expect(snapshot.version).toBe(5);
  expect(snapshot.memos).toHaveLength(1);
  expect(snapshot.labels).toHaveLength(1);
  expect(snapshot.memoLabels).toEqual([{ memoId: "v4-memo", labelId: "label-work" }]);
  expect(snapshot.savedViews).toEqual([]);

  const memo = snapshot.memos[0];
  const label = snapshot.labels[0];
  expect(memo.labelIds).toEqual(["label-work"]);
  expect(memo.labels).toEqual(["Work"]);
  expect(label.id).toBe("label-work");
  expect(label.name).toBe("Work");
  expect(label.color).toBe("purple");
  expect(label.icon).toBe("💼");
  expect(label.description).toBe("Preserve me");
});

test("opening database v5 migrates v3 label names into stable managed labels and memo-label relations", async ({ page }) => {
  await seedSchemaV3Labels(page);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "First v3" }).getByText("Work", { exact: true })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Second v3" }).getByText("Work", { exact: true })).toBeVisible();

  const snapshot = await readManagedSnapshot(page);
  expect(snapshot.version).toBe(5);
  expect(snapshot.labels).toHaveLength(3);
  expect(snapshot.memoLabels).toHaveLength(4);

  const work = snapshot.labels.find((label) => label.nameKey === "work");
  expect(work).toBeTruthy();
  expect(work.name).toBe("Work");
  expect(typeof work.id).toBe("string");
  expect(work.id.length).toBeGreaterThan(0);

  const first = snapshot.memos.find((memo) => memo.id === "v3-a");
  const second = snapshot.memos.find((memo) => memo.id === "v3-b");
  expect(first.schemaVersion).toBe(4);
  expect(second.schemaVersion).toBe(4);
  expect(first.labelIds).toContain(work.id);
  expect(second.labelIds).toContain(work.id);
  expect(first.labels).toEqual(["Work", "Ideas"]);
  expect(second.labels).toEqual(["Work", "Research"]);
});
