import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUTPUT_DIR = "test-results/visual-review";

async function openCapture(page) {
  const panel = page.locator("#capture-panel");
  if (!(await panel.evaluate((element) => element.open))) {
    await panel.locator(":scope > summary").click();
  }
}

async function captureMemo(page, { title = "", content, color = "", labels = "" }) {
  await openCapture(page);
  await page.locator("#memo-title").fill(title);
  await page.locator("#memo-color").selectOption(color);
  await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: content })).toBeVisible();
}

async function runMemoAction(card, name) {
  const menu = card.locator("details.memo-card-menu");
  if (!(await menu.evaluate((element) => element.open))) {
    await menu.locator(":scope > summary").click();
  }
  await card.getByRole("button", { name, exact: true }).click();
}

async function openViewControls(page) {
  const drawer = page.locator("details.utility-drawer");
  if (!(await drawer.evaluate((element) => element.open))) {
    await drawer.locator(":scope > summary").click();
  }
}

async function closeTransientPanels(page) {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(50);
}

async function shot(page, fileName, viewport, { fullPage = true } = {}) {
  await page.setViewportSize(viewport);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => window.scrollY === 0);
  await page.waitForTimeout(80);
  const path = join(OUTPUT_DIR, fileName);
  await page.screenshot({ path, fullPage, animations: "disabled" });
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "";
  });
  return { fileName, viewport, fullPage };
}

async function seedRepresentativeWorkspace(page) {
  await page.goto("/web/");

  const fixtures = [
    {
      title: "Launch checklist",
      content: "Review local-only capture, verify browser acceptance, and prepare the next exact-head review.",
      color: "blue",
      labels: "Work, Release"
    },
    {
      title: "Glaze design notes",
      content: "Keep the canvas calm. Use translucency for hierarchy, preserve strong contrast, and keep secondary controls out of the writing flow.",
      color: "purple",
      labels: "Design, Ideas"
    },
    {
      title: "Research",
      content: "Compare capture speed, keyboard flow, label scanning, responsive behavior, and recovery affordances across representative form factors.",
      color: "teal",
      labels: "Research"
    },
    {
      title: "Today",
      content: "Call the electrician, review the storage plan, and capture the follow-up while it is still fresh.",
      color: "yellow",
      labels: "Personal"
    },
    {
      title: "Long-form preview",
      content: Array.from(
        { length: 9 },
        (_, index) => `Preview line ${index + 1}: Memos should remain compact until the reader explicitly asks for more detail.`
      ).join("\n"),
      color: "green",
      labels: "Reference, Design"
    },
    {
      title: "Pinned direction",
      content: "Keep the strongest product decisions visible without turning the workspace into a dashboard.",
      color: "orange",
      labels: "Ideas"
    },
    {
      title: "Archived decision",
      content: "This decision is finished but still useful enough to keep searchable.",
      color: "gray",
      labels: "Reference"
    },
    {
      title: "Recovery candidate",
      content: "This memo demonstrates the Trash recovery surface and explicit lifecycle context.",
      color: "red",
      labels: "Testing"
    }
  ];

  for (const fixture of fixtures) {
    await captureMemo(page, fixture);
  }

  await runMemoAction(page.locator(".memo-card", { hasText: "Pinned direction" }), "Pin");
  await runMemoAction(page.locator(".memo-card", { hasText: "Archived decision" }), "Archive");
  await runMemoAction(page.locator(".memo-card", { hasText: "Recovery candidate" }), "Archive");

  const location = page.getByRole("navigation", { name: "Memo location" });
  await location.getByRole("button", { name: "Archive", exact: true }).click();
  await runMemoAction(page.locator(".memo-card", { hasText: "Recovery candidate" }), "Move to Trash");
  await location.getByRole("button", { name: "Memos", exact: true }).click();

  await expect(page.locator(".memo-card")).toHaveCount(6);
  await expect(page.locator('[data-view-count="archived"]').first()).toHaveText("1");
  await expect(page.locator('[data-view-count="trashed"]').first()).toHaveText("1");
}

test("capture exact-head rendered visual review evidence", async ({ page }) => {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await seedRepresentativeWorkspace(page);

  const screenshots = [];

  screenshots.push(await shot(page, "01-mobile-active-light.png", { width: 390, height: 844 }));
  screenshots.push(await shot(page, "02-tablet-active-light.png", { width: 768, height: 1024 }));
  screenshots.push(await shot(page, "03-desktop-active-light.png", { width: 1440, height: 1000 }));

  await openViewControls(page);
  await page.getByRole("radio", { name: "Deep Dark" }).check();
  await closeTransientPanels(page);
  screenshots.push(await shot(page, "04-desktop-active-deep-dark.png", { width: 1440, height: 1000 }));

  await openViewControls(page);
  await page.locator(".utility-panel").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(page.getByRole("heading", { name: "Workspace settings" })).toBeVisible();
  screenshots.push(await shot(page, "05-desktop-settings-deep-dark.png", { width: 1440, height: 1000 }));
  await closeTransientPanels(page);

  const manager = page.locator("details.manager-drawer");
  await manager.locator(":scope > summary").click();
  await expect(manager).toHaveJSProperty("open", true);
  await page.locator(".drawer-panel").evaluate((element) => {
    element.scrollTop = 0;
  });
  await expect(page.getByRole("heading", { name: "Manage labels" })).toBeVisible();
  screenshots.push(await shot(page, "06-desktop-label-manager-deep-dark.png", { width: 1440, height: 1000 }));
  await closeTransientPanels(page);

  await openViewControls(page);
  await page.getByRole("radio", { name: "Light" }).check();
  await closeTransientPanels(page);

  const location = page.getByRole("navigation", { name: "Memo location" });
  await location.getByRole("button", { name: "Archive", exact: true }).click();
  screenshots.push(await shot(page, "07-tablet-archive-light.png", { width: 768, height: 1024 }));

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  screenshots.push(await shot(page, "08-tablet-trash-light.png", { width: 768, height: 1024 }));

  await location.getByRole("button", { name: "Memos", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "200%";
  });
  screenshots.push(await shot(page, "09-mobile-active-200-percent-text.png", { width: 390, height: 844 }));
  await page.evaluate(() => {
    document.documentElement.style.fontSize = "";
  });

  await page.evaluate(() => {
    localStorage.removeItem("goreecloud-memos:setup-complete:v1");
    localStorage.removeItem("goreecloud-memos:setup-step:v1");
  });
  await page.reload();
  await expect(page.locator("#setup-dialog")).toBeVisible();
  screenshots.push(await shot(page, "10-mobile-first-use-setup.png", { width: 390, height: 844 }, { fullPage: false }));

  const manifest = {
    revision: process.env.EVALUATED_REVISION ?? "local-unbound",
    lifecycle: "Development",
    generatedAt: new Date().toISOString(),
    purpose: "Exact-head rendered review evidence. These screenshots support human review and do not establish Glaze consumer conformance or production acceptance.",
    screenshots
  };

  await writeFile(
    join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf8"
  );

  expect(screenshots).toHaveLength(10);
});
