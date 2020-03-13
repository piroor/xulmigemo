/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import fs from 'fs';
import path from 'path';

import { is, isNot, ok, ng } from './assert.js';
import * as Core from '../background/core.js';
import { regExpPatterns } from './assets/regexp-patterns.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export async function setUp() {
  await Core.init({
    language: 'ja',
    fetcher:  path => fs.readFileSync(`${__dirname}/../${path}`, 'utf8')
  });
}

test_getRegExpFor.parameters = regExpPatterns;
export function test_getRegExpFor({ input, terms: toBeMatchedTerms }) {
  const regexp = new RegExp(Core.getRegExpFor(input), 'i');
  is(toBeMatchedTerms.map(expected => `${expected}:true`).join('\n'),
     toBeMatchedTerms.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
     regexp);
}


/* eslint-disable indent */
const getRegExpPatterns = {
  single    : { input      : 'nihongo',
                match      : ['日本語'],
                notMatch   : ['英語'],
                matchArray : [['日本語']],
                notMatchArray : [['英語']],
                terms      : ['日本語'],
                notTerms   : ['英語'],
                exceptions : [] },
  multiple  : { input      : 'nihongo eigo',
                match      : ['日本語と英語', '英語と日本語'],
                notMatch   : ['日本語', '英語'],
                matchArray : [['日本語'], ['英語']],
                notMatchArray : [['英語'], ['日本語']],
                terms      : ['日本語', '英語'],
                notTerms   : ['仏語'],
                exceptions : [] },
  exception : { input      : 'nihongo eigo -mozira',
                match      : ['日本語と英語', '英語と日本語', '英語と日本語もモジラ'],
                notMatch   : ['日本語', '英語', 'モジラ'],
                matchArray : [['日本語'], ['英語']],
                notMatchArray : [['英語', 'モジラ'], ['日本語', 'モジラ']],
                terms      : ['日本語', '英語'],
                notTerms   : ['モジラ'],
                exceptions : ['モジラ'] }
};
/* eslint-enable indent */

test_getRegExpFunctional.parameters = getRegExpPatterns;
export function test_getRegExpFunctional({
  input,
  match:      toBeMatched,
  notMatch:   notToBeMatched,
  terms:      expectedTerms,
  notTerms:   unexpectedTerms,
  exceptions: expectedExceptions
}) {
  const { pattern, termsPattern, exceptionsPattern } = Core.getRegExpFunctional(input);

  is('string', typeof pattern);
  const patternMatcher = new RegExp(pattern);
  is(toBeMatched.map(expected => `${expected}:true`).join('\n'),
     toBeMatched.map(expected => `${expected}:${patternMatcher.test(expected)}`).join('\n'),
     patternMatcher);
  is(notToBeMatched.map(expected => `${expected}:false`).join('\n'),
     notToBeMatched.map(expected => `${expected}:${patternMatcher.test(expected)}`).join('\n'),
     patternMatcher);

  is('string', typeof termsPattern);
  isNot('', termsPattern)
  const termsMatcher = new RegExp(termsPattern);
  is(expectedTerms.map(expected => `${expected}:true`).join('\n'),
     expectedTerms.map(expected => `${expected}:${termsMatcher.test(expected)}`).join('\n'),
     termsMatcher);
  is(unexpectedTerms.map(expected => `${expected}:false`).join('\n'),
     unexpectedTerms.map(expected => `${expected}:${termsMatcher.test(expected)}`).join('\n'),
     termsMatcher);

  if (exceptionsPattern) {
    is('string', typeof exceptionsPattern);
    isNot('', exceptionsPattern);
    const exceptionsMatcer = new RegExp(exceptionsPattern);
    is(expectedExceptions.map(expected => `${expected}:true`).join('\n'),
       expectedExceptions.map(expected => `${expected}:${exceptionsMatcer.test(expected)}`).join('\n'),
       exceptionsMatcer);
  }
  else {
    is('', exceptionsPattern);
  }
}

test_getRegExpsFunctional.parameters = getRegExpPatterns;
export function test_getRegExpsFunctional({
  input,
  matchArray:    toBeMatched,
  notMatchArray: notToBeMatched,
  terms:         expectedTerms,
  notTerms:      unexpectedTerms,
  exceptions:    expectedExceptions
}) {
  const { patterns, termsPattern, exceptionsPattern } = Core.getRegExpsFunctional(input);

  ok(Array.isArray(patterns), patterns);
  is(toBeMatched.length, patterns.length);


  toBeMatched.forEach((matchPatterns, index) => {
    const matcher = new RegExp(patterns[index]);
    is(matchPatterns.map(expected => `${expected}:true`).join('\n'),
       matchPatterns.map(expected => `${expected}:${matcher.test(expected)}`).join('\n'),
       matcher);
    ng(matcher.test(notToBeMatched[index]),
       { notToBeMatched: notToBeMatched[index], matcher });
  });

  is('string', typeof termsPattern);
  isNot('', termsPattern)
  const termsMatcher = new RegExp(termsPattern);
  is(expectedTerms.map(expected => `${expected}:true`).join('\n'),
     expectedTerms.map(expected => `${expected}:${termsMatcher.test(expected)}`).join('\n'),
     termsMatcher);
  is(unexpectedTerms.map(expected => `${expected}:false`).join('\n'),
     unexpectedTerms.map(expected => `${expected}:${termsMatcher.test(expected)}`).join('\n'),
     termsMatcher);

  if (exceptionsPattern) {
    is('string', typeof exceptionsPattern);
    isNot('', exceptionsPattern);
    const exceptionsMatcer = new RegExp(exceptionsPattern);
    is(expectedExceptions.map(expected => `${expected}:true`).join('\n'),
       expectedExceptions.map(expected => `${expected}:${exceptionsMatcer.test(expected)}`).join('\n'),
       exceptionsMatcer);
  }
  else {
    is('', exceptionsPattern);
  }
}
