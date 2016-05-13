var EXPORTED_SYMBOLS = ['MigemoCore', 'MigemoCoreFactory'];

/* This depends on: 
	MigemoEngine
	MigemoCache
	MigemoDicManager
	MigemoTextUtils
*/
var DEBUG = false;
var TEST = false;
const Cc = Components.classes;
const Ci = Components.interfaces;
 
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm'); 
Components.utils.import('resource://xulmigemo-modules/core/textUtils.js');
Components.utils.import('resource://xulmigemo-modules/core/dicManager.js');
Components.utils.import('resource://xulmigemo-modules/core/cache.js');

var timer = {};

const ObserverService = Cc['@mozilla.org/observer-service;1']
			.getService(Ci.nsIObserverService);;

const Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function MigemoCore(aLang) {
	this.init(aLang);
}
MigemoCore.prototype = {

	SYSTEM_DIC : 1 << 0, 
	USER_DIC   : 1 << 1,
	ALL_DIC    : (1 << 0 | 1 << 1),
 
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

		var autoSplit = (aEnableAutoSplit === void(0)) ? Prefs.getBoolPref('xulmigemo.splitTermsAutomatically') : aEnableAutoSplit ;

		// 入力を切って、文節として個別に正規表現を生成する
		var romanTerm;
		var romanTerms = this.engine.splitInput(aInput);
		mydump('ROMAN: '+romanTerms.join('/').toLowerCase()+'\n');

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

		mydump('created pattern: '+encodeURIComponent(myExp));

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

		var cache = MigemoDicManager.cache;
		var cacheText = cache.getCacheFor(aInput, aTargetDic);
		if (cacheText) {
			mydump('cache:'+encodeURIComponent(cacheText));
			return cacheText.replace(/\n/g, '');
		}

		var date1 = Date.now();

		var regexpPattern = this.engine.getRegExpFor(aInput, aTargetDic);

		mydump('created:'+encodeURIComponent(regexpPattern));

		var date2 = Date.now();
		if ((date2 - date1) > (this.createCacheTimeOverride > -1 ? this.createCacheTimeOverride : Prefs.getIntPref('xulmigemo.cache.update.time'))) {
			// 遅かったらキャッシュします
			cache.setDiskCache(aInput, regexpPattern, aTargetDic);
			cache.setMemCache(aInput, regexpPattern, aTargetDic);
			mydump('CacheWasSaved');
		}
		else{
			cache.setMemCache(aInput, regexpPattern, aTargetDic);//メモリキャッシュ
			mydump('memCacheWasSaved');
		}
		mydump(date2 - date1);

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

		if (!aStartPoint) {
			aStartPoint = aFindRange.cloneRange();
			aStartPoint.collapse(true);
		}
		if (!aEndPoint) {
			aEndPoint = aFindRange.cloneRange();
			aEndPoint.collapse(false);
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
 
	regExpFindArray : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint) 
	{
		return this.regExpFindArrayInternal(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, null);
	},
	regExpFindArr : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint)
	{
		return this.regExpFindArray(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint);
	},
	
	regExpFindArrayInternal : function(aRegExpSource, aRegExpFlags, aFindRange, aStartPoint, aEndPoint, aSurroundNode, aUseSelection) 
	{
		if (aFindRange) aFindRange.QueryInterface(Ci.nsIDOMRange);
		if (aStartPoint) aStartPoint.QueryInterface(Ci.nsIDOMRange);
		if (aEndPoint) aEndPoint = aEndPoint.QueryInterface(Ci.nsIDOMRange);
		if (aSurroundNode) aSurroundNode = aSurroundNode.QueryInterface(Ci.nsIDOMNode);

		var findRange = aFindRange.cloneRange();
		var doc = findRange.startContainer.ownerDocument || findRange.startContainer;

		var startPoint = aStartPoint;
		if (startPoint) {
			startPoint = startPoint.cloneRange();
		}
		else {
			startPoint = findRange.cloneRange();
			startPoint.collapse(true);
		}

		if (!aEndPoint) {
			aEndPoint = findRange.cloneRange();
			aEndPoint.collapse(false);
		}

		var selRange = MigemoTextUtils.getFoundRange(doc.defaultView);
		if (selRange) selRange = selRange.QueryInterface(Ci.nsIDOMRange);
		var shouldRebuildSelection = selRange;
		var arrResults = [];
		var rightContext;

		if (aRegExpFlags == 'null' ||
			aRegExpFlags == 'undefined' ||
			aRegExpFlags == 'false') {
			aRegExpFlags = '';
		}
		aRegExpFlags = aRegExpFlags.toLowerCase();
		if (aRegExpFlags.indexOf('g') < 0) {
			aRegExpFlags += 'g';
		}
		var regExp = new RegExp(aRegExpSource, aRegExpFlags);

		var text = MigemoTextUtils.range2Text(findRange);
		if (!text.match(new RegExp(regExp.source, 'img'))) {
			return arrResults;
		}

		var terms = text.match(regExp);
		terms = regExp.ignoreCase ?
				MigemoTextUtils.brushUpTerms(terms) :
				MigemoTextUtils.brushUpTermsWithCase(terms) ;

		if (!terms.length)
			return arrResults;

		this.dispatchHighlightStartEvent(doc);

		var selCon = (aUseSelection && 'SELECTION_FIND' in Ci.nsISelectionController) ?
						doc.defaultView
							.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsIWebNavigation)
							.QueryInterface(Ci.nsIDocShell)
							.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsISelectionDisplay)
							.QueryInterface(Ci.nsISelectionController) :
						null ;
		var frameSelection = selCon ? selCon.getSelection(selCon.SELECTION_FIND) : null ;

		// レイアウトを確定しないと検索に失敗する（Firefox 4.0-）
		doc.clientTop;

		var originalFindRange  = findRange;
		var originalStartPoint = startPoint;
		var originalEndPoint   = aEndPoint;
		var body = this.getDocumentBody(doc);

		if (aSurroundNode) {
			if (!('setInterval' in timer))
				Components.utils.import('resource://xulmigemo-modules/lib/jstimer.jsm', timer);

			if (doc.__xulmigemo__highlightTimer) {
				timer.clearInterval(doc.__xulmigemo__highlightTimer);
				doc.__xulmigemo__highlightTimer = null;
			}

			let startPointNode = Prefs.getBoolPref('xulmigemo.startfromviewport') ?
					MigemoTextUtils.findFirstVisibleNode(doc) :
					body ;

			let createIterator = function(aTerm, aBackward, aFindRange, aStartPoint, aEndPoint) {
				return (function() {
					var find = Cc['@mozilla.org/embedcomp/rangefind;1'].createInstance(Ci.nsIFind);
					find.findBackwards = aBackward;
					find.caseSensitive = !regExp.ignoreCase;

					var foundRange;
					var findRange  = aFindRange.cloneRange();
					var startPoint = aStartPoint.cloneRange();
					var endPoint   = aEndPoint.cloneRange();
					var count = 0;
					var ranges = [];
					var highlights = [];
					while (foundRange = find.Find(aTerm, findRange, startPoint, endPoint))
					{
						let foundLength = foundRange.toString().length;
						let isOverlap = shouldRebuildSelection ?
								MigemoTextUtils.isRangeOverlap(foundRange, selRange) :
								false ;

						let nodeSurround   = aSurroundNode.cloneNode(true);
						let startContainer = foundRange.startContainer;
						let startOffset    = foundRange.startOffset;
						let endContainer   = foundRange.endContainer;
						let endOffset      = foundRange.endOffset;
						let docfrag        = foundRange.extractContents();
						let firstChild     = docfrag.firstChild;
						nodeSurround.appendChild(docfrag);
						foundRange.insertNode(nodeSurround);

						// レイアウトを確定しないと検索に失敗する（Firefox 4.0-）
						nodeSurround.clientTop;

						if (isOverlap)
							MigemoTextUtils.delayedSelect(firstChild, foundLength, true);

						foundRange = doc.createRange();
						foundRange.selectNodeContents(nodeSurround);
						arrResults.push(foundRange);
						ranges.push(foundRange);
						highlights.push(nodeSurround);

						startPoint.selectNode(nodeSurround);
						if (aBackward) {
							findRange.setStart(endPoint.endContainer, endPoint.endOffset);
							findRange.setEndBefore(nodeSurround);
							startPoint.collapse(true);
						}
						else {
							findRange.setStartAfter(nodeSurround);
							findRange.setEnd(endPoint.endContainer, endPoint.endOffset);
							startPoint.collapse(false);
						}
						if (frameSelection) {
							let subSelCon = this.getEditorSelConFromRange(foundRange);
							if (subSelCon) {
								subSelCon.getSelection(selCon.SELECTION_FIND)
									.addRange(foundRange);
								subSelCon.repaintSelection(selCon.SELECTION_FIND);
							}
							else {
								frameSelection.addRange(foundRange);
							}
						}

						if (count++ > this.ASYNC_HIGHLIGHT_UNIT) {
							if (frameSelection)
								selCon.repaintSelection(selCon.SELECTION_FIND);
							this.dispatchHighlightProgressEvent(doc, aTerm, ranges, highlights);
							yield;
							count = 0;
							ranges = [];
							highlights = [];
						}
					}
					findRange.detach();
					startPoint.detach();
					endPoint.detach();
					if (frameSelection)
						selCon.repaintSelection(selCon.SELECTION_FIND);
					this.dispatchHighlightProgressEvent(doc, aTerm, ranges, highlights);
				}).call(this);
			};

			let internalStartPoint = originalStartPoint;
			let forwardFindRange = originalFindRange;
			if (startPointNode !== body) {
				internalStartPoint = doc.createRange();
				internalStartPoint.selectNode(startPointNode);
				internalStartPoint.collapse(true);
				forwardFindRange = originalFindRange.cloneRange();
				forwardFindRange.setStartBefore(startPointNode);
			}

			let iterators = terms.map(function(aTerm) {
					return createIterator.call(this,
								aTerm, false,
								forwardFindRange, internalStartPoint, originalEndPoint
							);
				}, this);
			if (startPointNode !== body) {
				let backwardFindRange = originalFindRange.cloneRange();
				backwardFindRange.setEndBefore(startPointNode);
				iterators = iterators.concat(terms.map(function(aTerm) {
					return createIterator.call(this,
								aTerm, true,
								backwardFindRange, internalStartPoint, originalStartPoint
							);
				}, this));
			}

			let runner = function(aSelf) {
					iterators = iterators.filter(function(aIterafor) {
						try {
							aIterafor.next();
							return true;
						}
						catch(e) {
						}
						return false;
					});
					if (!iterators.length) {
						if (doc.__xulmigemo__highlightTimer) {
							timer.clearInterval(doc.__xulmigemo__highlightTimer);
							doc.__xulmigemo__highlightTimer = null;
						}
						aSelf.dispatchHighlightFinishEvent(doc);
					}
				};
			runner(this);
			if (iterators.length)
				doc.__xulmigemo__highlightTimer = timer.setInterval(runner, this.ASYNC_HIGHLIGHT_INTERVAL, this);
		}
		else {
			this.mFind.findBackwards = false;
			this.mFind.caseSensitive = !regExp.ignoreCase;
			terms.forEach(function(aTerm) {
				var foundRange;
				var findRange  = originalFindRange.cloneRange();
				var startPoint = originalStartPoint.cloneRange();
				var endPoint   = originalEndPoint.cloneRange();
				var ranges = [];
				while (foundRange = this.mFind.Find(aTerm, findRange, startPoint, endPoint))
				{
					let foundLength = foundRange.toString().length;
					arrResults.push(foundRange);
					ranges.push(foundRange);

					findRange.setStart(foundRange.endContainer, foundRange.endOffset);
					startPoint.selectNodeContents(body);
					startPoint.setStart(foundRange.endContainer, foundRange.endOffset);
					startPoint.collapse(true);
					if (frameSelection) {
						let subSelCon = this.getEditorSelConFromRange(foundRange);
						if (subSelCon) {
							subSelCon.getSelection(selCon.SELECTION_FIND)
								.addRange(foundRange);
							subSelCon.repaintSelection(selCon.SELECTION_FIND);
						}
						else {
							frameSelection.addRange(foundRange);
						}
					}
				}
				findRange.detach();
				startPoint.detach();
				endPoint.detach();
				this.dispatchHighlightProgressEvent(doc, aTerm, ranges, []);
			}, this);
			if (frameSelection)
				selCon.repaintSelection(selCon.SELECTION_FIND);

			this.dispatchHighlightFinishEvent(doc);

			arrResults.sort(MigemoTextUtils.compareRangePosition);
		}

		return arrResults;
	},
	ASYNC_HIGHLIGHT_UNIT : 10,
	ASYNC_HIGHLIGHT_INTERVAL : 100,
	dispatchHighlightStartEvent : function(aDocument) 
	{
		var event = aDocument.createEvent('Events');
		event.initEvent('XMigemoHighlightStart', true, false);
		aDocument.dispatchEvent(event);
	},
	dispatchHighlightProgressEvent : function(aDocument, aTerm, aRanges, aHighlights) 
	{
		var event = aDocument.createEvent('Events');
		event.initEvent('XMigemoHighlightProgress', true, false);
		event.foundTerm = aTerm;
		event.foundRanges = aRanges;
		event.highlights = aHighlights;
		aDocument.dispatchEvent(event);
	},
	dispatchHighlightFinishEvent : function(aDocument) 
	{
		var event = aDocument.createEvent('Events');
		event.initEvent('XMigemoHighlightFinish', true, false);
		aDocument.dispatchEvent(event);
	},
	
	getEditorSelConFromRange : function(aRange) 
	{
		var doc = aRange.startContainer.ownerDocument || aRange.startContainer;
		var editorElement = doc.evaluate(
				'ancestor::*[contains(" INPUT input TEXTAREA textarea textbox ", concat(" ", local-name(), " "))][last()]',
				aRange.startContainer,
				null,
				Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
				null
			).singleNodeValue;
		return (editorElement && (editorElement instanceof Ci.nsIDOMNSEditableElement)) ?
			editorElement
				.QueryInterface(Ci.nsIDOMNSEditableElement)
				.editor
				.selectionController :
			null ;
	},
 
	getDocumentBody : function(aDocument) 
	{
		if (aDocument.body)
			return aDocument.body;

		try {
			var xpathResult = aDocument.evaluate(
					'descendant::*[contains(" BODY body ", concat(" ", local-name(), " "))]',
					aDocument,
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			return xpathResult.singleNodeValue;
		}
		catch(e) {
		}
		return null;
	},
   
	regExpHighlight : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode) 
	{
		if (!aSurroundNode) {
			return [];
		}
		return this.regExpFindArrayInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurroundNode, false);
	},
	regExpHighlightText : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode)
	{
		return this.regExpHighlight(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode);
	},
 
	regExpHighlightSelection : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode) 
	{
		return this.regExpFindArrayInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurroundNode, true);
	},
	regExpHighlightTextWithSelection : function(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode)
	{
		return this.regExpHighlightSelection(aRegExpSource, aRegExpFlags, aFindRange, aSurroundNode);
	},
 
	clearHighlight : function(aDocument, aRecursively, aSelectionOnly, aKeepFoundHighlighted) 
	{
		var selCons = [];
		var highlights = this.getHighlights(aDocument, aRecursively, selCons);

		if (!('clearInterval' in timer))
			Components.utils.import('resource://xulmigemo-modules/lib/jstimer.jsm', timer);

		if (aDocument.__xulmigemo__highlightTimer) {
			timer.clearInterval(aDocument.__xulmigemo__highlightTimer);
			aDocument.__xulmigemo__highlightTimer = null;
		}

		if (this.highlightSelectionAvailable) {
			selCons.forEach(function(aSelCon) {
				var selection = aSelCon.getSelection(aSelCon.SELECTION_FIND);
				selection.removeAllRanges();
				aSelCon.repaintSelection(aSelCon.SELECTION_FIND);
			});
			if (aSelectionOnly) return;
		}

		highlights.reverse();
		var doc, range, foundRange, foundLength;
		highlights.forEach(function(aHighlight) {
			var node = aHighlight.node;
			if (!doc || doc != node.ownerDocument) {
				if (range) range.detach();
				doc = node.ownerDocument;
				range = doc.createRange();
				var selection = doc.defaultView.getSelection();
				foundRange = (
						MigemoTextUtils.getFoundRange(doc.defaultView) ||
						(selection.rangeCount ? selection.getRangeAt(0) : null )
					);
				foundLength = foundRange ? foundRange.toString().length : 0 ;
			}

			if (node.getAttribute('class') == '__mozilla-findbar-animation') {
				range.selectNode(node);
				range.deleteContents();
				range.detach();
				return;
			}

			var hasSelection = false;
			if (foundRange && foundRange.toString().length) {
				range.selectNodeContents(node.parentNode);
				hasSelection = MigemoTextUtils.isRangeOverlap(foundRange, range);
			}

			range.selectNodeContents(node);

			var child   = null;
			var docfrag = doc.createDocumentFragment();
			var next    = node.nextSibling;
			var parent  = node.parentNode;
			while ((child = node.firstChild))
			{
				docfrag.appendChild(child);
			}
			var isOverlap = MigemoTextUtils.isRangeOverlap(foundRange, range);
			var firstChild  = docfrag.firstChild;

			parent.removeChild(node);
			parent.insertBefore(docfrag, next);
			if (isOverlap && firstChild) {
				MigemoTextUtils.delayedSelect(firstChild, foundLength, aKeepFoundHighlighted);
			}
			else if (hasSelection) {
				range = foundRange.cloneRange();
				range.collapse(true);
				range.setStartBefore(parent.firstChild);
				MigemoTextUtils.selectContentWithDelay(parent, range.toString().length, foundLength, aKeepFoundHighlighted);
			}

			parent.normalize();
		}, this);
		if (range) range.detach();
	},
	
	get highlightSelectionAvailable() 
	{
		return (
				this._highlightSelectionAvailable &&
				'SELECTION_FIND' in Ci.nsISelectionController
			);
	},
	set highlightSelectionAvailable(aValue)
	{
		this._highlightSelectionAvailable = aValue;
		return aValue;
	},
	_highlightSelectionAvailable : true,
 
	getHighlights : function(aDocument, aRecursively, aSelCons) 
	{
		var highlights = [];
		if (!aSelCons) aSelCons = [];

		var nodes;
		var selCon;

		try {
			var xpathResult = this.getEditableNodes(aDocument);
			var editable, editor;
			for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
			{
				editable = xpathResult.snapshotItem(i);
				editor = editable
						.QueryInterface(Ci.nsIDOMNSEditableElement)
						.editor;
				selCon = editor.selectionController;
				nodes = this.collectHighlightNodes(aDocument, editor.rootElement);
				highlights = highlights.concat(nodes.map(function(aNode) {
					return {
						node : aNode,
						selectionController : selCon
					};
				}));;
				aSelCons.push(selCon);
			}
		}
		catch(e) {
		}

		try {
			selCon = aDocument.defaultView
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation)
				.QueryInterface(Ci.nsIDocShell)
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsISelectionDisplay)
				.QueryInterface(Ci.nsISelectionController);
			aSelCons.push(selCon);
		}
		catch(e) {
			selCon = null;
		}
		nodes = this.collectHighlightNodes(aDocument, aDocument);
		highlights = highlights.concat(nodes.map(function(aNode) {
			return {
				node : aNode,
				selectionController : selCon
			};
		}));

		if (aRecursively)
			Array.slice(aDocument.defaultView.frames)
				.forEach(function(aFrame) {
					highlights = highlights.concat(this.getHighlights(aFrame.document, aRecursively, aSelCons));
				}, this);

		return highlights;
	},
	
	getEditableNodes : function(aDocument) 
	{
		var expression = [
					'descendant::*[',
						'local-name()="TEXTAREA" or local-name()="textarea" or ',
						'((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))',
					']'
				].join('');
		return aDocument.evaluate(
				expression,
				aDocument,
				null,
				Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
	},
  
	collectHighlightNodes : function(aDocument, aTarget) 
	{
		var xpathResult = aDocument.evaluate(
				'descendant::*[contains(@class, "__mozilla-findbar-search")]',
				aTarget,
				null,
				Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		var nodes = [];
		for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
		{
			nodes.push(xpathResult.snapshotItem(i));
		}
		return nodes;
	},
  
	repaintHighlights : function(aDocument, aRecursively, aSelection) 
	{
		if (!this.highlightSelectionAvailable) return;

		if (!('setTimeout' in timer))
			Components.utils.import('resource://xulmigemo-modules/lib/jstimer.jsm', timer);

		if (aDocument.__xulmigemo__repaintHighlightsTimer)
			timer.clearTimeout(aDocument.__xulmigemo__repaintHighlightsTimer);

		if (aSelection !== void(0))
			aDocument.__xulmigemo__nextHighlightSelectionState = aSelection;

		aDocument.__xulmigemo__repaintHighlightsTimer = timer.setTimeout(function(aSelf) {
			aSelf.repaintHighlightsNow(aDocument, aRecursively);
		}, 1, this);
	},
	repaintHighlightsTask : null,
	
	repaintHighlightsNow : function(aDocument, aRecursively) 
	{
		var selCons = [];
		var highlights = this.getHighlights(aDocument, aRecursively, selCons);
		if (aDocument.__xulmigemo__nextHighlightSelectionState === void(0)) {
			selCons.forEach(function(aSelCon) {
				aSelCon.repaintSelection(aSelCon.SELECTION_FIND);
			});
		}
		else if (aDocument.__xulmigemo__nextHighlightSelectionState) {
			var lastSelCon, selection;
			highlights.forEach(function(aHighlight) {
				var selCon = aHighlight.selectionController;
				if (!selCon) return;

				if (selCon != lastSelCon) {
					if (lastSelCon)
						lastSelCon.repaintSelection(lastSelCon.SELECTION_FIND);
					selection = selCon.getSelection(selCon.SELECTION_FIND);
				}
				lastSelCon = selCon;

				var range = aHighlight.node.ownerDocument.createRange();
				range.selectNodeContents(aHighlight.node);
				selection.addRange(range);
			}, this);
			if (lastSelCon)
				lastSelCon.repaintSelection(lastSelCon.SELECTION_FIND);
		}
		else {
			selCons.forEach(function(aSelCon) {
				var selection = aSelCon.getSelection(aSelCon.SELECTION_FIND);
				selection.removeAllRanges();
			});
		}
		aDocument.__xulmigemo__nextHighlightSelectionState = void(0);
	},
  
	getDocShellForFrame : function(aFrame) 
	{
		return aFrame
				.QueryInterface(Ci.nsIInterfaceRequestor)
				.getInterface(Ci.nsIWebNavigation)
				.QueryInterface(Ci.nsIDocShell);
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
					case 'xulmigemo.ANDFind.enabled':
						this.andFindAvailable = Prefs.getBoolPref(aData);
						return;

					case 'xulmigemo.NOTFind.enabled':
						this.notFindAvailable = Prefs.getBoolPref(aData);
						return;

					case 'xulmigemo.ignoreHiraKata':
					case 'xulmigemo.ignoreLatinModifiers':
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

		var lang = aLang || Prefs.getCharPref('xulmigemo.lang');
		var leafNameSuffix = '';
		var moduleNameSuffix = '';
		if (lang) {
			leafNameSuffix = '.' + lang;
			moduleNameSuffix = lang.charAt(0).toUpperCase() + lang.slice(1);
		}

		var ns = Components.utils.import('resource://xulmigemo-modules/core/engine' + leafNameSuffix + '.js', {});
		this.engine = ns['MigemoEngine' + moduleNameSuffix];
		if (!this.engine.lang)
			this.engine.lang = aLang || Prefs.getCharPref('xulmigemo.lang');

		MigemoDicManager.init(this.dictionary, this.cache);

		ObserverService.addObserver(this, 'XMigemo:cacheCleared', false);

		var pbi = Prefs.QueryInterface(Ci.nsIPrefBranchInternal);
		pbi.addObserver(this.domain, this, false);
		this.observe(null, 'nsPref:changed', 'xulmigemo.ANDFind.enabled');
		this.observe(null, 'nsPref:changed', 'xulmigemo.NOTFind.enabled');
	},
 
	destroy : function() 
	{
		ObserverService.removeObserver(this, 'XMigemo:cacheCleared');

		var pbi = Prefs.QueryInterface(Ci.nsIPrefBranchInternal);
		pbi.removeObserver(this.domain, this, false);
	}
 
}; 

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

function mydump(aString) 
{
	if (DEBUG)
		dump((aString.length > 1024 ? aString.substring(0, 1024) : aString )+'\n');
}
 
