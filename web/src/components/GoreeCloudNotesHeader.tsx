import { SearchIcon } from "lucide-react";
import { useLocation } from "react-router-dom";
import MemoDisplaySettingMenu from "@/components/MemoDisplaySettingMenu";
import { Button } from "@/components/ui/button";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { ROUTES } from "@/router/routes";

const NOTES_ROUTES = new Set<string>([ROUTES.HOME, ROUTES.ARCHIVED, ROUTES.TRASH]);

const GoreeCloudNotesHeader = () => {
  const currentUser = useCurrentUser();
  const location = useLocation();
  const { setQuickFindOpen } = useAppSidebar();

  if (!currentUser || !NOTES_ROUTES.has(location.pathname)) return null;

  return (
    <header className="sticky top-0 z-20 hidden h-16 w-full shrink-0 items-center border-b border-border/60 bg-background/92 px-6 backdrop-blur-md md:flex">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3">
        <Button
          variant="secondary"
          className="h-11 w-full max-w-2xl justify-start gap-3 rounded-xl border border-transparent bg-muted/75 px-4 text-sm font-normal text-muted-foreground shadow-none hover:bg-muted focus-visible:border-border"
          onClick={() => setQuickFindOpen(true)}
          aria-label="Search notes"
        >
          <SearchIcon className="size-5 shrink-0" strokeWidth={1.8} />
          <span>Search notes</span>
        </Button>
        <div className="flex shrink-0 items-center rounded-lg border border-border/60 bg-background p-0.5 shadow-sm">
          <MemoDisplaySettingMenu />
        </div>
      </div>
    </header>
  );
};

export default GoreeCloudNotesHeader;
