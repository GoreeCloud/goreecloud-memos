import { parseSearchExpression } from "./search-expression.mjs";

export class SavedViewService {
  #store;

  constructor(store) {
    if (!store || typeof store.listSavedViews !== "function" || typeof store.createSavedView !== "function" || typeof store.deleteSavedView !== "function") {
      throw new TypeError("store must implement saved view operations");
    }
    this.#store = store;
  }

  list() {
    return this.#store.listSavedViews();
  }

  create(name, filters) {
    if (!filters || typeof filters !== "object" || Array.isArray(filters)) {
      throw new TypeError("saved view filters must be an object");
    }
    parseSearchExpression(filters.query ?? "");
    return this.#store.createSavedView(name, filters);
  }

  delete(id) {
    if (typeof id !== "string" || id.trim().length === 0) throw new TypeError("saved view id must be a non-empty string");
    return this.#store.deleteSavedView(id.trim());
  }
}
