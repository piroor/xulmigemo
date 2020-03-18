// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import * as TextUtils from './text-utils.js';

import * as EngineEn from './engine.js';
import * as DictionaryEn from './dictionary.js';

import * as EngineJa from './engine-ja.js';
import * as DictionaryJa from './dictionary-ja.js';


let mEnableAutoSplit = true;
let mEnableANDFind   = true;
let mEnableNOTFind   = true;
let mLanguage        = 'en';
let mEngine;

export async function init({
  enableAutoSplit = true,
  enableANDFind   = true,
  enableNOTFind   = true,
  language        = 'en',
  ...options
} = {}) {
  mEnableAutoSplit = !!enableAutoSplit;
  mEnableANDFind   = !!enableANDFind;
  mEnableNOTFind   = !!enableNOTFind;
  mLanguage        = language;

  switch (mLanguage) {
    case 'ja':
      mEngine = EngineJa;
      await DictionaryJa.load(options);
      break;

    case 'en':
    case 'en-US':
      mEngine = EngineEn;
      await DictionaryEn.load(options);
      break;
  }
}

export function getRegExp(input) {
  if (mEngine)
    return getRegExpInternal(input);
  else
    return '';
}

const SIMPLE_PART_ONLY_PAREN_MATCHER = /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i;

function getRegExpInternal(input, { enableAutoSplit } = {}) {
  const sources = [];
  const autoSplit = enableAutoSplit === undefined ? mEnableAutoSplit : enableAutoSplit;

  // 入力を切って、文節として個別に正規表現を生成する
  const romanTerms = mEngine.splitInput(input);
  // console.log('ROMAN: ', romanTerms.join('/').toLowerCase());

  for (const romanTerm of romanTerms) {
    const term = romanTerm.toLowerCase();

    const pattern = getRegExpFor(term);
    if (!pattern)
      continue;

    sources.push(pattern);

    if (!autoSplit)
      continue;

    let romanTermPart = term;
    while (romanTermPart.length > 1) {
      romanTermPart = romanTermPart.substring(0, romanTermPart.length-1);
      const pattern = getRegExpFor(romanTermPart, { enableAutoSplit: true });
      if (SIMPLE_PART_ONLY_PAREN_MATCHER.test(pattern.replace(/\\\|/g, '')))
        continue;

      sources[sources.length-1] = `${
        sources[sources.length-1]
      }|(${
        pattern
      })(${
        getRegExp(term.substring(romanTermPart.length, term.length))
      })`.replace(/\n/g, '');
      break;
    }
  }

  const source = (
    (sources.length == 1) ?
      sources[0] :
      (sources.length > 0) ?
        ['(', sources.join(')([ \t]+)?('), ')'].join('').replace(/\n/g, '') :
        ''
  )
    .replace(/\n|^\||\|$/g, '')
    .replace(/([^\\]|^)\|\|+/g, '$1|')
    .replace(/([^\\]|^)\(\|/g, '$1(')
    .replace(/([^\\]|^)\|\)/g, '$1)');

  // console.log('created pattern: ', source);

  return source;
}

export function getRegExps(input) {
  return input.trim()
    .split(/\s+/)
    .map(input => getRegExp(input));
}

export function getRegExpFor(input) {
  if (!input || !mEngine)
    return null;

  input = input.toLowerCase();

  /*
  const cache = cache;
  const cacheText = cache.getCacheFor(input, aTargetDic);
  if (cacheText) {
    log('cache:'+encodeURIComponent(cacheText));
    return cacheText.replace(/\n/g, '');
  }
  */

  //const before = Date.now();

  const regexpPattern = mEngine.getRegExpFor(input);

  //log('created:'+encodeURIComponent(regexpPattern));

  /*
  const after = Date.now();
  if ((after - before) > (createCacheTimeOverride > -1 ? createCacheTimeOverride : prefs.getPref(BASE+'cache.update.time'))) {
    // 遅かったらキャッシュします
    cache.setDiskCache(input, regexpPattern, aTargetDic);
    cache.setMemCache(input, regexpPattern, aTargetDic);
    log('CacheWasSaved');
  }
  else{
    cache.setMemCache(input, regexpPattern, aTargetDic);//メモリキャッシュ
    log('memCacheWasSaved');
  }
  log(after - before);
  */

  return regexpPattern;
}

export function splitInput(input) {
  if (mEngine)
    return mEngine.splitInput(input);
  else
    return [input];
}

export function gatherEntriesFor(input) {
  if (mEngine)
    return mEngine.gatherEntriesFor(input);
  else
    return [];
}

export function flattenRegExp(regexp) {
  if (!regexp)
    return[];

  const source = (typeof regexp == 'string') ? regexp : regexp.source;
  return expandTermsFromArray(
    expandParensToArray(
      source
        .replace(/\[[^\]]+\]/g, charClassPart =>
          `(${charClassPart.replace(/\[|\]/g, '').split('').join('|')})`)
        .replace(/\|\|+/g, '|')
    )
  )
    .replace(/\n\n+/g, '\n')
    .split('\n');
}

