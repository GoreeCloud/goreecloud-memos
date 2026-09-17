import { compareMemosForDisplay, createMemo } from "../domain/memo.mjs";

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error("A cryptographically strong UUID generator is required");
}

function validateStore(store) {
  for (const method of ["put", "list", "remove"]) {
    if (typeof store?.[method] !== "function") {
      throw new TypeError(`store.${method} must be a function`);
    }
  }
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
    const memo = createMemo({
      id: this.#idFactory(),
      title,
      content,
      createdAt: this.#clock()
    });

    await this.#store.put(memo);
    return memo;
  }

  async list() {
    const memos = await this.#store.list();
    return [...memos].sort(compareMemosForDisplay);
  }

  async delete(id) {
    if (typeof id !== "string" || id.length === 0) {
      throw new TypeError("id must be a non-empty string");
    }

    await this.#store.remove(id);
  }
}
