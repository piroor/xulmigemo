/* This depends on: 
	pIXMigemo
	pIXMigemoTextUtils
*/
var DEBUG = false;
 
var Prefs = Components 
			.classes['@mozilla.org/preferences;1']
			.getService(Components.interfaces.nsIPrefBranch);
 
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

  
	manualLinksOnly : false, 
	isQuickFind     : false,

	startFromViewport : false,
 
	FOUND             : 0, 
	NOTFOUND          : 1,
	WRAPPED           : 2,
	NOTLINK           : 4,
	FOUND_IN_EDITABLE : 8,
 
	FIND_DEFAULT    : 16, 
	FIND_BACK       : 32,
	FIND_FORWARD    : 64,
	FIND_WRAP       : 128,

	FIND_IN_EDITABLE : 256,
 
	findMode : 2, 

	FIND_MODE_NATIVE : 0,
	FIND_MODE_MIGEMO : 1,
	FIND_MODE_REGEXP : 2,
 
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
		var findFlag;
		if (this.previousKeyword == roman) {
			findFlag = aBackward ? this.FIND_BACK : this.FIND_FORWARD ;
		}
		else {
			findFlag = this.FIND_DEFAULT;
		}
		var win = this.document.commandDispatcher.focusedWindow;
		if (win.top == this.window.top) win = this.target.contentWindow;

		var iterator = new DocShellIterator(win, findFlag & this.FIND_BACK ? true : false );
		this.findInDocument(findFlag, iterator, myExp, aForceFocus);
		iterator.destroy();
		this.previousKeyword = roman;
	},
	 
	findInDocument : function(aFindFlag, aDocShellIterator, aRegExpSource, aForceFocus) 
	{
mydump("findInDocument ==========================================");
		var info = {
				range      : null,

				findTerm   : aRegExpSource,
				findFlag   : aFindFlag,
				foundFlag  : -1,

				docShell   : aDocShellIterator,

				findNext   : true,
				forceFocus : aForceFocus
			};

		if (this.findMode != this.FIND_MODE_NATIVE) {
			if (info.findFlag & this.FIND_BACK) {
				info.findTerm = new RegExp(info.findTerm, 'gim');
			}
			else {
				info.findTerm = new RegExp(info.findTerm, 'im');
			}
		}

		var isEditable     = false;
		var isPrevEditable = false;
		var editableInOut  = false;

		var doc;

		while (true)
		{
mydump("<<<<<<<<<<doFind roop>>>>>>>>>>");
			doc = info.docShell.document;

			if (!info.docShell.isFindable) {
				info.findNext = true;
				info.foundFlag = this.NOTFOUND;
			}
			else {
				info.range = this.getFindRange(info.findFlag, info.docShell);

				isPrevEditable = isEditable;
				isEditable = this.findEditableFromRange(info.range.sRange) ? true : false ;
				editableInOut = isEditable != isPrevEditable;

				this.findInDocumentInternal(info);
			}

			if (!info.findNext) {
				this.dispatchProgressEvent(info.foundFlag, info.findFlag);
				this.setSelectionLook(doc, true);
				break;
			}

			if (info.docShell.isFindable) {
				this.clearSelection(doc);
				this.setSelectionLook(doc, false);
			}

			info.docShell.iterateNext();

			if (info.docShell.wrapped) {
				if (!(info.findFlag & this.FIND_WRAP)) {
					this.document.commandDispatcher.focusedWindow = info.docShell.view;
					if (
						!editableInOut ||
						info.docShell.isRangeTopLevel(info.range.sRange)
						)
						info.findFlag |= this.FIND_WRAP;
					continue;
				}
				this.dispatchProgressEvent(info.foundFlag, info.findFlag);
				break;
			}

			if (info.docShell.isInitial) {
				this.dispatchProgressEvent(info.foundFlag, info.findFlag);
				break;
			}
		}
	},
	 
	findInDocumentInternal : function(aInfo) 
	{
		var isLinksOnly = Prefs.getBoolPref('xulmigemo.linksonly');
		var result;
		var rangeText = this.textUtils.range2Text(aInfo.range.sRange);
		var doc = aInfo.docShell.document;

		while (true)
		{
mydump("<<<<<<getFindRange roop>>>>>>");
			if (this.isQuickFind && isLinksOnly) {
				var links = doc.getElementsByTagName('a');
				if (!links.length) {
					aInfo.findNext = true;
					return;
				}
			}

			result = this.findInText(aInfo.findTerm, rangeText, aInfo.findFlag);

			aInfo.foundFlag = result.foundTerm ?
				this.findInRange(aInfo.findFlag, result.foundTerm, aInfo.range, aInfo.forceFocus) :
				this.NOTFOUND ;

			switch (aInfo.foundFlag)
			{
				case this.FOUND:
				case this.FOUND_IN_EDITABLE:
					aInfo.findNext = false;
					if (aInfo.findFlag & this.FIND_WRAP)
						aInfo.foundFlag = this.WRAPPED;
					return;

				default:
				case this.NOTFOUND:
					aInfo.findNext = true;
					return;

				case this.NOTLINK:
					rangeText = result.rest;
					aInfo.range = this.resetFindRange(aInfo.range, this.foundRange, aInfo.findFlag, doc);
					continue;
			}
		}
	},
 	
	findInText : function(aTerm, aText, aFindFlag) 
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
 
	dispatchProgressEvent : function(aFound, aFlag) 
	{
		var event = this.document.createEvent('Events');
		event.initEvent('XMigemoFindProgress', true, true);
		event.resultFlag = aFound;
		event.findFlag   = aFlag;
		this.document.dispatchEvent(event);
	},
  
	findInRange : function(aFindFlag, aTerm, aRanges, aForceFocus) 
	{
mydump("findInRange");

		this.mFind.findBackwards = Boolean(aFindFlag & this.FIND_BACK);

		this.foundRange = this.mFind.Find(aTerm, aRanges.sRange, aRanges.start, aRanges.end) || null ;
		if (!this.foundRange) {
			return this.NOTFOUND;
		}

		//※mozilla.party.jp 5.0でMac OS Xで動いてるのを見たが、
		//どうも選択範囲の色が薄いらしい…
		var v = this.foundRange.commonAncestorContainer.parentNode.ownerDocument.defaultView;
		if (aForceFocus)
			Components.lookupMethod(v, 'focus').call(v);

		if (this.findEditable())
			return this.FOUND_IN_EDITABLE;

		var doc = aRanges.sRange.startContainer.ownerDocument;
		var link = this.findLink(aForceFocus);
		if (
			this.manualLinksOnly ||
			(this.isQuickFind && Prefs.getBoolPref('xulmigemo.linksonly'))
			) {
			if (link) {
				this.lastFoundWord = this.foundRange.toString();
				this.setSelectionAndScroll(this.foundRange, doc);
				return this.FOUND;
			}
			else {
				return this.NOTLINK;
			}
		}
		else {
			this.lastFoundWord = this.foundRange.toString();
			this.setSelectionAndScroll(this.foundRange, doc);
			return this.FOUND;
		}
		this.lastFoundWord = '';
		return this.NOTFOUND;
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
	
	resetFindRange : function(aFindRange, aRange, aFindFlag, aDocument) 
	{
mydump("resetFindRange");
		var win = this.document.commandDispatcher.focusedWindow;
		var theDoc = (win && win != this.window) ? Components.lookupMethod(win, 'document').call(win) : aDocument ;
		var bodyNode;
		try {
			bodyNode = Components.lookupMethod(theDoc, 'body').call(theDoc);
		}
		catch(e) {
			bodyNode = theDoc.documentElement;
		}

		var findRange = aFindRange;
		findRange.sRange.selectNodeContents(bodyNode);
		findRange.start.selectNodeContents(bodyNode);

		var docShell = DocShellIterator.prototype.getDocShellFromFrame(Components.lookupMethod(theDoc, 'defaultView').call(theDoc));
	//	var childCount = bodyNode.childNodes.length;
		var range;
		var node;
		var offset;
		if (aFindFlag & this.FIND_DEFAULT || aFindFlag & this.FIND_FORWARD) {
			range = aRange;
			node = range.endContainer;
			offset = range.endOffset;
			findRange.sRange.setStart(node, offset);
			findRange.start.setStart(node, offset);
			findRange.start.setEnd(node, offset);
		}
		else if (aFindFlag & this.FIND_BACK) {
			range = aRange;
			node = range.startContainer;
			offset = range.startOffset;
			findRange.sRange.setEnd(node, offset);
			findRange.start.setStart(node, offset);
			findRange.start.setEnd(node, offset);
		}
		return findRange;
	},
 
	getFindRange : function(aFindFlag, aDocShellIterator) 
	{
mydump("getFindRange");
		var doc       = aDocShellIterator.document;
		var docShell  = aDocShellIterator.current;
		var selCon    = this.getSelectionController(aDocShellIterator.view);

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
				return this.getFindRangeIn(aFindFlag, doc, node, selCon);
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

		return this.getFindRangeIn(aFindFlag, doc, doc.body || doc.documentElement, docSelCon);
	},
	
	getFindRangeIn : function(aFindFlag, aDocument, aRangeParent, aSelCon) 
	{
mydump("getFindRange");
		var findRange = aDocument.createRange();
		findRange.selectNodeContents(aRangeParent);
		var startPt = aDocument.createRange();
		startPt.selectNodeContents(aRangeParent);
		var endPt = aDocument.createRange();
		endPt.selectNodeContents(aRangeParent);

		var selection = aSelCon.getSelection(aSelCon.SELECTION_NORMAL);
		var count = selection.rangeCount;
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
				if (aFindFlag & this.FIND_BACK){
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
				//findVisibleNodeが一番の改造しどころだが、どうしたものか。
				//案はあっても実際のコードが書けない。
				if (aFindFlag & this.FIND_BACK){
					node = this.viewportStartPoint || this.findVisibleNode(aDocument.defaultView, aFindFlag);
					this.viewportStartPoint = node;
					findRange.setStart(node, node.childNodes.length);
					startPt.setStart(node, node.childNodes.length);
					startPt.setEnd(node, node.childNodes.length);
					endPt.collapse(true);
				}
				else {
					node = this.viewportEndPoint || this.findVisibleNode(aDocument.defaultView, aFindFlag);
					this.viewportEndPoint = node;
					findRange.setStart(node, 0);
					startPt.setStart(node, 0);
					startPt.setEnd(node, 0);
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
			sRange : findRange,
			start  : startPt,
			end    : endPt,
			owner  : aRangeParent
		};

		return ret;
	},
 
	foundRange : null, 
 
	viewportStartPoint : null, 
	viewportEndPoint   : null,
  
	findVisibleNode : function(aFrame, aFindFlag) 
	{
//		dump("findVisibleNode\n");
		var doc = aFrame.document;

		var frameHeight = aFrame.innerHeight;
		var startY      = aFrame.pageYOffset;
		var endY        = startY+frameHeight;
		var minPixels   = 12;

		var isAbove = function(aNode) {
				return (
					aNode.offsetTop < startY &&
					aNode.offsetTop + Math.min(frameHeight, aNode.offsetHeight) < startY + minPixels
				);
			};
		var isBelow = function(aNode) {
				return (
					aNode.offsetTop + Math.min(frameHeight, aNode.offsetHeight) > endY &&
					aNode.offsetTop > endY - minPixels
				);
			};

		var isVisible = function(aNode) {
			return (
				aNode.nodeType != aNode.ELEMENT_NODE ||
				aNode.offsetWidth == 0 || aNode.offsetHeight == 0 ||
				((aFindFlag & this.FIND_BACK) ? isBelow(aNode) : isAbove(aNode))
				) ? false : true ;
		};

		var nodes = doc.getElementsByTagName('*');
		var visibleNode;
		var visibleMinNode;
		if (aFindFlag & this.FIND_BACK){
			for (var i = nodes.length-1, mini = -1; i > mini; i--)
			{
				var node = nodes[i];
				if (isVisible(node)) {
					visibleNode = node;
					if (node.offsetHeight < frameHeight) {
						visibleMinNode = node;
						break;
					}
				}
				else if (visibleNode){
					break;
				}
			}
//			dump('PREV '+node+'\n');
		}
		else{
			for (var i = 0, maxi = nodes.length; i < maxi; i++)
			{
				var node = nodes[i];
				if (isVisible(node)) {
					visibleNode = node;
					if (node.offsetHeight < frameHeight) {
						visibleMinNode = node;
						break;
					}
				}
				else if (visibleNode){
					break;
				}
			}
//			dump('NEXT '+node+'\n');
		}

/*
		if (node) {
			node.style.outline = 'red solid 2px';
			node.ownerDocument.defaultView.setTimeout(function() {
				node.style.outline = 'none';
			}, 10000);
		}
*/

		return node || doc.documentElement;
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
		if (aDocument.foundEditable)
			aDocument.foundEditable
				.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
				.editor.selection.removeAllRanges();

		aDocument.defaultView.getSelection().removeAllRanges();
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
					if (selection && selection.rangeCount) {
						try {
							selection.collapseToStart();
						}
						catch(e) {
						}
					}
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
		if (!sel.rangeCount && aFrame.document.foundEditable) {
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
		if(!aIID.equals(Components.interfaces.pIXMigemoFind) &&
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
 