function expandParensToArray(source) {
  const parts = [];
  let scope = parts;
  let escaped = false;
  for (let i = 0, maxi = source.length; i < maxi; i++) {
    const character = source.charAt(i);
    switch (character) {
      case '\\':
        if (!escaped) {
          escaped = true;
          break;
        }
      case '(':
        if (!escaped) {
          const child = [];
          child.parent = scope;
          scope.push(child);
          scope = child;
          break;
        }
      case ')':
        if (!escaped) {
          scope = scope.parent;
          break;
        }
      default:
        if (typeof scope[scope.length-1] != 'string') {
          scope.push('');
        }
        scope[scope.length-1] += character;
        escaped = false;
        break;
    }
  }
  return parts;
}

function expandTermsFromArray(terms) {
  while (expandTermsFromArrayInternal(terms)) {
  }
  return expandTerms(terms);
}
function expandTermsFromArrayInternal(terms) {
  let shouldContinue = false;
  for (let i = 0, maxi = terms.length; i < maxi; i++)
  {
    if (typeof terms[i] == 'string')
      continue;
    if (terms[i].some(item => {
      return typeof item != 'string' &&
        (item.length > 1 ||
         typeof item[0] != 'string');
    })) {
      expandTermsFromArrayInternal(terms[i]);
      shouldContinue = true;
      continue;
    }
    terms[i] = expandTerms(terms[i]);
  }
  return shouldContinue;
}

function expandTerms(terms) {
  let final = '';
  let result = '';
  let containsArray = false;
  for (let term of terms) {
    if (typeof term != 'string') {
      term = term[0];
      containsArray = true;
    }

    if (term.charAt(0) == '|') {
      final += (final ? '\n' : '') + result;
      result = '';
      term = term.substring(1);
    }

    let next = '';
    if (term.charAt(term.length-1) != '|') {
      term = term.replace(/\|([^\|]+)$/, '');
      next = RegExp.$1;
    }

    const leaves = term.replace(/\|/g, '\n');
    result = result.split('\n')
      .map(term =>
        leaves.split('\n').map(leaf =>
          term.replace(/$/mg, leaf)
        ).join('\n')
      ).join('\n');

    if (next) {
      final += `${final ? '\n' : ''}${result}`;
      result = next;
      next = '';
    }
  }
  if (result)
    final += `${final ? '\n' : ''}${result}`;

  return containsArray ? [final] : final ;
}


/* AND/NOT find */

function getRegExpFunctionalInternal(input) {
  let exceptionsPattern = '';
  if (mEnableNOTFind) {
    const { input: shiftedInput, exceptions } = shiftExceptions(input);
    input = shiftedInput;
    if (exceptions.length > 0)
      exceptionsPattern = TextUtils.getORFindRegExpFromTerms(getRegExps(exceptions.join(' ')));
  }
  const patterns = getRegExps(input);
  return {
    patterns,
    termsPattern: TextUtils.getORFindRegExpFromTerms(patterns),
    exceptionsPattern
  };
}

export function getRegExpFunctional(input) {
  const { patterns, termsPattern, exceptionsPattern }  = getRegExpFunctionalInternal(input);
  const pattern = (mEnableANDFind ?
    TextUtils.getANDFindRegExpFromTerms(patterns) :
    getRegExp(input)
  );
  return {
    pattern,
    termsPattern,
    exceptionsPattern
  };
}

export function getRegExpsFunctional(input) {
  const result   = getRegExpFunctionalInternal(input);
  const patterns = (mEnableANDFind ?
    result.patterns :
    [getRegExp(input)]
  );
  return Object.assign(result, { patterns });
}

function shiftExceptions(input) {
  const exceptions = [];
  input = input.split(/\s+/).filter(term => {
    if (term.startsWith('-')) {
      exceptions.push(term.substring(1));
      return false;
    }
    return true;
  }).join(' ');
  return { input, exceptions };
}

const MIGEMO_PATTERN_MATCHER = /^[\w\-\:\}\{\$\?\*\+\.\^\/\;\\]+$/im;
const NOT_PATTERN_MATCHER = /^-/im;

export function isValidFunctionalInput(input) {
  const converted = input.replace(/\s+/g, '\n');
  return (
    TextUtils.isRegExp(input) ||
    MIGEMO_PATTERN_MATCHER.test(converted) ||
    (mEnableNOTFind && NOT_PATTERN_MATCHER.test(converted))
  );
}

export function trimFunctionalInput(input) {
  input = String(input).trim();
  if (mEnableNOTFind) {
    // 入力中のNOT検索用演算子を除外
    input = input.replace(/\s+-$/, '');
  }
  return input;
}


export function expandInput(input, options = {}) {
  const termsSet = [];
  for (const term of mEngine.splitInput(input)) {
    termsSet.push(mEngine.expandInput(term.toLowerCase(), options));
  }
  return termsSet;
}

export function getAllKnownTermsPattern() {
  return mEngine.getAllKnownTermsPattern();
}
