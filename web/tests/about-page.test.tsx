import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import About from "@/pages/About";

const mockInstance = {
  profile: {
    version: "0.25.0",
    commit: "0123456789abcdef0123456789abcdef01234567",
    instanceUrl: "",
    demo: false,
    admin: undefined as { username: string; displayName: string } | undefined,
  },
  generalSetting: {} as { customProfile?: { title: string; description: string; logoUrl: string } },
};

vi.mock("@/contexts/InstanceContext", () => ({ useInstance: () => mockInstance }));
vi.mock("@/utils/i18n", () => ({
  useTranslate: () => (key: string) =>
    ({
      "common.version": "Version",
      "about.commit": "Commit",
      "about.license": "License",
      "about.powered-by": "Powered by Memos",
    })[key] ?? key,
}));

const renderAbout = () => render(<About />);

describe("<About>", () => {
  beforeEach(() => {
    mockInstance.profile = {
      version: "0.25.0",
      commit: "0123456789abcdef0123456789abcdef01234567",
      instanceUrl: "https://memos.example.com",
      demo: false,
      admin: { username: "steven", displayName: "Steven" },
    };
    mockInstance.generalSetting = {};
  });

  afterEach(() => document.documentElement.removeAttribute("data-theme"));

  it("renders GoreeCloud Memos identity and build provenance", () => {
    renderAbout();

    expect(screen.getByRole("heading", { name: "GoreeCloud Memos" })).toBeInTheDocument();
    expect(screen.getByText(/Capture first/i)).toBeInTheDocument();
    expect(screen.getByText("0.25.0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0123456" })).toHaveAttribute(
      "href",
      "https://github.com/GoreeCloud/goreecloud-memos/commit/0123456789abcdef0123456789abcdef01234567",
    );
    expect(screen.getByRole("link", { name: "MIT" })).toHaveAttribute(
      "href",
      "https://github.com/GoreeCloud/goreecloud-memos/blob/main/LICENSE",
    );
    expect(screen.getByText("Quick-note capture")).toBeInTheDocument();
  });

  it("links the maintained fork, complementary Notes product, upstream project, and documentation", () => {
    renderAbout();

    expect(screen.getByRole("link", { name: /GoreeCloud Memos repository/ })).toHaveAttribute(
      "href",
      "https://github.com/GoreeCloud/goreecloud-memos",
    );
    expect(screen.getByRole("link", { name: /^GoreeCloud Notes/ })).toHaveAttribute("href", "https://github.com/GoreeCloud/goreecloud-notes");
    expect(screen.getByRole("link", { name: /Upstream Memos/ })).toHaveAttribute("href", "https://github.com/usememos/memos");
    expect(screen.getByRole("link", { name: /Memos documentation/ })).toHaveAttribute("href", "https://usememos.com/docs");
    expect(screen.getByRole("link", { name: /Memos API documentation/ })).toHaveAttribute("href", "https://usememos.com/docs/api");
    expect(screen.getByRole("link", { name: /Memos Web Clipper/ })).toHaveAttribute("href", "https://github.com/usememos/web-clipper");
  });

  it("does not surface the instance URL, administrator, or upstream bird artwork", () => {
    renderAbout();

    expect(screen.queryByText("https://memos.example.com")).not.toBeInTheDocument();
    expect(screen.queryByText("Administrator")).not.toBeInTheDocument();
    expect(screen.queryByText("Steven")).not.toBeInTheDocument();
    expect(screen.queryByText("Birds")).not.toBeInTheDocument();
    expect(screen.queryByTestId("about-bird-sprite")).not.toBeInTheDocument();
  });

  it("shows a plain version chip and no commit chip on dev builds", () => {
    mockInstance.profile.version = "dev";
    mockInstance.profile.commit = "unknown";
    renderAbout();
    expect(screen.getByText("dev")).toBeInTheDocument();
    expect(screen.queryByText(/unknown/)).not.toBeInTheDocument();
  });

  it("shows the demo badge on demo instances", () => {
    mockInstance.profile.demo = true;
    renderAbout();
    expect(screen.getByText("about.demo")).toBeInTheDocument();
  });

  it("uses custom branding while preserving upstream Memos attribution", () => {
    mockInstance.generalSetting = {
      customProfile: { title: "Team Memos", description: "Our shared scratchpad.", logoUrl: "/custom-logo.png" },
    };
    renderAbout();
    expect(screen.getByRole("heading", { name: "Team Memos" })).toBeInTheDocument();
    expect(screen.getByText("Our shared scratchpad.")).toBeInTheDocument();
    expect(screen.getByText(/Powered by Memos/)).toBeInTheDocument();
  });

  it("renders as a page without nested mobile padding", () => {
    const { container } = renderAbout();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const contentWrapper = container.querySelector("section > div");
    expect(contentWrapper).toHaveClass("w-full");
    expect(contentWrapper).not.toHaveClass("px-4");
  });
});
