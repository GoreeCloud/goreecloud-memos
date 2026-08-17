import { CheckIcon, TagIcon, XIcon } from "lucide-react";
import { type FC, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import type { Location, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";
import { normalizeNoteLabel } from "@/utils/noteLabels";
import { validationService } from "../services";
import { useEditorContext, useEditorSelector } from "../state";
import type { EditorToolbarProps } from "../types";
import InsertMenu from "./InsertMenu";
import VisibilitySelector from "./VisibilitySelector";

const isAssignableLabel = (label: string) => normalizeNoteLabel(label) === label && !/[.*+?^${}()|[\]\\]/u.test(label);

export const EditorToolbar: FC<EditorToolbarProps> = ({
  onSave,
  onCancel,
  memoName,
  onAudioRecorderClick,
  isFormattingToolbarVisible,
  onToggleFormattingToolbar,
  onInsertImages,
  draftLabels = [],
  onToggleDraftLabel,
}) => {
  const t = useTranslate();
  const { userTagsSetting } = useAuth();
  const { actions, dispatch } = useEditorContext();
  // Subscribe to narrow/derived slices so typing (which only changes content)
  // doesn't re-render the toolbar or the heavy InsertMenu it hosts. `valid`
  // flips only on empty↔non-empty / loading transitions, not per keystroke.
  const valid = useEditorSelector((s) => validationService.canSave(s).valid);
  const blockedReason = useEditorSelector((s) => validationService.canSave(s).reason);
  const blockedReasonDetail = useEditorSelector((s) => validationService.canSave(s).detail);
  const isSaving = useEditorSelector((s) => s.ui.isLoading.saving);
  const isUploading = useEditorSelector((s) => s.ui.isLoading.uploading);
  const location = useEditorSelector((s) => s.metadata.location);
  const visibility = useEditorSelector((s) => s.metadata.visibility);
  const draftLabelSet = useMemo(() => new Set(draftLabels), [draftLabels]);
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
    <div className="mb-2 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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

      <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        {onCancel && (
          <Button className="min-h-11 px-4 sm:min-h-8 sm:px-3" variant="ghost" onClick={onCancel} disabled={isSaving}>
            {t("common.cancel")}
          </Button>
        )}

        {!valid && !isSaving && blockedMessage ? (
          <Tooltip>
            <TooltipTrigger render={<span className="inline-flex" tabIndex={0} aria-label={blockedMessage} />}>
              <Button className="min-h-11 px-4 sm:min-h-8 sm:px-3" onClick={onSave} disabled>
                {t("editor.save")}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{blockedMessage}</TooltipContent>
          </Tooltip>
        ) : (
          <Button className="min-h-11 px-4 sm:min-h-8 sm:px-3" onClick={onSave} disabled={isSaving}>
            {isSaving ? t("editor.saving") : t("editor.save")}
          </Button>
        )}
      </div>
    </div>
  );
};
