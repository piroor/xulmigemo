import Base from './base.js';
import TextUtils from './text-utils.js';

class EngineJa extends Base {
  constructor() {
    super();
    this.lang = 'ja';
    this.textTransform = null;
    this.dictionary = null;
    this.options = {};
  }

  initialize(textTransform, dictionary, options) {
    this.textTransform = textTransform;
    this.dictionary = dictionary;
    this.options = options || {};
  }

  toHiragana(rawInput) {
    return this.textTransform.expand(
      TextUtils.sanitizeForTransformOutput(
        this.textTransform.roman2kana(
          this.textTransform.kata2hira(
            TextUtils.sanitizeForTransformInput(rawInput)
          )
        )
      )
    );
  }

  toRoman(rawInput) {
    if (/[\uff66-\uff9f]/.test(rawInput))
      return this.textTransform.hira2roman(this.textTransform.kata2hira(rawInput));
    return rawInput;
  }

  expandInput(aInput, aOptions = {}) {
    const terms = this.gatherEntriesFor(aInput).map(entry => entry.trim().split('\t')).flat();

    const roman = this.toRoman(aInput);
    if (roman)
      terms.push(roman);
    const hiragana = this.toHiragana(aInput);
    if (hiragana)
      terms.push(...TextUtils.yieldPattern(hiragana));
    const katakana = this.textTransform.hira2kata(hiragana);
    if (katakana) {
      terms.push(...TextUtils.yieldPattern(katakana));
      // 半角カナの単語も生成する処理が必要
    }
    const zenkaku = this.textTransform.roman2zen(aInput);
    if (zenkaku)
      terms.push(zenkaku);

    const shrunkenTerms = [...new Set(terms)].sort();

    return aOptions.shortest ?
      TextUtils.extractShortestTermsAggressively(shrunkenTerms, {
        sanitizeForRegExp: false,
      }) :
      TextUtils.extractShortestTerms(shrunkenTerms, {
        sanitizeForRegExp: false,
      });
  }

