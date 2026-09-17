const DATABASE_NAME = "goreecloud-memos-local";
const DATABASE_VERSION = 1;
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

function openDatabase() {
  if (!globalThis.indexedDB) {
    throw new Error("IndexedDB is not available in this environment");
  }

  const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

  request.addEventListener("upgradeneeded", () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(MEMO_STORE_NAME)) {
      const store = database.createObjectStore(MEMO_STORE_NAME, { keyPath: "id" });
      store.createIndex("updatedAt", "updatedAt", { unique: false });
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
    transaction.objectStore(MEMO_STORE_NAME).put(memo);
    await transactionComplete(transaction);
  }

  async list() {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readonly");
    const request = transaction.objectStore(MEMO_STORE_NAME).getAll();
    const memos = await requestResult(request);
    await transactionComplete(transaction);
    return memos;
  }

  async remove(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readwrite");
    transaction.objectStore(MEMO_STORE_NAME).delete(id);
    await transactionComplete(transaction);
  }
}
