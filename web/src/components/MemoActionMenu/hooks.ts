import { useQueryClient } from "@tanstack/react-query";
import copy from "copy-to-clipboard";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";
import { useInstance } from "@/contexts/InstanceContext";
import { memoKeys, useDeleteMemo, useUpdateMemo } from "@/hooks/useMemoQueries";
import useNavigateTo from "@/hooks/useNavigateTo";
import { userKeys } from "@/hooks/useUserQueries";
import { handleError } from "@/lib/error";
import { ROUTES } from "@/router/routes";
import { State } from "@/types/proto/api/v1/common_pb";
import type { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { checkAllTasks, uncheckAllTasks } from "@/utils/markdown-task-actions";
import { type NoteColor, setNoteColor, stripNoteColorMetadata } from "@/utils/noteColor";
import { downloadNoteMarkdown } from "@/utils/noteExport";
import { getNoteTrashOrigin, setNoteTrashed, stripNoteTrashMetadata } from "@/utils/noteTrash";

interface UseMemoActionHandlersOptions {
  memo: Memo;
  onEdit?: () => void;
  setDeleteDialogOpen: (open: boolean) => void;
}

export const useMemoActionHandlers = ({ memo, onEdit, setDeleteDialogOpen }: UseMemoActionHandlersOptions) => {
  const t = useTranslate();
  const location = useLocation();
  const navigateTo = useNavigateTo();
  const queryClient = useQueryClient();
  const { profile } = useInstance();
  const { mutateAsync: updateMemo } = useUpdateMemo();
  const { mutateAsync: deleteMemo } = useDeleteMemo();
  const isInMemoDetailPage = location.pathname.startsWith(`/${memo.name}`);
  const trashOrigin = getNoteTrashOrigin(memo.content);

  const memoUpdatedCallback = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: userKeys.stats() });
  }, [queryClient]);

  const updateMemoContent = useCallback(
    async (nextContent: string, context: string) => {
      if (nextContent === memo.content) return;

      try {
        await updateMemo({
          update: { name: memo.name, content: nextContent },
          updateMask: ["content", "update_time"],
        });
        toast.success(t("memo.task-actions.updated"));
      } catch (error: unknown) {
        handleError(error, toast.error, { context, fallbackMessage: "An error occurred" });
      }
    },
    [memo.content, memo.name, t, updateMemo],
  );

  const handleTogglePinMemoBtnClick = useCallback(async () => {
    try {
      await updateMemo({ update: { name: memo.name, pinned: !memo.pinned }, updateMask: ["pinned"] });
    } catch {
      // do nothing
    }
  }, [memo.name, memo.pinned, updateMemo]);

  const handleEditMemoClick = useCallback(() => onEdit?.(), [onEdit]);

  const handleSetNoteColor = useCallback(
    async (color: NoteColor) => {
      const nextContent = setNoteColor(memo.content, color);
      if (nextContent === memo.content) return;
      try {
        await updateMemo({ update: { name: memo.name, content: nextContent }, updateMask: ["content", "update_time"] });
      } catch (error: unknown) {
        handleError(error, toast.error, { context: "Update note color", fallbackMessage: "Unable to update note color" });
      }
    },
    [memo.content, memo.name, updateMemo],
  );

  const handleToggleMemoStatusClick = useCallback(async () => {
    const isArchiving = memo.state !== State.ARCHIVED;
    const state = memo.state === State.ARCHIVED ? State.NORMAL : State.ARCHIVED;
    const message = memo.state === State.ARCHIVED ? t("message.restored-successfully") : t("message.archived-successfully");

    try {
      await updateMemo({ update: { name: memo.name, state }, updateMask: ["state"] });
      toast.success(message);
    } catch (error: unknown) {
      handleError(error, toast.error, { context: `${isArchiving ? "Archive" : "Restore"} memo`, fallbackMessage: "An error occurred" });
      return;
    }

    if (isInMemoDetailPage) navigateTo(memo.state === State.ARCHIVED ? ROUTES.HOME : ROUTES.ARCHIVED);
    memoUpdatedCallback();
  }, [memo.name, memo.state, t, isInMemoDetailPage, navigateTo, memoUpdatedCallback, updateMemo]);

  const handleMoveToTrash = useCallback(async () => {
    const origin = memo.state === State.ARCHIVED ? "archived" : "normal";
    try {
      await updateMemo({
        update: { name: memo.name, content: setNoteTrashed(memo.content, origin), state: State.NORMAL },
        updateMask: ["content", "state", "update_time"],
      });
      toast.success("Moved to trash");
    } catch (error: unknown) {
      handleError(error, toast.error, { context: "Move note to Trash", fallbackMessage: "Unable to move note to Trash" });
      return;
    }

    if (isInMemoDetailPage) navigateTo(ROUTES.TRASH);
    memoUpdatedCallback();
  }, [isInMemoDetailPage, memo.content, memo.name, memo.state, memoUpdatedCallback, navigateTo, updateMemo]);

  const handleRestoreFromTrash = useCallback(async () => {
    const state = trashOrigin === "archived" ? State.ARCHIVED : State.NORMAL;
    try {
      await updateMemo({
        update: { name: memo.name, content: stripNoteTrashMetadata(memo.content), state },
        updateMask: ["content", "state", "update_time"],
      });
      toast.success("Restored");
    } catch (error: unknown) {
      handleError(error, toast.error, { context: "Restore note from Trash", fallbackMessage: "Unable to restore note" });
      return;
    }

    if (isInMemoDetailPage) navigateTo(state === State.ARCHIVED ? ROUTES.ARCHIVED : ROUTES.HOME);
    memoUpdatedCallback();
  }, [isInMemoDetailPage, memo.content, memo.name, memoUpdatedCallback, navigateTo, trashOrigin, updateMemo]);

  const handleCopyLink = useCallback(() => {
    const host = profile.instanceUrl || window.location.origin;
    copy(`${host}/${memo.name}`);
    toast.success(t("message.succeed-copy-link"));
  }, [memo.name, t, profile.instanceUrl]);

  const handleCopyContent = useCallback(() => {
    copy(stripNoteColorMetadata(stripNoteTrashMetadata(memo.content)));
    toast.success(t("message.succeed-copy-content"));
  }, [memo.content, t]);

  const handleExportMarkdown = useCallback(() => {
    downloadNoteMarkdown(memo);
    toast.success("Markdown exported");
  }, [memo]);

  const handleCheckAllTaskListItemsClick = useCallback(
    async () => updateMemoContent(checkAllTasks(memo.content), "Check memo task list items"),
    [memo.content, updateMemoContent],
  );

  const handleUncheckAllTaskListItemsClick = useCallback(
    async () => updateMemoContent(uncheckAllTasks(memo.content), "Uncheck memo task list items"),
    [memo.content, updateMemoContent],
  );

  const handleDeleteMemoClick = useCallback(() => setDeleteDialogOpen(true), [setDeleteDialogOpen]);

  const confirmDeleteMemo = useCallback(async () => {
    try {
      await deleteMemo(memo.name);
    } catch (error: unknown) {
      handleError(error, toast.error, { context: "Delete memo", fallbackMessage: "An error occurred" });
      return;
    }
    toast.success(t("message.deleted-successfully"));
    if (memo.parent) queryClient.invalidateQueries({ queryKey: memoKeys.comments(memo.parent) });
    if (isInMemoDetailPage) navigateTo(trashOrigin ? ROUTES.TRASH : ROUTES.HOME);
    memoUpdatedCallback();
  }, [memo.name, memo.parent, t, isInMemoDetailPage, navigateTo, memoUpdatedCallback, deleteMemo, queryClient, trashOrigin]);

  return {
    handleTogglePinMemoBtnClick,
    handleEditMemoClick,
    handleSetNoteColor,
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
  };
};
