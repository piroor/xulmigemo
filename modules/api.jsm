var EXPORTED_SYMBOLS = ['MigemoAPI']; 

var DEBUG = false; 
var TEST = false;
const Cc = Components.classes;
const Ci = Components.interfaces;

var MAX_CACHE_COUNT = 100;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

Components.utils.import('resource://xulmigemo-modules/core/core.js');
Components.utils.import('resource://xulmigemo-modules/core/engine.js');
Components.utils.import('resource://xulmigemo-modules/core/cache.js');

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);

const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);


var MigemoAPI = {
	dictionaries : MigemoEngine.SYSTEM_DIC, 
 
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
		var prototype = MigemoAPI.prototype;

		if (!prototype.version) {
			prototype.version = '?';
			let ns = {};
			Components.utils.import('resource://xulmigemo-modules/lib/extensions.js', ns);
			let self = this;
			ns.extensions.getVersion('{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}', function(aVersion) {
				prototype.version = aVersion;
				prototype.lang = self.XMigemo.lang;
				prototype.provider = 'XUL/Migemo '+aVersion+' ('+prototype.lang+')';
			});
		}

		prototype.lang = this.XMigemo.lang;
		prototype.provider = 'XUL/Migemo '+prototype.version+' ('+prototype.lang+')';
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
  
	// MigemoHighlightAPI 
	
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
			this._XMigemo = XMigemoCoreFactory.get(this._lang);
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
				ObserverService.removeObserver(this, 'XMigemo:initialized');
				this._lang = '';
				this._XMigemo = null;
				this.initCache();
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
	} 
}; 
 
ObserverService.addObserver(MigemoAPI, 'XMigemo:initialized', false);
 
function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
