Cu.import('resource://xulmigemo-modules/service.jsm'); 
Cu.import('resource://xulmigemo-modules/api.jsm'); 

(function() {
Cu.import('resource://xulmigemo-modules/finder.jsm', {});
Cu.import('resource://xulmigemo-modules/remoteFinder.jsm', {});

var { MigemoConstants } = Cu.import('resource://xulmigemo-modules/constants.jsm', {});
var { MigemoTextUtils } = Cu.import('resource://xulmigemo-modules/core/textUtils.js', {});
var { inherit } = Cu.import('resource://xulmigemo-modules/lib/inherit.jsm', {});
 
window.XMigemoUI = inherit(MigemoConstants, { 
	
/* constants */ 
	get FIND_NORMAL()
	{
		return this.findBar.FIND_NORMAL;
	},
	get FIND_TYPEAHEAD()
	{
		return this.findBar.FIND_TYPEAHEAD;
	},
	get FIND_LINKS()
	{
		return this.findBar.FIND_LINKS;
	},

	kDISABLE_IME    : 'data-xmigemo-disable-ime',
	kINACTIVATE_IME    : 'data-xmigemo-inactivate-ime',
	get IMEAttribute()
	{
		return XMigemoService.isLinux ? this.kDISABLE_IME : this.kINACTIVATE_IME ;
	},

	kFIND_MODE : 'data-xmigemo-find-mode',
  
/* internal status */ 
	
	findModeVersion : 2, 
	findModeFrom1To2 : {
		'0' : MigemoConstants.FIND_MODE_NATIVE,
		'1' : MigemoConstants.FIND_MODE_MIGEMO,
		'2' : MigemoConstants.FIND_MODE_REGEXP
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
  
/* elements */ 
	
	get findBarsContainer()
	{
		return window.gBrowser || // Firefox
				document.getElementById('messagepane'); // Thunderbird
	},

	get findBar() 
	{
		return window.gFindBar || // Firefox
				document.getElementById('FindToolbar'); // Thunderbird
	},

	get findBarClosebox()
	{
		return document.getAnonymousElementByAttribute(this.findBar, 'anonid', 'find-closebutton');
	},

	get field()
	{
		return this.findBar._findField;
	},

	get finder()
	{
		return this.findBar._browser.finder;
	},

	get isQuickFind()
	{
		var findbar = this.findBar;
		var findbarMode = findbar.findMode;
		return findbarMode == findbar.FIND_TYPEAHEAD || findbarMode == findbar.FIND_LINKS;
	},

	get isFocused()
	{
		var focusedElement = Cc['@mozilla.org/focus-manager;1']
							.getService(Ci.nsIFocusManager)
							.focusedElement;
		return this.isInFindBar(focusedElement);
	},

	get currentFindContext()
	{
		return this.isQuickFind ?
				MigemoConstants.FIND_CONTEXT_QUICK :
				MigemoConstants.FIND_CONTEXT_NORMAL ;
	},
 
	get findMigemoBar() 
	{
		delete this.findMigemoBar;
		return this.findMigemoBar = document.getElementById('XMigemoFindToolbar');
	},
	
	get findModeSelectorBox() 
	{
		delete this.findModeSelectorBox;
		return this. findModeSelectorBox = document.getElementById('find-migemo-mode-box');
	},
 
	get findModeSelector() 
	{
		delete this.findModeSelector;
		return this.findModeSelector = document.getElementById('find-mode-selector');
	},
   
/* status */ 

	_findMode : new WeakMap(),
	get findMode()
	{
		return this._findMode.get(this.findBar);
	},
	set findMode(aValue)
	{
		this._findMode.set(this.findBar, aValue);
		return aValue;
	},

	_lastFindMode : new WeakMap(),
	get lastFindMode()
	{
		return this._lastFindMode.get(this.findBar);
	},
	set lastFindMode(aValue)
	{
		this._lastFindMode.set(this.findBar, aValue);
		return aValue;
	},

	_delayedHandleFindModeReport : new WeakMap(),
	get delayedHandleFindModeReport()
	{
		return this._delayedHandleFindModeReport.get(this.findBar);
	},
	set delayedHandleFindModeReport(aValue)
	{
		this._delayedHandleFindModeReport.set(this.findBar, aValue);
		return aValue;
	},
 
/* utilities */ 

	startInTemporaryMode : function(aFindMode, aFindBarMode)
	{
		this.readyToStartTemporaryFindMode = aFindMode;
		this.findBar.startFind(aFindBarMode);
	},
  
/* preferences observer */ 
	
	domain  : 'xulmigemo', 
 
	preferences : 
		'xulmigemo.shortcut.startInTemporaryMode\n' +
		'xulmigemo.shortcut.goDicManager\n' +
		'xulmigemo.shortcut.modeCirculation\n' +
		'xulmigemo.autostart.regExpFind\n' +
		'xulmigemo.disableIME.migemo',
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
			case 'xulmigemo.shortcut.startInTemporaryMode':
				let prefix = 'xmigemo-shortcut-startInTemporaryMode-';
				Array.forEach(document.querySelectorAll('[id^="' + prefix + '"]'), function(aNode) {
					aNode.parentNode.removeChild(aNode);
				});
				JSON.parse(value).forEach(function(aDefinition, aIndex) {
					XMigemoService.updateKey(
						prefix + aIndex,
						XMigemoService.parseShortcut(aDefinition.shortcut),
						'XMigemoUI.startInTemporaryMode(XMigemoUI.' +
							aDefinition.mode +
							', XMigemoUI.' +
							aDefinition.findbarMode +
							');',
						document
					);
				});
				return;

			case 'xulmigemo.shortcut.goDicManager':
				XMigemoService.updateKey(
					'xmigemo-shortcut-goDicManager',
					XMigemoService.parseShortcut(value),
					'XMigemoService.goDicManager(window)',
					document
				);
				return;

			case 'xulmigemo.shortcut.modeCirculation':
				this.modeCirculation = value;
				return;

			case 'xulmigemo.disableIME.migemo':
				if (value)
					document.documentElement.setAttribute(this.IMEAttribute, 'FIND_MODE_MIGEMO');
				else
					document.documentElement.removeAttribute(this.IMEAttribute);
				return;

			case 'xulmigemo.autostart.regExpFind':
				this.autoStartRegExp = value;
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

			case 'TabSelect':
				this.onTabSelect();
				return;

			case 'input':
				this.onInput(aEvent);
				return;

			case 'DOMContentLoaded':
				this.overrideExtensionsPreInit();
				window.removeEventListener('DOMContentLoaded', this, false);
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
 
	setFindMode : function(aMode) 
	{
		var name = MigemoConstants.FIND_MODE_FLAG_FROM_NAME[aMode];
		this.findModeSelector.value = name;
		this.findBar.setAttribute(this.kFIND_MODE, name);
		this.finder.__xm__setFindMode({
			context       : this.currentFindContext,
			temporaryMode : aMode
		});
		this.handleFindModeReportWithDelay();
	},

	getFindModeParams : function()
	{
		var suffix = this.isQuickFind ? '.quick' : '' ;
		var params = {
			context       : this.currentFindContext,
			nextMode      : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.always'),
			defaultMode   : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.default'),
			temporaryMode : this.readyToStartTemporaryFindMode
		};

		var mode = params.temporaryMode || params.nextMode;
		if (mode === MigemoConstants.FIND_MODE_KEEP)
			mode = params.defaultMode;
		var name = MigemoConstants.FIND_MODE_FLAG_FROM_NAME[mode];
		params.mode = mode;
		params.modeName = name;

		return params;
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

	onStartFind : function()
	{
		if (!this.readyToStartTemporaryFindMode &&
			this.isFocused) {
			let mode = this.getModeCirculationNext(this.findMode);
			if (mode === this.CIRCULATE_MODE_EXIT)
				this.close();
			else
				this.setFindMode(mode);
			return true;
		}
		var params = this.getFindModeParams();
		this.findModeSelector.value = params.modeName;
		this.findBar.setAttribute(this.kFIND_MODE, params.modeName);
		this.findMode = params.mode;
		this.finder.__xm__setFindMode(params);
		this.handleFindModeReportWithDelay();
		return false;
	},

	handleFindModeReportWithDelay : function()
	{
		if (this.delayedHandleFindModeReport)
			clearTimeout(this.delayedHandleFindModeReport);

		this.delayedHandleFindModeReport = setTimeout((function() {	
			this.delayedHandleFindModeReport = null;
			var report = this.finder.__xm__lastFindModeReport;
			if (report)
				this.handleFindModeReport(report);
		}).bind(this), 10);
	},

	handleFindModeReport : function(aReport)
	{
		console.log('Find Mode = '+this.findMode+'=>'+aReport.mode);

		var previousMode = this.findMode;

		this.findMode = aReport.mode;

		var findModeName = MigemoConstants.FIND_MODE_FLAG_FROM_NAME[this.findMode];
		this.findModeSelector.value = findModeName;
		this.findBar.setAttribute(this.kFIND_MODE, findModeName);

		var modeChanged = this.findMode != previousMode;
		if (modeChanged && this.findBar.getElement('highlight').checked)
			this.findBar._setHighlightTimeout();
	},

	onFindFinish : function()
	{
		this.findModeSelectorBox.hidden = true;
		this.lastFindMode = null;
		this.findBar.removeAttribute(this.kFIND_MODE);
	},
  
	onFindBarOpen : function(aEvent) 
	{
		var params = this.getFindModeParams();
		if (params.mode !== this.findMode) {
			// started withtout gFindBar.startFind()
			// (for example, starting of Find As You Type by gFindBar._onBrowserKeypress())
			this.findModeSelector.value = params.modeName;
			this.findBar.setAttribute(this.kFIND_MODE, params.modeName);
			this.finder.__xm__setFindMode(params);
			this.handleFindModeReportWithDelay();
		}
		// otherwise, the find mode is already initialized by onStartFind().

		this.readyToStartTemporaryFindMode = null;

		this.findModeSelectorBox.hidden =
			this.findMigemoBar.collapsed = false;
		this.updateModeSelectorPosition();
	},

	onTabSelect : function()
	{
		this.updateFindBar();
		this.findModeSelectorBox.hidden = this.findBar.hidden;
	},

	onInput : function(aEvent)
	{
		if (!this.isInFindBar(aEvent.originalTarget) ||
			!this.autoStartRegExp)
			return;

		if (MigemoTextUtils.isRegExp(this.field.value)) {
			if (!this.lastFindMode)
				this.lastFindMode = this.findMode;
			this.setFindMode(MigemoConstants.FIND_MODE_REGEXP);
		}
		else {
			if (this.lastFindMode)
				this.setFindMode(this.lastFindMode);
			this.lastFindMode = null;
		}
	},

	isInFindBar : function(aNode)
	{
		var node = aNode;
		if (!aNode)
			return false;
		var field = this.field;
		while (node)
		{
			if (node == field)
				return true;
			node = node.parentNode;
		}
		return false;
	},

/* UI */ 
 
	updateFindBar : function()
	{
		if (!this.findBar.__xm__startFind) {
			this.findBar.__xm__startFind = this.findBar.startFind;
			this.findBar.startFind = function(...aArgs) {
				if (XMigemoUI.onStartFind())
					return;
				return this.__xm__startFind(...aArgs);
			};
		}

		if (!this.findBar.__xm__close) {
			this.findBar.__xm__close = this.findBar.close;
			this.findBar.close = function(...aArgs) {
				XMigemoUI.onFindFinish();
				return this.__xm__close(...aArgs);
			};
		}
	},

	updateModeSelectorPosition : function(aForceUpdate) 
	{
		var box = this.findModeSelectorBox;
		var findBarBox = this.findBar.boxObject;
		var closeboxBox = this.findBarClosebox.boxObject;
		var findBarRightEdge = findBarBox.screenX + findBarBox.width;

		var findBarParentBox = this.findBar.parentNode.boxObject;
		var findBarBottomEdge = findBarParentBox.screenY + findBarParentBox.height;

		var rootBox = document.documentElement.boxObject;
		var windowBottomEdge = rootBox.screenY + rootBox.height;

		var positionRightEdge = Math.min(findBarRightEdge, closeboxBox.screenX);

		var style = box.style;
		style.height = findBarBox.height+'px';
		style.right = (findBarRightEdge - positionRightEdge + 5)+'px';
		style.paddingTop = Math.floor((findBarBox.height - this.findModeSelector.boxObject.height) / 2)+'px';
		style.bottom = (windowBottomEdge - findBarBottomEdge)+'px';
	},
  
	init : function() 
	{
		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		window.messageManager.loadFrameScript(MigemoConstants.SCRIPT_URL, true);

		this.onMessage = this.onMessage.bind(this);
		window.messageManager.addMessageListener(MigemoConstants.MESSAGE_TYPE, this.onMessage);

		window.addEventListener('findbaropen', this, true);
		window.addEventListener('TabSelect', this, false);
		this.findBarsContainer.addEventListener('input', this, true);

		this.upgradePrefs();

		this.overrideExtensionsOnInitBefore(); // hacks.js

		XMigemoService.addPrefListener(this);
		XMigemoService.firstListenPrefChange(this);

		window.setTimeout(function(aSelf) {
			let { MigemoDicManager } = Components.utils.import('resource://xulmigemo-modules/core/dicManager.js', {});
			if (!MigemoDicManager.available &&
				XMigemoService.getPref('xulmigemo.dictionary.useInitializeWizard'))
				MigemoDicManager.showInitializeWizard(null);
		}, 0, this);

		this.overrideExtensionsOnInitAfter(); // hacks.js

		this.updateFindBar();
	},
  
	destroy : function() 
	{
		XMigemoService.removePrefListener(this);

		window.messageManager.removeMessageListener(MigemoConstants.MESSAGE_TYPE, this.onMessage);
		window.messageManager.broadcastAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
			command : 'shutdown'
		});
		window.messageManager.removeDelayedFrameScript(MigemoConstants.SCRIPT_URL);

		window.removeEventListener('findbaropen', this, true);
		window.removeEventListener('TabSelect', this, false);
		this.findBarsContainer.removeEventListener('input', this, true);

		window.removeEventListener('unload', this, false);
	},

	onMessage : function(aMessage)
	{
		switch (aMessage.json.command)
		{
			case MigemoConstants.COMMAND_REPORT_FIND_MODE:
				this.handleFindModeReport(aMessage.json);
				return;
		}
	},
 
	dummy : null
}); 
  
window.addEventListener('load', XMigemoUI, false); 
window.removeEventListener('DOMContentLoaded', XMigemoUI, false);

})();
