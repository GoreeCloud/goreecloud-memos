import { test, expect } from "@playwright/test";

const FIXTURE_COUNT = 200;
const SEARCH_TERM = "needle-baseline-target";

async function seedPerformanceFixture(page) {
  await page.goto("/web/");
  await page.evaluate(async ({ count, searchTerm }) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("goreecloud-memos-local", 5);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["memos", "labels", "memoLabels", "savedViews"], "readwrite");
        const memoStore = tx.objectStore("memos");
        tx.objectStore("labels").clear();
        tx.objectStore("memoLabels").clear();
        tx.objectStore("savedViews").clear();
        memoStore.clear();

        const baseTime = Date.parse("2026-09-27T12:00:00.000Z");
        for (let index = 0; index < count; index += 1) {
          const timestamp = new Date(baseTime + index * 1000).toISOString();
          memoStore.put({
            schemaVersion: 4,
            id: `performance-${String(index).padStart(4, "0")}`,
            title: index === count - 1 ? "Performance target" : `Baseline memo ${index + 1}`,
            content: index === count - 1
              ? `Deterministic ${searchTerm} memo`
              : `Deterministic browser-local baseline content ${index + 1}`,
            color: index % 5 === 0 ? "blue" : null,
            labels: [],
            labelIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            state: "active",
            pinned: false,
            pinOrder: null,
            archivedAt: null,
            trashedAt: null,
            restoreState: null
          });
        }

        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error("performance fixture transaction aborted"));
      };
    });
  }, { count: FIXTURE_COUNT, searchTerm: SEARCH_TERM });
}

test("browser-local performance baseline is reproducible", async ({ page }) => {
  await seedPerformanceFixture(page);

  await page.addInitScript(() => {
    window.__memosBaselineNavigationStart = performance.now();
  });
  await page.reload();
  await expect(page.locator(".memo-card")).toHaveCount(FIXTURE_COUNT);

  const initialRenderMs = await page.evaluate(
    () => performance.now() - window.__memosBaselineNavigationStart
  );

  const searchMs = await page.evaluate(async (searchTerm) => {
    const input = document.querySelector("#memo-search");
    const list = document.querySelector("#memo-list");
    if (!input || !list) throw new Error("performance baseline search controls are unavailable");

    const start = performance.now();
    input.value = searchTerm;
    input.dispatchEvent(new Event("input", { bubbles: true }));

    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 10_000;
      const check = () => {
        if (list.querySelectorAll(".memo-card").length === 1) {
          resolve();
          return;
        }
        if (performance.now() > deadline) {
          reject(new Error("search baseline did not settle"));
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });

    return performance.now() - start;
  }, SEARCH_TERM);

  await page.locator("#saved-view-name").fill("Performance baseline");
  await page.locator("#saved-view-save").click();
  await expect(page.locator("#saved-view-status")).toContainText('Saved view "Performance baseline"');

  await page.locator("#clear-filters").click();
  await expect(page.locator(".memo-card")).toHaveCount(FIXTURE_COUNT);
  await page.locator("#saved-view-select").selectOption({ label: "Performance baseline" });

  const savedViewApplyMs = await page.evaluate(async () => {
    const button = document.querySelector("#saved-view-apply");
    const list = document.querySelector("#memo-list");
    if (!button || !list) throw new Error("performance baseline Saved View controls are unavailable");

    const start = performance.now();
    button.click();

    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 10_000;
      const check = () => {
        if (list.querySelectorAll(".memo-card").length === 1) {
          resolve();
          return;
        }
        if (performance.now() > deadline) {
          reject(new Error("Saved View baseline did not settle"));
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });

    return performance.now() - start;
  });

  const metrics = {
    fixtureMemos: FIXTURE_COUNT,
    initialRenderMs: Number(initialRenderMs.toFixed(2)),
    searchMs: Number(searchMs.toFixed(2)),
    savedViewApplyMs: Number(savedViewApplyMs.toFixed(2))
  };

  for (const value of [metrics.initialRenderMs, metrics.searchMs, metrics.savedViewApplyMs]) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }

  console.log("[memos-performance-baseline] " + JSON.stringify(metrics));
});
