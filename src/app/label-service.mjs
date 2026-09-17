function validateStore(store) {
  for (const method of ["listLabels", "renameLabel", "deleteLabel", "mergeLabels"]) {
    if (typeof store?.[method] !== "function") {
      throw new TypeError(`store.${method} must be a function`);
    }
  }
}

function validateId(id, fieldName = "label id") {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new TypeError(`${fieldName} must be a non-empty string`);
  }
  return id.trim();
}

export class LabelService {
  #store;
  #clock;

  constructor(store, { clock = () => new Date() } = {}) {
    validateStore(store);
    this.#store = store;
    this.#clock = clock;
  }

  async list() {
    return this.#store.listLabels();
  }

  async rename(id, name) {
    return this.#store.renameLabel(validateId(id), name, this.#clock());
  }

  async delete(id) {
    return this.#store.deleteLabel(validateId(id));
  }

  async merge(sourceId, targetId) {
    const source = validateId(sourceId, "source label id");
    const target = validateId(targetId, "target label id");
    if (source === target) throw new Error("source and target labels must be different");
    return this.#store.mergeLabels(source, target);
  }
}
