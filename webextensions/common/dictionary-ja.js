// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

/* Usage:
    import {
      configs
    } from '/common/common.js';

    configs.$loaded.then(DictionaryJa.load);

  You can use a custom fetcher like:
    DictionaryJa.load({
      fetcher: path => fs.readFileSync(`./${path}`, 'utf8')
    })
 */

const VERSION = 1;

const CONSONANTS = [
  '', // あ
  'k',
  's',
  't',
  'n',
  'h',
  'm',
  'y',
  'r',
  'w',
  'g',
  'z',
  'd',
  'b',
  'p',
  'alph'
];

// Note: we use a shorthand name "dic" in this file for more writability,
//       and we should use a full name "dictionary" outside this file for
//       more readability.
let mDic;

export async function load(configs = {}) {
  const needUpdate = configs.dictionaryJaVersion != VERSION;
  //const start = Date.now();
  const dic = configs.dictionaryJa || {};
  //console.log('loaded dic: ', dic);
  const loadTasks = [];
  const newlyLoadedDic = {};
  const fetcher = configs.fetcher || (async path => {
    const url = browser.extension.getURL(path);
    const data = await fetch(url);
    return data.text();
  });
  for (const consonant of CONSONANTS) {
    if (!needUpdate &&
        dic[consonant])
      continue;
    loadTasks.push((async () => {
      //console.log(`load ja dictionary from file for "${consonant}"`);
      const path = `dictionaries/ja/${consonant}a2.txt`;
      newlyLoadedDic[consonant] = await fetcher(path);
    })());
  }
  if (loadTasks.length > 0) {
    await Promise.all(loadTasks);
    configs.dictionaryJa = Object.assign({}, dic, newlyLoadedDic);
    configs.dictionaryJaVersion = VERSION;
    //console.log('saved dic: ', configs.dic);
  }
  mDic = configs.dictionaryJa;
  //console.log(`elapsed time to prepare ja dictionaries: ${Date.now() - start}msec `);
}


export function getAll() {
  return CONSONANTS.map(get).join('\n');
}

export function getAlphabet() {
  return mDic['alph'];
}

/*
function getDictionaryKeyFromTerm(yomi) {
  if (!yomi)
    return null;

  if (/^[a-z0-9]+$/i.test(yomi))
    return 'alph';

  const firstLetter = TextTransformJa.hira2roman(yomi.charAt(0)).charAt(0);
  switch (firstLetter) {
    case 'a':
    case 'i':
    case 'u':
    case 'e':
    case 'o':
    case 'l':
      return '';

    default:
      return firstLetter;
  }
}
*/

export function get(letter) {
  const key = getKeyFromLetter(letter.charAt(0));
  return (key === null) ? '' : mDic[key];
}

function getKeyFromLetter(letter) {
  switch (letter) {
    case 'l':
    case 'q':
    case 'x':
      return null;

    case 'c':
      return 't';

    case 'k':
    case 's':
    case 't':
    case 'n':
    case 'h':
    case 'm':
    case 'y':
    case 'r':
    case 'w':
    case 'g':
    case 'z':
    case 'd':
    case 'b':
    case 'p':
      return letter;

    case 'a':
    case 'i':
    case 'u':
    case 'e':
    case 'o':
      return '';

    case 'j':
      return 'z';

    case 'f':
      return 'h';

    case 'v':
      return '';
  }

  return null;
}

