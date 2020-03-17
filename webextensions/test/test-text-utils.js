/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import { is, ok, ng } from './assert.js';
import * as TextUtils from '../background/text-utils.js';

// 整列と重複項目の削除
export function test_brushUpTerms() {
  const terms = '英語,日本語,フランス語,ドイツ語,中国語,english,japanese,french,german,chinese'.split(',');
  terms.sort();

  is(
    terms.join('\n'),
    TextUtils.brushUpTerms('英語,フランス語,ドイツ語,german,中国語,english,japanese,french,chinese,日本語'.split(',')).join('\n'),
    '並べ替えのみ'
  );
  is(
    terms.join('\n'),
    TextUtils.brushUpTerms('ドイツ語,日本語,Japanese,フランス語,ドイツ語,中国語,英語,English,Japanese,French,German,Chinese,英語'.split(',')).join('\n'),
    '重複あり'
  );
}

// 正規表現のメタキャラクタのエスケープ
export function test_sanitize() {
  is(
    'a\\\\bc\\(def\\|ghi\\)jk\\[\\^lmn\\]o\\.\\*p\\+q\\?r\\{0\\}s\\$',
    TextUtils.sanitize('a\\bc(def|ghi)jk[^lmn]o.*p+q?r{0}s$')
  );
}

export function test_sanitizeForTransformInput() {
  is(
    'a\\\\bc\\(def\\|ghi\\)jk\\[^lmn\\]o.*p+q?r{0}s$',
    TextUtils.sanitizeForTransformInput('a\\bc(def|ghi)jk[^lmn]o.*p+q?r{0}s$')
  );
}

// Migemoが生成するパターンに含まれない正規表現のメタキャラクタのエスケープ
export function test_sanitizeForTransformOutput() {
  is(
    'a\\bc(def|ghi)jk[\\^lmn]o\\.\\*p\\+q\\?r\\{0\\}s\\$',
    TextUtils.sanitizeForTransformOutput('a\\bc(def|ghi)jk[^lmn]o.*p+q?r{0}s$')
  );
}

// 正規表現リテラルの判別
export function test_isRegExp() {
  ok(TextUtils.isRegExp('/foobar/'), '単純な例');
  ok(TextUtils.isRegExp('/foo|bar/'), '|');
  ok(TextUtils.isRegExp('/foo(bar|baz)/'), '()');
  ok(TextUtils.isRegExp('/[foobar]/'), '[]');
  ok(TextUtils.isRegExp('/foo|bar/gim'), 'フラグ');
  ng(TextUtils.isRegExp('/directory/subdirectory'), 'パス');
}

// 正規表現リテラルからのソース文字列抽出
export function test_extractRegExpSource() {
  is('foobar', TextUtils.extractRegExpSource('/foobar/'), '単純な例');
  is('foo|bar', TextUtils.extractRegExpSource('/foo|bar/gim'), 'フラグ');
  is('foo|bar', TextUtils.extractRegExpSource('foo|bar'), '正規表現リテラルでない');
}

// 正規表現リテラルからのソース文字列抽出
export function test_getMatchedTermsFromSource() {
  const source = `
    英語,日本語,フランス語,ドイツ語,中国語,english,japanese,french,german,chinese,
    タガログ語,ポーランド語,ハンガリー語,バルタン星語
  `;

  is(
    '語',
    TextUtils.getMatchedTermsFromSource('語', source).join('\n')
  );

  const expected = '英語,日本語,フランス語,ドイツ語,中国語,タガログ語,ポーランド語,ハンガリー語,バルタン星語'.split(',').sort().join('\n');
  const actual = TextUtils.getMatchedTermsFromSource('[^\\s,]+語', source).join('\n');
  is(expected, actual);
}

// OR検索用正規表現の生成
export function test_getORFindRegExpFromTerms() {
  const terms = '日本語,英語'.split(',');

  const source = TextUtils.getORFindRegExpFromTerms(terms);
  ok(TextUtils.isRegExp(`/${source}/`));

  const regexp = new RegExp(source);
  ok(regexp.test('日本語,フランス語,英語'), regexp);
  ok(regexp.test('フランス語,英語,日本語'), regexp);
  ok(regexp.test('日本語,フランス語'), regexp);
}

