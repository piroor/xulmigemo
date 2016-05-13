Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/api.jsm'); 
var XMigemoFind;
(function() {
	let { MigemoFind } = Components.utils.import('resource://xulmigemo-modules/core/find.js', {});
	XMigemoFind = new MigemoFind();

	Components.utils.import('resource://xulmigemo-modules/finder.jsm');
})();
 
var XMigemoUI = { 
	MESSAGE_TYPE : '{01F8DAE3-FCF4-43D6-80EA-1223B2A9F025}',
	SCRIPT_URL : 'chrome://xulmigemo/content/content.js',
	
/* constants */ 

	kFINDBAR_POSITION : '_moz-xmigemo-position',
	kTARGET           : '_moz-xmigemo-target',
	kFOCUSED          : '_moz-xmigemo-focused',

	kDISABLE_IME    : '_moz-xmigemo-disable-ime',
	kINACTIVATE_IME    : '_moz-xmigemo-inactivate-ime',
	get IMEAttribute()
	{
		return XMigemoService.isLinux ? this.kDISABLE_IME : this.kINACTIVATE_IME ;
	},

	kXHTMLNS : 'http://www.w3.org/1999/xhtml',

	nsITypeAheadFind : Components.interfaces.nsITypeAheadFind,
	nsIDOMNSEditableElement : Components.interfaces.nsIDOMNSEditableElement,
	
	get textUtils() 
	{
		if (!this._textUtils) {
			let { MigemoTextUtils } = Components.utils.import('resource://xulmigemo-modules/core/textUtils.js', {});
			this._textUtils = MigemoTextUtils;
		}
		return this._textUtils;
	},
	_textUtils : null,
  
/* internal status */ 
	
	FIND_MODE_NATIVE : XMigemoFind.FIND_MODE_NATIVE, 
	FIND_MODE_MIGEMO : XMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : XMigemoFind.FIND_MODE_REGEXP,

	forcedFindMode   : -1,
	lastFindMode     : -1,
	backupFindMode   : -1,

	isModeChanged : false,
	
	findModeVersion : 2, 
	findModeFrom1To2 : {
		'0' : XMigemoFind.FIND_MODE_NATIVE,
		'1' : XMigemoFind.FIND_MODE_MIGEMO,
		'2' : XMigemoFind.FIND_MODE_REGEXP
	},
	upgradePrefs : function()
	{
		var current = XMigemoService.getPref('xulmigemo.findMode.version') || 1;
		if (current == this.findModeVersion) return;

		var table = 'findModeFrom'+current+'To'+this.findModeVersion;
		if (table in this) {
			table = this[table];
			'xulmigemo.findMode.default xulmigemo.findMode.always'
				.split(' ')
				.forEach(function(aPref) {
					var value = XMigemoService.getPref(aPref);
					if (value != XMigemoService.getDefaultPref(aPref) && value in table)
						XMigemoService.setPref(aPref, table[value]);
				}, this);
		}

		XMigemoService.setPref('xulmigemo.findMode.version', this.findModeVersion);
	},
  
	autoStartQuickFind       : false, 
	autoExitQuickFindInherit : true,
	autoExitQuickFind        : true,
	timeout                  : 0,
	stopTimerWhileScrolling : true,
 
	autoStartRegExpFind      : false, 
 
	disableIMEOnQuickFindFor  : 7, 
	disableIMEOnNormalFindFor : 0,
 
	_modeCirculation : 0, 
	get modeCirculation()
	{
		return this._modeCirculation;
	},
	set modeCirculation(val)
	{
		this._modeCirculation = val;
		this.modeCirculationTable = [];
		if (this.modeCirculation & this.FIND_MODE_NATIVE)
			this.modeCirculationTable.push(this.FIND_MODE_NATIVE);
		if (this.modeCirculation & this.FIND_MODE_REGEXP)
			this.modeCirculationTable.push(this.FIND_MODE_REGEXP);
		if (this.modeCirculation & this.FIND_MODE_MIGEMO)
			this.modeCirculationTable.push(this.FIND_MODE_MIGEMO);
		if (this.modeCirculation & this.CIRCULATE_MODE_EXIT)
			this.modeCirculationTable.push(this.CIRCULATE_MODE_EXIT);
		return val;
	},
	modeCirculationTable : [],
	CIRCULATE_MODE_NONE : 0,
	CIRCULATE_MODE_EXIT : 256,
 
	prefillWithSelection   : false, 
	workForAnyXMLDocuments : true,
 
	kLABELS_SHOW : 0, 
	kLABELS_AUTO : 1,
	kLABELS_HIDE : 2,
	buttonLabelsMode : 1,
  
/* elements */ 
	
	get browser() 
	{
		return document.getElementById('content') || // Firefox
			document.getElementById('messagepane'); // Thunderbird
	},
 
	get target() 
	{
		return XMigemoFind.target;
	},
	
	get targetBox() 
	{
		var target = this.target;
		if (target.localName == 'tabbrowser')
			target = target.mPanelContainer;
		return target;
	},
  
	get findBar() 
	{
		return window.gFindBar;
	},
	
	get label() 
	{
		return this.findBar.getElement('find-label');
	},
 
	get field() 
	{
		return this.findBar.getElement('findbar-textbox');
	},
 
	get findNextButton() 
	{
		return this.findBar.getElement('find-next');
	},
 
	get findPreviousButton() 
	{
		return this.findBar.getElement('find-previous');
	},
 
	get caseSensitiveCheck() 
	{
		return this.findBar.getElement('find-case-sensitive');
	},
 
	get highlightCheck() 
	{
		return this.findBar.getElement('highlight');
	},
  
	get findMigemoBar() 
	{
		if (!this._findMigemoBar)
			this._findMigemoBar = document.getElementById('XMigemoFindToolbar');
		return this._findMigemoBar;
	},
	
	get findModeSelectorBox() 
	{
		if (!this._findModeSelectorBox)
			this._findModeSelectorBox = document.getElementById('find-migemo-mode-box');
		return this._findModeSelectorBox;
	},
 
	get findModeSelector() 
	{
		if (!this._findModeSelector)
			this._findModeSelector = document.getElementById('find-mode-selector');
		return this._findModeSelector;
	},
   
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
		this.onChangeMode();
		return mode;
	},
 
	get findTerm() 
	{
		try {
			return this.textUtils.trim(this.field.value);
		}
		catch(e) {
		}
		return '';
	},
	set findTerm(val)
	{
		try {
			if (this.field)
				this.field.value = val;
		}
		catch(e) {
		}
		return this.findTerm;
	},
 
	get lastFoundTerm() 
	{
		return ((this.lastFindMode == this.FIND_MODE_NATIVE) ? this.findTerm : XMigemoFind.lastFoundWord ) || '';
	},
 
	get lastFoundRange() 
	{
		return this.getLastFoundRangeIn(this.browser.contentWindow);
	},
	getLastFoundRangeIn : function(aFrame)
	{
		var range = this.textUtils.getFoundRange(aFrame);
		if (!range) {
			var sel = aFrame.getSelection();
			if (
				sel &&
				sel.rangeCount &&
				(!this.caseSensitiveCheck.disabled && this.caseSensitiveCheck.checked ?
					sel.toString() == XMigemoUI.lastFoundTerm :
					sel.toString().toLowerCase() == XMigemoUI.lastFoundTerm.toLowerCase()
				)
				)
				range = sel.getRangeAt(0);
		}
		if (range) return range;

		Array.slice(aFrame.frames)
			.some(function(aFrame) {
				range = this.getLastFoundRangeIn(aFrame);
				return range;
			}, this);
		return range;
	},
 
	get hidden() 
	{
		return (this.findBar.getAttribute('collapsed') == 'true' ||
				this.findBar.getAttribute('hidden') == 'true');
	},
	set hidden(aValue)
	{
		if (aValue)
			this.close();
		else
			this.open();
		return aValue;
	},
 
	get focused() 
	{
		return this.getFindFieldFromContent(document.commandDispatcher.focusedElement);
	},
	set focused(aValue)
	{
		if (aValue) this.field.focus();
		return aValue;
	},
	
	getFindFieldFromContent : function(aNode) 
	{
		try {
			var xpathResult = document.evaluate(
					'ancestor-or-self::*[local-name()="textbox"]',
					aNode,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			if (xpathResult.singleNodeValue == this.field)
				return xpathResult.singleNodeValue;
		}
		catch(e) {
		}
		return null;
	},
  
	get isScrolling() 
	{
		return this._isScrolling;
	},
	set isScrolling(aValue)
	{
		this._isScrolling = aValue;

		if (aValue)
			this.clearTimer();
		else if (this.isActive && this.stopTimerWhileScrolling)
			this.restartTimer();

		return aValue;
	},
	_isScrolling : false,
 
	get shouldCaseSensitive() 
	{
		return this.findMode != this.FIND_MODE_MIGEMO && this.caseSensitiveCheck.checked;
	},
  
/* utilities */ 
	
	disableFindFieldIME : function() 
	{
		if (!('imeMode' in this.field.style)) return;

		this.field.inputField.setAttribute(this.IMEAttribute, true);
		window.setTimeout(function(aSelf) {
			aSelf.field.inputField.removeAttribute(aSelf.IMEAttribute);
		}, 100, this);
	},
 
	disableFindFieldIMEForCurrentMode : function(aQuickFind) 
	{
		if (aQuickFind ?
				(this.disableIMEOnQuickFindFor & this.findMode) :
				(this.disableIMEOnNormalFindFor & this.findMode)
			)
			this.disableFindFieldIME();
	},
 
	getDocumentBody : function(aDocument) 
	{
		if (aDocument instanceof HTMLDocument)
			return aDocument.body;

		try {
			var xpathResult = aDocument.evaluate(
					'descendant::*[contains(" BODY body ", concat(" ", local-name(), " "))]',
					aDocument,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null
				);
			return xpathResult.singleNodeValue;
		}
		catch(e) {
		}
		return null;
	},
 
	clearFocusRing : function() 
	{
		this.doProcessForAllFrames(function(aFrame) {
			var nodes = aFrame.document.evaluate(
					'/descendant::*[@'+this.kFOCUSED+'="true"]',
					aFrame.document,
					null,
					XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
					null
				);
			for (var i = nodes.snapshotLength-1; i > -1; i--)
			{
				nodes.snapshotItem(i).removeAttribute(this.kFOCUSED);
			}
		}, this);
	},
	
	doProcessForAllFrames : function(aProcess, aSelf, aBrowserOrFrame) 
	{
		var b = aBrowserOrFrame || this.browser;
		var frames;
		if (b instanceof Window) {
			frames = [b];
		}
		else if (b.localName == 'tabbrowser') {
			frames = Array.slice(b.mTabContainer.childNodes)
					.map(function(aTab) {
						return aTab.linkedBrowser.contentWindow;
					});
		}
		else {
			frames = [b.contentWindow];
		}
		frames.forEach(function(aFrame) {
			if (!aFrame) return;
			if (aFrame.frames && aFrame.frames.length) {
				Array.slice(aFrame.frames).forEach(arguments.callee, this);
			}
			aProcess.call(aSelf || this, aFrame);
		}, this);
	},
  
	fireFindToolbarUpdateRequestEvent : function(aTarget) 
	{
		var event = document.createEvent('UIEvents');
		event.initUIEvent('XMigemoFindBarUpdateRequest', true, true, window, 0);
		(aTarget || document).dispatchEvent(event);
	},
  
/* preferences observer */ 
	
	domain  : 'xulmigemo', 
 
	preferences : 
		'xulmigemo.autostart\n' +
		'xulmigemo.autostart.regExpFind\n' +
		'xulmigemo.enableautoexit.inherit\n' +
		'xulmigemo.enableautoexit.nokeyword\n' +
		'xulmigemo.findMode.always\n' +
		'xulmigemo.enabletimeout\n' +
		'xulmigemo.timeout\n' +
		'xulmigemo.timeout.stopWhileScrolling\n' +
		'xulmigemo.shortcut.findForward\n' +
		'xulmigemo.shortcut.findBackward\n' +
		'xulmigemo.shortcut.manualStart\n' +
		'xulmigemo.shortcut.manualStart2\n' +
		'xulmigemo.shortcut.manualStartLinksOnly\n' +
		'xulmigemo.shortcut.manualStartLinksOnly2\n' +
		'xulmigemo.shortcut.goDicManager\n' +
		'xulmigemo.shortcut.manualExit\n' +
		'xulmigemo.shortcut.modeCirculation\n' +
		'xulmigemo.disableIME.quickFindFor\n' +
		'xulmigemo.disableIME.normalFindFor\n' +
		'xulmigemo.find_delay\n' +
		'xulmigemo.ignore_find_links_only_behavior\n' +
		'xulmigemo.prefillwithselection\n' +
		'xulmigemo.work_for_any_xml_document',
	preferencesFindBar :
		'xulmigemo.appearance.buttonLabelsMode',
 
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

			case 'xulmigemo.findMode.always':
				this.forcedFindMode = value;
				return;

			case 'xulmigemo.enabletimeout':
				this.shouldTimeout = value;
				return;

			case 'xulmigemo.timeout':
				this.timeout = value;
				if (this.timeout === null)
					this.timeout = value;
				return;

			case 'xulmigemo.timeout.stopWhileScrolling':
				this.stopTimerWhileScrolling = value;
				return;

			case 'xulmigemo.shortcut.findForward':
				this.findForwardKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-findForward', this.findForwardKey, document);
				return;

			case 'xulmigemo.shortcut.findBackward':
				this.findBackwardKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-findBackward', this.findBackwardKey, document);
				return;

			case 'xulmigemo.shortcut.manualStart':
				this.manualStartKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStart', this.manualStartKey, document);
				return;

			case 'xulmigemo.shortcut.manualStart2':
				this.manualStartKey2 = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStart2', this.manualStartKey2, document);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly':
				this.manualStartLinksOnlyKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStartLinksOnly', this.manualStartLinksOnlyKey, document);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly2':
				this.manualStartLinksOnlyKey2 = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStartLinksOnly2', this.manualStartLinksOnlyKey2, document);
				return;

			case 'xulmigemo.shortcut.manualExit':
				this.manualExitKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualExit', this.manualExitKey, document);
				return;

			case 'xulmigemo.shortcut.goDicManager':
				this.goDicManagerKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-goDicManager', this.goDicManagerKey, document);
				return;

			case 'xulmigemo.shortcut.modeCirculation':
				this.modeCirculation = value;
				return;

			case 'xulmigemo.appearance.buttonLabelsMode':
				this.buttonLabelsMode = value;
				if (value == this.kLABELS_AUTO)
					this.onChangeFindBarSize();
				else
					this.showHideLabels(value != this.kLABELS_HIDE);
				return;

			case 'xulmigemo.disableIME.quickFindFor':
				this.disableIMEOnQuickFindFor = value;
				return;

			case 'xulmigemo.disableIME.normalFindFor':
				this.disableIMEOnNormalFindFor = value;
				return;

			case 'xulmigemo.find_delay':
				this.delayedFindDelay = value;
				return;

			case 'xulmigemo.ignore_find_links_only_behavior':
				this.shouldIgnoreFindLinksOnlyBehavior = value;
				return;

			case 'xulmigemo.prefillwithselection':
				this.prefillWithSelection = value;
				return;

			case 'xulmigemo.prefillwithselection':
				this.workForAnyXMLDocuments = value;
				return;
		}
	},
  
	handleEvent : function(aEvent) /* DOMEventListener */ 
	{
		switch (aEvent.type)
		{
			case 'findbaropen':
				this.onFindBarOpen(aEvent);
				return;

			case 'input':
				this.onInput(aEvent);
				return;

			case 'keypress':
				this.onKeyPress(aEvent, this.getFindFieldFromContent(aEvent.originalTarget));
				return;

			case 'XMigemoFindBarOpen':
				this.onFindBarOpen(aEvent);
				return;

			case 'XMigemoFindBarClose':
				this.stopListen();
				return;

			case 'blur':
				this.onBlur(aEvent);
				return;

			case 'DOMContentLoaded':
				this.overrideExtensionsPreInit();
				window.removeEventListener('DOMContentLoaded', this, false);
				return;

			case 'load':
				this.init();
				return;

			case 'unload':
				this.stopListen();
				this.destroy();
				return;

			case 'mousedown':
				this.onMouseDown(aEvent);
				return;

			case 'mouseup':
				this.onMouseUp(aEvent);
				return;

			case 'scroll':
				this.onScroll(aEvent);
				return;

			case 'resize':
			case 'TreeStyleTabAutoHideStateChange':
			case 'XMigemoFindBarUpdateRequest':
				if (this.updatingFindBar) return;
				this.updatingFindBar = true;
				this.onChangeFindBarSize(aEvent);
				window.setTimeout(function(aSelf) {
					aSelf.updatingFindBar = false;
				}, 100, this);
				return;

			default:
		}
	},
	
	startListen : function() 
	{
		if (this.listening) return;
		this.listening = true;

		window.addEventListener('resize', this, false);
		window.addEventListener('XMigemoFindBarUpdateRequest', this, false);

		var target = document.getElementById('appcontent') || this.browser;
		if (target) {
			target.addEventListener('mousedown', this, true);
			target.addEventListener('mouseup', this, true);
			target.addEventListener('scroll', this, true);
		}

		if ('TreeStyleTabService' in window)
			document.addEventListener('TreeStyleTabAutoHideStateChange', this, false);
	},
 
	stopListen : function() 
	{
		if (!this.listening) return;
		this.listening = false;

		window.removeEventListener('resize', this, false);
		window.removeEventListener('XMigemoFindBarUpdateRequest', this, false);

		var target = document.getElementById('appcontent') || this.browser;
		if (target) {
			target.removeEventListener('mousedown', this, true);
			target.removeEventListener('mouseup', this, true);
			target.removeEventListener('scroll', this, true);
		}

		if ('TreeStyleTabService' in window)
			document.removeEventListener('TreeStyleTabAutoHideStateChange', this, false);
	},
 
	onKeyPress : function(aEvent, aFromFindField) 
	{
		if (
			this.processFunctionalKeyEvent(aEvent, aFromFindField) || // XUL/Migemoの終了その他のチェック
			this.processFunctionalShortcuts(aEvent, aFromFindField) ||
			this.processKeyEvent(aEvent, aFromFindField)
			)
			return;
	},
	
	processFunctionalShortcuts : function(aEvent, aFromFindField) 
	{
		if (
			!aFromFindField &&
			XMigemoService.isEventFiredInInputField(aEvent) &&
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
			XMigemoService.goDicManager(window);
			aEvent.preventDefault();
			return true;
		}

		if (!XMigemoService.isEventFiredInFindableDocument(aEvent))
			return false;

		if (isForwardKey || isBackwardKey) {
			aEvent.preventDefault();
			if (isForwardKey)
				this.commandForward(aEvent);
			else
				this.commandBackward(aEvent);
			return true;
		}

		if (
			!this.isActive &&
			(
				(!this.autoStartQuickFind && !aFromFindField) ||
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
			this.commandStart(aEvent, isStartKeyLinksOnly || isStartKeyLinksOnly2);
			aEvent.preventDefault();
			return true;
		}


		if (isExitKey) {
			aEvent.preventDefault();
			this.commandExit(aEvent);
			return true;
		}

		return false;
	},
 
	processFunctionalKeyEvent : function(aEvent, aFromFindField) 
	{
		if (!this.isActive || !this.isQuickFind) return false;

		switch (aEvent.keyCode)
		{
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_BACK_SPACE:
				if (XMigemoFind.lastKeyword.length == 0) {
					this.cancel();
					if (aFromFindField) {
						aEvent.stopPropagation();
						aEvent.preventDefault();
					}
					return true;
				}
				else if (XMigemoFind.lastKeyword.length == 1) {
					if (!aFromFindField)
						aEvent.preventDefault();
				}
				if (!aFromFindField)
					XMigemoFind.removeKeyword(1);
				this.updateStatus(XMigemoFind.lastKeyword);
				if (
					XMigemoFind.lastKeyword == '' &&
					(this.autoExitQuickFindInherit ? this.autoStartQuickFind : this.autoExitQuickFind )
					) {
					this.cancel();
				}
				else {
					if (!aFromFindField)
						aEvent.preventDefault();
					this.delayedFind();
					this.restartTimer();
				}
				return true;

			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_ENTER:
			case Components.interfaces.nsIDOMKeyEvent.DOM_VK_RETURN:
				if (aFromFindField) {
					aEvent.stopPropagation();
					aEvent.preventDefault();
					if (!this.dispatchKeyEventForLink(aEvent, this.browser.contentWindow)) {
						this.restartTimer();
						return true;
					}
				}
				this.cancel();
				this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
				return true;

			default:
				if (aFromFindField) {
					this.restartTimer();
					return true;
				}
				this.findBar._enableFindButtons(XMigemoFind.lastKeyword);
				return false;
		}
	},
	dispatchKeyEventForLink : function(aEvent, aFrame)
	{
		if (
			aFrame.frames &&
			Array.slice(aFrame.frames).some(function(aFrame) {
				return this.dispatchKeyEventForLink(aEvent, aFrame);
			}, this)
			)
			return true;

		var selection = aFrame.getSelection();
		if (selection && selection.rangeCount) {
			var range = selection.getRangeAt(0);
			var foundLink = XMigemoFind.getParentLinkFromRange(range);
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
 
	processKeyEvent : function(aEvent, aFromFindField) 
	{
		if (
			aFromFindField ||
			(XMigemoService.isEventFiredInInputField(aEvent) && !this.isActive) ||
			!XMigemoService.isEventFiredInFindableDocument(aEvent)
			)
			return false;

		if (this.isActive) {
			if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.altKey &&
				!aEvent.metaKey
				) { //普通。フックする。
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
				this.field.focus();
				aEvent.preventDefault();
				this.delayedFind();
				this.restartTimer();
				return true;
			}
		}
		else if (this.autoStartQuickFind) {
			if (aEvent.charCode == 32) { // Space
				return true;
			}
			else if (
				aEvent.charCode != 0 &&
				!aEvent.ctrlKey &&
				!aEvent.metaKey &&
				!aEvent.altKey
				) {
				this.disableFindFieldIME();
				XMigemoFind.clear(false);
				XMigemoFind.isLinksOnly = false;
				this.start();
				this.field.focus();
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
		this.delayedFindTimer = window.setTimeout(this.delayedFindCallback, this.delayedFindDelay);
	},
	delayedFindCallback : function()
	{
		XMigemoUI.find();
		XMigemoUI.findBar._enableFindButtons(XMigemoFind.lastKeyword);
		XMigemoUI.delayedFindTimer = null;
	},
	delayedFindTimer : null,
	delayedFindDelay : 0,
  
	onMouseDown : function(aEvent) 
	{
		if (!XMigemoService.isEventFiredOnScrollBar(aEvent) ||
			!this.isActive ||
			!this.stopTimerWhileScrolling)
			return;
		this.isScrolling = true;
	},
 
	onMouseUp : function(aEvent) 
	{
		if (this.isScrolling) {
			this.isScrolling = false;
			return;
		}

		if (!this.isQuickFind) {
			this.isActive = false;
			return;
		}

		this.cancel();
		this.clearTimer();//ここでタイマーを殺さないといじられてしまう。タイマー怖い。
	},
 
	onScroll : function() 
	{
		if (!this.isActive ||
			!this.stopTimerWhileScrolling ||
			this.isScrolling)
			return;
		this.restartTimer();
	},
 
	onInput : function(aEvent) 
	{
		var findTerm = aEvent.originalTarget.value;
		XMigemoFind.replaceKeyword(findTerm);

		if (this.autoStartRegExpFind && !this.isQuickFind) {
			var isRegExp = this.textUtils.isRegExp(findTerm);
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
			aEvent.stopPropagation();
			aEvent.preventDefault();
			this.start(true);
			this.delayedFind();
		}
		else {
			this.lastFindMode = this.FIND_MODE_NATIVE;
		}
	},
 
	onBlur : function() 
	{
		if (this.isQuickFind) {
			this.cancel();
		}
	},
 
	onChangeFindBarSize : function(aEvent) 
	{
		var shouldUpdatePosition = false;
		if (this.buttonLabelsMode == this.kLABELS_AUTO) {
			this.showHideLabels(true);
			var box = this.caseSensitiveCheck.boxObject;
			if (box.x + box.width > this.findModeSelector.boxObject.x - 25) {
				this.showHideLabels(false);
				shouldUpdatePosition = true;
			}
			else {
				this.showHideLabels(true);
			}
		}
		this.updateModeSelectorPosition(shouldUpdatePosition);
	},
 
	onChangeMode : function() 
	{
		this.clearTimer();
		var highlighted = this.highlightCheck.checked;
		if (highlighted) {
			this.findBar.toggleHighlight(false);
		}
		if (!this.hidden && !this.inCancelingProcess) {
			if (this.isQuickFind || this.findMode == this.FIND_MODE_NATIVE) {
				this.cancel(true);
			}
			else {
				this.start(true);
			}
		}
		this.lastFindMode = this.findMode;
		this.isModeChanged = true;
		this.disableFindFieldIMEForCurrentMode(this.isQuickFind);
		if (!this.inCancelingProcess &&
			!this.hidden) {
			this.field.focus();
		}
		if (highlighted) {
			this.findBar.toggleHighlight(true);
		}
	},
 
	// flip back to another find mode
	onClickMode : function(aEvent) 
	{
		if (!aEvent.target.selected) return;

		aEvent.stopPropagation();
		aEvent.preventDefault();

		window.setTimeout(function(aSelf, aValue) {
			aSelf.findMode = aValue == aSelf.FIND_MODE_NATIVE ?
				aSelf.FIND_MODE_MIGEMO :
				aSelf.FIND_MODE_NATIVE ;
		}, 0, this, aEvent.target.value);
	},
 
	onFindStartCommand : function() 
	{
		if (this.hidden || this.isQuickFind) return;

		if (!this.focused) return;

		window.setTimeout(function(aSelf) {
			aSelf.onFindStartCommandCallback();
		}, 0, this);
	},
	
	onFindStartCommandCallback : function() 
	{
		var nextMode = this.getModeCirculationNext();
		switch (nextMode)
		{
			case this.CIRCULATE_MODE_NONE:
				break;

			case this.CIRCULATE_MODE_EXIT:
				nextMode = this.getModeCirculationNext(nextMode);
				if (nextMode != this.CIRCULATE_MODE_EXIT) {
					this.findMode = nextMode;
				}
				this.findBar.close();
				break;

			default:
				this.findMode = nextMode;
				break;
		}
	},
	getModeCirculationNext : function(aCurrentMode)
	{
		if (!this.modeCirculationTable.length) {
			return this.CIRCULATE_MODE_NONE;
		}
		var modes = [
				this.FIND_MODE_NATIVE,
				this.FIND_MODE_REGEXP,
				this.FIND_MODE_MIGEMO,
				this.CIRCULATE_MODE_EXIT
			];
		var index = modes.indexOf(aCurrentMode || this.findMode);
		do {
			index = (index + 1) % (modes.length);	
		}
		while (this.modeCirculationTable.indexOf(modes[index]) < 0)
		return modes[index];
	},
  
	onFindBarOpen : function(aEvent) 
	{
return;
		var bar = this.findBar;

		XMigemoFind.target = bar.browser;

		if (!bar.__xulmigemo__updated) {
			bar.addEventListener('input', this, true);
			bar.addEventListener('keypress', this, true);
			bar.__xulmigemo__updated = true;
		}

/*
		this.startListen();

		this.updateModeSelectorPosition(true);
		if (this.lastWindowWidth != window.innerWidth) {
			this.onChangeFindBarSize();
			this.lastWindowWidth = window.innerWidth;
		}

		this.updateCaseSensitiveCheck();

		if (this.prefillWithSelection)
			this.doPrefillWithSelection(aEvent.isQuickFind);

		this.disableFindFieldIMEForCurrentMode(aEvent.isQuickFind);
*/
	},
	
	doPrefillWithSelection : function(aShowMinimalUI) 
	{
		var win = document.commandDispatcher.focusedWindow;
		if (!win || win.top == window.top) win = this.browser.contentWindow;
		var sel = this.textUtils.trim(win && win.getSelection() ? win.getSelection().toString() : '' )
					.replace(/\n/g, '');
		if (!sel) return;

		if (this.isActive || this.findMode != this.FIND_MODE_NATIVE) {
			if (this.isQuickFind) return;
			this.findTerm = sel;
			if (
				XMigemoFind.lastKeyword == sel ||
				XMigemoFind.lastFoundWord == sel
				)
				return;
			this.findAgain(sel, this.findMode);
		}
		else {
			if (
				 aShowMinimalUI ||
				 this.findTerm == sel
				 )
				 return;
			this.findTerm = sel;
			this.findAgain(sel, this.FIND_MODE_NATIVE);
		}
	},
   
/* Migemo Find */ 
	
/* timer */ 
	
/* Cancel Timer */ 
	shouldTimeout : true,
	cancelTimer : null,
	
	startTimer : function() 
	{
		if (!this.isQuickFind) return;
		this.clearTimer();
		this.cancelTimer = window.setTimeout(this.timerCallback, this.timeout, this);
		window.setTimeout(function(aSelf) {
			aSelf.textUtils.setSelectionLook(aSelf.browser.contentDocument, true);
		}, 0, this);
	},
	
	timerCallback : function(aThis) 
	{
		XMigemoFind.shiftLastKeyword();
		aThis.cancel();
	},
  
	restartTimer : function() 
	{
		if (!this.isQuickFind) return;
		if (this.shouldTimeout)
			this.startTimer();
	},
 
	clearTimer : function() 
	{
		if (this.cancelTimer) {
			window.clearTimeout(this.cancelTimer);
			this.cancelTimer = null;
		}
	},
  
	start : function(aSilently) 
	{
		if (this.inStartingProcess) return;
		this.inStartingProcess = true;

		this.isActive = true;

		if (!aSilently) {
			if (!this.isQuickFind) {
				this.isQuickFind = true;
				this.backupFindMode = this.findMode;
				this.findMode = this.FIND_MODE_MIGEMO;
			}

			if (this.shouldTimeout)
				this.startTimer();
		}

		this.lastFindMode = this.findMode;

		if (this.hidden) {
			this.findBar.open();
		}
		else {
			this.updateFindUI();
			this.updateCaseSensitiveCheck();
		}

		if (this.findTerm != XMigemoFind.lastKeyword)
			this.findTerm = XMigemoFind.lastKeyword;

		this.inStartingProcess = false;
	},
	inStartingProcess : false,
 
	cancel : function(aSilently) 
	{
		if (this.inCancelingProcess || this.inStartingProcess) return;
		this.inCancelingProcess = true;

		this.isActive = false;

		if (!aSilently) XMigemoFind.clear(this.isQuickFind);

		if (!aSilently || this.isQuickFind)
			this.findBar.close();
		else
			this.updateCaseSensitiveCheck();

		if (this.isQuickFind) {
			this.findMode = this.backupFindMode;
			this.backupFindMode = -1;
			this.isQuickFind = false;
		}

		if (this.delayedFindTimer) {
			window.clearTimeout(this.delayedFindTimer);
			this.delayedFindTimer = null;
		}

		this.clearTimer();

		this.inCancelingProcess = false;
	},
	inCancelingProcess : false,
 
	find : function() 
	{
		XMigemoFind.findMode = this.findMode;
		XMigemoFind.caseSensitive = this.shouldCaseSensitive;
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
			this.findBar._find();
		}
	},
  
/* commands */ 
	
	commandStart : function(aEvent, aLinksOnly) 
	{
		if (this.disableIMEOnQuickFindFor)
			this.disableFindFieldIME();
		XMigemoFind.clear(false);
		XMigemoFind.isLinksOnly = aLinksOnly ? true : false ;
		this.start();
		this.field.focus();
	},
 
	commandExit : function(aEvent) 
	{
		this.cancel();
		this.clearTimer(); // ここでタイマーを殺さないといじられてしまう
		var win = document.commandDispatcher.focusedWindow;
		var doc = (win != window) ? win.document : this.browser.contentDocument;
		this.textUtils.setSelectionLook(doc, false);
	},
 
	commandForward : function(aEvent) 
	{
		XMigemoFind.findNext(false);
		if (this.cancelTimer)
			this.startTimer();
	},
 
	commandBackward : function(aEvent) 
	{
		XMigemoFind.findPrevious(false);
		if (this.cancelTimer)
			this.startTimer();
	},
  
/* UI */ 
	
	showHideLabels : function(aShow) 
	{
		var buttons = [
				this.findNextButton,
				this.findPreviousButton,
				this.caseSensitiveCheck,
				this.highlightCheck
			];
		var switchers = Array.slice(this.findModeSelector.childNodes);
		if (aShow) {
			buttons.forEach(function(aNode) {
				aNode.removeAttribute('tooltiptext');
				aNode.setAttribute('label', aNode.getAttribute('long-label'));
			});
			switchers.forEach(function(aNode) {
				aNode.setAttribute('label', aNode.getAttribute('long-label'));
			});
		}
		else {
			buttons.forEach(function(aNode) {
				aNode.setAttribute('tooltiptext', aNode.getAttribute('long-label'));
				aNode.setAttribute('label', aNode.getAttribute('short-label'));
			});
			switchers.forEach(function(aNode) {
				aNode.setAttribute('label', aNode.getAttribute('short-label'));
			});
		}
	},
 
	updateModeSelectorPosition : function(aForceUpdate) 
	{
		var box = this.findModeSelectorBox;
		var findBarBox = this.findBar.boxObject;
		var baseState = {
				height : findBarBox.height,
				width  : findBarBox.width,
				x      : findBarBox.x,
				y      : findBarBox.y
			}.toSource();
		if (!aForceUpdate && box.lastBaseState == baseState) return;
		box.removeAttribute('hidden');
		box.style.height = findBarBox.height+'px';
		box.style.right = (
				document.documentElement.boxObject.width
				- findBarBox.x
				- findBarBox.width
			)+'px';
		box.style.top = 'auto';
		box.style.bottom = (
				document.documentElement.boxObject.height
				- findBarBox.y
				- findBarBox.height
			)+'px';
		box.lastBaseState = baseState;
	},
	rightMostOffset : 5,
 
	cleanUpOnFindBarHidden : function() 
	{
		if (!this.lastTarget) return;
		switch (this.findBarPosition)
		{
			case this.kFINDBAR_POSITION_BELOW_TABS:
				this.lastTargetBox.style.paddingTop = 0;

			case this.kFINDBAR_POSITION_ABOVE_CONTENT:
				this.lastTarget.contentWindow.scrollBy(0, -this.contentAreaYOffset);
				this.lastTarget = null;
				this.lastTargetBox = null;
				this.contentAreaYOffset = 0;
				return;

			default:
				return;
		}
	},
  
/* Override FindBar */ 
	
	overrideFindBar : function() 
	{
		this.replaceFindBarMethods();
		this.updateFindBarMethods();
	},
	replaceFindBarMethods : function()
	{
		this.findBar.__xulmigemo__enableFindButtons = this.findBar._enableFindButtons;
		this.findBar._enableFindButtons = function(...aArgs) {
			this.__xulmigemo__enableFindButtons(...aArgs);
/*
			var event = document.createEvent('Events');
			event.initEvent('XMigemoFindBarUpdate', true, false);
			XMigemoUI.findBar.dispatchEvent(event);
*/
		};

/*
		// disable Firefox's focus
		eval('this.findBar.close = '+this.findBar.close.toSource().replace(
			'if (focusedElement) {',
			'if (focusedElement && false) {'
		));
*/

		eval('this.findBar._updateFindUI = '+this.findBar._updateFindUI.toSource()
			.replace(
				/(var showMinimalUI = )([^;]+)/,
				'$1(XMigemoUI.findMode == XMigemoUI.FIND_MODE_NATIVE && $2)'
			).replace(
				/if \((this._findMode == this.(FIND_TYPEAHEAD|FIND_LINKS))\)/g,
				'if ($1 && XMigemoUI.findMode == XMigemoUI.FIND_MODE_NATIVE)'
			).replace(
				/(\}\)?)$/,
				'XMigemoUI.updateFindUI();$1'
			)
		);

		this.findBar.__xulmigemo__open  = this.findBar.open;
		this.findBar.__xulmigemo__close = this.findBar.close;

		this.findBar.open = function(aMode, ...aArgs) 
		{
			var quickFind = aMode == this.FIND_TYPEAHEAD;
			XMigemoUI.updateFindModeOnOpen(
				(quickFind ? XMigemoUI.FIND_MODE_NATIVE : 0 ),
				(quickFind != XMigemoUI.isQuickFind)
			);
			XMigemoUI.isQuickFind = quickFind;

			this.__xulmigemo__open(aMode, ...aArgs);
			XMigemoUI.finishOpen();
		};

		this.findBar.close = function(...aArgs) {
			this.__xulmigemo__close(...aArgs);

			if (XMigemoUI.hidden) {
				XMigemoUI.findModeSelectorBox.setAttribute('hidden', true);
				XMigemoUI.findMigemoBar.setAttribute('collapsed', true);
			}
			XMigemoUI.cleanUpOnFindBarHidden();

			var event = document.createEvent('Events');
			event.initEvent('XMigemoFindBarClose', true, false);
			XMigemoUI.findBar.dispatchEvent(event);

			setTimeout(XMigemoUI.delayedCloseFindBar.bind(XMigemoUI), 0);
		};

/*
		this.findBar.prefillWithSelection = false; // disable Firefox's native feature
*/
	},
	updateFindBarMethods : function()
	{
		var { here } = Components.utils.import('resource://xulmigemo-modules/lib/here.js', {});

		eval('this.findBar.onFindCommand = '+this.findBar.onFindCommand.toSource()
			.replace('{', '$& XMigemoUI.onFindStartCommand();')
		);

		if ('nsBrowserStatusHandler' in window)
			eval('nsBrowserStatusHandler.prototype.onLocationChange = '+
				nsBrowserStatusHandler.prototype.onLocationChange.toSource()
					.replace(/([^\.\s]+\.)+findString/, '((XMigemoUI.findMode != XMigemoUI.FIND_MODE_NATIVE) ? XMigemoFind.lastKeyword : $1findString)')
			);

		var findNext = this.findNextButton;
		findNext.setAttribute('long-label', findNext.getAttribute('label'));
		findNext.setAttribute('short-label', this.findMigemoBar.getAttribute('findNext-short-label'));

		var findPrevious = this.findPreviousButton;
		findPrevious.setAttribute('long-label', findPrevious.getAttribute('label'));
		findPrevious.setAttribute('short-label', this.findMigemoBar.getAttribute('findPrevious-short-label'));

		var caseSensitive = this.caseSensitiveCheck;
		caseSensitive.setAttribute('long-label', caseSensitive.getAttribute('label'));
		caseSensitive.setAttribute('short-label', this.findMigemoBar.getAttribute('caseSensitive-short-label'));

		var highlight = this.highlightCheck;
		highlight.setAttribute('long-label', highlight.getAttribute('label'));
		highlight.setAttribute('short-label', this.findMigemoBar.getAttribute('highlight-short-label'));
	},
 
	getLastFindString : function(aString) 
	{
		var migemoString = XMigemoFind.previousKeyword || XMigemoFind.lastKeyword;
		return (this.lastFindMode == this.FIND_MODE_NATIVE) ? (aString || migemoString) : (migemoString || aString) ;
	},
 
	presetSearchString : function(aString) 
	{
		if (this.shouldIgnoreFindLinksOnlyBehavior) return;

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
	shouldIgnoreFindLinksOnlyBehavior : true,
 
	finishOpen : function()
	{
		this.findMigemoBar.removeAttribute('collapsed');

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarOpen', true, false);
		event.isQuickFind = this.isQuickFind;
		this.findBar.dispatchEvent(event);
	},
	
	updateFindModeOnOpen : function(aOverrideMode, aSwitchQuickFindMode) 
	{
		if (this.forcedFindMode > -1 &&
			this.findMode != this.forcedFindMode &&
			(this.hidden || aSwitchQuickFindMode))
			this.findMode = this.forcedFindMode;

		if (aOverrideMode)
			this.findMode = aOverrideMode;

		if (this.findMode != this.FIND_MODE_NATIVE && !this.isActive) {
			this.isActive = true;
			this.lastFindMode = this.findMode;
		}
		else if (this.findMode == this.FIND_MODE_NATIVE) {
			this.isActive = false;
			this.lastFindMode = this.findMode;
		}
	},
	
	delayedCloseFindBar : function() 
	{
		if (this.hidden) {
			this.findModeSelectorBox.setAttribute('hidden', true);
			this.findMigemoBar.setAttribute('collapsed', true);
		}

		if (this.isActive) {
			this.cancel(true);
		}

		this.isActive = false;

		this.updateCaseSensitiveCheck();

		var WindowWatcher = Components
				.classes['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Components.interfaces.nsIWindowWatcher);
		if (window == WindowWatcher.activeWindow &&
			this.focused) {
			var scrollSuppressed = document.commandDispatcher.suppressFocusScroll;
			document.commandDispatcher.suppressFocusScroll = true;
			XMigemoFind.exitFind(true);
			document.commandDispatcher.suppressFocusScroll = scrollSuppressed;
		}

		this.clearFocusRing();
		var link = XMigemoFind.getParentLinkFromRange(this.lastFoundRange);
		if (link) link.focus();
	},
  
	updateStatus : function(aStatusText) 
	{
		var bar = this.findBar;
		var field = this.field;
		if (bar && !bar.hidden && field) {
			this.findTerm = aStatusText;
		}
		else if (document.getElementById('statusbar-display')) {
			document.getElementById('statusbar-display').label = aStatusText;
		}
	},
 
	updateFindUI : function() 
	{
		if (this.findMode != this.FIND_MODE_MIGEMO || !this.isQuickFind) return;
		this.label.value = this.findMigemoBar.getAttribute(
			XMigemoFind.isLinksOnly ?
				'main-label-migemo-link' :
				'main-label-migemo-normal'
		);
	},
 
	findNext : function() 
	{
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindAgain', true, false);
		event.direction = XMigemoFind.FIND_FORWARD;
		document.dispatchEvent(event);

		var keyword = XMigemoUI.findTerm;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode != XMigemoUI.FIND_MODE_NATIVE) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findNext(XMigemoUI.hidden);
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
			if (!XMigemoUI.hidden && XMigemoUI.isQuickFind)
				XMigemoUI.field.focus();
		}
		else {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.FIND_MODE_NATIVE);
				XMigemoUI.isModeChanged = false;
				return;
			}
			this.findBar.xmigemoOriginalOnFindAgainCommand(false);
		}
	},
 
	findPrevious : function() 
	{
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindAgain', true, false);
		event.direction = XMigemoFind.FIND_BACK;
		document.dispatchEvent(event);

		var keyword = XMigemoUI.findTerm;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == XMigemoUI.FIND_MODE_MIGEMO) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findPrevious(XMigemoUI.hidden);
			if (XMigemoUI.cancelTimer)
				XMigemoUI.startTimer();
			if (!XMigemoUI.hidden && XMigemoUI.isQuickFind)
				XMigemoUI.field.focus();
		}
		else {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.FIND_MODE_NATIVE);
				XMigemoUI.isModeChanged = false;
				return;
			}
			this.findBar.xmigemoOriginalOnFindAgainCommand(true);
		}
	},
 
	updateCaseSensitiveCheck : function(aSilently) 
	{
		var caseSensitive = this.caseSensitiveCheck;
		if (this.isActive && this.findMode == this.FIND_MODE_MIGEMO) {
			caseSensitive.xmigemoOriginalChecked = caseSensitive.checked;
			caseSensitive.checked  = false;
			caseSensitive.disabled = true;
			return;
		}

		caseSensitive.disabled = false;

		if (this.textUtils.isRegExp(this.findTerm) &&
			this.findMode == this.FIND_MODE_REGEXP) {
			caseSensitive.xmigemoOriginalChecked = caseSensitive.checked;
			caseSensitive.checked = !/\/[^\/]*i[^\/]*$/.test(this.findTerm);
		}
		else if ('xmigemoOriginalChecked' in caseSensitive) {
			caseSensitive.checked  = caseSensitive.xmigemoOriginalChecked;
			delete caseSensitive.xmigemoOriginalChecked;
		}
	},
  
	init : function() 
	{
		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		window.messageManager.loadFrameScript(this.SCRIPT_URL, true);

return;
		window.addEventListener('findbaropen', this, true);

		this.upgradePrefs();

		this.overrideExtensionsOnInitBefore(); // hacks.js
/*
		{
			let browser = this.browser;
			if (browser) {
				XMigemoFind.target = browser;

				if (browser.getAttribute('onkeypress'))
					browser.setAttribute('onkeypress', '');

				(document.getElementById('appcontent') || browser).addEventListener('keypress', this, true);
			}
		}

		document.addEventListener('XMigemoFindAgain', this, false);
*/

		XMigemoService.addPrefListener(this);
		XMigemoService.firstListenPrefChange(this);

		this.lastFindMode = this.FIND_MODE_NATIVE;

/*
		if (!('gFindBarInitialized' in window) || gFindBarInitialized) {
			if (typeof window.gFindBar == 'undefined')
				window.gFindBar = this.findBar;
			this.initFindBar();
		}
		else {
			let self = this;
			window.watch('gFindBarInitialized', function(aValue) {
				if (aValue && self) {
					window.setTimeout(function() {
						self.initFindBar();
						self = null;
					}, 0);
				}
				return aValue;
			});
		}
*/

		window.setTimeout(function(aSelf) {
			let { MigemoDicManager } = Components.utils.import('resource://xulmigemo-modules/core/dicManager.js', {});
			if (!MigemoDicManager.available &&
				XMigemoService.getPref('xulmigemo.dictionary.useInitializeWizard'))
				MigemoDicManager.showInitializeWizard(null);
		}, 0, this);

		this.overrideExtensionsOnInitAfter(); // hacks.js
	},
	
	initFindBar : function() 
	{
		if ('gFindBarInitialized' in window && !gFindBarInitialized)
			return;

		this.findBar.setAttribute(this.kTARGET, this.browser.id);
		this.findBar.addEventListener('XMigemoFindBarOpen', this, false);
		this.findBar.addEventListener('XMigemoFindBarClose', this, false);

		this.overrideFindBar();
		XMigemoService.firstListenPrefChange(this, this.preferencesFindBar);

		window.setTimeout(function(aSelf) {
			window.setTimeout("XMigemoUI.field.addEventListener('blur', XMigemoUI, false);", 0);

			if (!aSelf.hidden) {
				aSelf.finishOpen();
			}
			else {
				if (XMigemoService.getPref('xulmigemo.findMode.default') > -1)
					aSelf.findMode = XMigemoService.getPref('xulmigemo.findMode.default');
			}
		}, 0, this);
	},
  
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		window.messageManager.broadcastAsyncMessage(this.MESSAGE_TYPE, {
			command : 'shutdown'
		});
		window.messageManager.removeDelayedFrameScript(this.SCRIPT_URL);

/*
		window.removeEventListener('findbaropen', this, true);

		this.findBar.removeEventListener('XMigemoFindBarOpen', this, false);
		this.findBar.removeEventListener('XMigemoFindBarClose', this, false);
		document.removeEventListener('XMigemoFindAgain', this, false);

		var browser = this.browser;
		if (browser) {
			(document.getElementById('appcontent') || browser).removeEventListener('keypress', this, true);
		}

		this.field.removeEventListener('blur', this, false);
		this.field.removeEventListener('input', this, false);
		this.field.removeEventListener('keypress', this, true);
*/

		window.removeEventListener('unload', this, false);
	},
 
	dummy : null
}; 
  
window.addEventListener('load', XMigemoUI, false); 
window.removeEventListener('DOMContentLoaded', XMigemoUI, false);
 
//obsolete 
function xmFind(){
XMigemoFind.find(false, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
function xmFindPrev(){
XMigemoFind.find(true, XMigemoFind.lastKeyword || XMigemoFind.previousKeyword, false);
}
 
