import {
  registerProxyAuth,
  createPersistedState,
  setProxyConfig,
  clearProxyConfig,
  createChannel,
} from "@infralayers/mv3-proxy-kit";
import type { 
  ProxyCredentials,
  EnableProxyPayload, 
  DisableProxyPayload, 
  GetProxyStatePayload, 
  GetProxyStateResponse,
  ProxyConfigState
} from "./types.js";

const credentialsState = createPersistedState<ProxyCredentials>("proxyCredentials");
const proxyConfigState = createPersistedState<ProxyConfigState>("proxyConfig");

registerProxyAuth(async () => credentialsState.get());

const channel = createChannel();

channel.on<EnableProxyPayload, { ok: true }>("ENABLE_PROXY", async (payload) => {
  await credentialsState.set({ username: payload.username, password: payload.password });
  await proxyConfigState.set({ host: payload.host, port: payload.port, pacUrl: payload.pacUrl });
  if (payload.pacUrl) {
    await setProxyConfig({ mode: "pac_url", url: payload.pacUrl });
  } else {
    await setProxyConfig({
      mode: "fixed_servers",
      rules: { singleProxy: { host: payload.host, port: payload.port } },
    });
  }
  return { ok: true };
});

channel.on<DisableProxyPayload, { ok: true }>("DISABLE_PROXY", async () => {
  await clearProxyConfig();
  return { ok: true };
});

channel.on<GetProxyStatePayload, GetProxyStateResponse>("GET_CURRENT_PROXY_CONFIG", async () => {
  const credentials = await credentialsState.get();
  const savedProxyConfig = await proxyConfigState.get();
  return {
    host: savedProxyConfig?.host || "",
    port: savedProxyConfig?.port?.toString() || "", // Convert port to string for HTML input compatibility
    pacUrl: savedProxyConfig?.pacUrl || "",
    username: credentials?.username || "",
    password: credentials?.password || "",
  };
});
