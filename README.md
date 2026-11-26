[![CI](https://github.com/infralayers/mv3-proxy-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/infralayers/mv3-proxy-kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@infralayers/mv3-proxy-kit.svg)](https://www.npmjs.com/package/@infralayers/mv3-proxy-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

# @infralayers/mv3-proxy-kit

**Zero-dependency TypeScript toolkit for building reliable Manifest V3 (MV3) proxy and VPN browser extensions for Chrome and Firefox — with modular primitives reusable in any MV3 extension.**

Building cross-browser proxy extensions on Manifest V3 is notoriously fragile: Chrome uses `webRequestAuthProvider` + `asyncBlocking` and `fixed_servers`, Firefox uses `webRequestBlocking` + Promise returns and ignores `pacScript.data`, and MV3 service workers wipe global variables whenever Chrome suspends them after 30 seconds of inactivity.

`mv3-proxy-kit` abstracts those Chrome vs. Firefox differences behind a clean, strongly typed API — covering proxy authentication (`onAuthRequired`), HTTP/HTTPS/SOCKS4/SOCKS5 & PAC URL routing, suspension-safe state persistence, and typed messaging.

---

## Installation

```bash
npm install @infralayers/mv3-proxy-kit
```

---

## Quick Start

```ts
import {
  registerProxyAuth,
  createPersistedState,
  setProxyConfig,
  clearProxyConfig,
} from "@infralayers/mv3-proxy-kit";

// 1. Store credentials in suspension-safe MV3 state (auto-hydrates on cold restart)
const credentials = createPersistedState<{ username: string; password: string }>("proxyCreds");

// 2. Register cross-browser proxy authentication (Chrome asyncBlocking + Firefox blocking Promise)
//    Always register synchronously at the top level of your MV3 service worker!
registerProxyAuth(async () => credentials.get());

// 3. Configure proxy routing (Declarative fixed_servers mode — works on Chrome & Firefox)
await credentials.set({ username: "alice", password: "secret" });
await setProxyConfig({
  mode: "fixed_servers",
  rules: {
    singleProxy: { host: "proxy.example.com", port: 8080, scheme: "http" },
    bypassList: ["localhost", "127.0.0.1"],
  },
});

// Or use a hosted PAC script URL:
await setProxyConfig({
  mode: "pac_url",
  url: "https://example.com/proxy.pac",
});

// 4. Revert to a direct connection
await clearProxyConfig();
```

---

## Modular Subpath Imports (For Any MV3 Extension)

Building a non-proxy Chrome/Firefox extension? Import only the generic MV3 primitives you need with zero proxy code bundled:

```ts
import { createPersistedState } from "@infralayers/mv3-proxy-kit/state";
import { createChannel } from "@infralayers/mv3-proxy-kit/messaging";
import { setProxyConfig, registerProxyAuth } from "@infralayers/mv3-proxy-kit/proxy";
```

---

## Core Modules

| Export | Subpath | Description |
| :--- | :--- | :--- |
| **`setProxyConfig` / `clearProxyConfig` / `getProxyConfig` / `ProxyManager`** | `/proxy` | Multi-mode cross-browser proxy routing (`fixed_servers`, `pac_url`, `direct`) supporting HTTP, HTTPS, SOCKS4, SOCKS5, and bypass lists, plus backwards compatibility for bare `{ host, port }` targets. |
| **`registerProxyAuth`** | `/proxy` | Reliable per-request `webRequest.onAuthRequired` handler supporting Chrome MV3 (`webRequestAuthProvider` + `asyncBlocking`) and Firefox MV3 (`webRequestBlocking` + Promise return). |
| **`createPersistedState`** | `/state` | MV3 service-worker state wrapper backed by `chrome.storage.session` (with `local` fallback) featuring lazy auto-hydration on first read, deduplicated reads, and race-condition protection. |
| **`createChannel`** | `/messaging` | Lightweight, typed messaging channel for background ↔ popup ↔ content-script communication. |
| **`getBrowserAPI`** | `.` | Cross-browser WebExtension API resolver (`chrome` / `browser`) with strict Firefox detection. |

---

## Cross-Browser Support (Chrome vs. Firefox MV3)

| Feature | Chrome MV3 | Firefox MV3 |
| :--- | :--- | :--- |
| **Proxy Auth (`registerProxyAuth`)** | `webRequestAuthProvider` + `asyncBlocking` callback | `webRequestBlocking` + `blocking` Promise return |
| **Declarative Proxy (`fixed_servers`)** | `mode: "fixed_servers"` (`singleProxy` + `bypassList`) | `proxyType: "manual"` (`http`/`ssl` or `socks` + `socksVersion` + `passthrough`) |
| **PAC URL (`pac_url`)** | `mode: "pac_script"` (`pacScript.url`) | `proxyType: "autoConfig"` (`autoConfigUrl`) |
| **Direct (`direct` / `clearProxyConfig`)** | `mode: "direct"` | `proxyType: "none"` |
| **Persisted State (`createPersistedState`)** | `chrome.storage.session` | `browser.storage.session` (fallback to `local`) |

### Important Browser Notes
* **Chrome `chrome://newtab` quirk:** Chrome blocks extensions from intercepting `onAuthRequired` on privileged `chrome://` pages. Navigating to any standard `https://` page triggers `registerProxyAuth` and populates Chrome's HTTP Auth Cache.
* **Firefox Private Browsing & Host Permissions:** Firefox requires **"Run in Private Windows: Allow"** (in `about:addons`) for `browser.proxy.settings.set()` and requires `<all_urls>` host permission to be enabled for `onAuthRequired`.

---

## Monorepo Packages

- [`packages/core`](packages/core) — `@infralayers/mv3-proxy-kit` (published to npm)
- [`packages/example-extension`](packages/example-extension) — Working Chrome + Firefox reference extension demonstrating `fixed_servers`, `pac_url`, `clearProxyConfig`, `registerProxyAuth`, and `createPersistedState` (private, not published to npm)

---

## Development

```bash
npm install
npm run typecheck
npm test
npm run build --workspace=packages/core
npm run build --workspace=packages/example-extension
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on local browser testing and pull requests.

---

## License

MIT © [InfraLayers](https://infralayers.net)