export function test_getORFindRegExpFromTerms3() {
  const terms = '日本語,英語,ドイツ語'.split(',');

  const source = TextUtils.getORFindRegExpFromTerms(terms);
  ok(TextUtils.isRegExp(`/${source}/`));

  const regexp = new RegExp(source);
  ok(regexp.test('日本語,フランス語,英語,ドイツ語'), regexp);
  ok(regexp.test('フランス語,ドイツ語,英語,日本語'), regexp);
  ok(regexp.test('日本語,フランス語,ドイツ語'), regexp);
  ok(regexp.test('日本語'), regexp);
}

// AND検索用正規表現の生成
export function test_getANDFindRegExpFromTerms() {
  const terms = '日本語,英語'.split(',');

  const source = TextUtils.getANDFindRegExpFromTerms(terms);
  ok(TextUtils.isRegExp(`/${source}/`));

  const regexp = new RegExp(source);
  ok(regexp.test('日本語,フランス語,英語'), regexp);
  ok(regexp.test('フランス語,英語,日本語'), regexp);
  ng(regexp.test('日本語,フランス語'), regexp);
}

export function test_getANDFindRegExpFromTerms3() {
  const terms = '日本語,英語,ドイツ語'.split(',');

  const source = TextUtils.getANDFindRegExpFromTerms(terms);
  ok(TextUtils.isRegExp(`/${source}/`));

  const regexp = new RegExp(source);
  ok(regexp.test('日本語,ドイツ語,フランス語,英語'), regexp);
  ok(regexp.test('フランス語,英語,ドイツ語,日本語'), regexp);
  ng(regexp.test('日本語,フランス語'), regexp);
}

export function test_splitByBoundaries() {
  is(['にほんご', '日本語', 'ニホンゴ', 'nihongo'].join('\n'),
     TextUtils.splitByBoundaries('にほんご日本語ニホンゴnihongo').join('\n'));
  is(['nihongo', 'eigo', 'japanese', 'english'].join('\n'),
     TextUtils.splitByBoundaries('nihongo eigo japanese english').join('\n'));
}

test_yieldPattern.parameters = [
  ['[abc]', ['a', 'b', 'c']],
  ['[abc][def]', ['ad', 'bd', 'cd', 'ae', 'be', 'ce', 'af', 'bf', 'cf']],
  ['[abc](d|e|f)', ['ad', 'bd', 'cd', 'ae', 'be', 'ce', 'af', 'bf', 'cf']],
  ['x[abc](d|e|f)y', ['xady', 'xbdy', 'xcdy', 'xaey', 'xbey', 'xcey', 'xafy', 'xbfy', 'xcfy']]
];
export function test_yieldPattern([input, expected]) {
  is(expected.sort().join('\n'), TextUtils.yieldPattern(input).join('\n'));
}

test_extractShortestTerms.parameters = [
  [['aa', 'aab', 'aac', 'aad'], ['aa']],
  [['aa', 'aab', 'aac', 'ad'], ['aa', 'ad']],
  [['abc', 'abcfg', 'abchi', 'XYZ'], ['abc', 'XYZ']],
  [['abc', 'xx', 'xxy', 'xxz'], ['abc', 'xx']]
];
export function test_extractShortestTerms([input, expected]) {
  is(expected.sort().join('\n'), TextUtils.extractShortestTerms(input).join('\n'));
}

test_extractShortestTermsAggressively.parameters = [
  [['aax', 'aab', 'aac', 'aad'], ['aa']],
  [['aaf', 'aab', 'aac', 'ad'], ['a']],
  [['abcaa', 'abcfg', 'abchi', 'XYZ'], ['abc', 'XYZ']],
  [['abc', 'xxg', 'xxy', 'xxz'], ['abc', 'xx']]
];
export function test_extractShortestTermsAggressively([input, expected]) {
  is(expected.sort().join('\n'), TextUtils.extractShortestTermsAggressively(input).join('\n'));
}
