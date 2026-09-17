import { migrateMemoRecord } from "../domain/memo.mjs";
import {
  createLabel,
  labelNameKey,
  migrateLabelRecord,
  reconcileManagedLabels,
  renameLabel,
  updateLabelMetadata as applyLabelMetadata
} from "../domain/label.mjs";

export const DATABASE_NAME = "goreecloud-memos-local";
export const DATABASE_VERSION = 4;
const MEMO_STORE_NAME = "memos";
const LABEL_STORE_NAME = "labels";
const MEMO_LABEL_STORE_NAME = "memoLabels";

function defaultIdFactory() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  throw new Error("A cryptographically strong UUID generator is required for managed labels");
}

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

function createStores(database, transaction) {
  let memoStore;
  if (!database.objectStoreNames.contains(MEMO_STORE_NAME)) {
    memoStore = database.createObjectStore(MEMO_STORE_NAME, { keyPath: "id" });
    memoStore.createIndex("updatedAt", "updatedAt", { unique: false });
  } else memoStore = transaction.objectStore(MEMO_STORE_NAME);
  if (!memoStore.indexNames.contains("state")) memoStore.createIndex("state", "state", { unique: false });

  let labelStore;
  if (!database.objectStoreNames.contains(LABEL_STORE_NAME)) {
    labelStore = database.createObjectStore(LABEL_STORE_NAME, { keyPath: "id" });
    labelStore.createIndex("nameKey", "nameKey", { unique: true });
  } else labelStore = transaction.objectStore(LABEL_STORE_NAME);

  let memoLabelStore;
  if (!database.objectStoreNames.contains(MEMO_LABEL_STORE_NAME)) {
    memoLabelStore = database.createObjectStore(MEMO_LABEL_STORE_NAME, { keyPath: ["memoId", "labelId"] });
    memoLabelStore.createIndex("memoId", "memoId", { unique: false });
    memoLabelStore.createIndex("labelId", "labelId", { unique: false });
  } else memoLabelStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);
  return { memoStore, labelStore, memoLabelStore };
}

function migrateToManagedLabels(memoStore, labelStore, memoLabelStore, { idFactory, clock }) {
  const request = memoStore.getAll();
  request.addEventListener("success", () => {
    const memos = request.result.map(migrateMemoRecord).sort((left, right) => {
      const time = Date.parse(left.createdAt) - Date.parse(right.createdAt);
      return time || left.id.localeCompare(right.id);
    });
    const labelsByKey = new Map();
    const migratedAt = clock();
    for (const memo of memos) {
      const labelIds = [];
      const labelNames = [];
      for (const requestedName of memo.labels) {
        const key = labelNameKey(requestedName);
        let label = labelsByKey.get(key);
        if (!label) {
          label = createLabel({ id: idFactory(), name: requestedName, createdAt: migratedAt });
          labelsByKey.set(key, label);
          labelStore.put(label);
        }
        labelIds.push(label.id);
        labelNames.push(label.name);
        memoLabelStore.put({ memoId: memo.id, labelId: label.id });
      }
      memoStore.put({ ...memo, labels: labelNames, labelIds });
    }
  }, { once: true });
}

function openDatabase({ idFactory, clock }) {
  if (!globalThis.indexedDB) throw new Error("IndexedDB is not available in this environment");
  const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.addEventListener("upgradeneeded", (event) => {
    const stores = createStores(request.result, request.transaction);
    if (event.oldVersion > 0 && event.oldVersion < DATABASE_VERSION) {
      migrateToManagedLabels(stores.memoStore, stores.labelStore, stores.memoLabelStore, { idFactory, clock });
    }
  });
  return requestResult(request);
}

function replaceMemoLabelName(memo, labelId, nextName) {
  const normalized = migrateMemoRecord(memo);
  const labels = [...normalized.labels];
  for (let index = 0; index < normalized.labelIds.length; index += 1) {
    if (normalized.labelIds[index] === labelId) labels[index] = nextName;
  }
  return { ...normalized, labels };
}

