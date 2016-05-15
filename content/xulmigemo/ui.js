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
	
	get findBar() 
	{
		return window.gFindBar;
	},

	get findBarClosebox()
	{
		return document.getAnonymousElementByAttribute(this.findBar, 'anonid', 'find-closebutton');
	},

	get isQuickFind()
	{
		var findbar = this.findBar;
		var findbarMode = findbar.findMode;
		return findbarMode == findbar.FIND_TYPEAHEAD || findbarMode == findbar.FIND_LINKS;
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

	findMode : MigemoConstants.FIND_MODE_NATIVE,

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
		var field = this.findBar._findField;
		field.inputField.setAttribute(this.IMEAttribute, true);
		window.setTimeout((function() {
			field.inputField.removeAttribute(this.IMEAttribute);
		}).bind(this), 100);
	},
 
	disableFindFieldIMEForCurrentMode : function() 
	{
		if (this.isQuickFind ?
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
		'xulmigemo.shortcut.startInTemporaryMode\n' +
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

			case 'TabSelect':
				this.onTabSelect();
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
		this.disableFindFieldIMEForCurrentMode();
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
		var suffix = this.isQuickFind ? '.quick' : '' ;

		var temporaryMode = this.readyToStartTemporaryFindMode;
		this.readyToStartTemporaryFindMode = null;

		var context = this.isQuickFind ?
						MigemoConstants.FIND_CONTEXT_QUICK :
						MigemoConstants.FIND_CONTEXT_NORMAL;
		this.sendMessageToContent(MigemoConstants.COMMAND_SET_FIND_MODE, {
			context     : context,
			nextMode    : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.always'),
			defaultMode : XMigemoService.getPref('xulmigemo.findMode' + suffix + '.default'),
			temporaryMode : temporaryMode
		});

		this.findModeSelectorBox.hidden =
			this.findMigemoBar.collapsed = false;
		this.updateModeSelectorPosition();

		if (!this.findBar.__xm__close) {
			this.findBar.__xm__close = this.findBar.close;
			this.findBar.close = function(...aArgs) {
				this.__xm__close(...aArgs);
				XMigemoUI.findModeSelectorBox.hidden = true;
			};
		}
	},

	onTabSelect : function()
	{
		XMigemoUI.findModeSelectorBox.hidden = this.findBar.hidden;
	},

/* UI */ 
 
	updateModeSelectorPosition : function(aForceUpdate) 
	{
		var box = this.findModeSelectorBox;
		var findBarBox = this.findBar.boxObject;
		var closeboxBox = this.findBarClosebox.boxObject;
		var findBarRightEdge = findBarBox.screenX + findBarBox.width;
		var positionRightEdge = Math.min(findBarRightEdge, closeboxBox.screenX);

		var style = box.style;
		style.height = findBarBox.height+'px';
		style.right = (findBarRightEdge - positionRightEdge + 5)+'px';
		style.paddingTop = Math.floor((findBarBox.height - this.findModeSelector.boxObject.height) / 2)+'px';
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
		window.removeEventListener('TabSelect', this, false);

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
				this.findMode = aMessage.json.mode;
				this.findModeSelector.value = MigemoConstants.FIND_MODE_FLAG_FROM_NAME[this.findMode];
				this.disableFindFieldIMEForCurrentMode();
				return;
		}
	},
 
	dummy : null
}); 
  
window.addEventListener('load', XMigemoUI, false); 
window.removeEventListener('DOMContentLoaded', XMigemoUI, false);

})();
