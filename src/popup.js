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
    // sort on descending order
    sorted_hosts = new Array(hosts.size);
    cur_len = 0;
    hosts.forEach((val, key, map) => {
      let idx = sorted_hosts.findIndex((item, idx, arr) => {
        if (item != undefined) {
          if (item.val.number < val.number) {
            return true;
          }
        }
        return false;
      });
      if (idx != -1) {
        for (let i = cur_len; i > idx; i--) {
          sorted_hosts[i] = sorted_hosts[i - 1];
        }
        sorted_hosts[idx] = {val, key};
      } else {
        sorted_hosts[cur_len] = {val, key};
      }
      cur_len++;
    });

    sorted_hosts.forEach((item, idx, arr) => {
      htmlStr += `<li><img src="${item.val.favIconUrl}" style="width: 1.5rem; height: 1.5rem; display: inline;"><span>${item.key} -> ${item.val.number}<span></li>`;
      // binary search
    });
    document.getElementById("hosts").innerHTML = htmlStr;
  });
