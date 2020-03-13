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

  const hiragana = TextTransformJa.expand(
    TextUtils.sanitizeForTransformOutput(
      TextTransformJa.roman2kana(
        TextTransformJa.kata2hira(
          TextUtils.sanitizeForTransformInput(rawInput)
        )
      )
    )
  );

  let roman = rawInput;
  if (/[\uff66-\uff9f]/.test(roman))
    roman = TextTransformJa.hira2roman(TextTransformJa.kata2hira(roman));

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
    const searchterm = terms.concat(entries).join('\n').replace(/(\t|\n\n)+/g, '\n');

    if (/[\[\(]/.test(zenkaku))
      pattern += `${pattern ? '|' : ''}${zenkaku}`;
    if (/[\[\(]/.test(hiraganaAndKatakana))
      pattern += `${pattern ? '|' : ''}${hiraganaAndKatakana}`;

    // 一文字だけの項目だけは、抜き出して文字クラスにまとめる
    const oneLetterTerms = searchterm
      .replace(/^..+$\n?/mg, '')
      .split('\n')
      .sort()
      .join('')
      .replace(/(.)\1+/g, '$1');
    if (oneLetterTerms)
      pattern += `${pattern ? '|' : ''}[${oneLetterTerms}]`;

    const shortestSearchterm = TextUtils.sanitize(
      // foo, foobar, fooee... といった風に、同じ文字列で始まる複数の候補がある場合は、
      // 最も短い候補（この例ならfoo）だけにする
      searchterm
        .split('\n')
        .sort()
        .join('\n')
        .replace(/^(.+)$(\n\1.*$)+/img, '$1')
        .replace(/^.$\n?/mg, '') // 一文字だけの項目は用済みなので削除
    ).replace(/\n/g, '|');
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
