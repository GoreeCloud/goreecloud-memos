import { RotateCcwIcon, Trash2Icon } from "lucide-react";
import MemoView from "@/components/MemoView";
import PagedMemoList, { getMemoKey } from "@/components/PagedMemoList";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { withTrashFilter } from "@/utils/noteTrash";

const Trash = () => {
  const user = useCurrentUser();
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
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Notes remain recoverable until you explicitly choose permanent deletion.</p>
          </div>
        </div>
        <div className="gc-privacy-badge flex w-fit shrink-0 items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
          <RotateCcwIcon className="size-3.5" strokeWidth={1.8} />
          Restore available
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
    </div>
  );
};

export default Trash;
