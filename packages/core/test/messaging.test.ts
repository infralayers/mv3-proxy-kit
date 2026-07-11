import { describe, it, expect, vi } from "vitest";
import { createChannel } from "../src/messaging.js";
import type { BrowserAPI } from "../src/browserApi.js";

type OnMessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response?: unknown) => void
) => boolean | void;

function createFakeApi() {
  let capturedListener: OnMessageListener | undefined;
  const sendMessage = vi.fn();
  const api = {
    runtime: {
      sendMessage,
      onMessage: {
        addListener: (cb: OnMessageListener) => {
          capturedListener = cb;
        },
      },
    },
  } as unknown as BrowserAPI;
  return { api, sendMessage, getListener: () => capturedListener! };
}

describe("createChannel", () => {
  it("dispatches an incoming message to the matching registered handler", async () => {
    const { api, getListener } = createFakeApi();
    const channel = createChannel(api);
    const handler = vi.fn().mockResolvedValue("pong");
    channel.on("PING", handler);

    const sendResponse = vi.fn();
    const keepChannelOpen = getListener()({ type: "PING", payload: undefined }, {}, sendResponse);

    expect(handler).toHaveBeenCalled();
    expect(keepChannelOpen).toBe(true);
    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith("pong"));
  });

  it("does not throw and returns false for an unregistered message type", () => {
    const { api, getListener } = createFakeApi();
    createChannel(api);
    const sendResponse = vi.fn();
    const keepChannelOpen = getListener()({ type: "UNKNOWN" }, {}, sendResponse);
    expect(keepChannelOpen).toBe(false);
    expect(sendResponse).not.toHaveBeenCalled();
  });

  it("send() forwards the message to runtime.sendMessage", async () => {
    const { api, sendMessage } = createFakeApi();
    sendMessage.mockResolvedValue("pong");
    const channel = createChannel(api);

    const result = await channel.send({ type: "PING" });

    expect(sendMessage).toHaveBeenCalledWith({ type: "PING" });
    expect(result).toBe("pong");
  });
});
