/* 
	This depends on:
		service.js
		core.js
*/
 
var XMigemoFind = { 
	 
	lastKeyword     : '', 
	previousKeyword : '',
	lastFoundWord   : '',
 
	manualLinksOnly : false, 
	isQuickFind     : false,

	startFromViewport : false,
 
	FOUND             : 1, 
	NOTFOUND          : 2,
	NOTLINK           : 4,
	FOUND_IN_EDITABLE : 8,
 
	FIND_DEFAULT    : 1, 
	FIND_BACK       : 2,
	FIND_FORWARD    : 4,
	FIND_FROM_START : 8,

	FIND_IN_EDITABLE : 128,
 
/* Find */ 
	 
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Components.classes['@mozilla.org/embedcomp/rangefind;1'].createInstance(Components.interfaces.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	target : null,
 
	findNext : function(aForceFocus) 
	{
		this.find(false, this.lastKeyword || this.previousKeyword, aForceFocus);
	},
 
	findPrevious : function(aForceFocus) 
	{
		this.find(true, this.lastKeyword || this.previousKeyword, aForceFocus);
	},
 
	find : function(aBackward, aKeyword, aForceFocus) 
	{
		if (!this.target) {
			throw 'XUL/Migemo::there is no target window.';
		}

//		dump("find"+'\n');
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
					(findFlag & this.FIND_BACK) ? this.getLastChildDocument(this.target.contentDocument) :
					this.target.contentDocument;
		this.findInDocument(findFlag, doc, (new RegExp(myExp.replace(/\n/im, ''), 'im')), aForceFocus);
		this.previousKeyword = roman;
	},
	 
	findInDocument : function(aFindFlag, aDocument, aRegexp, aForceFocus) 
	{
//		dump("findInDocument"+'\n');
		var findRange;
		var result;
		var lastMatch;
		var findRegExp;
		var reversedRegExp;
		var found;
		var docShell;
		var doc = aDocument;
		var selection;
		var repeat = false;
		var rightContext;
		var noRepeatL;
		var statusRes;
		var isLinksOnly = XMigemoService.getPref('xulmigemo.linksonly');

		doFind:
		while (true)
		{
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
//					dump("call findInRange"+'\n');
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
						break getFindRange;

					case this.NOTFOUND:
						noRepeatL = false;
						break getFindRange;

					case this.NOTLINK:
						target = rightContext;
						findRange = this.resetFindRange(findRange, this.foundRange, aFindFlag, doc);
						continue getFindRange;

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

			this.setSelectionLook(doc, true);

			if (noRepeatL) {
				break doFind;
			}

			this.clearSelection(doc);
			this.setSelectionLook(doc, false);


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
						doc = Components.lookupMethod(doc.defaultView.top, 'document').call(doc.defaultView.top);
						document.commandDispatcher.focusedWindow = doc.defaultView.top;
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
 
	findInRange : function(aFindFlag, aTerm, aRanges, aForceFocus) 
	{
//		dump("findInRange"+'\n');

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
			(this.isQuickFind && XMigemoService.getPref('xulmigemo.linksonly'))
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
//		dump("findParentLink"+'\n');
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
//		dump('findParentEditable'+'\n');
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
//		dump('getDocShellForFrame'+'\n');
		return aFrame
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIWebNavigation)
				.QueryInterface(Components.interfaces.nsIDocShell);
	},

 
	getNextDocShell : function(aNode) 
	{
//		dump("getNextDocShell"+'\n');
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
//		dump("getLastChildDocShell"+'\n');
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
//		dump("getLastChildDocument"+'\n');
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
//		dump("resetFindRange"+'\n');
		var win = document.commandDispatcher.focusedWindow;
		var theDoc = (win && win != window) ? Components.lookupMethod(win, 'document').call(win) : aDocument ;
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
 
/* 
	getFindRange : function(aFindFlag, aDocument)
	{
//		dump("getFindRange"+'\n');
		var win = document.commandDispatcher.focusedWindow;
		var bodyNode = aDocument.body;

		var findRange = aDocument.createRange();
		findRange.selectNodeContents(bodyNode);
		var startPt = aDocument.createRange();
		startPt.selectNodeContents(bodyNode);
		var endPt = aDocument.createRange();
		endPt.selectNodeContents(bodyNode);

		var docShell = this.getDocShellForFrame(aDocument.defaultView);
		var selCon, selection;

		if (aDocument.foundEditable) {
			selCon = aDocument.foundEditable
					.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
					.editor.selectionController;
		}
		else {
			selCon = docShell
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsISelectionDisplay)
				.QueryInterface(Components.interfaces.nsISelectionController);
		}
		selection = selCon.getSelection(selCon.SELECTION_NORMAL);
		var count = selection.rangeCount;
		dump("count:"+count+'\n');

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
			end    : endPt
		};

		return ret;
	},
*/
 
	getFindRange : function(aFindFlag, aDocument) 
	{
//		dump("getFindRange"+'\n');
		var win = document.commandDispatcher.focusedWindow;

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

		return this.getFindRangeIn(aFindFlag, aDocument, aDocument.body, docSelCon);
	},
	 
	getFindRangeIn : function(aFindFlag, aDocument, aRangeParent, aSelCon) 
	{
//		dump("getFindRange"+'\n');
		var win = document.commandDispatcher.focusedWindow;

		var findRange = aDocument.createRange();
		findRange.selectNodeContents(aRangeParent);
		var startPt = aDocument.createRange();
		startPt.selectNodeContents(aRangeParent);
		var endPt = aDocument.createRange();
		endPt.selectNodeContents(aRangeParent);

		var selection = aSelCon.getSelection(aSelCon.SELECTION_NORMAL);
		var count = selection.rangeCount;
		dump("count:"+count+'\n');

		var childCount = aRangeParent.childNodes.length;
		var range;
		var node;
		var offset;

		if (aFindFlag & this.FIND_DEFAULT || count == 0) {
			if (
				aFindFlag & this.FIND_FROM_START ||
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
//		dump("findVisibleNode"+'\n');
		var doc = aFrame.document;

		var offsetX = aFrame.pageXOffset;
		var offsetY = aFrame.pageYOffset;
		var frameWidth = aFrame.innerWidth;
		var frameHeight = aFrame.innerHeight;

		var startX = offsetX;
		var startY = offsetY;
		var endX   = startX+frameWidth;
		var endY   = startY+frameHeight;

		var minPixels = 12;

		this.visibleNodeFilter.isInvisible = (aFindFlag & this.FIND_BACK) ? this.isBelow : this.isAbove ;

		var walker = doc.createTreeWalker(doc, NodeFilter.SHOW_ELEMENT, this.visibleNodeFilter, false);
		walker.currentNode = doc.body || doc.documentElement;
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
		return node || doc.documentElement;
	},
	 
	visibleNodeFilter : { 
		acceptNode : function(aNode){
			return (
				aNode.offsetWidth == 0 || aNode.offsetHeight == 0 ||
				this.isInvisible(aNode)
				) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT ;
		},
		isInvisible : null
	},
	 
	isAbove : function(aNode) 
	{
//		dump("isAbove"+'\n');
		var height = aNode.offsetHeight > frameHeight ? frameHeight : aNode.offsetHeight ;
		return (aNode.offsetTop < startY && aNode.offsetTop+height < startY+minPixels);
	},
 
	isBelow : function(aNode) 
	{
//		dump("isBelow"+'\n');
		var height = aNode.offsetHeight > frameHeight ? frameHeight : aNode.offsetHeight ;
		return (aNode.offsetTop+height > endY && aNode.offsetTop > endY-minPixels);
	},
    
/* Update Appearance */ 
	 
	setSelectionLook : function(aDocument, aChangeColor) 
	{
//		dump("xmSetSelectionLook"+'\n');

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
//		dump("setSelectionAndScroll"+'\n');

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
		if (XMigemoService.getPref('xulmigemo.scrollSelectionToCenter'))
			XMigemoService.scrollSelectionToCenter(aFrame);
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
		this.lastKeyword        = '';
		this.viewportStartPoint = null;
		this.viewportEndPoint   = null;
		this.lastFoundWord      = '';

		var win = document.commandDispatcher.focusedWindow;
		var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.target.contentDocument;

		this.exitFind();

		doc.foundEditable = null;
	},
 
	exitFind : function() 
	{
		var win = document.commandDispatcher.focusedWindow;
		var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.target.contentDocument;

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
 
