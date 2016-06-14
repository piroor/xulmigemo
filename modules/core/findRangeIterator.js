var EXPORTED_SYMBOLS = ['FindRangeIterator'];

var TEST = false;
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');
 
Cu.import('resource://xulmigemo-modules/constants.jsm');
Cu.import('resource://xulmigemo-modules/core/docUtils.js');

Cu.import('resource://xulmigemo-modules/log.jsm');
function log(...aArgs) { MigemoLog('findRangeIterator', ...aArgs); }

function FindRangeIterator(aRootDocShell, aStartPoint, aBackward, aTraverseFrames)
{
	log('new FindRangeIterator');
	this.backward = aBackward;
	this.traverseFrames = aTraverseFrames;
	this.mRootDocShell = aRootDocShell;
	if (aStartPoint) {
		this.mStartPoint = aStartPoint.cloneRange();
		this.mStartPoint.collapse(!this.backward);
	}
	else {
		let doc = MigemoDocumentUtils.getDocumentFromDocShell(aRootDocShell);
		this.mStartPoint = this.createAnchorInDocument(doc);
	}
	this.mAnchor = this.mStartPoint.cloneRange();
	log('  mStartPoint = '+this.mStartPoint.startContainer+'/'+this.mStartPoint.startOffset);
	this.wrappedCount = 0;
}

