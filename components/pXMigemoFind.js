/* This depends on: 
	pIXMigemo
	pIXMigemoTextUtils
*/
var DEBUG = false;
 
var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);

const pIXMigemoFind = Components.interfaces.pIXMigemoFind;
 
function pXMigemoFind() { 
	mydump('create instance pIXMigemoFind');
}

pXMigemoFind.prototype = {
	get contractID() {
		return '@piro.sakura.ne.jp/xmigemo/find;1';
	},
	get classDescription() {
		return 'This is a find service for XUL/Migemo.';
	},
	get classID() {
		return Components.ID('{147824f6-cef4-11db-8314-0800200c9a66}');
	},

	get wrappedJSObject() {
		return this;
	},
	 
	lastKeyword     : '', 
	previousKeyword : '',
	lastFoundWord   : '',
	
	appendKeyword : function(aString) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.lastKeyword += aString;
		return this.lastKeyword;
	},
 
	replaceKeyword : function(aString) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.lastKeyword = aString;
		return this.lastKeyword;
	},
 
	removeKeyword : function(aLength) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.lastKeyword = this.lastKeyword.substr(0, this.lastKeyword.length - aLength);
		return this.lastKeyword;
	},
 
	shiftLastKeyword : function() 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.previousKeyword = this.lastKeyword;
	},
  
	get isLinksOnly() 
	{
		return this.manualLinksOnly ||
			(this.isQuickFind && Prefs.getBoolPref('xulmigemo.linksonly'));
	},
	set isLinksOnly(val)
	{
		this.manualLinksOnly = val;
		return this.isLinksOnly;
	},
	isQuickFind     : false,
	manualLinksOnly : false,

	startFromViewport : false,
 
	NOTFOUND          : pIXMigemoFind.NOTFOUND, 
	FOUND             : pIXMigemoFind.FOUND,
	WRAPPED           : pIXMigemoFind.WRAPPED,
	FOUND_IN_LINK     : pIXMigemoFind.FOUND_IN_LINK,
	FOUND_IN_EDITABLE : pIXMigemoFind.FOUND_IN_EDITABLE,
	FINISH_FIND       : pIXMigemoFind.FINISH_FIND,
 
	FIND_DEFAULT     : pIXMigemoFind.FIND_DEFAULT, 
	FIND_BACK        : pIXMigemoFind.FIND_BACK,
	FIND_FORWARD     : pIXMigemoFind.FIND_FORWARD,
	FIND_WRAP        : pIXMigemoFind.FIND_WRAP,
	FIND_IN_LINK     : pIXMigemoFind.FIND_IN_LINK,
	FIND_IN_EDITABLE : pIXMigemoFind.FIND_IN_EDITABLE,
 
	findMode : pIXMigemoFind.FIND_MODE_MIGEMO, 

	FIND_MODE_NATIVE : pIXMigemoFind.FIND_MODE_NATIVE,
	FIND_MODE_MIGEMO : pIXMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : pIXMigemoFind.FIND_MODE_REGEXP,
 
	set target(val) 
	{
		if (val) {
			this._target = val;
			this.init();
		}
		return this._target;
	},
	get target()
	{
		return this._target;
	},
	_target : null,
	
	get document() 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		return this.target.ownerDocument;
	},
 
	get window() 
	{
		return this.document.defaultView;
	},
  
	set core(val) 
	{
		if (val) {
			this._core = val;
		}
		return this._core;
	},
	get core()
	{
		if (!this._core) {
			this._core = Components
				.classes['@piro.sakura.ne.jp/xmigemo/factory;1']
				.getService(Components.interfaces.pIXMigemoFactory)
				.getService(Prefs.getCharPref('xulmigemo.lang'));
		}
		return this._core;
	},
	_core : null,
 
	get textUtils() 
	{
		if (!this._textUtils)
			this._textUtils = Components
					.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
					.getService(Components.interfaces.pIXMigemoTextUtils);
		return this._textUtils;
	},
	_textUtils : null,
 
/* Find */ 
	 
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Components
					.classes['@mozilla.org/embedcomp/rangefind;1']
					.createInstance(Components.interfaces.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	findNext : function(aForceFocus) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.find(false, this.lastKeyword || this.previousKeyword, aForceFocus);
	},
 
	findPrevious : function(aForceFocus) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.find(true, this.lastKeyword || this.previousKeyword, aForceFocus);
	},
 
	find : function(aBackward, aKeyword, aForceFocus) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

