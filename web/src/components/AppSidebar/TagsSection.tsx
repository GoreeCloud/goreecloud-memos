import { ListIcon, ListTreeIcon, PencilIcon, TagIcon } from "lucide-react";
import { forwardRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { replaceFiltersByFactor, stringifyFilters, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { useLocalStorage, useOverflowTitle } from "@/hooks";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import TagTree from "../TagTree";
import { SIDEBAR_ROW_CLASSES, SIDEBAR_ROW_COUNT_CLASSES, SIDEBAR_ROW_ICON_CLASSES, sidebarRowStateClasses } from "./SidebarRow";
import SidebarSection, {
  SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES,
  SIDEBAR_SECTION_ACTION_BUTTON_CLASSES,
  SIDEBAR_SECTION_ACTION_ICON_CLASSES,
} from "./SidebarSection";

interface Props {
  tagCount: Record<string, number>;
  onSelect?: () => void;
  /** When set, label clicks land on this route with the tag filter instead of filtering the current one. */
  navigationTarget?: string;
  /** Whose labels these are; keeps tree expansion state from bleeding between users and views. */
  scope: string;
}

const LabelPath = forwardRef<HTMLSpanElement, { label: string }>(({ label }, ref) => {
  const segments = label.split("/");

  return (
    <span ref={ref} className="min-w-0 flex-1 truncate text-left">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`}>
          {index > 0 && <span className="px-0.5 text-muted-foreground/40">/</span>}
          <span className={index === segments.length - 1 ? "text-current" : "text-muted-foreground/75"}>{segment}</span>
        </span>
      ))}
    </span>
  );
});
LabelPath.displayName = "LabelPath";

interface FlatLabelRowProps {
  label: string;
  amount: number;
  active: boolean;
  onClick: () => void;
}

const FlatLabelRow = ({ label, amount, active, onClick }: FlatLabelRowProps) => {
  const { ref, title } = useOverflowTitle<HTMLSpanElement>(label);

  return (
    <button
      type="button"
      aria-pressed={active || undefined}
      title={title}
      className={cn(SIDEBAR_ROW_CLASSES, sidebarRowStateClasses(active))}
      onClick={onClick}
    >
      <TagIcon aria-hidden="true" className={SIDEBAR_ROW_ICON_CLASSES} strokeWidth={1.8} />
      <LabelPath ref={ref} label={label} />
      <span className={SIDEBAR_ROW_COUNT_CLASSES}>{amount}</span>
    </button>
  );
};

const TagsSection = ({ tagCount, onSelect, navigationTarget, scope }: Props) => {
  const navigate = useNavigate();
  const { userTagsSetting } = useAuth();
  const { filters, setFilters, getFiltersByFactor, addFilter, removeFilter } = useMemoFilterContext();
  const [treeMode, setTreeMode] = useLocalStorage<boolean>("goreecloud-label-view-as-tree", false);
  const activeTags = new Set(getFiltersByFactor("tagSearch").map((filter) => filter.value));
  const activeTag = activeTags.values().next().value as string | undefined;

  // A Keep-style label may exist before it has been assigned to a note. Memos'
  // original sidebar only showed tags discovered in note content, which made an
  // empty/new label library invisible. Merge configured tag metadata with live
  // counts so GoreeCloud Labels are always discoverable.
  const labels = useMemo(() => {
    const names = new Set([...Object.keys(userTagsSetting?.tags ?? {}), ...Object.keys(tagCount)]);
    return Array.from(names)
      .map((name) => [name, tagCount[name] ?? 0] as const)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [tagCount, userTagsSetting?.tags]);

  const handleLabelClick = (label: string) => {
    if (navigationTarget) {
      const nextFilters = replaceFiltersByFactor(filters, "tagSearch", [{ factor: "tagSearch", value: label }]);
      setFilters(nextFilters);
      navigate({ pathname: navigationTarget, search: `?filter=${stringifyFilters(nextFilters)}` });
      onSelect?.();
      return;
    }
    const active = activeTags.has(label);
    if (active) {
      removeFilter((filter) => filter.factor === "tagSearch" && filter.value === label);
    } else {
      removeFilter((filter) => filter.factor === "tagSearch");
      addFilter({ factor: "tagSearch", value: label });
    }
    onSelect?.();
  };

  return (
    <SidebarSection
      label="Labels"
      action={
        labels.length > 1 ? (
          <div className="flex items-center gap-0.5" role="group" aria-label="Label layout">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Show labels as list"
              aria-pressed={!treeMode}
              className={cn(SIDEBAR_SECTION_ACTION_BUTTON_CLASSES, !treeMode && SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES)}
              onClick={() => setTreeMode(false)}
            >
              <ListIcon className={SIDEBAR_SECTION_ACTION_ICON_CLASSES} strokeWidth={1.8} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Show nested labels"
              aria-pressed={treeMode}
              className={cn(SIDEBAR_SECTION_ACTION_BUTTON_CLASSES, treeMode && SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES)}
              onClick={() => setTreeMode(true)}
            >
              <ListTreeIcon className={SIDEBAR_SECTION_ACTION_ICON_CLASSES} strokeWidth={1.8} />
            </Button>
          </div>
        ) : undefined
      }
    >
      {labels.length > 0 &&
        (treeMode ? (
          <TagTree key={scope} tagAmounts={labels} activeTag={activeTag} scope={scope} onTagClick={handleLabelClick} />
        ) : (
          labels.map(([label, amount]) => (
            <FlatLabelRow key={label} label={label} amount={amount} active={activeTags.has(label)} onClick={() => handleLabelClick(label)} />
          ))
        ))}

      <Link
        to={`${ROUTES.SETTING}#tags`}
        onClick={onSelect}
        className={cn(SIDEBAR_ROW_CLASSES, "text-muted-foreground hover:text-foreground")}
      >
        <PencilIcon aria-hidden="true" className={SIDEBAR_ROW_ICON_CLASSES} strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate text-left">Edit labels</span>
      </Link>
    </SidebarSection>
  );
};

export default TagsSection;
