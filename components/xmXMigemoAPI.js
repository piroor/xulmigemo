var DEBUG = false; 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var JAVASCRIPT_GLOBAL_PROPERTY_CATEGORY = 'JavaScript global property';
var JAVASCRIPT_GLOBAL_PRIVILEGED_PROPERTY_CATEGORY = 'JavaScript global privileged property';

var MAX_CACHE_COUNT = 100;

var ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);

 
function xmXMigemoAPI() { 
	mydump('create instance xmIXMigemoAPI');
	this._lang = '';
	this._XMigemo = null;
	this.initCache();
}

xmXMigemoAPI.prototype = {
	
	get contractID() { 
		return '@piro.sakura.ne.jp/xmigemo/api;1';
	},
	get classDescription() {
		return 'This is a Migemo service API for JavaScript.';
	},
	get classID() {
		return Components.ID('{6c93a2b0-bd7d-11de-8a39-0800200c9a66}');
	},
 
	accessorName : 'migemo', 
	category : JAVASCRIPT_GLOBAL_PROPERTY_CATEGORY,
 
	initCache : function() 
	{
		this._queries_cache = {};
		this._queries_cacheArray = [];
		this._queryFunctional_cache = {};
		this._queryFunctional_cacheArray = [];
		this._queriesFunctional_cache = {};
		this._queriesFunctional_cacheArray = [];

		this._getRegExp_cache = {};
		this._getRegExp_cacheArray = [];
		this._getRegExps_cache = {};
		this._getRegExps_cacheArray = [];
		this._getRegExpFunctional_cache = {};
		this._getRegExpFunctional_cacheArray = [];
		this._getRegExpsFunctional_cache = {};
		this._getRegExpsFunctional_cacheArray = [];
	},
 
	initProperties : function() 
	{
		var prototype = this.__proto__;

		if (!prototype.version)
			prototype.version = Cc['@mozilla.org/extensions/manager;1']
					.getService(Ci.nsIExtensionManager)
					.getItemForID('{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}')
					.version,

		prototype.lang = this.XMigemo.lang;
		prototype.provider = 'XUL/Migemo '+prototype.version+' ('+prototype.lang+')';
	},
/*
	get provider() {
		return 'XUL/Migemo '+this.version+' ('+this.lang+')';;
	},
	get version() {
		return Cc['@mozilla.org/extensions/manager;1']
					.getService(Ci.nsIExtensionManager)
					.getItemForID('{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}')
					.version;
	},
	get lang() {
		return this.XMigemo.lang;
	},
*/
 
	// xmIXMigemoAPI 
	
	getRegExp : function(aInput, aFlags) 
	{
		if (!aFlags && aFlags !== '') aFlags = 'im';
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExp_cache)) {
			this._getRegExp_cache[key] = new RegExp(this.XMigemo.getRegExp(aInput), aFlags);
			this._getRegExp_cacheArray.push(this._getRegExp_cache[key]);
		}
		while (this._getRegExp_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._getRegExp_cache[this._getRegExp_cacheArray.shift()];
		}
		return this._getRegExp_cache[key];
	},
 
	getRegExps : function(aInput, aFlags) 
	{
		if (!aFlags && aFlags !== '') aFlags = 'im';
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExps_cache)) {
			this._getRegExps_cache[key] = this.XMigemo.getRegExps(aInput).map(function(aSource) {
				return new RegExp(aSource, aFlags);
			});
			this._getRegExps_cacheArray.push(this._getRegExps_cache[key]);
		}
		while (this._getRegExps_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._getRegExps_cache[this._getRegExps_cacheArray.shift()];
		}
		return this._getRegExps_cache[key];
	},
 
	getRegExpFunctional : function(aInput, aFlags) 
	{
		aInput = this.trimFunctionalInput(aInput);
		if (!this.isValidFunctionalInput(aInput))
			throw 'xmXMigemoAPI::getRegExpFunctional() Error: "'+aInput+'" is not a valid input.';

		if (!aFlags && aFlags !== '') aFlags = 'im';
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExpFunctional_cache)) {
			var terms = {};
			var exceptions = {};
			var regexp = this.XMigemo.getRegExpFunctional(aInput, terms, exceptions);
			regexp = new RegExp(regexp, aFlags);
			regexp.terms = new RegExp(terms.value, 'gim');
			regexp.exceptions = exceptions.value ? new RegExp(exceptions.value, 'im') : null ;
			this._getRegExpFunctional_cache[key] = regexp;
			this._getRegExpFunctional_cacheArray.push(regexp);
		}
		while (this._getRegExpFunctional_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._getRegExpFunctional_cache[this._getRegExpFunctional_cacheArray.shift()];
		}
		return this._getRegExpFunctional_cache[key];
	},
 
	getRegExpsFunctional : function(aInput, aFlags) 
	{
		aInput = this.trimFunctionalInput(aInput);
		if (!this.isValidFunctionalInput(aInput))
			throw 'xmXMigemoAPI::getRegExpsFunctional() Error: "'+aInput+'" is not a valid input.';

		if (!aFlags && aFlags !== '') aFlags = 'im';
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExpsFunctional_cache)) {
			var terms = {};
			var exceptions = {};
			var regexps = this.XMigemo.getRegExpsFunctional(aInput, terms, exceptions);
			regexps = regexps.map(function(aSource) {
				return new RegExp(aSource, aFlags);
			});
			this._getRegExpsFunctional_cache[key] = {
				regexps : regexps,
				terms : new RegExp(terms.value, 'gim'),
				exceptions : exceptions.value ? new RegExp(exceptions.value, 'gim') : null
			};
			this._getRegExpsFunctional_cacheArray.push(this._getRegExpsFunctional_cache[key]);
		}
		while (this._getRegExpsFunctional_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._getRegExpsFunctional_cache[this._getRegExpsFunctional_cacheArray.shift()];
		}
		return this._getRegExpsFunctional_cache[key];
	},
 
	isValidFunctionalInput : function(aInput) 
	{
		return this.XMigemo.isValidFunctionalInput(aInput);
	},
 
	trimFunctionalInput : function(aInput) 
	{
		return this.XMigemo.trimFunctionalInput(aInput);
	},
  
	// xmIXMigemoQueryAPI 
	
	query : function(aInput) 
	{
		return this.XMigemo.getRegExp(aInput);
	},
 
	queries : function(aInput) 
	{
		if (!(aInput in this._queries_cache)) {
			this._queries_cache[aInput] = this.XMigemo.getRegExps(aInput);
			this._queries_cacheArray.push(this._queries_cache[key]);
		}
		while (this._queries_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._queries_cache[this._queries_cacheArray.shift()];
		}
		return this._queries_cache[aInput];
	},
 
	queryFunctional : function(aInput) 
	{
		aInput = this.trimFunctionalInput(aInput);
		if (!this.isValidFunctionalInput(aInput))
			throw 'xmXMigemoQueryAPI::queryFunctional() Error: "'+aInput+'" is not a valid input.';

		if (!(aInput in this._queryFunctional_cache)) {
			var terms = {};
			var exceptions = {};
			var regexp = this.XMigemo.getRegExpFunctional(aInput, terms, exceptions);
			this._queryFunctional_cache[aInput] = {
				regexp : regexp,
				terms : terms.value,
				exceptions : exceptions.value || ''
			};
			this._queryFunctional_cacheArray.push(this._queryFunctional_cache[aInput]);
		}
		while (this._queryFunctional_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._queryFunctional_cache[this._queryFunctional_cacheArray.shift()];
		}
		return this._queryFunctional_cache[key];
	},
 
	queriesFunctional : function(aInput) 
	{
		aInput = this.trimFunctionalInput(aInput);
		if (!this.isValidFunctionalInput(aInput))
			throw 'xmXMigemoQueryAPI::queriesFunctional() Error: "'+aInput+'" is not a valid input.';

		if (!(aInput in this._queriesFunctional_cache)) {
			var terms = {};
			var exceptions = {};
			var regexps = this.XMigemo.getRegExpsFunctional(aInput, terms, exceptions);
			this._queriesFunctional_cache[aInput] = {
				regexps : regexps,
				terms : terms.value,
				exceptions : exceptions.value || ''
			};
			this._queriesFunctional_cacheArray.push(this._queriesFunctional_cache[aInput]);
		}
		while (this._queriesFunctional_cacheArray.length > MAX_CACHE_COUNT)
		{
			delete this._queriesFunctional_cache[this._queriesFunctional_cacheArray.shift()];
		}
		return this._queriesFunctional_cache[key];
	},
  
	// xmIXMigemoRangeFindAPI 
	
	regExpFind : function(aRegExp, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		var result = this.XMigemo.regExpFind(
						aRegExp.source,
						this.getFlagsFromRegExp(aRegExp),
						aFindRange,
						aStartPoint,
						aEndPoint,
						(aFindBackwards ? true : false )
					);
		return result;
	},
 
	regExpFindArray : function(aRegExp, aFindRange, aStartPoint, aEndPoint) 
	{
		var result = this.XMigemo.regExpFindArray(
						aRegExp.source,
						this.getFlagsFromRegExp(aRegExp),
						aFindRange,
						aStartPoint,
						aEndPoint
					);
		return result;
	},
	regExpFindArr : function(aRegExp, aFindRange, aStartPoint, aEndPoint)
	{
		return this.regExpFindArray(aRegExp, aFindRange, aStartPoint, aEndPoint);
	},
 
	getFlagsFromRegExp : function(aRegExp) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		return flags.join('');
	},
  
	// xmIXMigemoHighlightAPI 
	
	regExpHighlight : function(aRegExp, aFindRange, aSurrountNode) 
	{
		var result = this.XMigemo.regExpHighlight(
						aRegExp.source,
						this.getFlagsFromRegExp(aRegExp),
						aFindRange,
						aSurrountNode
					);
		return result;
	},
 
	regExpHighlightSelection : function(aRegExp, aFindRange, aSurrountNode) 
	{
		var result = this.XMigemo.regExpHighlightSelection(
						aRegExp.source,
						this.getFlagsFromRegExp(aRegExp),
						aFindRange,
						aSurrountNode
					);
		return result;
	},
 
	clearHighlight : function(aDocument, aRecursively, aSelectionOnly, aKeepFoundHighlighted) 
	{
		this.XMigemo.clearHighlight(aDocument, aRecursively, aSelectionOnly, aKeepFoundHighlighted);
	},
 
	repaintHighlights : function(aDocument, aRecursively, aHighlighted) 
	{
		this.XMigemo.repaintHighlights(aDocument, aRecursively, aHighlighted);
	},
 
	getHighlights : function(aDocument, aRecursively) 
	{
		return this.XMigemo.getHighlights(aDocument, aRecursively);
	},
  
	get XMigemo() { 
		if (!this._XMigemo) {
			this._lang = '';
			try {
				this._lang = Prefs.getCharPref('xulmigemo.lang');
			}
			catch(e) {
			}
			this._XMigemo = Components
				.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
				.getService(Ci.xmIXMigemoFactory)
				.getService(this._lang);
		}
		return this._XMigemo;
	},
	_lang : '',
	_XMigemo : null,
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				ObserverService.addObserver(this, 'XMigemo:initialized', false);
				return;

			case 'XMigemo:initialized':
				ObserverService.removeObserver(this, 'XMigemo:initialized');
				this.initProperties();
				Prefs.QueryInterface(Ci.nsIPrefBranchInternal)
					.addObserver('xulmigemo.', this, false);
				return;

			case 'nsPref:changed':
				switch (aData)
				{
					case 'xulmigemo.lang':
						this._lang = '';
						this._XMigemo = null;
						this.initCache();
						this.initProperties();
						return;
				}
		}
	},
 
	// nsIClassInfo 
	flags : Ci.nsIClassInfo.DOM_OBJECT | Ci.nsIClassInfo.SINGLETON,
	classDescription : 'XMigemo',
	getInterfaces : function(aCount)
	{
		var interfaces = [
				Ci.xmIXMigemoAPI,
				Ci.xmIXMigemoCoreAPI,
				Ci.xmIXMigemoRangeFindAPI,
				Ci.xmIXMigemoHighlightAPI
				// hide interfaces unrelated to Migemo feature
				/* ,
				Ci.nsIClassInfo,
				Ci.nsIObserver
				*/
			];
		aCount.value = interfaces.length;
		return interfaces;
	},
	getHelperForLanguage : function(aLanguage)
	{
		return null;
	},
 
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.xmIXMigemoAPI) &&
			!aIID.equals(Ci.xmIXMigemoCoreAPI) &&
			!aIID.equals(Ci.xmIXMigemoRangeFindAPI) &&
			!aIID.equals(Ci.xmIXMigemoHighlightAPI) &&
			!aIID.equals(Ci.nsIClassInfo) &&
			!aIID.equals(Ci.nsIObserver) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
 
}; 
  
