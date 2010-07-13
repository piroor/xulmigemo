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
			var WindowWatcher = Cc['@mozilla.org/embedcomp/window-watcher;1']
				.getService(Ci.nsIWindowWatcher);
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
			Cc['@piro.sakura.ne.jp/xmigemo/dictionary-manager;1']
				.getService(Ci.xmIXMigemoDicManager)
				.init(null, null);
		}
	},
 
	updateGlobalStyleSheets : function() 
	{
		var sheets = [
				'chrome://xulmigemo/content/focus.css',
				'chrome://xulmigemo/content/highlight/highlight.css',
				'chrome://xulmigemo/content/marker/marker.css'
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
		delete this.ObserverService;
		return this.ObserverService = Cc['@mozilla.org/observer-service;1'].getService(Ci.nsIObserverService);
	},
	get IOService() 
	{
		delete this.IOService;
		return this.IOService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
	},
	get Prefs() 
	{
		delete this.Prefs;
		return this.Prefs = Cc['@mozilla.org/preferences;1'].getService(Ci.nsIPrefBranch);
	},
	get SSS() 
	{
		delete this.SSS;
		return this.SSS = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
	}
  
}; 
  
if (XPCOMUtils.generateNSGetFactory) 
	var NSGetFactory = XPCOMUtils.generateNSGetFactory([XMigemoStartupService]);
else
	var NSGetModule = XPCOMUtils.generateNSGetModule([XMigemoStartupService]);
 
