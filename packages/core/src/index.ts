export { getBrowserAPI, type BrowserAPI } from "./browserApi.js";
export { registerProxyAuth, type CredentialsProvider } from "./auth.js";
export { createPersistedState, type PersistedState } from "./serviceWorkerState.js";
export { buildPacScript, setProxyConfig, type ProxyTarget } from "./proxyConfig.js";
export { createChannel, type Channel, type Message, type MessageHandler } from "./messaging.js";
