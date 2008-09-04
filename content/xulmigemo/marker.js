var XMigemoMarker = { 
	showMarkers  : false,
	get requireDOMHighlight()
	{
		return this.showMarkers;
	},

	kCANVAS : '__moz_xmigemo-found-marker-canvas',
	markerSize : 10,
	markerPadding : 2,
	 
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
				window.setTimeout('XMigemoMarker.init();', 0);
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
						aSelf.toggleMarkers(true);
				}, 0, this);
				break;

			case 'XMigemoFindBarClose':
				window.setTimeout(function(aSelf) {
					if (aSelf.showMarkers)
						aSelf.destroyMarkers();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (window.content)
					window.content.__moz_xmigemoPositionMarkersShown = aEvent.targetHighlight;

				if (this.updateMarkersStateTimer) {
					window.clearTimeout(this.updateMarkersStateTimer);
					this.updateMarkersStateTimer = null;
				}
				this.updateMarkersStateTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.updateMarkersStateTimer = null;
					if (aSelf.showMarkers)
						aSelf.toggleMarkers(aHighlight);
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
					case 'xulmigemo.highlight.showMarkers':
						this.showMarkers = value;
						break;
				}
				break;
		}
	},
	domain  : 'xulmigemo.highlight',
	preferences : <><![CDATA[
		xulmigemo.highlight.showMarkers
	]]></>.toString(),
 
/* rendering position markers */ 
	 
	initializeMarkers : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (!aDontFollowSubFrames && aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		if (this.isAvailableForDocument(aFrame.document))
			this.insertMarkers(aFrame.document);

		aFrame.__moz_xmigemoPositionMarkersInitialized = true;
	},
	 
	insertMarkers : function(aDocument) 
	{
		var doc = aDocument;
		if (doc.getElementById(this.kCANVAS))
			return;

		var bodies = doc.getElementsByTagName('body');
		if (bodies.length == 0)
			return;

		var size = this.getPageSize(aDocument.defaultView);
		if (!size.height || !size.wHeight) return;

		if (!XMigemoService.useGlobalStyleSheets)
			XMigemoService.addStyleSheet('chrome://xulmigemo/content/marker.css', doc);

		var objBody = bodies[0];
		var canvas = doc.createElementNS(XMigemoUI.kXHTMLNS, 'canvas');
		canvas.setAttribute('id', this.kCANVAS);
		canvas.setAttribute('class', '__moz_xmigemo-positioned');
		canvas.setAttribute(
			'style',
			<![CDATA[
				width: ]]>.toString() +
			(this.markerSize+this.markerPadding)+'px !important'
		);
		canvas.width = this.markerSize+this.markerPadding;
		canvas.height = size.wHeight;
		objBody.insertBefore(canvas, objBody.firstChild);

		this.drawMarkers(aDocument);
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
  
	drawMarkers : function(aDocument) 
	{
		var canvas = aDocument.getElementById(this.kCANVAS);
		if (!canvas) return;

		var size = this.getPageSize(aDocument.defaultView);
		var targets = XMigemoUI.collectHighlights(aDocument);

		try {
			var ctx = canvas.getContext('2d');
			ctx.fillStyle = 'rgba(255,255,0,1)';
			ctx.strokeStyle = 'rgba(192,128,0,0.75)';
			targets.forEach(function(aNode) {
				var baseY = (size.wHeight - 20) * (aNode.offsetTop / size.height) + 10;
				ctx.save();
				ctx.moveTo(this.markerSize+this.markerPadding, baseY);
				ctx.beginPath();
				ctx.lineTo(this.markerPadding, baseY - (this.markerSize / 2));
				ctx.lineTo(this.markerPadding, baseY + (this.markerSize / 2));
				ctx.lineTo(this.markerSize+this.markerPadding, baseY);
				ctx.fill();
				ctx.closePath();
				ctx.stroke();
				ctx.restore();
			}, this);
		}
		catch(e) {
			dump('XMigemoMarker Error: ' + e.message + '\n');
		}
	},
 	
	destroyMarkers : function(aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		if (!(aFrame.document instanceof HTMLDocument)) return;

		aFrame.document.documentElement.removeAttribute(this.kCANVAS);
	},
 
	toggleMarkers : function(aHighlight, aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		Array.slice(aFrame.frames).forEach(function(aFrame) {
			this.toggleMarkers(aHighlight, aFrame);
		}, this);

		if (!this.isAvailableForDocument(aFrame.document)) return;

		if (!('__moz_xmigemoPositionMarkersInitialized' in aFrame) && aHighlight)
			this.initializeMarkers(aFrame, true);

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
 
window.addEventListener('load', XMigemoMarker, false); 
 