FindRangeIterator.prototype = {
	mRootDocShell : null,
	backward : false,

	wrapped : false,
	looped : false,
	
	get document()
	{
		return MigemoDocumentUtils.getOwnerDocumentFromRange(this.mAnchor);
	},
	get view()
	{
		return this.document.defaultView;
	},
	get docShell()
	{
		return MigemoDocumentUtils.getDocShellFromDocument(this.document);
	},
	get body() 
	{
		return MigemoDocumentUtils.getDocumentBody(this.document);
	},

	getWholeFindRangeFromRangeInEditable : function(aRange) 
	{
		var owner = MigemoDocumentUtils.getParentEditableFromRange(aRange);
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

	createAnchorInDocument : function(aDocument)
	{
		let point = aDocument.createRange();
		point.selectNodeContents(MigemoDocumentUtils.getDocumentBody(aDocument));
		point.collapse(!this.backward);
		return point;
	},
 
	iterateNext : function() 
	{
		log('iterateNext');
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
				log('backward: wrapped');
			}
			if (editableRange) {
				log('backward: move into editable range');
				editableRange.setEnd(this.mAnchor.startContainer, this.mAnchor.startOffset);
				let editable = MigemoDocumentUtils.getParentEditableFromRange(this.mAnchor);
				this.mAnchor = doc.createRange();
				this.mAnchor.selectNode(editable);
				this.mAnchor.collapse(true);
				this.checkLoop(editableRange);
				return this.createRangeSet(editableRange);
			}

			if (this.traverseFrames) {
				let previousFrame = MigemoDocumentUtils.getPreviousFrame(doc, this.mAnchor);
				log('backward: traverse frames, previousFrame = '+previousFrame);
				if (previousFrame) {
					let range = this.mAnchor.cloneRange();
					range.setStartBefore(previousFrame);
					this.mAnchor = this.createAnchorInDocument(previousFrame.contentDocument);
					this.checkLoop(range);
					return this.createRangeSet(range);
				}
			}

			let root = MigemoDocumentUtils.getDocumentBody(doc);
			let range = this.mAnchor.cloneRange();
			range.setStartBefore(root.firstChild || root);

			if (this.traverseFrames) {
				let ownerFrame = MigemoDocumentUtils.getOwnerFrameFromContentDocument(doc);
				log('backward: traverse frames, ownerFrame = '+ownerFrame);
				if (ownerFrame) {
					this.mAnchor = ownerFrame.ownerDocument.createRange();
					this.mAnchor.selectNode(ownerFrame);
					this.mAnchor.collapse(true);
					this.checkLoop(range);
					return this.createRangeSet(range);
				}
			}

			log('backward: select to first');
			doc = MigemoDocumentUtils.getDocumentFromDocShell(this.mRootDocShell);
			this.mAnchor = this.createAnchorInDocument(doc);
			this.mWillWrapBackward = true;
			this.checkLoop(range);
			return this.createRangeSet(range);
		}
		else {
			if (this.mWillWrapForward) {
				this.wrapped = true;
				this.wrappedCount++;
				this.mWillWrapForward = false;
				log('forward: wrapped');
			}
			if (editableRange) {
				log('forward: move into editable range');
				editableRange.setStart(this.mAnchor.endContainer, this.mAnchor.endOffset);
				let editable = MigemoDocumentUtils.getParentEditableFromRange(this.mAnchor);
				this.mAnchor = doc.createRange();
				this.mAnchor.selectNode(editable);
				this.mAnchor.collapse(false);
				this.checkLoop(editableRange);
				return this.createRangeSet(editableRange);
			}

			if (this.traverseFrames) {
				let nextFrame = MigemoDocumentUtils.getNextFrame(doc, this.mAnchor);
				log('forward: traverse frames, nextFrame = '+nextFrame);
				if (nextFrame) {
					let range = this.mAnchor.cloneRange();
					range.setEndBefore(nextFrame);
					log(' range => '+range.toString()+'('+range.toString().length+')');
					this.mAnchor = this.createAnchorInDocument(nextFrame.contentDocument);
					this.checkLoop(range);
					return this.createRangeSet(range);
				}
			}

			let root = MigemoDocumentUtils.getDocumentBody(doc);
			let range = this.mAnchor.cloneRange();
			range.setEndAfter(root.lastChild || root);

			if (this.traverseFrames) {
				let ownerFrame = MigemoDocumentUtils.getOwnerFrameFromContentDocument(doc);
				log('forward: traverse frames, ownerFrame = '+ownerFrame);
				if (ownerFrame) {
					this.mAnchor = ownerFrame.ownerDocument.createRange();
					this.mAnchor.selectNode(ownerFrame);
					this.mAnchor.collapse(false);
					this.checkLoop(range);
					return this.createRangeSet(range);
				}
			}

			log('forward: select to last');
			doc = MigemoDocumentUtils.getDocumentFromDocShell(this.mRootDocShell);
			this.mAnchor = this.createAnchorInDocument(doc);
			this.mWillWrapForward = true;
			this.checkLoop(range);
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
		rangeSet.doc = MigemoDocumentUtils.getOwnerDocumentFromRange(aFindRange);

		if (Services.prefs.getBoolPref(MigemoConstants.BASE+'debug.findRangeIterator.markers'))
			MigemoDocumentUtils.insertMarkers('iteration', rangeSet);

		return rangeSet;
	},

	checkLoop : function(aNextFindRange)
	{
		if (this.looped ||
			this.wrappedCount === 0)
			return;

		var startDoc = MigemoDocumentUtils.getOwnerDocumentFromRange(this.mStartPoint);

		var anchorDoc = MigemoDocumentUtils.getOwnerDocumentFromRange(this.mAnchor);
		var anchorPassed = false;
		if (startDoc == anchorDoc) {
			if (this.backward) {
				anchorPassed = this.mAnchor.compareBoundaryPoints(this.mAnchor.START_TO_END, this.mStartPoint) <= 0;
			}
			else {
				anchorPassed = this.mAnchor.compareBoundaryPoints(this.mAnchor.END_TO_START, this.mStartPoint) >= 0;
			}
		}

		var findDoc = MigemoDocumentUtils.getOwnerDocumentFromRange(aNextFindRange);
		var findRangePassed = (
				(startDoc == findDoc) &&
				(
					aNextFindRange.compareBoundaryPoints(aNextFindRange.START_TO_START, this.mStartPoint) <= 0 &&
					aNextFindRange.compareBoundaryPoints(aNextFindRange.END_TO_END, this.mStartPoint) >= 0
				)
			);

		this.looped = anchorPassed || findRangePassed;
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
