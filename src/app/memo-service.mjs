import {
  archiveMemo,
  compareMemosForDisplay,
  createMemo,
  editMemo,
  MEMO_STATES,
  restoreArchivedMemo,
  restoreTrashedMemo,
  trashMemo
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

  async capture({ title = "", content }) {
    const memo = createMemo({ id: this.#idFactory(), title, content, createdAt: this.#clock() });
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
