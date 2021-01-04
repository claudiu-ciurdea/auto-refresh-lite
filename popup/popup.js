const backgroundPage = chrome.extension.getBackgroundPage();
let updateBadgeIntervalId = null;

function restoreOptionsInPopup() {
  chrome.storage.sync.get('totalReloads', (data) => {
    if (data.totalReloads) {
      document.getElementById('label-total-reloads').innerText = data.totalReloads;
    }
  });
  chrome.storage.sync.get('timerInterval', (data) => {
    if (data.timerInterval) {
      document.getElementById('label-timer').innerText = data.timerInterval;
    }
  });
  chrome.storage.sync.get('urlList', (data) => {
    if (data.urlList) {
      document.getElementById('label-total-urls').innerText = data.urlList.length;
    }
  });
}

function updateRemainingReloads() {
  updateBadgeIntervalId = setInterval(() => {
    const remaining = backgroundPage.getRemainingReloads();
    document.getElementById('label-remaining-reloads').innerText = remaining;
  }, 1000);
}

function appendHttpToUrl(url) {
  if (url.indexOf('http') === 0) {
    return url;
  }
  return `http://${url}`;
}

function addCurrentPageToUrlList() {
  chrome.tabs.getSelected(null, (tab) => {
    chrome.storage.sync.get('urlList', (data) => {
      let urlList = [];
      if (data.urlList) {
        urlList = data.urlList;
      }
      const fullUrl = appendHttpToUrl(tab.url);
      urlList.push(fullUrl);
      chrome.storage.sync.set({ urlList });
      document.getElementById('label-total-urls').innerText = urlList.length;
    });
  });
}

window.addEventListener('load', () => {
  document.getElementById('btn-start').addEventListener('click', () => {
    backgroundPage.start();
  });
  document.getElementById('btn-stop').addEventListener('click', () => {
    backgroundPage.stop();
    clearInterval(updateBadgeIntervalId);
    document.getElementById('label-remaining-reloads').innerText = 0;
  });
  document.getElementById('btn-open-options').addEventListener('click', () => {
    const optionsUrl = chrome.extension.getURL('options/options.html');
    chrome.tabs.create({ url: optionsUrl });
  });
  document.getElementById('btn-add-current-page').addEventListener('click', addCurrentPageToUrlList);

  restoreOptionsInPopup();

  const remaining = backgroundPage.getRemainingReloads();
  document.getElementById('label-remaining-reloads').innerText = remaining;
  updateRemainingReloads();
});
