/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import Configs from '/extlib/Configs.js';

export const configs = new Configs({
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
  cache: {}
}, {
  localKeys: [
    'dictionaryEnUs',
    'dictionaryJa',
    'cache'
  ]
});
