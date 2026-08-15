import { LockIcon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MemoDisplaySettingMenu from "@/components/MemoDisplaySettingMenu";
import { Button } from "@/components/ui/button";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import { replaceFiltersByFactor, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { ROUTES } from "@/router/routes";

const SEARCH_ROUTES = new Set<string>([ROUTES.HOME, ROUTES.ARCHIVED, ROUTES.TRASH]);

const getRouteMeta = (pathname: string) => {
  if (pathname === ROUTES.HOME)
    return { eyebrow: "Quick Notes", title: "Capture space", subtitle: "Fast private notes, always within reach." };
  if (pathname === ROUTES.ARCHIVED)
    return { eyebrow: "Library", title: "Archive", subtitle: "Notes kept out of the way, not out of reach." };
  if (pathname === ROUTES.TRASH)
    return { eyebrow: "Recovery", title: "Trash", subtitle: "Recover recently removed notes before they are gone." };
  if (pathname === ROUTES.ATTACHMENTS)
    return { eyebrow: "Library", title: "Attachments", subtitle: "Files and media connected to your notes." };
  if (pathname === ROUTES.INBOX)
    return { eyebrow: "Activity", title: "Inbox", subtitle: "Updates and notifications from your private workspace." };
  if (pathname === ROUTES.SETTING)
    return { eyebrow: "Control", title: "Settings", subtitle: "Shape GoreeCloud Notes around the way you work." };
  if (pathname === ROUTES.VIEWS)
    return { eyebrow: "Organization", title: "Views", subtitle: "Saved ways to return to the notes that matter." };
  if (pathname === ROUTES.ABOUT)
    return { eyebrow: "GoreeCloud", title: "About Notes", subtitle: "Product, version, and source information." };
  if (pathname === ROUTES.EXPLORE)
    return { eyebrow: "Workspace", title: "Explore", subtitle: "Browse the notes available in this instance." };
  if (pathname.startsWith("/memos/"))
    return { eyebrow: "Focused view", title: "Note", subtitle: "Read and work with one note without distraction." };
  if (pathname.startsWith("/u/")) return { eyebrow: "Workspace", title: "Profile", subtitle: "Notes and activity for this account." };
  return { eyebrow: "GoreeCloud Notes", title: "Workspace", subtitle: "Private notes with a focused GoreeCloud experience." };
};

const GoreeCloudNotesHeader = () => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { setQuickFindOpen } = useAppSidebar();
  const { filters, getFiltersByFactor, setFilters } = useMemoFilterContext();
  const activeSearch = getFiltersByFactor("contentSearch")[0]?.value ?? "";
  const [query, setQuery] = useState(activeSearch);
  const supportsInlineSearch = SEARCH_ROUTES.has(location.pathname);
  const meta = getRouteMeta(location.pathname);

  useEffect(() => {
    setQuery(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    if (!supportsInlineSearch) return;

    const nextSearch = query.trim();
    if (nextSearch === activeSearch) return;

    const timer = window.setTimeout(() => {
      setFilters(replaceFiltersByFactor(filters, "contentSearch", nextSearch ? [{ factor: "contentSearch", value: nextSearch }] : []));
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activeSearch, filters, query, setFilters, supportsInlineSearch]);

  if (!currentUser) return null;

  return (
    <header className="gc-topbar sticky top-0 z-20 hidden h-[4.5rem] w-full shrink-0 items-center px-6 md:flex">
      <div className="mx-auto flex w-full max-w-[92rem] items-center gap-5">
        <div className="min-w-[8.5rem] flex-1 xl:min-w-[13rem]">
          <div className="gc-topbar-eyebrow truncate">{meta.eyebrow}</div>
          <div className="flex min-w-0 items-baseline gap-2">
            <h1 className="shrink-0 whitespace-nowrap text-[1.05rem] font-semibold tracking-[-0.02em] text-foreground">{meta.title}</h1>
            <span className="hidden min-w-0 truncate text-xs text-muted-foreground 2xl:inline">{meta.subtitle}</span>
          </div>
        </div>

        {supportsInlineSearch ? (
          <div className="gc-search-surface relative flex h-11 w-full max-w-2xl flex-[1.7] items-center">
            <SearchIcon className="pointer-events-none ml-4 size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setQuery("");
                  event.currentTarget.blur();
                }
              }}
              placeholder="Search notes"
              aria-label="Search notes"
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="gc-icon-button mr-2 size-8 rounded-xl text-muted-foreground hover:text-foreground"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <XIcon className="size-4" strokeWidth={1.8} />
              </Button>
            )}
          </div>
        ) : (
          <div className="gc-context-surface hidden min-w-0 max-w-2xl flex-[1.7] items-center gap-3 px-4 lg:flex">
            <span className="gc-context-icon flex size-8 shrink-0 items-center justify-center rounded-xl">
              <LockIcon className="size-4" strokeWidth={1.8} />
            </span>
            <span className="truncate text-sm text-muted-foreground">{meta.subtitle}</span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2">
          {!supportsInlineSearch && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="gc-control-surface size-10 rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setQuickFindOpen(true)}
              aria-label="Search notes"
            >
              <SearchIcon className="size-[18px]" strokeWidth={1.8} />
            </Button>
          )}
          {supportsInlineSearch && (
            <div className="gc-control-surface flex items-center p-0.5">
              <MemoDisplaySettingMenu />
            </div>
          )}
          <div className="gc-private-badge hidden items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground 2xl:flex">
            <LockIcon className="size-3.5" strokeWidth={1.8} />
            Private
          </div>
        </div>
      </div>
    </header>
  );
};

export default GoreeCloudNotesHeader;
