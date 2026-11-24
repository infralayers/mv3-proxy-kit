# mv3-proxy-kit

Open-source toolkit for building reliable Manifest V3 proxy/VPN browser extensions.

## Packages

- [`@infralayers/mv3-proxy-kit`](packages/core) — the core library:
  - `registerProxyAuth` — reliable per-request proxy authentication
  - `createPersistedState` — state that survives MV3 service-worker restarts
  - `setProxyConfig` / `buildPacScript` — proxy config and PAC script management
  - `createChannel` — typed background↔popup↔content-script messaging
- [`example-extension`](packages/example-extension) — a working Chrome + Firefox extension built with the library

## Status

v1 — core modules implemented and unit-tested (14/14 passing), example extension builds
cleanly and type-checks for both browsers. **Manual browser verification (loading the
unpacked extension in `chrome://extensions` and `about:debugging`, and confirming proxy
auth + config switching actually work end-to-end) is the one remaining step and needs a
real browser** — see `packages/example-extension/README.md` for how to do that.

Known gap: While cross-browser proxy auth (`registerProxyAuth`) is fully implemented and tested for both Chrome and Firefox MV3, manual end-to-end verification in Firefox is currently blocked. Firefox ignores `pacScript.data` in `proxy.settings.set`, meaning the PAC-based config silently fails to route traffic in Firefox. A native Firefox proxy configuration approach (e.g., `proxyType: "manual"`) must be implemented before Firefox proxy auth can be manually triggered in the browser.

## Development

```bash
npm install
npm test          # run all unit tests
npm run typecheck # type-check the core library
npm run build --workspace=packages/core
npm run build --workspace=packages/example-extension
```

## License

MIT
