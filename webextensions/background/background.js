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

browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  text = text.trim();
  console.log('onInputChanged: ', text);

  if (text.length < 3) {
    console.log('too short input');
    return suggest([]);
  }

  const expandedTerms = Array.from(new Set(Core.expandInput(text.trim()).flat()));
  console.log('expandedTerms: ', expandedTerms);

  const items = [];
  let tasks = [];

  tasks.push(
    browser.tabs.query({})
      .then(results => {
        console.log(`tabs: `, results.length);
        return results;
      })
      .catch(error => {
        console.error(error);
        return [];
      })
  );

  let count = 0;
  mLastSearchText = text;
  for (const term of expandedTerms) {
    if (mLastSearchText != text)
      return;
    tasks.push(
      browser.history.search({
        text: term
      })
        .then(results => {
          console.log(`histories ${term}: `, results);
          return results;
        })
        .catch(error => {
          console.error(error);
          return [];
        })
    );
    tasks.push(
      browser.bookmarks.search({
        query: term
      })
        .then(results => {
          console.log(`bookmarks ${term}: `, results);
          return results;
        })
        .catch(error => {
          console.error(error);
          return [];
        })
    );
    if (tasks.length >= configs.maxParallelSearch) {
      console.log(`waiting for ${tasks.length} tasks...`);
      items.push(...(await flattenResults(tasks)));
      await new Promise(resolve => setTimeout(resolve, 100));
      tasks = [];
    }
  }
  if (mLastSearchText != text)
    return;
  if (tasks.length > 0) {
    console.log(`waiting for ${tasks.length} tasks...`);
    items.push(...(await flattenResults(tasks)));
  }

  console.log('items => ', items);
  const uniqueItems = Array.from(
    new Set(items.map(item => `${item.url}\n${item.title}`)),
    item => item.split('\n')
  );
  console.log('uniqueItems => ', uniqueItems);

  const { pattern, exceptionsPattern } = Core.getRegExpFunctional(text.trim());
  console.log('pattern: ', pattern);
  console.log('exceptionsPattern: ', exceptionsPattern);
  const matcher  = new RegExp(pattern, 'i');
  const rejector = exceptionsPattern && new RegEpx(exceptionsPattern, i);

  const filteredItems = uniqueItems.map(item => ({
    content:     item[0],
    description: item[1]
  })).filter(item => {
    const text = `${item.content}\t${item.description}`;
    return matcher.test(text) && (!rejector || !rejector.test(text));
  });
  console.log('filteredItems => ', filteredItems);
  suggest(filteredItems);
});

async function flattenResults(tasks) {
  const resultsPair = await Promise.all(tasks);
  return resultsPair.flat().flat();
}

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
  mLastSearchText = null;
});

browser.omnibox.onInputCancelled.addListener(() => {
  console.log('onInputCancelled');
  mLastSearchText = null;
});
