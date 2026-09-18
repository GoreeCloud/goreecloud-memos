import { test, expect } from "@playwright/test";

async function captureMemo(page, { title = "", content, color = "", labels = "" }) {
  if (title) await page.locator("#memo-title").fill(title);
  if (color) await page.locator("#memo-color").selectOption(color);
  if (labels) await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: content })).toBeVisible();
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

  const ideasRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Ideas") });
  await ideasRow.getByLabel("Color for Ideas").selectOption("purple");
  await ideasRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Ideas.");

  const workRow = page.locator(".label-admin-row").filter({ has: page.getByLabel("Label name for Work") });
  await workRow.getByLabel("Color for Work").selectOption("blue");
  await workRow.getByRole("button", { name: "Save details", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Saved details for Work.");

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
  await expect(page.getByText("1 of 3 memos shown")).toBeVisible();

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
  await expect(page.getByText("1 of 3 memos shown")).toBeVisible();

  await page.getByRole("button", { name: "Clear search and filters" }).click();

  const reference = page.locator(".memo-card", { hasText: "Reference" });
  await reference.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("navigation", { name: "Memo location" }).getByRole("button", { name: "Archive", exact: true }).click();

  await search.fill("alpha");
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toHaveCount(0);
  await expect(page.getByText("1 of 1 archived memo shown")).toBeVisible();

  await color.selectOption("green");
  await label.selectOption("Work");
  await expect(page.locator(".memo-card", { hasText: "Reference" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("searchbox", { name: "Search memos" })).toHaveValue("");
  await expect(page.locator("#memo-filter-color")).toHaveValue("all");
  await expect(page.locator("#memo-filter-label")).toHaveValue("all");
  await expect(page.locator("#memo-filter-label-color")).toHaveValue("all");
  await expect(page.locator(".memo-card", { hasText: "Project Alpha" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Garden" })).toBeVisible();
});
