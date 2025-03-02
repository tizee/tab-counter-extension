/**
 * Interface for tab host information
 */
export interface HostData {
  number: number;
  favIconUrl?: string;
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
 * Browser compatibility layer to handle differences between Chrome and Firefox APIs
 */
export const browserAPI = {
  tabs: {
    query: (queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
      // Use chrome API if available, otherwise fall back to browser API for Firefox
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return chrome.tabs.query(queryInfo);
      } else if (typeof browser !== 'undefined' && browser.tabs) {
        return browser.tabs.query(queryInfo);
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    update: (tabId: number, updateProperties: chrome.tabs.UpdateProperties): Promise<chrome.tabs.Tab> => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        return new Promise((resolve) => {
          chrome.tabs.update(tabId, updateProperties, (tab) => {
            resolve(tab as chrome.tabs.Tab);
          });
        });
      } else if (typeof browser !== 'undefined' && browser.tabs) {
        return browser.tabs.update(tabId, updateProperties);
      }
      return Promise.reject(new Error('Browser API not available'));
    }
  },
  windows: {
    getCurrent: (): Promise<chrome.windows.Window> => {
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.getCurrent((window) => {
            resolve(window);
          });
        });
      } else if (typeof browser !== 'undefined' && browser.windows) {
        return browser.windows.getCurrent();
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    getAll: (getInfo: {populate?: boolean; windowTypes?: chrome.windows.windowTypeEnum[]}): Promise<chrome.windows.Window[]> => {
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.getAll(getInfo, (windows) => {
            resolve(windows);
          });
        });
      } else if (typeof browser !== 'undefined' && browser.windows) {
        return browser.windows.getAll(getInfo) as Promise<chrome.windows.Window[]>;
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    update: (windowId: number, updateInfo: chrome.windows.UpdateInfo): Promise<chrome.windows.Window> => {
      if (typeof chrome !== 'undefined' && chrome.windows) {
        return new Promise((resolve) => {
          chrome.windows.update(windowId, updateInfo, (window) => {
            resolve(window);
          });
        });
      } else if (typeof browser !== 'undefined' && browser.windows) {
        return browser.windows.update(windowId, updateInfo);
      }
      return Promise.reject(new Error('Browser API not available'));
    }
  },
  action: {
    setBadgeText: (details: chrome.action.BadgeTextDetails): Promise<void> => {
      if (typeof chrome !== 'undefined') {
        if (chrome.action) {
          // Chrome MV3
          return new Promise((resolve) => {
            chrome.action.setBadgeText(details, resolve);
          });
        } else if (chrome.browserAction) {
          // Chrome MV2
          return new Promise((resolve) => {
            chrome.browserAction.setBadgeText(details, resolve);
          });
        }
      } else if (typeof browser !== 'undefined') {
        if (browser.action) {
          // Firefox MV3
          return browser.action.setBadgeText(details);
        } else if (browser.browserAction) {
          // Firefox MV2
          return browser.browserAction.setBadgeText(details);
        }
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    setBadgeBackgroundColor: (details: chrome.action.BadgeColorDetails): Promise<void> => {
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
      } else if (typeof browser !== 'undefined') {
        if (browser.action) {
          return browser.action.setBadgeBackgroundColor(details);
        } else if (browser.browserAction) {
          return browser.browserAction.setBadgeBackgroundColor(details);
        }
      }
      return Promise.reject(new Error('Browser API not available'));
    },
    setBadgeTextColor: (details: chrome.action.BadgeColorDetails): Promise<void> => {
      if (typeof chrome !== 'undefined' && chrome.action) {
        return new Promise((resolve) => {
          chrome.action.setBadgeTextColor(details, resolve);
        });
      } else if (typeof browser !== 'undefined' && browser.action) {
        return browser.action.setBadgeTextColor(details);
      }
      // For MV2 browsers that don't support setBadgeTextColor, silently succeed
      return Promise.resolve();
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
