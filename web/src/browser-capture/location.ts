export const BROWSER_CAPTURE_PATH = "/browser-capture";

export type BrowserCaptureLocation = Pick<Location, "pathname" | "search" | "hash">;

export function isCanonicalBrowserCaptureLocation(location: BrowserCaptureLocation): boolean {
  return (
    (location.pathname === BROWSER_CAPTURE_PATH || location.pathname === `${BROWSER_CAPTURE_PATH}/`) && !location.search && !location.hash
  );
}

export const browserCaptureLocationContract = Object.freeze({
  path: BROWSER_CAPTURE_PATH,
  trailingSlashAllowed: true,
  queryAllowed: false,
  fragmentAllowed: false,
});
