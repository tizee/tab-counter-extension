// Store tabs data globally for easy access
let tabsByHost = new Map();

// get number of tabs in current window
browser.tabs.query({currentWindow: true}, function (tabs) {
  document.getElementById("currentCount").innerHTML = tabs.length;
});

// count number of tabs for all windows
browser.windows.getAll({
  populate: true,
  windowTypes: ["normal"],
})
  .then((windows) => {
    let count = 0;
    let hosts = new Map();
    tabsByHost = new Map();

    windows.forEach((w) => {
      count += w.tabs.length;
      w.tabs.forEach((tab) => {
        let url = new URL(tab.url);
        
        // Store tab information by host
        if (!tabsByHost.has(url.hostname)) {
          tabsByHost.set(url.hostname, []);
        }
        tabsByHost.get(url.hostname).push(tab);

        // Update hosts count
        if (!hosts.get(url.hostname)) {
          hosts.set(url.hostname, {number: 1, favIconUrl: tab.favIconUrl});
        } else {
          let newState = {
            number: hosts.get(url.hostname).number + 1,
            favIconUrl: tab.favIconUrl
          };
          hosts.set(url.hostname, newState);
        }
      });
    });
    
    document.getElementById("allCount").innerHTML = count;
    updateHostsList(hosts);
  });

function updateHostsList(hosts) {
  const sortedHosts = Array.from(hosts.entries())
    .sort((a, b) => b[1].number - a[1].number)
    .map(([hostname, data]) => ({
      hostname,
      ...data
    }));

  const hostsContainer = document.getElementById("hosts");
  hostsContainer.innerHTML = '';

  sortedHosts.forEach(item => {
    const tabs = tabsByHost.get(item.hostname);
    const hostElement = document.createElement('li');
    hostElement.className = 'host-item';
    
    hostElement.innerHTML = `
      <div class="host-header">
        <img class="host-icon" src="${item.favIconUrl || 'icons/icon16.png'}" alt="">
        <div class="host-info">
          <div class="host-name">${item.hostname}</div>
          <div class="host-count">${item.number} tab${item.number > 1 ? 's' : ''}</div>
        </div>
        <svg class="expand-icon" width="12" height="12" viewBox="0 0 12 12">
          <path fill="currentColor" d="M6 8L2 4h8l-4 4z"/>
        </svg>
      </div>
      <ul class="tabs-list">
        ${tabs.map(tab => `
          <li class="tab-item" data-tab-id="${tab.id}">
            <img class="tab-favicon" src="${tab.favIconUrl || 'icons/icon16.png'}" alt="">
            <span class="tab-title">${tab.title}</span>
          </li>
        `).join('')}
      </ul>
    `;

    // Add click handlers
    hostElement.querySelector('.host-header').addEventListener('click', (e) => {
      e.stopPropagation();
      hostElement.classList.toggle('expanded');
    });

    hostElement.querySelectorAll('.tab-item').forEach(tabElement => {
      tabElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = parseInt(tabElement.dataset.tabId);
        browser.tabs.update(tabId, { active: true });
        browser.windows.update(tabs.find(t => t.id === tabId).windowId, { focused: true });
      });
    });

    hostsContainer.appendChild(hostElement);
  });
}
