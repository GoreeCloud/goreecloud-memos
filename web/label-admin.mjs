import { LabelService } from "../src/app/label-service.mjs";
import { LABEL_COLORS } from "../src/domain/label.mjs";
import { IndexedDbMemoStore } from "../src/storage/indexeddb-memo-store.mjs";

const STATUS_KEY = "goreecloud-memos:label-admin-status:v1";
const listElement = document.querySelector("#label-admin-list");
const statusElement = document.querySelector("#label-admin-status");
const memoListElement = document.querySelector("#memo-list");
const service = new LabelService(new IndexedDbMemoStore());
let refreshPending = false;

function setStatus(message) {
  statusElement.textContent = message;
}

function rememberStatus(message) {
  sessionStorage.setItem(STATUS_KEY, message);
}

function reloadWithStatus(message) {
  rememberStatus(message);
  window.location.reload();
}

function displayColor(color) {
  return color[0].toUpperCase() + color.slice(1);
}

function createColorSelect(label) {
  const select = document.createElement("select");
  select.dataset.labelColor = "";
  select.setAttribute("aria-label", `Color for ${label.name}`);

  const none = document.createElement("option");
  none.value = "";
  none.textContent = "No color";
  select.append(none);

  for (const color of LABEL_COLORS) {
    const option = document.createElement("option");
    option.value = color;
    option.textContent = displayColor(color);
    select.append(option);
  }
  select.value = label.color ?? "";
  return select;
}

function createTargetSelect(labels, sourceId) {
  const select = document.createElement("select");
  select.dataset.mergeTarget = "";
  select.setAttribute("aria-label", "Merge target");

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose target…";
  select.append(placeholder);

  for (const label of labels) {
    if (label.id === sourceId) continue;
    const option = document.createElement("option");
    option.value = label.id;
    option.textContent = label.name;
    select.append(option);
  }
  return select;
}

function createButton(text, action, labelId, { danger = false, disabled = false } = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.dataset.labelAction = action;
  button.dataset.labelId = labelId;
  button.className = danger ? "danger" : "secondary";
  button.disabled = disabled;
  return button;
}

function renderLabels(labels) {
  listElement.replaceChildren();
  if (labels.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No managed labels yet. Add a label to a memo to create one.";
    listElement.append(empty);
    return;
  }

  for (const label of labels) {
    const row = document.createElement("article");
    row.className = "filter-panel label-admin-row";
    row.dataset.labelId = label.id;
    row.dataset.labelColor = label.color ?? "none";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Label name";
    const input = document.createElement("input");
    input.value = label.name;
    input.maxLength = 60;
    input.dataset.labelName = "";
    input.setAttribute("aria-label", `Label name for ${label.name}`);
    nameLabel.append(input);

    const colorLabel = document.createElement("label");
    colorLabel.textContent = "Label color";
    colorLabel.append(createColorSelect(label));

    const iconLabel = document.createElement("label");
    iconLabel.textContent = "Icon (optional)";
    const iconInput = document.createElement("input");
    iconInput.value = label.icon ?? "";
    iconInput.maxLength = 32;
    iconInput.dataset.labelIcon = "";
    iconInput.setAttribute("aria-label", `Icon for ${label.name}`);
    iconInput.placeholder = "Example: 💡";
    iconLabel.append(iconInput);

    const descriptionLabel = document.createElement("label");
    descriptionLabel.textContent = "Description (optional)";
    const descriptionInput = document.createElement("input");
    descriptionInput.value = label.description ?? "";
    descriptionInput.maxLength = 280;
    descriptionInput.dataset.labelDescription = "";
    descriptionInput.setAttribute("aria-label", `Description for ${label.name}`);
    descriptionInput.placeholder = "What this label is for";
    descriptionLabel.append(descriptionInput);

    const mergeLabel = document.createElement("label");
    mergeLabel.textContent = "Merge into";
    const target = createTargetSelect(labels, label.id);
    mergeLabel.append(target);

    const controls = document.createElement("div");
    controls.className = "filter-actions";
    controls.append(
      createButton("Rename", "rename", label.id),
      createButton("Save details", "metadata", label.id),
      createButton("Merge", "merge", label.id, { disabled: labels.length < 2 }),
      createButton("Delete", "delete", label.id, { danger: true })
    );

    const fields = document.createElement("div");
    fields.className = "filter-grid";
    fields.append(nameLabel, colorLabel, iconLabel, descriptionLabel, mergeLabel);
    row.append(fields, controls);
    listElement.append(row);
  }
}

async function refreshLabels() {
  const labels = await service.list();
  renderLabels(labels);
  return labels;
}

function scheduleLabelRefresh() {
  if (refreshPending) return;
  refreshPending = true;
  queueMicrotask(() => {
    refreshPending = false;
    refreshLabels().catch((error) => {
      setStatus(error instanceof Error ? error.message : "Could not refresh labels");
    });
  });
}

listElement.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-label-action]");
  if (!button) return;
  const row = button.closest(".label-admin-row");
  if (!row) return;
  const labelId = row.dataset.labelId;
  button.disabled = true;

  try {
    switch (button.dataset.labelAction) {
      case "rename": {
        const name = row.querySelector("[data-label-name]").value;
        const renamed = await service.rename(labelId, name);
        reloadWithStatus(`Renamed label to ${renamed.name}.`);
        return;
      }
      case "metadata": {
        const updated = await service.updateMetadata(labelId, {
          color: row.querySelector("[data-label-color]").value,
          icon: row.querySelector("[data-label-icon]").value,
          description: row.querySelector("[data-label-description]").value
        });
        reloadWithStatus(`Saved details for ${updated.name}.`);
        return;
      }
      case "delete": {
        const currentName = row.querySelector("[data-label-name]").value;
        if (!window.confirm(`Delete label “${currentName}” from every memo? Memos themselves will not be deleted.`)) {
          button.disabled = false;
          return;
        }
        const result = await service.delete(labelId);
        reloadWithStatus(`Deleted label ${result.label.name} from ${result.affectedMemoCount} memo${result.affectedMemoCount === 1 ? "" : "s"}.`);
        return;
      }
      case "merge": {
        const targetId = row.querySelector("[data-merge-target]").value;
        if (!targetId) throw new Error("choose a target label before merging");
        const labels = await service.list();
        const source = labels.find((label) => label.id === labelId);
        const target = labels.find((label) => label.id === targetId);
        if (!source || !target) throw new Error("source and target labels must both exist");
        if (!window.confirm(`Merge “${source.name}” into “${target.name}”? The source label will be removed.`)) {
          button.disabled = false;
          return;
        }
        const result = await service.merge(labelId, targetId);
        reloadWithStatus(`Merged ${result.source.name} into ${result.target.name} across ${result.affectedMemoCount} memo${result.affectedMemoCount === 1 ? "" : "s"}.`);
        return;
      }
      default:
        throw new Error("unsupported label action");
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not update labels");
    button.disabled = false;
  }
});

const restoredStatus = sessionStorage.getItem(STATUS_KEY);
if (restoredStatus) {
  sessionStorage.removeItem(STATUS_KEY);
  setStatus(restoredStatus);
}

if (memoListElement) {
  new MutationObserver(scheduleLabelRefresh).observe(memoListElement, { childList: true, subtree: true });
}

refreshLabels().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load labels");
});
