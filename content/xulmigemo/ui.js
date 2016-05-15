Components.utils.import('resource://xulmigemo-modules/service.jsm'); 
Components.utils.import('resource://xulmigemo-modules/api.jsm'); 

(function() {
	var { MigemoConstants } = Components.utils.import('resource://xulmigemo-modules/constants.jsm', {});
	var { inherit } = Components.utils.import('resource://xulmigemo-modules/lib/inherit.jsm', {});
 
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

	kDISABLE_IME    : '_moz-xmigemo-disable-ime',
	kINACTIVATE_IME    : '_moz-xmigemo-inactivate-ime',
	get IMEAttribute()
	{
		return XMigemoService.isLinux ? this.kDISABLE_IME : this.kINACTIVATE_IME ;
	},
  
/* internal status */ 
	
	forcedFindMode   : -1,
	lastFindMode     : -1,
	backupFindMode   : -1,

	isModeChanged : false,
	
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
  
/* elements */ 
	
	get browser() 
	{
		return document.getElementById('content') || // Firefox
			document.getElementById('messagepane'); // Thunderbird
	},
  
	get findBar() 
	{
		return window.gFindBar;
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
  
	fireFindToolbarUpdateRequestEvent : function(aTarget) 
	{
		var event = document.createEvent('UIEvents');
		event.initUIEvent('XMigemoFindBarUpdateRequest', true, true, window, 0);
		(aTarget || document).dispatchEvent(event);
	},

	startInTemporaryMode : function(aFindMode, aFindBarMode)
	{
		this.readyToStartTemporaryFindMode = aFindMode;
		this.findBar.startFind(aFindBarMode);
	},
  
/* preferences observer */ 
	
	domain  : 'xulmigemo', 
 
	preferences : 
		'xulmigemo.shortcut.manualStart\n' +
		'xulmigemo.shortcut.manualStart2\n' +
		'xulmigemo.shortcut.manualStartLinksOnly\n' +
		'xulmigemo.shortcut.manualStartLinksOnly2\n' +
		'xulmigemo.shortcut.goDicManager\n' +
		'xulmigemo.shortcut.modeCirculation\n' +
		'xulmigemo.disableIME.quickFindFor\n' +
		'xulmigemo.disableIME.normalFindFor',
 
	observe : function(aSubject, aTopic, aPrefName) 
	{
		if (aTopic != 'nsPref:changed') return;

		var value = XMigemoService.getPref(aPrefName);
		switch (aPrefName)
		{
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

			case 'xulmigemo.shortcut.goDicManager':
				this.goDicManagerKey = XMigemoService.parseShortcut(value);
				XMigemoService.updateKey('xmigemo-shortcut-goDicManager', this.goDicManagerKey, document);
				return;

			case 'xulmigemo.shortcut.modeCirculation':
				this.modeCirculation = value;
				return;

			case 'xulmigemo.disableIME.quickFindFor':
				this.disableIMEOnQuickFindFor = value;
				return;

			case 'xulmigemo.disableIME.normalFindFor':
				this.disableIMEOnNormalFindFor = value;
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

			case 'resize':
			case 'TreeStyleTabAutoHideStateChange':
			case 'XMigemoFindBarUpdateRequest':
				if (this.updatingFindBar) return;
				this.updatingFindBar = true;
				window.setTimeout(function(aSelf) {
					aSelf.updatingFindBar = false;
				}, 100, this);
				return;

			default:
		}
	},
 
	onChangeMode : function() 
	{
		this.clearTimer();
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
		var findbar = aEvent.originalTarget;
		var findbarMode = findbar.findMode;
		var isQuickFind = findbarMode == findbar.FIND_TYPEAHEAD || findbarMode == findbar.FIND_LINKS;
		var suffix = isQuickFind ? '.quick' : '' ;

		var temporaryMode = this.readyToStartTemporaryFindMode;
		this.readyToStartTemporaryFindMode = null;

		var context = isQuickFind ?
						MigemoConstants.FIND_CONTEXT_QUICK :
						MigemoConstants.FIND_CONTEXT_NORMAL;
		this.sendMessageToContent(MigemoConstants.COMMAND_SET_FIND_MODE, {
			context     : context,
			nextMode    : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.always'),
			defaultMode : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.default'),
			temporaryMode : temporaryMode
		});
	},

/* UI */ 
 
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
  
	init : function() 
	{
		window.removeEventListener('load', this, false);
		window.addEventListener('unload', this, false);

		window.messageManager.loadFrameScript(MigemoConstants.SCRIPT_URL, true);

		this.onMessage = this.onMessage.bind(this);
		window.messageManager.addMessageListener(MigemoConstants.MESSAGE_TYPE, this.onMessage);

		window.addEventListener('findbaropen', this, true);

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

		window.removeEventListener('unload', this, false);
	},

	sendMessageToContent : function(aCommandType, aCommandParams)
	{
		var messageManager = gBrowser.selectedTab.linkedBrowser.messageManager;
		messageManager.sendAsyncMessage(MigemoConstants.MESSAGE_TYPE, {
			command : aCommandType,
			params  : aCommandParams || {}
		});
	},

	onMessage : function(aMessage)
	{
		switch (aMessage.json.command)
		{
			case MigemoConstants.COMMAND_REPORT_FIND_MODE:
				console.log('Find Mode = '+aMessage.json.mode);
				// this.findMode = aMessage.json.mode;
				return;
		}
	},
 
	dummy : null
}); 
  
window.addEventListener('load', XMigemoUI, false); 
window.removeEventListener('DOMContentLoaded', XMigemoUI, false);

})();
