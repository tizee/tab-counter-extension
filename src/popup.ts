/**
 * Popup script for Tab Counter extension
 * Displays tab statistics and groups tabs by host
 */
import { browserAPI, HostData, HostDisplay, TabTimeData, TabTimeStorage } from './types';

// Storage key for tab creation times
const TAB_TIMES_KEY = 'tabCreationTimes';

// Store tabs data globally for easy access
const tabsByHost = new Map<string, chrome.tabs.Tab[]>();

// Store tab creation times
let tabCreationTimes: TabTimeData = {};

// Store current window ID
let currentWindowId: number | undefined;

/**
 * Format a timestamp into a human-readable relative time string
 * e.g., "5s ago", "3m 20s ago", "2h 15m ago", "1d 5h ago"
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - timestamp);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    if (remainingHours > 0) {
      return `${days}d ${remainingHours}h ago`;
    }
    return `${days}d ago`;
  }

  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    if (remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}m ago`;
    }
    return `${hours}h ago`;
  }

  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    if (remainingSeconds > 0 && minutes < 10) {
      return `${minutes}m ${remainingSeconds}s ago`;
    }
    return `${minutes}m ago`;
  }

  return `${seconds}s ago`;
}

/**
 * Get tab creation time from storage
 */
async function getTabCreationTimes(): Promise<TabTimeData> {
  try {
    const result = await browserAPI.storage.local.get<TabTimeStorage>(TAB_TIMES_KEY);
    return result.tabCreationTimes || {};
  } catch {
    return {};
  }
}

/**
 * Initialize the popup
 */
