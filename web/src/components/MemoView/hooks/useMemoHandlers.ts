import { useCallback } from "react";
import { useInstance } from "@/contexts/InstanceContext";
import type { PreviewMediaItem } from "@/utils/media-item";
import { memoEditTriggerFromSetting, shouldOpenMemoEditor } from "../editTrigger";

interface UseMemoHandlersOptions {
  readonly: boolean;
  openEditor: () => void;
  openPreview: (items: string | string[] | PreviewMediaItem[], index?: number) => void;
}

const hasActiveTextSelection = (): boolean => Boolean(window.getSelection()?.toString().trim());

export const useMemoHandlers = (options: UseMemoHandlersOptions) => {
  const { readonly, openEditor, openPreview } = options;
  const { memoRelatedSetting } = useInstance();
  const editTrigger = memoEditTriggerFromSetting(memoRelatedSetting.enableDoubleClickEdit);

  const handleMemoContentClick = useCallback(
    (e: React.MouseEvent) => {
      const targetEl = e.target as HTMLElement;
      if (targetEl.tagName === "IMG") {
        const linkElement = targetEl.closest("a");
        if (linkElement) return; // If image is inside a link, don't show preview.
        const imgUrl = targetEl.getAttribute("src");
        if (imgUrl) openPreview(imgUrl);
        return;
      }

      if (
        shouldOpenMemoEditor({
          readonly,
          trigger: editTrigger,
          interaction: "single",
          target: e.target,
        }) &&
        !hasActiveTextSelection()
      ) {
        e.preventDefault();
        openEditor();
      }
    },
    [readonly, editTrigger, openEditor, openPreview],
  );

  const handleMemoContentDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        shouldOpenMemoEditor({
          readonly,
          trigger: editTrigger,
          interaction: "double",
          target: e.target,
        })
      ) {
        e.preventDefault();
        openEditor();
      }
    },
    [readonly, editTrigger, openEditor],
  );

  return { handleMemoContentClick, handleMemoContentDoubleClick };
};
