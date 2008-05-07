var XMigemoHighlight = { 
	useGlobalStyleSheets : false,

	strongHighlight  : false,
	animationEnabled : false,
	combinations : [],

	animationStyle : 0,
	STYLE_ZOOM     : 0,
	STYLE_JUMP     : 1,
	animationSize : [15, 10],
	animationUnit : 10,

	kSTYLE     : '__moz_xmigemoFindHighlightStyle',
	kSCREEN    : '__moz_xmigemoFindHighlightScreen',
	kANIMATION : '__moz_xmigemoFindHighlightAnimation',

	kANIMATION_NODE : '__mozilla-findbar-animation',

	kHIGHLIGHTS : 'ancestor-or-self::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search"]',
	kANIMATIONS : 'descendant::*[@class="__mozilla-findbar-animation"]',
	 
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
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.hideScreen.restoreButtons');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animateFound');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animationStyle');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animationStyle.0.size');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.animationStyle.1.size');

		XMigemoService.ObserverService.addObserver(this, 'XMigemo:highlightNodeReaday', false);

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target)
			target.addEventListener('mousedown', this, true);

		var bar = XMigemoUI.findBar;
		bar.addEventListener('XMigemoFindBarOpen', this, false);
		bar.addEventListener('XMigemoFindBarClose', this, false);
		bar.addEventListener('XMigemoFindBarToggleHighlight', this, false);
		bar.addEventListener('XMigemoFindBarUpdate', this, false);
		document.addEventListener('XMigemoFindAgain', this, false);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		if (this.SSS) {
			this.useGlobalStyleSheets = true;
			this.updateGlobalStyleSheets();
		}
	},
 
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:highlightNodeReaday');

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target)
			target.removeEventListener('mousedown', this, true);

		var bar = XMigemoUI.findBar;
		bar.removeEventListener('XMigemoFindBarOpen', this, false);
		bar.removeEventListener('XMigemoFindBarClose', this, false);
		bar.removeEventListener('XMigemoFindBarToggleHighlight', this, false);
		bar.removeEventListener('XMigemoFindBarUpdate', this, false);
		document.removeEventListener('XMigemoFindAgain', this, false);

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

			case 'mousedown':
				if (aEvent.originalTarget.ownerDocument.defaultView.top == window.top)
					return;

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

				if (inScrollBar ||
					!window.content ||
					!window.content.__moz_xmigemoHighlightedScreen)
					return;

				this.toggleHighlightScreen(false);
				var self = this;
				var checker = function() {
						var screen = window.content.document.getElementById(self.kSCREEN);
						return !screen || !window.content.document.getBoxObjectFor(screen).width;
					};
				var callback = this.combinations.some(function(aCombination) {
							return aCombination.button == aEvent.button &&
								aCombination.altKey == aEvent.altKey &&
								aCombination.ctrlKey == aEvent.ctrlKey &&
								aCombination.shiftKey == aEvent.shiftKey &&
								aCombination.metaKey == aEvent.metaKey;
						}) ?
							function() { self.toggleHighlightScreen(true); } :
							null ;
				this.resendClickEvent(aEvent, checker, callback);
				aEvent.stopPropagation();
				aEvent.preventDefault();
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
				this.clearAnimationStyleIn(XMigemoUI.activeBrowser.contentWindow, true);
				this.clearAnimationStyle();
				window.setTimeout(function(aSelf) {
					if (aSelf.strongHighlight)
						aSelf.destroyHighlightScreen();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (window.content)
					window.content.__moz_xmigemoHighlighted = aEvent.targetHighlight;

				if (this.strongHighlight)
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

			case 'XMigemoFindAgain':
				if (this.animationStyle == this.STYLE_ZOOM)
					this.clearAnimationStyleIn(XMigemoUI.activeBrowser.contentWindow, true);
				this.clearAnimationStyle()
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
						break;

					case 'xulmigemo.highlight.hideScreen.restoreButtons':
						const nsIDOMNSEvent = Components.interfaces.nsIDOMNSEvent;
						this.combinations = value.split(',').map(function(aValue) {
							aValue = aValue.split('+');
							var result = {
									button   : parseInt(aValue[0]),
									altKey   : false,
									ctrlKey  : false,
									shiftKey : false,
									metaKey  : false
								};
							if (aValue.length < 2) return result;
							aValue = parseInt(aValue[1]);
							if (aValue & nsIDOMNSEvent.ALT_MASK)
								result.ctrlKey = true;
							if (aValue & nsIDOMNSEvent.CONTROL_MASK)
								result.altKey = true;
							if (aValue & nsIDOMNSEvent.SHIFT_MASK)
								result.shiftKey = true;
							if (aValue & nsIDOMNSEvent.META_MASK)
								result.metaKey = true;
							return result;
						});
						break;

					case 'xulmigemo.highlight.animateFound':
						this.animationEnabled = value;
						break;

					case 'xulmigemo.highlight.animationStyle':
						this.animationStyle = value;
						break;

					case 'xulmigemo.highlight.animationStyle.0.size':
						this.animationSize[0] = value;
						break;
					case 'xulmigemo.highlight.animationStyle.1.size':
						this.animationSize[1] = value;
						break;
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
		if (doc.getElementById(this.kSTYLE))
			return;

		var pageSize = this.getPageSize(doc.defaultView);

		var heads = doc.getElementsByTagName('head');
		if (heads.length > 0) {
			var objHead = heads[0];
			var node = doc.createElement('style');
			node.id = this.kSTYLE;
			node.type = 'text/css';
			node.innerHTML = '#'+this.kSCREEN+' {'+
				'	height: '+pageSize.height+'px;'+
				'	width: '+pageSize.width+'px;'+
				'}';
			objHead.insertBefore(node, objHead.firstChild);
		}

		if (!this.useGlobalStyleSheets)
			this.addStyleSheet('chrome://xulmigemo/content/highlight.css', doc);

		var bodies = doc.getElementsByTagName('body');
		if(bodies.length == 0)
			return;

		var objBody = bodies[0];

		var screen = doc.createElement('div');
		screen.setAttribute('id', this.kSCREEN);

		objBody.insertBefore(screen, objBody.firstChild);
	},
	 
	get SSS() 
	{
		if (this._SSS === void(0)) {
			if ('@mozilla.org/content/style-sheet-service;1' in Components.classes) {
				this._SSS = Components.classes['@mozilla.org/content/style-sheet-service;1'].getService(Components.interfaces.nsIStyleSheetService);
			}
			if (!this._SSS)
				this._SSS = null;
		}
		return this._SSS;
	},
//	_SSS : null,
 
	get IOService()
	{
		if (!this._IOService)
			this._IOService = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
		return this._IOService;
	},
	_IOService : null,
 
	updateGlobalStyleSheets : function() 
	{
		var sheet = this.IOService.newURI('chrome://xulmigemo/content/highlight.css', null, null);
		if (!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)) {
			this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
		}
	},
 
	addStyleSheet : function(aURI, aDocument) 
	{
		var newPI = document.createProcessingInstruction('xml-stylesheet',
				'href="'+aURI+'" type="text/css" media="all"');
		aDocument.insertBefore(newPI, document.firstChild);
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

		if (this.animationStyle == this.STYLE_ZOOM)
			this.clearAnimationStyleIn(aFrame, true);
		this.clearAnimationStyle();

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
			try {
				var xpathResult = aFrame.document.evaluate(
						this.kHIGHLIGHTS,
						node,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					);
			}
			catch(e) {
				try {
					var xpathResult = document.evaluate(
							this.kHIGHLIGHTS,
							node,
							null,
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
		this.clearAnimationStyleIn(aNode.ownerDocument.defaultView);
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
			aThis.clearAnimationStyle(true);
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
   
	clearAnimationStyleIn : function(aFrame, aRecursively) 
	{
		if (!aFrame) return;

		var doc = aFrame.document;
		var nodes = doc.evaluate(
				this.kANIMATIONS,
				doc,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		for (var i = nodes.snapshotLength-1; i > -1; i--)
		{
			nodes.snapshotItem(i).parentNode.removeChild(nodes.snapshotItem(i));
		}
		doc.documentElement.removeAttribute(this.kANIMATION);

		if (!aRecursively) return;

		var self = this;
		Array.prototype.slice.call(aFrame.frames)
			.forEach(function(aFrame) {
				self.clearAnimationStyleIn(aFrame, true);
			});
	},
 
	clearAnimationStyle : function(aEndOfAnimation) 
	{
		if (!this.animationNode || !this.animationNode.parentNode) return;

		var doc = this.animationNode.ownerDocument;

		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				this.animationNode.style.top = 0;
				doc.documentElement.removeAttribute(this.kANIMATION);
				break;

			case this.STYLE_ZOOM:
				if (this.animationNode.getAttribute('class') != this.kANIMATION_NODE)
					return;
				if (aEndOfAnimation) {
					this.animationNode.style.fontSize = '1em';
					return;
				}
				var parent = this.animationNode.parentNode;
				var doc = this.animationNode.ownerDocument;
				var range = doc.createRange();
				range.selectNode(this.animationNode);
				range.deleteContents();
				range.detach();
				this.animationNode = parent;
				doc.documentElement.removeAttribute(this.kANIMATION);
				break;
		}
	},
 
	initAnimationStyle : function() 
	{
		if (!this.animationNode) return;

		var doc = this.animationNode.ownerDocument;
		doc.documentElement.setAttribute(this.kANIMATION, true);

		switch (this.animationStyle)
		{
			case this.STYLE_ZOOM:
				var node = doc.createElement('span');
				node.setAttribute('class', this.kANIMATION_NODE);

				var range = doc.createRange();
				range.selectNodeContents(this.animationNode);
				var contents = range.cloneContents(true);

				range.collapse(false);
				range.insertNode(node);

				// anonymous contentsの中に挿入した内容は検索されない。
				// （複製した内容は検索されて欲しくないのでこうする）
				var box = doc.getAnonymousNodes(node);
				if (box && box.length) {
					box = box[0];
					range.selectNodeContents(box);
					range.insertNode(contents);
				}

				range.detach();

				this.animationNode = node;
				this.animationNode.style.top =
					this.animationNode.style.bottom =
					this.animationNode.style.left =
					this.animationNode.style.right = 0;
				this.animationNode.style.padding = 0;
				break;
		}
	},
 
	updateAnimationStyle : function(aStep) 
	{
		if (!this.animationNode) return;
		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				var y = parseInt(this.animationSize[this.STYLE_JUMP] * Math.sin((180 - (180 * aStep)) * Math.PI / 180));
				this.animationNode.style.top = '-'+(y * this.animationUnit)+'px';
				break;

			case this.STYLE_ZOOM:
				if (this.animationNode.getAttribute('class') != this.kANIMATION_NODE)
					return;
				var unit = parseInt(this.animationSize[this.STYLE_ZOOM] * Math.sin((180 - (180 * aStep)) * Math.PI / 180));
				var padding = this.animationUnit / 6;
				this.animationNode.style.top =
					this.animationNode.style.bottom = (-(unit * 0.025 * this.animationUnit) - padding)+'px';
				this.animationNode.style.left =
					this.animationNode.style.right = (-(unit * 0.05 * this.animationUnit) - padding)+'px';
				this.animationNode.style.fontSize = Math.min(1.1, 1 + (unit * 0.02))+'em';
				break;
		}
	},
  
	updateHighlightNode : function(aNode) 
	{
		if (this.strongHighlight) {
//			aNode.setAttribute('style',
//				aNode.getAttribute('style')+';'+
//				<><![CDATA[
//				]]></>
//			);
		}
	},
 
	resendClickEvent : function(aEvent, aChecker, aCallback) 
	{
		var utils = aEvent.view
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindowUtils);
		if ('sendMouseEvent' in utils) { // Firefox 3
			var flags = 0;
			const nsIDOMNSEvent = Components.interfaces.nsIDOMNSEvent;
			if (aEvent.altKey) flags |= nsIDOMNSEvent.ALT_MASK;
			if (aEvent.ctrlKey) flags |= nsIDOMNSEvent.CONTROL_MASK;
			if (aEvent.shiftKey) flags |= nsIDOMNSEvent.SHIFT_MASK;
			if (aEvent.metaKey) flags |= nsIDOMNSEvent.META_MASK;
			window.setTimeout(function(aX, aY, aButton) {
				if (aChecker && !aChecker()) {
					window.setTimeout(arguments.callee, 0, aX, aY, aButton);
					return;
				}
				if (ZoomManager.useFullZoom) {
					aX = aX * ZoomManager.zoom;
					aY = aY * ZoomManager.zoom;
				}
				utils.sendMouseEvent('mousedown', aX, aY, aButton, 1, flags);
				utils.sendMouseEvent('mouseup', aX, aY, aButton, 1, flags);
				if (aCallback) aCallback();
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
				if (aChecker && !aChecker()) {
					window.setTimeout(arguments.callee, 0, aSelf, aFrame, aX, aY);
					return;
				}
				var node = aSelf.getClickableElementFromPoint(aFrame, aX, aY);
				if (!node) return;
				var event = aFrame.document.createEvent('MouseEvents');
				args.push(node);
				event.initMouseEvent.apply(event, args);
				node.dispatchEvent(event);
				if ('focus' in node) node.focus();
				if (aCallback) aCallback();
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
 
