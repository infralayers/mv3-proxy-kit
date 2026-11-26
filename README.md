[![CI](https://github.com/infralayers/mv3-proxy-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/infralayers/mv3-proxy-kit/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@infralayers/mv3-proxy-kit.svg)](https://www.npmjs.com/package/@infralayers/mv3-proxy-kit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/infralayers/mv3-proxy-kit/blob/main/LICENSE)
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

// Register synchronously at the top level of your MV3 service worker (no top-level await)
const credentials = createPersistedState<{ username: string; password: string }>("proxyCreds");
registerProxyAuth(async () => credentials.get());

// Invoke from your popup/message handler or auth flow
async function enableProxy(host: string, port: number, username: string, password: string) {
  await credentials.set({ username, password });
  await setProxyConfig({
    mode: "fixed_servers",
    rules: { singleProxy: { host, port, scheme: "http" }, bypassList: ["localhost"] },
  });
  // Or use a PAC URL (from UI or API): await setProxyConfig({ mode: "pac_url", url: pacUrl });
}

async function disableProxy() {
  await clearProxyConfig();
}
```

- **Full Module-by-Module Developer Guide:** [docs/GUIDE.md](https://github.com/infralayers/mv3-proxy-kit/blob/main/docs/GUIDE.md)
- **Working Chrome & Firefox Reference Extension:** [packages/example-extension](https://github.com/infralayers/mv3-proxy-kit/tree/main/packages/example-extension)

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

See the [full Developer Guide](https://github.com/infralayers/mv3-proxy-kit/blob/main/docs/GUIDE.md) for manifest permissions, Chrome/Firefox quirks, and complete API documentation.

---

## Monorepo Packages

- [packages/core](https://github.com/infralayers/mv3-proxy-kit/tree/main/packages/core) — `@infralayers/mv3-proxy-kit` (published to npm)
- [packages/example-extension](https://github.com/infralayers/mv3-proxy-kit/tree/main/packages/example-extension) — Working Chrome + Firefox reference extension (private, not published to npm)

---

## Development

```bash
npm install
npm run typecheck
npm test
npm run build --workspace=packages/core
npm run build --workspace=packages/example-extension
```

See [CONTRIBUTING.md](https://github.com/infralayers/mv3-proxy-kit/blob/main/CONTRIBUTING.md) for guidelines on local browser testing and pull requests.

---

## License

MIT © [InfraLayers](https://infralayers.net)
