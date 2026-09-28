function requireMemo(memo) {
  if (!memo || typeof memo !== "object") throw new TypeError("memo must be an object");
  if (typeof memo.content !== "string" || memo.content.trim().length === 0) {
    throw new TypeError("memo content must be a non-empty string");
  }
  return memo;
}

function cleanFilenamePart(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[. ]+$/g, "")
    .slice(0, 80);
}

export function formatMemoPlainText(memo) {
  const normalized = requireMemo(memo);
  const lines = [];
  const title = typeof normalized.title === "string" ? normalized.title.trim() : "";

  if (title) {
    lines.push(title, "");
  }
  lines.push(normalized.content.trimEnd());

  const labels = Array.isArray(normalized.labels)
    ? normalized.labels.map((label) => String(label).trim()).filter(Boolean)
    : [];
  const metadata = [];
  if (labels.length > 0) metadata.push(`Labels: ${labels.join(", ")}`);
  if (typeof normalized.color === "string" && normalized.color.trim()) {
    metadata.push(`Color: ${normalized.color.trim()}`);
  }

  if (metadata.length > 0) {
    lines.push("", ...metadata);
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export function memoPlainTextFilename(memo) {
  const normalized = requireMemo(memo);
  const contentLead = normalized.content.split(/\r?\n/, 1)[0];
  const stem = cleanFilenamePart(normalized.title) || cleanFilenamePart(contentLead) || "memo";
  return `${stem}.txt`;
}


export function formatMemoPlainTextSelection(memos) {
  if (!Array.isArray(memos) || memos.length === 0) {
    throw new TypeError("memos must be a non-empty array");
  }

  return memos
    .map((memo, index) => {
      const body = formatMemoPlainText(memo).trimEnd();
      return `Memo ${index + 1} of ${memos.length}\n\n${body}`;
    })
    .join("\n\n---\n\n") + "\n";
}

export function memoPlainTextSelectionFilename(count) {
  if (!Number.isInteger(count) || count < 1) throw new TypeError("count must be a positive integer");
  return `goreecloud-memos-selection-${count}.txt`;
}
