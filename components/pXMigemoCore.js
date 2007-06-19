/* This depends on: 
	pIXMigemoCache
	pIXMigemoDicManager
	pIXMigemoTextUtils
*/
var DEBUG = true;
 
var ObserverService = Components 
			.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);;
 	
function pXMigemoCore() { 
	mydump('create instance pIXMigemo(lang=*), start');
	this.init();
	mydump('create instance pIXMigemo(lang=*), finish');
}

pXMigemoCore.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/core;1?lang=*';
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
 
	dictionaryManager : null, 
 
	dictionary : null, 
 
	textTransform : null, 
 
	createCacheTimeOverride : -1, 
 
	getRegExp : function(aInput) 
	{
		return '';
	},
 
	gatherEntriesFor : function(aInput, aTargetDic, aCount) 
	{
		aCount.value = 0;
		return [];
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
 
