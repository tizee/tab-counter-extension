/**
 * Popup script for Tab Counter extension
 * Displays tab statistics and groups tabs by host
 */
import { browserAPI, HostData, HostDisplay } from './types';

// Store tabs data globally for easy access
const tabsByHost = new Map<string, chrome.tabs.Tab[]>();

// Store current window ID
let currentWindowId: number | undefined;

/**
 * Initialize the popup
 */
async function initPopup(): Promise<void> {
  try {
    // Get current window ID when popup opens
    const window = await browserAPI.windows.getCurrent();
    currentWindowId = window.id;

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

  const hostsContainer = document.getElementById('hosts');
  if (!hostsContainer) return;

  hostsContainer.innerHTML = '';

  sortedHosts.forEach(item => {
    const tabs = tabsByHost.get(item.hostname);
    if (!tabs || tabs.length === 0) return;

    const hostElement = document.createElement('li');
    hostElement.className = 'host-item';

    hostElement.innerHTML = `
      <div class="host-header">
        <img class="host-icon" src="${item.favIconUrl || 'icons/icon16.png'}" alt="">
        <div class="host-info">
          <div class="host-name">${item.hostname}</div>
          <div class="host-count">${item.number} tab${item.number > 1 ? 's' : ''}</div>
        </div>
      </div>
      <ul class="tabs-list">
        ${tabs.map(tab => `
          <li class="tab-item" data-tab-id="${tab.id}">
            <div class="tab-status ${tab.windowId === currentWindowId ? 'active' : ''}"></div>
            <img class="tab-favicon" src="${tab.favIconUrl || 'icons/icon16.png'}" alt="">
            <span class="tab-title">${tab.title || 'Untitled'}</span>
          </li>
        `).join('')}
      </ul>
    `;

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

    const tabElements = hostElement.querySelectorAll('.tab-item');
    tabElements.forEach(tabElement => {
      tabElement.addEventListener('click', async (e) => {
        e.stopPropagation();
        const tabIdStr = tabElement.getAttribute('data-tab-id');
        if (!tabIdStr) return;

        const tabId = parseInt(tabIdStr, 10);
        if (isNaN(tabId)) return;

        try {
          // Activate the tab
          await browserAPI.tabs.update(tabId, { active: true });

          // Find the tab's window and focus it
          const tabInfo = tabs.find(t => t.id === tabId);
          if (tabInfo && tabInfo.windowId) {
            await browserAPI.windows.update(tabInfo.windowId, { focused: true });
          }
        } catch (error) {
          console.error('Error activating tab:', error);
        }
      });
    });

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
