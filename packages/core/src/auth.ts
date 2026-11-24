import { getBrowserAPI, isFirefox, type BrowserAPI } from "./browserApi.js";

export type CredentialsProvider = () => Promise<
  { username: string; password: string } | undefined
>;

export function registerProxyAuth(
  getCredentials: CredentialsProvider,
  api: BrowserAPI = getBrowserAPI()
): void {
  const blockingFlag = isFirefox() ? "blocking" : "asyncBlocking";

  api.webRequest.onAuthRequired.addListener(
    (details, asyncCallback) => {
      if (!details.isProxy) {
        if (asyncCallback) {
          asyncCallback({});
          return;
        }
        return {};
      }

      const authPromise = getCredentials()
        .then((credentials) => {
          if (!credentials) return { cancel: true };
          return { authCredentials: credentials };
        })
        .catch(() => {
          return { cancel: true };
        });

      if (asyncCallback) {
        authPromise.then((response) => asyncCallback(response));
      } else {
        return authPromise;
      }
    },
    { urls: ["<all_urls>"] },
    [blockingFlag]
  );
}
