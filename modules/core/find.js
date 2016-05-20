var EXPORTED_SYMBOLS = ['MigemoFind'];

/* This depends on: 
	MigemoCoreFactory
	MigemoTextUtils
*/
var DEBUG = false;
function log(...aArgs) 
{
	if (DEBUG ||
		Services.prefs.getBoolPref('xulmigemo.debug.all') ||
		Services.prefs.getBoolPref('xulmigemo.debug.find'))
		Services.console.logStringMessage(aArgs.join(', '));
}

var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
 
Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/core.js');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');

var nsIDocShellTreeItem = Ci.nsIDocShellTreeNode || Ci.nsIDocShellTreeItem; // nsIDocShellTreeNode is merged to nsIDocShellTreeItem by https://bugzilla.mozilla.org/show_bug.cgi?id=331376

var boxObjectModule = {};
function getBoxObjectFor(aNode)
{
	if (!('boxObject' in boxObjectModule)) {
		Components.utils.import(
			'resource://xulmigemo-modules/lib/boxObject.js',
			boxObjectModule
		);
	}
	return boxObjectModule
			.boxObject
			.getBoxObjectFor(aNode);
}
 
function MigemoFind()
{
	this.foundRangeMap = new WeakMap();
	this.foundEditableMap = new WeakMap();
	this.lastFoundEditableMap = new WeakMap();
	this.smoothScrollTasks = new WeakMap();
	this.startFromViewport = this.prefs.getPref('xulmigemo.startfromviewport');
	this.core;
}

