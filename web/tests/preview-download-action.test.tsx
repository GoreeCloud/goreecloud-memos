import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PreviewImageDialog from "@/components/PreviewImageDialog";

vi.mock("@/hooks/useMediaQuery", () => ({
  __esModule: true,
  default: () => false,
}));

vi.mock("@/utils/i18n", () => ({
  findNearestMatchedLanguage: (language: string) => language || "en",
  useTranslate: () => (key: string) => key,
}));

describe("<PreviewImageDialog> download action", () => {
  it("downloads the currently selected attachment with its filename", () => {
    render(
      <PreviewImageDialog
        open
        onOpenChange={vi.fn()}
        items={[
          { id: "image-1", kind: "image", sourceUrl: "/file/attachments/image-1/image-1.jpg", filename: "image-1.jpg" },
          { id: "image-2", kind: "image", sourceUrl: "/file/attachments/image-2/image-2.jpg", filename: "image-2.jpg" },
        ]}
      />,
    );

    const firstDownload = screen.getByRole("link", { name: "Download image-1.jpg" });
    expect(firstDownload).toHaveAttribute("href", "/file/attachments/image-1/image-1.jpg");
    expect(firstDownload).toHaveAttribute("download", "image-1.jpg");

    fireEvent.click(screen.getByRole("button", { name: "Next item" }));

    const secondDownload = screen.getByRole("link", { name: "Download image-2.jpg" });
    expect(secondDownload).toHaveAttribute("href", "/file/attachments/image-2/image-2.jpg");
    expect(secondDownload).toHaveAttribute("download", "image-2.jpg");
  });
});
