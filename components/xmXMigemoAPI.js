var DEBUG = false; 
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;

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
 
	initCache : function() 
	{
		this._getRegExp_cache = {};
		this._getRegExp_cacheArray = [];
		this._getRegExps_cache = {};
		this._getRegExps_cacheArray = [];
		this._getRegExpFunctional_cache = {};
		this._getRegExpFunctional_cacheArray = [];
		this._getRegExpsFunctional_cache = {};
		this._getRegExpsFunctional_cacheArray = [];
	},
 
	get version() 
	{
		if (!this._version) {
			this._version = Cc['@mozilla.org/extensions/manager;1']
							.getService(Ci.nsIExtensionManager)
							.getItemForID('{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}')
							.version;
		}
		return this._version;
	},
	_version : '',
 
	get lang() 
	{
		return this.XMigemo.lang;
	},
 
	get andFindAvailable() 
	{
		return this.XMigemo.andFindAvailable;
	},
 
	get notFindAvailable() 
	{
		return this.XMigemo.notFindAvailable;
	},
 
	getRegExp : function(aInput, aFlags) 
	{
		if (!aFlags) aFlags = 'im';
		while (this._getRegExp_cacheArray.length >= MAX_CACHE_COUNT)
		{
			delete this._getRegExp_cache[this._getRegExp_cacheArray.shift()];
		}
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExp_cache)) {
			this._getRegExp_cache[key] = new RegExp(this.XMigemo.getRegExp(aInput), aFlags);
			this._getRegExp_cacheArray.push(this._getRegExp_cache[key]);
		}
		return this._getRegExp_cache[key];
	},
 
	getRegExps : function(aInput, aFlags) 
	{
		if (!aFlags) aFlags = 'im';
		while (this._getRegExps_cacheArray.length >= MAX_CACHE_COUNT)
		{
			delete this._getRegExps_cache[this._getRegExps_cacheArray.shift()];
		}
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExps_cache)) {
			this._getRegExps_cache[key] = this.XMigemo.getRegExps(aInput).map(function(aSource) {
				return new RegExp(aSource, aFlags);
			});
			this._getRegExps_cacheArray.push(this._getRegExps_cache[key]);
		}
		return this._getRegExps_cache[key];
	},
 
	getRegExpFunctional : function(aInput, aFlags) 
	{
		if (!aFlags) aFlags = 'im';
		while (this._getRegExpFunctional_cacheArray.length >= MAX_CACHE_COUNT)
		{
			delete this._getRegExpFunctional_cache[this._getRegExpFunctional_cacheArray.shift()];
		}
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
		return this._getRegExpFunctional_cache[key];
	},
 
	getRegExpsFunctional : function(aInput, aFlags) 
	{
		if (!aFlags) aFlags = 'im';
		while (this._getRegExpsFunctional_cacheArray.length >= MAX_CACHE_COUNT)
		{
			delete this._getRegExpsFunctional_cache[this._getRegExpsFunctional_cacheArray.shift()];
		}
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
		return this._getRegExpsFunctional_cache[key];
	},
 
	regExpFind : function(aRegExp, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		flags = flags.join('');

		var result = this.XMigemo.regExpFind(
						aRegExp.source,
						flags,
						aFindRange,
						aStartPoint,
						aEndPoint,
						(aFindBackwards ? true : false )
					);
		return result;
	},
 
	regExpFindArr : function(aRegExp, aFindRange, aStartPoint, aEndPoint) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		flags = flags.join('');

		var result = this.XMigemo.regExpFindArr(
						aRegExp.source,
						flags,
						aFindRange,
						aStartPoint,
						aEndPoint
					);
		return result;
	},
 
	regExpHighlightText : function(aRegExp, aFindRange, aSurrountNode) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		flags = flags.join('');

		var result = this.XMigemo.regExpHighlightText(
						aRegExp.source,
						flags,
						aFindRange,
						aSurrountNode
					);
		return result;
	},
 
	isValidFunctionalInput : function(aInput) 
	{
		return this.XMigemo.isValidFunctionalInput(aInput);
	},
 
	trimFunctionalInput : function(aInput) 
	{
		return this.XMigemo.trimFunctionalInput(aInput);
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
				Ci.nsIClassInfo,
				Ci.nsISecurityCheckedComponent,
				Ci.nsIObserver
			];
		aCount.value = interfaces.length;
		return interfaces;
	},
	getHelperForLanguage : function(aLanguage)
	{
		return null;
	},
 
	// nsISecurityCheckedComponent 
	canCreateWrapper : function(aIID)
	{
		return 'AllAccess';
	},
	canCallMehthod : function(aIID, aName)
	{
		return 'AllAccess';
	},
	canGetProperty : function(aIID, aName)
	{
		return 'AllAccess';
	},
	canSetProperty : function(aIID, aName)
	{
		return 'AllAccess';
	},
 
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.xmIXMigemoAPI) &&
			!aIID.equals(Ci.nsIClassInfo) &&
			!aIID.equals(Ci.nsISecurityCheckedComponent) &&
			!aIID.equals(Ci.nsIObserver) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
 
}; 
  
var categoryManager = Cc['@mozilla.org/categorymanager;1'] 
						.getService(Ci.nsICategoryManager);
var JAVASCRIPT_GLOBAL_PROPERTY_CATEGORY = 'JavaScript global property';
// var JAVASCRIPT_GLOBAL_PRIVILEGED_PROPERTY_CATEGORY = 'JavaScript global privileged property';

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
			aComponentManager.registerFactoryLocation(
				obj.CID,
				obj.className,
				obj.contractID,
				aFileSpec,
				aLocation,
				aType
			);
			categoryManager.addCategoryEntry(
				'app-startup',
				obj.className,
				obj.contractID,
				true,
				true
			);
			categoryManager.addCategoryEntry(
				JAVASCRIPT_GLOBAL_PROPERTY_CATEGORY,
				// JAVASCRIPT_GLOBAL_PRIVILEGED_PROPERTY_CATEGORY,
				obj.accessorName,
				obj.contractID,
				true,
				true
			);
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
			CID          : xmXMigemoAPI.prototype.classID,
			contractID   : xmXMigemoAPI.prototype.contractID,
			className    : xmXMigemoAPI.prototype.classDescription,
			accessorName : xmXMigemoAPI.prototype.accessorName,
			factory      : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoAPI()).QueryInterface(aIID);
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
 
