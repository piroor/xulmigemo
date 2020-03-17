// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

/* Usage:
    import {
      configs
    } from '/common/common.js';

    configs.$loaded.then(Dictionary.load);

  You can use a custom fetcher like:
    Dictionary.load({
      fetcher: path => fs.readFileSync(`./${path}`, 'utf8')
    })
 */

const VERSION = 1;

// Note: we use a shorthand name "dic" in this file for more writability,
//       and we should use a full name "dictionary" outside this file for
//       more readability.
let mDic;

export async function load(configs = {}) {
  const needUpdate = configs.dictionaryEnUsVersion != VERSION;
  const start = Date.now();
  mDic = configs.dictionaryEnUs;
  //console.log('loaded dic: ', dic);
  const fetcher = configs.fetcher || (async path => {
    const url = browser.extension.getURL(path);
    const data = await fetch(url);
    return data.text();
  });
  if (needUpdate || mDic) {
    console.log(`load en-US dictionary from file`);
    mDic = await fetcher(`dictionaries/en-US/en-US.txt`);
    configs.dictionaryEnUs = mDic;
    configs.dictionaryEnUsVersion = VERSION;
  }
  console.log(`elapsed time to prepare en-US dictionary: ${Date.now() - start}msec `);
}
export function getAll() {
  return mDic;
}
