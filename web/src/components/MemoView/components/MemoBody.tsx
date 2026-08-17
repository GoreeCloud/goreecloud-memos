import { EyeIcon } from "lucide-react";
import { useMemo } from "react";
import ClampedSection from "@/components/ClampedSection";
import { Tag } from "@/components/MemoContent/Tag";
import { AttachmentListView, LocationDisplayView, RelationListView } from "@/components/MemoMetadata";
import { isReferenceRelation } from "@/components/MemoMetadata/Relation/relationHelpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { State } from "@/types/proto/api/v1/common_pb";
import { useTranslate } from "@/utils/i18n";
import { filterInlineManagedAttachments } from "@/utils/managed-attachment";
import { stripNoteColorMetadata } from "@/utils/noteColor";
import { splitTrailingNoteLabels } from "@/utils/noteLabels";
import { isNoteTrashed, stripNoteTrashMetadata } from "@/utils/noteTrash";
import MemoContent from "../../MemoContent";
import { MemoReactionListView } from "../../MemoReactionListView";
import { useMemoHandlers } from "../hooks";
import { useMemoViewContext } from "../MemoViewContext";
import type { MemoBodyProps } from "../types";

const BlurOverlay: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const t = useTranslate();
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center pt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="cursor-pointer rounded-lg bg-card px-3 text-xs text-foreground shadow-sm hover:-translate-y-0.5 hover:border-ring/40 hover:bg-accent hover:text-accent-foreground hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        onClick={onClick}
      >
        <EyeIcon className="h-3.5 w-3.5" />
        {t("memo.click-to-show-sensitive-content")}
      </Button>
    </div>
  );
};

const MemoBody: React.FC<MemoBodyProps> = ({ compact }) => {
  const { memo, parentPage, showBlurredContent, blurred, readonly, openEditor, openPreview, toggleBlurVisibility } = useMemoViewContext();
  const archived = memo.state === State.ARCHIVED;
  const trashed = !memo.parent && isNoteTrashed(memo.content);
  const editingDisabled = readonly || archived || trashed;
  const displayContent = memo.parent ? memo.content : stripNoteTrashMetadata(stripNoteColorMetadata(memo.content));
  const { body: displayBody, labels: footerLabels } = splitTrailingNoteLabels(displayContent);

  // Archive and Trash are state-management surfaces. A top-level note must be
  // restored before the generic click edit path can modify it, matching the
  // explicit action menus which intentionally hide Edit in those views.
  const { handleMemoContentClick, handleMemoContentDoubleClick } = useMemoHandlers({
    readonly: editingDisabled,
    openEditor,
    openPreview,
  });

  const referencedMemos = memo.relations.filter(isReferenceRelation);
  // Memoized so AttachmentListView's own useMemo chain keeps its cache across body renders.
  const attachmentOnlyItems = useMemo(
    () => filterInlineManagedAttachments(memo.content, memo.attachments),
    [memo.content, memo.attachments],
  );

  return (
    <>
      <div
        className={cn(
          "w-full flex flex-col justify-start items-start gap-2",
          blurred && !showBlurredContent && "blur-lg transition-all duration-200",
        )}
      >
        {/* Compact bounds the note body and attachments behind one Show more.
            The canonical trailing label line is promoted below the clamp so
            labels stay visible on long collapsed cards. Reactions also remain
            outside so neither metadata surface disappears under the fade. */}
        <ClampedSection enabled={Boolean(compact)}>
          <MemoContent
            memoName={memo.name}
            content={displayBody}
            attachments={memo.attachments}
            onClick={handleMemoContentClick}
            onDoubleClick={handleMemoContentDoubleClick}
            compact={Boolean(compact)}
          />
          <AttachmentListView attachments={attachmentOnlyItems} onImagePreview={openPreview} />
          <RelationListView relations={referencedMemos} currentMemoName={memo.name} parentPage={parentPage} />
          {memo.location && <LocationDisplayView location={memo.location} />}
        </ClampedSection>

        {footerLabels.length > 0 && (
          <div className="flex w-full flex-wrap items-center gap-1.5 pt-1" data-memo-label-footer>
            {footerLabels.map((label) => (
              <Tag key={label} data-tag={label} />
            ))}
          </div>
        )}

        <MemoReactionListView memo={memo} reactions={memo.reactions} />
      </div>

      {blurred && !showBlurredContent && <BlurOverlay onClick={toggleBlurVisibility} />}
    </>
  );
};

export default MemoBody;
