import { test, expect } from "@playwright/test";

const FIXTURE_COUNT = 200;
const LARGE_FIXTURE_COUNT = 1000;
const INTERACTION_SAMPLES = 30;
const SEARCH_TERM = "needle-baseline-target";

function percentile(values, percentileValue) {
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(values) {
  return {
    samples: values.length,
    p50Ms: Number(percentile(values, 50).toFixed(2)),
    p95Ms: Number(percentile(values, 95).toFixed(2)),
    p99Ms: Number(percentile(values, 99).toFixed(2)),
    maxMs: Number(Math.max(...values).toFixed(2))
  };
}

async function seedPerformanceFixture(page, count = FIXTURE_COUNT) {
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
  }, { count, searchTerm: SEARCH_TERM });
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

  const composerOpenSamples = await page.evaluate(async (samples) => {
    const panel = document.querySelector("#capture-panel");
    const summary = panel?.querySelector(":scope > summary");
    const content = document.querySelector("#memo-content");
    if (!panel || !summary || !content) {
      throw new Error("performance baseline composer controls are unavailable");
    }

    const waitFor = (predicate, errorMessage) => new Promise((resolve, reject) => {
      const deadline = performance.now() + 10_000;
      const check = () => {
        if (predicate()) {
          requestAnimationFrame(() => resolve());
          return;
        }
        if (performance.now() > deadline) {
          reject(new Error(errorMessage));
          return;
        }
        requestAnimationFrame(check);
      };
      check();
    });

    const durations = [];
    for (let index = 0; index < samples; index += 1) {
      panel.open = false;
      await waitFor(() => !panel.open, "composer close baseline did not settle");

      const start = performance.now();
      summary.click();
      await waitFor(
        () => panel.open && document.activeElement === content,
        "composer open baseline did not settle"
      );
      durations.push(performance.now() - start);
    }
    panel.open = false;
    return durations;
  }, INTERACTION_SAMPLES);

  const searchSamples = await page.evaluate(async ({ searchTerm, samples }) => {
    const input = document.querySelector("#memo-search");
    const list = document.querySelector("#memo-list");
    if (!input || !list) throw new Error("performance baseline search controls are unavailable");

    const waitForCardCount = (count) => new Promise((resolve, reject) => {
      const deadline = performance.now() + 10_000;
      const check = () => {
        if (list.querySelectorAll(".memo-card").length === count) {
          requestAnimationFrame(() => resolve());
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

    const durations = [];
    for (let index = 0; index < samples; index += 1) {
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForCardCount(200);

      const start = performance.now();
      input.value = searchTerm;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await waitForCardCount(1);
      durations.push(performance.now() - start);
    }
    return durations;
  }, { searchTerm: SEARCH_TERM, samples: INTERACTION_SAMPLES });

  const utilityDrawer = page.locator("details.utility-drawer");
  await utilityDrawer.locator(":scope > summary").click();
  await expect(utilityDrawer).toHaveJSProperty("open", true);

  await page.locator("#saved-view-name").fill("Performance baseline");
  await page.locator("#saved-view-save").click();
  await expect(page.locator("#saved-view-status")).toContainText('Saved view "Performance baseline"');

  await page.locator("#clear-filters").click();
  await expect(page.locator(".memo-card")).toHaveCount(FIXTURE_COUNT);
  await page.locator("#saved-view-select").selectOption({ label: "Performance baseline" });

  const savedViewSamples = await page.evaluate(async ({ samples, fixtureCount }) => {
    const applyButton = document.querySelector("#saved-view-apply");
    const clearButton = document.querySelector("#clear-filters");
    const list = document.querySelector("#memo-list");
    if (!applyButton || !clearButton || !list) {
      throw new Error("performance baseline Saved View controls are unavailable");
    }

    const waitForCardCount = (count) => new Promise((resolve, reject) => {
      const deadline = performance.now() + 10_000;
      const check = () => {
        if (list.querySelectorAll(".memo-card").length === count) {
          requestAnimationFrame(() => resolve());
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

    const durations = [];
    for (let index = 0; index < samples; index += 1) {
      clearButton.click();
      await waitForCardCount(fixtureCount);

      const start = performance.now();
      applyButton.click();
      await waitForCardCount(1);
      durations.push(performance.now() - start);
    }
    return durations;
  }, { samples: INTERACTION_SAMPLES, fixtureCount: FIXTURE_COUNT });

  const environment = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemoryGiB: navigator.deviceMemory ?? null,
    viewport: { width: innerWidth, height: innerHeight },
    visibilityState: document.visibilityState
  }));

  await seedPerformanceFixture(page, LARGE_FIXTURE_COUNT);
  await page.reload();
  await expect(page.locator(".memo-card")).toHaveCount(LARGE_FIXTURE_COUNT);
  const largeLibraryInitialRenderMs = await page.evaluate(
    () => performance.now() - window.__memosBaselineNavigationStart
  );
  const largeLibraryDom = await page.evaluate(() => ({
    nodeCount: document.querySelectorAll("#memo-list *").length,
    hydratedEditors: document.querySelectorAll("#memo-list .memo-editor").length,
    hydratedActionButtons: document.querySelectorAll("#memo-list .memo-card__actions button").length
  }));

  expect(largeLibraryDom.hydratedEditors).toBe(0);
  expect(largeLibraryDom.hydratedActionButtons).toBe(0);

  const metrics = {
    revision: process.env.EVALUATED_REVISION ?? "local-unbound",
    lifecycle: "Development",
    measuredAt: new Date().toISOString(),
    fixtureMemos: FIXTURE_COUNT,
    largeFixtureMemos: LARGE_FIXTURE_COUNT,
    initialRenderMs: Number(initialRenderMs.toFixed(2)),
    largeLibraryInitialRenderMs: Number(largeLibraryInitialRenderMs.toFixed(2)),
    largeLibraryDom,
    composerOpen: summarize(composerOpenSamples),
    search: summarize(searchSamples),
    savedViewApply: summarize(savedViewSamples),
    environment
  };

  expect(Number.isFinite(metrics.initialRenderMs)).toBe(true);
  expect(metrics.initialRenderMs).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(metrics.largeLibraryInitialRenderMs)).toBe(true);
  expect(metrics.largeLibraryInitialRenderMs).toBeGreaterThanOrEqual(0);
  expect(metrics.composerOpen.samples).toBe(INTERACTION_SAMPLES);
  expect(metrics.search.samples).toBe(INTERACTION_SAMPLES);
  expect(metrics.savedViewApply.samples).toBe(INTERACTION_SAMPLES);

  console.log("[memos-performance-baseline] " + JSON.stringify(metrics));
});