function removeMemoLabel(memo, labelId) {
  const normalized = migrateMemoRecord(memo);
  const labels = [];
  const labelIds = [];
  for (let index = 0; index < normalized.labelIds.length; index += 1) {
    if (normalized.labelIds[index] === labelId) continue;
    labelIds.push(normalized.labelIds[index]);
    labels.push(normalized.labels[index]);
  }
  return { ...normalized, labels, labelIds };
}

function mergeMemoLabelProjection(memo, sourceId, targetId, targetName) {
  const normalized = migrateMemoRecord(memo);
  const labels = [];
  const labelIds = [];
  const seen = new Set();

  for (let index = 0; index < normalized.labelIds.length; index += 1) {
    const currentId = normalized.labelIds[index];
    const nextId = currentId === sourceId ? targetId : currentId;
    if (seen.has(nextId)) continue;
    seen.add(nextId);
    labelIds.push(nextId);
    labels.push(currentId === sourceId ? targetName : normalized.labels[index]);
  }

  return { ...normalized, labels, labelIds };
}

export class IndexedDbMemoStore {
  #databasePromise;
  #idFactory;
  #clock;

  constructor({ idFactory = defaultIdFactory, clock = () => new Date() } = {}) {
    this.#idFactory = idFactory;
    this.#clock = clock;
    this.#databasePromise = openDatabase({ idFactory, clock });
  }

