import { LockIcon, PlusIcon } from "lucide-react";
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
    <div className="gc-route-page gc-quick-notes-page min-h-full w-full px-4 pb-12 pt-5 text-foreground sm:px-6 lg:px-8">
      <section className="gc-route-hero gc-workspace-intro mx-auto mb-6 flex w-full max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="gc-eyebrow mb-1.5">Quick Notes</div>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] sm:text-[1.75rem]">Capture what matters.</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Fast capture with labels, attachments, Archive, and recoverable Trash in your private GoreeCloud workspace.
          </p>
        </div>
        <div className="gc-privacy-badge flex w-fit shrink-0 items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
          <LockIcon className="size-3.5" strokeWidth={1.8} />
          Private by default
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl">
        <NewMemoProvider>
          <PagedMemoList
            renderer={(memo: Memo, { compact }) => (
              <MemoView
                key={getMemoKey(memo)}
                memo={memo}
                showVisibility
                showPinned
                compact={compact}
                className={memo.pinned ? "ring-1 ring-primary/20" : undefined}
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
                      className={useGrid ? "gc-editor-surface shadow-md" : "gc-editor-surface mb-2 shadow-md"}
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
                      className="gc-composer-collapsed group flex h-14 w-full items-center gap-3 px-4 text-left text-sm text-muted-foreground transition-[border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <span className="gc-composer-icon flex size-9 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors">
                        <PlusIcon className="size-4" strokeWidth={1.9} />
                      </span>
                      <span className="font-medium">Take a note…</span>
                      <span className="ml-auto hidden text-xs text-muted-foreground/70 sm:inline">Quick capture</span>
                    </button>
                  )}
                </section>
              );
            }}
          />
        </NewMemoProvider>
      </div>
    </div>
  );
};

export default Home;
