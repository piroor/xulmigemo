// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import * as TextUtils from './text-utils.js';
import * as TextTransformJa from './text-transform-ja.js';
import * as DictionaryJa from './dictionary-ja.js';


let mIgnoreHiraganaKatakana = true;
let mIgnoreLatinModifiers   = true;

export function init({
  ignoreHiraganaKatakana,
  ignoreLatinModifiers
} = {}) {
  mIgnoreHiraganaKatakana = !!ignoreHiraganaKatakana;
  mIgnoreLatinModifiers   = !!ignoreLatinModifiers;
}

export function getRegExpFor(rawInput) {
  if (!rawInput)
    return null;

  rawInput = rawInput.toLowerCase();

  //console.log('noCache');

  const roman    = toRoman(rawInput);
  const hiragana = toHiragana(rawInput);
  const katakana = mIgnoreHiraganaKatakana ?
    '' :
    TextTransformJa.expandWithMode(
      TextUtils.sanitizeForTransformOutput(
        TextTransformJa.roman2kanaWithMode(
          TextUtils.sanitizeForTransformInput(roman),
          TextTransformJa.KATAKANA
        )
      ),
      TextTransformJa.KATAKANA
    );
  const hiraganaAndKatakana = mIgnoreHiraganaKatakana ?
    TextTransformJa.expandWithMode(
      TextUtils.sanitizeForTransformOutput(
        TextTransformJa.roman2kanaWithMode(
          TextUtils.sanitizeForTransformInput(roman),
          TextTransformJa.HIRAGANA_KATAKANA
        )
      ),
      TextTransformJa.HIRAGANA_KATAKANA
    ) :
    `${hiragana}|${katakana}`;
  //console.log('hiraganaAndKatakana: ', hiraganaAndKatakana);

  const zenkaku = TextTransformJa.roman2zen(rawInput); // rawInput ?
  //console.log('zenkaku: ', zenkaku);

  let originalInput = TextUtils.sanitize(rawInput);
  if (mIgnoreLatinModifiers)
    originalInput = TextTransformJa.addLatinModifiers(originalInput);

  let pattern = '';
  const entries = gatherEntriesFor(rawInput);
  if (entries.length > 0) {
    const terms = [];
    if (!/[\[\(]/.test(zenkaku))
      terms.push(zenkaku);
    if (!/[\[\(]/.test(hiraganaAndKatakana)) {
      terms.push(hiragana);
      terms.push(katakana);
    }
    const expandedTerms = terms.concat(entries).join('\n').replace(/(\t|\n\n)+/g, '\n');

    if (/[\[\(]/.test(zenkaku))
      pattern += `${pattern ? '|' : ''}${zenkaku}`;
    if (/[\[\(]/.test(hiraganaAndKatakana))
      pattern += `${pattern ? '|' : ''}${hiraganaAndKatakana}`;

    // 一文字だけの項目だけは、抜き出して文字クラスにまとめる
    const oneLetterTerms = expandedTerms
      .replace(/^..+$\n?/mg, '')
      .split('\n')
      .sort()
      .join('')
      .replace(/(.)\1+/g, '$1');
    if (oneLetterTerms)
      pattern += `${pattern ? '|' : ''}[${oneLetterTerms}]`;

    const shortestSearchterm = TextUtils.extractShortestTerms(
      expandedTerms.split('\n'),
      { rejectOneLetterTerms: true } // 一文字だけの項目は用済みなので削除
    ).join('|');
    pattern += `${pattern ? '|' : ''}${shortestSearchterm}`;

    pattern += `${pattern ? '|' : ''}${originalInput}`;
    pattern = pattern.replace(/\n/g, '');

    //console.log('pattern (from dictionary): ', pattern);
  }
  else { // 辞書に引っかからなかった模様なので自前の文字列だけ
    pattern = originalInput;
    if (originalInput != zenkaku)
      pattern += `|${zenkaku}`;
    if (originalInput != hiraganaAndKatakana)
      pattern += `|${hiraganaAndKatakana}`;
    //console.log('pattern: ', pattern);
  }

  return pattern
    .replace(/\n|^\||\|$/g, '')
    .replace(/([^\\]|^)\|\|+/g, '$1|')
    .replace(/([^\\]|^)\(\|/g, '$1(')
    .replace(/([^\\]|^)\|\)/g, '$1)');
}

function toHiragana(rawInput) {
  return TextTransformJa.expand(
    TextUtils.sanitizeForTransformOutput(
      TextTransformJa.roman2kana(
        TextTransformJa.kata2hira(
          TextUtils.sanitizeForTransformInput(rawInput)
        )
      )
    )
  );
}

function toRoman(rawInput) {
  if (/[\uff66-\uff9f]/.test(rawInput))
    return TextTransformJa.hira2roman(TextTransformJa.kata2hira(rawInput));
  return rawInput;
}

// for omnibar
export function expandInput(rawInput, { shortest = false } = {}) {
  if (!rawInput)
    return [rawInput];

  rawInput = rawInput.toLowerCase();

  const terms = [rawInput];

  const roman = toRoman(rawInput);
  if (roman)
    terms.push(roman);
  const hiragana = toHiragana(rawInput);
  if (hiragana)
    terms.push(...TextUtils.yieldPattern(hiragana));
  const katakana = TextTransformJa.hira2kata(hiragana);
  if (katakana) {
    terms.push(...TextUtils.yieldPattern(katakana));
    // 半角カナの単語も生成する処理が必要
  }
  const zenkaku = TextTransformJa.roman2zen(rawInput);
  if (zenkaku)
    terms.push(zenkaku);
  const entries = gatherEntriesFor(rawInput);
  if (entries.length > 0)
    terms.push(entries.join('\n').replace(/^[^\t]+\t/gm, ''));

  const expandedTerms = terms
    .join('\n')
    .replace(/(\t|\n\n)+/g, '\n')
    .split('\n');
  if (shortest)
    return TextUtils.extractShortestTermsAggressively(expandedTerms);
  return TextUtils.extractShortestTerms(expandedTerms);
}

export function gatherEntriesFor(rawInput) {
  if (!rawInput)
    return [];

  let input = TextUtils.sanitize(rawInput);
  if (mIgnoreLatinModifiers)
    input = TextTransformJa.addLatinModifiers(input);

  const hiragana = TextTransformJa.expand(
    TextUtils.sanitize(
      TextTransformJa.roman2kana(
        TextTransformJa.kata2hira(rawInput)
      )
    )
  );

  const regexpHiragana = new RegExp(`^${hiragana}.+$`, 'mg');
  const regexpAlphabet = new RegExp(`^(${input}).+$`, 'mg');
  const result = [];

  const alphabetEntries = DictionaryJa.getAlphabet().match(regexpAlphabet);
  //console.log('searchEnDic');
  if (alphabetEntries && alphabetEntries.length > 0) {
    result.push(...alphabetEntries);
    //console.log(` found ${alphabetEntries.length} terms`);
  }

  const hiraganaEntries = DictionaryJa.get(rawInput).match(regexpHiragana);
  //console.log('searchJpnDic');
  if (hiraganaEntries && hiraganaEntries.length > 0) {
    result.push(...hiraganaEntries);
    //console.log(` found ${hiraganaEntries.length} terms`);
  }

  return result;
}


let mCachedAllKnownTermsPattern;

export function getAllKnownTermsPattern() {
  if (mCachedAllKnownTermsPattern)
    return mCachedAllKnownTermsPattern;

  const start = Date.now();
  const allEntries = DictionaryJa.getAll().trim().replace(/(\t|\n\n)+/g, '\n').trim();

  // 一文字だけの項目だけは、抜き出して文字クラスにまとめる
  const oneLetterTerms = allEntries
    .replace(/^..+$\n?/mg, '')
    .split('\n')
    .sort()
    .join('')
    .replace(/(.)\1+/g, '$1');

  const shortestTerms = TextUtils.extractShortestTerms(
    allEntries.split(/[\t\n]+/),
    { rejectOneLetterTerms: true } // 一文字だけの項目は用済みなので削除
  );

  mCachedAllKnownTermsPattern = [
    '[-_a-z0-9]+',
    '[\u3041-\u3096]+',
    '[\u30A1-\u30FA]+',
    `[${oneLetterTerms}]`,
    ...shortestTerms
  ].join('|').replace(/^\||\|$/g, '').replace(/\|\|+/g, '|');

  return mCachedAllKnownTermsPattern;
}


const SYMBOLS_MATCHER = new RegExp('([!"#\$%&\'\\(\\)=‾\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g');

export function splitInput(input) {
  return (
    (/^[A-Z]{2,}/.test(input)) ?
      input.replace(/([a-z])/g, '\t$1') : // CapsLockされてる場合は小文字で区切る
      input.replace(/([A-Z])/g, '\t$1')
  )
    .replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
    .replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
    .replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
    .replace(SYMBOLS_MATCHER, '\t$1\t')
    .replace(/ +|\t\t+/g, '\t')
    .replace(/^[\s\t]+|[\s\t]+$/g, '')
    .split('\t');
}
