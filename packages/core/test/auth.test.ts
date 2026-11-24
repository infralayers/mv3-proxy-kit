import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerProxyAuth } from "../src/auth.js";
import type { BrowserAPI, WebAuthDetails, AuthCallbackResponse } from "../src/browserApi.js";

type Listener = (
  details: WebAuthDetails,
  asyncCallback?: (response: AuthCallbackResponse) => void
) => AuthCallbackResponse | Promise<AuthCallbackResponse> | void;

function createFakeApi() {
  let capturedListener: Listener | undefined;
  let capturedExtraInfoSpec: string[] | undefined;
  const api = {
    webRequest: {
      onAuthRequired: {
        addListener: (cb: Listener, _filter: { urls: string[] }, extraInfoSpec: string[]) => {
          capturedListener = cb;
          capturedExtraInfoSpec = extraInfoSpec;
        },
      },
    },
  } as unknown as BrowserAPI;
  return {
    api,
    getListener: () => capturedListener!,
    getExtraInfoSpec: () => capturedExtraInfoSpec!,
  };
}

describe("registerProxyAuth", () => {
  it("ignores non-proxy auth challenges without returning a blocking response", () => {
    const { api, getListener, getExtraInfoSpec } = createFakeApi();
    registerProxyAuth(async () => ({ username: "u", password: "p" }), api);
    expect(getExtraInfoSpec()).toEqual(["asyncBlocking"]);

    const asyncCallback = vi.fn();
    const result = getListener()({ isProxy: false }, asyncCallback);
    expect(asyncCallback).toHaveBeenCalledWith({});
    expect(result).toBeUndefined();
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
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers blocking listener and ignores non-proxy auth challenges synchronously", () => {
    const { api, getListener, getExtraInfoSpec } = createFakeApi();
    registerProxyAuth(async () => ({ username: "u", password: "p" }), api);
    expect(getExtraInfoSpec()).toEqual(["blocking"]);

    const result = getListener()({ isProxy: false });
    expect(result).toEqual({});
  });

  it("supplies credentials for proxy auth challenges via Promise", async () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => ({ username: "alice", password: "secret" }), api);

    const resultPromise = getListener()({ isProxy: true }) as Promise<AuthCallbackResponse>;
    expect(await resultPromise).toEqual({
      authCredentials: { username: "alice", password: "secret" },
    });
  });

  it("cancels when the credentials provider returns undefined", async () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => undefined, api);

    const resultPromise = getListener()({ isProxy: true }) as Promise<AuthCallbackResponse>;
    expect(await resultPromise).toEqual({ cancel: true });
  });

  it("cancels when the credentials provider rejects", async () => {
    const { api, getListener } = createFakeApi();
    registerProxyAuth(async () => {
      throw new Error("storage failure");
    }, api);

    const resultPromise = getListener()({ isProxy: true }) as Promise<AuthCallbackResponse>;
    expect(await resultPromise).toEqual({ cancel: true });
  });
});
