chrome.browserAction.onClicked.addListener(function () {
  chrome.tabs.query({ currentWindow: true }, function (tabs) {
    chrome.browserAction.setBadgeText({ text: tabs.length.toString() });
  });
});
