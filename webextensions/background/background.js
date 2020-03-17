/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';

import * as Core from './core.js';

configs.$loaded.then(Core.init);

let mLastSearchText = null;
let mLastSearchResultPlaces = null;

const ONE_DAY_IN_MSEC = 1000 * 60 * 60 * 24;

let mStart = 0;
function measure(...messages) {
  const now = Date.now();
  console.log(`${now - mStart} msec `, ...messages);
}

/*
bookmarks.query()やhistory.search()がOR検索をサポートしていない中で、Migemo検索をやる。
基本的にこれらの処理は遅いので、馬鹿正直にすべての単語を検索すると非常に遅くなってしまう。
仮に偽陽性が多くなるとしても、なるべく短い検索クエリで検索をかけて、正規表現にマッチするかどうかで後からふるい落とした方が高速になる。
 */
browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  text = text.trim();
  console.log('onInputChanged: ', text);

  if (text.length < 3) {
    console.log('too short input');
    setProgress(1);
    return suggest([]);
  }

  setProgress(0);
  mStart = Date.now();
  // shortest:trueにより、共通部分だけを抽出した単語一覧を得る。
  const expandedTerms = Array.from(new Set(Core.expandInput(text.trim(), { shortest: true }).flat()));
  measure('expandedTerms: ', expandedTerms);

  const allTasksCount = (
    1 /* expand */ +
    1 /* tabs */ +
    (expandedTerms.length * 3) /* bookmarks + histories + history visits */ +
    1 /* filtering */ +
    1 /* finalize */
  );
  let finishedTasks = 1;
  setProgress(finishedTasks / allTasksCount);

  const places = new Map();
  let tasks = [];

  tasks.push(
    browser.tabs.query({})
      .then(tabs => {
        measure(`tabs: `, tabs.length);
        for (const tab of tabs) {
          const place = places.get(tab.url) || { title: tab.title, url: tab.url };
          places.set(tab.url, Object.assign(place, { tab }));
        }
        setProgress(++finishedTasks / allTasksCount);
      })
      .catch(error => {
        console.error(error);
      })
  );

  mLastSearchText = text;
  for (const term of expandedTerms) {
    if (mLastSearchText != text)
      return;
    tasks.push(
      browser.history.search({
        text: term
      })
        .then(histories => {
          //measure(`histories ${term}: `, histories);
          for (const history of histories) {
            tasks.push(browser.history.getVisits({ url: history.url })
              .then(visits => {
                history.visits = visits.slice(0, 10);
                setProgress(++finishedTasks / allTasksCount);
              })
              .catch(error => {
                console.error(error);
                history.visits = [];
                setProgress(++finishedTasks / allTasksCount);
              }));
            const place = places.get(history.url) || { title: history.title, url: history.url };
            places.set(history.url, Object.assign(place, { history }));
          }
          setProgress(++finishedTasks / allTasksCount);
        })
        .catch(error => {
          console.error(error);
          setProgress(++finishedTasks / allTasksCount);
        })
    );
    tasks.push(
      browser.bookmarks.search({
        query: term
      })
        .then(bookmarks => {
          //measure(`bookmarks ${term}: `, bookmarks);
          for (const bookmark of bookmarks) {
            const place = places.get(bookmark.url) || { title: bookmark.title, url: bookmark.url };
            places.set(bookmark.url, Object.assign(place, { bookmark }));
          }
          setProgress(++finishedTasks / allTasksCount);
        })
        .catch(error => {
          console.error(error);
          setProgress(++finishedTasks / allTasksCount);
        })
    );
    if (tasks.length >= configs.maxParallelSearch) {
      console.log(`waiting for ${tasks.length} tasks...`);
      await Promise.all(tasks);
      measure('after wait, wait for the next tick');
      await new Promise(resolve => setTimeout(resolve, 10));
      tasks = [];
    }
  }
  if (mLastSearchText != text)
    return;
  if (tasks.length > 0) {
    console.log(`waiting for ${tasks.length} tasks...`);
    await Promise.all(tasks);
    measure('after wait');
  }

  //console.log('places => ', places);
  mLastSearchResultPlaces = places;

  const { pattern, exceptionsPattern } = Core.getRegExpFunctional(text.trim());
  //console.log('pattern: ', pattern);
  //console.log('exceptionsPattern: ', exceptionsPattern);
  const matcher  = new RegExp(pattern, 'i');
  const rejector = exceptionsPattern && new RegExp(exceptionsPattern, 'i');

  const filteredPlaces = [];

  const now = Date.now();
  for (const place of places.values()) {
    const text = `${place.title}\t${place.url}`;
    if (!matcher.test(text) || (rejector && rejector.test(text)))
      continue;

    // https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Places/Frecency_algorithm
    place.frecenty = 0;
    if (place.history) {
      for (const visit of place.history.visits) {
        let bonusFactor = 1;
        switch (visit.transition) {
          case 'link':
            bonusFactor = 1.2;
            break;
          case 'typed':
            bonusFactor = 2;
            break;
          case 'auto_bookmark':
            bonusFactor = 1.4;
            break;
          default:
            break;
        }
        if (visit.visitTime >= now - (ONE_DAY_IN_MSEC * 4))
          place.frecenfy += 100 * bonusFactor;
        else if (visit.visitTime >= now - (ONE_DAY_IN_MSEC * 14))
          place.frecenfy += 70 * bonusFactor;
        else if (visit.visitTime >= now - (ONE_DAY_IN_MSEC * 31))
          place.frecenfy += 50 * bonusFactor;
        else if (visit.visitTime >= now - (ONE_DAY_IN_MSEC * 90))
          place.frecenfy += 30 * bonusFactor;
        else
          place.frecenfy += 10 * bonusFactor;
      }
    }
    filteredPlaces.push(place);
  }
  setProgress(++finishedTasks / allTasksCount);

  filteredPlaces.sort((a, b) => b.frecency - a.frecency);
  measure('filteredPlaces => ', filteredPlaces);
  suggest(filteredPlaces.map(place => ({
    content:     place.url,
    description: place.title
  })));
  setProgress(1);
});

browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
  mLastSearchText = null;

  const place = mLastSearchResultPlaces.get(text);
  if (place.tab) {
    browser.tabs.update(place.tab.id, { active: true });
    return;
  }

  let inTab = disposition != 'currentTab';
  if (configs.openInTabByDefault)
    inTab = !inTab;

  const window = await browser.windows.getCurrent();
  const activeTabs = await browser.tabs.query({ active: true, windowId: window.id });
  if (!inTab ||
      activeTabs[0].url == 'about:blank' ||
      activeTabs[0].url == 'about:newtab') {
    browser.tabs.update(activeTabs[0].id, { url: place.url });
    return;
  }

  const params = {
    windowId: window.id,
    active:   !/background/i.test(disposition),
    url:      place.url
  };
  const currentUrl  = new URL(activeTabs[0].url);
  const openUrl     = new URL(text);
  if (currentUrl.origin && currentUrl.origin == openUrl.origin)
    params.openerTabId = activeTabs[0].id;
  browser.tabs.create(params);
});

browser.omnibox.onInputCancelled.addListener(() => {
  console.log('onInputCancelled');
  mLastSearchText = null;
  setProgress(1);
});


function setProgress(progress) {
  if (progress >= 1) {
    browser.browserAction.setBadgeText({ text: null });
  }
  else {
    browser.browserAction.setBadgeBackgroundColor({ color: '#f9f9fa' }); /* Photon grey 10 */
    browser.browserAction.setBadgeTextColor({ color: '#0c0c0d' }); /* Photon grey 90 */
    browser.browserAction.setBadgeText({ text: `${Math.round(progress * 100)}%` });
  }
}
