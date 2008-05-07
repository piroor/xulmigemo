/* 
	This depends on:
		service.js
*/

var XMigemoFind;
 
var XMigemoUI = { 
	 
	FIND_MODE_NATIVE : Components.interfaces.pIXMigemoFind.FIND_MODE_NATIVE, 
	FIND_MODE_MIGEMO : Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : Components.interfaces.pIXMigemoFind.FIND_MODE_REGEXP,

	forcedFindMode   : -1,
	lastFindMode     : -1,
	backupFindMode   : -1,
 
	autoStartQuickFind       : false, 
	autoExitQuickFindInherit : true,
	autoExitQuickFind        : true,
	timeout                  : 0,

	autoStartRegExpFind      : false,

	highlightCheckedAlways     : false,
	highlightCheckedAlwaysMinLength : 2,
	caseSensitiveCheckedAlways : false,
	migemoCheckedAlways        : false,

	shouldRebuildSelection : false,

	isModeChanged : false,

	ATTR_LAST_HIGHLIGHT : '_moz-xulmigemo-last-highlight',
 
	nsITypeAheadFind : Components.interfaces.nsITypeAheadFind, 
	nsIDOMNSEditableElement : Components.interfaces.nsIDOMNSEditableElement,
 
	get textUtils() 
	{
		if (!this._textUtils) {
			this._textUtils = Components
				.classes['@piro.sakura.ne.jp/xmigemo/text-utility;1']
				.getService(Components.interfaces.pIXMigemoTextUtils);
		}
		return this._textUtils;
	},
	_textUtils : null,
 
/* elements */ 
	
	get browser() 
	{
		return document.getElementById('content') || // Firefox
			document.getElementById('messagepane') || // Thunderbird
			document.getElementById('help-content'); // Help
	},
 
	get activeBrowser() 
	{
		return ('SplitBrowser' in window ? SplitBrowser.activeBrowser : null ) ||
			this.browser;
	},
 
	get findMigemoBar() 
	{
		if (!this._findMigemoBar) {
			this._findMigemoBar = document.getElementById('XMigemoFindToolbar');
		}
		return this._findMigemoBar;
	},
	_findMigemoBar : null,
 
	get findBar() 
	{
		if (!this._findBar) {
			this._findBar = document.getElementById('FindToolbar');
		}
		return this._findBar;
	},
	_findBar : null,
 
	get findField() 
	{
		if (this._findField === void(0)) {
			this._findField = document.getElementById('find-field');
			if (!this._findField && this.findBar) {
				this._findField = this.findBar.getElement('findbar-textbox');
			}
		}
		return this._findField;
	},
//	_findField : null,
 
	get findCaseSensitiveCheck() 
	{
		if (this._findCaseSensitiveCheck === void(0)) {
			this._findCaseSensitiveCheck = document.getElementById('find-case-sensitive');
			if (!this._findCaseSensitiveCheck && this.findBar) {
				this._findCaseSensitiveCheck = this.findBar.getElement('find-case-sensitive');
			}
		}
		return this._findCaseSensitiveCheck;
	},
//	_findCaseSensitiveCheck : null,
 
	get findHighlightCheck() 
	{
		if (this._findHighlightCheck === void(0)) {
			this._findHighlightCheck = document.getElementById('highlight');
			if (!this._findHighlightCheck && this.findBar) {
				this._findHighlightCheck = this.findBar.getElement('highlight');
			}
		}
		return this._findHighlightCheck;
	},
//	_findHighlightCheck : null,
 
	get findModeSelector() 
	{
		if (!this._findModeSelector) {
			this._findModeSelector = document.getElementById('find-mode-selector');
		}
		return this._findModeSelector;
	},
	_findModeSelector : null,
 
	get migemoModeBox() 
	{
		if (!this._migemoModeBox) {
			this._migemoModeBox = document.getElementById('find-migemo-mode-box');
		}
		return this._migemoModeBox;
	},
	_migemoModeBox : null,
 
	get timeoutIndicator() 
	{
		if (!this._timeoutIndicator) {
			this._timeoutIndicator = ('gFindBar' in window && 'onFindAgainCommand' in gFindBar) ? document.getElementById('migemo-timeout-indicator2') : document.getElementById('migemo-timeout-indicator');
		}
		return this._timeoutIndicator;
	},
	_timeoutIndicator : null,
 
	get timeoutIndicatorBox() 
	{
		if (!this._timeoutIndicatorBox) {
			this._timeoutIndicatorBox = ('gFindBar' in window && 'onFindAgainCommand' in gFindBar) ? document.getElementById('migemo-timeout-indicator2') : document.getElementById('migemo-timeout-indicator-box');
		}
		return this._timeoutIndicatorBox;
	},
	_timeoutIndicatorBox : null,
  
/* status */ 
	
	get isQuickFind() 
	{
		return XMigemoFind.isQuickFind;
	},
	set isQuickFind(val)
	{
		XMigemoFind.isQuickFind = val;
		return XMigemoFind.isQuickFind;
	},
 
	get findMode() 
	{
		return parseInt(this.findModeSelector.value || this.FIND_MODE_NATIVE);
	},
	set findMode(val)
	{
		var mode = parseInt(val);
		switch (mode)
		{
			case this.FIND_MODE_MIGEMO:
			case this.FIND_MODE_REGEXP:
			case this.FIND_MODE_NATIVE:
				this.findModeSelector.value = mode;
				break;

			default:
				this.findModeSelector.value = mode = this.FIND_MODE_NATIVE;
				break;
		}
		return mode;
	},
 
	get findTerm() 
	{
		try {
			return this.findField.value.replace(/^\s+|\s+$/g, '');
		}
		catch(e) {
		}
		return '';
	},
	set findTerm(val)
	{
		try {
			if (this.findField)
				this.findField.value = val;
		}
		catch(e) {
		}
		return this.findTerm;
	},
 
	get findBarHidden() 
	{
		return (this.findBar.getAttribute('collapsed') == 'true' ||
				this.findBar.getAttribute('hidden') == 'true');
	},
 
	get findFieldIsFocused() 
	{
		try {
			var focused = document.commandDispatcher.focusedElement;
			var xpathResult = document.evaluate(
					'ancestor-or-self::*[local-name()="textbox"]',
					focused,
					this.NSResolver,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			return xpathResult.singleNodeValue == this.findField;
		}
		catch(e) {
		}
		return false;
	},
 
	get shouldHighlightAll() 
	{
		var term = this.findTerm;
		if (!this.highlightCheckedAlways)
			return term.length ? true : false ;

		var minLength = this.highlightCheckedAlwaysMinLength;
		return (
				(minLength <= term.length) &&
				(
					!this.isActive ||
					minLength <= Math.max.apply(
						null,
						XMigemoCore.regExpFindArrRecursively(
							new RegExp(
								(
									this.findMode == this.FIND_MODE_REGEXP ?
										this.textUtils.extractRegExpSource(term) :
										XMigemoCore.getRegExp(term)
								),
								'im'
							),
							this.activeBrowser.contentWindow,
							true
						).map(function(aItem) {
							return (aItem || '').length;
						})
					)
				)
			);
	},
  
/* nsIPrefListener(?) */ 
	
	domain  : 'xulmigemo', 
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.autostart':
				this.autoStartQuickFind = value;
				return;

			case 'xulmigemo.enableautoexit.inherit':
				this.autoExitQuickFindInherit = value;
				return;

			case 'xulmigemo.enableautoexit.nokeyword':
				this.autoExitQuickFind = value;
				return;

			case 'xulmigemo.autostart.regExpFind':
				this.autoStartRegExpFind = value;
				return;

			case 'xulmigemo.checked_by_default.highlight.always':
				this.highlightCheckedAlways = value;
				return;

			case 'xulmigemo.checked_by_default.highlight.always.minLength':
				this.highlightCheckedAlwaysMinLength = value;
				return;

			case 'xulmigemo.checked_by_default.caseSensitive.always':
				this.caseSensitiveCheckedAlways = value;
				return;

			case 'xulmigemo.findMode.always':
				this.forcedFindMode = value;
				return;

			case 'xulmigemo.timeout':
				this.timeout = value;
				if (this.timeout === null)
					this.timeout = value;
				return;

			case 'xulmigemo.shortcut.findForward':
				this.findForwardKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.findBackward':
				this.findBackwardKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.manualStart':
				this.manualStartKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.manualStart2':
				this.manualStartKey2 = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly':
				this.manualStartLinksOnlyKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly2':
				this.manualStartLinksOnlyKey2 = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.manualExit':
				this.manualExitKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.shortcut.goDicManager':
				this.goDicManagerKey = XMigemoService.parseShortcut(value);
				return;

			case 'xulmigemo.appearance.hideLabels':
				var caseSensitive = this.findCaseSensitiveCheck;
				var nodes = this.findModeSelector.childNodes;
				if (value) {
					caseSensitive.setAttribute('tooltiptext', caseSensitive.getAttribute('long-label'));
					caseSensitive.setAttribute('label', caseSensitive.getAttribute('short-label'));
					for (var i = 0, maxi = nodes.length; i < maxi; i++)
						nodes[i].setAttribute('label', nodes[i].getAttribute('short-label'));
					this.findBar.setAttribute('labelhidden', true);
				}
				else {
					caseSensitive.removeAttribute('tooltiptext');
					caseSensitive.setAttribute('label', caseSensitive.getAttribute('long-label'));
					for (var i = 0, maxi = nodes.length; i < maxi; i++)
						nodes[i].setAttribute('label', nodes[i].getAttribute('long-label'));
					this.findBar.removeAttribute('labelhidden');
				}
				return;

			case 'xulmigemo.appearance.indicator.height':
				var node = this.timeoutIndicator;
				if (value) {
					node.style.minHeight = value+'px';
					node.style.maxHeight = value+'px';
				}
				else {
					node.style.minHeight = 'none';
					node.style.maxHeight = 'auto';
				}
				return;

			case 'xulmigemo.rebuild_selection':
				this.shouldRebuildSelection = value;
				return;
		}
	},
  