mydump("find");
		var roman = aKeyword;
		if (!roman) return;

		this.viewportStartPoint = null;
		this.viewportEndPoint   = null;

		var myExp;
		switch (this.findMode)
		{
			case this.FIND_MODE_MIGEMO:
				myExp = this.core.getRegExp(roman);
				break;

			case this.FIND_MODE_REGEXP:
				myExp = this.textUtils.extractRegExpSource(roman);
				break;

			default:
				myExp = roman;
				break;
		}

		if (!myExp) {
			this.previousKeyword = roman;
			return;
		}

		//XMigemoCache.dump();
		var findFlag = (this.previousKeyword == roman) ?
				(aBackward ? this.FIND_BACK : this.FIND_FORWARD ) :
				this.FIND_DEFAULT;

		if (this.isLinksOnly)
			findFlag |= this.FIND_IN_LINK;

		var win = this.document.commandDispatcher.focusedWindow;
		if (win.top == this.window.top) win = this.target.contentWindow;

		var iterator = new DocShellIterator(win, findFlag & this.FIND_BACK ? true : false );
		var result = this.findInDocument(findFlag, myExp, iterator, aForceFocus);
		iterator.destroy();
		this.previousKeyword = roman;
	},
	 
	findInDocument : function(aFindFlag, aFindTerm, aDocShellIterator, aForceFocus) 
	{
mydump("findInDocument ==========================================");
		var rangeSet;
		var doc;
		var resultFlag;

		var isEditable     = false;
		var isPrevEditable = false;
		var editableInOut  = false;

		if (this.findMode != this.FIND_MODE_NATIVE) {
			if (aFindFlag & this.FIND_BACK) {
				aFindTerm = new RegExp(aFindTerm, 'gim');
			}
			else {
				aFindTerm = new RegExp(aFindTerm, 'im');
			}
		}

		while (true)
		{
			doc = aDocShellIterator.document;

			if (!aDocShellIterator.isFindable) {
				rangeSet = null;
				resultFlag = this.NOTFOUND;
			}
			else {
				rangeSet = this.getFindRangeSet(aFindFlag, aDocShellIterator);

				isPrevEditable = isEditable;
				isEditable     = this.findEditableFromRange(rangeSet.range) ? true : false ;
				editableInOut  = isEditable != isPrevEditable;

				resultFlag = this.findInDocumentInternal(aFindFlag, aFindTerm, rangeSet, doc, aForceFocus);
			}

			if (resultFlag & this.FINISH_FIND) {
				this.dispatchProgressEvent(aFindFlag, resultFlag);
				this.setSelectionLook(doc, true);
				break;
			}

			if (aDocShellIterator.isFindable) {
				this.clearSelection(doc);
				this.setSelectionLook(doc, false);
			}

			aDocShellIterator.iterateNext();

			if (aDocShellIterator.wrapped) {
				if (!(aFindFlag & this.FIND_WRAP)) {
					this.document.commandDispatcher.focusedWindow = aDocShellIterator.view;
					if (
						!editableInOut ||
						!rangeSet ||
						aDocShellIterator.isRangeTopLevel(rangeSet.range)
						)
						aFindFlag |= this.FIND_WRAP;
					continue;
				}
				this.dispatchProgressEvent(aFindFlag, resultFlag);
				break;
			}

			if (aDocShellIterator.isInitial) {
				this.dispatchProgressEvent(aFindFlag, resultFlag);
				break;
			}
		}

		if (resultFlag & this.FINISH_FIND)
			resultFlag ^= this.FINISH_FIND;

		return resultFlag;
	},
	 
	findInDocumentInternal : function(aFindFlag, aFindTerm, aRangeSet, aDocument, aForceFocus) 
	{
		var result;
		var rangeText = this.textUtils.range2Text(aRangeSet.range);

		var resultFlag;

		while (true)
		{
			if (this.isLinksOnly) {
				var links = aDocument.getElementsByTagName('a');
				if (!links.length)
					return this.NOTFOUND;
			}

			result = this.findInText(aFindFlag, aFindTerm, rangeText);

			resultFlag = result.foundTerm ?
				this.findInRange(aFindFlag, result.foundTerm, aRangeSet, aForceFocus) :
				this.NOTFOUND ;

			if (resultFlag & this.FOUND) {
				if (this.isLinksOnly && !(resultFlag & this.FOUND_IN_LINK)) {
					rangeText = result.rest;
					this.resetFindRangeSet(aRangeSet, this.foundRange, aFindFlag, aDocument);
					continue;
				}
				resultFlag |= this.FINISH_FIND;
				if (aFindFlag & this.FIND_WRAP)
					resultFlag |= this.WRAPPED;
			}
			return resultFlag;
		}
	},
 
	findInText : function(aFindFlag, aTerm, aText) 
	{
		var result = {
				foundTerm : null,
				rest      : aText
			};
		if (this.findMode != this.FIND_MODE_NATIVE) {
			if (aText.match(aTerm)) {
				if (aFindFlag & this.FIND_BACK) {
					result.foundTerm = RegExp.lastMatch;
					result.rest = RegExp.leftContext;
				}
				else {
					result.foundTerm = RegExp.lastMatch;
					result.rest = RegExp.rightContext;
				}
			}
		}
		else if (aFindFlag & this.FIND_BACK) {
			var index = rangeText.lastIndexOf(aTerm);
			if (index > -1) {
				result.foundTerm = aTerm;
				result.rest = rangeText.substring(0, index);
			}
		}
		else {
			var index = rangeText.indexOf(aTerm);
			if (index > -1) {
				result.foundTerm = aTerm;
				result.rest = rangeText.substring(index);
			}
		}
		return result;
	},
 
	dispatchProgressEvent : function(aFindFlag, aResultFlag) 
	{
		var event = this.document.createEvent('Events');
		event.initEvent('XMigemoFindProgress', true, true);
		event.resultFlag = aResultFlag;
		event.findFlag   = aFindFlag;
		this.document.dispatchEvent(event);
	},
  
	findInRange : function(aFindFlag, aTerm, aRangeSet, aForceFocus) 
	{
mydump("findInRange");
		var resultFlag = this.NOTFOUND;

		this.mFind.findBackwards = Boolean(aFindFlag & this.FIND_BACK);

		this.foundRange = this.mFind.Find(aTerm, aRangeSet.range, aRangeSet.start, aRangeSet.end) || null ;
		if (!this.foundRange) {
			return resultFlag;
		}

		resultFlag = this.FOUND;

		//※mozilla.party.jp 5.0でMac OS Xで動いてるのを見たが、
		//どうも選択範囲の色が薄いらしい…
		var v = this.foundRange.commonAncestorContainer.parentNode.ownerDocument.defaultView;
		if (aForceFocus)
			Components.lookupMethod(v, 'focus').call(v);

		if (this.findEditable()) {
			resultFlag |= this.FOUND_IN_EDITABLE;
			return resultFlag;
		}

		var link = this.findLink(aForceFocus);
		if (link) resultFlag |= this.FOUND_IN_LINK;

		var doc = aRangeSet.range.startContainer.ownerDocument;
		if (this.isLinksOnly) {
			if (link) {
				this.lastFoundWord = this.foundRange.toString();
				this.setSelectionAndScroll(this.foundRange, doc);
			}
		}
		else {
			this.lastFoundWord = this.foundRange.toString();
			this.setSelectionAndScroll(this.foundRange, doc);
		}
		return resultFlag;
	},
	 
	findEditable : function() 
	{
		if (!this.foundRange) return false;

		var doc = this.foundRange.startContainer.ownerDocument;
		doc.foundEditable = this.findEditableFromRange(this.foundRange);
		if (doc.foundEditable) {
			doc.lastFoundEditable = doc.foundEditable;
			this.lastFoundWord = this.foundRange.toString();
			this.setSelectionAndScroll(this.foundRange, doc);
			return true;
		}
		return false;
	},
 
	findLink : function(aForceFocus) 
	{
		var link = this.findLinkFromRange(this.foundRange);
		if (link && aForceFocus) {
			try{
				Components.lookupMethod(link, 'focus').call(link);
			}
			catch(e){
				link.focus();
			}
		}
		this.updateStatusBarWithDelay(link);
		return link;
	},
   
	findLinkFromRange : function(aRange) 
	{
mydump("findLinkFromRange");
		//後でXLinkを考慮したコードに直す

		var node = aRange.commonAncestorContainer;
		while (node && node.parentNode)
		{
			if (String(node.localName).toLowerCase() == 'a') {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	},
 
	findEditableFromRange : function(aRange) 
	{
mydump('findEditableFromRange');
		var node = aRange.commonAncestorContainer;
		while (node && node.parentNode)
		{
			var isEditable = false;
			try {
				node.QueryInterface(Components.interfaces.nsIDOMNSEditableElement);
				return node;
			}
			catch(e) {
			}
			node = node.parentNode;
		}
		return null;
	},
  
/* Range Manipulation */ 
	 
	getFindRangeSet : function(aFindFlag, aDocShellIterator) 
	{
mydump("getFindRangeSet");
		var doc       = aDocShellIterator.document;
		var docShell  = aDocShellIterator.current;
		var docSelCon = this.getSelectionController(aDocShellIterator.view);

		if (doc.lastFoundEditable) {
			var selCon = this.getSelectionController(doc.lastFoundEditable);
			var selection = selCon.getSelection(selCon.SELECTION_NORMAL);
			var testRange1 = doc.createRange();

			if (selection.rangeCount) {
				var testRange2, node;
				if (aFindFlag & this.FIND_BACK) {
					var testRange2 = selection.getRangeAt(0);
					var node = testRange2.startContainer;
				}
				else {
					var testRange2 = selection.getRangeAt(selection.rangeCount-1);
					var node = testRange2.endContainer;
				}
				while (node != doc.lastFoundEditable &&
						node.parentNode != doc.lastFoundEditable)
					node = node.parentNode;
				return this.getFindRangeSetIn(aFindFlag, doc, node, selCon);
			}

			selection.removeAllRanges();

			testRange1.selectNode(doc.lastFoundEditable);
			if (aFindFlag & this.FIND_BACK) {
				testRange1.setEndBefore(doc.lastFoundEditable);
			}
			else {
				testRange1.setStartAfter(doc.lastFoundEditable);
			}
			selection = docSelCon.getSelection(docSelCon.SELECTION_NORMAL);
			selection.addRange(testRange1);
			doc.lastFoundEditable = null;
		}

		return this.getFindRangeSetIn(aFindFlag, doc, (doc.body || doc.documentElement), docSelCon);
	},
	 
	getFindRangeSetIn : function(aFindFlag, aDocument, aRangeParent, aSelCon) 
	{
mydump("getFindRangeSetIn");
		var findRange = aDocument.createRange();
		findRange.selectNodeContents(aRangeParent);
		var startPt = aDocument.createRange();
		startPt.selectNodeContents(aRangeParent);
		var endPt = aDocument.createRange();
		endPt.selectNodeContents(aRangeParent);

		var selection;
		var count = 0;
		if (aSelCon) {
			selection = aSelCon.getSelection(aSelCon.SELECTION_NORMAL);
			count = selection.rangeCount;
		}
mydump("count:"+count);

		var childCount = aRangeParent.childNodes.length;
		var range;
		var node;
		var offset;

		if (aFindFlag & this.FIND_DEFAULT || count == 0) {
			if (
				aFindFlag & this.FIND_WRAP ||
				String(aRangeParent.localName).toLowerCase() != 'body' ||
				!this.startFromViewport
				) {
				findRange.selectNodeContents(aRangeParent);
				if (aFindFlag & this.FIND_BACK) {
					startPt.setStart(aRangeParent, childCount);
					startPt.setEnd(aRangeParent, childCount);
					endPt.collapse(true);
				}
				else {
					startPt.setStart(aRangeParent, 0);
					startPt.setEnd(aRangeParent, 0);
					endPt.collapse(false);
				}
			}
			else {
				if (aFindFlag & this.FIND_BACK) {
					node = this.viewportStartPoint ||
							this.findFirstVisibleNode(aFindFlag, aDocument.defaultView);
					this.viewportStartPoint = node;
					findRange.setStartAfter(node);
					startPt.setStartAfter(node);
					startPt.setEndAfter(node);
					endPt.collapse(true);
				}
				else {
					node = this.viewportEndPoint ||
							this.findFirstVisibleNode(aFindFlag, aDocument.defaultView);
					this.viewportEndPoint = node;
					findRange.setStartBefore(node);
					startPt.setStartBefore(node);
					startPt.setEndBefore(node);
					endPt.collapse(false);
				}
			}
		}
		else if (aFindFlag & this.FIND_FORWARD) {
			range = selection.getRangeAt(count-1);
			node = range.endContainer;
			offset = range.endOffset;
			findRange.setStart(node, offset);
			startPt.setStart(node, offset);
			startPt.setEnd(node, offset);
			endPt.collapse(false);
		}
		else if (aFindFlag & this.FIND_BACK){
			range = selection.getRangeAt(0);
			node = range.startContainer;
			offset = range.startOffset;
			findRange.setEnd(node, offset);
			startPt.setStart(node, offset);
			startPt.setEnd(node, offset);
			endPt.collapse(true);
		}

		var ret = {
			range : findRange,
			start : startPt,
			end   : endPt,
			owner : aRangeParent
		};

		return ret;
	},
 
	foundRange : null, 
 
	viewportStartPoint : null, 
	viewportEndPoint   : null,
 
	findFirstVisibleNode : function(aFindFlag, aFrame) 
	{
		var doc = aFrame.document;

		this.visibleNodeFilter.frameHeight = aFrame.innerHeight;
		this.visibleNodeFilter.startY      = aFrame.scrollY;
		this.visibleNodeFilter.endY        = aFrame.scrollY + aFrame.innerHeight;
		this.visibleNodeFilter.minPixels   = 12;
		this.visibleNodeFilter.minSize     = aFrame.innerWidth * aFrame.innerHeight;
		this.visibleNodeFilter.shouldReject  =
			this.visibleNodeFilter[(aFindFlag & this.FIND_BACK) ? 'isBelow' : 'isAbove' ];
		this.visibleNodeFilter.shouldAccept =
			this.visibleNodeFilter[(aFindFlag & this.FIND_BACK) ? 'isAbove' : 'isBelow' ];
		this.visibleNodeFilter.lastResult  = this.visibleNodeFilter.kSKIP;

		var walker = doc.createTreeWalker(
				doc.documentElement,
				Components.interfaces.nsIDOMNodeFilter.SHOW_ELEMENT,
				this.visibleNodeFilter,
				false
			);

		var node;
		if (aFindFlag & this.FIND_BACK) {
			while (node = walker.lastChild())
			{
				walker.currentNode = node;
			}
			this.visibleNodeFilter.found = false;
			while (!this.visibleNodeFilter.found &&
				(node = walker.previousNode()))
			{
				walker.currentNode = node;
			}
		}
		else {
			node = walker.firstChild();
			this.visibleNodeFilter.found = false;
			while (!this.visibleNodeFilter.found &&
				(node = walker.nextNode()))
			{
				walker.currentNode = node;
			}
		}
		return node || doc.documentElement;
	},
	 
	visibleNodeFilter : { 
		kSKIP   : Components.interfaces.nsIDOMNodeFilter.FILTER_SKIP,
		kACCEPT : Components.interfaces.nsIDOMNodeFilter.FILTER_ACCEPT,
		acceptNode : function(aNode)
		{
			var size = aNode.offsetWidth * aNode.offsetHeight;
			result = (
				size == 0 ||
				aNode.offsetHeight > this.frameHeight ||
				this.shouldReject(aNode, true)
				) ? this.kSKIP : this.kACCEPT ;

			if (result == this.kACCEPT) {
				if (size > this.minSize) result = this.kSKIP;
				this.minSize = Math.min(this.minSize, size);
			}

			if (!this.found && this.shouldAccept(aNode, false))
				this.found = true;

			this.lastResult = result;

			return result;
		},
		isAbove : function(aNode, aOutside)
		{
			var y = this.getY(aNode);
			var edge = aOutside ? this.startY : this.endY ;
			return (
				y < edge &&
				y + Math.min(this.frameHeight, aNode.offsetHeight) < edge + this.minPixels
			);
		},
		isBelow : function(aNode, aOutside)
		{
			var y = this.getY(aNode);
			var edge = aOutside ? this.endY : this.startY ;
			return (
				y + Math.min(this.frameHeight, aNode.offsetHeight) > edge &&
				y > edge - this.minPixels
			);
		},
		getY : function(aNode)
		{
			return aNode.ownerDocument.getBoxObjectFor(aNode).y;
		},
		shouldReject : null,
		shouldAccept : null,
		frameHeight  : 0,
		startY       : 0,
		endY         : 0,
		minPixels    : 12,
		minSize      : 0,
		lastResult   : null,
		found        : false
	},
  	 
	resetFindRangeSet : function(aRangeSet, aFoundRange, aFindFlag, aDocument) 
	{
mydump("resetFindRangeSet");
		var win = this.document.commandDispatcher.focusedWindow;
		var theDoc = (win && win.top != this.window.top) ?
					Components.lookupMethod(win, 'document').call(win) :
					aDocument ;

		var root = theDoc.body || theDoc.documentElement;
		aRangeSet.range.selectNodeContents(root);
		aRangeSet.start.selectNodeContents(root);

		var node;
		var offset;
		if (aFindFlag & this.FIND_DEFAULT || aFindFlag & this.FIND_FORWARD) {
			node = aFoundRange.endContainer;
			offset = aFoundRange.endOffset;
			aRangeSet.range.setStart(node, offset);
			aRangeSet.start.setStart(node, offset);
			aRangeSet.start.setEnd(node, offset);
		}
		else if (aFindFlag & this.FIND_BACK) {
			node = aFoundRange.startContainer;
			offset = aFoundRange.startOffset;
			aRangeSet.range.setEnd(node, offset);
			aRangeSet.start.setStart(node, offset);
			aRangeSet.start.setEnd(node, offset);
		}
		return aRangeSet;
	},
  
/* Update Appearance */ 
	
	getSelectionController : function(aTarget) 
	{
		if (!aTarget) return null;

		const nsIDOMNSEditableElement = Components.interfaces.nsIDOMNSEditableElement;
		const nsIDOMWindow = Components.interfaces.nsIDOMWindow;
		try {
			return (aTarget instanceof nsIDOMNSEditableElement) ?
						aTarget.QueryInterface(nsIDOMNSEditableElement).editor.selectionController :
					(aTarget instanceof nsIDOMWindow) ?
						DocShellIterator.prototype.getDocShellFromFrame(aTarget)
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsISelectionDisplay)
							.QueryInterface(Components.interfaces.nsISelectionController) :
					null;
		}
		catch(e) {
		}
		return null;
	},
 
	setSelectionLook : function(aDocument, aChangeColor) 
	{
		var self = this;
		[aDocument.foundEditable, aDocument.defaultView].forEach(function(aTarget) {
			var selCon = self.getSelectionController(aTarget);
			if (!selCon) return;
			if (aChangeColor)
				selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
			else
				selCon.setDisplaySelection(selCon.SELECTION_ON);
			try {
				selCon.repaintSelection(selCon.SELECTION_NORMAL);
			}
			catch(e) {
			}
		});
	},
 
	setSelectionAndScroll : function(aRange, aDocument) 
	{
mydump("setSelectionAndScroll");
		if (!aRange && !aDocument) return;

		if (!aDocument)
			aDocument = aRange.startContainer.ownerDocument;

		// clear old range
		var self = this;
		[
			(aDocument.foundEditable || aDocument.lastFoundEditable),
			aDocument.defaultView
		].forEach(function(aTarget) {
			var oldSelCon = self.getSelectionController(aTarget);
			if (!oldSelCon) return;
			var selection = oldSelCon.getSelection(oldSelCon.SELECTION_NORMAL);
			selection.removeAllRanges();
		});

		// set new range
		var newSelCon = this.getSelectionController(this.findEditableFromRange(aRange)) ||
				this.getSelectionController(aDocument.defaultView);
		var selection = newSelCon.getSelection(newSelCon.SELECTION_NORMAL);
		selection.addRange(aRange);

		newSelCon.scrollSelectionIntoView(
			newSelCon.SELECTION_NORMAL,
			newSelCon.SELECTION_FOCUS_REGION, true);

		this.scrollSelectionToCenter(aDocument.defaultView);
	},
	 
	scrollSelectionToCenter : function(aFrame) 
	{
		if (!Prefs.getBoolPref('xulmigemo.scrollSelectionToCenter')) return;

		var frame = aFrame ||
					this.getSelectionFrame(this.document.commandDispatcher.focusedWindow ||
					this.window._content);
		if (!frame) return;

		var selection = frame.getSelection();
		var range = frame.document.createRange();
		var elem;

		if (frame.document.foundEditable) {
			elem = frame.document.foundEditable;

			var box = elem.ownerDocument.getBoxObjectFor(elem);
			frame.scrollTo(box.x - frame.innerWidth / 2, box.y - frame.innerHeight / 2);
		}
		else {
			elem = frame.document.createElement('span');
			range.setStart(selection.focusNode, selection.focusOffset);
			range.setEnd(selection.focusNode, selection.focusOffset);
			range.insertNode(elem);

			var box = frame.document.getBoxObjectFor(elem);
			if (!box.x && !box.y)
				box = frame.document.getBoxObjectFor(elem.parentNode);

			frame.scrollTo(box.x - frame.innerWidth / 2, box.y - frame.innerHeight / 2);

			elem.parentNode.removeChild(elem);
			range.detach();
		}
	},
 
	getSelectionFrame : function(aFrame) 
	{
		var selection = aFrame.getSelection();
		if (selection && selection.rangeCount)
			return aFrame;

		var frame;
		for (var i = 0, maxi = aFrame.frames.length; i < maxi; i++)
		{
			frame = arguments.callee(aFrame.frames[i]);
			if (frame) return frame;
		}
		return null;
	},
 
	getPageOffsetTop : function(aNode) 
	{
		if (!aNode) return 0;
		var top = aNode.offsetTop;
		while (aNode.offsetParent != null)
		{
			aNode = aNode.offsetParent;
			top += aNode.offsetTop;
		}
		return top;
	},
  
	clearSelection : function(aDocument) 
	{
		if (aDocument.foundEditable || aDocument.lastFoundEditable)
			(aDocument.foundEditable || aDocument.lastFoundEditable)
				.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
				.editor.selection.removeAllRanges();

		var sel = aDocument.defaultView.getSelection();
		if (sel) sel.removeAllRanges();
	},
 
	updateStatusBar : function(aLink) 
	{
		var xulBrowserWindow;
		try {
			xulBrowserWindow = this.window
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.treeOwner
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIXULWindow)
					.XULBrowserWindow;
		}
		catch(e) {
			return;
		}

		if (!aLink || !aLink.href) {
			xulBrowserWindow.setOverLink('', null);
		}
		else {
			var charset = aLink.ownerDocument.characterSet;
			var uri = Components
						.classes['@mozilla.org/intl/texttosuburi;1']
						.getService(Components.interfaces.nsITextToSubURI)
						.unEscapeURIForUI(charset, aLink.href);
			xulBrowserWindow.setOverLink(uri, null);
		}
	},
	
	updateStatusBarWithDelay : function(aLink) 
	{
		this.cancelUpdateStatusBarTimer();
		this.updateStatusBarTimer = Components
				.classes['@mozilla.org/timer;1']
				.createInstance(Components.interfaces.nsITimer);
		this.updateStatusBarTimer.init(
			this.createDelayedUpdateStatusBarObserver(aLink),
			1,
			Components.interfaces.nsITimer.TYPE_ONE_SHOT
		);
	},
	cancelUpdateStatusBarTimer : function(aLink)
	{
		try {
			if (this.updateStatusBarTimer) {
				this.updateStatusBarTimer.cancel();
				this.updateStatusBarTimer = null;
			}
		}
		catch(e) {
		}
	},
	createDelayedUpdateStatusBarObserver : function(aLink)
	{
		return ({
				owner   : this,
				link    : aLink,
				observe : function(aSubject, aTopic, aData)
				{
					this.owner.updateStatusBar(this.link);
					this.link = null;
					this.owner.cancelUpdateStatusBarTimer();
					this.owner = null;
				}
			});
	},
   
	clear : function(aFocusToFoundTarget) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		this.lastKeyword        = '';
		this.viewportStartPoint = null;
		this.viewportEndPoint   = null;
		this.lastFoundWord      = '';

		var win = this.document.commandDispatcher.focusedWindow;
		var doc = (win != this.window) ? Components.lookupMethod(win, 'document').call(win) :
					this.target.contentDocument;

		this.exitFind(aFocusToFoundTarget);

		doc.foundEditable = null;
		doc.lastFoundEditable = null;
	},
 
	exitFind : function(aFocusToFoundTarget) 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		var win = this.document.commandDispatcher.focusedWindow;
		var doc = (win != this.window) ? Components.lookupMethod(win, 'document').call(win) :
					this.target.contentDocument;

		this.setSelectionLook(doc, false);

		if (!aFocusToFoundTarget) return;

		var WindowWatcher = Components
				.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);
		if (this.window != WindowWatcher.activeWindow) return;

		win = Components.lookupMethod(doc, 'defaultView').call(doc);
		if (!this.focusToFound(win))
			Components.lookupMethod(win, 'focus').call(win);
	},
	
	focusToFound : function(aFrame) 
	{
		var self = this;
		if (Array.prototype.slice.call(aFrame.frames).some(function(aFrame) {
				return self.focusToFound(aFrame);
			}))
			return true;

		var range = this.getFoundRange(aFrame);
		if (range) {
			var foundLink = this.findLinkFromRange(range);
			var foundEditable = this.findEditableFromRange(range);
			var target = foundLink || foundEditable;
			if (target) {
				try {
					Components.lookupMethod(target, 'focus').call(target);
				}
				catch(e) {
					if ('focus' in target)
						target.focus();
				}
				if (!foundLink) {
					var selCon = this.getSelectionController(foundEditable);
					var selection = selCon.getSelection(selCon.SELECTION_NORMAL);
					if (selection && selection.rangeCount)
						selection.collapseToStart();
				}
				return true;
			}
			Components.lookupMethod(aFrame, 'focus').call(aFrame);
			return true;
		}
		return false;
	},
 
	getFoundRange : function(aFrame) 
	{
		var sel = aFrame.getSelection();
		if ((!sel || !sel.rangeCount) && aFrame.document.foundEditable) {
			var selCon = this.getSelectionController(aFrame.document.foundEditable);
			sel = selCon.getSelection(selCon.SELECTION_ATTENTION);
			if (!sel.rangeCount) sel = selCon.getSelection(selCon.SELECTION_NORMAL);
		}
		if (sel && sel.rangeCount)
			return sel.getRangeAt(0);

		return null;
	},
  
