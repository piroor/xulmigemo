/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';
import * as Constants from '/common/constants.js';
import Places from '/common/places.js';

const mPlaces = new Places();

browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  console.log('onInputChanged: ', text);
  mPlaces.start(text).then(places => {
    suggest(places.map(place => ({
      content:     place.url,
      description: place.title
    })));
  });
});

browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  console.log('onInputEntered: ', text, disposition);
  const place = mPlaces.get(text);
  mPlaces.cancel();

  if (place.tab) {
    browser.tabs.update(place.tab.id, { active: true });
    return;
  }

  const openInAction = disposition == 'currentTab' ? configs.defaultOpenIn : configs.accelActionOpenIn;
  const inTab        = openInAction == Constants.kOPEN_IN_TAB || openInAction == Constants.kOPEN_IN_BACKGROUND_TAB;
  const inBackground = openInAction == Constants.kOPEN_IN_BACKGROUND_TAB;

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
    active:   !inBackground,
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
  mPlaces.cancel();
});

mPlaces.onProgress.addListener(progress => {
  if (progress >= 1) {
    browser.browserAction.setBadgeText({ text: null });
  }
  else {
    browser.browserAction.setBadgeBackgroundColor({ color: '#f9f9fa' }); /* Photon grey 10 */
    browser.browserAction.setBadgeTextColor({ color: '#0c0c0d' }); /* Photon grey 90 */
    browser.browserAction.setBadgeText({ text: `${Math.round(progress * 100)}%` });
  }
});
