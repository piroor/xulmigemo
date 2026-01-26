/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import path from 'path';

import { MigemoCoreFactory } from '../modules/core/MigemoCore.js';
import { regExpPatterns } from './assets/regexp-patterns.js';

import { assert } from 'tiny-esm-test-runner';
const { is } = assert;

const currentDir = path.dirname(new URL(import.meta.url).pathname);

let migemo;
export async function setUp() {
  migemo = MigemoCoreFactory.get('ja');
  await migemo.init({
    dicPath: `${currentDir}/../dictionaries/ja/`
  });
}

test_getRegExpFor.parameters = regExpPatterns;
export function test_getRegExpFor({ input, terms: toBeMatchedTerms }) {
  const regexp = new RegExp(migemo.engine.getRegExpFor(input), 'i');
  is(toBeMatchedTerms.map(expected => `${expected}:true`).join('\n'),
     toBeMatchedTerms.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
     regexp);
}
