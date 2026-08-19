import { create, type DescService, type Message } from "@bufbuild/protobuf";
import { createClient, type Client, type Interceptor } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { AuthService } from "@/types/proto/api/v1/auth_service_pb";
import { MemoSchema, MemoService } from "@/types/proto/api/v1/memo_service_pb";

let accessToken: string | null = null;

const fetchWithCredentials: typeof globalThis.fetch = (input, init) =>
  globalThis.fetch(input, {
    ...init,
    credentials: "include",
  });

const refreshTransport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true,
  fetch: fetchWithCredentials,
  interceptors: [],
});

const refreshClient = createClient(AuthService, refreshTransport);

const captureAuthInterceptor: Interceptor = (next) => async (request) => {
  if (!accessToken) {
    throw new Error("Browser capture authentication is unavailable");
  }
  request.header.set("Authorization", `Bearer ${accessToken}`);
  return next(request);
};

const memoTransport = createConnectTransport({
  baseUrl: window.location.origin,
  useBinaryFormat: true,
  fetch: fetchWithCredentials,
  interceptors: [captureAuthInterceptor],
});

const memoClient = createClient(MemoService, memoTransport);

async function refreshInMemoryAccessToken(): Promise<void> {
  const response = await refreshClient.refreshToken({});
  if (!response.accessToken) {
    throw new Error("Memos session did not provide an access token");
  }
  accessToken = response.accessToken;
}

export async function createBrowserCaptureMemo(content: string): Promise<string> {
  const normalized = content.trim();
  if (!normalized) {
    throw new Error("Memo content is required");
  }

  try {
    await refreshInMemoryAccessToken();
    const memo = await memoClient.createMemo({
      memo: create(MemoSchema, {
        content: normalized,
        // Visibility defaults to PRIVATE in the service contract.
      }),
    });
    if (!memo.name) {
      throw new Error("Memos did not acknowledge the created memo");
    }
    return memo.name;
  } finally {
    accessToken = null;
  }
}

export function clearBrowserCaptureAuthentication(): void {
  accessToken = null;
}

export const browserCaptureClientContract = Object.freeze({
  serviceOwnedRefreshCookie: true,
  accessTokenMemoryOnly: true,
  localStorage: false,
  sessionStorage: false,
  indexedDB: false,
  broadcastChannel: false,
  reusableBrowserCredential: false,
  defaultVisibility: "PRIVATE",
});
