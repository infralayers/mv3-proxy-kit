import { getBrowserAPI, type BrowserAPI } from "./browserApi.js";

export type CredentialsProvider = () => Promise<
  { username: string; password: string } | undefined
>;

export function registerProxyAuth(
  getCredentials: CredentialsProvider,
  api: BrowserAPI = getBrowserAPI()
): void {
  api.webRequest.onAuthRequired.addListener(
    (details, asyncCallback) => {
      if (!details.isProxy) {
        asyncCallback({});
        return;
      }
      getCredentials()
        .then((credentials) => {
          if (!credentials) {
            asyncCallback({ cancel: true });
            return;
          }
          asyncCallback({ authCredentials: credentials });
        })
        .catch(() => {
          asyncCallback({ cancel: true });
        });
    },
    { urls: ["<all_urls>"] },
    ["asyncBlocking"]
  );
}
