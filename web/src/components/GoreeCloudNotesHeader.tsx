import { SearchIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import MemoDisplaySettingMenu from "@/components/MemoDisplaySettingMenu";
import { Button } from "@/components/ui/button";
import { replaceFiltersByFactor, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { ROUTES } from "@/router/routes";

const NOTES_ROUTES = new Set<string>([ROUTES.HOME, ROUTES.ARCHIVED, ROUTES.TRASH]);

const GoreeCloudNotesHeader = () => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { filters, getFiltersByFactor, setFilters } = useMemoFilterContext();
  const activeSearch = getFiltersByFactor("contentSearch")[0]?.value ?? "";
  const [query, setQuery] = useState(activeSearch);

  useEffect(() => {
    setQuery(activeSearch);
  }, [activeSearch]);

  useEffect(() => {
    const nextSearch = query.trim();
    if (nextSearch === activeSearch) return;

    const timer = window.setTimeout(() => {
      setFilters(
        replaceFiltersByFactor(
          filters,
          "contentSearch",
          nextSearch ? [{ factor: "contentSearch", value: nextSearch }] : [],
        ),
      );
    }, 180);

    return () => window.clearTimeout(timer);
  }, [activeSearch, filters, query, setFilters]);

  if (!currentUser || !NOTES_ROUTES.has(location.pathname)) return null;

  return (
    <header className="sticky top-0 z-20 hidden h-16 w-full shrink-0 items-center border-b border-border/50 bg-background/82 px-6 backdrop-blur-xl md:flex">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3">
        <div className="relative flex h-11 w-full max-w-2xl items-center rounded-2xl border border-border/50 bg-muted/55 shadow-sm transition-[background-color,border-color,box-shadow] focus-within:border-ring/35 focus-within:bg-background focus-within:shadow-md">
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
              className="mr-2 size-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <XIcon className="size-4" strokeWidth={1.8} />
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center rounded-xl border border-border/50 bg-background/80 p-0.5 shadow-sm backdrop-blur-lg">
          <MemoDisplaySettingMenu />
        </div>
      </div>
    </header>
  );
};

export default GoreeCloudNotesHeader;
