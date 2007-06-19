/* This depends on: 
	pIXMigemoCore
	pIXMigemoCache
	pIXMigemoDictionary
	pIXMigemoTextTransform
*/
var DEBUG = true;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemo() { 
	mydump('create instance pIXMigemo(lang=en-US), start');
	this.base;
	this.dictionaryManager.init();
	mydump('create instance pIXMigemo(lang=en-US), finish');
}

pXMigemo.prototype = {
	lang : 'en-US',

	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/core;1?lang='+this.lang;
	},
	get classDescription() {
		return 'This is a Migemo service itself, for Japanese language.';
	},
	get classID() {
		return Components.ID('{6d1ae644-1ded-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	SYSTEM_DIC : 1, 
	USER_DIC   : 2,
	ALL_DIC    : 3,
 
	get base() // super class 
	{
		if (!this._base) {
			this._base = Components
								.classes['@piro.sakura.ne.jp/xmigemo/core;1?lang=*']
								.getService(Components.interfaces.pIXMigemo);
		}
		return this._base;
	},
	_base : null,
 
	get dictionaryManager() 
	{
		if (!this._dictionaryManager) {
			this._dictionaryManager = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.getService(Components.interfaces.pIXMigemoDicManager);

			this._dictionaryManager.dictionary = this.dictionary;
		}
		return this._dictionaryManager;
	},
	set dictionaryManager(val) 
	{
		this._dictionaryManager = val;
		return this.dictionaryManager;
	},
	_dictionaryManager : null,
 
	get dictionary() 
	{
		if (!this._dictionary) {
			this._dictionary = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary;1?lang='+this.lang]
				.getService(Components.interfaces.pIXMigemoDictionary);
		}
		return this._dictionary;
	},
	_dictionary : null,
 
	get textTransform() 
	{
		if (!this._textTransform) {
			this._textTransform = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-transform;1?lang=*']
				.getService(Components.interfaces.pIXMigemoTextTransform);
		}
		return this._textTransform;
	},
	_textTransform : null,
 
	// SKK方式の入力以外で、文節区切りとして認識する文字 
	INPUT_SEPARATOR : " ",
 
	createCacheTimeOverride : -1, 
 
/* Create Regular Expressions */ 
	 
	getRegExp : function(aInput) 
	{
		return this.getRegExpInternal(aInput);
	},
 
	getRegExpInternal : function(aInput) 
	{
		var myExp = [];

		var romanTerm;
		var romanTerms = aInput
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
		}

		myExp = (myExp.length == 1) ? myExp[0] :
				(myExp.length) ? ['(', myExp.join(')('), ')'].join('').replace(/\n/g, '') :
				'' ;

		return myExp.replace(/\n/im, '');
	},
 	
	simplePartOnlyPattern : /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i, 
 
	getRegExpPart : function(aInput) 
	{
		if (!aInput) return null;

		aInput = aInput.toLowerCase();

		const XMigemoCache = Components
							.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
							.getService(Components.interfaces.pIXMigemoCache);

		var cacheText = XMigemoCache.getCacheFor(aInput);
		if (cacheText) {
			mydump('cache:'+cacheText);
			return cacheText;
		}

		var XMigemoTextService = this.textTransform;
		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		mydump('noCache');
		var str = XMigemoTextUtils.sanitize(aInput);
		var date1 = new Date();

		var lines = this.gatherEntriesFor(aInput, this.ALL_DIC, {});

		var pattern = '';
		if (lines.length) {
			var arr = [];
			arr.push(XMigemoTextUtils.sanitize(aInput).toUpperCase());
			searchterm = arr.concat(lines).join('\n').replace(/(\t|\n\n)+/g, '\n');

			mydump('SEARCHTERM(before) : '+searchterm);

			searchterm = searchterm
				.split('\n')
				.sort()
				.join('\n')
				.replace(/^(.+)$(\n\1$)+/img, '$1')
//				.replace(/^.$\n?/mg, '')
				.split('\n') //
				.reverse()   // 最長一致にするために逆順に並べ替え
				.join('\n'); //

			searchterm = XMigemoTextUtils.sanitize(searchterm)
				.replace(/\n/g, '|');

			mydump('SEARCHTERM(after) : '+searchterm);
			pattern += (pattern ? '|' : '') + searchterm;

			pattern = pattern.replace(/\n/g, '');

			mydump('pattern(from dic):'+pattern);
		}
		else { // 辞書に引っかからなかった模様なので自前の文字列だけ
			pattern = XMigemoTextUtils.sanitize(aInput);
			mydump('pattern:'+pattern);
		}


		var date2 = new Date();
		if (date2.getTime() - date1.getTime() > (this.createCacheTimeOverride > -1 ? this.createCacheTimeOverride : Prefs.getIntPref('xulmigemo.cache.update.time'))) {
			// 遅かったらキャッシュします
			XMigemoCache.setDiskCache(aInput, pattern);
			XMigemoCache.setMemCache(aInput, pattern);
			mydump('CacheWasSaved');
		}
		else{
			XMigemoCache.setMemCache(aInput, pattern);//メモリキャッシュ
			mydump('memCacheWasSaved');
		}
		mydump(date2.getTime() - date1.getTime());

		return pattern;
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

		var str = XMigemoTextUtils.sanitize(aInput);

		var tmp = '^' + XMigemoTextUtils.sanitize(aInput) + '.+$';
		var exp = new RegExp(tmp, 'mg');

		var lines = [];

		const XMigemoDic = this.dictionary;

		var mydicU = (aTargetDic & this.USER_DIC) ? XMigemoDic.getUserDic() : null ;
		var mydic  = (aTargetDic & this.SYSTEM_DIC)   ? XMigemoDic.getDic() : null ;

		if (mydicU) {
			var lineU = mydicU.match(exp);
			if (lineU) {
				lines = lines.concat(lineU);
				mydump(' found '+lineU.length+' terms');
			}
		}
		if (mydic) {
			var line = mydic.match(exp);//アルファベットの辞書を検索
			if (line) {
				lines = lines.concat(line);
				mydump(' found '+line.length+' terms');
			}
		}

		aCount.value = lines.length;
		return lines;
	},
 
/* Bridge to the super class */ 
	
	regExpFind : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		return this.base.regExpFind(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards);
	},
 
	regExpFindArr : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aCount) 
	{
		return this.base.regExpFindArr(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aCount);
	},
 
	observe : function(aSubject, aTopic, aData) 
	{
		this.base.observe(aSubject, aTopic, aData);
	},
  
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemo) &&
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
		dump((aString.length > 80 ? aString.substring(0, 80) : aString )+'\n');
}
 
