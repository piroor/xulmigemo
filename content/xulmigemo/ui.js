/* 
	This depends on:
		service.js
		find.js
*/
 
var XMigemoUI = { 
	 
	lastFindMode           : 'native', 
	isFindbarFocused       : false,
 
	isAutoStart            : false, 
	timeout                : 0,

	autoClose              : false,
	enableByDefault        : false,
 
	nsITypeAheadFind : Components.interfaces.nsITypeAheadFind, 
 
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
 
	get timeoutIndicator() 
	{
		if (!this._timeoutIndicator) {
			this._timeoutIndicator = document.getElementById('migemo-timeout-indicator');
		}
		return this._timeoutIndicator;
	},
	_timeoutIndicator : null,
 
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

			case 'xulmigemo.enable_by_default':
				this.enableByDefault = value;
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

		if (shouldGoDicManager) {
			XMigemoService.goDicManager();
			aEvent.preventDefault();
			return true;
		}

		if (isForwardKey || isBackwardKey) {
			aEvent.preventDefault();

			if (isForwardKey)
				XMigemoFind.findNext();
			else if (isBackwardKey)
				XMigemoFind.findPrevious();

			mydump("PrevKeyword:"+XMigemoFind.previousKeyword+"\nCurrentKeyword:"+XMigemoFind.lastKeyword)
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

		return false;
	},
 
	processFunctionalKeyEvent : function(aEvent) 
	{
		if (!this.isActive) return false;

		switch (aEvent.keyCode)
		{
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE:
				if (XMigemoFind.lastKeyword.length == 1) {
					aEvent.preventDefault();
				}
				XMigemoFind.lastKeyword = XMigemoFind.lastKeyword.substr(0, XMigemoFind.lastKeyword.length - 1);
				this.updateStatus(XMigemoFind.lastKeyword);
				if (XMigemoFind.lastKeyword == '') {
					this.cancel();
				}
				else {
					aEvent.preventDefault();
					XMigemoFind.find();
					this.restartTimer();
				}
				return true;

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ESCAPE:
				this.cancel();
				this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
				var win = document.commandDispatcher.focusedWindow;
				var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : document.getElementById('content').contentDocument;
				XMigemoFind.setSelectionLook(doc, false, false);
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
			mydump("migemo is active");
			if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
				) { //普通。フックする。
				XMigemoFind.lastKeyword += String.fromCharCode(aEvent.charCode);
				this.updateStatus(XMigemoFind.lastKeyword);
				aEvent.preventDefault();
				XMigemoFind.find();
				this.restartTimer();
				return true;
			}
		}
		else if (this.isAutoStart) {
			mydump("isAutoStart:"+this.isAutoStart);
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
				XMigemoFind.lastKeyword += String.fromCharCode(aEvent.charCode);
				this.updateStatus(XMigemoFind.lastKeyword);
				aEvent.preventDefault();
				XMigemoFind.find();
				this.restartTimer();
				return true;
			}
		}
	},
  
	mouseEvent : function(aEvent) 
	{
		if (!this.autoClose) {
			XMigemoUI.cancel(true);
			return;
		}

//		mydump("mouseEvent.originalTarget:"+aEvent.originalTarget.tagName.toLowerCase());
		this.cancel();
		this.clearTimer();//ここでタイマーを殺さないといじられてしまう。タイマー怖い。
	},
 
	onXMigemoFindProgress : function(aEvent) 
	{
		gFindBar.enableFindButtons(!(aEvent.resultFlag == XMigemoFind.NOTFOUND || aEvent.resultFlag == XMigemoFind.NOTLINK));

		// migemoでヒットした全ての語を強調表示するととんでもないことになるので、
		// ハイライト表示のボタンだけは常に無効にしておこう。
		// this.findHighlightCheck.disabled = true;
		// →最後にヒットした語句のみを強調表示するように仕様変更したので、
		//   機能を復活させた

		var statusRes;
		switch (aEvent.resultFlag)
		{
			case XMigemoFind.FOUND:
				if (this.nsITypeAheadFind)
					statusRes = this.nsITypeAheadFind.FIND_FOUND;
				//alert(gFoundRange.toString());

				if (this.findHighlightCheck.checked)
					gFindBar.setHighlightTimeout();
				break;

			case XMigemoFind.NOTFOUND:
			case XMigemoFind.NOTLINK:
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
		XMigemoFind.lastKeyword = aEvent.target.value;
		if (XMigemoUI.findMigemoCheck.checked) {
			XMigemoUI.start(true);
			aEvent.stopPropagation();
			aEvent.preventDefault();
			XMigemoFind.find(false, null, true);
		}
		else {
			XMigemoUI.lastFindMode = 'native';
		}
	},
 
	onFindBlur : function() 
	{
		XMigemoUI.cancel(true);
	},

 
	onChangeFindToolbarMode : function() 
	{
		this.clearTimer();
		gFindBar.toggleHighlight(false);
		if (this.findMigemoCheck.checked) {
			this.start(true);
		}
		else {
			this.cancel(true);
			this.lastFindMode = 'native';
		}
	},
  
/* timer */ 
	
/* Cancel Timer */ 
	cancelTimer : null,
	 
	startTimer : function() 
	{
		mydump("xmigemoStartTimer");
		this.clearTimer();
		this.cancelTimer = window.setTimeout(this.timerCallback, this.timeout, this);
		this.updateTimeoutIndicator(this.timeout);
	},
	 
	timerCallback : function(aThis) 
	{
		mydump("xmigemoTimeout");
		XMigemoFind.previousKeyword = XMigemoFind.lastKeyword;
		aThis.cancel();
	},
  
	restartTimer : function() 
	{
		if (XMigemoService.getPref('xulmigemo.enabletimeout'))
			this.startTimer();
	},
 
	clearTimer : function() 
	{
		mydump("xmigemoClearTimer");
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
			aThis.timeoutIndicator.setAttribute('hidden', true);
			if (aThis.indicatorStartTime)
				aThis.indicatorStartTime = null;
		}
		else if (XMigemoService.getPref('xulmigemo.enabletimeout.indicator')) {
			aThis.timeoutIndicator.setAttribute('value', value+'%');
			aThis.timeoutIndicator.removeAttribute('hidden');

			aCurrent = aTimeout - parseInt(((new Date()).getTime() - aThis.indicatorStartTime));

			aThis.indicatorTimer = window.setTimeout(arguments.callee, 50, aTimeout, aCurrent, aThis);
		}
	},
  
	start : function() 
	{
		mydump('xmigemoStart');
		this.isActive = true;
		this.lastFindMode = 'migemo';

		if (this.findBarHidden &&
			XMigemoService.getPref('xulmigemo.enabletimeout'))
			this.startTimer();

		if (this.findBarHidden) {
			this.autoClose = true;
			gFindBar.openFindBar();
		}
		else
			this.toggleFindToolbarMode();

		var findField = this.findField;
		if (findField.value != XMigemoFind.lastKeyword)
			findField.value = XMigemoFind.lastKeyword;
	},
 
	cancel : function(aSilently) 
	{
		mydump("xmigemoCancel");
		this.isActive = false;

		if (!aSilently) XMigemoFind.clear();

		if (!aSilently) {
			if (this.autoClose)
				gFindBar.closeFindBar();
			else
				this.toggleFindToolbarMode();
		}

		this.autoClose = false;

		this.updateTimeoutIndicator(-1);
		this.clearTimer();
	},
 
