/* This depends on: 
	pIXMigemoDictionaryJa
	pIXMigemoTextTransformJa
*/
var DEBUG = false;
 
var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoEngineJa() { 
	mydump('create instance pIXMigemoEngine(lang=ja)');
}

pXMigemoEngineJa.prototype = {
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
			this._dictionary = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang]
				.getService(Components.interfaces.pIXMigemoDictionary)
				.QueryInterface(Components.interfaces.pIXMigemoDictionaryJa);
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	get textTransform() 
	{
		if (!this._textTransform) {
			this._textTransform = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang='+this.lang]
					.getService(Components.interfaces.pIXMigemoTextTransform)
					.QueryInterface(Components.interfaces.pIXMigemoTextTransformJa);
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	getRegExpFor : function(aInput) 
	{
		if (!aInput) return null;

		aInput = aInput.toLowerCase();

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		mydump('noCache');
		var hira = XMigemoTextService.expand(
				XMigemoTextUtils.sanitize(
					XMigemoTextService.roman2kana(
						XMigemoTextService.kata2hira(aInput)
					)
				)
			);
		var roman = aInput;
		if (/[\uff66-\uff9f]/.test(roman)) roman = XMigemoTextService.hira2roman(XMigemoTextService.kata2hira(roman))
		var ignoreHiraKata = Prefs.getBoolPref('xulmigemo.ignoreHiraKata');
		var kana = ignoreHiraKata ? '' :
				XMigemoTextService.expand2(
					XMigemoTextUtils.sanitize2(
						XMigemoTextService.roman2kana2(
							roman,
							XMigemoTextService.KANA_KATA
						)
					),
					XMigemoTextService.KANA_KATA
				);
		var hiraAndKana = ignoreHiraKata ?
				XMigemoTextService.expand2(
					XMigemoTextUtils.sanitize2(
						XMigemoTextService.roman2kana2(
							roman,
							XMigemoTextService.KANA_ALL
						)
					),
					XMigemoTextService.KANA_ALL
				) :
				hira + '|' + kana ;
		mydump('hiraAndKana: '+encodeURIComponent(hiraAndKana));

		var zen = XMigemoTextService.roman2zen(aInput); // aInput ?
		mydump('zen: '+encodeURIComponent(zen));

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC, {});

		var pattern = '';
		if (lines.length) {
			var arr = [];
			arr.push(XMigemoTextUtils.sanitize(aInput).toUpperCase());
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
			searchterm = XMigemoTextUtils.sanitize(searchterm)
				.replace(/\n/g, '|');
			pattern += (pattern ? '|' : '') + searchterm;//.substring(0, searchterm.length-1);

			pattern = pattern.replace(/\n/g, '');

			mydump('pattern(from dic):'+encodeURIComponent(pattern));
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = XMigemoTextUtils.sanitize(aInput) + '|' + zen + '|' + hiraAndKana;
			mydump('pattern:'+encodeURIComponent(pattern));
		}

		return pattern;
	},
 
	splitInput : function(aInput, aSeparator, aCount) 
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

		var separatorRegExp = new RegExp(aSeparator +'+|\t\t+', 'g');
		terms = terms
				.replace(separatorRegExp, '\t')
				.replace(/^[\s\t]+|[\s\t]+$/g, '')
				.split('\t');

		aCount.value = terms.length;
		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic, aCount) 
	{
		if (!aInput) {
			aCount.value = 0;
			return [];
		}

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var hira = XMigemoTextService.expand(
					XMigemoTextUtils.sanitize(
						XMigemoTextService.roman2kana(
							XMigemoTextService.kata2hira(aInput)
						)
					)
				);

		var tmp  = '^' + hira + '.+$'; //日本語
		var tmpA = '^' + XMigemoTextUtils.sanitize(aInput) + '.+$'; //アルファベット
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

		aCount.value = lines.length;
		return lines;
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoEngine) &&
			!aIID.equals(Components.interfaces.nsISupports))
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
		aComponentManager = aComponentManager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
		}
	},

	getClassObject : function (aComponentManager, aCID, aIID)
	{
		if (!aIID.equals(Components.interfaces.nsIFactory))
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

		for (var key in this._objects) {
			if (aCID.equals(this._objects[key].CID))
				return this._objects[key].factory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	_objects : {
		manager : {
			CID        : pXMigemoEngineJa.prototype.classID,
			contractID : pXMigemoEngineJa.prototype.contractID,
			className  : pXMigemoEngineJa.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoEngineJa()).QueryInterface(aIID);
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
 
