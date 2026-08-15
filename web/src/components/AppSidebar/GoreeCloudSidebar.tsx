import {
  ArchiveIcon,
  ArrowLeftIcon,
  BellIcon,
  HardDriveIcon,
  InfoIcon,
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
import type { ComponentType } from "react";
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

type NavIcon = ComponentType<{ className?: string; strokeWidth?: number }>;

const NotesNavRow = ({
  to,
  label,
  icon: Icon,
  active,
  onClick,
  compact = false,
}: {
  to: string;
  label: string;
  icon: NavIcon;
  active?: boolean;
  onClick?: () => void;
  compact?: boolean;
}) => (
  <Link
    to={to}
    onClick={onClick}
    aria-current={active ? "page" : undefined}
    data-active={active ? "true" : "false"}
    className={cn(
      "gc-nav-row flex items-center gap-3 font-medium text-muted-foreground transition-[background-color,color,transform,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      compact ? "h-10 rounded-xl px-3 text-[13px]" : "h-11 rounded-2xl px-3 text-sm",
      active ? "text-foreground" : "hover:text-foreground",
    )}
  >
    <span className={cn("gc-nav-icon flex shrink-0 items-center justify-center", compact ? "size-7 rounded-lg" : "size-8 rounded-xl")}>
      <Icon className={compact ? "size-4" : "size-[18px]"} strokeWidth={1.8} />
    </span>
    <span className="min-w-0 flex-1 truncate">{label}</span>
  </Link>
);

const GoreeCloudNotesSidebarContent = ({ currentUserName }: { currentUserName: string }) => {
  const location = useLocation();
  const { setMobileOpen, setQuickFindOpen } = useAppSidebar();
  const { data: tagCount = {} } = useTagCounts(true);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((notification) => notification.status === UserNotification_Status.UNREAD).length;
  const notesActive =
    location.pathname === ROUTES.HOME || location.pathname.startsWith("/memos/") || location.pathname.startsWith("/u/");

  const closeMobile = () => setMobileOpen(false);

  return (
    <aside className="gc-sidebar flex h-full w-full select-none flex-col text-sidebar-foreground">
      <div className="gc-sidebar-brand flex h-[4.5rem] shrink-0 items-center justify-between gap-2 px-4">
        <Link
          to={ROUTES.HOME}
          className="gc-brand-link min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MemosLogo compact />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          className="gc-icon-button size-9 shrink-0 rounded-xl text-muted-foreground hover:text-foreground"
          onClick={() => {
            closeMobile();
            setQuickFindOpen(true);
          }}
          aria-label="Search notes"
        >
          <SearchIcon className="size-[18px]" strokeWidth={1.8} />
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="gc-nav-kicker px-2 pb-2">Workspace</div>
        <nav className="flex shrink-0 flex-col gap-1" aria-label="Notes navigation">
          <NotesNavRow to={ROUTES.HOME} label="Notes" icon={LightbulbIcon} active={notesActive} onClick={closeMobile} />
          <NotesNavRow
            to={ROUTES.ARCHIVED}
            label="Archive"
            icon={ArchiveIcon}
            active={location.pathname === ROUTES.ARCHIVED}
            onClick={closeMobile}
          />
          <NotesNavRow
            to={ROUTES.TRASH}
            label="Trash"
            icon={Trash2Icon}
            active={location.pathname === ROUTES.TRASH}
            onClick={closeMobile}
          />
        </nav>
      </div>

      <div className="gc-sidebar-divider mx-4" />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 [scrollbar-width:thin]">
        <div className="gc-nav-kicker px-2 pb-2">Labels</div>
        <TagsSection tagCount={tagCount} navigationTarget={ROUTES.HOME} scope={currentUserName} onSelect={closeMobile} />
      </div>

      <div className="gc-sidebar-divider mx-4" />

      <div className="px-3 py-3">
        <div className="gc-nav-kicker px-2 pb-2">Library</div>
        <nav className="flex shrink-0 flex-col gap-1" aria-label="Notes library">
          <NotesNavRow
            to={ROUTES.ATTACHMENTS}
            label="Attachments"
            icon={PaperclipIcon}
            active={location.pathname === ROUTES.ATTACHMENTS}
            onClick={closeMobile}
            compact
          />
          <NotesNavRow
            to={ROUTES.INBOX}
            label="Inbox"
            icon={BellIcon}
            active={location.pathname === ROUTES.INBOX}
            onClick={closeMobile}
            compact
          />
          {unreadCount > 0 && (
            <span className="sr-only" aria-live="polite">
              {unreadCount} unread notifications
            </span>
          )}
          <NotesNavRow
            to={ROUTES.SETTING}
            label="Settings"
            icon={Settings2Icon}
            active={location.pathname === ROUTES.SETTING}
            onClick={closeMobile}
            compact
          />
          <NotesNavRow
            to={ROUTES.ABOUT}
            label="About"
            icon={InfoIcon}
            active={location.pathname === ROUTES.ABOUT}
            onClick={closeMobile}
            compact
          />
        </nav>
      </div>

      <footer className="gc-sidebar-footer shrink-0">
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
    <aside className="gc-sidebar flex h-full w-full select-none flex-col text-sidebar-foreground">
      <div className="gc-sidebar-brand flex h-[4.5rem] shrink-0 items-center px-4">
        <Link
          to={ROUTES.HOME}
          className="gc-brand-link min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <MemosLogo compact />
        </Link>
      </div>

      <div className="px-3 pb-4">
        <Link
          to={ROUTES.HOME}
          onClick={() => setMobileOpen(false)}
          className="gc-back-link flex h-10 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" strokeWidth={1.8} />
          <span>Back to Notes</span>
        </Link>
      </div>

      <div className="gc-sidebar-divider mx-4" />

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        <div className="gc-nav-kicker px-2 pb-2">Settings</div>
        <nav className="flex flex-col gap-1" aria-label="Personal settings">
          {renderSettingRows(personalItems)}
        </nav>

        {isAdmin && (
          <>
            <div className="gc-sidebar-divider mx-2 my-4" />
            <div className="gc-nav-kicker px-2 pb-2">Administration</div>
            <nav className="flex flex-col gap-1" aria-label="Administration settings">
              {renderSettingRows(adminItems)}
            </nav>
          </>
        )}
      </div>

      <footer className="gc-sidebar-footer shrink-0">
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

  return <GoreeCloudNotesSidebarContent currentUserName={currentUser.name} />;
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
      <header className="gc-mobile-topbar sticky top-0 z-20 flex h-14 w-full items-center gap-2 px-2 md:hidden">
        <Button variant="ghost" size="icon-sm" className="gc-icon-button size-10 rounded-xl" onClick={() => setMobileOpen(true)} aria-label="Open settings navigation">
          <MenuIcon className="size-5" />
        </Button>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-[-0.01em]">GoreeCloud Notes Settings</span>
        <Button variant="ghost" size="icon-sm" className="gc-icon-button size-10 rounded-xl" render={<Link to={ROUTES.HOME} />} aria-label="Back to Notes">
          <ArrowLeftIcon className="size-5" />
        </Button>
      </header>
    );
  }

  return (
    <header className="gc-mobile-topbar sticky top-0 z-20 flex h-14 w-full items-center gap-2 px-2 md:hidden">
      <Button variant="ghost" size="icon-sm" className="gc-icon-button size-10 rounded-xl" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <MenuIcon className="size-5" />
      </Button>
      <Link
        to={ROUTES.HOME}
        className="gc-brand-link min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <MemosLogo compact />
      </Link>
      <Button
        variant="ghost"
        size="icon-sm"
        className="gc-icon-button size-10 rounded-xl"
        onClick={() => setQuickFindOpen(true)}
        aria-label="Search notes"
      >
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

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="w-[min(19rem,calc(100vw-1.5rem))] gap-0 border-border p-0 shadow-2xl [&>button]:hidden">
        <SheetTitle className="sr-only">
          {location.pathname === ROUTES.SETTING ? "GoreeCloud Notes settings navigation" : "GoreeCloud Notes navigation"}
        </SheetTitle>
        {location.pathname === ROUTES.SETTING ? (
          <GoreeCloudSettingsSidebarContent />
        ) : (
          <GoreeCloudNotesSidebarContent currentUserName={currentUser.name} />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default GoreeCloudWorkspaceSidebar;
