import { test, expect } from "@playwright/test";

async function captureMemo(page, content, labels) {
  await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card", { hasText: content })).toBeVisible();
}

function labelRow(page, name) {
  return page.locator(".label-admin-row").filter({ has: page.getByLabel(`Label name for ${name}`) });
}

async function readManagedSnapshot(page) {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("goreecloud-memos-local", 4);
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

test("managed labels rename, reject collisions, merge, and explicitly delete without deleting memos", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, "Alpha memo", "Work, Ideas");
  await captureMemo(page, "Beta memo", "work, Research");

  await expect(page.getByLabel("Label name for Work")).toBeVisible();
  await expect(page.getByLabel("Label name for Ideas")).toBeVisible();
  await expect(page.getByLabel("Label name for Research")).toBeVisible();

  let workRow = labelRow(page, "Work");
  await workRow.locator("[data-label-name]").fill("Ideas");
  await workRow.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toContainText("already exists");

  await workRow.locator("[data-label-name]").fill("Projects");
  await workRow.getByRole("button", { name: "Rename", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toHaveText("Renamed label to Projects.");
  await expect(page.locator(".memo-card", { hasText: "Alpha memo" }).getByText("Projects", { exact: true })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Beta memo" }).getByText("Projects", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Label name for Work")).toHaveCount(0);

  let projectsRow = labelRow(page, "Projects");
  await projectsRow.locator("[data-merge-target]").selectOption({ label: "Ideas" });
  page.once("dialog", (dialog) => dialog.accept());
  await projectsRow.getByRole("button", { name: "Merge", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toContainText("Merged Projects into Ideas");

  const alpha = page.locator(".memo-card", { hasText: "Alpha memo" });
  const beta = page.locator(".memo-card", { hasText: "Beta memo" });
  await expect(alpha.getByText("Ideas", { exact: true })).toHaveCount(1);
  await expect(alpha.getByText("Projects", { exact: true })).toHaveCount(0);
  await expect(beta.getByText("Ideas", { exact: true })).toHaveCount(1);
  await expect(beta.getByText("Research", { exact: true })).toBeVisible();

  const researchRow = labelRow(page, "Research");
  page.once("dialog", (dialog) => dialog.accept());
  await researchRow.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.locator("#label-admin-status")).toContainText("Deleted label Research from 1 memo.");
  await expect(page.locator(".memo-card", { hasText: "Alpha memo" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Beta memo" })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Beta memo" }).getByText("Research", { exact: true })).toHaveCount(0);

  const snapshot = await readManagedSnapshot(page);
  expect(snapshot.labels.map((label) => label.name)).toEqual(["Ideas"]);
  expect(snapshot.memoLabels).toHaveLength(2);
  expect(snapshot.memos).toHaveLength(2);
  for (const memo of snapshot.memos) {
    expect(memo.labels).toEqual(["Ideas"]);
    expect(memo.labelIds).toHaveLength(1);
  }
  expect(snapshot.memos[0].labelIds[0]).toBe(snapshot.memos[1].labelIds[0]);
});
