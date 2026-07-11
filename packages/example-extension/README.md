# mv3-proxy-kit example extension

A minimal extension demonstrating `@infralayers/mv3-proxy-kit`: enter a proxy's
host/port/credentials in the popup, and it wires up auth handling, PAC-based config
switching, and persisted state via the library.

## Build

From the repo root:

```bash
npm install
npm run build --workspace=packages/core
npm run build --workspace=packages/example-extension
```

## Load in Chrome

1. Copy the Chrome manifest into place: `cp manifest.chrome.json manifest.json` (run from this directory).
2. Go to `chrome://extensions`, enable Developer mode.
3. Click "Load unpacked", select this directory (`packages/example-extension`).
4. Confirm it loads with no errors on the extensions page.
5. Open the popup, fill in a real proxy's host/port/username/password, click "Enable proxy".
6. Confirm the popup shows "Proxy enabled" and check the service worker inspector (via
   the "service worker" link on `chrome://extensions`) for console errors.

## Load in Firefox

1. Copy the Firefox manifest into place: `cp manifest.firefox.json manifest.json` (run from this directory).
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click "Load Temporary Add-on", select `manifest.json` in this directory.
4. Confirm it loads with no errors.
5. Open the popup and submit the form — PAC-based config switching should work.
   Proxy auth callback support is Chrome-only for now (see the repo root README's
   "Known gap" note).

Remove the copied `manifest.json` when you're done so it doesn't shadow the two
per-browser source files (`manifest.chrome.json` / `manifest.firefox.json`):

```bash
rm manifest.json
```
