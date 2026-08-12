import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES,
  SIDEBAR_SECTION_ACTION_BUTTON_CLASSES,
  SIDEBAR_SECTION_ACTION_ICON_CLASSES,
} from "@/components/AppSidebar/SidebarSection";
import TagsSection from "@/components/AppSidebar/TagsSection";
import { MemoFilterProvider } from "@/contexts/MemoFilterContext";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userTagsSetting: {
      tags: {
        validation: { blurContent: false },
      },
    },
  }),
}));

vi.mock("@/utils/i18n", () => ({ useTranslate: () => (key: string) => key }));

describe("Labels sidebar section", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows configured and live labels with the shared layout controls", () => {
    render(
      <MemoryRouter>
        <MemoFilterProvider>
          <TagsSection tagCount={{ a: 2, "a/b": 1 }} scope="home" />
        </MemoFilterProvider>
      </MemoryRouter>,
    );

    const heading = screen.getByRole("heading", { name: "Labels", level: 2 });
    expect(heading.parentElement).toHaveTextContent(/^Labels$/);
    expect(screen.getByText("validation")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit labels" })).toHaveAttribute("href", "/setting#tags");

    const listButton = screen.getByRole("button", { name: "Show labels as list" });
    const treeButton = screen.getByRole("button", { name: "Show nested labels" });
    const stableActionClasses = SIDEBAR_SECTION_ACTION_BUTTON_CLASSES.split(" ").filter(
      (className) => className !== "text-muted-foreground/65",
    );
    for (const button of [listButton, treeButton]) {
      expect(button).toHaveClass(...stableActionClasses);
      expect(button.querySelector("svg")).toHaveClass(SIDEBAR_SECTION_ACTION_ICON_CLASSES);
    }
    expect(listButton).toHaveClass(...SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES.split(" "));

    fireEvent.click(treeButton);
    expect(treeButton).toHaveClass(...SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES.split(" "));
    expect(listButton).not.toHaveClass(...SIDEBAR_SECTION_ACTION_ACTIVE_CLASSES.split(" "));
  });
});
