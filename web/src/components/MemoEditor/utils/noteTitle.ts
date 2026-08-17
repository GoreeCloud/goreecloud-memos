export interface NoteTitleParts {
  title: string;
  body: string;
  hasTitle: boolean;
}

/**
 * Treat a leading Markdown H1 as the optional GoreeCloud Memos title while
 * preserving the upstream Markdown-native storage model.
 *
 * Trailing title whitespace is intentionally preserved while editing. The
 * title field is controlled by this Markdown representation, so trimming on
 * every keystroke would erase a just-typed Space before the next word arrives.
 */
export const splitNoteTitle = (content: string): NoteTitleParts => {
  const lines = content.split("\n");
  const titleMatch = lines[0]?.match(/^#\s+(.*)$/);
  if (!titleMatch) {
    return { title: "", body: content, hasTitle: false };
  }

  const bodyLines = lines.slice(1);
  if (bodyLines[0] === "") bodyLines.shift();

  return {
    title: titleMatch[1] ?? "",
    body: bodyLines.join("\n"),
    hasTitle: true,
  };
};

/**
 * Recombine the title and body into the single Markdown document expected by
 * the upstream API. Preserve ordinary title spacing while the controlled field
 * is active; only line breaks are flattened because an HTML text input cannot
 * represent a multi-line title.
 */
export const composeNoteContent = (title: string, body: string): string => {
  const editableTitle = title.replace(/[\r\n]+/g, " ");
  if (!editableTitle.trim()) return body;
  if (!body) return `# ${editableTitle}`;
  return `# ${editableTitle}\n\n${body}`;
};
