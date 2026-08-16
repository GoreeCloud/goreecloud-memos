export interface NoteTitleParts {
  title: string;
  body: string;
  hasTitle: boolean;
}

/**
 * Treat a leading Markdown H1 as the optional GoreeCloud Memos title while
 * preserving the upstream Markdown-native storage model.
 */
export const splitNoteTitle = (content: string): NoteTitleParts => {
  const lines = content.split("\n");
  const titleMatch = lines[0]?.match(/^#\s+(.+?)\s*$/);
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
 * the upstream API. An empty title leaves the body unchanged.
 */
export const composeNoteContent = (title: string, body: string): string => {
  const normalizedTitle = title.replace(/\s+/g, " ").trim();
  if (!normalizedTitle) return body;
  if (!body) return `# ${normalizedTitle}`;
  return `# ${normalizedTitle}\n\n${body}`;
};
