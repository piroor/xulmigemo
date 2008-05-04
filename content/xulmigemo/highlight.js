var XMigemoHighlight = { 
	strongHighlight  : false,
	animationEnabled : false,

	animationStyle : 0,
	STYLE_ZOOM     : 0,
	STYLE_JUMP     : 1,

	kSCREEN : '__moz_xmigemoFindHighlightScreen',
	 
	NSResolver : { 
		lookupNamespaceURI : function(aPrefix)
		{
			switch (aPrefix)
			{
				case 'xul':
					return 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
				case 'html':
				case 'xhtml':
					return 'http://www.w3.org/1999/xhtml';
				case 'xlink':
					return 'http://www.w3.org/1999/xlink';
				default:
					return '';
			}
		}
	},
 
	init : function() 
	{
		if (window
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.parent) // in subframe
			return;


		eval('gFindBar.updateStatus = '+gFindBar.updateStatus.toSource()
			.replace(
				'{',
				'{ if (arguments[0] != Components.interfaces.nsITypeAheadFind.FIND_NOTFOUND && XMigemoHighlight.strongHighlight) { XMigemoHighlight.highlightFocusedFound(); };'
			)
		);
		if (
			gFindBar.updateStatus == gFindBar.updateStatusBar || // old
			'_updateStatusUI' in gFindBar // Firefox 3.0
			) {
			if ('updateStatusBar' in gFindBar) // old
				gFindBar.updateStatusBar = gFindBar.updateStatus;
			else if ('_updateStatusUI' in gFindBar) // Firefox 3.0
				gFindBar._updateStatusUI = gFindBar.updateStatus;
		}

		if (typeof gSearchWP != 'undefined') { // SearchWP
			eval(
				'gSearchWPOverlay.toggleHighlight = '+
				gSearchWPOverlay.toggleHighlight.toSource().replace(
					'gSearchWPHighlighting.toggleHighlight',
					'if (XMigemoHighlight.strongHighlight) XMigemoHighlight.toggleHighlightScreen(aHighlight);'+
					'gSearchWPHighlighting.toggleHighlight'
				)
			);
		}

		if (typeof GBL_Listener != 'undefined') { // Googlebar Lite
			eval(
				'window.GBL_ToggleHighlighting = '+
				window.GBL_ToggleHighlighting.toSource().replace(
					'var hb = document.getElementById("GBL-TB-Highlighter");',
					'var hb = document.getElementById("GBL-TB-Highlighter");'+
					'if (XMigemoHighlight.strongHighlight) XMigemoHighlight.toggleHighlightScreen(!hb.checked);'
				)
			);
		}


		XMigemoService.addPrefListener(this);
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.showScreen');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animateFound');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animationStyle');

		XMigemoService.ObserverService.addObserver(this, 'XMigemo:highlightNodeReaday', false);

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target)
			target.addEventListener('mouseup', this, true);

		var bar = XMigemoUI.findBar;
		bar.addEventListener('XMigemoFindBarOpen', this, false);
		bar.addEventListener('XMigemoFindBarClose', this, false);
		bar.addEventListener('XMigemoFindBarToggleHighlight', this, false);
		bar.addEventListener('XMigemoFindBarUpdate', this, false);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		this.highlightStyle = this.highlightStyle.replace(/%SCREEN%/g, this.kSCREEN);
	},
 
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:highlightNodeReaday');

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target)
			target.removeEventListener('mouseup', this, true);

		var bar = XMigemoUI.findBar;
		bar.removeEventListener('XMigemoFindBarOpen', this, false);
		bar.removeEventListener('XMigemoFindBarClose', this, false);
		bar.removeEventListener('XMigemoFindBarToggleHighlight', this, false);
		bar.removeEventListener('XMigemoFindBarUpdate', this, false);

		window.removeEventListener('unload', this, false);
	},
 
	handleEvent : function(aEvent) 
	{
		switch (aEvent.type)
		{
			case 'load':
				window.setTimeout('XMigemoHighlight.init();', 0);
				return;

			case 'unload':
				this.destroy();
				return;

			case 'mouseup':
				var inScrollBar = false;
				var node = aEvent.originalTarget;
				do
				{
					if (/^(scrollbar|scrollbarbutton|slider|thumb|gripper)$/i.test(node.localName)) {
						inScrollBar = true;
						break;
					}
					node = node.parentNode;
				} while (node.parentNode);
				if (!inScrollBar &&
					window.content &&
					window.content.__moz_xmigemoHighlightedScreen) {
					this.toggleHighlightScreen(false);
					this.resendClickEvent(aEvent);
				}
				break;

			case 'XMigemoFindBarOpen':
				window.setTimeout(function(aSelf) {
					if (!XMigemoUI.findBarHidden &&
						aSelf.strongHighlight &&
						!XMigemoUI.findHighlightCheck.disabled &&
						XMigemoUI.findHighlightCheck.checked)
						aSelf.toggleHighlightScreen(true);
				}, 0, this);
				break;

			case 'XMigemoFindBarClose':
				window.setTimeout(function(aSelf) {
					if (aSelf.strongHighlight)
						aSelf.destroyHighlightScreen();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (window.content)
					window.content.__moz_xmigemoHighlighted = aEvent.targetHighlight;

				if (
					this.strongHighlight &&
					XMigemoUI.findBarHidden != aEvent.targetHighlight /* &&
					((XMigemoUI.isActive ? XMigemoFind.lastFoundWord : XMigemoUI.findTerm ) || '').length > 1*/
					)
					this.toggleHighlightScreen(aEvent.targetHighlight);
				break;

			case 'XMigemoFindBarUpdate':
				if (XMigemoUI.findBarHidden) return;
				var highlightCheck = XMigemoUI.findHighlightCheck;
				if (highlightCheck.checked &&
					!window.content.__moz_xmigemoHighlighted) {
					gFindBar.toggleHighlight(true);
				}
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
					case 'xulmigemo.highlight.showScreen':
						this.strongHighlight = value;
						return;

					case 'xulmigemo.highlight.animateFound':
						this.animationEnabled = value;
						return;

					case 'xulmigemo.highlight.animationStyle':
						this.animationStyle = value;
						return;
				}
				break;

			case 'XMigemo:highlightNodeReaday':
				this.updateHighlightNode(aSubject);
				break;
		}
	},
	domain  : 'xulmigemo',
 
/* Safari style highlight, dark screen 
	based on http://kuonn.mydns.jp/fx/SafariHighlight.uc.js
*/
	
	initializeHighlightScreen : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (!aDontFollowSubFrames && aFrame.frames && aFrame.frames.length) {
			var self = this;
			Array.prototype.slice.call(aFrame.frames).forEach(function(aSubFrame) {
				self.initializeHighlightScreen(aSubFrame);
			});
		}

		if (aFrame.document instanceof HTMLDocument)
			this.addHighlightScreen(aFrame.document);

		aFrame.__moz_xmigemoHighlightedScreenInitialized = true;
	},
	
	addHighlightScreen : function(aDocument) 
	{
		var doc = aDocument;
		if (doc.getElementById('__moz_xmigemoFindHighlightStyle'))
			return;

		var pageSize = this.getPageSize(doc.defaultView);

		var heads = doc.getElementsByTagName('head');
		if (heads.length > 0) {
			var objHead = heads[0];
			var node = doc.createElement('style');
			node.id = '__moz_xmigemoFindHighlightStyle';
			node.type = 'text/css';
			node.innerHTML = this.highlightStyle+
				'#'+this.kSCREEN+' {'+
				'	height: '+pageSize.height+'px;'+
				'	width: '+pageSize.width+'px;'+
				'}';
			objHead.insertBefore(node, objHead.firstChild);
		}

		var bodies = doc.getElementsByTagName('body');
		if(bodies.length == 0)
			return;

		var objBody = bodies[0];

		var screen = doc.createElement('div');
		screen.setAttribute('id', this.kSCREEN);

		objBody.insertBefore(screen, objBody.firstChild);
	},
	
	highlightStyle : String(<![CDATA[ 
		:root[%SCREEN%="on"] * {
			z-index: auto !important;
		}
		:root[%SCREEN%="on"] #__firefox-findbar-search-id, /* Fx 2 */
		:root[%SCREEN%="on"] .__mozilla-findbar-search, /* Fx 3 */
		:root[%SCREEN%="on"] .searchwp-term-highlight1, /* SearchWP */
		:root[%SCREEN%="on"] .searchwp-term-highlight2,
		:root[%SCREEN%="on"] .searchwp-term-highlight3,
		:root[%SCREEN%="on"] .searchwp-term-highlight4,
		:root[%SCREEN%="on"] .GBL-Highlighted /* Googlebar Lite */ {
			position: relative !important;
			z-index: 3000000 !important;
		}
		:root[%SCREEN%="on"] .__mozilla-findbar-animation {
			position: absolute !important;
			z-index: 3000100 !important;
		}
		#%SCREEN% {
			left: 0;
			top: 0;
			border: 0;
			margin: 0;
			padding: 0;
			background: #000000;
			position: absolute;
			opacity: 0.3;
			-moz-opacity: 0.3;
			display: none;
			z-index: 1000000 !important;
		}
		:root[%SCREEN%="on"] > body > #%SCREEN% {
			display: block !important;
		}
		:root[%SCREEN%="on"] embed {
			visibility: hidden !important;
		}
		:root[%SCREEN%="on"] iframe {
			position: relative;
			z-index: 2000000 !important;
		}
	]]>),
  
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
  
	destroyHighlightScreen : function(aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (aFrame.frames && aFrame.frames.length) {
			var self = this;
			Array.prototype.slice.call(aFrame.frames).forEach(function(aSubFrame) {
				self.destroyHighlightScreen(aSubFrame);
			});
		}

		if (!(aFrame.document instanceof HTMLDocument)) return;

		aFrame.document.documentElement.removeAttribute(this.kSCREEN);
	},
 
	toggleHighlightScreen : function(aHighlight, aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (aFrame.frames && aFrame.frames.length) {
			var self = this;
			Array.prototype.slice.call(aFrame.frames).forEach(function(aSubFrame) {
				self.toggleHighlightScreen(aHighlight, aSubFrame);
			});
		}

		if (!(aFrame.document instanceof HTMLDocument)) return;

		if (!('__moz_xmigemoHighlightedScreenInitialized' in aFrame) && aHighlight)
			this.initializeHighlightScreen(aFrame, true);

		aFrame.__moz_xmigemoHighlightedScreen = aHighlight;

		if (aHighlight)
			aFrame.document.documentElement.setAttribute(this.kSCREEN, 'on');
		else
			aFrame.document.documentElement.removeAttribute(this.kSCREEN);
	},
  
