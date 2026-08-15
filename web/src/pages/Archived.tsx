import { ArchiveIcon } from "lucide-react";
import MemoView from "@/components/MemoView";
import PagedMemoList, { getMemoKey } from "@/components/PagedMemoList";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { withTrashFilter } from "@/utils/noteTrash";

const Archived = () => {
  const user = useCurrentUser();

  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeMemoViews: true,
    includePinned: false,
  });
  const visibleMemoFilter = withTrashFilter(memoFilter, false);

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: true,
    state: State.ARCHIVED,
  });

  return (
    <div className="gc-route-page min-h-full w-full px-4 pb-12 pt-5 text-foreground sm:px-6 lg:px-8">
      <section className="gc-route-hero mx-auto mb-6 flex w-full max-w-6xl items-start gap-4 rounded-[1.25rem] px-5 py-5 sm:px-6">
        <span className="gc-context-icon flex size-10 shrink-0 items-center justify-center rounded-xl text-primary">
          <ArchiveIcon className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="gc-eyebrow mb-1">Library</div>
          <h1 className="text-xl font-semibold tracking-[-0.025em]">Archive</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Keep finished or lower-priority notes out of the way without losing them.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl">
        <PagedMemoList
          renderer={(memo: Memo, { compact }) => <MemoView key={getMemoKey(memo)} memo={memo} showVisibility compact={compact} />}
          listSort={listSort}
          state={State.ARCHIVED}
          orderBy={orderBy}
          filter={visibleMemoFilter}
        />
      </div>
    </div>
  );
};

export default Archived;
