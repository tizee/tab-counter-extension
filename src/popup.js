chrome.tabs.query({ currentWindow: true }, function (tabs) {
  document.getElementById("tabCount").innerHTML = tabs.length;
});
