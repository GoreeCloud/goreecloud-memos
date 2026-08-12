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
    <div className="w-full min-h-full bg-background text-foreground">
      <div className="mx-auto mb-5 max-w-3xl px-1">
        <h1 className="text-xl font-semibold">Trash</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notes stay here until you restore them or choose Delete permanently.</p>
      </div>
      <PagedMemoList
        renderer={(memo: Memo, { compact }) => <MemoView key={getMemoKey(memo)} memo={memo} showVisibility compact={compact} />}
        listSort={listSort}
        state={State.NORMAL}
        orderBy={orderBy}
        filter={trashFilter}
      />
    </div>
  );
};

export default Trash;
