/*
 "getBoxObjectFor()" compatibility library for Firefox 31 or later

 Usage:
   // use instead of HTMLDocument.getBoxObjectFor(HTMLElement)
   var boxObject = window['piro.sakura.ne.jp']
                         .boxObject
                         .getBoxObjectFor(HTMLElementOrRange);

 license: The MIT License, Copyright (c) 2009-2014 YUKI "Piro" Hiroshi
 original:
   http://github.com/piroor/fxaddonlib-boxobject
*/

/* To work as a JS Code Module */
if (typeof window == 'undefined' ||
	(window && typeof window.constructor == 'function')) {
	this.EXPORTED_SYMBOLS = ['boxObject'];

	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://github.com/piroor/fxaddonlibs/blob/master/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://xulmigemo-modules/lib/namespace.jsm', ns);
		/* var */ window = ns.getNamespaceFor('piro.sakura.ne.jp');
	}
	catch(e) {
		window = {};
	}
}

(function() {
	const currentRevision = 9;

	if (!('piro.sakura.ne.jp' in window)) window['piro.sakura.ne.jp'] = {};

	var loadedRevision = 'boxObject' in window['piro.sakura.ne.jp'] ?
			window['piro.sakura.ne.jp'].boxObject.revision :
			0 ;
	if (loadedRevision && loadedRevision > currentRevision) {
		return;
	}

	var Cc = Components.classes;
	var Ci = Components.interfaces;

	window['piro.sakura.ne.jp'].boxObject = {
		revision : currentRevision,

		getBoxObjectFor : function(aNodeOrRange, aUnify)
		{
			var d = aNodeOrRange.ownerDocument;
			return (d &&
					typeof d.defaultView.Node == 'function' &&
					aNodeOrRange instanceof d.defaultView.Node &&
					'getBoxObjectFor' in d) ?
					this.getBoxObjectFromBoxObjectFor(aNodeOrRange, aUnify) :
					this.getBoxObjectFromClientRectFor(aNodeOrRange, aUnify) ;
		},

		getBoxObjectFromBoxObjectFor : function(aNode, aUnify)
		{
			var boxObject = aNode.ownerDocument.getBoxObjectFor(aNode);
			var box = {
					x       : boxObject.x,
					y       : boxObject.y,
					width   : boxObject.width,
					height  : boxObject.height,
					screenX : boxObject.screenX,
					screenY : boxObject.screenY,
					element : aNode,
					fixed   : false
				};
			if (!aUnify) return box;

			var style = this._getComputedStyle(aNode);
			box.left = box.x - this._getPropertyPixelValue(style, 'border-left-width');
			box.top = box.y - this._getPropertyPixelValue(style, 'border-top-width');
			if (style.getPropertyValue('position') == 'fixed') {
				box.left -= frame.scrollX;
				box.top  -= frame.scrollY;
				box.fixed = true;
			}
			box.right  = box.left + box.width;
			box.bottom = box.top + box.height;

			return box;
		},

		getBoxObjectFromClientRectFor : function(aNodeOrRange, aUnify)
		{
			var box = {
					x       : 0,
					y       : 0,
					width   : 0,
					height  : 0,
					screenX : 0,
					screenY : 0,
					element : null,
					range   : null,
					fixed   : false
				};
			try {
				var frame = (aNodeOrRange.startContainer || aNodeOrRange).ownerDocument.defaultView;
				var zoom = this.getZoom(frame) ;

				if (aNodeOrRange instanceof frame.Node)
					box.element = aNodeOrRange;
				if (aNodeOrRange instanceof frame.Range)
					box.range = aNodeOrRange;

				var rect = aNodeOrRange.getBoundingClientRect();
				if (aUnify) {
					box.left   = rect.left;
					box.top    = rect.top;
					box.right  = rect.right;
					box.bottom = rect.bottom;
				}

				box.x = rect.left;
				box.y = rect.top;

				if (box.element) {
					let style = this._getComputedStyle(aNodeOrRange);

					// "x" and "y" are offset positions of the "padding-box" from the document top-left edge.
					box.x += this._getPropertyPixelValue(style, 'border-left-width');
					box.y += this._getPropertyPixelValue(style, 'border-top-width');

					if (style.getPropertyValue('position') != 'fixed') {
						box.x += frame.scrollX;
						box.y += frame.scrollY;
					}
				}
				else {
					let node = aNodeOrRange.startContainer;
					if (node.nodeType != Ci.nsIDOMNode.ELEMENT_NODE)
						node = node.parentNode;
					do {
						let style = this._getComputedStyle(node);
						if (style.getPropertyValue('position') == 'fixed') {
							box.fixed = true;
							break;
						}
						node = node.offsetParent;
					}
					while (node);
					if (!box.fixed) {
						box.x += frame.scrollX;
						box.y += frame.scrollY;
					}
				}

				// "width" and "height" are sizes of the "border-box".
				box.width  = rect.right - rect.left;
				box.height = rect.bottom - rect.top;

				box.screenX = rect.left * zoom;
				box.screenY = rect.top * zoom;

				box.screenX += frame.mozInnerScreenX * zoom;
				box.screenY += frame.mozInnerScreenY * zoom;
			}
			catch(e) {
				Components.utils.reportError(e);
			}

			'x,y,screenX,screenY,width,height,left,top,right,bottom'
				.split(',')
				.forEach(function(aProperty) {
					if (aProperty in box)
						box[aProperty] = Math.round(box[aProperty]);
				});

			return box;
		},

		_getComputedStyle : function(aNode)
		{
			return aNode.ownerDocument.defaultView.getComputedStyle(aNode, null);
		},

		_getPropertyPixelValue : function(aStyle, aProperty)
		{
			return parseInt(aStyle.getPropertyValue(aProperty).replace('px', ''));
		},

		Prefs : Cc['@mozilla.org/preferences;1']
			.getService(Ci.nsIPrefBranch)
			.QueryInterface(Ci.nsIPrefBranch2),

		getZoom : function(aFrame)
		{
			try {
				if (!this.Prefs.getBoolPref('browser.zoom.full'))
					return 1;
			}
			catch(e) {
				Components.utils.reportError(e);
				return 1;
			}
			var markupDocumentViewer = aFrame.top
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIWebNavigation)
					.QueryInterface(Ci.nsIDocShell)
					.contentViewer;
			// no need to QI for Firefox 35, but this is still required for old environments.
			if (!('fullZoom' in markupDocumentViewer))
				markupDocumentViewer = markupDocumentViewer
					.QueryInterface(Ci.nsIMarkupDocumentViewer);
			return markupDocumentViewer.fullZoom;
		}

	};
})();

if (window != this) { // work as a JS Code Module
	this.boxObject = window['piro.sakura.ne.jp'].boxObject;
}
