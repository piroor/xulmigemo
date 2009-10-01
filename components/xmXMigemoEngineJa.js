/* This depends on: 
	xmIXMigemoDictionaryJa
	xmIXMigemoTextTransformJa
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function xmXMigemoEngineJa() { 
	mydump('create instance xmIXMigemoEngine(lang=ja)');
}

xmXMigemoEngineJa.prototype = {
	lang : 'ja',

	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/engine;1?lang='+this.lang;
	},
	get classDescription() {
		return 'This is a Migemo service itself, for Japanese language.';
	},
	get classID() {
		return Components.ID('{792f3b58-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	SYSTEM_DIC : 1, 
	USER_DIC   : 2,
	ALL_DIC    : 3,
 
	get dictionary() 
	{
		if (!this._dictionary) {
			if (TEST && xmXMigemoDictionaryJa) {
				this._dictionary = new xmXMigemoDictionaryJa();
			}
			else {
				this._dictionary = Cc['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang]
					.getService(Ci.xmIXMigemoDictionary)
					.QueryInterface(Ci.xmIXMigemoDictionaryJa);
			}
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	get textUtils() 
	{
		if (!this._textUtils) {
			if (TEST && xmXMigemoTextUtils) {
				this._textUtils = new xmXMigemoTextUtils();
			}
			else {
				this._textUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
						.getService(Ci.xmIXMigemoTextUtils);
			}
		}
		return this._textUtils;
	},
	_textUtils : null,
 
	get textTransform() 
	{
		if (!this._textTransform) {
			if (TEST && xmXMigemoTextTransformJa) {
				this._textTransform = new xmXMigemoTextTransformJa();
			}
			else {
				this._textTransform = Cc['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang='+this.lang]
					.getService(Ci.xmIXMigemoTextTransform)
					.QueryInterface(Ci.xmIXMigemoTextTransformJa);
			}
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	getRegExpFor : function(aInput) 
	{
		if (!aInput) return null;

		aInput = aInput.toLowerCase();

		var transform = this.textTransform;

		mydump('noCache');

		var hira = transform.expand(
				this.textUtils.sanitizeForTransformOutput(
					transform.roman2kana(
						transform.kata2hira(
							this.textUtils.sanitizeForTransformInput(aInput)
						)
					)
				)
			);

		var roman = aInput;
		if (/[\uff66-\uff9f]/.test(roman)) roman = transform.hira2roman(transform.kata2hira(roman))
		var ignoreHiraKata = Prefs.getBoolPref('xulmigemo.ignoreHiraKata');
		var kana = ignoreHiraKata ? '' :
				transform.expand2(
					this.textUtils.sanitizeForTransformOutput(
						transform.roman2kana2(
							this.textUtils.sanitizeForTransformInput(roman),
							transform.KANA_KATA
						)
					),
					transform.KANA_KATA
				);
		var hiraAndKana = ignoreHiraKata ?
				transform.expand2(
					this.textUtils.sanitizeForTransformOutput(
						transform.roman2kana2(
							this.textUtils.sanitizeForTransformInput(roman),
							transform.KANA_ALL
						)
					),
					transform.KANA_ALL
				) :
				hira + '|' + kana ;
		mydump('hiraAndKana: '+encodeURIComponent(hiraAndKana));

		var zen = transform.roman2zen(aInput); // aInput ?
		mydump('zen: '+encodeURIComponent(zen));

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC);

		var original = this.textUtils.sanitize(aInput);
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
			var ichimoji = searchterm.replace(/^..+$\n?/mg, '').split('\n').sort().join('');
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
			searchterm = this.textUtils.sanitize(searchterm)
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

		var transform = this.textTransform;

		var hira = transform.expand(
					this.textUtils.sanitize(
						transform.roman2kana(
							transform.kata2hira(aInput)
						)
					)
				);

		var str = this.textUtils.sanitize(aInput);
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

		const XMigemoDic = this.dictionary;

		var mydicAU = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserAlphaDic() : null ;
		var mydicA  = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getAlphaDic() : null ;
		var mydicU  = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserDicFor(firstlet) : null ;
		var mydic   = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getDicFor(firstlet) : null ;

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
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	},
 
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.xmIXMigemoEngine) &&
			!aIID.equals(Ci.pIXMigemoEngine) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
 	 
var gModule = { 
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Ci.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : xmXMigemoEngineJa.prototype.classID,
			contractID : xmXMigemoEngineJa.prototype.contractID,
			className  : xmXMigemoEngineJa.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoEngineJa()).QueryInterface(aIID);
				}
			}
		}
	},

	canUnload : function (aComponentManager)
	{
		return true;
	}
};

function NSGetModule(compMgr, fileSpec)
{
	return gModule;
}
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
