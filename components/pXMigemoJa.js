/* This depends on: 
	pIXMigemoDictionary
	pIXMigemoCache
	pIXMigemoDicManager
	pIXMigemoTextTransformJa
*/
var DEBUG = false;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemo() { 
	this.init();
}

pXMigemo.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/core;1?lang=ja';
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
	 
	get textTransform() 
	{
		if (!this._textTransform) {
			this._textTransform = Components
								.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=ja']
								.getService(Components.interfaces.pIXMigemoTextTransform)
								.QueryInterface(Components.interfaces.pIXMigemoTextTransformJa);
		}
		return this._textTransform;
	},
	_textTransform : null,
 	
	// SKK方式の入力以外で、文節区切りとして認識する文字 
	INPUT_SEPARATOR : " ",
 
	createCacheTimeOverride : -1, 
 
/* Create Regular Expressions */ 
	 
	getRegExp : function(aRoman) 
	{
		return this.getRegExpInternal(aRoman, void(0));
	},
 
	getRegExpInternal : function(aRoman, aEnableAutoSplit) 
	{
		var myExp = [];

		var autoSplit = (aEnableAutoSplit === void(0)) ? Prefs.getBoolPref('xulmigemo.splitTermsAutomatically') : aEnableAutoSplit ;

		// 入力を切って、文節として個別に正規表現を生成する
		var romanTerm;
		var romanTerms = (
					(/^[A-Z]{2,}/.test(aRoman)) ?
						aRoman.replace(/([a-z])/g, '\t$1') : // CapsLockされてる場合は小文字で区切る
						aRoman.replace(/([A-Z])/g, '\t$1')
				)
				.replace(/([\uff66-\uff9fa-z])([0-9])/i, '$1\t$2')
				.replace(/([0-9a-z])([\uff66-\uff9f])/i, '$1\t$2')
				.replace(/([0-9\uff66-\uff9f])([a-z])/i, '$1\t$2')
				.replace(new RegExp('([!"#\$%&\'\\(\\)=~\\|\\`\\{\\+\\*\\}<>\\?_\\-\\^\\@\\[\\;\\:\\]\\/\\\\\\.,\uff61\uff64' + this.INPUT_SEPARATOR + ']+)', 'g'), '\t$1\t')
				.split('\t');
		var separatorRegExp = new RegExp('^(' + this.INPUT_SEPARATOR +'+)$');
		mydump('ROMAN: '+romanTerms.join('/').toLowerCase()+'\n');

		var pattern, romanTermPart, nextPart;
		for (var i = 0, maxi = romanTerms.length; i < maxi; i++)
		{
			romanTerm = romanTerms[i].toLowerCase();

			if (separatorRegExp.test(romanTerm)) {
				myExp.push('(' + RegExp.$1 + ')*');
				continue;
			}

			pattern = this.getRegExpPart(romanTerm);
			if (!pattern) continue;
			myExp.push(pattern);


			if (!autoSplit) continue;

			romanTermPart = romanTerm;
			while (romanTermPart.length > 1)
			{
				romanTermPart = romanTermPart.substring(0, romanTermPart.length-1);
				pattern = this.getRegExpPart(romanTermPart, true);
				if (!this.simplePartOnlyPattern.test(pattern.replace(/\\\|/g, ''))) {
					myExp[myExp.length-1] = [
						myExp[myExp.length-1],
						'|(',
						pattern,
						')(',
						this.getRegExp(romanTerm.substring(romanTermPart.length, romanTerm.length)),
						')'
					].join('').replace(/\n/g, '');
					break;
				}
			}
		}

		myExp = (myExp.length == 1) ? myExp[0] :
				(myExp.length) ? ['(', myExp.join(')('), ')'].join('').replace(/\n/g, '') :
				'' ;

		return myExp.replace(/\n/im, '');
	},
 
	simplePartOnlyPattern : /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i, 
 
	getRegExpPart : function(aRoman) 
	{
		if (!aRoman) return null;

		aRoman = aRoman.toLowerCase();

		const XMigemoCache = Components
							.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
							.getService(Components.interfaces.pIXMigemoCache);

		var cacheText = XMigemoCache.getCacheFor(aRoman);
		if (cacheText) {
			mydump('cache:'+cacheText);
			return cacheText;
		}

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		mydump('noCache');
		var str = XMigemoTextService.expand(
				XMigemoTextUtils.sanitize(
					XMigemoTextService.convertStr(
						XMigemoTextService.kana2hira(aRoman)
					)
				)
			);
		var hira = str;
		var roman = aRoman;
		if (/[\uff66-\uff9f]/.test(roman)) roman = XMigemoTextService.hira2roman(XMigemoTextService.kana2hira(roman))
		var ignoreHiraKata = Prefs.getBoolPref('xulmigemo.ignoreHiraKata');
		var kana = ignoreHiraKata ? '' :
				XMigemoTextService.expand2(
					XMigemoTextUtils.sanitize2(
						XMigemoTextService.convertStr2(
							roman,
							XMigemoTextService.KANA_KATA
						)
					),
					XMigemoTextService.KANA_KATA
				);
		var hiraAndKana = ignoreHiraKata ?
				XMigemoTextService.expand2(
					XMigemoTextUtils.sanitize2(
						XMigemoTextService.convertStr2(
							roman,
							XMigemoTextService.KANA_ALL
						)
					),
					XMigemoTextService.KANA_ALL
				) :
				str + '|' + kana ;
		var zen = XMigemoTextService.roman2zen(aRoman); // aRoman ?
		mydump('hira:'+hira);

		var date1 = new Date();

		var lines = this.gatherEntriesFor(aRoman, this.ALL_DIC, {});

		var pattern = '';
		if (lines.length) {
			var arr = [];
			arr.push(XMigemoTextUtils.sanitize(aRoman).toUpperCase());
			if (zen.indexOf('[') < 0) arr.push(zen);
			if (hiraAndKana.indexOf('[') < 0) {
				arr.push(hira);
				arr.push(kana);
			}
			searchterm = arr.concat(lines).join('\n').replace(/(\t|\n\n)+/g, '\n');

			if (zen.indexOf('[') > -1) pattern += (pattern ? '|' : '') + zen;
			if (hiraAndKana.indexOf('[') > -1) pattern += (pattern ? '|' : '') + hiraAndKana;

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
			pattern += (pattern ? '|' : '') + searchterm.substring(0, searchterm.length-1);

			pattern = pattern.replace(/\n/g, '');

			mydump('pattern(from dic):'+pattern);
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = XMigemoTextUtils.sanitize(aRoman) + '|' + zen + '|' + hiraAndKana;
			mydump('pattern:'+pattern);
		}


		var date2 = new Date();
		if (date2.getTime() - date1.getTime() > (this.createCacheTimeOverride > -1 ? this.createCacheTimeOverride : Prefs.getIntPref('xulmigemo.cache.update.time'))) {
			// 遅かったらキャッシュします
			XMigemoCache.setDiskCache(aRoman, pattern);
			XMigemoCache.setMemCache(aRoman, pattern);
			mydump('CacheWasSaved');
		}
		else{
			XMigemoCache.setMemCache(aRoman, pattern);//メモリキャッシュ
			mydump('memCacheWasSaved');
		}
		mydump(date2.getTime() - date1.getTime());

		return pattern;
	},
  
	gatherEntriesFor : function(aRoman, aTargetDic, aCount) 
	{
		if (!aRoman) {
			aCount.value = 0;
			return [];
		}

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var str = XMigemoTextService.expand(
					XMigemoTextUtils.sanitize(
						XMigemoTextService.convertStr(
							XMigemoTextService.kana2hira(aRoman)
						)
					)
				);
		var hira = str;

		var tmp  = '^' + hira + '.+$'; //日本語
		var tmpA = '^' + XMigemoTextUtils.sanitize(aRoman) + '.+$'; //アルファベット
		var exp  = new RegExp(tmp, 'mg');
		var expA = new RegExp(tmpA, 'mg');

		var firstlet = '';
		firstlet = aRoman.charAt(0);//最初の文字
		mydump(firstlet+' dic loaded');

		var lines = [];

		const XMigemoDic = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang=ja']
				.getService(Components.interfaces.pIXMigemoDictionary);

		var mydicAU = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserAlphaDic() : null ;
		var mydicA  = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getAlphaDic() : null ;
		var mydicU  = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserDic(firstlet) : null ;
		var mydic   = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getDic(firstlet) : null ;

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
	SYSTEM_DIC : 1,
	USER_DIC   : 2,
	ALL_DIC    : 3,
 
/* Find */ 
	 
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Components.classes['@mozilla.org/embedcomp/rangefind;1'].createInstance(Components.interfaces.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	regExpFind : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		//patTextはgetRegExp()で得られた正規表現オブジェクト
		var doc = Components.lookupMethod(aFindRange.startContainer, 'ownerDocument').call(aFindRange.startContainer);
		var term;
		var txt = XMigemoTextUtils.range2Text(aFindRange);

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false')
			aRegExpFlags = '';
		var regExp = new RegExp(aRegExpSource, aRegExpFlags);
		if (aFindBackwards) {
			txt = txt.split('').reverse().join('');
			regExp = XMigemoTextUtils.reverseRegExp(regExp);
		}

		if (findBackwards) {
			if (txt.match(regExp)) {
				term = RegExp.lastMatch.split('').reverse().join('');
			}
		}
		else {
			if (txt.match(regExp)) {
				term = RegExp.lastMatch;
			}
		}

		this.mFind.findBackwards = aFindBackwards;
		var docShell = this.getDocShellForFrame(Components.lookupMethod(doc, 'defaultView').call(doc));
		var foundRange = this.mFind.Find(term, aFindRange, aStartPoint, aEndPoint);
		return foundRange;
	},
 
	regExpFindArr : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aCount) 
	{
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		//patTextはgetRegExp()で得られた正規表現オブジェクト
		var doc = Components.lookupMethod(aFindRange.startContainer, 'ownerDocument').call(aFindRange.startContainer);
		var arrTerms;
		var arrResults = [];
		var rightContext;

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false')
			aRegExpFlags = '';
		var regExp = new RegExp(aRegExpSource, aRegExpFlags);

		var txt = XMigemoTextUtils.range2Text(aFindRange);
		arrTerms = txt.match(new RegExp(regExp.source, 'img'));
		this.mFind.findBackwards = false;
		var docShell = this.getDocShellForFrame(Components.lookupMethod(doc, 'defaultView').call(doc));
		var foundRange;
		for (var i = 0, maxi = arrTerms.length; i < maxi; i++)
		{
			foundRange = this.mFind.Find(arrTerms[i], aFindRange, aStartPoint, aEndPoint);
			arrResults.push(foundRange);
			aFindRange.setStart(foundRange.endContainer, foundRange.endOffset);
			aStartPoint.selectNodeContents(doc.body);
			aStartPoint.setStart(foundRange.endContainer, foundRange.endOffset);
			aStartPoint.collapse(true);
		}

		aCount.value = arrResults.length;
		return arrResults;
	},
 
	getDocShellForFrame : function(aFrame) 
	{
		return aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
	},
  