/* Safari style highlight, animation */ 
	 
	highlightFocusedFound : function(aFrame) 
	{
		if (!this.animationEnabled) return;

		if (this.highlightFocusedFoundTimer) {
			window.clearTimeout(this.highlightFocusedFoundTimer);
		}
		this.highlightFocusedFoundTimer = window.setTimeout('XMigemoHighlight.highlightFocusedFoundCallback()', 0);
	},
	 
	highlightFocusedFoundCallback : function(aFrame) 
	{
		this.highlightFocusedFoundTimer = null;

		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		var range = XMigemoUI.textUtils.getFoundRange(aFrame);
		if (range && !this.findParentEditable(range)) {
			var node  = range.startContainer;
			const expression = 'ancestor-or-self::*[@id = "__firefox-findbar-search-id" or @class = "__mozilla-findbar-search"]';
			try {
				var xpathResult = aFrame.document.evaluate(
						expression,
						node,
						this.NSResolver,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					);
			}
			catch(e) {
				try {
					var xpathResult = document.evaluate(
							expression,
							node,
							this.NSResolver,
							XPathResult.FIRST_ORDERED_NODE_TYPE,
							null
						);
				}
				catch(e) {
					return false;
				}
			}
			if (xpathResult.singleNodeValue) {
				this.animateFoundNode(xpathResult.singleNodeValue);
			}
			return true;
		}

		if (aFrame.frames && aFrame.frames.length) {
			var frames = aFrame.frames;
			for (var i = 0, maxi = frames.length; i < maxi; i++)
			{
				if (this.highlightFocusedFound(frames[i]))
					break;
			}
		}
		return false;
	},
	findParentEditable : function(aRange)
	{
		var node = aRange.commonAncestorContainer;
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
	 
	animateFoundNode : function(aNode) 
	{
		if (this.animationTimer) {
			this.clearAnimationStyle();
			window.clearInterval(this.animationTimer);
			this.animationTimer = null;
			this.animationNode  = null;
		}
		this.animationNode = aNode;
		this.initAnimationStyle();
		this.animationStart = (new Date()).getTime();
		this.animationTimer = window.setInterval(this.animateFoundNodeCallback, 1, this);
	},
	animateFoundNodeCallback : function(aThis)
	{
		var node = aThis.animationNode;
		var now = (new Date()).getTime();
		if (aThis.animationTime <= (now - aThis.animationStart) || !node.parentNode) {
			aThis.clearAnimationStyle();
			window.clearInterval(aThis.animationTimer);
			aThis.animationTimer = null;
			aThis.animationNode  = null;
		}
		else {
			var step = ((now - aThis.animationStart) || 1) / aThis.animationTime;
			aThis.updateAnimationStyle(step);
		}
	},
	animationTimer : null,
	animationTime  : 250,
   
	clearAnimationStyle : function() 
	{
		if (!this.animationNode) return;
		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				this.animationNode.style.top = 0;
				break;

			case this.STYLE_ZOOM:
				var parent = this.animationNode.parentNode;
				var doc = this.animationNode.ownerDocument;
				var range = doc.createRange();
				range.selectNode(this.animationNode);
				range.deleteContents();
				range.detach();
				this.animationNode = parent;
				break;
		}
	},
 
	initAnimationStyle : function() 
	{
		if (!this.animationNode) return;
		switch (this.animationStyle)
		{
			case this.STYLE_ZOOM:
				var doc = this.animationNode.ownerDocument;
				var range = doc.createRange();
				range.selectNode(this.animationNode);
				var contents = range.cloneContents(true);
				contents.firstChild.className += ' __mozilla-findbar-animation';
				range.selectNodeContents(this.animationNode);
				range.collapse(false);
				range.insertNode(contents);
				range.detach();
				this.animationNode = this.animationNode.lastChild;
				this.animationNode.style.overflow = 'hidden';
				this.animationNode.style.textAlign = 'center';
				this.animationNode.style.background = 'orange';
				this.animationNode.style.outlineColor = 'red';
				break;
		}
	},
 
	updateAnimationStyle : function(aStep) 
	{
		if (!this.animationNode) return;
		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				var y = parseInt(10 * Math.sin((180 - (180 * aStep)) * Math.PI / 180));
				this.animationNode.style.top = '-0.'+y+'em';
				break;

			case this.STYLE_ZOOM:
				var unit = parseInt(10 * Math.sin((180 - (180 * aStep)) * Math.PI / 180));
				this.animationNode.style.top =
					this.animationNode.style.bottom =(-(unit*0.025))+'em';
				this.animationNode.style.left =
					this.animationNode.style.right = (-(unit*0.05))+'em';
				this.animationNode.style.fontSize = (1+(unit*0.02))+'em';
				break;
		}
	},
 	 
	updateHighlightNode : function(aNode) 
	{
		if (this.strongHighlight) {
			aNode.setAttribute('style',
				aNode.getAttribute('style')+';'+
				<><![CDATA[
					outline: 2px solid orange;
					-moz-outline: 2px solid orange;
					-moz-outline-radius: 4px;
				]]></>
			);
		}
	},
 
	resendClickEvent : function(aEvent) 
	{
		var utils = aEvent.view
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindowUtils);
		if ('sendMouseEvent' in utils) { // Firefox 3
			var flags = 0;
			const nsIDOMNSEvent = Components.interfaces.nsIDOMNSEvent;
			if (aEvent.altKey) flags |= nsIDOMNSEvent.ALT_MARK;
			if (aEvent.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MARK;
			if (aEvent.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MARK;
			if (aEvent.metaKey) flags |= nsIDOMNSEvent.META_MARK;
			window.setTimeout(function(aX, aY, aButton) {
				utils.sendMouseEvent('mousedown', aX, aY, aButton, 1, flags);
				utils.sendMouseEvent('mouseup', aX, aY, aButton, 1, flags);
			}, 0, aEvent.clientX, aEvent.clientY, aEvent.button);
		}
		else { // Firefox 2, emulation
			var args = [
					'click',
					aEvent.bubbles,
					aEvent.cancelable,
					aEvent.view,
					1,
					aEvent.screenX,
					aEvent.screenY,
					aEvent.clientX,
					aEvent.clientY,
					aEvent.ctrlKey,
					aEvent.altKey,
					aEvent.shiftKey,
					aEvent.metaKey,
					aEvent.button
				];
			window.setTimeout(function(aSelf, aFrame, aX, aY) {
				var node = aSelf.getClickableElementFromPoint(aFrame, aX, aY);
				if (!node) return;
				var event = aFrame.document.createEvent('MouseEvents');
				args.push(node);
				event.initMouseEvent.apply(event, args);
				node.dispatchEvent(event);
				if ('focus' in node) node.focus();
			}, 0, this, aEvent.view, aEvent.screenX, aEvent.screenY);
		}
	},
	
	getClickableElementFromPoint : function(aWindow, aScreenX, aScreenY) 
	{
		var accNode;
		try {
			var accService = Components.classes['@mozilla.org/accessibilityService;1']
								.getService(Components.interfaces.nsIAccessibilityService);
			var acc = accService.getAccessibleFor(aWindow.document);
			var box = aWindow.document.getBoxObjectFor(aWindow.document.documentElement);
			accNode = /* acc.getChildAtPoint(aScreenX - box.screenX, aScreenY - box.screenY) || */ acc.getChildAtPoint(aScreenX, aScreenY);
			accNode = accNode.QueryInterface(Components.interfaces.nsIAccessNode).DOMNode;
		}
		catch(e) {
		}

		var filter = function(aNode) {
			switch (aNode.localName.toUpperCase()) {
				case 'A':
					if (aNode.href)
						return NodeFilter.FILTER_ACCEPT;
					break;
				case 'INPUT':
				case 'TEXTAREA':
				case 'BUTTON':
				case 'SELECT':
					return NodeFilter.FILTER_ACCEPT;
					break;
			}
			return NodeFilter.FILTER_SKIP;
		};

		if (accNode &&
			accNode.nodeType == Node.ELEMENT_NODE &&
			filter(accNode) == NodeFilter.FILTER_ACCEPT)
			return accNode;

		var doc = aWindow.document;
		var startNode = accNode || doc;
		var walker = aWindow.document.createTreeWalker(startNode, NodeFilter.SHOW_ELEMENT, filter, false);
		for (var node = walker.firstChild(); node != null; node = walker.nextNode())
		{
			var box = doc.getBoxObjectFor(node);
			var l = box.screenX;
			var t = box.screenY;
			var r = l + box.width;
			var b = t + box.height;
			if (l <= aScreenX && aScreenX <= r && t <= aScreenY && aScreenY <= b)
				return node;
		}
		return null;
	},
   
	dummy : null
}; 
 
window.addEventListener('load', XMigemoHighlight, false); 
 