async function initPopup(): Promise<void> {
  try {
    // Get current window ID when popup opens
    const window = await browserAPI.windows.getCurrent();
    currentWindowId = window.id;

    // Load tab creation times from storage
    tabCreationTimes = await getTabCreationTimes();

    // Get number of tabs in current window
    const currentWindowTabs = await browserAPI.tabs.query({ currentWindow: true });
    const currentCountElement = document.getElementById('currentCount');
    if (currentCountElement) {
      currentCountElement.innerHTML = currentWindowTabs.length.toString();
    }

    // Count number of tabs for all windows
    const windows = await browserAPI.windows.getAll({
      populate: true,
      windowTypes: ['normal'],
    });

    let totalCount = 0;
    const hosts = new Map<string, HostData>();
    tabsByHost.clear();

    windows.forEach((w) => {
      if (w.tabs) {
        totalCount += w.tabs.length;
        w.tabs.forEach((tab) => {
          if (tab.url) {
            try {
              const url = new URL(tab.url);

              // Store tab information by host
              if (!tabsByHost.has(url.hostname)) {
                tabsByHost.set(url.hostname, []);
              }
              const hostTabs = tabsByHost.get(url.hostname);
              if (hostTabs) {
                hostTabs.push(tab);
              }

              // Update hosts count
              if (!hosts.has(url.hostname)) {
                hosts.set(url.hostname, { number: 1, favIconUrl: tab.favIconUrl });
              } else {
                const hostData = hosts.get(url.hostname);
                if (hostData) {
                  const newState: HostData = {
                    number: hostData.number + 1,
                    favIconUrl: tab.favIconUrl || hostData.favIconUrl
                  };
                  hosts.set(url.hostname, newState);
                }
              }
            } catch (e) {
              console.error('Error processing tab URL:', e);
            }
          }
        });
      }
    });

    const allCountElement = document.getElementById('allCount');
    if (allCountElement) {
      allCountElement.innerHTML = totalCount.toString();
    }

    updateHostsList(hosts);
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
}

/**
 * Updates the hosts list UI
 * @param hosts Map of hosts and their data
 */
function updateHostsList(hosts: Map<string, HostData>): void {
  const sortedHosts: HostDisplay[] = Array.from(hosts.entries())
    .sort((a, b) => b[1].number - a[1].number)
    .map(([hostname, data]) => ({
      hostname,
      ...data
    }));

  // Update host count badge
  const hostCountElement = document.getElementById('hostCount');
  if (hostCountElement) {
    hostCountElement.textContent = `${sortedHosts.length} host${sortedHosts.length !== 1 ? 's' : ''}`;
  }

  const hostsContainer = document.getElementById('hosts');
  if (!hostsContainer) return;

  // Clear container using DOM method
  while (hostsContainer.firstChild) {
    hostsContainer.removeChild(hostsContainer.firstChild);
  }

  sortedHosts.forEach(item => {
    const tabs = tabsByHost.get(item.hostname);
    if (!tabs || tabs.length === 0) return;

    const hostElement = document.createElement('li');
    hostElement.className = 'host-item';

    // Build host header
    const hostHeader = document.createElement('div');
    hostHeader.className = 'host-header';

    const hostIcon = document.createElement('img');
    hostIcon.className = 'host-icon';
    hostIcon.src = item.favIconUrl || 'icons/icon16.png';
    hostIcon.alt = '';

    const hostInfo = document.createElement('div');
    hostInfo.className = 'host-info';

    const hostName = document.createElement('div');
    hostName.className = 'host-name';
    hostName.textContent = item.hostname;

    const hostMeta = document.createElement('div');
    hostMeta.className = 'host-meta';

    const hostCount = document.createElement('span');
    hostCount.className = 'host-count';
    hostCount.textContent = `${item.number} tab${item.number > 1 ? 's' : ''}`;

    hostMeta.appendChild(hostCount);
    hostInfo.appendChild(hostName);
    hostInfo.appendChild(hostMeta);

    const expandIndicator = document.createElement('div');
    expandIndicator.className = 'expand-indicator';
    expandIndicator.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>';

    hostHeader.appendChild(hostIcon);
    hostHeader.appendChild(hostInfo);
    hostHeader.appendChild(expandIndicator);

    // Build tabs list
    const tabsList = document.createElement('ul');
    tabsList.className = 'tabs-list';

    tabs.forEach(tab => {
      const tabItem = document.createElement('li');
      tabItem.className = 'tab-item';
      if (tab.id) {
        tabItem.setAttribute('data-tab-id', tab.id.toString());
      }

      const tabStatus = document.createElement('div');
      tabStatus.className = `tab-status${tab.windowId === currentWindowId ? ' active' : ''}`;

      const tabFavicon = document.createElement('img');
      tabFavicon.className = 'tab-favicon';
      tabFavicon.src = tab.favIconUrl || 'icons/icon16.png';
      tabFavicon.alt = '';

      const tabContent = document.createElement('div');
      tabContent.className = 'tab-content';

      const tabTitle = document.createElement('span');
      tabTitle.className = 'tab-title';
      tabTitle.textContent = tab.title || 'Untitled';

      const tabAge = document.createElement('span');
      tabAge.className = 'tab-age';
      const creationTime = tab.id ? tabCreationTimes[tab.id] : undefined;
      tabAge.textContent = creationTime ? formatRelativeTime(creationTime) : 'just now';

      tabContent.appendChild(tabTitle);
      tabContent.appendChild(tabAge);

      tabItem.appendChild(tabStatus);
      tabItem.appendChild(tabFavicon);
      tabItem.appendChild(tabContent);

      // Add click handler for tab
      tabItem.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tabId = tab.id;
        if (!tabId) return;

        try {
          await browserAPI.tabs.update(tabId, { active: true });
          if (tab.windowId) {
            await browserAPI.windows.update(tab.windowId, { focused: true });
          }
        } catch (error) {
          console.error('Error activating tab:', error);
        }
      });

      tabsList.appendChild(tabItem);
    });

    hostElement.appendChild(hostHeader);
    hostElement.appendChild(tabsList);

    // Add click handlers
    const headerElement = hostElement.querySelector('.host-header');
    if (headerElement) {
      headerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabsList = hostElement.querySelector('.tabs-list');
        if (!tabsList) return;

        const isExpanded = hostElement.classList.contains('expanded');

        // Toggle current item
        hostElement.classList.toggle('expanded');

        if (!isExpanded) {
          // Expanding
          const tabsListHeight = tabsList.scrollHeight;
          (tabsList as HTMLElement).style.maxHeight = tabsListHeight + 'px';

          // Scroll the expanded item into view if needed
          setTimeout(() => {
            const hostsList = document.querySelector('.hosts-list');
            if (!hostsList) return;

            const hostElementRect = hostElement.getBoundingClientRect();
            const hostsListRect = hostsList.getBoundingClientRect();

            if (hostElementRect.bottom > hostsListRect.bottom) {
              const scrollOffset = hostElementRect.bottom - hostsListRect.bottom;
              hostsList.scrollBy({
                top: scrollOffset + 16, // Adding some padding
                behavior: 'smooth'
              });
            }
          }, 50);
        } else {
          // Collapsing
          (tabsList as HTMLElement).style.maxHeight = '0';
        }
      });
    }

    hostsContainer.appendChild(hostElement);
  });
}

// Handle window resize to adjust expanded items
window.addEventListener('resize', () => {
  const expandedItem = document.querySelector('.host-item.expanded');
  if (expandedItem) {
    const tabsList = expandedItem.querySelector('.tabs-list');
    if (tabsList) {
      (tabsList as HTMLElement).style.maxHeight = tabsList.scrollHeight + 'px';
    }
  }
});

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', initPopup);
