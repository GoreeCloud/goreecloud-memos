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
    <div className="min-h-full w-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <h1 className="sr-only">Archive</h1>
      <PagedMemoList
        renderer={(memo: Memo, { compact }) => <MemoView key={getMemoKey(memo)} memo={memo} showVisibility compact={compact} />}
        listSort={listSort}
        state={State.ARCHIVED}
        orderBy={orderBy}
        filter={visibleMemoFilter}
      />
    </div>
  );
};

export default Archived;
