import { test, expect } from "@playwright/test";

async function captureMemo(page, { title = "", content }) {
  if (title) await page.getByLabel("Title (optional)").fill(title);
  await page.getByLabel("Memo", { exact: true }).fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: content })).toBeVisible();
}

test("draft recovery and saved memo persistence survive reload", async ({ page }) => {
  await page.goto("/web/");
  await page.getByLabel("Title (optional)").fill("Draft title");
  await page.getByLabel("Memo", { exact: true }).fill("Recovered draft");
  await expect(page.getByText("Draft saved on this device.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Title (optional)")).toHaveValue("Draft title");
  await expect(page.getByLabel("Memo", { exact: true })).toHaveValue("Recovered draft");

  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: "Recovered draft" })).toBeVisible();
  await page.reload();
  await expect(page.locator(".memo-card__content", { hasText: "Recovered draft" })).toBeVisible();
});

test("editing autosaves and survives reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Before edit" });

  const card = page.locator(".memo-card", { hasText: "Before edit" });
  await card.getByRole("button", { name: "Edit" }).click();
  await card.locator("[data-edit-field='content']").fill("After edit");
  await expect(card.getByText("Saved.")).toBeVisible();
  await expect(card.locator(".memo-card__content")).toHaveText("After edit");

  await page.reload();
  await expect(page.locator(".memo-card__content", { hasText: "After edit" })).toBeVisible();
});

test("Archive and Trash are recoverable before explicit permanent deletion", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Lifecycle memo" });

  let card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await card.getByRole("button", { name: "Archive" }).click();
  await expect(card).toHaveCount(0);

  await page.getByRole("button", { name: "Archive" }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Move to Trash" }).click();

  await page.getByRole("button", { name: "Trash" }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Restore" }).click();

  await page.getByRole("button", { name: "Archive" }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Restore" }).click();

  await page.getByRole("button", { name: "Memos" }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Move to Trash" }).click();

  await page.getByRole("button", { name: "Trash" }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator(".memo-card", { hasText: "Lifecycle memo" }).getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByText("Trash is empty.")).toBeVisible();
});

test("opening schema v2 migrates an existing schema v1 memo", async ({ page }) => {
  await page.goto("/README.md");
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("goreecloud-memos-local", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("memos", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("memos", "readwrite");
        tx.objectStore("memos").put({
          schemaVersion: 1,
          id: "legacy-1",
          title: "Legacy memo",
          content: "Preserved through migration",
          createdAt: "2026-09-17T10:00:00.000Z",
          updatedAt: "2026-09-17T10:00:00.000Z",
          state: "active",
          pinned: false
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });

  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "Preserved through migration" })).toBeVisible();

  const record = await page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("goreecloud-memos-local", 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("memos", "readonly");
      const getRequest = tx.objectStore("memos").get("legacy-1");
      getRequest.onerror = () => reject(getRequest.error);
      getRequest.onsuccess = () => { db.close(); resolve(getRequest.result); };
    };
  }));

  expect(record.schemaVersion).toBe(2);
  expect(record.content).toBe("Preserved through migration");
  expect(record.archivedAt).toBeNull();
  expect(record.trashedAt).toBeNull();
});
