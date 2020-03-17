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

const ONE_DAY_IN_MSEC = 1000 * 60 * 60 * 24;

let mStart = 0;
function measure(...messages) {
  const now = Date.now();
  console.log(`${now - mStart} msec `, ...messages);
}

browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  text = text.trim();
  console.log('onInputChanged: ', text);

  if (text.length < 3) {
    console.log('too short input');
    return suggest([]);
  }

  mStart = Date.now();
  const expandedTerms = Array.from(new Set(Core.expandInput(text.trim()).flat()));
  measure('expandedTerms: ', expandedTerms);

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
              })
              .catch(error => {
                console.error(error);
                history.visits = [];
              }));
            const place = places.get(history.url) || { title: history.title, url: history.url };
            places.set(history.url, Object.assign(place, { history }));
          }
        })
        .catch(error => {
          console.error(error);
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
        })
        .catch(error => {
          console.error(error);
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

  filteredPlaces.sort((a, b) => b.frecency - a.frecency);
  measure('filteredPlaces => ', filteredPlaces);
  suggest(filteredPlaces.map(place => ({
    content:     place.url,
    description: place.title
  })));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
  mLastSearchText = null;
});

browser.omnibox.onInputCancelled.addListener(() => {
  console.log('onInputCancelled');
  mLastSearchText = null;
});
