export { getBrowserAPI, type BrowserAPI } from "./browserApi.js";
export { registerProxyAuth, type CredentialsProvider } from "./auth.js";
export { createPersistedState, type PersistedState } from "./serviceWorkerState.js";
export { 
  setProxyConfig, 
  clearProxyConfig,
  getProxyConfig,
  ProxyManager,
  type ProxyTarget,
  type ProxyConfig
} from "./proxyConfig.js";
export { createChannel, type Channel, type Message, type MessageHandler } from "./messaging.js";
