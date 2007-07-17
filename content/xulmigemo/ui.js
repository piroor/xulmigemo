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
	isAutoExitInherit      : true,
	isAutoExit             : true,
	timeout                : 0,

	highlightCheckedAlways     : false,
	highlightCheckedAlwaysMinLength : 2,
	caseSensitiveCheckedAlways : false,
	migemoCheckedAlways        : false,

	shouldRebuildSelection : false,

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

			case 'xulmigemo.enableautoexit.inherit':
				this.isAutoExitInherit = value;
				return;

			case 'xulmigemo.enableautoexit.nokeyword':
				this.isAutoExit = value;
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

			case 'xulmigemo.enable_by_default':
				this.migemoCheckedAlways = value;
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
				if (
					XMigemoFind.lastKeyword == '' &&
					(this.isAutoExitInherit ? this.isAutoStart : this.isAutoExit )
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
			}
			if ('_setHighlightTimeout' in gFindBar) // Firefox 3.0
				gFindBar.setHighlightTimeout = gFindBar._setHighlightTimeout;

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
				highlightText               : highlightText,
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
					var foundRange = XMigemoUI.shouldRebuildSelection ? XMigemoUI.getFoundRange(arguments[0].startContainer.ownerDocument.defaultView) : null ;
					var selectAfter = XMigemoUI.shouldRebuildSelection ? XMigemoUI.isRangeOverlap(foundRange, arguments[0]) : false ;
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

		if (updateGlobalFunc) {
			window.findNext      = this.findNext;
			window.findPrevious  = this.findPrevious;
			window.openFindBar   = this.openFindBar;
			window.closeFindBar  = this.closeFindBar;
			window.highlightDoc  = gFindBar.highlightDoc;
			window.highlightText = gFindBar.highlightText;
			window.highlight     = gFindBar.highlight;
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
		if (XMigemoUI.migemoCheckedAlways && !XMigemoUI.findMigemoCheck.checked)
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

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarOpen', true, true);
		XMigemoUI.findBar.dispatchEvent(event);

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

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarClose', true, true);
		XMigemoUI.findBar.dispatchEvent(event);

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
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarToggleHighlight', true, true);
		event.targetHighlight = aHighlight;
		XMigemoUI.findBar.dispatchEvent(event);

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalToggleHighlight.apply(scope, arguments);
	},
 
	clearHighlight : function(aDocument) 
	{
		var foundRange = this.shouldRebuildSelection ? this.getFoundRange(aDocument.defaultView) : null ;
		var selectOffset = foundRange ? foundRange.toString().length : 0 ;

		var xpathResult = aDocument.evaluate(
				'descendant::*[@id = "__firefox-findbar-search-id" or @class = "__mozilla-findbar-search"]',
				aDocument,
				this.NSResolver,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
		var range = aDocument.createRange();
		for (var i = 0, maxi = xpathResult.snapshotLength; i < maxi; i++)
		{
			var elem = xpathResult.snapshotItem(i);
			range.selectNodeContents(elem);

			var child   = null;
			var docfrag = aDocument.createDocumentFragment();
			var next    = elem.nextSibling;
			var parent  = elem.parentNode;
			while ((child = elem.firstChild))
			{
				docfrag.appendChild(child);
			}
			var selectAfter = this.shouldRebuildSelection ? this.isRangeOverlap(foundRange, range) : false ;
			var firstChild  = docfrag.firstChild;

			parent.removeChild(elem);
			parent.insertBefore(docfrag, next);
			if (selectAfter) {
				this.selectNode(firstChild, aDocument, selectOffset);
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
		var ranges = XMigemoFind.core.regExpHighlightText(XMigemoFind.core.getRegExp(aWord), '', aRange, aBaseNode, {});
		return ranges.length ? true : false ;
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
		var caseSensitive  = this.findCaseSensitiveCheck;
		if (!highlightCheck.disabled) {
			highlightCheck.xmigemoOriginalChecked = highlightCheck.checked;
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalEnableFindButtons.apply(scope, arguments);

		if (aEnable) {
			var prevHighlightState = highlightCheck.checked;
			highlightCheck.checked =
				XMigemoUI.highlightCheckFirst ?
					XMigemoService.getPref('xulmigemo.checked_by_default.highlight') :
				(XMigemoUI.highlightCheckedAlways) ?
					(XMigemoUI.highlightCheckedAlwaysMinLength <= XMigemoUI.findTerm.length) :
					highlightCheck.xmigemoOriginalChecked ;
			if (highlightCheck.checked != prevHighlightState) {
				XMigemoUI.toggleHighlight(highlightCheck.checked);
			}
			XMigemoUI.highlightCheckFirst = false;

			if (XMigemoUI.caseSensitiveCheckedAlways)
				caseSensitive.checked = true;
		}

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarUpdate', true, true);
		XMigemoUI.findBar.dispatchEvent(event);
	},
	highlightCheckFirst : true,
 
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
  
/* Restore selection after "highlight all" */ 
	 
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
 
	selectNode : function(aNode, aDocument, aOffset) 
	{
		var doc = aDocument || aNode.ownerDocument;
		var selectRange = doc.createRange();

		/*
			現在の選択範囲の始点が、normalize()後のテキストノードの中で
			何文字目になるかを求める
		*/
		var startNodeInfo = this.countPreviousText(aNode.previousSibling);
		var startOffset = startNodeInfo.count;

		/*
			normalize()後のテキストノードが、親ノードの何番目の子ノードに
			なるかを求める（強調表示が無い状態を想定）
		*/
		var childCount = 0;
		this.countPreviousText(aNode);
		while (startNodeInfo.lastNode.previousSibling)
		{
			startNodeInfo = this.countPreviousText(startNodeInfo.lastNode.previousSibling);
			childCount++;
		}

		var sel = doc.defaultView.getSelection();
		if (startOffset || childCount || this.countNextText(aNode).lastNode != aNode) {
			// normalize()によって選択範囲の始点・終点が変わる場合
			var startParent = aNode.parentNode;
			window.setTimeout(function() {
				// ノードの再構築が終わった後で選択範囲を復元する

				// 選択範囲の始点を含むテキストノードまで移動
				var startNode = startParent.firstChild;
				while (childCount--)
				{
					startNodeInfo = XMigemoUI.countNextText(startNode);
					startNode = startNodeInfo.lastNode.nextSibling;
				}

				var node;
				if (startOffset) {
					// 始点の位置まで移動して、始点を設定
					while (startNode.textContent.length <= startOffset)
					{
						startOffset -= startNode.textContent.length;
						node = XMigemoUI.getNextTextNode(startNode);
						if (!node) break;
						startNode = node;
					}
					selectRange.setStart(startNode, startOffset);
				}
				else {
					selectRange.setStartBefore(startParent.firstChild);
				}

				var endNode = startNode;
				while (endNode.textContent.length <= aOffset)
				{
					aOffset -= endNode.textContent.length;
					node = XMigemoUI.getNextTextNode(endNode);
					if (!node) break;
					endNode = node;
				}
				selectRange.setEnd(endNode, aOffset);

				sel.removeAllRanges();
				sel.addRange(selectRange);
				XMigemoFind.setSelectionLook(doc, true);
			}, 0);
		}
		else {
			if (aNode.nodeType == Node.ELEMENT_NODE) {
				selectRange.selectNodeContents(aNode);
			}
			else if (aOffset) {
				selectRange.setStart(aNode, 0);
				var endNode = aNode;
				while (endNode.textContent.length < aOffset)
				{
					aOffset -= endNode.textContent.length;
					node = this.getNextTextNode(endNode);
					if (!node) break;
					endNode = node;
				}
				selectRange.setEnd(endNode, aOffset);
			}
			else {
				selectRange.selectNode(aNode);
			}
			sel.removeAllRanges();
			sel.addRange(selectRange);
			XMigemoFind.setSelectionLook(doc, true);
		}
	},
	/*
		強調表示の有る無しを無視して、終端にあるテキストノードと、
		そこまでの（normalize()によって結合されるであろう）テキストノードの
		長さの和を得る。
		強調表示用の要素は常にテキストノードの直上にしか現れ得ないので、
		「強調表示用の要素がある＝強調表示が解除されたらそこはテキストノードになる」
		と判断することができる。
	*/
	countPreviousText : function(aNode)
	{
		var count = 0;
		var node = aNode;
		while (this.isTextNodeOrHighlight(node))
		{
			aNode = node;
			count += aNode.textContent.length;
			var node = aNode.previousSibling;
			if (!node) break;
		}
		return { lastNode : aNode, count : count };
	},
	countNextText : function(aNode)
	{
		var count = 0;
		var node = aNode;
		while (this.isTextNodeOrHighlight(node))
		{
			aNode = node;
			count += aNode.textContent.length;
			var node = aNode.nextSibling;
			if (!node) break;
		}
		return { lastNode : aNode, count : count };
	},
	isTextNodeOrHighlight : function(aNode)
	{
		return aNode && (
				aNode.nodeType == Node.TEXT_NODE ||
				(
					aNode.nodeType == Node.ELEMENT_NODE &&
					(
						aNode.getAttribute('id') == '__firefox-findbar-search-id' ||
						aNode.getAttribute('class') == '__firefox-findbar-search'
					)
				)
			);
	},
	getNextTextNode : function(aNode)
	{
		aNode = aNode.nextSibling || aNode.parentNode.nextSibling;
		if (aNode.nodeType != Node.TEXT_NODE)
			aNode = aNode.firstChild;
		return !aNode ? null :
				aNode.nodeType == Node.TEXT_NODE ? aNode :
				this.getNextTextNode(aNode);
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
		this.observe(null, 'nsPref:changed', 'xulmigemo.enableautoexit.inherit');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enableautoexit.nokeyword');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.highlight.always');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.highlight.always.minLength');
		this.observe(null, 'nsPref:changed', 'xulmigemo.checked_by_default.caseSensitive');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enable_by_default');
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
 
