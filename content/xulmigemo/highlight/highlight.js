var XMigemoHighlight = { 
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
		window.removeEventListener('load', this, false);
		if (window
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.parent) // in subframe
			return;


		eval('gFindBar._updateStatusUI = '+gFindBar._updateStatusUI.toSource()
			.replace(
				'{',
				'{ if (arguments[0] != Components.interfaces.nsITypeAheadFind.FIND_NOTFOUND && XMigemoHighlight.strongHighlight) { XMigemoHighlight.highlightFocusedFound(); };'
			)
		);

		if ('gSearchWPOverlay' in window) { // SearchWP
			eval('gSearchWPOverlay.toggleHighlight = '+gSearchWPOverlay.toggleHighlight.toSource().replace(
				'gSearchWPHighlighting.toggleHighlight',
				'if (XMigemoHighlight.strongHighlight) XMigemoHighlight.toggleHighlightScreen(aHighlight);'+
				'gSearchWPHighlighting.toggleHighlight'
			));
		}
		else if ('gSearchWP' in window && 'Highlighting' in gSearchWP) {
			eval('gSearchWP.Highlighting.toggleHighlight = '+gSearchWP.Highlighting.toggleHighlight.toSource().replace(
				/(\}\)?)$/,
				<![CDATA[
					if (XMigemoHighlight.strongHighlight)
						XMigemoHighlight.toggleHighlightScreen(gSearchWP.Preferences.highlighted);
				$1]]>
			));
		}

		if (typeof GBL_Listener != 'undefined') { // Googlebar Lite
			eval('window.GBL_ToggleHighlighting = '+window.GBL_ToggleHighlighting.toSource().replace(
				'var hb = document.getElementById("GBL-TB-Highlighter");',
				<![CDATA[
					var hb = document.getElementById("GBL-TB-Highlighter");
					if (XMigemoHighlight.strongHighlight)
						XMigemoHighlight.toggleHighlightScreen(!hb.checked);
				]]>
			));
		}


		XMigemoService.addPrefListener(this);
		XMigemoService.firstListenPrefChange(this);

		XMigemoService.ObserverService.addObserver(this, 'XMigemo:highlightNodeReaday', false);

		var bar = XMigemoUI.findBar;
		bar.addEventListener('XMigemoFindBarOpen', this, false);
		bar.addEventListener('XMigemoFindBarClose', this, false);
		bar.addEventListener('XMigemoFindBarToggleHighlight', this, false);
		document.addEventListener('XMigemoFindAgain', this, false);
		document.addEventListener('XMigemoHighlightProgress', this, false);
		document.addEventListener('SubBrowserFocusMoved', this, false);

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
		document.removeEventListener('XMigemoFindAgain', this, false);
		document.removeEventListener('XMigemoHighlightProgress', this, false);
		document.removeEventListener('SubBrowserFocusMoved', this, false);

		window.removeEventListener('unload', this, false);
	},
 
	getBoxObjectFor : function(aNode) 
	{
		if ('getBoxObjectFor' in aNode.ownerDocument)
			return aNode.ownerDocument.getBoxObjectFor(aNode);

		if (!('boxObject' in this._boxObjectModule)) {
			Components.utils.import(
				'resource://xulmigemo-modules/boxObject.js',
				this._boxObjectModule
			);
		}
		return this._boxObjectModule
					.boxObject
					.getBoxObjectFor(aNode);
	},
	_boxObjectModule : {},
 
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
				if (this._eventCancelers.some(function(aCanceler) {
						return aCanceler.handleEvent(
							{ type : 'XMigemoHighlight:mousedown',
							  originalEvent : aEvent }
						);
					}))
					return;
				this.onMouseDown(aEvent);
				break;

			case 'mouseup':
				if (this._eventCancelers.some(function(aCanceler) {
						return aCanceler.handleEvent(
							{ type : 'XMigemoHighlight:mouseup',
							  originalEvent : aEvent }
						);
					}))
					return;
				this.onMouseUp(aEvent);
				break;

			case 'XMigemoFindBarOpen':
				window.setTimeout(function(aSelf) {
					if (XMigemoUI.hidden ||
						!aSelf.strongHighlight ||
						XMigemoUI.highlightCheck.disabled ||
						!XMigemoUI.highlightCheck.checked)
						return;
					aSelf.startListen();
					aSelf.toggleHighlightScreen(true);
				}, 0, this);
				break;

			case 'XMigemoFindBarClose':
				this.clearAnimationStyleIn(XMigemoUI.activeBrowser.contentWindow, true);
				this.stopAllAnimations();
				window.setTimeout(function(aSelf) {
					if (!aSelf.strongHighlight) return;
					aSelf.stopListen();
					aSelf.destroyHighlightScreen();
				}, 0, this);
				break;

			case 'XMigemoFindBarToggleHighlight':
				if (this.updateScreenStateTimer) {
					window.clearTimeout(this.updateScreenStateTimer);
					this.updateScreenStateTimer = null;
				}
				this.updateScreenStateTimer = window.setTimeout(function(aSelf, aHighlight) {
					aSelf.updateScreenStateTimer = null;
					if (!aSelf.strongHighlight) return;
					aSelf.toggleHighlightScreen(aHighlight);
					if (aHighlight)
						aSelf.startListen();
					else
						aSelf.stopListen();
				}, 10, this, aEvent.targetHighlight);
				break;

			case 'XMigemoFindAgain':
				if (this.animationStyle == this.STYLE_ZOOM)
					this.clearAnimationStyleIn(XMigemoUI.activeBrowser.contentWindow, true);
				this.stopAllAnimations()
				break;

			case 'XMigemoHighlightProgress':
				if (this.strongHighlight)
					aEvent.originalTarget.defaultView.setTimeout(function() {
						migemo.repaintHighlights(aEvent.originalTarget, false, false);
					}, 0);
				break;

			case 'SubBrowserFocusMoved':
				this.destroyHighlightScreen(aEvent.lastFocused.browser);
				break;
		}
	},
	_eventCancelers : [],
	registerEventCanceler : function(aCanceler)
	{
		if (this._eventCancelers.indexOf(aCanceler) < 0)
			this._eventCancelers.push(aCanceler);
	},
	unregisterEventCanceler : function(aCanceler)
	{
		var index = this._eventCancelers.indexOf(aCanceler);
		if (index > -1)
			this._eventCancelers.splice(index, 1);
	},
	
	onMouseDown : function(aEvent) 
	{
		if (aEvent.originalTarget.ownerDocument.defaultView.top == window.top ||
			XMigemoService.isEventFiredOnScrollBar(aEvent) ||
			!XMigemoUI.activeBrowser.contentWindow ||
			!XMigemoUI.activeBrowser.contentWindow.__moz_xmigemoHighlightedScreen)
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
			XMigemoService.isEventFiredOnScrollBar(aEvent) ||
			!XMigemoUI.activeBrowser.contentWindow ||
			!XMigemoUI.activeBrowser.contentWindow.__moz_xmigemoHighlightedScreen)
			return;

		var b = XMigemoUI.activeBrowser;
		if (b._autoScrollPopup)
			b._autoScrollPopup.hidePopup();

		this.toggleHighlightScreen(false);

		if (this.isGestureInProgress) return;

		var self = this;
		var checker = function() {
				var screen = XMigemoUI.activeBrowser.contentWindow.document.getElementById(self.kSCREEN);
				return !screen || !self.getBoxObjectFor(screen).width;
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
  
	startListen : function() 
	{
		if (this.listening) return;
		this.listening = true;
		var target = document.getElementById('appcontent') || XMigemoUI.browser;
		if (target) {
			target.addEventListener('mousedown', this, true);
			target.addEventListener('mouseup', this, true);
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
			this.insertHighlightScreen(aFrame.document);

		aFrame.__moz_xmigemoHighlightedScreenInitialized = true;
	},
	
	insertHighlightScreen : function(aDocument) 
	{
		var doc = aDocument;
		if (doc.getElementById(this.kSCREEN))
			return;

		if (!XMigemoService.useGlobalStyleSheets)
			XMigemoService.addStyleSheet('chrome://xulmigemo/content/highlight.css', doc);

		var bodies = doc.getElementsByTagName('body');
		if(bodies.length == 0)
			return;

		var objBody = bodies[0];

		var screen = doc.createElementNS(XMigemoUI.kXHTMLNS, 'div');
		screen.setAttribute('id', this.kSCREEN);

		objBody.insertBefore(screen, objBody.firstChild);
	},
  
	destroyHighlightScreen : function(aBrowser) 
	{
		XMigemoUI.doProcessForAllFrames(function(aFrame) {
			if (!(aFrame.document instanceof HTMLDocument)) return;
			aFrame.document.documentElement.removeAttribute(this.kSCREEN);
		}, this, aBrowser);
	},
 
	toggleHighlightScreen : function(aHighlight, aFrame) 
	{
		if (!aFrame)
			aFrame = XMigemoUI.activeBrowser.contentWindow;

		if (this.animationStyle == this.STYLE_ZOOM)
			this.clearAnimationStyleIn(aFrame, true);

		if (aFrame.__xulmigemo__highlightAnimationTask) {
			this.finishAnimation(aFrame.__xulmigemo__highlightAnimationTask.animationNode);
			XMigemoService.animationManager.removeTask(aFrame.__xulmigemo__highlightAnimationTask);
			aFrame.__xulmigemo__highlightAnimationTask = null;
		}

		Array.slice(aFrame.frames).forEach(function(aFrame) {
			this.toggleHighlightScreen(aHighlight, aFrame);
		}, this);

		var doc = aFrame.document;
		if (!this.isDocumentHighlightable(doc)) return;

		if (!('__moz_xmigemoHighlightedScreenInitialized' in aFrame) && aHighlight)
			this.initializeHighlightScreen(aFrame, true);

		aFrame.__moz_xmigemoHighlightedScreen = aHighlight;

		if (aHighlight)
			doc.documentElement.setAttribute(this.kSCREEN, 'on');
		else
			doc.documentElement.removeAttribute(this.kSCREEN);

		aFrame.setTimeout(function() { // do with delay, because XMigemoMarker also does it.
			migemo.repaintHighlights(doc, true, !aHighlight);
		}, 0);
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
		if (range) range = range.QueryInterface(Components.interfaces.nsIDOMRange);
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
		var w = aNode.ownerDocument.defaultView;
		this.clearAnimationStyleIn(w);
		this.stopAllAnimations();

		var animationNode = this.initAnimation(aNode);

		var self = this;
		var updateAnimationStyle;

		/*
			0～180°の間のsinθの変化（0～1～0）を使う。
			度数をradianに変換する式は θ * Math.PI / 180なので、
			sinθ = Math.sin(θ * Math.PI / 180)
			      = Math.sin(((aTime / aDuration) * 180) * Math.PI / 180)
			      = Math.sin(aTime / aDuration * 180 * Math.PI / 180)
			      = Math.sin(aTime / aDuration * Math.PI)
		*/
		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				updateAnimationStyle = function(aTime, aBeginning, aChange, aDuration) {
					var factor = Math.sin(aTime / aDuration * Math.PI);
					var y = parseInt(self.animationSize[self.STYLE_JUMP] * factor);
					self.setStylePropertyValue(animationNode, 'top', '-'+(y * self.animationUnit)+'px');
				};
				break;

			case this.STYLE_ZOOM:
				updateAnimationStyle = function(aTime, aBeginning, aChange, aDuration) {
					if (animationNode.getAttribute('class') != self.kANIMATION_NODE)
						return;
					var factor = Math.sin(aTime / aDuration * Math.PI);
					var unit = parseInt(self.animationSize[self.STYLE_ZOOM] * factor);
					var padding = self.animationUnit / 6;
					var vPos = (-(unit * 0.025 * self.animationUnit) - padding)+'px';
					self.setStylePropertyValue(animationNode, 'top', vPos);
					self.setStylePropertyValue(animationNode, 'bottom', vPos);
					var hPos = (-(unit * 0.05 * self.animationUnit) - padding)+'px';
					self.setStylePropertyValue(animationNode, 'left', hPos);
					self.setStylePropertyValue(animationNode, 'right', hPos);
					self.setStylePropertyValue(animationNode, 'font-size', Math.min(1.1, 1 + (unit * 0.02))+'em');
				};
				break

			default:
				updateAnimationStyle = function() {
				};
		}

		w.__xulmigemo__highlightAnimationTask = function(aTime, aBeginning, aChange, aDuration) {
			var finished;
			updateAnimationStyle(aTime, aBeginning, aChange, aDuration);
			if (aTime >= aDuration || !animationNode.parentNode) {
				w.__xulmigemo__highlightAnimationTask = null;
				finished = true;
			}
			else {
				finished = false;
			}
			return finished;
		};
		w.__xulmigemo__highlightAnimationTask.animationNode = animationNode;
		XMigemoService.animationManager.addTask(
			w.__xulmigemo__highlightAnimationTask,
			0, 0, this.animationDuration
		);
	},
	animationDuration : 250,
   
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
 
	finishAnimation : function(aNode, aEndOfAnimation) 
	{
		if (!aNode || !aNode.parentNode) return aNode;

		var doc = aNode.ownerDocument;

		switch (this.animationStyle)
		{
			case this.STYLE_JUMP:
				this.setStylePropertyValue(aNode, 'top', 0);
				doc.documentElement.removeAttribute(this.kANIMATION);
				break;

			case this.STYLE_ZOOM:
				if (aNode.getAttribute('class') != this.kANIMATION_NODE)
					return;
				if (aEndOfAnimation) {
					this.setStylePropertyValue(aNode, 'font-size', '1em');
					return;
				}
				var parent = aNode.parentNode;
				var doc = aNode.ownerDocument;
				var range = doc.createRange();
				range.selectNode(aNode);
				range.deleteContents();
				range.detach();
				aNode = parent;
				doc.documentElement.removeAttribute(this.kANIMATION);
				break;
		}

		return aNode;
	},
 
	initAnimation : function(aNode) 
	{
		if (!aNode) return aNode;

		var doc = aNode.ownerDocument;
		doc.documentElement.setAttribute(this.kANIMATION, true);

		switch (this.animationStyle)
		{
			case this.STYLE_ZOOM:
				var focusedNode = aNode;
				var node = doc.createElementNS(XMigemoUI.kXHTMLNS, 'span');
				node.setAttribute('class', this.kANIMATION_NODE);

				var range = doc.createRange();
				range.selectNodeContents(aNode);
				var contents = range.cloneContents(true);

				range.collapse(false);
				range.insertNode(node);

				// anonymous contentsの中に挿入した内容は検索されない。
				// （複製した内容は検索されて欲しくないのでこうする）
				var box = doc.getAnonymousNodes(node);
				var insertContents = function(aTarget, aContents) {
						var box = aTarget.ownerDocument.getAnonymousNodes(aTarget);
						if (!box || !box.length)
							return false;
						box = box[0];
						box.appendChild(aContents);
						return true;
					};
				if (!insertContents(node, contents))
					window.setTimeout(insertContents, 0, node, contents);

//				range.detach();

				aNode = node;
				this.setStylePropertyValue(node, 'top', 0);
				this.setStylePropertyValue(node, 'bottom', 0);
				this.setStylePropertyValue(node, 'left', 0);
				this.setStylePropertyValue(node, 'right', 0);
				this.setStylePropertyValue(node, 'padding', 0);

				// DOM modification breaks higlight selections
				if (doc.documentElement.getAttribute(this.kSCREEN) != 'on')
					migemo.repaintHighlights(doc, false, true);

				range.selectNodeContents(focusedNode);
				var selection = doc.defaultView.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				XMigemoUI.textUtils.setSelectionLook(doc, true);
				break;
		}

		return aNode;
	},
 
	stopAllAnimations : function() 
	{
		var self = this;
		(function(aFrame) {
			var task = aFrame.__xulmigemo__highlightAnimationTask;
			if (task) {
				self.finishAnimation(task);
				self.finishAnimation(task.animationNode);
				XMigemoService.animationManager.removeTask(task);
				aFrame.__xulmigemo__highlightAnimationTask = null;
			}
			Array.slice(aFrame.frames).forEach(arguments.callee);
		})(XMigemoUI.activeBrowser.contentWindow);
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
			var box = this.getBoxObjectFor(aWindow.document.documentElement);
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
			var box = this.getBoxObjectFor(node);
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
 
