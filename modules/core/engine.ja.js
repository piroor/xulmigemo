var EXPORTED_SYMBOLS = ['MigemoEngineJa'];

/* This depends on: 
	xmIXMigemoDictionaryJa
	xmIXMigemoTextTransformJa
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 

Components.utils.import('resource://xulmigemo-modules/core/textUtils.js');
Components.utils.import('resource://xulmigemo-modules/core/textTransform.ja.js');
Components.utils.import('resource://xulmigemo-modules/core/dictionary.ja.js');

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
var MigemoEngineJa = {
	lang : 'ja',
	
	SYSTEM_DIC : 1 << 0, 
	USER_DIC   : 1 << 1,
	ALL_DIC    : (1 << 0 | 1 << 1),

	textTransform : MigemoTextTransformJa,
	dictionary : MigemoDicitonaryJa,
 
	getRegExpFor : function(aInput, aTargetDic) 
	{
		if (!aInput) return null;

		aInput = aInput.toLowerCase();

		var transform = this.textTransform;

		mydump('noCache');

		var hira = transform.expand(
				MigemoTextUtils.sanitizeForTransformOutput(
					transform.roman2kana(
						transform.kata2hira(
							MigemoTextUtils.sanitizeForTransformInput(aInput)
						)
					)
				)
			);

		var roman = aInput;
		if (/[\uff66-\uff9f]/.test(roman)) roman = transform.hira2roman(transform.kata2hira(roman))
		var ignoreHiraKata = Prefs.getBoolPref('xulmigemo.ignoreHiraKata');
		var kana = ignoreHiraKata ? '' :
				transform.expand2(
					MigemoTextUtils.sanitizeForTransformOutput(
						transform.roman2kana2(
							MigemoTextUtils.sanitizeForTransformInput(roman),
							transform.KANA_KATA
						)
					),
					transform.KANA_KATA
				);
		var hiraAndKana = ignoreHiraKata ?
				transform.expand2(
					MigemoTextUtils.sanitizeForTransformOutput(
						transform.roman2kana2(
							MigemoTextUtils.sanitizeForTransformInput(roman),
							transform.KANA_ALL
						)
					),
					transform.KANA_ALL
				) :
				hira + '|' + kana ;
		mydump('hiraAndKana: '+encodeURIComponent(hiraAndKana));

		var zen = transform.roman2zen(aInput); // aInput ?
		mydump('zen: '+encodeURIComponent(zen));

		var lines = this.gatherEntriesFor(aInput, aTargetDic);

		var original = MigemoTextUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			original = transform.addLatinModifiers(original);

		var pattern = '';
		if (lines.length) {
			var arr = [];
			if (!/[\[\(]/.test(zen)) arr.push(zen);
			if (!/[\[\(]/.test(hiraAndKana)) {
				arr.push(hira);
				arr.push(kana);
			}
			var searchterm = arr.concat(lines).join('\n').replace(/(\t|\n\n)+/g, '\n');

			if (/[\[\(]/.test(zen)) pattern += (pattern ? '|' : '') + zen;
			if (/[\[\(]/.test(hiraAndKana)) pattern += (pattern ? '|' : '') + hiraAndKana;

			// 一文字だけの項目だけは、抜き出して文字クラスにまとめる
			var ichimoji = searchterm
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
			searchterm = MigemoTextUtils.sanitize(searchterm)
				.replace(/\n/g, '|');
			pattern += (pattern ? '|' : '') + searchterm;//.substring(0, searchterm.length-1);

			pattern += (pattern ? '|' : '') + original;
			pattern = pattern.replace(/\n/g, '');

			mydump('pattern(from dic):'+encodeURIComponent(pattern));
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = original;
			if (original != zen) pattern += '|' + zen;
			if (original != hiraAndKana) pattern += '|' + hiraAndKana;
			mydump('pattern:'+encodeURIComponent(pattern));
		}

		return pattern.replace(/\n|^\||\|$/g, '')
				.replace(/([^\\]|^)\|\|+/g, '$1|')
				.replace(/([^\\]|^)\(\|/g, '$1(')
				.replace(/([^\\]|^)\|\)/g, '$1)');
	},
 
	splitInput : function(aInput) 
	{
		var terms = (
					(/^[A-Z]{2,}/.test(aInput)) ?
						aInput.replace(/([a-z])/g, '\t$1') : // CapsLockされてる場合は小文字で区切る
						aInput.replace(/([A-Z])/g, '\t$1')
				)
				.replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
				.replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
				.replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
				.replace(new RegExp('([!"#\$%&\'\\(\\)=~\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64]+)', 'g'), '\t$1\t');

		terms = terms
				.replace(/ +|\t\t+/g, '\t')
				.replace(/^[\s\t]+|[\s\t]+$/g, '')
				.split('\t');

		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic) 
	{
		if (!aInput) {
			return [];
		}
		aTargetDic = aTargetDic || this.ALL_DIC;

		var transform = this.textTransform;

		var hira = transform.expand(
					MigemoTextUtils.sanitize(
						transform.roman2kana(
							transform.kata2hira(aInput)
						)
					)
				);

		var str = MigemoTextUtils.sanitize(aInput);
		if (Prefs.getBoolPref('xulmigemo.ignoreLatinModifiers'))
			str = transform.addLatinModifiers(str);

		var tmp  = '^' + hira + '.+$'; //日本語
		var tmpA = '^(' + str + ').+$'; //アルファベット
		var exp  = new RegExp(tmp, 'mg');
		var expA = new RegExp(tmpA, 'mg');

		var firstlet = '';
		firstlet = aInput.charAt(0);//最初の文字
		mydump(firstlet+' dic loaded');

		var lines = [];

		var mydicAU = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserAlphaDic() : null ;
		var mydicA  = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getAlphaDic() : null ;
		var mydicU  = (aTargetDic & this.USER_DIC) ? this.dictionary.getUserDicFor(firstlet) : null ;
		var mydic   = (aTargetDic & this.SYSTEM_DIC) ? this.dictionary.getDicFor(firstlet) : null ;

		if (mydicAU) {
			var lineAU = mydicAU.match(expA);
			mydump('searchEnDic (user)');
			if (lineAU) {
				lines = lines.concat(lineAU);
				mydump(' found '+lineAU.length+' terms');
			}
		}
		if (mydicA) {
			var lineA = mydicA.match(expA);//アルファベットの辞書を検索
			mydump('searchEnDic');
			if (lineA) {
				lines = lines.concat(lineA);
				mydump(' found '+lineA.length+' terms');
			}
		}
		if (mydicU) {
			var lineU = mydicU.match(exp);
			mydump('searchJpnDic (user)');
			if (lineU) {
				lines = lines.concat(lineU);
				mydump(' found '+lineU.length+' terms');
			}
		}
		if (mydic) {
			var line = mydic.match(exp);//日本語の辞書を検索
			mydump('searchJpnDic');
			if (line) {
				lines = lines.concat(line);
				mydump(' found '+line.length+' terms');
			}
		}

		return lines;
	}
 
}; 
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
