import { getBrowserAPI, type BrowserAPI } from "./browserApi.js";

export interface PersistedState<T> {
  get(): Promise<T | undefined>;
  set(value: T): Promise<void>;
  hydrate(): Promise<void>;
}

export function createPersistedState<T>(
  key: string,
  api: BrowserAPI = getBrowserAPI()
): PersistedState<T> {
  let cached: T | undefined;
  let hydrated = false;
  let hydrationPromise: Promise<void> | undefined;
  let cacheVersion = 0;
  const storage = api.storage.session ?? api.storage.local;

  async function hydrate(): Promise<void> {
    if (hydrated) return;

    hydrationPromise ??= (async () => {
      const versionAtStart = cacheVersion;
      const result = await storage.get(key);

      if (cacheVersion === versionAtStart) {
        cached = result[key] as T | undefined;
        hydrated = true;
      }
    })().finally(() => {
      hydrationPromise = undefined;
    });

    await hydrationPromise;
  }

  return {
    async get() {
      await hydrate();
      return cached;
    },
    async set(value: T) {
      cached = value;
      hydrated = true;
      cacheVersion += 1;
      await storage.set({ [key]: value });
    },
    hydrate,
  };
}
