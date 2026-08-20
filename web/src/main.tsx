import { createRoot } from "react-dom/client";
import "./index.css";
import { isCanonicalBrowserCaptureLocation } from "@/browser-capture/location";

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);

async function bootstrap() {
  if (isCanonicalBrowserCaptureLocation(window.location)) {
    const { default: BrowserCapture } = await import("@/pages/BrowserCapture");
    root.render(<BrowserCapture />);
    return;
  }

  const { default: AppRuntime } = await import("./AppRuntime");
  root.render(<AppRuntime />);
}

void bootstrap();
