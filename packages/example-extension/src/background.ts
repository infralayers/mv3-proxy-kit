import {
  registerProxyAuth,
  createPersistedState,
  setProxyConfig,
  createChannel,
} from "@infralayers/mv3-proxy-kit";

interface ProxyCredentials {
  username: string;
  password: string;
}

interface EnableProxyPayload extends ProxyCredentials {
  host: string;
  port: number;
}

const credentialsState = createPersistedState<ProxyCredentials>("proxyCredentials");

registerProxyAuth(async () => credentialsState.get());

const channel = createChannel();

channel.on<EnableProxyPayload, { ok: true }>("ENABLE_PROXY", async (payload) => {
  await credentialsState.set({ username: payload.username, password: payload.password });
  await setProxyConfig({ host: payload.host, port: payload.port });
  return { ok: true };
});
