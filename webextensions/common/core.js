import Base from './base.js';
import { CacheFactory } from './cache.js';
import TextUtils from './text-utils.js';
import Dictionary from './dictionary.js';
import DictionaryJa from './dictionary-ja.js';
import Engine from './engine.js';
import EngineJa from './engine-ja.js';
import TextTransform from './text-transform.js';
import TextTransformJa from './text-transform-ja.js';

class Core extends Base {
  constructor(aLang) {
    super();
    this.initialized = false;
    this.lang = '';
    this.options = {};
    this.cache = null;
    this.engine = null;

    this.kMIGEMO_PATTERN = /^[\w\-\:\}\{\$\?\*\+\.\^\/\;\\]+$/im;
    this.kNOT_PATTERN = /^-/im;
    this.simplePartOnlyPattern = /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i;

    this.initialize(aLang);
  }

  initialize(aLang) {
    this.lang = aLang || 'en';
  }

  async init(options) {
    if (this.initialized) return;

    this.options = options || {};
    this.lang = options.language || this.lang;

    // Initialize Cache
    this.cache = CacheFactory.get(this.lang);
    await this.cache.init();

    // Choose Engine and Dictionary
    let EngineClass = Engine;
    let DictionaryClass = Dictionary;
    let TextTransformModule = TextTransform;

    if (this.lang.startsWith('ja')) {
      EngineClass = EngineJa;
      DictionaryClass = DictionaryJa;
      TextTransformModule = TextTransformJa;
    }
    else if (this.lang.startsWith('en')) {
      // defaults
    }

    const dictionary = new DictionaryClass();
    const textTransform = TextTransformModule; // TextTransform is a singleton object/module usually

    // Load Dictionary
    await dictionary.load(options);

    this.engine = new EngineClass();
    this.engine.initialize(textTransform, dictionary, this.options);

    this.initialized = true;
  }

  expandInput(aInput, options) {
    return this.engine ? this.engine.expandInput(aInput, options) : [aInput];
  }

  getRegExp(aInput, aTargetDic) {
    return !this.engine ? '' : this.getRegExpInternal(aInput, aTargetDic, undefined);
  }

  getRegExpInternal(aInput, aTargetDic, aEnableAutoSplit) {
    let myExp = [];

    const autoSplit = (aEnableAutoSplit === undefined) ? (this.options.enableAutoSplit !== false) : aEnableAutoSplit;

    // 入力を切って、文節として個別に正規表現を生成する
    const romanTerms = this.engine.splitInput(aInput);
    // log('ROMAN: '+romanTerms.join('/').toLowerCase()+'\n');

    let pattern, romanTermPart;
    for (let i = 0, maxi = romanTerms.length; i < maxi; i++) {
      const romanTerm = romanTerms[i].toLowerCase();

      pattern = this.getRegExpFor(romanTerm, aTargetDic);
      if (!pattern) continue;
      myExp.push(pattern);


      if (!autoSplit) continue;

      romanTermPart = romanTerm;
      while (romanTermPart.length > 1) {
        romanTermPart = romanTermPart.substring(0, romanTermPart.length - 1);
        pattern = this.getRegExpFor(romanTermPart, aTargetDic, true);
        if (!this.simplePartOnlyPattern.test(pattern.replace(/\\\|/g, ''))) {
          myExp[myExp.length - 1] = [
            myExp[myExp.length - 1],
            '|(',
            pattern,
            ')(',
            this.getRegExp(romanTerm.substring(romanTermPart.length, romanTerm.length), aTargetDic),
            ')'
          ].join('').replace(/\n/g, '');
          break;
        }
      }
    }

    myExp = (myExp.length == 1) ? myExp[0] :
      (myExp.length) ? ['(', myExp.join(')([ \t]+)?('), ')'].join('').replace(/\n/g, '') :
        '';

    myExp = myExp.replace(/\n|^\||\|$/g, '')
      .replace(/([^\\]|^)\|\|+/g, '$1|')
      .replace(/([^\\]|^)\(\|/g, '$1(')
      .replace(/([^\\]|^)\|\)/g, '$1)');

    return myExp;
  }

