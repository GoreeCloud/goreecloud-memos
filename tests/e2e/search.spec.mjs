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

async function closeViewControls(page) {
  const drawer = page.locator("details.utility-drawer");
  if (await drawer.evaluate((element) => element.open)) {
    await drawer.locator(":scope > summary").click();
  }
}

async function openLabelManager(page) {
  const drawer = page.locator("details.manager-drawer");
  if (!(await drawer.evaluate((element) => element.open))) {
    await drawer.locator(":scope > summary").click();
  }
}

async function closeLabelManager(page) {
  const drawer = page.locator("details.manager-drawer");
  if (await drawer.evaluate((element) => element.open)) {
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

test("local search and filters combine within the current lifecycle view and reset on reload", async ({ page }) => {
  await page.goto("/web/");

  await captureMemo(page, {
    title: "Project Alpha",
    content: "Launch checklist and notes",
    color: "blue",
    labels: "Work, Launch"
  });
  await captureMemo(page, {
    title: "Garden",
    content: "Buy basil and tomatoes",
    labels: "Home, Ideas"
  });
  await captureMemo(page, {
    title: "Reference",
    content: "Alpha background material",
    color: "green",
    labels: "Research, Work"
  });

  await openLabelManager(page);
  const ideasRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Ideas") });
  await ideasRow.getByLabel("Color for Ideas").selectOption("purple");
  await ideasRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Ideas.");

  const workRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Work") });
  await workRow.getByLabel("Color for Work").selectOption("blue");
  await workRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Work.");
  await closeLabelManager(page);
  await expect(page.locator(".memo-card")).toHaveCount(3);

  const sidebarWork = page.getByRole("button", { name: "Filter current view by label Work", exact: true });
  await expect(sidebarWork).toHaveAttribute("aria-pressed", "false");
  await sidebarWork.click();
  await expect(page.locator("#memo-filter-label")).toHaveValue("Work");
  await expect(page.locator(".memo-card")).toHaveCount(2);
  const activeSidebarWork = page.getByRole("button", { name: "Clear label filter Work", exact: true });
  await expect(activeSidebarWork).toHaveAttribute("aria-pressed", "true");
  await activeSidebarWork.click();
  await expect(page.locator("#memo-filter-label")).toHaveValue("all");
  await expect(page.locator(".memo-card")).toHaveCount(3);

  await openViewControls(page);
  const search = page.getByRole("searchbox", { name: "Search memos" });
  const color = page.locator("#memo-filter-color");
  const label = page.locator("#memo-filter-label");
  const labelColor = page.locator("#memo-filter-label-color");

  await search.fill("alpha");
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Garden" })).toHaveCount(0);

  await color.selectOption("blue");
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toHaveCount(0);

  await label.selectOption("Work");
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toBeVisible();
  await expect(page.getByText("1 of 3 memos matches current filters")).toBeVisible();

  await labelColor.selectOption("purple");
  await expect(page.locator(".memo-card")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(search).toHaveValue("");
  await expect(color).toHaveValue("all");
  await expect(label).toHaveValue("all");
  await expect(labelColor).toHaveValue("all");
  await expect(page.locator(".memo-card")).toHaveCount(3);

  await labelColor.selectOption("purple");
  await expect(page.locator(".memo-card", { hasText: "Garden" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toHaveCount(0);
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toHaveCount(0);
  await expect(page.getByText("1 of 3 memos matches current filters")).toBeVisible();

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await closeViewControls(page);

  const reference = page.locator(".memo-card", { hasText: "Reference" });
  await runMemoAction(reference, "Archive");
  await page.getByRole("navigation", { name: "Memo location" }).getByRole("button", { name: "Archive", exact: true }).click();

  await search.fill("alpha");
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toHaveCount(0);
  await expect(page.getByText("1 of 1 archived memo matches current filters")).toBeVisible();

  await openViewControls(page);
  await color.selectOption("green");
  await label.selectOption("Work");
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toBeVisible();

  await page.reload();
  await openViewControls(page);
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toHaveValue("");
  await expect(page.locator("#memo-filter-color")).toHaveValue("all");
  await expect(page.locator("#memo-filter-label")).toHaveValue("all");
  await expect(page.locator("#memo-filter-label-color")).toHaveValue("all");
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Garden" })).toBeVisible();
});


test("advanced search expressions combine verified local dimensions and surface deterministic errors", async ({ page }) => {
  await page.goto("/web/");

  await captureMemo(page, {
    title: "Expression Alpha",
    content: "Advanced query target",
    color: "blue",
    labels: "Project Work, Launch"
  });
  await captureMemo(page, {
    title: "Expression Garden",
    content: "Secondary memo",
    labels: "Home"
  });

  await openLabelManager(page);
  const projectRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Project Work") });
  await projectRow.getByLabel("Color for Project Work").selectOption("purple");
  await projectRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Project Work.");
  await closeLabelManager(page);

  await openViewControls(page);
  const search = page.getByRole("searchbox", { name: "Search memos" });
  const memoColor = page.locator("#memo-filter-color");

  await search.fill('advanced color:blue label:"Project Work" label-color:purple');
  await expect(page.locator(".memo-card", { hasText: "Expression Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Expression Garden" })).toHaveCount(0);
  await expect(page.getByText("1 of 2 memos matches current filters")).toBeVisible();

  await memoColor.selectOption("green");
  await expect(page.locator(".memo-card")).toHaveCount(0);

  await memoColor.selectOption("all");
  await search.fill("color:cyan");
  await expect(page.locator("#filter-status")).toContainText("Search expression error: color must be one of");
  await expect(page.getByText("Search expression needs correction.")).toBeVisible();
  await expect(page.locator(".memo-card")).toHaveCount(0);

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(search).toHaveValue("");
  await expect(page.locator(".memo-card")).toHaveCount(2);
  await expect(page.locator("#filter-status")).toHaveText("Search and filters are not saved.");
});


test("named saved views persist locally and restore the current query and direct filters", async ({ page }) => {
  await page.goto("/web/");

  await captureMemo(page, {
    title: "Saved Alpha",
    content: "Saved view target",
    color: "blue",
    labels: "Project Work"
  });
  await captureMemo(page, {
    title: "Saved Garden",
    content: "Other memo",
    color: "green",
    labels: "Home"
  });

  await openLabelManager(page);
  const projectRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Project Work") });
  await projectRow.getByLabel("Color for Project Work").selectOption("purple");
  await projectRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Project Work.");
  await closeLabelManager(page);

  await openViewControls(page);
  const search = page.getByRole("searchbox", { name: "Search memos" });
  const memoColor = page.locator("#memo-filter-color");
  const label = page.locator("#memo-filter-label");
  const labelColor = page.locator("#memo-filter-label-color");

  await search.fill('saved color:blue');
  await memoColor.selectOption("blue");
  await label.selectOption("Project Work");
  await labelColor.selectOption("purple");
  await expect(page.locator(".memo-card", { hasText: "Saved Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Saved Garden" })).toHaveCount(0);

  await page.locator("#saved-view-name").fill("Blue project");
  await page.getByRole("button", { name: "Save current view" }).click();
  await expect(page.locator("#saved-view-status")).toHaveText('Saved view "Blue project" in this browser.');
  await expect(page.locator("#saved-view-select")).toHaveValue(/.+/);

  await page.locator("#saved-view-name").fill("blue PROJECT");
  await page.getByRole("button", { name: "Save current view" }).click();
  await expect(page.locator("#saved-view-status")).toHaveText("a saved view with that name already exists");
  await expect(page.locator("#saved-view-select").locator("option", { hasText: "Blue project" })).toHaveCount(1);

  await page.getByRole("button", { name: "Clear search and filters" }).click();
  await expect(page.locator(".memo-card")).toHaveCount(2);

  await page.reload();
  await openViewControls(page);
  await expect(search).toHaveValue("");
  await expect(memoColor).toHaveValue("all");
  await expect(label).toHaveValue("all");
  await expect(labelColor).toHaveValue("all");
  await expect(page.locator("#saved-view-select").locator("option", { hasText: "Blue project" })).toHaveCount(1);

  await page.locator("#saved-view-select").selectOption({ label: "Blue project" });
  await page.getByRole("button", { name: "Apply saved view" }).click();
  await expect(search).toHaveValue('saved color:blue');
  await expect(memoColor).toHaveValue("blue");
  await expect(label).toHaveValue("Project Work");
  await expect(labelColor).toHaveValue("purple");
  await expect(page.locator(".memo-card", { hasText: "Saved Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Saved Garden" })).toHaveCount(0);
  await expect(page.locator("#saved-view-status")).toHaveText('Applied saved view "Blue project" in the current memo location.');

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete saved view" }).click();
  await expect(page.locator("#saved-view-status")).toHaveText('Deleted saved view "Blue project".');
  await expect(page.locator("#saved-view-select").locator("option", { hasText: "Blue project" })).toHaveCount(0);

  await page.reload();
  await expect(page.locator("#saved-view-select").locator("option", { hasText: "Blue project" })).toHaveCount(0);
});
