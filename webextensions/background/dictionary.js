// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import {
  configs
} from '/common/common.js';

const VERSION = 1;

// Note: we use a shorthand name "dic" in this file for more writability,
//       and we should use a full name "dictionary" outside this file for
//       more readability.
let mDic;

async function load() {
  const needUpdate = configs.dictionaryEnUsVersion != VERSION;
  const start = Date.now();
  mDic = configs.dictionaryEnUs;
  //console.log('loaded dic: ', dic);
  if (needUpdate || mDic) {
    console.log(`load en-US dictionary from file`);
    const url  = browser.extension.getURL(`dictionaries/en-US/en-US.txt`);
    const data = await fetch(url);
    mDic = await data.text();
    configs.dictionaryEnUs = mDic;
    configs.dictionaryEnUsVersion = VERSION;
  }
  console.log(`elapsed time to prepare en-US dictionary: ${Date.now() - start}msec `);
}

configs.$loaded.then(load);

export function getAll() {
  return mDic;
}
