import {
  ArchiveIcon,
  ArrowLeftIcon,
  BellIcon,
  HardDriveIcon,
  LightbulbIcon,
  MenuIcon,
  NotebookPenIcon,
  PaperclipIcon,
  SearchIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
  TagIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useNotifications, useTagCounts } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/router/routes";
import { User_Role, UserNotification_Status } from "@/types/proto/api/v1/user_service_pb";
import MemosLogo from "../MemosLogo";
import UserMenu from "../UserMenu";
import OriginalAppSidebar, { MobileAppHeader as OriginalMobileAppHeader, MobileAppSidebar as OriginalMobileAppSidebar } from "./AppSidebar";
import TagsSection from "./TagsSection";

const NOTES_WORKSPACE_ROUTES = new Set<string>([ROUTES.HOME, ROUTES.ARCHIVED, ROUTES.TRASH]);

const NotesNavRow = ({
  to,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active?: boolean;
  onClick?: () => void;
}) => (
  <Link
    to={to}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    className={cn(
      "flex h-11 items-center gap-4 rounded-2xl px-3 text-sm font-medium transition-[background-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      active
        ? "bg-primary/12 text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border)/0.35)]"
        : "text-muted-foreground hover:translate-x-0.5 hover:bg-sidebar-accent/70 hover:text-foreground",
    )}
  >
    <Icon className="size-5 shrink-0" strokeWidth={1.8} />
    <span>{label}</span>
  </Link>
);

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
    <aside className="flex h-full w-full select-none flex-col bg-sidebar/92 text-sidebar-foreground backdrop-blur-xl">
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
        {primaryItems.map((item) => (
          <NotesNavRow
            key={item.path}
            to={item.path}
            label={item.label}
            icon={item.icon}
            active={location.pathname === item.path}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      <div className="mx-4 border-t border-border/60" />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin]">
        <TagsSection tagCount={tagCount} navigationTarget={ROUTES.HOME} scope={currentUserName} onSelect={() => setMobileOpen(false)} />
      </div>

      <div className="mx-4 border-t border-border/60" />

      <nav className="flex shrink-0 flex-col gap-1 px-2 py-3" aria-label="Notes utilities">
        <Link
          to={ROUTES.ATTACHMENTS}
          onClick={() => setMobileOpen(false)}
          className="flex h-9 items-center gap-3 rounded-xl px-3 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <PaperclipIcon className="size-4" strokeWidth={1.8} />
          <span>Attachments</span>
        </Link>
        <Link
          to={ROUTES.INBOX}
          onClick={() => setMobileOpen(false)}
          className="relative flex h-9 items-center gap-3 rounded-xl px-3 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
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

      <footer className="shrink-0 border-t border-border/60">
        <UserMenu />
      </footer>
    </aside>
  );
};

const GoreeCloudSettingsSidebarContent = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { setMobileOpen } = useAppSidebar();
  const currentSection = location.hash.slice(1) || "my-account";
  const isAdmin = currentUser?.role === User_Role.ADMIN;

  const personalItems = [
    { key: "my-account", label: "My account", icon: UserIcon },
    { key: "preference", label: "Preferences", icon: SlidersHorizontalIcon },
    { key: "tags", label: "Labels", icon: TagIcon },
  ];
  const adminItems = [
    { key: "member", label: "Members", icon: UsersIcon },
    { key: "system", label: "System", icon: Settings2Icon },
    { key: "memo", label: "Notes", icon: NotebookPenIcon },
    { key: "storage", label: "Storage", icon: HardDriveIcon },
    { key: "notification", label: "Notifications", icon: BellIcon },
  ];

  const renderSettingRows = (items: typeof personalItems) =>
    items.map((item) => (
      <NotesNavRow
        key={item.key}
        to={`${ROUTES.SETTING}#${item.key}`}
        label={item.label}
        icon={item.icon}
        active={currentSection === item.key}
        onClick={() => setMobileOpen(false)}
      />
    ));

  return (
    <aside className="flex h-full w-full select-none flex-col bg-sidebar/92 text-sidebar-foreground backdrop-blur-xl">
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          to={ROUTES.HOME}
          className="min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MemosLogo compact />
        </Link>
      </div>

      <div className="px-3 pb-4">
        <Link
          to={ROUTES.HOME}
          onClick={() => setMobileOpen(false)}
          className="flex h-9 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" strokeWidth={1.8} />
          <span>Back to Notes</span>
        </Link>
      </div>

      <div className="mx-4 border-t border-border/60" />

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 [scrollbar-width:thin]">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">Settings</div>
        <nav className="flex flex-col gap-1" aria-label="Personal settings">
          {renderSettingRows(personalItems)}
        </nav>

        {isAdmin && (
          <>
            <div className="mx-2 my-4 border-t border-border/60" />
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">Administration</div>
            <nav className="flex flex-col gap-1" aria-label="Administration settings">
              {renderSettingRows(adminItems)}
            </nav>
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-border/60">
        <UserMenu />
      </footer>
    </aside>
  );
};

const GoreeCloudWorkspaceSidebar = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return <OriginalAppSidebar />;
  }

  if (location.pathname === ROUTES.SETTING) {
    return <GoreeCloudSettingsSidebarContent />;
  }

  if (NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
    return <GoreeCloudNotesSidebarContent currentUserName={currentUser.name} />;
  }

  return <OriginalAppSidebar />;
};

export const GoreeCloudMobileAppHeader = () => {
  const location = useLocation();
  const currentUser = useCurrentUser();
  const { setMobileOpen, setQuickFindOpen } = useAppSidebar();

  if (!currentUser) {
    return <OriginalMobileAppHeader />;
  }

  if (location.pathname === ROUTES.SETTING) {
    return (
      <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-2 border-b border-border/60 bg-background/88 px-2 backdrop-blur-xl md:hidden">
        <Button variant="ghost" size="icon-sm" className="size-9" onClick={() => setMobileOpen(true)} aria-label="Open settings navigation">
          <MenuIcon className="size-5" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">GoreeCloud Notes Settings</span>
        <Button variant="ghost" size="icon-sm" className="size-9" render={<Link to={ROUTES.HOME} />} aria-label="Back to Notes">
          <ArrowLeftIcon className="size-5" />
        </Button>
      </header>
    );
  }

  if (!NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
    return <OriginalMobileAppHeader />;
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center gap-2 border-b border-border/60 bg-background/88 px-2 backdrop-blur-xl md:hidden">
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

  if (!currentUser) {
    return <OriginalMobileAppSidebar />;
  }

  if (location.pathname === ROUTES.SETTING) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(18rem,calc(100vw-2rem))] gap-0 border-border p-0 shadow-2xl [&>button]:hidden">
          <SheetTitle className="sr-only">GoreeCloud Notes settings navigation</SheetTitle>
          <GoreeCloudSettingsSidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  if (!NOTES_WORKSPACE_ROUTES.has(location.pathname)) {
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
