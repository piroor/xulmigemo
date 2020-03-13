// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import {
  configs
} from '/common/common.js';

import * as TextUtils from './text-utils.js';
import * as TextTransform from './text-transform.js';
import * as Dictionary from './dictionary.js';

export function getRegExpFor(rawInput) {
  if (!rawInput)
    return null;

  rawInput = rawInput.toLowerCase();

  console.log('noCache');

  let input = TextUtils.sanitize(rawInput);
  if (configs.ignoreLatinModifiers)
    input = TextTransform.addLatinModifiers(input);

  const lines = gatherEntriesFor(rawInput);

  let pattern = '';
  if (lines.length > 0) {
    let searchterm = lines.join('\n').replace(/(\t|\n\n)+/g, '\n');
    searchterm = searchterm
      .split('\n')
      .sort()
      .join('\n')
      .replace(/^(.+)$(\n\1$)+/img, '$1');

    searchterm = TextUtils.sanitize(searchterm)
      .replace(/\n/g, '|');
    pattern += `${(pattern ? '|' : '')}${searchterm}`;
    pattern += `${(pattern ? '|' : '')}${input}`;

    pattern = pattern.replace(/\n/g, '');
    console.log('pattern: ', pattern);
  }
  else { // 辞書に引っかからなかった模様なので自前の文字列だけ
    pattern = input;
    console.log('pattern: ', pattern);
  }

  return pattern
    .replace(/\n|^\||\|$/g, '')
    .replace(/\|\|+/g, '|')
    .replace(/\(\|/g, '(')
    .replace(/\|\)/g, ')');
}

export function gatherEntriesFor(rawInput) {
  if (!rawInput)
    return [];

  let input = TextUtils.sanitize(rawInput);
  if (configs.ignoreLatinModifiers)
    input = TextTransform.addLatinModifiers(input);

  const regexp = new RegExp(`^(${input}).+$`, 'img');
  const result = [];
  const entries = Dictionary.getAll().match(regexp); //アルファベットの辞書を検索
  if (entries && entries.length > 0) {
    result.push(...entries);
    console.log(`found ${entries.length} terms`);
  }
  return result;
}


const SYMBOLS_MATCHER = new RegExp('([!"#\$%&\'\\(\\)=‾\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g')

export function splitInput(input) {
  const terms = input
    .replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
    .replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
    .replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
    .replace(SYMBOLS_MATCHER, '\t$1\t');

  return terms
    .replace(/ +|\t\t+/g, '\t')
    .replace(/^[\s\t]+|[\s\t]+$/g, '')
    .split('\t');
}
