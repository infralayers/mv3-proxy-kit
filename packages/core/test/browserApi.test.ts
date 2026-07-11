import { describe, it, expect, afterEach, vi } from "vitest";
import { getBrowserAPI } from "../src/browserApi.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getBrowserAPI", () => {
  it("returns globalThis.chrome when it exists", () => {
    const fakeChrome = { name: "chrome" };
    vi.stubGlobal("chrome", fakeChrome);
    expect(getBrowserAPI()).toBe(fakeChrome);
  });

  it("returns globalThis.browser when chrome is not defined", () => {
    vi.stubGlobal("chrome", undefined);
    const fakeBrowser = { name: "browser" };
    vi.stubGlobal("browser", fakeBrowser);
    expect(getBrowserAPI()).toBe(fakeBrowser);
  });

  it("throws when neither chrome nor browser exists", () => {
    vi.stubGlobal("chrome", undefined);
    vi.stubGlobal("browser", undefined);
    expect(() => getBrowserAPI()).toThrow(/no chrome or browser global/);
  });
});
