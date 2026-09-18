import { LABEL_COLORS, normalizeLabelName } from "../domain/label.mjs";
import { MEMO_COLORS } from "../domain/memo.mjs";

const FIELD_NAMES = Object.freeze(["color", "label", "label-color"]);

function tokenize(input) {
  if (typeof input !== "string") throw new TypeError("search expression must be a string");
  const tokens = [];
  let current = "";
  let quote = null;

  for (const char of input) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (quote) throw new SyntaxError("search expression has an unterminated quote");
  if (current) tokens.push(current);
  return tokens;
}

function parseColor(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "none") return "none";
  if (!MEMO_COLORS.includes(normalized)) {
    throw new SyntaxError(`color must be one of: none, ${MEMO_COLORS.join(", ")}`);
  }
  return normalized;
}

function parseLabelColor(value) {
  const normalized = value.trim().toLowerCase();
  if (!LABEL_COLORS.includes(normalized)) {
    throw new SyntaxError(`label-color must be one of: ${LABEL_COLORS.join(", ")}`);
  }
  return normalized;
}

export function parseSearchExpression(input) {
  const filters = {
    query: "",
    color: null,
    label: null,
    labelColor: null
  };
  const seen = new Set();
  const text = [];

  for (const token of tokenize(input)) {
    const separator = token.indexOf(":");
    const field = separator > 0 ? token.slice(0, separator).toLowerCase() : null;

    if (!field || !FIELD_NAMES.includes(field)) {
      text.push(token);
      continue;
    }

    if (seen.has(field)) throw new SyntaxError(`${field} may appear only once`);
    seen.add(field);

    const rawValue = token.slice(separator + 1).trim();
    if (!rawValue) throw new SyntaxError(`${field} requires a value`);

    if (field === "color") filters.color = parseColor(rawValue);
    if (field === "label") filters.label = normalizeLabelName(rawValue);
    if (field === "label-color") filters.labelColor = parseLabelColor(rawValue);
  }

  filters.query = text.join(" ").trim();
  return filters;
}
