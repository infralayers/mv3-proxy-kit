import { createChannel } from "@infralayers/mv3-proxy-kit";

interface EnableProxyPayload {
  host: string;
  port: number;
  username: string;
  password: string;
}

const channel = createChannel();

document.getElementById("enable")?.addEventListener("click", async () => {
  const host = (document.getElementById("host") as HTMLInputElement).value;
  const port = Number((document.getElementById("port") as HTMLInputElement).value);
  const username = (document.getElementById("username") as HTMLInputElement).value;
  const password = (document.getElementById("password") as HTMLInputElement).value;

  const result = await channel.send<EnableProxyPayload, { ok: true }>({
    type: "ENABLE_PROXY",
    payload: { host, port, username, password },
  });

  document.getElementById("status")!.textContent = result.ok ? "Proxy enabled" : "Failed";
});
