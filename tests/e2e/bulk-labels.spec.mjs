import { test, expect } from "@playwright/test";

async function captureMemo(page, { title, content, labels = "" }) {
  await page.locator("#memo-title").fill(title);
  await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card", { hasText: title })).toBeVisible();
}

function memoCard(page, title) {
  return page.locator(".memo-card").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
}

async function selectMemo(page, title) {
  await page.getByRole("checkbox", { name: `Select ${title}`, exact: true }).check();
}

async function readSnapshot(page) {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("goreecloud-memos-local", 5);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(["memos", "labels", "memoLabels"], "readonly");
      const result = {};
      const reads = [
        ["memos", tx.objectStore("memos").getAll()],
        ["labels", tx.objectStore("labels").getAll()],
        ["memoLabels", tx.objectStore("memoLabels").getAll()]
      ];
      let remaining = reads.length;
      for (const [key, read] of reads) {
        read.onerror = () => reject(read.error);
        read.onsuccess = () => {
          result[key] = read.result;
          remaining -= 1;
          if (remaining === 0) {
            db.close();
            resolve(result);
          }
        };
      }
    };
  }));
}

test("bulk selection is ephemeral and clears when filtering rerenders the visible memo list", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { title: "Alpha", content: "Alpha body", labels: "Work" });
  await captureMemo(page, { title: "Beta", content: "Beta body", labels: "Ideas" });

  await selectMemo(page, "Alpha");
  await expect(page.locator("#bulk-label-status")).toContainText("1 memo selected");

  await page.locator("#memo-search").fill("Beta");
  await expect(page.getByRole("checkbox", { name: "Select Alpha" })).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: "Select Beta" })).toBeVisible();
  await expect(page.locator("#bulk-label-status")).toContainText("0 memos selected");
});

test("bulk apply and remove update selected memo relationships without deleting memos", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { title: "Alpha", content: "Alpha body", labels: "Work" });
  await captureMemo(page, { title: "Beta", content: "Beta body", labels: "Ideas" });
  await captureMemo(page, { title: "Gamma", content: "Gamma body" });

  await page.locator("#bulk-label-select").selectOption({ label: "Ideas" });
  await selectMemo(page, "Alpha");
  await selectMemo(page, "Gamma");
  await page.getByRole("button", { name: "Apply label", exact: true }).click();
  await expect(page.locator("#bulk-label-status")).toContainText("Applied Ideas to 2 memos.");

  await expect(memoCard(page, "Alpha").getByText("Work", { exact: true })).toBeVisible();
  await expect(memoCard(page, "Alpha").getByText("Ideas", { exact: true })).toBeVisible();
  await expect(memoCard(page, "Gamma").getByText("Ideas", { exact: true })).toBeVisible();

  await page.locator("#bulk-label-select").selectOption({ label: "Ideas" });
  await selectMemo(page, "Alpha");
  await selectMemo(page, "Beta");
  await page.getByRole("button", { name: "Remove label", exact: true }).click();
  await expect(page.locator("#bulk-label-status")).toContainText("Removed Ideas from 2 memos.");

  await expect(memoCard(page, "Alpha").getByText("Work", { exact: true })).toBeVisible();
  await expect(memoCard(page, "Alpha").getByText("Ideas", { exact: true })).toHaveCount(0);
  await expect(memoCard(page, "Beta").getByText("Ideas", { exact: true })).toHaveCount(0);
  await expect(memoCard(page, "Gamma").getByText("Ideas", { exact: true })).toBeVisible();

  const snapshot = await readSnapshot(page);
  expect(snapshot.memos).toHaveLength(3);
  expect(snapshot.labels.map((label) => label.name).sort()).toEqual(["Ideas", "Work"]);
  expect(snapshot.memoLabels).toHaveLength(2);
  const byTitle = new Map(snapshot.memos.map((memo) => [memo.title, memo]));
  expect(byTitle.get("Alpha").labels).toEqual(["Work"]);
  expect(byTitle.get("Beta").labels).toEqual([]);
  expect(byTitle.get("Gamma").labels).toEqual(["Ideas"]);
});

test("bulk apply aborts atomically when one selected memo is already at the label limit", async ({ page }) => {
  await page.goto("/web/");
  const twentyLabels = Array.from({ length: 20 }, (_, index) => `Label${index + 1}`).join(", ");
  await captureMemo(page, { title: "At limit", content: "Limit body", labels: twentyLabels });
  await captureMemo(page, { title: "Source", content: "Source body", labels: "Extra" });
  await captureMemo(page, { title: "Clean", content: "Clean body" });

  await page.locator("#bulk-label-select").selectOption({ label: "Extra" });
  await selectMemo(page, "Clean");
  await selectMemo(page, "At limit");
  await page.getByRole("button", { name: "Apply label", exact: true }).click();
  await expect(page.locator("#bulk-label-status")).toContainText("at most 20 labels");

  await expect(memoCard(page, "Clean").getByText("Extra", { exact: true })).toHaveCount(0);
  const snapshot = await readSnapshot(page);
  const clean = snapshot.memos.find((memo) => memo.title === "Clean");
  expect(clean.labels).toEqual([]);
  expect(snapshot.memoLabels.some((relation) => relation.memoId === clean.id)).toBe(false);
});