  getRegExpFor(aInput, aTargetDic) {
    if (!aInput) return null;

    aInput = aInput.toLowerCase();

    const transform = this.textTransform;

    const hira = transform.expand(
      TextUtils.sanitizeForTransformOutput(
        transform.roman2kana(
          transform.kata2hira(
            TextUtils.sanitizeForTransformInput(aInput)
          )
        )
      )
    );

    let roman = aInput;
    if (/[\uff66-\uff9f]/.test(roman)) roman = transform.hira2roman(transform.kata2hira(roman))

    const ignoreHiraKata = this.options.ignoreHiraKata;

    const kana = ignoreHiraKata ? '' :
      transform.expand2(
        TextUtils.sanitizeForTransformOutput(
          transform.roman2kana2(
            TextUtils.sanitizeForTransformInput(roman),
            transform.KANA_KATA
          )
        ),
        transform.KANA_KATA
      );
    const hiraAndKana = ignoreHiraKata ?
      transform.expand2(
        TextUtils.sanitizeForTransformOutput(
          transform.roman2kana2(
            TextUtils.sanitizeForTransformInput(roman),
            transform.KANA_ALL
          )
        ),
        transform.KANA_ALL
      ) :
      hira + '|' + kana;

    const zen = transform.roman2zen(aInput); // aInput ?

    const lines = this.gatherEntriesFor(aInput, aTargetDic);

    let original = TextUtils.sanitize(aInput);
    if (this.options.ignoreLatinModifiers)
      original = transform.addLatinModifiers(original);

    let pattern = '';
    if (lines.length) {
      const arr = [];
      if (!/[\[\(]/.test(zen)) arr.push(zen);
      if (!/[\[\(]/.test(hiraAndKana)) {
        arr.push(hira);
        arr.push(kana);
      }
      let searchterm = arr.concat(lines).join('\n').replace(/(\t|\n\n)+/g, '\n');

      if (/[\[\(]/.test(zen)) pattern += (pattern ? '|' : '') + zen;
      if (/[\[\(]/.test(hiraAndKana)) pattern += (pattern ? '|' : '') + hiraAndKana;

      // 一文字だけの項目だけは、抜き出して文字クラスにまとめる
      const ichimoji = searchterm
        .replace(/^..+$\n?/mg, '')
        .split('\n')
        .sort()
        .join('')
        .replace(/(.)\1+/g, '$1');
      if (ichimoji) {
        pattern += (pattern ? '|' : '') + '[' + ichimoji + ']';
      }

      // foo, foobar, fooee... といった風に、同じ文字列で始まる複数の候補がある場合は、
      // 最も短い候補（この例ならfoo）だけにする
      searchterm = searchterm
        .split('\n')
        .sort()
        .join('\n')
        .replace(/^(.+)$(\n\1.*$)+/img, '$1')
        .replace(/^.$\n?/mg, ''); // 一文字だけの項目は用済みなので削除
      searchterm = TextUtils.sanitize(searchterm)
        .replace(/\n/g, '|');
      pattern += (pattern ? '|' : '') + searchterm;//.substring(0, searchterm.length-1);

      pattern += (pattern ? '|' : '') + original;
      pattern = pattern.replace(/\n/g, '');
    }
    else { // 辞書に引っかからなかった模様なので自前の文字列だけ
      pattern = original;
      if (original != zen) pattern += '|' + zen;
      if (original != hiraAndKana) pattern += '|' + hiraAndKana;
    }

    return pattern.replace(/\n|^\||\|$/g, '')
      .replace(/([^\\]|^)\|\|+/g, '$1|')
      .replace(/([^\\]|^)\(\|/g, '$1(')
      .replace(/([^\\]|^)\|\)/g, '$1)');
  }

  splitInput(aInput) {
    let terms = (
      (/^[A-Z]{2,}/.test(aInput)) ?
        aInput.replace(/([a-z])/g, '\t$1') : // CapsLockされてる場合は小文字で区切る
        aInput.replace(/([A-Z])/g, '\t$1')
    )
      .replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
      .replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
      .replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
      .replace(new RegExp('([!"#\$%&\'\\(\\)=‾\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g'), '\t$1\t');

    terms = terms
      .replace(/ +|\t\t+/g, '\t')
      .replace(/^[\s\t]+|[\s\t]+$/g, '')
      .split('\t');

    return terms;
  }

  gatherEntriesFor(aInput, aTargetDic) {
    if (!aInput) {
      return [];
    }
    aTargetDic = aTargetDic || this.ALL_DIC;

    const transform = this.textTransform;

    const hira = transform.expand(
      TextUtils.sanitize(
        transform.roman2kana(
          transform.kata2hira(aInput)
        )
      )
    );

    let str = TextUtils.sanitize(aInput);
    if (this.options.ignoreLatinModifiers)
      str = transform.addLatinModifiers(str);

    const tmp = '^' + hira + '.+$'; //日本語
    const tmpA = '^(' + str + ').+$'; //アルファベット
    const exp = new RegExp(tmp, 'mg');
    const expA = new RegExp(tmpA, 'mg');

    let firstlet = '';
    firstlet = aInput.charAt(0);//最初の文字

    let lines = [];

    const mydicAU = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserAlphaDic() : null;
    const mydicA = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getAlphaDic() : null;
    const mydicU = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserDicFor(firstlet) : null;
    const mydic = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getDicFor(firstlet) : null;

    if (mydicAU) {
      const lineAU = mydicAU.match(expA);
      if (lineAU) {
        lines = lines.concat(lineAU);
      }
    }
    if (mydicA) {
      const lineA = mydicA.match(expA);//アルファベットの辞書を検索
      if (lineA) {
        lines = lines.concat(lineA);
      }
    }
    if (mydicU) {
      const lineU = mydicU.match(exp);
      if (lineU) {
        lines = lines.concat(lineU);
      }
    }
    if (mydic) {
      const line = mydic.match(exp);//日本語の辞書を検索
      if (line) {
        lines = lines.concat(line);
      }
    }

    return lines;
  }

  getAllKnownTermsPattern() {
    if (this.mCachedAllKnownTermsPattern)
      return this.mCachedAllKnownTermsPattern;

    const allEntries = this.dictionary.getDic().trim().replace(/(\t|\n\n)+/g, '\n').trim();

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

    this.mCachedAllKnownTermsPattern = [
      `[-_a-z0-9\u3041-\u3096\u30A1-\u30FA${oneLetterTerms}]`,
      ...shortestTerms
    ].join('|').replace(/^\||\|$/g, '').replace(/\|\|+/g, '|');

    return this.mCachedAllKnownTermsPattern;
  }
}

export default EngineJa;
