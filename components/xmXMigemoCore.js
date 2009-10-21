/* This depends on: 
	xmIXMigemoEngine
	xmIXMigemoCache
	xmIXMigemoDicManager
	xmIXMigemoTextUtils
*/
var DEBUG = false;
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
 
var ObserverService = Cc['@mozilla.org/observer-service;1'] 
			.getService(Ci.nsIObserverService);;

var Prefs = Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch);
 
function xmXMigemoCore() { 
	mydump('create instance xmIXMigemo');
}

xmXMigemoCore.prototype = {
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
			if (TEST && xmXMigemoDicManager) {
				this._dictionaryManager = new xmXMigemoDicManager();
			}
			else {
				this._dictionaryManager = Cc['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
						.createInstance(Ci.xmIXMigemoDicManager);
			}
		}
		return this._dictionaryManager;
	},
	_dictionaryManager : null,
 
	get textUtils() 
	{
		if (!this._textUtils) {
			if (TEST && xmXMigemoTextUtils) {
				this._textUtils = new xmXMigemoTextUtils();
			}
			else {
				this._textUtils = Cc['@piro.sakura.ne.jp/xmigemo/text-utility;1']
						.getService(Ci.xmIXMigemoTextUtils);
			}
		}
		return this._textUtils;
	},
	_textUtils : null,
 
	get cache() 
	{
		if (!this._cache) {
			var cache;
			if (TEST && xmXMigemoCache) {
				cache = new xmXMigemoCache();
			}
			else {
				cache = Cc['@piro.sakura.ne.jp/xmigemo/cache;1']
						.createInstance(Ci.xmIXMigemoCache);
			}
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
		return this.textUtils.trim(aInput)
			.split(/\s+/)
			.map(function(aInput) {
				return this.getRegExp(aInput);
			}, this);
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
			return cacheText.replace(/\n/g, '');
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
 
	getRegExpFunctionalInternal : function(aInput, aTermsRegExp, aExceptionRegExp) 
	{
		aExceptionRegExp.value = '';
		if (this.notFindAvailable) {
			var exceptions = {};
			aInput = this.siftExceptions(aInput, exceptions);
			if (exceptions.value.length)
				aExceptionRegExp.value = this.textUtils.getORFindRegExpFromTerms(this.getRegExps(exceptions.value.join(' ')));
		}
		var regexps = this.getRegExps(aInput);
		aTermsRegExp.value = this.textUtils.getORFindRegExpFromTerms(regexps);
		return regexps;
	},
	getRegExpFunctional : function(aInput, aTermsRegExp, aExceptionRegExp)
	{
		if (!aTermsRegExp) aTermsRegExp = {};
		if (!aExceptionRegExp) aExceptionRegExp = {};
		var regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp);
		return this.andFindAvailable ?
				this.textUtils.getANDFindRegExpFromTerms(regexps) :
				this.getRegExp(aInput) ;
	},
	getRegExpsFunctional : function(aInput, aTermsRegExp, aExceptionRegExp)
	{
		if (!aTermsRegExp) aTermsRegExp = {};
		if (!aExceptionRegExp) aExceptionRegExp = {};
		var regexps = this.getRegExpFunctionalInternal(aInput, aTermsRegExp, aExceptionRegExp);
		return this.andFindAvailable ?
				regexps :
				[this.getRegExp(aInput)] ;
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

		var text = this.textUtils.range2Text(aFindRange);
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

		var selRange = this.textUtils.getFoundRange(doc.defaultView);
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

		var text = this.textUtils.lazyRange2Text(findRange);
		if (!text.match(new RegExp(regExp.source, 'img'))) {
			return arrResults;
		}

		var terms = text.match(regExp);
		terms = regExp.ignoreCase ?
				this.textUtils.brushUpTerms(terms) :
				this.textUtils.brushUpTermsWithCase(terms) ;

		this.mFind.findBackwards = false;
		this.mFind.caseSensitive = !regExp.ignoreCase;

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

		var originalFindRange = findRange;
		var originalStartPoint = startPoint;
		terms.forEach(function(aTerm) {
			var foundRange;
			var findRange = originalFindRange.cloneRange();
			var startPoint = originalStartPoint.cloneRange();
			var subSelCon;
			while (foundRange = this.mFind.Find(aTerm, findRange, startPoint, aEndPoint))
			{
				var foundLength = foundRange.toString().length;
				if (aSurroundNode) {
					var isOverlap = shouldRebuildSelection ?
							this.textUtils.isRangeOverlap(foundRange, selRange) :
							false ;

					var nodeSurround   = aSurroundNode.cloneNode(true);
					var startContainer = foundRange.startContainer;
					var startOffset    = foundRange.startOffset;
					var endOffset      = foundRange.endOffset;
					var docfrag        = foundRange.extractContents();
					var firstChild     = docfrag.firstChild;
					nodeSurround.appendChild(docfrag);
					foundRange.insertNode(nodeSurround);

					if (isOverlap)
						this.textUtils.delayedSelect(firstChild, foundLength, true);

					foundRange = doc.createRange();
					foundRange.selectNodeContents(nodeSurround);
					arrResults.push(foundRange);

					findRange.selectNodeContents(this.getDocumentBody(doc));
					findRange.setStartAfter(nodeSurround);
					try {
						findRange.setEnd(aEndPoint.startContainer, aEndPoint.startOffset);
					}
					catch(e) {
					}
					startPoint.selectNodeContents(this.getDocumentBody(doc));
					startPoint.setStartAfter(nodeSurround);
					startPoint.collapse(true);
				}
				else {
					arrResults.push(foundRange);

					findRange.setStart(foundRange.endContainer, foundRange.endOffset);
					startPoint.selectNodeContents(this.getDocumentBody(doc));
					startPoint.setStart(foundRange.endContainer, foundRange.endOffset);
					startPoint.collapse(true);
				}
				if (frameSelection) {
					subSelCon = this.getEditorSelConFromRange(foundRange);
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
		}, this);
		if (frameSelection)
			selCon.repaintSelection(selCon.SELECTION_FIND);

		arrResults.sort(this.textUtils.compareRangePosition);

		return arrResults;
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
		if (aDocument instanceof Ci.nsIDOMHTMLDocument)
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
   
	regExpHighlight : function(aRegExpSource, aRegExpFlags, aFindRange, aSurrountNode) 
	{
		if (!aSurrountNode) {
			return [];
		}
		return this.regExpFindArrayInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurrountNode);
	},
 
	regExpHighlightSelection : function(aRegExpSource, aRegExpFlags, aFindRange, aSurrountNode) 
	{
		return this.regExpFindArrayInternal(aRegExpSource, aRegExpFlags, aFindRange, null, null, aSurrountNode, true);
	},
 
	clearHighlight : function(aDocument, aRecursively, aSelectionOnly, aKeepFoundHighlighted) 
	{
		var selCons = [];
		var highlights = this.getHighlights(aDocument, aRecursively, selCons);

		if (this.highlightSelectionAvailable) { // Firefox 3.1
			selCons.forEach(function(aSelCon) {
				var selection = aSelCon.getSelection(aSelCon.SELECTION_FIND);
				selection.removeAllRanges();
				aSelCon.repaintSelection(aSelCon.SELECTION_FIND);
			});
			if (aSelectionOnly) return;
		}

		// old implementation for Firefox 3.0.x, 2.0.0.x
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
						this.textUtils.getFoundRange(doc.defaultView) ||
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
				hasSelection = this.textUtils.isRangeOverlap(foundRange, range);
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
			var isOverlap = this.textUtils.isRangeOverlap(foundRange, range);
			var firstChild  = docfrag.firstChild;

			parent.removeChild(node);
			parent.insertBefore(docfrag, next);
			if (isOverlap) {
				this.textUtils.delayedSelect(firstChild, foundLength, aKeepFoundHighlighted);
			}
			else if (hasSelection) {
				range = foundRange.cloneRange();
				range.collapse(true);
				range.setStartBefore(parent.firstChild);
				this.textUtils.selectContentWithDelay(parent, range.toString().length, foundLength, aKeepFoundHighlighted);
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
				'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search"]',
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

		if (aDocument.__xulmigemo__repaintHighlightsTask)
			aDocument.__xulmigemo__repaintHighlightsTask.cancel();

		if (aSelection !== void(0))
			aDocument.__xulmigemo__nextHighlightSelectionState = aSelection;

		aDocument.__xulmigemo__repaintHighlightsTask = new DelayedTask(
			this,
			this.repaintHighlightsNow,
			[aDocument, aRecursively],
			1
		);
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

		var lang = aLang || Prefs.getCharPref('xulmigemo.lang');
		var constructor;
		if (TEST) {
			eval('constructor = xmXMigemoEngine'+
					lang.replace(/^./, function(aChar) {
						return aChar.toUpperCase();
					})
			);
		}
		if (constructor) {
			this.engine = new constructor();
		}
		else {
			var id = '@piro.sakura.ne.jp/xmigemo/engine;1?lang='+lang;
			if (id in Cc) {
				this.engine = Cc[id]
					.getService(Ci.xmIXMigemoEngine);
			}
			else {
				this.engine = Cc['@piro.sakura.ne.jp/xmigemo/engine;1?lang=*']
					.createInstance(Ci.xmIXMigemoEngine)
					.QueryInterface(Ci.xmIXMigemoEngineUniversal);
				this.engine.lang = aLang || Prefs.getCharPref('xulmigemo.lang');
			}
		}

		this.dictionaryManager.init(this.dictionary, this.cache);

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
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(Ci.xmIXMigemo) &&
			!aIID.equals(Ci.xmIXMigemoEngine) &&
			!aIID.equals(Ci.nsIObserver) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function xmXMigemoFactory() { 
	mydump('create instance xmIXMigemoFactory');
}

xmXMigemoFactory.prototype = {
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
			this.services[aLang] = Cc['@piro.sakura.ne.jp/xmigemo/core;1']
				.createInstance(Ci.xmIXMigemo);
			this.services[aLang].init(aLang);
		}
		return this.services[aLang];
	},
 
	QueryInterface : function(aIID) 
	{
		if (!aIID.equals(Ci.xmIXMigemoFactory) &&
			!aIID.equals(Ci.pIXMigemoFactory) &&
			!aIID.equals(Ci.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
function DelayedTask(aSubject, aMethod, aArgs, aDelay) 
{
	this.subject = aSubject;
	this.method = aMethod;
	this.args = aArgs;
	this.init();
}
DelayedTask.prototype = {
	subject : null,
	method : null,
	args : null,
	timer : null,
	init : function(aDelay)
	{
		this.timer = Cc['@mozilla.org/timer;1']
			.createInstance(Ci.nsITimer);
		this.timer.init(this, aDelay, Ci.nsITimer.TYPE_ONE_SHOT);
	},
	cancel : function()
	{
		try {
			this.timer.cancel();
			this.timer = null;
		}
		catch(e) {
		}
		delete this.subject;
		delete this.method;
		delete this.args;
	},
	observe : function(aSubject, aTopic, aData)
	{
		if (aTopic != 'timer-callback') return;

		if (typeof this.method == 'function')
			this.method.apply(this.subject, this.args);
		else
			this.subject[this.method].apply(this.subject, this.args);

		this.cancel();
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
		aComponentManager.QueryInterface(Ci.nsIComponentRegistrar);
		for (var key in this._objects) {
			var obj = this._objects[key];
			aComponentManager.registerFactoryLocation(obj.CID, obj.className, obj.contractID, aFileSpec, aLocation, aType);
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
			CID        : xmXMigemoCore.prototype.classID,
			contractID : xmXMigemoCore.prototype.contractID,
			className  : xmXMigemoCore.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoCore()).QueryInterface(aIID);
				}
			}
		},
		managerForFactory : {
			CID        : xmXMigemoFactory.prototype.classID,
			contractID : xmXMigemoFactory.prototype.contractID,
			className  : xmXMigemoFactory.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new xmXMigemoFactory()).QueryInterface(aIID);
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
 
