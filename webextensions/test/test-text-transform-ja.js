/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import fs from 'fs';
import path from 'path';

import MigemoTextTransformJa from '../modules/core/textTransformJa.js';

import { assert } from 'tiny-esm-test-runner';
const { is, ok, ng } = assert;

const currentDir = path.dirname(new URL(import.meta.url).pathname);

const convertPatterns = (() => {
  const contents = fs.readFileSync(`${currentDir}/assets/text-transform-ja-convert-patterns.tsv`, 'utf8');
  const patterns = {};
  let header;
  for (const row of contents.split('\n')) {
    if (!row.trim())
      continue;
    if (!header) {
      header = row.split('\t').slice(1);
      continue;
    }
    const columns = row.split('\t');
    const key = columns.shift();
    patterns[key] = {};
    for (let i = 0, maxi = columns.length; i < maxi; i++) {
      patterns[key][header[i]] = columns[i];
    }
  }
  return patterns;
})();


test_optimizeRegExp.parameters = {
  singleCharacters:                 ['(a|b|c)', '[abc]'],
  singleCharactersWithBlank:        ['(a|||b|||c)', '[abc]'],
  multipleCharacters:               ['(a|b|cd)', '(a|b|cd)'],
  multipleCharactersWithBlank:      ['(a|||b|||cd)', '(a|b|cd)'],
  includesOpenParen:                ['(\\()', '(\\()'],
  includesCloseParen:               ['(\\))', '(\\))'],
  includesParen:                    ['(\\(\\))', '(\\(\\))'],
  includesFullWidthOpenParen:       ['(\\(|（)', '(\\(|（)'],
  includesFullWidthCloseParen:      ['(\\)|）)', '(\\)|）)'],
  includesFullWidthParen:           ['((\\(|（)(\\)|）))', '((\\(|（)(\\)|）))'],
  includesOpenBracket:              ['(\\[)', '(\\[)'],
  includesCloseBracket:             ['(\\])', '(\\])'],
  includesBracket:                  ['(\\[\\])', '(\\[\\])'],
  includesFullWidthOpenBracket:     ['(\\[|［)', '(\\[|［)'],
  includesFullWidthCloseBracket:    ['(\\]|］)', '(\\]|］)'],
  includesFullWidthBracketAndParen: ['((\\[|［)(\\]|］))', '((\\[|［)(\\]|］))']
};
export function test_optimizeRegExp([input, expected]) {
  is(expected, MigemoTextTransformJa.optimizeRegExp(input));
}

test_normalizeInput.parameters = convertPatterns;
export function test_normalizeInput({ input, toNormalizedInput: expected }) {
  is(expected, MigemoTextTransformJa.normalizeInput(input));
}

test_normalizeKeyInput.parameters = convertPatterns;
export function test_normalizeKeyInput({ input, toNormalizedKeyInput: expected }) {
  is(expected, MigemoTextTransformJa.normalizeKeyInput(input));
}


