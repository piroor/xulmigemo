var EXPORTED_SYMBOLS = ['MigemoCore', 'MigemoCoreFactory'];

/* This depends on: 
	MigemoEngine
	MigemoCache
	MigemoDicManager
	MigemoTextUtils
*/
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/Timer.jsm'); 

Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');
Cu.import('resource://xulmigemo-modules/lib/prefs.js');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/cache.js');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('core', ...aArgs); }
 
function MigemoCore(aLang) {
	this.init(aLang);
}
MigemoCore.prototype = inherit(MigemoConstants, {
 
	get cache() 
	{
		if (!this._cache) {
			this._cache = MigemoCacheFactory.get(this.lang);
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
 
	getRegExp : function(aInput, aTargetDic) 
	{
		return !this.engine ? '' : this.getRegExpInternal(aInput, aTargetDic, void(0)) ;
	},
	
	getRegExpInternal : function(aInput, aTargetDic, aEnableAutoSplit) 
	{
		var myExp = [];

		var autoSplit = (aEnableAutoSplit === void(0)) ? Services.prefs.getBoolPref(this.BASE+'splitTermsAutomatically') : aEnableAutoSplit ;

		// 入力を切って、文節として個別に正規表現を生成する
		var romanTerm;
		var romanTerms = this.engine.splitInput(aInput);
		log('ROMAN: '+romanTerms.join('/').toLowerCase()+'\n');

		var pattern, romanTermPart, nextPart;
		for (var i = 0, maxi = romanTerms.length; i < maxi; i++)
		{
			romanTerm = romanTerms[i].toLowerCase();

			pattern = this.getRegExpFor(romanTerm, aTargetDic);
			if (!pattern) continue;
			myExp.push(pattern);


			if (!autoSplit) continue;

			romanTermPart = romanTerm;
			while (romanTermPart.length > 1)
			{
				romanTermPart = romanTermPart.substring(0, romanTermPart.length-1);
				pattern = this.getRegExpFor(romanTermPart, aTargetDic, true);
				if (!this.simplePartOnlyPattern.test(pattern.replace(/\\\|/g, ''))) {
					myExp[myExp.length-1] = [
						myExp[myExp.length-1],
						'|(',
						pattern,
						')(',
						this.getRegExp(romanTerm.substring(romanTermPart.length, romanTerm.length), aTargetDic),
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
					.replace(/([^\\]|^)\|\|+/g, '$1|')
					.replace(/([^\\]|^)\(\|/g, '$1(')
					.replace(/([^\\]|^)\|\)/g, '$1)');

		log('created pattern: '+encodeURIComponent(myExp));

		return myExp;
	},
 
	simplePartOnlyPattern : /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i, 
  
	getRegExps : function(aInput, aTargetDic) 
	{
		return MigemoTextUtils.trim(aInput)
			.split(/\s+/)
			.map(function(aInput) {
				return this.getRegExp(aInput, aTargetDic);
			}, this);
	},
 
	getRegExpFor : function(aInput, aTargetDic) 
	{
		if (!aInput) return null;
		if (!this.engine) return null;

		aInput = aInput.toLowerCase();

		var cache = this.cache;
		var cacheText = cache.getCacheFor(aInput, aTargetDic);
		if (cacheText) {
			log('cache:'+encodeURIComponent(cacheText));
			return cacheText.replace(/\n/g, '');
		}

		var date1 = Date.now();

		var regexpPattern = this.engine.getRegExpFor(aInput, aTargetDic);

		log('created:'+encodeURIComponent(regexpPattern));

		var date2 = Date.now();
		if ((date2 - date1) > (this.createCacheTimeOverride > -1 ? this.createCacheTimeOverride : prefs.getPref(this.BASE+'cache.update.time'))) {
			// 遅かったらキャッシュします
			cache.setDiskCache(aInput, regexpPattern, aTargetDic);
			cache.setMemCache(aInput, regexpPattern, aTargetDic);
			log('CacheWasSaved');
		}
		else{
			cache.setMemCache(aInput, regexpPattern, aTargetDic);//メモリキャッシュ
			log('memCacheWasSaved');
		}
		log(date2 - date1);

		return regexpPattern;
	},
 
	splitInput : function(aInput) 
	{
		if (!this.engine) return [aInput];

		var terms = this.engine.splitInput(aInput);
		return terms;
	},
 
	gatherEntriesFor : function(aInput, aTargetDic) 
	{
		return !this.engine ? [] : this.engine.gatherEntriesFor(aInput, aTargetDic) ;
	},
 
	flattenRegExp : function(aRegExp) 
	{
		if (!aRegExp) {
			return [];
		}

		var source = (typeof aRegExp == 'string') ? aRegExp : aRegExp.source;
		source = source
			.replace(/\[[^\]]+\]/g, function(aClass) {
				return '('+aClass.replace(/\[|\]/g, '').split('').join('|')+')'
			})
			.replace(/\|\|+/g, '|');

		var array = this.expandParensToArray(source);
//dump('STEP 1: '+array.toSource()+'\n');
		array = this.expandTermsFromArray(array);
//dump('STEP 2: '+array.toSource()+'\n');

		array = (typeof array == 'string' ? array : array[0])
				.replace(/\n\n+/g, '\n').split('\n');
		return array;
	},
	
	expandParensToArray : function(aSource) 
	{
		var array = [];
		var scope = array;
		var escaped = false;
		var next = 'char';
		for (var i = 0, maxi = aSource.length; i < maxi; i++)
		{
			var char = aSource.charAt(i);
			switch (char)
			{
				case '\\':
					if (!escaped) {
						escaped = true;
						break;
					}
				case '(':
					if (!escaped) {
						var child = [];
						child.parent = scope;
						scope.push(child);
						scope = child;
						break;
					}
				case ')':
					if (!escaped) {
						scope = scope.parent;
						break;
					}
				default:
					if (typeof scope[scope.length-1] != 'string') {
						scope.push('');
					}
					scope[scope.length-1] += char;
					escaped = false;
					break;
			}
		}
		return array;
	},
 
	expandTermsFromArray : function(aArray) 
	{
		while (
			(function(aArray, aSelf)
			{
				var shouldContinue = false;
				for (var i = 0, maxi = aArray.length; i < maxi; i++)
				{
					if (typeof aArray[i] == 'string') continue;
					if (aArray[i].some(function(aItem) {
							return typeof aItem != 'string' &&
								(
									aItem.length > 1 ||
									typeof aItem[0] != 'string'
								);
						})) {
						arguments.callee(aArray[i], aSelf);
						shouldContinue = true;
						continue;
					}
					aArray[i] = aSelf.expandTerms(aArray[i]);
				}
				return shouldContinue;
			})(aArray, this)
		) {};
		return this.expandTerms(aArray);
	},
	
	expandTerms : function(aArray) 
	{
		var final = '';
		var result = '';
		var containsArray = false;
		aArray.forEach(function(aItem, aIndex, aArray) {
			var type = typeof aItem;
			if (type != 'string') {
				aItem = aItem[0];
				containsArray = true;
			}

			if (aItem.charAt(0) == '|') {
				final += (final ? '\n' : '') + result;
				result = '';
				aItem = aItem.substring(1);
			}

			var next = '';
			if (aItem.charAt(aItem.length-1) != '|') {
				aItem = aItem.replace(/\|([^\|]+)$/, '');
				next = RegExp.$1;
			}

			var leaves = aItem.replace(/\|/g, '\n');
			result = result.split('\n').map(function(aItem) {
				return leaves.split('\n').map(function(aLeaf) {
					return aItem.replace(/$/mg, aLeaf);
				}).join('\n');
			}).join('\n');

			if (next) {
				final += (final ? '\n' : '') + result;
				result = next;
				next = '';
			}
		});
		if (result)
			final += (final ? '\n' : '') + result;

		return containsArray ? [final] : final ;
	},
   
/* AND/NOT find */ 
	
	andFindAvailable : true, 
	notFindAvailable : true,
 
	getRegExpFunctionalInternal : function(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic) 
	{
		aExceptionRegExp.value = '';
		if (this.notFindAvailable) {
			var exceptions = {};
			aInput = this.siftExceptions(aInput, exceptions);
			if (exceptions.value.length)
				aExceptionRegExp.value = MigemoTextUtils.getORFindRegExpFromTerms(this.getRegExps(exceptions.value.join(' '), aTargetDic));
		}
		var regexps = this.getRegExps(aInput, aTargetDic);
		aTermsRegExp.value = MigemoTextUtils.getORFindRegExpFromTerms(regexps);
		return regexps;
	},
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic)
	{
		if (!aTermsRegExp) aTermsRegExp = {};
		if (!aExceptionRegExp) aExceptionRegExp = {};
		var regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic);
		return this.andFindAvailable ?
				MigemoTextUtils.getANDFindRegExpFromTerms(regexps) :
				this.getRegExp(aInput, aTargetDic) ;
	},
	getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic)
	{
		if (!aTermsRegExp) aTermsRegExp = {};
		if (!aExceptionRegExp) aExceptionRegExp = {};
		var regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp, aTargetDic);
		return this.andFindAvailable ?
				regexps :
				[this.getRegExp(aInput, aTargetDic)] ;
	},
	
	siftExceptions : function(aInput, aExceptions) 
	{
		if (!aExceptions) aExceptions = {};
		aExceptions.value = [];
		var findInput = aInput.split(/\s+/).filter(function(aTerm) {
			if (aTerm.indexOf('-') == 0) {
				aExceptions.value.push(aTerm.substring(1));
				return false;
			}
			return true;
		}).join(' ');
		return findInput;
	},
   
	isValidFunctionalInput : function(aInput) 
	{
		var converted = aInput.replace(/\s+/g, '\n');
		return (
				MigemoTextUtils.isRegExp(aInput) ||
				this.kMIGEMO_PATTERN.test(converted) ||
				(this.notFindAvailable && this.kNOT_PATTERN.test(converted))
			);
	},
	kMIGEMO_PATTERN : /^[\w\-\:\}\{\$\?\*\+\.\^\/\;\\]+$/im,
	kNOT_PATTERN : /^-/im,
 
	trimFunctionalInput : function(aInput) 
	{
		var input = MigemoTextUtils.trim(aInput);
		if (this.notFindAvailable) {
			// 入力中のNOT検索用演算子を除外
			input = input.replace(/\s+-$/, '');
		}
		return input;
	},
 
/* Find */ 
	
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Cc['@mozilla.org/embedcomp/rangefind;1'].createInstance(Ci.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	regExpFind : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aFindBackwards) 
	{
		aFindRange.QueryInterface(Ci.nsIDOMRange);
		if (aStartPoint) aStartPoint.QueryInterface(Ci.nsIDOMRange);
		if (aEndPoint) aEndPoint.QueryInterface(Ci.nsIDOMRange);

		var doc = aFindRange.startContainer.ownerDocument || aFindRange.startContainer;
		aFindRange = aFindRange.cloneRange();

		if (!aStartPoint) {
			aStartPoint = aFindRange.cloneRange();
			aStartPoint.collapse(true);
		}
		else {
			// we need to shrink the find range to find different term!
			aFindRange.setStart(aStartPoint.startContainer, aStartPoint.startOffset);
		}

		if (!aEndPoint) {
			aEndPoint = aFindRange.cloneRange();
			aEndPoint.collapse(false);
		}
		else {
			// we need to shrink the find range to find different term!
			aFindRange.setEnd(aEndPoint.endContainer, aEndPoint.endOffset);
		}

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false') {
			aRegExpFlags = '';
		}
		aRegExpFlags = aRegExpFlags.toLowerCase();
		if (aFindBackwards) {
			if (aRegExpFlags.indexOf('g') < 0) aRegExpFlags += 'g';
		}
		else {
			aRegExpFlags = aRegExpFlags.replace(/g/g, '');
		}
		var regExp = new RegExp(aRegExpSource, aRegExpFlags);

		var foundRange = null;

		var text = MigemoTextUtils.range2Text(aFindRange);
		if (text.match(regExp)) {
			term = RegExp.lastMatch;
			this.mFind.findBackwards = aFindBackwards;
			foundRange = this.mFind.Find(term, aFindRange, aStartPoint, aEndPoint);
		}

		return foundRange;
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

		this.cache.clearAll(true, this.core.USER_DIC);
		this.cache.clearAll(true, this.core.ALL_DIC);

		this.updateCacheTimers[key] = Cc['@mozilla.org/timer;1']
			.createInstance(Ci.nsITimer);
        this.updateCacheTimers[key].init(
			this.createUpdateCacheObserver(patterns, key),
			100,
			Ci.nsITimer.TYPE_REPEATING_SLACK
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
				var input = this.patterns[0];
				if (input) {
					[
						this.core.USER_DIC,
						this.core.ALL_DIC
					].forEach(function(aType) {
						var regexp = this.core.getRegExpFor(input, aType);
						this.core.cache.setDiskCache(input, regexp, aType);
						this.core.cache.setMemCache(input, regexp, aType);
					}, this);
				}
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

			case 'nsPref:changed':
				switch (aData)
				{
					case this.BASE+'ANDFind.enabled':
						this.andFindAvailable = Services.prefs.getBoolPref(aData);
						return;

					case this.BASE+'NOTFind.enabled':
						this.notFindAvailable = Services.prefs.getBoolPref(aData);
						return;

					case this.BASE+'ignoreHiraKata':
					case this.BASE+'ignoreLatinModifiers':
						this.cache.clearAll(true);
						return;
				}
		}
	},
	
	domain : 'xulmigemo', 
  
	init : function(aLang) 
	{
		if (this.initialized) return;

		this.initialized = true;

		var lang = aLang || prefs.getPref(this.BASE+'lang') || '';
		var leafNameSuffix = '';
		var moduleNameSuffix = '';
		if (lang.indexOf('en') !== 0) {
			leafNameSuffix = '.' + lang;
			moduleNameSuffix = lang.charAt(0).toUpperCase() + lang.slice(1);
		}

		var ns = Components.utils.import('resource://xulmigemo-modules/core/engine' + leafNameSuffix + '.js', {});
		this.engine = ns['MigemoEngine' + moduleNameSuffix];
		if (!this.engine.lang)
			this.engine.lang = aLang || prefs.getPref(this.BASE+'lang');

		let { MigemoDicManager } = Components.utils.import('resource://xulmigemo-modules/core/dicManager.js', {});
		MigemoDicManager.init(this.dictionary, this.cache);

		Services.obs.addObserver(this, 'XMigemo:cacheCleared', false);

		var pbi = Services.prefs.QueryInterface(Ci.nsIPrefBranchInternal);
		pbi.addObserver(this.domain, this, false);
		this.observe(null, 'nsPref:changed', this.BASE+'ANDFind.enabled');
		this.observe(null, 'nsPref:changed', this.BASE+'NOTFind.enabled');
	},
 
	destroy : function() 
	{
		Services.obs.removeObserver(this, 'XMigemo:cacheCleared');

		var pbi = Services.prefs.QueryInterface(Ci.nsIPrefBranchInternal);
		pbi.removeObserver(this.domain, this, false);
	}
 
}); 

var MigemoCoreFactory = {
	_instances : {},
	get : function(aLang)
	{
		if (!this._instances[aLang]) {
			this._instances[aLang] = new MigemoCore(aLang);
		}
		return this._instances[aLang];
	}
};
