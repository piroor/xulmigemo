var EXPORTED_SYMBOLS = ['MigemoFind'];

/* This depends on: 
	MigemoCoreFactory
	MigemoTextUtils
*/
var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
 
Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/core.js');
Cu.import('resource://xulmigemo-modules/core/textUtils.js');
Cu.import('resource://xulmigemo-modules/core/docUtils.js');
Cu.import('resource://xulmigemo-modules/core/findRangeIterator.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('find', ...aArgs); }

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

	_targetDocShell : null,
	get targetDocShell()
	{
		return this._targetDocShell;
	},
	set targetDocShell(aValue)
	{
		return this._targetDocShell = aValue;
	},

	get targetDocument()
	{
		return (
			this.targetDocShell &&
			this.targetDocShell.QueryInterface(Ci.nsIWebNavigation).document
		);
	},
	set targetDocument(aValue)
	{
		this.targetDocShell = MigemoDocumentUtils.getDocShellFromDocument(aValue);
		return aValue;
	},

	get targetWindow()
	{
		return this.targetDocument.defaultView;
	},
	set targetWindow(aValue)
	{
		this.targetDocument = aValue.document;
		return aValue;
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
		var aSubFrame      = aParams.subFrame || false;

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

		var foundRange = this.foundRange;
		if (!aSubFrame &&
			foundRange &&
			MigemoDocumentUtils.getOwnerDocumentFromRange(foundRange) != this.targetDocument) {
			this.foundRange = foundRange = null;
		}

		var startPoint;
		if (aScrollToFound &&
			this.startFromViewport &&
			!foundRange) {
			log(this.logPrefix + 'from viewport');
			let firstVisibleNode = MigemoTextUtils.findFirstVisibleNode(this.targetDocument, aBackward);
			if (firstVisibleNode) {
				startPoint = this.targetDocument.createRange();
				startPoint.selectNode(firstVisibleNode);
				startPoint.collapse(!aBackward);
			}
		}
		if (!startPoint) {
			if (foundRange) {
				log(this.logPrefix + 'from last found');
				startPoint = foundRange.cloneRange();
				startPoint.collapse(aBackward);
			}
			else if (aScrollToFound && aSubFrame) {
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
		var iterator = new FindRangeIterator(this.targetDocShell, startPoint, aBackward, aSubFrame);
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

			log(this.logPrefix+'wrapped => '+aRangeIterator.wrapped+', looped => '+aRangeIterator.looped);
			let rangeString = rangeSet.range.toString();
			if (rangeString.length > 400) {
				rangeString = rangeString.slice(0,400)+'...('+(rangeString.length-400)+')'
			}
			log(this.logPrefix+'rangeSet.range => '+rangeString);

			let result = this.findWithRangeSet(aFindFlag, aFindTerm, rangeSet);

			if (!(aFindFlag & this.FIND_SILENTLY)) {
				if (
					lastDoc &&
					(
						lastDoc != rangeSet.doc ||
						!(result.flag & this.FOUND)
					)
					) {
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

		if (Services.prefs.getBoolPref('xulmigemo.debug.find.markers') &&
			!(aFindFlag & this.FIND_SILENTLY))
			MigemoDocumentUtils.insertMarkers(aTerm, aRangeSet);

		if (!result.range) {
			return result;
		}

		result.flag = this.FOUND;

		if (result.foundEditable = MigemoDocumentUtils.getParentEditableFromRange(result.range))
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
						MigemoDocumentUtils.getDocShellFromDocument(aTarget.document)
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
		var editableParent = MigemoDocumentUtils.getParentEditableFromRange(aRange);
		var newSelCon = this.getSelectionController(editableParent) ||
				this.getSelectionController(doc.defaultView);
		var selection = newSelCon.getSelection(newSelCon.SELECTION_NORMAL);
		selection.addRange(aRange);

		newSelCon.setDisplaySelection(newSelCon.SELECTION_ATTENTION);
		newSelCon.repaintSelection(newSelCon.SELECTION_NORMAL);

		if (this.prefs.getPref('xulmigemo.scrollSelectionToCenter'))
			this.scrollTargetToCenter(aRange, false);
		else
			newSelCon.scrollSelectionIntoView(
				newSelCon.SELECTION_NORMAL,
				newSelCon.SELECTION_FOCUS_REGION,
				true);
	},
	
	scrollTargetToCenter : function(aTarget, aPreventAnimation) 
	{
		if (!aTarget)
			return;

		var padding = Math.max(0, Math.min(100, this.prefs.getPref('xulmigemo.scrollSelectionToCenter.padding')));

		var startX;
		var startY;
		var viewW;
		var viewH;
		var targetX,
			targetY,
			targetW,
			targetH;
		var window;
		var scrollFrame;

		var scrollableParentElement = this.getScrollableParent(aTarget.commonAncestorContainer || aTarget.parentNode);
		if (scrollableParentElement) {
			window = scrollableParentElement.ownerDocument.defaultView;
			scrollFrame = scrollableParentElement;
		}
		else {
			window = (aTarget.startContainer || aTarget).ownerDocument.defaultView;
			scrollFrame = window;
		}

		log('scrollTargetToCenter <'+aTarget+'> window='+window+', scrollFrame='+scrollFrame);

		var task = this.smoothScrollTasks.get(scrollFrame);
		if (task) {
			this.animationManager.removeTask(task);
			this.smoothScrollTasks.delete(scrollFrame);
		}

		if (scrollableParentElement) {
			let box = getBoxObjectFor(aTarget);
			let ownerBox = getBoxObjectFor(scrollFrame);
			if (!box || box.fixed || !ownerBox)
				return;

			startX = scrollFrame.scrollLeft;
			startY = scrollFrame.scrollTop;
			viewW = ownerBox.width;
			viewH = ownerBox.height;

			targetX = box.screenX - ownerBox.screenX + startX;
			targetY = box.screenY - ownerBox.screenY + startY;
			targetW = box.width;
			targetH = box.height;

			this.scrollTargetToCenter(scrollFrame, aPreventAnimation);

			if (this.isBoxInViewport(box, scrollFrame, padding)) {
				log(' => <'+aTarget+'> is visible in the scrollFrame(element) '+scrollFrame);
				return;
			}
		}
		else {
			let box = getBoxObjectFor(aTarget);
			if (!box || box.fixed)
				return;

			startX = scrollFrame.scrollX;
			startY = scrollFrame.scrollY;
			viewW = scrollFrame.innerWidth;
			viewH = scrollFrame.innerHeight;

			targetX = box.x;
			targetY = box.y;
			targetW = box.width;
			targetH = box.height;

			if (scrollFrame.top != scrollFrame) {
				let ownerFrame = MigemoDocumentUtils.getOwnerFrameFromContentDocument(scrollFrame.document);
				this.scrollTargetToCenter(ownerFrame, aPreventAnimation);
			}

			if (this.isBoxInViewport(box, scrollFrame, padding)) {
				log(' => <'+aTarget+'> is visible in the scrollFrame '+scrollFrame);
				return;
			}
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
			if (typeof scrollFrame.scrollTo == 'function') {
				scrollFrame.scrollTo(finalX, finalY);
			}
			else {
				scrollFrame.scrollLeft = finalX;
				scrollFrame.scrollTop = finalY;
			}
			return;
		}

		var deltaX = finalX - startX;
		var deltaY = finalY - startY;
		var radian = 90 * Math.PI / 180;
		task = (function(aTime, aBeginning, aChange, aDuration) {
			var x, y, finished;
			if (aTime >= aDuration) {
				this.smoothScrollTasks.delete(scrollFrame);
				x = finalX;
				y = finalY
				finished = true;
			}
			else {
				x = startX + (deltaX * Math.sin(aTime / aDuration * radian));
				y = startY + (deltaY * Math.sin(aTime / aDuration * radian));
				finished = false;
			}
			log('  => scrollTargetToCenter in '+scrollFrame+' ('+aTime+' / '+aDuration+' '+x+', '+y+')');
			if (typeof scrollFrame.scrollTo == 'function') {
				scrollFrame.scrollTo(x, y);
			}
			else {
				scrollFrame.scrollLeft = x;
				scrollFrame.scrollTop = y;
			}
			return finished;
		}).bind(this);
		this.smoothScrollTasks.set(scrollFrame, task);
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
		var result = {
			rightOut  : aBox.x > scrollX + viewPortWidth - aPadding,
			bottomOut : aBox.y > scrollY + viewPortHeight - aPadding,
			leftOut   : aBox.x + aBox.width < scrollX + aPadding,
			topOut    : aBox.y + aBox.height < scrollY + aPadding
		};
		log('  isBoxInViewport: '+
				JSON.stringify({
					x: aBox.x,
					y: aBox.y,
					width:  aBox.width,
					height: aBox.height
				})+', '+JSON.stringify({
					scrollX: scrollX,
					scrollY: scrollY,
					width:  viewPortWidth,
					height: viewPortHeight,
					aPadding: aPadding
				})+', '+JSON.stringify(result));

		return !(
			result.rightOut ||
			result.bottomOut ||
			result.leftOut ||
			result.topOut
		);
	},

	getScrollableParent : function(aNode)
	{
		if (!aNode || !aNode.ownerDocument)
			return null;

		var root = MigemoDocumentUtils.getDocumentBody(aNode.ownerDocument);
		while (aNode && aNode != root)
		{
			if (('scrollTopMax' in aNode && aNode.scrollTopMax != 0) ||
				('scrollLeftMax' in aNode && aNode.scrollLeftMax != 0) ||
				aNode instanceof Ci.nsIDOMNSEditableElement)
				return aNode;
			aNode = aNode.parentNode;
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
  
