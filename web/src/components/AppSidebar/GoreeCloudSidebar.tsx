import { ArchiveIcon, BellIcon, LightbulbIcon, MenuIcon, PaperclipIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useNotifications, useTagCounts } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import MemosLogo from "../MemosLogo";
import UserMenu from "../UserMenu";
import OriginalAppSidebar, { MobileAppHeader as OriginalMobileAppHeader, MobileAppSidebar as OriginalMobileAppSidebar } from "./AppSidebar";
import TagsSection from "./TagsSection";

const NOTES_WORKSPACE_ROUTES = new Set<string>([ROUTES.HOME, ROUTES.ARCHIVED, ROUTES.TRASH]);

const GoreeCloudNotesSidebarContent = ({ currentUserName }: { currentUserName: string }) => {
  const location = useLocation();
  const { setMobileOpen, setQuickFindOpen } = useAppSidebar();
  const { data: tagCount = {} } = useTagCounts(true);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((notification) => notification.status === UserNotification_Status.UNREAD).length;

  const primaryItems = [
    { label: "Notes", path: ROUTES.HOME, icon: LightbulbIcon },
    { label: "Archive", path: ROUTES.ARCHIVED, icon: ArchiveIcon },
    { label: "Trash", path: ROUTES.TRASH, icon: Trash2Icon },
  ];

  return (
    <aside className="flex h-full w-full select-none flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
        <Link
          to={ROUTES.HOME}
          className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MemosLogo compact />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            setMobileOpen(false);
            setQuickFindOpen(true);
          }}
          aria-label="Search notes"
        >
          <SearchIcon className="size-[18px]" strokeWidth={1.8} />
        </Button>
      </div>

      <nav className="flex shrink-0 flex-col gap-1 px-2 pb-3" aria-label="Notes navigation">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-4 rounded-r-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                active ? "bg-primary/12 text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-4 border-t border-border/70" />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin]">
        <TagsSection tagCount={tagCount} navigationTarget={ROUTES.HOME} scope={currentUserName} onSelect={() => setMobileOpen(false)} />
      </div>

      <div className="mx-4 border-t border-border/70" />

      <nav className="flex shrink-0 flex-col gap-1 px-2 py-3" aria-label="Notes utilities">
        <Link
          to={ROUTES.ATTACHMENTS}
          onClick={() => setMobileOpen(false)}
          className="flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <PaperclipIcon className="size-4" strokeWidth={1.8} />
          <span>Attachments</span>
        </Link>
        <Link
          to={ROUTES.INBOX}
          onClick={() => setMobileOpen(false)}
          className="relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <BellIcon className="size-4" strokeWidth={1.8} />
          <span>Inbox</span>
          {unreadCount > 0 && (
            <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-[10px] font-semibold leading-5 text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
      </nav>

      <footer className="shrink-0 border-t border-border/70">
        <UserMenu />
      </footer>
    </aside>
  );
};

const GoreeCloudWorkspaceSidebar = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  if (!currentUser || !NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
    return <OriginalAppSidebar />;
  }

  return <GoreeCloudNotesSidebarContent currentUserName={currentUser.name} />;
};

export const GoreeCloudMobileAppHeader = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { setMobileOpen, setQuickFindOpen } = useAppSidebar();

  if (!currentUser || !NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
    return <OriginalMobileAppHeader />;
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-2 border-b border-border/70 bg-background/92 px-2 backdrop-blur-md md:hidden">
      <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <MenuIcon className="size-5" />
      </Button>
      <Link
        to={ROUTES.HOME}
        className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <MemosLogo compact />
      </Link>
      <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => setQuickFindOpen(true)} aria-label="Search notes">
        <SearchIcon className="size-5" strokeWidth={1.8} />
      </Button>
    </header>
  );
};

export const GoreeCloudMobileAppSidebar = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { mobileOpen, setMobileOpen } = useAppSidebar();

  if (!currentUser || !NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
    return <OriginalMobileAppSidebar />;
  }

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-[min(18rem,calc(100vw-2rem))] gap-0 border-border p-0 shadow-2xl [&>button]:hidden">
        <SheetTitle className="sr-only">GoreeCloud Notes navigation</SheetTitle>
        <GoreeCloudNotesSidebarContent currentUserName={currentUser.name} />
      </SheetContent>
    </Sheet>
  );
};

export default GoreeCloudWorkspaceSidebar;
