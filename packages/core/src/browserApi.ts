export interface StorageArea {
  get: (keys: string | string[] | null) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

export interface WebAuthDetails {
  isProxy: boolean;
  challenger?: { host: string; port: number };
}

export interface AuthCallbackResponse {
  cancel?: boolean;
  authCredentials?: { username: string; password: string };
}

export interface BrowserAPI {
  webRequest: {
    onAuthRequired: {
      addListener: (
        callback: (
          details: WebAuthDetails,
          asyncCallback?: (response: AuthCallbackResponse) => void
        ) => AuthCallbackResponse | Promise<AuthCallbackResponse> | void,
        filter: { urls: string[] },
        extraInfoSpec: string[]
      ) => void;
    };
  };
  storage: {
    session?: StorageArea;
    local: StorageArea;
  };
  proxy: {
    settings: {
      set: (details: { value: unknown; scope: string }) => Promise<void> | void;
    };
  };
  runtime: {
    sendMessage: (message: unknown) => Promise<unknown>;
    onMessage: {
      addListener: (
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ) => void;
    };
  };
}

export function getBrowserAPI(): BrowserAPI {
  const g = globalThis as unknown as { chrome?: BrowserAPI; browser?: BrowserAPI };
  if (isFirefox() && g.browser) {
    return g.browser;
  }
  if (g.chrome) {
    return g.chrome;
  }
  if (g.browser) {
    return g.browser;
  }
  throw new Error(
    "mv3-proxy-kit: no chrome or browser global found. This code must run inside a browser extension context."
  );
}

export function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');
}
