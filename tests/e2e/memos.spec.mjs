import { test, expect } from "@playwright/test";

async function captureMemo(page, { title = "", content, color = "", labels = "" }) {
  if (title) await page.locator("#memo-title").fill(title);
  if (color) await page.locator("#memo-color").selectOption(color);
  if (labels) await page.locator("#memo-labels").fill(labels);
  await page.locator("#memo-content").fill(content);
  await page.getByRole("button", { name: "Save memo" }).click();
  await expect(page.locator(".memo-card__content", { hasText: content })).toBeVisible();
}

test("draft recovery and saved memo persistence survive reload", async ({ page }) => {
  await page.goto("/web/");
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
  await card.getByRole("button", { name: "Edit", exact: true }).click();
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
  await first.getByRole("button", { name: "Pin", exact: true }).click();
  await page.locator(".memo-card", { hasText: "Second pinned memo" }).getByRole("button", { name: "Pin", exact: true }).click();
  await expect(page.locator(".memo-card").nth(0)).toContainText("First pinned memo");

  second = page.locator(".memo-card", { hasText: "Second pinned memo" });
  await second.getByRole("button", { name: "Move pin up", exact: true }).click();
  await expect(page.locator(".memo-card").nth(0)).toContainText("Second pinned memo");
  await expect(page.locator(".memo-card").nth(1)).toContainText("First pinned memo");

  await page.reload();
  await expect(page.locator(".memo-card").nth(0)).toContainText("Second pinned memo");
  await expect(page.locator(".memo-card").nth(1)).toContainText("First pinned memo");
  first = page.locator(".memo-card", { hasText: "First pinned memo" });
  await first.getByRole("button", { name: "Unpin", exact: true }).click();
  await expect(page.locator(".memo-card", { hasText: "First pinned memo" }).getByText("Pinned", { exact: true })).toHaveCount(0);
});

test("presentation mode is keyboard accessible and persists across reload", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Presentation memo", color: "blue", labels: "Layout" });

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
  await expect(compact).toBeChecked();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "compact");
  await listMode.check();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "list");
  await dense.check();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "dense");

  await page.reload();
  await expect(page.getByRole("radio", { name: "Dense" })).toBeChecked();
  await expect(page.locator("#memo-list")).toHaveAttribute("data-presentation", "dense");
});

test("Archive and Trash are recoverable before explicit permanent deletion", async ({ page }) => {
  await page.goto("/web/");
  await captureMemo(page, { content: "Lifecycle memo" });

  let card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await card.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(card).toHaveCount(0);

  const location = page.getByRole("navigation", { name: "Memo location" });
  await location.getByRole("button", { name: "Archive", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Move to Trash", exact: true }).click();
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Archive", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Memos", exact: true }).click();
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Move to Trash", exact: true }).click();
  await expect(card).toHaveCount(0);

  await location.getByRole("button", { name: "Trash", exact: true }).click();
  page.once("dialog", (dialog) => dialog.accept());
  card = page.locator(".memo-card", { hasText: "Lifecycle memo" });
  await card.getByRole("button", { name: "Delete permanently", exact: true }).click();
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
            result.version = db.version;
            db.close();
            resolve(result);
          }
        };
      }
    };
  }));
}

test("opening schema v4 migrates an existing schema v1 memo", async ({ page }) => {
  await seedLegacyMemo(page, 1);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "Preserved through v1 migration" })).toBeVisible();
  const snapshot = await readManagedSnapshot(page);
  const record = snapshot.memos.find((memo) => memo.id === "legacy-1");
  expect(snapshot.version).toBe(4);
  expect(record.schemaVersion).toBe(4);
  expect(record.labelIds).toEqual([]);
});

test("opening schema v4 migrates an existing schema v2 memo and preserves pin state", async ({ page }) => {
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

test("opening schema v4 migrates v3 label names into stable managed labels and memo-label relations", async ({ page }) => {
  await seedSchemaV3Labels(page);
  await page.goto("/web/");
  await expect(page.locator(".memo-card", { hasText: "First v3" }).getByText("Work", { exact: true })).toBeVisible();
  await expect(page.locator(".memo-card", { hasText: "Second v3" }).getByText("Work", { exact: true })).toBeVisible();

  const snapshot = await readManagedSnapshot(page);
  expect(snapshot.version).toBe(4);
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
