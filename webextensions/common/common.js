/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import Configs from '/extlib/Configs.js';
import * as Constants from './constants.js';

export const configs = new Configs({
  theme: 'default',
  fillFieldWithSelectionText: true,
  clearFieldAfterOpen: true,
  clearFieldAfterOpenDelay: 5000,
  lastSearchTerm: '',
  lastOpenTime: 0,
  closeAfterOpen: true,
  recycleBlankCurrentTab: true,
  recycleTabUrlPattern: '^about:(newtab|home|privatebrowsing)$',
  defaultOpenIn: Constants.kOPEN_IN_TAB,
  accelActionOpenIn: Constants.kOPEN_IN_BACKGROUND_TAB,
  focusDelay: 150,
  smoothScrollDuration: 150,
  newWindowDelay: 1000,
  applyThemeColorToIcon: false,

  maxParallelSearch: 12,
  openInTabByDefault: true,

  // options for Core
  language: 'ja',
  enableAutoSplit: false,
  enableANDFind: true,
  enableNOTFind: true,

  // options for Engine
  ignoreLatinModifiers: true,
  ignoreHiraganaKatakana: true,

  // options for Dictionary
  dictionaryEnUsVersion: 0,
  dictionaryEnUs: null,

  dictionaryJaVersion: 0,
  dictionaryJa: null,

  cacheKeys: [
    'ja/ja.cache'
  ],
  cache: {},

  configsVersion: 0,
  debug: false
}, {
  localKeys: [
    'dictionaryEnUs',
    'dictionaryJa',
    'cache',

    'lastSearchTerm',
    'lastOpenTime',
    'debug'
  ]
});
