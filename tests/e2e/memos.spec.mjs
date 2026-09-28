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
  if (color) await page.locator(`#memo-form .color-swatch[data-color="${color}"]`).click();
  if (labels) {
    const labelEntry = page.locator("#memo-form .label-picker__entry");
    await labelEntry.fill(labels);
    await labelEntry.press("Enter");
  }
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

  await expect(page.locator("#memos-heading")).toHaveText("Memos");
  await expect(page.getByRole("navigation", { name: "Memo location" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();
  await expect(page.locator(".brand__icon")).toHaveAttribute("src", "./assets/memos-icon.svg");
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", false);
  await expect(page.locator("#memo-list")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("details.utility-drawer")).toHaveJSProperty("open", false);
  await expect(page.locator("details.manager-drawer")).toHaveJSProperty("open", false);
  await page.locator("#capture-panel > summary").click();
  await expect(page.locator("#capture-panel")).toHaveJSProperty("open", true);
  await expect(page.locator("#memo-content")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save memo" })).toBeVisible();
});

test("desktop workspace keeps capture compact and memo cards vertical", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/web/");

  await expect(page.locator("#view-hero")).toBeVisible();
  await expect(page.locator("#view-hero")).toContainText("Capture what matters.");

  const privacyBox = await page.locator(".topbar-privacy").boundingBox();
  expect(privacyBox).not.toBeNull();
  expect(privacyBox.width).toBeLessThanOrEqual(120);
  expect(privacyBox.height).toBeLessThanOrEqual(40);
  const privacyIconBox = await page.locator(".topbar-privacy svg").boundingBox();
  expect(privacyIconBox).not.toBeNull();
  expect(privacyIconBox.width).toBeLessThanOrEqual(18);

  const brandTitle = page.locator(".brand__copy strong");
  await expect(brandTitle).toHaveText("GoreeCloud Memos");
  expect(await brandTitle.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);

  const collapsedCaptureBox = await page.locator("#capture-panel").boundingBox();
  expect(collapsedCaptureBox).not.toBeNull();
  expect(collapsedCaptureBox.height).toBeLessThanOrEqual(56);

  await openCapture(page);
  const captureBox = await page.locator("#capture-panel").boundingBox();
  expect(captureBox).not.toBeNull();
  expect(captureBox.height).toBeLessThanOrEqual(330);

  for (const [index, content] of [
    "Short vertical memo.",
    "A little more content keeps this card naturally taller without making the board wide.",
    "Memos should scan down the page like a note wall.",
    "Vertical cards preserve more notes above the fold."
  ].entries()) {
    await captureMemo(page, { title: `Vertical ${index + 1}`, content });
  }

  const metrics = await page.locator("#memo-list").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      columnCount: style.columnCount,
      columnWidth: parseFloat(style.columnWidth)
    };
  });
  expect(metrics.columnCount).toBe("4");
  expect(metrics.columnWidth).toBeLessThanOrEqual(260);

  const cardBox = await page.locator(".memo-card").first().boundingBox();
  expect(cardBox).not.toBeNull();
  expect(cardBox.width).toBeLessThanOrEqual(300);
});

test("mobile active workspace keeps capture chrome compact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/web/");

  await expect(page.locator("#view-hero")).toBeHidden();
  await expect(page.locator(".topbar-privacy")).toBeHidden();

  const location = page.getByRole("navigation", { name: "Memo location" });
  const sidebarBox = await page.locator(".sidebar").boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(sidebarBox.width).toBeGreaterThanOrEqual(380);
  await expect(page.locator(".sidebar-label-list")).toBeHidden();
  await expect(page.locator("details.manager-drawer > summary")).toBeHidden();
  await expect(page.locator(".sidebar-library")).toBeHidden();

  for (const name of ["Memos", "Archive", "Trash"]) {
    const tab = location.getByRole("button", { name, exact: true });
    await expect(tab).toBeVisible();
    const box = await tab.boundingBox();
    expect(box).not.toBeNull();
    expect(box.height).toBeGreaterThanOrEqual(48);
    const labelFits = await tab.locator(".nav-label").evaluate((element) => element.scrollWidth <= element.clientWidth);
    expect(labelFits, `${name} label should not be clipped`).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  const captureBox = await page.locator("#capture-panel").boundingBox();
  expect(captureBox).not.toBeNull();
  expect(captureBox.height).toBeLessThanOrEqual(70);
});

