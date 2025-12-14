/**
 * Background script for Tab Counter extension
 * Handles tab count badge updates and tracks tab creation times
 */
import { browserAPI, TabTimeData, TabTimeStorage } from './types';

// Storage key for tab creation times
const TAB_TIMES_KEY = 'tabCreationTimes';

/**
 * Get stored tab creation times
 */
async function getTabTimes(): Promise<TabTimeData> {
  try {
    const result = await browserAPI.storage.local.get<TabTimeStorage>(TAB_TIMES_KEY);
    return result.tabCreationTimes || {};
  } catch {
    return {};
  }
}

/**
 * Save tab creation times to storage
 */
async function saveTabTimes(times: TabTimeData): Promise<void> {
  try {
    await browserAPI.storage.local.set({ [TAB_TIMES_KEY]: times });
  } catch (error) {
    console.error('Error saving tab times:', error);
  }
}

/**
 * Record creation time for a new tab
 */
async function recordTabCreation(tabId: number): Promise<void> {
  const times = await getTabTimes();
  times[tabId] = Date.now();
  await saveTabTimes(times);
}

/**
 * Remove creation time for a closed tab
 */
async function removeTabTime(tabId: number): Promise<void> {
  const times = await getTabTimes();
  delete times[tabId];
  await saveTabTimes(times);
}

/**
 * Initialize tab times for all existing tabs (on extension install/reload)
 */
async function initializeTabTimes(): Promise<void> {
  try {
    const times = await getTabTimes();
    const windows = await browserAPI.windows.getAll({ populate: true, windowTypes: ['normal'] });
    const now = Date.now();

    // Add creation time for tabs that don't have one
    windows.forEach((w) => {
      if (w.tabs) {
        w.tabs.forEach((tab) => {
          if (tab.id && !times[tab.id]) {
            times[tab.id] = now;
          }
        });
      }
    });

    // Clean up times for tabs that no longer exist
    const existingTabIds = new Set<number>();
    windows.forEach((w) => {
      if (w.tabs) {
        w.tabs.forEach((tab) => {
          if (tab.id) existingTabIds.add(tab.id);
        });
      }
    });

    Object.keys(times).forEach((tabIdStr) => {
      const tabId = parseInt(tabIdStr, 10);
      if (!existingTabIds.has(tabId)) {
        delete times[tabId];
      }
    });

    await saveTabTimes(times);
  } catch (error) {
    console.error('Error initializing tab times:', error);
  }
}

/**
 * Updates the badge with the current tab count
 */
async function updateBadge(): Promise<void> {
  try {
    const tabs = await browserAPI.tabs.query({ currentWindow: true });

    // Update badge with tab count
    await browserAPI.action.setBadgeText({
      text: tabs.length.toString()
    });

    // Set badge colors
    await browserAPI.action.setBadgeTextColor({
      color: '#F5F5F5' // Soft white
    });

    await browserAPI.action.setBadgeBackgroundColor({
      color: '#DC3545' // Elegant red
    });
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

// Register event listeners using the appropriate API
if (typeof chrome !== 'undefined') {
  // Chrome uses chrome API
  chrome.tabs.onCreated.addListener((tab) => {
    if (tab.id) recordTabCreation(tab.id);
    updateBadge();
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabTime(tabId);
    updateBadge();
  });
  chrome.tabs.onAttached.addListener(() => updateBadge());
  chrome.tabs.onDetached.addListener(() => updateBadge());

  // Initialize tab times and update badge
  initializeTabTimes();
  updateBadge();
} else if (typeof browser !== 'undefined') {
  // Firefox uses browser API
  browser.tabs.onCreated.addListener((tab) => {
    if (tab.id) recordTabCreation(tab.id);
    updateBadge();
  });
  browser.tabs.onRemoved.addListener((tabId) => {
    removeTabTime(tabId);
    updateBadge();
  });
  browser.tabs.onAttached.addListener(() => updateBadge());
  browser.tabs.onDetached.addListener(() => updateBadge());

  // Initialize tab times and update badge
  initializeTabTimes();
  updateBadge();
}
