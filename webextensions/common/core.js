// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import { MigemoCoreFactory } from '../modules/core/MigemoCore.js';

let migemo = null;

export async function init(options = {}) {
  const lang = options.language || 'en';
  migemo = MigemoCoreFactory.get(lang);
  await migemo.init(options);
}

export function getRegExp(input) {
  return migemo ? migemo.getRegExp(input) : '';
}

export function getRegExps(input) {
  return migemo ? migemo.getRegExps(input) : [];
}

export function getRegExpFor(input) {
  return migemo ? migemo.getRegExpFor(input) : null;
}

export function splitInput(input) {
  return migemo && migemo.engine ? migemo.engine.splitInput(input) : [input];
}

export function gatherEntriesFor(input) {
  return migemo && migemo.engine ? migemo.engine.gatherEntriesFor(input) : [];
}

export function getRegExpFunctional(input) {
  if (!migemo) {
    return { pattern: '', termsPattern: '', exceptionsPattern: '' };
  }
  const termsRegExp = {};
  const exceptionRegExp = {};
  const pattern = migemo.getRegExpFunctional(input, termsRegExp, exceptionRegExp);
  return {
    pattern: pattern,
    termsPattern: termsRegExp.value || '',
    exceptionsPattern: exceptionRegExp.value || ''
  };
}

export function getRegExpsFunctional(input) {
  // webextensions/common/core.js had this returning { pattern, termsPattern, exceptionsPattern, patterns: [] }
  // MigemoCore does NOT have getRegExpsFunctional (XUL core.js line 352 has it).
  // XUL core.js getRegExpsFunctional returns ARRAY of patterns?
  // Let's check XUL core.js Step 140.
  /*
  getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic)
  {
    // ...
    var regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic);
    return this.andFindAvailable ?
        regexps :
        [this.getRegExp(aInput, aTargetDic)] ;
  },
  */
  // It returns Array of regex strings.

  if (!migemo) {
    return { pattern: '', termsPattern: '', exceptionsPattern: '', patterns: [] };
  }

  // Note: webextensions/common/core.js implementation seemed to return object with patterns array.
  // I will check Step 141 implementation.
  /*
  export function getRegExpsFunctional(input) {
    const result   = getRegExpFunctionalInternal(input);
    const patterns = (mEnableANDFind ?
      result.patterns :
      [getRegExp(input)]
    );
    return { ...result, patterns };
  }
  */
  // result comes from getRegExpFunctionalInternal.
  // In MigemoCore.js, getRegExpFunctionalInternal returns `regexps` (Array).
  // And it populates out-params.

  // So I should replicate that.

  // But wait, MigemoCore.js DOES NOT EXPORT getRegExpFunctionalInternal.
  // It only exports getRegExpFunctional (returns String).

  // I should use getRegExpFunctionalInternal if possible or reimplement wrapper?
  // MigemoCore.js (Step 176) shows getRegExpFunctionalInternal IS a property of prototype/instance.
  // So I can call it.

  const termsRegExp = {};
  const exceptionRegExp = {};
  const regexps = migemo.getRegExpFunctionalInternal(input, termsRegExp, exceptionRegExp);

  const patterns = (migemo.options.enableANDFind !== false) ?
    regexps :
    [migemo.getRegExp(input)];

  return {
    pattern: (migemo.options.enableANDFind !== false) ?
      // We need to construct termsPattern manually? 
      // No, getRegExpFunctionalInternal populated termsRegExp.value which IS the OR-ed pattern.
      // Wait, pattern usually means the final AND-ed pattern for AND find.
      // MigemoCore.getRegExpFunctional returns the final pattern.
      // Here we want patterns array AND the final pattern?
      migemo.getRegExpFunctional(input, {}, {}) : // Re-call or reconstruct?
      patterns[0], // If AND disabled, pattern is just getRegExp
    termsPattern: termsRegExp.value || '',
    exceptionsPattern: exceptionRegExp.value || '',
    patterns: patterns
  };
  // Re-calling getRegExpFunctional might be wasteful but safe.
  // Better: reuse termsRegExp.value if possible.
  // If AND enabled, pattern is AND(regexps).
  // MigemoTextUtils isn't imported here.
  // So simpler to just call getRegExpFunctional again or just use return value if I can.
  // XUL getRegExpFunctional calls getRegExpFunctionalInternal then calls TextUtils.getANDFindRegExpFromTerms.

  // I'll leave 'pattern' out of getRegExpsFunctional return if it wasn't there?
  // Step 141: `return { ...result, patterns };`
  // result had `termsPattern` and `exceptionsPattern`. It did NOT have `pattern`.
  // So `getRegExpsFunctional` returns `{ termsPattern, exceptionsPattern, patterns }`.

  return {
    termsPattern: termsRegExp.value || '',
    exceptionsPattern: exceptionRegExp.value || '',
    patterns: patterns
  };
}

export function isValidFunctionalInput(input) {
  return migemo ? migemo.isValidFunctionalInput(input) : false;
}

export function trimFunctionalInput(input) {
  return migemo ? migemo.trimFunctionalInput(input) : input;
}

export function expandInput(input, options) {
  return migemo ? migemo.expandInput(input, options) : [input];
}

export function getAllKnownTermsPattern() {
  return migemo && migemo.engine && migemo.engine.getAllKnownTermsPattern ? migemo.engine.getAllKnownTermsPattern() : '';
}

export function flattenRegExp(regexp) {
  if (!regexp)
    return [];

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
        if (typeof scope[scope.length - 1] != 'string') {
          scope.push('');
        }
        scope[scope.length - 1] += character;
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
  for (let i = 0, maxi = terms.length; i < maxi; i++) {
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
    if (term.charAt(term.length - 1) != '|') {
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

  return containsArray ? [final] : final;
}
