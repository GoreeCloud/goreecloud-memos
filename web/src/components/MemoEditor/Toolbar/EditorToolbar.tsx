import { CheckIcon, TagIcon, XIcon } from "lucide-react";
import { type FC, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import type { Location, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { normalizeNoteLabel } from "@/utils/noteLabels";
import { validationService } from "../services";
import { useEditorContext, useEditorSelector, useEditorStore } from "../state";
import type { EditorToolbarProps } from "../types";
import InsertMenu from "./InsertMenu";
import VisibilitySelector from "./VisibilitySelector";

const isAssignableLabel = (label: string) => normalizeNoteLabel(label) === label && !/[.*+?^${}()|[\]\\]/u.test(label);
const QUICK_CAPTURE_IDLE_SAVE_MS = 3000;
const SAVE_KEY_SHORTCUTS = "Control+Enter Meta+Enter";
const SAVE_SHORTCUT_HINT = "Ctrl/Cmd + Enter";

const isPortalInteraction = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      '[role="menu"], [role="dialog"], [role="listbox"], [data-radix-popper-content-wrapper], [data-slot="dropdown-menu-content"], [data-slot="popover-content"]',
    ),
  );
};

export const EditorToolbar: FC<EditorToolbarProps> = ({
  onSave,
  onCancel,
  memoName,
  quickCaptureAutoSave = false,
  onAudioRecorderClick,
  isFormattingToolbarVisible,
  onToggleFormattingToolbar,
  onInsertImages,
  draftLabels = [],
  onToggleDraftLabel,
}) => {
  const t = useTranslate();
  const { userTagsSetting } = useAuth();
  const editorStore = useEditorStore();
  const { actions, dispatch } = useEditorContext();
  const valid = useEditorSelector((s) => validationService.canSave(s).valid);
  const blockedReason = useEditorSelector((s) => validationService.canSave(s).reason);
  const blockedReasonDetail = useEditorSelector((s) => validationService.canSave(s).detail);
  const isSaving = useEditorSelector((s) => s.ui.isLoading.saving);
  const isUploading = useEditorSelector((s) => s.ui.isLoading.uploading);
  const location = useEditorSelector((s) => s.metadata.location);
  const visibility = useEditorSelector((s) => s.metadata.visibility);
  const draftLabelSet = useMemo(() => new Set(draftLabels), [draftLabels]);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const idleSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const availableLabels = useMemo(
    () =>
      Object.keys(userTagsSetting?.tags ?? {})
        .filter(isAssignableLabel)
        .sort((a, b) => a.localeCompare(b)),
    [userTagsSetting?.tags],
  );
  const blockedMessage = valid
    ? undefined
    : blockedReason
      ? t(blockedReason, blockedReasonDetail ? { url: blockedReasonDetail } : undefined)
      : t("editor.validation.cannot-save");

  useEffect(() => {
    if (memoName || !quickCaptureAutoSave) return;

    const clearIdleTimer = () => {
      if (idleSaveTimerRef.current !== null) {
        clearTimeout(idleSaveTimerRef.current);
        idleSaveTimerRef.current = null;
      }
    };

    const hasDraftData = () => {
      const state = editorStore.getState();
      return Boolean(
        state.content.trim() ||
          state.metadata.attachments.length > 0 ||
          state.localFiles.length > 0 ||
          state.metadata.relations.length > 0 ||
          state.metadata.location,
      );
    };

    const saveDraft = () => {
      const state = editorStore.getState();
      if (state.ui.isLoading.saving || !hasDraftData() || !validationService.canSave(state).valid) return;
      onSave();
    };

    const scheduleIdleSave = () => {
      clearIdleTimer();
      if (!hasDraftData()) return;
      idleSaveTimerRef.current = setTimeout(() => {
        idleSaveTimerRef.current = null;
        saveDraft();
      }, QUICK_CAPTURE_IDLE_SAVE_MS);
    };

    const unsubscribe = editorStore.subscribe(scheduleIdleSave);
    scheduleIdleSave();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const editorContainer = toolbarRef.current?.closest(".gc-editor-container");
      if (!editorContainer || editorContainer.contains(target) || isPortalInteraction(target)) return;
      clearIdleTimer();
      saveDraft();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      clearIdleTimer();
      unsubscribe();
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [editorStore, memoName, onSave, quickCaptureAutoSave]);

  const handleLocationChange = (next?: Location) => {
    dispatch(actions.setMetadata({ location: next }));
  };

  const handleToggleFocusMode = () => {
    dispatch(actions.toggleFocusMode());
  };

  const handleVisibilityChange = (next: Visibility) => {
    dispatch(actions.setMetadata({ visibility: next }));
  };

  return (
    <div
      ref={toolbarRef}
      className="gc-editor-toolbar mb-2 flex w-full flex-col gap-2 max-[599px]:sticky max-[599px]:bottom-[max(0.25rem,env(safe-area-inset-bottom))] max-[599px]:z-20 max-[599px]:mb-1 max-[599px]:gap-1.5 max-[599px]:rounded-xl max-[599px]:border max-[599px]:border-border/70 max-[599px]:bg-card/95 max-[599px]:p-1.5 max-[599px]:shadow-md max-[599px]:backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex w-full min-w-0 flex-wrap items-center gap-1 sm:w-auto">
        <InsertMenu
          isUploading={isUploading}
          isSaving={isSaving}
          location={location}
          onLocationChange={handleLocationChange}
          onToggleFocusMode={handleToggleFocusMode}
          memoName={memoName}
          onAudioRecorderClick={onAudioRecorderClick}
          isFormattingToolbarVisible={isFormattingToolbarVisible}
          onToggleFormattingToolbar={onToggleFormattingToolbar}
          onInsertImages={onInsertImages}
        />
        <VisibilitySelector value={visibility} onChange={handleVisibilityChange} />

        {onToggleDraftLabel && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-11 gap-1.5 px-2.5 sm:min-h-8"
                  aria-label={draftLabels.length > 0 ? `Labels, ${draftLabels.length} selected` : "Add labels"}
                />
              }
            >
              <TagIcon className="size-4" />
              <span>Labels</span>
              {draftLabels.length > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                  {draftLabels.length}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-52">
              {availableLabels.length === 0 ? (
                <DropdownMenuItem disabled>No labels yet</DropdownMenuItem>
              ) : (
                availableLabels.map((label) => {
                  const selected = draftLabelSet.has(label);
                  return (
                    <DropdownMenuItem key={label} onClick={() => onToggleDraftLabel(label)}>
                      <span className="flex size-4 items-center justify-center rounded border border-border bg-background">
                        {selected && <CheckIcon className="size-3" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onToggleDraftLabel &&
          draftLabels.map((label) => (
            <Button
              key={label}
              type="button"
              variant="secondary"
              size="sm"
              className="min-h-9 max-w-44 gap-1 rounded-full px-2.5 text-xs sm:min-h-7"
              onClick={() => onToggleDraftLabel(label)}
              aria-label={`Remove ${label} label`}
            >
              <span className="truncate">{label}</span>
              <XIcon className="size-3" />
            </Button>
          ))}
      </div>

      <div className="gc-editor-toolbar-actions flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        {onCancel && (
          <Button
            className="min-h-11 px-4 max-[599px]:!border max-[599px]:!border-border/80 max-[599px]:!bg-background/55 sm:min-h-8 sm:px-3"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            {t("common.cancel")}
          </Button>
        )}

        {!valid && !isSaving && blockedMessage ? (
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" tabIndex={0} aria-label={blockedMessage} />}>
              <Button
                className="min-h-11 px-4 sm:min-h-8 sm:px-3"
                onClick={onSave}
                disabled
                aria-keyshortcuts={SAVE_KEY_SHORTCUTS}
              >
                {t("editor.save")}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{blockedMessage}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            {!isSaving && (
              <span aria-hidden="true" className="hidden whitespace-nowrap text-xs text-muted-foreground md:inline">
                {SAVE_SHORTCUT_HINT}
              </span>
            )}
            <Button
              className="min-h-11 px-4 sm:min-h-8 sm:px-3"
              onClick={onSave}
              disabled={isSaving}
              aria-keyshortcuts={SAVE_KEY_SHORTCUTS}
            >
              {isSaving ? t("editor.saving") : t("editor.save")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
