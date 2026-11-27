# @infralayers/mv3-proxy-kit Developer Guide

Complete module-by-module reference for building cross-browser Manifest V3 (MV3) extensions for Chrome and Firefox with `@infralayers/mv3-proxy-kit`.

---

## Table of Contents

1. [Installation & Subpath Imports](#installation--subpath-imports)
2. [Proxy Configuration (`ProxyManager` & Standalone Helpers)](#proxy-configuration-proxymanager--standalone-helpers)
3. [Proxy Authentication (`registerProxyAuth`)](#proxy-authentication-registerproxyauth)
4. [Suspension-Safe State (`createPersistedState`)](#suspension-safe-state-createpersistedstate)
5. [Typed Messaging (`createChannel`)](#typed-messaging-createchannel)
6. [Cross-Browser API Resolver (`getBrowserAPI`)](#cross-browser-api-resolver-getbrowserapi)
7. [Manifest Permissions & Browser Quirks](#manifest-permissions--browser-quirks)

---

## Installation & Subpath Imports

```bash
npm install @infralayers/mv3-proxy-kit
```

You can import everything from the root package or pull in individual subpaths to keep your bundle lean:

```ts
// Root import (all modules)
import {
  ProxyManager,
  setProxyConfig,
  clearProxyConfig,
  getProxyConfig,
  registerProxyAuth,
  createPersistedState,
  createChannel,
  getBrowserAPI,
} from "@infralayers/mv3-proxy-kit";

// Modular subpath imports
import { createPersistedState } from "@infralayers/mv3-proxy-kit/state";
import { createChannel } from "@infralayers/mv3-proxy-kit/messaging";
import { ProxyManager, setProxyConfig, registerProxyAuth } from "@infralayers/mv3-proxy-kit/proxy";
```

---

## Proxy Configuration (`ProxyManager` & Standalone Helpers)

**Rule of thumb:**
- Use the **standalone helpers** (`setProxyConfig`, `getProxyConfig`, `clearProxyConfig`) for standard extensions that manage a single global proxy state.
- Instantiate **`new ProxyManager(api?, enableLogging?)`** when you want structured console logging (`enableLogging: true`), isolated instances, or dependency-injected mock `BrowserAPI` objects in unit tests.

### Supported `ProxyConfig` Modes

#### 1. Declarative Fixed Server (`fixed_servers`)
Translates to Chrome `mode: "fixed_servers"` and Firefox `proxyType: "manual"` (automatically mapping `socks` / `socks5` / `socks4` to Firefox's `socks` + `socksVersion` fields, and `bypassList` to Firefox's `passthrough`).

```ts
import { setProxyConfig } from "@infralayers/mv3-proxy-kit/proxy";

async function applyFixedProxy(host: string, port: number) {
  await setProxyConfig({
    mode: "fixed_servers",
    rules: {
      singleProxy: {
        host,
        port,
        scheme: "http", // "http" | "https" | "socks4" | "socks5" | "socks"
      },
      bypassList: ["localhost", "127.0.0.1"],
    },
  });
}
```

Legacy bare `ProxyTarget` objects (`{ host, port }`) are also accepted and automatically normalized to `fixed_servers` mode:

```ts
await setProxyConfig({ host, port });
```

#### 2. Hosted PAC Script URL (`pac_url`)
Translates to Chrome `mode: "pac_script"` (`pacScript.url`) and Firefox `proxyType: "autoConfig"` (`autoConfigUrl`).

```ts
import { setProxyConfig } from "@infralayers/mv3-proxy-kit/proxy";

async function applyPacUrl(pacUrl: string) {
  await setProxyConfig({
    mode: "pac_url",
    url: pacUrl,
  });
}
```

#### 3. Direct Mode (`direct` / `clearProxyConfig`)
Translates to Chrome `mode: "direct"` and Firefox `proxyType: "none"`.

```ts
import { clearProxyConfig } from "@infralayers/mv3-proxy-kit/proxy";

async function disableProxy() {
  await clearProxyConfig();
}
```

### Using `ProxyManager` Directly

```ts
import { ProxyManager } from "@infralayers/mv3-proxy-kit/proxy";

// Pass `undefined` to use the default browser API and `true` to enable `[ProxyManager]` logs
const proxyManager = new ProxyManager(undefined, true);

async function toggleProxy(host: string, port: number) {
  await proxyManager.setConfig({
    mode: "fixed_servers",
    rules: { singleProxy: { host, port, scheme: "socks5" } },
  });

  const active = proxyManager.getConfig(); // In-memory config for this worker lifecycle
  if (active?.mode === "fixed_servers") {
    await proxyManager.clearConfig();
  }
}
```

**MV3 Lifecycle Note for `getProxyConfig()` / `proxyManager.getConfig()`:**
`getConfig()` reads in-memory state and resets to `null` whenever Chrome or Firefox suspends and restarts the background service worker. If you need your active proxy configuration to survive service worker restarts (for example, to repopulate a popup form), store it with `createPersistedState`.

---

## Proxy Authentication (`registerProxyAuth`)

`registerProxyAuth` listens to `webRequest.onAuthRequired` and transparently handles the Chrome vs. Firefox MV3 split:
- **Chrome MV3:** registers with `["asyncBlocking"]`, invokes `asyncCallback({ authCredentials })` (or `{ cancel: true }` on missing/rejected credentials), and returns `void` on non-proxy challenges.
- **Firefox MV3:** registers with `["blocking"]` and returns a `Promise` directly (or `{}` synchronously on non-proxy challenges).

```ts
import { registerProxyAuth } from "@infralayers/mv3-proxy-kit/proxy";
import { createPersistedState } from "@infralayers/mv3-proxy-kit/state";

// Register synchronously at the top level of your service worker (never inside async callbacks)
const credentials = createPersistedState<{ username: string; password: string }>("proxyCreds");

registerProxyAuth(async () => credentials.get());
```

If your `getCredentials` provider returns `undefined` or throws an error, `registerProxyAuth` cancels the proxy auth challenge (`{ cancel: true }`). Non-proxy auth challenges (`details.isProxy === false`) are ignored cleanly so regular website HTTP auth is unaffected.

---

## Suspension-Safe State (`createPersistedState`)

Chrome terminates idle MV3 service workers after roughly 30 seconds, wiping module-level variables. `createPersistedState` wraps `chrome.storage.session` (automatically falling back to `storage.local` if `session` is unavailable) with:
- **Lazy auto-hydration:** `await state.get()` hydrates automatically on the first read after a cold restart.
- **Concurrent read deduplication:** multiple simultaneous `get()` calls share a single in-flight `storage.get()`.
- **Write-wins race protection:** calling `set()` while `hydrate()` is in flight ensures stale storage reads never overwrite newer writes.

```ts
import { createPersistedState } from "@infralayers/mv3-proxy-kit/state";

interface ProxySettings {
  host: string;
  port: number;
  pacUrl?: string;
}

const proxyState = createPersistedState<ProxySettings>("proxySettings");

async function saveAndRead(settings: ProxySettings) {
  await proxyState.set(settings);
  const current = await proxyState.get(); // Survives service worker suspension
  return current;
}
```

---

## Typed Messaging (`createChannel`)

`createChannel` provides a lightweight, strongly typed request/response layer over `runtime.onMessage` and `runtime.sendMessage` for background, popup, and content-script communication.

### In your background service worker

```ts
import { createChannel } from "@infralayers/mv3-proxy-kit/messaging";
import { setProxyConfig } from "@infralayers/mv3-proxy-kit/proxy";

interface EnablePayload {
  host: string;
  port: number;
}

const channel = createChannel();

channel.on<EnablePayload, { ok: true }>("ENABLE_PROXY", async (payload) => {
  await setProxyConfig({ host: payload.host, port: payload.port });
  return { ok: true };
});
```

### In your popup or content script

```ts
import { createChannel } from "@infralayers/mv3-proxy-kit/messaging";

const channel = createChannel();

async function onEnableClick(host: string, port: number) {
  const res = await channel.send<{ host: string; port: number }, { ok: true }>({
    type: "ENABLE_PROXY",
    payload: { host, port },
  });
  return res.ok;
}
```

---

## Cross-Browser API Resolver (`getBrowserAPI`)

`getBrowserAPI()` resolves the active WebExtension namespace (`globalThis.browser` on Firefox, `globalThis.chrome` on Chrome, with safe fallback) and throws a clear error if executed outside an extension context.

Every core function (`setProxyConfig`, `clearProxyConfig`, `registerProxyAuth`, `createPersistedState`, `createChannel`, and `new ProxyManager(api)`) accepts an optional `api: BrowserAPI` parameter so you can inject a lightweight mock in Node.js unit tests without needing a real browser:

```ts
import { setProxyConfig, type BrowserAPI } from "@infralayers/mv3-proxy-kit";

const fakeApi = {
  proxy: { settings: { set: async () => {} } },
} as unknown as BrowserAPI;

await setProxyConfig({ mode: "direct" }, fakeApi);
```

---

## Manifest Permissions & Browser Quirks

**Non-proxy extensions:** If you only use `@infralayers/mv3-proxy-kit/state`, you only need the `"storage"` permission. `@infralayers/mv3-proxy-kit/messaging` requires no extra manifest permissions. The permissions below apply when using the `/proxy` module.

### Chrome MV3 (`manifest.json`)

```json
{
  "manifest_version": 3,
  "permissions": ["proxy", "webRequest", "webRequestAuthProvider", "storage"],
  "host_permissions": ["<all_urls>"],
  "background": { "service_worker": "dist/background.js", "type": "module" }
}
```

- **No top-level `await`:** Chrome MV3 service workers reject top-level `await`. Always register `registerProxyAuth(...)` and `channel.on(...)` synchronously at module load time.
- **`chrome://newtab` quirk:** Chrome intentionally blocks extensions from intercepting `webRequest.onAuthRequired` for requests initiated by `chrome://` pages (including the New Tab page). Navigating to any standard `https://` page triggers `registerProxyAuth` and populates Chrome's HTTP Auth Cache.

### Firefox MV3 (`manifest.json`)

```json
{
  "manifest_version": 3,
  "permissions": ["proxy", "webRequest", "webRequestBlocking", "storage"],
  "host_permissions": ["<all_urls>"],
  "background": { "scripts": ["dist/background.js"], "type": "module" },
  "browser_specific_settings": {
    "gecko": { "id": "your-extension@example.com" }
  }
}
```

- **Private Browsing permission:** Firefox requires the user to set **"Run in Private Windows: Allow"** (in `about:addons`) before `browser.proxy.settings.set()` is permitted.
- **Host permissions in MV3:** In Firefox MV3, `<all_urls>` under `host_permissions` may start disabled until the user enables **"Access your data for all websites"** in the extension's Permissions tab in `about:addons`.
