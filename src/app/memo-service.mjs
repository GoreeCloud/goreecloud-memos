import {
  archiveMemo,
  compareMemosForDisplay,
  createMemo,
  editMemo,
  MEMO_STATES,
  pinMemo,
  restoreArchivedMemo,
  restoreTrashedMemo,
  setPinnedOrder,
  trashMemo,
  unpinMemo
} from "../domain/memo.mjs";

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  throw new Error("A cryptographically strong UUID generator is required");
}

function validateStore(store) {
  for (const method of ["put", "get", "list", "remove"]) {
    if (typeof store?.[method] !== "function") {
      throw new TypeError(`store.${method} must be a function`);
    }
  }
}

function validateId(id) {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new TypeError("id must be a non-empty string");
  }
  return id.trim();
}

export class MemoService {
  #store;
  #clock;
  #idFactory;

  constructor(store, { clock = () => new Date(), idFactory = defaultIdFactory } = {}) {
    validateStore(store);
    this.#store = store;
    this.#clock = clock;
    this.#idFactory = idFactory;
  }

  async capture({ title = "", content, color = null, labels = [] }) {
    const memo = createMemo({ id: this.#idFactory(), title, content, color, labels, createdAt: this.#clock() });
    await this.#store.put(memo);
    return memo;
  }

  async get(id) {
    const memo = await this.#store.get(validateId(id));
    if (!memo) throw new Error("memo not found");
    return memo;
  }

  async list({ state = "active" } = {}) {
    if (!MEMO_STATES.includes(state)) {
      throw new TypeError("state must be active, archived, or trashed");
    }
    const memos = await this.#store.list();
    return memos.filter((memo) => memo.state === state).sort(compareMemosForDisplay);
  }

  async edit(id, changes) {
    const memo = await this.get(id);
    const updated = editMemo(memo, { ...changes, updatedAt: this.#clock() });
    await this.#store.put(updated);
    return updated;
  }

  async pin(id) {
    const memo = await this.get(id);
    if (memo.pinned) return memo;
    const activeMemos = await this.list({ state: "active" });
    const pinned = activeMemos.filter((candidate) => candidate.pinned);
    const nextOrder = pinned.length === 0
      ? 0
      : Math.max(...pinned.map((candidate) => candidate.pinOrder ?? 0)) + 1;
    const updated = pinMemo(memo, nextOrder, this.#clock());
    await this.#store.put(updated);
    return updated;
  }

  async unpin(id) {
    const memo = await this.get(id);
    const updated = unpinMemo(memo, this.#clock());
    await this.#store.put(updated);
    return updated;
  }

  async movePin(id, direction) {
    if (direction !== "up" && direction !== "down") {
      throw new TypeError("direction must be up or down");
    }
    const memoId = validateId(id);
    const pinned = (await this.list({ state: "active" })).filter((memo) => memo.pinned);
    const index = pinned.findIndex((memo) => memo.id === memoId);
    if (index === -1) throw new Error("only active pinned memos can be reordered");
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pinned.length) return pinned[index];

    [pinned[index], pinned[targetIndex]] = [pinned[targetIndex], pinned[index]];
    const changedAt = this.#clock();
    let moved;
    for (let order = 0; order < pinned.length; order += 1) {
      const updated = setPinnedOrder(pinned[order], order, changedAt);
      await this.#store.put(updated);
      if (updated.id === memoId) moved = updated;
    }
    return moved;
  }

  async archive(id) {
    return this.#transform(id, archiveMemo);
  }

  async restoreFromArchive(id) {
    return this.#transform(id, restoreArchivedMemo);
  }

  async trash(id) {
    return this.#transform(id, trashMemo);
  }

  async restoreFromTrash(id) {
    return this.#transform(id, restoreTrashedMemo);
  }

  async deletePermanently(id) {
    const memo = await this.get(id);
    if (memo.state !== "trashed") {
      throw new Error("only trashed memos can be permanently deleted");
    }
    await this.#store.remove(validateId(id));
  }

  async #transform(id, transform) {
    const memo = await this.get(id);
    const updated = transform(memo, this.#clock());
    await this.#store.put(updated);
    return updated;
  }
}
