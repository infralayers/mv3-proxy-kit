import { getBrowserAPI, type BrowserAPI } from "./browserApi.js";

export interface Message<T = unknown> {
  type: string;
  payload?: T;
}

export type MessageHandler<T = unknown, R = unknown> = (payload: T) => Promise<R> | R;

export interface Channel {
  on<T, R>(type: string, handler: MessageHandler<T, R>): void;
  send<T, R>(message: Message<T>): Promise<R>;
}

export function createChannel(api: BrowserAPI = getBrowserAPI()): Channel {
  const handlers = new Map<string, MessageHandler>();

  api.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const { type, payload } = message as Message;
    const handler = handlers.get(type);
    if (!handler) {
      return false;
    }
    Promise.resolve(handler(payload)).then(sendResponse);
    return true;
  });

  return {
    on<T, R>(type: string, handler: MessageHandler<T, R>) {
      handlers.set(type, handler as MessageHandler);
    },
    async send<T, R>(message: Message<T>): Promise<R> {
      return api.runtime.sendMessage(message) as Promise<R>;
    },
  };
}
