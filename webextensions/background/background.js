/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';

import * as EngineJa from './engine-ja.js';
import * as DictionaryJa from './dictionary-ja.js';

configs.$loaded.then(DictionaryJa.load);


browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  console.log('onInputChanged: ', text);
  const terms = text.trim().split(/\s+/).map(EngineJa.gatherEntriesFor);
  console.log('terms: ', terms);
  const items = (await Promise.all(terms.map(async term => {
    return (await Promise.all([
      browser.history.search({
        text: term
      }).catch(error => {
        console.error(error);
        return [];
      }),
      browser.bookmarks.search({
        query: term
      }).catch(error => {
        console.error(error);
        return [];
      })
    ])).flat();
  }))).flat();
  console.log('items => ', items);
  const uniqueItems = Array.from(
    new Set(items.map(item => `${item.url}\n${item.title}`)),
    item => item.split('\n')
  );
  suggest(uniqueItems.map(item => ({
    content:     item[0],
    description: item[1]
  })));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
});

browser.omnibox.onInputCancelled.addListener(() => {
  console.log('onInputCancelled');
});
