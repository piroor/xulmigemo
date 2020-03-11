/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import Configs from '/extlib/Configs.js';

export const configs = new Configs({
  dicKeys: [
    'ja/alpha2',

    'ja/a2',
    'ja/ka2',
    'ja/sa2',
    'ja/ta2',
    'ja/na2',
    'ja/ha2',
    'ja/ma2',
    'ja/ya2',
    'ja/ra2',
    'ja/wa2',

    'ja/ga2',
    'ja/za2',
    'ja/da2',
    'ja/ba2',
    'ja/pa2'
  ],
  dic: {},
  cacheKeys: [
    'ja/ja.cache'
  ],
  cache: {}
}, {
  localKeys: [
    'dic',
    'cache'
  ]
});
