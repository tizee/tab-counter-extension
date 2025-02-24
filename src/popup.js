// Store tabs data globally for easy access
let tabsByHost = new Map();

// Store current window ID
let currentWindowId;

// Get current window ID when popup opens
browser.windows.getCurrent().then(window => {
  currentWindowId = window.id;
});

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
      </div>
      <ul class="tabs-list">
        ${tabs.map(tab => `
          <li class="tab-item" data-tab-id="${tab.id}">
            <div class="tab-status ${tab.windowId === currentWindowId ? 'active' : ''}"></div>
            <img class="tab-favicon" src="${tab.favIconUrl || 'icons/icon16.png'}" alt="">
            <span class="tab-title">${tab.title}</span>
          </li>
        `).join('')}
      </ul>
    `;

    // Add click handlers
    hostElement.querySelector('.host-header').addEventListener('click', (e) => {
      e.stopPropagation();
      const tabsList = hostElement.querySelector('.tabs-list');
      const isExpanded = hostElement.classList.contains('expanded');
      
      // Toggle current item without closing others
      hostElement.classList.toggle('expanded');
      
      if (!isExpanded) {
        // Expanding
        const tabsListHeight = tabsList.scrollHeight;
        tabsList.style.maxHeight = tabsListHeight + 'px';
        
        // Scroll the expanded item into view if needed
        setTimeout(() => {
          const hostsList = document.querySelector('.hosts-list');
          const hostElementRect = hostElement.getBoundingClientRect();
          const hostsListRect = hostsList.getBoundingClientRect();
          
          if (hostElementRect.bottom > hostsListRect.bottom) {
            const scrollOffset = hostElementRect.bottom - hostsListRect.bottom;
            hostsList.scrollBy({
              top: scrollOffset + 16, // Adding some padding
              behavior: 'smooth'
            });
          }
        }, 50);
      } else {
        // Collapsing
        tabsList.style.maxHeight = '0';
      }
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

// Add this at the end of your popup.js file
window.addEventListener('resize', () => {
  const expandedItem = document.querySelector('.host-item.expanded');
  if (expandedItem) {
    const tabsList = expandedItem.querySelector('.tabs-list');
    tabsList.style.maxHeight = tabsList.scrollHeight + 'px';
  }
});
