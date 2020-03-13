// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import {
  configs
} from '/common/common.js';

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

async function load() {
  const needUpdate = configs.dictionaryJaVersion != VERSION;
  const start = Date.now();
  const dic = configs.dictionaryJa;
  //console.log('loaded dic: ', dic);
  const loadTasks = [];
  const newlyLoadedDic = {};
  for (const consonant of CONSONANTS) {
    if (!needUpdate &&
        dic[consonant])
      continue;
    loadTasks.push((async () => {
      console.log(`load dictionary from file for "${consonant}"`);
      const url = getDicFileURLFor(consonant);
      const data = await fetch(url);
      newlyLoadedDic[consonant] = await data.text();
    })());
  }
  if (loadTasks.length > 0) {
    await Promise.all(loadTasks);
    configs.dictionaryJa = Object.assign({}, dic, newlyLoadedDic);
    configs.dictionaryJaVersion = VERSION;
    //console.log('saved dic: ', configs.dic);
  }
  mDic = configs.dictionaryJa;
  console.log(`elapsed time to prepare dictionaries: ${Date.now() - start}msec `);
}

configs.$loaded.then(load);

function getDicFileURLFor(consonant) {
  return browser.extension.getURL(`dictionaries/ja/${consonant}a2.txt`);
}


export function getAll() {
  return CONSONANTS.map(getFor).join('\n');
}

export function getAlpha() {
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

export function getFor(letter) {
  const key = getKeyFromLetter(letter);
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
}

