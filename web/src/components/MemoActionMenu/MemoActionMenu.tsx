import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookmarkMinusIcon,
  BookmarkPlusIcon,
  CheckCheckIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  Edit3Icon,
  FileTextIcon,
  LinkIcon,
  ListChecksIcon,
  ListRestartIcon,
  MoreVerticalIcon,
  PaletteIcon,
  PencilIcon,
  TagIcon,
  TrashIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { State } from "@/types/proto/api/v1/common_pb";
import { useTranslate } from "@/utils/i18n";
import { getNoteColor, NOTE_COLOR_OPTIONS } from "@/utils/noteColor";
import { normalizeNoteLabel } from "@/utils/noteLabels";
import { isNoteTrashed } from "@/utils/noteTrash";
import { useMemoActionHandlers } from "./hooks";
import type { MemoActionMenuProps } from "./types";

const isAssignableLabel = (label: string) =>
  normalizeNoteLabel(label) === label && !/[.*+?^${}()|[\]\\]/u.test(label);

const MemoActionMenu = (props: MemoActionMenuProps) => {
  const { memo, readonly } = props;
  const t = useTranslate();
  const navigate = useNavigate();
  const { userTagsSetting } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isComment = Boolean(memo.parent);
  const isArchived = memo.state === State.ARCHIVED;
  const isTrashed = !isComment && isNoteTrashed(memo.content);
  const canMutateTasks = !readonly && !isArchived && !isTrashed && Boolean(memo.property?.hasTaskList);
  const hasOpenTasks = Boolean(memo.property?.hasIncompleteTasks);
  const noteColor = getNoteColor(memo.content);
  const assignedLabels = new Set(memo.tags ?? []);
  const availableLabels = useMemo(
    () =>
      Array.from(new Set([...Object.keys(userTagsSetting?.tags ?? {}), ...(memo.tags ?? [])]))
        .filter(isAssignableLabel)
        .sort((a, b) => a.localeCompare(b)),
    [memo.tags, userTagsSetting?.tags],
  );

  const {
    handleTogglePinMemoBtnClick,
    handleEditMemoClick,
    handleSetNoteColor,
    handleToggleLabel,
    handleToggleMemoStatusClick,
    handleMoveToTrash,
    handleRestoreFromTrash,
    handleCopyLink,
    handleCopyContent,
    handleExportMarkdown,
    handleCheckAllTaskListItemsClick,
    handleUncheckAllTaskListItemsClick,
    handleDeleteMemoClick,
    confirmDeleteMemo,
  } = useMemoActionHandlers({ memo, onEdit: props.onEdit, setDeleteDialogOpen });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-4" />}>
        <MoreVerticalIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={2}>
        {!readonly && !isArchived && !isTrashed && (
          <>
            {!isComment && (
              <DropdownMenuItem onClick={handleTogglePinMemoBtnClick}>
                {memo.pinned ? <BookmarkMinusIcon className="w-4 h-auto" /> : <BookmarkPlusIcon className="w-4 h-auto" />}
                {memo.pinned ? t("common.unpin") : t("common.pin")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleEditMemoClick}>
              <Edit3Icon className="w-4 h-auto" />
              {t("common.edit")}
            </DropdownMenuItem>
            {!isComment && (
              <>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <PaletteIcon className="w-4 h-auto" />
                    Color
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {NOTE_COLOR_OPTIONS.map((option) => (
                      <DropdownMenuItem key={option.value} onClick={() => void handleSetNoteColor(option.value)}>
                        <span className={cn("size-4 rounded-full border", option.swatchClassName)} aria-hidden />
                        <span className="flex-1">{option.label}</span>
                        {noteColor === option.value && <CheckIcon className="w-4 h-auto" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <TagIcon className="w-4 h-auto" />
                    Labels
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="min-w-48">
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
                    <DropdownMenuItem onClick={() => navigate(`${ROUTES.SETTING}#tags`)}>
                      <PencilIcon className="w-4 h-auto" />
                      Edit labels
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </>
            )}
          </>
        )}

        {!isArchived && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CopyIcon className="w-4 h-auto" />
              {t("common.copy")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleCopyLink}>
                <LinkIcon className="w-4 h-auto" />
                {t("memo.copy-link")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyContent}>
                <FileTextIcon className="w-4 h-auto" />
                {t("memo.copy-content")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {!isComment && (
          <DropdownMenuItem onClick={handleExportMarkdown}>
            <DownloadIcon className="w-4 h-auto" />
            Export Markdown
          </DropdownMenuItem>
        )}

        {canMutateTasks && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ListChecksIcon className="w-4 h-auto" />
              {t("memo.task-actions.title")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem disabled={!hasOpenTasks} onClick={handleCheckAllTaskListItemsClick}>
                <CheckCheckIcon className="w-4 h-auto" />
                {t("memo.task-actions.check-all")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleUncheckAllTaskListItemsClick}>
                <ListRestartIcon className="w-4 h-auto" />
                {t("memo.task-actions.uncheck-all")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {!readonly && (
          <>
            {!isComment && isTrashed && (
              <DropdownMenuItem onClick={handleRestoreFromTrash}>
                <ArchiveRestoreIcon className="w-4 h-auto" />
                {t("common.restore")}
              </DropdownMenuItem>
            )}

            {!isComment && !isTrashed && (
              <>
                <DropdownMenuItem onClick={handleToggleMemoStatusClick}>
                  {isArchived ? <ArchiveRestoreIcon className="w-4 h-auto" /> : <ArchiveIcon className="w-4 h-auto" />}
                  {isArchived ? t("common.restore") : t("common.archive")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMoveToTrash}>
                  <TrashIcon className="w-4 h-auto" />
                  Move to trash
                </DropdownMenuItem>
              </>
            )}

            {(isComment || isTrashed) && (
              <DropdownMenuItem onClick={handleDeleteMemoClick}>
                <TrashIcon className="w-4 h-auto" />
                {isTrashed ? "Delete permanently" : t("common.delete")}
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={isTrashed ? "Delete note permanently?" : t("memo.delete-confirm")}
        confirmLabel={isTrashed ? "Delete permanently" : t("common.delete")}
        description={isTrashed ? "This permanently deletes the note and cannot be undone." : t("memo.delete-confirm-description")}
        cancelLabel={t("common.cancel")}
        onConfirm={confirmDeleteMemo}
        confirmVariant="destructive"
      />
    </DropdownMenu>
  );
};

export default MemoActionMenu;
