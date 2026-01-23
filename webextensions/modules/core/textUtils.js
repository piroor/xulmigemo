var EXPORTED_SYMBOLS = ['MigemoTextUtils'];

var MigemoTextUtils = {
  /* string operations */

  trim: function (aInput) {
    return aInput
      .replace(this.kTRIM_PATTERN, '');
  },
  kTRIM_PATTERN: /^\s+|\s+$/g,

  brushUpTerms: function (aTerms) {
    return [...(aTerms || [])]
      .sort()
      .join('\n')
      .toLowerCase()
      .replace(this.kBRUSH_UP_PATTERN, '$1')
      .replace(this.kMULTIPLE_BR_PATTERN, '\n')
      .split('\n');
  },
  kMULTIPLE_BR_PATTERN: /\n\n+/g,
  kBRUSH_UP_PATTERN: /^(.+)(\n\1$)+/gim,
  brushUpTermsWithCase: function (aTerms) {
    return [...(aTerms || [])]
      .sort()
      .join('\n')
      .replace(this.kBRUSH_UP_PATTERN_CASE_SENSITIVE, '$1')
      .replace(this.kMULTIPLE_BR_PATTERN, '\n')
      .split('\n');
  },
  kBRUSH_UP_PATTERN_CASE_SENSITIVE: /^(.+)(\n\1$)+/gm,

  splitByBoundaries: function (aString) {
    var parts = aString.split(/\b/);
    var result = [];
    parts.forEach(function (aPart) {
      var matched = aPart.match(this.kBOUNDARY_SPLITTER_PATTERN);
      if (matched)
        result = result.concat(matched);
      else
        result.push(aPart);
    }, this);
    result = result.filter(function (aPart) {
      return this.trim(aPart);
    }, this);
    return result.length ? result : parts;
  },
  // http://ablog.seesaa.net/article/20969848.html
  kBOUNDARY_SPLITTER_PATTERN: /[\u4e00-\u9fa0\u3005\u3006\u30f5\u30f6]+|[\u3041-\u3093]+|[\u30a1-\u30f4\u30fc]+|[a-zA-Z0-9]+|[\uff41-\uff5a\uff21-\uff3a\uff10-\uff19]+|[\u3001\u3002\uff01!\uff1f?()\uff08\uff09\u300c\u300d\u300e\u300f]+|\n/gim,

  /* manipulate regular expressions */

  sanitize: function (str) {
    //	[]^.+*?$|{}\(),  正規表現のメタキャラクタをエスケープ
    str = str.replace(this.kSANITIZE_PATTERN, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN: /([\-\:\}\{\|\$\?\*\+\.\^\]\/\[\;\\\(\)])/g,

  sanitizeForTransformInput: function (str) {
    //	()[]|\,
    str = str.replace(this.kSANITIZE_PATTERN_INPUT, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN_INPUT: /([\(\)\[\]\|\\])/g,

  sanitizeForTransformOutput: function (str) {
    //	^.+*?${},
    str = str.replace(this.kSANITIZE_PATTERN_OUTPUT, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN_OUTPUT: /([\-\:\}\{\$\?\*\+\.\^\/\;])/g,

  extractRegExpSource: function (aInput) {
    return this.kREGEXP_PATTERN.test(aInput) ?
      RegExp.$1 :
      aInput;
  },

  isRegExp: function (aInput) {
    return this.kREGEXP_PATTERN.test(aInput);
  },

  kREGEXP_PATTERN: /^\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/])+)\/([gimy]*)$/,
  // old version: /^\/((?:\\.|[^\/])+)\/[gimy]*$/
  // see http://nanto.asablo.jp/blog/2008/05/22/3535735

  getMatchedTermsFromSource: function (aRegExp, aSource) {
    var regexp;
    var flags = '';
    if (this.isRegExp(aRegExp)) {
      var source = this.extractRegExpSource(aRegExp);
      flags = aRegExp.match(/[^\/]+$/);
      if (flags && flags.indexOf('g') < 0)
        flags += 'g';
      regexp = new RegExp(source, flags || 'gim');
    }
    else {
      regexp = new RegExp(aRegExp, 'gim');
    }
    var result = (aSource || '').match(regexp) || [];
    return flags.indexOf('i') < 0 ?
      this.brushUpTermsWithCase(result) :
      this.brushUpTerms(result);
  },

  getORFindRegExpFromTerms: function (aTerms) {
    switch (aTerms.length) {
      case 0:
        return '';
      case 1:
        return aTerms[0];
      default:
        break;
    }
    return '(?:' + aTerms.join(')|(?:') + ')';
  },

  getANDFindRegExpFromTerms: function (aTerms) {
    switch (aTerms.length) {
      case 0:
        return '';
      case 1:
        return aTerms[0];
      case 2:
        return '(?:' + aTerms[0] + ').*(?:' + aTerms[1] + ')|' +
                    '(?:' + aTerms[1] + ').*(?:' + aTerms[0] + ')';
      default:
        break;
    }

    // Calculate permutations
    var permutations = [];
    var info = [];
    for (var i = 0; i < aTerms.length; i++) {
      info[i] = { use: true };
    }

    function perm(aDepth, aStr) {
      if (aDepth == aTerms.length) {
        permutations.push(aStr);
        return;
      }
      for (var i = 0; i < aTerms.length; i++) {
        if (info[i].use) {
          info[i].use = false;
          perm(aDepth + 1, aStr + (aStr ? ').*(?:' : '(?:') + aTerms[i]);
          info[i].use = true;
        }
      }
    }
    perm(0, '');

    if (permutations.length == 0) return '';

    return permutations.join(')|(:?'); // This join seems wrong based on the construction in perm.
    // perm constructs "(?:A).*(?:B)..."
    // We want to join them with |
    // However, the XUL version did GROUP_CONCAT with |
    // Correct join:
    return permutations.join(')|') + ')';
    // Wait, perm returns something like "(?:A).*(?:B)"
    // If permutations has ["(?:A).*(?:B)", "(?:B).*(?:A)"]
    // We want "(?:A).*(?:B)|(?:B).*(?:A)"

    return permutations.join('|');
  },

  yieldPattern: function(pattern) {
    const matched = pattern.match(/\[[^\]]+\]|\([^\)]+\)/g);
    if (!matched) {
      return [pattern];
    }
    else {
      let expanded = [pattern];
      for (const part of matched) {
        if (part.startsWith('[')) {
          const letters = part.substring(1, part.length - 1).split('');
          expanded = expanded.map(pattern => letters.map(letter => pattern.replace(part, letter))).flat();
        }
        else if (part.startsWith('(')) {
          const terms = part.substring(1, part.length - 1).split('|');
          expanded = expanded.map(pattern => terms.map(term => pattern.replace(part, term))).flat();
        }
      }
      return expanded.sort();
    }
  },

  extractShortestTerms: function(terms, { rejectOneLetterTerms = false } = {}) {
    // foo, foobar, fooee... といった風に、同じ文字列で始まる複数の候補がある場合は、
    // 最も短い候補（この例ならfoo）だけにする
    let termsString = terms
      .sort()
      .join('\n')
      .replace(/(^|\n)([^\n]+)(?:\n\2[^\n]+)+/gi, '$1$2');
    if (rejectOneLetterTerms)
      termsString = termsString.replace(/^.$\n?/mg, '');
    return this.sanitize(termsString).split('\n');
  },

  extractShortestTermsAggressively: function(terms, { rejectOneLetterTerms = false } = {}) {
    // foobar, fooee... といった風に、同じprefixを持つ複数の候補についてprefixだけにまとめる
    let termsString;
    while (true) {
      const before = terms
        .sort()
        .join('\n');
      termsString = before
        .replace(/(^|\n)([^\n]+)[^\n]*(?:\n\2[^\n]+)+/gi, '$1$2');
      terms = termsString.split('\n');
      if (before == termsString)
        break;
    }
    if (rejectOneLetterTerms)
      termsString = termsString.replace(/^.$\n?/mg, '');
    return this.sanitize(termsString).split('\n');
  },
};

export default MigemoTextUtils;
