import {
  BracesIcon,
  CheckIcon,
  ChevronsUpDownIcon,
  DownloadIcon,
  FileTextIcon,
  GlobeIcon,
  InfoIcon,
  LogOutIcon,
  PaletteIcon,
  SettingsIcon,
  SquareUserIcon,
  Trash2Icon,
  User2Icon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppSidebar } from "@/contexts/AppSidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { useSSEConnectionStatus } from "@/hooks/useLiveMemoRefresh";
import useNavigateTo from "@/hooks/useNavigateTo";
import { useUpdateUserGeneralSetting } from "@/hooks/useUserQueries";
import { cn } from "@/lib/utils";
import { Routes } from "@/router";
import { getLocaleWithFallback, loadLocale, useTranslate } from "@/utils/i18n";
import { downloadLibraryExport, type NoteExportFormat } from "@/utils/noteExport";
import { getThemeWithFallback, loadTheme, THEME_OPTIONS } from "@/utils/theme";
import { LocaleSearchList } from "./LocalePicker";
import UserAvatar from "./UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  collapsed?: boolean;
}

const UserMenu = (props: Props) => {
  const { collapsed } = props;
  const t = useTranslate();
  const navigateTo = useNavigateTo();
  const { setMobileOpen } = useAppSidebar();
  const currentUser = useCurrentUser();
  const { userGeneralSetting, refetchSettings, logout } = useAuth();
  const { mutate: updateUserGeneralSetting } = useUpdateUserGeneralSetting(currentUser?.name);
  const sseStatus = useSSEConnectionStatus();
  const currentLocale = getLocaleWithFallback(userGeneralSetting?.locale);
  const currentTheme = getThemeWithFallback(userGeneralSetting?.theme);

  const handleLocaleChange = async (locale: Locale) => {
    if (!currentUser) return;
    loadLocale(locale);
    updateUserGeneralSetting(
      { generalSetting: { locale }, updateMask: ["locale"] },
      { onSuccess: () => refetchSettings() },
    );
  };

  const handleThemeChange = async (theme: string) => {
    if (!currentUser) return;
    loadTheme(theme);
    updateUserGeneralSetting(
      { generalSetting: { theme }, updateMask: ["theme"] },
      { onSuccess: () => refetchSettings() },
    );
  };

  const handleSignOut = async () => {
    await logout();

    try {
      const keysToPreserve = ["memos-theme", "memos-locale", "memos-view-setting", "tag-view-as-tree"];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToPreserve.includes(key)) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch {
      // Ignore errors from localStorage operations.
    }

    window.location.replace(Routes.AUTH);
  };

  const navigateFromMenu = (path: string) => {
    setMobileOpen(false);
    navigateTo(path);
  };

  const handleLibraryExport = async (format: NoteExportFormat) => {
    if (!currentUser?.name) return;
    const toastId = toast.loading(`Preparing ${format === "markdown" ? "Markdown" : "JSON"} export…`);
    try {
      const count = await downloadLibraryExport(currentUser.name, format);
      toast.success(`Exported ${count} ${count === 1 ? "note" : "notes"}`, { id: toastId });
    } catch {
      toast.error("Unable to export notes", { id: toastId });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={!currentUser}
        className={cn(
          "flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-2 px-3 text-left text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 data-popup-open:bg-sidebar-accent",
          collapsed && "w-auto px-2",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="relative shrink-0">
            {currentUser?.avatarUrl ? (
              <UserAvatar className="size-6 rounded-md" avatarUrl={currentUser.avatarUrl} />
            ) : (
              <User2Icon className="mx-auto size-5 text-muted-foreground" />
            )}
            {sseStatus !== "connected" && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background",
                        sseStatus === "connecting" ? "bg-muted-foreground animate-pulse" : "bg-destructive",
                      )}
                    />
                  }
                />
                <TooltipContent side="right">{t(`live-update.${sseStatus}` as Parameters<typeof t>[0])}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-foreground">
              {currentUser?.displayName || currentUser?.username}
            </span>
          )}
        </div>
        {!collapsed && <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground/70" strokeWidth={1.8} />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => navigateFromMenu(`/u/${encodeURIComponent(currentUser?.username ?? "")}`)}>
          <SquareUserIcon className="size-4 text-muted-foreground" />
          {t("common.profile")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <GlobeIcon className="size-4 text-muted-foreground" />
            {t("common.language")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="max-h-[min(24rem,var(--available-height))] overflow-y-auto p-0">
            <LocaleSearchList value={currentLocale} onChange={handleLocaleChange} className="w-64" />
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon className="size-4 text-muted-foreground" />
            {t("setting.preference.theme")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {THEME_OPTIONS.map((option) => (
              <DropdownMenuItem key={option.value} onClick={() => handleThemeChange(option.value)}>
                {currentTheme === option.value && <CheckIcon className="w-4 h-auto" />}
                {currentTheme !== option.value && <span className="w-4" />}
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <DownloadIcon className="size-4 text-muted-foreground" />
            Export notes
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => void handleLibraryExport("markdown")}>
              <FileTextIcon className="size-4 text-muted-foreground" />
              Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void handleLibraryExport("json")}>
              <BracesIcon className="size-4 text-muted-foreground" />
              JSON
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => navigateFromMenu(Routes.TRASH)}>
          <Trash2Icon className="size-4 text-muted-foreground" />
          Trash
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateFromMenu(Routes.ABOUT)}>
          <InfoIcon className="size-4 text-muted-foreground" />
          {t("common.about")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigateFromMenu(Routes.SETTING)}>
          <SettingsIcon className="size-4 text-muted-foreground" />
          {t("common.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOutIcon className="size-4 text-muted-foreground" />
          {t("common.sign-out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
