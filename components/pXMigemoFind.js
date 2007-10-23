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

//		mydump("find");
		var roman = aKeyword;
		if (!roman) return;

		this.viewportStartPoint = null;
		this.viewportEndPoint   = null;

		var myExp = this.core.getRegExp(roman);

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
		var doc = (win != this.window) ? Components.lookupMethod(win, 'document').call(win) :
					(findFlag & this.FIND_BACK) ? this.getLastChildDocument(this.target.contentDocument) :
					this.target.contentDocument;
		this.findInDocument(findFlag, doc, myExp, aForceFocus);
		this.previousKeyword = roman;
	},
	 
	findInDocument : function(aFindFlag, aDocument, aRegExpSource, aForceFocus) 
	{
//		mydump("findInDocument");
		var findRange;
		var result;
		var lastMatch;
		var findRegExp = new RegExp();
		var findRegExpSource;
		var reversedRegExp;
		var found;
		var docShell;
		var doc = aDocument;
		var selection;
		var repeat = false;
		var rightContext;
		var noRepeatL;
		var statusRes;
		var isLinksOnly = Prefs.getBoolPref('xulmigemo.linksonly');

		const XMigemoTextUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);

		doFind:
		while (true)
		{
			if (!this.isFindableDocument(doc)) {
				noRepeatL = false;
				found     = this.NOTFOUND;
			}
			else {
				findRange = this.getFindRange(aFindFlag, doc);

				target = XMigemoTextUtils.range2Text(findRange.sRange);

				if(aFindFlag & this.FIND_BACK){
					target = target.split('').reverse().join('');
					findRegExpSource = reversedRegExp || (reversedRegExp = XMigemoTextUtils.reverseRegExp(aRegExpSource));
				}
				else{
					findRegExpSource = aRegExpSource;
				}
				try {
					findRegExp = findRegExp.compile(findRegExpSource, 'im');
				}
				catch(e) {
					dump(e+'\n'+'original : '+aRegExpSource+'\ncurrent : '+findRegExpSource+'\n');
					throw e;
				}

				getFindRange:
				while (true)
				{
					if (this.isQuickFind && isLinksOnly){
						var as = doc.getElementsByTagName('a');
						if (!as.length){
							noRepeatL = false;
							break;
						}
					}

					if (aFindFlag & this.FIND_BACK) {
						if (target.match(findRegExp)) {
							result = RegExp.lastMatch.split('').reverse().join('');
							rightContext = RegExp.rightContext;
						}
					}
					else{
						if (target.match(findRegExp)) {
							result = RegExp.lastMatch;
							rightContext = RegExp.rightContext;
						}
					}

					lastMatch = result || null;
					if (lastMatch) {
	//					mydump("call findInRange");
						found = this.findInRange(aFindFlag, lastMatch, findRange, aForceFocus);
						//alert("lastMatch:"+lastMatch);
					}
					else{
						found = this.NOTFOUND;
					}

					switch (found)
					{
						case this.FOUND:
						case this.FOUND_IN_EDITABLE:
							noRepeatL = true;
							if (aFindFlag & this.FIND_WRAP)
								found = this.WRAPPED;
							break getFindRange;

						default:
						case this.NOTFOUND:
							noRepeatL = false;
							break getFindRange;

						case this.NOTLINK:
							target = rightContext;
							findRange = this.resetFindRange(findRange, this.foundRange, aFindFlag, doc);
							continue getFindRange;
					}
				}
			}

			if (noRepeatL) {
				var event = this.document.createEvent('Events');
				event.initEvent('XMigemoFindProgress', true, true);
				event.resultFlag = found;
				event.findFlag   = aFindFlag;
				this.document.dispatchEvent(event);

				this.setSelectionLook(doc, true);

				break doFind;
			}

			if (this.isFindableDocument(doc)) {
				this.clearSelection(doc);
				this.setSelectionLook(doc, false);
			}


			docShell = this.getDocShellForFrame(doc.defaultView)
				.QueryInterface(Components.interfaces.nsIDocShellTreeNode);

			if (aFindFlag & this.FIND_BACK){ // back
				docShell = this.getPrevDocShell(docShell);
				if (!docShell){
					if (!repeat){
						repeat = true;
						docShell = this.getDocShellForFrame(doc.defaultView.top);
						docShell = this.getLastChildDocShell(docShell.QueryInterface(Components.interfaces.nsIDocShellTreeNode));
						doc = docShell
							.QueryInterface(Components.interfaces.nsIDocShell)
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.document;
						this.document.commandDispatcher.focusedWindow = docShell
							.QueryInterface(Components.interfaces.nsIDocShell)
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIDOMWindow);
						aFindFlag += this.FIND_WRAP;
						continue;
					}
					break;
				}
			}
			else { // forward
				docShell = this.getNextDocShell(docShell);
				if (!docShell){
					if (!repeat){
						repeat = true;
						doc = Components.lookupMethod(doc.defaultView.top, 'document').call(doc.defaultView.top);
						this.document.commandDispatcher.focusedWindow = doc.defaultView.top;
						aFindFlag += this.FIND_WRAP;
						continue;
					}
					break;
				}
			}
			doc = docShell
					.QueryInterface(Components.interfaces.nsIDocShell)
					.QueryInterface(Components.interfaces.nsIWebNavigation)
					.document;
			if (doc == aDocument) {
				break doFind;
			}
		}
	},
	isFindableDocument : function(aDocument)
	{
		switch (aDocument.documentElement.namespaceURI)
		{
			case 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul':
			case 'http://www.w3.org/2000/svg':
				return false;

			default:
				return true;
		}
	},
 
	findInRange : function(aFindFlag, aTerm, aRanges, aForceFocus) 
	{
//		mydump("findInRange");

		this.mFind.findBackwards = Boolean(aFindFlag & this.FIND_BACK);

		var foundRange = this.mFind.Find(aTerm, aRanges.sRange, aRanges.start, aRanges.end);
		if (!foundRange){
			this.foundRange = null;
			return this.NOTFOUND;
		}

		//※mozilla.party.jp 5.0でMac OS Xで動いてるのを見たが、
		//どうも選択範囲の色が薄いらしい…
		var v = foundRange.commonAncestorContainer.parentNode.ownerDocument.defaultView;
		if (aForceFocus || this.isQuickFind)
			Components.lookupMethod(v, 'focus').call(v);

		var doc = aRanges.sRange.startContainer.ownerDocument;

		doc.lastFoundEditable = doc.foundEditable;
		doc.foundEditable = this.findParentEditable(foundRange);
		if (doc.foundEditable) {
			this.foundRange = foundRange;
			this.lastFoundWord = foundRange.toString();
			this.setSelectionAndScroll(foundRange, doc);
			return this.FOUND_IN_EDITABLE;
		}

		var link = this.findParentLink(foundRange);
		if (link && (aForceFocus || this.isQuickFind)) {
			try{
				Components.lookupMethod(link, 'focus').call(link);
			}
			catch(e){
				link.focus();
			}
		}
		if (
			this.manualLinksOnly ||
			(this.isQuickFind && Prefs.getBoolPref('xulmigemo.linksonly'))
			) {
			if (link) {
				this.foundRange = foundRange;
				this.lastFoundWord = foundRange.toString();
				this.setSelectionAndScroll(foundRange, doc);
				return this.FOUND;
			}
			else {
				this.foundRange = foundRange;
				return this.NOTLINK;
			}
		}
		else {
			this.foundRange = foundRange;
			this.lastFoundWord = foundRange.toString();
			this.setSelectionAndScroll(foundRange, doc);
			return this.FOUND;
		}
		this.foundRange = null;
		this.lastFoundWord = '';
		return this.NOTFOUND;
	},
 
	findParentLink : function(aRange) 
	{
//		mydump("findParentLink");
		//後でXLinkを考慮したコードに直す

		var node = aRange.commonAncestorContainer.parentNode;
		while (node && node.parentNode)
		{
			if (String(node.localName).toLowerCase() == 'a') {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	},
 
	findParentEditable : function(aRange) 
	{
//		mydump('findParentEditable');
		var node = aRange.commonAncestorContainer.parentNode;
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
   
/* DocShell Traversal */ 
	
	getDocShellForFrame : function(aFrame) 
	{
//		mydump('getDocShellForFrame');
		return aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
	},
 
	getNextDocShell : function(aNode) 
	{
//		mydump("getNextDocShell");
	//	mydump("XXX Find NEXT, from\n"
	//			+aNode.QueryInterface(Components.interfaces.nsIWebNavigation).document.URL+'\n');
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
			curItem = curNode.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
			var parentItem = curItem.sameTypeParent;
			if (!parentItem) return null;

			// nextSIblingに相当するノードを取得して返す
			childOffset = curItem.childOffset;
			parentNode = parentItem.QueryInterface(Components.interfaces.nsIDocShellTreeNode);
			if (childOffset < parentNode.childCount-1)
				return parentNode.getChildAt(childOffset+1);

			// nextSiblingに相当するノードが無いので、
			// ひとつ上位のノードにフォーカスを移して再検索
			curNode = parentItem;
		}
	},

 
	getPrevDocShell : function(aNode) 
	{
	//	mydump("XXX Find PREVIOUS, from\n"
	//			+aNode.QueryInterface(Components.interfaces.nsIWebNavigation).document.URL+'\n');
		var curNode = aNode;
		var curItem = curNode.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
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
		parentNode = parentItem.QueryInterface(Components.interfaces.nsIDocShellTreeNode);
		curItem = parentNode.getChildAt(childOffset-1);
		return this.getLastChildDocShell(curItem);
	},
 
	getLastChildDocShell : function(aItem) 
	{
//		mydump("getLastChildDocShell");
		var curItem = aItem.QueryInterface(Components.interfaces.nsIDocShellTreeItem);
		var curNode;
		var childCount;
		while (true)
		{
			curNode = curItem.QueryInterface(Components.interfaces.nsIDocShellTreeNode);
			childCount = curNode.childCount;
			if (!childCount) return curItem;
			curItem = curNode.getChildAt(childCount-1);
		}
	},
 
	getLastChildDocument : function(aDocument) 
	{
//		mydump("getLastChildDocument");
		var docShell = this.getDocShellForFrame(Components.lookupMethod(aDocument, 'defaultView').call(aDocument));
		docShell = this.getLastChildDocShell(docShell);
		var doc = docShell
			.QueryInterface(Components.interfaces.nsIDocShell)
			.QueryInterface(Components.interfaces.nsIWebNavigation)
			.document;
		return doc;
	},
  
/* Range Manipulation */ 
	
	resetFindRange : function(aFindRange, aRange, aFindFlag, aDocument) 
	{
//		mydump("resetFindRange");
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

		var docShell = this.getDocShellForFrame(Components.lookupMethod(theDoc, 'defaultView').call(theDoc));
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
 
	getFindRange : function(aFindFlag, aDocument) 
	{
//		mydump("getFindRange");
		var docShell = this.getDocShellForFrame(aDocument.defaultView);
		var docSelCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);

		if (aDocument.foundEditable) {
			var selCon = aDocument.foundEditable
					.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
					.editor.selectionController;
			var selection = selCon.getSelection(selCon.SELECTION_NORMAL);
			var testRange1 = aDocument.createRange();

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
				while (node != aDocument.foundEditable &&
						node.parentNode != aDocument.foundEditable)
					node = node.parentNode;
				return this.getFindRangeIn(aFindFlag, aDocument, node, selCon);
			}

			selection.removeAllRanges();

			testRange1.selectNode(aDocument.foundEditable);
			if (aFindFlag & this.FIND_BACK) {
				testRange1.setEndBefore(aDocument.foundEditable);
			}
			else {
				testRange1.setStartAfter(aDocument.foundEditable);
			}
			selection = docSelCon.getSelection(docSelCon.SELECTION_NORMAL);
			selection.addRange(testRange1);
		}

		return this.getFindRangeIn(aFindFlag, aDocument, aDocument.body || aDocument.documentElement, docSelCon);
	},
	 
	getFindRangeIn : function(aFindFlag, aDocument, aRangeParent, aSelCon) 
	{
//		mydump("getFindRange");
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
			else{
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
	 
	setSelectionLook : function(aDocument, aChangeColor) 
	{
		var selCon;
		if (aDocument.foundEditable) {
			var editor = aDocument.foundEditable.QueryInterface(Components.interfaces.nsIDOMNSEditableElement).editor;
			selCon = editor.selectionController;

			if (aChangeColor) {
				selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
			}else{
				selCon.setDisplaySelection(selCon.SELECTION_ON);
			}
			try {
				selCon.repaintSelection(selCon.SELECTION_NORMAL);
			}
			catch(e) {
			}
		}

		var docShell = this.getDocShellForFrame(aDocument.defaultView);
		selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);

		if (aChangeColor) {
			selCon.setDisplaySelection(selCon.SELECTION_ATTENTION);
		}else{
			selCon.setDisplaySelection(selCon.SELECTION_ON);
		}
		try {
			selCon.repaintSelection(selCon.SELECTION_NORMAL);
		}
		catch(e) {
		}
	},
 
	setSelectionAndScroll : function(aRange, aDocument) 
	{
//		mydump("setSelectionAndScroll");

		var selection;

		// clear old range
		var oldSelCon;
		if (aDocument.lastFoundEditable) {
			var editor = aDocument.lastFoundEditable
						.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
						.editor;
			oldSelCon = editor.selectionController;
			selection = oldSelCon.getSelection(oldSelCon.SELECTION_NORMAL);
			selection.removeAllRanges();
		}
		var docShell = this.getDocShellForFrame(aDocument.defaultView);
		oldSelCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);
		selection = oldSelCon.getSelection(oldSelCon.SELECTION_NORMAL);
		selection.removeAllRanges();

		// set new range
		var newSelCon;
		var editable = this.findParentEditable(aRange);
		if (editable) {
			var editor = editable
						.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
						.editor;
			newSelCon = editor.selectionController;
		}
		else {
			newSelCon = docShell
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsISelectionDisplay)
				.QueryInterface(Components.interfaces.nsISelectionController);
		}
		selection = newSelCon.getSelection(newSelCon.SELECTION_NORMAL);
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
  
	clear : function() 
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

		this.exitFind();

		doc.foundEditable = null;
	},
 
	exitFind : function() 
	{
		if (!this.target)
			throw Components.results.NS_ERROR_NOT_INITIALIZED;

		var win = this.document.commandDispatcher.focusedWindow;
		var doc = (win != this.window) ? Components.lookupMethod(win, 'document').call(win) :
					this.target.contentDocument;

		var selection = doc.defaultView.getSelection();
		if (selection.rangeCount) {
			var range = selection.getRangeAt(0);
			var target = this.findParentLink(range) || this.findParentEditable(range);
			if (target) {
				try {
					Components.lookupMethod(target, 'focus').call(target);
				}
				catch(e) {
					if ('focus' in target)
						target.focus();
				}
			}
		}
		this.setSelectionLook(doc, false);
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
 
