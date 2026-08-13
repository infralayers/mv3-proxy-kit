import { describe, it, expect, vi } from "vitest";
import { registerProxyAuth } from "../src/auth.js";
import type { BrowserAPI, WebAuthDetails, AuthCallbackResponse } from "../src/browserApi.js";

type Listener = (
  details: WebAuthDetails,
  asyncCallback?: (response: AuthCallbackResponse) => void
) => AuthCallbackResponse | Promise<AuthCallbackResponse> | void;

function createFakeApi() {
  let capturedListener: Listener | undefined;
  const api = {
    webRequest: {
      onAuthRequired: {
        addListener: (cb: Listener) => {
          capturedListener = cb;
        },
      },
    },
  } as unknown as BrowserAPI;
  return { api, getListener: () => capturedListener! };
}

describe("registerProxyAuth", () => {
  it("ignores non-proxy auth challenges", () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => ({ username: "u", password: "p" }), api);
    const asyncCallback = vi.fn();
    getListener()({ isProxy: false }, asyncCallback);
    expect(asyncCallback).toHaveBeenCalledWith({});
  });

  it("supplies credentials for proxy auth challenges", async () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => ({ username: "alice", password: "secret" }), api);
    const asyncCallback = vi.fn();
    getListener()({ isProxy: true }, asyncCallback);
    await vi.waitFor(() => expect(asyncCallback).toHaveBeenCalled());
    expect(asyncCallback).toHaveBeenCalledWith({
      authCredentials: { username: "alice", password: "secret" },
    });
  });

  it("cancels when the credentials provider returns undefined", async () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => undefined, api);
    const asyncCallback = vi.fn();
    getListener()({ isProxy: true }, asyncCallback);
    await vi.waitFor(() => expect(asyncCallback).toHaveBeenCalled());
    expect(asyncCallback).toHaveBeenCalledWith({ cancel: true });
  });
});

describe("registerProxyAuth (Firefox)", () => {
  const g = globalThis as unknown as { browser?: unknown };

  it("ignores non-proxy auth challenges synchronously", () => {
    g.browser = {};
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => ({ username: "u", password: "p" }), api);
    
    const result = getListener()({ isProxy: false });
    expect(result).toEqual({});
    
    delete g.browser;
  });

  it("supplies credentials for proxy auth challenges via Promise", async () => {
    g.browser = {};
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => ({ username: "alice", password: "secret" }), api);
    
    const resultPromise = getListener()({ isProxy: true }) as Promise<AuthCallbackResponse>;
    expect(await resultPromise).toEqual({
      authCredentials: { username: "alice", password: "secret" },
    });
    
    delete g.browser;
  });

  it("cancels when the credentials provider returns undefined", async () => {
    g.browser = {};
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => undefined, api);
    
    const resultPromise = getListener()({ isProxy: true }) as Promise<AuthCallbackResponse>;
    expect(await resultPromise).toEqual({ cancel: true });
    
    delete g.browser;
  });
});