MigemoFind.prototype = inherit(MigemoConstants, {
	previousKeyword : '',

	isLinksOnly       : false,
	startFromViewport : false,
 
	lastResult : MigemoConstants.NOTFOUND,
	findMode   : MigemoConstants.FIND_MODE_NOT_INITIALIZED,

	targetDocShell : null,

	get targetDocument()
	{
		return (
			this.targetDocShell &&
			this.targetDocShell.QueryInterface(Ci.nsIWebNavigation).document
		);
	},

	get foundLink()
	{
		if (this.foundRange)
			return this.getParentLinkFromRange(this.foundRange);
		return null;
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
			var lang = this.prefs.getPref('xulmigemo.lang');
			this._core = MigemoCoreFactory.get(lang);
		}
		return this._core;
	},
	_core : null,
 
	get prefs() 
	{
		delete this.prefs;
		let { prefs } = Components.utils.import('resource://xulmigemo-modules/lib/prefs.js', {});
		return this.prefs = prefs;
	},
 
	get animationManager() 
	{
		delete this.animationManager;
		let { animationManager } = Components.utils.import('resource://xulmigemo-modules/lib/animationManager.js', {});
		return this.animationManager = animationManager;
	},
 
/* Find */ 
	
	get mFind() 
	{
		if (!this._mFind)
			this._mFind = Cc['@mozilla.org/embedcomp/rangefind;1']
					.createInstance(Ci.nsIFind);
		return this._mFind;
	},
	_mFind : null,
 
	get caseSensitive() 
	{
		return this._caseSensitive && this.findMode != this.FIND_MODE_MIGEMO;
	},
	set caseSensitive(aValue)
	{
		this._caseSensitive = aValue;
		return aValue;
	},
	_caseSensitive : false,
 
	find : function(aParams) 
	{
		aParams = aParams || {};
		var aBackward      = aParams.backward || false;
		var aKeyword       = aParams.keyword || '';
		var aScrollToFound = aParams.scroll || false;

		if (!this.targetDocShell)
			new Error('not initialized yet');

		if (aScrollToFound) {
			log('========================find============================');
			this.logPrefix = '[regular] ';
		}
		else {
			log('=====================silent find========================');
			this.logPrefix = '[silent] ';
		}
		if (!aKeyword) {
			this.lastResult = this.NOTFOUND;
			return this.lastResult;
		}

		var myExp;
		switch (this.findMode)
		{
			case this.FIND_MODE_MIGEMO:
				myExp = this.core.getRegExp(aKeyword);
				break;

			case this.FIND_MODE_REGEXP:
				if (MigemoTextUtils.isRegExp(aKeyword))
					this.caseSensitive = !/\/[^\/]*i[^\/]*$/.test(aKeyword);
				myExp = MigemoTextUtils.extractRegExpSource(aKeyword);
				break;

			default:
				myExp = aKeyword;
				break;
		}

		if (!myExp) {
			this.previousKeyword = aKeyword;
			return this.lastResult;
		}

		var findFlag = 0;
		if (this.previousKeyword != aKeyword) {
			findFlag |= this.FIND_DEFAULT;
			this.foundRange = null;
		}

		findFlag |= aBackward ? this.FIND_BACK : this.FIND_FORWARD ;

		if (this.isLinksOnly)
			findFlag |= this.FIND_IN_LINK;

		if (!aScrollToFound)
			findFlag |= this.FIND_SILENTLY;

		var startPoint;

		var foundRange = this.foundRange;
		if (aScrollToFound &&
			this.startFromViewport &&
			!foundRange) {
			log(this.logPrefix + 'from viewport');
			let firstVisibleNode = MigemoTextUtils.findFirstVisibleNode(this.targetDocument, aBackward);
			if (firstVisibleNode) {
				startPoint = this.targetDocument.createRange();
				if (aBackward)
					startPoint.setStartAfter(firstVisibleNode);
				else
					startPoint.setEndBefore(firstVisibleNode);
			}
		}
		if (!startPoint) {
			if (foundRange) {
				log(this.logPrefix + 'from last found');
				startPoint = foundRange.cloneRange();
				startPoint.collapse(aBackward);
			}
			else if (aScrollToFound) {
				let frame = this.getLastFindTargetFrame(this.targetDocument.defaultView);
				let selection = frame.getSelection();
				if (selection.rangeCount > 0) {
					startPoint = selection.getRangeAt(aBackward ? selection.rangeCount-1 : 0 );
					log(this.logPrefix + 'from last selection');
				}
				else {
					log(this.logPrefix + 'from document edge');
				}
			}
			else {
				log(this.logPrefix + 'from document edge (silent)');
			}
		}
		var iterator = new FindRangeIterator(this.targetDocShell, startPoint, aBackward);
		var result = this.findWithRangeIterator(findFlag, myExp, iterator);
		iterator.destroy();
		this.previousKeyword = aKeyword;
		this.lastResult = result.flag;
		return this.lastResult;
	},
	
	findWithRangeIterator : function(aFindFlag, aFindTerm, aRangeIterator) 
	{
		log(this.logPrefix+'findWithRangeIterator ==========================================');

		if (this.findMode != this.FIND_MODE_NATIVE) {
			let flags = 'm';
			if (!this.caseSensitive) flags += 'i';
			if (aFindFlag & this.FIND_BACK) flags += 'g';
			aFindTerm = new RegExp(aFindTerm, flags);
		}

		var lastDoc = null;
		while (true)
		{
			let rangeSet = aRangeIterator.iterateNext();
			log(this.logPrefix+'rangeSet '+rangeSet.range);

			let result = this.findWithRangeSet(aFindFlag, aFindTerm, rangeSet);

			if (!(aFindFlag & this.FIND_SILENTLY)) {
				if (lastDoc && lastDoc != rangeSet.doc) {
					this.clearSelection(lastDoc);
					this.clearSelectionLook(lastDoc);
				}
				lastDoc = rangeSet.doc;
			}
			if (aRangeIterator.wrapped) {
				result.flag |= this.WRAPPED;
				if (aFindFlag & this.FIND_SILENTLY)
					result.flag |= this.FINISH_FIND;
			}

			if (aRangeIterator.looped || result.flag & this.FINISH_FIND) {
				if (result.flag & this.FINISH_FIND)
					result.flag ^= this.FINISH_FIND;

				return result;
			}
		}
	},
	
	findWithRangeSet : function(aFindFlag, aFindTerm, aRangeSet) 
	{
		if (this.isLinksOnly) {
			let links = aRangeSet.doc.getElementsByTagName('a');
			if (links.length === 0) {
				return {
					range : null,
					flag  : this.NOTFOUND
				};
			}
		}

		var rangeText = MigemoTextUtils.range2Text(aRangeSet.range);
		while (true)
		{
			let textFindResult = this.findInText(aFindFlag, aFindTerm, rangeText);
			rangeText = textFindResult.restText;
			let rangeFindResult = this.findInRange(aFindFlag, textFindResult.foundTerm, aRangeSet);

			if (!(rangeFindResult.flag & this.FOUND))
				return {
					range : null,
					flag  : this.NOTFOUND
				};

			if (this.isLinksOnly && !(rangeFindResult.flag & this.FOUND_IN_LINK)) {
				if (aFindFlag & this.FIND_BACK) {
					aRangeSet.range.setEnd(
						rangeFindResult.range.startContainer,
						rangeFindResult.range.startOffset
					);
					aRangeSet.start = rangeFindResult.range.cloneRange();
					aRangeSet.start.collapse(true);
				}
				else {
					aRangeSet.range.setStart(
						rangeFindResult.range.endContainer,
						rangeFindResult.range.endOffset
					);
					aRangeSet.start = rangeFindResult.range.cloneRange();
					aRangeSet.start.collapse(false);
				}
				continue;
			}

			if (rangeFindResult.flag & this.FOUND_IN_EDITABLE) {
				this.foundEditableMap.set(aRangeSet.doc, rangeFindResult.foundEditable);
				this.lastFoundEditableMap.set(aRangeSet.doc, rangeFindResult.foundEditable);
			}
			else {
				this.foundEditableMap.delete(aRangeSet.doc);
			}

			if (!(aFindFlag & this.FIND_SILENTLY))
				this.setSelectionAndScroll(rangeFindResult.range);

			rangeFindResult.flag |= this.FINISH_FIND;

			this.foundRange = rangeFindResult.range;

			return rangeFindResult;
		}
	},
 
	findInText : function(aFindFlag, aTerm, aText) 
	{
		var result = {
				foundTerm : null,
				restText  : aText
			};
		if (this.findMode != this.FIND_MODE_NATIVE) {
			if (aText.match(aTerm)) {
				result.foundTerm = RegExp.lastMatch;
				result.restText = (aFindFlag & this.FIND_BACK) ? RegExp.leftContext : RegExp.rightContext ;
			}
		}
		else if (aFindFlag & this.FIND_BACK) {
			var index = aText.lastIndexOf(aTerm);
			if (index > -1) {
				result.foundTerm = aTerm;
				result.restText = aText.substring(0, index-1);
			}
		}
		else {
			var index = aText.indexOf(aTerm);
			if (index > -1) {
				result.foundTerm = aTerm;
				result.restText = aText.substring(index+1);
			}
		}
		return result;
	},
  
	findInRange : function(aFindFlag, aTerm, aRangeSet) 
	{
		var result = {
				flag          : this.NOTFOUND,
				range         : null,
				foundEditable : null,
				foundLink     : null
			};
		if (!aTerm) {
			return result;
		}
		log(this.logPrefix+'findInRange <'+aTerm+'> from <'+aRangeSet.range+'>');

		this.mFind.findBackwards = Boolean(aFindFlag & this.FIND_BACK);
		this.mFind.caseSensitive = true;

		result.range = this.mFind.Find(aTerm, aRangeSet.range, aRangeSet.start, aRangeSet.end) || null ;
		if (!result.range) {
			return result;
		}

		result.flag = this.FOUND;

		if (result.foundEditable = FindRangeIterator.prototype.getParentEditableFromRange(result.range))
			result.flag |= this.FOUND_IN_EDITABLE;

		if (aFindFlag & this.FIND_IN_LINK &&
			(result.foundLink = this.getParentLinkFromRange(result.range)))
			result.flag |= this.FOUND_IN_LINK;

		return result;
	},
   
	getParentLinkFromRange : function(aRange) 
	{
		//後でXLinkを考慮したコードに直す
		if (!aRange) return null;
		log(this.logPrefix+'getParentLinkFromRange <'+aRange+'>');
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

	get foundRange()
	{
		return this.foundRangeMap.get(this.targetDocument);
	},
	set foundRange(aValue)
	{
		if (aValue)
			this.foundRangeMap.set(this.targetDocument, aValue);
		else
			this.foundRangeMap.delete(this.targetDocument);
		return aValue;
	},
    
/* Update Appearance */ 
	
	getSelectionController : function(aTarget) 
	{
		if (!aTarget) return null;

		const nsIDOMNSEditableElement = Ci.nsIDOMNSEditableElement;
		const nsIDOMWindow = Ci.nsIDOMWindow;
		try {
			return (aTarget instanceof nsIDOMNSEditableElement) ?
						aTarget.QueryInterface(nsIDOMNSEditableElement)
							.editor
							.selectionController :
					(typeof aTarget.Window == 'function' && aTarget instanceof aTarget.Window) ?
						FindRangeIterator.prototype.getDocShellFromFrame(aTarget)
							.QueryInterface(Ci.nsIInterfaceRequestor)
							.getInterface(Ci.nsISelectionDisplay)
							.QueryInterface(Ci.nsISelectionController) :
					null;
		}
		catch(e) {
		}
		return null;
	},
 
	clearSelectionLook : function(aDocument) 
	{
		if (aDocument) aDocument.QueryInterface(Ci.nsIDOMDocument);
		var foundEditable = this.foundEditableMap.get(aDocument);
		if (foundEditable)
			this.clearSelectionLookInternal(foundEditable);
		this.clearSelectionLookInternal(aDocument);
	},
	clearSelectionLookInternal : function(aTarget) 
	{
		var selCon = this.getSelectionController(aTarget);
		if (!selCon)
			return;

		selCon.setDisplaySelection(selCon.SELECTION_ON);
		selCon.repaintSelection(selCon.SELECTION_NORMAL);
	},
 
	setSelectionAndScroll : function(aRange) 
	{
		log('setSelectionAndScroll <'+aRange+'>');
		if (!aRange)
			return;

		var doc = aRange.startContainer.ownerDocument || aRange.startContainer;

		// clear old range
		var foundEditable = this.foundEditableMap.get(doc);
		var lastFoundEditable = this.lastFoundEditableMap.get(doc);
		[
			(foundEditable || lastFoundEditable),
			doc.defaultView
		].forEach(function(aTarget) {
			var oldSelCon = this.getSelectionController(aTarget);
			if (!oldSelCon) return;
			var selection = oldSelCon.getSelection(oldSelCon.SELECTION_NORMAL);
			selection.removeAllRanges();
		}, this);

		// set new range
		var editableParent = FindRangeIterator.prototype.getParentEditableFromRange(aRange);
		var newSelCon = this.getSelectionController(editableParent) ||
				this.getSelectionController(doc.defaultView);
		var selection = newSelCon.getSelection(newSelCon.SELECTION_NORMAL);
		selection.addRange(aRange);

		newSelCon.setDisplaySelection(newSelCon.SELECTION_ATTENTION);
		newSelCon.repaintSelection(newSelCon.SELECTION_NORMAL);

		if (this.prefs.getPref('xulmigemo.scrollSelectionToCenter'))
			this.scrollSelectionToCenter(editableParent || doc.defaultView, null, false);
		else
			newSelCon.scrollSelectionIntoView(
				newSelCon.SELECTION_NORMAL,
				newSelCon.SELECTION_FOCUS_REGION,
				true);
	},
	
	scrollSelectionToCenter : function(aScrollTarget, aAnchor, aPreventAnimation) 
	{
		if (!aScrollTarget ||
			!this.prefs.getPref('xulmigemo.scrollSelectionToCenter'))
			return;

		var task = this.smoothScrollTasks.get(aScrollTarget);
		if (task) {
			this.animationManager.removeTask(task);
			this.smoothScrollTasks.delete(aScrollTarget);
		}

		var padding = Math.max(0, Math.min(100, this.prefs.getPref('xulmigemo.scrollSelectionToCenter.padding')));

		var startX;
		var startY;
		var viewW;
		var viewH;
		var targetX,
			targetY,
			targetW,
			targetH;
		var window = aScrollTarget;
		if (aScrollTarget instanceof Ci.nsIDOMNSEditableElement) {
			window = aScrollTarget.ownerDocument.defaultView;

			let selCon = this.getSelectionController(aScrollTarget);
			let selection = selCon.getSelection(selCon.SELECTION_NORMAL);
			if (!selection || !selection.rangeCount)
				return;

			let box = getBoxObjectFor(selection.getRangeAt(0));
			let ownerBox = getBoxObjectFor(aScrollTarget);
			if (!box || box.fixed || !ownerBox)
				return;

			startX = aScrollTarget.scrollLeft;
			startY = aScrollTarget.scrollTop;
			viewW = ownerBox.width;
			viewH = ownerBox.height;

			targetX = box.screenX - ownerBox.screenX + startX;
			targetY = box.screenY - ownerBox.screenY + startY;
			targetW = box.width;
			targetH = box.height;

			this.scrollSelectionToCenter(window, aScrollTarget, aPreventAnimation);

			if (this.isBoxInViewport(box, aScrollTarget, padding))
				return;
		}
		else {
			let frame = aScrollTarget;
			if (!frame && this.document) {
				frame = this.document.commandDispatcher.focusedWindow;
				if (!frame || frame.top == this.document.defaultView)
					frame = this.window._content;
				frame = this.getSelectionFrame(frame);
			}
			if (!frame)
				return;

			if (!aAnchor) {
				let selection = frame.getSelection();
				if (selection && selection.rangeCount > 0)
					aAnchor = selection.getRangeAt(0);
			}
			if (!aAnchor)
				return;

			let box = getBoxObjectFor(aAnchor);
			if (!box || box.fixed)
				return;

			startX = frame.scrollX;
			startY = frame.scrollY;
			viewW = frame.innerWidth;
			viewH = frame.innerHeight;

			targetX = box.x;
			targetY = box.y;
			targetW = box.width;
			targetH = box.height;

			if (this.isBoxInViewport(box, frame, padding))
				return;
		}

		var xUnit = viewW * (padding / 100);
		var finalX = (targetX - startX < xUnit) ?
						targetX - xUnit :
					(targetX + targetW - startX > viewW - xUnit) ?
						targetX + targetW - (viewW - xUnit) :
						startX ;

		var yUnit = viewH * (padding / 100);
		var finalY = (targetY - startY < yUnit ) ?
						targetY - yUnit  :
					(targetY + targetH - startY > viewH - yUnit ) ?
						targetY + targetH - (viewH - yUnit)  :
						startY ;

		if (aPreventAnimation ||
			!this.prefs.getPref('xulmigemo.scrollSelectionToCenter.smoothScroll.enabled')) {
			aScrollTarget.scrollTo(finalX, finalY);
			return;
		}

		var deltaX = finalX - startX;
		var deltaY = finalY - startY;
		var radian = 90 * Math.PI / 180;
		task = (function(aTime, aBeginning, aChange, aDuration) {
			var x, y, finished;
			if (aTime >= aDuration) {
				this.smoothScrollTasks.delete(aScrollTarget);
				x = finalX;
				y = finalY
				finished = true;
			}
			else {
				x = startX + (deltaX * Math.sin(aTime / aDuration * radian));
				y = startY + (deltaY * Math.sin(aTime / aDuration * radian));
				finished = false;
			}
			log('scrollSelectionToCenter <'+aScrollTarget+'> ('+x+', '+y+')');
			aScrollTarget.scrollTo(x, y);
			return finished;
		}).bind(this);
		this.smoothScrollTasks.set(aScrollTarget, task);
		this.animationManager.addTask(
			task,
			0, 0, this.prefs.getPref('xulmigemo.scrollSelectionToCenter.smoothScroll.duration'),
			window
		);
	},
 
	isBoxInViewport : function(aBox, aFrame, aPadding)
	{
		aPadding = aPadding || 0;
		var scrollX = aFrame.scrollX || aFrame.scrollLeft || 0;
		var scrollY = aFrame.scrollY || aFrame.scrollTop || 0;
		var viewPortWidth = aFrame.innerWidth || aFrame.offsetWidth || 0;
		var viewPortHeight = aFrame.innerHeight || aFrame.offsetHeight || 0;
		return !(
			aBox.x > scrollX + viewPortWidth - aPadding ||
			aBox.y > scrollY + viewPortHeight - aPadding ||
			aBox.x + aBox.width < scrollX + aPadding ||
			aBox.y + aBox.height < scrollY + aPadding
		);
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
		var foundEditable = this.foundEditableMap.get(aDocument);
		var lastFoundEditable = this.lastFoundEditableMap.get(aDocument);
		if (foundEditable || lastFoundEditable)
			(foundEditable || lastFoundEditable)
				.QueryInterface(Ci.nsIDOMNSEditableElement)
				.editor.selection.removeAllRanges();

		var sel = aDocument.defaultView.getSelection();
		if (sel) sel.removeAllRanges();
	},
 
	getFoundRange : function(aFrame) 
	{
		var range;
		var foundEditable = this.foundEditableMap.get(aFrame.document);
		if ([foundEditable, aFrame].some(function(aTarget) {
				var selCon = this.getSelectionController(aTarget);
				if (!selCon ||
					selCon.getDisplaySelection() != selCon.SELECTION_ATTENTION)
					return false;
				var sel = selCon.getSelection(selCon.SELECTION_NORMAL);
				if (sel && sel.rangeCount)
					range = sel.getRangeAt(0);
				return range;
			}, this))
			return range;

		return null;
	},
 
	getLastFindTargetFrame : function(aFrame) 
	{
		var foundEditable = this.foundEditableMap.get(aFrame.document);
		if ([foundEditable, aFrame].some(function(aTarget) {
				var selCon = this.getSelectionController(aTarget);
				if (!selCon ||
					selCon.getDisplaySelection() != selCon.SELECTION_ATTENTION)
					return false;
				var sel = selCon.getSelection(selCon.SELECTION_NORMAL);
				return (sel && sel.rangeCount);
			}, this))
			return aFrame;

		var frame;
		if (Array.slice(aFrame.frames).some(function(aFrame) {
				frame = this.getLastFindTargetFrame(aFrame);
				return frame;
			}, this))
			return frame;

		return null;
	} 
}); 
  
