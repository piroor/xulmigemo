/* 
	This depends on:
		service.js
		dic.js
		core.js
*/
 
var XMigemoFind = { 
	
	lastKeyword     : '', 
	previousKeyword : '',
 
	manualLinksOnly : false, 

	startFromViewport : false,
 
	FOUND    : 1, 
	NOTFOUND : 2,
	NOTLINK  : 4,
 
	FIND_DEFAULT    : 1, 
	FIND_BACK       : 2,
	FIND_FORWARD    : 4,
	FIND_FROM_START : 8,
 
/* Find */ 
	
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Components.classes['@mozilla.org/embedcomp/rangefind;1'].createInstance(Components.interfaces.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	get browser() 
	{
		if (!this._browser)
			this._browser = document.getElementById('content');
		return this._browser;
	},
	_browser : null,
 
	findNext : function(aSilently) 
	{
		this.find(false, this.lastKeyword || this.previousKeyword, aSilently);
	},
 
	findPrevious : function(aSilently) 
	{
		this.find(true, this.lastKeyword || this.previousKeyword, aSilently);
	},
 
	find : function(aBackward, aKeyword, aSilently) 
	{
//		mydump("find");
		var roman = aKeyword || this.lastKeyword;
		if (!roman) return false;

		var myExp = XMigemoCore.getRegExp(roman);

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
		var win = document.commandDispatcher.focusedWindow;
		var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) :
					(findFlag & this.FIND_BACK) ? this.getLastChildDocument(this.browser.contentDocument) :
					this.browser.contentDocument;
		this.findInDocument(findFlag, doc, (new RegExp(myExp.replace(/\n/im, ''), 'im')), aSilently);
		this.previousKeyword = roman;
	},
	
	findInDocument : function(aFindFlag, aDocument, aRegexp, aSilently) 
	{
//		mydump("findInDocument");
		var findRange;
		var result;
		var lastMatch;
		var findRegExp;
		var reversedRegExp;
		var found;
		var docShell;
		var doc = aDocument;
		var docWrapper;
		var selection;
		var repeat = false;
		var rightContext;
		var noRepeatL;
		var statusRes;
		var isLinksOnly = XMigemoService.getPref('xulmigemo.linksonly');

		doFind:
		while (true)
		{
			docWrapper = new XPCNativeWrapper(doc,
					'defaultView',
					'getElementsByTagName()'
				);
			findRange = this.getFindRange(aFindFlag, doc);

			target = XMigemoTextService.range2Text(findRange.sRange);

			if(aFindFlag & this.FIND_BACK){
				target = target.split('').reverse().join("");
				findRegExp = reversedRegExp || (reversedRegExp = XMigemoTextService.reverseRegExp(aRegexp));
			}
			else{
				findRegExp = aRegexp;
			}

			getFindRange:
			while (true)
			{
				if (isLinksOnly){
					var as = docWrapper.getElementsByTagName('a');
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
					found = this.findInRange(aFindFlag, lastMatch, findRange, aSilently);
					//alert("lastMatch:"+lastMatch);
				}
				else{
					found = this.NOTFOUND;
				}

				switch (found)
				{
					case this.FOUND:
						noRepeatL = true;
						break getFindRange;

					case this.NOTFOUND:
					case this.NOTLINK:
						noRepeatL = false;
						break getFindRange;

					default:
						if (found == (
								(
									Components.interfaces.nsITypeAheadFind &&
									'FIND_WRAPPED' in Components.interfaces.nsITypeAheadFind
								) ? Components.interfaces.nsITypeAheadFind.FIND_WRAPPED : FIND_WRAPPED
							)) { // Components.interfaces.nsITypeAheadFind.FIND_WRAPPED is for Firefox 1.5 or later
							target = rightContext;
							findRange = this.resetFindRange(findRange, this.foundRange, aFindFlag, doc);
						}
				}
			}

			var event = document.createEvent('Events');
			event.initEvent('XMigemoFindProgress', true, true);
			event.resultFlag = found;
			event.findFlag   = aFindFlag;
			document.dispatchEvent(event);


			this.setSelectionLook(doc, true, noRepeatL == true);
			if (noRepeatL) {
				break doFind;
			}

			var viewWrapper = new XPCNativeWrapper(docWrapper.defaultView,
					'top',
					'getSelection()'
				);
			viewWrapper.getSelection().removeAllRanges();
			this.setSelectionLook(doc, false, false);


			docShell = this.getDocShellForFrame(docWrapper.defaultView)
				.QueryInterface(Components.interfaces.nsIDocShellTreeNode);

			if (aFindFlag & this.FIND_BACK){ // back
				docShell = this.getPrevDocShell(docShell);
				if (!docShell){
					if (!repeat){
						repeat = true;
						docShell = this.getDocShellForFrame(viewWrapper.top);
						docShell = this.getLastChildDocShell(docShell.QueryInterface(Components.interfaces.nsIDocShellTreeNode));
						doc = docShell
							.QueryInterface(Components.interfaces.nsIDocShell)
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.document;
						document.commandDispatcher.focusedWindow = docShell
							.QueryInterface(Components.interfaces.nsIDocShell)
							.QueryInterface(Components.interfaces.nsIWebNavigation)
							.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
							.getInterface(Components.interfaces.nsIDOMWindow);
						aFindFlag += this.FIND_FROM_START;
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
						doc = Components.lookupMethod(viewWrapper.top, 'document').call(viewWrapper.top);
						document.commandDispatcher.focusedWindow = viewWrapper.top;
						aFindFlag += this.FIND_FROM_START;
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
 
	findInRange : function(aFindFlag, aTerm, aRanges, aSilently) 
	{
//		mydump("findInRange");

		this.mFind.findBackwards = Boolean(aFindFlag & this.FIND_BACK);

		var nodeWrapper = new XPCNativeWrapper(aRanges.sRange.startContainer, 'ownerDocument');
		var docWrapper = new XPCNativeWrapper(nodeWrapper.ownerDocument, 'defaultView');
		var docShell = this.getDocShellForFrame(docWrapper.defaultView);
		var selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);

		var foundRange = this.mFind.Find(aTerm, aRanges.sRange, aRanges.start, aRanges.end);

		if (!foundRange){
			this.foundRange = null;
			return this.NOTFOUND;
		}

		//※mozilla.party.jp 5.0でMac OS Xで動いてるのを見たが、
		//どうも選択範囲の色が薄いらしい…
		var foundNodeWrapper = new XPCNativeWrapper(foundRange.startContainer, 'ownerDocument');
		var foundDocWrapper = new XPCNativeWrapper(foundNodeWrapper.ownerDocument, 'defaultView');
		if (!aSilently)
			Components.lookupMethod(foundDocWrapper.defaultView, 'focus').call(foundDocWrapper.defaultView);

		var rv = this.isInsideLink(foundRange, aSilently); // リンクにfocusをセットする役割も持つ
		if (this.manualLinksOnly || XMigemoService.getPref('xulmigemo.linksonly')) {
			if (rv == true) {
				this.setSelectionAndScroll(foundRange, selCon, aSilently);
				this.foundRange = foundRange;
				return this.FOUND;
			}
			else {
				this.foundRange=foundRange;
				return this.NOTLINK;
			}
		}
		else{
			this.foundRange = foundRange;
			this.setSelectionAndScroll(foundRange, selCon, aSilently);
			return this.FOUND;
		}
		this.foundRange = null;
		return this.NOTFOUND;
	},
 
	isInsideLink : function(aRange, aSilently) 
	{
//		mydump("isInsideLink");
		//後でXLinkを考慮したコードに直す

		var node = aRange.commonAncestorContainer.parentNode;
		while (
			node &&
			(nodeWrapper = new XPCNativeWrapper(node,
				'parentNode',
				'localName'
			)) &&
			nodeWrapper.parentNode
			) {
			if (String(nodeWrapper.localName).toLowerCase() == 'a') {
				if (!aSilently) {
					try{
						Components.lookupMethod(node, 'focus').call(node);
					}
					catch(e){
						node.focus();
					}
				}
				return true;
			}
			node = nodeWrapper.parentNode;
		}
		return false;
	},
   
/* DocShell Traversal */ 
	
	getDocShellForFrame : function(aFrame) 
	{
//		mydump('getDocShellForFrame');
		var viewWrapper = new XPCNativeWrapper(aFrame, 'QueryInterface()');
		return viewWrapper
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
		var win = document.commandDispatcher.focusedWindow;
		var theDoc = (win && win != window) ? Components.lookupMethod(win, 'document').call(win) : doc ;
		var bodyNode = Components.lookupMethod(theDoc, 'body').call(theDoc);

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
		var win = document.commandDispatcher.focusedWindow;
		var docWrapper = new XPCNativeWrapper(aDocument,
				'body',
				'createRange()',
				'defaultView'
			);
		var bodyNode = docWrapper.body;

		var findRange = docWrapper.createRange();
		findRange.selectNodeContents(bodyNode);
		var startPt = docWrapper.createRange();
		startPt.selectNodeContents(bodyNode);
		var endPt = docWrapper.createRange();
		endPt.selectNodeContents(bodyNode);

		var docShell = this.getDocShellForFrame(docWrapper.defaultView);
		var selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);
		var selection = selCon.getSelection(selCon.SELECTION_NORMAL);
		var count = selection.rangeCount;
		mydump("count:"+count);
		var childCount = bodyNode.childNodes.length;
		var range;
		var node;
		var offset;
		if (aFindFlag & this.FIND_DEFAULT || count == 0) {
			if (aFindFlag & this.FIND_FROM_START ||
				!this.startFromViewport) {
				findRange.selectNodeContents(bodyNode);
				if (aFindFlag & this.FIND_BACK){
					startPt.setStart(bodyNode, childCount);
					startPt.setEnd(bodyNode, childCount);
					endPt.collapse(true);
				}
				else {
					startPt.setStart(bodyNode, 0);
					startPt.setEnd(bodyNode, 0);
					endPt.collapse(false);
				}
			}
			else{
				//findVisibleNodeが一番の改造しどころだが、どうしたものか。
				//案はあっても実際のコードが書けない。
				if (aFindFlag & this.FIND_BACK){
					node = this.viewportStartPoint || this.findVisibleNode(docWrapper.defaultView, aFindFlag);
					var nodeWrapper = new XPCNativeWrapper(node, 'childNodes');
					this.viewportStartPoint = node;
					findRange.setStart(node, nodeWrapper.childNodes.length);
					startPt.setStart(node, nodeWrapper.childNodes.length);
					startPt.setEnd(node, nodeWrapper.childNodes.length);
					endPt.collapse(true);
				}
				else {
					node = this.viewportEndPoint || this.findVisibleNode(docWrapper.defaultView, aFindFlag);
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
			end    : endPt
		};

		return ret;
	},
	
	foundRange : null, 
 
	viewportStartPoint : null, 
	viewportEndPoint   : null,
  
	findVisibleNode : function(aFrame, aFindFlag) 
	{
//		mydump("findVisibleNode");
		var viewWrapper = new XPCNativeWrapper(aFrame,
				'document',
				'pageXOffset',
				'pageYOffset',
				'innerWidth',
				'innerHeight'
			);
		var doc = viewWrapper.document;

		var offsetX = viewWrapper.pageXOffset;
		var offsetY = viewWrapper.pageYOffset;
		var frameWidth = viewWrapper.innerWidth;
		var frameHeight = viewWrapper.innerHeight;

		var startX = offsetX;
		var startY = offsetY;
		var endX   = startX+frameWidth;
		var endY   = startY+frameHeight;

		var minPixels = 12;

		this.visibleNodeFilter.isInvisible = (aFindFlag & this.FIND_BACK) ? this.isBelow : this.isAbove ;

		var docWrapper = new XPCNativeWrapper(doc,
				'createTreeWalker()',
				'body',
				'documentElement'
			);
		var walker = docWrapper.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, this.visibleNodeFilter, false);
		walker.currentNode = docWrapper.body || docWrapper.documentElement;
		var node;
		if (aFindFlag & this.FIND_BACK){
			while (walker.currentNode.lastChild) {
				walker.currentNode = walker.currentNode.lastChild;
			}
			node = walker.previousNode();
		}
		else{
			node = walker.nextNode();
		}
		return node || docWrapper.documentElement;
	},
	
	visibleNodeFilter : { 
		acceptNode : function(aNode){
			var wrapper = XMigemoFind.getNodeWrapper(aNode);
			return (
				wrapper.offsetWidth == 0 || wrapper.offsetHeight == 0 ||
				this.isInvisible(aNode)
				) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT ;
		},
		isInvisible : null
	},
	
	isAbove : function(aNode) 
	{
//		mydump("isAbove");
		var wrapper = XMigemoFind.getNodeWrapper(aNode);
		var height = wrapper.offsetHeight > frameHeight ? frameHeight : wrapper.offsetHeight ;
		return (wrapper.offsetTop < startY && wrapper.offsetTop+height < startY+minPixels);
	},
 
	isBelow : function(aNode) 
	{
//		mydump("isBelow");
		var wrapper = XMigemoFind.getNodeWrapper(aNode);
		var height = wrapper.offsetHeight > frameHeight ? frameHeight : wrapper.offsetHeight ;
		return (wrapper.offsetTop+height > endY && wrapper.offsetTop > endY-minPixels);
	},
  
	getNodeWrapper : function(aNode) 
	{
		return new XPCNativeWrapper(aNode,
				'offsetWidth',
				'offsetHeight',
				'offsetTop'
			);
	},
   
/* Update Appearance */ 
	
	setSelectionLook : function(aDocument, aChangeColor, aEnabled) 
	{
//		mydump("xmSetSelectionLook");
		var docShell = this.getDocShellForFrame(Components.lookupMethod(aDocument, 'defaultView').call(aDocument));
		var selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);

		if (aChangeColor){
			selCon.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ATTENTION);
		}else{
			selCon.setDisplaySelection(Components.interfaces.nsISelectionController.SELECTION_ON);
		}
		try {
			selCon.repaintSelection(Components.interfaces.nsISelectionController.SELECTION_NORMAL);
		}
		catch(e) {
		}
	},
 
	setSelectionAndScroll : function(aRange, aSelCon, aSilently) 
	{
//		mydump("setSelectionAndScroll");
		var selection = aSelCon.getSelection(aSelCon.SELECTION_NORMAL);
		selection.removeAllRanges();
		selection.addRange(aRange);
		aSelCon.scrollSelectionIntoView(
			aSelCon.SELECTION_NORMAL,
			aSelCon.SELECTION_FOCUS_REGION, true);
	},
  
	clear : function() 
	{
		this.lastKeyword        = '';
		this.viewportStartPoint = null;
		this.viewportEndPoint   = null;

		var win = document.commandDispatcher.focusedWindow;
		var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.browser.contentDocument;
		this.setSelectionLook(doc, false, false);
	},
 
/* nsIPrefListener(?) */ 
	
	domain  : 'xulmigemo', 
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		switch (aPrefName)
		{
			case 'xulmigemo.startfromviewport':
				this.startFromViewport = XMigemoService.getPref('xulmigemo.startfromviewport');
				return;

			default:
				return;
		}
	},

  
	init : function() 
	{
		XMigemoService.addPrefListener(this);
	},
 
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', function() { 
	XMigemoFind.init();
}, false);
window.addEventListener('unload', function() {
	XMigemoFind.destroy();
}, false);
 
