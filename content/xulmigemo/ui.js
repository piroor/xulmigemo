/* 
	This depends on:
		service.js
*/

var XMigemoFind;
 
var XMigemoUI = { 
	 
/* constants */ 

	kFINDBAR_POSITION : '_moz-xmigemo-position',
	kTARGET : '_moz-xmigemo-target',
	kLAST_HIGHLIGHT : '_moz-xmigemo-last-highlight',

	kDISABLE_IME    : '_moz-xmigemo-disable-ime',
	kINACTIVATE_IME    : '_moz-xmigemo-inactivate-ime',
	get IMEAttribute()
	{
		return this.isLinux ? this.kDISABLE_IME : this.kINACTIVATE_IME ;
	},

	isLinux : (navigator.platform.toLowerCase().indexOf('linux') > -1),

	kXHTMLNS : 'http://www.w3.org/1999/xhtml',

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
  
/* internal status */ 
	
	FIND_MODE_NATIVE : Components.interfaces.pIXMigemoFind.FIND_MODE_NATIVE, 
	FIND_MODE_MIGEMO : Components.interfaces.pIXMigemoFind.FIND_MODE_MIGEMO,
	FIND_MODE_REGEXP : Components.interfaces.pIXMigemoFind.FIND_MODE_REGEXP,

	forcedFindMode   : -1,
	lastFindMode     : -1,
	backupFindMode   : -1,

	isModeChanged : false,
 
	autoStartQuickFind       : false, 
	autoExitQuickFindInherit : true,
	autoExitQuickFind        : true,
	timeout                  : 0,
 
	autoStartRegExpFind      : false, 
 
	disableIMEOnQuickFind    : false, 
 
	highlightCheckedAlways     : false, 
	highlightCheckedAlwaysMinLength : 2,
 
	caseSensitiveCheckedAlways : false, 
 
	openAgainAction : 0, 
	ACTION_NONE     : 0,
	ACTION_SWITCH   : 1,
	ACTION_CLOSE    : 2,
 
	shouldRebuildSelection : false, 
	prefillWithSelection   : false,
	workForAnyXMLDocuments : true,
 
	kLABELS_SHOW : 0, 
	kLABELS_AUTO : 1,
	kLABELS_HIDE : 2,
	buttonLabelsMode : 1,
 
	kCLOSEBUTTON_POSITION_LEFTMOST : 0, 
	kCLOSEBUTTON_POSITION_RIGHTMOST : 1,
	closeButtonPosition : 0,
	lastCloseButtonPosition : 0,
 
	kFINDBAR_POSITION_BELOW_CONTENT : 0, 
	kFINDBAR_POSITION_ABOVE_CONTENT : 1,
	kFINDBAR_POSITION_BELOW_TABS    : 2,
	findBarPositionAttrValues : [
		'belowcontent',
		'abovecontent',
		'belowtabbar'
	],
	findBarPosition : 0,
  
/* elements */ 
	
	get browser() 
	{
		return document.getElementById('content') || // Firefox
			document.getElementById('messagepane') || // Thunderbird
			document.getElementById('help-content'); // Help
	},
	
	get activeBrowser() 
	{
		return ('SplitBrowser' in window && SplitBrowser.activeBrowser) || this.browser;
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
		if (!this._findBar) {
			this._findBar = document.getElementById('FindToolbar');
		}
		return this._findBar;
	},
	_findBar : null,
	
	get findBarItems() 
	{
		var node = this.closeButton;
		var items = [];
		do {
			items.push(node);
			node = node.nextSibling;
		}
		while (node);
		return items;
	},
 
	get closeButton() 
	{
		if (this._closeButton === void(0)) {
			this._closeButton = document.getElementById('find-closebutton');
			if (!this._closeButton && this.findBar) {
				this._closeButton = this.findBar.getElement('find-closebutton');
			}
		}
		return this._closeButton;
	},
//	_closeButton : null,
 
	get label() 
	{
		if (this._label === void(0)) {
			this._label = document.getElementById('find-label');
			if (!this._label && this.findBar) {
				this._label = this.findBar.getElement('find-label');
			}
		}
		return this._label;
	},
//	_label : null,
 
	get field() 
	{
		if (this._field === void(0)) {
			this._field = document.getElementById('find-field');
			if (!this._field && this.findBar) {
				this._field = this.findBar.getElement('findbar-textbox');
			}
		}
		return this._field;
	},
//	_field : null,
 
	get findNextButton() 
	{
		if (this._findNextButton === void(0)) {
			this._findNextButton = document.getElementById('find-next');
			if (!this._findNextButton && this.findBar) {
				this._findNextButton = this.findBar.getElement('find-next');
			}
		}
		return this._findNextButton;
	},
//	_findNextButton : null,
 
	get findPreviousButton() 
	{
		if (this._findPreviousButton === void(0)) {
			this._findPreviousButton = document.getElementById('find-previous');
			if (!this._findPreviousButton && this.findBar) {
				this._findPreviousButton = this.findBar.getElement('find-previous');
			}
		}
		return this._findPreviousButton;
	},
//	_findPreviousButton : null,
 
	get caseSensitiveCheck() 
	{
		if (this._caseSensitiveCheck === void(0)) {
			this._caseSensitiveCheck = document.getElementById('find-case-sensitive');
			if (!this._caseSensitiveCheck && this.findBar) {
				this._caseSensitiveCheck = this.findBar.getElement('find-case-sensitive');
			}
		}
		return this._caseSensitiveCheck;
	},
//	_caseSensitiveCheck : null,
 
	get highlightCheck() 
	{
		if (this._highlightCheck === void(0)) {
			this._highlightCheck = document.getElementById('highlight');
			if (!this._highlightCheck && this.findBar) {
				this._highlightCheck = this.findBar.getElement('highlight');
			}
		}
		return this._highlightCheck;
	},
//	_highlightCheck : null,
  
	get findMigemoBar() 
	{
		if (!this._findMigemoBar) {
			this._findMigemoBar = document.getElementById('XMigemoFindToolbar');
		}
		return this._findMigemoBar;
	},
	_findMigemoBar : null,
	
	get findModeSelectorBox() 
	{
		if (!this._findModeSelectorBox) {
			this._findModeSelectorBox = document.getElementById('find-migemo-mode-box');
		}
		return this._findModeSelectorBox;
	},
	_findModeSelectorBox : null,
 
	get findModeSelector() 
	{
		if (!this._findModeSelector) {
			this._findModeSelector = document.getElementById('find-mode-selector');
		}
		return this._findModeSelector;
	},
	_findModeSelector : null,
 
	get timeoutIndicatorBox() 
	{
		if (!this._timeoutIndicatorBox) {
			this._timeoutIndicatorBox = ('gFindBar' in window && 'onFindAgainCommand' in gFindBar) ? document.getElementById('migemo-timeout-indicator2') : document.getElementById('migemo-timeout-indicator-box');
		}
		return this._timeoutIndicatorBox;
	},
	_timeoutIndicatorBox : null,
 
	get timeoutIndicator() 
	{
		if (!this._timeoutIndicator) {
			this._timeoutIndicator = ('gFindBar' in window && 'onFindAgainCommand' in gFindBar) ? document.getElementById('migemo-timeout-indicator2') : document.getElementById('migemo-timeout-indicator');
		}
		return this._timeoutIndicator;
	},
	_timeoutIndicator : null,
   
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
			return this.field.value.replace(/^\s+|\s+$/g, '');
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
		return (this.lastFindMode == this.FIND_MODE_NATIVE) ? this.findTerm : XMigemoFind.lastFoundWord;
	},
 
	get lastFoundRange() 
	{
		return this.getLastFoundRangeIn(this.activeBrowser.contentWindow);
	},
	getLastFoundRangeIn : function(aFrame)
	{
		var range = this.textUtils.getFoundRange(aFrame);
		if (!range) {
			var sel = aFrame.getSelection();
			if (sel &&
				sel.rangeCount &&
				sel.toString() == XMigemoUI.lastFoundTerm)
				range = sel.getRangeAt(0);
		}
		if (range) return range;

		Array.prototype.slice.call(aFrame.frames)
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
			this.closeFindBar();
		else
			this.openFindBar();
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
  
	get shouldHighlightAll() 
	{
		var term = this.findTerm;
		if (!this.highlightCheckedAlways)
			return term.length ? true : false ;

		var minLength = Math.max(1, this.highlightCheckedAlwaysMinLength);
		var termLength = term.length;

		if (this.isActive && termLength) {
			var maxLength = Math.max.apply(
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
				.concat(0) // to prevent "-Infinity" error
			);
			if (maxLength) termLength = maxLength;
		}

		return minLength <= termLength;
	},
  
/* utilities */ 
	 
	getEditableNodes : function(aDocument) 
	{
		var expression = [
					'descendant::*[',
						'local-name()="TEXTAREA" or local-name()="textarea" or ',
						'((local-name()="INPUT" or local-name()="input") and contains("TEXT text FILE file", @type))',
					']'
				].join('');
		return aDocument.evaluate(
				expression,
				aDocument,
				null,
				XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
				null
			);
	},
 
	clearSelectionInEditable : function(aFrame) 
	{
		try {
			var xpathResult = this.getEditableNodes(aFrame.document);
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
		Array.prototype.slice.call(aFrame.frames)
			.some(function(aFrame) {
				this.clearSelectionInEditable(aFrame);
			}, this);
	},
 
	disableFindFieldIME : function() 
	{
		if (!('imeMode' in this.field.style)) return;

		this.field.inputField.setAttribute(this.IMEAttribute, true);
		window.setTimeout(function(aSelf) {
			aSelf.field.inputField.removeAttribute(aSelf.IMEAttribute);
		}, 100, this);
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
  
/* preferences observer */ 
	
	domain  : 'xulmigemo', 
 
	preferences : <![CDATA[ 
		xulmigemo.autostart
		xulmigemo.autostart.regExpFind
		xulmigemo.enableautoexit.inherit
		xulmigemo.enableautoexit.nokeyword
		xulmigemo.checked_by_default.highlight.always
		xulmigemo.checked_by_default.highlight.always.minLength
		xulmigemo.checked_by_default.caseSensitive
		xulmigemo.findMode.always
		xulmigemo.enabletimeout
		xulmigemo.enabletimeout.indicator
		xulmigemo.timeout
		xulmigemo.override_findtoolbar
		xulmigemo.shortcut.findForward
		xulmigemo.shortcut.findBackward
		xulmigemo.shortcut.manualStart
		xulmigemo.shortcut.manualStart2
		xulmigemo.shortcut.manualStartLinksOnly
		xulmigemo.shortcut.manualStartLinksOnly2
		xulmigemo.shortcut.goDicManager
		xulmigemo.shortcut.manualExit
		xulmigemo.shortcut.openAgain
		xulmigemo.appearance.buttonLabelsMode
		xulmigemo.appearance.indicator.height
		xulmigemo.appearance.closeButtonPosition
		xulmigemo.disableIME.quickFind
		xulmigemo.rebuild_selection
		xulmigemo.find_delay
		xulmigemo.ignore_find_links_only_behavior
		xulmigemo.prefillwithselection
		xulmigemo.work_for_any_xml_document
	]]>.toString(),
 
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

			case 'xulmigemo.enabletimeout':
				this.shouldTimeout = value;
				return;

			case 'xulmigemo.enabletimeout.indicator':
				this.shouldIndicateTimeout = value;
				return;

			case 'xulmigemo.timeout':
				this.timeout = value;
				if (this.timeout === null)
					this.timeout = value;
				return;

			case 'xulmigemo.shortcut.findForward':
				this.findForwardKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-findForward', this.findForwardKey);
				return;

			case 'xulmigemo.shortcut.findBackward':
				this.findBackwardKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-findBackward', this.findBackwardKey);
				return;

			case 'xulmigemo.shortcut.manualStart':
				this.manualStartKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStart', this.manualStartKey);
				return;

			case 'xulmigemo.shortcut.manualStart2':
				this.manualStartKey2 = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStart2', this.manualStartKey2);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly':
				this.manualStartLinksOnlyKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStartLinksOnly', this.manualStartLinksOnlyKey);
				return;

			case 'xulmigemo.shortcut.manualStartLinksOnly2':
				this.manualStartLinksOnlyKey2 = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualStartLinksOnly2', this.manualStartLinksOnlyKey2);
				return;

			case 'xulmigemo.shortcut.manualExit':
				this.manualExitKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-manualExit', this.manualExitKey);
				return;

			case 'xulmigemo.shortcut.goDicManager':
				this.goDicManagerKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-goDicManager', this.goDicManagerKey);
				return;

			case 'xulmigemo.shortcut.openAgain':
				this.openAgainAction = value;
				return;

			case 'xulmigemo.appearance.buttonLabelsMode':
				this.buttonLabelsMode = value;
				if (value == this.kLABELS_AUTO)
					this.onChangeFindBarSize();
				else
					this.showHideLabels(value != this.kLABELS_HIDE);
				return;

			case 'xulmigemo.appearance.indicator.height':
				this.updateIndicatorHeight(value);
				return;

			case 'xulmigemo.appearance.closeButtonPosition':
				this.closeButtonPosition = value;
				this.findBarInitialShown = false;
				return;

			case 'xulmigemo.disableIME.quickFind':
				this.disableIMEOnQuickFind = value;
				return;

			case 'xulmigemo.rebuild_selection':
				this.shouldRebuildSelection = value;
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
			case 'input':
				this.onInput(aEvent);
				return;

			case 'keypress':
				this.keyEvent(aEvent, this.getFindFieldFromContent(aEvent.originalTarget));
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
					this.highlightCheck.checked) {
					window.setTimeout(function(aSelf) {
						aSelf.clearSelectionInEditable(aSelf.activeBrowser.contentWindow);
					}, 0, this);
				}
				return;

			case 'blur':
				this.onBlur(aEvent);
				return;

			case 'resize':
			case 'TreeStyleTabAutoHideStateChange':
				if (this.hidden) return;
				this.updateFloatingFindBarAppearance(aEvent);
				this.onChangeFindBarSize(aEvent);
				return;

			case 'load':
				this.init();
				return;

			case 'unload':
				this.destroy();
				return;

			case 'SubBrowserContentExpanded':
				if (!this.hidden) return;
			case 'SubBrowserAdded':
			case 'SubBrowserRemoved':
			case 'SubBrowserContentCollapsed':
				if (this.findBarPosition != this.kFINDBAR_POSITION_BELOW_TABS ||
					this.hidden)
					return;
				gFindBar.closeFindBar();
				window.setTimeout('gFindBar.openFindBar();', 100);
				return;

			case 'SubBrowserFocusMoved':
				XMigemoFind.target = this.activeBrowser;
				this.findBar.setAttribute(this.kTARGET, this.activeBrowser.id || 'subbrowser');
				if (this.findBarPosition != this.kFINDBAR_POSITION_BELOW_TABS ||
					this.hidden)
					return;
				gFindBar.closeFindBar();
				window.setTimeout('gFindBar.openFindBar();', 100);
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

		return /^(input|textarea|textbox|select|isindex|object|embed)$/i.test(aEvent.originalTarget.localName);
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
			!aFromFindField &&
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
					if (!this.dispatchKeyEventForLink(aEvent, this.activeBrowser.contentWindow)) {
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
				return false;
		}
	},
	dispatchKeyEventForLink : function(aEvent, aFrame)
	{
		if (
			aFrame.frames &&
			Array.prototype.slice.call(aFrame.frames).some(function(aFrame) {
				return this.dispatchKeyEventForLink(aEvent, aFrame);
			}, this)
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
			aFromFindField ||
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
				this.field.focus();
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
				this.disableFindFieldIME();
				XMigemoFind.clear(false);
				XMigemoFind.isLinksOnly = false;
				this.start();
				XMigemoFind.appendKeyword(String.fromCharCode(aEvent.charCode));
				this.updateStatus(XMigemoFind.lastKeyword);
				this.field.focus();
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
		XMigemoUI.delayedFindTimer = null;
	},
	delayedFindTimer : null,
	delayedFindDelay : 0,
  
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
		gFindBar.enableFindButtons(this.findTerm);
		if (found && this.highlightCheck.checked)
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
 
	onChangeFindBarSize : function(aEvent) 
	{
		var shouldUpdatePosition = false;
		if (this.findBarPosition == this.kFINDBAR_POSITION_BELOW_TABS &&
			this.lastTargetBox) {
			this.setFloatingFindBarWidth(this.lastTargetBox.boxObject.width, aEvent);
			shouldUpdatePosition = true;
		}
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
		if (shouldUpdatePosition)
			this.updateModeSelectorPosition();
	},
 
	onChangeMode : function() 
	{
		this.clearTimer();
		gFindBar.toggleHighlight(false);
		if (!this.hidden) {
			if (this.findMode != this.FIND_MODE_NATIVE &&
				!this.inCancelingProcess) {
				this.start(true);
			}
			else {
				this.cancel(true);
			}
		}
		this.lastFindMode = this.findMode;
		this.isModeChanged = true;
		if (!this.inCancelingProcess &&
			!this.hidden)
			this.field.focus();
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
		switch (this.openAgainAction)
		{
			case this.ACTION_SWITCH:
				var selector = this.findModeSelector;
				var items = selector.childNodes;
				this.findMode = items[(selector.selectedIndex + 1) % (items.length)].value;
				this.onChangeMode();
				break;

			case this.ACTION_CLOSE:
				gFindBar.closeFindBar();
				break;
		}
	},
  
/* Migemo Find */ 
	 
/* timer */ 
	 
/* Cancel Timer */ 
	shouldTimeout : true,
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
		if (this.shouldTimeout)
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
	shouldIndicateTimeout : true,

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
		else if (aThis.shouldIndicateTimeout) {
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

			if (this.shouldTimeout)
				this.startTimer();
		}

		this.lastFindMode = this.findMode;

		if (this.hidden)
			gFindBar.openFindBar();
		else
			this.toggleMode();

		if (this.findTerm != XMigemoFind.lastKeyword)
			this.findTerm = XMigemoFind.lastKeyword;
	},
 
	cancel : function(aSilently) 
	{
		if (this.inCancelingProcess) return;
		this.inCancelingProcess = true;

		this.isActive = false;

		if (!aSilently) XMigemoFind.clear(this.isQuickFind);

		if (!aSilently || this.isQuickFind)
			gFindBar.closeFindBar();
		else
			this.toggleMode();

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

		this.inCancelingProcess = false;
	},
	inCancelingProcess : false,
 
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
  
/* commands */ 
	
	commandStart : function(aEvent, aLinksOnly) 
	{
		if (this.disableIMEOnQuickFind)
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
		var doc = (win != window) ? Components.lookupMethod(win, 'document').call(win) : this.activeBrowser.contentDocument;
		XMigemoFind.setSelectionLook(doc, false);
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
		var switchers = Array.prototype.slice.call(this.findModeSelector.childNodes);
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
 
	updateIndicatorHeight : function(aHeight) 
	{
		var node = this.timeoutIndicator;
		if (aHeight) {
			node.style.minHeight = aHeight+'px';
			node.style.maxHeight = aHeight+'px';
		}
		else {
			node.style.minHeight = 'none';
			node.style.maxHeight = 'auto';
		}
	},
 
	updateItemOrder : function(aPosition) 
	{
		if (this.closeButtonPosition == this.lastCloseButtonPosition) return;
		this.lastCloseButtonPosition = this.closeButtonPosition;

		var items = this.findBarItems;
		var closebox = items.shift();
		closebox.ordinal = (this.closeButtonPosition == this.kCLOSEBUTTON_POSITION_RIGHTMOST) ?
				(items.length + 2) * 100 :
				1 ;
		items.forEach(function(aItem, aIndex) {
			aItem.ordinal = (aIndex + 1) * 100;
		});
	},
 
	updateModeSelectorPosition : function() 
	{
		var box = this.findModeSelectorBox;
		box.removeAttribute('hidden');
		box.style.height = this.findBar.boxObject.height+'px';
		box.style.right = (
				document.documentElement.boxObject.width
				- this.findBar.boxObject.x
				- this.findBar.boxObject.width
				+ (
					(this.closeButtonPosition == this.kCLOSEBUTTON_POSITION_RIGHTMOST) ?
						this.closeButton.boxObject.width + this.rightMostOffset :
						0
				)
			)+'px';
		box.style.top = (this.findBarPosition == this.kFINDBAR_POSITION_BELOW_CONTENT) ?
			'auto' :
			this.findBar.boxObject.y+'px' ;
		box.style.bottom = (this.findBarPosition == this.kFINDBAR_POSITION_BELOW_CONTENT) ?
			(
				document.documentElement.boxObject.height
				- this.findBar.boxObject.y
				- this.findBar.boxObject.height
			)+'px' :
			'auto' ;
	},
	rightMostOffset : 5,
 
	updateFindBarPosition : function() 
	{
		this.findBarPosition = XMigemoService.getPref('xulmigemo.appearance.findBarPosition');
		if (this.findBarPosition < 0 || this.findBarPosition >= this.findBarPositionAttrValues.length)
			this.findBarPosition = this.kFINDBAR_POSITION_BELOW_CONTENT;

		if ('XMigemoMail' in window && this.findBarPosition == this.kFINDBAR_POSITION_BELOW_TABS)
			this.findBarPosition = this.kFINDBAR_POSITION_ABOVE_CONTENT;

		var bar = this.findBar;
		bar.setAttribute(this.kFINDBAR_POSITION, this.findBarPositionAttrValues[this.findBarPosition]);

		if (this.findBarPosition != this.kFINDBAR_POSITION_ABOVE_CONTENT) return;

		var contentArea = document.getElementById('browser') || // Firefox
					document.getElementById('messagepane'); // Thunderbird
		try {
			if ('gFindBar' in window &&
				'uninitFindBar' in gFindBar)
				gFindBar.uninitFindBar();
		}
		catch(e) {
		}
		bar = bar.parentNode.removeChild(bar);
		contentArea.parentNode.insertBefore(bar, contentArea);
		try {
			if ('gFindBar' in window &&
				'initFindBar' in gFindBar)
				gFindBar.initFindBar();
		}
		catch(e) {
		}
	},
 
	updateFindBarAppearance : function() 
	{
		if (this.findBarPosition != this.kFINDBAR_POSITION_BELOW_TABS &&
			this.findBarPosition != this.kFINDBAR_POSITION_ABOVE_CONTENT)
			return;

		this.cleanUpOnFindBarHidden()

		var floating = (this.findBarPosition == this.kFINDBAR_POSITION_BELOW_TABS);
		if (floating) {
			this.updateFloatingFindBarAppearance();
			this.onChangeFindBarSize();
		}

		var height = this.findBar.boxObject.height;

		var target = this.target;
		var targetBox = this.targetBox;
		if (floating) targetBox.style.paddingTop = height+'px';
		target.contentWindow.scrollBy(0, height);

		this.lastTarget = target;
		this.lastTargetBox = targetBox;
		this.contentAreaYOffset = height;
	},
 
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
 
	updateFloatingFindBarAppearance : function(aEvent) 
	{
		if (this.findBarPosition != this.kFINDBAR_POSITION_BELOW_TABS) return;

		var bar = this.findBar;
		var target = this.targetBox;

		bar.style.position = 'fixed';
		bar.style.top = target.boxObject.y+'px';
		bar.style.left = target.boxObject.x+'px';

		this.setFloatingFindBarWidth(target.boxObject.width, aEvent);
	},
	 
	setFloatingFindBarWidth : function(aWidth, aEvent) 
	{
		if (aEvent &&
			aEvent.type == 'TreeStyleTabAutoHideStateChange' &&
			aEvent.shown &&
			aEvent.xOffset)
			aWidth -= aEvent.xOffset;

		var bar = this.findBar;
		bar.style.width = aWidth+'px';
		var box = document.getAnonymousElementByAttribute(bar, 'anonid', 'findbar-container');
		if (box) box.style.width = bar.style.width;
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
						).replace(
							/(\}\)?)$/,
							'XMigemoUI.updateFindUI();$1'
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

			if ('updateFindUI' in gFindBar) // Firefox 2
				eval('gFindBar.updateFindUI = '+gFindBar.updateFindUI.toSource()
					.replace(
						/(\}\)?)$/,
						'XMigemoUI.updateFindUI();$1'
					)
				);

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
			).replace(
				/if \((!doc \|\| )(!\("body" in doc\)|!\(doc instanceof HTMLDocument\))\)/,
				'if ($1($2 && (!XMigemoUI.workForAnyXMLDocuments || !(doc instanceof XMLDocument))))'
			).replace(
				'doc.body',
				'XMigemoUI.getDocumentBody(doc)'
			).replace(
				'doc.createElement(',
				'doc.createElementNS(XMigemoUI.kXHTMLNS, '
			)
		);

		var highlightTextFunc = ('_highlightText' in gFindBar) ? '_highlightText' : // Fx 3
				'highlightText'; // Fx 2, 1.5
		eval('gFindBar.'+highlightTextFunc+' = '+gFindBar[highlightTextFunc].toSource()
			.replace(
				'{',
				<![CDATA[
				{
					XMigemoUI.activeBrowser.contentDocument.documentElement.setAttribute(XMigemoUI.kLAST_HIGHLIGHT, arguments[0]);
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
					if (XMigemoUI.findTerm == XMigemoUI.activeBrowser.contentDocument.documentElement.getAttribute(XMigemoUI.kLAST_HIGHLIGHT)) return;
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

		this.field.addEventListener('input', this, true);
		this.field.addEventListener('keypress', this, true);

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
 
	openFindBar : function(aShowMinimalUI) 
	{
		var ui = XMigemoUI;
		ui.updateFindModeOnOpen();

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalOpen.apply(scope, arguments);
		ui.findMigemoBar.removeAttribute('collapsed');

		ui.updateItemOrder();
		ui.updateFindBarAppearance();
		ui.updateModeSelectorPosition();
		if (ui.lastWindowWidth != window.innerWidth) {
			ui.onChangeFindBarSize();
			ui.lastWindowWidth = window.innerWidth;
		}

		ui.toggleMode();

		ui.findBarInitialShow();

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarOpen', true, true);
		ui.findBar.dispatchEvent(event);

		if (ui.prefillWithSelection)
			ui.doPrefillWithSelection(aShowMinimalUI);
	},
	findBarInitialShow : function()
	{
		if (this.findBarInitialShown) return;
		this.findBarInitialShown = true;
		window.setTimeout(function(aSelf) {
			var items = aSelf.findBarItems;
			items = items.sort(function(aA, aB) {
					return parseInt(aA.ordinal) - parseInt(aB.ordinal);
				}).filter(function(aItem) {
					return aItem.boxObject.x;
				});
			var wrongOrder = false;
			for (var i = 0, maxi = items.length-1; i < maxi; i++)
			{
				if (items[i].boxObject.x < items[i+1].boxObject.x)
					continue;
				wrongOrder = true;
				break;
			}
			if (!wrongOrder) return;

			aSelf.findBar.hidden = true;
			window.setTimeout(function(aSelf) {
				aSelf.findBar.hidden = false;
				aSelf.field.focus();
			}, 0, aSelf);
		}, 0, this);
	},
	updateFindModeOnOpen : function()
	{
		if (this.forcedFindMode > -1 && this.findMode != this.forcedFindMode)
			this.findMode = this.forcedFindMode;

		if (this.findMode != this.FIND_MODE_NATIVE && !this.isActive) {
			this.isActive = true;
			this.lastFindMode = this.findMode;
		}
		else if (this.findMode == this.FIND_MODE_NATIVE) {
			this.isActive = false;
			this.lastFindMode = this.findMode;
		}
	},
	doPrefillWithSelection : function(aShowMinimalUI)
	{
		var win = document.commandDispatcher.focusedWindow;
		if (!win || win.top == window.top) win = window.content;
		var sel = (win && win.getSelection() ? win.getSelection().toString() : '' )
					.replace(/^\s+|\s+$/g, '')
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
 
	closeFindBar : function() 
	{
		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalClose.apply(scope, arguments);

		if (XMigemoUI.hidden) {
			XMigemoUI.findModeSelectorBox.setAttribute('hidden', true);
			XMigemoUI.findMigemoBar.setAttribute('collapsed', true);
		}
		XMigemoUI.cleanUpOnFindBarHidden();

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarClose', true, true);
		XMigemoUI.findBar.dispatchEvent(event);

		window.setTimeout(function(aSelf) {
			aSelf.delayedCloseFindBar();
		}, 0, XMigemoUI);
	},
	delayedCloseFindBar : function()
	{
		if (this.hidden) {
			this.findModeSelectorBox.setAttribute('hidden', true);
			this.findMigemoBar.setAttribute('collapsed', true);
		}

		if (this.isActive) this.cancel(true);

		this.isActive = false;

		this.toggleMode();

		this.clearHighlight(this.activeBrowser.contentDocument, true);

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
	},
 
/* highlight */ 
	
	toggleHighlight : function(aHighlight, aDelayed) 
	{
		if (XMigemoUI.highlightCheckedAlways && !aDelayed) {
			XMigemoUI.stopDelayedToggleHighlightTimer();
			XMigemoUI.delayedToggleHighlightTimer = window.setTimeout(function() {
				var highlight = XMigemoUI.shouldHighlightAll;
				var disabled = XMigemoUI.highlightCheck.disabled;
				var checked = XMigemoUI.highlightCheck.checked;
				if (highlight && (!XMigemoUI.findTerm || !checked)) highlight = false;
				if (highlight != checked || disabled)
					XMigemoUI.delayedToggleHighlight(highlight);
			}, 10);
		}

		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindBarToggleHighlight', true, true);
		event.targetHighlight = aHighlight;
		XMigemoUI.findBar.dispatchEvent(event);

		if (!aHighlight)
			XMigemoUI.activeBrowser.contentDocument.documentElement.removeAttribute(XMigemoUI.kLAST_HIGHLIGHT);

		var scope = window.gFindBar ? window.gFindBar : this ;
		scope.xmigemoOriginalToggleHighlight.apply(scope, arguments);
	},
 
	stopDelayedToggleHighlightTimer : function() 
	{
		if (this.delayedToggleHighlightTimer) {
			window.clearTimeout(this.delayedToggleHighlightTimer);
			this.delayedToggleHighlightTimer = null;
		}
	},
	delayedToggleHighlight : function(aNewState)
	{
		this.stopDelayedToggleHighlightTimer();
		if (this.highlightCheck.checked != aNewState)
			this.toggleHighlight(aNewState, true);
	},
	delayedToggleHighlightTimer : null,
 
	clearHighlight : function(aDocument, aRecursively) 
	{
		try {
			var xpathResult = this.getEditableNodes(aDocument);
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

		if (aRecursively)
			Array.prototype.slice.call(aDocument.defaultView.frames)
				.forEach(function(aFrame) {
					this.clearHighlight(aFrame.document, aRecursively);
				}, this);
	},
	clearHighlightInternal : function(aDocument, aTarget)
	{
		var foundRange = this.shouldRebuildSelection ? this.textUtils.getFoundRange(aDocument.defaultView) : null ;
		var foundLength = foundRange ? foundRange.toString().length : 0 ;
		var xpathResult = aDocument.evaluate(
				'descendant::*[@id="__firefox-findbar-search-id" or @class="__mozilla-findbar-search" or @class="__mozilla-findbar-animation"]',
				aTarget,
				null,
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
//		dump('XMigemoUI.findNext\n');
		var event = document.createEvent('Events');
		event.initEvent('XMigemoFindAgain', true, true);
		event.direction = XMigemoFind.FIND_FORWARD;
		document.dispatchEvent(event);

		var keyword = XMigemoUI.findTerm;
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode != XMigemoUI.FIND_MODE_NATIVE) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findNext(XMigemoUI.hidden ? true : false );
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
		if (XMigemoUI.isActive || XMigemoUI.lastFindMode == XMigemoUI.FIND_MODE_MIGEMO) {
			if (XMigemoUI.isModeChanged && keyword) {
				XMigemoUI.findAgain(keyword, XMigemoUI.lastFindMode);
				XMigemoUI.isModeChanged = false;
				return;
			}
			XMigemoFind.findPrevious(XMigemoUI.hidden ? true : false );
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
			gFindBar.xmigemoOriginalFindPrevious();
		}
	},
 
	enableFindButtons : function(aEnable) 
	{
		var highlightCheck = XMigemoUI.highlightCheck;
		var caseSensitive  = this.caseSensitiveCheck;
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
		var highlightCheck = aSelf.highlightCheck;
		var prevHighlightState = highlightCheck.checked;
		var checked =
			!aSelf.findTerm ?
				false :
			aSelf.highlightCheckedAlways ?
				aSelf.shouldHighlightAll :
			aSelf.highlightCheckFirst ?
				XMigemoService.getPref('xulmigemo.checked_by_default.highlight') :
				highlightCheck.xmigemoOriginalChecked ;
		highlightCheck.checked = checked;
		if (checked != prevHighlightState) {
			aSelf.toggleHighlight(checked);
		}
		aSelf.highlightCheckFirst = false;
	},
	updateHighlightCheckTimer : null,
 
	toggleMode : function(aSilently) 
	{
		if (this.isActive) {
			var caseSensitive = this.caseSensitiveCheck;
			caseSensitive.xmigemoOriginalChecked = caseSensitive.checked;
			caseSensitive.checked  = false;
			caseSensitive.disabled = true;
		}
		else  {
			var caseSensitive = this.caseSensitiveCheck;
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
		this.findBar.setAttribute(this.kTARGET, this.activeBrowser.id);

		document.addEventListener('XMigemoFindProgress', this, false);
		document.addEventListener('XMigemoFindAgain', this, false);
		window.addEventListener('resize', this, false);

		if ('SplitBrowser' in window) {
			var root = document.documentElement;
			root.addEventListener('SubBrowserAdded', this, false);
			root.addEventListener('SubBrowserRemoved', this, false);
			root.addEventListener('SubBrowserContentCollapsed', this, false);
			root.addEventListener('SubBrowserContentExpanded', this, false);
			root.addEventListener('SubBrowserFocusMoved', this, false);
		}
		if ('TreeStyleTabService' in window)
			document.addEventListener('TreeStyleTabAutoHideStateChange', this, false);

		var browser = this.browser;
		if (browser) {
			XMigemoFind = Components
				.classes['@piro.sakura.ne.jp/xmigemo/find;1']
				.createInstance(Components.interfaces.pIXMigemoFind);
			XMigemoFind.target = browser;

			if (browser.getAttribute('onkeypress'))
				browser.setAttribute('onkeypress', '');

			(document.getElementById('appcontent') || browser).addEventListener('keypress', this, true);

			var target = document.getElementById('appcontent') || browser;
			target.addEventListener('mouseup', this, true);
		}

		this.updateFindBarPosition();
		this.updateItemOrder();
		this.overrideFindBar();

		XMigemoService.addPrefListener(this);

		window.setTimeout(function(aSelf) {
			aSelf.delayedInit();
		}, 0, this);

		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);
	},
	 
	delayedInit : function() { 
		window.setTimeout("XMigemoUI.field.addEventListener('blur', this, false);", 0);

		if (XMigemoService.getPref('xulmigemo.findMode.default') > -1)
			this.findMode = XMigemoService.getPref('xulmigemo.findMode.default');
		if (XMigemoService.getPref('xulmigemo.checked_by_default.highlight'))
			this.highlightCheck.checked = this.highlightCheck.xmigemoOriginalChecked = true;
		if (XMigemoService.getPref('xulmigemo.checked_by_default.caseSensitive')) {
			this.caseSensitiveCheck.checked = this.caseSensitiveCheck.xmigemoOriginalChecked = true;
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
		window.removeEventListener('resize', this, false);

		if ('SplitBrowser' in window) {
			var root = document.documentElement;
			root.removeEventListener('SubBrowserAdded', this, false);
			root.removeEventListener('SubBrowserRemoved', this, false);
			root.removeEventListener('SubBrowserContentCollapsed', this, false);
			root.removeEventListener('SubBrowserContentExpanded', this, false);
			root.removeEventListener('SubBrowserFocusMoved', this, false);
		}
		if ('TreeStyleTabService' in window)
			document.removeEventListener('TreeStyleTabAutoHideStateChange', this, false);

		var browser = this.browser;
		if (browser) {
			(document.getElementById('appcontent') || browser).removeEventListener('keypress', this, true);
			var target = document.getElementById('appcontent') || browser;
			target.removeEventListener('mouseup', this, true);
		}

		this.field.removeEventListener('blur', this, false);
		this.field.removeEventListener('input', this, false);
		this.field.removeEventListener('keypress', this, true);

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
 
