import { createChannel } from "@infralayers/mv3-proxy-kit";

import type {
  EnableProxyPayload, 
  DisableProxyPayload,
  GetProxyStatePayload,
  GetProxyStateResponse
} from "./types.js";

const channel = createChannel();

document.getElementById("enable")?.addEventListener("click", async () => {
  const host = (document.getElementById("host") as HTMLInputElement).value.trim();
  const port = Number((document.getElementById("port") as HTMLInputElement).value);
  const pacUrl = (document.getElementById("pacUrl") as HTMLInputElement).value.trim();
  const username = (document.getElementById("username") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  const result = await channel.send<EnableProxyPayload, { ok: true }>({
    type: "ENABLE_PROXY",
    payload: { host, port, pacUrl: pacUrl || undefined, username, password },
  });

  document.getElementById("status")!.textContent = result.ok ? "Proxy enabled" : "Failed";
});

document.getElementById("disable")?.addEventListener("click", async () => {
  const result = await channel.send<DisableProxyPayload, {ok: true}>({
    type: "DISABLE_PROXY",
    payload: {},
  });

  document.getElementById("status")!.textContent = result.ok ? "Proxy disabled" : "Failed";
});

async function loadInitialState() {
  const state = await channel.send<GetProxyStatePayload, GetProxyStateResponse>({
    type: "GET_CURRENT_PROXY_CONFIG",
    payload: {},
  });
  // Populate the form fields with the data from the background script
  (document.getElementById("host") as HTMLInputElement).value = state.host;
  (document.getElementById("port") as HTMLInputElement).value = state.port;
  (document.getElementById("pacUrl") as HTMLInputElement).value = state.pacUrl;
  (document.getElementById("username") as HTMLInputElement).value = state.username;
  (document.getElementById("password") as HTMLInputElement).value = state.password;
}

loadInitialState();
