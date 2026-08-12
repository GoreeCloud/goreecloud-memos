import { ArchiveIcon, ArchiveRestoreIcon, BookmarkIcon, CheckIcon, PaletteIcon, TagIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { getNoteColor, NOTE_COLOR_OPTIONS } from "@/utils/noteColor";
import { normalizeNoteLabel } from "@/utils/noteLabels";
import { isNoteTrashed } from "@/utils/noteTrash";
import { useMemoActionHandlers } from "../../MemoActionMenu/hooks";
import { useMemoViewContext } from "../MemoViewContext";

const isAssignableLabel = (label: string) => normalizeNoteLabel(label) === label && !/[.*+?^${}()|[\]\\]/u.test(label);

const ACTION_BUTTON_CLASS =
  "size-8 rounded-full text-muted-foreground transition-[background-color,color,transform] hover:-translate-y-px hover:bg-background/75 hover:text-foreground";

const GoreeCloudCardActions = () => {
  const { memo, readonly, isArchived } = useMemoViewContext();
  const { userTagsSetting } = useAuth();
  const [colorOpen, setColorOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const noteColor = getNoteColor(memo.content);
  const trashed = isNoteTrashed(memo.content);
  const assignedLabels = new Set(memo.tags ?? []);
  const availableLabels = useMemo(
    () =>
      Array.from(new Set([...Object.keys(userTagsSetting?.tags ?? {}), ...(memo.tags ?? [])]))
        .filter(isAssignableLabel)
        .sort((a, b) => a.localeCompare(b)),
    [memo.tags, userTagsSetting?.tags],
  );

  const { handleTogglePinMemoBtnClick, handleSetNoteColor, handleToggleLabel, handleToggleMemoStatusClick, handleRestoreFromTrash } =
    useMemoActionHandlers({ memo, setDeleteDialogOpen: () => undefined });

  if (readonly || memo.parent) return null;

  if (trashed) {
    return (
      <div className="mt-1 flex w-full justify-end border-t border-border/45 pt-2">
        <Button type="button" variant="ghost" size="sm" className="rounded-full px-3 text-xs" onClick={() => void handleRestoreFromTrash()}>
          <ArchiveRestoreIcon className="size-4" strokeWidth={1.8} />
          Restore
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "-mx-1 mt-1 flex min-h-9 w-[calc(100%+0.5rem)] items-center justify-end gap-0.5 border-t border-border/35 px-1 pt-2",
        "opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        (colorOpen || labelsOpen) && "opacity-100",
      )}
    >
      {!isArchived && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className={cn(ACTION_BUTTON_CLASS, memo.pinned && "bg-primary/10 text-primary")}
          onClick={() => void handleTogglePinMemoBtnClick()}
          title={memo.pinned ? "Unpin note" : "Pin note"}
          aria-label={memo.pinned ? "Unpin note" : "Pin note"}
        >
          <BookmarkIcon className="size-4" strokeWidth={1.8} fill={memo.pinned ? "currentColor" : "none"} />
        </Button>
      )}

      {!isArchived && (
        <DropdownMenu open={colorOpen} onOpenChange={setColorOpen}>
          <DropdownMenuTrigger
            render={<Button type="button" variant="ghost" size="icon-sm" className={ACTION_BUTTON_CLASS} aria-label="Change note color" />}
          >
            <PaletteIcon className="size-4" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-44">
            {NOTE_COLOR_OPTIONS.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => void handleSetNoteColor(option.value)}>
                <span className={cn("size-4 rounded-full border", option.swatchClassName)} aria-hidden />
                <span className="flex-1">{option.label}</span>
                {noteColor === option.value && <CheckIcon className="size-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isArchived && (
        <DropdownMenu open={labelsOpen} onOpenChange={setLabelsOpen}>
          <DropdownMenuTrigger
            render={<Button type="button" variant="ghost" size="icon-sm" className={ACTION_BUTTON_CLASS} aria-label="Manage note labels" />}
          >
            <TagIcon className="size-4" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={6} className="min-w-48">
            {availableLabels.length === 0 ? (
              <DropdownMenuItem disabled>No labels yet</DropdownMenuItem>
            ) : (
              availableLabels.map((label) => {
                const assigned = assignedLabels.has(label);
                return (
                  <DropdownMenuItem key={label} onClick={() => void handleToggleLabel(label, !assigned)}>
                    <span className="flex size-4 items-center justify-center rounded border border-border bg-background">
                      {assigned && <CheckIcon className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                  </DropdownMenuItem>
                );
              })
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-xs text-muted-foreground">
              Manage all labels from Settings → Labels
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className={ACTION_BUTTON_CLASS}
        onClick={() => void handleToggleMemoStatusClick()}
        title={isArchived ? "Restore note" : "Archive note"}
        aria-label={isArchived ? "Restore note" : "Archive note"}
      >
        {isArchived ? <ArchiveRestoreIcon className="size-4" strokeWidth={1.8} /> : <ArchiveIcon className="size-4" strokeWidth={1.8} />}
      </Button>
    </div>
  );
};

export default GoreeCloudCardActions;