test("long memo cards stay compact until explicitly expanded", async ({ page }) => {
  await page.goto("/web/");

  const longContent = Array.from(
    { length: 14 },
    (_, index) => `Long memo preview line ${index + 1}: details remain fully local and available when expanded.`
  ).join("\n");

  await captureMemo(page, { title: "Long preview", content: longContent });

  const card = page.locator(".memo-card", { hasText: "Long preview" });
  const content = card.locator(".memo-card__content");
  const expand = card.locator("[data-expand-content]");

  await expect(card).toHaveClass(/memo-card--content-collapsed/);
  await expect(expand).toBeVisible();
  await expect(expand).toHaveText("Show more");
  await expect(expand).toHaveAttribute("aria-expanded", "false");

  const collapsedBox = await content.boundingBox();
  expect(collapsedBox).not.toBeNull();

  await expand.click();
  await expect(card).toHaveClass(/memo-card--content-expanded/);
  await expect(expand).toHaveText("Show less");
  await expect(expand).toHaveAttribute("aria-expanded", "true");

  const expandedBox = await content.boundingBox();
  expect(expandedBox).not.toBeNull();
  expect(expandedBox.height).toBeGreaterThan(collapsedBox.height);

  await expand.click();
  await expect(expand).toHaveAttribute("aria-expanded", "false");
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
  await expect(page.locator("#memo-list")).toHaveAttribute("aria-busy", "false");
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
  await expect(hint).toBeHidden();
  await page.keyboard.press("Escape");
  await expect(hint).toBeVisible();

  await openCapture(page);
  await expect(hint).toBeHidden();
  await page.locator("#capture-panel > summary").click();
  await expect(hint).toBeVisible();
});

