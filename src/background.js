// background.js
// Update badge when tabs change
function updateBadge() {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    chrome.action.setBadgeText({ text: tabs.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#007AFF' }); // Apple-style blue
  });
}

// Listen for tab events to update badge
chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onAttached.addListener(updateBadge);
chrome.tabs.onDetached.addListener(updateBadge);

// Initial badge update
updateBadge();
