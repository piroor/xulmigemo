var XMigemoHighlight = { 
	strongHighlight  : false,
	animationEnabled : false,
	 
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
	},
 
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

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
					window.content.__moz_xmigemoHighlightedScreen)
					this.toggleHighlightScreen(false);
				break;

			case 'XMigemoFindBarOpen':
				if (this.strongHighlight &&
					!XMigemoUI.findHighlightCheck.disabled &&
					XMigemoUI.findHighlightCheck.checked)
					this.toggleHighlightScreen(true);
				break;

			case 'XMigemoFindBarClose':
				if (this.strongHighlight)
					this.destroyHighlightScreen();
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (window.content)
					window.content.__moz_xmigemoHighlighted = aEvent.targetHighlight;

				if (
					this.strongHighlight/* &&
					((XMigemoUI.isActive ? XMigemoFind.lastFoundWord : XMigemoUI.findTerm ) || '').length > 1*/
					)
					this.toggleHighlightScreen(aEvent.targetHighlight);
				break;

			case 'XMigemoFindBarUpdate':
				var highlightCheck = XMigemoUI.findHighlightCheck;
				if (highlightCheck.checked &&
					!window.content.__moz_xmigemoHighlighted) {
					gFindBar.toggleHighlight(true);
				}
				break;

		}
	},
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.highlight.showScreen':
				this.strongHighlight = value;
				return;

			case 'xulmigemo.highlight.animateFound':
				this.animationEnabled = value;
				return;
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
				'#__moz_xmigemoFindHighlightScreen {'+
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
		screen.setAttribute('id', '__moz_xmigemoFindHighlightScreen');

		objBody.insertBefore(screen, objBody.firstChild);
	},
	
	highlightStyle : String(<![CDATA[ 
		:root[__moz_xmigemoFindHighlightScreen="on"] * {
			z-index: auto !important;
		}
		:root[__moz_xmigemoFindHighlightScreen="on"] #__firefox-findbar-search-id, /* Fx 2 */
		:root[__moz_xmigemoFindHighlightScreen="on"] .__mozilla-findbar-search, /* Fx 3 */
		:root[__moz_xmigemoFindHighlightScreen="on"] .searchwp-term-highlight1, /* SearchWP */
		:root[__moz_xmigemoFindHighlightScreen="on"] .searchwp-term-highlight2,
		:root[__moz_xmigemoFindHighlightScreen="on"] .searchwp-term-highlight3,
		:root[__moz_xmigemoFindHighlightScreen="on"] .searchwp-term-highlight4,
		:root[__moz_xmigemoFindHighlightScreen="on"] .GBL-Highlighted /* Googlebar Lite */ {
			position: relative !important;
			z-index: 3000000 !important;
		}
		#__moz_xmigemoFindHighlightScreen {
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
		:root[__moz_xmigemoFindHighlightScreen="on"] > body > #__moz_xmigemoFindHighlightScreen {
			display: block !important;
		}
		:root[__moz_xmigemoFindHighlightScreen="on"] embed {
			visibility: hidden !important;
		}
		:root[__moz_xmigemoFindHighlightScreen="on"] iframe {
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

		aFrame.document.documentElement.removeAttribute('__moz_xmigemoFindHighlightScreen');
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
			aFrame.document.documentElement.setAttribute('__moz_xmigemoFindHighlightScreen', 'on');
		else
			aFrame.document.documentElement.removeAttribute('__moz_xmigemoFindHighlightScreen');
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
			try {
				var xpathResult = aFrame.document.evaluate(
						'ancestor-or-self::*[@id = "__firefox-findbar-search-id" or @class = "__mozilla-findbar-search"]',
						node,
						this.NSResolver,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					);
			}
			catch(e) {
				try {
					var xpathResult = document.evaluate(
							'ancestor-or-self::*[@id = "__firefox-findbar-search-id" or @class = "__mozilla-findbar-search"]',
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
			this.animationNode.style.top = 0;
			window.clearInterval(this.animationTimer);
			this.animationTimer = null;
			this.animationNode  = null;
		}
		this.animationNode = aNode;
		this.animationStart = (new Date()).getTime();
		this.animationTimer = window.setInterval(this.animateFoundNodeCallback, 1, this);
	},
	animateFoundNodeCallback : function(aThis)
	{
		var node = aThis.animationNode;
		var now = (new Date()).getTime();
		if (aThis.animationTime <= (now - aThis.animationStart) || !node.parentNode) {
			node.style.top = 0;
			window.clearInterval(aThis.animationTimer);
			aThis.animationTimer = null;
			aThis.animationNode  = null;
		}
		else {
			var step = ((now - aThis.animationStart) || 1) / aThis.animationTime;
			var y = parseInt(10 * Math.sin((180 - (180 * step)) * Math.PI / 180));
			node.style.top = '-0.'+y+'em';
		}
	},
	animationTimer : null,
	animationTime  : 250,
     
}; 
 
window.addEventListener('load', XMigemoHighlight, false); 
 
