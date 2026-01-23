import MigemoBase from '../MigemoBase.js';
import MigemoTextUtils from './textUtils.js';

class MigemoEngine extends MigemoBase {
    constructor() {
        super();
        this.lang = '';
        this.textTransform = null;
        this.dictionary = null;
        this.options = {};
    }

    initialize(textTransform, dictionary, options) {
        this.textTransform = textTransform;
        this.dictionary = dictionary;
        this.options = options || {};
    }

    expandInput(aInput) {
        return this.textTransform.expandToTerms(aInput);
    }

    getRegExpFor(aInput, aTargetDic) {
        if (!aInput || !this.lang) return null;

        aInput = aInput.toLowerCase();

        var str = MigemoTextUtils.sanitize(aInput);

        if (this.options.ignoreLatinModifiers)
            str = this.textTransform.addLatinModifiers(str);

        var lines = this.gatherEntriesFor(aInput, this.ALL_DIC, aTargetDic);

        var pattern = '';
        if (lines.length) {
            var searchterm = lines.join('\n').replace(/(\t|\n\n)+/g, '\n');
            searchterm = searchterm
                .split('\n')
                .sort()
                .join('\n')
                .replace(/^(.+)$(\n\1$)+/img, '$1');

            searchterm = MigemoTextUtils.sanitize(searchterm)
                .replace(/\n/g, '|');
            pattern += (pattern ? '|' : '') + searchterm;
            pattern += (pattern ? '|' : '') + str;

            pattern = pattern.replace(/\n/g, '');
        }
        else { // 辞書に引っかからなかった模様なので自前の文字列だけ
            pattern = str;
        }

        return pattern.replace(/\n|^\||\|$/g, '')
            .replace(/\|\|+/g, '|')
            .replace(/\(\|/g, '(')
            .replace(/\|\)/g, ')');
    }

    splitInput(aInput) {
        var terms = aInput
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
        if (!aInput || !this.lang) {
            return [];
        }
        aTargetDic = aTargetDic || this.ALL_DIC;

        var str = MigemoTextUtils.sanitize(aInput);
        if (this.options.ignoreLatinModifiers)
            str = this.textTransform.addLatinModifiers(str);

        var tmp = '^(' + str + ').+$';
        var exp = new RegExp(tmp, 'img');

        var lines = [];

        var mydicU = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserDic() : null;
        var mydic = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getDic() : null;

        if (mydicU) {
            var lineU = mydicU.match(exp);
            if (lineU) {
                lines = lines.concat(lineU);
            }
        }
        if (mydic) {
            var line = mydic.match(exp);//アルファベットの辞書を検索
            if (line) {
                lines = lines.concat(line);
            }
        }

        return lines;
    }
}

export default MigemoEngine;
