/* This depends on: 
	pIXMigemoEngine
	pIXMigemoCache
	pIXMigemoDicManager
	pIXMigemoTextUtils
*/
var DEBUG = false;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;

var Prefs = Components
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
function pXMigemoCore() { 
	mydump('create instance pIXMigemo');
}

pXMigemoCore.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/core;1';
	},
	get classDescription() {
		return 'This is a Migemo service itself.';
	},
	get classID() {
		return Components.ID('{4a17fa2c-1de7-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	SYSTEM_DIC : 1, 
	USER_DIC   : 2,
	ALL_DIC    : 3,
 
	get dictionaryManager() 
	{
		if (!this._dictionaryManager) {
			this._dictionaryManager = Components
				.classes['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.createInstance(Components.interfaces.pIXMigemoDicManager);
		}
		return this._dictionaryManager;
	},
	_dictionaryManager : null,
 
	get cache() 
	{
		if (!this._cache) {
			var cache = Components
					.classes['@piro.sakura.ne.jp/xmigemo/cache;1']
					.createInstance(Components.interfaces.pIXMigemoCache);
			var override;
			try {
				override = Prefs.getCharPref('xulmigemo.cache.override.'+this.lang);
			}
			catch(e) {
			}
			cache.initWithFileName(override || this.engine.lang+'.cache.txt');
			this._cache = cache;
		}
		return this._cache;
	},
	_cache : null,
 
	get dictionary() 
	{
		return !this.engine ? null : this.engine.dictionary;
	},
 
	get textTransform() 
	{
		return !this.engine ? null : this.engine.textTransform;
	},
 
	get lang() 
	{
		return !this.engine ? '' : this.engine.lang ;
	},
 
	get engine() 
	{
		return this._engine;
	},
	set engine(val)
	{
		this._engine  = val;
		return this._engine;
	},
	_engine : null,
 
	createCacheTimeOverride : -1, 
 
	getRegExp : function(aInput) 
	{
		return !this.engine ? '' : this.getRegExpInternal(aInput, void(0)) ;
	},
	
	getRegExpInternal : function(aInput, aEnableAutoSplit) 
	{
		var myExp = [];

		var autoSplit = (aEnableAutoSplit === void(0)) ? Prefs.getBoolPref('xulmigemo.splitTermsAutomatically') : aEnableAutoSplit ;

		// 入力を切って、文節として個別に正規表現を生成する
		var romanTerm;
		var romanTerms = this.engine.splitInput(aInput, {});
		mydump('ROMAN: '+romanTerms.join('/').toLowerCase()+'\n');

		var pattern, romanTermPart, nextPart;
		for (var i = 0, maxi = romanTerms.length; i < maxi; i++)
		{
			romanTerm = romanTerms[i].toLowerCase();

			pattern = this.getRegExpFor(romanTerm);
			if (!pattern) continue;
			myExp.push(pattern);


			if (!autoSplit) continue;

			romanTermPart = romanTerm;
			while (romanTermPart.length > 1)
			{
				romanTermPart = romanTermPart.substring(0, romanTermPart.length-1);
				pattern = this.getRegExpFor(romanTermPart, true);
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
				(myExp.length) ? ['(', myExp.join(')([ \t]+)?('), ')'].join('').replace(/\n/g, '') :
				'' ;

		myExp = myExp.replace(/\n|^\||\|$/g, '')
					.replace(/\|\|+/g, '|')
					.replace(/\(\|/g, '(')
					.replace(/\|\)/g, ')');

		mydump('created pattern: '+encodeURIComponent(myExp));

		return myExp;
	},
 
	simplePartOnlyPattern : /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i, 
  
	getRegExpFor : function(aInput) 
	{
		if (!aInput) return null;
		if (!this.engine) return null;

		aInput = aInput.toLowerCase();

		var cache = this.dictionaryManager.cache;
		var cacheText = cache.getCacheFor(aInput);
		if (cacheText) {
			mydump('cache:'+encodeURIComponent(cacheText));
			return cacheText;
		}

		var date1 = new Date();

		var regexpPattern = this.engine.getRegExpFor(aInput);

		mydump('created:'+encodeURIComponent(regexpPattern));

		var date2 = new Date();
		if (date2.getTime() - date1.getTime() > (this.createCacheTimeOverride > -1 ? this.createCacheTimeOverride : Prefs.getIntPref('xulmigemo.cache.update.time'))) {
			// 遅かったらキャッシュします
			cache.setDiskCache(aInput, regexpPattern);
			cache.setMemCache(aInput, regexpPattern);
			mydump('CacheWasSaved');
		}
		else{
			cache.setMemCache(aInput, regexpPattern);//メモリキャッシュ
			mydump('memCacheWasSaved');
		}
		mydump(date2.getTime() - date1.getTime());

		return regexpPattern;
	},
 
	splitInput : function(aInput, aCount) 
	{
		if (!this.engine) return [aInput];

		var terms = this.engine.splitInput(aInput);
		aCount.value = terms.length;
		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic, aCount) 
	{
		return !this.engine ? [] : this.engine.gatherEntriesFor(aInput, aTargetDic, aCount) ;
	},
 
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
		if (!aStartPoint) {
			aStartPoint = aFindRange.startContainer.ownerDocument.createRange();
			aStartPoint.setStartBefore(aFindRange.startContainer);
		}
		if (!aEndPoint) {
			aEndPoint = aFindRange.endContainer.ownerDocument.createRange();
			aEndPoint.setEndAfter(aFindRange.endContainer);
		}

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

		if (aFindBackwards) {
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

		var foundRange = this.mFind.Find(term, aFindRange, aStartPoint, aEndPoint);
		return foundRange;
	},
 
	regExpFindArr : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aCount) 
	{
		return this.regExpFindArrInternal(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, null, aCount);
	},
	 
	regExpFindArrInternal : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aSurroundNode, aCount) 
	{
		if (!aStartPoint) {
			aStartPoint = aFindRange.startContainer.ownerDocument.createRange();
			aStartPoint.setStart(aFindRange.startContainer, aFindRange.startOffset);
		}
		if (!aEndPoint) {
			aEndPoint = aFindRange.endContainer.ownerDocument.createRange();
			aEndPoint.setStart(aFindRange.endContainer, aFindRange.endOffset);
		}

		var XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		var doc = aFindRange.startContainer.ownerDocument;
		var selRange = (Prefs.getBoolPref('xulmigemo.rebuild_selection')) ? XMigemoTextUtils.getFoundRange(doc.defaultView) : null ;
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

		if (!arrTerms) {
			aCount.value = arrResults.length;
			return arrResults;
		}

dump('selRange : '+selRange+'\n');
		this.mFind.findBackwards = false;
		var foundRange;
		var foundLength;
		for (var i = 0, maxi = arrTerms.length; i < maxi; i++)
		{
			foundRange = this.mFind.Find(arrTerms[i], aFindRange, aStartPoint, aEndPoint);
			if (!foundRange) continue;
			foundLength = foundRange.toString().length;
			if (aSurroundNode) {
				var selectAfter = selRange ? XMigemoTextUtils.isRangeOverlap(foundRange, selRange) : false ;

				var nodeSurround   = aSurroundNode.cloneNode(true);
				var startContainer = foundRange.startContainer;
				var startOffset    = foundRange.startOffset;
				var endOffset      = foundRange.endOffset;
				var docfrag        = foundRange.extractContents();
				var before         = startContainer.splitText(startOffset);
				var parent         = before.parentNode;
				var firstChild     = docfrag.firstChild;
				nodeSurround.appendChild(docfrag);
				parent.insertBefore(nodeSurround, before);

				dump('selectAfter : '+selectAfter+'\n');
				if (selectAfter) {
					XMigemoTextUtils.delayedSelect(firstChild, foundLength, true);
				}

				foundRange = doc.createRange();
				foundRange.selectNodeContents(nodeSurround);
				arrResults.push(foundRange);

				aFindRange.selectNodeContents(doc.body);
				aFindRange.setStartBefore(before);
				try {
					aFindRange.setEnd(aEndPoint.startContainer, aEndPoint.startOffset);
				}
				catch(e) {
				}
				aStartPoint.selectNodeContents(doc.body);
				aStartPoint.setStartBefore(before);
				aStartPoint.collapse(true);
			}
			else {
				arrResults.push(foundRange);

				aFindRange.setStart(foundRange.endContainer, foundRange.endOffset);
				aStartPoint.selectNodeContents(doc.body);
				aStartPoint.setStart(foundRange.endContainer, foundRange.endOffset);
				aStartPoint.collapse(true);
			}
		}

		aCount.value = arrResults.length;
		return arrResults;
	},
 	 
	regExpHighlightText : function(aRegExpSource, aRegExpFlags, aFindRange, aSurrountNode, aCount) 
	{
		if (!aSurrountNode) {
			aCount.value = 0;
			return [];
		}
		return this.regExpFindArrInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurrountNode, aCount);
	},
 
	getDocShellForFrame : function(aFrame) 
	{
		return aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
	},
  
/* Update Cache */ 
	 
	updateCacheFor : function(aInputPatterns) 
	{
		var patterns = aInputPatterns.split('\n');
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
					this.core.getRegExpFor(this.patterns[0]);
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

			case 'timer-callback':
				return;
		}
	},
 
	init : function(aLang) 
	{
		if (this.initialized) return;

		this.initialized = true;

		var id = '@piro.sakura.ne.jp/xmigemo/engine;1?lang='+(aLang || Prefs.getCharPref('xulmigemo.lang'));
		if (id in Components.classes) {
			this.engine = Components
				.classes[id]
				.getService(Components.interfaces.pIXMigemoEngine);
		}
		else {
			this.engine = Components
				.classes['@piro.sakura.ne.jp/xmigemo/engine;1?lang=*']
				.createInstance(Components.interfaces.pIXMigemoEngine)
				.QueryInterface(Components.interfaces.pIXMigemoEngineUniversal);
			this.engine.lang = aLang || Prefs.getCharPref('xulmigemo.lang');
		}

		this.dictionaryManager.init(this.dictionary, this.cache);

		ObserverService.addObserver(this, 'XMigemo:cacheCleared', false);
	},
 
	destroy : function() 
	{
		ObserverService.removeObserver(this, 'XMigemo:cacheCleared');
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemo) &&
			!aIID.equals(Components.interfaces.pIXMigemoEngine) &&
			!aIID.equals(Components.interfaces.nsIObserver) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function pXMigemoFactory() { 
	mydump('create instance pIXMigemoFactory');
}

pXMigemoFactory.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/factory;1';
	},
	get classDescription() {
		return 'This is a factory of Migemo service itself.';
	},
	get classID() {
		return Components.ID('{650d509a-1f48-11dc-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	services : {}, 
 
	getService : function(aLang) 
	{
		if (!(aLang in this.services)) {
			this.services[aLang] = Components
				.classes['@piro.sakura.ne.jp/xmigemo/core;1']
				.createInstance(Components.interfaces.pIXMigemo);
			this.services[aLang].init(aLang);
		}
		return this.services[aLang];
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Components.interfaces.pIXMigemoFactory) &&
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
			CID        : pXMigemoCore.prototype.classID,
			contractID : pXMigemoCore.prototype.contractID,
			className  : pXMigemoCore.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoCore()).QueryInterface(aIID);
				}
			}
		},
		managerForFactory : {
			CID        : pXMigemoFactory.prototype.classID,
			contractID : pXMigemoFactory.prototype.contractID,
			className  : pXMigemoFactory.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoFactory()).QueryInterface(aIID);
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
 
