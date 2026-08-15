import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/pages/Home";

vi.mock("@/components/MemoEditor", () => ({
  default: () => <div data-testid="memo-editor" />,
}));

vi.mock("@/components/MemoView", () => ({
  default: () => <div data-testid="memo-view" />,
}));

vi.mock("@/components/PagedMemoList", () => ({
  default: ({
    renderer,
    renderLeading,
  }: {
    renderer: (memo: { name: string }, options: { compact: boolean }) => React.ReactNode;
    renderLeading: (options: { useGrid: boolean }) => React.ReactNode;
  }) => (
    <>
      {renderLeading({ useGrid: false })}
      {renderer({ name: "memos/1" }, { compact: false })}
    </>
  ),
  getMemoKey: (memo: { name: string }) => memo.name,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ isUserSettingsInitialized: true }),
}));

vi.mock("@/contexts/MemoFilterContext", () => ({
  useMemoFilterContext: () => ({ filters: [] }),
}));

vi.mock("@/contexts/NewMemoContext", () => ({
  NewMemoProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks", () => ({
  useMemoFilters: () => "",
  useMemoSorting: () => ({ listSort: undefined, orderBy: "create_time desc" }),
}));

vi.mock("@/hooks/useCurrentUser", () => ({
  default: () => ({ name: "users/1" }),
}));

vi.mock("@/utils/i18n", () => ({
  useTranslate: () => (key: string) => key,
}));

describe("<Home>", () => {
  it("renders note cards immediately and expands the quick composer on demand", () => {
    render(<Home />);

    expect(screen.getByRole("button", { name: /take a note/i })).toBeInTheDocument();
    expect(screen.queryByTestId("memo-editor")).not.toBeInTheDocument();
    expect(screen.getByTestId("memo-view")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /take a note/i }));

    expect(screen.getByTestId("memo-editor")).toBeInTheDocument();
  });
});