/* Override FindBar */ 
	 
	overrideFindBar : function() 
	{
		/*
			基本ポリシー：
			Firefox 1.x～2.0～3.0の間でメソッド名などが異なる場合は、
			すべてFirefox 2.0に合わせる。
		*/

		var bar = this.findBar.parentNode.removeChild(this.findBar);
		this.findMigemoBar.insertBefore(bar, this.findMigemoBar.firstChild);
		bar.setAttribute('flex', 1);

		var updateGlobalFunc = false;

		if ('gFindBar' in window) {
			gFindBar.xmigemoOriginalFindNext = ('onFindAgainCommand' in gFindBar) ?
				function() { // Firefox 3.0-
					gFindBar.onFindAgainCommand(false);
				} :
				gFindBar.findNext; // Firefox 1.x-2.0
			gFindBar.xmigemoOriginalFindPrevious = ('onFindAgainCommand' in gFindBar) ?
				function() { // Firefox 3.0-
					gFindBar.onFindAgainCommand(true);
				} :
				gFindBar.findPrevious; // Firefox 1.x-2.0

			gFindBar.findNext     = this.findNext;
			gFindBar.findPrevious = this.findPrevious;

			if (!('openFindBar' in gFindBar)) { // Firefox 3.0
				gFindBar.enableFindButtons = gFindBar._enableFindButtons;
				gFindBar.find              = gFindBar._find;

				gFindBar.xmigemoOriginalOpen  = gFindBar.open;
				gFindBar.xmigemoOriginalClose = gFindBar.close;
				gFindBar.open                 = this.openFindBar;
				gFindBar.close                = this.closeFindBar;
			}
			else {
				gFindBar.xmigemoOriginalOpen  = gFindBar.openFindBar;
				gFindBar.xmigemoOriginalClose = gFindBar.closeFindBar;
			}
			gFindBar.openFindBar  = this.openFindBar;
			gFindBar.closeFindBar = this.closeFindBar;

			if (!('updateStatus' in gFindBar)) {
				if ('updateStatusBar' in gFindBar) // old
					gFindBar.updateStatus = gFindBar.updateStatusBar;
				if ('_updateStatusUI' in gFindBar) // Firefox 3.0
					gFindBar.updateStatus = gFindBar._updateStatusUI;
			}
		}
		else {
			updateGlobalFunc = true;
			window.gFindBar = {
				openFindBar                 : this.openFindBar,
				closeFindBar                : this.closeFindBar,
				xmigemoOriginalOpen         : window.openFindBar,
				xmigemoOriginalClose        : window.closeFindBar,
				enableFindButtons           : window.enableFindButtons,
				updateStatus                : window.updateStatus,
				find                        : window.find,
				toggleHighlight             : window.toggleHighlight,
				onFindAgainCmd              : window.onFindAgainCmd,
				onFindPreviousCmd           : window.onFindPreviousCmd,
				xmigemoOriginalFindNext     : window.findNext,
				xmigemoOriginalFindPrevious : window.findPrevious
			};
		}

		// Firefox 3.0-    : onFindAgainCommand / searcgString
		// Firefox 1.x-2.0 : onFindAgainCmd / onFindPreviousCmd / findString
		if ('onFindAgainCommand' in gFindBar) {
			eval('gFindBar.onFindAgainCommand = '+gFindBar.onFindAgainCommand.toSource().replace(/(\.(find|search)String)/g, '$1 || XMigemoFind.lastKeyword || XMigemoFind.previousKeyword'));
		}
		else {
			eval('gFindBar.onFindAgainCmd = '+gFindBar.onFindAgainCmd.toSource().replace(/(\.(find|search)String)/g, '$1 || XMigemoFind.lastKeyword || XMigemoFind.previousKeyword'));
			eval('gFindBar.onFindPreviousCmd = '+gFindBar.onFindPreviousCmd.toSource().replace(/(\.(find|search)String)/g, '$1 || XMigemoFind.lastKeyword || XMigemoFind.previousKeyword'));
		}

		eval('gFindBar.toggleHighlight = '+gFindBar.toggleHighlight.toSource().replace(/var word = /, 'var word = XMigemoUI.isActive ? XMigemoFind.lastFoundWord : '));

		if (updateGlobalFunc) {
			window.findNext          = this.findNext;
			window.findPrevious      = this.findPrevious;
			window.openFindBar       = this.openFindBar;
			window.closeFindBar      = this.closeFindBar;
			if ('onFindAgainCmd' in gFindBar) { // Firefox 1.x-2.0
				window.onFindAgainCmd    = gFindBar.onFindAgainCmd;
				window.onFindPreviousCmd = gFindBar.onFindPreviousCmd;
			}
		}

		this.findField.addEventListener('input', this.onInputFindToolbar, true);


		eval('nsBrowserStatusHandler.prototype.onLocationChange = '+
			nsBrowserStatusHandler.prototype.onLocationChange.toSource().replace(/([^\.\s]+\.)+findString/, '(XMigemoUI.findMigemoCheck.checked ? XMigemoFind.lastKeyword : $1findString)'));
	},
 
	openFindBar : function(aShowMinimalUI) 
	{
		if (XMigemoUI.enableByDefault &&
			!XMigemoUI.isActive/* &&
			!aShowMinimalUI*/) {
			XMigemoUI.isActive = true;
			XMigemoUI.lastFindMode = 'migemo';
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalOpen.apply(scope, arguments);
		XMigemoUI.findMigemoBar.removeAttribute('collapsed');

//		if (!aShowMinimalUI)
			XMigemoUI.toggleFindToolbarMode();
//		window.setTimeout("XMigemoUI.findField.addEventListener('blur',  XMigemoUI.onFindBlur, false);", 0);

		if (!XMigemoUI.findMigemoBar.initialized &&
			XMigemoService.getPref('xulmigemo.appearance.migemobar.overlay')) {
			XMigemoUI.findMigemoBar.initialized = true;
			var stack = document.getElementById('migemo-stack');
			var width = (stack.boxObject.width || 100) + 10;
			stack.style.width      = width+'px';
			stack.style.marginLeft = '-'+width+'px';
		}
	},
 
	closeFindBar : function() 
	{
		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalClose.apply(scope, arguments);
		window.setTimeout('XMigemoUI.delayedCloseFindBar()', 0);
	},
	delayedCloseFindBar : function()
	{
//		this.findField.removeEventListener('blur',  this.onFindBlur, false);
		if (this.findBar.getAttribute('collapsed') == 'true' ||
			this.findBar.getAttribute('hidden') == 'true')
			this.findMigemoBar.setAttribute('collapsed', true);
		this.toggleFindToolbarMode();
	},
 
	updateStatus : function(aStatusText) 
	{
		var bar = this.findBar;
		var findField = this.findField;
		if (bar && !bar.hidden && findField) {
			findField.value = aStatusText;
		}
		else {
			document.getElementById('statusbar-display').label = aStatusText;
		}
	},
 
	findNext : function() 
	{
		mydump('XMigemoUI.findNext');
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == 'migemo') {
			XMigemoFind.findNext(this.findBar ? this.findBar.hidden : true );
		}
		else {
			gFindBar.xmigemoOriginalFindNext();
		}
	},
 
	findPrevious : function() 
	{
		mydump('XMigemoUI.findPrevious');
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == 'migemo') {
			XMigemoFind.findPrevious(this.findBar ? this.findBar.hidden : true );
		}
		else {
			gFindBar.xmigemoOriginalFindPrevious();
		}
	},
 
	toggleFindToolbarMode : function(aSilently) 
	{
		if (this.isActive) {
			this.findMigemoCheck.checked = true;

			var caseSensitive = this.findCaseSensitiveCheck;
			if (caseSensitive) {
				caseSensitive.disabled = true;
				caseSensitive.xmigemoOriginalChecked = caseSensitive.checked;
				caseSensitive.checked  = false;
			}
		}
		else  {
			this.findMigemoCheck.checked = false;

			var caseSensitive = this.findCaseSensitiveCheck;
			if (caseSensitive) {
				caseSensitive.disabled = false;
				caseSensitive.checked  = caseSensitive.xmigemoOriginalChecked;
			}
		}
	},
  
	init : function() 
	{
		document.addEventListener('XMigemoFindProgress', this, false);

		//BrowserKeyPress
		var browser = document.getElementById('content');
		if (browser.getAttribute('onkeypress'))
			browser.setAttribute('onkeypress', '');

		browser.addEventListener('keypress', this, true);
		/*if(BrowserKeyPress!=undefined){
			browser.addEventListener("keypress",BrowserKeyPress,true);
		}*/
		browser.addEventListener('mouseup', this, true);

//		XMigemoUI.findField.addEventListener('blur',  XMigemoUI.onFindBlur, false);
		window.setTimeout("XMigemoUI.findField.addEventListener('blur',  XMigemoUI.onFindBlur, false);", 0);

		XMigemoService.addPrefListener(this);
		this.observe(null, 'nsPref:changed', 'xulmigemo.autostart');
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
		this.observe(null, 'nsPref:changed', 'xulmigemo.appearance.indicator.height');

		this.overrideFindBar();
	},
 
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		document.removeEventListener('XMigemoFindProgress', this, false);

		var browser = document.getElementById('content');
		browser.removeEventListener('keypress', this, true);
		browser.removeEventListener('mouseup', this, true);

		XMigemoUI.findField.removeEventListener('blur',  XMigemoUI.onFindBlur, false);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', function() { 
	XMigemoUI.init();
}, false);
window.addEventListener('unload', function() {
	XMigemoUI.destroy();
}, false);
 
//obsolete 
function xmFind(){mydump("xmFind");
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword);
}
function xmFindPrev(){mydump("xmFindPrev");
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword);
}
 
