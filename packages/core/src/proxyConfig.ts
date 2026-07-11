import { getBrowserAPI, type BrowserAPI } from "./browserApi.js";

export interface ProxyTarget {
  host: string;
  port: number;
}

export function buildPacScript(target: ProxyTarget): string {
  return `function FindProxyForURL(url, host) {\n  return "PROXY ${target.host}:${target.port}";\n}`;
}

export async function setProxyConfig(
  target: ProxyTarget,
  api: BrowserAPI = getBrowserAPI()
): Promise<void> {
  await api.proxy.settings.set({
    value: {
      mode: "pac_script",
      pacScript: { data: buildPacScript(target) },
    },
    scope: "regular",
  });
}
