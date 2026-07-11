import { describe, it, expect } from "vitest";
import { createPersistedState } from "../src/serviceWorkerState.js";
import type { BrowserAPI } from "../src/browserApi.js";

function createFakeApi() {
  const store: Record<string, unknown> = {};
  const api = {
    storage: {
      local: {
        get: async (key: string) => ({ [key]: store[key] }),
        set: async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        },
      },
    },
  } as unknown as BrowserAPI;
  return api;
}

describe("createPersistedState", () => {
  it("returns undefined before hydration", () => {
    const state = createPersistedState<string>("proxyMode", createFakeApi());
    expect(state.get()).toBeUndefined();
  });

  it("set() updates the in-memory cache immediately", async () => {
    const state = createPersistedState<string>("proxyMode", createFakeApi());
    await state.set("manual");
    expect(state.get()).toBe("manual");
  });

  it("hydrate() reads a value persisted by a previous service-worker instance", async () => {
    const api = createFakeApi();
    const first = createPersistedState<string>("proxyMode", api);
    await first.set("pac");

    const second = createPersistedState<string>("proxyMode", api);
    expect(second.get()).toBeUndefined();
    await second.hydrate();
    expect(second.get()).toBe("pac");
  });
});