/* nsIPrefListener(?) */ 
	
	domain  : 'xulmigemo', 
 
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				switch (aData)
				{
					case 'xulmigemo.startfromviewport':
						this.startFromViewport = Prefs.getBoolPref('xulmigemo.startfromviewport');
						return;
				}
				return;

			default:
				switch (aData)
				{
					case 'quit-application':
						this.destroy();
						return;
				}
				return;
		}
	},

  
	init : function() 
	{
		if (this.initialized) return;

		this.initialized = true;

		try {
			var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.addObserver(this.domain, this, false);
		}
		catch(e) {
		}

		this.observe(null, 'nsPref:changed', 'xulmigemo.startfromviewport');

		var service = this;
		this.window.addEventListener('unload', function() {
			service.window.removeEventListener('unload', arguments.callee, false);
			service.destroy();
		}, false);

		// Initialize
		this.core;
	},
 
	destroy : function() 
	{
		try {
			var pbi = Prefs.QueryInterface(Components.interfaces.nsIPrefBranchInternal);
			pbi.removeObserver(this.domain, this, false);
		}
		catch(e) {
		}
	},
 
	QueryInterface : function(aIID) 
	{
		if(!aIID.equals(pIXMigemoFind) &&
			!aIID.equals(Components.interfaces.nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	}
};
  
/* DocShell Traversal */ 
function DocShellIterator(aFrame, aFromBack)
{
	this.mInitialDocShell = this.getDocShellFromFrame(aFrame);
	this.mCurrentDocShell = this.mInitialDocShell;
	this.mFromBack = aFromBack;
	if (this.mFromBack)
		this.mCurrentDocShell = this.getLastChildDocShell(this.mCurrentDocShell);
}

DocShellIterator.prototype = {
	nsIDocShell           : Components.interfaces.nsIDocShell,
	nsIDocShellTreeNode   : Components.interfaces.nsIDocShellTreeNode,
	nsIDocShellTreeItem   : Components.interfaces.nsIDocShellTreeItem,
	nsIWebNavigation      : Components.interfaces.nsIWebNavigation,
	nsIInterfaceRequestor : Components.interfaces.nsIInterfaceRequestor,

	mCurrentDocShell : null,
	mInitialDocShell : null,
	mFromBack : false,

	wrapped : false,
	 
	get current() 
	{
		return this.mCurrentDocShell;
	},
	get root()
	{
		return this.getDocShellFromFrame(this.view.top);
	},
	get document()
	{
		return this.mCurrentDocShell
			.QueryInterface(this.nsIDocShell)
			.QueryInterface(this.nsIWebNavigation)
			.document;
	},
	get view()
	{
		return this.mCurrentDocShell
			.QueryInterface(this.nsIDocShell)
			.QueryInterface(this.nsIWebNavigation)
			.QueryInterface(this.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindow);
	},
	
	getDocShellFromFrame : function(aFrame) 
	{
		return aFrame
			.QueryInterface(this.nsIInterfaceRequestor)
			.getInterface(this.nsIWebNavigation)
			.QueryInterface(this.nsIDocShell);
	},
  
	get isInitital() 
	{
		return this.mCurrentDocShell == this.mInitialDocShell;
	},
	get initialDocument()
	{
		return this.mInitialDocShell
			.QueryInterface(this.nsIDocShell)
			.QueryInterface(this.nsIWebNavigation)
			.document;
	},
 
	iterateNext : function() 
	{
		this.wrapped = false;
		if (this.mFromBack) {
			nextItem = this.getPrevDocShell(this.mCurrentDocShell);
			if (!nextItem) {
				nextItem = this.getLastChildDocShell(this.root.QueryInterface(this.nsIDocShellTreeNode));
				this.wrapped = true;
			}
		}
		else {
			nextItem = this.getNextDocShell(this.mCurrentDocShell);
			if (!nextItem) {
				nextItem = this.root;
				this.wrapped = true;
			}
		}
		this.mCurrentDocShell = nextItem;
		return nextItem;
	},
	
	getNextDocShell : function(aNode) 
	{
		// 子がある場合、最初の子を返す
		if (aNode.childCount) return aNode.getChildAt(0);
		var curNode = aNode;
		var curItem;
		var parentNode;
		var parentItem;
		var childOffset;
		while (curNode)
		{
			// このノードが最上位である場合、検索終了
			curItem = curNode.QueryInterface(this.nsIDocShellTreeItem);
			var parentItem = curItem.sameTypeParent;
			if (!parentItem) return null;

			// nextSIblingに相当するノードを取得して返す
			childOffset = curItem.childOffset;
			parentNode = parentItem.QueryInterface(this.nsIDocShellTreeNode);
			if (childOffset < parentNode.childCount-1)
				return parentNode.getChildAt(childOffset+1);

			// nextSiblingに相当するノードが無いので、
			// ひとつ上位のノードにフォーカスを移して再検索
			curNode = parentItem;
		}
	},
 
	getPrevDocShell : function(aNode) 
	{
		var curNode = aNode;
		var curItem = curNode.QueryInterface(this.nsIDocShellTreeItem);
		// このノードが最上位（一番最初）である場合、検索終了
		var parentNode;
		var parentItem = curItem.sameTypeParent;
		if (!parentItem) return null;

		// previousSiblingに相当するノードが無い場合、
		// parentNodeに相当するノードを返す
		var childOffset = curItem.childOffset;
		if (!childOffset) return parentItem;

		// previousSiblingに相当するノードが子を持っている場合、
		// 最後の子を返す。
		// 子が無ければ、previousSiblingに相当するノードそれ自体を返す。
		parentNode = parentItem.QueryInterface(this.nsIDocShellTreeNode);
		curItem = parentNode.getChildAt(childOffset-1);
		return this.getLastChildDocShell(curItem);
	},
 
	getLastChildDocShell : function(aItem) 
	{
		var curItem = aItem.QueryInterface(this.nsIDocShellTreeItem);
		var curNode;
		var childCount;
		while (true)
		{
			curNode = curItem.QueryInterface(this.nsIDocShellTreeNode);
			childCount = curNode.childCount;
			if (!childCount) return curItem;
			curItem = curNode.getChildAt(childCount-1);
		}
	},
  
	get isFindable() 
	{
		var doc = this.document;
		switch (doc.documentElement.namespaceURI)
		{
			case 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul':
			case 'http://www.w3.org/2000/svg':
				return false;

			default:
				return true;
		}
	},
 
	isRangeTopLevel : function(aRange) 
	{
		var doc = this.initialDocument;
		return this.mFromBack ?
			(
				aRange.startContainer == doc.body ||
				aRange.startContainer == doc.documentElement
			) :
			(
				aRange.endContainer == doc.body ||
				aRange.endContainer == doc.documentElement
			) ;
	},
 
	destroy : function() 
	{
		delete this.mCurrentDocShell;
		delete this.mInitialDocShell;
		delete this.mFromBack;
		delete this.wrapped;
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
			CID        : pXMigemoFind.prototype.classID,
			contractID : pXMigemoFind.prototype.contractID,
			className  : pXMigemoFind.prototype.classDescription,
			factory    : {
				createInstance : function (aOuter, aIID)
				{
					if (aOuter != null)
						throw Components.results.NS_ERROR_NO_AGGREGATION;
					return (new pXMigemoFind()).QueryInterface(aIID);
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
 
