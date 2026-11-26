import { getBrowserAPI, isFirefox, type BrowserAPI } from "./browserApi.js";

/**
 * Represents a single proxy endpoint target.
 */
export interface ProxyTarget {
  /** The proxy server hostname or IP address. */
  host: string;
  /** The proxy server port. */
  port: number;
  /** The proxy scheme (e.g., "http", "https", "socks4", "socks5", "socks"). Defaults to "http". */
  scheme?: "http" | "https" | "socks4" | "socks5" | "socks";
}

/**
 * Multi-mode configuration for extension proxy routing.
 */
export type ProxyConfig =
  | {
      /** Declarative fixed server mode (native proxyType manual in Firefox, fixed_servers in Chrome). */
      mode: "fixed_servers";
      rules: {
        /** The primary proxy target. */
        singleProxy: ProxyTarget;
        /** Optional list of hosts that should bypass the proxy (e.g., "localhost", "127.0.0.1"). */
        bypassList?: string[];
      };
    }
  | {
      /** Mode to fetch a PAC script from a remote or extension URL. */
      mode: "pac_url";
      /** The URL pointing to the PAC file. */
      url: string;
    }
  | { 
      /** Disable the proxy entirely and route directly. */
      mode: "direct" 
    };

/**
 * Manages proxy configuration routing, handling browser discrepancies internally.
 */
export class ProxyManager {
  private customApi?: BrowserAPI;
  private currentConfig: ProxyConfig | null = null;
  private logger: (msg: string, ...args: any[]) => void;

  /**
   * Instantiates a new ProxyManager.
   * @param api Optional custom BrowserAPI instance (defaults to lazy-loaded global Chrome/Firefox API).
   * @param enableLogging Whether to log proxy config changes and errors to the console (defaults to false).
   */
  constructor(api?: BrowserAPI, enableLogging = false) {
    this.customApi = api;
    this.logger = enableLogging ? console.log.bind(console, "[ProxyManager]") : () => {};
  }

  private getApi(): BrowserAPI {
    return this.customApi || getBrowserAPI();
  }

  /**
   * Retrieves the current ProxyConfig applied by this manager.
   */
  public getConfig(): ProxyConfig | null {
    return this.currentConfig;
  }

  /**
   * Clears the proxy configuration, reverting the browser to a direct connection.
   */
  public async clearConfig(): Promise<void> {
    this.logger("Clearing proxy config (setting to DIRECT).");
    await this.setConfig({ mode: "direct" });
  }

  /**
   * Applies a new proxy configuration.
   * @param config The new ProxyConfig (or a bare ProxyTarget for legacy backwards compatibility).
   */
  public async setConfig(config: ProxyConfig | ProxyTarget): Promise<void> {
    try {
      // Backwards compatibility for bare ProxyTarget
      if ("host" in config && "port" in config && !("mode" in config)) {
        config = {
          mode: "fixed_servers",
          rules: { singleProxy: config as ProxyTarget }
        };
      }

      const c = config as ProxyConfig;
      this.currentConfig = c;
      const api = this.getApi();

      if (c.mode === "direct") {
        if (isFirefox()) {
          await api.proxy.settings.set({ value: { proxyType: "none" }, scope: "regular" });
        } else {
          await api.proxy.settings.set({ value: { mode: "direct" }, scope: "regular" });
        }
        this.logger("Successfully applied direct mode.");
        return;
      }

      if (c.mode === "fixed_servers") {
        if (isFirefox()) {
          const p = c.rules.singleProxy;
          const passthrough = c.rules.bypassList ? c.rules.bypassList.join(", ") : "";
          const isSocks = p.scheme === "socks" || p.scheme === "socks5" || p.scheme === "socks4";
          const firefoxValue = isSocks
            ? {
                proxyType: "manual",
                socks: `${p.host}:${p.port}`,
                socksVersion: p.scheme === "socks4" ? 4 : 5,
                passthrough,
              }
            : {
                proxyType: "manual",
                http: p.scheme ? `${p.scheme}://${p.host}:${p.port}` : `${p.host}:${p.port}`,
                ssl: p.scheme ? `${p.scheme}://${p.host}:${p.port}` : `${p.host}:${p.port}`,
                httpProxyAll: true,
                passthrough,
              };
          await api.proxy.settings.set({
            value: firefoxValue,
            scope: "regular",
          });
        } else {
          await api.proxy.settings.set({
            value: {
              mode: "fixed_servers",
              rules: {
                singleProxy: c.rules.singleProxy,
                bypassList: c.rules.bypassList
              }
            },
            scope: "regular",
          });
        }
        this.logger("Successfully applied fixed_servers mode.");
        return;
      }

      if (c.mode === "pac_url") {
        if (isFirefox()) {
          await api.proxy.settings.set({ value: { proxyType: "autoConfig", autoConfigUrl: c.url }, scope: "regular" });
        } else {
          await api.proxy.settings.set({ value: { mode: "pac_script", pacScript: { url: c.url } }, scope: "regular" });
        }
        this.logger(`Successfully applied pac_url mode with URL: ${c.url}`);
        return;
      }

      // Exhaustive runtime check for invalid mode
      throw new Error(`Invalid proxy mode provided: ${(c as any).mode}`);

    } catch (err) {
      console.error("[ProxyManager] Failed to set proxy configuration:", err);
      throw new Error(`ProxyManager failed to set config: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

// Default Singleton Manager for backward compatibility
const defaultManager = new ProxyManager();

/**
 * Applies a new proxy configuration using the default ProxyManager instance.
 * @param config The new ProxyConfig (or a bare ProxyTarget for legacy backwards compatibility).
 * @param api Optional custom BrowserAPI to use.
 */
export async function setProxyConfig(
  config: ProxyConfig | ProxyTarget,
  api?: BrowserAPI
): Promise<void> {
  if (api) {
    const tempManager = new ProxyManager(api);
    return tempManager.setConfig(config);
  }
  return defaultManager.setConfig(config);
}

/**
 * Clears the active proxy configuration using the default ProxyManager instance.
 */
export async function clearProxyConfig(api?: BrowserAPI): Promise<void> {
  if (api) {
    const tempManager = new ProxyManager(api);
    return tempManager.clearConfig();
  }
  return defaultManager.clearConfig();
}

/**
 * Retrieves the currently active configuration from the default ProxyManager instance.
 */
export function getProxyConfig(): ProxyConfig | null {
  return defaultManager.getConfig();
}
