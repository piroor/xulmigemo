var XMigemoPosition = { 
	showMarkers  : false,
	get requireDOMHighlight()
	{
		return this.showMarkers;
	},

	kCANVAS : '__moz_xmigemo-find-position-canvas',
	 
	init : function() 
	{
		if (window
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.parent) // in subframe
			return;

		XMigemoService.addPrefListener(this);

		var bar = XMigemoUI.findBar;
		bar.addEventListener('XMigemoFindBarOpen', this, false);
		bar.addEventListener('XMigemoFindBarClose', this, false);
		bar.addEventListener('XMigemoFindBarToggleHighlight', this, false);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		XMigemoUI.registerHighlightUtility(this);
	},
 
	destroy : function() 
	{
		XMigemoUI.unregisterHighlightUtility(this);
		XMigemoService.removePrefListener(this);
		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:highlightNodeReaday');

		var bar = XMigemoUI.findBar;
		bar.removeEventListener('XMigemoFindBarOpen', this, false);
		bar.removeEventListener('XMigemoFindBarClose', this, false);
		bar.removeEventListener('XMigemoFindBarToggleHighlight', this, false);

		window.removeEventListener('unload', this, false);
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				window.setTimeout('XMigemoPosition.init();', 0);
				return;

			case 'unload':
				this.destroy();
				return;

			case 'XMigemoFindBarOpen':
				window.setTimeout(function(aSelf) {
					if (!XMigemoUI.hidden &&
						aSelf.showMarkers &&
						!XMigemoUI.highlightCheck.disabled &&
						XMigemoUI.highlightCheck.checked)
						aSelf.toggleCanvas(true);
				}, 0, this);
				break;

			case 'XMigemoFindBarClose':
				window.setTimeout(function(aSelf) {
					if (aSelf.showMarkers)
						aSelf.destroyCanvas();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (window.content)
					window.content.__moz_xmigemoPositionMarkersShown = aEvent.targetHighlight;

				if (this.updateCanvasStateTimer) {
					window.clearTimeout(this.updateCanvasStateTimer);
					this.updateCanvasStateTimer = null;
				}
				this.updateCanvasStateTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.updateCanvasStateTimer = null;
					if (aSelf.showMarkers)
						aSelf.toggleCanvas(aHighlight);
				}, 10, this, aEvent.targetHighlight);
				break;
		}
	},
 	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'nsPref:changed':
				var value = XMigemoService.getPref(aData);
				switch (aData)
				{
					case 'xulmigemo.position.showMarkers':
						this.showMarkers = value;
						break;
				}
				break;
		}
	},
	domain  : 'xulmigemo.position',
	preferences : <><![CDATA[
		xulmigemo.position.showMarkers
	]]></>.toString(),
 
/* Safari style highlight, dark screen 
	based on http://kuonn.mydns.jp/fx/SafariHighlight.uc.js
*/
	 
	initializeCanvas : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (!aDontFollowSubFrames && aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		if (this.isAvailableForDocument(aFrame.document))
			this.insertCanvas(aFrame.document);

		aFrame.__moz_xmigemoPositionMarkersInitialized = true;
	},
	 
	insertCanvas : function(aDocument) 
	{
		var doc = aDocument;
		if (doc.getElementById(this.kCANVAS))
			return;

		var bodies = doc.getElementsByTagName('body');
		if (bodies.length == 0)
			return;

		var objBody = bodies[0];
		var canvas = doc.createElementNS(XMigemoUI.kXHTMLNS, 'canvas');
		canvas.setAttribute('id', this.kCANVAS);
		canvas.setAttribute('style', <![CDATA[
			position: fixed !important;
			right: 0 !important;
			top: 0 !important;
			bottom: 0 !important;
			width: 5px !important;
		]]>.toString());
		canvas.width = 5;
		canvas.height = this.getPageSize(aDocument.defaultView).wHeight;
		objBody.insertBefore(canvas, objBody.firstChild);
	},
 
	getPageSize : function(aWindow) 
	{
		var xScroll = aWindow.innerWidth + aWindow.scrollMaxX;
		var yScroll = aWindow.innerHeight + aWindow.scrollMaxY;
		var windowWidth  = aWindow.innerWidth;
		var windowHeight = aWindow.innerHeight;
		var pageWidth  = (xScroll < windowWidth) ? windowWidth : xScroll ;
		var pageHeight = (yScroll < windowHeight) ? windowHeight : yScroll ;
		return {
				width   : pageWidth,
				height  : pageHeight,
				wWidth  : windowWidth,
				wHeight : windowHeight
			};
	},
  
	destroyCanvas : function(aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		if (!(aFrame.document instanceof HTMLDocument)) return;

		aFrame.document.documentElement.removeAttribute(this.kCANVAS);
	},
 
	toggleCanvas : function(aHighlight, aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		Array.slice(aFrame.frames).forEach(function(aFrame) {
			this.toggleCanvas(aHighlight, aFrame);
		}, this);

		if (!this.isAvailableForDocument(aFrame.document)) return;

		if (!('__moz_xmigemoPositionMarkersInitialized' in aFrame) && aHighlight)
			this.initializeCanvas(aFrame, true);

		aFrame.__moz_xmigemoPositionMarkers = aHighlight;

		if (aHighlight)
			aFrame.document.documentElement.setAttribute(this.kCANVAS, 'on');
		else
			aFrame.document.documentElement.removeAttribute(this.kCANVAS);
	},
 
	isAvailableForDocument : function(aDocument) 
	{
		return (
			(aDocument instanceof HTMLDocument) ||
			(XMigemoUI.workForAnyXMLDocuments && (aDocument instanceof XMLDocument))
			);
	},
   
	dummy : null
}; 
 
window.addEventListener('load', XMigemoPosition, false); 
 
