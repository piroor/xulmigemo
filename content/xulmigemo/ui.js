/* 
	This depends on:
		service.js
*/

var XMigemoFind;
 
var XMigemoUI = { 
	 
	lastFindMode     : -1, 
	FIND_MODE_NATIVE : 0,
	FIND_MODE_MIGEMO : 1,

	isFindbarFocused       : false,
 
	isAutoStart            : false, 
	isAutoExit             : false,
	timeout                : 0,
	strongHighlight        : false,

	enableByDefault        : false,

	isModeChanged : false,
 
	get isQuickFind() 
	{
		return XMigemoFind.isQuickFind;
	},
	set isQuickFind(val)
	{
		XMigemoFind.isQuickFind = val;
		return XMigemoFind.isQuickFind;
	},
 
	nsITypeAheadFind : Components.interfaces.nsITypeAheadFind, 
 
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
 
	get findBarHidden() 
	{
		return (this.findBar.getAttribute('collapsed') == 'true' ||
				this.findBar.getAttribute('hidden') == 'true');
	},
 
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
 
	get findTerm() 
	{
		try {
			return this.findField.value;
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
 
	get findMigemoCheck() 
	{
		if (!this._findMigemoCheck) {
			this._findMigemoCheck = document.getElementById('find-migemo-mode');
		}
		return this._findMigemoCheck;
	},
	_findMigemoCheck : null,
 
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
 
/* nsIPrefListener(?) */ 
	
	domain  : 'xulmigemo', 
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.autostart':
				this.isAutoStart = value;
				return;

			case 'xulmigemo.enableautoexit.nokeyword':
				this.isAutoExit = value;
				return;

			case 'xulmigemo.enable_by_default':
				this.enableByDefault = value;
				return;

			case 'xulmigemo.timeout':
				this.timeout = value;
				if (this.timeout === null)
					this.timeout = value;
				return;

			case 'xulmigemo.highlight.showScreen':
				this.strongHighlight = value;
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
		}
	},
  
	handleEvent : function(aEvent) /* DOMEventListener */ 
	{
		switch (aEvent.type)
		{
			case 'keypress':
				this.keyEvent(aEvent);
				return;

			case 'mouseup':
				this.mouseEvent(aEvent);
				return;

			case 'XMigemoFindProgress':
				this.onXMigemoFindProgress(aEvent);
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
	
	keyEvent : function(aEvent) 
	{
		if (
			this.processFunctionalKeyEvent(aEvent) || // XUL/Migemoの終了その他のチェック
			this.processFunctionalShortcuts(aEvent) ||
			this.processKeyEvent(aEvent)
			)
			return;
	},
	
	isEventFiredInInputField : function(aEvent) 
	{
		try { // in rich-textarea (ex. Gmail)
			var doc = Components.lookupMethod(aEvent.originalTarget, 'ownerDocument').call(aEvent.originalTarget);
			if (Components.lookupMethod(doc, 'designMode').call(doc) == 'on')
				return true;
		}
		catch(e) {
		}

		if (
			/^(input|textarea|textbox|select)$/i.test(
				Components.lookupMethod(
					aEvent.originalTarget,
					'localName'
				).call(aEvent.originalTarget)
			)
			) return true;

		return false;
	},
 
	processFunctionalShortcuts : function(aEvent) 
	{
		if (
			this.isEventFiredInInputField(aEvent) &&
			!(
				aEvent.charCode == 0 ||
				aEvent.altKey ||
				aEvent.ctrlKey ||
				aEvent.metaKey
			)
			) {
			return false;
		}

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

		if (isForwardKey || isBackwardKey) {
			aEvent.preventDefault();

			if (isForwardKey)
				XMigemoFind.findNext(false);
			else if (isBackwardKey)
				XMigemoFind.findPrevious(false);

			if (this.cancelTimer)
				this.startTimer();

			dump("PrevKeyword:"+XMigemoFind.previousKeyword+"\nCurrentKeyword:"+XMigemoFind.lastKeyword+'\n')
			return true;
		}

		if (
			!this.isActive &&
			(
				!this.isAutoStart ||
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
			XMigemoFind.clear();
			this.start();
			XMigemoFind.manualLinksOnly = (isStartKeyLinksOnly || isStartKeyLinksOnly2) ? true : false ;
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
 
	processFunctionalKeyEvent : function(aEvent) 
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
				if (XMigemoFind.lastKeyword == '' &&
					this.isAutoExit) {
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
				this.cancel();
				this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
				return true;

			default:
				return false;
		}
	},
 
	processKeyEvent : function(aEvent) 
	{
		if (this.isEventFiredInInputField(aEvent) && !this.isActive) {
			return false;
		}

		if (this.isActive) {
			dump("migemo is active"+'\n');
			if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
				) { //普通。フックする。
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
				aEvent.preventDefault();
				this.delayedFind();
				this.restartTimer();
				return true;
			}
		}
		else if (this.isAutoStart) {
			dump("isAutoStart:"+this.isAutoStart+'\n');
			if (aEvent.charCode == 32) { // Space
				return true;
			}
			else if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.metaKey &&
				!aEvent.altKey
				) {
				XMigemoFind.clear();
				this.start();
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
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
		if (window.content &&
			window.content.__moz_xmigemoHighlightedScreen)
			this.toggleHighlightScreen(false);

		if (!this.isQuickFind) {
			XMigemoUI.isActive = false;
//			XMigemoUI.cancel(true);
			return;
		}

//		dump("mouseEvent.originalTarget:"+aEvent.originalTarget.tagName.toLowerCase()+'\n');
		this.cancel();
		this.clearTimer();//ここでタイマーを殺さないといじられてしまう。タイマー怖い。
	},
 
	onXMigemoFindProgress : function(aEvent) 
	{
		gFindBar.enableFindButtons(!(
			aEvent.resultFlag == XMigemoFind.NOTFOUND ||
			aEvent.resultFlag == XMigemoFind.NOTLINK
		));


		// migemoでヒットした全ての語を強調表示するととんでもないことになるので、
		// ハイライト表示のボタンだけは常に無効にしておこう。
		// this.findHighlightCheck.disabled = true;
		// →最後にヒットした語句のみを強調表示するように仕様変更したので、
		//   機能を復活させた

		var statusRes;
		switch (aEvent.resultFlag)
		{
			case XMigemoFind.FOUND:
			case XMigemoFind.FOUND_IN_EDITABLE:
			case XMigemoFind.NOTLINK:
				if (
					aEvent.resultFlag != XMigemoFind.NOTLINK ||
					!XMigemoFind.manualLinksOnly
					) {
					if (this.nsITypeAheadFind)
						statusRes = this.nsITypeAheadFind.FIND_FOUND;
					//alert(gFoundRange.toString());

					if (this.findHighlightCheck.checked)
						gFindBar.setHighlightTimeout();
					break;
				}

			case XMigemoFind.NOTFOUND:
				if (this.nsITypeAheadFind)
					statusRes = this.nsITypeAheadFind.FIND_NOTFOUND;
				break;

			default:
				if (
					this.nsITypeAheadFind &&
					aEvent.resultFlag == (('FIND_WRAPPED' in this.nsITypeAheadFind) ? this.nsITypeAheadFind.FIND_WRAPPED : FIND_WRAPPED)
					) // Components.interfaces.nsITypeAheadFind.FIND_WRAPPED is for Firefox 1.5 or later
					statusRes = this.nsITypeAheadFind.FIND_NOTFOUND;
				break;
		}

		gFindBar.updateStatus(statusRes, !(aEvent.findFlag & XMigemoFind.FIND_BACK));
	},
 
	onInputFindToolbar : function(aEvent) 
	{
		XMigemoFind.replaceKeyword(aEvent.target.value);
		if (XMigemoUI.findMigemoCheck.checked) {
			XMigemoUI.start(true);
			aEvent.stopPropagation();
			aEvent.preventDefault();
			XMigemoUI.delayedFind();
		}
		else {
			XMigemoUI.lastFindMode = XMigemoUI.FIND_MODE_NATIVE;
		}
	},
 
	onFindBlur : function() 
	{
		if (XMigemoUI.isQuickFind)
			XMigemoUI.cancel();
//			XMigemoUI.cancel(true);
	},
 
	onChangeFindToolbarMode : function() 
	{
		this.clearTimer();
		gFindBar.toggleHighlight(false);
		var keyword = this.findTerm;
		if (this.findMigemoCheck.checked) {
			this.start(true);
			this.isModeChanged = true;
		}
		else {
			this.cancel(true);
			this.lastFindMode = XMigemoUI.FIND_MODE_NATIVE;
			this.isModeChanged = true;
		}
	},
  
/* timer */ 
	
/* Cancel Timer */ 
	cancelTimer : null,
	 
	startTimer : function() 
	{
		dump("xmigemoStartTimer"+'\n');
		this.clearTimer();
		this.cancelTimer = window.setTimeout(this.timerCallback, this.timeout, this);
		this.updateTimeoutIndicator(this.timeout);
	},
	 
	timerCallback : function(aThis) 
	{
		dump("xmigemoTimeout"+'\n');
		XMigemoFind.shiftLastKeyword();
		aThis.cancel();
	},
  
	restartTimer : function() 
	{
		if (XMigemoService.getPref('xulmigemo.enabletimeout'))
			this.startTimer();
	},
 
	clearTimer : function() 
	{
		dump("xmigemoClearTimer"+'\n');
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
		dump('xmigemoStart'+'\n');
		this.isActive = true;
		this.lastFindMode = this.FIND_MODE_MIGEMO;

		if (!aSilently) {
			this.isQuickFind = true;

			if (XMigemoService.getPref('xulmigemo.enabletimeout'))
				this.startTimer();
		}

		var migemoCheck = this.findMigemoCheck;
		migemoCheck.xmigemoOriginalChecked = migemoCheck.checked;
		migemoCheck.checked = true;

		if (this.findBarHidden)
			gFindBar.openFindBar();
		else
			this.toggleFindToolbarMode();

		if (this.findTerm != XMigemoFind.lastKeyword)
			this.findTerm = XMigemoFind.lastKeyword;
	},
 
	cancel : function(aSilently) 
	{
		dump("xmigemoCancel"+'\n');
		this.isActive = false;

		if (!aSilently) XMigemoFind.clear();

		if (!aSilently || this.isQuickFind)
			gFindBar.closeFindBar();
		else
			this.toggleFindToolbarMode();

		if (this.isQuickFind) {
			var migemoCheck = this.findMigemoCheck;
			migemoCheck.checked = migemoCheck.xmigemoOriginalChecked;

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
		XMigemoFind.find(false, XMigemoFind.lastKeyword, false);
	},
 
	findAgain : function(aKeyword, aMode) 
	{
		if (aMode == this.FIND_MODE_MIGEMO) {
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
						.QueryInterface(Components.interfaces.nsIDOMNSEditableElement)
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
		var updateStatusFunc = false;

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

				gFindBar.xmigemoOriginalOpen  = gFindBar.open;
				gFindBar.xmigemoOriginalClose = gFindBar.close;
				gFindBar.open                 = this.openFindBar;
				gFindBar.close                = this.closeFindBar;
			}
			else {
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
				updateStatusFunc = true;
			}

			gFindBar.xmigemoOriginalToggleHighlight = gFindBar.toggleHighlight;
			gFindBar.toggleHighlight = this.toggleHighlight;
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
				highlight                   : highlight
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

		eval('gFindBar.updateStatus = '+gFindBar.updateStatus.toSource()
			.replace(
				'{',
				'{ if (arguments[0] != Components.interfaces.nsITypeAheadFind.FIND_NOTFOUND && XMigemoUI.strongHighlight) { XMigemoUI.highlightFocusedFound(); };'
			)
		);
		if (updateStatusFunc) {
			if ('updateStatusBar' in gFindBar) // old
				gFindBar.updateStatusBar = gFindBar.updateStatus;
			else if ('_updateStatusUI' in gFindBar) // Firefox 3.0
				gFindBar._updateStatusUI = gFindBar.updateStatus;
		}

		var highlightDocFunc = ('_highlightDoc' in gFindBar) ? '_highlightDoc' : // Fx 3
				'highlightDoc'; // Fx 2, 1.5
		eval('gFindBar.'+highlightDocFunc+' = '+gFindBar[highlightDocFunc].toSource()
			.replace(
				'var body = doc.body;',
				'var foundRange = XMigemoUI.getFoundRange(win); var body = doc.body;'
			).replace(
				'parent.removeChild(',
				'var selectAfter = XMigemoUI.isRangeOverlap(foundRange, retRange); var firstChild = docfrag.firstChild, lastChild = docfrag.lastChild; parent.removeChild('
			).replace(
				'parent.normalize();',
				'if (selectAfter) { XMigemoUI.selectNode(firstChild, doc, lastChild); } parent.normalize();'
			)
		);

		var highlightFunc = ('_highlight' in gFindBar) ? '_highlight' : // Fx 3
				'highlight'; // Fx 2, 1.5
		eval('gFindBar.'+highlightFunc+' = '+gFindBar[highlightFunc].toSource()
			.replace(
				'{',
				<![CDATA[
				{
					var foundRange = XMigemoUI.getFoundRange(arguments[0].startContainer.ownerDocument.defaultView);
					var selectAfter = XMigemoUI.isRangeOverlap(foundRange, arguments[0]);
				]]>
			).replace(
				'return',
				'if (selectAfter) { XMigemoUI.selectNode(arguments[1], arguments[0].startContainer.ownerDocument); } return'
			)
		);

		// Firefox 3.0-    : onFindAgainCommand / searcgString
		// Firefox 1.x-2.0 : onFindAgainCmd / onFindPreviousCmd / findString
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
		}
		else {
			eval('gFindBar.onFindAgainCmd = '+gFindBar.onFindAgainCmd.toSource()
				.replace(/([^=\s]+\.(find|search)String)/g, 'XMigemoUI.getLastFindString($1)')
			);
			eval('gFindBar.onFindPreviousCmd = '+gFindBar.onFindPreviousCmd.toSource()
				.replace(/([^=\s]+\.(find|search)String)/g, 'XMigemoUI.getLastFindString($1)')
			);
		}

		eval(
			'gFindBar.xmigemoOriginalToggleHighlight = '+
			gFindBar.xmigemoOriginalToggleHighlight.toSource().replace(
				/var word = /,
				'var word = XMigemoUI.isActive ? XMigemoFind.lastFoundWord : '
			)
		);

		if (updateGlobalFunc) {
			window.findNext     = this.findNext;
			window.findPrevious = this.findPrevious;
			window.openFindBar  = this.openFindBar;
			window.closeFindBar = this.closeFindBar;
			window.highlightDoc = this.highlightDoc;
			window.highlight    = this.highlight;
			if ('onFindAgainCmd' in gFindBar) { // Firefox 1.x-2.0
				window.onFindAgainCmd    = gFindBar.onFindAgainCmd;
				window.onFindPreviousCmd = gFindBar.onFindPreviousCmd;
			}
		}

		this.findField.addEventListener('input', this.onInputFindToolbar, true);

		if ('nsBrowserStatusHandler' in window)
			eval('nsBrowserStatusHandler.prototype.onLocationChange = '+
				nsBrowserStatusHandler.prototype.onLocationChange.toSource()
					.replace(/([^\.\s]+\.)+findString/, '(XMigemoUI.findMigemoCheck.checked ? XMigemoFind.lastKeyword : $1findString)')
			);
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
			aString = XMigemoUI.findTerm;

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
		if (XMigemoUI.enableByDefault && !XMigemoUI.findMigemoCheck.checked)
			XMigemoUI.findMigemoCheck.checked = true;

		if (XMigemoUI.findMigemoCheck.checked && !XMigemoUI.isActive) {
			XMigemoUI.isActive = true;
			XMigemoUI.lastFindMode = this.FIND_MODE_MIGEMO;
		}
		else if (!XMigemoUI.findMigemoCheck.checked) {
			XMigemoUI.isActive = false;
			XMigemoUI.lastFindMode = this.FIND_MODE_NATIVE;
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalOpen.apply(scope, arguments);
		XMigemoUI.findMigemoBar.removeAttribute('collapsed');

		var box = XMigemoUI.migemoModeBox;
		box.removeAttribute('hidden');
		box.style.height = XMigemoUI.findBar.boxObject.height+'px';
		box.style.right = (
			document.documentElement.boxObject.width
			- XMigemoUI.findBar.boxObject.x
			- XMigemoUI.findBar.boxObject.width
		)+'px';
		box.style.bottom = (
			document.documentElement.boxObject.height
			- XMigemoUI.findBar.boxObject.y
			- XMigemoUI.findBar.boxObject.height
		)+'px';

		XMigemoUI.toggleFindToolbarMode();

		if (XMigemoUI.strongHighlight &&
			!XMigemoUI.findHighlightCheck.disabled &&
			XMigemoUI.findHighlightCheck.checked)
			XMigemoUI.toggleHighlightScreen(true);

		if (XMigemoService.getPref('xulmigemo.prefillwithselection')) {
			var win = document.commandDispatcher.focusedWindow || window.content ;
			var sel = (win && win.getSelection() ? win.getSelection().toString() : '' ).replace(/^\s+|\s+$/g, '');
			if (!sel) return;

			if (XMigemoUI.isActive) {
				if (
					XMigemoUI.cancelTimer ||
					XMigemoFind.lastKeyword == sel ||
					XMigemoFind.lastFoundWord == sel
					)
					return;
				XMigemoUI.findAgain(sel, XMigemoUI.FIND_MODE_MIGEMO);
			}
			else {
				if (
					 aShowMinimalUI ||
					 XMigemoUI.findTerm == sel
					 )
					 return;
				XMigemoUI.findTerm = sel;
				XMigemoUI.findAgain(sel, XMigemoUI.FIND_MODE_NATIVE);
			}
		}
	},
 
	closeFindBar : function() 
	{
		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalClose.apply(scope, arguments);

		if (XMigemoUI.strongHighlight)
			XMigemoUI.destroyHighlightScreen();

		window.setTimeout('XMigemoUI.delayedCloseFindBar()', 0);
	},
	delayedCloseFindBar : function()
	{
		if (this.findBar.getAttribute('collapsed') == 'true' ||
			this.findBar.getAttribute('hidden') == 'true') {
			this.migemoModeBox.setAttribute('hidden', true);
			this.findMigemoBar.setAttribute('collapsed', true);
		}

		this.toggleFindToolbarMode();
		XMigemoFind.exitFind();
	},
 
	toggleHighlight : function(aHighlight) 
	{
		if (window.content)
			window.content.__moz_xmigemoHighlighted = aHighlight;

		if (
			XMigemoUI.strongHighlight/* &&
			((XMigemoUI.isActive ? XMigemoFind.lastFoundWord : XMigemoUI.findTerm ) || '').length > 1*/
			)
			XMigemoUI.toggleHighlightScreen(aHighlight);

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalToggleHighlight.apply(scope, arguments);
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
		dump('XMigemoUI.findNext'+'\n');
		var keyword = XMigemoUI.findTerm;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == this.FIND_MODE_MIGEMO) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.FIND_MODE_MIGEMO);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findNext(this.findBar && this.findBar.hidden ? true : false );
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
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
		dump('XMigemoUI.findPrevious'+'\n');
		var keyword = XMigemoUI.findTerm;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == this.FIND_MODE_MIGEMO) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, true);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findPrevious(this.findBar && this.findBar.hidden ? true : false );
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
		}
		else {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, false);
				XMigemoUI.isModeChanged = false;
				return;
			}
			gFindBar.xmigemoOriginalFindPrevious();
		}
	},
 
	enableFindButtons : function(aEnable) 
	{
		var highlightCheck = XMigemoUI.findHighlightCheck;
		if (!aEnable && !highlightCheck.disabled) {
			highlightCheck.xmigemoOriginalChecked = highlightCheck.checked;
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalEnableFindButtons.apply(scope, arguments);

		if (aEnable && XMigemoService.getPref('xulmigemo.checked_by_default.highlight')) {
			highlightCheck.checked = highlightCheck.xmigemoOriginalChecked;
		}

		if (highlightCheck.checked && !window.content.__moz_xmigemoHighlighted) {
			gFindBar.toggleHighlight(true);
		}
	},
 
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
  
/* Safari style highlight 
	based on http://kuonn.mydns.jp/fx/SafariHighlight.uc.js
*/
	 
	initializeHighlightScreen : function(aFrame, aDontFollowSubFrames) 
	{
		if (!aFrame)
			aFrame = this.activeBrowser.contentWindow;

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
			width: 100%;
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
		var xScroll = aWindow.document.body.scrollWidth;
		var yScroll = aWindow.innerHeight + aWindow.scrollMaxY;
		var windowWidth  = aWindow.innerWidth;
		var windowHeight = aWindow.innerHeight;
		var pageHeight = (yScroll < windowHeight) ? windowHeight : yScroll ;
		var pageWidth  = (xScroll < windowWidth) ? windowWidth : xScroll ;
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
			aFrame = this.activeBrowser.contentWindow;

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
			aFrame = this.activeBrowser.contentWindow;

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
 
	highlightFocusedFound : function(aFrame) 
	{
		if (this.highlightFocusedFoundTimer) {
			window.clearTimeout(this.highlightFocusedFoundTimer);
		}
		this.highlightFocusedFoundTimer = window.setTimeout('XMigemoUI.highlightFocusedFoundCallback()', 0);
	},
	highlightFocusedFoundCallback : function(aFrame) 
	{
		this.highlightFocusedFoundTimer = null;

		if (!aFrame)
			aFrame = this.activeBrowser.contentWindow;

		var range = this.getFoundRange(aFrame);
		if (range) {
			var node  = range.startContainer;
			var xpathResult = document.evaluate(
					'ancestor-or-self::*[@id = "__firefox-findbar-search-id" or @class = "__mozilla-findbar-search"]',
					node,
					this.NSResolver,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
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
			var step = aThis.animationTime / ((now - aThis.animationStart) || 1);
			var y = parseInt(10 * Math.sin((180 - (180 * step)) * Math.PI / 180));
			node.style.top = '-0.'+y+'em';
		}
	},
	animationTimer : null,
	animationTime  : 250,
  
	getFoundRange : function(aFrame) 
	{
		var docShell = aFrame
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShell);
		var selCon = docShell
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsISelectionDisplay)
			.QueryInterface(Components.interfaces.nsISelectionController);
		if (selCon.getDisplaySelection() == selCon.SELECTION_ATTENTION) {
			var sel   = aFrame.getSelection();
			var range = sel.getRangeAt(0);
			return range;
		}
		return null;
	},
 
	isRangeOverlap : function(aBaseRange, aTargetRange) 
	{
		if (!aBaseRange || !aTargetRange) return false;

		return (
			aBaseRange.compareBoundaryPoints(Range.START_TO_START, aTargetRange) >= 0 &&
			aBaseRange.compareBoundaryPoints(Range.END_TO_END, aTargetRange) <= 0
		);
	},
 
	selectNode : function(aNode, aDocument, aEndAfter) 
	{
		var doc = aDocument || aNode.ownerDocument;
		var selectRange = doc.createRange();

		var startOffset = 0;
		if (aNode.nodeType == Node.TEXT_NODE) {
			while (
				aNode.previousSibling &&
				(
					aNode.previousSibling.nodeType == Node.TEXT_NODE ||
					aNode.previousSibling.getAttribute('id') == '__firefox-findbar-search-id' ||
					aNode.previousSibling.getAttribute('class') == '__firefox-findbar-search'
				)
				)
			{
				aNode = aNode.previousSibling;
				startOffset += aNode.textContent.length;
			}
		}
		var endOffset = 0;
		if (aEndAfter && aEndAfter.nodeType == Node.TEXT_NODE) {
			while (
				aEndAfter.nextSibling &&
				(
					aEndAfter.nextSibling.nodeType == Node.TEXT_NODE ||
					aEndAfter.nextSibling.getAttribute('id') == '__firefox-findbar-search-id' ||
					aEndAfter.nextSibling.getAttribute('class') == '__firefox-findbar-search'
				)
				)
			{
				aEndAfter = aEndAfter.nextSibling;
				endOffset += aEndAfter.textContent.length;
			}
		}

		var sel = doc.defaultView.getSelection();
		if (startOffset || endOffset) {
			var startParent = aNode.parentNode;
			var endParent   = (aNode || aEndAfter).parentNode;
			window.setTimeout(function() {
				if (startOffset) {
					var startNode = startParent.firstChild;
					var getNext = function(aNode) {
						aNode = aNode.nextSibling || aNode.parentNode.nextSibling;
						if (aNode.nodeType != Node.TEXT_NODE)
							aNode = aNode.firstChild;
						return !aNode ? null :
								aNode.nodeType == Node.TEXT_NODE ? aNode :
								getNext(aNode);
					}
					while (startNode.textContent.length <= startOffset)
					{
						startOffset -= startNode.textContent.length;
						startNode = getNext(startNode);
					}
					selectRange.setStart(startNode, startOffset);
				}
				else {
					selectRange.setStartBefore(startParent.firstChild);
				}

				if (endOffset) {
					var endNode = endParent.lastChild;
					var getPrev = function(aNode) {
						aNode = aNode.previousSibling || aNode.parentNode.previousSibling;
						if (aNode.nodeType != Node.TEXT_NODE)
							aNode = aNode.lastChild;
						return !aNode ? null :
								aNode.nodeType == Node.TEXT_NODE ? aNode :
								getPrev(aNode);
					}
					while (endNode.textContent.length <= endOffset)
					{
						endOffset -= endNode.textContent.length;
						endNode = getPrev(endNode);
					}
					selectRange.setEnd(endNode, endNode.textContent.length - endOffset);
				}
				else {
					selectRange.setEndAfter(endParent.lastChild);
				}

				sel.removeAllRanges();
				sel.addRange(selectRange);
				XMigemoFind.setSelectionLook(doc, true);
			}, 0);
		}
		else {
			if (aEndAfter) {
				selectRange.setStartBefore(aNode);
				selectRange.setEndAfter(aEndAfter || aNode);
			}
			else if (aNode.nodeType == Node.ELEMENT_NODE) {
				selectRange.selectNodeContents(aNode);
			}
			else {
				selectRange.selectNode(aNode);
			}
			sel.removeAllRanges();
			sel.addRange(selectRange);
			XMigemoFind.setSelectionLook(doc, true);
		}
	},
 	 
	init : function() 
	{
		this.lastFindMode = this.FIND_MODE_NATIVE;

		document.addEventListener('XMigemoFindProgress', this, false);

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
		this.observe(null, 'nsPref:changed', 'xulmigemo.enableautoexit.nokeyword');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enable_by_default');
		this.observe(null, 'nsPref:changed', 'xulmigemo.timeout');
		this.observe(null, 'nsPref:changed', 'xulmigemo.highlight.showScreen');
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

		this.overrideFindBar();
		this.hackForOtherExtensions();

		window.setTimeout('XMigemoUI.delayedInit()', 0);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);
	},
	 
	delayedInit : function() { 
		window.setTimeout("XMigemoUI.findField.addEventListener('blur',  XMigemoUI.onFindBlur, false);", 0);

		if (XMigemoService.getPref('xulmigemo.checked_by_default.migemo'))
			this.findMigemoCheck.checked = this.findMigemoCheck.xmigemoOriginalChecked = true;
		if (XMigemoService.getPref('xulmigemo.checked_by_default.highlight'))
			this.findHighlightCheck.checked = this.findHighlightCheck.xmigemoOriginalChecked = true;
		if (XMigemoService.getPref('xulmigemo.checked_by_default.caseSensitive')) {
			this.findCaseSensitiveCheck.checked = this.findCaseSensitiveCheck.xmigemoOriginalChecked = true;
			gFindBar.toggleCaseSensitiveCheckbox(true);
		}

		if (XMigemoService.getPref('xulmigemo.checked_by_default.findbar'))
			gFindBar.openFindBar();
	},
 
	hackForOtherExtensions : function() 
	{
		if (typeof gSearchWP != 'undefined') { // SearchWP
			eval(
				'gSearchWPOverlay.toggleHighlight = '+
				gSearchWPOverlay.toggleHighlight.toSource().replace(
					'gSearchWPHighlighting.toggleHighlight',
					'XMigemoUI.toggleHighlightScreen(aHighlight);'+
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
					'XMigemoUI.toggleHighlightScreen(!hb.checked);'
				)
			);
		}
	},

  
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		document.removeEventListener('XMigemoFindProgress', this, false);

		var browser = this.browser;
		if (browser) {
			var target = document.getElementById('appcontent') || browser;
			target.removeEventListener('keypress', this, true);
			target.removeEventListener('mouseup', this, true);
		}

		this.findField.removeEventListener('blur', this.onFindBlur, false);

		window.removeEventListener('unload', this, false);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', XMigemoUI, false); 
 
//obsolete 
function xmFind(){dump("xmFind"+'\n');
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
function xmFindPrev(){dump("xmFindPrev"+'\n');
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
 