/* utilities */ 
	 
	getEditableNodes : function(aDocument) 
	{
		return aDocument.evaluate(
				[
					'descendant::*[',
						'local-name()="TEXTAREA" or local-name()="textarea" or ',
						'((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))',
					']'
				].join(''),
				aDocument,
				this.NSResolver,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
	},
 
	clearSelectionInEditable : function(aFrame) 
	{
		var xpathResult = this.getEditableNodes(aFrame.document);
		try {
			var selCon, selection;
			for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
			{
				selCon = xpathResult.snapshotItem(i)
					.QueryInterface(this.nsIDOMNSEditableElement)
					.editor
					.selectionController;
				if (selCon.getDisplaySelection() == selCon.SELECTION_ON &&
					(selection = selCon.getSelection(selCon.SELECTION_NORMAL)) &&
					selection.rangeCount)
					selection.removeAllRanges();
			}
		}
		catch(e) {
		}
		var self = this;
		Array.prototype.slice.call(aFrame.frames)
			.some(function(aFrame) {
				self.clearSelectionInEditable(aFrame);
			});
	},
 	 
	handleEvent : function(aEvent) /* DOMEventListener */ 
	{
		switch (aEvent.type)
		{
			case 'input':
				this.onInput(aEvent);
				return;

			case 'keypress':
				this.keyEvent(aEvent, aEvent.currentTarget == this.findField);
				return;

			case 'mouseup':
				this.mouseEvent(aEvent);
				return;

			case 'XMigemoFindProgress':
				this.onXMigemoFindProgress(aEvent);
				return;

			case 'XMigemoFindAgain':
				if (!this.isActive &&
					this.lastFindMode == this.FIND_MODE_NATIVE &&
					this.findHighlightCheck.checked) {
					window.setTimeout(function(aSelf) {
						aSelf.clearSelectionInEditable(aSelf.activeBrowser.contentWindow);
					}, 0, this);
				}
				return;

			case 'blur':
				this.onBlur(aEvent);
				return;

			case 'load':
				this.init();
				return;

			case 'unload':
				this.destroy();
				return;

			case 'SubBrowserFocusMoved':
				XMigemoFind.target = this.activeBrowser;
				return;

			default:
		}
	},
	
	keyEvent : function(aEvent, aFromFindField) 
	{
		if (
			this.processFunctionalKeyEvent(aEvent, aFromFindField) || // XUL/Migemoの終了その他のチェック
			this.processFunctionalShortcuts(aEvent, aFromFindField) ||
			this.processKeyEvent(aEvent, aFromFindField)
			)
			return;
	},
	
	isEventFiredInInputField : function(aEvent) 
	{
		try { // in rich-textarea (ex. Gmail)
			var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
			if (Components.lookupMethod(doc, 'designMode').call(doc) == 'on')
				return true;

			var win = Components.lookupMethod(doc, 'defaultView').call(doc);;
			var editingSession = win.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIWebNavigation)
								.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
								.getInterface(Components.interfaces.nsIEditingSession);
			if (editingSession.windowIsEditable(win)) return true;
		}
		catch(e) {
		}

		try { // in rich-textarea (ex. Gmail)
			var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
			if (Components.lookupMethod(doc, 'designMode').call(doc) == 'on')
				return true;
		}
		catch(e) {
		}

		if (
			/^(input|textarea|textbox|select|isindex|object|embed)$/i.test(
				Components.lookupMethod(
					aEvent.originalTarget,
					'localName'
				).call(aEvent.originalTarget)
			)
			) return true;

		return false;
	},
 
	isEventFiredInFindableDocument : function(aEvent) 
	{
		var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
		var contentType = Components.lookupMethod(doc, 'contentType').call(doc);
		return /^text\/|\+xml$|^application\/((x-)?javascript|xml)$/.test(contentType);
	},
 
	processFunctionalShortcuts : function(aEvent, aFromFindField) 
	{
		if (
			this.isEventFiredInInputField(aEvent) &&
			!(
				aEvent.charCode == 0 ||
				aEvent.altKey ||
				aEvent.ctrlKey ||
				aEvent.metaKey
			)
			)
			return false;

		if (aFromFindField && this.isActive && !this.isQuickFind)
			return false;

		var shouldGoDicManager   = XMigemoService.checkShortcutForKeyEvent(this.goDicManagerKey, aEvent);
		var isForwardKey         = XMigemoService.checkShortcutForKeyEvent(this.findForwardKey, aEvent);
		var isBackwardKey        = XMigemoService.checkShortcutForKeyEvent(this.findBackwardKey, aEvent);
		var isStartKey           = XMigemoService.checkShortcutForKeyEvent(this.manualStartKey, aEvent);
		var isStartKey2          = XMigemoService.checkShortcutForKeyEvent(this.manualStartKey2, aEvent);
		var isStartKeyLinksOnly  = XMigemoService.checkShortcutForKeyEvent(this.manualStartLinksOnlyKey, aEvent);
		var isStartKeyLinksOnly2 = XMigemoService.checkShortcutForKeyEvent(this.manualStartLinksOnlyKey2, aEvent);
		var isExitKey            = XMigemoService.checkShortcutForKeyEvent(this.manualExitKey, aEvent);

		if (shouldGoDicManager) {
			XMigemoService.goDicManager();
			aEvent.preventDefault();
			return true;
		}

		if (!this.isEventFiredInFindableDocument(aEvent))
			return false;

		if (isForwardKey || isBackwardKey) {
			aEvent.preventDefault();

			if (isForwardKey)
				XMigemoFind.findNext(false);
			else if (isBackwardKey)
				XMigemoFind.findPrevious(false);

			if (this.cancelTimer)
				this.startTimer();

//			dump("PrevKeyword:"+XMigemoFind.previousKeyword+"\nCurrentKeyword:"+XMigemoFind.lastKeyword+'\n')
			return true;
		}

		if (
			!this.isActive &&
			(
				!this.autoStartQuickFind ||
				aEvent.charCode == 0 ||
				aEvent.altKey ||
				aEvent.ctrlKey ||
				aEvent.metaKey
			) &&
			(
				isStartKey ||
				isStartKey2 ||
				isStartKeyLinksOnly ||
				isStartKeyLinksOnly2
			)
			) {
			XMigemoFind.clear(false);
			this.start();
			this.findField.focus();
			XMigemoFind.isLinksOnly = (isStartKeyLinksOnly || isStartKeyLinksOnly2) ? true : false ;
			aEvent.preventDefault();
			return true;
		}


		if (isExitKey) {
			aEvent.preventDefault();

			this.cancel();
			this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
			var win = document.commandDispatcher.focusedWindow;
			var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.activeBrowser.contentDocument;
			XMigemoFind.setSelectionLook(doc, false);

			return true;
		}

		return false;
	},
 
	processFunctionalKeyEvent : function(aEvent, aFromFindField) 
	{
		if (!this.isActive) return false;

		switch (aEvent.keyCode)
		{
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE:
				if (XMigemoFind.lastKeyword.length == 0) {
					this.cancel();
					return true;
				}
				else if (XMigemoFind.lastKeyword.length == 1) {
					aEvent.preventDefault();
				}
				XMigemoFind.removeKeyword(1);
				this.updateStatus(XMigemoFind.lastKeyword);
				if (
					XMigemoFind.lastKeyword == '' &&
					(this.autoExitQuickFindInherit ? this.autoStartQuickFind : this.autoExitQuickFind )
					) {
					this.cancel();
				}
				else {
					aEvent.preventDefault();
					this.delayedFind();
					this.restartTimer();
				}
				return true;

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER:
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN:
				if (aFromFindField && this.isQuickFind) {
					aEvent.stopPropagation();
					aEvent.preventDefault();
					this.dispatchKeyEventForLink(aEvent, this.activeBrowser.contentWindow);
				}
				this.cancel();
				this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
				return true;

			default:
				return false;
		}
	},
	dispatchKeyEventForLink : function(aEvent, aFrame)
	{
		var self = this;
		if (
			aFrame.frames &&
			Array.prototype.slice.call(aFrame.frames).some(function(aFrame) {
				return self.dispatchKeyEventForLink(aEvent, aFrame);
			})
			)
			return true;

		var selection = aFrame.getSelection();
		if (selection && selection.rangeCount) {
			var range = selection.getRangeAt(0);
			var foundLink = this.findParentLink(range);
			if (foundLink) {
				var event = aFrame.document.createEvent('KeyEvents');
				event.initKeyEvent(
					aEvent.type,
					aEvent.bubbles,
					aEvent.cancelable,
					aEvent.view,
					aEvent.ctrlKey,
					aEvent.altKey,
					aEvent.shiftKey,
					aEvent.metaKey,
					aEvent.keyCode,
					aEvent.charCode
				);
				foundLink.dispatchEvent(event);
				return true;
			}
		}
		return false;
	},
	findParentLink : function(aRange)
	{
		var node = aRange.commonAncestorContainer;
		while (node && node.parentNode)
		{
			if (String(node.localName).toLowerCase() == 'a') {
				return node;
			}
			node = node.parentNode;
		}
		return null;
	},
 
	processKeyEvent : function(aEvent, aFromFindField) 
	{
		if (
			(this.isEventFiredInInputField(aEvent) && !this.isActive) ||
			!this.isEventFiredInFindableDocument(aEvent)
			)
			return false;

		if (this.isActive) {
//			dump("migemo is active"+'\n');
			if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
				) { //普通。フックする。
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
				this.findField.focus();
				aEvent.preventDefault();
				this.delayedFind();
				this.restartTimer();
				return true;
			}
		}
		else if (this.autoStartQuickFind) {
//			dump("autoStartQuickFind:"+this.autoStartQuickFind+'\n');
			if (aEvent.charCode == 32) { // Space
				return true;
			}
			else if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.metaKey &&
				!aEvent.altKey
				) {
				XMigemoFind.clear(false);
				this.start();
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
				this.findField.focus();
				aEvent.preventDefault();
				this.delayedFind();
				this.restartTimer();
				return true;
			}
		}
	},
	delayedFind : function()
	{
		if (this.delayedFindTimer) {
			window.clearTimeout(this.delayedFindTimer);
			this.delayedFindTimer = null;
		}
		this.delayedFindTimer = window.setTimeout(this.delayedFindCallback, XMigemoService.getPref('xulmigemo.find_delay'));
	},
	delayedFindCallback : function()
	{
		XMigemoUI.find();
		XMigemoUI.delayedFindTimer = null;
	},
	delayedFindTimer : null,
  
	mouseEvent : function(aEvent) 
	{
		if (!this.isQuickFind) {
			this.isActive = false;
			return;
		}

//		dump("mouseEvent.originalTarget:"+aEvent.originalTarget.tagName.toLowerCase()+'\n');
		this.cancel();
		this.clearTimer();//ここでタイマーを殺さないといじられてしまう。タイマー怖い。
	},
 
	onXMigemoFindProgress : function(aEvent) 
	{
		var statusRes = (
				 XMigemoFind.isLinksOnly ?
				 	aEvent.resultFlag & XMigemoFind.FOUND_IN_LINK :
					aEvent.resultFlag & XMigemoFind.FOUND
			) ?
				this.nsITypeAheadFind.FIND_FOUND :
			(aEvent.resultFlag & XMigemoFind.WRAPPED) ?
				this.nsITypeAheadFind.FIND_WRAPPED :
				this.nsITypeAheadFind.FIND_NOTFOUND;

		var found = (statusRes == this.nsITypeAheadFind.FIND_FOUND || statusRes == this.nsITypeAheadFind.FIND_WRAPPED);
		gFindBar.enableFindButtons(found);
		if (found && this.findHighlightCheck.checked)
			gFindBar.setHighlightTimeout();

		gFindBar.updateStatus(statusRes, !(aEvent.findFlag & XMigemoFind.FIND_BACK));
	},
 
	onInput : function(aEvent) 
	{
		XMigemoFind.replaceKeyword(aEvent.target.value);

		if (this.autoStartRegExpFind && !this.isQuickFind) {
			var isRegExp = this.textUtils.isRegExp(aEvent.target.value);
			if (this.findMode != this.FIND_MODE_REGEXP &&
				isRegExp) {
				this.backupFindMode = this.findMode;
				this.findMode = this.FIND_MODE_REGEXP;
			}
			else if (this.findMode == this.FIND_MODE_REGEXP &&
					!isRegExp &&
					this.backupFindMode > -1) {
				this.findMode = this.backupFindMode;
				this.backupFindMode = -1;
			}
		}

		if (this.findMode != this.FIND_MODE_NATIVE) {
			this.start(true);
			aEvent.stopPropagation();
			aEvent.preventDefault();
			this.delayedFind();
		}
		else {
			this.lastFindMode = this.FIND_MODE_NATIVE;
		}
	},
 
	onBlur : function() 
	{
		if (this.isQuickFind)
			this.cancel();
	},
 
	onChangeFindToolbarMode : function() 
	{
		this.clearTimer();
		gFindBar.toggleHighlight(false);
		var keyword = this.findTerm;
		if (this.findMode != this.FIND_MODE_NATIVE) {
			this.start(true);
			this.isModeChanged = true;
		}
		else {
			this.cancel(true);
			this.lastFindMode = this.FIND_MODE_NATIVE;
			this.isModeChanged = true;
		}

		this.findField.focus();
	},
 
	// flip back to another find mode
	onClickFindToolbarMode : function(aEvent) 
	{
		if (!aEvent.target.selected) return;

		aEvent.stopPropagation();
		aEvent.preventDefault();

		window.setTimeout(function(aSelf, aValue) {
			aSelf.findMode = aValue == aSelf.FIND_MODE_NATIVE ?
				aSelf.FIND_MODE_MIGEMO :
				aSelf.FIND_MODE_NATIVE ;
			aSelf.onChangeFindToolbarMode();
		}, 0, this, aEvent.target.value);
	},
 
	onFindStartCommand : function() 
	{
		if (this.findBarHidden || this.isQuickFind) return;

		if (!this.findFieldIsFocused) return;

		window.setTimeout(function(aSelf) {
			aSelf.onFindStartCommandCallback();
		}, 0, this);
	},
	onFindStartCommandCallback : function()
	{
		switch (XMigemoService.getPref('xulmigemo.shortcut.openAgain'))
		{
			case 1:
				var selector = this.findModeSelector;
				var items = selector.childNodes;
				this.findMode = items[(selector.selectedIndex + 1) % (items.length)].value;
				this.onChangeFindToolbarMode();
				break;

			case 2:
				gFindBar.closeFindBar();
				break;
		}
	},
  