test("compact shell keeps primary controls reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/web/");

  const targets = [
    page.getByRole("button", { name: "Memos", exact: true }),
    page.getByRole("button", { name: "Archive", exact: true }),
    page.getByRole("button", { name: "Trash", exact: true }),
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
  await expect(page.locator("#contextual-hint")).toBeHidden();
  await expect(page.locator("#topbar-new-memo")).toBeVisible();
  await expect(page.locator("details.utility-drawer > summary")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  await openViewControls(page);
  const mobileManageLabels = page.getByRole("button", { name: "Manage labels", exact: true });
  await expect(mobileManageLabels).toBeVisible();
  const mobileManageLabelsBox = await mobileManageLabels.boundingBox();
  expect(mobileManageLabelsBox).not.toBeNull();
  expect(mobileManageLabelsBox.height).toBeGreaterThanOrEqual(48);
  await mobileManageLabels.click();
  await expect(page.getByRole("heading", { name: "Manage labels" })).toBeVisible();
  await page.keyboard.press("Escape");

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

  const compactNav = page.locator(".sidebar");
  const compactTopbar = page.locator(".topbar");
  const location = page.getByRole("navigation", { name: "Memo location" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  for (const viewName of ["Memos", "Archive", "Trash"]) {
    await location.getByRole("button", { name: viewName, exact: true }).click();
    const navBox = await compactNav.boundingBox();
    const topbarBox = await compactTopbar.boundingBox();
    expect(navBox).not.toBeNull();
    expect(topbarBox).not.toBeNull();
    expect(
      topbarBox.y,
      `${viewName} top bar should remain attached to the compact navigation at document top`
    ).toBeLessThanOrEqual(navBox.y + navBox.height + 1);
  }
  await location.getByRole("button", { name: "Memos", exact: true }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
    document.body.style.minHeight = "1800px";
    window.scrollTo(0, 600);
  });
  await expect(page.locator("#memos-heading")).toHaveText("Memos");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  const compactNavBox = await page.locator(".sidebar").boundingBox();
  const topbarBox = await page.locator(".topbar").boundingBox();
  expect(compactNavBox).not.toBeNull();
  expect(topbarBox).not.toBeNull();
  expect(topbarBox.y).toBeGreaterThanOrEqual(compactNavBox.y + compactNavBox.height - 1);
});

test("RTL layout direction preserves shell hierarchy and bounded overlays", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/web/");
  await page.evaluate(() => {
    document.documentElement.setAttribute("dir", "rtl");
  });

  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByRole("navigation", { name: "Memo location" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();

  const sidebarBox = await page.locator(".sidebar").boundingBox();
  const canvasBox = await page.locator(".workspace-canvas").boundingBox();
  expect(sidebarBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(sidebarBox.x).toBeGreaterThan(canvasBox.x);

  await captureMemo(page, { title: "RTL memo", content: "RTL resilience check" });
  const card = page.locator(".memo-card", { hasText: "RTL memo" });
  const menu = card.locator("details.memo-card-menu");
  await menu.locator(":scope > summary").click();
  await expect(menu).toHaveJSProperty("open", true);

  const actionsBox = await card.locator(".memo-card__actions").boundingBox();
  expect(actionsBox).not.toBeNull();
  expect(actionsBox.x).toBeGreaterThanOrEqual(0);
  expect(actionsBox.x + actionsBox.width).toBeLessThanOrEqual(1280);

  await page.keyboard.press("Escape");
  await openViewControls(page);
  const utilityBox = await page.locator(".utility-panel").boundingBox();
  expect(utilityBox).not.toBeNull();
  expect(utilityBox.x).toBeGreaterThanOrEqual(0);
  expect(utilityBox.x + utilityBox.width).toBeLessThanOrEqual(1280);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  )).toBe(true);
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toBeVisible();
});

test("Glaze accessibility media modes preserve the primary shell", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce", contrast: "more" });
  await page.goto("/web/");

  await expect(page.locator("#memos-heading")).toHaveText("Memos");
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
  await expect(page.locator("#memos-heading")).toHaveText("Memos");
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

  const search = page.locator("#memo-search");
  await search.fill("Count One");
  await expect(page.locator(".memo-card")).toHaveCount(1);
  await expect(activeCount).toHaveText("2");
  await search.fill("");
  await expect(page.locator(".memo-card")).toHaveCount(2);

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
  await expect(page.locator("#workspace-title")).toHaveText("Archive");
  await expect(page.locator("#workspace-description")).toHaveText("Saved notes, out of the active flow.");
  await expect(page.locator("#capture-panel")).toBeHidden();

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  await expect(page.locator("#view-hero")).toHaveAttribute("data-view-surface", "trashed");
  await expect(page.getByRole("heading", { name: "Recover what you need." })).toBeVisible();
  await expect(page.locator("#workspace-title")).toHaveText("Trash");
  await expect(page.locator("#workspace-description")).toHaveText("Recover or delete notes explicitly.");
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
test("memo click opens editing while the context menu stays secondary", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { title: "Direct edit", content: "Open the memo directly" });

  const card = page.locator(".memo-card", { hasText: "Open the memo directly" });
  await expect(card.locator(".memo-editor")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const cardBox = await card.boundingBox();
  const timeBox = await card.locator(".memo-card__time").boundingBox();
  expect(cardBox).not.toBeNull();
  expect(timeBox).not.toBeNull();
  expect(timeBox.x - cardBox.x).toBeLessThan(26);
  await expect(card.locator(".memo-card__time")).toHaveText("Just now");
  await expect(card.locator(".memo-card__time")).not.toHaveAttribute("title", "");

  const menu = card.locator("details.memo-card-menu");
  await menu.locator(":scope > summary").click();
  await expect(card.locator(".memo-select")).toHaveCSS("opacity", "0");
  await expect(card.locator(".memo-card__actions button")).toHaveCount(3);
  await expect(card.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);

  await page.locator("#memos-heading").click();
  await expect(menu).toHaveJSProperty("open", false);

  await card.locator(".memo-card__content").click();
  await expect(card.locator("[data-edit-field='content']")).toHaveValue("Open the memo directly");
  await expect(card.locator("[data-edit-field='content']")).toBeFocused();
  await expect(card).toHaveAttribute("aria-expanded", "true");
  await expect(card.locator(":scope > .memo-card__header")).toBeHidden();
  const editorId = await card.locator(".memo-editor").getAttribute("id");
  expect(editorId).toBeTruthy();
  await expect(card).toHaveAttribute("aria-controls", editorId);
  const editorBox = await card.boundingBox();
  expect(editorBox).not.toBeNull();
  expect(editorBox.width).toBeGreaterThanOrEqual(560);

  await page.locator("#memos-heading").click();
  await expect(card.locator(".memo-editor")).toBeHidden();
  await expect(card).toHaveAttribute("aria-expanded", "false");

  await card.locator(".memo-card__content").click();
  await expect(card.locator("[data-edit-field='content']")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(card.locator(".memo-editor")).toBeHidden();

  await card.locator(".memo-card__content").click();
  await expect(card.locator("[data-edit-field='content']")).toBeFocused();
  await card.getByRole("button", { name: "Close editor" }).click();
  await expect(card.locator(".memo-editor")).toBeHidden();
});

test("draft recovery and saved memo persistence survive reload", async ({ page }) => {
  await page.goto("/web/");
  await openCapture(page);
  await page.locator("#memo-title").fill("Draft title");
  await page.locator('#memo-form .color-swatch[data-color="teal"]').click();
  const draftLabelEntry = page.locator("#memo-form .label-picker__entry");
  await draftLabelEntry.fill("Work, Ideas");
  await draftLabelEntry.press("Enter");
  await page.locator("#memo-content").fill("Recovered draft");
  await expect(page.getByText("Draft saved on this device.")).toBeVisible();
  await page.reload();
  await expect(page.locator("#memo-title")).toHaveValue("Draft title");
  await expect(page.locator("#memo-color")).toHaveValue("teal");
  await expect(page.locator('#memo-form .color-swatch[data-color="teal"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#memo-labels")).toHaveValue("Work, Ideas");
  await expect(page.locator("#memo-form .label-chip--selected")).toHaveCount(2);
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

test("label chips filter managed labels and make new labels explicit", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { title: "Managed labels", content: "Seed labels", labels: "Work, Ideas, Research" });

  await openCapture(page);
  const entry = page.locator("#memo-form .label-picker__entry");

  await entry.fill("wo");
  await expect(page.getByRole("button", { name: "Add label Work" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add label Ideas" })).toHaveCount(0);

  await entry.press("Escape");
  await expect(entry).toHaveValue("");
  await expect(page.getByRole("button", { name: "Add label Ideas" })).toBeVisible();

  await entry.fill("Fresh label");
  const newLabel = page.getByRole("button", { name: "Use new label Fresh label" });
  await expect(newLabel).toBeVisible();
  await newLabel.click();

  await expect(page.locator("#memo-labels")).toHaveValue("Fresh label");
  await expect(page.locator("#memo-form .label-chip--selected")).toContainText("Fresh label");

  await page.locator("#memo-content").fill("Create the new label with this memo");
  await page.getByRole("button", { name: "Save memo" }).click();

  const snapshot = await readManagedSnapshot(page);
  expect(snapshot.labels.some((label) => label.name === "Fresh label")).toBe(true);
});

test("editing autosaves organization metadata and survives reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Before edit" });

  const card = page.locator(".memo-card").first();
  await expect(card.locator(".memo-card__content")).toHaveText("Before edit");
  await card.locator(".memo-card__content").click();
  await card.locator("[data-edit-field='content']").fill("After edit");
  await card.locator('.memo-editor .color-swatch[data-color="purple"]').click();
  const editLabelEntry = card.locator(".memo-editor .label-picker__entry");
  await editLabelEntry.fill("Research, Reference, research");
  await editLabelEntry.press("Enter");
  await expect(card.locator(".editor-status")).toHaveText("Saved.");
  await expect(card.locator(".memo-card__content")).toHaveText("After edit");
  await expect(card).toHaveAttribute("data-color", "purple");
  await card.getByRole("button", { name: "Close editor" }).click();
  await expect(card.locator(".memo-card__meta").getByText("Research", { exact: true })).toBeVisible();
  await expect(card.locator(".memo-card__meta").getByText("Reference", { exact: true })).toBeVisible();

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
