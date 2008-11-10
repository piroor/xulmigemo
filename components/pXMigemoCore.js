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
 
	get textUtils() 
	{
		if (!this._textUtils) {
			this._textUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);
		}
		return this._textUtils;
	},
	_textUtils : null,
 
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
		var romanTerms = this.engine.splitInput(aInput);
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
					.replace(/([^\\]|^)\|\|+/g, '$1|')
					.replace(/([^\\]|^)\(\|/g, '$1(')
					.replace(/([^\\]|^)\|\)/g, '$1)');

		mydump('created pattern: '+encodeURIComponent(myExp));

		return myExp;
	},
 
	simplePartOnlyPattern : /^([^\|]+)\|([^\|]+)\|([^\|]+)\|([^\|]+)$/i, 
  
	getRegExps : function(aInput) 
	{
		var self = this;
		return this.textUtils.trim(aInput)
			.split(/\s+/)
			.map(function(aInput) {
				return self.getRegExp(aInput);
			});
	},
 
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
dump('STEP 1: '+array.toSource()+'\n');
		array = this.expandTermsFromArray(array);
dump('STEP 2: '+array.toSource()+'\n');

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
		var self = this;
		while (
			(function(aArray)
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
						arguments.callee(aArray[i]);
						shouldContinue = true;
						continue;
					}
					aArray[i] = self.expandTerms(aArray[i]);
				}
				return shouldContinue;
			})(aArray)
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
 
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		if (!aTermsRegExp) aTermsRegExp = {};
		if (!aExceptionRegExp) aExceptionRegExp = {};

		aExceptionRegExp.value = '';
		if (this.notFindAvailable) {
			var exceptions = {};
			aInput = this.siftExceptions(aInput, exceptions);
			if (exceptions.value.length)
				aExceptionRegExp.value = this.textUtils.getORFindRegExpFromTerms(this.getRegExps(exceptions.value.join(' ')));
		}

		var regexps = this.getRegExps(aInput);
		var result = this.andFindAvailable ?
				this.textUtils.getANDFindRegExpFromTerms(regexps) :
				this.getRegExp(aInput) ;

		aTermsRegExp.value = this.textUtils.getORFindRegExpFromTerms(regexps);

		return result;
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
				this.textUtils.isRegExp(aInput) ||
				this.kMIGEMO_PATTERN.test(converted) ||
				(this.notFindAvailable && this.kNOT_PATTERN.test(converted))
			);
	},
	kMIGEMO_PATTERN : /^[\w\-\:\}\{\$\?\*\+\.\^\/\;\\]+$/im,
	kNOT_PATTERN : /^-/im,
 
	trimFunctionalInput : function(aInput) 
	{
		var input = this.textUtils.trim(aInput);
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

		//patTextはgetRegExp()で得られた正規表現オブジェクト
		var doc = Components.lookupMethod(aFindRange.startContainer, 'ownerDocument').call(aFindRange.startContainer);
		var term;
		var txt = this.textUtils.range2Text(aFindRange);

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false')
			aRegExpFlags = '';

		if (aFindBackwards && aRegExpFlags.indexOf('g') < 0) aRegExpFlags += 'g';

		var regExp = new RegExp(aRegExpSource, aRegExpFlags);
		if (txt.match(regExp)) {
			term = RegExp.lastMatch;
		}

		this.mFind.findBackwards = aFindBackwards;

		var foundRange = this.mFind.Find(term, aFindRange, aStartPoint, aEndPoint);
		return foundRange;
	},
 
	regExpFindArr : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint) 
	{
		return this.regExpFindArrInternal(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, null);
	},
	 
	regExpFindArrInternal : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aSurroundNode, aSelCon) 
	{
		if (!aStartPoint) {
			aStartPoint = aFindRange.startContainer.ownerDocument.createRange();
			aStartPoint.setStart(aFindRange.startContainer, aFindRange.startOffset);
		}
		if (!aEndPoint) {
			aEndPoint = aFindRange.endContainer.ownerDocument.createRange();
			aEndPoint.setStart(aFindRange.endContainer, aFindRange.endOffset);
		}

		var doc = aFindRange.startContainer.ownerDocument;
		var selRange = this.textUtils.getFoundRange(doc.defaultView);
		var shouldRebuildSelection = selRange && Prefs.getBoolPref('xulmigemo.rebuild_selection');
		var arrTerms;
		var arrResults = [];
		var rightContext;

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false')
			aRegExpFlags = '';
		var regExp = new RegExp(aRegExpSource, aRegExpFlags);

		var txt = this.textUtils.range2Text(aFindRange);
		arrTerms = txt.match(new RegExp(regExp.source, 'img'));

		if (!arrTerms) {
			return arrResults;
		}

		this.mFind.findBackwards = false;
		var foundRange;
		var foundLength;
		var selection = aSelCon && 'SELECTION_FIND' in aSelCon ?
				aSelCon.getSelection(aSelCon.SELECTION_FIND) : null ;
		for (var i = 0, maxi = arrTerms.length; i < maxi; i++)
		{
			foundRange = this.mFind.Find(arrTerms[i], aFindRange, aStartPoint, aEndPoint);
			if (!foundRange) continue;
			foundLength = foundRange.toString().length;
			if (aSurroundNode) {
				var isOverlap = shouldRebuildSelection ?
						this.textUtils.isRangeOverlap(foundRange, selRange) :
						false ;

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

				if (isOverlap)
					this.textUtils.delayedSelect(firstChild, foundLength, true);

				foundRange = doc.createRange();
				foundRange.selectNodeContents(nodeSurround);
				arrResults.push(foundRange);

				aFindRange.selectNodeContents(this.getDocumentBody(doc));
				aFindRange.setStartBefore(before);
				try {
					aFindRange.setEnd(aEndPoint.startContainer, aEndPoint.startOffset);
				}
				catch(e) {
				}
				aStartPoint.selectNodeContents(this.getDocumentBody(doc));
				aStartPoint.setStartBefore(before);
				aStartPoint.collapse(true);
			}
			else {
				arrResults.push(foundRange);

				aFindRange.setStart(foundRange.endContainer, foundRange.endOffset);
				aStartPoint.selectNodeContents(this.getDocumentBody(doc));
				aStartPoint.setStart(foundRange.endContainer, foundRange.endOffset);
				aStartPoint.collapse(true);
			}
			if (selection) {
				selection.addRange(foundRange);
			}
		}
		if (selection)
			aSelCon.repaintSelection(aSelCon.SELECTION_FIND);

		return arrResults;
	},
	 
	getDocumentBody : function(aDocument) 
	{
		if (aDocument instanceof Components.interfaces.nsIDOMHTMLDocument)
			return aDocument.body;

		try {
			var xpathResult = aDocument.evaluate(
					'descendant::*[contains(" BODY body ", concat(" ", local-name(), " "))]',
					aDocument,
					null,
					Components.interfaces.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			return xpathResult.singleNodeValue;
		}
		catch(e) {
		}
		return null;
	},
   
	regExpHighlightText : function(aRegExpSource, aRegExpFlags, aFindRange, aSurrountNode) 
	{
		if (!aSurrountNode) {
			return [];
		}
		return this.regExpFindArrInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurrountNode);
	},
 
	regExpHighlightTextWithSelection : function(aRegExpSource, aRegExpFlags, aFindRange, aSurrountNode, aSelCon) 
	{
		try {
			if (aSelCon)
				aSelCon = aSelCon.QueryInterface(Components.interfaces.nsISelectionController);
		}
		catch(e) {
			aSelCon = null;
		}
		return this.regExpFindArrInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurrountNode, aSelCon);
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
			.createInstance(Components.interfaces.nsITimer);
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

			case 'nsPref:changed':
				switch (aData)
				{
					case 'xulmigemo.ANDFind.enabled':
						this.andFindAvailable = Prefs.getBoolPref(aData);
						return;

					case 'xulmigemo.NOTFind.enabled':
						this.notFindAvailable = Prefs.getBoolPref(aData);
						return;
				}
		}
	},
	
	domain : 'xulmigemo', 
  
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

		var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		pbi.addObserver(this.domain, this, false);
		this.observe(null, 'nsPref:changed', 'xulmigemo.ANDFind.enabled');
		this.observe(null, 'nsPref:changed', 'xulmigemo.NOTFind.enabled');
	},
 
	destroy : function() 
	{
		ObserverService.removeObserver(this, 'XMigemo:cacheCleared');

		var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
		pbi.removeObserver(this.domain, this, false);
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
 
