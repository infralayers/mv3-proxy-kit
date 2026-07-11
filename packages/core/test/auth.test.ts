import { describe, it, expect, vi } from "vitest";
import { registerProxyAuth } from "../src/auth.js";
import type { BrowserAPI, WebAuthDetails, AuthCallbackResponse } from "../src/browserApi.js";

type Listener = (
  details: WebAuthDetails,
  asyncCallback: (response: AuthCallbackResponse) => void
) => void;

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
