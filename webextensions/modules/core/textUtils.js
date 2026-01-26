const MigemoTextUtils = {
  /* string operations */

  trim: function(aInput) {
    return aInput
      .replace(this.kTRIM_PATTERN, '');
  },
  kTRIM_PATTERN: /^\s+|\s+$/g,

  brushUpTerms: function(aTerms) {
    return [...(aTerms || [])]
      .sort()
      .join('\n')
      .toLowerCase()
      .replace(this.kBRUSH_UP_PATTERN, '$1')
      .replace(this.kMULTIPLE_BR_PATTERN, '\n')
      .split('\n');
  },
  kMULTIPLE_BR_PATTERN: /\n\n+/g,
  kBRUSH_UP_PATTERN:    /^(.+)(\n\1$)+/gim,
  brushUpTermsWithCase: function(aTerms) {
    return [...(aTerms || [])]
      .sort()
      .join('\n')
      .replace(this.kBRUSH_UP_PATTERN_CASE_SENSITIVE, '$1')
      .replace(this.kMULTIPLE_BR_PATTERN, '\n')
      .split('\n');
  },
  kBRUSH_UP_PATTERN_CASE_SENSITIVE: /^(.+)(\n\1$)+/gm,

  splitByBoundaries: function(aString) {
    const parts = aString.split(/\b/);
    let result = [];
    parts.forEach(function(aPart) {
      const matched = aPart.match(this.kBOUNDARY_SPLITTER_PATTERN);
      if (matched)
        result = result.concat(matched);
      else
        result.push(aPart);
    }, this);
    result = result.filter(function(aPart) {
      return this.trim(aPart);
    }, this);
    return result.length ? result : parts;
  },
  // http://ablog.seesaa.net/article/20969848.html
  kBOUNDARY_SPLITTER_PATTERN: /[\u4e00-\u9fa0\u3005\u3006\u30f5\u30f6]+|[\u3041-\u3093]+|[\u30a1-\u30f4\u30fc]+|[a-zA-Z0-9]+|[\uff41-\uff5a\uff21-\uff3a\uff10-\uff19]+|[\u3001\u3002\uff01!\uff1f?()\uff08\uff09\u300c\u300d\u300e\u300f]+|\n/gim,

  /* manipulate regular expressions */

  sanitize: function(str) {
    //	[]^.+*?$|{}\(),  正規表現のメタキャラクタをエスケープ
    str = str.replace(this.kSANITIZE_PATTERN, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN: /([\-\:\}\{\|\$\?\*\+\.\^\]\/\[\;\\\(\)])/g,

  sanitizeForTransformInput: function(str) {
    //	()[]|\,
    str = str.replace(this.kSANITIZE_PATTERN_INPUT, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN_INPUT: /([\(\)\[\]\|\\])/g,

  sanitizeForTransformOutput: function(str) {
    //	^.+*?${},
    str = str.replace(this.kSANITIZE_PATTERN_OUTPUT, '\\$1');
    return str;
  },
  kSANITIZE_PATTERN_OUTPUT: /([\-\:\}\{\$\?\*\+\.\^\/\;])/g,

  extractRegExpSource: function(aInput) {
    return this.kREGEXP_PATTERN.test(aInput) ?
      RegExp.$1 :
      aInput;
  },

  isRegExp: function(aInput) {
    return this.kREGEXP_PATTERN.test(aInput);
  },

  kREGEXP_PATTERN: /^\/((?:\\.|\[(?:\\.|[^\]])*\]|[^\/])+)\/([gimy]*)$/,
  // old version: /^\/((?:\\.|[^\/])+)\/[gimy]*$/
  // see http://nanto.asablo.jp/blog/2008/05/22/3535735

  getMatchedTermsFromSource: function(aRegExp, aSource) {
    let regexp;
    let flags = '';
    if (this.isRegExp(aRegExp)) {
      const source = this.extractRegExpSource(aRegExp);
      flags = aRegExp.match(/[^\/]+$/);
      if (flags && flags.indexOf('g') < 0)
        flags += 'g';
      regexp = new RegExp(source, flags || 'gim');
    }
    else {
      regexp = new RegExp(aRegExp, 'gim');
    }
    const result = (aSource || '').match(regexp) || [];
    return flags.indexOf('i') < 0 ?
      this.brushUpTermsWithCase(result) :
      this.brushUpTerms(result);
  },

  getORFindRegExpFromTerms: function(aTerms) {
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

  getANDFindRegExpFromTerms: function(aTerms) {
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
    const permutations = [];
    const info = [];
    for (let i = 0; i < aTerms.length; i++) {
      info[i] = { use: true };
    }

    function perm(aDepth, aStr) {
      if (aDepth == aTerms.length) {
        permutations.push(aStr);
        return;
      }
      for (let i = 0; i < aTerms.length; i++) {
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

  extractShortestTerms: function(terms, { sanitizeForRegExp = false, rejectOneLetterTerms = false } = {}) {
    // foo, foobar, fooee... といった風に、同じ文字列で始まる複数の候補がある場合は、
    // 最も短い候補（この例ならfoo）だけにする
    let termsString = terms
      .sort()
      .join('\n')
      .replace(/(^|\n)([^\n]+)(?:\n\2[^\n]+)+/gi, '$1$2');
    if (rejectOneLetterTerms)
      termsString = termsString.replace(/^.$\n?/mg, '');
    return (sanitizeForRegExp ? this.sanitize(termsString) : termsString).split('\n');
  },

  extractShortestTermsAggressively: function(terms, { sanitizeForRegExp = false, rejectOneLetterTerms = false } = {}) {
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
    return (sanitizeForRegExp ? this.sanitize(termsString) : termsString).split('\n');
  },

  flattenRegExp: function(regexp) {
    if (!regexp)
      return [];

    const source = (typeof regexp == 'string') ? regexp : regexp.source;
    return this.expandTermsFromArray(
      this.expandParensToArray(
        source
          .replace(/\[[^\]]+\]/g, charClassPart =>
            `(${charClassPart.replace(/\[|\]/g, '').split('').join('|')})`)
          .replace(/\|\|+/g, '|')
      )
    )
      .replace(/\n\n+/g, '\n')
      .split('\n');
  },

  expandParensToArray: function(source) {
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
  },

  expandTermsFromArray: function(terms) {
    while (this.expandTermsFromArrayInternal(terms)) {
    }
    return this.expandTerms(terms);
  },

  expandTermsFromArrayInternal: function(terms) {
    let shouldContinue = false;
    for (let i = 0, maxi = terms.length; i < maxi; i++) {
      if (typeof terms[i] == 'string')
        continue;
      if (terms[i].some(item => {
        return typeof item != 'string' &&
          (item.length > 1 ||
            typeof item[0] != 'string');
      })) {
        this.expandTermsFromArrayInternal(terms[i]);
        shouldContinue = true;
        continue;
      }
      terms[i] = this.expandTerms(terms[i]);
    }
    return shouldContinue;
  },

  expandTerms: function(terms) {
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
  },
};

export default MigemoTextUtils;
