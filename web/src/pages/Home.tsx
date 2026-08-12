import { useMemo } from "react";
import MemoEditor from "@/components/MemoEditor";
import { deriveDefaultCreateTimeFromFilters } from "@/components/MemoEditor/utils/deriveDefaultCreateTime";
import MemoView from "@/components/MemoView";
import PagedMemoList, { getMemoKey } from "@/components/PagedMemoList";
import { useAuth } from "@/contexts/AuthContext";
import { useMemoFilterContext } from "@/contexts/MemoFilterContext";
import { NewMemoProvider } from "@/contexts/NewMemoContext";
import { useMemoFilters, useMemoSorting } from "@/hooks";
import useCurrentUser from "@/hooks/useCurrentUser";
import { State } from "@/types/proto/api/v1/common_pb";
import { Memo } from "@/types/proto/api/v1/memo_service_pb";
import { withTrashFilter } from "@/utils/noteTrash";

const Home = () => {
  const user = useCurrentUser();
  const { isUserSettingsInitialized } = useAuth();
  const { filters } = useMemoFilterContext();
  const defaultCreateTime = useMemo(() => deriveDefaultCreateTimeFromFilters(filters), [filters]);

  const memoFilter = useMemoFilters({
    creatorName: user?.name,
    includeMemoViews: true,
    includePinned: true,
  });
  const visibleMemoFilter = withTrashFilter(memoFilter, false);

  const { listSort, orderBy } = useMemoSorting({
    pinnedFirst: true,
    state: State.NORMAL,
  });

  return (
    <div className="w-full min-h-full bg-background text-foreground">
      <h1 className="sr-only">Notes</h1>
      <NewMemoProvider>
        <PagedMemoList
          renderer={(memo: Memo, { compact }) => (
            <MemoView
              key={getMemoKey(memo)}
              memo={memo}
              showVisibility
              showPinned
              compact={compact}
              className={memo.pinned ? "ring-1 ring-primary/20 shadow-sm" : undefined}
            />
          )}
          listSort={listSort}
          orderBy={orderBy}
          filter={visibleMemoFilter}
          leadingFullWidth
          groupPinned
          notesSectionLabel="Notes"
          renderLeading={({ useGrid }) => {
            if (!isUserSettingsInitialized) return null;

            return (
              <section aria-label="Create note">
                <MemoEditor
                  className={useGrid ? "shadow-sm" : "mb-2 shadow-sm"}
                  cacheKey="home-memo-editor"
                  placeholder="Take a note…"
                  defaultCreateTime={defaultCreateTime}
                />
              </section>
            );
          }}
        />
      </NewMemoProvider>
    </div>
  );
};

export default Home;
