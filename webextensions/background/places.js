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
import EventListenerManager from '/extlib/EventListenerManager.js';

configs.$loaded.then(Core.init);

const ONE_DAY_IN_MSEC = 1000 * 60 * 60 * 24;

export default class Places {
  constructor() {
    this.onProgress = new EventListenerManager();
    this.onFound    = new EventListenerManager();

    this.mLastSearchQuery = null;
    this.mLastSearchResultPlaces = null;
    this.mSatrt = 0;
  }

  measure(...messages) {
    const now = Date.now();
    console.log(`${now - this.mStart} msec `, ...messages);
  }

  /*
  bookmarks.query()やhistory.search()がOR検索をサポートしていない中で、Migemo検索をやる。
  基本的にこれらの処理は遅いので、馬鹿正直にすべての単語を検索すると非常に遅くなってしまう。
  仮に偽陽性が多くなるとしても、なるべく短い検索クエリで検索をかけて、正規表現にマッチするかどうかで後からふるい落とした方が高速になる。
   */
  async start(query) {
    query = query.trim();
    console.log('start: ', query);

    if (query.length < 3) {
      console.log('too short input');
      this.onProgress.dispatch(1);
      return [];
    }

    this.cancel();

    this.onProgress.dispatch(0);
    this.mStart = Date.now();

    const places = this.mLastSearchResultPlaces = new Map();

    // shortest:trueにより、共通部分だけを抽出した単語一覧を得る。
    const expandedTerms = Array.from(new Set(Core.expandInput(query.trim(), { shortest: true }).flat()));
    this.measure('expandedTerms: ', expandedTerms);

    const allTasksCount = (
      1 /* expand */ +
      1 /* tabs */ +
      (expandedTerms.length * 3) /* bookmarks + histories + history visits */
    );
    let finishedTasks = 1;
    this.onProgress.dispatch(finishedTasks / allTasksCount);

    const { pattern, exceptionsPattern } = Core.getRegExpFunctional(query.trim());
    //console.log('pattern: ', pattern);
    //console.log('exceptionsPattern: ', exceptionsPattern);
    const matcher  = new RegExp(pattern, 'i');
    const rejector = exceptionsPattern && new RegExp(exceptionsPattern, 'i');
    const shouldAccept = place => {
      const text = `${place.title}\t${place.url}`;
      return matcher.test(text) && (!rejector || !rejector.test(text));
    };

    let tasks = [];

    tasks.push(
      browser.tabs.query({})
        .then(tabs => {
          this.measure(`tabs: `, tabs.length);
          const found = [];
          for (const tab of tabs) {
            const place = places.get(tab.url) || { title: tab.title, url: tab.url };
            if (!shouldAccept(place))
              continue;
            this.updateFrecency(place);
            places.set(tab.url, Object.assign(place, { tab }));
            found.push(place);
          }
          this.onProgress.dispatch(++finishedTasks / allTasksCount);
          if (found.length > 0 &&
              this.onFound.hasListener)
            this.onFound.dispatch(this.sortedPlaces, found);
        })
        .catch(error => {
          console.error(error);
        })
    );

    this.mLastSearchQuery = query;
    for (const term of expandedTerms) {
      if (this.mLastSearchQuery != query)
        return [];
      tasks.push(
        browser.history.search({
          text: term
        })
          .then(histories => {
            //this.measure(`histories ${term}: `, histories);
            for (const history of histories) {
              tasks.push(browser.history.getVisits({ url: history.url })
                .then(visits => {
                  history.visits = visits.slice(0, 10);
                  this.onProgress.dispatch(++finishedTasks / allTasksCount);
                })
                .catch(error => {
                  console.error(error);
                  history.visits = [];
                  this.onProgress.dispatch(++finishedTasks / allTasksCount);
                })
                .then(() => {
                  const place = places.get(history.url) || { title: history.title, url: history.url };
                  if (!shouldAccept(place))
                    return;
                  this.updateFrecency(place);
                  places.set(history.url, Object.assign(place, { history }));
                  if (this.onFound.hasListener)
                    this.onFound.dispatch(this.sortedPlaces, [place]);
                }));
            }
            this.onProgress.dispatch(++finishedTasks / allTasksCount);
          })
          .catch(error => {
            console.error(error);
            this.onProgress.dispatch(++finishedTasks / allTasksCount);
          })
      );
      tasks.push(
        browser.bookmarks.search({
          query: term
        })
          .then(bookmarks => {
            //this.measure(`bookmarks ${term}: `, bookmarks);
            const found = [];
            for (const bookmark of bookmarks) {
              const place = places.get(bookmark.url) || { title: bookmark.title, url: bookmark.url };
              if (!shouldAccept(place))
                continue;
              this.updateFrecency(place);
              places.set(bookmark.url, Object.assign(place, { bookmark }));
              found.push(place);
            }
            this.onProgress.dispatch(++finishedTasks / allTasksCount);
            if (found.length > 0 &&
                this.onFound.hasListener)
              this.onFound.dispatch(this.sortedPlaces, found);
          })
          .catch(error => {
            console.error(error);
            this.onProgress.dispatch(++finishedTasks / allTasksCount);
          })
      );
      if (tasks.length >= configs.maxParallelSearch) {
        console.log(`waiting for ${tasks.length} tasks...`);
        await Promise.all(tasks);
        this.measure('after wait, wait for the next tick');
        await new Promise(resolve => setTimeout(resolve, 10));
        tasks = [];
      }
    }
    if (this.mLastSearchQuery != query)
      return [];
    if (tasks.length > 0) {
      console.log(`waiting for ${tasks.length} tasks...`);
      await Promise.all(tasks);
      this.measure('after wait');
    }

    //console.log('places => ', places);

    this.measure('finish');
    this.onProgress.dispatch(1);

    return this.sortedPlaces;
  }

  updateFrecency(place) {
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
        if (visit.visitTime >= this.mStart - (ONE_DAY_IN_MSEC * 4))
          place.frecenfy += 100 * bonusFactor;
        else if (visit.visitTime >= this.mStart - (ONE_DAY_IN_MSEC * 14))
          place.frecenfy += 70 * bonusFactor;
        else if (visit.visitTime >= this.mStart - (ONE_DAY_IN_MSEC * 31))
          place.frecenfy += 50 * bonusFactor;
        else if (visit.visitTime >= this.mStart - (ONE_DAY_IN_MSEC * 90))
          place.frecenfy += 30 * bonusFactor;
        else
          place.frecenfy += 10 * bonusFactor;
      }
    }
    return place;
  }

  get sortedPlaces() {
    return Array.from(this.mLastSearchResultPlaces.values()).sort((a, b) => b.frecency - a.frecency);
  }

  get(url) {
    return this.mLastSearchResultPlaces.get(url);
  }

  cancel() {
    this.mLastSearchQuery = null;
    this.onProgress.dispatch(1);
  }
}
