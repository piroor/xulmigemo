/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  configs
} from '/common/common.js';

let mDic;

async function ensureDictionaryLoaded() {
  const start = Date.now();
  const dic = configs.dic;
  //console.log('loaded dic: ', dic);
  const loadTasks = [];
  const newlyLoadedDic = {};
  for (const key of configs.dicKeys) {
    if (dic[key])
      continue;
    loadTasks.push((async () => {
      console.log(`load dictionary from file: ${key}`);
      const url = browser.extension.getURL(`dic/${key}.txt`);
      const data = await fetch(url);
      newlyLoadedDic[key] = await data.text();
    })());
  }
  if (loadTasks.length > 0) {
    await Promise.all(loadTasks);
    configs.dic = Object.assign({}, dic, newlyLoadedDic);
    //console.log('saved dic: ', configs.dic);
  }
  mDic = configs.dic;
  console.log(`elapsed time to prepare dictionaries: ${Date.now() - start}msec `);
}

configs.$loaded.then(ensureDictionaryLoaded);

export function getFor(letter) {
  switch (letter) {
    case 'l':
    case 'q':
    case 'x':
      return '';

    case 'c':
      return mDic['t'];

    case 'k':
    case 's':
    case 't':
    case 'h':
    case 'm':
    case 'n':
    case 'r':
    case 'd':
    case 'z':
    case 'g':
    case 'p':
    case 'b':
      return mDic[letter];

    case 'w':
    case 'y':
      return [mDic[letter], mDic['']].join('\n');

    case 'a':
    case 'i':
    case 'u':
    case 'e':
    case 'o':
      return mDic[''];

    case 'j':
      return mDic['z'];

    case 'f':
      return mDic['h'];

    case 'v':
      return mDic[''];
  }
}