/* timer */ 
	
/* Cancel Timer */ 
	cancelTimer : null,
	 
	startTimer : function() 
	{
//		dump("xmigemoStartTimer"+'\n');
		if (!this.isQuickFind) return;
		this.clearTimer();
		this.cancelTimer = window.setTimeout(this.timerCallback, this.timeout, this);
		this.updateTimeoutIndicator(this.timeout);
	},
	 
	timerCallback : function(aThis) 
	{
//		dump("xmigemoTimeout"+'\n');
		XMigemoFind.shiftLastKeyword();
		aThis.cancel();
	},
  
	restartTimer : function() 
	{
		if (!this.isQuickFind) return;
		if (XMigemoService.getPref('xulmigemo.enabletimeout'))
			this.startTimer();
	},
 
	clearTimer : function() 
	{
//		dump("xmigemoClearTimer"+'\n');
		if (this.cancelTimer) {
			window.clearTimeout(this.cancelTimer);
			this.cancelTimer = null;
		}
		if (this.indicatorTimer) {
			window.clearTimeout(this.indicatorTimer);
			this.indicatorTimer = null;
		}
	},
  
/* Indicator Timer */ 
	indicatorTimer : null,
	indicatorStartTime : null,

	updateTimeoutIndicator : function(aTimeout, aCurrent, aThis)
	{
		aThis = aThis || this;
		if (!aThis.timeoutIndicator) return;

		if (aThis.indicatorTimer) {
			window.clearTimeout(aThis.indicatorTimer);
			aThis.indicatorTimer = null;
		}

		var value = 0;
		if (aTimeout > -1) {
			if (aCurrent === void(0)) {
				aThis.indicatorStartTime = (new Date()).getTime();
				aCurrent = aTimeout;
			}

			value = Math.min(100, parseInt((aCurrent / aTimeout) * 100));
		}

		if (value <= 0) {
			aThis.timeoutIndicator.removeAttribute('value');
			aThis.timeoutIndicatorBox.setAttribute('hidden', true);
			if (aThis.indicatorStartTime)
				aThis.indicatorStartTime = null;
		}
		else if (XMigemoService.getPref('xulmigemo.enabletimeout.indicator')) {
			aThis.timeoutIndicator.setAttribute('value', value+'%');
			aThis.timeoutIndicatorBox.removeAttribute('hidden');
			aThis.timeoutIndicatorBox.style.right = (
				document.documentElement.boxObject.width
				- aThis.findBar.boxObject.x
				- aThis.findBar.boxObject.width
			)+'px';
			aThis.timeoutIndicatorBox.style.bottom = (
				document.documentElement.boxObject.height
				- aThis.findBar.boxObject.y
				- aThis.findBar.boxObject.height
			)+'px';

			aCurrent = aTimeout - parseInt(((new Date()).getTime() - aThis.indicatorStartTime));

			aThis.indicatorTimer = window.setTimeout(arguments.callee, 50, aTimeout, aCurrent, aThis);
		}
	},
  
	start : function(aSilently) 
	{
//		dump('xmigemoStart\n');
		this.isActive = true;

		if (!aSilently) {
			if (!this.isQuickFind) {
				this.isQuickFind = true;
				this.backupFindMode = this.findMode;
				this.findMode = this.FIND_MODE_MIGEMO;
			}

			if (XMigemoService.getPref('xulmigemo.enabletimeout'))
				this.startTimer();
		}

		this.lastFindMode = this.findMode;

		if (this.findBarHidden)
			gFindBar.openFindBar();
		else
			this.toggleFindToolbarMode();

		if (this.findTerm != XMigemoFind.lastKeyword)
			this.findTerm = XMigemoFind.lastKeyword;
	},
 
	cancel : function(aSilently) 
	{
//		dump("xmigemoCancel"+'\n');
		this.isActive = false;

		if (!aSilently) XMigemoFind.clear(this.isQuickFind);

		if (!aSilently || this.isQuickFind)
			gFindBar.closeFindBar();
		else
			this.toggleFindToolbarMode();

		if (this.isQuickFind) {
			this.findMode = this.backupFindMode;
			this.backupFindMode = -1;
			this.isQuickFind = false;
		}

		if (this.delayedFindTimer) {
			window.clearTimeout(this.delayedFindTimer);
			this.delayedFindTimer = null;
		}

		this.updateTimeoutIndicator(-1);
		this.clearTimer();
	},
 
	find : function() 
	{
		XMigemoFind.findMode = this.findMode;
		XMigemoFind.find(false, XMigemoFind.lastKeyword, false);
	},
 
	findAgain : function(aKeyword, aMode) 
	{
		if (aMode != this.FIND_MODE_NATIVE) {
			XMigemoFind.replaceKeyword(aKeyword);
			this.updateStatus(aKeyword);
			this.find();
		}
		else {
			var w = document.commandDispatcher.focusedWindow;
			var d = w.top.document == window.top.document ? _content.document : w.document ;
			if (d) {
				if (d.foundEditable) {
					d.foundEditable
						.QueryInterface(this.nsIDOMNSEditableElement)
						.editor.selection.removeAllRanges();
					d.foundEditable = null;
				}
				d.defaultView.getSelection().removeAllRanges();
			}
			gFindBar.find();
		}
	},
 