  getRegExps(aInput, aTargetDic) {
    return TextUtils.trim(aInput)
      .split(/\s+/)
      .map(function(aInput) {
        return this.getRegExp(aInput, aTargetDic);
      }, this);
  }

  getRegExpFor(aInput, aTargetDic) {
    if (!aInput) return null;
    if (!this.engine) return null;

    aInput = aInput.toLowerCase();

    const cacheText = this.cache.getCacheFor(aInput, aTargetDic);
    if (cacheText) {
      return cacheText.replace(/\n/g, '');
    }

    const regexpPattern = this.engine.getRegExpFor(aInput, aTargetDic);

    this.cache.setDiskCache(aInput, regexpPattern, aTargetDic);

    return regexpPattern;
  }

  /* AND/NOT find */

  getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic) {
    aExceptionRegExp.value = '';
    if (this.options.enableNOTFind !== false) {
      const exceptions = {};
      aInput = this.siftExceptions(aInput, exceptions);
      if (exceptions.value.length)
        aExceptionRegExp.value = TextUtils.getORFindRegExpFromTerms(this.getRegExps(exceptions.value.join(' '), aTargetDic));
    }
    const regexps = this.getRegExps(aInput, aTargetDic);
    aTermsRegExp.value = TextUtils.getORFindRegExpFromTerms(regexps);
    return regexps;
  }
  getRegExpFunctional(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic) {
    if (!aTermsRegExp) aTermsRegExp = {};
    if (!aExceptionRegExp) aExceptionRegExp = {};
    const regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic);
    return (this.options.enableANDFind !== false) ?
      TextUtils.getANDFindRegExpFromTerms(regexps) :
      this.getRegExp(aInput, aTargetDic);
  }

  siftExceptions(aInput, aExceptions) {
    if (!aExceptions) aExceptions = {};
    aExceptions.value = [];
    const findInput = aInput.split(/\s+/).filter(function(aTerm) {
      if (aTerm.indexOf('-') == 0) {
        aExceptions.value.push(aTerm.substring(1));
        return false;
      }
      return true;
    }).join(' ');
    return findInput;
  }

  isValidFunctionalInput(aInput) {
    const converted = aInput.replace(/\s+/g, '\n');
    return (
      TextUtils.isRegExp(aInput) ||
      this.kMIGEMO_PATTERN.test(converted) ||
      ((this.options.enableNOTFind !== false) && this.kNOT_PATTERN.test(converted))
    );
  }

  trimFunctionalInput(aInput) {
    let input = TextUtils.trim(aInput);
    if (this.options.enableNOTFind !== false) {
      // 入力中のNOT検索用演算子を除外
      input = input.replace(/\s+-$/, '');
    }
    return input;
  }

  getRegExpsFunctional(aInput) {
    const termsRegExp = {};
    const exceptionRegExp = {};
    const regexps = this.getRegExpFunctionalInternal(aInput, termsRegExp, exceptionRegExp);

    const patterns = (this.options.enableANDFind !== false) ?
      regexps :
      [this.getRegExp(aInput)];

    return {
      pattern: (this.options.enableANDFind !== false) ?
        this.getRegExpFunctional(aInput, {}, {}) : // Re-calc is redundant but simplest for NOW. Optimize later if needed.
        patterns[0],
      termsPattern:      termsRegExp.value || '',
      exceptionsPattern: exceptionRegExp.value || '',
      patterns:          patterns
    };
  }

  getAllKnownTermsPattern() {
    return this.engine && this.engine.getAllKnownTermsPattern ? this.engine.getAllKnownTermsPattern() : '';
  }

  static flattenRegExp(regexp) {
    return TextUtils.flattenRegExp(regexp);
  }
}

const CoreFactory = {
  _instances: {},
  get:        function(aLang) {
    if (!this._instances[aLang]) {
      this._instances[aLang] = new Core(aLang);
    }
    return this._instances[aLang];
  }
};

export { Core, CoreFactory };
export default Core;
