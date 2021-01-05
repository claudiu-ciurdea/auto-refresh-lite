function getLastInputIdNumber() {
  const urls = document.getElementById('urls');
  if (urls.childElementCount > 0) {
    const lastChildId = urls.lastElementChild.id;
    const lastNumUsed = parseInt(lastChildId.split('-')[3], 10);
    return lastNumUsed;
  }
  return -1;
}

function addItem(inputNumber, inputValue) {
  const icon = document.createElement('i');
  icon.setAttribute('class', 'icon icon-cross');

  const button = document.createElement('button');
  button.setAttribute('type', 'button');
  button.setAttribute('class', 'btn btn-error input-group-button');
  button.addEventListener('click', (event) => {
    event.target.closest('.input-group').remove();
  });

  const input = document.createElement('input');
  input.setAttribute('type', 'url');
  input.setAttribute('class', 'form-input');
  input.setAttribute('value', inputValue);

  const spanText = document.createTextNode(`${inputNumber + 1}.`);
  const span = document.createElement('span');
  span.setAttribute('class', 'input-group-addon');

  const inputGroupId = `group-input-url-${inputNumber}`;
  const inputGroup = document.createElement('div');
  inputGroup.setAttribute('class', 'input-group my-1');
  inputGroup.setAttribute('id', inputGroupId);

  button.appendChild(icon);
  span.appendChild(spanText);

  inputGroup.appendChild(span);
  inputGroup.appendChild(input);
  inputGroup.appendChild(button);

  const urls = document.getElementById('urls');
  urls.appendChild(inputGroup);
}

function addNewItem() {
  let lastNumberUsed = getLastInputIdNumber();
  lastNumberUsed += 1;
  addItem(lastNumberUsed, '');
}

function clearAll() {
  const parent = document.getElementById('urls');
  while (parent.firstElementChild) {
    parent.firstElementChild.remove();
  }
}

function handleFileImport(e) {
  const file = this.files[0];
  const reader = new FileReader();
  reader.readAsText(file);
  reader.onload = () => {
    const urls = document.getElementById('urls');
    while (urls.lastElementChild !== null && urls.lastElementChild.getElementsByTagName('input')[0].value === '') {
      urls.lastElementChild.remove();
    }
    let lastNumberUsed = getLastInputIdNumber();
    const lines = reader.result.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      if (lines[i] !== '') {
        lastNumberUsed += 1;
        addItem(lastNumberUsed, lines[i]);
      }
    }
    e.target.value = '';
  };
}

function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function exportUrls() {
  const urlInputList = document.querySelectorAll('input[type="url"]');
  let textForDownload = '';
  urlInputList.forEach((input) => {
    textForDownload = textForDownload.concat(input.value);
    textForDownload = textForDownload.concat('\n');
  });
  download('auto-refresh-lite.txt', textForDownload);
}

function saveOptions() {
  const totalReloads = document.getElementById('input-total-reloads').value;
  const timerInterval = document.getElementById('input-timer-interval').value;
  const urlInputList = document.querySelectorAll('input[type="url"]');

  const urlValues = [];
  urlInputList.forEach((input) => {
    if (input.value) {
      urlValues.push(input.value);
    }
  });

  chrome.storage.sync.set({
    urlList: urlValues,
    timerInterval: parseInt(timerInterval, 10),
    totalReloads: parseInt(totalReloads, 10),
  },
  () => {
    const notification = document.getElementById('save-notification');
    notification.classList.remove('fadeOut');
    notification.classList.add('fadeIn');
    setTimeout(() => {
      notification.classList.remove('fadeIn');
      notification.classList.add('fadeOut');
    }, 6000);
  });
}

function restoreOptions() {
  chrome.storage.sync.get('timerInterval', (data) => {
    if (data.timerInterval) {
      document.getElementById('input-timer-interval').value = data.timerInterval;
    }
  });

  chrome.storage.sync.get('totalReloads', (data) => {
    if (data.totalReloads) {
      document.getElementById('input-total-reloads').value = data.totalReloads;
    } else {
      // make it compatible with the previous version where this key was called 'reloads'
      chrome.storage.sync.get('reloads', (bkcompat) => {
        if (bkcompat.reloads) {
          document.getElementById('input-total-reloads').value = bkcompat.reloads;
          chrome.storage.sync.set({
            totalReloads: bkcompat.reloads,
          });
        }
      });
      // end backward compatible code here
    }
  });

  chrome.storage.sync.get('urlList', (data) => {
    if (data.urlList && data.urlList.length > 0) {
      for (let i = 0; i < data.urlList.length; i += 1) {
        addItem(i, data.urlList[i]);
      }
    } else {
      // make it compatible with the previous version where this key was called 'urls'
      chrome.storage.sync.get('urls', (bkcompat) => {
        if (bkcompat.urls && bkcompat.urls.length > 0) {
          for (let i = 0; i < bkcompat.urls.length; i += 1) {
            addItem(i, bkcompat.urls[i]);
          }
          chrome.storage.sync.set({
            urlList: bkcompat.urls,
          });
          // end backward compatible code here, the else below should remain
        } else {
          const x = getLastInputIdNumber();
          if (x < 0) {
            addItem(0, '');
          }
        }
      });
    }
  });
}

window.addEventListener('load', () => {
  restoreOptions();

  document.getElementById('btn-url-add-new').addEventListener('click', addNewItem);
  document.getElementById('btn-url-clear-all').addEventListener('click', clearAll);
  document.getElementById('btn-url-import').addEventListener('click', () => {
    document.getElementById('input-file').click();
  });
  document.getElementById('btn-url-export').addEventListener('click', exportUrls);
  document.getElementById('btn-options-save').addEventListener('click', saveOptions);
  document.getElementById('btn-options-reset').addEventListener('click', restoreOptions);
  document.getElementById('input-file').addEventListener('change', handleFileImport);
  document.getElementById('save-notification-button').addEventListener('click', () => {
    const notification = document.getElementById('save-notification');
    notification.classList.remove('fadeIn');
    notification.classList.add('fadeOut');
  });
});
