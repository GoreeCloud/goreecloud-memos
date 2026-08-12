import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  BookmarkMinusIcon,
  BookmarkPlusIcon,
  CheckCheckIcon,
  CheckIcon,
  CopyIcon,
  Edit3Icon,
  FileTextIcon,
  LinkIcon,
  ListChecksIcon,
  ListRestartIcon,
  MoreVerticalIcon,
  PaletteIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { useTranslate } from "@/utils/i18n";
import { getNoteColor, NOTE_COLOR_OPTIONS } from "@/utils/noteColor";
import { isNoteTrashed } from "@/utils/noteTrash";
import { useMemoActionHandlers } from "./hooks";
import type { MemoActionMenuProps } from "./types";

const MemoActionMenu = (props: MemoActionMenuProps) => {
  const { memo, readonly } = props;
  const t = useTranslate();

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Derived state
  const isComment = Boolean(memo.parent);
  const isArchived = memo.state === State.ARCHIVED;
  const isTrashed = !isComment && isNoteTrashed(memo.content);
  const canMutateTasks = !readonly && !isArchived && !isTrashed && Boolean(memo.property?.hasTaskList);
  const hasOpenTasks = Boolean(memo.property?.hasIncompleteTasks);
  const noteColor = getNoteColor(memo.content);

  // Action handlers
  const {
    handleTogglePinMemoBtnClick,
    handleEditMemoClick,
    handleSetNoteColor,
    handleToggleMemoStatusClick,
    handleMoveToTrash,
    handleRestoreFromTrash,
    handleCopyLink,
    handleCopyContent,
    handleCheckAllTaskListItemsClick,
    handleUncheckAllTaskListItemsClick,
    handleDeleteMemoClick,
    confirmDeleteMemo,
  } = useMemoActionHandlers({
    memo,
    onEdit: props.onEdit,
    setDeleteDialogOpen,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-4" />}>
        <MoreVerticalIcon className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={2}>
        {/* Edit actions (non-readonly, non-archived, non-trashed) */}
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
            )}
          </>
        )}

        {/* Copy submenu (non-archived) */}
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

        {/* Task submenu (writable task memos) */}
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

        {/* Write actions (non-readonly) */}
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
