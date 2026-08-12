import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
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
  const [composerOpen, setComposerOpen] = useState(false);

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
    <div className="min-h-full w-full bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
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
                {composerOpen ? (
                  <MemoEditor
                    autoFocus
                    className={useGrid ? "shadow-md" : "mb-2 shadow-md"}
                    cacheKey="home-memo-editor"
                    placeholder="Take a note…"
                    defaultCreateTime={defaultCreateTime}
                    onConfirm={() => setComposerOpen(false)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setComposerOpen(true)}
                    aria-expanded={false}
                    className="group flex h-14 w-full items-center gap-3 rounded-2xl border border-border/60 bg-card/88 px-4 text-left text-sm text-muted-foreground shadow-sm backdrop-blur-lg transition-[border-color,box-shadow,transform] hover:-translate-y-px hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/80 text-foreground transition-colors group-hover:bg-muted">
                      <PlusIcon className="size-4" strokeWidth={1.9} />
                    </span>
                    <span className="font-medium">Take a note…</span>
                  </button>
                )}
              </section>
            );
          }}
        />
      </NewMemoProvider>
    </div>
  );
};

export default Home;
