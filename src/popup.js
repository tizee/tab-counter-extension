browser.tabs.query({currentWindow: true}, function (tabs) {
  document.getElementById("currentCount").innerHTML = tabs.length;
});
browser.windows.getAll({
  populate: true,
  windowTypes: ["normal"],
})
  .then((windows) => {
    let count = 0;
    let hosts = new Map();
    windows.forEach((w) => {
      count += w.tabs.length;
      w.tabs.forEach((tab) => {
        // count number of host in each window
        let url = new URL(tab.url);
        if (!hosts.get(url.hostname)) {
          hosts.set(url.hostname, {number: 1, favIconUrl: tab.favIconUrl});
        } else {
          let newState = {number: hosts.get(url.hostname).number + 1, favIconUrl: tab.favIconUrl};
          hosts.set(url.hostname, newState);
        }
      });
    });
    document.getElementById("allCount").innerHTML = count;
    // tab number of each host
    let htmlStr = '';
    hosts.forEach((val, key, map) => {
      htmlStr += `<li><img src="${val.favIconUrl}" style="width: 1.5rem; height: 1.5rem; display: inline;"><span>${key} -> ${val.number}<span></li>`;
    });
    document.getElementById("hosts").innerHTML = htmlStr;
  });