var categoryManager = Cc['@mozilla.org/categorymanager;1'] 
						.getService(Ci.nsICategoryManager);

var gModule = {
	_firstTime: true,

	registerSelf : function (aComponentManager, aFileSpec, aLocation, aType)
	{
		if (this._firstTime) {
			this._firstTime = false;
			throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
		}
		aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		this._objects.forEach(function(aObject) {
			aComponentManager.registerFactoryLocation(
				aObject.CID,
				aObject.className,
				aObject.contractID,
				aFileSpec,
				aLocation,
				aType
			);
			categoryManager.addCategoryEntry(
				'app-startup',
				aObject.className,
				aObject.contractID,
				true,
				true
			);
			categoryManager.addCategoryEntry(
				aObject.category,
				aObject.accessorName,
				aObject.contractID,
				true,
				true
			);
		}, this);
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

	_objects : [
		{
			CID          : xmXMigemoAPI.prototype.classID,
			contractID   : xmXMigemoAPI.prototype.contractID,
			className    : xmXMigemoAPI.prototype.classDescription,
			accessorName : xmXMigemoAPI.prototype.accessorName,
			category     : xmXMigemoAPI.prototype.category,
			factory      : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoAPI()).QueryInterface(aIID);
				}
			}
		}
	],

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
 