const roman2kanaRawPatterns = {
  //                   [input, hiragana, katakana, mixed]
  '濁点無し': ['aiueo',
    'あいうえお',
    '[アｱ][イｲ][ウｳ][エｴ][オｵ]',
    '[あアｱ][いイｲ][うウｳ][えエｴ][おオｵ]'],
  '濁点有り': ['gagigugego',
    'がぎぐげご',
    '(ガ|ｶﾞ)(ギ|ｷﾞ)(グ|ｸﾞ)(ゲ|ｹﾞ)(ゴ|ｺﾞ)',
    '(が|ガ|ｶﾞ)(ぎ|ギ|ｷﾞ)(ぐ|グ|ｸﾞ)(げ|ゲ|ｹﾞ)(ご|ゴ|ｺﾞ)'],
  '濁点混じり': ['nihongo',
    'にほんご',
    '[ニﾆ][ホﾎ][ンﾝ](ゴ|ｺﾞ)',
    '[にニﾆ][ほホﾎ][んンﾝ](ご|ゴ|ｺﾞ)'],
  includesHyphen: ['po-to',
    'ぽーと',
    '(ポ|ﾎﾟ)[ーｰ-][トﾄ]',
    '(ぽ|ポ|ﾎﾟ)[ーｰ-][とトﾄ]'],
  '拗音・撥音': ['kyakkya',
    'きゃっきゃ',
    '[キｷ][ャｬ][ッｯ][キｷ][ャｬ]',
    '[きキｷ][ゃャｬ][っッｯ][きキｷ][ゃャｬ]'],
  yayoi: ['uwwu-',
    'うっうー',
    '[ウｳ][ッｯ][ウｳ][ーｰ-]',
    '[うウｳ][っッｯ][うウｳ][ーｰ-]'],
  fullWidthAlphabets: ['ａｉｕｅｏ',
    'ａｉｕｅｏ',
    'ａｉｕｅｏ',
    'ａｉｕｅｏ'],
  paren: ['\\(\\)\\[\\]\\|',
    '\\(\\)\\[\\]\\|',
    '\\(\\)\\[\\]\\|',
    '\\(\\)\\[\\]\\|'],
  openParen: ['\\(\\[',
    '\\(\\[',
    '\\(\\[',
    '\\(\\['],
  closeParen: ['\\)\\]',
    '\\)\\]',
    '\\)\\]',
    '\\)\\]'],
  pipe: ['\\|',
    '\\|',
    '\\|',
    '\\|'],
};

const roman2kanaMatchingPatterns = {
  //                         [roman-input,
  //                          expected-hiragana(s), unexpected-hiragana(s),
  //                          expected-katakana(s), unexpected-katakana(s),
  //                          expected-mixed(s), unexpected-mixed(s)]
  'N1個で「ん」': ['kantoku',
    ['かんとく'], ['カントク'],
    ['カントク', 'ｶﾝﾄｸ'], ['かんとく'],
    ['かンとく'], []],
  'N2個で「ん」': ['kanntoku',
    ['かんとく'], ['カントク'],
    ['カントク', 'ｶﾝﾄｸ'], ['かんとく'],
    ['かンとく'], []],
  //'な行の後にN1個で「ん」' : ['nannin',
  //                            ['なんにん'], ['ナンニン'],
  //                            ['ナンニン', 'ﾅﾝﾆﾝ'], ['なんにん'],
  //                            ['なんニン', 'ナンニん'], []],
  'な行の後にN2個で「ん」': ['nannnin',
    ['なんにん'], ['ナンニン'],
    ['ナンニン', 'ﾅﾝﾆﾝ'], ['なんにん'],
    ['なんニン', 'ナンニん'], []],
  WE: ['werukamu',
    ['うぇるかむ'], ['ウェルカム'],
    ['ウェルカム', 'ｳｪﾙｶﾑ'], ['うぇるかむ'],
    ['ウぇるカむ', 'ゑるカム'], []],
  VE: ['vekuta-',
    ['う゛ぇくたー'], ['ヴェクター'],
    ['ヴェクター', 'ｳﾞｪｸﾀｰ'], ['う゛ぇくたー'],
    [], []],
  VEandDHI: ['verudhi',
    ['う゛ぇるでぃ'], ['ヴェルディ'],
    ['ヴェルディ', 'ｳﾞｪﾙﾃﾞｨ'], ['う゛ぇるでぃ'],
    [], []]
};

test_roman2kana.parameters = roman2kanaRawPatterns;
export function test_roman2kana([input, expected]) {
  is(expected, MigemoTextTransformJa.roman2kana(input));
}

test_roman2kana_patterns.parameters = roman2kanaMatchingPatterns;
export function test_roman2kana_patterns([input, expecteds]) {
  const regexp = new RegExp(MigemoTextTransformJa.roman2kana(input), 'i');
  is(expecteds.map(expected => `${expected}:true`).join('\n'),
     expecteds.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
     regexp);
}

