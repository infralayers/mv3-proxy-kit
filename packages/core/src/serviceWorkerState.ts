import { getBrowserAPI, type BrowserAPI } from "./browserApi.js";

export interface PersistedState<T> {
  get(): T | undefined;
  set(value: T): Promise<void>;
  hydrate(): Promise<void>;
}

export function createPersistedState<T>(
  key: string,
  api: BrowserAPI = getBrowserAPI()
): PersistedState<T> {
  let cached: T | undefined;
  const storage = api.storage.session ?? api.storage.local;

  return {
    get() {
      return cached;
    },
    async set(value: T) {
      cached = value;
      await storage.set({ [key]: value });
    },
    async hydrate() {
      const result = await storage.get(key);
      cached = result[key] as T | undefined;
    },
  };
}
