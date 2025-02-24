// background.js
// Update badge when tabs change
function updateBadge() {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    chrome.action.setBadgeText({ text: tabs.length.toString() });
    chrome.action.setBadgeTextColor({ color: '#F5F5F5' }); // Soft white
    chrome.action.setBadgeBackgroundColor({ color: '#DC3545' }); // Elegant red
  });
}

// Listen for tab events to update badge
chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onAttached.addListener(updateBadge);
chrome.tabs.onDetached.addListener(updateBadge);

// Initial badge update
updateBadge();