test_roman2kanaWithMode.parameters = roman2kanaRawPatterns;
export function test_roman2kanaWithMode([input, expectedHiragana, expectedKatakana, expectedHiraganaAndKatakana]) {
  is(
    [
      expectedHiragana,
      expectedKatakana,
      expectedHiraganaAndKatakana
    ].join('\n'),
    [
      MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.HIRAGANA),
      MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.KATAKANA),
      MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.HIRAGANA_KATAKANA)
    ].join('\n')
  );
}

test_roman2kanaWithMode_patterns.parameters = roman2kanaMatchingPatterns;
export function test_roman2kanaWithMode_patterns([
  input,
  expectedHiragana, unexpectedHiragana,
  expectedKatakana, unexpectedKatakana,
  expectedMixed, unexpectedMixed
]) {
  {
    const regexp = new RegExp(MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.HIRAGANA), 'i');
    is(expectedHiragana.map(expected => `${expected}:true`).join('\n'),
       expectedHiragana.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
    is(unexpectedHiragana.map(expected => `${expected}:false`).join('\n'),
       unexpectedHiragana.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
  }
  {
    const regexp = new RegExp(MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.KATAKANA), 'i');
    is(expectedKatakana.map(expected => `${expected}:true`).join('\n'),
       expectedKatakana.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
    is(unexpectedKatakana.map(expected => `${expected}:false`).join('\n'),
       unexpectedKatakana.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
  }
  {
    const regexp = new RegExp(MigemoTextTransformJa.roman2kanaWithMode(input, MigemoTextTransformJa.HIRAGANA_KATAKANA), 'i');
    const shouldMatch = [...expectedHiragana, ...expectedKatakana, ...expectedMixed];
    is(shouldMatch.map(expected => `${expected}:true`).join('\n'),
       shouldMatch.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
    is(unexpectedMixed.map(expected => `${expected}:false`).join('\n'),
       unexpectedMixed.map(expected => `${expected}:${regexp.test(expected)}`).join('\n'),
       regexp);
  }
}


test_hira2roman.parameters = convertPatterns;
export function test_hira2roman({ input, toRoman: expected }) {
  is(expected, MigemoTextTransformJa.hira2roman(input));
}

test_hira2kata.parameters = convertPatterns;
export function test_hira2kata({ input, toKatakana: expected }) {
  is(expected, MigemoTextTransformJa.hira2kata(input));
}

test_hira2kataPattern.parameters = convertPatterns;
export function test_hira2kataPattern({ input, toKatakanaPattern: expected }) {
  is(expected, MigemoTextTransformJa.hira2kataPattern(input));
}

test_kata2hira.parameters = convertPatterns;
export function test_kata2hira({ input, toHiragana: expected }) {
  is(expected, MigemoTextTransformJa.kata2hira(input));
}

test_zenkaku2hankaku.parameters = convertPatterns;
export function test_zenkaku2hankaku({ input, toHankaku: expected }) {
  is(expected, MigemoTextTransformJa.zenkaku2hankaku(input));
}

test_roman2zen.parameters = convertPatterns;
export function test_roman2zen({ input, toRomanZenkaku: expected }) {
  is(expected, MigemoTextTransformJa.roman2zen(input));
}

test_normalizeForYomi.parameters = convertPatterns;
export function test_normalizeForYomi({ input, toYomi: expected }) {
  is(expected, MigemoTextTransformJa.normalizeForYomi(input));
}

test_isYomiMatch.parameters = [
  'aiueo',
  'alphabet',
  'happy99',
  'アイウエオ',
  'ｱｲｳｴｵ',
  'ｶﾞｷﾞｸﾞｹﾞｺﾞ',
  'po-to'
];
export function test_isYomiMatch(input) {
  ok(MigemoTextTransformJa.isYomi(input));
}

test_isYomiNotMatch.parameters = [
  '日本語',
  '()[]|',
  '([',
  ')]',
  '|',
  'window.open();',
  'window.open("about:blank", "_blank", "all");'
];
export function test_isYomiNotMatch(input) {
  ng(MigemoTextTransformJa.isYomi(input));
}

test_joinVoiceMarks.parameters = [
  ['aiueo', 'aiueo'],
  ['ａｉｕｅｏ', 'ａｉｕｅｏ'],
  ['あいうえお', 'あいうえお'],
  ['アイウエオ', 'アイウエオ'],
  ['がぎぐげご', 'がぎぐげご'],
  ['か゛き゛く゛け゛こ゛', 'がぎぐげご'],
  ['は゜ひ゜ふ゜へ゜ほ゜', 'ぱぴぷぺぽ'],
  ['あ゛い゛う゛え゛お゛', 'あ゛い゛う゛え゛お゛'],
  ['ｱｲｳｴｵ', 'ｱｲｳｴｵ'],
  ['ｶﾞｷﾞｸﾞｹﾞｺﾞ', 'ガギグゲゴ'],
  ['カ゛キ゛ク゛ケ゛コ゛', 'ガギグゲゴ'],
  ['ハ゜ヒ゜フ゜ヘ゜ホ゜', 'パピプペポ'],
  ['ア゛イ゛ウ゛エ゛オ゛', 'ア゛イ゛ヴエ゛オ゛'],
  ['po-to', 'po-to'],
  ['日本語', '日本語'],
  ['()[]|', '()[]|'],
  ['([', '(['],
  [')]', ')]'],
  ['|', '|'],
  ['window.open();', 'window.open();'],
  ['window.open("about:blank", "_blank", "all");', 'window.open("about:blank", "_blank", "all");']
];
export function test_joinVoiceMarks([input, expected]) {
  is(expected, MigemoTextTransformJa.joinVoiceMarks(input));
}

test_expand.parameters = [
  ['k', 'け'],
  ['かk', 'かかあ'],
  ['かk', 'かこ'],
  ['かk', 'かっか'],
  ['-', 'ー'],
  ['お-', 'おー']
];
export function test_expand([input, textToBeMatched]) {
  const regexp = new RegExp(MigemoTextTransformJa.expand(input), 'i');
  ok(regexp.test(textToBeMatched), regexp);
}

test_expandWithMode.parameters = [
  ['-', 'ー', MigemoTextTransformJa.HIRAGANA],
  ['-', 'ー', MigemoTextTransformJa.KATAKANA],
  ['-', 'ｰ', MigemoTextTransformJa.KATAKANA],
  ['-', '-', MigemoTextTransformJa.KATAKANA],
  ['-', 'ー', MigemoTextTransformJa.HIRAGANA_KATAKANA],
  ['-', 'ｰ', MigemoTextTransformJa.HIRAGANA_KATAKANA],
  ['-', '-', MigemoTextTransformJa.HIRAGANA_KATAKANA],

  ['お-', 'おー', MigemoTextTransformJa.HIRAGANA],
  ['お-', 'おー', MigemoTextTransformJa.KATAKANA],
  ['お-', 'おｰ', MigemoTextTransformJa.KATAKANA],
  ['お-', 'お-', MigemoTextTransformJa.KATAKANA],
  ['お-', 'おー', MigemoTextTransformJa.HIRAGANA_KATAKANA],
  ['お-', 'おｰ', MigemoTextTransformJa.HIRAGANA_KATAKANA],
  ['お-', 'お-', MigemoTextTransformJa.HIRAGANA_KATAKANA]
];
export function test_expandWithMode([input, textToBeMatched, mode]) {
  const regexp = new RegExp(MigemoTextTransformJa.expandWithMode(input, mode), 'i');
  ok(regexp.test(textToBeMatched), regexp);
}
