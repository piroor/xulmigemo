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

	enableByDefault        : false,
 
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
		if (this._browser === void(0)) {
			this._browser = document.getElementById('content') || // Firefox
							document.getElementById('messagepane'); // Thunderbird
		}
		return this._browser;
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
				XMigemoFind.findNext();
			else if (isBackwardKey)
				XMigemoFind.findPrevious();

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
			var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.browser.contentDocument;
			XMigemoFind.setSelectionLook(doc, false, false);

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
				XMigemoFind.lastKeyword += String.fromCharCode(aEvent.charCode);
				this.updateStatus(XMigemoFind.lastKeyword);
				aEvent.preventDefault();
				XMigemoFind.find();
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
			XMigemoFind.find(false, null);
		}
		else {
			XMigemoUI.lastFindMode = 'native';
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
		dump("xmigemoStartTimer"+'\n');
		this.clearTimer();
		this.cancelTimer = window.setTimeout(this.timerCallback, this.timeout, this);
		this.updateTimeoutIndicator(this.timeout);
	},
	 
	timerCallback : function(aThis) 
	{
		dump("xmigemoTimeout"+'\n');
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
  
	start : function(aSilently) 
	{
		dump('xmigemoStart'+'\n');
		this.isActive = true;
		this.lastFindMode = 'migemo';

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

		var findField = this.findField;
		if (findField.value != XMigemoFind.lastKeyword)
			findField.value = XMigemoFind.lastKeyword;
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
				xmigemoOriginalEnableFindButtons : window.enableFindButtons,
				enableFindButtons           : this.enableFindButtons,
				updateStatus                : window.updateStatus,
				find                        : window.find,
				toggleHighlight             : window.toggleHighlight,
				onFindAgainCmd              : window.onFindAgainCmd,
				onFindPreviousCmd           : window.onFindPreviousCmd,
				xmigemoOriginalFindNext     : window.findNext,
				xmigemoOriginalFindPrevious : window.findPrevious,
				toggleCaseSensitiveCheckbox : window.toggleCaseSensitivity
			};
		}

		eval('gFindBar.find = '+gFindBar.find.toSource()
			.replace(/(this._?updateStatus(UI)?\([^\)]*\))/, '$1; XMigemoFind.scrollSelectionToCenter();')
			.replace(/\{/, '{ XMigemoUI.presetSearchString(arguments.length ? arguments[0] : null); ')
		);
		eval('gFindBar.xmigemoOriginalFindNext = '+gFindBar.xmigemoOriginalFindNext.toSource()
			.replace(/(return res;)/, 'XMigemoFind.scrollSelectionToCenter(); $1')
		);
		eval('gFindBar.xmigemoOriginalFindPrevious = '+gFindBar.xmigemoOriginalFindPrevious.toSource()
			.replace(/(return res;)/, 'XMigemoFind.scrollSelectionToCenter(); $1')
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

		if ('nsBrowserStatusHandler' in window)
			eval('nsBrowserStatusHandler.prototype.onLocationChange = '+
				nsBrowserStatusHandler.prototype.onLocationChange.toSource()
					.replace(/([^\.\s]+\.)+findString/, '(XMigemoUI.findMigemoCheck.checked ? XMigemoFind.lastKeyword : $1findString)')
			);
	},
 
	getLastFindString : function(aString) 
	{
		var migemoString = XMigemoFind.previousKeyword || XMigemoFind.lastKeyword;
		return (this.lastFindMode == 'native') ? (aString || migemoString) : (migemoString || aString) ;
	},
 
	presetSearchString : function(aString) 
	{
		if (XMigemoService.getPref('xulmigemo.ignore_find_links_only_behavior')) return;

		if (!aString)
			aString = XMigemoUI.findField.value;

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
			XMigemoUI.lastFindMode = 'migemo';
		}
		else if (!XMigemoUI.findMigemoCheck.checked) {
			XMigemoUI.isActive = false;
			XMigemoUI.lastFindMode = 'native';
		}

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalOpen.apply(scope, arguments);
		XMigemoUI.findMigemoBar.removeAttribute('collapsed');

		XMigemoUI.toggleFindToolbarMode();

		if (!XMigemoUI.findMigemoBar.initialized &&
			XMigemoService.getPref('xulmigemo.appearance.migemobar.overlay')) {
			XMigemoUI.findMigemoBar.initialized = true;
			var stack = document.getElementById('migemo-stack');
			var width = (stack.boxObject.width || 100) + 10;
			stack.style.width      = width+'px';
			stack.style.marginLeft = '-'+width+'px';
		}

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
				XMigemoFind.lastKeyword = sel;
				XMigemoUI.updateStatus(sel);
				XMigemoFind.find();
			}
			else {
				if (
					 aShowMinimalUI ||
					 XMigemoUI.findField.value == sel
					 )
					 return;
				XMigemoUI.findField.value = sel;
				gFindBar.find();
			}
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
		if (this.findBar.getAttribute('collapsed') == 'true' ||
			this.findBar.getAttribute('hidden') == 'true')
			this.findMigemoBar.setAttribute('collapsed', true);

		this.toggleFindToolbarMode();
		XMigemoFind.exitFind();
	},
 
	updateStatus : function(aStatusText) 
	{
		var bar = this.findBar;
		var findField = this.findField;
		if (bar && !bar.hidden && findField) {
			findField.value = aStatusText;
		}
		else if (document.getElementById('statusbar-display')) {
			document.getElementById('statusbar-display').label = aStatusText;
		}
	},
 
	findNext : function() 
	{
		dump('XMigemoUI.findNext'+'\n');
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == 'migemo') {
			XMigemoFind.findNext(this.findBar && this.findBar.hidden);
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
		}
		else {
			gFindBar.xmigemoOriginalFindNext();
		}
	},
 
	findPrevious : function() 
	{
		dump('XMigemoUI.findPrevious'+'\n');
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == 'migemo') {
			XMigemoFind.findPrevious(this.findBar && this.findBar.hidden);
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
		}
		else {
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
  
	init : function() 
	{
		document.addEventListener('XMigemoFindProgress', this, false);

		var browser = this.browser;
		if (browser) {
			XMigemoFind.target = browser;

			if (browser.getAttribute('onkeypress'))
				browser.setAttribute('onkeypress', '');

			browser.addEventListener('keypress', this, true);
			/*if(BrowserKeyPress!=undefined){
				browser.addEventListener("keypress",BrowserKeyPress,true);
			}*/
			browser.addEventListener('mouseup', this, true);
		}

//		XMigemoUI.findField.addEventListener('blur',  XMigemoUI.onFindBlur, false);

		XMigemoService.addPrefListener(this);
		this.observe(null, 'nsPref:changed', 'xulmigemo.autostart');
		this.observe(null, 'nsPref:changed', 'xulmigemo.enable_by_default');
//		this.observe(null, 'nsPref:changed', 'xulmigemo.appearance.migemobar.overlay');
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
			browser.removeEventListener('keypress', this, true);
			browser.removeEventListener('mouseup', this, true);
		}

		this.findField.removeEventListener('blur', this.onFindBlur, false);

		window.removeEventListener('unload', this, false);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', XMigemoUI, false);
 
//obsolete 
function xmFind(){dump("xmFind"+'\n');
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword);
}
function xmFindPrev(){dump("xmFindPrev"+'\n');
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword);
}
 
