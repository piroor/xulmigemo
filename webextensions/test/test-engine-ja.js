/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import fs from 'fs';
import path from 'path';

import { is } from './assert.js';
import * as EngineJa from '../background/engine-ja.js';
import * as DictionaryJa from '../background/dictionary-ja.js';
import { regExpPatterns } from './assets/regexp-patterns.js';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export async function setUp() {
  await DictionaryJa.load({
    fetcher: path => fs.readFileSync(`${__dirname}/../${path}`, 'utf8')
  });
}

test_getRegExpFor.parameters = regExpPatterns;
export function test_getRegExpFor({ input, terms: toBeMatchedTerms }) {
  const regexp = new RegExp(EngineJa.getRegExpFor(input), 'i');
  is(toBeMatchedTerms.map(expected => `${expected}:true`).join('\n'),
     toBeMatchedTerms.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
     regexp);
}
