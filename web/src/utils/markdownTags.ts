import type { Root } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import type { Node as UnistNode } from "unist";
import { remarkMemoSyntax } from "@/utils/remark-plugins/remark-tag";

type ParentNode = UnistNode & { children: UnistNode[] };

const isParentNode = (node: UnistNode): node is ParentNode => Array.isArray((node as { children?: unknown }).children);

/**
 * Extract Markdown tags through the same context-aware transformation used by
 * GoreeCloud Notes rendering. Code, link destinations, autolinks, HTML, and
 * other opaque Markdown syntax therefore do not become managed labels.
 *
 * Duplicate values are intentionally preserved so callers can compare exact
 * occurrence counts while locating source spans.
 */
export const extractMarkdownTagValues = (source: string): string[] => {
  const tree = fromMarkdown(source, {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  }) as Root;

  remarkMemoSyntax()(tree, { value: source });

  const tags: string[] = [];
  const collect = (node: UnistNode): void => {
    if (node.type === "tagNode") {
      const value = (node as UnistNode & { value?: unknown }).value;
      if (typeof value === "string") tags.push(value);
    }
    if (isParentNode(node)) node.children.forEach(collect);
  };
  collect(tree);
  return tags;
};
