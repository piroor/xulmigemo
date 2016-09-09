var EXPORTED_SYMBOLS = ['MigemoAPI']; 

var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

var MAX_CACHE_COUNT = 100;

Cu.import('resource://gre/modules/Services.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/core.js');
Cu.import('resource://xulmigemo-modules/core/engine.js');
Cu.import('resource://xulmigemo-modules/core/cache.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('api', ...aArgs); }


var MigemoAPI = {
	dictionaries : MigemoConstants.SYSTEM_DIC, 
 
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
		if (!this.version) {
			this.version = '?';
			let { AddonManager } = Component.utils.import('resource://gre/modules/AddonManager.jsm', {});
			AddonManager.getAddonByID('{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}', (function(aAddon) {
				this.version = aAddon.version;
				this.lang = this.XMigemo.lang;
				this.provider = 'XUL/Migemo '+aAddon.version+' ('+this.lang+')';
			}).bind(this));
		}

		this.lang = this.XMigemo.lang;
		this.provider = 'XUL/Migemo '+this.version+' ('+this.lang+')';
	},
 
	// MigemoAPI 
	
	getRegExp : function(aInput, aFlags) 
	{
		if (!aFlags && aFlags !== '') aFlags = 'im';
		var key = aInput+'-'+aFlags;
		if (!(key in this._getRegExp_cache)) {
			this._getRegExp_cache[key] = new RegExp(this.XMigemo.getRegExp(aInput, this.dictionaries), aFlags);
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
			this._getRegExps_cache[key] = this.XMigemo.getRegExps(aInput, this.dictionaries).map(function(aSource) {
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
			var regexp = this.XMigemo.getRegExpFunctional(aInput, terms, exceptions, this.dictionaries);
			regexp = new RegExp(regexp, aFlags);
			regexp.regexp = regexp;
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
			var regexps = this.XMigemo.getRegExpsFunctional(aInput, terms, exceptions, this.dictionaries);
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
  
	// MigemoQueryAPI 
	
	query : function(aInput) 
	{
		return this.XMigemo.getRegExp(aInput, this.dictionaries);
	},
 
	queries : function(aInput) 
	{
		if (!(aInput in this._queries_cache)) {
			this._queries_cache[aInput] = this.XMigemo.getRegExps(aInput, this.dictionaries);
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
			var regexp = this.XMigemo.getRegExpFunctional(aInput, terms, exceptions, this.dictionaries);
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
			var regexps = this.XMigemo.getRegExpsFunctional(aInput, terms, exceptions, this.dictionaries);
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
  
	// MigemoRangeFindAPI 
	
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
 
	getFlagsFromRegExp : function(aRegExp) 
	{
		var flags = [];
		if (aRegExp.ignoreCase) flags.push('i');
		if (aRegExp.global) flags.push('g');
		if (aRegExp.multiline) flags.push('m');
		return flags.join('');
	},
  
	get XMigemo() { 
		if (!this._XMigemo) {
			this._lang = '';
			try {
				this._lang = Services.prefs.getCharPref(MigemoConstants.BASE+'lang');
			}
			catch(e) {
			}
			this._XMigemo = MigemoCoreFactory.get(this._lang);
		}
		return this._XMigemo;
	},
	_lang : '',
	_XMigemo : null,
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'XMigemo:initialized':
				Services.obs.removeObserver(this, 'XMigemo:initialized');
				this._lang = '';
				this._XMigemo = null;
				this.initCache();
				this.initProperties();
				Services.prefs.QueryInterface(Ci.nsIPrefBranchInternal)
					.addObserver(MigemoConstants.BASE, this, false);
				return;

			case 'nsPref:changed':
				switch (aData)
				{
					case MigemoConstants.BASE+'lang':
						this._lang = '';
						this._XMigemo = null;
						this.initCache();
						this.initProperties();
						return;
				}
		}
	} 
}; 
 
Services.obs.addObserver(MigemoAPI, 'XMigemo:initialized', false);
