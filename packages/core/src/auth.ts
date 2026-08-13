import { getBrowserAPI, isFirefox, type BrowserAPI } from "./browserApi.js";

export type CredentialsProvider = () => Promise<
  { username: string; password: string } | undefined
>;

export function registerProxyAuth(
  getCredentials: CredentialsProvider,
  api: BrowserAPI = getBrowserAPI()
): void {

  // Determine the appropriate extraInfoSpec based on browser
  const blockingFlag = isFirefox() ? "blocking" : "asyncBlocking";

  api.webRequest.onAuthRequired.addListener(
    (details, asyncCallback) => {
      // Handle non-proxy requests safely
      if (!details.isProxy) {
        if (asyncCallback) {
          asyncCallback({}); //chrome way
        }
        return{}; //firefox way (returning an empty object to indicate no action)
      }
      // Wrap credentials logic in a promise
      const authPromise = getCredentials()
        .then((credentials) => {
          if (!credentials) return { cancel: true };
          return { authCredentials: credentials };
        })
        .catch(() => {
          return { cancel: true };
        });

      // 4. The Cross-Browser Split
      if (asyncCallback) {
        // CHROME: We have the callback. Wait for the promise, then fire the callback.
        authPromise.then((response) => asyncCallback(response));
        // We explicitly return nothing (void) for Chrome
      } else {
        // FIREFOX: We have no callback. Return the Promise directly!
        return authPromise; 
      }
    },
    { urls: ["<all_urls>"] },
    [blockingFlag] // Use the appropriate blocking flag based on the browser
  );
}
