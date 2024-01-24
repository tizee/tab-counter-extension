browser.tabs.query({ currentWindow: true }, function (tabs) {
  document.getElementById("currentCount").innerHTML = tabs.length;
});
browser.windows.getAll({
  populate: true,
  windowTypes: ["normal"],})
  .then((windows) => {
  let count = 0;
  windows.forEach((w) => {
    count += w.tabs.length;
  });
  document.getElementById("allCount").innerHTML = count;
});
