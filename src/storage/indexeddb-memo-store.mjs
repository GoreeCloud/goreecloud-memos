import { migrateMemoRecord } from "../domain/memo.mjs";

export const DATABASE_NAME = "goreecloud-memos-local";
export const DATABASE_VERSION = 2;
const MEMO_STORE_NAME = "memos";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("abort", () => reject(transaction.error ?? new Error("IndexedDB transaction aborted")), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error ?? new Error("IndexedDB transaction failed")), { once: true });
  });
}

function migrateStoreRecords(store) {
  const cursorRequest = store.openCursor();
  cursorRequest.addEventListener("success", () => {
    const cursor = cursorRequest.result;
    if (!cursor) return;
    cursor.update(migrateMemoRecord(cursor.value));
    cursor.continue();
  });
}

function openDatabase() {
  if (!globalThis.indexedDB) {
    throw new Error("IndexedDB is not available in this environment");
  }

  const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

  request.addEventListener("upgradeneeded", (event) => {
    const database = request.result;
    let store;

    if (!database.objectStoreNames.contains(MEMO_STORE_NAME)) {
      store = database.createObjectStore(MEMO_STORE_NAME, { keyPath: "id" });
      store.createIndex("updatedAt", "updatedAt", { unique: false });
    } else {
      store = request.transaction.objectStore(MEMO_STORE_NAME);
    }

    if (!store.indexNames.contains("state")) {
      store.createIndex("state", "state", { unique: false });
    }

    if (event.oldVersion > 0 && event.oldVersion < 2) {
      migrateStoreRecords(store);
    }
  });

  return requestResult(request);
}

export class IndexedDbMemoStore {
  #databasePromise;

  constructor() {
    this.#databasePromise = openDatabase();
  }

  async put(memo) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readwrite");
    transaction.objectStore(MEMO_STORE_NAME).put(migrateMemoRecord(memo));
    await transactionComplete(transaction);
  }

  async get(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readonly");
    const request = transaction.objectStore(MEMO_STORE_NAME).get(id);
    const memo = await requestResult(request);
    await transactionComplete(transaction);
    return memo ? migrateMemoRecord(memo) : undefined;
  }

  async list() {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readonly");
    const request = transaction.objectStore(MEMO_STORE_NAME).getAll();
    const memos = await requestResult(request);
    await transactionComplete(transaction);
    return memos.map(migrateMemoRecord);
  }

  async remove(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readwrite");
    transaction.objectStore(MEMO_STORE_NAME).delete(id);
    await transactionComplete(transaction);
  }
}
