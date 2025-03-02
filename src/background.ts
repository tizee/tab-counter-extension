/**
 * Background script for Tab Counter extension
 * Handles tab count badge updates
 */
import { browserAPI } from './types';

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
  chrome.tabs.onCreated.addListener(() => updateBadge());
  chrome.tabs.onRemoved.addListener(() => updateBadge());
  chrome.tabs.onAttached.addListener(() => updateBadge());
  chrome.tabs.onDetached.addListener(() => updateBadge());

  // Initial badge update
  updateBadge();
} else if (typeof browser !== 'undefined') {
  // Firefox uses browser API
  browser.tabs.onCreated.addListener(() => updateBadge());
  browser.tabs.onRemoved.addListener(() => updateBadge());
  browser.tabs.onAttached.addListener(() => updateBadge());
  browser.tabs.onDetached.addListener(() => updateBadge());

  // Initial badge update
  updateBadge();
}
