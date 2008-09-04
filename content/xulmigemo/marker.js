var XMigemoMarker = { 
	enabled  : false,
	get requireDOMHighlight()
	{
		return this.enabled;
	},

	kCANVAS : '__moz_xmigemo-found-marker-canvas',

	size : 10,
	padding : 2,
	 
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
		bar.addEventListener('XMigemoFindBarUpdateHighlight', this, false);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		XMigemoUI.registerHighlightUtility(this);
	},
 
	destroy : function() 
	{
		XMigemoUI.unregisterHighlightUtility(this);
		XMigemoService.removePrefListener(this);
		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:highlightNodeReaday');

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target)
			target.removeEventListener('mousedown', this, true);

		var bar = XMigemoUI.findBar;
		bar.removeEventListener('XMigemoFindBarOpen', this, false);
		bar.removeEventListener('XMigemoFindBarClose', this, false);
		bar.removeEventListener('XMigemoFindBarToggleHighlight', this, false);
		bar.removeEventListener('XMigemoFindBarUpdateHighlight', this, false);

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

			case 'mousedown':
				this.onMouseDown(aEvent);
				return;

			case 'mouseup':
				this.onMouseUp(aEvent);
				return;

			case 'mousemove':
				this.onMouseMove(aEvent);
				return;

			case 'XMigemoFindBarOpen':
				window.setTimeout(function(aSelf) {
					if (XMigemoUI.hidden ||
						!aSelf.enabled ||
						XMigemoUI.highlightCheck.disabled ||
						!XMigemoUI.highlightCheck.checked)
						return;
					aSelf.startListen();
					aSelf.toggleMarkers(true);
				}, 0, this);
				break;

			case 'XMigemoFindBarClose':
				window.setTimeout(function(aSelf) {
					if (!aSelf.enabled) return;
					aSelf.stopListen();
					aSelf.destroyMarkers();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (this.toggleTimer) {
					window.clearTimeout(this.toggleTimer);
					this.toggleTimer = null;
				}
				this.toggleTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.toggleTimer = null;
					if (!aSelf.enabled) return;
					aSelf.toggleMarkers(aHighlight);
					if (aHighlight)
						aSelf.startListen();
					else
						aSelf.stopListen();
				}, 10, this, aEvent.targetHighlight);
				break;

			case 'XMigemoFindBarUpdateHighlight':
				if (this.redrawTimer) {
					window.clearTimeout(this.redrawTimer);
					this.redrawTimer = null;
				}
				this.redrawTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.redrawTimer = null;
					if (!aSelf.enabled || !aHighlight) return;
					aSelf.redrawMarkers();
				}, 10, this, aEvent.targetHighlight);
				break;
		}
	},
	 
	onMouseDown : function(aEvent) 
	{
		if (aEvent.target.nodeType != Node.ELEMENT_NODE ||
			aEvent.target.getAttribute('id') != this.kCANVAS)
			return;

		aEvent.preventDefault();
		aEvent.stopPropagation();
		this.scrollTo(aEvent.target, aEvent.clientY);

		this.dragging = true;
	},
	 
	scrollTo : function(aCanvas, aY) 
	{
		var doc = aCanvas.ownerDocument;
		var topOffset = parseInt(aCanvas.getAttribute('top-offset'));
		var bottomOffset = parseInt(aCanvas.getAttribute('bottom-offset'));
		var size = XMigemoService.getDocumentSizeInfo(doc);
		var height = size.viewHeight - topOffset - bottomOffset;
		if (!height) return;
		var w = doc.defaultView;
		w.scrollTo(w.scrollX, (aY / height * size.height) - (size.viewHeight / 2));
	},
  
	onMouseUp : function(aEvent) 
	{
		if (!this.dragging) return;
		this.dragging = false;
		aEvent.preventDefault();
		aEvent.stopPropagation();
	},
 
	onMouseMove : function(aEvent) 
	{
		if (!this.dragging) return;
		aEvent.preventDefault();
		aEvent.stopPropagation();
		this.scrollTo(aEvent.target, aEvent.clientY);
	},
 	
	startListen : function() 
	{
		if (this.listening) return;
		this.listening = true;
		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target) {
			target.addEventListener('mousedown', this, true);
			target.addEventListener('mouseup', this, true);
			target.addEventListener('mousemove', this, true);
		}
	},
 
	stopListen : function() 
	{
		if (!this.listening) return;
		this.listening = false;
		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target) {
			target.removeEventListener('mousedown', this, true);
			target.removeEventListener('mouseup', this, true);
			target.removeEventListener('mousemove', this, true);
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
					case 'xulmigemo.highlight.foundMarker.enabled':
						this.enabled = value;
						break;

					case 'xulmigemo.highlight.foundMarker.size':
						this.size = value;
						break;
				}
				break;
		}
	},
	domain  : 'xulmigemo.highlight.foundMarker',
	preferences : <><![CDATA[
		xulmigemo.highlight.foundMarker.enabled
		xulmigemo.highlight.foundMarker.size
	]]></>.toString(),
 