/* Override FindBar */ 
	
	overrideFindBar : function() 
	{
		/*
			基本ポリシー：
			Firefox 1.x～2.0～3.0の間でメソッド名などが異なる場合は、
			すべてFirefox 2.0に合わせる。
		*/
		var updateGlobalFunc = false;

		var bar = document.getElementById('FindToolbar');
		if (bar &&
			bar.localName == 'findbar' &&
			!('gFindBar' in window))
			window.gFindBar = bar;

		if ('gFindBar' in window) {
			gFindBar.xmigemoOriginalFindNext = ('onFindAgainCommand' in gFindBar) ?
				function() { // Firefox 3.0-
					gFindBar.xmigemoOriginalOnFindAgainCommand(false);
				} :
				gFindBar.findNext; // Firefox 1.x-2.0
			gFindBar.xmigemoOriginalFindPrevious = ('onFindAgainCommand' in gFindBar) ?
				function() { // Firefox 3.0-
					gFindBar.xmigemoOriginalOnFindAgainCommand(true);
				} :
				gFindBar.findPrevious; // Firefox 1.x-2.0

			gFindBar.findNext     = this.findNext;
			gFindBar.findPrevious = this.findPrevious;

			if (!('openFindBar' in gFindBar)) { // Firefox 3.0
				gFindBar.xmigemoOriginalEnableFindButtons = gFindBar._enableFindButtons;
				gFindBar._enableFindButtons = this.enableFindButtons;
				gFindBar.find               = gFindBar._find;

				// disable Firefox's focus
				eval('gFindBar.close = '+gFindBar.close.toSource().replace(
					'if (focusedElement) {',
					'if (focusedElement && false) {'
				));

				if ('_updateFindUI' in gFindBar)
					eval('gFindBar._updateFindUI = '+gFindBar._updateFindUI.toSource()
						.replace(
							/(var showMinimalUI = )([^;]+)/,
							'$1(XMigemoUI.findMode == XMigemoUI.FIND_MODE_NATIVE && $2)'
						).replace(
							/if \((this._findMode == this.(FIND_TYPEAHEAD|FIND_LINKS))\)/g,
							'if ($1 && XMigemoUI.findMode == XMigemoUI.FIND_MODE_NATIVE)'
						)
					);

				gFindBar.xmigemoOriginalOpen  = gFindBar.open;
				gFindBar.xmigemoOriginalClose = gFindBar.close;
				gFindBar.open                 = this.openFindBar;
				gFindBar.close                = this.closeFindBar;
			}
			else {
				// disable Firefox's focus
				eval('gFindBar.delayedCloseFindBar = '+gFindBar.delayedCloseFindBar.toSource().replace(
					'if (focusedElement &&',
					'if (focusedElement && false &&'
				));

				gFindBar.xmigemoOriginalEnableFindButtons = gFindBar.enableFindButtons;
				gFindBar.xmigemoOriginalOpen  = gFindBar.openFindBar;
				gFindBar.xmigemoOriginalClose = gFindBar.closeFindBar;
			}
			gFindBar.enableFindButtons = this.enableFindButtons;
			gFindBar.openFindBar  = this.openFindBar;
			gFindBar.closeFindBar = this.closeFindBar;

			if (!('updateStatus' in gFindBar)) {
				if ('updateStatusBar' in gFindBar) // old
					gFindBar.updateStatus = gFindBar.updateStatusBar;
				else if ('_updateStatusUI' in gFindBar) // Firefox 3.0
					gFindBar.updateStatus = gFindBar._updateStatusUI;
			}
			if ('_setHighlightTimeout' in gFindBar) // Firefox 3.0
				gFindBar.setHighlightTimeout = gFindBar._setHighlightTimeout;

			gFindBar.xmigemoOriginalToggleHighlight = gFindBar.toggleHighlight;
			gFindBar.toggleHighlight = this.toggleHighlight;

			gFindBar.prefillWithSelection = false; // disable Firefox 3's native feature
		}
		else {
			updateGlobalFunc = true;
			eval('window.setHighlightTimeout = '+
				window.setHighlightTimeout.toSource()
				.replace(
					/toggleHighlight/g,
					'gFindBar.toggleHighlight'
				)
			);
			window.gFindBar = {
				onFindCmd                   : window.onFindCmd,
				openFindBar                 : this.openFindBar,
				closeFindBar                : this.closeFindBar,
				xmigemoOriginalOpen         : window.openFindBar,
				xmigemoOriginalClose        : window.closeFindBar,
				xmigemoOriginalEnableFindButtons : window.enableFindButtons,
				enableFindButtons           : this.enableFindButtons,
				updateStatus                : window.updateStatus,
				find                        : window.find,
				toggleHighlight             : this.toggleHighlight,
				xmigemoOriginalToggleHighlight : window.toggleHighlight,
				setHighlightTimeout         : window.setHighlightTimeout,
				onFindAgainCmd              : window.onFindAgainCmd,
				onFindPreviousCmd           : window.onFindPreviousCmd,
				xmigemoOriginalFindNext     : window.findNext,
				xmigemoOriginalFindPrevious : window.findPrevious,
				toggleCaseSensitiveCheckbox : window.toggleCaseSensitivity,
				highlightDoc                : highlightDoc,
				highlightText               : highlightText,
				highlight                   : highlight,
				setHighlightTimeout         : setHighlightTimeout
			};
			window.toggleHighlight = this.toggleHighlight;
		}

		eval('gFindBar.find = '+gFindBar.find.toSource()
			.replace(/(this._?updateStatus(UI)?\([^\)]*\))/, '$1; XMigemoFind.scrollSelectionToCenter(window._content);')
			.replace(/\{/, '{ XMigemoUI.presetSearchString(arguments.length ? arguments[0] : null); ')
		);
		eval('gFindBar.xmigemoOriginalFindNext = '+gFindBar.xmigemoOriginalFindNext.toSource()
			.replace(/(return res;)/, 'XMigemoFind.scrollSelectionToCenter(window._content); $1')
		);
		eval('gFindBar.xmigemoOriginalFindPrevious = '+gFindBar.xmigemoOriginalFindPrevious.toSource()
			.replace(/(return res;)/, 'XMigemoFind.scrollSelectionToCenter(window._content); $1')
		);

		var highlightDocFunc = ('_highlightDoc' in gFindBar) ? '_highlightDoc' : // Fx 3
				'highlightDoc'; // Fx 2, 1.5
		var highlightDocRetVal = updateGlobalFunc ? '' : 'textFound' ;
		eval('gFindBar.'+highlightDocFunc+' = '+gFindBar[highlightDocFunc].toSource()
			.replace(
				'BackColor) {',
				'BackColor) { XMigemoUI.clearHighlight(doc); return '+highlightDocRetVal+'; '
			)
		);

		var highlightTextFunc = ('_highlightText' in gFindBar) ? '_highlightText' : // Fx 3
				'highlightText'; // Fx 2, 1.5
		eval('gFindBar.'+highlightTextFunc+' = '+gFindBar[highlightTextFunc].toSource()
			.replace(
				'{',
				<![CDATA[
				{
					XMigemoUI.activeBrowser.contentDocument.documentElement.setAttribute(XMigemoUI.ATTR_LAST_HIGHLIGHT, arguments[0]);
					XMigemoUI.updateHighlightNode(arguments[1]);
					if (XMigemoUI.isActive) {
						return XMigemoUI.highlightText(arguments[0], arguments[1],
								('_searchRange' in this) ? this._searchRange : // Fx 3
								('mSearchRange' in this) ? this.mSearchRange : // Fx 2
									searchRange // Fx 1.5
							);
					}
				]]>
			)
		);

		var highlightFunc = ('_highlight' in gFindBar) ? '_highlight' : // Fx 3
				'highlight'; // Fx 2, 1.5
		eval('gFindBar.'+highlightFunc+' = '+gFindBar[highlightFunc].toSource()
			.replace(
				'{',
				<![CDATA[
				{
					var foundRange = XMigemoUI.shouldRebuildSelection ? XMigemoUI.textUtils.getFoundRange(arguments[0].startContainer.ownerDocument.defaultView) : null ;
					var foundLength = (XMigemoUI.shouldRebuildSelection && XMigemoUI.textUtils.isRangeOverlap(foundRange, arguments[0])) ? foundRange.toString().length : 0 ;
				]]>
			).replace(
				'return',
				'if (foundLength) { XMigemoUI.textUtils.delayedSelect(arguments[1], foundLength, true); } return'
			)
		);

		var highlightTimoutFunc = ('_setHighlightTimeout' in gFindBar) ? '_setHighlightTimeout' : // Fx 3
				'setHighlightTimeout'; // Fx 2, 1.5
		eval('gFindBar.'+highlightTimoutFunc+' = '+gFindBar[highlightTimoutFunc].toSource()
			.replace(
				'{',
				<![CDATA[
				{
					if (XMigemoUI.findTerm == XMigemoUI.activeBrowser.contentDocument.documentElement.getAttribute(XMigemoUI.ATTR_LAST_HIGHLIGHT)) return;
				]]>
			)
		);
		if ('setHighlightTimeout' != highlightTimoutFunc)
			gFindBar.setHighlightTimeout = gFindBar[highlightTimoutFunc];

		// Firefox 3.0-    : onFindAgainCommand / searcgString / onFindCommand
		// Firefox 1.x-2.0 : onFindAgainCmd / onFindPreviousCmd / findString / onFindCmd
		if ('onFindAgainCommand' in gFindBar) {
			eval('gFindBar.onFindAgainCommand = '+gFindBar.onFindAgainCommand.toSource()
				.replace(/([^=\s]+\.(find|search)String)/g, 'XMigemoUI.getLastFindString($1)')
			);
			gFindBar.xmigemoOriginalOnFindAgainCommand = gFindBar.onFindAgainCommand;
			gFindBar.onFindAgainCommand = function(aFindPrevious) {
				if (aFindPrevious)
					this.findPrevious();
				else
					this.findNext();
			};
			eval('gFindBar.onFindCommand = '+gFindBar.onFindCommand.toSource()
				.replace('{', '$& XMigemoUI.onFindStartCommand();')
			);
		}
		else {
			eval('gFindBar.onFindAgainCmd = '+gFindBar.onFindAgainCmd.toSource()
				.replace(/([^=\s]+\.(find|search)String)/g, 'XMigemoUI.getLastFindString($1)')
			);
			eval('gFindBar.onFindPreviousCmd = '+gFindBar.onFindPreviousCmd.toSource()
				.replace(/([^=\s]+\.(find|search)String)/g, 'XMigemoUI.getLastFindString($1)')
			);
			if (gFindBar.onFindCmd)
				eval('gFindBar.onFindCmd = '+gFindBar.onFindCmd.toSource()
					.replace('{', '$& XMigemoUI.onFindStartCommand();')
				);
		}

		if (updateGlobalFunc) {
			window.onFindCmd     = this.onFindCmd;
			window.findNext      = this.findNext;
			window.findPrevious  = this.findPrevious;
			window.openFindBar   = this.openFindBar;
			window.closeFindBar  = this.closeFindBar;
			window.highlightDoc  = gFindBar.highlightDoc;
			window.highlightText = gFindBar.highlightText;
			window.highlight     = gFindBar.highlight;
			window.setHighlightTimeout = gFindBar.setHighlightTimeout;
			if ('onFindAgainCmd' in gFindBar) { // Firefox 1.x-2.0
				window.onFindAgainCmd    = gFindBar.onFindAgainCmd;
				window.onFindPreviousCmd = gFindBar.onFindPreviousCmd;
			}
		}

		this.findField.addEventListener('input', this, true);
		this.findField.addEventListener('keypress', this, true);

		if ('nsBrowserStatusHandler' in window)
			eval('nsBrowserStatusHandler.prototype.onLocationChange = '+
				nsBrowserStatusHandler.prototype.onLocationChange.toSource()
					.replace(/([^\.\s]+\.)+findString/, '((XMigemoUI.findMode != XMigemoUI.FIND_MODE_NATIVE) ? XMigemoFind.lastKeyword : $1findString)')
			);

		var caseSensitive = this.findCaseSensitiveCheck;
		caseSensitive.setAttribute('long-label', caseSensitive.getAttribute('label'));
		caseSensitive.setAttribute('short-label', this.findMigemoBar.getAttribute('caseSensitive-short-label'));
	},
 
	getLastFindString : function(aString) 
	{
		var migemoString = XMigemoFind.previousKeyword || XMigemoFind.lastKeyword;
		return (this.lastFindMode == this.FIND_MODE_NATIVE) ? (aString || migemoString) : (migemoString || aString) ;
	},
 
	presetSearchString : function(aString) 
	{
		if (XMigemoService.getPref('xulmigemo.ignore_find_links_only_behavior')) return;

		if (!aString)
			aString = this.findTerm;

		/*
			accessibility.typeaheadfind.linksonlyがtrueの時に
			検索バッファが空のままnsITypeAheadFind.findを実行すると、
			常にリンクのみの検索になってしまう。
			何か1文字だけでも検索すれば、正常に検索できる。
		*/
		try {
			var fastFind = getBrowser().fastFind;
			if (XMigemoService.getPref('accessibility.typeaheadfind.linksonly') &&
				!fastFind.searchString) {
				var res = fastFind.find(sel.charAt(0), false);
				fastFind.findPrevious();
			}
		}
		catch(e) {
		}
	},
 
	openFindBar : function(aShowMinimalUI) 
	{
		var ui = XMigemoUI;

		if (ui.forcedFindMode > -1 && ui.findMode != ui.forcedFindMode)
			ui.findMode = ui.forcedFindMode;

		if (ui.findMode != ui.FIND_MODE_NATIVE && !ui.isActive) {
			ui.isActive = true;
			ui.lastFindMode = ui.findMode;
		}
		else if (ui.findMode == ui.FIND_MODE_NATIVE) {
			ui.isActive = false;
			ui.lastFindMode = ui.findMode;
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalOpen.apply(scope, arguments);
		ui.findMigemoBar.removeAttribute('collapsed');

		var box = ui.migemoModeBox;
		box.removeAttribute('hidden');
		box.style.height = ui.findBar.boxObject.height+'px';
		box.style.right = (
			document.documentElement.boxObject.width
			- ui.findBar.boxObject.x
			- ui.findBar.boxObject.width
		)+'px';
		box.style.bottom = (
			document.documentElement.boxObject.height
			- ui.findBar.boxObject.y
			- ui.findBar.boxObject.height
		)+'px';

		ui.toggleFindToolbarMode();

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarOpen', true, true);
		ui.findBar.dispatchEvent(event);

		if (XMigemoService.getPref('xulmigemo.prefillwithselection')) {
			var win = document.commandDispatcher.focusedWindow || window.content ;
			var sel = (win && win.getSelection() ? win.getSelection().toString() : '' ).replace(/^\s+|\s+$/g, '');
			if (!sel) return;

			if (ui.isActive || ui.findMode != ui.FIND_MODE_NATIVE) {
				if (
					ui.cancelTimer ||
					XMigemoFind.lastKeyword == sel ||
					XMigemoFind.lastFoundWord == sel
					)
					return;
				ui.findTerm = sel;
				ui.findAgain(sel, ui.findMode);
			}
			else {
				if (
					 aShowMinimalUI ||
					 ui.findTerm == sel
					 )
					 return;
				ui.findTerm = sel;
				ui.findAgain(sel, ui.FIND_MODE_NATIVE);
			}
		}
	},
 
	closeFindBar : function() 
	{
		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalClose.apply(scope, arguments);

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarClose', true, true);
		XMigemoUI.findBar.dispatchEvent(event);

		window.setTimeout(function(aSelf) {
			aSelf.delayedCloseFindBar();
		}, 0, XMigemoUI);
	},
	delayedCloseFindBar : function()
	{
		if (this.findBar.getAttribute('collapsed') == 'true' ||
			this.findBar.getAttribute('hidden') == 'true') {
			this.migemoModeBox.setAttribute('hidden', true);
			this.findMigemoBar.setAttribute('collapsed', true);
		}

		this.isActive = false;

		this.toggleFindToolbarMode();

		var WindowWatcher = Components
				.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);
		if (window == WindowWatcher.activeWindow &&
			this.findFieldIsFocused) {
			var scrollSuppressed = document.commandDispatcher.suppressFocusScroll;
			document.commandDispatcher.suppressFocusScroll = true;
			XMigemoFind.exitFind(true);
			document.commandDispatcher.suppressFocusScroll = scrollSuppressed;
		}
	},
 
/* highlight */ 
	 
	toggleHighlight : function(aHighlight) 
	{
		if (aHighlight && XMigemoUI.highlightCheckedAlways) {
			aHighlight = XMigemoUI.shouldHighlightAll;
			window.setTimeout('XMigemoUI.findHighlightCheck.checked = '+aHighlight, 0);
		}

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarToggleHighlight', true, true);
		event.targetHighlight = aHighlight;
		XMigemoUI.findBar.dispatchEvent(event);

		if (!aHighlight)
			XMigemoUI.activeBrowser.contentDocument.documentElement.removeAttribute(XMigemoUI.ATTR_LAST_HIGHLIGHT);

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalToggleHighlight.apply(scope, arguments);
	},
 
	clearHighlight : function(aDocument) 
	{
		var xpathResult = this.getEditableNodes(aDocument);
		try {
			var editable;
			for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
			{
				editable = xpathResult.snapshotItem(i);
				this.clearHighlightInternal(
					aDocument,
					editable
						.QueryInterface(this.nsIDOMNSEditableElement)
						.editor
						.rootElement
				);
			}
		}
		catch(e) {
		}
		this.clearHighlightInternal(aDocument, aDocument);
	},
	clearHighlightInternal : function(aDocument, aTarget)
	{
		var foundRange = this.shouldRebuildSelection ? this.textUtils.getFoundRange(aDocument.defaultView) : null ;
		var foundLength = foundRange ? foundRange.toString().length : 0 ;
		var xpathResult = aDocument.evaluate(
				'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]',
				aTarget,
				this.NSResolver,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		var range = aDocument.createRange();
		for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
		{
			var elem = xpathResult.snapshotItem(i);
			if (elem.getAttribute('class') == '__mozilla-findbar-animation') {
				range.selectNode(elem);
				range.deleteContents();
				continue;
			}

			range.selectNodeContents(elem);

			var child   = null;
			var docfrag = aDocument.createDocumentFragment();
			var next    = elem.nextSibling;
			var parent  = elem.parentNode;
			while ((child = elem.firstChild))
			{
				docfrag.appendChild(child);
			}
			var selectAfter = this.shouldRebuildSelection ? this.textUtils.isRangeOverlap(foundRange, range) : false ;
			var firstChild  = docfrag.firstChild;

			parent.removeChild(elem);
			parent.insertBefore(docfrag, next);
			if (selectAfter) {
				this.textUtils.delayedSelect(firstChild, foundLength, true);
			}

			parent.normalize();
		}
	},
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
 
	highlightText : function(aWord, aBaseNode, aRange) 
	{
		var regexp = this.findMode == this.FIND_MODE_REGEXP ?
				this.textUtils.extractRegExpSource(aWord) :
				XMigemoFind.core.getRegExp(aWord) ;
		var ranges = XMigemoFind.core.regExpHighlightText(regexp, '', aRange, aBaseNode, {});
		return ranges.length ? true : false ;
	},
	 
	updateHighlightNode : function(aNode) 
	{
		aNode.setAttribute('onmousedown', <><![CDATA[
			try {
				var xpathResult = this.ownerDocument.evaluate(
						'ancestor::*[contains(" INPUT input TEXTAREA textarea ", concat(" ", local-name(), " "))]',
						this,
						null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					);
				if (!xpathResult.singleNodeValue) return;
			}
			catch(e) {
				// permission denied, then this is in the input area!
			}
			var range = document.createRange();
			range.selectNodeContents(this);
			var contents = range.extractContents(true);
			range.selectNode(this);
			range.deleteContents();
			range.insertNode(contents);
			range.detach();
		]]></>);

		XMigemoService.ObserverService.notifyObservers(aNode, 'XMigemo:highlightNodeReaday', null);
	},
 
	onHighlightClickedOrTyped : function(aEvent) 
	{
		alert(aEvent.target);
		alert(aEvent.originalTarget);
	},
   
	updateStatus : function(aStatusText) 
	{
		var bar = this.findBar;
		var findField = this.findField;
		if (bar && !bar.hidden && findField) {
			this.findTerm = aStatusText;
		}
		else if (document.getElementById('statusbar-display')) {
			document.getElementById('statusbar-display').label = aStatusText;
		}
	},
 
	findNext : function() 
	{
//		dump('XMigemoUI.findNext\n');
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindAgain', true, true);
		event.direction = XMigemoFind.FIND_FORWARD;
		document.dispatchEvent(event);

		var keyword = XMigemoUI.findTerm;
		var findBarShown = this.findBar && !this.findBar.hidden;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode != this.FIND_MODE_NATIVE) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findNext(!findBarShown ? true : false );
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
			if (findBarShown && XMigemoUI.isQuickFind)
				XMigemoUI.findField.focus();
		}
		else {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.FIND_MODE_NATIVE);
				XMigemoUI.isModeChanged = false;
				return;
			}
			gFindBar.xmigemoOriginalFindNext();
		}
	},
 
	findPrevious : function() 
	{
//		dump('XMigemoUI.findPrevious\n');
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindAgain', true, true);
		event.direction = XMigemoFind.FIND_BACK;
		document.dispatchEvent(event);

		var keyword = XMigemoUI.findTerm;
		var findBarShown = this.findBar && !this.findBar.hidden;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == this.FIND_MODE_MIGEMO) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findPrevious(!findBarShown ? true : false );
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
			if (findBarShown && XMigemoUI.isQuickFind)
				XMigemoUI.findField.focus();
		}
		else {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.FIND_MODE_NATIVE);
				XMigemoUI.isModeChanged = false;
				return;
			}
			gFindBar.xmigemoOriginalFindPrevious();
		}
	},
 
	enableFindButtons : function(aEnable) 
	{
		var highlightCheck = XMigemoUI.findHighlightCheck;
		var caseSensitive  = this.findCaseSensitiveCheck;
		if (!highlightCheck.disabled) {
			highlightCheck.xmigemoOriginalChecked = highlightCheck.checked;
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalEnableFindButtons.apply(scope, arguments);

		if (aEnable) {
			XMigemoUI.updateHighlightCheck();
			if (XMigemoUI.caseSensitiveCheckedAlways)
				caseSensitive.checked = true;
		}
		else {
			if (XMigemoUI.highlightCheckedAlways)
				XMigemoUI.toggleHighlight(false);
		}

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarUpdate', true, true);
		XMigemoUI.findBar.dispatchEvent(event);
	},
	highlightCheckFirst : true,
	updateHighlightCheck : function()
	{
		if (this.updateHighlightCheckTimer) {
			window.clearTimeout(this.updateHighlightCheckTimer);
			this.updateHighlightCheckTimer = null;
		}
		this.updateHighlightCheckTimer = window.setTimeout(this.updateHighlightCheckCallback, 400, this);
	},
	updateHighlightCheckCallback : function(aSelf)
	{
		var highlightCheck = aSelf.findHighlightCheck;
		var prevHighlightState = highlightCheck.checked;
		highlightCheck.checked =
			aSelf.highlightCheckedAlways ?
				aSelf.shouldHighlightAll :
			aSelf.highlightCheckFirst ?
				XMigemoService.getPref('xulmigemo.checked_by_default.highlight') :
				highlightCheck.xmigemoOriginalChecked ;
		if (highlightCheck.checked != prevHighlightState) {
			aSelf.toggleHighlight(highlightCheck.checked);
		}
		aSelf.highlightCheckFirst = false;
	},
	updateHighlightCheckTimer : null,
 
	toggleFindToolbarMode : function(aSilently) 
	{
		if (this.isActive) {
			var caseSensitive = this.findCaseSensitiveCheck;
			caseSensitive.xmigemoOriginalChecked = caseSensitive.checked;
			caseSensitive.checked  = false;
			caseSensitive.disabled = true;
		}
		else  {
			var caseSensitive = this.findCaseSensitiveCheck;
			caseSensitive.disabled = false;
			caseSensitive.checked  = caseSensitive.xmigemoOriginalChecked;
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


		this.lastFindMode = this.FIND_MODE_NATIVE;

		document.addEventListener('XMigemoFindProgress', this, false);
		document.addEventListener('XMigemoFindAgain', this, false);

		var browser = this.browser;
		if (browser) {
			if (!XMigemoService.getPref('xulmigemo.lang') &&
				!XMigemoService.WindowManager.getMostRecentWindow('xulmigemo:langchooser')) {
				var WindowWatcher = Components
					.classes['@mozilla.org/embedcomp/window-watcher;1']
					.getService(Components.interfaces.nsIWindowWatcher);
				WindowWatcher.openWindow(
					null,
					'chrome://xulmigemo/content/initializer/langchooser.xul',
					'xulmigemo:langchooser',
					'chrome,dialog,modal,centerscreen,dependent',
					null
				);
			}

			XMigemoFind = Components
				.classes['@piro.sakura.ne.jp/xmigemo/find;1']
				.createInstance(Components.interfaces.pIXMigemoFind);
			XMigemoFind.target = browser;

			if (browser.getAttribute('onkeypress'))
				browser.setAttribute('onkeypress', '');

			var target = document.getElementById('appcontent') || browser;
			target.addEventListener('keypress', this, true);
			target.addEventListener('mouseup', this, true);
		}

		XMigemoService.addPrefListener(this);
		this.observe(null, 'nsPref:changed', 'xulmigemo.autostart');
		this.observe(null, 'nsPref:changed', 'xulmigemo.autostart.regExpFind');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enableautoexit.inherit');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enableautoexit.nokeyword');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.highlight.always');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.highlight.always.minLength');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.caseSensitive');
		this.observe(null, 'nsPref:changed', 'xulmigemo.findMode.always');
		this.observe(null, 'nsPref:changed', 'xulmigemo.timeout');
		this.observe(null, 'nsPref:changed', 'xulmigemo.override_findtoolbar');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.findForward');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.findBackward');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.manualStart');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.manualStart2');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.manualStartLinksOnly');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.manualStartLinksOnly2');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.goDicManager');
		this.observe(null, 'nsPref:changed', 'xulmigemo.shortcut.manualExit');
		this.observe(null, 'nsPref:changed', 'xulmigemo.appearance.indicator.height');
		this.observe(null, 'nsPref:changed', 'xulmigemo.rebuild_selection');

		this.overrideFindBar();

		this.observe(null, 'nsPref:changed', 'xulmigemo.appearance.hideLabels');

		window.setTimeout('XMigemoUI.delayedInit()', 0);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);
	},
	
	delayedInit : function() { 
		window.setTimeout("XMigemoUI.findField.addEventListener('blur', this, false);", 0);

		if (XMigemoService.getPref('xulmigemo.findMode.default') > -1)
			this.findMode = XMigemoService.getPref('xulmigemo.findMode.default');
		if (XMigemoService.getPref('xulmigemo.checked_by_default.highlight'))
			this.findHighlightCheck.checked = this.findHighlightCheck.xmigemoOriginalChecked = true;
		if (XMigemoService.getPref('xulmigemo.checked_by_default.caseSensitive')) {
			this.findCaseSensitiveCheck.checked = this.findCaseSensitiveCheck.xmigemoOriginalChecked = true;
			gFindBar.toggleCaseSensitiveCheckbox(true);
		}

		if (XMigemoService.getPref('xulmigemo.checked_by_default.findbar'))
			gFindBar.openFindBar();
	},
  
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		document.removeEventListener('XMigemoFindProgress', this, false);
		document.removeEventListener('XMigemoFindAgain', this, false);

		var browser = this.browser;
		if (browser) {
			var target = document.getElementById('appcontent') || browser;
			target.removeEventListener('keypress', this, true);
			target.removeEventListener('mouseup', this, true);
		}

		this.findField.removeEventListener('blur', this, false);
		this.findField.removeEventListener('input', this, false);
		this.findField.removeEventListener('keypress', this, false);

		window.removeEventListener('unload', this, false);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', XMigemoUI, false); 
 
//obsolete 
function xmFind(){//dump("xmFind"+'\n');
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
function xmFindPrev(){//dump("xmFindPrev"+'\n');
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
 
