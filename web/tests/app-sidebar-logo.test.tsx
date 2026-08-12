import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as testingLibraryRender, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppSidebar, { MobileAppHeader } from "@/components/AppSidebar";

const authState = vi.hoisted(() => ({
  currentUser: { name: "users/test" } as { name: string } | undefined,
  memoViews: [] as Array<{ name: string; title: string }>,
}));
const sidebarState = vi.hoisted(() => ({
  memoScope: "home" as "home" | "explore" | "archived",
}));

vi.mock("@/components/MemosLogo", () => ({
  default: () => <span>Memos logo</span>,
}));

vi.mock("@/components/MemoDisplaySettingMenu", () => ({
  default: () => <button type="button">memo.view-options</button>,
}));

vi.mock("@/components/UserMenu", () => ({
  default: () => <div>User menu</div>,
}));

vi.mock("@/components/StatisticsView", () => ({
  default: () => <div>Calendar</div>,
}));

vi.mock("@/components/AppSidebar/TagsSection", () => ({
  default: () => <div>Labels</div>,
}));

vi.mock("@/contexts/AppSidebarContext", () => ({
  useAppSidebar: () => ({
    attachmentSection: "all",
    setAttachmentSection: vi.fn(),
    inboxFilter: "all",
    setInboxFilter: vi.fn(),
    memoDetail: undefined,
    setMemoDetail: vi.fn(),
    mobileOpen: false,
    setMobileOpen: vi.fn(),
    quickFindOpen: false,
    setQuickFindOpen: vi.fn(),
    memoScope: sidebarState.memoScope,
    setMemoScope: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isInitialized: true }),
}));

vi.mock("@/contexts/InstanceContext", () => ({
  useInstance: () => ({ isInitialized: true }),
}));

vi.mock("@/contexts/MemoFilterContext", () => ({
  stringifyFilters: () => "",
  useMemoFilterContext: () => ({
    filters: [],
    memoView: undefined,
    setMemoView: vi.fn(),
  }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  default: () => authState.currentUser,
}));

vi.mock("@/hooks/useFilteredMemoStats", () => ({
  useFilteredMemoStats: () => ({ statistics: { activityStats: {}, timeBasis: "create_time" }, tags: {} }),
}));

vi.mock("@/hooks/useAttachmentLibrary", () => ({
  useAttachmentLibraryStats: () => ({ stats: { media: 0, documents: 0, audio: 0, unused: 0 } }),
}));

vi.mock("@/hooks/useMediaQuery", () => ({
  default: () => true,
}));

vi.mock("@/hooks/useUserQueries", () => ({
  userKeys: {
    memoViews: (parent?: string) => ["users", "memoViews", parent],
  },
  useMemoViews: () => ({ data: authState.memoViews }),
  useNotifications: () => ({ data: [] }),
  useTagCounts: () => ({ data: {} }),
  useUser: () => ({ data: undefined }),
}));

vi.mock("@/i18n", () => ({
  default: { language: "en" },
}));

vi.mock("@/utils/i18n", () => ({
  useTranslate: () => (key: string) => key,
}));

const render = (ui: Parameters<typeof testingLibraryRender>[0]) =>
  testingLibraryRender(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>,
  );

describe("GoreeCloud Notes sidebar shell", () => {
  beforeEach(() => {
    authState.currentUser = { name: "users/test" };
    authState.memoViews = [];
    sidebarState.memoScope = "home";
  });

  it("uses a dedicated notes workspace instead of the Memos calendar sidebar", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Memos logo" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Notes navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Archive" })).toHaveAttribute("href", "/archived");
    expect(screen.getByRole("link", { name: "Trash" })).toHaveAttribute("href", "/trash");
    expect(screen.getByRole("button", { name: "Search notes" })).toBeInTheDocument();
    expect(screen.getByText("Labels")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Attachments" })).toHaveAttribute("href", "/attachments");
    expect(screen.getByRole("link", { name: "Inbox" })).toHaveAttribute("href", "/inbox");
    expect(screen.queryByText("Calendar")).not.toBeInTheDocument();
    expect(screen.queryByText("common.views")).not.toBeInTheDocument();
  });

  it.each([
    ["/archived", "Archive"],
    ["/trash", "Trash"],
  ])("marks %s as the active Notes destination", (path, label) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: label })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByText("Calendar")).not.toBeInTheDocument();
  });

  it("preserves the upstream public navigation for a guest", () => {
    authState.currentUser = undefined;
    render(
      <MemoryRouter initialEntries={["/explore"]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "common.explore" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "common.about" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "common.sign-in-to-memos" }).closest("footer")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Notes" })).not.toBeInTheDocument();
  });

  it("preserves the original sidebar on non-workspace application routes", () => {
    render(
      <MemoryRouter initialEntries={["/attachments"]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("navigation", { name: "Notes navigation" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "common.search" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "common.attachments", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "common.attachments" })).toHaveAttribute("aria-current", "page");
  });

  it("preserves the original sidebar on Settings", () => {
    render(
      <MemoryRouter initialEntries={["/setting"]}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "common.basic", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Notes navigation" })).not.toBeInTheDocument();
  });

  it("keeps mobile navigation and search immediately accessible", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MobileAppHeader />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Open navigation" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Memos logo" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Search notes" })).toBeInTheDocument();
  });
});
