const Cc = Components.classes; 
const Ci = Components.interfaces;

Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');
 
function XMigemoStartupService() { 
}
XMigemoStartupService.prototype = {
	initialized : false,

	classDescription : 'XMigemoStartupService',
	contractID : '@piro.sakura.ne.jp/xmigemo/startup;1',
	classID : Components.ID('{28a475d0-1c24-11dd-bd0b-0800200c9a66}'),

	_xpcom_categories : [
		{ category : 'app-startup', service : true }
	],

	QueryInterface : XPCOMUtils.generateQI([Ci.nsIObserver]),
	
	observe : function(aSubject, aTopic, aData) 
	{
		switch (aTopic)
		{
			case 'app-startup':
				if (!this.initialized) {
					this.ObserverService.addObserver(this, 'profile-after-change', false);
					this.initialized = true;
				}
				return;

			case 'profile-after-change':
				this.ObserverService.addObserver(this, 'final-ui-startup', false);
				if (this.initialized) {
					this.ObserverService.removeObserver(this, 'profile-after-change');
					this.initialized = false;
				}
				this.init();
				return;

			case 'final-ui-startup':
				this.ObserverService.removeObserver(this, 'final-ui-startup');
				this.postInit();
				return;
		}
	},
 
	init : function() 
	{
		this.updateGlobalStyleSheets();

		if (this.Prefs.getCharPref('xulmigemo.lang') == '') {
			this.WindowWatcher.openWindow(
				null,
				'chrome://xulmigemo/content/initializer/langchooser.xul',
				'xulmigemo:langchooser',
				'chrome,dialog,modal,centerscreen,dependent',
				null
			);
		}
	},
 
	postInit : function() 
	{
		this.ObserverService.notifyObservers(null, 'XMigemo:initialized', null);

		if (this.Prefs.getCharPref('xulmigemo.lang')) {
			let { MigemoDicManager } = Components.utils.import('resource://xulmigemo-modules/core/dicManager.js', {});
			MigemoDicManager.init(null, null);
		}
	},
 
	updateGlobalStyleSheets : function() 
	{
		var sheets = [
				'chrome://xulmigemo/content/focus.css'
			];
		sheets.forEach(function(aSheet) {
			var sheet = this.IOService.newURI(aSheet, null, null);
			if (!this.SSS.sheetRegistered(sheet, this.SSS.AGENT_SHEET)) {
				this.SSS.loadAndRegisterSheet(sheet, this.SSS.AGENT_SHEET);
			}
		}, this);
	},
	
	get ObserverService() 
	{
		if (this._ObserverService === void(0))
			this._ObserverService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
		return this._ObserverService;
	},
	get IOService()
	{
		if (this._IOService === void(0))
			this._IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
		return this._IOService;
	},
	get Prefs()
	{
		if (this._Prefs === void(0))
			this._Prefs = Cc['@mozilla.org/preferences;1'].getService(Ci.nsIPrefBranch);
		return this._Prefs;
	},
	get WindowWatcher()
	{
		if (this._WindowWatcher === void(0))
			this._WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1'].getService(Ci.nsIWindowWatcher);
		return this._WindowWatcher;
	},
	get SSS()
	{
		if (this._SSS === void(0))
			this._SSS = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
		return this._SSS;
	}
  
}; 
  
var NSGetFactory = XPCOMUtils.generateNSGetFactory([XMigemoStartupService]); 
 
