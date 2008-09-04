var XMigemoHighlight = { 
	useGlobalStyleSheets : false,

	strongHighlight  : false,
	get requireDOMHighlight()
	{
		return this.strongHighlight;
	},
	animationEnabled : false,
	combinations : [],

	animationStyle : 0,
	STYLE_ZOOM     : 0,
	STYLE_JUMP     : 1,
	animationSize : [10, 2],
	animationUnit : 10,

	kSCREEN    : '__moz_xmigemo-find-highlight-screen',
	kANIMATION : '__moz_xmigemo-find-highlight-animation',

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

		XMigemoService.ObserverService.addObserver(this, 'XMigemo:highlightNodeReaday', false);

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target) {
			target.addEventListener('mousedown', this, true);
			target.addEventListener('mouseup', this, true);
		}

		var bar = XMigemoUI.findBar;
		bar.addEventListener('XMigemoFindBarOpen', this, false);
		bar.addEventListener('XMigemoFindBarClose', this, false);
		bar.addEventListener('XMigemoFindBarToggleHighlight', this, false);
		document.addEventListener('XMigemoFindAgain', this, false);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		if (this.SSS) {
			this.useGlobalStyleSheets = true;
		}

		XMigemoUI.registerHighlightUtility(this);
	},
 
	destroy : function() 
	{
		XMigemoUI.unregisterHighlightUtility(this);
		XMigemoService.removePrefListener(this);

		XMigemoService.ObserverService.removeObserver(this, 'XMigemo:highlightNodeReaday');

		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target) {
			target.removeEventListener('mousedown', this, true);
			target.removeEventListener('mouseup', this, true);
		}

		var bar = XMigemoUI.findBar;
		bar.removeEventListener('XMigemoFindBarOpen', this, false);
		bar.removeEventListener('XMigemoFindBarClose', this, false);
		bar.removeEventListener('XMigemoFindBarToggleHighlight', this, false);
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
				this.onMouseDown(aEvent);
				break;

			case 'mouseup':
				this.onMouseUp(aEvent);
				break;

			case 'XMigemoFindBarOpen':
				window.setTimeout(function(aSelf) {
					if (!XMigemoUI.hidden &&
						aSelf.strongHighlight &&
						!XMigemoUI.highlightCheck.disabled &&
						XMigemoUI.highlightCheck.checked)
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

				if (this.updateScreenStateTimer) {
					window.clearTimeout(this.updateScreenStateTimer);
					this.updateScreenStateTimer = null;
				}
				this.updateScreenStateTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.updateScreenStateTimer = null;
					if (aSelf.strongHighlight)
						aSelf.toggleHighlightScreen(aHighlight);
				}, 10, this, aEvent.targetHighlight);
				break;

			case 'XMigemoFindAgain':
				if (this.animationStyle == this.STYLE_ZOOM)
					this.clearAnimationStyleIn(XMigemoUI.activeBrowser.contentWindow, true);
				this.clearAnimationStyle()
				break;
		}
	},
	 
	isEventFiredOnScrollBar : function(aEvent) 
	{
		var node = aEvent.originalTarget;
		do
		{
			if (/^(scrollbar|scrollbarbutton|slider|thumb|gripper)$/i.test(node.localName))
				return true;
			node = node.parentNode;
		} while (node.parentNode);
		return false;
	},
 
	onMouseDown : function(aEvent) 
	{
		if (aEvent.originalTarget.ownerDocument.defaultView.top == window.top ||
			this.isEventFiredOnScrollBar(aEvent) ||
			!window.content ||
			!window.content.__moz_xmigemoHighlightedScreen)
			return;

		var node = aEvent.originalTarget;
		var doc = node.ownerDocument;
		var view = doc.defaultView;

		doc.documentElement.removeAttribute(this.kSCREEN);
		node = this.getClickableElementFromPoint(view, aEvent.screenX, aEvent.screenY, aEvent.clientX, aEvent.clientY);
		doc.documentElement.setAttribute(this.kSCREEN, 'on');

		var b = XMigemoUI.activeBrowser;
		if (b.localName == 'tabbrowser') b = b.selectedBrowser;
		if (node && b.isAutoscrollBlocker(node)) {
			b.setAttribute('autoscroll', 'false');
			window.setTimeout(function() {
				b.removeAttribute('autoscroll');
			}, 0);
		}
	},
 
	onMouseUp : function(aEvent) 
	{
		if (aEvent.originalTarget.ownerDocument.defaultView.top == window.top ||
			this.isEventFiredOnScrollBar(aEvent) ||
			!window.content ||
			!window.content.__moz_xmigemoHighlightedScreen)
			return;

		var b = XMigemoUI.activeBrowser;
		if (b.localName == 'tabbrowser') b = b.selectedBrowser;
		if ('_autoScrollPopup' in b) { // Firefox 3
			if (b._autoScrollPopup)
				b._autoScrollPopup.hidePopup();
		}
		else if (!b._snapOn) { // Firefox 2
			b.stopScroll();
		}

		this.toggleHighlightScreen(false);

		if (this.isGestureInProgress) return;

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
	},
	 
	get isGestureInProgress() 
	{
		return (
			this.aioGesturesInProgress ||
			this.fireGesturesInProgress ||
			this.mozGesturesInProgress
			);
	},
 
	get aioGesturesInProgress() // All-in-One Gestures 
	{
		if (!('aioGestInProgress' in window))
			return false;
		return window.aioGestInProgress || window.aioGrabTarget;
	},
 
	get fireGesturesInProgress() // FireGestures 
	{
		if (
			!('FireGestures' in window) ||
			!('_gestureHandler' in FireGestures) ||
			!('xdIGestureHandler' in Components.interfaces)
			)
			return false;
		return FireGestures._gestureHandler.sourceNode;
	},
 
	get mozGesturesInProgress() // Optimoz Mouse Gestures (Mouse Gestures Redox) 
	{
		if (
			!('mgObserver' in window) ||
			!('gestureInProgress' in window)
			)
			return false;
		return window.gestureInProgress;
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
	preferences : <><![CDATA[
		xulmigemo.highlight.showScreen
		xulmigemo.highlight.hideScreen.restoreButtons
		xulmigemo.highlight.animateFound
		xulmigemo.highlight.animationStyle
		xulmigemo.highlight.animationStyle.0.size
		xulmigemo.highlight.animationStyle.1.size
	]]></>.toString(),
 
/* Safari style highlight, dark screen 
	based on http://kuonn.mydns.jp/fx/SafariHighlight.uc.js
*/
	 
	initializeHighlightScreen : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (!aDontFollowSubFrames && aFrame.frames && aFrame.frames.length) {
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
		}

		if (this.isDocumentHighlightable(aFrame.document))
			this.addHighlightScreen(aFrame.document);

		aFrame.__moz_xmigemoHighlightedScreenInitialized = true;
	},
	 
	addHighlightScreen : function(aDocument) 
	{
		var doc = aDocument;
		if (doc.getElementById(this.kSCREEN))
			return;

		if (!this.useGlobalStyleSheets)
			this.addStyleSheet('chrome://xulmigemo/content/highlight.css', doc);

		var bodies = doc.getElementsByTagName('body');
		if(bodies.length == 0)
			return;

		var objBody = bodies[0];

		var screen = doc.createElementNS(XMigemoUI.kXHTMLNS, 'div');
		screen.setAttribute('id', this.kSCREEN);
		if (XMigemoService.isGecko18) {
			screen.setAttribute('gecko', '1.8');
			var pageSize = this.getPageSize(doc.defaultView);
			screen.setAttribute(
				'style',
				'height: '+pageSize.height+'px !important;'+
				'width: '+pageSize.width+'px !important;'
			);
		}

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
			Array.slice(aFrame.frames).forEach(arguments.callee, this);
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

		Array.slice(aFrame.frames).forEach(function(aFrame) {
			this.toggleHighlightScreen(aHighlight, aFrame);
		}, this);

		if (!this.isDocumentHighlightable(aFrame.document)) return;

		if (!('__moz_xmigemoHighlightedScreenInitialized' in aFrame) && aHighlight)
			this.initializeHighlightScreen(aFrame, true);

		aFrame.__moz_xmigemoHighlightedScreen = aHighlight;

		if (aHighlight)
			aFrame.document.documentElement.setAttribute(this.kSCREEN, 'on');
		else
			aFrame.document.documentElement.removeAttribute(this.kSCREEN);
	},
 
	isDocumentHighlightable : function(aDocument) 
	{
		return (
			(aDocument instanceof HTMLDocument) ||
			(XMigemoUI.workForAnyXMLDocuments && (aDocument instanceof XMLDocument))
			);
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

		var range = XMigemoUI.textUtils.getFoundRange(aFrame) ||
					XMigemoUI.lastFoundRange;
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

		if (aRecursively)
			Array.slice(aFrame.frames)
				.forEach(function(aFrame) {
					this.clearAnimationStyleIn(aFrame, aRecursively);
				}, this);
	},
 
	clearAnimationStyle : function(aEndOfAnimation) 
	{
		if (!this.animationNode || !this.animationNode.parentNode) return;

		var doc = this.animationNode.ownerDocument;

		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				this.setStylePropertyValue(this.animationNode, 'top', 0);
				doc.documentElement.removeAttribute(this.kANIMATION);
				break;

			case this.STYLE_ZOOM:
				if (this.animationNode.getAttribute('class') != this.kANIMATION_NODE)
					return;
				if (aEndOfAnimation) {
					this.setStylePropertyValue(this.animationNode, 'font-size', '1em');
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
				var node = doc.createElementNS(XMigemoUI.kXHTMLNS, 'span');
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
				this.setStylePropertyValue(node, 'top', 0);
				this.setStylePropertyValue(node, 'bottom', 0);
				this.setStylePropertyValue(node, 'left', 0);
				this.setStylePropertyValue(node, 'right', 0);
				this.setStylePropertyValue(node, 'padding', 0);
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
				this.setStylePropertyValue(this.animationNode, 'top', '-'+(y * this.animationUnit)+'px');
				break;

			case this.STYLE_ZOOM:
				if (this.animationNode.getAttribute('class') != this.kANIMATION_NODE)
					return;
				var unit = parseInt(this.animationSize[this.STYLE_ZOOM] * Math.sin((180 - (180 * aStep)) * Math.PI / 180));
				var padding = this.animationUnit / 6;
				var vPos = (-(unit * 0.025 * this.animationUnit) - padding)+'px';
				this.setStylePropertyValue(this.animationNode, 'top', vPos);
				this.setStylePropertyValue(this.animationNode, 'bottom', vPos);
				var hPos = (-(unit * 0.05 * this.animationUnit) - padding)+'px';
				this.setStylePropertyValue(this.animationNode, 'left', hPos);
				this.setStylePropertyValue(this.animationNode, 'right', hPos);
				this.setStylePropertyValue(this.animationNode, 'font-size', Math.min(1.1, 1 + (unit * 0.02))+'em');
				break;
		}
	},
 
	setStylePropertyValue : function(aNode, aPropertyName, aValue) 
	{
		if ('style' in aNode) {
			var prop = aPropertyName
					.replace(/-[a-z]/g, function(aFound) {
						return aFound.charAt(1).toUpperCase();
					})
					.replace(/^Moz/, 'moz');
			aNode.style[prop] = aValue;
			return;
		}
		var style = aNode.getAttribute('style') || '';
		var regexp = new RegExp(';?\s*'+aPropertyName+'\s*:\s*[^;]*');
		style = style.replace(regexp, '')
				+ ';' + aPropertyName +' : ' + aValue;
		aNode.setAttribute('style', style);
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
			window.setTimeout(function(aSelf, aFrame, aScreenX, aScreenY, aClientX, aClientY) {
				if (aChecker && !aChecker()) {
					window.setTimeout(arguments.callee, 0, aSelf, aFrame, aScreenX, aScreenY, aClientX, aClientY);
					return;
				}
				var node = aSelf.getClickableElementFromPoint(aFrame, aScreenX, aScreenY, aClientX, aClientY);
				if (node) {
					var event = aFrame.document.createEvent('MouseEvents');
					args.push(node);
					event.initMouseEvent.apply(event, args);
					node.dispatchEvent(event);
					if ('focus' in node) node.focus();
				}
				if (aCallback) aCallback();
			}, 0, this, aEvent.view, aEvent.screenX, aEvent.screenY, aEvent.clientX, aEvent.clientY);
		}
	},
	 
	getClickableElementFromPoint : function(aWindow, aScreenX, aScreenY, aClientX, aClientY) 
	{
		if ('elementFromPoint' in aWindow.document) {
			try {
				if ('useFullZoom' in ZoomManager && ZoomManager.useFullZoom) {
					aClientX = aClientX * ZoomManager.zoom;
					aClientY = aClientY * ZoomManager.zoom;
				}
				return aWindow.document.elementFromPoint(aClientX, aClientY);
			}
			catch(e) {
			}
		}

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
 
