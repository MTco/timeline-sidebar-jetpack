'use strict';

const { Cu } = require('chrome');
const { Sidebar } = require('sdk/ui/sidebar');
const { data } = require('sdk/self');
const { getMostRecentBrowserWindow } = require('sdk/window/utils');
const { window } = require('sdk/addon/window');
const { encode } = require('sdk/base64');
const { defer } = require('sdk/core/promise');
const tabs = require('sdk/tabs');
const { getTabForId, getBrowserForTab } = require('sdk/tabs/utils');

const { PageThumbs } = Cu.import('resource://gre/modules/PageThumbs.jsm', {});

// hack to make window.document.body a thing
window.document.location = 'about:blank';

let workers = new WeakMap();

Sidebar({
  id: 'timeline-sidebar',
  title: 'Timeline',
  url: data.url('index.html'),
  onShow: _ => {
    // HACK: expand width
    let sidebar = getMostRecentBrowserWindow().document.getElementById('sidebar-box');
    sidebar.setAttribute('width', '500');
  },
  onAttach: function(worker) {
    workers.set(getMostRecentBrowserWindow(), worker);
    worker.port.on('click', details => {
      let window = getMostRecentBrowserWindow();
      window.gBrowser.webNavigation.gotoIndex(details.index);
    });
    worker.port.on('load', function() {
      let window = getMostRecentBrowserWindow();
      let sessionHistory = window.gBrowser.webNavigation.sessionHistory;

      for (let j = sessionHistory.count - 1; j >= 0; j--) {
        let entry = sessionHistory.getEntryAtIndex(j, false);
        let url = entry.URI.spec;
        let index = j;
        getThumbnail(url).then(function(imageURL) {
          worker.port.emit('new-history-item', {
            uri: url,
            title: entry.title || url,
            index: index,
            thumbnail: imageURL
          });
        });
      }
    });
  },
  onHide: function() {
    let window = getMostRecentBrowserWindow();
    workers.delete(window);
  }
});

function getThumbnail(url) {
  let { promise, resolve } = defer();
  let { document } = window;

  let img = new window.Image();
  img.onload = function() {
    let canvas = document.createElement('canvas');
    canvas.height = img.height;
    canvas.width = img.width;
    window.document.body.appendChild(canvas);
    canvas.getContext("2d").drawImage(img, 0, 0);
    resolve(canvas.toDataURL());
  };
  img.onerror = function() {
    // TODO
  };
  img.src = PageThumbs.getThumbnailURL(url);
  return promise;
}

function captureTab(tab) {
  let browser = getBrowserForTab(getTabForId(tab.id));
  PageThumbs.captureAndStore(browser);
}

let activeTab = tabs.activeTab;
tabs.on('activate', activateTab);
function watchTab(tab) {
  let window = getMostRecentBrowserWindow();
  let worker = workers.get(window);
  if (!worker) return;
  worker.port.emit('reset');
}
function activateTab(tab) {
  activeTab && activeTab.removeListener('load', watchTab);
  activeTab = tab;
  watchTab(tab);
  tab.on('load', watchTab);
}
activateTab(activeTab);

tabs.on('activate', captureTab);
tabs.on('pageshow', captureTab);
tabs.on('ready', captureTab);
tabs.on('load', captureTab);
tabs.open('https://nytimes.com');
