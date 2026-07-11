import { describe, it, expect, vi } from "vitest";
import { buildPacScript, setProxyConfig } from "../src/proxyConfig.js";
import type { BrowserAPI } from "../src/browserApi.js";

describe("buildPacScript", () => {
  it("generates a PAC script that always routes to the given proxy", () => {
    const script = buildPacScript({ host: "proxy.infralayers.net", port: 8080 });
    expect(script).toContain("PROXY proxy.infralayers.net:8080");
    expect(script).toContain("function FindProxyForURL(url, host)");
  });
});

describe("setProxyConfig", () => {
  it("calls proxy.settings.set with a pac_script config", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const api = { proxy: { settings: { set } } } as unknown as BrowserAPI;
    const target = { host: "proxy.infralayers.net", port: 8080 };

    await setProxyConfig(target, api);

    expect(set).toHaveBeenCalledWith({
      value: {
        mode: "pac_script",
        pacScript: { data: buildPacScript(target) },
      },
      scope: "regular",
    });
  });
});