  async put(memo) {
    const database = await this.#databasePromise;
    const transaction = database.transaction([MEMO_STORE_NAME, LABEL_STORE_NAME, MEMO_LABEL_STORE_NAME], "readwrite");
    const memoStore = transaction.objectStore(MEMO_STORE_NAME);
    const labelStore = transaction.objectStore(LABEL_STORE_NAME);
    const memoLabelStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);
    const normalized = migrateMemoRecord(memo);
    const existingLabels = (await requestResult(labelStore.getAll())).map(migrateLabelRecord);
    const reconciled = reconcileManagedLabels(existingLabels, normalized.labels, {
      idFactory: this.#idFactory,
      createdAt: this.#clock()
    });
    for (const label of reconciled.created) labelStore.put(label);
    const relationKeys = await requestResult(memoLabelStore.index("memoId").getAllKeys(normalized.id));
    for (const key of relationKeys) memoLabelStore.delete(key);
    for (const labelId of reconciled.labelIds) memoLabelStore.put({ memoId: normalized.id, labelId });
    memoStore.put({ ...normalized, labels: reconciled.labelNames, labelIds: reconciled.labelIds });
    await transactionComplete(transaction);
  }

  async get(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readonly");
    const memo = await requestResult(transaction.objectStore(MEMO_STORE_NAME).get(id));
    await transactionComplete(transaction);
    return memo ? migrateMemoRecord(memo) : undefined;
  }

  async list() {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_STORE_NAME, "readonly");
    const memos = await requestResult(transaction.objectStore(MEMO_STORE_NAME).getAll());
    await transactionComplete(transaction);
    return memos.map(migrateMemoRecord);
  }

  async listLabels() {
    const database = await this.#databasePromise;
    const transaction = database.transaction(LABEL_STORE_NAME, "readonly");
    const labels = await requestResult(transaction.objectStore(LABEL_STORE_NAME).getAll());
    await transactionComplete(transaction);
    return labels
      .map(migrateLabelRecord)
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
  }

  async listLabelIdsForMemo(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(MEMO_LABEL_STORE_NAME, "readonly");
    const relations = await requestResult(transaction.objectStore(MEMO_LABEL_STORE_NAME).index("memoId").getAll(id));
    await transactionComplete(transaction);
    return relations.map((relation) => relation.labelId);
  }

  async renameLabel(id, name, changedAt = this.#clock()) {
    const database = await this.#databasePromise;
    const transaction = database.transaction([MEMO_STORE_NAME, LABEL_STORE_NAME, MEMO_LABEL_STORE_NAME], "readwrite");
    const memoStore = transaction.objectStore(MEMO_STORE_NAME);
    const labelStore = transaction.objectStore(LABEL_STORE_NAME);
    const memoLabelStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);

    const current = await requestResult(labelStore.get(id));
    if (!current) throw new Error("label not found");
    const renamed = renameLabel(current, name, changedAt);
    const collision = await requestResult(labelStore.index("nameKey").get(renamed.nameKey));
    if (collision && collision.id !== id) {
      throw new Error("a label with that name already exists; merge the labels instead");
    }

    const relations = await requestResult(memoLabelStore.index("labelId").getAll(id));
    for (const relation of relations) {
      const memo = await requestResult(memoStore.get(relation.memoId));
      if (memo) memoStore.put(replaceMemoLabelName(memo, id, renamed.name));
    }
    labelStore.put(renamed);
    await transactionComplete(transaction);
    return renamed;
  }

  async updateLabelMetadata(id, metadata, changedAt = this.#clock()) {
    const database = await this.#databasePromise;
    const transaction = database.transaction(LABEL_STORE_NAME, "readwrite");
    const labelStore = transaction.objectStore(LABEL_STORE_NAME);
    const current = await requestResult(labelStore.get(id));
    if (!current) throw new Error("label not found");
    const updated = applyLabelMetadata(current, metadata, changedAt);
    labelStore.put(updated);
    await transactionComplete(transaction);
    return updated;
  }

  async deleteLabel(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction([MEMO_STORE_NAME, LABEL_STORE_NAME, MEMO_LABEL_STORE_NAME], "readwrite");
    const memoStore = transaction.objectStore(MEMO_STORE_NAME);
    const labelStore = transaction.objectStore(LABEL_STORE_NAME);
    const memoLabelStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);

    const label = await requestResult(labelStore.get(id));
    if (!label) throw new Error("label not found");
    const relations = await requestResult(memoLabelStore.index("labelId").getAll(id));
    for (const relation of relations) {
      const memo = await requestResult(memoStore.get(relation.memoId));
      if (memo) memoStore.put(removeMemoLabel(memo, id));
      memoLabelStore.delete([relation.memoId, id]);
    }
    labelStore.delete(id);
    await transactionComplete(transaction);
    return { label: migrateLabelRecord(label), affectedMemoCount: relations.length };
  }

  async mergeLabels(sourceId, targetId) {
    if (sourceId === targetId) throw new Error("source and target labels must be different");
    const database = await this.#databasePromise;
    const transaction = database.transaction([MEMO_STORE_NAME, LABEL_STORE_NAME, MEMO_LABEL_STORE_NAME], "readwrite");
    const memoStore = transaction.objectStore(MEMO_STORE_NAME);
    const labelStore = transaction.objectStore(LABEL_STORE_NAME);
    const memoLabelStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);

    const source = await requestResult(labelStore.get(sourceId));
    const target = await requestResult(labelStore.get(targetId));
    if (!source || !target) throw new Error("source and target labels must both exist");
    const normalizedTarget = migrateLabelRecord(target);
    const relations = await requestResult(memoLabelStore.index("labelId").getAll(sourceId));

    for (const relation of relations) {
      const memo = await requestResult(memoStore.get(relation.memoId));
      if (memo) memoStore.put(mergeMemoLabelProjection(memo, sourceId, targetId, normalizedTarget.name));
      memoLabelStore.put({ memoId: relation.memoId, labelId: targetId });
      memoLabelStore.delete([relation.memoId, sourceId]);
    }

    labelStore.put(normalizedTarget);
    labelStore.delete(sourceId);
    await transactionComplete(transaction);
    return {
      source: migrateLabelRecord(source),
      target: normalizedTarget,
      affectedMemoCount: relations.length
    };
  }

  async remove(id) {
    const database = await this.#databasePromise;
    const transaction = database.transaction([MEMO_STORE_NAME, MEMO_LABEL_STORE_NAME], "readwrite");
    transaction.objectStore(MEMO_STORE_NAME).delete(id);
    const relationStore = transaction.objectStore(MEMO_LABEL_STORE_NAME);
    const relationKeys = await requestResult(relationStore.index("memoId").getAllKeys(id));
    for (const key of relationKeys) relationStore.delete(key);
    await transactionComplete(transaction);
  }
}