/* Update Cache */ 
	
	updateCacheFor : function(aRomanPatterns) 
	{
		var patterns = aRomanPatterns.split('\n');
		var key      = patterns.join('/');
		if (this.updateCacheTimers[key]) {
			this.updateCacheTimers[key].cancel();
			this.updateCacheTimers[key] = null;
		}

		this.updateCacheTimers[key] = Components
			.classes['@mozilla.org/timer;1']
			.getService(Components.interfaces.nsITimer);
        this.updateCacheTimers[key].init(
			this.createUpdateCacheObserver(patterns, key),
			100,
			Components.interfaces.nsITimer.TYPE_REPEATING_SLACK
		);
	},
 
	updateCacheTimers : [], 
 
	createUpdateCacheObserver : function(aPatterns, aKey) 
	{
		return ({
			core     : this,
			key      : aKey,
			patterns : aPatterns,
			observe  : function(aSubject, aTopic, aData)
			{
				if (aTopic != 'timer-callback') return;

				if (!this.patterns.length) {
					if (this.core.updateCacheTimers[this.key]) {
						this.core.updateCacheTimers[this.key].cancel();
						delete this.core.updateCacheTimers[this.key];
					}
					return;
				}
				if (this.patterns[0])
					this.core.getRegExpPart(this.patterns[0]);
				this.patterns.splice(0, 1);
			}
		});
	},
  
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'XMigemo:cacheCleared':
				this.updateCacheFor(aData);
				return;

			case 'quit-application':
				this.destroy();
				return;
		}
	},
 
	init : function() 
	{
		if (this.initialized) return;

		this.initialized = true;

		// Initialize
		Components
			.classes['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
			.getService(Components.interfaces.pIXMigemoDicManager);

		ObserverService.addObserver(this, 'XMigemo:cacheCleared', false);
	},
 
	destroy : function() 
	{
		ObserverService.removeObserver(this, 'XMigemo:cacheCleared');
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemo) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function ArrayEnumerator(aItems) 
{
	this._index = 0;
	this._contents = aItems;
}

ArrayEnumerator.prototype = {
	interfaces : [
		Components.interfaces.nsISimpleEnumerator,
		Components.interfaces.nsISupports
	],

	QueryInterface : function (iid)
	{
		if (!iid.equals(Components.interfaces.nsISimpleEnumerator) &&
			!iid.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},

	_index    : 0,
	_contents : [],

	hasMoreElements : function()
	{
		return this._index < this._contents.length;
	},
	getNext : function()
	{
		return this._contents[this._index++];
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
			CID        : pXMigemo.prototype.classID,
			contractID : pXMigemo.prototype.contractID,
			className  : pXMigemo.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemo()).QueryInterface(aIID);
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
		dump((aString.length > 20 ? aString.substring(0, 20) : aString )+'\n');
}
 
