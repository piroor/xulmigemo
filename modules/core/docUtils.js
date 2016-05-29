var EXPORTED_SYMBOLS = ['MigemoDocumentUtils'];

var TEST = false; 
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/lib/inherit.jsm');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('docUtils', ...aArgs); }

var MigemoDocumentUtils = inherit(MigemoConstants, {
	// frames
	getDocShellFromDocument : function(aDocument)
	{
		return aDocument.defaultView
			.QueryInterface(Ci.nsIInterfaceRequestor)
			.getInterface(Ci.nsIWebNavigation)
			.QueryInterface(Ci.nsIDocShell);
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

	FRAME_CONDITION : '[contains(" IFRAME iframe FRAME frame ", concat(" ", local-name(), " "))]',

	getNextFrame : function(aDocument, aBase) 
	{
		try {
			var baseRange = aBase;
			if (!baseRange || baseRange instanceof Ci.nsIDOMNode) {
				baseRange = aDocument.createRange();
				baseRange.selectNode(aBase);
				baseRange.collapse(false);
			}
			var xpathResult = aDocument.evaluate(
					'descendant::*' + this.FRAME_CONDITION,
					aDocument,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
			var nextFrame;
			var foundRange = aDocument.createRange();
			for (let i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
			{
				let frame = xpathResult.snapshotItem(i);
				if (!this.isFindableDocument(frame.contentDocument))
					continue;
				foundRange.selectNode(frame);
				if (baseRange.compareBoundaryPoints(baseRange.START_TO_START, foundRange) > 0) {
					nextFrame = frame;
					break;
				}
			}
			if (!nextFrame)
				return null;

			return nextFrame;
		}
		catch(e) {
		}
		return null;
	},

	getPreviousFrame : function(aDocument, aBase) 
	{
		try {
			var baseRange = aBase;
			if (!baseRange || baseRange instanceof Ci.nsIDOMNode) {
				baseRange = aDocument.createRange();
				baseRange.selectNode(aBase);
				baseRange.collapse(true);
			}
			var xpathResult = aDocument.evaluate(
					'descendant::*' + this.FRAME_CONDITION,
					aDocument,
					null,
					Ci.nsIDOMXPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
			var previousFrame;
			var foundRange = aDocument.createRange();
			for (let i = xpathResult.snapshotLength-1; i > -1; i--)
			{
				let frame = xpathResult.snapshotItem(i);
				if (!this.isFindableDocument(frame.contentDocument))
					continue;
				foundRange.selectNode(frame);
				if (baseRange.compareBoundaryPoints(baseRange.END_TO_START, foundRange) >= 0) {
					previousFrame = frame;
					break;
				}
			}
			if (!previousFrame)
				return null;

			return previousFrame;
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

	getDocumentFromDocShell : function(aDocShell)
	{
		return aDocShell
			.QueryInterface(Ci.nsIDocShell)
			.QueryInterface(Ci.nsIWebNavigation)
			.document;
	},

	// ranges
	getOwnerDocumentFromRange : function(aRange)
	{
		return aRange.startContainer.ownerDocument || aRange.startContainer;
	},

	// elements
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

	insertMarkers : function(aTerm, aRangeSet)
	{
		var doc = aRangeSet.doc;
		var timestamp = new Date().toString();

		if (!doc.documentElement.getAttribute(this.RANGE_MARKER_ACTIVE)) {
			doc.documentElement.setAttribute(this.RANGE_MARKER_ACTIVE, true);
			let style = doc.createProcessingInstruction(
				'xml-stylesheet',
				'href="data:text/css,'+encodeURIComponent(`
					[${this.RANGE_MARKER_RANGE_START}]::before,
					[${this.RANGE_MARKER_RANGE_END}]::before {
						color: black !important;
						border: 1px solid !important;
						background: orange !important;
					}
					[${this.RANGE_MARKER_RANGE_START}]::before {
						content: "<<" attr(${this.RANGE_MARKER_COUNT}) "<<";
					}
					[${this.RANGE_MARKER_RANGE_END}]::before {
						content: ">>" attr(${this.RANGE_MARKER_COUNT}) ">>";
					}
					[${this.RANGE_MARKER_START_POINT}]::before {
						content: "[FROM HERE " attr(${this.RANGE_MARKER_COUNT}) "]";
						color: white !important;
						border: 1px solid !important;
						background: blue !important;
					}
					[${this.RANGE_MARKER_END_POINT}]::before {
						content: "[TO HERE " attr(${this.RANGE_MARKER_COUNT}) "]";
						color: white !important;
						border: 1px solid !important;
						background: green !important;
					}
				`)+'" type="text/css"'
			);
			doc.insertBefore(style, doc.documentElement);
		}

		var marker = doc.createElement('span');
		marker.setAttribute('title', aTerm+' : '+timestamp);
		marker.setAttribute(this.RANGE_MARKER_COUNT, this.mMarkerCount);

		var rangeStart = marker.cloneNode(true);
		rangeStart.setAttribute(this.RANGE_MARKER_RANGE_START, true);
		aRangeSet.range.insertNode(rangeStart);

		var rangeEnd = marker.cloneNode(true);
		rangeEnd.setAttribute(this.RANGE_MARKER_RANGE_END, true);
		var insertionPoint = aRangeSet.range.cloneRange();
		insertionPoint.collapse(false);
		insertionPoint.insertNode(rangeEnd);

		var startPoint = marker.cloneNode(true);
		startPoint.setAttribute(this.RANGE_MARKER_START_POINT, true);
		aRangeSet.start.insertNode(startPoint);

		var endPoint = marker.cloneNode(true);
		endPoint.setAttribute(this.RANGE_MARKER_END_POINT, true);
		aRangeSet.end.insertNode(endPoint);

		this.mMarkerCount++;
	},
	mMarkerCount : 0
});
