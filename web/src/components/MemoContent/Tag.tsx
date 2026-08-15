import type { Element } from "hast";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { type MemoFilter, stringifyFilters, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import useNavigateTo from "@/hooks/useNavigateTo";
import { colorToHex } from "@/lib/color";
import { tagStyles } from "@/lib/markdownStyles";
import { findTagMetadata } from "@/lib/tag";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { useMemoViewContext } from "../MemoView/MemoViewContext";

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  node?: Element; // AST node from react-markdown
  "data-tag"?: string;
  children?: React.ReactNode;
}

export const Tag: React.FC<TagProps> = ({ "data-tag": dataTag, children: _children, className, style, node: _node, ...props }) => {
  const { parentPage } = useMemoViewContext();
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const { getFiltersByFactor, removeFilter, addFilter } = useMemoFilterContext();
  const { userTagsSetting } = useAuth();

  const tag = dataTag || "";

  // Custom color from user tag metadata. Dynamic hex values must use inline styles
  // because Tailwind can't scan dynamically constructed class names.
  // Text uses a darkened variant (40% color + black) for contrast on light backgrounds.
  const metadata = userTagsSetting ? findTagMetadata(tag, userTagsSetting) : undefined;
  const bgHex = colorToHex(metadata?.backgroundColor);
  const tagStyle: React.CSSProperties | undefined = bgHex
    ? {
        borderColor: bgHex,
        color: `color-mix(in srgb, ${bgHex} 60%, black)`,
        backgroundColor: `color-mix(in srgb, ${bgHex} 15%, transparent)`,
        ...style,
      }
    : style;

  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // If the label is clicked in a note detail page, navigate to the note list page.
    if (location.pathname.startsWith("/m")) {
      const pathname = parentPage || Routes.HOME;
      const searchParams = new URLSearchParams();

      searchParams.set("filter", stringifyFilters([{ factor: "tagSearch", value: tag }]));
      navigateTo(`${pathname}?${searchParams.toString()}`);
      return;
    }

    const isActive = getFiltersByFactor("tagSearch").some((filter: MemoFilter) => filter.value === tag);
    if (isActive) {
      removeFilter((f: MemoFilter) => f.factor === "tagSearch" && f.value === tag);
    } else {
      // Labels are single-select in the GoreeCloud Notes workspace.
      removeFilter((f: MemoFilter) => f.factor === "tagSearch");
      addFilter({
        factor: "tagSearch",
        value: tag,
      });
    }
  };

  return (
    <span
      className={cn(
        tagStyles.base,
        "min-h-11 cursor-pointer touch-manipulation rounded-full px-3 py-1.5 text-xs font-medium transition-[opacity,transform] hover:-translate-y-px hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:min-h-0 sm:px-2 sm:py-0.5",
        !bgHex && tagStyles.defaultColor,
        className,
      )}
      style={tagStyle}
      data-tag={tag}
      aria-label={`Label ${tag}`}
      role="button"
      tabIndex={0}
      {...props}
      onClick={handleTagClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.currentTarget.click();
        }
      }}
    >
      {tag}
    </span>
  );
};