function FindRangeIterator(aRootDocShell, aStartPoint, aBackward)
{
	this.backward = aBackward;
	this.mRootDocShell = aRootDocShell;
	if (aStartPoint) {
		this.mStartPoint = aStartPoint.cloneRange();
	}
	else {
		let doc = this.getDocumentFromDocShell(aRootDocShell);
		this.mStartPoint = this.createAnchorInDocument(doc);
	}
	this.mAnchor = this.mStartPoint.cloneRange();
	this.wrappedCount = 0;
}

FindRangeIterator.prototype = {
	mRootDocShell : null,
	backward : false,

	wrapped : false,
	looped : false,
	
	get document()
	{
		return this.getOwnerDocumentFromRange(this.mAnchor);
	},
	get view()
	{
		return this.document.defaultView;
	},
	get docShell()
	{
		return this.getDocShellFromDocument(this.document);
	},
	get body() 
	{
		return this.getDocumentBody(this.document);
	},

	getDocumentFromDocShell : function(aDocShell)
	{
		return aDocShell
			.QueryInterface(Ci.nsIDocShell)
			.QueryInterface(Ci.nsIWebNavigation)
			.document;
	},
	
	getDocShellFromDocument : function(aDocument) 
	{
		return aDocument.defaultView
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIWebNavigation)
			.QueryInterface(Ci.nsIDocShell);
	},
	
	getDocShellFromFrame : function(aFrame) 
	{
		return this.getDocShellFromDocument(aFrame.document);
	},
	
	getDocumentBody : function(aDocument) 
	{
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
		return aDocument.documentElement;
	},

	getParentEditableFromRange : function(aRange) 
	{
		var node = aRange.commonAncestorContainer;
		while (node && node.parentNode)
		{
			var isEditable = false;
			try {
				node = node.QueryInterface(Ci.nsIDOMNSEditableElement);
				if (node.editor)
					return node;
			}
			catch(e) {
			}
			node = node.parentNode;
		}
		return null;
	},

	getWholeFindRangeFromRangeInEditable : function(aRange) 
	{
		var owner = this.getParentEditableFromRange(aRange);
		if (!owner)
			return null;

		var lastContainer = aRange.startContainer;
		while (lastContainer.parentNode != owner)
		{
			lastContainer = lastContainer.parentNode;
		}
		var range = lastContainer.ownerDocument.createRange();
		range.selectNodeContents(lastContainer);
		return range;
	},

	getOwnerDocumentFromRange : function(aRange)
	{
		return aRange.startContainer.ownerDocument || aRange.startContainer;
	},

	getOwnerFrameFromContentDocument : function(aDocument)
	{
		let parent = this.getDocShellFromDocument(aDocument)
						.QueryInterface(Ci.nsIDocShellTreeItem)
						.sameTypeParent;
		if (!parent)
			return null;

		var parentDoc = this.getDocumentFromDocShell(parent);
		var frame = null;
		while (frame = this.getNextFrame(parentDoc, frame))
		{
			if (frame.contentDocument == aDocument)
				return frame;
		}

		return null;
	},

	createAnchorInDocument : function(aDocument)
	{
		let point = aDocument.createRange();
		point.selectNodeContents(this.getDocumentBody(aDocument));
		point.collapse(!this.backward);
		return point;
	},
 
	iterateNext : function() 
	{
		if (this.looped)
			return {};

		this.wrapped = false;

		var doc = this.document;
		var editableRange = this.getWholeFindRangeFromRangeInEditable(this.mAnchor);

		if (this.backward) {
			if (this.mWillWrapBackward) {
				this.wrapped = true;
				this.wrappedCount++;
				this.mWillWrapBackward = false;
			}
			if (editableRange) {
				editableRange.setEnd(this.mAnchor.startContainer, this.mAnchor.startOffset);
				let editable = this.getParentEditableFromRange(this.mAnchor);
				this.mAnchor = doc.createRange();
				this.mAnchor.selectNode(editable);
				this.mAnchor.collapse(true);
				this.checkLoop();
				return this.createRangeSet(editableRange);
			}

			let anchor = doc.createComment('');
			this.mAnchor.insertNode(anchor);
			let previousFrame = this.getPreviousFrame(doc, anchor);
			anchor.parentNode.removeChild(anchor);
			if (previousFrame) {
				let range = this.mAnchor.cloneRange();
				range.setStartAfter(nextFrame);
				this.mAnchor = this.createAnchorInDocument(nextFrame.contentDocument);
				this.checkLoop();
				return this.createRangeSet(range);
			}

			let root = this.getDocumentBody(doc);
			let range = this.mAnchor.cloneRange();
			range.setStartBefore(root.firstChild || root);

			let ownerFrame = this.getOwnerFrameFromContentDocument(doc);
			if (ownerFrame) {
				this.mAnchor = ownerFrame.ownerDocument.createRange();
				this.mAnchor.selectNode(ownerFrame);
				this.mAnchor.collapse(true);
				this.checkLoop();
				return this.createRangeSet(range);
			}

			doc = this.getDocumentFromDocShell(this.mRootDocShell);
			this.mAnchor = this.createAnchorInDocument(doc);
			this.mWillWrapBackward = true;
			this.checkLoop();
			return this.createRangeSet(range);
		}
		else {
			if (this.mWillWrapForward) {
				this.wrapped = true;
				this.wrappedCount++;
				this.mWillWrapForward = false;
			}
			if (editableRange) {
				editableRange.setStart(this.mAnchor.endContainer, this.mAnchor.endOffset);
				let editable = this.getParentEditableFromRange(this.mAnchor);
				this.mAnchor = doc.createRange();
				this.mAnchor.selectNode(editable);
				this.mAnchor.collapse(false);
				this.checkLoop();
				return this.createRangeSet(editableRange);
			}

			let anchor = doc.createComment('');
			this.mAnchor.insertNode(anchor);
			let nextFrame = this.getNextFrame(doc, anchor);
			anchor.parentNode.removeChild(anchor);
			if (nextFrame) {
				let range = this.mAnchor.cloneRange();
				range.setEndBefore(nextFrame);
				this.mAnchor = this.createAnchorInDocument(nextFrame.contentDocument);
				this.checkLoop();
				return this.createRangeSet(range);
			}

			let root = this.getDocumentBody(doc);
			let range = this.mAnchor.cloneRange();
			range.setEndAfter(root.lastChild || root);

			let ownerFrame = this.getOwnerFrameFromContentDocument(doc);
			if (ownerFrame) {
				this.mAnchor = ownerFrame.ownerDocument.createRange();
				this.mAnchor.selectNode(ownerFrame);
				this.mAnchor.collapse(false);
				this.checkLoop();
				return this.createRangeSet(range);
			}

			doc = this.getDocumentFromDocShell(this.mRootDocShell);
			this.mAnchor = this.createAnchorInDocument(doc);
			this.mWillWrapForward = true;
			this.checkLoop();
			return this.createRangeSet(range);
		}
	},

	createRangeSet : function(aFindRange)
	{
		var rangeSet = {
			range : aFindRange,
			start : aFindRange.cloneRange(),
			end   : aFindRange.cloneRange()
		};
		rangeSet.start.collapse(!this.backward);
		rangeSet.end.collapse(this.backward);
		rangeSet.doc = this.getOwnerDocumentFromRange(aFindRange);
		return rangeSet;
	},

	FRAME_CONDITION : '[contains(" IFRAME iframe FRAME frame ", concat(" ", local-name(), " "))]',

	getNextFrame : function(aDocument, aContext) 
	{
		try {
			var xpathResult = aDocument.evaluate(
					'following::*' + this.FRAME_CONDITION + ' | descendant::*' + this.FRAME_CONDITION,
					aContext || this.getDocumentBody(aDocument),
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			var frame = xpathResult.singleNodeValue;
			if (!frame)
				return null;

			if (!this.isFindableDocument(frame.contentDocument))
				return this.getNextFrame(aDocument, frame);

			return frame;
		}
		catch(e) {
		}
		return null;
	},

	getPreviousFrame : function(aDocument, aContext) 
	{
		try {
			var xpathResult = aDocument.evaluate(
					'preceding::*' + this.FRAME_CONDITION + ' | ancestor::*' + this.FRAME_CONDITION,
					aContext || (function getLast(aParent) {
						return getLast(aParent.lastChild) || aParent;
					})(this.getDocumentBody(aDocument)),
					null,
					Ci.nsIDOMXPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			var frame = xpathResult.singleNodeValue;
			if (!frame)
				return null;

			if (!this.isFindableDocument(frame.contentDocument))
				return this.getPreviousFrame(aDocument, frame);

			return frame;
		}
		catch(e) {
		}
		return null;
	},

	isFindableDocument : function(aDocument) 
	{
		switch (aDocument.documentElement.namespaceURI)
		{
			case 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul':
			case 'http://www.w3.org/2000/svg':
				return false;

			default:
				return (
					aDocument.defaultView.innerWidth > 0 &&
					aDocument.defaultView.innerHeight > 0
				);
		}
	},

	checkLoop : function()
	{
		if (this.looped ||
			this.wrappedCount === 0)
			return;

		if (this.getOwnerDocumentFromRange(this.mAnchor) != this.getOwnerDocumentFromRange(this.mStartPoint))
			return;

		if (this.backward) {
			this.looped = this.mAnchor.compareBoundaryPoints(this.mAnchor.START_TO_END, this.mStartPoint) <= 0;
		}
		else {
			this.looped = this.mAnchor.compareBoundaryPoints(this.mAnchor.END_TO_START, this.mStartPoint) >= 0;
		}
	},
 
	destroy : function() 
	{
		delete this.backward;
		delete this.mRootDocShell;
		delete this.mStartPoint;
		delete this.mAnchor;
		delete this.wrapped;
	}
 
}; 
