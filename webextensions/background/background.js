/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  console.log('onInputChanged: ', text);
  const items = await browser.history.search({ text });
  suggest(items.map(item => ({
    content:     item.url,
    description: item.title
  })));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
});

browser.omnibox.onInputCancelled.addListener(() => {
  console.log('onInputCancelled');
});
