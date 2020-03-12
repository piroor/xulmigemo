// This file is licensed under GPL2.
// See also: /license/COPYING.txt

const kMULTIPLE_BR_PATTERN = /\n\n+/g;
const kBRUSH_UP_PATTERN    = /^(.+)(\n\1$)+/gim;

export function brushUpTerms(terms) {
  return [...(terms || [])]
    .sort()
    .join('\n')
    .toLowerCase()
    .replace(kBRUSH_UP_PATTERN, '$1')
    .replace(kMULTIPLE_BR_PATTERN, '\n')
    .split('\n');
}

const kBRUSH_UP_PATTERN_CASE_SENSITIVE = /^(.+)(\n\1$)+/gm;

export function brushUpTermsWithCase(terms) {
  return [...(terms || [])]
    .sort()
    .join('\n')
    .replace(kBRUSH_UP_PATTERN_CASE_SENSITIVE, '$1')
    .replace(kMULTIPLE_BR_PATTERN, '\n')
    .split('\n');
}

// http://ablog.seesaa.net/article/20969848.html
const kBOUNDARY_SPLITTER_PATTERN = /[\u4e00-\u9fa0\u3005\u3006\u30f5\u30f6]+|[\u3041-\u3093]+|[\u30a1-\u30f4\u30fc]+|[a-zA-Z0-9]+|[\uff41-\uff5a\uff21-\uff3a\uff10-\uff19]+|[\u3001\u3002\uff01!\uff1f?()\uff08\uff09\u300c\u300d\u300e\u300f]+|\n/gim;

export function splitByBoundaries(string) {
  const parts = string.split(/\b/);
  let result = [];
  for (const part of parts) {
    const matched = part.match(kBOUNDARY_SPLITTER_PATTERN);
    if (matched)
      result.push(...Array.from(matched, part => part.trim()));
    else
      result.push(part.trim());
  }
  result = result.filter(part => part);
  return result.length > 0 ? result : parts;
}


// manipulate regular expressions

// []^.+*?$|{}\(),  正規表現のメタキャラクタをエスケープ
const kSANITIZE_PATTERN = /([\-\:\}\{\|\$\?\*\+\.\^\]\/\[\;\\\(\)])/g;
export function sanitize(string) {
  return string.replace(kSANITIZE_PATTERN, '\\$1');
}

// ()[]|\,
const kSANITIZE_PATTERN_INPUT = /([\(\)\[\]\|\\])/g;
export function sanitizeForTransformInput(string) {
  return string.replace(kSANITIZE_PATTERN_INPUT, '\\$1');
}

// ^.+*?${},
const kSANITIZE_PATTERN_OUTPUT = /([\-\:\}\{\$\?\*\+\.\^\/\;])/g;
export function sanitizeForTransformOutput(string) {
  return string.replace(kSANITIZE_PATTERN_OUTPUT, '\\$1');
}

const kREGEXP_PATTERN = /^\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/])+)\/([gimy]*)$/;
// old version: /^\/((?:\\.|[^\/])+)\/[gimy]*$/
// see http://nanto.asablo.jp/blog/2008/05/22/3535735

export function extractRegExpSource(input) {
  return kREGEXP_PATTERN.test(input) ?
    RegExp.$1 :
    input;
}

export function isRegExp(input) {
  return kREGEXP_PATTERN.test(input);
}

export function getMatchedTermsFromSource(givenRegExp, source) {
  let flags = '';
  let regexp;
  if (isRegExp(givenRegExp)) {
    const regexpSource = extractRegExpSource(givenRegExp);
    flags = givenRegExp.match(/[^\/]+$/);
    if (flags && !Array.prototype.includes.call(flags, 'g'))
      flags += 'g';
    regexp = new RegExp(regexpSource, flags || 'gim');
  }
  else {
    regexp = new RegExp(givenRegExp, 'gim');
  }
  const result = (source || '').match(regexp) || [];
  return !Array.prototype.includes.call(flags, 'i') ?
    brushUpTermsWithCase(result) :
    brushUpTerms(result);
}

export function getORFindRegExpFromTerms(terms) {
  switch (terms.length) {
    case 0:
      return '';
    case 1:
      return terms[0];
    default:
      return `(?:${terms.join(')|(?:')})`;
  }
}

export function getANDFindRegExpFromTerms(terms) {
  switch (terms.length) {
    case 0:
      return '';
    case 1:
      return terms[0];
    case 2:
      return `(?:${terms[0]}).*(?:${terms[1]})|(?:${terms[1]}).*(?:${terms[0]})`;
    default:
      return getPermutations(terms).map(terms => {
        return `(?:${terms.join(').*(?:')})`;
      }).join('|');
  }
}

// Original version is: get-permutations npm module made by Jan Järfalk
// Licensed: ISC
// https://github.com/janjarfalk/get-permutations
function getPermutations(array) {
  const permutations = [];
  const nextPermutation = [];

  function permutate(array) {
    if (array.length === 0) {
      permutations.push(nextPermutation.slice());
    }

    for (let i = 0; i < array.length; i++) {
      array.push(array.shift());
      nextPermutation.push(array[0]);
      permutate(array.slice(1));
      nextPermutation.pop();
    }
  }

  permutate(array);

  return permutations;
}
