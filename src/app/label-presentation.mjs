function requireMemoLabels(memo) {
  if (!memo || typeof memo !== "object") throw new TypeError("memo must be an object");
  if (!Array.isArray(memo.labels)) throw new TypeError("memo.labels must be an array");
  if (!Array.isArray(memo.labelIds)) throw new TypeError("memo.labelIds must be an array");
}

function managedLabelsById(managedLabels) {
  if (!Array.isArray(managedLabels)) throw new TypeError("managedLabels must be an array");
  const byId = new Map();
  for (const label of managedLabels) {
    if (!label || typeof label !== "object") continue;
    if (typeof label.id !== "string" || label.id.trim().length === 0) continue;
    byId.set(label.id.trim(), label);
  }
  return byId;
}

export function buildLabelPresentations(memo, managedLabels = []) {
  requireMemoLabels(memo);
  const byId = managedLabelsById(managedLabels);

  return memo.labels.map((projectedName, index) => {
    if (typeof projectedName !== "string" || projectedName.trim().length === 0) {
      throw new TypeError("memo.labels must contain non-empty strings");
    }

    const rawId = memo.labelIds[index];
    const id = typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : null;
    const managed = id ? byId.get(id) : undefined;
    const managedName = typeof managed?.name === "string" && managed.name.trim().length > 0
      ? managed.name.trim()
      : null;

    return {
      id,
      name: managedName ?? projectedName.trim(),
      color: typeof managed?.color === "string" && managed.color.trim().length > 0 ? managed.color.trim() : null,
      icon: typeof managed?.icon === "string" && managed.icon.trim().length > 0 ? managed.icon.trim() : null
    };
  });
}
