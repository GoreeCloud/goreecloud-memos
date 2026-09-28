const MEMO_COLORS = Object.freeze(["", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink", "gray"]);
const COLOR_LABELS = Object.freeze({
  "": "No color", red: "Red", orange: "Orange", yellow: "Yellow", green: "Green",
  teal: "Teal", blue: "Blue", purple: "Purple", pink: "Pink", gray: "Gray"
});

let managedLabels = [];
const labelControllers = new WeakMap();

function parseLabels(value) {
  const labels = [];
  const seen = new Set();
  for (const raw of String(value ?? "").split(",")) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(name);
  }
  return labels;
}

function serializeLabels(labels) {
  const unique = [];
  const seen = new Set();
  for (const raw of labels) {
    const name = String(raw ?? "").trim();
    if (!name) continue;
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }
  return unique.join(", ");
}

function labelMetadata(name) {
  const key = name.toLocaleLowerCase();
  return managedLabels.find((label) => label.name.toLocaleLowerCase() === key) ?? null;
}

function setSourceLabels(source, labels) {
  source.value = serializeLabels(labels);
  source.dispatchEvent(new Event("input", { bubbles: true }));
}

function enhanceColorControl(select) {
  if (!(select instanceof HTMLSelectElement) || select.dataset.swatchesEnhanced === "true") return;
  const control = select.closest("[data-color-control]") ?? select.parentElement;
  const host = control?.querySelector("[data-color-picker-host]");
  if (!host) return;

  select.dataset.swatchesEnhanced = "true";
  select.classList.add("control-source--enhanced");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  const picker = document.createElement("div");
  picker.className = "color-picker";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", select.getAttribute("aria-label") ?? "Memo color");

  function sync() {
    for (const button of picker.querySelectorAll(".color-swatch")) {
      button.setAttribute("aria-pressed", String(button.dataset.color === select.value));
    }
  }

  for (const color of MEMO_COLORS) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.dataset.color = color;
    button.setAttribute("aria-label", COLOR_LABELS[color]);
    button.title = COLOR_LABELS[color];
    const sample = document.createElement("span");
    sample.className = "color-swatch__sample";
    sample.setAttribute("aria-hidden", "true");
    button.append(sample);
    button.addEventListener("click", () => {
      select.value = color;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
      sync();
    });
    picker.append(button);
  }

  select.addEventListener("input", sync);
  select.addEventListener("change", sync);
  select.closest("form")?.addEventListener("reset", () => queueMicrotask(sync));
  host.replaceChildren(picker);
  sync();
}

function enhanceLabelControl(source) {
  if (!(source instanceof HTMLInputElement) || source.dataset.chipsEnhanced === "true") return;
  const control = source.closest("[data-label-control]") ?? source.parentElement;
  const host = control?.querySelector("[data-label-picker-host]");
  if (!host) return;

  source.dataset.chipsEnhanced = "true";
  source.classList.add("control-source--enhanced");
  source.tabIndex = -1;
  source.setAttribute("aria-hidden", "true");

  const picker = document.createElement("div");
  picker.className = "label-picker";

  const selected = document.createElement("div");
  selected.className = "label-picker__selected";
  selected.setAttribute("aria-label", "Selected labels");

  const entry = document.createElement("input");
  entry.type = "text";
  entry.className = "label-picker__entry";
  entry.autocomplete = "off";
  entry.placeholder = "Add a label…";
  entry.setAttribute("aria-label", source.matches("#memo-labels") ? "Add labels" : "Edit labels");

  const suggestions = document.createElement("div");
  suggestions.className = "label-picker__suggestions";
  suggestions.setAttribute("aria-label", "Available labels");

  picker.append(selected, entry, suggestions);
  host.replaceChildren(picker);

  function render() {
    const labels = parseLabels(source.value);
    selected.replaceChildren();

    for (const name of labels) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "label-chip label-chip--selected";
      chip.dataset.labelColor = labelMetadata(name)?.color ?? "none";
      chip.setAttribute("aria-label", `Remove label ${name}`);
      const nameText = document.createElement("span");
      nameText.textContent = name;
      const remove = document.createElement("span");
      remove.className = "label-chip__remove";
      remove.setAttribute("aria-hidden", "true");
      remove.textContent = "×";
      chip.append(nameText, remove);
      chip.addEventListener("click", () => {
        const key = name.toLocaleLowerCase();
        setSourceLabels(source, labels.filter((label) => label.toLocaleLowerCase() !== key));
        entry.focus();
      });
      selected.append(chip);
    }

    suggestions.replaceChildren();
    const selectedKeys = new Set(labels.map((name) => name.toLocaleLowerCase()));
    const available = managedLabels
      .filter((label) => !selectedKeys.has(label.name.toLocaleLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);

    if (available.length > 0) {
      const prefix = document.createElement("span");
      prefix.className = "label-picker__suggestion-label";
      prefix.textContent = "Choose";
      suggestions.append(prefix);
    }

    for (const label of available) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "label-chip label-chip--suggestion";
      chip.dataset.labelColor = label.color ?? "none";
      chip.textContent = label.name;
      chip.setAttribute("aria-label", `Add label ${label.name}`);
      chip.addEventListener("click", () => {
        setSourceLabels(source, [...parseLabels(source.value), label.name]);
        entry.focus();
      });
      suggestions.append(chip);
    }
  }

  function commitEntry() {
    const incoming = parseLabels(entry.value);
    if (incoming.length === 0) return;
    setSourceLabels(source, [...parseLabels(source.value), ...incoming]);
    entry.value = "";
  }

  entry.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitEntry();
    }
    if (event.key === "Backspace" && entry.value === "") {
      const labels = parseLabels(source.value);
      if (labels.length > 0) setSourceLabels(source, labels.slice(0, -1));
    }
  });
  entry.addEventListener("blur", commitEntry);
  source.addEventListener("input", render);
  source.closest("form")?.addEventListener("reset", () => {
    queueMicrotask(() => {
      entry.value = "";
      render();
    });
  });

  labelControllers.set(source, { render });
  render();
}

function enhanceAll(root = document) {
  const scope = root instanceof Element || root instanceof Document ? root : document;
  if (scope.matches?.("#memo-color, [data-edit-field='color']")) enhanceColorControl(scope);
  if (scope.matches?.("#memo-labels, [data-edit-field='labels']")) enhanceLabelControl(scope);
  for (const select of scope.querySelectorAll("#memo-color, [data-edit-field='color']")) enhanceColorControl(select);
  for (const input of scope.querySelectorAll("#memo-labels, [data-edit-field='labels']")) enhanceLabelControl(input);
}

function rerenderLabelControls() {
  for (const source of document.querySelectorAll("#memo-labels, [data-edit-field='labels']")) {
    labelControllers.get(source)?.render();
  }
}

document.addEventListener("goreecloud:memos-rendered", (event) => {
  managedLabels = Array.isArray(event.detail?.labels) ? event.detail.labels : [];
  enhanceAll();
  rerenderLabelControls();
});

const observer = new MutationObserver((records) => {
  for (const record of records) {
    for (const node of record.addedNodes) {
      if (node instanceof Element) enhanceAll(node);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });

enhanceAll();
