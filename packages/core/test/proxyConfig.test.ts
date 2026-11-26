import { describe, it, expect, vi, afterEach } from "vitest";
import { setProxyConfig, clearProxyConfig, ProxyManager, type ProxyConfig } from "../src/proxyConfig.js";
import type { BrowserAPI } from "../src/browserApi.js";

function mockFirefox() {
  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 Firefox/128.0" });
}

function mockChrome() {
  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 Chrome/128.0" });
}

describe("setProxyConfig", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("backwards compatibility (ProxyTarget)", () => {
    it("converts legacy ProxyTarget to fixed_servers mode in Chrome", async () => {
      mockChrome();
      const set = vi.fn().mockResolvedValue(undefined);
      const api = { proxy: { settings: { set } } } as unknown as BrowserAPI;

      await setProxyConfig({ host: "proxy.infralayers.net", port: 8080 }, api);

      expect(set).toHaveBeenCalledWith({
        value: {
          mode: "fixed_servers",
          rules: { singleProxy: { host: "proxy.infralayers.net", port: 8080 }, bypassList: undefined },
        },
        scope: "regular",
      });
    });

    it("converts legacy ProxyTarget to proxyType manual in Firefox", async () => {
      mockFirefox();
      const set = vi.fn().mockResolvedValue(undefined);
      const api = { proxy: { settings: { set } } } as unknown as BrowserAPI;

      await setProxyConfig({ host: "proxy.infralayers.net", port: 8080 }, api);

      expect(set).toHaveBeenCalledWith({
        value: {
          proxyType: "manual",
          http: "proxy.infralayers.net:8080",
          ssl: "proxy.infralayers.net:8080",
          httpProxyAll: true,
          passthrough: "",
        },
        scope: "regular",
      });
    });
  });

  describe("direct mode", () => {
    it("uses mode: direct in Chrome", async () => {
      mockChrome();
      const set = vi.fn();
      await setProxyConfig({ mode: "direct" }, { proxy: { settings: { set } } } as unknown as BrowserAPI);
      expect(set).toHaveBeenCalledWith({ value: { mode: "direct" }, scope: "regular" });
    });

    it("uses proxyType: none in Firefox", async () => {
      mockFirefox();
      const set = vi.fn();
      await setProxyConfig({ mode: "direct" }, { proxy: { settings: { set } } } as unknown as BrowserAPI);
      expect(set).toHaveBeenCalledWith({ value: { proxyType: "none" }, scope: "regular" });
    });

    it("clearProxyConfig sets direct mode", async () => {
      mockFirefox();
      const set = vi.fn();
      await clearProxyConfig({ proxy: { settings: { set } } } as unknown as BrowserAPI);
      expect(set).toHaveBeenCalledWith({ value: { proxyType: "none" }, scope: "regular" });
    });
  });

  describe("fixed_servers mode", () => {
    it("passes fixed_servers config in Chrome", async () => {
      mockChrome();
      const set = vi.fn();
      await setProxyConfig(
        {
          mode: "fixed_servers",
          rules: { singleProxy: { host: "h", port: 1 }, bypassList: ["localhost"] },
        },
        { proxy: { settings: { set } } } as unknown as BrowserAPI
      );

      expect(set).toHaveBeenCalledWith({
        value: { mode: "fixed_servers", rules: { singleProxy: { host: "h", port: 1 }, bypassList: ["localhost"] } },
        scope: "regular",
      });
    });

    it("maps HTTP fixed_servers config to proxyType manual in Firefox", async () => {
      mockFirefox();
      const set = vi.fn();
      await setProxyConfig(
        {
          mode: "fixed_servers",
          rules: { singleProxy: { host: "h", port: 1 }, bypassList: ["localhost"] },
        },
        { proxy: { settings: { set } } } as unknown as BrowserAPI
      );

      expect(set).toHaveBeenCalledWith({
        value: { proxyType: "manual", http: "h:1", ssl: "h:1", httpProxyAll: true, passthrough: "localhost" },
        scope: "regular",
      });
    });

    it("maps SOCKS5 fixed_servers config to Firefox socks + socksVersion 5", async () => {
      mockFirefox();
      const set = vi.fn();
      await setProxyConfig(
        {
          mode: "fixed_servers",
          rules: { singleProxy: { host: "socks.local", port: 1080, scheme: "socks5" }, bypassList: ["localhost"] },
        },
        { proxy: { settings: { set } } } as unknown as BrowserAPI
      );

      expect(set).toHaveBeenCalledWith({
        value: { proxyType: "manual", socks: "socks.local:1080", socksVersion: 5, passthrough: "localhost" },
        scope: "regular",
      });
    });

    it("maps SOCKS4 fixed_servers config to Firefox socks + socksVersion 4", async () => {
      mockFirefox();
      const set = vi.fn();
      await setProxyConfig(
        {
          mode: "fixed_servers",
          rules: { singleProxy: { host: "socks.local", port: 1080, scheme: "socks4" } },
        },
        { proxy: { settings: { set } } } as unknown as BrowserAPI
      );

      expect(set).toHaveBeenCalledWith({
        value: { proxyType: "manual", socks: "socks.local:1080", socksVersion: 4, passthrough: "" },
        scope: "regular",
      });
    });
  });

  describe("pac_url mode", () => {
    it("uses pac_script with url in Chrome", async () => {
      mockChrome();
      const set = vi.fn();
      await setProxyConfig({ mode: "pac_url", url: "http://pac" }, { proxy: { settings: { set } } } as unknown as BrowserAPI);
      expect(set).toHaveBeenCalledWith({ value: { mode: "pac_script", pacScript: { url: "http://pac" } }, scope: "regular" });
    });

    it("uses proxyType autoConfig in Firefox", async () => {
      mockFirefox();
      const set = vi.fn();
      await setProxyConfig({ mode: "pac_url", url: "http://pac" }, { proxy: { settings: { set } } } as unknown as BrowserAPI);
      expect(set).toHaveBeenCalledWith({ value: { proxyType: "autoConfig", autoConfigUrl: "http://pac" }, scope: "regular" });
    });
  });

  describe("ProxyManager error handling", () => {
    it("throws on invalid proxy mode", async () => {
      mockChrome();
      const set = vi.fn();
      const manager = new ProxyManager({ proxy: { settings: { set } } } as unknown as BrowserAPI);
      await expect(manager.setConfig({ mode: "unknown" } as unknown as ProxyConfig)).rejects.toThrow(
        "Invalid proxy mode provided: unknown"
      );
    });
  });
});