/* rendering position markers */ 
	 
	initializeMarkers : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (!aDontFollowSubFrames && aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		var doc = aFrame.document;
		if (doc.getElementById(this.kCANVAS))
			return;

		var bodies = doc.getElementsByTagName('body');
		if (bodies.length == 0)
			return;

		var size = XMigemoService.getDocumentSizeInfo(doc);
		if (!size.height || !size.viewHeight) return;

		if (!XMigemoService.useGlobalStyleSheets)
			XMigemoService.addStyleSheet('chrome://xulmigemo/content/marker.css', doc);

		var objBody = bodies[0];
		var canvas = doc.createElementNS(XMigemoUI.kXHTMLNS, 'canvas');
		canvas.setAttribute('id', this.kCANVAS);
		canvas.setAttribute('class', '__moz_xmigemo-positioned');
		canvas.setAttribute(
			'style',
			'width: '+(this.size+this.padding)+'px !important'
		);
		canvas.width = this.size+this.padding;
		canvas.height = size.viewHeight;
		objBody.insertBefore(canvas, objBody.firstChild);

		this.drawMarkers(doc);
	},
 
	redrawMarkers : function(aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		this.drawMarkers(aFrame.document);
	},
	 
	drawMarkers : function(aDocument) 
	{
		var canvas = aDocument.getElementById(this.kCANVAS);
		if (!canvas) return;

		var size = XMigemoService.getDocumentSizeInfo(aDocument);
		var targets = XMigemoUI.collectHighlights(aDocument);

		var topOffset = 10;
		var heightOffset = 20;
		if (size.xScrillable)
			heightOffset += 10;

		canvas.setAttribute('top-offset', topOffset);
		canvas.setAttribute('bottom-offset', heightOffset - topOffset);

		try {
			var ctx = canvas.getContext('2d');
			ctx.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.restore();

			ctx.fillStyle = 'rgba(255,255,0,1)';
			ctx.strokeStyle = 'rgba(192,128,0,0.75)';
			targets.forEach(function(aNode) {
				var baseY = (size.viewHeight - heightOffset) * ((aNode.offsetTop + aNode.offsetHeight) / size.height) + topOffset;
				ctx.save();
				ctx.moveTo(this.size+this.padding, baseY);
				ctx.beginPath();
				ctx.lineTo(this.padding, baseY - (this.size / 2));
				ctx.lineTo(this.padding, baseY + (this.size / 2));
				ctx.lineTo(this.size+this.padding, baseY);
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

		var canvas = aFrame.document.getElementById(this.kCANVAS);
		if (canvas)
			canvas.parentNode.removeChild(canvas);

		aFrame.document.documentElement.removeAttribute(this.kCANVAS);
	},
 
	toggleMarkers : function(aShow, aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		Array.slice(aFrame.frames).forEach(function(aFrame) {
			this.toggleMarkers(aShow, aFrame);
		}, this);

		if (!this.isAvailableForDocument(aFrame.document)) return;

		if (aShow)
			this.initializeMarkers(aFrame, true);
		else
			this.destroyMarkers(aFrame);
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
 
