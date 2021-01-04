/*! @license
 * Auto Refresh Lite: v2.0
 * MIT License
 * Copyright (c) 2020 Claudiu Ciurdea
 */

let secondsTotal;
let secondsRemaining;

let reloadsTotal;
let reloadsRemaining = 0;

let intervalId;

let urlList = [];

async function readOptions() {
  const p1 = new Promise((resolve, reject) => {
    chrome.storage.sync.get('timerInterval', (data) => {
      if (data.timerInterval) {
        secondsTotal = data.timerInterval;
        resolve();
      } else {
        reject();
      }
    });
  });
  const p2 = new Promise((resolve, reject) => {
    chrome.storage.sync.get('totalReloads', (data) => {
      if (data.totalReloads) {
        reloadsTotal = data.totalReloads;
        reloadsRemaining = reloadsTotal;
        resolve();
      } else {
        reject();
      }
    });
  });
  const p3 = new Promise((resolve, reject) => {
    chrome.storage.sync.get('urlList', (data) => {
      if (data.urlList) {
        urlList = data.urlList;
        resolve();
      } else {
        urlList = [];
        reject();
      }
    });
  });
  await Promise.all([p1, p2, p3]);
}

async function createTabs() {
  await readOptions();

  if (urlList.length === 0) {
    return [];
  }

  const tabIds = [];
  const tabPromises = urlList.map((myUrl) => new Promise((resolve) => {
    chrome.tabs.create({ url: myUrl }, (tab) => {
      tabIds.push(parseInt(tab.id, 10));
      resolve();
    });
  }));
  await Promise.all(tabPromises);
  return tabIds;
}

function showBadgeText(textToShow) {
  if (textToShow === null || typeof (textToShow) === 'undefined') return;
  chrome.browserAction.setBadgeText({
    text: textToShow.toString(),
  });
}

function refreshTabs(tabIds) {
  tabIds.forEach((tabId) => {
    chrome.tabs.reload(tabId);
  });
}

// eslint-disable-next-line no-unused-vars
function getRemainingReloads() {
  return reloadsRemaining;
}

function stop() {
  clearInterval(intervalId);
  reloadsRemaining = 0;
  showBadgeText('');
}

// eslint-disable-next-line no-unused-vars
async function start() {
  const tabIds = await createTabs();
  if (tabIds.length === 0) {
    // eslint-disable-next-line no-alert
    alert('There are no URLs in your list');
    return;
  }

  secondsRemaining = secondsTotal;
  reloadsRemaining = reloadsTotal - 1;

  showBadgeText(secondsRemaining);

  setTimeout(() => {
    intervalId = setInterval(() => {
      secondsRemaining -= 1;
      if (secondsRemaining <= 0) {
        refreshTabs(tabIds);
        reloadsRemaining -= 1;
        if (reloadsRemaining <= 0) {
          stop();
        } else {
          secondsRemaining = secondsTotal;
        }
      }
      if (reloadsRemaining > 0) {
        showBadgeText(secondsRemaining);
      }
    }, 1000);
  }, 1000);
}
