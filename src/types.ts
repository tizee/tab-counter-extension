/**
 * Interface for tab host information
 */
export interface HostData {
  number: number;
  favIconUrl?: string;
}

/**
 * Interface for tracking tab creation times
 */
export interface TabTimeData {
  [tabId: number]: number; // tabId -> timestamp (ms since epoch)
}

/**
 * Storage structure for tab times
 */
export interface TabTimeStorage {
  tabCreationTimes: TabTimeData;
}

/**
 * Interface for host display information
 */
export interface HostDisplay {
  hostname: string;
  number: number;
  favIconUrl?: string;
}

/**
 * Detect if we're running in Firefox (browser API is the native one)
 * Firefox also defines 'chrome' as an alias, but 'browser' is the native API
 */
const isFirefox = typeof browser !== 'undefined' && typeof browser.runtime !== 'undefined';

/**
 * Browser compatibility layer to handle differences between Chrome and Firefox APIs
 */
export const browserAPI = {
  tabs: {
    query: (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
      // Firefox: prefer browser API (Promise-based)
      if (isFirefox) {
        return browser.tabs.query(queryInfo);
      }
      // Chrome: use chrome API (also Promise-based in modern Chrome)
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return chrome.tabs.query(queryInfo);
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> => {
      if (isFirefox) {
        return browser.tabs.update(tabId, updateProperties);
      }
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return new Promise((resolve) => {
          chrome.tabs.update(tabId, updateProperties, (tab) => {
            resolve(tab as chrome.tabs.Tab);
          });
        });
      }
      return Promise.reject(new Error('Browser API not available'));
    }
  },
  windows: {
    getCurrent: (): Promise<chrome.windows.Window> => {
      if (isFirefox) {
        return browser.windows.getCurrent();
      }
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.getCurrent((window) => {
            resolve(window);
          });
        });
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    getAll: (getInfo: {populate?: boolean; windowTypes?: chrome.windows.windowTypeEnum[]}): Promise<chrome.windows.Window[]> => {
      if (isFirefox) {
        return browser.windows.getAll(getInfo) as Promise<chrome.windows.Window[]>;
      }
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.getAll(getInfo, (windows) => {
            resolve(windows);
          });
        });
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    update: (windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> => {
      if (isFirefox) {
        return browser.windows.update(windowId, updateInfo);
      }
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.update(windowId, updateInfo, (window) => {
            resolve(window);
          });
        });
      }
      return Promise.reject(new Error('Browser API not available'));
    }
  },
  action: {
    setBadgeText: (details: chrome.action.BadgeTextDetails): Promise<void> => {
      if (isFirefox) {
        // Firefox MV2 uses browserAction
        if (browser.browserAction) {
          return browser.browserAction.setBadgeText(details);
        }
        return Promise.resolve();
      }
      // Chrome
      if (typeof chrome !== 'undefined') {
        if (chrome.action) {
          return new Promise((resolve) => {
            chrome.action.setBadgeText(details, resolve);
          });
        } else if (chrome.browserAction) {
          return new Promise((resolve) => {
            chrome.browserAction.setBadgeText(details, resolve);
          });
        }
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    setBadgeBackgroundColor: (details: chrome.action.BadgeColorDetails): Promise<void> => {
      if (isFirefox) {
        if (browser.browserAction) {
          return browser.browserAction.setBadgeBackgroundColor(details);
        }
        return Promise.resolve();
      }
      if (typeof chrome !== 'undefined') {
        if (chrome.action) {
          return new Promise((resolve) => {
            chrome.action.setBadgeBackgroundColor(details, resolve);
          });
        } else if (chrome.browserAction) {
          return new Promise((resolve) => {
            chrome.browserAction.setBadgeBackgroundColor(details, resolve);
          });
        }
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    setBadgeTextColor: (details: chrome.action.BadgeColorDetails): Promise<void> => {
      if (isFirefox) {
        // Firefox MV2 browserAction doesn't support setBadgeTextColor
        return Promise.resolve();
      }
      if (typeof chrome !== 'undefined' && chrome.action) {
        return new Promise((resolve) => {
          chrome.action.setBadgeTextColor(details, resolve);
        });
      }
      return Promise.resolve();
    }
  },
  storage: {
    local: {
      get: <T>(keys: string | string[]): Promise<T> => {
        if (isFirefox) {
          return browser.storage.local.get(keys) as Promise<T>;
        }
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
              resolve(result as T);
            });
          });
        }
        return Promise.reject(new Error('Storage API not available'));
      },
      set: (items: Record<string, unknown>): Promise<void> => {
        if (isFirefox) {
          return browser.storage.local.set(items);
        }
        if (typeof chrome !== 'undefined' && chrome.storage) {
          return new Promise((resolve) => {
            chrome.storage.local.set(items, resolve);
          });
        }
        return Promise.reject(new Error('Storage API not available'));
      }
    }
  }
};

// Define a browser global for TypeScript
declare global {
  interface Window {
    browser: typeof chrome;
  }
  const browser: typeof chrome;
}
