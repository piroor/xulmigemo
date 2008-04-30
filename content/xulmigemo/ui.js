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

	ATTR_LAST_HIGHLIGHT : '_moz-xulmigemo-last-highlight',
 
	get isQuickFind() 
	{
		return XMigemoFind.isQuickFind;
	},
	set isQuickFind(val)
	{
		XMigemoFind.isQuickFind = val;
		return XMigemoFind.isQuickFind;
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
							new RegExp(XMigemoCore.getRegExp(term), 'im'),
							this.activeBrowser.contentWindow,
							true
						).map(function(aItem) {
							return (aItem || '').length;
						})
					)
				)
			);
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
 
	get orFindCheck() 
	{
		if (!this._orFindCheck) {
			this._orFindCheck = document.getElementById('find-or-mode');
		}
		return this._orFindCheck;
	},
	_orFindCheck : null,
 
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

			case 'xulmigemo.appearance.hideLabels':
				var caseSensitive = this.findCaseSensitiveCheck;
				if (value) {
					caseSensitive.setAttribute('tooltiptext', caseSensitive.getAttribute('long-label'));
					caseSensitive.setAttribute('label', caseSensitive.getAttribute('short-label'));
					this.findBar.setAttribute('labelhidden', true);
				}
				else {
					caseSensitive.removeAttribute('tooltiptext');
					caseSensitive.setAttribute('label', caseSensitive.getAttribute('long-label'));
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

//			dump("PrevKeyword:"+XMigemoFind.previousKeyword+"\nCurrentKeyword:"+XMigemoFind.lastKeyword+'\n')
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
//			dump("migemo is active"+'\n');
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
//			dump("isAutoStart:"+this.isAutoStart+'\n');
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
		var statusRes = (
				(
					aEvent.resultFlag == XMigemoFind.FOUND ||
					aEvent.resultFlag == XMigemoFind.FOUND_IN_EDITABLE
				) ||
				(
					aEvent.resultFlag == XMigemoFind.NOTLINK &&
					!XMigemoFind.manualLinksOnly
				)
			) ?
				this.nsITypeAheadFind.FIND_FOUND :
			(aEvent.resultFlag == XMigemoFind.WRAPPED) ?
				this.nsITypeAheadFind.FIND_WRAPPED :
				this.nsITypeAheadFind.FIND_NOTFOUND;

		var found = (statusRes == this.nsITypeAheadFind.FIND_FOUND || statusRes == this.nsITypeAheadFind.FIND_WRAPPED);
		gFindBar.enableFindButtons(found);
		if (found && this.findHighlightCheck.checked)
			gFindBar.setHighlightTimeout();

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
//		dump("xmigemoStartTimer"+'\n');
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
//		dump("xmigemoCancel"+'\n');
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
			window.setHighlightTimeout = gFindBar.setHighlightTimeout;
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
			XMigemoUI.lastFindMode = XMigemoUI.FIND_MODE_MIGEMO;
		}
		else if (!XMigemoUI.findMigemoCheck.checked) {
			XMigemoUI.isActive = false;
			XMigemoUI.lastFindMode = XMigemoUI.FIND_MODE_NATIVE;
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
		var foundRange = this.shouldRebuildSelection ? this.textUtils.getFoundRange(aDocument.defaultView) : null ;
		var foundLength = foundRange ? foundRange.toString().length : 0 ;
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
//		dump('XMigemoUI.findNext\n');
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
//		dump('XMigemoUI.findPrevious\n');
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
			aSelf.highlightCheckFirst ?
				XMigemoService.getPref('xulmigemo.checked_by_default.highlight') :
			(aSelf.highlightCheckedAlways) ?
				aSelf.shouldHighlightAll :
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

		this.observe(null, 'nsPref:changed', 'xulmigemo.appearance.hideLabels');

		window.setTimeout('XMigemoUI.delayedInit()', 0);

		this.orFindCheck.setAttribute('hidden', true);

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
function xmFind(){//dump("xmFind"+'\n');
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
function xmFindPrev(){//dump("xmFindPrev"+'\n');
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
 
