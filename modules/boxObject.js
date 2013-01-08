/*
 "getBoxObjectFor()" compatibility library for Firefox 3.6 or later

 Usage:
   // use instead of HTMLDocument.getBoxObjectFor(HTMLElement)
   var boxObject = window['piro.sakura.ne.jp']
                         .boxObject
                         .getBoxObjectFor(HTMLElement);

 license: The MIT License, Copyright (c) 2009-2013 YUKI "Piro" Hiroshi
   http://github.com/piroor/fxaddonlibs/blob/master/license.txt
 original:
   http://github.com/piroor/fxaddonlibs/blob/master/boxObject.js
   http://github.com/piroor/fxaddonlibs/blob/master/boxObject.test.js
   http://github.com/piroor/fxaddonlibs/blob/master/fixtures/box.html
*/

/* To work as a JS Code Module */
if (typeof window == 'undefined' ||
	(window && typeof window.constructor == 'function')) {
	this.EXPORTED_SYMBOLS = ['boxObject'];

	// If namespace.jsm is available, export symbols to the shared namespace.
	// See: http://github.com/piroor/fxaddonlibs/blob/master/namespace.jsm
	try {
		let ns = {};
		Components.utils.import('resource://xulmigemo-modules/namespace.jsm', ns);
		/* var */ window = ns.getNamespaceFor('piro.sakura.ne.jp');
	}
	catch(e) {
		window = {};
	}
}

(function() {
	const currentRevision = 7;

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
			return (aNodeOrRange instanceof Ci.nsIDOMNode && 'getBoxObjectFor' in aNodeOrRange.ownerDocument) ?
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
					element : aNodeOrRange instanceof Ci.nsIDOMNode ? aNodeOrRange : null ,
					range   : aNodeOrRange instanceof Ci.nsIDOMRange ? aNodeOrRange : null,
					fixed   : false
				};
			try {
				var frame = (box.element || box.range.startContainer).ownerDocument.defaultView;
				var zoom = this.getZoom(frame) ;

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
				return 1;
			}
			var markupDocumentViewer = aFrame.top
					.QueryInterface(Ci.nsIInterfaceRequestor)
					.getInterface(Ci.nsIWebNavigation)
					.QueryInterface(Ci.nsIDocShell)
					.contentViewer
					.QueryInterface(Ci.nsIMarkupDocumentViewer);
			return markupDocumentViewer.fullZoom;
		}

	};
})();

if (window != this) { // work as a JS Code Module
	this.boxObject = window['piro.sakura.ne.jp'].boxObject;
}
