import { create } from "@bufbuild/protobuf";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import MemoView from "@/components/MemoView";
import PagedMemoList, { getMemoKey } from "@/components/PagedMemoList";
import { Button } from "@/components/ui/button";
import { memoServiceClient } from "@/connect";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { memoKeys, useMemos } from "@/hooks/useMemoQueries";
import { userKeys } from "@/hooks/useUserQueries";
import { handleError } from "@/lib/error";
import { State } from "@/types/proto/api/v1/common_pb";
import { type Memo, ListMemosRequestSchema } from "@/types/proto/api/v1/memo_service_pb";
import { withTrashFilter } from "@/utils/noteTrash";

const BULK_DELETE_PAGE_SIZE = 100;

const Trash = () => {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeMemoViews: false,
    includePinned: true,
  });
  const trashFilter = withTrashFilter(memoFilter, true);
  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: false,
    state: State.NORMAL,
  });
  const { data: trashPreview, isLoading: isTrashPreviewLoading } = useMemos({
    state: State.NORMAL,
    orderBy,
    filter: trashFilter,
    pageSize: 1,
  });
  const hasTrash = Boolean(trashPreview?.memos.length);

  const handleDeleteAll = async () => {
    if (isDeletingAll) return;
    setIsDeletingAll(true);

    try {
      const memoNames: string[] = [];
      let pageToken = "";

      do {
        const response = await memoServiceClient.listMemos(
          create(ListMemosRequestSchema, {
            state: State.NORMAL,
            orderBy,
            filter: trashFilter,
            pageSize: BULK_DELETE_PAGE_SIZE,
            pageToken,
          }),
        );
        memoNames.push(...response.memos.map((memo) => memo.name));
        pageToken = response.nextPageToken;
      } while (pageToken);

      if (memoNames.length === 0) {
        setDeleteAllDialogOpen(false);
        toast("Trash is already empty");
        return;
      }

      const failedNames: string[] = [];
      for (const name of memoNames) {
        try {
          await memoServiceClient.deleteMemo({ name });
        } catch {
          failedNames.push(name);
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: memoKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: userKeys.stats() }),
      ]);
      setDeleteAllDialogOpen(false);

      const deletedCount = memoNames.length - failedNames.length;
      if (failedNames.length > 0) {
        toast.error(
          `${deletedCount} ${deletedCount === 1 ? "item was" : "items were"} permanently deleted; ${failedNames.length} could not be deleted.`,
        );
      } else {
        toast.success(`${deletedCount} ${deletedCount === 1 ? "item" : "items"} permanently deleted`);
      }
    } catch (error: unknown) {
      handleError(error, toast.error, { context: "Delete all Trash items", fallbackMessage: "Unable to empty Trash" });
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="gc-route-page min-h-full w-full px-4 pb-12 pt-5 text-foreground sm:px-6 lg:px-8">
      <section className="gc-route-hero mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 rounded-[1.25rem] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="gc-context-icon flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
            <Trash2Icon className="size-5" strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="gc-eyebrow mb-1">Recovery</div>
            <h1 className="text-xl font-semibold tracking-[-0.025em]">Trash</h1>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Notes remain recoverable until you explicitly choose permanent deletion.
            </p>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <div className="gc-privacy-badge flex w-fit shrink-0 items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
            <RotateCcwIcon className="size-3.5" strokeWidth={1.8} />
            Restore available
          </div>
          <Button
            type="button"
            variant="destructive"
            className="min-h-11 gap-2 sm:min-h-9"
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={isTrashPreviewLoading || !hasTrash || isDeletingAll}
          >
            <Trash2Icon className="size-4" strokeWidth={1.8} />
            {isDeletingAll ? "Deleting…" : "Delete all"}
          </Button>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl">
        <PagedMemoList
          renderer={(memo: Memo, { compact }) => <MemoView key={getMemoKey(memo)} memo={memo} showVisibility compact={compact} />}
          listSort={listSort}
          state={State.NORMAL}
          orderBy={orderBy}
          filter={trashFilter}
        />
      </div>

      <ConfirmDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        title="Delete all Trash items permanently?"
        description="Every item currently in Trash will be permanently deleted. This cannot be undone."
        confirmLabel={isDeletingAll ? "Deleting…" : "Delete all permanently"}
        cancelLabel="Cancel"
        onConfirm={handleDeleteAll}
        confirmVariant="destructive"
      />
    </div>
  );
};

export default Trash;
