import MigemoBase from '../MigemoBase.js';
import MigemoTextUtils from './textUtils.js';
import MigemoTextTransformJa from './textTransformJa.js';

class MigemoDictionaryJa extends MigemoBase {
    constructor() {
        super();
        this.lang = 'ja';
        this.initialized = false;
        this.list = {};
        this.cList = ['', 'k', 's', 't', 'h', 'm', 'n', 'y', 'r', 'w', 'd', 'z', 'g', 'p', 'b', 'alph'];
    }

    async load(aOptions = {}) {
        // dicPath
        const dicPath = aOptions.dicPath || '/dictionaries/ja/';

        let error = false;

        const promises = this.cList.map(async (char) => {
            const filename = char + 'a2.txt';
            try {
                const response = await fetch(dicPath + filename);
                if (response.ok) {
                    const text = await response.text();
                    this.list[char] = text;
                } else {
                    console.warn(`MigemoDictionaryJa: Failed to load ${filename}`);
                    this.list[char] = '';
                    error = true;
                }
            } catch (e) {
                console.error(`MigemoDictionaryJa: Error loading ${filename}`, e);
                this.list[char] = '';
                error = true;
            }

            // User dic - skipped
            this.list[char + '-user'] = '';
        });

        await Promise.all(promises);

        this.initialized = true;

        return !error;
    }

    reload() {
        return this.load();
    }

    saveUserDic() {
    }

    addTerm(aYomi, aTerm) {
        // Omitted
    }

    removeTerm(aYomi, aTerm) {
        // Omitted
    }

    getDic() {
        var dics = [];
        for (var i = 0, maxi = this.cList.length; i < maxi; i++)
            dics.push(this.getDicFor(this.cList[i], false));
        return dics.join('\n');
    }

    getUserDic() {
        var dics = [];
        for (var i = 0, maxi = this.cList.length; i < maxi; i++)
            dics.push(this.getDicFor(this.cList[i], true));
        return dics.join('\n');
    }

    saveUserDicFor(aKey) {
    }

    getDicFor(aLetter) {
        return this.getDicInternal(aLetter, false);
    }

    getUserDicFor(aLetter) {
        return this.getDicInternal(aLetter, true);
    }

    getAlphaDic() {
        return this.list['alph'];
    }

    getUserAlphaDic() {
        return this.list['alph-user'];
    }

    getDicForTerm(aYomi) {
        if (!aYomi) return null;

        if (/^[a-z0-9]+$/i.test(aYomi)) return 'alph';

        var firstLetter = MigemoTextTransformJa.hira2roman(aYomi.charAt(0)).charAt(0);
        switch (firstLetter) {
            case 'a':
            case 'i':
            case 'u':
            case 'e':
            case 'o':
            case 'l':
                return '';

            default:
                return firstLetter;
        }
    }

    modifyDic(aTermSet, aOperation) {
        // Omitted
    }

    getDicInternal(aLetter, aUser) {
        var suffix = aUser ? '-user' : '';

        switch (aLetter) {
            case 'l':
            case 'q':
            case 'x':
                return false;

            case 'c':
                return this.list['t' + suffix];

            case 'k':
            case 's':
            case 't':
            case 'h':
            case 'm':
            case 'n':
            case 'r':
            case 'd':
            case 'z':
            case 'g':
            case 'p':
            case 'b':
                return this.list[aLetter + suffix];

            case 'w':
            case 'y':
                return [this.list[aLetter + suffix], this.list['' + suffix]].join('\n');

            case 'a':
            case 'i':
            case 'u':
            case 'e':
            case 'o':
                return this.list['' + suffix];

            case 'j':
                return this.list['z' + suffix];

            case 'f':
                return this.list['h' + suffix];

            case 'v':
                return this.list['' + suffix];
        }
    }
}

export default MigemoDictionaryJa;
